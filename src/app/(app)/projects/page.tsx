import type { Metadata } from 'next'
import { requireSession } from '@/lib/auth/session'
import { can } from '@/lib/auth/rbac'
import { getTenant, listEmployees, listProjects, listTasks } from '@/lib/db/repo'
import { budgetVariance, criticalPath, hasCycle, resourceUtilisation } from '@/lib/domain/projects'
import { Badge, Card, CardBody, CardHeader, EmptyState, KeyValue, PageHeader, Progress, StatTile, StatusBadge, Table } from '@/components/ui/primitives'
import { GanttChart } from '@/components/charts/gantt'
import { RankedBars } from '@/components/charts/bar'
import { ActionButton } from '@/components/ui/action'
import { updateTaskAction } from '@/app/(app)/actions'
import { formatDate, formatMoney, formatNumber } from '@/lib/utils'

export const metadata: Metadata = { title: 'Projects' }
export const dynamic = 'force-dynamic'

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const params = await searchParams
  const session = await requireSession()
  const tenant = getTenant(session.tenantId)
  const currency = tenant.baseCurrency

  const projects = listProjects(session.tenantId)
  if (projects.length === 0) {
    return (
      <>
        <PageHeader title="Projects" description="No projects exist for this tenant yet." />
        <Card>
          <EmptyState title="No projects" description="Projects are seeded per tenant; this one has none." icon="▦" />
        </Card>
      </>
    )
  }

  const selected = projects.find((p) => p.id === params.id) ?? projects[0]
  const tasks = listTasks(session.tenantId, selected.id)
  const allTasks = listTasks(session.tenantId)

  const path = criticalPath(tasks)
  const acyclic = !hasCycle(tasks)
  const utilisation = resourceUtilisation(allTasks)
  const variance = budgetVariance(selected)

  const employees = listEmployees(session.tenantId)
  const employeeNames = Object.fromEntries(employees.map((e) => [e.id, `${e.firstName} ${e.lastName}`]))
  const manager = employees.find((e) => e.id === selected.managerId)

  const totalBudget = projects.reduce((s, p) => s + p.budget, 0)
  const totalActual = projects.reduce((s, p) => s + p.actualCost, 0)
  const overrunning = projects.filter((p) => budgetVariance(p).overrun)

  const utilisationRows = [...utilisation.entries()]
    .map(([id, pct]) => ({ label: employeeNames[id] ?? 'Unassigned', value: pct }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)

  const canManage = can(session, 'project.manage')

  return (
    <>
      <PageHeader
        title="Projects"
        description="Delivery tracking with dependency validation, critical-path analysis and budget variance alerts."
        meta={
          <>
            <Badge tone="muted">{formatNumber(projects.length)} projects</Badge>
            <Badge tone={overrunning.length > 0 ? 'danger' : 'ok'}>{formatNumber(overrunning.length)} over budget by &gt;10%</Badge>
            <Badge tone={acyclic ? 'ok' : 'danger'}>{acyclic ? 'Dependency graph is acyclic' : 'Cycle detected'}</Badge>
          </>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Portfolio budget" value={formatMoney(totalBudget, currency, true)} icon="◫" />
        <StatTile
          label="Actual to date"
          value={formatMoney(totalActual, currency, true)}
          tone={totalActual > totalBudget ? 'danger' : 'ok'}
          hint={`${((totalActual / Math.max(1, totalBudget)) * 100).toFixed(0)}% of budget consumed`}
          icon="↧"
        />
        <StatTile label="Active projects" value={formatNumber(projects.filter((p) => p.status === 'Active' || p.status === 'At Risk').length)} icon="▦" />
        <StatTile
          label="Blocked tasks"
          value={formatNumber(allTasks.filter((t) => t.status === 'Blocked').length)}
          tone={allTasks.some((t) => t.status === 'Blocked') ? 'warn' : 'ok'}
          icon="⚠"
        />
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-[320px_1fr]">
        <Card>
          <CardHeader title="Portfolio" subtitle="Select a project to inspect" />
          <CardBody className="space-y-1.5">
            {projects.map((project) => {
              const projectVariance = budgetVariance(project)
              return (
                <a
                  key={project.id}
                  href={`/projects?id=${project.id}`}
                  className={`block rounded-lg border px-3 py-2.5 transition-colors ${
                    selected.id === project.id ? 'border-brand-500 bg-brand-50' : 'border-ink-line hover:bg-surface-sunken'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-ink">{project.name}</p>
                      <p className="truncate text-[11px] text-ink-muted">
                        {project.code} · {project.clientName}
                      </p>
                    </div>
                    <StatusBadge status={project.status} />
                  </div>
                  <div className="mt-2">
                    <Progress value={project.progressPct} tone={projectVariance.overrun ? 'danger' : 'brand'} />
                    <p className="tnum mt-1 text-[10px] text-ink-muted">
                      {project.progressPct}% · {formatMoney(project.actualCost, currency, true)} of{' '}
                      {formatMoney(project.budget, currency, true)}
                    </p>
                  </div>
                </a>
              )
            })}
          </CardBody>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader
              title={selected.name}
              subtitle={`${selected.code} · ${selected.clientName}`}
              action={<StatusBadge status={selected.status} />}
            />
            <CardBody>
              <KeyValue
                items={[
                  { label: 'Manager', value: manager ? `${manager.firstName} ${manager.lastName}` : '—' },
                  { label: 'Timeline', value: `${formatDate(selected.startDate)} → ${formatDate(selected.endDate)}` },
                  { label: 'Budget', value: formatMoney(selected.budget, currency, true) },
                  { label: 'Actual cost', value: formatMoney(selected.actualCost, currency, true) },
                  {
                    label: 'Variance',
                    value: (
                      <span className={variance.overrun ? 'text-danger' : variance.variancePct > 0 ? 'text-warn' : 'text-ok'}>
                        {variance.variancePct > 0 ? '+' : ''}
                        {variance.variancePct}% ({formatMoney(variance.variance, currency, true)})
                      </span>
                    ),
                  },
                  { label: 'Forecast at completion', value: formatMoney(variance.forecastAtCompletion, currency, true) },
                  { label: 'Tasks', value: `${tasks.filter((t) => t.status === 'Done').length} of ${tasks.length} complete` },
                  { label: 'Critical path', value: `${path.size} task${path.size === 1 ? '' : 's'}` },
                ]}
              />
              {variance.overrun ? (
                <p className="mt-3 rounded-lg border border-danger/20 bg-danger-soft px-3 py-2 text-[11px] font-medium text-danger">
                  Budget overrun alert — actual cost exceeds the approved budget by more than 10%, the threshold defined in the
                  acceptance criteria.
                </p>
              ) : null}
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Schedule"
              subtitle="Bars show planned duration; the shaded portion is remaining work"
              action={<Badge tone="muted">{formatNumber(tasks.length)} tasks</Badge>}
            />
            <CardBody>
              <GanttChart tasks={tasks} criticalPathIds={[...path]} assigneeNames={employeeNames} />
            </CardBody>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader title="Tasks" subtitle="Dependencies are validated as a DAG before any status change is accepted" />
          {tasks.length === 0 ? (
            <EmptyState title="No tasks" description="This project has no scheduled work." icon="▦" />
          ) : (
            <Table>
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Owner</th>
                  <th>Window</th>
                  <th className="text-right">Hours</th>
                  <th className="min-w-[100px]">Progress</th>
                  <th>Status</th>
                  {canManage ? <th aria-label="Actions" /> : null}
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task.id}>
                    <td>
                      <div className="flex items-center gap-1.5">
                        {path.has(task.id) ? (
                          <span title="On the critical path" className="text-[10px] font-bold text-danger">
                            ▲
                          </span>
                        ) : null}
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-ink">{task.name}</p>
                          {task.isMilestone ? <Badge tone="brand">milestone</Badge> : null}
                        </div>
                      </div>
                    </td>
                    <td className="max-w-[140px] truncate text-xs text-ink-muted">
                      {task.assigneeId ? employeeNames[task.assigneeId] ?? '—' : '—'}
                    </td>
                    <td className="text-[11px] text-ink-muted">
                      {formatDate(task.startDate)} → {formatDate(task.endDate)}
                    </td>
                    <td className="tnum text-right text-xs text-ink-muted">
                      {task.loggedHours}/{task.estimateHours}
                    </td>
                    <td>
                      <Progress value={task.progressPct} tone={task.status === 'Blocked' ? 'danger' : task.status === 'Done' ? 'ok' : 'brand'} />
                      <span className="tnum mt-1 block text-[10px] text-ink-muted">{task.progressPct}%</span>
                    </td>
                    <td>
                      <StatusBadge status={task.status} />
                    </td>
                    {canManage ? (
                      <td>
                        <div className="flex justify-end gap-1.5">
                          {task.status !== 'Done' ? (
                            <ActionButton action={updateTaskAction} fields={{ taskId: task.id, status: 'Done' }} variant="ok">
                              Complete
                            </ActionButton>
                          ) : null}
                          {task.status !== 'Blocked' && task.status !== 'Done' ? (
                            <ActionButton action={updateTaskAction} fields={{ taskId: task.id, status: 'Blocked' }} variant="secondary">
                              Block
                            </ActionButton>
                          ) : null}
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>

        <Card>
          <CardHeader title="Resource utilisation" subtitle="Committed hours against a 160-hour month" />
          <CardBody>
            <RankedBars
              data={utilisationRows.map((row) => ({
                ...row,
                tone: row.value > 100 ? '#b03f7a' : row.value > 80 ? '#a45c00' : '#047857',
              }))}
              format={{ kind: 'percent', dp: 0 }}
              max={Math.max(100, ...utilisationRows.map((r) => r.value))}
              emptyLabel="No open task assignments"
            />
            <p className="mt-3 border-t border-ink-line pt-2.5 text-[11px] leading-relaxed text-ink-muted">
              Anyone above 100% is over-committed across the portfolio, not just this project.
            </p>
          </CardBody>
        </Card>
      </div>
    </>
  )
}
