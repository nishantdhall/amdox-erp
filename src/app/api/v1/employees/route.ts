import { z } from 'zod'
import { apiRoute, created, paginate } from '@/lib/api/handler'
import { createEmployee, listEmployees } from '@/lib/db/repo'
import { toISODate } from '@/lib/utils'

const employeeInput = z.object({
  firstName: z.string().min(1).max(60),
  lastName: z.string().min(1).max(60),
  email: z.string().email(),
  phone: z.string().max(24).default(''),
  departmentId: z.string().min(1),
  managerId: z.string().nullable().default(null),
  designation: z.string().min(2).max(80),
  employmentType: z.enum(['Full-time', 'Part-time', 'Contract', 'Intern']).default('Full-time'),
  status: z.enum(['Active', 'On Leave', 'Probation', 'Exited']).default('Active'),
  location: z.string().max(60).default('Bengaluru'),
  ctcAnnual: z.number().min(0).max(100_000_000),
  joinedOn: z.string().optional(),
  bankLast4: z.string().max(4).default('0000'),
  pan: z.string().max(10).default('AAAPZ0000A'),
})

export const GET = apiRoute({ permission: 'employee.view' }, async ({ session, query }) => {
  const rows = listEmployees(session.tenantId, {
    search: query.get('search') ?? undefined,
    departmentId: query.get('departmentId') ?? undefined,
    status: (query.get('status') as 'Active' | undefined) ?? undefined,
  })
  return paginate(rows, query)
})

export const POST = apiRoute({ permission: 'employee.manage' }, async ({ session, audit, body }) => {
  const input = await body(employeeInput)
  const employee = createEmployee(
    session.tenantId,
    { ...input, joinedOn: input.joinedOn ?? toISODate(new Date()) },
    audit,
  )
  return created(employee)
})
