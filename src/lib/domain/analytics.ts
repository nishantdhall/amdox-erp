import {
  listAccounts,
  listEmployees,
  listInventory,
  listInvoices,
  listJournalEntries,
  listLeave,
  listPayrollRuns,
  listProjects,
  listPurchaseOrders,
  listDemandSeries,
  listDepartments,
  listAttendance,
} from '../db/repo'
import { agingReport, daysSalesOutstanding, incomeStatement, trialBalance } from './ledger'
import { forecastPortfolio } from './forecast'
import { budgetVariance } from './projects'
import { inventoryValue, isBelowReorderPoint, stockHealth } from './inventory'
import { addMonths, round, toPeriod } from '../utils'
import type { ID } from '../types'

/**
 * Cross-module aggregation for the executive dashboard and BI screens (F-08).
 *
 * Kept in one place so the dashboard, the analytics builder and the
 * `/api/v1/analytics/summary` endpoint can never drift from each other.
 */

export interface RevenueSeriesPoint {
  period: string
  revenue: number
  expenses: number
  profit: number
}

export function revenueSeries(tenantId: ID, months = 8): RevenueSeriesPoint[] {
  const accounts = listAccounts(tenantId)
  const entries = listJournalEntries(tenantId)
  const current = toPeriod(new Date())

  const points: RevenueSeriesPoint[] = []
  for (let i = months - 1; i >= 0; i--) {
    const period = addMonths(current, -i)
    const statement = incomeStatement(accounts, entries, period, period)
    points.push({
      period,
      revenue: statement.revenue,
      expenses: statement.expenses,
      profit: statement.netProfit,
    })
  }
  return points
}

export interface DashboardKpis {
  revenueMtd: number
  revenueGrowthPct: number
  netProfitMtd: number
  marginPct: number
  headcount: number
  attritionRiskCount: number
  openPoCount: number
  openPoValue: number
  inventoryValue: number
  lowStockCount: number
  receivablesOutstanding: number
  receivablesOverdue: number
  payablesOutstanding: number
  dso: number
  forecastAccuracyPct: number
  activeProjects: number
  projectsAtRisk: number
  pendingLeave: number
  cashBalance: number
}

export function dashboardKpis(tenantId: ID): DashboardKpis {
  const accounts = listAccounts(tenantId)
  const entries = listJournalEntries(tenantId)
  const current = toPeriod(new Date())
  const previous = addMonths(current, -1)

  const thisMonth = incomeStatement(accounts, entries, current, current)
  const lastMonth = incomeStatement(accounts, entries, previous, previous)

  const employees = listEmployees(tenantId)
  const inventory = listInventory(tenantId)
  const purchaseOrders = listPurchaseOrders(tenantId)
  const openPos = purchaseOrders.filter((p) => p.status !== 'Received' && p.status !== 'Cancelled')

  const receivables = agingReport(listInvoices(tenantId, { kind: 'AR' }))
  const payables = agingReport(listInvoices(tenantId, { kind: 'AP' }))

  const projects = listProjects(tenantId)
  const forecast = forecastPortfolio(listDemandSeries(tenantId), { horizonMonths: 6 })

  const balances = trialBalance(accounts, entries)
  const cash = balances.find((row) => row.accountCode === '1000')?.balance ?? 0

  return {
    revenueMtd: thisMonth.revenue,
    revenueGrowthPct: lastMonth.revenue === 0 ? 0 : round(((thisMonth.revenue - lastMonth.revenue) / lastMonth.revenue) * 100, 1),
    netProfitMtd: thisMonth.netProfit,
    marginPct: thisMonth.marginPct,
    headcount: employees.filter((e) => e.status !== 'Exited').length,
    attritionRiskCount: employees.filter((e) => e.status === 'On Leave' || e.status === 'Probation').length,
    openPoCount: openPos.length,
    openPoValue: round(openPos.reduce((s, p) => s + p.total, 0)),
    inventoryValue: inventoryValue(inventory),
    lowStockCount: inventory.filter(isBelowReorderPoint).length,
    receivablesOutstanding: receivables.total,
    receivablesOverdue: receivables.overdue,
    payablesOutstanding: payables.total,
    dso: daysSalesOutstanding(listInvoices(tenantId, { kind: 'AR' })),
    forecastAccuracyPct: round(Math.max(0, 100 - forecast.avgMape), 1),
    activeProjects: projects.filter((p) => p.status === 'Active' || p.status === 'At Risk').length,
    projectsAtRisk: projects.filter((p) => budgetVariance(p).overrun || p.status === 'At Risk').length,
    pendingLeave: listLeave(tenantId, { status: 'Pending' }).length,
    cashBalance: cash,
  }
}

export interface DepartmentHeadcount {
  code: string
  name: string
  headcount: number
  payrollMonthly: number
  budgetAnnual: number
}

export function departmentBreakdown(tenantId: ID): DepartmentHeadcount[] {
  const departments = listDepartments(tenantId)
  const employees = listEmployees(tenantId)

  return departments
    .map((department) => {
      const members = employees.filter((e) => e.departmentId === department.id && e.status !== 'Exited')
      return {
        code: department.code,
        name: department.name,
        headcount: members.length,
        payrollMonthly: round(members.reduce((s, e) => s + e.ctcAnnual / 12, 0)),
        budgetAnnual: department.budgetAnnual,
      }
    })
    .sort((a, b) => b.headcount - a.headcount)
}

export interface CategoryValue {
  label: string
  value: number
}

export function revenueByStream(tenantId: ID): CategoryValue[] {
  const accounts = listAccounts(tenantId)
  const entries = listJournalEntries(tenantId)
  const rows = trialBalance(accounts, entries)

  return rows
    .filter((row) => row.type === 'Revenue')
    .map((row) => ({ label: row.accountName, value: row.balance }))
    .sort((a, b) => b.value - a.value)
}

export function expenseByCategory(tenantId: ID): CategoryValue[] {
  const accounts = listAccounts(tenantId)
  const entries = listJournalEntries(tenantId)
  const rows = trialBalance(accounts, entries)

  return rows
    .filter((row) => row.type === 'Expense')
    .map((row) => ({ label: row.accountName, value: row.balance }))
    .sort((a, b) => b.value - a.value)
}

export function inventoryByCategory(tenantId: ID): CategoryValue[] {
  const items = listInventory(tenantId)
  const totals = new Map<string, number>()
  for (const item of items) {
    totals.set(item.category, (totals.get(item.category) ?? 0) + item.onHand * item.unitCost)
  }
  return [...totals.entries()]
    .map(([label, value]) => ({ label, value: round(value) }))
    .sort((a, b) => b.value - a.value)
}

export interface StockAlert {
  sku: string
  name: string
  available: number
  reorderPoint: number
  health: ReturnType<typeof stockHealth>
}

export function stockAlerts(tenantId: ID, limit = 8): StockAlert[] {
  return listInventory(tenantId)
    .map((item) => ({
      sku: item.sku,
      name: item.name,
      available: item.onHand - item.allocated,
      reorderPoint: item.reorderPoint,
      health: stockHealth(item),
    }))
    .filter((row) => row.health !== 'Healthy' && row.health !== 'Overstocked')
    .sort((a, b) => a.available - b.available)
    .slice(0, limit)
}

/** Daily attendance rate over the trailing window, weekends excluded. */
export function attendanceTrend(tenantId: ID, days = 21): { date: string; presentPct: number }[] {
  const records = listAttendance(tenantId)
  const byDate = new Map<string, { present: number; total: number }>()

  for (const record of records) {
    if (record.status === 'Weekend' || record.status === 'Holiday') continue
    const bucket = byDate.get(record.date) ?? { present: 0, total: 0 }
    bucket.total++
    if (record.status === 'Present' || record.status === 'Remote') bucket.present++
    byDate.set(record.date, bucket)
  }

  return [...byDate.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-days)
    .map(([date, bucket]) => ({ date, presentPct: bucket.total === 0 ? 0 : round((bucket.present / bucket.total) * 100, 1) }))
}

export function payrollTrend(tenantId: ID) {
  return listPayrollRuns(tenantId)
    .slice()
    .sort((a, b) => a.period.localeCompare(b.period))
    .map((run) => ({ period: run.period, gross: run.grossTotal, net: run.netTotal, deductions: run.deductionTotal }))
}

/** Everything the `/api/v1/analytics/summary` endpoint returns. */
export function analyticsSummary(tenantId: ID) {
  return {
    kpis: dashboardKpis(tenantId),
    revenueSeries: revenueSeries(tenantId, 8),
    departments: departmentBreakdown(tenantId),
    revenueByStream: revenueByStream(tenantId),
    expenseByCategory: expenseByCategory(tenantId),
    inventoryByCategory: inventoryByCategory(tenantId),
    stockAlerts: stockAlerts(tenantId),
    attendanceTrend: attendanceTrend(tenantId),
    payrollTrend: payrollTrend(tenantId),
  }
}
