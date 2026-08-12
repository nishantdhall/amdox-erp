import type { Metadata } from 'next'
import { requireSession } from '@/lib/auth/session'
import { can } from '@/lib/auth/rbac'
import { getTenant, listInventory, listPurchaseOrders, listStockMovements } from '@/lib/db/repo'
import { abcClassify, availableQty, inventoryValue, reorderSuggestions, stockHealth, turnoverRatio } from '@/lib/domain/inventory'
import { inventoryByCategory } from '@/lib/domain/analytics'
import { Badge, Card, CardBody, CardHeader, EmptyState, PageHeader, StatTile, StatusBadge, Table } from '@/components/ui/primitives'
import { DonutChart } from '@/components/charts/misc'
import { AdjustStockDialog, ReorderPanel } from './inventory-ui'
import { formatDate, formatMoney, formatNumber } from '@/lib/utils'

export const metadata: Metadata = { title: 'Inventory' }
export const dynamic = 'force-dynamic'

export default async function InventoryPage() {
  const session = await requireSession()
  const tenant = getTenant(session.tenantId)
  const currency = tenant.baseCurrency

  const items = listInventory(session.tenantId)
  const orders = listPurchaseOrders(session.tenantId)
  const movements = listStockMovements(session.tenantId).slice(0, 12)

  const suggestions = reorderSuggestions(items, orders)
  const abc = abcClassify(items)
  const categories = inventoryByCategory(session.tenantId)

  const totalValue = inventoryValue(items)
  const lowStock = items.filter((item) => availableQty(item) <= item.reorderPoint)
  const outOfStock = items.filter((item) => availableQty(item) <= 0)

  // Approximate annual COGS from the last 90 days of issues, for a turnover ratio.
  const issues = listStockMovements(session.tenantId).filter((m) => m.qty < 0)
  const annualCogs = issues.reduce((s, m) => s + Math.abs(m.qty) * m.unitCost, 0) * (365 / 150)

  const canAdjust = can(session, 'inventory.adjust')
  const canReorder = can(session, 'po.reorder_run')

  return (
    <>
      <PageHeader
        title="Inventory"
        description="Real-time stock levels, ABC classification and the reorder-point engine that raises purchase orders automatically."
        meta={
          <>
            <Badge tone="muted">{formatNumber(items.length)} SKUs</Badge>
            <Badge tone={lowStock.length > 0 ? 'warn' : 'ok'}>{formatNumber(lowStock.length)} at or below reorder point</Badge>
            {outOfStock.length > 0 ? <Badge tone="danger">{formatNumber(outOfStock.length)} out of stock</Badge> : null}
          </>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Stock value" value={formatMoney(totalValue, currency, true)} hint="Valued at unit cost" icon="▤" />
        <StatTile label="Low stock" value={formatNumber(lowStock.length)} tone={lowStock.length > 0 ? 'warn' : 'ok'} hint="Below reorder point" icon="⚠" />
        <StatTile label="Turnover ratio" value={`${turnoverRatio(items, annualCogs)}×`} hint="Annualised COGS ÷ stock value" icon="↻" />
        <StatTile
          label="Reorder suggestions"
          value={formatNumber(suggestions.length)}
          tone={suggestions.length > 0 ? 'warn' : 'ok'}
          hint={suggestions.length > 0 ? formatMoney(suggestions.reduce((s, r) => s + r.estimatedCost, 0), currency, true) : 'All covered'}
          icon="⇄"
        />
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <ReorderPanel suggestions={suggestions} currency={currency} canRun={canReorder} />

        <Card>
          <CardHeader title="Value by category" />
          <CardBody>
            <DonutChart
              slices={categories.slice(0, 6)}
              centerLabel="Total"
              centerValue={formatMoney(totalValue, currency, true)}
              format={{ kind: 'money', currency, compact: true }}
              size={150}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Recent stock movements" subtitle="Receipts, issues and adjustments" />
          <CardBody className="space-y-2">
            {movements.length === 0 ? (
              <p className="py-6 text-center text-xs text-ink-muted">No movements recorded.</p>
            ) : (
              movements.map((movement) => (
                <div key={movement.id} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="tnum truncate text-xs font-semibold text-ink">{movement.sku}</p>
                    <p className="truncate text-[11px] text-ink-muted">
                      {movement.kind} · {movement.reference} · {formatDate(movement.date)}
                    </p>
                  </div>
                  <span className={`tnum shrink-0 text-xs font-bold ${movement.qty > 0 ? 'text-ok' : 'text-danger'}`}>
                    {movement.qty > 0 ? '+' : ''}
                    {formatNumber(movement.qty)}
                  </span>
                </div>
              ))
            )}
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Stock ledger"
          subtitle="ABC class A covers the top 80% of stock value, B the next 15%, C the remainder"
        />
        {items.length === 0 ? (
          <EmptyState title="No inventory" description="No SKUs are configured for this tenant." icon="▤" />
        ) : (
          <Table>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Category</th>
                <th>Warehouse</th>
                <th className="text-right">On hand</th>
                <th className="text-right">Allocated</th>
                <th className="text-right">Available</th>
                <th className="text-right">Reorder at</th>
                <th className="text-right">Value</th>
                <th>ABC</th>
                <th>Health</th>
                {canAdjust ? <th aria-label="Actions" /> : null}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const available = availableQty(item)
                const health = stockHealth(item)
                return (
                  <tr key={item.id}>
                    <td>
                      <p className="text-xs font-semibold text-ink">{item.name}</p>
                      <p className="tnum text-[11px] text-ink-muted">
                        {item.sku} · {item.uom} · lead {item.leadTimeDays}d
                      </p>
                    </td>
                    <td className="text-xs text-ink-muted">{item.category}</td>
                    <td className="text-[11px] text-ink-muted">{item.warehouseCode}</td>
                    <td className="tnum text-right text-xs">{formatNumber(item.onHand)}</td>
                    <td className="tnum text-right text-xs text-ink-muted">{formatNumber(item.allocated)}</td>
                    <td className="tnum text-right text-xs font-semibold">{formatNumber(available)}</td>
                    <td className="tnum text-right text-xs text-ink-muted">{formatNumber(item.reorderPoint)}</td>
                    <td className="tnum text-right text-xs">{formatMoney(item.onHand * item.unitCost, currency, true)}</td>
                    <td>
                      <Badge tone={abc.get(item.sku) === 'A' ? 'brand' : abc.get(item.sku) === 'B' ? 'neutral' : 'muted'}>
                        {abc.get(item.sku) ?? 'C'}
                      </Badge>
                    </td>
                    <td>
                      <StatusBadge status={health} />
                    </td>
                    {canAdjust ? (
                      <td className="text-right">
                        <AdjustStockDialog id={item.id} sku={item.sku} name={item.name} onHand={item.onHand} />
                      </td>
                    ) : null}
                  </tr>
                )
              })}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  )
}
