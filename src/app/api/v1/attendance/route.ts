import { z } from 'zod'
import { apiRoute, paginate } from '@/lib/api/handler'
import { clockIn, clockOut, listAttendance } from '@/lib/db/repo'
import { ForbiddenError } from '@/lib/auth/rbac'

const actionSchema = z.object({
  action: z.enum(['clock-in', 'clock-out']),
  employeeId: z.string().min(1),
})

export const GET = apiRoute({ permission: 'attendance.self' }, async ({ session, query }) => {
  const requested = query.get('employeeId') ?? undefined

  // Employees may only read their own attendance; managers may read anyone's.
  const canReadAll = session.role !== 'Employee' && session.role !== 'Viewer'
  const employeeId = canReadAll ? requested : session.employeeId ?? undefined

  const rows = listAttendance(session.tenantId, {
    employeeId,
    from: query.get('from') ?? undefined,
    to: query.get('to') ?? undefined,
  })
  return paginate(rows, query)
})

export const POST = apiRoute({ permission: 'attendance.self' }, async ({ session, audit, body }) => {
  const input = await body(actionSchema)

  const isSelf = session.employeeId === input.employeeId
  const canManage = session.role === 'Manager' || session.role === 'TenantAdmin' || session.role === 'SuperAdmin'
  if (!isSelf && !canManage) throw new ForbiddenError('attendance.manage')

  return input.action === 'clock-in'
    ? clockIn(session.tenantId, input.employeeId, audit)
    : clockOut(session.tenantId, input.employeeId, audit)
})
