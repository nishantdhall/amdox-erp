import type { DemandPoint, DemandSeries, ForecastPoint, ForecastResult } from '../types'
import { addMonths, round } from '../utils'

/**
 * Demand forecasting engine (F-06).
 *
 * Two models are fitted and blended:
 *
 *  1. **Holt-Winters** additive triple exponential smoothing — captures level,
 *     trend and 12-month seasonality. Smoothing parameters are chosen by grid
 *     search over one-step-ahead SSE rather than hardcoded.
 *  2. **Additive decomposition** ("Prophet-style") — OLS linear trend plus
 *     per-month seasonal offsets learnt from the detrended residual.
 *
 * Both are backtested on a hold-out tail; the ensemble weights each model by
 * the inverse of its MAPE, so the more accurate model dominates. Prediction
 * intervals widen with the horizon, derived from in-sample residual variance.
 *
 * Everything runs in-process in TypeScript — no Python service to keep alive,
 * which is what makes the whole platform deployable as a single Vercel app.
 */

const SEASON = 12
const HOLDOUT = 6
/** 95% normal quantile, used for both prediction intervals and safety stock. */
const Z95 = 1.96

/* --------------------------------------------------------------- Holt-Winters */

interface SmoothingFit {
  fitted: number[]
  forecast: number[]
  params: { alpha: number; beta: number; gamma: number }
  sse: number
}

function holtWinters(y: number[], h: number, alpha: number, beta: number, gamma: number): SmoothingFit {
  const n = y.length
  const m = Math.min(SEASON, Math.floor(n / 2))

  const firstCycle = y.slice(0, m)
  const secondCycle = y.slice(m, m * 2)
  const mean = (a: number[]) => a.reduce((s, v) => s + v, 0) / Math.max(1, a.length)

  let level = mean(firstCycle)
  let trend = secondCycle.length ? (mean(secondCycle) - mean(firstCycle)) / m : 0

  const seasonal = new Array<number>(n + m).fill(0)
  for (let i = 0; i < m; i++) seasonal[i] = firstCycle[i] - level

  const fitted: number[] = []
  let sse = 0

  for (let t = 0; t < n; t++) {
    const prediction = level + trend + seasonal[t]
    fitted.push(prediction)
    if (t >= m) sse += (y[t] - prediction) ** 2 // skip the initialisation cycle

    const prevLevel = level
    level = alpha * (y[t] - seasonal[t]) + (1 - alpha) * (level + trend)
    trend = beta * (level - prevLevel) + (1 - beta) * trend
    seasonal[t + m] = gamma * (y[t] - level) + (1 - gamma) * seasonal[t]
  }

  const forecast: number[] = []
  for (let i = 1; i <= h; i++) {
    const seasonalIdx = n + ((i - 1) % m)
    forecast.push(level + i * trend + seasonal[seasonalIdx])
  }

  return { fitted, forecast, params: { alpha, beta, gamma }, sse }
}

/** Grid search the smoothing constants that minimise one-step-ahead SSE. */
function fitHoltWinters(y: number[], h: number): SmoothingFit {
  const grid = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]
  let best: SmoothingFit | null = null

  for (const alpha of grid) {
    for (const beta of grid) {
      for (const gamma of grid) {
        const fit = holtWinters(y, h, alpha, beta, gamma)
        if (!Number.isFinite(fit.sse)) continue
        if (!best || fit.sse < best.sse) best = fit
      }
    }
  }

  return best ?? holtWinters(y, h, 0.3, 0.1, 0.3)
}

/* ------------------------------------------------------ additive decomposition */

function fitAdditive(y: number[], h: number): { fitted: number[]; forecast: number[]; slope: number; intercept: number } {
  const n = y.length

  // Ordinary least squares on t → y.
  const meanT = (n - 1) / 2
  const meanY = y.reduce((s, v) => s + v, 0) / n
  let num = 0
  let den = 0
  for (let t = 0; t < n; t++) {
    num += (t - meanT) * (y[t] - meanY)
    den += (t - meanT) ** 2
  }
  const slope = den === 0 ? 0 : num / den
  const intercept = meanY - slope * meanT

  // Average detrended residual per season index.
  const buckets: number[][] = Array.from({ length: SEASON }, () => [])
  for (let t = 0; t < n; t++) buckets[t % SEASON].push(y[t] - (intercept + slope * t))
  const seasonal = buckets.map((b) => (b.length ? b.reduce((s, v) => s + v, 0) / b.length : 0))

  const fitted = y.map((_, t) => intercept + slope * t + seasonal[t % SEASON])
  const forecast: number[] = []
  for (let i = 1; i <= h; i++) {
    const t = n - 1 + i
    forecast.push(intercept + slope * t + seasonal[t % SEASON])
  }

  return { fitted, forecast, slope, intercept }
}

/* ------------------------------------------------------------------- accuracy */

/** Mean absolute percentage error, ignoring zero actuals. */
export function mape(actual: number[], predicted: number[]): number {
  let total = 0
  let count = 0
  for (let i = 0; i < actual.length; i++) {
    if (actual[i] === 0) continue
    total += Math.abs((actual[i] - predicted[i]) / actual[i])
    count++
  }
  return count === 0 ? 0 : round((total / count) * 100, 2)
}

/** Mean signed error as a percentage — positive means the model under-forecasts. */
function biasPct(actual: number[], predicted: number[]): number {
  const actualSum = actual.reduce((s, v) => s + v, 0)
  if (actualSum === 0) return 0
  const diff = actual.reduce((s, v, i) => s + (v - predicted[i]), 0)
  return round((diff / actualSum) * 100, 2)
}

function stdDev(values: number[]): number {
  if (values.length < 2) return 0
  const mean = values.reduce((s, v) => s + v, 0) / values.length
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / (values.length - 1)
  return Math.sqrt(variance)
}

/* ---------------------------------------------------------------- entry point */

export interface ForecastOptions {
  horizonMonths?: number
  leadTimeDays?: number
  /** Force a single model instead of the ensemble. */
  model?: ForecastResult['model']
}

export function forecastDemand(series: DemandSeries, options: ForecastOptions = {}): ForecastResult {
  const horizon = Math.max(1, Math.min(12, options.horizonMonths ?? 6))
  const leadTimeDays = options.leadTimeDays ?? 21
  const history = series.history
  const y = history.map((p) => p.qty)

  if (y.length < SEASON + 2) {
    // Not enough history for seasonality — fall back to a flat mean forecast.
    const mean = y.reduce((s, v) => s + v, 0) / Math.max(1, y.length)
    const lastPeriod = history[history.length - 1]?.period ?? '2026-01'
    return {
      sku: series.sku,
      name: series.name,
      model: 'Holt-Winters',
      generatedAt: new Date().toISOString(),
      horizonMonths: horizon,
      mape: 0,
      bias: 0,
      history,
      fitted: history.map((p) => ({ period: p.period, qty: round(mean) })),
      forecast: Array.from({ length: horizon }, (_, i) => ({
        period: addMonths(lastPeriod, i + 1),
        predicted: round(mean),
        lower: round(mean * 0.8),
        upper: round(mean * 1.2),
      })),
      recommendedOrderQty: Math.ceil(mean),
      peakPeriod: lastPeriod,
      params: {},
    }
  }

  /* --- backtest both models on a hold-out tail to derive ensemble weights --- */
  const train = y.slice(0, y.length - HOLDOUT)
  const test = y.slice(y.length - HOLDOUT)

  const hwBack = fitHoltWinters(train, HOLDOUT)
  const addBack = fitAdditive(train, HOLDOUT)
  const hwMape = mape(test, hwBack.forecast)
  const addMape = mape(test, addBack.forecast)

  // Inverse-error weighting; the epsilon keeps a perfect fit from dividing by zero.
  const wHw = 1 / (hwMape + 1e-6)
  const wAdd = 1 / (addMape + 1e-6)
  const totalWeight = wHw + wAdd
  const alphaHw = wHw / totalWeight

  const chosen: ForecastResult['model'] =
    options.model ?? (hwMape < addMape * 0.75 ? 'Holt-Winters' : addMape < hwMape * 0.75 ? 'Prophet-style Additive' : 'Ensemble')

  const blend = (a: number, b: number) => {
    if (chosen === 'Holt-Winters') return a
    if (chosen === 'Prophet-style Additive') return b
    return a * alphaHw + b * (1 - alphaHw)
  }

  const ensembleBacktest = test.map((_, i) => blend(hwBack.forecast[i], addBack.forecast[i]))
  const backtestMape = mape(test, ensembleBacktest)
  const backtestBias = biasPct(test, ensembleBacktest)

  /* --- refit on the full series for the live forecast --- */
  const hwFull = fitHoltWinters(y, horizon)
  const addFull = fitAdditive(y, horizon)

  const fittedValues = y.map((_, i) => Math.max(0, blend(hwFull.fitted[i], addFull.fitted[i])))
  const residuals = y.slice(SEASON).map((v, i) => v - fittedValues[i + SEASON])
  const sigma = stdDev(residuals)

  const lastPeriod = history[history.length - 1].period
  const forecast: ForecastPoint[] = []
  for (let i = 0; i < horizon; i++) {
    const predicted = Math.max(0, blend(hwFull.forecast[i], addFull.forecast[i]))
    // Interval widens with √h, the standard random-walk error accumulation.
    const spread = Z95 * sigma * Math.sqrt(1 + i * 0.35)
    forecast.push({
      period: addMonths(lastPeriod, i + 1),
      predicted: round(predicted),
      lower: round(Math.max(0, predicted - spread)),
      upper: round(predicted + spread),
    })
  }

  /* --- reorder recommendation: lead-time demand + safety stock --- */
  const leadTimeMonths = leadTimeDays / 30
  const monthlyDemand = forecast[0].predicted
  const leadTimeDemand = monthlyDemand * leadTimeMonths
  const safetyStock = Z95 * sigma * Math.sqrt(leadTimeMonths)
  const recommendedOrderQty = Math.max(0, Math.ceil(leadTimeDemand + safetyStock))

  const peak = forecast.reduce((best, p) => (p.predicted > best.predicted ? p : best), forecast[0])

  return {
    sku: series.sku,
    name: series.name,
    model: chosen,
    generatedAt: new Date().toISOString(),
    horizonMonths: horizon,
    mape: backtestMape,
    bias: backtestBias,
    history,
    fitted: history.map((p, i) => ({ period: p.period, qty: round(fittedValues[i]) })),
    forecast,
    recommendedOrderQty,
    peakPeriod: peak.period,
    params: {
      alpha: hwFull.params.alpha,
      beta: hwFull.params.beta,
      gamma: hwFull.params.gamma,
      trendSlope: round(addFull.slope, 3),
      ensembleWeightHoltWinters: round(chosen === 'Ensemble' ? alphaHw : chosen === 'Holt-Winters' ? 1 : 0, 3),
      residualSigma: round(sigma, 2),
      holtWintersMape: hwMape,
      additiveMape: addMape,
    },
  }
}

/** Portfolio-level accuracy summary shown on the AI Forecast screen. */
export function forecastPortfolio(seriesList: DemandSeries[], options: ForecastOptions = {}) {
  const results = seriesList.map((s) => forecastDemand(s, options))
  const avgMape = results.length ? round(results.reduce((s, r) => s + r.mape, 0) / results.length, 2) : 0
  return { results, avgMape }
}

export type { DemandPoint }
