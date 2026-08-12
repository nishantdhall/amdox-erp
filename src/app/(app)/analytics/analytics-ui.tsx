'use client'

import { useState } from 'react'
import { Badge, Card, CardBody, CardHeader, Table } from '@/components/ui/primitives'
import { seriesColor } from '@/components/charts/primitives'
import { formatNumber, toCsv } from '@/lib/utils'

export interface DrilldownSegment {
  key: string
  label: string
  value: number
  rows: Record<string, string>[]
}

/**
 * Click-through analytics (F-08): selecting a bar filters the table below it.
 * The whole interaction is client-side over already-loaded data, so a drill-down
 * is instant rather than a round trip.
 */
export function DrilldownTable({
  title,
  subtitle,
  data,
}: {
  title: string
  subtitle: string
  data: DrilldownSegment[]
}) {
  const [activeKey, setActiveKey] = useState<string | null>(null)
  const active = data.find((segment) => segment.key === activeKey) ?? null
  const rows = active?.rows ?? data.flatMap((segment) => segment.rows)
  const max = Math.max(...data.map((segment) => segment.value), 1)
  const headers = rows[0] ? Object.keys(rows[0]) : []

  const download = () => {
    const csv = toCsv(rows)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `amdox-${active ? active.key.toLowerCase() : 'all'}-headcount.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Card>
      <CardHeader
        title={title}
        subtitle={subtitle}
        action={
          <div className="flex items-center gap-2">
            {active ? (
              <button type="button" onClick={() => setActiveKey(null)} className="text-[11px] font-semibold text-brand-600 hover:underline">
                Clear filter
              </button>
            ) : null}
            <button
              type="button"
              onClick={download}
              className="rounded-lg border border-ink-line px-2.5 py-1.5 text-[11px] font-semibold text-ink transition-colors hover:bg-surface-sunken"
            >
              Export CSV
            </button>
          </div>
        }
      />
      <CardBody className="pt-4">
        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {data.map((segment, index) => {
            const selected = segment.key === activeKey
            return (
              <button
                key={segment.key}
                type="button"
                onClick={() => setActiveKey(selected ? null : segment.key)}
                aria-pressed={selected}
                className={`rounded-xl border p-3 text-left transition-colors ${
                  selected ? 'border-brand-500 bg-brand-50' : 'border-ink-line hover:bg-surface-sunken'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-[11px] font-medium text-ink-muted">{segment.label}</span>
                  <span aria-hidden className="h-2 w-2 shrink-0 rounded-[2px]" style={{ background: seriesColor(index) }} />
                </div>
                <p className="tnum mt-1 text-lg font-semibold text-ink">{formatNumber(segment.value)}</p>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${(segment.value / max) * 100}%`, background: seriesColor(index) }}
                  />
                </div>
              </button>
            )
          })}
        </div>

        <div className="mb-2 flex items-center gap-2">
          <Badge tone={active ? 'brand' : 'muted'}>{active ? active.label : 'All departments'}</Badge>
          <span className="text-[11px] text-ink-muted">{formatNumber(rows.length)} rows</span>
        </div>

        {rows.length === 0 ? (
          <p className="py-8 text-center text-xs text-ink-muted">No rows for this selection.</p>
        ) : (
          <div className="max-h-[360px] overflow-y-auto rounded-xl border border-ink-line">
            <Table>
              <thead className="sticky top-0">
                <tr>
                  {headers.map((header) => (
                    <th key={header}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 120).map((row, index) => (
                  <tr key={index}>
                    {headers.map((header) => (
                      <td key={header} className="text-xs">
                        {row[header]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </CardBody>
    </Card>
  )
}

const DATASETS = [
  { key: 'revenueSeries', label: 'Revenue series' },
  { key: 'departments', label: 'Departments' },
  { key: 'revenueByStream', label: 'Revenue by stream' },
  { key: 'expenseByCategory', label: 'Expenses by category' },
  { key: 'inventoryByCategory', label: 'Inventory by category' },
  { key: 'payrollTrend', label: 'Payroll trend' },
  { key: 'attendanceTrend', label: 'Attendance trend' },
]

/** Streams a CSV straight from the analytics API so exports match the API contract. */
export function ExportBar() {
  const [dataset, setDataset] = useState(DATASETS[0].key)

  return (
    <div className="flex items-center gap-2">
      <select
        aria-label="Dataset to export"
        className="input py-2 text-xs"
        value={dataset}
        onChange={(event) => setDataset(event.target.value)}
      >
        {DATASETS.map((entry) => (
          <option key={entry.key} value={entry.key}>
            {entry.label}
          </option>
        ))}
      </select>
      <a
        href={`/api/v1/analytics/summary?format=csv&dataset=${dataset}`}
        className="rounded-lg bg-brand-500 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-600"
      >
        Export CSV
      </a>
    </div>
  )
}
