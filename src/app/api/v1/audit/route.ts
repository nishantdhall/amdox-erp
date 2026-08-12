import { apiRoute, paginate } from '@/lib/api/handler'
import { listAuditLogs } from '@/lib/db/repo'

export const GET = apiRoute({ permission: 'audit.view' }, async ({ session, query }) => {
  const rows = listAuditLogs(session.tenantId, {
    action: query.get('action') ?? undefined,
    search: query.get('search') ?? undefined,
  })
  return paginate(rows, query)
})
