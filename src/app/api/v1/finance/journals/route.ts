import { z } from 'zod'
import { apiRoute, created, paginate } from '@/lib/api/handler'
import { listJournalEntries, postJournal } from '@/lib/db/repo'

const lineSchema = z.object({
  accountCode: z.string().min(1),
  debit: z.number().min(0).default(0),
  credit: z.number().min(0).default(0),
  memo: z.string().max(160).optional(),
})

const journalInput = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  memo: z.string().min(3).max(200),
  currency: z.enum(['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD']).default('INR'),
  fxRate: z.number().positive().default(1),
  lines: z.array(lineSchema).min(2, 'A journal entry needs at least two lines'),
})

export const GET = apiRoute({ permission: 'finance.view' }, async ({ session, query }) => {
  const rows = listJournalEntries(session.tenantId, {
    period: query.get('period') ?? undefined,
    status: (query.get('status') as 'Posted' | undefined) ?? undefined,
  })
  return paginate(rows, query)
})

export const POST = apiRoute({ permission: 'finance.post' }, async ({ session, audit, body }) => {
  const input = await body(journalInput)
  return created(postJournal(session.tenantId, input, audit))
})
