'use client'

import { ActionForm, Dialog, SubmitButton } from '@/components/ui/action'
import { createLeaveAction } from '@/app/(app)/actions'
import { toISODate, addDays } from '@/lib/utils'

export function ApplyLeaveDialog({
  employees,
  defaultEmployeeId,
  lockEmployee,
}: {
  employees: { id: string; name: string }[]
  defaultEmployeeId: string
  lockEmployee: boolean
}) {
  const today = toISODate(new Date())
  const tomorrow = toISODate(addDays(new Date(), 1))

  return (
    <Dialog trigger={{ label: 'Apply for leave' }} title="Apply for leave" description="Creates a pending request routed to the reporting manager.">
      {(close) => (
        <ActionForm action={createLeaveAction} onSuccess={close}>
          <div>
            <label className="label" htmlFor="leave-employee">
              Employee
            </label>
            {lockEmployee ? (
              <>
                <input type="hidden" name="employeeId" value={defaultEmployeeId} />
                <input
                  className="input"
                  disabled
                  value={employees.find((e) => e.id === defaultEmployeeId)?.name ?? 'You'}
                  aria-label="Employee"
                />
              </>
            ) : (
              <select id="leave-employee" name="employeeId" className="input" defaultValue={defaultEmployeeId} required>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label" htmlFor="leave-type">
                Type
              </label>
              <select id="leave-type" name="type" className="input" defaultValue="Casual">
                {['Casual', 'Sick', 'Earned', 'Unpaid', 'Maternity'].map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="leave-from">
                From
              </label>
              <input id="leave-from" name="from" type="date" className="input" defaultValue={today} required />
            </div>
            <div>
              <label className="label" htmlFor="leave-to">
                To
              </label>
              <input id="leave-to" name="to" type="date" className="input" defaultValue={tomorrow} required />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="leave-reason">
              Reason
            </label>
            <textarea id="leave-reason" name="reason" className="input min-h-[76px] resize-y" required placeholder="Family function out of town" />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={close} className="rounded-lg border border-ink-line px-3 py-2 text-xs font-semibold text-ink hover:bg-surface-sunken">
              Cancel
            </button>
            <SubmitButton pendingLabel="Submitting…">Submit request</SubmitButton>
          </div>
        </ActionForm>
      )}
    </Dialog>
  )
}
