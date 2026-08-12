import { apiRoute, paginate } from '@/lib/api/handler'
import { listDepartments } from '@/lib/db/repo'
import { departmentBreakdown } from '@/lib/domain/analytics'

export const GET = apiRoute({ permission: 'employee.view' }, async ({ session, query }) => {
  const breakdown = new Map(departmentBreakdown(session.tenantId).map((d) => [d.code, d]))
  const rows = listDepartments(session.tenantId).map((department) => ({
    ...department,
    headcount: breakdown.get(department.code)?.headcount ?? 0,
    payrollMonthly: breakdown.get(department.code)?.payrollMonthly ?? 0,
  }))
  return paginate(rows, query)
})
