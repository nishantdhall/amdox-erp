import type { Metadata } from 'next'
import Link from 'next/link'
import { requireSession } from '@/lib/auth/session'
import { getTenant, listNotifications, listProjects } from '@/lib/db/repo'
import {
  dashboardKpis,
  departmentBreakdown,
  expenseByCategory,
  inventoryByCategory,
  revenueByStream,
  revenueSeries,
  stockAlerts,
} from '@/lib/domain/analytics'
import { budgetVariance } from '@/lib/domain/projects'
import { Badge, Card, CardBody, CardHeader, PageHeader, Progress, StatTile, StatusBadge } from '@/components/ui/primitives'
import { LineChart } from '@/components/charts/line'
import { BarChart, RankedBars } from '@/components/charts/bar'
import { DonutChart } from '@/components/charts/misc'
import { formatMoney, formatNumber, periodLabel } from '@/lib/utils'

export const metadata: Metadata = { title: 'Dashboard' }
export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const session = await requireSession()
  const tenant = getTenant(session.tenantId)
  const currency = tenant.baseCurrency

  const kpis = dashboardKpis(session.tenantId)
  const revenue = revenueSeries(session.tenantId, 8)
  const departments = departmentBreakdown(session.tenantId)
  const streams = revenueByStream(session.tenantId)
  const expenses = expenseByCategory(session.tenantId).slice(0, 6)
  const inventoryMix = inventoryByCategory(session.tenantId)
  const alerts = stockAlerts(session.tenantId, 6)
  const notifications = listNotifications(session.tenantId, { limit: 5 })

  const projects = listProjects(session.tenantId)
    .map((project) => ({ project, variance: budgetVariance(project) }))
    .filter(({ project, variance }) => variance.overrun || project.status === 'At Risk' || project.status === 'Active')
    .sort((a, b) => b.variance.variancePct - a.variance.variancePct)
    .slice(0, 5)

  const compact = (v: number) => formatMoney(v, currency, true)

  return (
    <>
      <PageHeader
        title={`Good to see you, ${session.name.split(' ')[0]}`}
        description={`Live operating picture for ${tenant.name}. Every figure below is computed from the ledger, HR and supply-chain modules in real time.`}
        meta={
          <>
            <Badge tone="brand">{tenant.plan.toUpperCase()} PLAN</Badge>
            <Badge tone="muted">{tenant.country}</Badge>
            <Badge tone="muted">Base currency {currency}</Badge>
            <Badge tone={kpis.forecastAccuracyPct >= 88 ? 'ok' : 'warn'}>
              Forecast accuracy {kpis.forecastAccuracyPct}%
            </Badge>
          </>
        }
        actions={
          <>
            <Link
              href="/analytics"
              className="rounded-lg border border-ink-line bg-white px-3 py-2 text-xs font-semibold text-ink transition-colors hover:bg-surface-sunken"
            >
              Open analytics
            </Link>
            <Link
              href="/forecasting"
              className="rounded-lg bg-brand-500 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-600"
            >
              AI forecast
            </Link>
          </>
        }
      />

      {/* KPI row */}
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Revenue (MTD)"
          value={compact(kpis.revenueMtd)}
          delta={{ value: kpis.revenueGrowthPct }}
          hint="vs last month"
          icon="₹"
        />
        <StatTile
          label="Net profit (MTD)"
          value={compact(kpis.netProfitMtd)}
          hint={`${kpis.marginPct}% margin`}
          tone={kpis.netProfitMtd >= 0 ? 'ok' : 'danger'}
          icon="◈"
        />
        <StatTile label="Active headcount" value={formatNumber(kpis.headcount)} hint={`${kpis.pendingLeave} leave requests pending`} icon="⚇" />
        <StatTile
          label="Cash at bank"
          value={compact(kpis.cashBalance)}
          hint={`DSO ${kpis.dso} days`}
          tone={kpis.cashBalance > 0 ? 'brand' : 'danger'}
          icon="◫"
        />
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Receivables open"
          value={compact(kpis.receivablesOutstanding)}
          hint={`${compact(kpis.receivablesOverdue)} overdue`}
          tone={kpis.receivablesOverdue > 0 ? 'warn' : 'ok'}
          icon="↥"
        />
        <StatTile label="Payables open" value={compact(kpis.payablesOutstanding)} hint="Awaiting payment run" icon="↧" />
        <StatTile
          label="Open purchase orders"
          value={formatNumber(kpis.openPoCount)}
          hint={`${compact(kpis.openPoValue)} committed`}
          icon="⇄"
        />
        <StatTile
          label="Low-stock SKUs"
          value={formatNumber(kpis.lowStockCount)}
          hint={`Inventory ${compact(kpis.inventoryValue)}`}
          tone={kpis.lowStockCount > 0 ? 'warn' : 'ok'}
          icon="▤"
        />
      </div>

      {/* Trend + composition */}
      <div className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Revenue, cost and profit"
            subtitle="Posted general-ledger movements over the last eight periods"
            action={<Badge tone="muted">{currency}</Badge>}
          />
          <CardBody className="pt-4">
            <LineChart
              labels={revenue.map((p) => periodLabel(p.period))}
              series={[
                { name: 'Revenue', values: revenue.map((p) => p.revenue), area: true },
                { name: 'Expenses', values: revenue.map((p) => p.expenses) },
                { name: 'Net profit', values: revenue.map((p) => p.profit) },
              ]}
              height={264}
              format={{ kind: 'money', currency, compact: true }}
              ariaLabel="Revenue, expenses and net profit over the last eight periods"
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Revenue mix" subtitle="Share by income stream" />
          <CardBody>
            <DonutChart
              slices={streams.map((s) => ({ label: s.label, value: s.value }))}
              centerLabel="Total booked"
              centerValue={compact(streams.reduce((s, r) => s + r.value, 0))}
              format={{ kind: 'money', currency, compact: true }}
            />
          </CardBody>
        </Card>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader title="Headcount by department" subtitle="Active employees" />
          <CardBody className="pt-4">
            <BarChart
              labels={departments.map((d) => d.code)}
              series={[{ name: 'Headcount', values: departments.map((d) => d.headcount) }]}
              height={210}
              format={{ kind: 'number' }}
              ariaLabel="Active headcount by department"
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Largest cost centres" subtitle="Posted expenses to date" />
          <CardBody>
            <RankedBars data={expenses} format={{ kind: 'money', currency, compact: true }} color="#a45c00" />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Inventory by category" subtitle="Valuation at unit cost" />
          <CardBody>
            <DonutChart
              slices={inventoryMix.slice(0, 6)}
              centerLabel="On hand"
              centerValue={compact(kpis.inventoryValue)}
              format={{ kind: 'money', currency, compact: true }}
              size={148}
            />
          </CardBody>
        </Card>
      </div>

      {/* Operational attention */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader
            title="Stock needing attention"
            subtitle="Below or near the reorder point"
            action={
              <Link href="/supply-chain/inventory" className="text-[11px] font-semibold text-brand-600 hover:underline">
                View all
              </Link>
            }
          />
          <CardBody className="space-y-2.5 pt-4">
            {alerts.length === 0 ? (
              <p className="py-6 text-center text-xs text-ink-muted">Every SKU is comfortably above its reorder point.</p>
            ) : (
              alerts.map((alert) => (
                <div key={alert.sku} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-ink">{alert.name}</p>
                    <p className="tnum text-[11px] text-ink-muted">
                      {alert.sku} · {formatNumber(alert.available)} available / reorder at {formatNumber(alert.reorderPoint)}
                    </p>
                  </div>
                  <StatusBadge status={alert.health} />
                </div>
              ))
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Projects to watch"
            subtitle="Budget variance and delivery risk"
            action={
              <Link href="/projects" className="text-[11px] font-semibold text-brand-600 hover:underline">
                View all
              </Link>
            }
          />
          <CardBody className="space-y-3.5 pt-4">
            {projects.length === 0 ? (
              <p className="py-6 text-center text-xs text-ink-muted">No active projects right now.</p>
            ) : (
              projects.map(({ project, variance }) => (
                <div key={project.id}>
                  <div className="mb-1 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-ink">{project.name}</p>
                      <p className="text-[11px] text-ink-muted">{project.clientName}</p>
                    </div>
                    <Badge tone={variance.overrun ? 'danger' : variance.variancePct > 0 ? 'warn' : 'ok'}>
                      {variance.variancePct > 0 ? '+' : ''}
                      {variance.variancePct}%
                    </Badge>
                  </div>
                  <Progress value={project.progressPct} tone={variance.overrun ? 'danger' : 'brand'} />
                  <p className="tnum mt-1 text-[11px] text-ink-muted">
                    {project.progressPct}% complete · {compact(project.actualCost)} of {compact(project.budget)}
                  </p>
                </div>
              ))
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Recent events"
            subtitle="From the notification engine"
            action={
              <Link href="/notifications" className="text-[11px] font-semibold text-brand-600 hover:underline">
                Inbox
              </Link>
            }
          />
          <CardBody className="space-y-3 pt-4">
            {notifications.map((notification) => (
              <div key={notification.id} className="flex gap-2.5">
                <span
                  aria-hidden
                  className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                    notification.severity === 'critical'
                      ? 'bg-danger'
                      : notification.severity === 'warning'
                        ? 'bg-warn'
                        : notification.severity === 'success'
                          ? 'bg-ok'
                          : 'bg-brand-500'
                  }`}
                />
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-ink">{notification.title}</p>
                  <p className="line-clamp-2 text-[11px] leading-relaxed text-ink-muted">{notification.body}</p>
                </div>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>
    </>
  )
}
