import type { Metadata } from 'next'
import { requireSession } from '@/lib/auth/session'
import { can } from '@/lib/auth/rbac'
import { getTenant, listAccounts, listJournalEntries, listPeriods } from '@/lib/db/repo'
import { balanceSheet, incomeStatement, trialBalance } from '@/lib/domain/ledger'
import { revenueSeries } from '@/lib/domain/analytics'
import { Badge, Card, CardBody, CardHeader, EmptyState, PageHeader, StatTile, StatusBadge, Table } from '@/components/ui/primitives'
import { LineChart } from '@/components/charts/line'
import { JournalComposer, PeriodControls } from './ledger-ui'
import { formatDate, formatMoney, formatNumber, periodLabel, toPeriod } from '@/lib/utils'

export const metadata: Metadata = { title: 'General ledger' }
export const dynamic = 'force-dynamic'

export default async function LedgerPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const params = await searchParams
  const session = await requireSession()
  const tenant = getTenant(session.tenantId)
  const currency = tenant.baseCurrency

  const accounts = listAccounts(session.tenantId)
  const entries = listJournalEntries(session.tenantId)
  const periods = listPeriods(session.tenantId)

  const selectedPeriod = params.period && params.period !== 'all' ? params.period : undefined
  const periodEntries = selectedPeriod ? entries.filter((e) => e.period === selectedPeriod) : entries

  const tb = trialBalance(accounts, entries, selectedPeriod, selectedPeriod)
  const pnl = incomeStatement(accounts, entries, selectedPeriod, selectedPeriod)
  const bs = balanceSheet(accounts, entries, selectedPeriod)
  const trend = revenueSeries(session.tenantId, 8)

  const totalDebit = tb.reduce((s, r) => s + r.debit, 0)
  const totalCredit = tb.reduce((s, r) => s + r.credit, 0)
  const balanced = Math.abs(totalDebit - totalCredit) < 0.01

  const drafts = periodEntries.filter((e) => e.status === 'Draft')
  const currentPeriod = toPeriod(new Date())
  const canPost = can(session, 'finance.post')
  const canClose = can(session, 'finance.close_period')

  return (
    <>
      <PageHeader
        title="General ledger"
        description="Double-entry postings, trial balance and period close. Unbalanced entries are rejected before they reach the ledger."
        meta={
          <>
            <Badge tone={balanced ? 'ok' : 'danger'}>{balanced ? 'Trial balance in balance' : 'Out of balance'}</Badge>
            <Badge tone="muted">{formatNumber(entries.length)} entries</Badge>
            <Badge tone="muted">{selectedPeriod ? periodLabel(selectedPeriod) : 'All periods'}</Badge>
            {drafts.length > 0 ? <Badge tone="warn">{drafts.length} draft</Badge> : null}
          </>
        }
        actions={canPost ? <JournalComposer accounts={accounts.map((a) => ({ code: a.code, name: a.name }))} /> : null}
      />

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Revenue" value={formatMoney(pnl.revenue, currency, true)} hint={selectedPeriod ? periodLabel(selectedPeriod) : 'All periods'} icon="↥" />
        <StatTile label="Expenses" value={formatMoney(pnl.expenses, currency, true)} tone="warn" icon="↧" />
        <StatTile label="Net profit" value={formatMoney(pnl.netProfit, currency, true)} tone={pnl.netProfit >= 0 ? 'ok' : 'danger'} hint={`${pnl.marginPct}% margin`} icon="◈" />
        <StatTile
          label="Balance sheet check"
          value={Math.abs(bs.difference) < 1 ? 'Balanced' : formatMoney(bs.difference, currency, true)}
          tone={Math.abs(bs.difference) < 1 ? 'ok' : 'danger'}
          hint="Assets − (liabilities + equity + retained)"
          icon="⚖"
        />
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Profitability trend" subtitle="Posted movements over the last eight periods" />
          <CardBody className="pt-4">
            <LineChart
              labels={trend.map((p) => periodLabel(p.period))}
              series={[
                { name: 'Revenue', values: trend.map((p) => p.revenue), area: true },
                { name: 'Expenses', values: trend.map((p) => p.expenses) },
                { name: 'Net profit', values: trend.map((p) => p.profit) },
              ]}
              height={244}
              format={{ kind: 'money', currency, compact: true }}
              ariaLabel="Revenue, expenses and profit trend"
            />
          </CardBody>
        </Card>

        <PeriodControls
          periods={periods.map((p) => ({ period: p.period, status: p.status, label: periodLabel(p.period) }))}
          selected={params.period ?? 'all'}
          canClose={canClose}
          currentPeriod={currentPeriod}
        />
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader
            title="Trial balance"
            subtitle={`${formatNumber(tb.length)} accounts with movement`}
            action={
              <Badge tone={balanced ? 'ok' : 'danger'}>
                Dr {formatMoney(totalDebit, currency, true)} / Cr {formatMoney(totalCredit, currency, true)}
              </Badge>
            }
          />
          {tb.length === 0 ? (
            <EmptyState title="No movement in this period" description="Pick another period or post an entry." icon="≡" />
          ) : (
            <Table>
              <thead>
                <tr>
                  <th>Account</th>
                  <th>Type</th>
                  <th className="text-right">Debit</th>
                  <th className="text-right">Credit</th>
                  <th className="text-right">Balance</th>
                </tr>
              </thead>
              <tbody>
                {tb.map((row) => (
                  <tr key={row.accountCode}>
                    <td>
                      <p className="text-xs font-semibold text-ink">{row.accountName}</p>
                      <p className="tnum text-[11px] text-ink-muted">{row.accountCode}</p>
                    </td>
                    <td className="text-[11px] text-ink-muted">{row.type}</td>
                    <td className="tnum text-right text-xs">{row.debit ? formatMoney(row.debit, currency, true) : '—'}</td>
                    <td className="tnum text-right text-xs">{row.credit ? formatMoney(row.credit, currency, true) : '—'}</td>
                    <td className="tnum text-right text-xs font-semibold">{formatMoney(row.balance, currency, true)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>

        <Card>
          <CardHeader title="Balance sheet" subtitle="Position as at the selected period" />
          <CardBody className="space-y-4">
            {(['Asset', 'Liability', 'Equity'] as const).map((type) => {
              const rows = bs.rows.filter((r) => r.type === type)
              if (rows.length === 0) return null
              const total = rows.reduce((s, r) => s + r.balance, 0)
              return (
                <div key={type}>
                  <div className="mb-1.5 flex items-baseline justify-between border-b border-ink-line pb-1">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">{type}s</span>
                    <span className="tnum text-xs font-bold text-ink">{formatMoney(total, currency, true)}</span>
                  </div>
                  <ul className="space-y-1">
                    {rows.map((row) => (
                      <li key={row.accountCode} className="flex items-center justify-between gap-3">
                        <span className="truncate text-xs text-ink-muted">
                          <span className="tnum mr-1.5">{row.accountCode}</span>
                          {row.accountName}
                        </span>
                        <span className="tnum shrink-0 text-xs font-medium text-ink">{formatMoney(row.balance, currency, true)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
            <div className="flex items-baseline justify-between border-t border-ink-line pt-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">Retained earnings</span>
              <span className="tnum text-xs font-bold text-ink">{formatMoney(bs.retainedEarnings, currency, true)}</span>
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Journal entries"
          subtitle={`${formatNumber(periodEntries.length)} entries${selectedPeriod ? ` in ${periodLabel(selectedPeriod)}` : ''}`}
        />
        {periodEntries.length === 0 ? (
          <EmptyState title="No journal entries" description="Post an entry to populate the ledger." icon="≡" />
        ) : (
          <Table>
            <thead>
              <tr>
                <th>Reference</th>
                <th>Date</th>
                <th>Memo</th>
                <th>Source</th>
                <th>Lines</th>
                <th className="text-right">Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {periodEntries.slice(0, 60).map((entry) => {
                const amount = entry.lines.reduce((s, l) => s + l.debit, 0)
                return (
                  <tr key={entry.id}>
                    <td className="tnum text-[11px] font-semibold text-ink">{entry.reference}</td>
                    <td className="text-xs text-ink-muted">{formatDate(entry.date)}</td>
                    <td className="max-w-[260px] truncate text-xs">{entry.memo}</td>
                    <td className="text-[11px] text-ink-muted">{entry.source}</td>
                    <td className="text-[11px] text-ink-muted">
                      {entry.lines.map((line) => line.accountCode).join(' · ')}
                    </td>
                    <td className="tnum text-right text-xs font-semibold">{formatMoney(amount, currency, true)}</td>
                    <td>
                      <StatusBadge status={entry.status} />
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
