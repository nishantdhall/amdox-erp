import { z } from 'zod'
import { apiRoute, ok } from '@/lib/api/handler'
import { deleteEmployee, getEmployee, updateEmployee } from '@/lib/db/repo'

const patchSchema = z
  .object({
    firstName: z.string().min(1).max(60),
    lastName: z.string().min(1).max(60),
    email: z.string().email(),
    phone: z.string().max(24),
    departmentId: z.string().min(1),
    managerId: z.string().nullable(),
    designation: z.string().min(2).max(80),
    employmentType: z.enum(['Full-time', 'Part-time', 'Contract', 'Intern']),
    status: z.enum(['Active', 'On Leave', 'Probation', 'Exited']),
    location: z.string().max(60),
    ctcAnnual: z.number().min(0).max(100_000_000),
  })
  .partial()

type Params = { id: string }

export const GET = apiRoute<Params>({ permission: 'employee.view' }, async ({ session, params }) =>
  getEmployee(session.tenantId, params.id),
)

export const PATCH = apiRoute<Params>({ permission: 'employee.manage' }, async ({ session, audit, params, body }) =>
  updateEmployee(session.tenantId, params.id, await body(patchSchema), audit),
)

export const DELETE = apiRoute<Params>({ permission: 'employee.manage' }, async ({ session, audit, params }) => {
  deleteEmployee(session.tenantId, params.id, audit)
  return ok({ deleted: true, id: params.id })
})
