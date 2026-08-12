import { apiRoute, paginate } from '@/lib/api/handler'
import { listAccounts } from '@/lib/db/repo'

export const GET = apiRoute({ permission: 'finance.view' }, async ({ session, query }) =>
  paginate(listAccounts(session.tenantId), query),
)
