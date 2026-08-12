import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { getSession, auditContext, type SessionPayload } from '../auth/session'
import { assertCan, ForbiddenError, type Permission } from '../auth/rbac'
import { ConflictError, NotFoundError } from '../db/repo'
import { UnbalancedEntryError } from '../domain/ledger'
import { CyclicDependencyError } from '../domain/projects'
import type { AuditContext } from '../db/store'

/**
 * Shared plumbing for `/api/v1/*`: authentication, permission checks, sliding
 * window rate limiting, request validation and a single error envelope.
 */

export const API_VERSION = 'v1'

export interface ApiErrorBody {
  error: { code: string; message: string; details?: unknown }
}

export function ok<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json(data as object, { status: 200, ...init })
}

export function created<T>(data: T): NextResponse {
  return NextResponse.json(data as object, { status: 201 })
}

export function fail(status: number, code: string, message: string, details?: unknown): NextResponse<ApiErrorBody> {
  return NextResponse.json({ error: { code, message, details } }, { status })
}

/* ------------------------------------------------------------ rate limiting */

interface Window {
  count: number
  resetAt: number
}

const BUCKETS = new Map<string, Window>()

function limits() {
  const max = Number(process.env.RATE_LIMIT_MAX)
  const windowSeconds = Number(process.env.RATE_LIMIT_WINDOW_SECONDS)
  return {
    max: Number.isFinite(max) && max > 0 ? max : 240,
    windowMs: (Number.isFinite(windowSeconds) && windowSeconds > 0 ? windowSeconds : 60) * 1000,
  }
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
  limit: number
}

/**
 * Fixed-window counter keyed by client IP.
 *
 * A Redis sorted set would back this in a multi-region deployment; the shape of
 * the check and the headers it emits are identical either way.
 */
export function checkRateLimit(key: string): RateLimitResult {
  const { max, windowMs } = limits()
  const now = Date.now()
  const existing = BUCKETS.get(key)

  if (!existing || existing.resetAt <= now) {
    const fresh: Window = { count: 1, resetAt: now + windowMs }
    BUCKETS.set(key, fresh)
    // Opportunistic sweep so the map cannot grow without bound.
    if (BUCKETS.size > 5_000) {
      for (const [k, v] of BUCKETS) if (v.resetAt <= now) BUCKETS.delete(k)
    }
    return { allowed: true, remaining: max - 1, resetAt: fresh.resetAt, limit: max }
  }

  existing.count++
  return {
    allowed: existing.count <= max,
    remaining: Math.max(0, max - existing.count),
    resetAt: existing.resetAt,
    limit: max,
  }
}

function ipOf(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || '0.0.0.0'
}

/* ----------------------------------------------------------- error mapping */

/** Raised when a request body is not parseable JSON — a client error, not a server one. */
export class MalformedBodyError extends Error {
  constructor() {
    super('Request body is not valid JSON.')
    this.name = 'MalformedBodyError'
  }
}

export function toErrorResponse(error: unknown): NextResponse<ApiErrorBody> {
  if (error instanceof MalformedBodyError) {
    return fail(400, 'malformed_body', error.message)
  }
  if (error instanceof z.ZodError) {
    return fail(422, 'validation_failed', 'Request body failed validation.', error.issues)
  }
  if (error instanceof ForbiddenError) {
    return fail(403, 'forbidden', error.message)
  }
  if (error instanceof NotFoundError) {
    return fail(404, 'not_found', error.message)
  }
  if (error instanceof ConflictError) {
    return fail(409, 'conflict', error.message)
  }
  if (error instanceof UnbalancedEntryError) {
    return fail(422, 'unbalanced_entry', error.message, { debit: error.debit, credit: error.credit })
  }
  if (error instanceof CyclicDependencyError) {
    return fail(422, 'cyclic_dependency', error.message, { cycle: error.cycle })
  }

  console.error('[api] unhandled error', error)
  return fail(500, 'internal_error', 'An unexpected error occurred.')
}

/* -------------------------------------------------------------- the wrapper */

export interface RouteContext<P = Record<string, string>> {
  req: NextRequest
  session: SessionPayload
  audit: AuditContext
  params: P
  /** Parsed and validated JSON body. */
  body: <S extends z.ZodTypeAny>(schema: S) => Promise<z.infer<S>>
  query: URLSearchParams
}

export interface RouteOptions {
  permission?: Permission
  /** Skip the session requirement (health, OpenAPI, login). */
  public?: boolean
}

/**
 * Next generates a type check against the exported handler's second argument,
 * so this must stay structurally identical to `{ params: Promise<P> }` — a
 * route with no dynamic segments still receives an (empty) params promise.
 */
type NextRouteArgs<P> = { params: Promise<P> }

export function apiRoute<P extends Record<string, string> = Record<string, string>>(
  options: RouteOptions,
  handler: (ctx: RouteContext<P>) => Promise<NextResponse | unknown>,
) {
  return async (req: NextRequest, args: NextRouteArgs<P>): Promise<NextResponse> => {
    const rate = checkRateLimit(`${ipOf(req)}:${new URL(req.url).pathname}`)
    const rateHeaders = {
      'X-RateLimit-Limit': String(rate.limit),
      'X-RateLimit-Remaining': String(rate.remaining),
      'X-RateLimit-Reset': String(Math.ceil(rate.resetAt / 1000)),
    }

    if (!rate.allowed) {
      const response = fail(429, 'rate_limited', 'Too many requests. Please retry shortly.')
      for (const [k, v] of Object.entries(rateHeaders)) response.headers.set(k, v)
      response.headers.set('Retry-After', String(Math.max(1, Math.ceil((rate.resetAt - Date.now()) / 1000))))
      return response
    }

    try {
      let session: SessionPayload | null = null

      if (!options.public) {
        session = await getSession()
        if (!session) return fail(401, 'unauthenticated', 'A valid session is required.')
        if (options.permission) assertCan(session, options.permission)
      }

      const params = ((await args?.params) ?? {}) as P
      const ctx: RouteContext<P> = {
        req,
        session: session as SessionPayload,
        audit: session ? await auditContext(session) : { tenantId: '', actorId: null, actorName: 'anonymous' },
        params,
        query: new URL(req.url).searchParams,
        body: async (schema) => {
          let parsed: unknown
          try {
            parsed = await req.json()
          } catch {
            throw new MalformedBodyError()
          }
          return schema.parse(parsed)
        },
      }

      const result = await handler(ctx)
      const response = result instanceof NextResponse ? result : ok(result)
      for (const [k, v] of Object.entries(rateHeaders)) response.headers.set(k, v)
      response.headers.set('X-API-Version', API_VERSION)
      return response
    } catch (error) {
      const response = toErrorResponse(error)
      for (const [k, v] of Object.entries(rateHeaders)) response.headers.set(k, v)
      return response
    }
  }
}

/* --------------------------------------------------------------- pagination */

export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
})

export function paginate<T>(rows: T[], query: URLSearchParams) {
  const { limit, offset } = paginationSchema.parse({
    limit: query.get('limit') ?? undefined,
    offset: query.get('offset') ?? undefined,
  })
  return {
    data: rows.slice(offset, offset + limit),
    meta: { total: rows.length, limit, offset, hasMore: offset + limit < rows.length },
  }
}
