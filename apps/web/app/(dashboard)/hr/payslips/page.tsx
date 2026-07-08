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

const payslips = [
  { employee: 'Nishant Dhall', month: 'Jun 2026', gross: '₹30,000', deductions: '₹4,500', net: '₹25,500', generated: true },
  { employee: 'Priya Sharma', month: 'Jun 2026', gross: '₹77,000', deductions: '₹11,500', net: '₹65,500', generated: true },
  { employee: 'Rahul Kumar', month: 'Jun 2026', gross: '₹95,000', deductions: '₹16,000', net: '₹79,000', generated: true },
  { employee: 'Vikram Patel', month: 'Jun 2026', gross: '₹1,40,000', deductions: '₹22,000', net: '₹1,18,000', generated: false },
  { employee: 'Sneha Gupta', month: 'Jun 2026', gross: '₹1,05,000', deductions: '₹16,000', net: '₹89,000', generated: false },
]

export default function PayslipsPage() {
  const pathname = usePathname()

  return (
    <div className="flex gap-4 animate-fade-in">
      <SubNav items={hrNavItems} title="HR & Payroll" icon="👥" currentPath={pathname} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-[#1a1d2e]">Payslips — June 2026</h2>
          <div className="flex gap-2">
            <select className="px-3 py-2 border border-[#e0e5ef] rounded-lg text-[12px] bg-white focus:outline-none focus:border-[#4f6ef7]">
              <option>June 2026</option>
              <option>May 2026</option>
              <option>April 2026</option>
            </select>
            <button className="bg-[#4f6ef7] text-white px-4 py-2 rounded-lg text-[12px] font-semibold hover:bg-[#3d5bd9] transition-colors">
              📄 Generate All
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#e0e5ef] overflow-hidden shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#f0f2f7]">
                {['Employee', 'Month', 'Gross', 'Deductions', 'Net Pay', 'Status', 'Action'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-[10px] uppercase tracking-wider font-semibold text-[#8898aa] bg-[#f7f8fb]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payslips.map((p, i) => (
                <tr key={i} className="border-b border-[#f7f8fb] table-row-hover">
                  <td className="px-5 py-3 text-[12px] font-semibold text-[#1a1d2e]">{p.employee}</td>
                  <td className="px-5 py-3 text-[12px] text-[#555]">{p.month}</td>
                  <td className="px-5 py-3 text-[12px] font-medium">{p.gross}</td>
                  <td className="px-5 py-3 text-[12px] text-[#e5484d]">-{p.deductions}</td>
                  <td className="px-5 py-3 text-[12px] font-bold text-[#22a06b]">{p.net}</td>
                  <td className="px-5 py-3">
                    <Badge variant={p.generated ? 'success' : 'warning'}>{p.generated ? 'Generated' : 'Pending'}</Badge>
                  </td>
                  <td className="px-5 py-3">
                    {p.generated ? (
                      <button className="bg-white border border-[#e0e5ef] px-3 py-1 rounded text-[10px] text-[#555] hover:bg-[#f4f6fb] transition-colors">
                        ⬇ Download
                      </button>
                    ) : (
                      <button className="bg-[#4f6ef7] text-white px-3 py-1 rounded text-[10px] font-semibold hover:bg-[#3d5bd9] transition-colors">
                        Generate
                      </button>
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
