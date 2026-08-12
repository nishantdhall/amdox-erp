'use client'

import { ActionForm, Dialog, SubmitButton } from '@/components/ui/action'
import { recordPaymentAction } from '@/app/(app)/actions'
import { formatMoney } from '@/lib/utils'
import type { CurrencyCode } from '@/lib/types'

export function PaymentDialog({
  invoiceId,
  invoiceNumber,
  outstanding,
  currency,
  counterparty,
  direction,
}: {
  invoiceId: string
  invoiceNumber: string
  outstanding: number
  currency: CurrencyCode
  counterparty: string
  direction: 'pay' | 'receive'
}) {
  return (
    <Dialog
      trigger={{ label: direction === 'pay' ? 'Pay' : 'Receive', variant: 'primary' }}
      title={direction === 'pay' ? `Pay ${invoiceNumber}` : `Record receipt for ${invoiceNumber}`}
      description={`${counterparty} · ${formatMoney(outstanding, currency)} outstanding. A balanced cash journal is posted automatically.`}
    >
      {(close) => (
        <ActionForm action={recordPaymentAction} onSuccess={close}>
          <input type="hidden" name="invoiceId" value={invoiceId} />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor={`amount-${invoiceId}`}>
                Amount ({currency})
              </label>
              <input
                id={`amount-${invoiceId}`}
                name="amount"
                type="number"
                step="0.01"
                min={0.01}
                max={outstanding}
                defaultValue={outstanding.toFixed(2)}
                className="input tnum"
                required
              />
            </div>
            <div>
              <label className="label" htmlFor={`method-${invoiceId}`}>
                Method
              </label>
              <select id={`method-${invoiceId}`} name="method" className="input" defaultValue="Bank Transfer">
                {['Bank Transfer', 'UPI', 'Card', 'Cheque'].map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <p className="rounded-lg bg-surface-sunken px-3 py-2 text-[11px] leading-relaxed text-ink-muted">
            Overpayment is rejected server-side. The posting is{' '}
            {direction === 'pay' ? 'debit accounts payable, credit bank' : 'debit bank, credit accounts receivable'}.
          </p>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={close} className="rounded-lg border border-ink-line px-3 py-2 text-xs font-semibold text-ink hover:bg-surface-sunken">
              Cancel
            </button>
            <SubmitButton pendingLabel="Posting…">{direction === 'pay' ? 'Record payment' : 'Record receipt'}</SubmitButton>
          </div>
        </ActionForm>
      )}
    </Dialog>
  )
}
