import { appendAudit, db, emitNotification, nextId, nowIso, type AuditContext } from './store'
import { assertBalanced } from '../domain/ledger'
import { computePayslip } from '../domain/payroll'
import { reorderSuggestions } from '../domain/inventory'
import { addDays, round, toISODate, toPeriod } from '../utils'
import type {
  Account,
  AccountingPeriod,
  AttendanceRecord,
  AuditLog,
  Customer,
  DemandSeries,
  Department,
  Employee,
  GoodsReceipt,
  ID,
  InventoryItem,
  Invoice,
  JournalEntry,
  JournalLine,
  LeaveRequest,
  Notification,
  Payment,
  PayrollRun,
  Payslip,
  Project,
  ProjectTask,
  PurchaseOrder,
  StockMovement,
  Tenant,
  User,
  Vendor,
  Warehouse,
} from '../types'

/**
 * Repository layer.
 *
 * Every read is scoped by `tenantId` here rather than at the call site — that
 * is the row-level-security strategy from §5.2, enforced in one place so a
 * forgotten filter in a page component cannot leak another tenant's data.
 */

export class NotFoundError extends Error {
  constructor(entity: string, id: string) {
    super(`${entity} ${id} was not found`)
    this.name = 'NotFoundError'
  }
}

export class ConflictError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ConflictError'
  }
}

interface Scoped {
  tenantId: ID
  deletedAt?: string | null
}

function scope<T extends Scoped>(rows: T[], tenantId: ID): T[] {
  return rows.filter((row) => row.tenantId === tenantId && !row.deletedAt)
}

function requireOne<T extends Scoped & { id: ID }>(rows: T[], tenantId: ID, id: ID, entity: string): T {
  const found = scope(rows, tenantId).find((row) => row.id === id)
  if (!found) throw new NotFoundError(entity, id)
  return found
}

function touch<T extends { updatedAt: string }>(row: T): T {
  row.updatedAt = nowIso()
  return row
}

function newRow(tenantId: ID, prefix: string) {
  const at = nowIso()
  return { id: nextId(prefix), tenantId, createdAt: at, updatedAt: at, deletedAt: null }
}

/* ------------------------------------------------------------------ tenancy */

export function listTenants(): Tenant[] {
  return db().tenants
}

export function getTenant(tenantId: ID): Tenant {
  const tenant = db().tenants.find((t) => t.id === tenantId)
  if (!tenant) throw new NotFoundError('Tenant', tenantId)
  return tenant
}

export function findUserByEmail(email: string): User | undefined {
  return db().users.find((u) => u.email.toLowerCase() === email.toLowerCase() && !u.deletedAt)
}

export function getUser(tenantId: ID, id: ID): User {
  return requireOne(db().users, tenantId, id, 'User')
}

export function listUsers(tenantId: ID): User[] {
  return scope(db().users, tenantId)
}

export function recordLogin(userId: ID): void {
  const user = db().users.find((u) => u.id === userId)
  if (user) {
    user.lastLoginAt = nowIso()
    touch(user)
  }
}

export function updateNotificationPrefs(tenantId: ID, userId: ID, prefs: Partial<User['notificationPrefs']>, ctx: AuditContext): User {
  const user = requireOne(db().users, tenantId, userId, 'User')
  user.notificationPrefs = { ...user.notificationPrefs, ...prefs }
  touch(user)
  appendAudit(ctx, 'settings.update', 'User', user.id, `Updated notification preferences for ${user.email}`)
  return user
}

/* ------------------------------------------------------------- HR: people */

export interface EmployeeFilters {
  search?: string
  departmentId?: ID
  status?: Employee['status']
  limit?: number
  offset?: number
}

export function listDepartments(tenantId: ID): Department[] {
  return scope(db().departments, tenantId).sort((a, b) => a.name.localeCompare(b.name))
}

export function listEmployees(tenantId: ID, filters: EmployeeFilters = {}): Employee[] {
  let rows = scope(db().employees, tenantId)

  if (filters.search) {
    const q = filters.search.toLowerCase()
    rows = rows.filter(
      (e) =>
        `${e.firstName} ${e.lastName}`.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        e.code.toLowerCase().includes(q) ||
        e.designation.toLowerCase().includes(q),
    )
  }
  if (filters.departmentId) rows = rows.filter((e) => e.departmentId === filters.departmentId)
  if (filters.status) rows = rows.filter((e) => e.status === filters.status)

  rows = rows.sort((a, b) => a.code.localeCompare(b.code))
  const offset = filters.offset ?? 0
  return filters.limit ? rows.slice(offset, offset + filters.limit) : rows.slice(offset)
}

export function countEmployees(tenantId: ID, filters: EmployeeFilters = {}): number {
  return listEmployees(tenantId, { ...filters, limit: undefined, offset: 0 }).length
}

export function getEmployee(tenantId: ID, id: ID): Employee {
  return requireOne(db().employees, tenantId, id, 'Employee')
}

export type EmployeeInput = Omit<Employee, keyof ReturnType<typeof newRow> | 'code'> & { code?: string }

export function createEmployee(tenantId: ID, input: EmployeeInput, ctx: AuditContext): Employee {
  const existing = scope(db().employees, tenantId)
  if (existing.some((e) => e.email.toLowerCase() === input.email.toLowerCase())) {
    throw new ConflictError(`An employee with email ${input.email} already exists`)
  }

  const nextCode = `EMP${String(existing.length + 1).padStart(4, '0')}`
  const employee: Employee = { ...newRow(tenantId, 'emp'), ...input, code: input.code ?? nextCode }

  db().employees.push(employee)
  appendAudit(ctx, 'employee.create', 'Employee', employee.id, `Created employee ${employee.code} — ${employee.firstName} ${employee.lastName}`)
  emitNotification({
    tenantId,
    event: 'hr.employee_onboarded',
    title: 'New employee onboarded',
    body: `${employee.firstName} ${employee.lastName} joined as ${employee.designation}.`,
    severity: 'success',
    href: '/hr/employees',
  })
  return employee
}

export function updateEmployee(tenantId: ID, id: ID, patch: Partial<Employee>, ctx: AuditContext): Employee {
  const employee = getEmployee(tenantId, id)
  const { id: _id, tenantId: _t, createdAt: _c, ...safe } = patch
  Object.assign(employee, safe)
  touch(employee)
  appendAudit(ctx, 'employee.update', 'Employee', employee.id, `Updated employee ${employee.code}`)
  return employee
}

/** Soft delete — the row is retained so the audit trail stays resolvable. */
export function deleteEmployee(tenantId: ID, id: ID, ctx: AuditContext): void {
  const employee = getEmployee(tenantId, id)
  employee.deletedAt = nowIso()
  employee.status = 'Exited'
  touch(employee)
  appendAudit(ctx, 'employee.delete', 'Employee', employee.id, `Soft-deleted employee ${employee.code}`)
}

/** Reporting hierarchy rooted at department heads. */
export function orgChart(tenantId: ID) {
  const employees = listEmployees(tenantId)
  const byManager = new Map<string, Employee[]>()
  for (const employee of employees) {
    const key = employee.managerId ?? 'root'
    if (!byManager.has(key)) byManager.set(key, [])
    byManager.get(key)!.push(employee)
  }
  return { roots: byManager.get('root') ?? [], byManager }
}

/* ------------------------------------------------------- HR: attendance */

export function listAttendance(tenantId: ID, opts: { employeeId?: ID; from?: string; to?: string } = {}): AttendanceRecord[] {
  let rows = scope(db().attendance, tenantId)
  if (opts.employeeId) rows = rows.filter((r) => r.employeeId === opts.employeeId)
  if (opts.from) rows = rows.filter((r) => r.date >= opts.from!)
  if (opts.to) rows = rows.filter((r) => r.date <= opts.to!)
  return rows.sort((a, b) => b.date.localeCompare(a.date))
}

export function clockIn(tenantId: ID, employeeId: ID, ctx: AuditContext): AttendanceRecord {
  const date = toISODate(new Date())
  const existing = scope(db().attendance, tenantId).find((r) => r.employeeId === employeeId && r.date === date)
  const time = new Date().toISOString().slice(11, 16)

  if (existing?.clockIn) throw new ConflictError('Already clocked in for today')

  const record: AttendanceRecord =
    existing ??
    ({ ...newRow(tenantId, 'att'), employeeId, date, clockIn: null, clockOut: null, workedHours: 0, overtimeHours: 0, status: 'Present' } as AttendanceRecord)

  record.clockIn = time
  record.status = 'Present'
  touch(record)
  if (!existing) db().attendance.push(record)

  appendAudit(ctx, 'attendance.clock_in', 'AttendanceRecord', record.id, `Clocked in at ${time}`)
  return record
}

export function clockOut(tenantId: ID, employeeId: ID, ctx: AuditContext): AttendanceRecord {
  const date = toISODate(new Date())
  const record = scope(db().attendance, tenantId).find((r) => r.employeeId === employeeId && r.date === date)
  if (!record?.clockIn) throw new ConflictError('No clock-in recorded for today')

  const time = new Date().toISOString().slice(11, 16)
  const [inH, inM] = record.clockIn.split(':').map(Number)
  const [outH, outM] = time.split(':').map(Number)
  const worked = Math.max(0, round(outH + outM / 60 - (inH + inM / 60), 1))

  record.clockOut = time
  record.workedHours = worked
  record.overtimeHours = worked > 9 ? round(worked - 9, 1) : 0
  touch(record)

  appendAudit(ctx, 'attendance.clock_out', 'AttendanceRecord', record.id, `Clocked out at ${time} (${worked}h)`)
  return record
}

/* ------------------------------------------------------------- HR: leave */

export function listLeave(tenantId: ID, opts: { employeeId?: ID; status?: LeaveRequest['status'] } = {}): LeaveRequest[] {
  let rows = scope(db().leaveRequests, tenantId)
  if (opts.employeeId) rows = rows.filter((r) => r.employeeId === opts.employeeId)
  if (opts.status) rows = rows.filter((r) => r.status === opts.status)
  return rows.sort((a, b) => b.from.localeCompare(a.from))
}

export function createLeave(
  tenantId: ID,
  input: { employeeId: ID; type: LeaveRequest['type']; from: string; to: string; reason: string },
  ctx: AuditContext,
): LeaveRequest {
  if (input.to < input.from) throw new ConflictError('Leave end date cannot be before the start date')

  const days = Math.max(1, Math.round((new Date(input.to).getTime() - new Date(input.from).getTime()) / 86400000) + 1)
  const employee = getEmployee(tenantId, input.employeeId)

  const request: LeaveRequest = {
    ...newRow(tenantId, 'lv'),
    ...input,
    days,
    status: 'Pending',
    approverId: employee.managerId ?? null,
    decidedAt: null,
    decisionNote: null,
  }

  db().leaveRequests.push(request)
  appendAudit(ctx, 'leave.create', 'LeaveRequest', request.id, `Applied for ${days} day(s) of ${input.type} leave`)
  emitNotification({
    tenantId,
    event: 'hr.leave_pending',
    title: 'Leave request submitted',
    body: `${employee.firstName} ${employee.lastName} requested ${days} day(s) of ${input.type} leave.`,
    severity: 'info',
    href: '/hr/leave',
  })
  return request
}

/** Approve or reject a request — the state machine only moves out of Pending. */
export function decideLeave(tenantId: ID, id: ID, decision: 'Approved' | 'Rejected', note: string | null, ctx: AuditContext): LeaveRequest {
  const request = requireOne(db().leaveRequests, tenantId, id, 'LeaveRequest')
  if (request.status !== 'Pending') throw new ConflictError(`Request is already ${request.status.toLowerCase()}`)

  request.status = decision
  request.approverId = ctx.actorId
  request.decidedAt = nowIso()
  request.decisionNote = note
  touch(request)

  appendAudit(ctx, 'leave.decide', 'LeaveRequest', request.id, `${decision} leave request for ${request.days} day(s)`)
  emitNotification({
    tenantId,
    event: 'hr.leave_decided',
    title: `Leave ${decision.toLowerCase()}`,
    body: `A ${request.type} leave request covering ${request.from} → ${request.to} was ${decision.toLowerCase()}.`,
    severity: decision === 'Approved' ? 'success' : 'warning',
    href: '/hr/leave',
  })
  return request
}

/* ----------------------------------------------------------- HR: payroll */

export function listPayrollRuns(tenantId: ID): PayrollRun[] {
  return scope(db().payrollRuns, tenantId).sort((a, b) => b.period.localeCompare(a.period))
}

export function listPayslips(tenantId: ID, opts: { runId?: ID; employeeId?: ID; period?: string } = {}): Payslip[] {
  let rows = scope(db().payslips, tenantId)
  if (opts.runId) rows = rows.filter((p) => p.runId === opts.runId)
  if (opts.employeeId) rows = rows.filter((p) => p.employeeId === opts.employeeId)
  if (opts.period) rows = rows.filter((p) => p.period === opts.period)
  return rows
}

/**
 * Execute a payroll run for a period.
 *
 * Unpaid-leave days approved inside the period reduce each employee's paid
 * days, and a balanced accrual journal is posted so the GL stays in step.
 */
export function runPayroll(tenantId: ID, period: string, ctx: AuditContext): PayrollRun {
  const existing = scope(db().payrollRuns, tenantId).find((r) => r.period === period && r.status === 'Completed')
  if (existing) throw new ConflictError(`Payroll for ${period} has already been processed`)

  const startedAt = Date.now()
  const employees = listEmployees(tenantId).filter((e) => e.status !== 'Exited')
  const approvedUnpaid = listLeave(tenantId, { status: 'Approved' }).filter((l) => l.type === 'Unpaid' && toPeriod(l.from) === period)

  const run: PayrollRun = {
    ...newRow(tenantId, 'run'),
    period,
    status: 'Processing',
    employeeCount: employees.length,
    grossTotal: 0,
    deductionTotal: 0,
    netTotal: 0,
    processedAt: null,
    processedBy: ctx.actorId,
  }
  db().payrollRuns.push(run)

  let gross = 0
  let deductions = 0
  let net = 0

  for (const employee of employees) {
    const unpaidDays = approvedUnpaid.filter((l) => l.employeeId === employee.id).reduce((s, l) => s + l.days, 0)
    const computed = computePayslip(employee.ctcAnnual, unpaidDays)

    gross += computed.gross
    deductions += computed.totalDeductions
    net += computed.net

    db().payslips.push({
      ...newRow(tenantId, 'slip'),
      runId: run.id,
      employeeId: employee.id,
      period,
      ...computed,
    })
  }

  run.grossTotal = round(gross)
  run.deductionTotal = round(deductions)
  run.netTotal = round(net)
  run.status = 'Completed'
  run.processedAt = nowIso()
  run.durationMs = Date.now() - startedAt
  run.note = `Processed ${employees.length} employees.`
  touch(run)

  // Accrual: expense the gross, split between statutory dues and net payable.
  const tds = round(run.deductionTotal)
  postJournal(
    tenantId,
    {
      date: toISODate(new Date()),
      memo: `Payroll accrual ${period}`,
      currency: getTenant(tenantId).baseCurrency,
      source: 'Payroll',
      lines: [
        { accountCode: '5200', debit: run.grossTotal, credit: 0, memo: 'Salaries & wages' },
        { accountCode: '2300', debit: 0, credit: tds, memo: 'Statutory deductions payable' },
        { accountCode: '2100', debit: 0, credit: run.netTotal, memo: 'Net salaries payable' },
      ],
    },
    ctx,
    { silent: true },
  )

  appendAudit(ctx, 'payroll.run', 'PayrollRun', run.id, `Ran payroll for ${period}: ${employees.length} employees, net ${run.netTotal}`)
  emitNotification({
    tenantId,
    event: 'payroll.run_completed',
    title: `Payroll completed for ${period}`,
    body: `${employees.length} payslips generated. Net payable ${run.netTotal.toLocaleString('en-IN')}.`,
    severity: 'success',
    href: '/hr/payroll',
    channels: ['inApp', 'email'],
  })

  return run
}

/* --------------------------------------------------------- finance: ledger */

export function listAccounts(tenantId: ID): Account[] {
  return scope(db().accounts, tenantId).sort((a, b) => a.code.localeCompare(b.code))
}

export function listJournalEntries(tenantId: ID, opts: { period?: string; status?: JournalEntry['status']; limit?: number } = {}): JournalEntry[] {
  let rows = scope(db().journalEntries, tenantId)
  if (opts.period) rows = rows.filter((e) => e.period === opts.period)
  if (opts.status) rows = rows.filter((e) => e.status === opts.status)
  rows = rows.sort((a, b) => b.date.localeCompare(a.date) || b.reference.localeCompare(a.reference))
  return opts.limit ? rows.slice(0, opts.limit) : rows
}

export function listPeriods(tenantId: ID): AccountingPeriod[] {
  return scope(db().periods, tenantId).sort((a, b) => b.period.localeCompare(a.period))
}

export interface JournalInput {
  date: string
  memo: string
  currency: JournalEntry['currency']
  lines: JournalLine[]
  source?: JournalEntry['source']
  fxRate?: number
}

/** Post a journal entry. Rejects unbalanced lines and closed periods. */
export function postJournal(tenantId: ID, input: JournalInput, ctx: AuditContext, opts: { silent?: boolean } = {}): JournalEntry {
  assertBalanced(input.lines)

  const period = toPeriod(input.date)
  const accountingPeriod = scope(db().periods, tenantId).find((p) => p.period === period)
  if (accountingPeriod?.status === 'Closed') {
    throw new ConflictError(`Accounting period ${period} is closed and cannot accept new postings`)
  }

  const known = new Set(listAccounts(tenantId).map((a) => a.code))
  for (const line of input.lines) {
    if (!known.has(line.accountCode)) throw new ConflictError(`Unknown account code ${line.accountCode}`)
  }

  const count = scope(db().journalEntries, tenantId).length + 1
  const entry: JournalEntry = {
    ...newRow(tenantId, 'je'),
    reference: `JE-${period.replace('-', '')}-${String(count).padStart(4, '0')}`,
    date: input.date,
    period,
    memo: input.memo,
    currency: input.currency,
    fxRate: input.fxRate ?? 1,
    status: 'Posted',
    source: input.source ?? 'Manual',
    postedBy: ctx.actorId,
    lines: input.lines,
  }

  db().journalEntries.push(entry)
  appendAudit(ctx, 'journal.post', 'JournalEntry', entry.id, `Posted ${entry.reference}: ${entry.memo}`)

  if (!opts.silent) {
    emitNotification({
      tenantId,
      event: 'finance.journal_posted',
      title: 'Journal entry posted',
      body: `${entry.reference} — ${entry.memo}`,
      severity: 'info',
      href: '/finance/ledger',
    })
  }

  return entry
}

/** Reverse a posted entry by writing a mirrored contra entry. */
export function reverseJournal(tenantId: ID, id: ID, ctx: AuditContext): JournalEntry {
  const original = requireOne(db().journalEntries, tenantId, id, 'JournalEntry')
  if (original.status !== 'Posted') throw new ConflictError('Only posted entries can be reversed')

  original.status = 'Reversed'
  touch(original)

  const reversal = postJournal(
    tenantId,
    {
      date: toISODate(new Date()),
      memo: `Reversal of ${original.reference}`,
      currency: original.currency,
      source: 'System',
      lines: original.lines.map((l) => ({ accountCode: l.accountCode, debit: l.credit, credit: l.debit, memo: l.memo })),
    },
    ctx,
    { silent: true },
  )

  appendAudit(ctx, 'journal.reverse', 'JournalEntry', original.id, `Reversed ${original.reference} via ${reversal.reference}`)
  return reversal
}

export function closePeriod(tenantId: ID, period: string, ctx: AuditContext): AccountingPeriod {
  const record = scope(db().periods, tenantId).find((p) => p.period === period)
  if (!record) throw new NotFoundError('AccountingPeriod', period)
  if (record.status === 'Closed') throw new ConflictError(`Period ${period} is already closed`)

  const drafts = listJournalEntries(tenantId, { period, status: 'Draft' })
  if (drafts.length > 0) {
    throw new ConflictError(`${drafts.length} draft journal entr${drafts.length === 1 ? 'y' : 'ies'} must be posted or discarded before closing ${period}`)
  }

  record.status = 'Closed'
  record.closedAt = nowIso()
  record.closedBy = ctx.actorId
  touch(record)

  appendAudit(ctx, 'period.close', 'AccountingPeriod', record.id, `Closed accounting period ${period}`)
  emitNotification({
    tenantId,
    event: 'finance.period_closed',
    title: `Period ${period} closed`,
    body: 'The ledger is now locked for this period. Postings require an admin override.',
    severity: 'success',
    href: '/finance/ledger',
  })
  return record
}

export function reopenPeriod(tenantId: ID, period: string, ctx: AuditContext): AccountingPeriod {
  const record = scope(db().periods, tenantId).find((p) => p.period === period)
  if (!record) throw new NotFoundError('AccountingPeriod', period)

  record.status = 'Open'
  record.closedAt = null
  record.closedBy = null
  touch(record)

  appendAudit(ctx, 'period.reopen', 'AccountingPeriod', record.id, `Reopened accounting period ${period} (admin override)`)
  return record
}

/* ------------------------------------------------------------ finance: AP/AR */

export function listInvoices(tenantId: ID, opts: { kind?: Invoice['kind']; status?: Invoice['status']; search?: string } = {}): Invoice[] {
  let rows = scope(db().invoices, tenantId)
  if (opts.kind) rows = rows.filter((i) => i.kind === opts.kind)
  if (opts.status) rows = rows.filter((i) => i.status === opts.status)
  if (opts.search) {
    const q = opts.search.toLowerCase()
    rows = rows.filter((i) => i.number.toLowerCase().includes(q) || i.counterpartyName.toLowerCase().includes(q))
  }
  return rows.sort((a, b) => b.issueDate.localeCompare(a.issueDate))
}

export function getInvoice(tenantId: ID, id: ID): Invoice {
  return requireOne(db().invoices, tenantId, id, 'Invoice')
}

export function listPayments(tenantId: ID): Payment[] {
  return scope(db().payments, tenantId).sort((a, b) => b.paidOn.localeCompare(a.paidOn))
}

export function approveInvoice(tenantId: ID, id: ID, ctx: AuditContext): Invoice {
  const invoice = getInvoice(tenantId, id)
  if (invoice.status === 'Paid') throw new ConflictError('Invoice is already settled')
  if (invoice.matchState === 'Price Variance' || invoice.matchState === 'Qty Variance') {
    throw new ConflictError(`Cannot approve — 3-way match reported a ${invoice.matchState.toLowerCase()}`)
  }

  invoice.status = 'Approved'
  touch(invoice)
  appendAudit(ctx, 'invoice.approve', 'Invoice', invoice.id, `Approved ${invoice.number} for ${invoice.total}`)
  return invoice
}

/** Record a payment and post the matching cash journal. */
export function recordPayment(
  tenantId: ID,
  input: { invoiceId: ID; amount: number; method: Payment['method'] },
  ctx: AuditContext,
): Payment {
  const invoice = getInvoice(tenantId, input.invoiceId)
  const outstanding = round(invoice.total - invoice.amountPaid)
  if (input.amount <= 0) throw new ConflictError('Payment amount must be positive')
  if (input.amount > outstanding + 0.01) throw new ConflictError(`Payment exceeds the outstanding balance of ${outstanding}`)

  const payment: Payment = {
    ...newRow(tenantId, 'pay'),
    invoiceId: invoice.id,
    kind: invoice.kind,
    amount: round(input.amount),
    currency: invoice.currency,
    paidOn: toISODate(new Date()),
    method: input.method,
    reference: `TXN${Math.floor(Date.now() % 1_000_000)}`,
    runId: null,
  }

  db().payments.push(payment)
  invoice.amountPaid = round(invoice.amountPaid + payment.amount)
  invoice.status = invoice.amountPaid >= invoice.total - 0.01 ? 'Paid' : 'Partially Paid'
  touch(invoice)

  const baseAmount = round(payment.amount * (invoice.fxRate || 1))
  postJournal(
    tenantId,
    {
      date: payment.paidOn,
      memo: `${invoice.kind === 'AP' ? 'Vendor payment' : 'Customer receipt'} — ${invoice.number}`,
      currency: getTenant(tenantId).baseCurrency,
      source: invoice.kind,
      lines:
        invoice.kind === 'AP'
          ? [
              { accountCode: '2000', debit: baseAmount, credit: 0, memo: 'Accounts payable' },
              { accountCode: '1000', debit: 0, credit: baseAmount, memo: 'Bank' },
            ]
          : [
              { accountCode: '1000', debit: baseAmount, credit: 0, memo: 'Bank' },
              { accountCode: '1200', debit: 0, credit: baseAmount, memo: 'Accounts receivable' },
            ],
    },
    ctx,
    { silent: true },
  )

  appendAudit(ctx, 'payment.record', 'Payment', payment.id, `Recorded ${payment.amount} against ${invoice.number}`)
  return payment
}

/* ------------------------------------------------------------ supply chain */

export function listVendors(tenantId: ID): Vendor[] {
  return scope(db().vendors, tenantId).sort((a, b) => a.name.localeCompare(b.name))
}

export function listCustomers(tenantId: ID): Customer[] {
  return scope(db().customers, tenantId).sort((a, b) => a.name.localeCompare(b.name))
}

export function listWarehouses(tenantId: ID): Warehouse[] {
  return scope(db().warehouses, tenantId)
}

export function listInventory(tenantId: ID, opts: { search?: string; category?: string; lowOnly?: boolean } = {}): InventoryItem[] {
  let rows = scope(db().inventory, tenantId)
  if (opts.search) {
    const q = opts.search.toLowerCase()
    rows = rows.filter((i) => i.sku.toLowerCase().includes(q) || i.name.toLowerCase().includes(q))
  }
  if (opts.category) rows = rows.filter((i) => i.category === opts.category)
  if (opts.lowOnly) rows = rows.filter((i) => i.onHand - i.allocated <= i.reorderPoint)
  return rows.sort((a, b) => a.sku.localeCompare(b.sku))
}

export function getInventoryItem(tenantId: ID, id: ID): InventoryItem {
  return requireOne(db().inventory, tenantId, id, 'InventoryItem')
}

export function listStockMovements(tenantId: ID, sku?: string): StockMovement[] {
  let rows = scope(db().stockMovements, tenantId)
  if (sku) rows = rows.filter((m) => m.sku === sku)
  return rows.sort((a, b) => b.date.localeCompare(a.date))
}

export function adjustStock(tenantId: ID, id: ID, qty: number, reason: string, ctx: AuditContext): InventoryItem {
  const item = getInventoryItem(tenantId, id)
  if (item.onHand + qty < 0) throw new ConflictError('Adjustment would drive stock negative')

  item.onHand += qty
  touch(item)

  db().stockMovements.push({
    ...newRow(tenantId, 'mov'),
    sku: item.sku,
    date: toISODate(new Date()),
    qty,
    kind: 'Adjustment',
    reference: reason,
    unitCost: item.unitCost,
  })

  appendAudit(ctx, 'inventory.adjust', 'InventoryItem', item.id, `Adjusted ${item.sku} by ${qty > 0 ? '+' : ''}${qty} (${reason})`)
  return item
}

export function listPurchaseOrders(tenantId: ID, opts: { status?: PurchaseOrder['status'] } = {}): PurchaseOrder[] {
  let rows = scope(db().purchaseOrders, tenantId)
  if (opts.status) rows = rows.filter((p) => p.status === opts.status)
  return rows.sort((a, b) => b.orderDate.localeCompare(a.orderDate))
}

export function getPurchaseOrder(tenantId: ID, id: ID): PurchaseOrder {
  return requireOne(db().purchaseOrders, tenantId, id, 'PurchaseOrder')
}

export function listGoodsReceipts(tenantId: ID): GoodsReceipt[] {
  return scope(db().goodsReceipts, tenantId).sort((a, b) => b.receivedOn.localeCompare(a.receivedOn))
}

export function approvePurchaseOrder(tenantId: ID, id: ID, ctx: AuditContext): PurchaseOrder {
  const po = getPurchaseOrder(tenantId, id)
  if (po.status !== 'Draft' && po.status !== 'Pending Approval') {
    throw new ConflictError(`Purchase order is ${po.status} and cannot be approved`)
  }

  po.status = 'Approved'
  po.approvedBy = ctx.actorId
  touch(po)

  appendAudit(ctx, 'po.approve', 'PurchaseOrder', po.id, `Approved ${po.number} (${po.total})`)
  emitNotification({
    tenantId,
    event: 'scm.po_approved',
    title: `Purchase order ${po.number} approved`,
    body: `${po.vendorName} has been notified of the approved order.`,
    severity: 'success',
    href: '/supply-chain/purchase-orders',
    channels: ['inApp', 'email', 'webhook'],
  })
  return po
}

/** Book a goods receipt, move stock and advance the PO state. */
export function receivePurchaseOrder(tenantId: ID, id: ID, ctx: AuditContext): PurchaseOrder {
  const po = getPurchaseOrder(tenantId, id)
  if (po.status === 'Received' || po.status === 'Cancelled') {
    throw new ConflictError(`Purchase order is already ${po.status}`)
  }
  if (po.status === 'Draft' || po.status === 'Pending Approval') {
    throw new ConflictError('Purchase order must be approved before goods can be received')
  }

  const receiptLines: { sku: string; qtyReceived: number }[] = []
  const inventory = scope(db().inventory, tenantId)

  for (const line of po.lines) {
    const outstanding = line.qty - line.qtyReceived
    if (outstanding <= 0) continue

    line.qtyReceived = line.qty
    receiptLines.push({ sku: line.sku, qtyReceived: outstanding })

    const item = inventory.find((i) => i.sku === line.sku)
    if (item) {
      item.onHand += outstanding
      touch(item)
    }

    db().stockMovements.push({
      ...newRow(tenantId, 'mov'),
      sku: line.sku,
      date: toISODate(new Date()),
      qty: outstanding,
      kind: 'Receipt',
      reference: po.number,
      unitCost: line.unitPrice,
    })
  }

  po.status = 'Received'
  touch(po)

  const count = scope(db().goodsReceipts, tenantId).length + 1
  db().goodsReceipts.push({
    ...newRow(tenantId, 'grn'),
    number: `GRN-2026-${String(9000 + count)}`,
    poId: po.id,
    receivedOn: toISODate(new Date()),
    lines: receiptLines,
    receivedBy: ctx.actorId,
  })

  appendAudit(ctx, 'po.receive', 'PurchaseOrder', po.id, `Received all outstanding lines on ${po.number}`)
  return po
}

/**
 * Run the reorder-point engine and raise draft purchase orders for every
 * shortage, grouped by the vendor with the best on-time delivery record (F-05).
 */
export function runReorderEngine(tenantId: ID, ctx: AuditContext): PurchaseOrder[] {
  const items = listInventory(tenantId)
  const open = listPurchaseOrders(tenantId)
  const suggestions = reorderSuggestions(items, open)
  if (suggestions.length === 0) return []

  const vendors = listVendors(tenantId).filter((v) => v.isActive)
  if (vendors.length === 0) throw new ConflictError('No active vendors are available to raise purchase orders against')

  const preferred = [...vendors].sort((a, b) => b.onTimeDeliveryPct - a.onTimeDeliveryPct)
  const created: PurchaseOrder[] = []
  const chunkSize = Math.ceil(suggestions.length / Math.min(preferred.length, 3))

  for (let i = 0; i < suggestions.length; i += chunkSize) {
    const chunk = suggestions.slice(i, i + chunkSize)
    const vendor = preferred[Math.floor(i / chunkSize) % preferred.length]
    const maxLeadTime = Math.max(...chunk.map((s) => s.leadTimeDays))

    const lines = chunk.map((s) => ({
      sku: s.sku,
      description: s.name,
      qty: s.suggestedQty,
      qtyReceived: 0,
      unitPrice: s.unitCost,
    }))

    const count = scope(db().purchaseOrders, tenantId).length + created.length + 1
    const po: PurchaseOrder = {
      ...newRow(tenantId, 'po'),
      number: `PO-2026-${String(5000 + count)}`,
      vendorId: vendor.id,
      vendorName: vendor.name,
      status: 'Pending Approval',
      orderDate: toISODate(new Date()),
      expectedDate: toISODate(addDays(new Date(), maxLeadTime)),
      currency: vendor.currency,
      fxRate: vendor.currency === getTenant(tenantId).baseCurrency ? 1 : 84,
      total: round(lines.reduce((s, l) => s + l.qty * l.unitPrice, 0)),
      lines,
      autoGenerated: true,
      approvedBy: null,
    }

    db().purchaseOrders.push(po)
    created.push(po)
  }

  appendAudit(
    ctx,
    'inventory.reorder_run',
    'PurchaseOrder',
    created.map((p) => p.number).join(','),
    `Reorder engine raised ${created.length} draft purchase order(s) covering ${suggestions.length} SKU(s)`,
  )
  emitNotification({
    tenantId,
    event: 'inventory.reorder_triggered',
    title: 'Reorder engine raised new purchase orders',
    body: `${created.length} purchase order(s) awaiting approval for ${suggestions.length} SKU(s) below their reorder point.`,
    severity: 'warning',
    href: '/supply-chain/purchase-orders',
    channels: ['inApp', 'email', 'webhook'],
  })

  return created
}

/* ---------------------------------------------------------------- projects */

export function listProjects(tenantId: ID): Project[] {
  return scope(db().projects, tenantId).sort((a, b) => a.code.localeCompare(b.code))
}

export function getProject(tenantId: ID, id: ID): Project {
  return requireOne(db().projects, tenantId, id, 'Project')
}

export function listTasks(tenantId: ID, projectId?: ID): ProjectTask[] {
  let rows = scope(db().tasks, tenantId)
  if (projectId) rows = rows.filter((t) => t.projectId === projectId)
  return rows.sort((a, b) => a.startDate.localeCompare(b.startDate))
}

export function updateTask(tenantId: ID, id: ID, patch: Partial<ProjectTask>, ctx: AuditContext): ProjectTask {
  const task = requireOne(db().tasks, tenantId, id, 'ProjectTask')
  const { id: _i, tenantId: _t, projectId: _p, createdAt: _c, ...safe } = patch
  Object.assign(task, safe)
  if (task.status === 'Done') task.progressPct = 100
  touch(task)

  const siblings = listTasks(tenantId, task.projectId)
  const project = getProject(tenantId, task.projectId)
  project.progressPct = Math.round(siblings.reduce((s, t) => s + t.progressPct, 0) / Math.max(1, siblings.length))
  touch(project)

  appendAudit(ctx, 'task.update', 'ProjectTask', task.id, `Updated task "${task.name}" → ${task.status} (${task.progressPct}%)`)
  return task
}

/* ------------------------------------------------------------- forecasting */

export function listDemandSeries(tenantId: ID): DemandSeries[] {
  return scope(db().demandSeries, tenantId).sort((a, b) => a.sku.localeCompare(b.sku))
}

export function getDemandSeries(tenantId: ID, sku: string): DemandSeries {
  const found = scope(db().demandSeries, tenantId).find((s) => s.sku === sku)
  if (!found) throw new NotFoundError('DemandSeries', sku)
  return found
}

/* ----------------------------------------------------------- notifications */

export function listNotifications(tenantId: ID, opts: { unreadOnly?: boolean; limit?: number } = {}): Notification[] {
  let rows = scope(db().notifications, tenantId)
  if (opts.unreadOnly) rows = rows.filter((n) => !n.read)
  rows = rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return opts.limit ? rows.slice(0, opts.limit) : rows
}

export function markNotificationRead(tenantId: ID, id: ID): Notification {
  const notification = requireOne(db().notifications, tenantId, id, 'Notification')
  notification.read = true
  touch(notification)
  return notification
}

export function markAllNotificationsRead(tenantId: ID): number {
  const unread = scope(db().notifications, tenantId).filter((n) => !n.read)
  for (const notification of unread) {
    notification.read = true
    touch(notification)
  }
  return unread.length
}

/* ------------------------------------------------------------------- audit */

export function listAuditLogs(tenantId: ID, opts: { limit?: number; action?: string; search?: string } = {}): AuditLog[] {
  let rows = db().auditLogs.filter((l) => l.tenantId === tenantId)
  if (opts.action) rows = rows.filter((l) => l.action === opts.action)
  if (opts.search) {
    const q = opts.search.toLowerCase()
    rows = rows.filter((l) => l.summary.toLowerCase().includes(q) || l.action.toLowerCase().includes(q) || l.actorName.toLowerCase().includes(q))
  }
  rows = rows.sort((a, b) => b.seq - a.seq)
  return opts.limit ? rows.slice(0, opts.limit) : rows
}

export { db, appendAudit, emitNotification }
export type { AuditContext }
