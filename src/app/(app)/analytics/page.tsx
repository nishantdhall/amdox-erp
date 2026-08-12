import type { Metadata } from 'next'
import { requireSession } from '@/lib/auth/session'
import { getTenant, listEmployees, listInvoices, listProjects } from '@/lib/db/repo'
import {
  attendanceTrend,
  departmentBreakdown,
  expenseByCategory,
  inventoryByCategory,
  payrollTrend,
  revenueByStream,
  revenueSeries,
  dashboardKpis,
} from '@/lib/domain/analytics'
import { Badge, Card, CardBody, CardHeader, PageHeader, StatTile } from '@/components/ui/primitives'
import { LineChart } from '@/components/charts/line'
import { BarChart, RankedBars } from '@/components/charts/bar'
import { DonutChart } from '@/components/charts/misc'
import { DrilldownTable, ExportBar } from './analytics-ui'
import { formatMoney, formatNumber, periodLabel } from '@/lib/utils'

export const metadata: Metadata = { title: 'Analytics' }
export const dynamic = 'force-dynamic'

export default async function AnalyticsPage() {
  const session = await requireSession()
  const tenant = getTenant(session.tenantId)
  const currency = tenant.baseCurrency

  const kpis = dashboardKpis(session.tenantId)
  const revenue = revenueSeries(session.tenantId, 10)
  const departments = departmentBreakdown(session.tenantId)
  const streams = revenueByStream(session.tenantId)
  const expenses = expenseByCategory(session.tenantId)
  const inventory = inventoryByCategory(session.tenantId)
  const attendance = attendanceTrend(session.tenantId, 21)
  const payroll = payrollTrend(session.tenantId)

  const employees = listEmployees(session.tenantId)
  const projects = listProjects(session.tenantId)
  const receivables = listInvoices(session.tenantId, { kind: 'AR' })

  // Drill-down source: department → the employees behind each bar.
  const departmentDrilldown = departments.map((department) => ({
    key: department.code,
    label: department.name,
    value: department.headcount,
    rows: employees
      .filter((employee) => employee.departmentId.endsWith(`_dept_${department.code}`) && employee.status !== 'Exited')
      .map((employee) => ({
        Employee: `${employee.firstName} ${employee.lastName}`,
        Code: employee.code,
        Designation: employee.designation,
        Type: employee.employmentType,
        Location: employee.location,
        Status: employee.status,
      })),
  }))

  const revenueConcentration = receivables
    .reduce<{ label: string; value: number }[]>((acc, invoice) => {
      const existing = acc.find((row) => row.label === invoice.counterpartyName)
      if (existing) existing.value += invoice.total
      else acc.push({ label: invoice.counterpartyName, value: invoice.total })
      return acc
    }, [])
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)

  return (
    <>
      <PageHeader
        title="Business intelligence"
        description="Cross-module analytics assembled from the same aggregation layer the API serves, so a dashboard figure and an API response can never disagree."
        meta={
          <>
            <Badge tone="muted">{tenant.name}</Badge>
            <Badge tone="brand">{formatNumber(revenue.length)} periods</Badge>
            <Badge tone="muted">Exports as CSV</Badge>
          </>
        }
        actions={<ExportBar />}
      />

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Revenue (MTD)" value={formatMoney(kpis.revenueMtd, currency, true)} delta={{ value: kpis.revenueGrowthPct }} icon="↥" />
        <StatTile label="Gross margin" value={`${kpis.marginPct}%`} tone={kpis.marginPct >= 0 ? 'ok' : 'danger'} icon="◈" />
        <StatTile label="Days sales outstanding" value={`${kpis.dso} d`} tone={kpis.dso > 60 ? 'warn' : 'ok'} icon="◔" />
        <StatTile label="Forecast accuracy" value={`${kpis.forecastAccuracyPct}%`} tone={kpis.forecastAccuracyPct >= 88 ? 'ok' : 'warn'} icon="◠" />
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Financial performance" subtitle="Revenue, expenses and net profit across ten periods" />
          <CardBody className="pt-4">
            <LineChart
              labels={revenue.map((p) => periodLabel(p.period))}
              series={[
                { name: 'Revenue', values: revenue.map((p) => p.revenue), area: true },
                { name: 'Expenses', values: revenue.map((p) => p.expenses) },
                { name: 'Net profit', values: revenue.map((p) => p.profit) },
              ]}
              height={280}
              format={{ kind: 'money', currency, compact: true }}
              ariaLabel="Revenue, expenses and net profit across ten periods"
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Revenue by stream" />
          <CardBody>
            <DonutChart
              slices={streams}
              centerLabel="Total revenue"
              centerValue={formatMoney(streams.reduce((s, r) => s + r.value, 0), currency, true)}
              format={{ kind: 'money', currency, compact: true }}
              size={156}
            />
          </CardBody>
        </Card>
      </div>

      <div className="mb-5">
        <DrilldownTable
          title="Headcount by department"
          subtitle="Click a bar to drill into the employees behind it"
          data={departmentDrilldown}
        />
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader title="Payroll cost" subtitle="Gross versus net payable by period" />
          <CardBody className="pt-4">
            {payroll.length === 0 ? (
              <p className="py-8 text-center text-xs text-ink-muted">No payroll runs recorded yet.</p>
            ) : (
              <BarChart
                labels={payroll.map((p) => periodLabel(p.period))}
                series={[
                  { name: 'Gross', values: payroll.map((p) => p.gross) },
                  { name: 'Deductions', values: payroll.map((p) => p.deductions) },
                ]}
                stacked
                height={230}
                format={{ kind: 'money', currency, compact: true }}
                ariaLabel="Payroll gross and deductions by period"
              />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Attendance rate" subtitle="Share of scheduled staff present, by working day" />
          <CardBody className="pt-4">
            <LineChart
              labels={attendance.map((a) => a.date.slice(5))}
              series={[{ name: 'Present %', values: attendance.map((a) => a.presentPct), area: true, color: '#047857' }]}
              height={230}
              format={{ kind: 'percent', dp: 1 }}
              ariaLabel="Attendance rate by working day"
            />
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader title="Customer concentration" subtitle="Invoiced value by customer" />
          <CardBody>
            <RankedBars data={revenueConcentration} format={{ kind: 'money', currency, compact: true }} emptyLabel="No customer invoices" />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Cost structure" subtitle="Posted expenses by account" />
          <CardBody>
            <RankedBars data={expenses.slice(0, 8)} format={{ kind: 'money', currency, compact: true }} color="#a45c00" />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Delivery portfolio" subtitle="Budget consumption by project" />
          <CardBody>
            <RankedBars
              data={projects.map((project) => ({
                label: project.code,
                value: Math.round((project.actualCost / Math.max(1, project.budget)) * 100),
                tone: project.actualCost > project.budget ? '#b03f7a' : '#4f6ef7',
              }))}
              format={{ kind: 'percent', dp: 0 }}
              max={Math.max(100, ...projects.map((p) => Math.round((p.actualCost / Math.max(1, p.budget)) * 100)))}
              emptyLabel="No projects"
            />
          </CardBody>
        </Card>
      </div>

      <div className="mt-5">
        <Card>
          <CardHeader title="Inventory value by category" subtitle="Stock on hand valued at unit cost" />
          <CardBody className="pt-4">
            <BarChart
              labels={inventory.map((row) => row.label)}
              series={[{ name: 'Stock value', values: inventory.map((row) => row.value), color: '#3b8fd6' }]}
              height={220}
              format={{ kind: 'money', currency, compact: true }}
              ariaLabel="Inventory value by category"
            />
          </CardBody>
        </Card>
      </div>
    </>
  )
}
