'use client'

import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { ActionButton, ActionForm, Dialog, SubmitButton } from '@/components/ui/action'
import { periodAction, postJournalAction } from '@/app/(app)/actions'
import { Badge, Card, CardBody, CardHeader } from '@/components/ui/primitives'
import { formatNumber, toISODate } from '@/lib/utils'

interface AccountOption {
  code: string
  name: string
}

interface DraftLine {
  accountCode: string
  debit: string
  credit: string
}

/**
 * Journal composer with a live balance check.
 *
 * The same invariant is enforced server-side — this only tells the user before
 * they submit, it is never the thing that guarantees balance.
 */
export function JournalComposer({ accounts }: { accounts: AccountOption[] }) {
  const [lines, setLines] = useState<DraftLine[]>([
    { accountCode: accounts[0]?.code ?? '', debit: '', credit: '' },
    { accountCode: accounts[1]?.code ?? '', debit: '', credit: '' },
  ])

  const totals = useMemo(() => {
    const debit = lines.reduce((s, l) => s + (Number(l.debit) || 0), 0)
    const credit = lines.reduce((s, l) => s + (Number(l.credit) || 0), 0)
    return { debit, credit, balanced: Math.abs(debit - credit) < 0.005 && debit > 0 }
  }, [lines])

  const payload = JSON.stringify(
    lines
      .filter((l) => l.accountCode && (Number(l.debit) || Number(l.credit)))
      .map((l) => ({ accountCode: l.accountCode, debit: Number(l.debit) || 0, credit: Number(l.credit) || 0 })),
  )

  const update = (index: number, patch: Partial<DraftLine>) =>
    setLines((current) => current.map((line, i) => (i === index ? { ...line, ...patch } : line)))

  return (
    <Dialog
      trigger={{ label: '+ New journal entry' }}
      title="Post a journal entry"
      description="Debits must equal credits, the accounts must exist and the period must still be open."
    >
      {(close) => (
        <ActionForm action={postJournalAction} onSuccess={close}>
          <input type="hidden" name="lines" value={payload} />

          <div className="grid grid-cols-[150px_1fr] gap-3">
            <div>
              <label className="label" htmlFor="je-date">
                Date
              </label>
              <input id="je-date" name="date" type="date" className="input" defaultValue={toISODate(new Date())} required />
            </div>
            <div>
              <label className="label" htmlFor="je-memo">
                Memo
              </label>
              <input id="je-memo" name="memo" className="input" required placeholder="Q2 consulting revenue accrual" />
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="label mb-0">Lines</span>
              <button
                type="button"
                onClick={() => setLines((current) => [...current, { accountCode: accounts[0]?.code ?? '', debit: '', credit: '' }])}
                className="text-[11px] font-semibold text-brand-600 hover:underline"
              >
                + Add line
              </button>
            </div>

            <div className="space-y-2">
              {lines.map((line, index) => (
                <div key={index} className="grid grid-cols-[1fr_92px_92px_28px] items-center gap-2">
                  <select
                    className="input py-1.5 text-xs"
                    value={line.accountCode}
                    onChange={(event) => update(index, { accountCode: event.target.value })}
                    aria-label={`Line ${index + 1} account`}
                  >
                    {accounts.map((account) => (
                      <option key={account.code} value={account.code}>
                        {account.code} — {account.name}
                      </option>
                    ))}
                  </select>
                  <input
                    className="input tnum py-1.5 text-right text-xs"
                    inputMode="decimal"
                    placeholder="Debit"
                    value={line.debit}
                    onChange={(event) => update(index, { debit: event.target.value, credit: '' })}
                    aria-label={`Line ${index + 1} debit`}
                  />
                  <input
                    className="input tnum py-1.5 text-right text-xs"
                    inputMode="decimal"
                    placeholder="Credit"
                    value={line.credit}
                    onChange={(event) => update(index, { credit: event.target.value, debit: '' })}
                    aria-label={`Line ${index + 1} credit`}
                  />
                  <button
                    type="button"
                    onClick={() => setLines((current) => current.filter((_, i) => i !== index))}
                    disabled={lines.length <= 2}
                    aria-label={`Remove line ${index + 1}`}
                    className="text-sm text-ink-muted hover:text-danger disabled:opacity-30"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div
            className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold ${
              totals.balanced ? 'bg-ok-soft text-ok' : 'bg-warn-soft text-warn'
            }`}
          >
            <span>{totals.balanced ? 'Balanced' : 'Debits and credits must match'}</span>
            <span className="tnum">
              Dr {formatNumber(totals.debit, 2)} / Cr {formatNumber(totals.credit, 2)}
            </span>
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={close} className="rounded-lg border border-ink-line px-3 py-2 text-xs font-semibold text-ink hover:bg-surface-sunken">
              Cancel
            </button>
            <SubmitButton pendingLabel="Posting…">Post entry</SubmitButton>
          </div>
        </ActionForm>
      )}
    </Dialog>
  )
}

export function PeriodControls({
  periods,
  selected,
  canClose,
  currentPeriod,
}: {
  periods: { period: string; status: 'Open' | 'Closed'; label: string }[]
  selected: string
  canClose: boolean
  currentPeriod: string
}) {
  const router = useRouter()

  return (
    <Card>
      <CardHeader title="Accounting periods" subtitle="Close locks the period against new postings" />
      <CardBody className="space-y-3">
        <div>
          <label className="label" htmlFor="period-filter">
            Filter the ledger
          </label>
          <select
            id="period-filter"
            className="input"
            value={selected}
            onChange={(event) => router.push(`/finance/ledger?period=${event.target.value}`)}
          >
            <option value="all">All periods</option>
            {periods.map((period) => (
              <option key={period.period} value={period.period}>
                {period.label}
              </option>
            ))}
          </select>
        </div>

        <ul className="max-h-[220px] space-y-1 overflow-y-auto pr-1">
          {periods.map((period) => (
            <li key={period.period} className="flex items-center justify-between gap-2 rounded-lg border border-ink-line px-2.5 py-1.5">
              <span className="text-xs font-medium text-ink">
                {period.label}
                {period.period === currentPeriod ? <span className="ml-1.5 text-[10px] text-ink-muted">current</span> : null}
              </span>
              <span className="flex items-center gap-2">
                <Badge tone={period.status === 'Open' ? 'ok' : 'muted'}>{period.status}</Badge>
                {canClose ? (
                  <ActionButton
                    action={periodAction}
                    fields={{ period: period.period, action: period.status === 'Open' ? 'close' : 'reopen' }}
                    variant="ghost"
                  >
                    {period.status === 'Open' ? 'Close' : 'Reopen'}
                  </ActionButton>
                ) : null}
              </span>
            </li>
          ))}
        </ul>

        {!canClose ? (
          <p className="text-[11px] leading-relaxed text-ink-muted">
            Closing a period requires the Tenant Admin role. Reopening is an admin override and is recorded in the audit trail.
          </p>
        ) : null}
      </CardBody>
    </Card>
  )
}
