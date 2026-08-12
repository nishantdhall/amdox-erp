'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { signInAction, verifyMfaAction, type LoginState } from './actions'
import { cn } from '@/lib/utils'

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-1 flex w-full items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-600 focus-visible:ring-2 focus-visible:ring-brand-500/60 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? (
        <>
          <span aria-hidden className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          {pendingLabel}
        </>
      ) : (
        label
      )}
    </button>
  )
}

function ErrorNote({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p role="alert" className="rounded-lg border border-danger/20 bg-danger-soft px-3 py-2 text-xs font-medium text-danger">
      {message}
    </p>
  )
}

export function CredentialsForm({ next, demoAccounts }: { next: string; demoAccounts: readonly { email: string; role: string; label: string }[] }) {
  const [state, action] = useActionState<LoginState, FormData>(signInAction, {})
  const [email, setEmail] = useState('admin@amdox.in')
  const [password, setPassword] = useState('Amdox@2026')

  return (
    <div className="space-y-5">
      <form action={action} className="space-y-4">
        <input type="hidden" name="next" value={next} />

        <div>
          <label className="label" htmlFor="email">
            Work email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
            placeholder="you@amdox.in"
          />
        </div>

        <div>
          <label className="label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
            placeholder="••••••••"
          />
        </div>

        <ErrorNote message={state.error} />
        <SubmitButton label="Sign in" pendingLabel="Signing in…" />
      </form>

      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">Demo accounts — password Amdox@2026</p>
        <ul className="grid gap-1.5">
          {demoAccounts.map((account) => (
            <li key={account.email}>
              <button
                type="button"
                onClick={() => {
                  setEmail(account.email)
                  setPassword('Amdox@2026')
                }}
                className={cn(
                  'flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left transition-colors',
                  email === account.email ? 'border-brand-500 bg-brand-50' : 'border-ink-line bg-white hover:bg-surface-sunken',
                )}
              >
                <span className="min-w-0">
                  <span className="block truncate text-xs font-semibold text-ink">{account.email}</span>
                  <span className="block truncate text-[11px] text-ink-muted">{account.label}</span>
                </span>
                <span className="shrink-0 rounded-full bg-ink/5 px-2 py-0.5 text-[10px] font-semibold text-ink">{account.role}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export function MfaForm({ hintCode, userName }: { hintCode: string; userName: string }) {
  const [state, action] = useActionState<LoginState, FormData>(verifyMfaAction, {})

  return (
    <form action={action} className="space-y-4">
      <p className="text-sm text-ink-muted">
        Hi {userName} — your tenant enforces multi-factor authentication. Enter the 6-digit code from your authenticator app.
      </p>

      <div>
        <label className="label" htmlFor="code">
          Authentication code
        </label>
        <input
          id="code"
          name="code"
          inputMode="numeric"
          pattern="\d{6}"
          maxLength={6}
          required
          autoFocus
          autoComplete="one-time-code"
          className="input tnum text-center text-lg tracking-[0.5em]"
          placeholder="000000"
          defaultValue={hintCode}
        />
      </div>

      <p className="rounded-lg border border-brand-500/20 bg-brand-50 px-3 py-2 text-[11px] text-brand-700">
        <strong className="font-semibold">Demo environment:</strong> the code for this account is{' '}
        <span className="tnum font-bold">{hintCode}</span>. A production deployment issues this over TOTP instead.
      </p>

      <ErrorNote message={state.error} />
      <SubmitButton label="Verify and continue" pendingLabel="Verifying…" />
    </form>
  )
}
