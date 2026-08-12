import { apiRoute, paginate } from '@/lib/api/handler'
import { listPurchaseOrders } from '@/lib/db/repo'

export const GET = apiRoute({ permission: 'po.view' }, async ({ session, query }) => {
  const rows = listPurchaseOrders(session.tenantId, {
    status: (query.get('status') as 'Approved' | undefined) ?? undefined,
  }).map((po) => ({
    ...po,
    receivedPct: Math.round(
      (po.lines.reduce((s, l) => s + l.qtyReceived, 0) / Math.max(1, po.lines.reduce((s, l) => s + l.qty, 0))) * 100,
    ),
  }))
  return paginate(rows, query)
})
