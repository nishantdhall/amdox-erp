import type { Metadata } from 'next'
import { requireSession } from '@/lib/auth/session'
import { listAttendance, listEmployees } from '@/lib/db/repo'
import { attendanceTrend } from '@/lib/domain/analytics'
import { Badge, Card, CardBody, CardHeader, EmptyState, PageHeader, StatTile, StatusBadge, Table } from '@/components/ui/primitives'
import { LineChart } from '@/components/charts/line'
import { Heatmap } from '@/components/charts/misc'
import { ActionButton } from '@/components/ui/action'
import { clockAction } from '@/app/(app)/actions'
import { formatDate, formatNumber, round, toISODate } from '@/lib/utils'

export const metadata: Metadata = { title: 'Attendance' }
export const dynamic = 'force-dynamic'

export default async function AttendancePage() {
  const session = await requireSession()
  const isSelfService = session.role === 'Employee' || session.role === 'Viewer'

  const employees = listEmployees(session.tenantId)
  const employeeNames = new Map(employees.map((e) => [e.id, `${e.firstName} ${e.lastName}`]))

  const scopedEmployeeId = isSelfService ? session.employeeId ?? undefined : undefined
  const records = listAttendance(session.tenantId, { employeeId: scopedEmployeeId })

  const today = toISODate(new Date())
  const todaysRecords = records.filter((r) => r.date === today)
  const workingToday = todaysRecords.filter((r) => r.status === 'Present' || r.status === 'Remote')

  const trend = attendanceTrend(session.tenantId, 21)

  const totalWorked = records.reduce((s, r) => s + r.workedHours, 0)
  const totalOvertime = records.reduce((s, r) => s + r.overtimeHours, 0)
  const workdayRecords = records.filter((r) => r.status !== 'Weekend' && r.status !== 'Holiday')
  const presentRate =
    workdayRecords.length === 0
      ? 0
      : round((workdayRecords.filter((r) => r.status === 'Present' || r.status === 'Remote').length / workdayRecords.length) * 100, 1)

  // Per-employee attendance density over the last 14 working days.
  const recentDates = [...new Set(workdayRecords.map((r) => r.date))].sort().slice(-14)
  const heatmapRows = employees.slice(0, 12).map((employee) => ({
    label: `${employee.firstName} ${employee.lastName.charAt(0)}.`,
    cells: recentDates.map((date) => {
      const record = records.find((r) => r.employeeId === employee.id && r.date === date)
      return { key: date, value: record?.workedHours ?? 0 }
    }),
  }))

  const myRecordToday = session.employeeId ? records.find((r) => r.employeeId === session.employeeId && r.date === today) : undefined

  return (
    <>
      <PageHeader
        title="Attendance"
        description="Clock-in / clock-out records, worked hours and overtime, computed from the raw attendance ledger."
        meta={
          <>
            <Badge tone="muted">{isSelfService ? 'Self-service view' : 'Team view'}</Badge>
            <Badge tone="brand">{formatNumber(records.length)} records</Badge>
          </>
        }
        actions={
          session.employeeId ? (
            <div className="flex gap-2">
              <ActionButton
                action={clockAction}
                fields={{ employeeId: session.employeeId, action: 'clock-in' }}
                variant="primary"
                size="md"
              >
                Clock in
              </ActionButton>
              <ActionButton
                action={clockAction}
                fields={{ employeeId: session.employeeId, action: 'clock-out' }}
                variant="secondary"
                size="md"
              >
                Clock out
              </ActionButton>
            </div>
          ) : null
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Present today" value={formatNumber(workingToday.length)} hint={`of ${formatNumber(todaysRecords.length)} scheduled`} icon="◉" />
        <StatTile label="Attendance rate" value={`${presentRate}%`} tone={presentRate >= 90 ? 'ok' : 'warn'} hint="Working days only" icon="◔" />
        <StatTile label="Hours logged" value={formatNumber(Math.round(totalWorked))} hint="Across the window" icon="◷" />
        <StatTile label="Overtime hours" value={formatNumber(Math.round(totalOvertime))} tone={totalOvertime > 0 ? 'warn' : 'ok'} icon="↑" />
      </div>

      {myRecordToday ? (
        <Card className="mb-5">
          <CardBody className="flex flex-wrap items-center justify-between gap-4 py-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">Your day — {formatDate(today)}</p>
              <p className="tnum mt-1 text-sm font-semibold text-ink">
                In {myRecordToday.clockIn ?? '—'} · Out {myRecordToday.clockOut ?? '—'} · {myRecordToday.workedHours}h logged
              </p>
            </div>
            <StatusBadge status={myRecordToday.status} />
          </CardBody>
        </Card>
      ) : null}

      <div className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader title="Attendance rate" subtitle="Share of scheduled staff present or remote, by day" />
          <CardBody className="pt-4">
            <LineChart
              labels={trend.map((t) => formatDate(t.date).slice(0, 6))}
              series={[{ name: 'Present %', values: trend.map((t) => t.presentPct), area: true }]}
              height={220}
              format={{ kind: 'percent', dp: 1 }}
              ariaLabel="Daily attendance rate over the last three weeks"
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Hours worked density" subtitle="Last 14 working days, darker means more hours" />
          <CardBody>
            <Heatmap rows={heatmapRows} format={{ kind: 'hours' }} emptyLabel="No attendance data yet" />
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Attendance ledger" subtitle="Most recent first" />
        {records.length === 0 ? (
          <EmptyState title="No attendance records" description="Clock in to create the first record for today." icon="◷" />
        ) : (
          <Table>
            <thead>
              <tr>
                <th>Date</th>
                {!isSelfService ? <th>Employee</th> : null}
                <th>Clock in</th>
                <th>Clock out</th>
                <th className="text-right">Hours</th>
                <th className="text-right">Overtime</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {records.slice(0, 80).map((record) => (
                <tr key={record.id}>
                  <td className="text-xs">{formatDate(record.date)}</td>
                  {!isSelfService ? <td className="text-xs text-ink-muted">{employeeNames.get(record.employeeId) ?? '—'}</td> : null}
                  <td className="tnum text-xs">{record.clockIn ?? '—'}</td>
                  <td className="tnum text-xs">{record.clockOut ?? '—'}</td>
                  <td className="tnum text-right text-xs font-semibold">{record.workedHours || '—'}</td>
                  <td className="tnum text-right text-xs">{record.overtimeHours || '—'}</td>
                  <td>
                    <StatusBadge status={record.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  )
}
