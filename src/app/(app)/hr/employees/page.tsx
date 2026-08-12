import type { Metadata } from 'next'
import { requireSession } from '@/lib/auth/session'
import { can } from '@/lib/auth/rbac'
import { getTenant, listDepartments, listEmployees } from '@/lib/db/repo'
import { departmentBreakdown } from '@/lib/domain/analytics'
import { Badge, Card, CardBody, CardHeader, EmptyState, PageHeader, StatTile, StatusBadge, Table } from '@/components/ui/primitives'
import { RankedBars } from '@/components/charts/bar'
import { EmployeeFilters, NewEmployeeDialog } from './employee-ui'
import { ActionButton } from '@/components/ui/action'
import { deleteEmployeeAction } from '@/app/(app)/actions'
import { formatDate, formatMoney, formatNumber, initials } from '@/lib/utils'

export const metadata: Metadata = { title: 'Employees' }
export const dynamic = 'force-dynamic'

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; departmentId?: string; status?: string }>
}) {
  const params = await searchParams
  const session = await requireSession()
  const tenant = getTenant(session.tenantId)

  const departments = listDepartments(session.tenantId)
  const departmentNames = new Map(departments.map((d) => [d.id, d.name]))

  const all = listEmployees(session.tenantId)
  const filtered = listEmployees(session.tenantId, {
    search: params.search,
    departmentId: params.departmentId,
    status: params.status as 'Active' | undefined,
  })

  const breakdown = departmentBreakdown(session.tenantId)
  const canManage = can(session, 'employee.manage')
  const canSeeCompensation = can(session, 'payroll.view')

  const monthlyPayroll = all.reduce((s, e) => (e.status === 'Exited' ? s : s + e.ctcAnnual / 12), 0)
  const avgTenureDays =
    all.length === 0 ? 0 : all.reduce((s, e) => s + (Date.now() - new Date(e.joinedOn).getTime()) / 86400000, 0) / all.length

  return (
    <>
      <PageHeader
        title="Employees"
        description="Employee master data, reporting lines and compensation for the whole tenant."
        meta={
          <>
            <Badge tone="muted">{tenant.name}</Badge>
            <Badge tone="brand">{formatNumber(all.length)} records</Badge>
            {params.search || params.departmentId || params.status ? (
              <Badge tone="warn">{formatNumber(filtered.length)} matching filter</Badge>
            ) : null}
          </>
        }
        actions={canManage ? <NewEmployeeDialog departments={departments.map((d) => ({ id: d.id, name: d.name }))} /> : null}
      />

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Total headcount" value={formatNumber(all.filter((e) => e.status !== 'Exited').length)} icon="⚇" />
        <StatTile label="On leave / probation" value={formatNumber(all.filter((e) => e.status === 'On Leave' || e.status === 'Probation').length)} tone="warn" icon="◷" />
        <StatTile
          label="Monthly payroll cost"
          value={canSeeCompensation ? formatMoney(monthlyPayroll, tenant.baseCurrency, true) : '—'}
          hint={canSeeCompensation ? 'Sum of CTC ÷ 12' : 'Requires payroll access'}
          icon="₹"
        />
        <StatTile label="Average tenure" value={`${(avgTenureDays / 365).toFixed(1)} yrs`} icon="◔" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader
            title="Employee directory"
            subtitle={`${formatNumber(filtered.length)} of ${formatNumber(all.length)} shown`}
          />
          <div className="border-b border-ink-line px-5 py-3">
            <EmployeeFilters
              departments={departments.map((d) => ({ id: d.id, name: d.name }))}
              defaults={{ search: params.search ?? '', departmentId: params.departmentId ?? '', status: params.status ?? '' }}
            />
          </div>

          {filtered.length === 0 ? (
            <EmptyState title="No employees match those filters" description="Clear the filters or widen the search." icon="⚇" />
          ) : (
            <Table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th>Type</th>
                  <th>Joined</th>
                  {canSeeCompensation ? <th className="text-right">Annual CTC</th> : null}
                  <th>Status</th>
                  {canManage ? <th aria-label="Actions" /> : null}
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 60).map((employee) => (
                  <tr key={employee.id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <span aria-hidden className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-brand-50 text-[10px] font-bold text-brand-700">
                          {initials(`${employee.firstName} ${employee.lastName}`)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-ink">
                            {employee.firstName} {employee.lastName}
                          </p>
                          <p className="truncate text-[11px] text-ink-muted">
                            {employee.code} · {employee.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="text-xs text-ink-muted">{departmentNames.get(employee.departmentId) ?? '—'}</td>
                    <td className="text-xs">{employee.designation}</td>
                    <td className="text-xs text-ink-muted">{employee.employmentType}</td>
                    <td className="text-xs text-ink-muted">{formatDate(employee.joinedOn)}</td>
                    {canSeeCompensation ? (
                      <td className="tnum text-right text-xs font-semibold">{formatMoney(employee.ctcAnnual, tenant.baseCurrency, true)}</td>
                    ) : null}
                    <td>
                      <StatusBadge status={employee.status} />
                    </td>
                    {canManage ? (
                      <td className="text-right">
                        <ActionButton
                          action={deleteEmployeeAction}
                          fields={{ id: employee.id }}
                          variant="ghost"
                          confirm={`Archive ${employee.firstName} ${employee.lastName}? The record is soft-deleted and stays in the audit trail.`}
                        >
                          Archive
                        </ActionButton>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </Table>
          )}

          {filtered.length > 60 ? (
            <p className="border-t border-ink-line px-5 py-2.5 text-[11px] text-ink-muted">
              Showing the first 60 of {formatNumber(filtered.length)} matches — narrow the search to see the rest.
            </p>
          ) : null}
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Headcount by department" />
            <CardBody>
              <RankedBars
                data={breakdown.map((d) => ({ label: d.name, value: d.headcount }))}
                format={{ kind: 'number' }}
              />
            </CardBody>
          </Card>

          {canSeeCompensation ? (
            <Card>
              <CardHeader title="Monthly cost by department" />
              <CardBody>
                <RankedBars
                  data={breakdown.map((d) => ({ label: d.code, value: d.payrollMonthly }))}
                  format={{ kind: 'money', currency: tenant.baseCurrency, compact: true }}
                  color="#047857"
                />
              </CardBody>
            </Card>
          ) : null}
        </div>
      </div>
    </>
  )
}
