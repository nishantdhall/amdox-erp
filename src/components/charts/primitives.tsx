'use client'

import { useCallback, useRef, useState, type ReactNode } from 'react'
import { cn, formatMoney, formatNumber } from '@/lib/utils'
import type { CurrencyCode } from '@/lib/types'

/**
 * Chart foundations — scales, axes, legend and the shared hover layer.
 *
 * Charts are hand-rolled SVG rather than a charting library: it keeps the
 * dependency surface at zero (nothing to break on a Vercel build), and it lets
 * every mark follow the same spec — 2px strokes, 4px rounded data-ends, a 2px
 * surface gap between adjacent fills.
 */

/**
 * Categorical series colours, assigned in fixed order and never cycled.
 *
 * Validated for colour-vision deficiency: every adjacent pair clears the CVD
 * separation floor and the 3:1 contrast bar against a white surface. Because
 * the worst pair sits in the 6–8 ΔE band, every chart also carries a legend and
 * direct labels, so identity is never conveyed by colour alone.
 */
export const SERIES_COLORS = ['#4f6ef7', '#a45c00', '#047857', '#3b8fd6', '#b03f7a'] as const

/** Single-hue ramp for magnitude (heatmaps, intensity fills). */
export const SEQUENTIAL_RAMP = ['#e8edff', '#c3cfff', '#93a8fb', '#6b83f9', '#4f6ef7', '#3143ad'] as const

export const AXIS_COLOR = '#e0e5ef'
export const TEXT_MUTED = '#8898aa'

export function seriesColor(index: number): string {
  return SERIES_COLORS[index % SERIES_COLORS.length]
}

/* ------------------------------------------------------------ value format */

/**
 * Charts are client components, so they cannot take a formatter *function* as a
 * prop — functions do not cross the server/client boundary. Server pages pass
 * this serialisable descriptor instead and the chart builds the formatter.
 */
export type ValueFormat =
  | { kind: 'number'; dp?: number }
  | { kind: 'money'; currency: CurrencyCode; compact?: boolean }
  | { kind: 'percent'; dp?: number }
  | { kind: 'hours' }
  | { kind: 'days' }

export function makeFormatter(format: ValueFormat = { kind: 'number' }): (value: number) => string {
  switch (format.kind) {
    case 'money':
      return (value) => formatMoney(value, format.currency, format.compact ?? true)
    case 'percent':
      return (value) => `${value.toFixed(format.dp ?? 1)}%`
    case 'hours':
      return (value) => `${formatNumber(value, 1)}h`
    case 'days':
      return (value) => `${formatNumber(value)} d`
    case 'number':
    default:
      return (value) => formatNumber(value, format.dp ?? 0)
  }
}

/* ------------------------------------------------------------------ scales */

export interface Padding {
  top: number
  right: number
  bottom: number
  left: number
}

export const DEFAULT_PADDING: Padding = { top: 14, right: 18, bottom: 30, left: 62 }

/** "Nice" axis bounds and ticks — rounded to 1/2/5×10ⁿ steps. */
export function niceScale(min: number, max: number, tickCount = 5) {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return { min: 0, max: 1, ticks: [0, 1] }
  if (min === max) {
    const pad = Math.abs(min) || 1
    min -= pad
    max += pad
  }

  const range = max - min
  const roughStep = range / Math.max(1, tickCount - 1)
  const magnitude = 10 ** Math.floor(Math.log10(Math.abs(roughStep) || 1))
  const normalised = roughStep / magnitude
  const step = (normalised <= 1 ? 1 : normalised <= 2 ? 2 : normalised <= 5 ? 5 : 10) * magnitude

  const niceMin = Math.floor(min / step) * step
  const niceMax = Math.ceil(max / step) * step

  const ticks: number[] = []
  for (let v = niceMin; v <= niceMax + step / 2; v += step) ticks.push(Math.round(v * 1e6) / 1e6)

  return { min: niceMin, max: niceMax, ticks }
}

/* ----------------------------------------------------------------- legend */

export interface LegendItem {
  label: string
  color: string
  value?: string
}

export function ChartLegend({ items, className }: { items: LegendItem[]; className?: string }) {
  if (items.length === 0) return null
  return (
    <ul className={cn('flex flex-wrap items-center gap-x-4 gap-y-1.5', className)}>
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5">
          <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ background: item.color }} />
          <span className="text-[11px] font-medium text-ink-muted">{item.label}</span>
          {item.value ? <span className="tnum text-[11px] font-semibold text-ink">{item.value}</span> : null}
        </li>
      ))}
    </ul>
  )
}

/* ---------------------------------------------------------------- tooltip */

export interface TooltipState {
  x: number
  y: number
  title: string
  rows: { label: string; value: string; color?: string }[]
}

export function ChartTooltip({ state }: { state: TooltipState | null }) {
  if (!state) return null

  // Flip to the left of the cursor near the right edge so it never clips out.
  const flip = state.x > 62
  return (
    <div
      role="tooltip"
      className="pointer-events-none absolute z-20 min-w-[140px] -translate-y-1/2 rounded-lg border border-ink-line bg-white/97 px-2.5 py-2 shadow-pop backdrop-blur"
      style={{
        left: `${state.x}%`,
        top: `${state.y}%`,
        transform: `translate(${flip ? 'calc(-100% - 10px)' : '10px'}, -50%)`,
      }}
    >
      <p className="mb-1 text-[11px] font-semibold text-ink">{state.title}</p>
      <ul className="space-y-0.5">
        {state.rows.map((row) => (
          <li key={row.label} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5">
              {row.color ? <span aria-hidden className="h-2 w-2 rounded-[2px]" style={{ background: row.color }} /> : null}
              <span className="text-[11px] text-ink-muted">{row.label}</span>
            </span>
            <span className="tnum text-[11px] font-semibold text-ink">{row.value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Wraps an SVG chart, tracks pointer position and hosts the tooltip. */
export function ChartFrame({
  height = 250,
  viewWidth = 820,
  children,
  tooltip,
  onPointer,
  onLeave,
  ariaLabel,
}: {
  height?: number
  viewWidth?: number
  children: (dims: { width: number; height: number }) => ReactNode
  tooltip: TooltipState | null
  onPointer?: (ratioX: number, ratioY: number) => void
  onLeave?: () => void
  ariaLabel: string
}) {
  const ref = useRef<HTMLDivElement>(null)

  const handleMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!onPointer || !ref.current) return
      const rect = ref.current.getBoundingClientRect()
      if (rect.width === 0) return
      onPointer((event.clientX - rect.left) / rect.width, (event.clientY - rect.top) / rect.height)
    },
    [onPointer],
  )

  return (
    <div ref={ref} className="relative w-full" onPointerMove={handleMove} onPointerLeave={onLeave}>
      <svg
        viewBox={`0 0 ${viewWidth} ${height}`}
        width="100%"
        height={height}
        preserveAspectRatio="none"
        role="img"
        aria-label={ariaLabel}
        className="block touch-none select-none overflow-visible"
      >
        {children({ width: viewWidth, height })}
      </svg>
      <ChartTooltip state={tooltip} />
    </div>
  )
}

/* -------------------------------------------------------------------- axes */

export function GridLines({
  ticks,
  scaleY,
  left,
  right,
  formatTick,
}: {
  ticks: number[]
  scaleY: (v: number) => number
  left: number
  right: number
  formatTick: (v: number) => string
}) {
  return (
    <g aria-hidden>
      {ticks.map((tick) => {
        const y = scaleY(tick)
        return (
          <g key={tick}>
            <line x1={left} x2={right} y1={y} y2={y} stroke={AXIS_COLOR} strokeWidth={1} />
            <text x={left - 10} y={y + 3.5} textAnchor="end" fontSize={10} fill={TEXT_MUTED} className="tnum">
              {formatTick(tick)}
            </text>
          </g>
        )
      })}
    </g>
  )
}

export function XAxisLabels({
  labels,
  scaleX,
  y,
  maxLabels = 12,
}: {
  labels: string[]
  scaleX: (i: number) => number
  y: number
  maxLabels?: number
}) {
  const step = Math.max(1, Math.ceil(labels.length / maxLabels))
  return (
    <g aria-hidden>
      {labels.map((label, i) =>
        i % step === 0 || i === labels.length - 1 ? (
          <text key={`${label}-${i}`} x={scaleX(i)} y={y} textAnchor="middle" fontSize={10} fill={TEXT_MUTED}>
            {label}
          </text>
        ) : null,
      )}
    </g>
  )
}

/* ------------------------------------------------------------- hover hook */

export function useTooltip() {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)
  const clear = useCallback(() => setTooltip(null), [])
  return { tooltip, setTooltip, clear }
}
