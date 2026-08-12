'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { auditContext, requireSession } from '@/lib/auth/session'
import { assertCan, type Permission } from '@/lib/auth/rbac'
import { resetStore } from '@/lib/db/store'
import {
  adjustStock,
  approveInvoice,
  approvePurchaseOrder,
  closePeriod,
  createEmployee,
  createLeave,
  clockIn,
  clockOut,
  decideLeave,
  deleteEmployee,
  markAllNotificationsRead,
  markNotificationRead,
  postJournal,
  receivePurchaseOrder,
  recordPayment,
  reopenPeriod,
  runPayroll,
  runReorderEngine,
  updateNotificationPrefs,
  updateTask,
} from '@/lib/db/repo'
import { toISODate } from '@/lib/utils'

/**
 * Server actions behind every mutating control in the UI.
 *
 * Each one re-checks the session and the specific permission rather than
 * trusting that the button was only rendered for the right role.
 */

export interface ActionResult {
  ok: boolean
  message: string
}

async function guarded(permission: Permission, run: (ctx: Awaited<ReturnType<typeof auditContext>>, tenantId: string) => string): Promise<ActionResult> {
  try {
    const session = await requireSession()
    assertCan(session, permission)
    const ctx = await auditContext(session)
    const message = run(ctx, session.tenantId)
    return { ok: true, message }
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : 'Something went wrong.' }
  }
}

function refresh(...paths: string[]) {
  for (const path of paths) revalidatePath(path)
}

/* ------------------------------------------------------------------ payroll */

export async function runPayrollAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const period = String(formData.get('period') ?? '')
  const result = await guarded('payroll.run', (ctx, tenantId) => {
    const run = runPayroll(tenantId, period, ctx)
    return `Payroll for ${period} completed — ${run.employeeCount} payslips generated in ${run.durationMs} ms.`
  })
  refresh('/hr/payroll', '/dashboard', '/finance/ledger', '/audit', '/notifications')
  return result
}

/* -------------------------------------------------------------------- leave */

export async function decideLeaveAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const id = String(formData.get('id') ?? '')
  const decision = String(formData.get('decision') ?? '') as 'Approved' | 'Rejected'
  const result = await guarded('leave.approve', (ctx, tenantId) => {
    decideLeave(tenantId, id, decision, null, ctx)
    return `Leave request ${decision.toLowerCase()}.`
  })
  refresh('/hr/leave', '/dashboard', '/audit', '/notifications')
  return result
}

const leaveSchema = z.object({
  employeeId: z.string().min(1, 'Choose an employee.'),
  type: z.enum(['Casual', 'Sick', 'Earned', 'Unpaid', 'Maternity']),
  from: z.string().min(10),
  to: z.string().min(10),
  reason: z.string().min(3, 'Add a short reason.').max(240),
})

export async function createLeaveAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = leaveSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? 'Invalid leave request.' }

  const result = await guarded('leave.apply', (ctx, tenantId) => {
    const request = createLeave(tenantId, parsed.data, ctx)
    return `Applied for ${request.days} day(s) of ${request.type} leave.`
  })
  refresh('/hr/leave', '/dashboard', '/audit')
  return result
}

/* --------------------------------------------------------------- attendance */

export async function clockAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const employeeId = String(formData.get('employeeId') ?? '')
  const action = String(formData.get('action') ?? '')

  const result = await guarded('attendance.self', (ctx, tenantId) => {
    const record = action === 'clock-in' ? clockIn(tenantId, employeeId, ctx) : clockOut(tenantId, employeeId, ctx)
    return action === 'clock-in' ? `Clocked in at ${record.clockIn}.` : `Clocked out at ${record.clockOut} — ${record.workedHours}h logged.`
  })
  refresh('/hr/attendance', '/dashboard', '/audit')
  return result
}

/* ------------------------------------------------------------------ finance */

const journalSchema = z.object({
  date: z.string().min(10),
  memo: z.string().min(3, 'Describe the entry.').max(200),
  lines: z
    .array(z.object({ accountCode: z.string().min(1), debit: z.number().min(0), credit: z.number().min(0) }))
    .min(2, 'A journal entry needs at least two lines.'),
})

export async function postJournalAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  let payload: unknown
  try {
    payload = {
      date: String(formData.get('date') ?? toISODate(new Date())),
      memo: String(formData.get('memo') ?? ''),
      lines: JSON.parse(String(formData.get('lines') ?? '[]')),
    }
  } catch {
    return { ok: false, message: 'Could not read the journal lines.' }
  }

  const parsed = journalSchema.safeParse(payload)
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? 'Invalid journal entry.' }

  const result = await guarded('finance.post', (ctx, tenantId) => {
    const entry = postJournal(tenantId, { ...parsed.data, currency: 'INR' }, ctx)
    return `Posted ${entry.reference}.`
  })
  refresh('/finance/ledger', '/dashboard', '/audit', '/analytics')
  return result
}

export async function periodAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const period = String(formData.get('period') ?? '')
  const action = String(formData.get('action') ?? '')

  const result = await guarded('finance.close_period', (ctx, tenantId) => {
    if (action === 'close') {
      closePeriod(tenantId, period, ctx)
      return `Period ${period} is now closed.`
    }
    reopenPeriod(tenantId, period, ctx)
    return `Period ${period} reopened.`
  })
  refresh('/finance/ledger', '/audit', '/notifications')
  return result
}

export async function approveInvoiceAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const id = String(formData.get('id') ?? '')
  const result = await guarded('invoice.approve', (ctx, tenantId) => {
    const invoice = approveInvoice(tenantId, id, ctx)
    return `${invoice.number} approved.`
  })
  refresh('/finance/payables', '/finance/receivables', '/audit')
  return result
}

export async function recordPaymentAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const invoiceId = String(formData.get('invoiceId') ?? '')
  const amount = Number(formData.get('amount'))
  const method = String(formData.get('method') ?? 'Bank Transfer') as 'Bank Transfer'

  if (!Number.isFinite(amount) || amount <= 0) return { ok: false, message: 'Enter a payment amount greater than zero.' }

  const result = await guarded('payment.record', (ctx, tenantId) => {
    const payment = recordPayment(tenantId, { invoiceId, amount, method }, ctx)
    return `Recorded payment ${payment.reference}.`
  })
  refresh('/finance/payables', '/finance/receivables', '/finance/ledger', '/dashboard', '/audit')
  return result
}

/* ------------------------------------------------------------- supply chain */

export async function adjustStockAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const id = String(formData.get('id') ?? '')
  const qty = Number(formData.get('qty'))
  const reason = String(formData.get('reason') ?? '').trim()

  if (!Number.isInteger(qty) || qty === 0) return { ok: false, message: 'Enter a non-zero whole number.' }
  if (reason.length < 3) return { ok: false, message: 'Give a reason of at least 3 characters.' }

  const result = await guarded('inventory.adjust', (ctx, tenantId) => {
    const item = adjustStock(tenantId, id, qty, reason, ctx)
    return `${item.sku} adjusted — now ${item.onHand} on hand.`
  })
  refresh('/supply-chain/inventory', '/dashboard', '/audit')
  return result
}

export async function runReorderAction(_prev: ActionResult | null): Promise<ActionResult> {
  const result = await guarded('po.reorder_run', (ctx, tenantId) => {
    const orders = runReorderEngine(tenantId, ctx)
    return orders.length === 0
      ? 'Nothing to reorder — every SKU is above its reorder point or already on order.'
      : `Raised ${orders.length} purchase order(s) awaiting approval.`
  })
  refresh('/supply-chain/inventory', '/supply-chain/purchase-orders', '/dashboard', '/audit', '/notifications')
  return result
}

export async function purchaseOrderAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const id = String(formData.get('id') ?? '')
  const action = String(formData.get('action') ?? '')

  const result = await guarded('po.approve', (ctx, tenantId) => {
    const po = action === 'approve' ? approvePurchaseOrder(tenantId, id, ctx) : receivePurchaseOrder(tenantId, id, ctx)
    return action === 'approve' ? `${po.number} approved.` : `${po.number} received into stock.`
  })
  refresh('/supply-chain/purchase-orders', '/supply-chain/inventory', '/dashboard', '/audit')
  return result
}

/* ----------------------------------------------------------------- projects */

export async function updateTaskAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const taskId = String(formData.get('taskId') ?? '')
  const status = String(formData.get('status') ?? '') as 'Todo' | 'In Progress' | 'Blocked' | 'Done'

  const result = await guarded('project.manage', (ctx, tenantId) => {
    const task = updateTask(tenantId, taskId, { status }, ctx)
    return `"${task.name}" moved to ${task.status}.`
  })
  refresh('/projects', '/dashboard', '/audit')
  return result
}

/* ------------------------------------------------------------------- people */

const employeeSchema = z.object({
  firstName: z.string().min(1, 'First name is required.'),
  lastName: z.string().min(1, 'Last name is required.'),
  email: z.string().email('Enter a valid email address.'),
  phone: z.string().default(''),
  departmentId: z.string().min(1, 'Choose a department.'),
  designation: z.string().min(2, 'Enter a designation.'),
  employmentType: z.enum(['Full-time', 'Part-time', 'Contract', 'Intern']),
  location: z.string().min(1),
  ctcAnnual: z.coerce.number().min(1, 'Enter an annual CTC.'),
})

export async function createEmployeeAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = employeeSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? 'Invalid employee details.' }

  const result = await guarded('employee.manage', (ctx, tenantId) => {
    const employee = createEmployee(
      tenantId,
      {
        ...parsed.data,
        managerId: null,
        status: 'Active',
        joinedOn: toISODate(new Date()),
        bankLast4: '0000',
        pan: 'AAAPZ0000A',
      },
      ctx,
    )
    return `${employee.firstName} ${employee.lastName} added as ${employee.code}.`
  })
  refresh('/hr/employees', '/dashboard', '/audit', '/notifications')
  return result
}

export async function deleteEmployeeAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const id = String(formData.get('id') ?? '')
  const result = await guarded('employee.manage', (ctx, tenantId) => {
    deleteEmployee(tenantId, id, ctx)
    return 'Employee record archived.'
  })
  refresh('/hr/employees', '/dashboard', '/audit')
  return result
}

/* ------------------------------------------------------------ notifications */

export async function notificationAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const id = formData.get('id')
  const all = formData.get('all') === 'true'

  const result = await guarded('notification.manage', (_ctx, tenantId) => {
    if (all) {
      const count = markAllNotificationsRead(tenantId)
      return `${count} notification(s) marked as read.`
    }
    markNotificationRead(tenantId, String(id ?? ''))
    return 'Marked as read.'
  })
  refresh('/notifications', '/dashboard')
  return result
}

export async function updatePrefsAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const prefs = {
    inApp: formData.get('inApp') === 'on',
    email: formData.get('email') === 'on',
    webhook: formData.get('webhook') === 'on',
  }

  try {
    const session = await requireSession()
    assertCan(session, 'notification.manage')
    const ctx = await auditContext(session)
    updateNotificationPrefs(session.tenantId, session.id, prefs, ctx)
    refresh('/settings', '/audit')
    return { ok: true, message: 'Notification preferences saved.' }
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : 'Could not save preferences.' }
  }
}

/* ------------------------------------------------------------------- system */

export async function resetDemoAction(_prev: ActionResult | null): Promise<ActionResult> {
  try {
    const session = await requireSession()
    assertCan(session, 'system.reset')
    resetStore()
    refresh('/dashboard', '/hr/employees', '/finance/ledger', '/supply-chain/inventory', '/audit', '/notifications', '/settings')
    return { ok: true, message: 'Demo dataset restored to its seeded state.' }
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : 'Reset failed.' }
  }
}
