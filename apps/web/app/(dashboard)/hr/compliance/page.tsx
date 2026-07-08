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

const complianceItems = [
  { rule: 'PF Registration', authority: 'EPFO', status: 'Compliant', due: '—', risk: 'low' },
  { rule: 'ESI Registration', authority: 'ESIC', status: 'Compliant', due: '—', risk: 'low' },
  { rule: 'Professional Tax', authority: 'State Govt.', status: 'Due Soon', due: '15 Jul 2026', risk: 'medium' },
  { rule: 'TDS Filing (24Q)', authority: 'Income Tax', status: 'Compliant', due: '31 Jul 2026', risk: 'low' },
  { rule: 'Gratuity Policy', authority: 'Ministry of Labour', status: 'Compliant', due: '—', risk: 'low' },
  { rule: 'Labour Welfare Fund', authority: 'State Govt.', status: 'Action Required', due: '30 Jun 2026', risk: 'high' },
  { rule: 'Sexual Harassment Policy', authority: 'POSH Act', status: 'Compliant', due: '—', risk: 'low' },
]

const riskMap: Record<string, 'success' | 'warning' | 'danger'> = { low: 'success', medium: 'warning', high: 'danger' }
const statusMap: Record<string, 'success' | 'warning' | 'danger'> = { Compliant: 'success', 'Due Soon': 'warning', 'Action Required': 'danger' }

export default function CompliancePage() {
  const pathname = usePathname()

  return (
    <div className="flex gap-4 animate-fade-in">
      <SubNav items={hrNavItems} title="HR & Payroll" icon="👥" currentPath={pathname} />
      <div className="flex-1 min-w-0">
        <h2 className="text-lg font-bold text-[#1a1d2e] mb-5">Compliance & Statutory</h2>

        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-[#e6f9f0] rounded-xl p-4 text-center border border-[#22a06b]/20">
            <div className="text-2xl font-bold text-[#22a06b]">5</div>
            <div className="text-[10px] font-semibold text-[#22a06b] uppercase">Compliant</div>
          </div>
          <div className="bg-[#fff8e6] rounded-xl p-4 text-center border border-[#f59e0b]/20">
            <div className="text-2xl font-bold text-[#e6820a]">1</div>
            <div className="text-[10px] font-semibold text-[#e6820a] uppercase">Due Soon</div>
          </div>
          <div className="bg-[#ffebe9] rounded-xl p-4 text-center border border-[#e5484d]/20">
            <div className="text-2xl font-bold text-[#e5484d]">1</div>
            <div className="text-[10px] font-semibold text-[#e5484d] uppercase">Action Required</div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#e0e5ef] overflow-hidden shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#f0f2f7]">
                {['Rule', 'Authority', 'Status', 'Due Date', 'Risk'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-[10px] uppercase tracking-wider font-semibold text-[#8898aa] bg-[#f7f8fb]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {complianceItems.map((item, i) => (
                <tr key={i} className="border-b border-[#f7f8fb] table-row-hover">
                  <td className="px-5 py-3 text-[12px] font-semibold text-[#1a1d2e]">{item.rule}</td>
                  <td className="px-5 py-3 text-[12px] text-[#555]">{item.authority}</td>
                  <td className="px-5 py-3"><Badge variant={statusMap[item.status]}>{item.status}</Badge></td>
                  <td className="px-5 py-3 text-[12px] text-[#555]">{item.due}</td>
                  <td className="px-5 py-3"><Badge variant={riskMap[item.risk]}>{item.risk.toUpperCase()}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
