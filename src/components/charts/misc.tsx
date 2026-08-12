'use client'

import { useState } from 'react'
import { SEQUENTIAL_RAMP, makeFormatter, seriesColor, type ValueFormat } from './primitives'
import { cn } from '@/lib/utils'

/* ------------------------------------------------------------------ donut */

export interface DonutSlice {
  label: string
  value: number
  color?: string
}

/**
 * Donut with a hero number in the middle.
 *
 * Slices are separated by a 2px surface gap and every slice is direct-labelled
 * in the legend beside it, with its share printed — the ring itself is never
 * the only way to read the split.
 */
export function DonutChart({
  slices,
  total,
  centerLabel,
  centerValue,
  format,
  size = 168,
}: {
  slices: DonutSlice[]
  total?: number
  centerLabel?: string
  centerValue?: string
  format?: ValueFormat
  size?: number
}) {
  const [active, setActive] = useState<number | null>(null)

  const formatValue = makeFormatter(format)

  const sum = total ?? slices.reduce((s, slice) => s + slice.value, 0)
  if (sum <= 0) {
    return <p className="py-8 text-center text-xs text-ink-muted">No data to chart yet.</p>
  }

  const radius = 62
  const stroke = 18
  const circumference = 2 * Math.PI * radius
  // 2px visual gap, expressed along the circumference.
  const gap = 2

  let offset = 0

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
      <svg viewBox="0 0 160 160" width={size} height={size} className="shrink-0 -rotate-90" role="img" aria-label="Composition donut chart">
        <circle cx={80} cy={80} r={radius} fill="none" stroke="#f0f2f7" strokeWidth={stroke} />
        {slices.map((slice, i) => {
          const share = slice.value / sum
          const length = Math.max(0, share * circumference - gap)
          const dash = `${length} ${circumference - length}`
          const element = (
            <circle
              key={slice.label}
              cx={80}
              cy={80}
              r={radius}
              fill="none"
              stroke={slice.color ?? seriesColor(i)}
              strokeWidth={active === i ? stroke + 4 : stroke}
              strokeDasharray={dash}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
              className="cursor-pointer transition-[stroke-width]"
              onPointerEnter={() => setActive(i)}
              onPointerLeave={() => setActive(null)}
            />
          )
          offset += share * circumference
          return element
        })}
      </svg>

      <div className="min-w-0 flex-1">
        {centerValue ? (
          <div className="mb-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">{centerLabel}</p>
            <p className="tnum text-xl font-semibold text-ink">{centerValue}</p>
          </div>
        ) : null}
        <ul className="space-y-1.5">
          {slices.map((slice, i) => (
            <li
              key={slice.label}
              className={cn(
                'flex items-center justify-between gap-3 rounded-md px-1.5 py-1 transition-colors',
                active === i && 'bg-surface-sunken',
              )}
              onPointerEnter={() => setActive(i)}
              onPointerLeave={() => setActive(null)}
            >
              <span className="flex min-w-0 items-center gap-2">
                <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ background: slice.color ?? seriesColor(i) }} />
                <span className="truncate text-xs text-ink-muted">{slice.label}</span>
              </span>
              <span className="tnum shrink-0 text-xs font-semibold text-ink">
                {formatValue(slice.value)}
                <span className="ml-1.5 font-normal text-ink-muted">{((slice.value / sum) * 100).toFixed(0)}%</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

/* --------------------------------------------------------------- sparkline */

export function Sparkline({
  values,
  color = '#4f6ef7',
  width = 120,
  height = 32,
  ariaLabel = 'Trend sparkline',
}: {
  values: number[]
  color?: string
  width?: number
  height?: number
  ariaLabel?: string
}) {
  if (values.length < 2) return null

  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const x = (i: number) => (i / (values.length - 1)) * width
  const y = (v: number) => height - 3 - ((v - min) / range) * (height - 6)

  const path = values.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  const last = values[values.length - 1]

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} role="img" aria-label={ariaLabel} className="overflow-visible">
      <path d={`${path} L${width},${height} L0,${height} Z`} fill={color} opacity={0.1} />
      <path d={path} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={x(values.length - 1)} cy={y(last)} r={3} fill={color} stroke="#ffffff" strokeWidth={2} />
    </svg>
  )
}

/* ----------------------------------------------------------------- heatmap */

/**
 * Intensity grid on a single-hue ramp (light → dark = low → high).
 *
 * Each cell carries a `title` so the value is reachable without colour, and
 * cells are separated by a surface gap.
 */
export function Heatmap({
  rows,
  format,
  emptyLabel = 'No data',
}: {
  rows: { label: string; cells: { key: string; value: number }[] }[]
  format?: ValueFormat
  emptyLabel?: string
}) {
  if (rows.length === 0) return <p className="py-6 text-center text-xs text-ink-muted">{emptyLabel}</p>

  const formatValue = makeFormatter(format)

  const all = rows.flatMap((r) => r.cells.map((c) => c.value))
  const max = Math.max(...all, 1)

  const shade = (value: number) => {
    if (value <= 0) return '#f4f6fb'
    const index = Math.min(SEQUENTIAL_RAMP.length - 1, Math.floor((value / max) * SEQUENTIAL_RAMP.length))
    return SEQUENTIAL_RAMP[index]
  }

  return (
    <div className="space-y-1.5">
      {rows.map((row) => (
        <div key={row.label} className="flex items-center gap-3">
          <span className="w-28 shrink-0 truncate text-[11px] text-ink-muted">{row.label}</span>
          <div className="flex flex-1 gap-[2px]">
            {row.cells.map((cell) => (
              <div
                key={cell.key}
                title={`${row.label} · ${cell.key}: ${formatValue(cell.value)}`}
                className="h-6 flex-1 rounded-[3px] transition-transform hover:scale-y-125"
                style={{ background: shade(cell.value) }}
              />
            ))}
          </div>
        </div>
      ))}
      <div className="flex items-center justify-end gap-2 pt-1">
        <span className="text-[10px] text-ink-muted">Low</span>
        {SEQUENTIAL_RAMP.map((c) => (
          <span key={c} aria-hidden className="h-2.5 w-5 rounded-[2px]" style={{ background: c }} />
        ))}
        <span className="text-[10px] text-ink-muted">High</span>
      </div>
    </div>
  )
}
