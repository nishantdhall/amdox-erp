import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/* ------------------------------------------------------------------- Card */

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <section className={cn('card', className)}>{children}</section>
}

export function CardHeader({
  title,
  subtitle,
  action,
}: {
  title: ReactNode
  subtitle?: ReactNode
  action?: ReactNode
}) {
  return (
    <header className="card-header">
      <div className="min-w-0">
        <h2 className="card-title truncate">{title}</h2>
        {subtitle ? <p className="mt-0.5 truncate text-xs text-ink-muted">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  )
}

export function CardBody({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('p-5', className)}>{children}</div>
}

/* ------------------------------------------------------------------ Badge */

export type Tone = 'neutral' | 'brand' | 'ok' | 'warn' | 'danger' | 'muted'

const TONE_CLASS: Record<Tone, string> = {
  neutral: 'bg-ink/5 text-ink ring-ink/10',
  brand: 'bg-brand-50 text-brand-700 ring-brand-500/20',
  ok: 'bg-ok-soft text-ok ring-ok/20',
  warn: 'bg-warn-soft text-warn ring-warn/25',
  danger: 'bg-danger-soft text-danger ring-danger/20',
  muted: 'bg-surface-sunken text-ink-muted ring-ink-line',
}

export function Badge({ tone = 'neutral', children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset',
        TONE_CLASS[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

/** Maps common domain statuses onto a consistent colour language. */
export function statusTone(status: string): Tone {
  const s = status.toLowerCase()
  if (['active', 'paid', 'approved', 'posted', 'completed', 'done', 'matched', 'healthy', 'present', 'open', 'received'].includes(s)) return 'ok'
  if (['pending', 'draft', 'pending approval', 'awaiting match', 'in progress', 'partially paid', 'partially received', 'low', 'on leave', 'probation', 'planning', 'remote'].includes(s)) return 'warn'
  if (['overdue', 'rejected', 'failed', 'blocked', 'at risk', 'disputed', 'critical', 'out of stock', 'absent', 'cancelled', 'reversed', 'exited', 'price variance', 'qty variance'].includes(s)) return 'danger'
  if (['closed', 'on hold', 'no po', 'weekend', 'holiday', 'overstocked'].includes(s)) return 'muted'
  return 'neutral'
}

export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={statusTone(status)}>{status}</Badge>
}

/* ----------------------------------------------------------------- Layout */

export function PageHeader({
  title,
  description,
  actions,
  meta,
}: {
  title: string
  description?: string
  actions?: ReactNode
  meta?: ReactNode
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">{title}</h1>
        {description ? <p className="mt-1 max-w-2xl text-sm text-ink-muted">{description}</p> : null}
        {meta ? <div className="mt-2.5 flex flex-wrap items-center gap-2">{meta}</div> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  )
}

export function EmptyState({ title, description, icon }: { title: string; description?: string; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      {icon ? <div className="mb-1 text-2xl opacity-60">{icon}</div> : null}
      <p className="text-sm font-semibold text-ink">{title}</p>
      {description ? <p className="max-w-sm text-xs text-ink-muted">{description}</p> : null}
    </div>
  )
}

/* -------------------------------------------------------------- Stat tile */

export function StatTile({
  label,
  value,
  delta,
  hint,
  tone = 'brand',
  icon,
}: {
  label: string
  value: ReactNode
  delta?: { value: number; suffix?: string }
  hint?: string
  tone?: Tone
  icon?: ReactNode
}) {
  const accent: Record<Tone, string> = {
    neutral: 'bg-ink/5 text-ink',
    brand: 'bg-brand-50 text-brand-600',
    ok: 'bg-ok-soft text-ok',
    warn: 'bg-warn-soft text-warn',
    danger: 'bg-danger-soft text-danger',
    muted: 'bg-surface-sunken text-ink-muted',
  }

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">{label}</p>
        {icon ? <span className={cn('grid h-7 w-7 place-items-center rounded-lg text-sm', accent[tone])}>{icon}</span> : null}
      </div>
      <p className="tnum mt-2 text-[22px] font-semibold leading-tight tracking-tight text-ink">{value}</p>
      <div className="mt-1.5 flex items-center gap-2">
        {delta ? (
          <span
            className={cn(
              'tnum inline-flex items-center gap-0.5 text-[11px] font-semibold',
              delta.value >= 0 ? 'text-ok' : 'text-danger',
            )}
          >
            {delta.value >= 0 ? '▲' : '▼'} {Math.abs(delta.value).toFixed(1)}
            {delta.suffix ?? '%'}
          </span>
        ) : null}
        {hint ? <span className="truncate text-[11px] text-ink-muted">{hint}</span> : null}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------ Progress bar */

export function Progress({ value, tone = 'brand' }: { value: number; tone?: Tone }) {
  const fill: Record<Tone, string> = {
    neutral: 'bg-ink',
    brand: 'bg-brand-500',
    ok: 'bg-ok',
    warn: 'bg-warn',
    danger: 'bg-danger',
    muted: 'bg-ink-muted',
  }
  const clamped = Math.max(0, Math.min(100, value))

  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-line" role="progressbar" aria-valuenow={clamped} aria-valuemin={0} aria-valuemax={100}>
      <div className={cn('h-full rounded-full transition-all', fill[tone])} style={{ width: `${clamped}%` }} />
    </div>
  )
}

/* ------------------------------------------------------------------ Table */

export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className="table-wrap">
      <table className={cn('table', className)}>{children}</table>
    </div>
  )
}

/* ------------------------------------------------------------------- Misc */

export function Divider({ label }: { label?: string }) {
  if (!label) return <hr className="my-6 border-ink-line" />
  return (
    <div className="my-6 flex items-center gap-3">
      <hr className="flex-1 border-ink-line" />
      <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">{label}</span>
      <hr className="flex-1 border-ink-line" />
    </div>
  )
}

export function KeyValue({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.label} className="min-w-0">
          <dt className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">{item.label}</dt>
          <dd className="tnum mt-0.5 truncate text-sm font-medium text-ink">{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}
