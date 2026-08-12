import { apiRoute } from '@/lib/api/handler'
import { approveInvoice, getInvoice } from '@/lib/db/repo'

type Params = { id: string }

export const GET = apiRoute<Params>({ permission: 'finance.view' }, async ({ session, params }) =>
  getInvoice(session.tenantId, params.id),
)

export const PATCH = apiRoute<Params>({ permission: 'invoice.approve' }, async ({ session, audit, params }) =>
  approveInvoice(session.tenantId, params.id, audit),
)
