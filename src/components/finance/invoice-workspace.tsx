import { can } from '@/lib/auth/rbac'
import { getTenant, listInvoices } from '@/lib/db/repo'
import { AGING_BUCKETS, agingBucketFor, agingReport, daysSalesOutstanding } from '@/lib/domain/ledger'
import { Badge, Card, CardBody, CardHeader, EmptyState, PageHeader, StatTile, StatusBadge, Table } from '@/components/ui/primitives'
import { RankedBars } from '@/components/charts/bar'
import { ActionButton } from '@/components/ui/action'
import { approveInvoiceAction } from '@/app/(app)/actions'
import { PaymentDialog } from './payment-dialog'
import { formatDate, formatMoney, formatNumber, round } from '@/lib/utils'
import type { SessionPayload } from '@/lib/auth/session'
import type { InvoiceKind } from '@/lib/types'

/**
 * Shared AP/AR workspace (F-03). The only difference between payables and
 * receivables is the direction of the money, so both screens render this.
 */
export function InvoiceWorkspace({ session, kind }: { session: SessionPayload; kind: InvoiceKind }) {
  const tenant = getTenant(session.tenantId)
  const currency = tenant.baseCurrency
  const isPayable = kind === 'AP'

  const invoices = listInvoices(session.tenantId, { kind })
  const aging = agingReport(invoices)
  const dso = daysSalesOutstanding(listInvoices(session.tenantId, { kind: 'AR' }))

  const outstanding = invoices.filter((i) => i.status !== 'Paid')
  const overdue = invoices.filter((i) => i.status === 'Overdue')
  const matchIssues = invoices.filter((i) => i.matchState === 'Price Variance' || i.matchState === 'Qty Variance')
  const paidCount = invoices.filter((i) => i.status === 'Paid').length

  const canApprove = can(session, 'invoice.approve')
  const canPay = can(session, 'payment.record')

  const avgOcr =
    isPayable && invoices.length > 0
      ? round((invoices.reduce((s, i) => s + (i.ocrConfidence ?? 0), 0) / invoices.length) * 100, 1)
      : null

  return (
    <>
      <PageHeader
        title={isPayable ? 'Accounts payable' : 'Accounts receivable'}
        description={
          isPayable
            ? 'Supplier invoices with 3-way matching against the purchase order and goods receipt. Approval is blocked while a variance is open.'
            : 'Customer invoices, collections and ageing. Recording a receipt posts the cash journal automatically.'
        }
        meta={
          <>
            <Badge tone="muted">{formatNumber(invoices.length)} invoices</Badge>
            <Badge tone={overdue.length > 0 ? 'danger' : 'ok'}>{formatNumber(overdue.length)} overdue</Badge>
            {avgOcr !== null ? <Badge tone={avgOcr >= 95 ? 'ok' : 'warn'}>OCR confidence {avgOcr}%</Badge> : null}
          </>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Outstanding" value={formatMoney(aging.total, currency, true)} hint={`${formatNumber(outstanding.length)} open invoices`} icon="◫" />
        <StatTile label="Overdue" value={formatMoney(aging.overdue, currency, true)} tone={aging.overdue > 0 ? 'danger' : 'ok'} icon="!" />
        <StatTile
          label={isPayable ? 'Match exceptions' : 'Days sales outstanding'}
          value={isPayable ? formatNumber(matchIssues.length) : `${dso} days`}
          tone={isPayable ? (matchIssues.length > 0 ? 'warn' : 'ok') : 'brand'}
          icon={isPayable ? '⚠' : '◔'}
        />
        <StatTile label="Settled" value={formatNumber(paidCount)} tone="ok" hint="Fully paid invoices" icon="✓" />
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader title="Ageing profile" subtitle="Outstanding balance by bucket" />
          <CardBody>
            <RankedBars
              data={AGING_BUCKETS.map((bucket) => ({
                label: bucket === 'Current' ? 'Not yet due' : `${bucket} days`,
                value: aging.buckets[bucket],
                tone: bucket === 'Current' ? '#047857' : bucket === '90+' ? '#b03f7a' : '#a45c00',
              }))}
              format={{ kind: 'money', currency, compact: true }}
            />
          </CardBody>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader
            title={isPayable ? '3-way match status' : 'Collection status'}
            subtitle={isPayable ? 'Purchase order ↔ goods receipt ↔ invoice' : 'Where each invoice sits in the collection cycle'}
          />
          <CardBody>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {(isPayable
                ? (['Matched', 'Price Variance', 'Qty Variance', 'No PO'] as const).map((state) => ({
                    label: state,
                    count: invoices.filter((i) => i.matchState === state).length,
                  }))
                : (['Approved', 'Partially Paid', 'Paid', 'Overdue'] as const).map((state) => ({
                    label: state,
                    count: invoices.filter((i) => i.status === state).length,
                  }))
              ).map((entry) => (
                <div key={entry.label} className="rounded-xl border border-ink-line p-3">
                  <p className="tnum text-lg font-semibold text-ink">{formatNumber(entry.count)}</p>
                  <p className="mt-0.5 text-[11px] text-ink-muted">{entry.label}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-ink-muted">
              {isPayable
                ? 'Approving an invoice flagged with a price or quantity variance is rejected with a 409 — the variance has to be resolved against the receipt first.'
                : 'Recording a receipt posts a balanced journal (debit bank, credit accounts receivable) and updates the ageing profile immediately.'}
            </p>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title={isPayable ? 'Supplier invoices' : 'Customer invoices'} subtitle={`${formatNumber(invoices.length)} records, newest first`} />
        {invoices.length === 0 ? (
          <EmptyState title="No invoices" description="Nothing has been raised in this ledger yet." icon="◫" />
        ) : (
          <Table>
            <thead>
              <tr>
                <th>Invoice</th>
                <th>{isPayable ? 'Vendor' : 'Customer'}</th>
                <th>Issued</th>
                <th>Due</th>
                <th className="text-right">Total</th>
                <th className="text-right">Outstanding</th>
                <th>Ageing</th>
                <th>{isPayable ? 'Match' : 'Status'}</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {invoices.slice(0, 60).map((invoice) => {
                const open = round(invoice.total - invoice.amountPaid)
                const bucket = agingBucketFor(invoice.dueDate)
                return (
                  <tr key={invoice.id}>
                    <td>
                      <p className="tnum text-[11px] font-semibold text-ink">{invoice.number}</p>
                      <p className="text-[11px] text-ink-muted">{invoice.currency}</p>
                    </td>
                    <td className="max-w-[180px] truncate text-xs">{invoice.counterpartyName}</td>
                    <td className="text-xs text-ink-muted">{formatDate(invoice.issueDate)}</td>
                    <td className="text-xs text-ink-muted">{formatDate(invoice.dueDate)}</td>
                    <td className="tnum text-right text-xs">{formatMoney(invoice.total, invoice.currency, true)}</td>
                    <td className="tnum text-right text-xs font-semibold">
                      {open > 0 ? formatMoney(open, invoice.currency, true) : <span className="text-ok">Settled</span>}
                    </td>
                    <td>
                      <Badge tone={bucket === 'Current' ? 'ok' : bucket === '90+' ? 'danger' : 'warn'}>{bucket}</Badge>
                    </td>
                    <td>
                      <div className="flex flex-col gap-1">
                        <StatusBadge status={invoice.status} />
                        {isPayable ? <span className="text-[10px] text-ink-muted">{invoice.matchState}</span> : null}
                      </div>
                    </td>
                    <td>
                      <div className="flex justify-end gap-1.5">
                        {canApprove && (invoice.status === 'Awaiting Match' || invoice.status === 'Draft') ? (
                          <ActionButton action={approveInvoiceAction} fields={{ id: invoice.id }} variant="secondary">
                            Approve
                          </ActionButton>
                        ) : null}
                        {canPay && open > 0 ? (
                          <PaymentDialog
                            invoiceId={invoice.id}
                            invoiceNumber={invoice.number}
                            outstanding={open}
                            currency={invoice.currency}
                            counterparty={invoice.counterpartyName}
                            direction={isPayable ? 'pay' : 'receive'}
                          />
                        ) : null}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  )
}
