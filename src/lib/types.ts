/**
 * AMDOX ERP — domain model.
 *
 * Every persisted entity carries `tenantId` so the repository layer can enforce
 * row-level isolation (the multi-tenancy strategy from §5.2 / F-01), plus
 * `createdAt` / `updatedAt` and a soft-delete flag.
 */

export type ID = string
export type ISODate = string

export interface BaseEntity {
  id: ID
  tenantId: ID
  createdAt: ISODate
  updatedAt: ISODate
  deletedAt?: ISODate | null
}

/* ------------------------------------------------------------------ tenancy */

export interface Tenant {
  id: ID
  name: string
  slug: string
  baseCurrency: CurrencyCode
  country: string
  plan: 'starter' | 'growth' | 'enterprise'
  mfaRequired: boolean
  createdAt: ISODate
}

/** Ordered least → most privileged. `rank()` in rbac.ts relies on this order. */
export const ROLES = ['Viewer', 'Employee', 'Manager', 'TenantAdmin', 'SuperAdmin'] as const
export type Role = (typeof ROLES)[number]

export interface User extends BaseEntity {
  email: string
  name: string
  role: Role
  /** Demo-grade credential digest — SHA-256(email + ':' + password). */
  passwordHash: string
  employeeId?: ID | null
  mfaEnabled: boolean
  lastLoginAt?: ISODate | null
  notificationPrefs: NotificationPrefs
}

export interface NotificationPrefs {
  inApp: boolean
  email: boolean
  webhook: boolean
  /** Event types the user has muted. */
  muted: string[]
}

/* -------------------------------------------------------------- HR & payroll */

export interface Department extends BaseEntity {
  code: string
  name: string
  headEmployeeId?: ID | null
  costCenter: string
  budgetAnnual: number
}

export type EmploymentType = 'Full-time' | 'Part-time' | 'Contract' | 'Intern'
export type EmployeeStatus = 'Active' | 'On Leave' | 'Probation' | 'Exited'

export interface Employee extends BaseEntity {
  code: string
  firstName: string
  lastName: string
  email: string
  phone: string
  departmentId: ID
  managerId?: ID | null
  designation: string
  employmentType: EmploymentType
  status: EmployeeStatus
  joinedOn: ISODate
  location: string
  /** Annual cost to company, in tenant base currency. */
  ctcAnnual: number
  bankLast4: string
  pan: string
}

export type AttendanceStatus = 'Present' | 'Remote' | 'Absent' | 'Leave' | 'Holiday' | 'Weekend'

export interface AttendanceRecord extends BaseEntity {
  employeeId: ID
  date: ISODate
  clockIn?: string | null
  clockOut?: string | null
  workedHours: number
  overtimeHours: number
  status: AttendanceStatus
}

export type LeaveType = 'Casual' | 'Sick' | 'Earned' | 'Unpaid' | 'Maternity'
export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled'

export interface LeaveRequest extends BaseEntity {
  employeeId: ID
  type: LeaveType
  from: ISODate
  to: ISODate
  days: number
  reason: string
  status: LeaveStatus
  approverId?: ID | null
  decidedAt?: ISODate | null
  decisionNote?: string | null
}

export type PayrollRunStatus = 'Draft' | 'Processing' | 'Completed' | 'Failed' | 'Reverted'

export interface PayrollRun extends BaseEntity {
  period: string // 'YYYY-MM'
  status: PayrollRunStatus
  employeeCount: number
  grossTotal: number
  deductionTotal: number
  netTotal: number
  processedAt?: ISODate | null
  processedBy?: ID | null
  durationMs?: number
  note?: string
}

export interface Payslip extends BaseEntity {
  runId: ID
  employeeId: ID
  period: string
  basic: number
  hra: number
  specialAllowance: number
  gross: number
  pf: number
  professionalTax: number
  incomeTax: number
  leaveDeduction: number
  totalDeductions: number
  net: number
  paidDays: number
}

/* ------------------------------------------------------------------- finance */

export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP' | 'AED' | 'SGD'

export interface FxRate {
  code: CurrencyCode
  /** Units of `code` per 1 unit of tenant base currency. */
  rateToBase: number
  asOf: ISODate
}

export type AccountType = 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense'

export interface Account extends BaseEntity {
  code: string
  name: string
  type: AccountType
  /** 'debit' accounts increase on the debit side. */
  normalBalance: 'debit' | 'credit'
  parentCode?: string | null
  isActive: boolean
}

export interface JournalLine {
  accountCode: string
  debit: number
  credit: number
  memo?: string
}

export type JournalStatus = 'Draft' | 'Posted' | 'Reversed'

export interface JournalEntry extends BaseEntity {
  reference: string
  date: ISODate
  period: string // 'YYYY-MM'
  memo: string
  currency: CurrencyCode
  fxRate: number
  status: JournalStatus
  lines: JournalLine[]
  postedBy?: ID | null
  source: 'Manual' | 'AP' | 'AR' | 'Payroll' | 'Inventory' | 'System'
}

export interface AccountingPeriod extends BaseEntity {
  period: string
  status: 'Open' | 'Closed'
  closedAt?: ISODate | null
  closedBy?: ID | null
}

export type InvoiceKind = 'AP' | 'AR'
export type InvoiceStatus = 'Draft' | 'Awaiting Match' | 'Approved' | 'Partially Paid' | 'Paid' | 'Overdue' | 'Disputed'
/** 3-way match: PO ↔ goods receipt ↔ invoice (F-03). */
export type MatchState = 'Matched' | 'Price Variance' | 'Qty Variance' | 'No PO' | 'Pending'

export interface Invoice extends BaseEntity {
  kind: InvoiceKind
  number: string
  counterpartyId: ID
  counterpartyName: string
  issueDate: ISODate
  dueDate: ISODate
  currency: CurrencyCode
  fxRate: number
  subtotal: number
  taxAmount: number
  total: number
  amountPaid: number
  status: InvoiceStatus
  poId?: ID | null
  matchState: MatchState
  ocrConfidence?: number
  lines: { description: string; qty: number; unitPrice: number }[]
}

export interface Payment extends BaseEntity {
  invoiceId: ID
  kind: InvoiceKind
  amount: number
  currency: CurrencyCode
  paidOn: ISODate
  method: 'Bank Transfer' | 'UPI' | 'Card' | 'Cheque'
  reference: string
  runId?: ID | null
}

/* -------------------------------------------------------------- supply chain */

export interface Vendor extends BaseEntity {
  code: string
  name: string
  email: string
  phone: string
  country: string
  currency: CurrencyCode
  paymentTermsDays: number
  rating: number
  onTimeDeliveryPct: number
  isActive: boolean
}

export interface Customer extends BaseEntity {
  code: string
  name: string
  email: string
  country: string
  currency: CurrencyCode
  creditLimit: number
  paymentTermsDays: number
}

export interface Warehouse extends BaseEntity {
  code: string
  name: string
  city: string
}

export interface InventoryItem extends BaseEntity {
  sku: string
  name: string
  category: string
  uom: string
  warehouseCode: string
  onHand: number
  allocated: number
  reorderPoint: number
  reorderQty: number
  unitCost: number
  leadTimeDays: number
  autoReorder: boolean
}

export interface StockMovement extends BaseEntity {
  sku: string
  date: ISODate
  qty: number // +receipt / −issue
  kind: 'Receipt' | 'Issue' | 'Adjustment' | 'Transfer'
  reference: string
  unitCost: number
}

export type POStatus = 'Draft' | 'Pending Approval' | 'Approved' | 'Partially Received' | 'Received' | 'Cancelled'

export interface PurchaseOrderLine {
  sku: string
  description: string
  qty: number
  qtyReceived: number
  unitPrice: number
}

export interface PurchaseOrder extends BaseEntity {
  number: string
  vendorId: ID
  vendorName: string
  status: POStatus
  orderDate: ISODate
  expectedDate: ISODate
  currency: CurrencyCode
  fxRate: number
  total: number
  lines: PurchaseOrderLine[]
  /** Set when the reorder-point engine generated this PO (F-05). */
  autoGenerated: boolean
  approvedBy?: ID | null
}

export interface GoodsReceipt extends BaseEntity {
  number: string
  poId: ID
  receivedOn: ISODate
  lines: { sku: string; qtyReceived: number }[]
  receivedBy?: ID | null
}

/* ------------------------------------------------------------------ projects */

export type ProjectStatus = 'Planning' | 'Active' | 'At Risk' | 'On Hold' | 'Completed'

export interface Project extends BaseEntity {
  code: string
  name: string
  clientName: string
  managerId: ID
  status: ProjectStatus
  startDate: ISODate
  endDate: ISODate
  budget: number
  actualCost: number
  progressPct: number
  currency: CurrencyCode
}

export type TaskStatus = 'Todo' | 'In Progress' | 'Blocked' | 'Done'

export interface ProjectTask extends BaseEntity {
  projectId: ID
  name: string
  assigneeId?: ID | null
  status: TaskStatus
  startDate: ISODate
  endDate: ISODate
  progressPct: number
  /** Task ids that must finish first — validated as a DAG. */
  dependsOn: ID[]
  isMilestone: boolean
  estimateHours: number
  loggedHours: number
}

/* ---------------------------------------------------------------- forecasting */

/** One SKU's demand history — the input series for the F-06 models. */
export interface DemandPoint {
  period: string // 'YYYY-MM'
  qty: number
}

export interface DemandSeries extends BaseEntity {
  sku: string
  name: string
  history: DemandPoint[]
}

export interface ForecastPoint {
  period: string
  predicted: number
  lower: number
  upper: number
}

export interface ForecastResult {
  sku: string
  name: string
  model: 'Holt-Winters' | 'Prophet-style Additive' | 'Ensemble'
  generatedAt: ISODate
  horizonMonths: number
  /** Mean absolute percentage error from a hold-out backtest. */
  mape: number
  bias: number
  history: DemandPoint[]
  fitted: DemandPoint[]
  forecast: ForecastPoint[]
  recommendedOrderQty: number
  peakPeriod: string
  params: Record<string, number>
}

/* ------------------------------------------------- notifications & audit log */

export type NotificationSeverity = 'info' | 'success' | 'warning' | 'critical'

export interface Notification extends BaseEntity {
  event: string
  title: string
  body: string
  severity: NotificationSeverity
  read: boolean
  href?: string | null
  channels: ('inApp' | 'email' | 'webhook')[]
  deliveryAttempts: number
  delivered: boolean
}

/**
 * Append-only audit record. `hash = SHA-256(prevHash + canonical(payload))`,
 * which makes any retroactive edit detectable by replaying the chain (F-09).
 */
export interface AuditLog {
  id: ID
  tenantId: ID
  seq: number
  at: ISODate
  actorId: ID | null
  actorName: string
  action: string
  entity: string
  entityId: string
  summary: string
  ip: string
  prevHash: string
  hash: string
}

/* ------------------------------------------------------------------- session */

export interface SessionUser {
  id: ID
  email: string
  name: string
  role: Role
  tenantId: ID
  tenantName: string
  employeeId?: ID | null
  mfaVerified: boolean
}
