'use client'
import { usePathname } from 'next/navigation'
import { SubNav } from '@/components/sub-nav'

const financeNavItems = [
  { label: 'General Ledger', href: '/finance' },
  { label: 'Accounts Payable', href: '/finance/accounts-payable' },
  { label: 'Accounts Receivable', href: '/finance/accounts-receivable' },
  { label: 'Multi-Currency', href: '/finance/multi-currency' },
  { label: 'Period Close', href: '/finance/period-close' },
  { label: 'Reports', href: '/finance/reports' },
  { label: 'Tax Settings', href: '/finance/tax-settings' },
]

const reports = [
  { name: 'Trial Balance', desc: 'Verify DR = CR across all accounts', icon: '📊', format: 'PDF / XLSX', lastGen: '01 Jul 2026' },
  { name: 'Profit & Loss (P&L)', desc: 'Revenue, expenses, and net income', icon: '💰', format: 'PDF / XLSX', lastGen: '01 Jul 2026' },
  { name: 'Balance Sheet', desc: 'Assets, liabilities, and equity snapshot', icon: '📋', format: 'PDF / XLSX', lastGen: '01 Jul 2026' },
  { name: 'Cash Flow Statement', desc: 'Operating, investing, financing activities', icon: '💸', format: 'PDF / XLSX', lastGen: '01 Jul 2026' },
  { name: 'Accounts Aging Report', desc: 'Outstanding AR/AP by aging buckets', icon: '📅', format: 'PDF / XLSX', lastGen: '05 Jul 2026' },
  { name: 'Tax Summary (GST)', desc: 'IGST, CGST, SGST breakdowns', icon: '🏛', format: 'PDF / JSON', lastGen: '01 Jul 2026' },
  { name: 'Budget vs Actual', desc: 'Department-wise variance analysis', icon: '📈', format: 'PDF / XLSX', lastGen: '01 Jul 2026' },
  { name: 'Audit Trail', desc: 'Complete log of all financial changes', icon: '🔍', format: 'PDF / CSV', lastGen: '08 Jul 2026' },
]

export default function ReportsPage() {
  const pathname = usePathname()

  return (
    <div className="flex gap-4 animate-fade-in">
      <SubNav items={financeNavItems} title="Finance" icon="💰" currentPath={pathname} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-[#1a1d2e]">Financial Reports</h2>
          <div className="flex gap-2">
            <select className="px-3 py-2 border border-[#e0e5ef] rounded-lg text-[12px] bg-white focus:outline-none focus:border-[#4f6ef7]">
              <option>FY 2026-27</option>
              <option>FY 2025-26</option>
            </select>
            <select className="px-3 py-2 border border-[#e0e5ef] rounded-lg text-[12px] bg-white focus:outline-none focus:border-[#4f6ef7]">
              <option>Q1 (Apr-Jun)</option>
              <option>Q2 (Jul-Sep)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reports.map((r) => (
            <div key={r.name} className="bg-white rounded-xl border border-[#e0e5ef] p-4 shadow-sm card-hover flex items-start gap-4">
              <div className="text-2xl mt-0.5">{r.icon}</div>
              <div className="flex-1 min-w-0">
                <h4 className="text-[13px] font-bold text-[#1a1d2e]">{r.name}</h4>
                <p className="text-[11px] text-[#8898aa] mt-0.5">{r.desc}</p>
                <div className="flex items-center gap-3 mt-2 text-[10px] text-[#8898aa]">
                  <span>📄 {r.format}</span>
                  <span>•</span>
                  <span>Last: {r.lastGen}</span>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <button className="bg-[#4f6ef7] text-white px-3 py-1.5 rounded text-[10px] font-semibold hover:bg-[#3d5bd9] transition-colors whitespace-nowrap">
                  ⬇ Generate
                </button>
                <button className="bg-white border border-[#e0e5ef] px-3 py-1.5 rounded text-[10px] text-[#555] hover:bg-[#f4f6fb] transition-colors whitespace-nowrap">
                  📅 Schedule
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
