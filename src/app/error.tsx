'use client'

import { useEffect } from 'react'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // A real deployment forwards this to the OpenTelemetry collector.
    console.error('[amdox] unhandled render error', error)
  }, [error])

  return (
    <main className="grid min-h-[60vh] place-items-center px-5">
      <div className="w-full max-w-md rounded-2xl border border-ink-line bg-white p-7 text-center shadow-card">
        <span aria-hidden className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl bg-danger-soft text-xl text-danger">
          !
        </span>
        <h1 className="text-lg font-semibold tracking-tight text-ink">Something went wrong</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          This screen failed to render. The error has been logged{error.digest ? ` with reference ${error.digest}` : ''}.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-5 rounded-lg bg-brand-500 px-3.5 py-2 text-xs font-semibold text-white hover:bg-brand-600"
        >
          Try again
        </button>
      </div>
    </main>
  )
}
