import { z } from 'zod'
import { apiRoute } from '@/lib/api/handler'
import { approvePurchaseOrder, getPurchaseOrder, receivePurchaseOrder } from '@/lib/db/repo'

const actionSchema = z.object({ action: z.enum(['approve', 'receive']) })

type Params = { id: string }

export const GET = apiRoute<Params>({ permission: 'po.view' }, async ({ session, params }) =>
  getPurchaseOrder(session.tenantId, params.id),
)

export const PATCH = apiRoute<Params>({ permission: 'po.approve' }, async ({ session, audit, params, body }) => {
  const input = await body(actionSchema)
  return input.action === 'approve'
    ? approvePurchaseOrder(session.tenantId, params.id, audit)
    : receivePurchaseOrder(session.tenantId, params.id, audit)
})
