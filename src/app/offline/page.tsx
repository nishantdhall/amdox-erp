import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Offline' }

export default function OfflinePage() {
  return (
    <main id="main" className="grid min-h-screen place-items-center bg-surface-sunken px-5">
      <div className="w-full max-w-md rounded-2xl border border-ink-line bg-white p-7 text-center shadow-card">
        <span aria-hidden className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl bg-warn-soft text-xl text-warn">
          ⚡
        </span>
        <h1 className="text-lg font-semibold tracking-tight text-ink">You are offline</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          The page you asked for has not been cached yet. Screens you have already visited stay available offline, and anything
          you change will sync the moment the connection returns.
        </p>
        <a href="/dashboard" className="mt-5 inline-block rounded-lg bg-brand-500 px-3.5 py-2 text-xs font-semibold text-white hover:bg-brand-600">
          Try again
        </a>
      </div>
    </main>
  )
}
