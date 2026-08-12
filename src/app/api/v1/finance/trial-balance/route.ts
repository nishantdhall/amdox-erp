import { apiRoute } from '@/lib/api/handler'
import { listAccounts, listJournalEntries } from '@/lib/db/repo'
import { balanceSheet, incomeStatement, trialBalance } from '@/lib/domain/ledger'

export const GET = apiRoute({ permission: 'finance.view' }, async ({ session, query }) => {
  const from = query.get('from') ?? undefined
  const to = query.get('to') ?? undefined

  const accounts = listAccounts(session.tenantId)
  const entries = listJournalEntries(session.tenantId)

  const rows = trialBalance(accounts, entries, from, to)
  const totals = rows.reduce(
    (acc, row) => ({ debit: acc.debit + row.debit, credit: acc.credit + row.credit }),
    { debit: 0, credit: 0 },
  )

  return {
    range: { from: from ?? null, to: to ?? null },
    trialBalance: rows,
    totals: {
      debit: Math.round(totals.debit * 100) / 100,
      credit: Math.round(totals.credit * 100) / 100,
      balanced: Math.abs(totals.debit - totals.credit) < 0.01,
    },
    incomeStatement: incomeStatement(accounts, entries, from, to),
    balanceSheet: balanceSheet(accounts, entries, to),
  }
})
