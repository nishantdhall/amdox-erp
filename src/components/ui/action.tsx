'use client'

import { useActionState, useEffect, useState, type ReactNode } from 'react'
import { useFormStatus } from 'react-dom'
import type { ActionResult } from '@/app/(app)/actions'
import { cn } from '@/lib/utils'

type ServerAction = (prev: ActionResult | null, formData: FormData) => Promise<ActionResult>

/* --------------------------------------------------------------- feedback */

export function ResultBanner({ result, onDismiss }: { result: ActionResult | null; onDismiss?: () => void }) {
  if (!result) return null
  return (
    <div
      role="status"
      className={cn(
        'flex items-start gap-2 rounded-lg border px-3 py-2 text-xs font-medium',
        result.ok ? 'border-ok/20 bg-ok-soft text-ok' : 'border-danger/20 bg-danger-soft text-danger',
      )}
    >
      <span aria-hidden className="mt-px">
        {result.ok ? '✓' : '!'}
      </span>
      <span className="flex-1">{result.message}</span>
      {onDismiss ? (
        <button type="button" onClick={onDismiss} aria-label="Dismiss" className="shrink-0 opacity-60 hover:opacity-100">
          ×
        </button>
      ) : null}
    </div>
  )
}

/* ---------------------------------------------------------------- buttons */

const VARIANTS = {
  primary: 'bg-brand-500 text-white hover:bg-brand-600',
  secondary: 'border border-ink-line bg-white text-ink hover:bg-surface-sunken',
  ok: 'bg-ok text-white hover:bg-ok/90',
  danger: 'bg-danger text-white hover:bg-danger/90',
  ghost: 'text-brand-600 hover:bg-brand-50',
} as const

export type ButtonVariant = keyof typeof VARIANTS

export function SubmitButton({
  children,
  variant = 'primary',
  size = 'md',
  className,
  pendingLabel,
}: {
  children: ReactNode
  variant?: ButtonVariant
  size?: 'sm' | 'md'
  className?: string
  pendingLabel?: string
}) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-lg font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60',
        size === 'sm' ? 'px-2.5 py-1.5 text-[11px]' : 'px-3.5 py-2 text-xs',
        VARIANTS[variant],
        className,
      )}
    >
      {pending ? (
        <>
          <span aria-hidden className="h-3 w-3 animate-spin rounded-full border-2 border-current/30 border-t-current" />
          {pendingLabel ?? 'Working…'}
        </>
      ) : (
        children
      )}
    </button>
  )
}

/**
 * One-click action: a form carrying fixed hidden fields.
 * Feedback surfaces in the shared toast so table rows stay compact.
 */
export function ActionButton({
  action,
  fields,
  children,
  variant = 'secondary',
  size = 'sm',
  confirm,
  className,
}: {
  action: ServerAction
  fields: Record<string, string>
  children: ReactNode
  variant?: ButtonVariant
  size?: 'sm' | 'md'
  confirm?: string
  className?: string
}) {
  const [result, formAction] = useActionState<ActionResult | null, FormData>(action, null)
  const { push } = useToast()

  useEffect(() => {
    if (result) push(result)
  }, [result, push])

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (confirm && !window.confirm(confirm)) event.preventDefault()
      }}
      className="inline"
    >
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <SubmitButton variant={variant} size={size} className={className}>
        {children}
      </SubmitButton>
    </form>
  )
}

/**
 * Form wrapper that renders its own result banner.
 * `children` receives the latest result so fields can be reset on success.
 */
export function ActionForm({
  action,
  children,
  className,
  onSuccess,
}: {
  action: ServerAction
  children: ReactNode | ((result: ActionResult | null) => ReactNode)
  className?: string
  onSuccess?: () => void
}) {
  const [result, formAction] = useActionState<ActionResult | null, FormData>(action, null)

  useEffect(() => {
    if (result?.ok) onSuccess?.()
  }, [result, onSuccess])

  return (
    <form action={formAction} className={cn('space-y-3.5', className)}>
      {typeof children === 'function' ? children(result) : children}
      <ResultBanner result={result} />
    </form>
  )
}

/* ------------------------------------------------------------------ toast */

interface ToastContextValue {
  push: (result: ActionResult) => void
}

let toastHandler: ((result: ActionResult) => void) | null = null

function useToast(): ToastContextValue {
  return {
    push: (result) => toastHandler?.(result),
  }
}

/** Mount once per page; ActionButton results surface here. */
export function ToastHost() {
  const [items, setItems] = useState<{ id: number; result: ActionResult }[]>([])

  useEffect(() => {
    let counter = 0
    toastHandler = (result) => {
      const id = ++counter
      setItems((current) => [...current, { id, result }])
      setTimeout(() => setItems((current) => current.filter((item) => item.id !== id)), 5200)
    }
    return () => {
      toastHandler = null
    }
  }, [])

  if (items.length === 0) return null

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2">
      {items.map((item) => (
        <div key={item.id} className="pointer-events-auto animate-fade-up shadow-pop">
          <ResultBanner
            result={item.result}
            onDismiss={() => setItems((current) => current.filter((entry) => entry.id !== item.id))}
          />
        </div>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ dialog */

export function Dialog({
  trigger,
  title,
  description,
  children,
}: {
  trigger: { label: string; variant?: ButtonVariant }
  title: string
  description?: string
  children: (close: () => void) => ReactNode
}) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors',
          VARIANTS[trigger.variant ?? 'primary'],
        )}
      >
        {trigger.label}
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center">
          <button aria-label="Close dialog" className="fixed inset-0 bg-ink/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div role="dialog" aria-modal="true" aria-label={title} className="relative w-full max-w-lg animate-fade-up rounded-2xl border border-ink-line bg-white shadow-pop">
            <div className="flex items-start justify-between gap-4 border-b border-ink-line px-5 py-3.5">
              <div>
                <h2 className="text-sm font-semibold text-ink">{title}</h2>
                {description ? <p className="mt-0.5 text-xs text-ink-muted">{description}</p> : null}
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="text-lg leading-none text-ink-muted hover:text-ink">
                ×
              </button>
            </div>
            <div className="px-5 py-4">{children(() => setOpen(false))}</div>
          </div>
        </div>
      ) : null}
    </>
  )
}
