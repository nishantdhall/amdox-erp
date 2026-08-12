import { cn } from '@/lib/utils'

export function Logo({ variant = 'light', compact = false }: { variant?: 'light' | 'dark'; compact?: boolean }) {
  const dark = variant === 'dark'

  return (
    <div className="flex items-center gap-2.5">
      <span
        aria-hidden
        className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-brand-500 text-[15px] font-bold text-white shadow-sm"
      >
        A
      </span>
      {!compact ? (
        <span className="min-w-0 leading-tight">
          <span className={cn('block text-[15px] font-bold tracking-tight', dark ? 'text-white' : 'text-ink')}>AMDOX</span>
          <span className={cn('block text-[10px] font-medium uppercase tracking-[0.14em]', dark ? 'text-white/45' : 'text-ink-muted')}>
            ERP Suite
          </span>
        </span>
      ) : null}
    </div>
  )
}
