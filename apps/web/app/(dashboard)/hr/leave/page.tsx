'use client'
import { usePathname } from 'next/navigation'
import { SubNav } from '@/components/sub-nav'
import { Badge } from '@/components/badge'

const hrNavItems = [
  { label: 'Employees', href: '/hr' },
  { label: 'Attendance', href: '/hr/attendance' },
  { label: 'Leave Mgmt', href: '/hr/leave' },
  { label: 'Run Payroll', href: '/hr/payroll' },
  { label: 'Org Chart', href: '/hr/org-chart' },
  { label: 'Compliance', href: '/hr/compliance' },
  { label: 'Payslips', href: '/hr/payslips' },
]

const leaveRequests = [
  { employee: 'Anita Singh', type: 'Casual Leave', from: '08 Jul', to: '10 Jul', days: 3, reason: 'Family function', status: 'Pending' },
  { employee: 'Nishant Dhall', type: 'Sick Leave', from: '01 Jul', to: '01 Jul', days: 1, reason: 'Fever', status: 'Approved' },
  { employee: 'Sneha Gupta', type: 'Earned Leave', from: '15 Jul', to: '22 Jul', days: 6, reason: 'Vacation', status: 'Pending' },
  { employee: 'Rahul Kumar', type: 'Casual Leave', from: '25 Jun', to: '26 Jun', days: 2, reason: 'Personal work', status: 'Approved' },
  { employee: 'Vikram Patel', type: 'Work From Home', from: '05 Jul', to: '05 Jul', days: 1, reason: 'Plumber visit', status: 'Approved' },
]

const statusMap: Record<string, 'success' | 'warning' | 'danger'> = { Approved: 'success', Pending: 'warning', Rejected: 'danger' }

export default function LeavePage() {
  const pathname = usePathname()

  return (
    <div className="flex gap-4 animate-fade-in">
      <SubNav items={hrNavItems} title="HR & Payroll" icon="👥" currentPath={pathname} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-[#1a1d2e]">Leave Management</h2>
          <button className="bg-[#4f6ef7] text-white px-4 py-2 rounded-lg text-[12px] font-semibold hover:bg-[#3d5bd9] transition-colors">+ Apply Leave</button>
        </div>

        {/* Leave Balance */}
        <div className="grid grid-cols-4 gap-3 mb-5">
          {[
            { type: 'Casual Leave', used: 4, total: 12 },
            { type: 'Sick Leave', used: 2, total: 10 },
            { type: 'Earned Leave', used: 0, total: 15 },
            { type: 'Work From Home', used: 3, total: 24 },
          ].map((l) => (
            <div key={l.type} className="bg-white rounded-xl border border-[#e0e5ef] p-4 shadow-sm">
              <div className="text-[11px] text-[#8898aa] font-medium">{l.type}</div>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl font-bold text-[#1a1d2e]">{l.total - l.used}</span>
                <span className="text-[11px] text-[#8898aa]">/ {l.total} remaining</span>
              </div>
              <div className="w-full bg-[#e0e5ef] rounded-full h-1.5 mt-2">
                <div className="bg-[#4f6ef7] h-1.5 rounded-full transition-all" style={{ width: `${(l.used / l.total) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>

        {/* Leave Requests Table */}
        <div className="bg-white rounded-xl border border-[#e0e5ef] overflow-hidden shadow-sm">
          <div className="px-5 py-3.5 border-b border-[#f0f2f7]">
            <h3 className="text-[13px] font-bold text-[#1a1d2e]">Recent Leave Requests</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#f0f2f7]">
                {['Employee', 'Type', 'From', 'To', 'Days', 'Reason', 'Status', 'Action'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-[10px] uppercase tracking-wider font-semibold text-[#8898aa] bg-[#f7f8fb]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leaveRequests.map((r, i) => (
                <tr key={i} className="border-b border-[#f7f8fb] table-row-hover">
                  <td className="px-5 py-3 text-[12px] font-semibold text-[#1a1d2e]">{r.employee}</td>
                  <td className="px-5 py-3 text-[12px] text-[#555]">{r.type}</td>
                  <td className="px-5 py-3 text-[12px] text-[#555]">{r.from}</td>
                  <td className="px-5 py-3 text-[12px] text-[#555]">{r.to}</td>
                  <td className="px-5 py-3 text-[12px] font-medium text-[#1a1d2e]">{r.days}</td>
                  <td className="px-5 py-3 text-[12px] text-[#8898aa]">{r.reason}</td>
                  <td className="px-5 py-3"><Badge variant={statusMap[r.status]}>{r.status}</Badge></td>
                  <td className="px-5 py-3">
                    {r.status === 'Pending' && (
                      <div className="flex gap-1">
                        <button className="bg-[#22a06b] text-white px-2 py-1 rounded text-[10px] font-semibold">✓</button>
                        <button className="bg-[#e5484d] text-white px-2 py-1 rounded text-[10px] font-semibold">✗</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
