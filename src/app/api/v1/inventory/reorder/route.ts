import { apiRoute, created } from '@/lib/api/handler'
import { listInventory, listPurchaseOrders, runReorderEngine } from '@/lib/db/repo'
import { reorderSuggestions } from '@/lib/domain/inventory'

export const GET = apiRoute({ permission: 'inventory.view' }, async ({ session }) => {
  const suggestions = reorderSuggestions(listInventory(session.tenantId), listPurchaseOrders(session.tenantId))
  return {
    suggestions,
    totalEstimatedCost: Math.round(suggestions.reduce((s, r) => s + r.estimatedCost, 0) * 100) / 100,
    criticalCount: suggestions.filter((s) => s.urgency === 'Critical').length,
  }
})

export const POST = apiRoute({ permission: 'po.reorder_run' }, async ({ session, audit }) => {
  const orders = runReorderEngine(session.tenantId, audit)
  return created({
    createdCount: orders.length,
    purchaseOrders: orders,
    message:
      orders.length === 0
        ? 'No SKUs are below their reorder point, or open orders already cover them.'
        : `Raised ${orders.length} purchase order(s) awaiting approval.`,
  })
})
