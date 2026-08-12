import { apiRoute, ok } from '@/lib/api/handler'
import { clearSessionCookie } from '@/lib/auth/session'
import { ROLE_PERMISSIONS } from '@/lib/auth/rbac'
import { getTenant } from '@/lib/db/repo'

export const GET = apiRoute({}, async ({ session }) => ({
  user: {
    id: session.id,
    email: session.email,
    name: session.name,
    role: session.role,
    mfaVerified: session.mfaVerified,
  },
  tenant: getTenant(session.tenantId),
  permissions: ROLE_PERMISSIONS[session.role],
  expiresAt: new Date(session.exp * 1000).toISOString(),
}))

export const DELETE = apiRoute({}, async () => {
  await clearSessionCookie()
  return ok({ signedOut: true })
})
