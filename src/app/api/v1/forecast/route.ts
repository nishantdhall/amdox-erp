import { apiRoute } from '@/lib/api/handler'
import { listDemandSeries } from '@/lib/db/repo'
import { forecastPortfolio } from '@/lib/domain/forecast'

export const GET = apiRoute({ permission: 'forecast.view' }, async ({ session, query }) => {
  const horizon = Math.max(1, Math.min(12, Number(query.get('horizon')) || 6))
  const { results, avgMape } = forecastPortfolio(listDemandSeries(session.tenantId), { horizonMonths: horizon })

  return {
    generatedAt: new Date().toISOString(),
    horizonMonths: horizon,
    skuCount: results.length,
    averageMape: avgMape,
    /** Acceptance criterion for F-06 is MAPE below 12%. */
    meetsAcceptanceCriteria: avgMape < 12,
    results: results.map((result) => ({
      sku: result.sku,
      name: result.name,
      model: result.model,
      mape: result.mape,
      bias: result.bias,
      peakPeriod: result.peakPeriod,
      recommendedOrderQty: result.recommendedOrderQty,
      nextPeriod: result.forecast[0],
    })),
  }
})
