import { apiRoute } from '@/lib/api/handler'
import { getDemandSeries, listInventory } from '@/lib/db/repo'
import { forecastDemand } from '@/lib/domain/forecast'
import type { ForecastResult } from '@/lib/types'

type Params = { sku: string }

export const GET = apiRoute<Params>({ permission: 'forecast.view' }, async ({ session, params, query }) => {
  const sku = decodeURIComponent(params.sku)
  const series = getDemandSeries(session.tenantId, sku)
  const item = listInventory(session.tenantId).find((i) => i.sku === sku)

  const horizon = Math.max(1, Math.min(12, Number(query.get('horizon')) || 6))
  const requestedModel = query.get('model') as ForecastResult['model'] | null

  const result = forecastDemand(series, {
    horizonMonths: horizon,
    leadTimeDays: item?.leadTimeDays ?? 21,
    model: requestedModel ?? undefined,
  })

  return {
    ...result,
    currentStock: item ? item.onHand - item.allocated : null,
    reorderPoint: item?.reorderPoint ?? null,
    leadTimeDays: item?.leadTimeDays ?? null,
  }
})
