import type { Metadata } from 'next'
import { requireSession } from '@/lib/auth/session'
import { getDemandSeries, listDemandSeries, listInventory } from '@/lib/db/repo'
import { forecastDemand, forecastPortfolio } from '@/lib/domain/forecast'
import { Badge, Card, CardBody, CardHeader, EmptyState, KeyValue, PageHeader, StatTile, Table } from '@/components/ui/primitives'
import { LineChart } from '@/components/charts/line'
import { ForecastControls } from './forecast-ui'
import { formatNumber, periodLabel } from '@/lib/utils'
import type { ForecastResult } from '@/lib/types'

export const metadata: Metadata = { title: 'AI demand forecasting' }
export const dynamic = 'force-dynamic'

export default async function ForecastingPage({
  searchParams,
}: {
  searchParams: Promise<{ sku?: string; horizon?: string; model?: string }>
}) {
  const params = await searchParams
  const session = await requireSession()

  const seriesList = listDemandSeries(session.tenantId)
  if (seriesList.length === 0) {
    return (
      <>
        <PageHeader title="AI demand forecasting" description="No demand history is available for this tenant." />
        <Card>
          <EmptyState title="Nothing to forecast" description="Demand series are seeded per tenant; this one has none." icon="◠" />
        </Card>
      </>
    )
  }

  const horizon = Math.max(1, Math.min(12, Number(params.horizon) || 6))
  const selectedSku = seriesList.find((s) => s.sku === params.sku)?.sku ?? seriesList[0].sku
  const model = (params.model as ForecastResult['model'] | undefined) || undefined

  const inventory = listInventory(session.tenantId)
  const item = inventory.find((i) => i.sku === selectedSku)

  const series = getDemandSeries(session.tenantId, selectedSku)
  const result = forecastDemand(series, { horizonMonths: horizon, leadTimeDays: item?.leadTimeDays ?? 21, model })
  const portfolio = forecastPortfolio(seriesList, { horizonMonths: horizon })

  // Show the last two years of history plus the forecast horizon on one axis.
  const historyWindow = result.history.slice(-24)
  const labels = [...historyWindow.map((p) => periodLabel(p.period)), ...result.forecast.map((p) => periodLabel(p.period))]
  const pad = (values: (number | null)[], before: number) => [...Array<number | null>(before).fill(null), ...values]

  const actualValues = [...historyWindow.map((p) => p.qty), ...result.forecast.map(() => Number.NaN)]
  const fittedValues = [
    ...result.fitted.slice(-24).map((p) => p.qty),
    ...result.forecast.map(() => Number.NaN),
  ]
  const forecastValues = [
    ...historyWindow.map((_, i) => (i === historyWindow.length - 1 ? historyWindow[i].qty : Number.NaN)),
    ...result.forecast.map((p) => p.predicted),
  ]

  const bandLower = pad(result.forecast.map((p) => p.lower), historyWindow.length)
  const bandUpper = pad(result.forecast.map((p) => p.upper), historyWindow.length)

  const accuracy = Math.max(0, 100 - result.mape)
  const nextPeriod = result.forecast[0]
  const available = item ? item.onHand - item.allocated : null
  const coverMonths = available !== null && nextPeriod.predicted > 0 ? available / nextPeriod.predicted : null

  return (
    <>
      <PageHeader
        title="AI demand forecasting"
        description="Holt-Winters triple exponential smoothing blended with an additive trend-plus-seasonality model. Smoothing parameters are grid-searched, and the blend is weighted by each model's hold-out error."
        meta={
          <>
            <Badge tone="brand">{result.model}</Badge>
            <Badge tone={result.mape < 12 ? 'ok' : 'warn'}>MAPE {result.mape}%</Badge>
            <Badge tone="muted">{formatNumber(seriesList.length)} SKUs tracked</Badge>
            <Badge tone={portfolio.avgMape < 12 ? 'ok' : 'warn'}>Portfolio MAPE {portfolio.avgMape}%</Badge>
          </>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Backtest accuracy"
          value={`${accuracy.toFixed(1)}%`}
          tone={result.mape < 12 ? 'ok' : 'warn'}
          hint={`MAPE ${result.mape}% on a 6-month hold-out`}
          icon="◠"
        />
        <StatTile label="Forecast horizon" value={`${result.horizonMonths} months`} hint={`Peak in ${periodLabel(result.peakPeriod)}`} icon="◷" />
        <StatTile
          label="Next month demand"
          value={formatNumber(nextPeriod.predicted)}
          hint={`95% CI ${formatNumber(nextPeriod.lower)} – ${formatNumber(nextPeriod.upper)}`}
          icon="↗"
        />
        <StatTile
          label="Suggested order"
          value={formatNumber(result.recommendedOrderQty)}
          tone={available !== null && available < result.recommendedOrderQty ? 'warn' : 'ok'}
          hint={available !== null ? `${formatNumber(available)} available today` : 'Lead-time demand + safety stock'}
          icon="⇄"
        />
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader
            title={`${result.name} — demand and forecast`}
            subtitle="Actuals, in-sample fit, and the projection with its 95% prediction interval"
            action={<Badge tone="muted">{result.sku}</Badge>}
          />
          <CardBody className="pt-4">
            <LineChart
              labels={labels}
              series={[
                { name: 'Actual demand', values: actualValues, color: '#8898aa' },
                { name: 'Model fit', values: fittedValues, color: '#047857', dashed: true },
                { name: 'Forecast', values: forecastValues, color: '#4f6ef7' },
              ]}
              band={{ lower: bandLower, upper: bandUpper, color: '#93a8fb', label: '95% prediction interval' }}
              forecastFrom={historyWindow.length - 1}
              height={300}
              format={{ kind: 'number' }}
              ariaLabel={`Demand history and forecast for ${result.sku}`}
            />
          </CardBody>
        </Card>

        <div className="space-y-4">
          <ForecastControls
            skus={seriesList.map((s) => ({ sku: s.sku, name: s.name }))}
            selectedSku={selectedSku}
            horizon={horizon}
            model={params.model ?? ''}
          />

          <Card>
            <CardHeader title="Fitted parameters" subtitle="Chosen by grid search, not hardcoded" />
            <CardBody>
              <KeyValue
                items={[
                  { label: 'α (level)', value: result.params.alpha?.toFixed(2) ?? '—' },
                  { label: 'β (trend)', value: result.params.beta?.toFixed(2) ?? '—' },
                  { label: 'γ (seasonal)', value: result.params.gamma?.toFixed(2) ?? '—' },
                  { label: 'Trend slope', value: `${result.params.trendSlope > 0 ? '+' : ''}${result.params.trendSlope}/mo` },
                  { label: 'HW weight', value: `${((result.params.ensembleWeightHoltWinters ?? 0) * 100).toFixed(0)}%` },
                  { label: 'Residual σ', value: formatNumber(result.params.residualSigma ?? 0) },
                  { label: 'Holt-Winters MAPE', value: `${result.params.holtWintersMape}%` },
                  { label: 'Additive MAPE', value: `${result.params.additiveMape}%` },
                ]}
              />
              <p className="mt-3 border-t border-ink-line pt-2.5 text-[11px] leading-relaxed text-ink-muted">
                Forecast bias is {result.bias > 0 ? 'under' : 'over'}-forecasting by {Math.abs(result.bias)}%.
                {coverMonths !== null ? ` Current stock covers about ${coverMonths.toFixed(1)} months of predicted demand.` : ''}
              </p>
            </CardBody>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Portfolio forecast"
            subtitle={`Every tracked SKU, ${horizon}-month horizon`}
            action={
              <Badge tone={portfolio.avgMape < 12 ? 'ok' : 'warn'}>
                {portfolio.avgMape < 12 ? 'Meets the <12% MAPE target' : 'Above the 12% MAPE target'}
              </Badge>
            }
          />
          <Table>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Model</th>
                <th className="text-right">MAPE</th>
                <th className="text-right">Bias</th>
                <th className="text-right">Next month</th>
                <th>Peak</th>
                <th className="text-right">Suggested order</th>
              </tr>
            </thead>
            <tbody>
              {portfolio.results.map((row) => (
                <tr key={row.sku} className={row.sku === selectedSku ? 'bg-brand-50/60' : undefined}>
                  <td>
                    <a href={`/forecasting?sku=${encodeURIComponent(row.sku)}&horizon=${horizon}`} className="block hover:underline">
                      <p className="max-w-[190px] truncate text-xs font-semibold text-ink">{row.name}</p>
                      <p className="tnum text-[11px] text-ink-muted">{row.sku}</p>
                    </a>
                  </td>
                  <td className="text-[11px] text-ink-muted">{row.model}</td>
                  <td className="tnum text-right text-xs">
                    <Badge tone={row.mape < 12 ? 'ok' : row.mape < 20 ? 'warn' : 'danger'}>{row.mape}%</Badge>
                  </td>
                  <td className="tnum text-right text-xs text-ink-muted">
                    {row.bias > 0 ? '+' : ''}
                    {row.bias}%
                  </td>
                  <td className="tnum text-right text-xs font-semibold">{formatNumber(row.forecast[0].predicted)}</td>
                  <td className="text-xs text-ink-muted">{periodLabel(row.peakPeriod)}</td>
                  <td className="tnum text-right text-xs font-semibold">{formatNumber(row.recommendedOrderQty)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>

        <Card>
          <CardHeader title="How the models work" />
          <CardBody className="space-y-3 text-[11px] leading-relaxed text-ink-muted">
            <div>
              <p className="mb-1 text-xs font-semibold text-ink">1 · Holt-Winters (additive)</p>
              <p>
                Tracks level, trend and a 12-period seasonal cycle. The smoothing constants α, β and γ are chosen by grid search
                over one-step-ahead squared error rather than being fixed in advance.
              </p>
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold text-ink">2 · Additive decomposition</p>
              <p>
                An ordinary-least-squares linear trend plus per-month seasonal offsets learnt from the detrended residual — the
                same shape a Prophet additive model fits, without the runtime dependency.
              </p>
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold text-ink">3 · Backtest and blend</p>
              <p>
                Both models are fitted on all but the last six periods and scored against that hold-out. The ensemble weights
                each model by the inverse of its MAPE, so the more accurate one dominates; if one model wins decisively it is
                used on its own.
              </p>
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold text-ink">4 · Intervals and reorder quantity</p>
              <p>
                Prediction intervals come from in-sample residual variance and widen with √h. The suggested order is lead-time
                demand plus a 95% service-level safety stock.
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    </>
  )
}
