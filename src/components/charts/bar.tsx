'use client'

import { useMemo, useState } from 'react'
import {
  AXIS_COLOR,
  ChartFrame,
  ChartLegend,
  DEFAULT_PADDING,
  GridLines,
  XAxisLabels,
  niceScale,
  seriesColor,
  useTooltip,
  makeFormatter,
  type ValueFormat,
} from './primitives'
import { cn } from '@/lib/utils'

export interface BarSeries {
  name: string
  values: number[]
  color?: string
}

/**
 * Grouped or stacked column chart.
 *
 * Bars keep a 2px surface gap between adjacent fills and 4px rounded ends at
 * the data end only, so the baseline stays a hard edge.
 */
export function BarChart({
  labels,
  series,
  height = 250,
  stacked = false,
  format,
  tickFormat,
  ariaLabel = 'Bar chart',
}: {
  labels: string[]
  series: BarSeries[]
  height?: number
  stacked?: boolean
  format?: ValueFormat
  tickFormat?: ValueFormat
  ariaLabel?: string
}) {
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
    const totals = stacked
      ? labels.map((_, i) => series.reduce((s, serie) => s + (serie.values[i] ?? 0), 0))
      : series.flatMap((s) => s.values)
    return niceScale(Math.min(0, ...totals), Math.max(...totals, 1), 5)
  }, [labels, series, stacked])

  const count = Math.max(1, labels.length)
  const slot = (innerRight - innerLeft) / count
  const groupWidth = Math.min(52, slot * 0.68)
  const barWidth = stacked ? groupWidth : Math.max(4, (groupWidth - 2 * (series.length - 1)) / series.length)

  const scaleY = (v: number) => innerBottom - ((v - min) / (max - min || 1)) * (innerBottom - innerTop)
  const groupCenter = (i: number) => innerLeft + slot * i + slot / 2

  const handlePointer = (ratioX: number, ratioY: number) => {
    const x = ratioX * viewWidth
    const index = Math.floor((x - innerLeft) / slot)
    if (index < 0 || index >= count) {
      clear()
      setActiveIndex(null)
      return
    }
    setActiveIndex(index)
    setTooltip({
      x: (groupCenter(index) / viewWidth) * 100,
      y: Math.max(8, Math.min(92, ratioY * 100)),
      title: labels[index],
      rows: series.map((s, i) => ({
        label: s.name,
        value: formatValue(s.values[index] ?? 0),
        color: s.color ?? seriesColor(i),
      })),
    })
  }

  return (
    <div>
      <ChartFrame height={height} viewWidth={viewWidth} tooltip={tooltip} onPointer={handlePointer} onLeave={() => { clear(); setActiveIndex(null) }} ariaLabel={ariaLabel}>
        {() => (
          <>
            <GridLines ticks={ticks} scaleY={scaleY} left={innerLeft} right={innerRight} formatTick={formatTick} />

            {labels.map((label, i) => {
              const center = groupCenter(i)
              let stackTop = scaleY(0)

              return (
                <g key={`${label}-${i}`} opacity={activeIndex === null || activeIndex === i ? 1 : 0.45}>
                  {series.map((s, si) => {
                    const value = s.values[i] ?? 0
                    const color = s.color ?? seriesColor(si)

                    if (stacked) {
                      const barHeight = Math.abs(scaleY(value) - scaleY(0))
                      // 2px surface gap between stacked segments.
                      const y = stackTop - barHeight
                      stackTop = y - 2
                      return (
                        <rect
                          key={s.name}
                          x={center - groupWidth / 2}
                          y={y}
                          width={groupWidth}
                          height={Math.max(0, barHeight)}
                          rx={si === series.length - 1 ? 4 : 0}
                          fill={color}
                        />
                      )
                    }

                    const barHeight = Math.max(0, scaleY(0) - scaleY(value))
                    const x = center - groupWidth / 2 + si * (barWidth + 2)
                    return (
                      <rect key={s.name} x={x} y={scaleY(value)} width={barWidth} height={barHeight} rx={4} fill={color} />
                    )
                  })}
                </g>
              )
            })}

            <line x1={innerLeft} x2={innerRight} y1={innerBottom} y2={innerBottom} stroke={AXIS_COLOR} strokeWidth={1} />
            <XAxisLabels labels={labels} scaleX={groupCenter} y={height - 8} />
          </>
        )}
      </ChartFrame>
      <ChartLegend items={series.map((s, i) => ({ label: s.name, color: s.color ?? seriesColor(i) }))} className="mt-3 pl-1" />
    </div>
  )
}

/**
 * Horizontal ranked bars.
 *
 * Categories are direct-labelled and values sit at the end of each bar, so no
 * legend is needed and colour never carries the identity on its own.
 */
export function RankedBars({
  data,
  format,
  color,
  max: explicitMax,
  emptyLabel = 'No data available',
  className,
}: {
  data: { label: string; value: number; tone?: string }[]
  format?: ValueFormat
  color?: string
  max?: number
  emptyLabel?: string
  className?: string
}) {
  if (data.length === 0) {
    return <p className={cn('px-1 py-6 text-center text-xs text-ink-muted', className)}>{emptyLabel}</p>
  }

  const max = explicitMax ?? Math.max(...data.map((d) => Math.abs(d.value)), 1)
  const formatValue = makeFormatter(format)

  return (
    <ul className={cn('space-y-2.5', className)}>
      {data.map((row, i) => {
        const pct = Math.max(1.5, (Math.abs(row.value) / max) * 100)
        return (
          <li key={row.label}>
            <div className="mb-1 flex items-baseline justify-between gap-3">
              <span className="truncate text-xs font-medium text-ink">{row.label}</span>
              <span className="tnum shrink-0 text-xs font-semibold text-ink">{formatValue(row.value)}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-surface-sunken">
              <div
                className="h-full rounded-full transition-[width] duration-500"
                style={{ width: `${pct}%`, background: row.tone ?? color ?? seriesColor(i) }}
              />
            </div>
          </li>
        )
      })}
    </ul>
  )
}
