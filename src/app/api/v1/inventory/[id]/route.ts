import { z } from 'zod'
import { apiRoute } from '@/lib/api/handler'
import { adjustStock } from '@/lib/db/repo'

const adjustSchema = z.object({
  qty: z.number().int().refine((v) => v !== 0, 'Adjustment quantity cannot be zero'),
  reason: z.string().min(3).max(120),
})

type Params = { id: string }

export const PATCH = apiRoute<Params>({ permission: 'inventory.adjust' }, async ({ session, audit, params, body }) => {
  const input = await body(adjustSchema)
  return adjustStock(session.tenantId, params.id, input.qty, input.reason, audit)
})
