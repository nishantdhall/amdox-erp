import { z } from 'zod'
import { apiRoute, created, paginate } from '@/lib/api/handler'
import { createLeave, listLeave } from '@/lib/db/repo'

const leaveInput = z.object({
  employeeId: z.string().min(1),
  type: z.enum(['Casual', 'Sick', 'Earned', 'Unpaid', 'Maternity']),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().min(3).max(240),
})

export const GET = apiRoute({ permission: 'leave.apply' }, async ({ session, query }) => {
  const canReadAll = session.role !== 'Employee' && session.role !== 'Viewer'
  const rows = listLeave(session.tenantId, {
    employeeId: canReadAll ? query.get('employeeId') ?? undefined : session.employeeId ?? undefined,
    status: (query.get('status') as 'Pending' | undefined) ?? undefined,
  })
  return paginate(rows, query)
})

export const POST = apiRoute({ permission: 'leave.apply' }, async ({ session, audit, body }) => {
  const input = await body(leaveInput)
  return created(createLeave(session.tenantId, input, audit))
})
