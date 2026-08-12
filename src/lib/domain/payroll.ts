import { round } from '../utils'

/**
 * Gross-to-net payroll engine (F-04).
 *
 * Salary structure follows the common Indian CTC split, and income tax uses the
 * FY 2025-26 new-regime slabs with the §87A rebate and 4% health & education
 * cess. Slabs live in `TAX_SLABS` so a tenant can override them without
 * touching the calculation.
 */

export interface TaxSlab {
  upTo: number | null // null = no upper bound
  rate: number
}

export const TAX_SLABS: TaxSlab[] = [
  { upTo: 300_000, rate: 0 },
  { upTo: 700_000, rate: 0.05 },
  { upTo: 1_000_000, rate: 0.1 },
  { upTo: 1_200_000, rate: 0.15 },
  { upTo: 1_500_000, rate: 0.2 },
  { upTo: null, rate: 0.3 },
]

export const PAYROLL_CONSTANTS = {
  standardDeduction: 75_000,
  /** Taxable income at or below this gets a full rebate under §87A. */
  rebateThreshold: 700_000,
  cessRate: 0.04,
  basicPct: 0.4,
  hraPct: 0.2,
  /** Employee provident fund contribution on basic. */
  pfRate: 0.12,
  /** Statutory ceiling for PF-eligible basic, per month. */
  pfWageCeiling: 15_000,
  professionalTaxMonthly: 200,
  workingDaysPerMonth: 22,
}

/** Annual income tax under the new regime, including cess. */
export function calculateAnnualTax(annualGross: number, slabs: TaxSlab[] = TAX_SLABS): number {
  const taxable = Math.max(0, annualGross - PAYROLL_CONSTANTS.standardDeduction)
  if (taxable <= PAYROLL_CONSTANTS.rebateThreshold) return 0

  let tax = 0
  let lower = 0
  for (const slab of slabs) {
    const upper = slab.upTo ?? Infinity
    if (taxable > lower) {
      tax += (Math.min(taxable, upper) - lower) * slab.rate
    }
    lower = upper
    if (taxable <= upper) break
  }

  return round(tax * (1 + PAYROLL_CONSTANTS.cessRate))
}

export interface PayslipComputation {
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

/**
 * Compute one employee's payslip for a month.
 *
 * `unpaidDays` shaves a pro-rata slice off the gross before deductions, which
 * is how loss-of-pay leave feeds the payroll run.
 */
export function computePayslip(ctcAnnual: number, unpaidDays = 0): PayslipComputation {
  const c = PAYROLL_CONSTANTS
  const monthlyGrossFull = ctcAnnual / 12
  const paidDays = Math.max(0, c.workingDaysPerMonth - unpaidDays)
  const proRata = paidDays / c.workingDaysPerMonth

  const basic = round(monthlyGrossFull * c.basicPct * proRata)
  const hra = round(monthlyGrossFull * c.hraPct * proRata)
  const specialAllowance = round(monthlyGrossFull * (1 - c.basicPct - c.hraPct) * proRata)
  const gross = round(basic + hra + specialAllowance)

  const pf = round(Math.min(basic, c.pfWageCeiling) * c.pfRate)
  const professionalTax = gross > 0 ? c.professionalTaxMonthly : 0
  const incomeTax = round(calculateAnnualTax(ctcAnnual) / 12)
  const leaveDeduction = round(monthlyGrossFull - gross)

  const totalDeductions = round(pf + professionalTax + incomeTax)
  const net = round(gross - totalDeductions)

  return {
    basic,
    hra,
    specialAllowance,
    gross,
    pf,
    professionalTax,
    incomeTax,
    leaveDeduction,
    totalDeductions,
    net,
    paidDays,
  }
}
