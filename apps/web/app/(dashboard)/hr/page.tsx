'use client'
import { usePathname } from 'next/navigation'
import { SubNav } from '@/components/sub-nav'
import { Badge } from '@/components/badge'
import { DataTable } from '@/components/data-table'
import { employees } from '@/lib/mock-data'

const hrNavItems = [
  { label: 'Employees', href: '/hr' },
  { label: 'Attendance', href: '/hr/attendance' },
  { label: 'Leave Mgmt', href: '/hr/leave' },
  { label: 'Run Payroll', href: '/hr/payroll' },
  { label: 'Org Chart', href: '/hr/org-chart' },
  { label: 'Compliance', href: '/hr/compliance' },
  { label: 'Payslips', href: '/hr/payslips' },
]

export default function HRPage() {
  const pathname = usePathname()

  const columns = [
    { key: 'name', label: 'Name', render: (v: string) => <span className="font-semibold text-[#1a1d2e]">{v}</span> },
    { key: 'department', label: 'Department' },
    { key: 'role', label: 'Role' },
    { key: 'joinDate', label: 'Join Date' },
    { key: 'salary', label: 'Salary', render: (v: string) => <span className="font-medium">{v}</span> },
    { key: 'status', label: 'Status', render: (v: string) => (
      <Badge variant={v === 'Active' ? 'success' : 'warning'}>{v}</Badge>
    )},
  ]

  return (
    <div className="flex gap-4 animate-fade-in">
      <SubNav items={hrNavItems} title="HR & Payroll" icon="👥" currentPath={pathname} />

      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5">
          <h2 className="text-lg font-bold text-[#1a1d2e]">Employees — 248 Active</h2>
          <div className="flex gap-2 mt-2 sm:mt-0">
            <input
              type="text"
              placeholder="Search..."
              className="px-3 py-2 border border-[#e0e5ef] rounded-lg text-[12px] w-[180px] focus:outline-none focus:border-[#4f6ef7] bg-white"
            />
            <button className="bg-[#4f6ef7] text-white px-4 py-2 rounded-lg text-[12px] font-semibold hover:bg-[#3d5bd9] transition-colors">
              + Onboard
            </button>
          </div>
        </div>

        {/* Employees Table */}
        <DataTable columns={columns} data={employees} title="Employee Directory" />

        {/* Payroll Run Card */}
        <div className="mt-5 bg-white rounded-xl border border-[#e0e5ef] p-5 shadow-sm card-hover">
          <h3 className="text-[13px] font-bold text-[#1a1d2e] mb-4 pb-3 border-b border-[#f0f2f7]">
            🚀 Run Payroll — June 2026
          </h3>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <div className="text-[11px] text-[#8898aa] font-medium">Pay Period</div>
              <div className="text-[13px] font-semibold text-[#1a1d2e] mt-0.5">1 Jun – 30 Jun 2026</div>
            </div>
            <div>
              <div className="text-[11px] text-[#8898aa] font-medium">Total Employees</div>
              <div className="text-[13px] font-semibold text-[#1a1d2e] mt-0.5">248 active</div>
            </div>
            <div>
              <div className="text-[11px] text-[#8898aa] font-medium">Est. Gross Payout</div>
              <div className="text-[13px] font-semibold text-[#22a06b] mt-0.5">₹42,60,000</div>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="bg-[#22a06b] text-white px-4 py-2 rounded-lg text-[12px] font-semibold hover:bg-[#1a8f5c] transition-colors">
              ▶ Run Payroll
            </button>
            <button className="bg-white border border-[#e0e5ef] px-4 py-2 rounded-lg text-[12px] text-[#555] hover:bg-[#f4f6fb] transition-colors">
              Preview Report
            </button>
            <button className="bg-white border border-[#e0e5ef] px-4 py-2 rounded-lg text-[12px] text-[#555] hover:bg-[#f4f6fb] transition-colors">
              Download Template
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
