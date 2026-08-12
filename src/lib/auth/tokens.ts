import { base64UrlDecode, base64UrlEncode, hmacSha256Hex, timingSafeEqual } from '../hash'
import type { Role, SessionUser } from '../types'

/**
 * Stateless session tokens: `base64url(payload).hmacSHA256(payload)`.
 *
 * Deliberately dependency-free and synchronous so the exact same verification
 * code runs inside Edge middleware, server components and route handlers.
 */

export const SESSION_COOKIE = 'amdox_session'

export interface SessionPayload extends SessionUser {
  iat: number
  exp: number
}

function secret(): string {
  return process.env.AUTH_SECRET || 'amdox-erp-development-signing-key-2026'
}

export function sessionTtlSeconds(): number {
  const parsed = Number(process.env.SESSION_TTL_SECONDS)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 28_800 // 8 hours
}

export function signSession(user: SessionUser, ttlSeconds = sessionTtlSeconds()): string {
  const now = Math.floor(Date.now() / 1000)
  const payload: SessionPayload = { ...user, iat: now, exp: now + ttlSeconds }
  const encoded = base64UrlEncode(JSON.stringify(payload))
  return `${encoded}.${hmacSha256Hex(secret(), encoded)}`
}

/** Returns null for a malformed, tampered or expired token. */
export function verifySession(token: string | undefined | null): SessionPayload | null {
  if (!token) return null

  const separator = token.lastIndexOf('.')
  if (separator <= 0) return null

  const encoded = token.slice(0, separator)
  const signature = token.slice(separator + 1)
  if (!timingSafeEqual(signature, hmacSha256Hex(secret(), encoded))) return null

  try {
    const payload = JSON.parse(base64UrlDecode(encoded)) as SessionPayload
    if (typeof payload.exp !== 'number' || payload.exp * 1000 < Date.now()) return null
    if (!payload.id || !payload.tenantId || !payload.role) return null
    return payload
  } catch {
    return null
  }
}

/* ------------------------------------------------------------ route policy */

/** Route prefixes that require a minimum role. Longest prefix wins. */
const ROUTE_POLICY: { prefix: string; minRole: Role }[] = [
  { prefix: '/settings/tenant', minRole: 'TenantAdmin' },
  { prefix: '/audit', minRole: 'Manager' },
  { prefix: '/finance', minRole: 'Manager' },
  { prefix: '/hr/payroll', minRole: 'Manager' },
  { prefix: '/hr/employees', minRole: 'Employee' },
  { prefix: '/supply-chain', minRole: 'Employee' },
  { prefix: '/forecasting', minRole: 'Employee' },
  { prefix: '/projects', minRole: 'Employee' },
  { prefix: '/analytics', minRole: 'Viewer' },
  { prefix: '/dashboard', minRole: 'Viewer' },
]

export const ROLE_RANK: Record<Role, number> = {
  Viewer: 0,
  Employee: 1,
  Manager: 2,
  TenantAdmin: 3,
  SuperAdmin: 4,
}

export function requiredRoleFor(pathname: string): Role | null {
  const match = ROUTE_POLICY.filter((policy) => pathname.startsWith(policy.prefix)).sort(
    (a, b) => b.prefix.length - a.prefix.length,
  )[0]
  return match?.minRole ?? null
}

export function satisfiesRole(actual: Role, required: Role): boolean {
  return ROLE_RANK[actual] >= ROLE_RANK[required]
}
