import { z } from 'zod'
import { apiRoute } from '@/lib/api/handler'
import { decideLeave } from '@/lib/db/repo'

const decisionSchema = z.object({
  decision: z.enum(['Approved', 'Rejected']),
  note: z.string().max(240).nullable().default(null),
})

type Params = { id: string }

export const PATCH = apiRoute<Params>({ permission: 'leave.approve' }, async ({ session, audit, params, body }) => {
  const input = await body(decisionSchema)
  return decideLeave(session.tenantId, params.id, input.decision, input.note, audit)
})
