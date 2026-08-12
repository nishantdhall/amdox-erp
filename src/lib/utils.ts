import type { CurrencyCode } from './types'

/* ----------------------------------------------------------------- classnames */

export function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ')
}

/* ---------------------------------------------------------------------- money */

const CURRENCY_LOCALE: Record<CurrencyCode, string> = {
  INR: 'en-IN',
  USD: 'en-US',
  EUR: 'de-DE',
  GBP: 'en-GB',
  AED: 'en-AE',
  SGD: 'en-SG',
}

export function formatMoney(value: number, currency: CurrencyCode = 'INR', compact = false): string {
  return new Intl.NumberFormat(CURRENCY_LOCALE[currency] ?? 'en-IN', {
    style: 'currency',
    currency,
    notation: compact ? 'compact' : 'standard',
    maximumFractionDigits: compact ? 1 : 2,
    minimumFractionDigits: compact ? 0 : 2,
  }).format(value)
}

export function formatNumber(value: number, dp = 0): string {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
  }).format(value)
}

export function formatPercent(value: number, dp = 1): string {
  return `${value >= 0 ? '' : ''}${value.toFixed(dp)}%`
}

/* ---------------------------------------------------------------------- dates */

export function today(): Date {
  return new Date()
}

export function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export function toPeriod(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d
  return date.toISOString().slice(0, 7)
}

export function addDays(d: Date, n: number): Date {
  const out = new Date(d)
  out.setUTCDate(out.getUTCDate() + n)
  return out
}

export function addMonths(period: string, n: number): string {
  const [y, m] = period.split('-').map(Number)
  const d = new Date(Date.UTC(y, m - 1 + n, 1))
  return d.toISOString().slice(0, 7)
}

export function periodLabel(period: string): string {
  const [y, m] = period.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('en-GB', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  })
}

export function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000)
}

/** Working days between two ISO dates, inclusive, skipping Sat/Sun. */
export function workingDays(from: string, to: string): number {
  let count = 0
  const end = new Date(to)
  for (let d = new Date(from); d <= end; d = addDays(d, 1)) {
    const day = d.getUTCDay()
    if (day !== 0 && day !== 6) count++
  }
  return count
}

/* ---------------------------------------------------------------------- misc */

export function round(value: number, dp = 2): number {
  const f = 10 ** dp
  return Math.round((value + Number.EPSILON) * f) / f
}

export function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0)
}

export function groupBy<T, K extends string>(items: T[], key: (item: T) => K): Record<K, T[]> {
  return items.reduce((acc, item) => {
    const k = key(item)
    ;(acc[k] ||= []).push(item)
    return acc
  }, {} as Record<K, T[]>)
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
}

/** RFC 4180 CSV export used by the BI module (F-08). */
export function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return ''
  const headers = Object.keys(rows[0])
  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? '' : String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  return [headers.join(','), ...rows.map((r) => headers.map((h) => escape(r[h])).join(','))].join('\n')
}
