import { z } from 'zod'
import { apiRoute, created, paginate } from '@/lib/api/handler'
import { listPayrollRuns, runPayroll } from '@/lib/db/repo'

const runInput = z.object({
  period: z.string().regex(/^\d{4}-\d{2}$/, 'Period must be formatted as YYYY-MM'),
})

export const GET = apiRoute({ permission: 'payroll.view' }, async ({ session, query }) =>
  paginate(listPayrollRuns(session.tenantId), query),
)

export const POST = apiRoute({ permission: 'payroll.run' }, async ({ session, audit, body }) => {
  const input = await body(runInput)
  return created(runPayroll(session.tenantId, input.period, audit))
})
