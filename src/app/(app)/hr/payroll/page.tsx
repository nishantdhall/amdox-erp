import type { Metadata } from 'next'
import { requireSession } from '@/lib/auth/session'
import { can } from '@/lib/auth/rbac'
import { getTenant, listEmployees, listPayrollRuns, listPayslips } from '@/lib/db/repo'
import { payrollTrend } from '@/lib/domain/analytics'
import { PAYROLL_CONSTANTS, TAX_SLABS } from '@/lib/domain/payroll'
import { Badge, Card, CardBody, CardHeader, EmptyState, PageHeader, StatTile, StatusBadge, Table } from '@/components/ui/primitives'
import { BarChart } from '@/components/charts/bar'
import { DonutChart } from '@/components/charts/misc'
import { RunPayrollPanel } from './payroll-ui'
import { addMonths, formatDateTime, formatMoney, formatNumber, periodLabel, toPeriod } from '@/lib/utils'

export const metadata: Metadata = { title: 'Payroll' }
export const dynamic = 'force-dynamic'

export default async function PayrollPage({ searchParams }: { searchParams: Promise<{ run?: string }> }) {
  const params = await searchParams
  const session = await requireSession()
  const tenant = getTenant(session.tenantId)
  const currency = tenant.baseCurrency

  const runs = listPayrollRuns(session.tenantId)
  const selectedRun = runs.find((r) => r.id === params.run) ?? runs[0]
  const payslips = selectedRun ? listPayslips(session.tenantId, { runId: selectedRun.id }) : []

  const employees = new Map(listEmployees(session.tenantId).map((e) => [e.id, e]))
  const trend = payrollTrend(session.tenantId)

  const currentPeriod = toPeriod(new Date())
  const processedPeriods = new Set(runs.filter((r) => r.status === 'Completed').map((r) => r.period))
  const candidatePeriods = [currentPeriod, addMonths(currentPeriod, -1), addMonths(currentPeriod, -2)].filter(
    (period) => !processedPeriods.has(period),
  )

  const canRun = can(session, 'payroll.run')

  const componentTotals = payslips.reduce(
    (acc, slip) => ({
      basic: acc.basic + slip.basic,
      hra: acc.hra + slip.hra,
      special: acc.special + slip.specialAllowance,
      pf: acc.pf + slip.pf,
      tax: acc.tax + slip.incomeTax,
      ptax: acc.ptax + slip.professionalTax,
    }),
    { basic: 0, hra: 0, special: 0, pf: 0, tax: 0, ptax: 0 },
  )

  return (
    <>
      <PageHeader
        title="Payroll"
        description="Gross-to-net engine with statutory slabs, pro-rata loss of pay and an automatic general-ledger accrual."
        meta={
          <>
            <Badge tone="muted">{formatNumber(runs.length)} historical runs</Badge>
            {selectedRun ? <Badge tone="brand">Viewing {periodLabel(selectedRun.period)}</Badge> : null}
          </>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Last gross" value={selectedRun ? formatMoney(selectedRun.grossTotal, currency, true) : '—'} icon="₹" />
        <StatTile label="Last deductions" value={selectedRun ? formatMoney(selectedRun.deductionTotal, currency, true) : '—'} tone="warn" icon="↧" />
        <StatTile label="Last net payable" value={selectedRun ? formatMoney(selectedRun.netTotal, currency, true) : '—'} tone="ok" icon="✓" />
        <StatTile
          label="Processing time"
          value={selectedRun?.durationMs ? `${selectedRun.durationMs} ms` : '—'}
          hint={selectedRun ? `${selectedRun.employeeCount} employees` : undefined}
          icon="◔"
        />
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Payroll cost trend" subtitle="Gross versus net payable, by period" />
          <CardBody className="pt-4">
            {trend.length === 0 ? (
              <EmptyState title="No payroll history yet" description="Run payroll for a period to populate this chart." icon="₹" />
            ) : (
              <BarChart
                labels={trend.map((t) => periodLabel(t.period))}
                series={[
                  { name: 'Gross', values: trend.map((t) => t.gross) },
                  { name: 'Net payable', values: trend.map((t) => t.net) },
                ]}
                height={240}
                format={{ kind: 'money', currency, compact: true }}
                ariaLabel="Gross and net payroll cost by period"
              />
            )}
          </CardBody>
        </Card>

        <RunPayrollPanel canRun={canRun} periods={candidatePeriods} />
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader title="Salary structure" subtitle={selectedRun ? periodLabel(selectedRun.period) : 'No run selected'} />
          <CardBody>
            <DonutChart
              slices={[
                { label: 'Basic', value: componentTotals.basic },
                { label: 'HRA', value: componentTotals.hra },
                { label: 'Special allowance', value: componentTotals.special },
              ]}
              centerLabel="Gross"
              centerValue={formatMoney(componentTotals.basic + componentTotals.hra + componentTotals.special, currency, true)}
              format={{ kind: 'money', currency, compact: true }}
              size={148}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Deduction split" subtitle="Statutory components" />
          <CardBody>
            <DonutChart
              slices={[
                { label: 'Income tax', value: componentTotals.tax },
                { label: 'Provident fund', value: componentTotals.pf },
                { label: 'Professional tax', value: componentTotals.ptax },
              ]}
              centerLabel="Total deductions"
              centerValue={formatMoney(componentTotals.tax + componentTotals.pf + componentTotals.ptax, currency, true)}
              format={{ kind: 'money', currency, compact: true }}
              size={148}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Tax configuration" subtitle="New regime, FY 2025-26" />
          <CardBody className="space-y-2 text-xs">
            <ul className="space-y-1">
              {TAX_SLABS.map((slab, i) => {
                const lower = i === 0 ? 0 : (TAX_SLABS[i - 1].upTo ?? 0)
                return (
                  <li key={i} className="flex items-center justify-between">
                    <span className="tnum text-ink-muted">
                      {formatMoney(lower, currency, true)} – {slab.upTo ? formatMoney(slab.upTo, currency, true) : 'above'}
                    </span>
                    <span className="tnum font-semibold text-ink">{(slab.rate * 100).toFixed(0)}%</span>
                  </li>
                )
              })}
            </ul>
            <div className="border-t border-ink-line pt-2 text-[11px] leading-relaxed text-ink-muted">
              Standard deduction {formatMoney(PAYROLL_CONSTANTS.standardDeduction, currency, true)} · §87A rebate below{' '}
              {formatMoney(PAYROLL_CONSTANTS.rebateThreshold, currency, true)} · {(PAYROLL_CONSTANTS.cessRate * 100).toFixed(0)}% cess · PF at{' '}
              {(PAYROLL_CONSTANTS.pfRate * 100).toFixed(0)}% of basic capped at {formatMoney(PAYROLL_CONSTANTS.pfWageCeiling, currency, true)}/month.
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[300px_1fr]">
        <Card>
          <CardHeader title="Run history" />
          <CardBody className="space-y-1.5">
            {runs.length === 0 ? (
              <p className="py-6 text-center text-xs text-ink-muted">No runs recorded.</p>
            ) : (
              runs.map((run) => (
                <a
                  key={run.id}
                  href={`/hr/payroll?run=${run.id}`}
                  className={`block rounded-lg border px-3 py-2.5 transition-colors ${
                    selectedRun?.id === run.id ? 'border-brand-500 bg-brand-50' : 'border-ink-line hover:bg-surface-sunken'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-ink">{periodLabel(run.period)}</span>
                    <StatusBadge status={run.status} />
                  </div>
                  <p className="tnum mt-1 text-[11px] text-ink-muted">
                    {formatNumber(run.employeeCount)} employees · net {formatMoney(run.netTotal, currency, true)}
                  </p>
                  <p className="mt-0.5 text-[10px] text-ink-muted">{formatDateTime(run.processedAt)}</p>
                </a>
              ))
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Payslips"
            subtitle={selectedRun ? `${formatNumber(payslips.length)} payslips for ${periodLabel(selectedRun.period)}` : 'Select a run'}
          />
          {payslips.length === 0 ? (
            <EmptyState title="No payslips to show" description="Run payroll for a period to generate payslips." icon="₹" />
          ) : (
            <Table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th className="text-right">Paid days</th>
                  <th className="text-right">Basic</th>
                  <th className="text-right">Gross</th>
                  <th className="text-right">PF</th>
                  <th className="text-right">Income tax</th>
                  <th className="text-right">Net pay</th>
                </tr>
              </thead>
              <tbody>
                {payslips.slice(0, 60).map((slip) => {
                  const employee = employees.get(slip.employeeId)
                  return (
                    <tr key={slip.id}>
                      <td>
                        <p className="text-xs font-semibold text-ink">
                          {employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown'}
                        </p>
                        <p className="text-[11px] text-ink-muted">{employee?.code ?? '—'}</p>
                      </td>
                      <td className="tnum text-right text-xs">
                        {slip.paidDays < PAYROLL_CONSTANTS.workingDaysPerMonth ? (
                          <Badge tone="warn">{slip.paidDays}</Badge>
                        ) : (
                          slip.paidDays
                        )}
                      </td>
                      <td className="tnum text-right text-xs">{formatMoney(slip.basic, currency, true)}</td>
                      <td className="tnum text-right text-xs font-semibold">{formatMoney(slip.gross, currency, true)}</td>
                      <td className="tnum text-right text-xs text-ink-muted">{formatMoney(slip.pf, currency, true)}</td>
                      <td className="tnum text-right text-xs text-ink-muted">{formatMoney(slip.incomeTax, currency, true)}</td>
                      <td className="tnum text-right text-xs font-semibold text-ok">{formatMoney(slip.net, currency, true)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </Table>
          )}
          {payslips.length > 60 ? (
            <p className="border-t border-ink-line px-5 py-2.5 text-[11px] text-ink-muted">
              Showing 60 of {formatNumber(payslips.length)} payslips.
            </p>
          ) : null}
        </Card>
      </div>
    </>
  )
}
