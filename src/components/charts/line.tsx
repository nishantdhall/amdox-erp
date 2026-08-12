'use client'

import { useMemo, useState } from 'react'
import {
  ChartFrame,
  ChartLegend,
  DEFAULT_PADDING,
  GridLines,
  XAxisLabels,
  niceScale,
  seriesColor,
  useTooltip,
  AXIS_COLOR,
  makeFormatter,
  type ValueFormat,
} from './primitives'

export interface LineSeries {
  name: string
  values: number[]
  color?: string
  /** Render as a dashed line — used for fitted/model output against actuals. */
  dashed?: boolean
  area?: boolean
}

export interface LineChartProps {
  labels: string[]
  series: LineSeries[]
  height?: number
  format?: ValueFormat
  tickFormat?: ValueFormat
  /** Index from which the series is a projection rather than an actual. */
  forecastFrom?: number
  /** Shaded prediction interval, aligned to `labels`. */
  band?: { lower: (number | null)[]; upper: (number | null)[]; color?: string; label?: string }
  ariaLabel?: string
}

/**
 * Multi-series line chart with a crosshair tooltip.
 *
 * Every series shares one y-axis — a second scale would make two different
 * measures look comparable when they are not.
 */
export function LineChart({
  labels,
  series,
  height = 250,
  format,
  tickFormat,
  forecastFrom,
  band,
  ariaLabel = 'Line chart',
}: LineChartProps) {
  const { tooltip, setTooltip, clear } = useTooltip()
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const formatValue = makeFormatter(format)
  const formatTick = makeFormatter(tickFormat ?? format)

  const pad = DEFAULT_PADDING
  const viewWidth = 820
  const innerLeft = pad.left
  const innerRight = viewWidth - pad.right
  const innerTop = pad.top
  const innerBottom = height - pad.bottom

  const { min, max, ticks } = useMemo(() => {
    const all = series.flatMap((s) => s.values).filter((v) => Number.isFinite(v))
    if (band) {
      all.push(...band.lower.filter((v): v is number => v !== null))
      all.push(...band.upper.filter((v): v is number => v !== null))
    }
    const lo = Math.min(0, ...all)
    const hi = Math.max(...all, 1)
    return niceScale(lo, hi, 5)
  }, [series, band])

  const count = Math.max(1, labels.length)
  const scaleX = (i: number) => (count === 1 ? (innerLeft + innerRight) / 2 : innerLeft + (i / (count - 1)) * (innerRight - innerLeft))
  const scaleY = (v: number) => innerBottom - ((v - min) / (max - min || 1)) * (innerBottom - innerTop)

  const buildPath = (values: number[]) =>
    values
      .map((v, i) => (Number.isFinite(v) ? `${i === 0 || !Number.isFinite(values[i - 1]) ? 'M' : 'L'}${scaleX(i)},${scaleY(v)}` : ''))
      .join(' ')
      .trim()

  const handlePointer = (ratioX: number, ratioY: number) => {
    const x = ratioX * viewWidth
    if (x < innerLeft - 20 || x > innerRight + 20) {
      clear()
      setActiveIndex(null)
      return
    }

    const raw = ((x - innerLeft) / (innerRight - innerLeft)) * (count - 1)
    const index = Math.max(0, Math.min(count - 1, Math.round(raw)))
    setActiveIndex(index)

    setTooltip({
      x: (scaleX(index) / viewWidth) * 100,
      y: Math.max(8, Math.min(92, ratioY * 100)),
      title: labels[index] ?? '',
      rows: series
        .filter((s) => Number.isFinite(s.values[index]))
        .map((s, i) => ({
          label: s.name,
          value: formatValue(s.values[index]),
          color: s.color ?? seriesColor(i),
        })),
    })
  }

  const bandPath = useMemo(() => {
    if (!band) return null
    const upper = band.upper.map((v, i) => (v === null ? null : `${scaleX(i)},${scaleY(v)}`)).filter(Boolean) as string[]
    const lower = band.lower
      .map((v, i) => (v === null ? null : `${scaleX(i)},${scaleY(v)}`))
      .filter(Boolean)
      .reverse() as string[]
    if (upper.length === 0) return null
    return `M${upper.join(' L')} L${lower.join(' L')} Z`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [band, min, max, count, height])

  const legendItems = [
    ...series.map((s, i) => ({ label: s.name, color: s.color ?? seriesColor(i) })),
    ...(band?.label ? [{ label: band.label, color: band.color ?? '#c3cfff' }] : []),
  ]

  return (
    <div>
      <ChartFrame height={height} viewWidth={viewWidth} tooltip={tooltip} onPointer={handlePointer} onLeave={() => { clear(); setActiveIndex(null) }} ariaLabel={ariaLabel}>
        {() => (
          <>
            <GridLines ticks={ticks} scaleY={scaleY} left={innerLeft} right={innerRight} formatTick={formatTick} />

            {/* Projection region gets a tinted backdrop so actual vs predicted is structural, not colour-only. */}
            {forecastFrom !== undefined && forecastFrom < count ? (
              <>
                <rect
                  x={scaleX(forecastFrom)}
                  y={innerTop}
                  width={Math.max(0, innerRight - scaleX(forecastFrom))}
                  height={innerBottom - innerTop}
                  fill="#4f6ef7"
                  opacity={0.045}
                />
                <line x1={scaleX(forecastFrom)} x2={scaleX(forecastFrom)} y1={innerTop} y2={innerBottom} stroke={AXIS_COLOR} strokeWidth={1} strokeDasharray="3 3" />
                <text x={scaleX(forecastFrom) + 6} y={innerTop + 11} fontSize={9.5} fill="#8898aa" fontWeight={600}>
                  FORECAST
                </text>
              </>
            ) : null}

            {bandPath ? <path d={bandPath} fill={band?.color ?? '#93a8fb'} opacity={0.22} /> : null}

            {series.map((s, i) => {
              const color = s.color ?? seriesColor(i)
              const path = buildPath(s.values)
              if (!path) return null
              return (
                <g key={s.name}>
                  {s.area ? (
                    <path
                      d={`${path} L${scaleX(s.values.length - 1)},${innerBottom} L${scaleX(0)},${innerBottom} Z`}
                      fill={color}
                      opacity={0.1}
                    />
                  ) : null}
                  <path
                    d={path}
                    fill="none"
                    stroke={color}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray={s.dashed ? '5 4' : undefined}
                  />
                </g>
              )
            })}

            {activeIndex !== null ? (
              <g>
                <line x1={scaleX(activeIndex)} x2={scaleX(activeIndex)} y1={innerTop} y2={innerBottom} stroke="#8898aa" strokeWidth={1} strokeDasharray="3 3" />
                {series.map((s, i) =>
                  Number.isFinite(s.values[activeIndex]) ? (
                    // 2px surface ring keeps overlapping markers separable.
                    <circle
                      key={s.name}
                      cx={scaleX(activeIndex)}
                      cy={scaleY(s.values[activeIndex])}
                      r={4.5}
                      fill={s.color ?? seriesColor(i)}
                      stroke="#ffffff"
                      strokeWidth={2}
                    />
                  ) : null,
                )}
              </g>
            ) : null}

            <line x1={innerLeft} x2={innerRight} y1={innerBottom} y2={innerBottom} stroke={AXIS_COLOR} strokeWidth={1} />
            <XAxisLabels labels={labels} scaleX={scaleX} y={height - 8} />
          </>
        )}
      </ChartFrame>
      <ChartLegend items={legendItems} className="mt-3 pl-1" />
    </div>
  )
}
