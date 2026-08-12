'use client'

import { useMemo, useState } from 'react'
import { formatDate } from '@/lib/utils'
import type { ProjectTask } from '@/lib/types'

/**
 * Gantt timeline (F-07).
 *
 * Bars are laid out on a shared date scale; critical-path tasks get a heavier
 * outline and a marker in the row label, so the path is identifiable without
 * relying on colour. Milestones render as diamonds.
 */
export function GanttChart({
  tasks,
  criticalPathIds = [],
  assigneeNames = {},
  todayMarker = true,
}: {
  tasks: (ProjectTask & { onCriticalPath?: boolean })[]
  criticalPathIds?: string[]
  assigneeNames?: Record<string, string>
  todayMarker?: boolean
}) {
  const [hovered, setHovered] = useState<string | null>(null)

  const bounds = useMemo(() => {
    if (tasks.length === 0) return null
    const starts = tasks.map((t) => new Date(t.startDate).getTime())
    const ends = tasks.map((t) => new Date(t.endDate).getTime())
    const min = Math.min(...starts)
    const max = Math.max(...ends)
    const span = Math.max(1, max - min)
    return { min, max, span }
  }, [tasks])

  if (!bounds || tasks.length === 0) {
    return <p className="py-8 text-center text-xs text-ink-muted">No scheduled tasks for this project.</p>
  }

  const pct = (time: number) => ((time - bounds.min) / bounds.span) * 100
  const now = Date.now()
  const showToday = todayMarker && now >= bounds.min && now <= bounds.max

  const statusFill: Record<ProjectTask['status'], string> = {
    Done: '#047857',
    'In Progress': '#4f6ef7',
    Blocked: '#b03f7a',
    Todo: '#8898aa',
  }

  // Month ticks across the span.
  const monthTicks: { label: string; left: number }[] = []
  const cursor = new Date(bounds.min)
  cursor.setUTCDate(1)
  while (cursor.getTime() <= bounds.max) {
    const left = pct(cursor.getTime())
    if (left >= 0 && left <= 100) {
      monthTicks.push({ label: cursor.toLocaleDateString('en-GB', { month: 'short', timeZone: 'UTC' }), left })
    }
    cursor.setUTCMonth(cursor.getUTCMonth() + 1)
  }

  return (
    <div className="w-full">
      <div className="relative mb-2 ml-[190px] h-4 border-b border-ink-line">
        {monthTicks.map((tick) => (
          <span key={`${tick.label}-${tick.left}`} className="absolute -translate-x-1/2 text-[10px] text-ink-muted" style={{ left: `${tick.left}%` }}>
            {tick.label}
          </span>
        ))}
      </div>

      <ul className="space-y-1">
        {tasks.map((task) => {
          const start = new Date(task.startDate).getTime()
          const end = new Date(task.endDate).getTime()
          const left = pct(start)
          const width = Math.max(1.2, pct(end) - left)
          const critical = task.onCriticalPath ?? criticalPathIds.includes(task.id)

          return (
            <li
              key={task.id}
              className="group flex items-center gap-3 rounded-md px-1 py-1 hover:bg-surface-sunken"
              onPointerEnter={() => setHovered(task.id)}
              onPointerLeave={() => setHovered(null)}
            >
              <div className="flex w-[182px] shrink-0 items-center gap-1.5">
                {critical ? (
                  <span title="On the critical path" aria-label="On the critical path" className="text-[10px] font-bold text-danger">
                    ▲
                  </span>
                ) : (
                  <span aria-hidden className="w-[10px]" />
                )}
                <span className="truncate text-xs text-ink">{task.name}</span>
              </div>

              <div className="relative h-6 flex-1">
                {showToday ? (
                  <span aria-hidden className="absolute top-0 h-full border-l border-dashed border-brand-500/50" style={{ left: `${pct(now)}%` }} />
                ) : null}

                {task.isMilestone ? (
                  <span
                    className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[2px] border-2 border-white"
                    style={{ left: `${pct(end)}%`, background: statusFill[task.status] }}
                    title={`Milestone: ${task.name} — ${formatDate(task.endDate)}`}
                  />
                ) : null}

                <div
                  className="absolute top-1/2 h-3.5 -translate-y-1/2 rounded-[4px]"
                  style={{
                    left: `${left}%`,
                    width: `${width}%`,
                    background: statusFill[task.status],
                    opacity: task.status === 'Todo' ? 0.45 : 0.9,
                    outline: critical ? '2px solid #e5484d' : undefined,
                    outlineOffset: critical ? '1px' : undefined,
                  }}
                  title={`${task.name} · ${formatDate(task.startDate)} → ${formatDate(task.endDate)} · ${task.progressPct}%`}
                >
                  {task.progressPct > 0 && task.progressPct < 100 ? (
                    <div className="h-full rounded-[4px] bg-white/40" style={{ width: `${100 - task.progressPct}%`, marginLeft: `${task.progressPct}%` }} />
                  ) : null}
                </div>

                {hovered === task.id ? (
                  <div
                    className="pointer-events-none absolute -top-1 z-20 -translate-y-full whitespace-nowrap rounded-lg border border-ink-line bg-white px-2.5 py-1.5 text-[11px] shadow-pop"
                    style={{ left: `${Math.min(72, left)}%` }}
                  >
                    <p className="font-semibold text-ink">{task.name}</p>
                    <p className="text-ink-muted">
                      {formatDate(task.startDate)} → {formatDate(task.endDate)} · {task.progressPct}% · {task.status}
                    </p>
                    {task.assigneeId && assigneeNames[task.assigneeId] ? (
                      <p className="text-ink-muted">Owner: {assigneeNames[task.assigneeId]}</p>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <span className="tnum w-9 shrink-0 text-right text-[11px] text-ink-muted">{task.progressPct}%</span>
            </li>
          )
        })}
      </ul>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-ink-line pt-3">
        {(Object.keys(statusFill) as ProjectTask['status'][]).map((status) => (
          <span key={status} className="flex items-center gap-1.5">
            <span aria-hidden className="h-2.5 w-2.5 rounded-[3px]" style={{ background: statusFill[status] }} />
            <span className="text-[11px] text-ink-muted">{status}</span>
          </span>
        ))}
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="text-[10px] font-bold text-danger">▲</span>
          <span className="text-[11px] text-ink-muted">Critical path</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="h-2.5 w-2.5 rotate-45 rounded-[2px] bg-ink-muted" />
          <span className="text-[11px] text-ink-muted">Milestone</span>
        </span>
      </div>
    </div>
  )
}
