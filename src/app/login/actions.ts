'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { authenticate, clearSessionCookie, clientIp, getSession, setSessionCookie } from '@/lib/auth/session'
import { appendAudit } from '@/lib/db/store'
import { mfaCodeFor } from '@/lib/auth/mfa'

export interface LoginState {
  error?: string
  step?: 'credentials' | 'mfa'
  email?: string
}

const credentialsSchema = z.object({
  email: z.string().email('Enter a valid email address.'),
  password: z.string().min(1, 'Enter your password.'),
})

export async function signInAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = credentialsSchema.safeParse({
    email: String(formData.get('email') ?? ''),
    password: String(formData.get('password') ?? ''),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.', step: 'credentials' }
  }

  const result = await authenticate(parsed.data.email, parsed.data.password, await clientIp())
  if (!result.ok) {
    return { error: result.error, step: 'credentials', email: parsed.data.email }
  }

  await setSessionCookie({ ...result.user, mfaVerified: !result.mfaRequired })

  const next = String(formData.get('next') ?? '') || '/dashboard'
  if (result.mfaRequired) redirect('/login?step=mfa')
  redirect(next)
}

const mfaSchema = z.object({ code: z.string().regex(/^\d{6}$/, 'Enter the 6-digit code.') })

export async function verifyMfaAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const session = await getSession()
  if (!session) redirect('/login')

  const parsed = mfaSchema.safeParse({ code: String(formData.get('code') ?? '').trim() })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid code.', step: 'mfa' }
  }

  if (parsed.data.code !== mfaCodeFor(session.id)) {
    appendAudit(
      { tenantId: session.tenantId, actorId: session.id, actorName: session.name, ip: await clientIp() },
      'auth.mfa_failed',
      'User',
      session.id,
      'Second-factor verification failed',
    )
    return { error: 'That code is not valid. Please try again.', step: 'mfa' }
  }

  await setSessionCookie({ ...session, mfaVerified: true })
  appendAudit(
    { tenantId: session.tenantId, actorId: session.id, actorName: session.name, ip: await clientIp() },
    'auth.mfa_verified',
    'User',
    session.id,
    'Second factor verified',
  )

  redirect('/dashboard')
}

export async function signOutAction(): Promise<void> {
  const session = await getSession()
  if (session) {
    appendAudit(
      { tenantId: session.tenantId, actorId: session.id, actorName: session.name, ip: await clientIp() },
      'auth.logout',
      'User',
      session.id,
      'Session ended',
    )
  }
  await clearSessionCookie()
  redirect('/login')
}
