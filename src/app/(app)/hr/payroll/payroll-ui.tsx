'use client'

import { ActionForm, SubmitButton } from '@/components/ui/action'
import { runPayrollAction } from '@/app/(app)/actions'
import { Card, CardBody, CardHeader } from '@/components/ui/primitives'
import { periodLabel } from '@/lib/utils'

export function RunPayrollPanel({ canRun, periods }: { canRun: boolean; periods: string[] }) {
  return (
    <Card>
      <CardHeader title="Run payroll" subtitle="Batch calculation with audit trail" />
      <CardBody>
        {!canRun ? (
          <p className="py-6 text-center text-xs text-ink-muted">
            Your role can view payroll but not execute a run. A Manager or above is required.
          </p>
        ) : periods.length === 0 ? (
          <p className="py-6 text-center text-xs text-ink-muted">
            Every recent period has already been processed. Re-running a completed period is rejected as a conflict.
          </p>
        ) : (
          <ActionForm action={runPayrollAction}>
            <div>
              <label className="label" htmlFor="payroll-period">
                Period
              </label>
              <select id="payroll-period" name="period" className="input" defaultValue={periods[0]}>
                {periods.map((period) => (
                  <option key={period} value={period}>
                    {periodLabel(period)}
                  </option>
                ))}
              </select>
            </div>

            <ul className="space-y-1.5 text-[11px] leading-relaxed text-ink-muted">
              <li>• Computes basic / HRA / special allowance from each employee&apos;s CTC.</li>
              <li>• Applies PF, professional tax and slab-based income tax with cess.</li>
              <li>• Deducts approved unpaid leave pro-rata from paid days.</li>
              <li>• Posts a balanced accrual journal to the general ledger.</li>
              <li>• Writes an audit record and notifies the finance team.</li>
            </ul>

            <SubmitButton size="md" className="w-full" pendingLabel="Processing payroll…">
              Run payroll
            </SubmitButton>
          </ActionForm>
        )}
      </CardBody>
    </Card>
  )
}
