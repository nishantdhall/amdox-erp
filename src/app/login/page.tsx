import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { mfaCodeFor } from '@/lib/auth/mfa'
import { DEMO_ACCOUNTS } from '@/lib/db/seed'
import { CredentialsForm, MfaForm } from './login-form'
import { Logo } from '@/components/layout/logo'

export const metadata: Metadata = { title: 'Sign in' }
export const dynamic = 'force-dynamic'

const HIGHLIGHTS = [
  { title: 'Double-entry ledger', body: 'Balanced postings, multi-currency and enforced period close.' },
  { title: 'Payroll in seconds', body: 'Gross-to-net with statutory slabs, payslips and a GL accrual.' },
  { title: 'Forecasting built in', body: 'Holt-Winters + additive ensemble, backtested every run.' },
  { title: 'Tamper-evident audit', body: 'SHA-256 hash chain over every mutation, verifiable on demand.' },
]

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; step?: string }>
}) {
  const params = await searchParams
  const session = await getSession()

  // Already fully authenticated — nothing to do here.
  if (session?.mfaVerified) redirect(params.next || '/dashboard')

  const showMfa = params.step === 'mfa' && session && !session.mfaVerified

  return (
    <main id="main" className="grid min-h-screen grid-cols-1 lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel */}
      <section className="relative hidden overflow-hidden bg-ink px-10 py-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.16]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 15%, #4f6ef7 0, transparent 42%), radial-gradient(circle at 85% 75%, #3b8fd6 0, transparent 46%)',
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        <div className="relative">
          <Logo variant="dark" />
          <p className="mt-8 max-w-md text-[26px] font-semibold leading-tight tracking-tight">
            One platform for finance, people, supply chain and forecasting.
          </p>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-white/60">
            AMX-ERP-2026-04 — a multi-tenant, AI-augmented ERP suite built for mid-market and enterprise
            organisations operating across geographies.
          </p>
        </div>

        <ul className="relative grid gap-3 sm:grid-cols-2">
          {HIGHLIGHTS.map((item) => (
            <li key={item.title} className="rounded-xl border border-white/10 bg-white/[0.06] p-3.5 backdrop-blur-sm">
              <p className="text-xs font-semibold text-white">{item.title}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-white/55">{item.body}</p>
            </li>
          ))}
        </ul>

        <div className="relative flex items-center gap-4 text-[11px] text-white/45">
          <span>SOC 2 aligned</span>
          <span aria-hidden>·</span>
          <span>GDPR ready</span>
          <span aria-hidden>·</span>
          <span>ISO 27001 architecture</span>
        </div>
      </section>

      {/* Form panel */}
      <section className="flex items-center justify-center bg-white px-5 py-10 sm:px-10">
        <div className="w-full max-w-sm">
          <div className="mb-7 lg:hidden">
            <Logo />
          </div>

          <h1 className="text-xl font-semibold tracking-tight text-ink">
            {showMfa ? 'Two-factor verification' : 'Sign in to AMDOX ERP'}
          </h1>
          <p className="mb-6 mt-1 text-sm text-ink-muted">
            {showMfa ? 'One more step to secure your session.' : 'Use a demo account below, or your own credentials.'}
          </p>

          {showMfa && session ? (
            <MfaForm hintCode={mfaCodeFor(session.id)} userName={session.name.split(' ')[0]} />
          ) : (
            <CredentialsForm next={params.next ?? '/dashboard'} demoAccounts={DEMO_ACCOUNTS} />
          )}

          <p className="mt-7 text-center text-[11px] leading-relaxed text-ink-muted">
            Protected by rate limiting, CSP and HMAC-signed session cookies.
            <br />
            Amdox Technologies · Engineering Division
          </p>
        </div>
      </section>
    </main>
  )
}
