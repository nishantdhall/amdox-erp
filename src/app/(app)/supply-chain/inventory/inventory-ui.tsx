'use client'

import { useActionState, useEffect } from 'react'
import { ActionForm, Dialog, ResultBanner, SubmitButton } from '@/components/ui/action'
import { adjustStockAction, runReorderAction, type ActionResult } from '@/app/(app)/actions'
import { Badge, Card, CardBody, CardHeader } from '@/components/ui/primitives'
import { formatMoney, formatNumber } from '@/lib/utils'
import type { ReorderSuggestion } from '@/lib/domain/inventory'
import type { CurrencyCode } from '@/lib/types'

export function AdjustStockDialog({ id, sku, name, onHand }: { id: string; sku: string; name: string; onHand: number }) {
  return (
    <Dialog
      trigger={{ label: 'Adjust', variant: 'secondary' }}
      title={`Adjust ${sku}`}
      description={`${name} — ${formatNumber(onHand)} currently on hand. Adjustments write a stock movement and an audit record.`}
    >
      {(close) => (
        <ActionForm action={adjustStockAction} onSuccess={close}>
          <input type="hidden" name="id" value={id} />

          <div>
            <label className="label" htmlFor={`qty-${id}`}>
              Quantity change
            </label>
            <input
              id={`qty-${id}`}
              name="qty"
              type="number"
              step={1}
              className="input tnum"
              placeholder="e.g. -12 for a write-off"
              required
            />
            <p className="mt-1 text-[11px] text-ink-muted">
              Positive values add stock, negative values remove it. An adjustment that would drive stock negative is rejected.
            </p>
          </div>

          <div>
            <label className="label" htmlFor={`reason-${id}`}>
              Reason
            </label>
            <input id={`reason-${id}`} name="reason" className="input" required minLength={3} placeholder="Cycle count variance" />
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={close} className="rounded-lg border border-ink-line px-3 py-2 text-xs font-semibold text-ink hover:bg-surface-sunken">
              Cancel
            </button>
            <SubmitButton pendingLabel="Adjusting…">Apply adjustment</SubmitButton>
          </div>
        </ActionForm>
      )}
    </Dialog>
  )
}

export function ReorderPanel({
  suggestions,
  currency,
  canRun,
}: {
  suggestions: ReorderSuggestion[]
  currency: CurrencyCode
  canRun: boolean
}) {
  const [result, formAction] = useActionState<ActionResult | null, FormData>(runReorderAction, null)

  // Nudge focus to the banner so the outcome is announced, not just shown.
  useEffect(() => {
    if (result) window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [result])

  const totalCost = suggestions.reduce((s, r) => s + r.estimatedCost, 0)

  return (
    <Card>
      <CardHeader
        title="Reorder engine"
        subtitle="Raises draft POs for every shortage"
        action={<Badge tone={suggestions.length > 0 ? 'warn' : 'ok'}>{suggestions.length} SKU(s)</Badge>}
      />
      <CardBody className="space-y-3">
        {suggestions.length === 0 ? (
          <p className="py-4 text-center text-xs text-ink-muted">
            Nothing to reorder — every SKU is above its reorder point, or an open purchase order already covers the gap.
          </p>
        ) : (
          <>
            <ul className="max-h-[210px] space-y-1.5 overflow-y-auto pr-1">
              {suggestions.slice(0, 12).map((suggestion) => (
                <li key={suggestion.sku} className="flex items-center justify-between gap-2 rounded-lg border border-ink-line px-2.5 py-1.5">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-ink">{suggestion.name}</p>
                    <p className="tnum text-[11px] text-ink-muted">
                      {suggestion.sku} · {formatNumber(suggestion.available)} left · order {formatNumber(suggestion.suggestedQty)}
                    </p>
                  </div>
                  <Badge tone={suggestion.urgency === 'Critical' ? 'danger' : suggestion.urgency === 'High' ? 'warn' : 'muted'}>
                    {suggestion.urgency}
                  </Badge>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between rounded-lg bg-surface-sunken px-3 py-2">
              <span className="text-[11px] font-semibold text-ink-muted">Estimated spend</span>
              <span className="tnum text-xs font-bold text-ink">{formatMoney(totalCost, currency, true)}</span>
            </div>
          </>
        )}

        <ResultBanner result={result} />

        {canRun ? (
          <form action={formAction}>
            <SubmitButton size="md" className="w-full" pendingLabel="Raising purchase orders…">
              Run reorder engine
            </SubmitButton>
          </form>
        ) : (
          <p className="text-[11px] text-ink-muted">Running the reorder engine requires the Manager role or above.</p>
        )}
      </CardBody>
    </Card>
  )
}
