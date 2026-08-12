import { z } from 'zod'
import { apiRoute, paginate } from '@/lib/api/handler'
import { closePeriod, listPeriods, reopenPeriod } from '@/lib/db/repo'

const actionSchema = z.object({
  period: z.string().regex(/^\d{4}-\d{2}$/),
  action: z.enum(['close', 'reopen']),
})

export const GET = apiRoute({ permission: 'finance.view' }, async ({ session, query }) =>
  paginate(listPeriods(session.tenantId), query),
)

export const POST = apiRoute({ permission: 'finance.close_period' }, async ({ session, audit, body }) => {
  const input = await body(actionSchema)
  return input.action === 'close'
    ? closePeriod(session.tenantId, input.period, audit)
    : reopenPeriod(session.tenantId, input.period, audit)
})
