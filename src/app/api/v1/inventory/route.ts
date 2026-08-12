import { apiRoute, paginate } from '@/lib/api/handler'
import { listInventory } from '@/lib/db/repo'
import { abcClassify, availableQty, stockHealth } from '@/lib/domain/inventory'

export const GET = apiRoute({ permission: 'inventory.view' }, async ({ session, query }) => {
  const items = listInventory(session.tenantId, {
    search: query.get('search') ?? undefined,
    category: query.get('category') ?? undefined,
    lowOnly: query.get('lowOnly') === 'true',
  })

  const abc = abcClassify(listInventory(session.tenantId))
  const rows = items.map((item) => ({
    ...item,
    available: availableQty(item),
    health: stockHealth(item),
    abcClass: abc.get(item.sku) ?? 'C',
    stockValue: Math.round(item.onHand * item.unitCost * 100) / 100,
  }))

  return paginate(rows, query)
})
