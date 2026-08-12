import type { InventoryItem, PurchaseOrder } from '../types'
import { round, sum } from '../utils'

/**
 * Inventory valuation, ABC classification and the reorder-point engine (F-05).
 */

export function availableQty(item: InventoryItem): number {
  return item.onHand - item.allocated
}

export function isBelowReorderPoint(item: InventoryItem): boolean {
  return availableQty(item) <= item.reorderPoint
}

export type StockHealth = 'Out of Stock' | 'Critical' | 'Low' | 'Healthy' | 'Overstocked'

export function stockHealth(item: InventoryItem): StockHealth {
  const available = availableQty(item)
  if (available <= 0) return 'Out of Stock'
  if (available <= item.reorderPoint * 0.5) return 'Critical'
  if (available <= item.reorderPoint) return 'Low'
  if (item.reorderPoint > 0 && available > item.reorderPoint * 6) return 'Overstocked'
  return 'Healthy'
}

export function inventoryValue(items: InventoryItem[]): number {
  return round(sum(items.map((i) => i.onHand * i.unitCost)))
}

/**
 * ABC analysis by annualised consumption value: A = top 80% of value,
 * B = next 15%, C = the tail.
 */
export function abcClassify(items: InventoryItem[]): Map<string, 'A' | 'B' | 'C'> {
  const scored = items
    .map((i) => ({ sku: i.sku, value: i.onHand * i.unitCost }))
    .sort((a, b) => b.value - a.value)

  const total = sum(scored.map((s) => s.value))
  const result = new Map<string, 'A' | 'B' | 'C'>()
  let cumulative = 0

  for (const entry of scored) {
    cumulative += entry.value
    const share = total === 0 ? 1 : cumulative / total
    result.set(entry.sku, share <= 0.8 ? 'A' : share <= 0.95 ? 'B' : 'C')
  }

  return result
}

export interface ReorderSuggestion {
  sku: string
  name: string
  available: number
  reorderPoint: number
  suggestedQty: number
  unitCost: number
  estimatedCost: number
  leadTimeDays: number
  urgency: 'Critical' | 'High' | 'Normal'
}

/**
 * Scan for items at or below their reorder point.
 *
 * Items already covered by an open purchase order are skipped so the engine
 * cannot raise duplicate POs for the same shortage.
 */
export function reorderSuggestions(items: InventoryItem[], openOrders: PurchaseOrder[]): ReorderSuggestion[] {
  const onOrder = new Set<string>()
  for (const po of openOrders) {
    if (po.status === 'Cancelled' || po.status === 'Received') continue
    for (const line of po.lines) {
      if (line.qtyReceived < line.qty) onOrder.add(line.sku)
    }
  }

  return items
    .filter((item) => item.autoReorder && isBelowReorderPoint(item) && !onOrder.has(item.sku))
    .map((item) => {
      const available = availableQty(item)
      const health = stockHealth(item)
      const suggestedQty = Math.max(item.reorderQty, item.reorderPoint - available + item.reorderQty)
      const suggestion: ReorderSuggestion = {
        sku: item.sku,
        name: item.name,
        available,
        reorderPoint: item.reorderPoint,
        suggestedQty,
        unitCost: item.unitCost,
        estimatedCost: round(suggestedQty * item.unitCost),
        leadTimeDays: item.leadTimeDays,
        urgency: health === 'Out of Stock' ? 'Critical' : health === 'Critical' ? 'High' : 'Normal',
      }
      return suggestion
    })
    .sort((a, b) => {
      const rank: Record<ReorderSuggestion['urgency'], number> = { Critical: 0, High: 1, Normal: 2 }
      return rank[a.urgency] - rank[b.urgency] || b.estimatedCost - a.estimatedCost
    })
}

/** Inventory turnover ratio — annual COGS divided by average stock value. */
export function turnoverRatio(items: InventoryItem[], annualCogs: number): number {
  const value = inventoryValue(items)
  return value === 0 ? 0 : round(annualCogs / value, 2)
}
