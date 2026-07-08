'use client'
import { usePathname } from 'next/navigation'
import { SubNav } from '@/components/sub-nav'
import { Badge } from '@/components/badge'
import { DataTable } from '@/components/data-table'
import { KpiCard } from '@/components/kpi-card'
import { payrollRecords } from '@/lib/mock-data'

const hrNavItems = [
  { label: 'Employees', href: '/hr' },
  { label: 'Attendance', href: '/hr/attendance' },
  { label: 'Leave Mgmt', href: '/hr/leave' },
  { label: 'Run Payroll', href: '/hr/payroll' },
  { label: 'Org Chart', href: '/hr/org-chart' },
  { label: 'Compliance', href: '/hr/compliance' },
  { label: 'Payslips', href: '/hr/payslips' },
]

export default function PayrollPage() {
  const pathname = usePathname()

  const columns = [
    { key: 'employee', label: 'Employee', render: (v: string) => <span className="font-semibold text-[#1a1d2e]">{v}</span> },
    { key: 'month', label: 'Month' },
    { key: 'basic', label: 'Basic' },
    { key: 'allowances', label: 'Allowances', render: (v: string) => <span className="text-[#22a06b]">+{v}</span> },
    { key: 'deductions', label: 'Deductions', render: (v: string) => <span className="text-[#e5484d]">-{v}</span> },
    { key: 'tax', label: 'Tax', render: (v: string) => <span className="text-[#e5484d]">-{v}</span> },
    { key: 'net', label: 'Net Salary', render: (v: string) => <span className="font-bold text-[#22a06b]">{v}</span> },
    { key: 'status', label: 'Status', render: (v: string) => (
      <Badge variant={v === 'Processed' ? 'success' : 'warning'}>{v}</Badge>
    )},
  ]

  return (
    <div className="flex gap-4 animate-fade-in">
      <SubNav items={hrNavItems} title="HR & Payroll" icon="👥" currentPath={pathname} />

      <div className="flex-1 min-w-0">
        <h2 className="text-lg font-bold text-[#1a1d2e] mb-5">Payroll Processing — June 2026</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          <KpiCard icon="💰" label="Total Payroll" value="₹42,60,000" change="248 employees" changeColor="#4f6ef7" delay={0} />
          <KpiCard icon="📊" label="Avg Salary" value="₹52,000" change="per employee/month" changeColor="#8898aa" delay={100} />
          <KpiCard icon="🏛" label="Tax Deducted" value="₹8,40,000" change="TDS + PF + ESI" changeColor="#e6820a" delay={200} />
        </div>

        {/* Payroll Run */}
        <div className="bg-white rounded-xl border border-[#e0e5ef] p-5 shadow-sm mb-5">
          <h3 className="text-[13px] font-bold text-[#1a1d2e] mb-4">Configure Payroll Run</h3>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-[11px] text-[#8898aa] font-medium block mb-1">Pay Month</label>
              <input type="month" defaultValue="2026-06" className="w-full px-3 py-2 border border-[#e0e5ef] rounded-lg text-sm bg-white focus:outline-none focus:border-[#4f6ef7]" />
            </div>
            <div>
              <label className="text-[11px] text-[#8898aa] font-medium block mb-1">Employees</label>
              <div className="px-3 py-2 border border-[#e0e5ef] rounded-lg text-sm bg-[#f7f8fb] text-[#1a1d2e] font-medium">248 active</div>
            </div>
            <div className="flex items-end">
              <button className="bg-[#22a06b] text-white px-6 py-2 rounded-lg text-[12px] font-semibold hover:bg-[#1a8f5c] transition-colors w-full">
                ▶ Run Payroll
              </button>
            </div>
          </div>
        </div>

        <DataTable columns={columns} data={payrollRecords} title="Payroll History" />
      </div>
    </div>
  )
}
