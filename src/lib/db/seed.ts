import { createRng, type Rng } from '../rng'
import { sha256Hex } from '../hash'
import { computePayslip } from '../domain/payroll'
import { addDays, addMonths, round, toISODate, toPeriod } from '../utils'
import type {
  Account,
  AccountingPeriod,
  AttendanceRecord,
  AuditLog,
  Customer,
  DemandPoint,
  DemandSeries,
  Department,
  Employee,
  FxRate,
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
 * Deterministic demo dataset.
 *
 * Generated rather than checked in so it stays anchored to "today", but driven
 * by a fixed PRNG seed so every server instance produces byte-identical data.
 */

export interface Tables {
  tenants: Tenant[]
  users: User[]
  departments: Department[]
  employees: Employee[]
  attendance: AttendanceRecord[]
  leaveRequests: LeaveRequest[]
  payrollRuns: PayrollRun[]
  payslips: Payslip[]
  accounts: Account[]
  journalEntries: JournalEntry[]
  periods: AccountingPeriod[]
  invoices: Invoice[]
  payments: Payment[]
  vendors: Vendor[]
  customers: Customer[]
  warehouses: Warehouse[]
  inventory: InventoryItem[]
  stockMovements: StockMovement[]
  purchaseOrders: PurchaseOrder[]
  goodsReceipts: GoodsReceipt[]
  projects: Project[]
  tasks: ProjectTask[]
  demandSeries: DemandSeries[]
  notifications: Notification[]
  auditLogs: AuditLog[]
  fxRates: FxRate[]
}

export const DEMO_PASSWORD = 'Amdox@2026'

/** Demo-grade credential digest. Production would use Argon2id or bcrypt. */
export function hashPassword(email: string, password: string): string {
  return sha256Hex(`${email.toLowerCase()}:${password}`)
}

const NOW = new Date()
const TODAY = toISODate(NOW)
const CURRENT_PERIOD = toPeriod(NOW)

const FIRST_NAMES = [
  'Nishant', 'Ipshita', 'Pratim', 'Sneha', 'Aarav', 'Diya', 'Rohan', 'Ananya', 'Kabir', 'Meera',
  'Vikram', 'Priya', 'Arjun', 'Kavya', 'Siddharth', 'Isha', 'Rahul', 'Tanvi', 'Aditya', 'Riya',
  'Karthik', 'Nandini', 'Manav', 'Shreya', 'Devansh', 'Aisha', 'Yash', 'Pooja', 'Harsh', 'Neha',
]
const LAST_NAMES = [
  'Dhall', 'Sengupta', 'Roy', 'Iyer', 'Sharma', 'Verma', 'Nair', 'Menon', 'Gupta', 'Kulkarni',
  'Reddy', 'Bose', 'Chatterjee', 'Malhotra', 'Kapoor', 'Joshi', 'Desai', 'Bhatt', 'Rana', 'Saxena',
]
const CITIES = ['Bengaluru', 'Pune', 'Hyderabad', 'Gurugram', 'Chennai', 'Remote']

const DEPARTMENT_SPECS = [
  { code: 'ENG', name: 'Engineering', costCenter: 'CC-1001', headcount: 18, budget: 42_000_000 },
  { code: 'FIN', name: 'Finance', costCenter: 'CC-1002', headcount: 7, budget: 12_500_000 },
  { code: 'PPL', name: 'People Operations', costCenter: 'CC-1003', headcount: 6, budget: 9_800_000 },
  { code: 'SCM', name: 'Supply Chain', costCenter: 'CC-1004', headcount: 9, budget: 15_400_000 },
  { code: 'SLS', name: 'Sales', costCenter: 'CC-1005', headcount: 10, budget: 22_000_000 },
  { code: 'MKT', name: 'Marketing', costCenter: 'CC-1006', headcount: 5, budget: 8_600_000 },
]

const DESIGNATIONS: Record<string, string[]> = {
  ENG: ['Software Engineer', 'Senior Software Engineer', 'Staff Engineer', 'Engineering Manager', 'QA Engineer', 'DevOps Engineer'],
  FIN: ['Accountant', 'Financial Analyst', 'Finance Manager', 'Controller'],
  PPL: ['HR Executive', 'HR Business Partner', 'Talent Acquisition Lead', 'People Ops Manager'],
  SCM: ['Procurement Executive', 'Inventory Analyst', 'Logistics Coordinator', 'Supply Chain Manager'],
  SLS: ['Account Executive', 'Sales Development Rep', 'Regional Sales Manager', 'Solutions Consultant'],
  MKT: ['Marketing Associate', 'Content Strategist', 'Growth Marketer', 'Marketing Manager'],
}

const SKU_CATALOGUE = [
  { sku: 'AMX-CTL-100', name: 'Industrial IoT Controller', category: 'Electronics', cost: 12_400, uom: 'EA' },
  { sku: 'AMX-SNS-210', name: 'Vibration Sensor Array', category: 'Electronics', cost: 4_850, uom: 'EA' },
  { sku: 'AMX-PSU-330', name: 'Redundant Power Supply 750W', category: 'Electronics', cost: 8_900, uom: 'EA' },
  { sku: 'AMX-GTW-440', name: 'Edge Gateway Pro', category: 'Networking', cost: 21_500, uom: 'EA' },
  { sku: 'AMX-SWT-450', name: 'Managed Switch 24-Port', category: 'Networking', cost: 16_200, uom: 'EA' },
  { sku: 'AMX-CBL-510', name: 'Shielded Cable 100m Reel', category: 'Cabling', cost: 3_150, uom: 'ROLL' },
  { sku: 'AMX-ENC-620', name: 'IP66 Enclosure Medium', category: 'Mechanical', cost: 5_600, uom: 'EA' },
  { sku: 'AMX-MNT-630', name: 'DIN Rail Mount Kit', category: 'Mechanical', cost: 720, uom: 'SET' },
  { sku: 'AMX-BAT-710', name: 'LiFePO4 Backup Battery', category: 'Power', cost: 9_300, uom: 'EA' },
  { sku: 'AMX-SOL-720', name: 'Solar Charge Regulator', category: 'Power', cost: 6_450, uom: 'EA' },
  { sku: 'AMX-HMI-810', name: 'Touch HMI Panel 10"', category: 'Interface', cost: 18_700, uom: 'EA' },
  { sku: 'AMX-RLY-820', name: 'Solid State Relay Module', category: 'Electronics', cost: 2_240, uom: 'EA' },
  { sku: 'AMX-FLT-910', name: 'EMI Line Filter', category: 'Electronics', cost: 1_890, uom: 'EA' },
  { sku: 'AMX-THR-920', name: 'Thermal Probe Set', category: 'Instrumentation', cost: 3_760, uom: 'SET' },
  { sku: 'AMX-LIC-001', name: 'AMDOX Platform Licence (Annual)', category: 'Software', cost: 45_000, uom: 'LIC' },
  { sku: 'AMX-SUP-002', name: 'Premium Support Pack', category: 'Services', cost: 28_000, uom: 'PACK' },
  { sku: 'AMX-CAM-930', name: 'Machine Vision Camera', category: 'Instrumentation', cost: 27_400, uom: 'EA' },
  { sku: 'AMX-ACT-940', name: 'Linear Actuator 300mm', category: 'Mechanical', cost: 11_200, uom: 'EA' },
  { sku: 'AMX-PLC-950', name: 'Compact PLC Unit', category: 'Electronics', cost: 32_600, uom: 'EA' },
  { sku: 'AMX-UPS-960', name: 'Rack UPS 3kVA', category: 'Power', cost: 41_800, uom: 'EA' },
]

const VENDOR_NAMES = [
  'Sterling Components Pvt Ltd', 'Nexus Electronics GmbH', 'Pacific Circuit Works', 'Orion Metal Fabricators',
  'Hexa Power Systems', 'Bluewave Cabling Co', 'Zenith Instruments', 'Craft Enclosures India',
  'Voltaic Energy Supplies', 'Meridian Automation', 'Silverline Logistics', 'Apex Semiconductor Trading',
]

const CUSTOMER_NAMES = [
  'Tata Steel Digital', 'Reliance Infra Systems', 'Adani Ports Tech', 'Larsen Automation',
  'Godrej Process Solutions', 'JSW Smart Plants', 'UltraTech Ops Cloud', 'Mahindra Logistics IT',
  'Siemens India Projects', 'ABB Bengaluru Works', 'Havells Digital', 'Bosch Manufacturing Tech',
  'Cummins Powergen IT', 'Thermax Energy Systems',
]

const CHART_OF_ACCOUNTS: Omit<Account, keyof import('../types').BaseEntity>[] = [
  { code: '1000', name: 'Bank — Current Account', type: 'Asset', normalBalance: 'debit', isActive: true },
  { code: '1010', name: 'Petty Cash', type: 'Asset', normalBalance: 'debit', isActive: true },
  { code: '1200', name: 'Accounts Receivable', type: 'Asset', normalBalance: 'debit', isActive: true },
  { code: '1300', name: 'Inventory', type: 'Asset', normalBalance: 'debit', isActive: true },
  { code: '1400', name: 'Prepaid Expenses', type: 'Asset', normalBalance: 'debit', isActive: true },
  { code: '1500', name: 'Property, Plant & Equipment', type: 'Asset', normalBalance: 'debit', isActive: true },
  { code: '1510', name: 'Accumulated Depreciation', type: 'Asset', normalBalance: 'credit', parentCode: '1500', isActive: true },
  { code: '2000', name: 'Accounts Payable', type: 'Liability', normalBalance: 'credit', isActive: true },
  { code: '2100', name: 'Salaries Payable', type: 'Liability', normalBalance: 'credit', isActive: true },
  { code: '2200', name: 'GST Payable', type: 'Liability', normalBalance: 'credit', isActive: true },
  { code: '2300', name: 'TDS Payable', type: 'Liability', normalBalance: 'credit', isActive: true },
  { code: '3000', name: 'Share Capital', type: 'Equity', normalBalance: 'credit', isActive: true },
  { code: '4000', name: 'Product Revenue', type: 'Revenue', normalBalance: 'credit', isActive: true },
  { code: '4100', name: 'Services Revenue', type: 'Revenue', normalBalance: 'credit', isActive: true },
  { code: '4200', name: 'Support & AMC Revenue', type: 'Revenue', normalBalance: 'credit', isActive: true },
  { code: '5000', name: 'Cost of Goods Sold', type: 'Expense', normalBalance: 'debit', isActive: true },
  { code: '5200', name: 'Salaries & Wages', type: 'Expense', normalBalance: 'debit', isActive: true },
  { code: '5300', name: 'Rent & Facilities', type: 'Expense', normalBalance: 'debit', isActive: true },
  { code: '5400', name: 'Depreciation', type: 'Expense', normalBalance: 'debit', isActive: true },
  { code: '5500', name: 'Cloud Infrastructure', type: 'Expense', normalBalance: 'debit', isActive: true },
  { code: '5600', name: 'Marketing', type: 'Expense', normalBalance: 'debit', isActive: true },
  { code: '5700', name: 'Travel & Conveyance', type: 'Expense', normalBalance: 'debit', isActive: true },
  { code: '5800', name: 'Professional Fees', type: 'Expense', normalBalance: 'debit', isActive: true },
  { code: '5900', name: 'Utilities', type: 'Expense', normalBalance: 'debit', isActive: true },
]

/** Journal memos left in Draft for the still-open period. */
const DRAFT_IN_CURRENT_PERIOD = new Set(['Marketing campaigns', 'Travel, utilities & professional fees'])

const PROJECT_SPECS = [
  { code: 'PRJ-001', name: 'Smart Factory Rollout — Phase 2', client: 'Tata Steel Digital', budget: 18_500_000 },
  { code: 'PRJ-002', name: 'Port Telemetry Platform', client: 'Adani Ports Tech', budget: 12_200_000 },
  { code: 'PRJ-003', name: 'Predictive Maintenance Pilot', client: 'JSW Smart Plants', budget: 7_400_000 },
  { code: 'PRJ-004', name: 'ERP Data Migration', client: 'Godrej Process Solutions', budget: 5_900_000 },
  { code: 'PRJ-005', name: 'Warehouse Automation Retrofit', client: 'Mahindra Logistics IT', budget: 14_800_000 },
  { code: 'PRJ-006', name: 'Energy Analytics Dashboard', client: 'Thermax Energy Systems', budget: 4_300_000 },
  { code: 'PRJ-007', name: 'Vision QC Line Integration', client: 'Bosch Manufacturing Tech', budget: 9_600_000 },
  { code: 'PRJ-008', name: 'Multi-Site Compliance Reporting', client: 'UltraTech Ops Cloud', budget: 3_800_000 },
]

const TASK_TEMPLATES = [
  'Requirements workshop', 'Solution architecture', 'Environment provisioning', 'Data model design',
  'Integration build', 'Device onboarding', 'UAT cycle 1', 'Security review', 'Performance tuning',
  'Go-live cutover', 'Hypercare support', 'Documentation handover',
]

/* ------------------------------------------------------------------ helpers */

function stamp(offsetDays = 0): string {
  return addDays(NOW, -offsetDays).toISOString()
}

function base(tenantId: ID, id: string, ageDays = 90) {
  return {
    id,
    tenantId,
    createdAt: stamp(ageDays),
    updatedAt: stamp(Math.floor(ageDays / 2)),
    deletedAt: null,
  }
}

/** Recent periods, oldest first, including the current one. */
function recentPeriods(count: number): string[] {
  const out: string[] = []
  for (let i = count - 1; i >= 0; i--) out.push(addMonths(CURRENT_PERIOD, -i))
  return out
}

/* ------------------------------------------------------------ tenant builder */

interface TenantSeedConfig {
  tenant: Tenant
  seed: number
  employeeScale: number
  currency: Tenant['baseCurrency']
}

function buildTenantData(config: TenantSeedConfig, tables: Tables): void {
  const { tenant, employeeScale, currency } = config
  const rng = createRng(config.seed)
  const t = tenant.id

  /* -------------------------------------------------------- departments */
  const departments: Department[] = DEPARTMENT_SPECS.map((spec, i) => ({
    ...base(t, `${t}_dept_${spec.code}`, 720),
    code: spec.code,
    name: spec.name,
    costCenter: spec.costCenter,
    budgetAnnual: Math.round(spec.budget * employeeScale),
    headEmployeeId: null,
  }))
  tables.departments.push(...departments)

  /* ----------------------------------------------------------- employees */
  const employees: Employee[] = []
  let empSeq = 1

  for (const spec of DEPARTMENT_SPECS) {
    const count = Math.max(2, Math.round(spec.headcount * employeeScale))
    const designations = DESIGNATIONS[spec.code]

    for (let i = 0; i < count; i++) {
      const first = rng.pick(FIRST_NAMES)
      const last = rng.pick(LAST_NAMES)
      const isLead = i === 0
      const designation = isLead ? designations[designations.length - 1] : rng.pick(designations.slice(0, -1))
      const tenure = rng.int(60, 2200)
      const seniority = Math.min(1, tenure / 1800)
      const ctcBase = currency === 'INR' ? 720_000 : 62_000
      const ctc = Math.round((ctcBase + seniority * ctcBase * 2.4 + (isLead ? ctcBase * 1.6 : 0)) / 1000) * 1000

      const code = `EMP${String(empSeq).padStart(4, '0')}`
      employees.push({
        ...base(t, `${t}_emp_${empSeq}`, tenure),
        code,
        firstName: first,
        lastName: last,
        email: `${first.toLowerCase()}.${last.toLowerCase()}${empSeq}@${tenant.slug}.io`,
        phone: `+91 9${rng.int(100000000, 999999999)}`,
        departmentId: `${t}_dept_${spec.code}`,
        managerId: null,
        designation,
        employmentType: rng.chance(0.86) ? 'Full-time' : rng.chance(0.5) ? 'Contract' : 'Intern',
        status: rng.chance(0.9) ? 'Active' : rng.chance(0.5) ? 'On Leave' : 'Probation',
        joinedOn: toISODate(addDays(NOW, -tenure)),
        location: rng.pick(CITIES),
        ctcAnnual: ctc,
        bankLast4: String(rng.int(1000, 9999)),
        pan: `${String.fromCharCode(65 + rng.int(0, 25))}${String.fromCharCode(65 + rng.int(0, 25))}XPZ${rng.int(1000, 9999)}${String.fromCharCode(65 + rng.int(0, 25))}`,
      })
      empSeq++
    }
  }

  // Point every non-lead at their department head.
  for (const dept of departments) {
    const members = employees.filter((e) => e.departmentId === dept.id)
    const head = members[0]
    if (!head) continue
    dept.headEmployeeId = head.id
    for (const member of members.slice(1)) member.managerId = head.id
  }
  tables.employees.push(...employees)

  /* ---------------------------------------------------------- attendance */
  const attendanceDays = 42
  for (const employee of employees) {
    if (employee.status === 'Exited') continue
    for (let d = attendanceDays; d >= 0; d--) {
      const date = addDays(NOW, -d)
      const iso = toISODate(date)
      const weekday = date.getUTCDay()

      if (weekday === 0 || weekday === 6) {
        tables.attendance.push({
          ...base(t, `${t}_att_${employee.id}_${iso}`, d),
          employeeId: employee.id,
          date: iso,
          clockIn: null,
          clockOut: null,
          workedHours: 0,
          overtimeHours: 0,
          status: 'Weekend',
        })
        continue
      }

      const roll = rng.next()
      const status = roll < 0.78 ? 'Present' : roll < 0.92 ? 'Remote' : roll < 0.97 ? 'Leave' : 'Absent'
      const working = status === 'Present' || status === 'Remote'
      const inHour = rng.int(8, 10)
      const inMin = rng.int(0, 59)
      const worked = working ? rng.float(7.2, 10.4, 1) : 0

      tables.attendance.push({
        ...base(t, `${t}_att_${employee.id}_${iso}`, d),
        employeeId: employee.id,
        date: iso,
        clockIn: working ? `${String(inHour).padStart(2, '0')}:${String(inMin).padStart(2, '0')}` : null,
        clockOut: working
          ? `${String(Math.min(23, inHour + Math.floor(worked))).padStart(2, '0')}:${String(rng.int(0, 59)).padStart(2, '0')}`
          : null,
        workedHours: worked,
        overtimeHours: worked > 9 ? round(worked - 9, 1) : 0,
        status,
      })
    }
  }

  /* -------------------------------------------------------------- leave */
  const leaveTypes = ['Casual', 'Sick', 'Earned', 'Unpaid'] as const
  const leaveCount = Math.max(8, Math.round(28 * employeeScale))
  for (let i = 0; i < leaveCount; i++) {
    const employee = rng.pick(employees)
    const startOffset = rng.int(-25, 40)
    const days = rng.int(1, 5)
    const from = toISODate(addDays(NOW, -startOffset))
    const to = toISODate(addDays(NOW, -startOffset + days - 1))
    const roll = rng.next()
    const status = startOffset > 5 ? (roll < 0.82 ? 'Approved' : 'Rejected') : roll < 0.45 ? 'Approved' : 'Pending'

    tables.leaveRequests.push({
      ...base(t, `${t}_lv_${i + 1}`, Math.max(1, startOffset + 5)),
      employeeId: employee.id,
      type: rng.pick(leaveTypes),
      from,
      to,
      days,
      reason: rng.pick([
        'Family function', 'Medical appointment', 'Personal work', 'Travel',
        'Recovering from fever', 'Childcare', 'Relocation', 'Exam preparation',
      ]),
      status,
      approverId: status === 'Pending' ? null : employee.managerId,
      decidedAt: status === 'Pending' ? null : stamp(Math.max(1, startOffset)),
      decisionNote: status === 'Rejected' ? 'Overlaps with a release freeze window.' : null,
    })
  }

  /* ------------------------------------------------------------ payroll */
  const payrollPeriods = recentPeriods(6).slice(0, 5) // leave the current month un-run
  for (const period of payrollPeriods) {
    const runId = `${t}_run_${period}`
    let gross = 0
    let deductions = 0
    let net = 0

    const active = employees.filter((e) => e.status !== 'Exited')
    for (const employee of active) {
      const unpaid = rng.chance(0.12) ? rng.int(1, 3) : 0
      const slip = computePayslip(employee.ctcAnnual, unpaid)
      gross += slip.gross
      deductions += slip.totalDeductions
      net += slip.net

      tables.payslips.push({
        ...base(t, `${t}_slip_${period}_${employee.id}`, 30),
        runId,
        employeeId: employee.id,
        period,
        ...slip,
      })
    }

    tables.payrollRuns.push({
      ...base(t, runId, 30),
      period,
      status: 'Completed',
      employeeCount: active.length,
      grossTotal: round(gross),
      deductionTotal: round(deductions),
      netTotal: round(net),
      processedAt: stamp(rng.int(1, 120)),
      processedBy: null,
      durationMs: rng.int(2400, 8200),
      note: 'Processed by the scheduled payroll job.',
    })
  }

  /* --------------------------------------------------- chart of accounts */
  const accounts: Account[] = CHART_OF_ACCOUNTS.map((a) => ({
    ...base(t, `${t}_acc_${a.code}`, 900),
    ...a,
  }))
  tables.accounts.push(...accounts)

  /* ------------------------------------------------------ vendors/customers */
  const vendors: Vendor[] = VENDOR_NAMES.slice(0, Math.max(5, Math.round(12 * employeeScale))).map((name, i) => ({
    ...base(t, `${t}_ven_${i + 1}`, 600),
    code: `VEN-${String(i + 1).padStart(3, '0')}`,
    name,
    email: `accounts@${name.toLowerCase().replace(/[^a-z]+/g, '').slice(0, 14)}.com`,
    phone: `+91 8${rng.int(100000000, 999999999)}`,
    country: rng.pick(['India', 'Germany', 'Singapore', 'UAE', 'United States']),
    currency: rng.pick(['INR', 'INR', 'INR', 'USD', 'EUR'] as const),
    paymentTermsDays: rng.pick([15, 30, 30, 45, 60]),
    rating: rng.float(3.2, 4.9, 1),
    onTimeDeliveryPct: rng.float(78, 99, 1),
    isActive: rng.chance(0.94),
  }))
  tables.vendors.push(...vendors)

  const customers: Customer[] = CUSTOMER_NAMES.slice(0, Math.max(6, Math.round(14 * employeeScale))).map((name, i) => ({
    ...base(t, `${t}_cus_${i + 1}`, 600),
    code: `CUS-${String(i + 1).padStart(3, '0')}`,
    name,
    email: `ap@${name.toLowerCase().replace(/[^a-z]+/g, '').slice(0, 14)}.com`,
    country: rng.pick(['India', 'India', 'India', 'Singapore', 'UAE']),
    currency: rng.pick(['INR', 'INR', 'INR', 'USD'] as const),
    creditLimit: rng.int(20, 120) * 100_000,
    paymentTermsDays: rng.pick([30, 45, 60]),
  }))
  tables.customers.push(...customers)

  /* ---------------------------------------------------------- warehouses */
  const warehouses: Warehouse[] = [
    { code: 'WH-BLR', name: 'Bengaluru Central', city: 'Bengaluru' },
    { code: 'WH-PNQ', name: 'Pune Distribution', city: 'Pune' },
    { code: 'WH-DEL', name: 'Delhi NCR Hub', city: 'Gurugram' },
  ].map((w, i) => ({ ...base(t, `${t}_wh_${i + 1}`, 800), ...w }))
  tables.warehouses.push(...warehouses)

  /* ------------------------------------------------------------ inventory */
  const skuCount = Math.max(10, Math.round(SKU_CATALOGUE.length * Math.min(1, employeeScale + 0.4)))
  const catalogue = SKU_CATALOGUE.slice(0, skuCount)
  const inventory: InventoryItem[] = catalogue.map((item, i) => {
    const reorderPoint = rng.int(20, 140)
    const health = rng.next()
    const onHand =
      health < 0.12 ? rng.int(0, Math.max(1, Math.floor(reorderPoint * 0.4)))
      : health < 0.24 ? rng.int(Math.floor(reorderPoint * 0.5), reorderPoint)
      : rng.int(reorderPoint + 20, reorderPoint * 5)

    return {
      ...base(t, `${t}_inv_${i + 1}`, 500),
      sku: item.sku,
      name: item.name,
      category: item.category,
      uom: item.uom,
      warehouseCode: rng.pick(warehouses).code,
      onHand,
      allocated: rng.int(0, Math.max(1, Math.floor(onHand * 0.25))),
      reorderPoint,
      reorderQty: Math.max(25, Math.round(reorderPoint * 1.5)),
      unitCost: currency === 'INR' ? item.cost : round(item.cost / 84, 2),
      leadTimeDays: rng.pick([7, 14, 21, 28, 35]),
      autoReorder: rng.chance(0.82),
    }
  })
  tables.inventory.push(...inventory)

  for (let i = 0; i < inventory.length * 6; i++) {
    const item = rng.pick(inventory)
    const isReceipt = rng.chance(0.42)
    const daysAgo = rng.int(1, 150)
    tables.stockMovements.push({
      ...base(t, `${t}_mov_${i + 1}`, daysAgo),
      sku: item.sku,
      date: toISODate(addDays(NOW, -daysAgo)),
      qty: isReceipt ? rng.int(20, 200) : -rng.int(5, 90),
      kind: isReceipt ? 'Receipt' : rng.chance(0.85) ? 'Issue' : 'Adjustment',
      reference: isReceipt ? `GRN-${rng.int(1000, 9999)}` : `SO-${rng.int(1000, 9999)}`,
      unitCost: item.unitCost,
    })
  }

  /* ----------------------------------------------------- purchase orders */
  const poCount = Math.max(8, Math.round(26 * employeeScale))
  const purchaseOrders: PurchaseOrder[] = []
  for (let i = 0; i < poCount; i++) {
    const vendor = rng.pick(vendors)
    const daysAgo = rng.int(1, 120)
    const lineCount = rng.int(1, 4)
    const lines = Array.from({ length: lineCount }, () => {
      const item = rng.pick(inventory)
      const qty = rng.int(10, 180)
      return {
        sku: item.sku,
        description: item.name,
        qty,
        qtyReceived: 0,
        unitPrice: round(item.unitCost * rng.float(0.94, 1.08, 3)),
      }
    })

    const roll = rng.next()
    const status: PurchaseOrder['status'] =
      daysAgo > 70 ? 'Received'
      : roll < 0.12 ? 'Draft'
      : roll < 0.3 ? 'Pending Approval'
      : roll < 0.6 ? 'Approved'
      : roll < 0.82 ? 'Partially Received'
      : 'Received'

    for (const line of lines) {
      line.qtyReceived =
        status === 'Received' ? line.qty : status === 'Partially Received' ? Math.floor(line.qty * rng.float(0.2, 0.8)) : 0
    }

    purchaseOrders.push({
      ...base(t, `${t}_po_${i + 1}`, daysAgo),
      number: `PO-2026-${String(1000 + i)}`,
      vendorId: vendor.id,
      vendorName: vendor.name,
      status,
      orderDate: toISODate(addDays(NOW, -daysAgo)),
      expectedDate: toISODate(addDays(NOW, -daysAgo + rng.int(7, 40))),
      currency: vendor.currency,
      fxRate: vendor.currency === currency ? 1 : vendor.currency === 'USD' ? 84 : 91,
      total: round(lines.reduce((s, l) => s + l.qty * l.unitPrice, 0)),
      lines,
      autoGenerated: rng.chance(0.22),
      approvedBy: status === 'Draft' || status === 'Pending Approval' ? null : `${t}_usr_admin`,
    })
  }
  tables.purchaseOrders.push(...purchaseOrders)

  purchaseOrders
    .filter((po) => po.status === 'Received' || po.status === 'Partially Received')
    .forEach((po, i) => {
      tables.goodsReceipts.push({
        ...base(t, `${t}_grn_${i + 1}`, 20),
        number: `GRN-2026-${String(2000 + i)}`,
        poId: po.id,
        receivedOn: po.expectedDate,
        lines: po.lines.filter((l) => l.qtyReceived > 0).map((l) => ({ sku: l.sku, qtyReceived: l.qtyReceived })),
        receivedBy: null,
      })
    })

  /* ------------------------------------------------------------ invoices */
  const invoices: Invoice[] = []
  const invoiceCount = Math.max(14, Math.round(46 * employeeScale))

  for (let i = 0; i < invoiceCount; i++) {
    const isPayable = i % 2 === 0
    const counterparty = isPayable ? rng.pick(vendors) : rng.pick(customers)
    const daysAgo = rng.int(1, 130)
    const terms = isPayable ? (counterparty as Vendor).paymentTermsDays : (counterparty as Customer).paymentTermsDays
    const issueDate = addDays(NOW, -daysAgo)
    const dueDate = addDays(issueDate, terms)

    const lineCount = rng.int(1, 3)
    const lines = Array.from({ length: lineCount }, () => {
      const item = rng.pick(inventory)
      const qty = rng.int(2, 60)
      const margin = isPayable ? 1 : rng.float(1.28, 1.72, 3)
      return { description: item.name, qty, unitPrice: round(item.unitCost * margin) }
    })

    const subtotal = round(lines.reduce((s, l) => s + l.qty * l.unitPrice, 0))
    const taxAmount = round(subtotal * 0.18)
    const total = round(subtotal + taxAmount)

    const overdue = dueDate.getTime() < NOW.getTime()
    const roll = rng.next()
    let status: Invoice['status']
    let amountPaid: number

    if (roll < 0.52) {
      status = 'Paid'
      amountPaid = total
    } else if (roll < 0.66) {
      status = 'Partially Paid'
      amountPaid = round(total * rng.float(0.2, 0.75))
    } else if (overdue) {
      status = roll < 0.94 ? 'Overdue' : 'Disputed'
      amountPaid = 0
    } else {
      status = roll < 0.85 ? 'Approved' : 'Awaiting Match'
      amountPaid = 0
    }

    const matchedPo = isPayable ? purchaseOrders.find((po) => po.vendorId === counterparty.id) : null
    const matchRoll = rng.next()

    invoices.push({
      ...base(t, `${t}_inv_${i + 1}`, daysAgo),
      kind: isPayable ? 'AP' : 'AR',
      number: `${isPayable ? 'AP' : 'AR'}-2026-${String(3000 + i)}`,
      counterpartyId: counterparty.id,
      counterpartyName: counterparty.name,
      issueDate: toISODate(issueDate),
      dueDate: toISODate(dueDate),
      currency: counterparty.currency,
      fxRate: counterparty.currency === currency ? 1 : counterparty.currency === 'USD' ? 84 : 91,
      subtotal,
      taxAmount,
      total,
      amountPaid,
      status,
      poId: matchedPo?.id ?? null,
      matchState: !isPayable
        ? 'Matched'
        : !matchedPo ? 'No PO'
        : matchRoll < 0.74 ? 'Matched'
        : matchRoll < 0.86 ? 'Price Variance'
        : matchRoll < 0.94 ? 'Qty Variance'
        : 'Pending',
      ocrConfidence: isPayable ? rng.float(0.93, 0.995, 3) : undefined,
      lines,
    })
  }
  tables.invoices.push(...invoices)

  invoices
    .filter((inv) => inv.amountPaid > 0)
    .forEach((inv, i) => {
      tables.payments.push({
        ...base(t, `${t}_pay_${i + 1}`, 15),
        invoiceId: inv.id,
        kind: inv.kind,
        amount: inv.amountPaid,
        currency: inv.currency,
        paidOn: toISODate(addDays(new Date(inv.issueDate), rng.int(3, 40))),
        method: rng.pick(['Bank Transfer', 'Bank Transfer', 'UPI', 'Cheque'] as const),
        reference: `TXN${rng.int(100000, 999999)}`,
        runId: null,
      })
    })

  /* ------------------------------------------------------ journal entries */
  const periods = recentPeriods(10)

  // Opening balance so the balance sheet starts from a funded position.
  const openingCapital = Math.round(180_000_000 * employeeScale)
  tables.journalEntries.push({
    ...base(t, `${t}_je_open`, 900),
    reference: 'JE-OPENING',
    date: `${periods[0]}-01`,
    period: periods[0],
    memo: 'Opening balances brought forward',
    currency,
    fxRate: 1,
    status: 'Posted',
    source: 'System',
    postedBy: null,
    lines: [
      { accountCode: '1000', debit: round(openingCapital * 0.45), credit: 0, memo: 'Bank' },
      { accountCode: '1300', debit: round(openingCapital * 0.2), credit: 0, memo: 'Inventory' },
      { accountCode: '1500', debit: round(openingCapital * 0.35), credit: 0, memo: 'Fixed assets' },
      { accountCode: '3000', debit: 0, credit: openingCapital, memo: 'Share capital' },
    ],
  })

  const scale = employeeScale
  let jeSeq = 1
  for (const period of periods) {
    const monthIndex = periods.indexOf(period)
    // Gentle growth plus a seasonal bump towards the end of the year.
    const growth = 1 + monthIndex * 0.028
    const seasonal = 1 + 0.16 * Math.sin(((monthIndex + 3) / 12) * Math.PI * 2)

    const templates: { memo: string; source: JournalEntry['source']; make: () => JournalLine[] }[] = [
      {
        memo: 'Product sales invoiced',
        source: 'AR',
        make: () => {
          const amount = round(rng.float(4_200_000, 6_800_000) * growth * seasonal * scale)
          const tax = round(amount * 0.18)
          return [
            { accountCode: '1200', debit: round(amount + tax), credit: 0, memo: 'Customer receivable' },
            { accountCode: '4000', debit: 0, credit: amount, memo: 'Product revenue' },
            { accountCode: '2200', debit: 0, credit: tax, memo: 'Output GST' },
          ]
        },
      },
      {
        memo: 'Services & implementation revenue',
        source: 'AR',
        make: () => {
          const amount = round(rng.float(1_900_000, 3_400_000) * growth * scale)
          const tax = round(amount * 0.18)
          return [
            { accountCode: '1200', debit: round(amount + tax), credit: 0 },
            { accountCode: '4100', debit: 0, credit: amount },
            { accountCode: '2200', debit: 0, credit: tax },
          ]
        },
      },
      {
        memo: 'AMC & support billing',
        source: 'AR',
        make: () => {
          const amount = round(rng.float(700_000, 1_400_000) * growth * scale)
          return [
            { accountCode: '1200', debit: amount, credit: 0 },
            { accountCode: '4200', debit: 0, credit: amount },
          ]
        },
      },
      {
        memo: 'Customer collections',
        source: 'AR',
        make: () => {
          const amount = round(rng.float(4_500_000, 7_600_000) * growth * scale)
          return [
            { accountCode: '1000', debit: amount, credit: 0 },
            { accountCode: '1200', debit: 0, credit: amount },
          ]
        },
      },
      {
        memo: 'Component purchases',
        source: 'AP',
        make: () => {
          const amount = round(rng.float(2_100_000, 3_600_000) * seasonal * scale)
          return [
            { accountCode: '5000', debit: amount, credit: 0 },
            { accountCode: '2000', debit: 0, credit: amount },
          ]
        },
      },
      {
        memo: 'Vendor payment run',
        source: 'AP',
        make: () => {
          const amount = round(rng.float(1_800_000, 3_200_000) * scale)
          return [
            { accountCode: '2000', debit: amount, credit: 0 },
            { accountCode: '1000', debit: 0, credit: amount },
          ]
        },
      },
      {
        memo: `Payroll accrual ${period}`,
        source: 'Payroll',
        make: () => {
          const amount = round(rng.float(3_100_000, 3_900_000) * scale)
          const tds = round(amount * 0.09)
          return [
            { accountCode: '5200', debit: amount, credit: 0 },
            { accountCode: '2300', debit: 0, credit: tds, memo: 'TDS withheld' },
            { accountCode: '2100', debit: 0, credit: round(amount - tds) },
          ]
        },
      },
      {
        memo: 'Facilities & rent',
        source: 'Manual',
        make: () => {
          const amount = round(rng.float(420_000, 620_000) * scale)
          return [
            { accountCode: '5300', debit: amount, credit: 0 },
            { accountCode: '1000', debit: 0, credit: amount },
          ]
        },
      },
      {
        memo: 'Cloud & infrastructure spend',
        source: 'Manual',
        make: () => {
          const amount = round(rng.float(480_000, 910_000) * growth * scale)
          return [
            { accountCode: '5500', debit: amount, credit: 0 },
            { accountCode: '1000', debit: 0, credit: amount },
          ]
        },
      },
      {
        memo: 'Marketing campaigns',
        source: 'Manual',
        make: () => {
          const amount = round(rng.float(260_000, 780_000) * scale)
          return [
            { accountCode: '5600', debit: amount, credit: 0 },
            { accountCode: '1000', debit: 0, credit: amount },
          ]
        },
      },
      {
        memo: 'Monthly depreciation',
        source: 'System',
        make: () => {
          const amount = round(rng.float(310_000, 380_000) * scale)
          return [
            { accountCode: '5400', debit: amount, credit: 0 },
            { accountCode: '1510', debit: 0, credit: amount },
          ]
        },
      },
      {
        memo: 'Travel, utilities & professional fees',
        source: 'Manual',
        make: () => {
          const travel = round(rng.float(120_000, 340_000) * scale)
          const utilities = round(rng.float(80_000, 160_000) * scale)
          const fees = round(rng.float(90_000, 260_000) * scale)
          return [
            { accountCode: '5700', debit: travel, credit: 0 },
            { accountCode: '5900', debit: utilities, credit: 0 },
            { accountCode: '5800', debit: fees, credit: 0 },
            { accountCode: '1000', debit: 0, credit: round(travel + utilities + fees) },
          ]
        },
      },
    ]

    for (const template of templates) {
      const day = rng.int(1, 27)
      tables.journalEntries.push({
        ...base(t, `${t}_je_${jeSeq}`, (periods.length - monthIndex) * 30),
        reference: `JE-${period.replace('-', '')}-${String(jeSeq).padStart(4, '0')}`,
        date: `${period}-${String(day).padStart(2, '0')}`,
        period,
        memo: template.memo,
        currency,
        fxRate: 1,
        // Two specific entries in the open month stay unposted, so the
        // "drafts block period close" rule has something to catch without
        // skewing the current month's profit.
        status: period === CURRENT_PERIOD && DRAFT_IN_CURRENT_PERIOD.has(template.memo) ? 'Draft' : 'Posted',
        source: template.source,
        postedBy: null,
        lines: template.make(),
      })
      jeSeq++
    }
  }

  // All months before the last two are closed.
  for (const period of periods) {
    const closed = period < addMonths(CURRENT_PERIOD, -1)
    tables.periods.push({
      ...base(t, `${t}_per_${period}`, 60),
      period,
      status: closed ? 'Closed' : 'Open',
      closedAt: closed ? stamp(20) : null,
      closedBy: null,
    })
  }

  /* ------------------------------------------------------------- projects */
  const managers = employees.filter((e) => e.designation.includes('Manager'))
  const projectSpecs = PROJECT_SPECS.slice(0, Math.max(3, Math.round(PROJECT_SPECS.length * Math.min(1, employeeScale + 0.3))))

  projectSpecs.forEach((spec, i) => {
    const startOffset = rng.int(40, 260)
    const duration = rng.int(120, 300)
    const progress = Math.min(100, Math.round((startOffset / duration) * 100 * rng.float(0.75, 1.15)))
    const costRatio = rng.float(0.65, 1.24)
    const status: Project['status'] =
      progress >= 100 ? 'Completed' : costRatio > 1.1 ? 'At Risk' : progress < 12 ? 'Planning' : rng.chance(0.12) ? 'On Hold' : 'Active'

    const projectId = `${t}_prj_${i + 1}`
    const budget = Math.round(spec.budget * employeeScale)
    const startDate = addDays(NOW, -startOffset)
    const endDate = addDays(startDate, duration)

    tables.projects.push({
      ...base(t, projectId, startOffset),
      code: spec.code,
      name: spec.name,
      clientName: spec.client,
      managerId: managers.length ? rng.pick(managers).id : employees[0].id,
      status,
      startDate: toISODate(startDate),
      endDate: toISODate(endDate),
      budget,
      actualCost: Math.round(budget * (progress / 100) * costRatio),
      progressPct: progress,
      currency,
      updatedAt: stamp(rng.int(0, 6)),
    })

    // Tasks form a simple chain, so the dependency graph is a valid DAG.
    const taskCount = rng.int(6, TASK_TEMPLATES.length)
    let cursor = startDate
    let previousTaskId: string | null = null

    for (let ti = 0; ti < taskCount; ti++) {
      const taskId = `${projectId}_task_${ti + 1}`
      const length = rng.int(6, 26)
      const taskStart = cursor
      const taskEnd = addDays(taskStart, length)
      const done = taskEnd.getTime() < NOW.getTime()
      const inFlight = !done && taskStart.getTime() < NOW.getTime()

      tables.tasks.push({
        ...base(t, taskId, startOffset),
        projectId,
        name: TASK_TEMPLATES[ti % TASK_TEMPLATES.length],
        assigneeId: rng.pick(employees).id,
        status: done ? 'Done' : inFlight ? (rng.chance(0.14) ? 'Blocked' : 'In Progress') : 'Todo',
        startDate: toISODate(taskStart),
        endDate: toISODate(taskEnd),
        progressPct: done ? 100 : inFlight ? rng.int(15, 85) : 0,
        dependsOn: previousTaskId ? [previousTaskId] : [],
        isMilestone: ti === taskCount - 1 || ti === Math.floor(taskCount / 2),
        estimateHours: length * 6,
        loggedHours: done ? length * rng.int(5, 7) : inFlight ? length * rng.int(2, 4) : 0,
      })

      previousTaskId = taskId
      cursor = addDays(taskEnd, rng.int(-3, 5))
    }
  })

  /* -------------------------------------------------------- demand series */
  const forecastSkus = catalogue.slice(0, Math.min(14, catalogue.length))
  const historyPeriods = recentPeriods(36)

  for (const item of forecastSkus) {
    const level = rng.int(280, 1400)
    const trendPerMonth = rng.float(-4, 16, 2)
    const seasonalAmplitude = rng.float(0.1, 0.34, 3)
    const seasonalPhase = rng.int(0, 11)
    const noiseLevel = rng.float(0.03, 0.11, 3)

    const history: DemandPoint[] = historyPeriods.map((period, idx) => {
      const trendComponent = level + trendPerMonth * idx
      const seasonalComponent = 1 + seasonalAmplitude * Math.sin(((idx + seasonalPhase) / 12) * Math.PI * 2)
      const noise = 1 + (rng.next() - 0.5) * 2 * noiseLevel
      // Occasional promo spike keeps the series from being trivially smooth.
      const spike = rng.chance(0.045) ? rng.float(1.18, 1.45) : 1
      return { period, qty: Math.max(0, Math.round(trendComponent * seasonalComponent * noise * spike)) }
    })

    tables.demandSeries.push({
      ...base(t, `${t}_dem_${item.sku}`, 900),
      sku: item.sku,
      name: item.name,
      history,
    })
  }

  /* ------------------------------------------------------- notifications */
  const notificationSpecs: { event: string; title: string; body: string; severity: Notification['severity']; href: string }[] = [
    {
      event: 'inventory.reorder_triggered',
      title: 'Reorder point breached',
      body: `${inventory.filter((i) => i.onHand - i.allocated <= i.reorderPoint).length} SKUs are at or below their reorder point.`,
      severity: 'warning',
      href: '/supply-chain/inventory',
    },
    {
      event: 'finance.invoice_overdue',
      title: 'Receivables ageing past 60 days',
      body: `${invoices.filter((i) => i.status === 'Overdue').length} invoices are overdue and need collection follow-up.`,
      severity: 'critical',
      href: '/finance/receivables',
    },
    {
      event: 'payroll.run_completed',
      title: `Payroll completed for ${payrollPeriods[payrollPeriods.length - 1]}`,
      body: 'All payslips generated and the audit trail was written successfully.',
      severity: 'success',
      href: '/hr/payroll',
    },
    {
      event: 'hr.leave_pending',
      title: 'Leave approvals waiting',
      body: 'Several leave requests have been pending for more than 48 hours.',
      severity: 'info',
      href: '/hr/leave',
    },
    {
      event: 'forecast.model_retrained',
      title: 'Demand models retrained',
      body: 'Holt-Winters and additive models were refitted on the latest 36-month window.',
      severity: 'success',
      href: '/forecasting',
    },
    {
      event: 'project.budget_overrun',
      title: 'Project budget variance above 10%',
      body: 'At least one active project is forecast to exceed its approved budget.',
      severity: 'warning',
      href: '/projects',
    },
    {
      event: 'finance.period_close_due',
      title: 'Period close is due',
      body: `${addMonths(CURRENT_PERIOD, -1)} is still open. Review draft journals before locking.`,
      severity: 'info',
      href: '/finance/ledger',
    },
    {
      event: 'security.new_signin',
      title: 'New sign-in detected',
      body: 'A session was started from a new device on your tenant.',
      severity: 'info',
      href: '/settings',
    },
  ]

  notificationSpecs.forEach((spec, i) => {
    tables.notifications.push({
      ...base(t, `${t}_ntf_${i + 1}`, i),
      event: spec.event,
      title: spec.title,
      body: spec.body,
      severity: spec.severity,
      read: i > 4,
      href: spec.href,
      channels: i % 3 === 0 ? ['inApp', 'email'] : ['inApp'],
      deliveryAttempts: 1,
      delivered: true,
    })
  })

  /* ------------------------------------------------------------ FX rates */
  const rates: Record<string, number> = currency === 'INR'
    ? { INR: 1, USD: 0.0119, EUR: 0.0110, GBP: 0.0094, AED: 0.0437, SGD: 0.0159 }
    : { USD: 1, INR: 84.2, EUR: 0.92, GBP: 0.79, AED: 3.67, SGD: 1.34 }

  for (const [code, rate] of Object.entries(rates)) {
    tables.fxRates.push({ code: code as FxRate['code'], rateToBase: rate, asOf: TODAY })
  }
}

/* -------------------------------------------------------------- audit chain */

export const GENESIS_HASH = '0'.repeat(64)

export function auditHash(prevHash: string, payload: Omit<AuditLog, 'hash'>): string {
  // Canonical, key-ordered serialisation so the hash is reproducible.
  const canonical = [
    payload.seq,
    payload.tenantId,
    payload.at,
    payload.actorId ?? '',
    payload.action,
    payload.entity,
    payload.entityId,
    payload.summary,
  ].join('|')
  return sha256Hex(`${prevHash}${canonical}`)
}

function seedAuditTrail(tables: Tables, tenantId: ID, rng: Rng): void {
  const actions: { action: string; entity: string; summary: string }[] = [
    { action: 'auth.login', entity: 'User', summary: 'Signed in with password + MFA' },
    { action: 'employee.create', entity: 'Employee', summary: 'Created employee record' },
    { action: 'employee.update', entity: 'Employee', summary: 'Updated compensation band' },
    { action: 'journal.post', entity: 'JournalEntry', summary: 'Posted journal entry to the general ledger' },
    { action: 'invoice.approve', entity: 'Invoice', summary: 'Approved payable invoice after 3-way match' },
    { action: 'payroll.run', entity: 'PayrollRun', summary: 'Executed monthly payroll run' },
    { action: 'po.approve', entity: 'PurchaseOrder', summary: 'Approved purchase order' },
    { action: 'leave.decide', entity: 'LeaveRequest', summary: 'Approved leave request' },
    { action: 'period.close', entity: 'AccountingPeriod', summary: 'Locked accounting period' },
    { action: 'forecast.run', entity: 'DemandSeries', summary: 'Regenerated demand forecast' },
    { action: 'inventory.adjust', entity: 'InventoryItem', summary: 'Recorded stock adjustment' },
    { action: 'settings.update', entity: 'Tenant', summary: 'Updated tenant notification policy' },
  ]

  let prevHash = GENESIS_HASH
  let seq = 1

  for (let i = 0; i < 26; i++) {
    const spec = rng.pick(actions)
    const at = addDays(NOW, -Math.floor((26 - i) / 2)).toISOString()
    const payload: Omit<AuditLog, 'hash'> = {
      id: `${tenantId}_aud_${seq}`,
      tenantId,
      seq,
      at,
      actorId: `${tenantId}_usr_admin`,
      actorName: 'Priya Nair',
      action: spec.action,
      entity: spec.entity,
      entityId: `${spec.entity.toLowerCase()}_${rng.int(1000, 9999)}`,
      summary: spec.summary,
      ip: `10.${rng.int(0, 255)}.${rng.int(0, 255)}.${rng.int(1, 254)}`,
      prevHash,
    }
    const hash = auditHash(prevHash, payload)
    tables.auditLogs.push({ ...payload, hash })
    prevHash = hash
    seq++
  }
}

/* ------------------------------------------------------------------- users */

interface UserSpec {
  key: string
  email: string
  name: string
  role: User['role']
}

const AMDOX_USERS: UserSpec[] = [
  { key: 'owner', email: 'nishant@amdox.in', name: 'Nishant Dhall', role: 'SuperAdmin' },
  { key: 'admin', email: 'admin@amdox.in', name: 'Priya Nair', role: 'TenantAdmin' },
  { key: 'finance', email: 'cfo@amdox.in', name: 'Pratim Roy', role: 'Manager' },
  { key: 'hr', email: 'hr@amdox.in', name: 'Sneha Iyer', role: 'Manager' },
  { key: 'staff', email: 'employee@amdox.in', name: 'Arjun Sharma', role: 'Employee' },
  { key: 'viewer', email: 'viewer@amdox.in', name: 'Audit Observer', role: 'Viewer' },
]

const NORTHWIND_USERS: UserSpec[] = [
  { key: 'admin', email: 'admin@northwind.io', name: 'Grace Tan', role: 'TenantAdmin' },
  { key: 'staff', email: 'ops@northwind.io', name: 'Marcus Lee', role: 'Employee' },
]

function buildUsers(tables: Tables, tenantId: ID, specs: UserSpec[]): void {
  const tenantEmployees = tables.employees.filter((e) => e.tenantId === tenantId)

  specs.forEach((spec, i) => {
    tables.users.push({
      ...base(tenantId, `${tenantId}_usr_${spec.key}`, 400),
      email: spec.email,
      name: spec.name,
      role: spec.role,
      passwordHash: hashPassword(spec.email, DEMO_PASSWORD),
      employeeId: tenantEmployees[i]?.id ?? null,
      mfaEnabled: spec.role === 'SuperAdmin' || spec.role === 'TenantAdmin',
      lastLoginAt: stamp(i),
      notificationPrefs: { inApp: true, email: spec.role !== 'Viewer', webhook: spec.role === 'SuperAdmin', muted: [] },
    })
  })
}

/* -------------------------------------------------------------- entry point */

export const TENANTS: Tenant[] = [
  {
    id: 'tnt_amdox',
    name: 'Amdox Technologies',
    slug: 'amdox',
    baseCurrency: 'INR',
    country: 'India',
    plan: 'enterprise',
    mfaRequired: true,
    createdAt: stamp(900),
  },
  {
    id: 'tnt_northwind',
    name: 'Northwind Industrial',
    slug: 'northwind',
    baseCurrency: 'USD',
    country: 'Singapore',
    plan: 'growth',
    mfaRequired: false,
    createdAt: stamp(420),
  },
]

export function buildSeed(): Tables {
  const tables: Tables = {
    tenants: [...TENANTS],
    users: [],
    departments: [],
    employees: [],
    attendance: [],
    leaveRequests: [],
    payrollRuns: [],
    payslips: [],
    accounts: [],
    journalEntries: [],
    periods: [],
    invoices: [],
    payments: [],
    vendors: [],
    customers: [],
    warehouses: [],
    inventory: [],
    stockMovements: [],
    purchaseOrders: [],
    goodsReceipts: [],
    projects: [],
    tasks: [],
    demandSeries: [],
    notifications: [],
    auditLogs: [],
    fxRates: [],
  }

  buildTenantData({ tenant: TENANTS[0], seed: 20260415, employeeScale: 1, currency: 'INR' }, tables)
  buildTenantData({ tenant: TENANTS[1], seed: 77341902, employeeScale: 0.34, currency: 'USD' }, tables)

  buildUsers(tables, TENANTS[0].id, AMDOX_USERS)
  buildUsers(tables, TENANTS[1].id, NORTHWIND_USERS)

  // Attach payroll runs and approvals to a real actor now that users exist.
  const amdoxAdmin = tables.users.find((u) => u.id === 'tnt_amdox_usr_admin')
  if (amdoxAdmin) {
    for (const run of tables.payrollRuns) {
      if (run.tenantId === TENANTS[0].id) run.processedBy = amdoxAdmin.id
    }
  }

  seedAuditTrail(tables, TENANTS[0].id, createRng(31415926))
  seedAuditTrail(tables, TENANTS[1].id, createRng(27182818))

  return tables
}

export const DEMO_ACCOUNTS = [
  { email: 'nishant@amdox.in', role: 'SuperAdmin', label: 'Full platform access, both tenants' },
  { email: 'admin@amdox.in', role: 'TenantAdmin', label: 'Tenant administration & settings' },
  { email: 'cfo@amdox.in', role: 'Manager', label: 'Finance approvals & period close' },
  { email: 'hr@amdox.in', role: 'Manager', label: 'HR, leave approvals & payroll' },
  { email: 'employee@amdox.in', role: 'Employee', label: 'Self-service views only' },
  { email: 'viewer@amdox.in', role: 'Viewer', label: 'Read-only dashboards' },
] as const
