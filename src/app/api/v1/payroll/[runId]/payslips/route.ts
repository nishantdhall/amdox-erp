import { apiRoute, paginate } from '@/lib/api/handler'
import { listEmployees, listPayslips } from '@/lib/db/repo'

type Params = { runId: string }

export const GET = apiRoute<Params>({ permission: 'payroll.view' }, async ({ session, params, query }) => {
  const employees = new Map(listEmployees(session.tenantId).map((e) => [e.id, e]))
  const rows = listPayslips(session.tenantId, { runId: params.runId }).map((slip) => {
    const employee = employees.get(slip.employeeId)
    return {
      ...slip,
      employeeCode: employee?.code ?? '—',
      employeeName: employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown',
      designation: employee?.designation ?? '—',
    }
  })
  return paginate(rows, query)
})
