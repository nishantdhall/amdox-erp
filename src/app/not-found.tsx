import Link from 'next/link'

export default function NotFound() {
  return (
    <main id="main" className="grid min-h-screen place-items-center bg-surface-sunken px-5">
      <div className="w-full max-w-md rounded-2xl border border-ink-line bg-white p-7 text-center shadow-card">
        <p className="tnum text-3xl font-bold tracking-tight text-brand-500">404</p>
        <h1 className="mt-2 text-lg font-semibold tracking-tight text-ink">That page does not exist</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          The link may be out of date, or the record you were looking for has been archived.
        </p>
        <Link href="/dashboard" className="mt-5 inline-block rounded-lg bg-brand-500 px-3.5 py-2 text-xs font-semibold text-white hover:bg-brand-600">
          Back to dashboard
        </Link>
      </div>
    </main>
  )
}
