import { apiRoute, paginate } from '@/lib/api/handler'
import { listInvoices } from '@/lib/db/repo'
import { agingBucketFor, agingReport } from '@/lib/domain/ledger'
import { NextResponse } from 'next/server'

export const GET = apiRoute({ permission: 'finance.view' }, async ({ session, query }) => {
  const kind = (query.get('kind') as 'AP' | 'AR' | null) ?? undefined
  const rows = listInvoices(session.tenantId, {
    kind,
    status: (query.get('status') as 'Paid' | undefined) ?? undefined,
    search: query.get('search') ?? undefined,
  }).map((invoice) => ({
    ...invoice,
    outstanding: Math.round((invoice.total - invoice.amountPaid) * 100) / 100,
    agingBucket: agingBucketFor(invoice.dueDate),
  }))

  const page = paginate(rows, query)
  return NextResponse.json({ ...page, aging: agingReport(rows) })
})
