'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useTransition } from 'react'
import { ActionForm, Dialog, SubmitButton } from '@/components/ui/action'
import { createEmployeeAction } from '@/app/(app)/actions'

interface DepartmentOption {
  id: string
  name: string
}

/** Filters are URL state, so a filtered view is shareable and back-navigable. */
export function EmployeeFilters({
  departments,
  defaults,
}: {
  departments: DepartmentOption[]
  defaults: { search: string; departmentId: string; status: string }
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()
  const [search, setSearch] = useState(defaults.search)

  const apply = (patch: Record<string, string>) => {
    const next = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(patch)) {
      if (value) next.set(key, value)
      else next.delete(key)
    }
    startTransition(() => router.replace(`/hr/employees?${next.toString()}`))
  }

  return (
    <form
      className="flex flex-wrap items-end gap-2"
      onSubmit={(event) => {
        event.preventDefault()
        apply({ search })
      }}
    >
      <div className="min-w-[180px] flex-1">
        <label className="label" htmlFor="employee-search">
          Search
        </label>
        <input
          id="employee-search"
          className="input"
          placeholder="Name, code, email or designation"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <div>
        <label className="label" htmlFor="employee-department">
          Department
        </label>
        <select
          id="employee-department"
          className="input min-w-[150px]"
          defaultValue={defaults.departmentId}
          onChange={(event) => apply({ departmentId: event.target.value })}
        >
          <option value="">All departments</option>
          {departments.map((department) => (
            <option key={department.id} value={department.id}>
              {department.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label" htmlFor="employee-status">
          Status
        </label>
        <select
          id="employee-status"
          className="input min-w-[130px]"
          defaultValue={defaults.status}
          onChange={(event) => apply({ status: event.target.value })}
        >
          <option value="">Any status</option>
          {['Active', 'On Leave', 'Probation', 'Exited'].map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg border border-ink-line bg-white px-3 py-2 text-xs font-semibold text-ink transition-colors hover:bg-surface-sunken disabled:opacity-60"
      >
        {pending ? 'Filtering…' : 'Apply'}
      </button>

      {defaults.search || defaults.departmentId || defaults.status ? (
        <button
          type="button"
          onClick={() => {
            setSearch('')
            startTransition(() => router.replace('/hr/employees'))
          }}
          className="rounded-lg px-2.5 py-2 text-xs font-semibold text-brand-600 hover:bg-brand-50"
        >
          Reset
        </button>
      ) : null}
    </form>
  )
}

export function NewEmployeeDialog({ departments }: { departments: DepartmentOption[] }) {
  return (
    <Dialog
      trigger={{ label: '+ Add employee' }}
      title="Add an employee"
      description="Creates the master record, emits an onboarding notification and writes an audit entry."
    >
      {(close) => (
        <ActionForm action={createEmployeeAction} onSuccess={close}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="firstName">
                First name
              </label>
              <input id="firstName" name="firstName" className="input" required placeholder="Aarav" />
            </div>
            <div>
              <label className="label" htmlFor="lastName">
                Last name
              </label>
              <input id="lastName" name="lastName" className="input" required placeholder="Sharma" />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="email">
              Work email
            </label>
            <input id="email" name="email" type="email" className="input" required placeholder="aarav.sharma@amdox.io" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="departmentId">
                Department
              </label>
              <select id="departmentId" name="departmentId" className="input" required defaultValue={departments[0]?.id}>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="employmentType">
                Employment type
              </label>
              <select id="employmentType" name="employmentType" className="input" defaultValue="Full-time">
                {['Full-time', 'Part-time', 'Contract', 'Intern'].map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="designation">
                Designation
              </label>
              <input id="designation" name="designation" className="input" required placeholder="Software Engineer" />
            </div>
            <div>
              <label className="label" htmlFor="location">
                Location
              </label>
              <select id="location" name="location" className="input" defaultValue="Bengaluru">
                {['Bengaluru', 'Pune', 'Hyderabad', 'Gurugram', 'Chennai', 'Remote'].map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="ctcAnnual">
                Annual CTC
              </label>
              <input id="ctcAnnual" name="ctcAnnual" type="number" min={1} step={1000} className="input tnum" required defaultValue={900000} />
            </div>
            <div>
              <label className="label" htmlFor="phone">
                Phone
              </label>
              <input id="phone" name="phone" className="input" placeholder="+91 90000 00000" />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={close} className="rounded-lg border border-ink-line px-3 py-2 text-xs font-semibold text-ink hover:bg-surface-sunken">
              Cancel
            </button>
            <SubmitButton pendingLabel="Creating…">Create employee</SubmitButton>
          </div>
        </ActionForm>
      )}
    </Dialog>
  )
}
