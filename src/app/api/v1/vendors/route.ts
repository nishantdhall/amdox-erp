import { apiRoute, paginate } from '@/lib/api/handler'
import { listVendors } from '@/lib/db/repo'

export const GET = apiRoute({ permission: 'po.view' }, async ({ session, query }) =>
  paginate(listVendors(session.tenantId), query),
)
