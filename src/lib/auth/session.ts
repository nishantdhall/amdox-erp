import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { SESSION_COOKIE, signSession, verifySession, sessionTtlSeconds, type SessionPayload } from './tokens'
import { findUserByEmail, getTenant, listTenants, recordLogin } from '../db/repo'
import { appendAudit, type AuditContext } from '../db/store'
import { hashPassword } from '../db/seed'
import { timingSafeEqual } from '../hash'
import type { SessionUser } from '../types'

/**
 * Server-side session handling. Everything here runs in the Node runtime
 * (server components, route handlers, server actions) — Edge middleware uses
 * the pure helpers in `tokens.ts` instead.
 */

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies()
  return verifySession(store.get(SESSION_COOKIE)?.value)
}

/** Session or redirect to the login screen. Use in protected server components. */
export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession()
  if (!session) redirect('/login')
  return session
}

export async function setSessionCookie(user: SessionUser): Promise<void> {
  const store = await cookies()
  store.set(SESSION_COOKIE, signSession(user), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: sessionTtlSeconds(),
  })
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies()
  store.delete(SESSION_COOKIE)
}

export async function clientIp(): Promise<string> {
  const list = await headers()
  return (
    list.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    list.get('x-real-ip') ||
    '0.0.0.0'
  )
}

export async function auditContext(session: SessionPayload): Promise<AuditContext> {
  return {
    tenantId: session.tenantId,
    actorId: session.id,
    actorName: session.name,
    ip: await clientIp(),
  }
}

/* ---------------------------------------------------------------- sign-in */

export type LoginResult =
  | { ok: true; user: SessionUser; mfaRequired: boolean }
  | { ok: false; error: string }

/**
 * Verify credentials against the user store.
 *
 * The digest comparison is constant-time, and a missing user still runs a
 * comparison so response timing does not reveal whether an address exists.
 */
export async function authenticate(email: string, password: string, ip = '0.0.0.0'): Promise<LoginResult> {
  const normalised = email.trim().toLowerCase()
  const user = findUserByEmail(normalised)
  const candidate = hashPassword(normalised, password)
  const target = user?.passwordHash ?? hashPassword('__nobody__', '__nobody__')

  if (!user || !timingSafeEqual(candidate, target)) {
    return { ok: false, error: 'Incorrect email or password.' }
  }

  const tenant = getTenant(user.tenantId)
  const sessionUser: SessionUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    tenantId: tenant.id,
    tenantName: tenant.name,
    employeeId: user.employeeId ?? null,
    mfaVerified: false,
  }

  recordLogin(user.id)
  appendAudit(
    { tenantId: tenant.id, actorId: user.id, actorName: user.name, ip },
    'auth.login',
    'User',
    user.id,
    `Password authentication succeeded for ${user.email}`,
  )

  return { ok: true, user: sessionUser, mfaRequired: tenant.mfaRequired && user.mfaEnabled }
}

/**
 * Tenants the signed-in user may switch between. Only a SuperAdmin sees more
 * than their own — everyone else is pinned to their home tenant.
 */
export function switchableTenants(session: SessionPayload) {
  if (session.role !== 'SuperAdmin') return [getTenant(session.tenantId)]
  return listTenants()
}

export { SESSION_COOKIE, signSession, verifySession }
export type { SessionPayload }
