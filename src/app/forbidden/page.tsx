import type { Metadata } from 'next'
import Link from 'next/link'
import { getSession } from '@/lib/auth/session'
import { ROLE_PERMISSIONS } from '@/lib/auth/rbac'

export const metadata: Metadata = { title: 'Access denied' }
export const dynamic = 'force-dynamic'

export default async function ForbiddenPage() {
  const session = await getSession()

  return (
    <main id="main" className="grid min-h-screen place-items-center bg-surface-sunken px-5">
      <div className="w-full max-w-md rounded-2xl border border-ink-line bg-white p-7 text-center shadow-card">
        <span aria-hidden className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl bg-danger-soft text-xl text-danger">
          ⛨
        </span>
        <h1 className="text-lg font-semibold tracking-tight text-ink">You do not have access to that area</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          {session
            ? `Your role is ${session.role}, which does not grant the permission this screen requires. Sign in with a higher-privileged demo account to explore it.`
            : 'Sign in to continue.'}
        </p>

        {session ? (
          <div className="mt-5 rounded-xl bg-surface-sunken p-3 text-left">
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">Permissions you do have</p>
            <div className="flex flex-wrap gap-1">
              {ROLE_PERMISSIONS[session.role].slice(0, 12).map((permission) => (
                <code key={permission} className="rounded bg-white px-1.5 py-0.5 font-mono text-[10px] text-ink ring-1 ring-ink-line">
                  {permission}
                </code>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-6 flex justify-center gap-2">
          <Link href="/dashboard" className="rounded-lg bg-brand-500 px-3.5 py-2 text-xs font-semibold text-white hover:bg-brand-600">
            Back to dashboard
          </Link>
          <Link href="/login" className="rounded-lg border border-ink-line px-3.5 py-2 text-xs font-semibold text-ink hover:bg-surface-sunken">
            Switch account
          </Link>
        </div>
      </div>
    </main>
  )
}
