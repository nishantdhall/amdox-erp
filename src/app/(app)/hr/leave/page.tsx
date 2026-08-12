import type { Metadata } from 'next'
import { requireSession } from '@/lib/auth/session'
import { can } from '@/lib/auth/rbac'
import { listEmployees, listLeave } from '@/lib/db/repo'
import { Badge, Card, CardBody, CardHeader, EmptyState, PageHeader, StatTile, StatusBadge, Table } from '@/components/ui/primitives'
import { RankedBars } from '@/components/charts/bar'
import { ActionButton } from '@/components/ui/action'
import { decideLeaveAction } from '@/app/(app)/actions'
import { ApplyLeaveDialog } from './leave-ui'
import { formatDate, formatNumber, groupBy } from '@/lib/utils'
import type { LeaveType } from '@/lib/types'

export const metadata: Metadata = { title: 'Leave management' }
export const dynamic = 'force-dynamic'

export default async function LeavePage() {
  const session = await requireSession()
  const canApprove = can(session, 'leave.approve')
  const isSelfService = session.role === 'Employee' || session.role === 'Viewer'

  const employees = listEmployees(session.tenantId)
  const employeeNames = new Map(employees.map((e) => [e.id, `${e.firstName} ${e.lastName}`]))

  const requests = listLeave(session.tenantId, {
    employeeId: isSelfService ? session.employeeId ?? undefined : undefined,
  })

  const pending = requests.filter((r) => r.status === 'Pending')
  const approved = requests.filter((r) => r.status === 'Approved')
  const rejected = requests.filter((r) => r.status === 'Rejected')
  const daysApproved = approved.reduce((s, r) => s + r.days, 0)

  const byType = groupBy(requests, (r) => r.type as LeaveType)
  const typeBreakdown = (Object.entries(byType) as [LeaveType, typeof requests][])
    .map(([type, rows]) => ({ label: type, value: rows.reduce((s, r) => s + r.days, 0) }))
    .sort((a, b) => b.value - a.value)

  return (
    <>
      <PageHeader
        title="Leave management"
        description="Requests move through a strict state machine — a decision can only be taken once, and every transition is audited."
        meta={
          <>
            <Badge tone={pending.length > 0 ? 'warn' : 'ok'}>{formatNumber(pending.length)} awaiting decision</Badge>
            <Badge tone="muted">{isSelfService ? 'Your requests' : 'All requests'}</Badge>
          </>
        }
        actions={
          <ApplyLeaveDialog
            employees={employees.map((e) => ({ id: e.id, name: `${e.firstName} ${e.lastName}` }))}
            defaultEmployeeId={session.employeeId ?? employees[0]?.id ?? ''}
            lockEmployee={isSelfService}
          />
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Pending" value={formatNumber(pending.length)} tone={pending.length > 0 ? 'warn' : 'ok'} icon="◷" />
        <StatTile label="Approved" value={formatNumber(approved.length)} tone="ok" hint={`${formatNumber(daysApproved)} days total`} icon="✓" />
        <StatTile label="Rejected" value={formatNumber(rejected.length)} tone={rejected.length > 0 ? 'danger' : 'muted'} icon="×" />
        <StatTile label="Unpaid days" value={formatNumber(approved.filter((r) => r.type === 'Unpaid').reduce((s, r) => s + r.days, 0))} hint="Deducted at payroll" icon="₹" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          {canApprove && pending.length > 0 ? (
            <Card>
              <CardHeader title="Awaiting your decision" subtitle="Approving unpaid leave reduces paid days in the next payroll run" />
              <Table>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Type</th>
                    <th>Dates</th>
                    <th className="text-right">Days</th>
                    <th>Reason</th>
                    <th aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {pending.map((request) => (
                    <tr key={request.id}>
                      <td className="text-xs font-semibold">{employeeNames.get(request.employeeId) ?? '—'}</td>
                      <td>
                        <Badge tone={request.type === 'Unpaid' ? 'danger' : 'neutral'}>{request.type}</Badge>
                      </td>
                      <td className="text-xs text-ink-muted">
                        {formatDate(request.from)} → {formatDate(request.to)}
                      </td>
                      <td className="tnum text-right text-xs font-semibold">{request.days}</td>
                      <td className="max-w-[200px] truncate text-xs text-ink-muted">{request.reason}</td>
                      <td>
                        <div className="flex justify-end gap-1.5">
                          <ActionButton action={decideLeaveAction} fields={{ id: request.id, decision: 'Approved' }} variant="ok">
                            Approve
                          </ActionButton>
                          <ActionButton action={decideLeaveAction} fields={{ id: request.id, decision: 'Rejected' }} variant="secondary">
                            Reject
                          </ActionButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card>
          ) : null}

          <Card>
            <CardHeader title="All leave requests" subtitle={`${formatNumber(requests.length)} records`} />
            {requests.length === 0 ? (
              <EmptyState title="No leave requests yet" description="Apply for leave to create the first request." icon="⌇" />
            ) : (
              <Table>
                <thead>
                  <tr>
                    {!isSelfService ? <th>Employee</th> : null}
                    <th>Type</th>
                    <th>Dates</th>
                    <th className="text-right">Days</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Decided</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.slice(0, 50).map((request) => (
                    <tr key={request.id}>
                      {!isSelfService ? <td className="text-xs font-medium">{employeeNames.get(request.employeeId) ?? '—'}</td> : null}
                      <td className="text-xs">{request.type}</td>
                      <td className="text-xs text-ink-muted">
                        {formatDate(request.from)} → {formatDate(request.to)}
                      </td>
                      <td className="tnum text-right text-xs">{request.days}</td>
                      <td className="max-w-[220px] truncate text-xs text-ink-muted">{request.reason}</td>
                      <td>
                        <StatusBadge status={request.status} />
                      </td>
                      <td className="text-xs text-ink-muted">{request.decidedAt ? formatDate(request.decidedAt) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Days by leave type" />
            <CardBody>
              <RankedBars data={typeBreakdown} format={{ kind: 'days' }} emptyLabel="No leave taken yet" />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Approval policy" />
            <CardBody className="space-y-2.5 text-xs leading-relaxed text-ink-muted">
              <p>A request can only be decided while it is <strong className="text-ink">Pending</strong>; a second decision is rejected with a 409.</p>
              <p>Approved <strong className="text-ink">Unpaid</strong> leave inside a payroll period reduces paid days pro-rata in the gross-to-net calculation.</p>
              <p>Every decision writes an audit record and emits a notification to the requester.</p>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  )
}
