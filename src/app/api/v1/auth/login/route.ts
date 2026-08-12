import { z } from 'zod'
import { apiRoute, created, fail } from '@/lib/api/handler'
import { authenticate, setSessionCookie, clientIp } from '@/lib/auth/session'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const POST = apiRoute({ public: true }, async ({ body }) => {
  const input = await body(schema)
  const result = await authenticate(input.email, input.password, await clientIp())

  if (!result.ok) return fail(401, 'invalid_credentials', result.error)

  // MFA is modelled as a second factor the client confirms; the session is
  // issued already marked so downstream checks can distinguish the two states.
  await setSessionCookie({ ...result.user, mfaVerified: !result.mfaRequired })

  return created({
    user: result.user,
    mfaRequired: result.mfaRequired,
  })
})
