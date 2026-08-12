import type { Account, Invoice, JournalEntry, JournalLine } from '../types'
import { round, sum } from '../utils'

/**
 * Double-entry accounting rules (F-02) and AP/AR aging (F-03).
 */

export class UnbalancedEntryError extends Error {
  constructor(public readonly debit: number, public readonly credit: number) {
    super(`Journal entry is unbalanced: debits ${debit.toFixed(2)} ≠ credits ${credit.toFixed(2)}`)
    this.name = 'UnbalancedEntryError'
  }
}

/** Rounding tolerance, in base-currency minor units. */
const TOLERANCE = 0.005

export function entryTotals(lines: JournalLine[]) {
  const debit = round(sum(lines.map((l) => l.debit || 0)))
  const credit = round(sum(lines.map((l) => l.credit || 0)))
  return { debit, credit, balanced: Math.abs(debit - credit) < TOLERANCE }
}

/** Throws unless debits equal credits — the invariant every posting must hold. */
export function assertBalanced(lines: JournalLine[]): void {
  const { debit, credit, balanced } = entryTotals(lines)
  if (!balanced) throw new UnbalancedEntryError(debit, credit)
}

export interface TrialBalanceRow {
  accountCode: string
  accountName: string
  type: Account['type']
  debit: number
  credit: number
  balance: number
}

/**
 * Trial balance for a period range. `balance` is expressed in the account's
 * natural direction, so an expense with more debits shows a positive number.
 */
export function trialBalance(accounts: Account[], entries: JournalEntry[], fromPeriod?: string, toPeriod?: string): TrialBalanceRow[] {
  const posted = entries.filter(
    (e) =>
      e.status === 'Posted' &&
      (!fromPeriod || e.period >= fromPeriod) &&
      (!toPeriod || e.period <= toPeriod),
  )

  const totals = new Map<string, { debit: number; credit: number }>()
  for (const entry of posted) {
    for (const line of entry.lines) {
      const bucket = totals.get(line.accountCode) ?? { debit: 0, credit: 0 }
      bucket.debit += line.debit || 0
      bucket.credit += line.credit || 0
      totals.set(line.accountCode, bucket)
    }
  }

  return accounts
    .map((account) => {
      const bucket = totals.get(account.code) ?? { debit: 0, credit: 0 }
      const balance =
        account.normalBalance === 'debit' ? bucket.debit - bucket.credit : bucket.credit - bucket.debit
      return {
        accountCode: account.code,
        accountName: account.name,
        type: account.type,
        debit: round(bucket.debit),
        credit: round(bucket.credit),
        balance: round(balance),
      }
    })
    .filter((row) => row.debit !== 0 || row.credit !== 0)
    .sort((a, b) => a.accountCode.localeCompare(b.accountCode))
}

export interface IncomeStatement {
  revenue: number
  expenses: number
  grossMargin: number
  netProfit: number
  marginPct: number
  byAccount: TrialBalanceRow[]
}

export function incomeStatement(accounts: Account[], entries: JournalEntry[], fromPeriod?: string, toPeriod?: string): IncomeStatement {
  const rows = trialBalance(accounts, entries, fromPeriod, toPeriod)
  const revenue = round(sum(rows.filter((r) => r.type === 'Revenue').map((r) => r.balance)))
  const expenses = round(sum(rows.filter((r) => r.type === 'Expense').map((r) => r.balance)))
  const netProfit = round(revenue - expenses)

  return {
    revenue,
    expenses,
    grossMargin: netProfit,
    netProfit,
    marginPct: revenue === 0 ? 0 : round((netProfit / revenue) * 100, 1),
    byAccount: rows.filter((r) => r.type === 'Revenue' || r.type === 'Expense'),
  }
}

export interface BalanceSheet {
  assets: number
  liabilities: number
  equity: number
  retainedEarnings: number
  /** Assets − (liabilities + equity + retained earnings); should be ~0. */
  difference: number
  rows: TrialBalanceRow[]
}

export function balanceSheet(accounts: Account[], entries: JournalEntry[], toPeriod?: string): BalanceSheet {
  const rows = trialBalance(accounts, entries, undefined, toPeriod)
  const assets = round(sum(rows.filter((r) => r.type === 'Asset').map((r) => r.balance)))
  const liabilities = round(sum(rows.filter((r) => r.type === 'Liability').map((r) => r.balance)))
  const equity = round(sum(rows.filter((r) => r.type === 'Equity').map((r) => r.balance)))
  const revenue = round(sum(rows.filter((r) => r.type === 'Revenue').map((r) => r.balance)))
  const expenses = round(sum(rows.filter((r) => r.type === 'Expense').map((r) => r.balance)))
  const retainedEarnings = round(revenue - expenses)

  return {
    assets,
    liabilities,
    equity,
    retainedEarnings,
    difference: round(assets - (liabilities + equity + retainedEarnings)),
    rows: rows.filter((r) => r.type === 'Asset' || r.type === 'Liability' || r.type === 'Equity'),
  }
}

/* ---------------------------------------------------------------- AP/AR aging */

export const AGING_BUCKETS = ['Current', '1-30', '31-60', '61-90', '90+'] as const
export type AgingBucket = (typeof AGING_BUCKETS)[number]

export function agingBucketFor(dueDate: string, asOf: Date = new Date()): AgingBucket {
  const days = Math.floor((asOf.getTime() - new Date(dueDate).getTime()) / 86400000)
  if (days <= 0) return 'Current'
  if (days <= 30) return '1-30'
  if (days <= 60) return '31-60'
  if (days <= 90) return '61-90'
  return '90+'
}

export interface AgingReport {
  buckets: Record<AgingBucket, number>
  total: number
  overdue: number
  count: number
}

export function agingReport(invoices: Invoice[], asOf: Date = new Date()): AgingReport {
  const buckets = Object.fromEntries(AGING_BUCKETS.map((b) => [b, 0])) as Record<AgingBucket, number>
  let total = 0

  const open = invoices.filter((i) => i.status !== 'Paid' && i.status !== 'Draft')
  for (const invoice of open) {
    const outstanding = round(invoice.total - invoice.amountPaid)
    if (outstanding <= 0) continue
    buckets[agingBucketFor(invoice.dueDate, asOf)] += outstanding
    total += outstanding
  }

  for (const key of AGING_BUCKETS) buckets[key] = round(buckets[key])

  return {
    buckets,
    total: round(total),
    overdue: round(total - buckets.Current),
    count: open.length,
  }
}

/** Days sales outstanding — average collection period over the window. */
export function daysSalesOutstanding(invoices: Invoice[], windowDays = 90): number {
  const cutoff = Date.now() - windowDays * 86400000
  const recent = invoices.filter((i) => i.kind === 'AR' && new Date(i.issueDate).getTime() >= cutoff)
  if (recent.length === 0) return 0
  const revenue = sum(recent.map((i) => i.total))
  const receivables = sum(recent.map((i) => i.total - i.amountPaid))
  return revenue === 0 ? 0 : round((receivables / revenue) * windowDays, 1)
}
