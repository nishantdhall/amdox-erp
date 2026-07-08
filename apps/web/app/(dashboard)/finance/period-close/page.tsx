'use client'
import { usePathname } from 'next/navigation'
import { SubNav } from '@/components/sub-nav'
import { Badge } from '@/components/badge'

const financeNavItems = [
  { label: 'General Ledger', href: '/finance' },
  { label: 'Accounts Payable', href: '/finance/accounts-payable' },
  { label: 'Accounts Receivable', href: '/finance/accounts-receivable' },
  { label: 'Multi-Currency', href: '/finance/multi-currency' },
  { label: 'Period Close', href: '/finance/period-close' },
  { label: 'Reports', href: '/finance/reports' },
  { label: 'Tax Settings', href: '/finance/tax-settings' },
]

const steps = [
  { step: 1, name: 'Review Unposted Entries', desc: 'All journal entries must be posted', status: 'Done', icon: '✅' },
  { step: 2, name: 'Reconcile Bank Statements', desc: 'Match all bank transactions', status: 'Done', icon: '✅' },
  { step: 3, name: 'Run Depreciation', desc: 'Calculate fixed asset depreciation', status: 'Done', icon: '✅' },
  { step: 4, name: 'FX Revaluation', desc: 'Revalue open foreign currency items', status: 'In Progress', icon: '🔄' },
  { step: 5, name: 'Accrue Expenses', desc: 'Post accrual entries for period', status: 'Pending', icon: '⏳' },
  { step: 6, name: 'Generate Trial Balance', desc: 'Verify DR = CR across all accounts', status: 'Pending', icon: '⏳' },
  { step: 7, name: 'Lock Period', desc: 'Prevent further entries in this period', status: 'Pending', icon: '🔒' },
]

const statusMap: Record<string, 'success' | 'warning' | 'info'> = { Done: 'success', 'In Progress': 'warning', Pending: 'info' }

export default function PeriodClosePage() {
  const pathname = usePathname()
  const completedSteps = steps.filter(s => s.status === 'Done').length

  return (
    <div className="flex gap-4 animate-fade-in">
      <SubNav items={financeNavItems} title="Finance" icon="💰" currentPath={pathname} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-[#1a1d2e]">Period Close — June 2026</h2>
            <p className="text-[11px] text-[#8898aa] mt-0.5">{completedSteps} of {steps.length} steps completed</p>
          </div>
          <button className="bg-[#e5484d] text-white px-4 py-2 rounded-lg text-[12px] font-semibold hover:bg-[#d13438] transition-colors">🔒 Lock Period</button>
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-xl border border-[#e0e5ef] p-4 shadow-sm mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-[#555]">Close Progress</span>
            <span className="text-[11px] font-bold text-[#4f6ef7]">{Math.round((completedSteps / steps.length) * 100)}%</span>
          </div>
          <div className="w-full bg-[#e0e5ef] rounded-full h-2.5">
            <div className="bg-gradient-to-r from-[#4f6ef7] to-[#22a06b] h-2.5 rounded-full transition-all" style={{ width: `${(completedSteps / steps.length) * 100}%` }} />
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-3">
          {steps.map((s) => (
            <div key={s.step} className={`bg-white rounded-xl border p-4 shadow-sm flex items-center gap-4 card-hover ${
              s.status === 'In Progress' ? 'border-[#4f6ef7] ring-1 ring-[#4f6ef7]/10' : 'border-[#e0e5ef]'
            }`}>
              <div className="text-xl">{s.icon}</div>
              <div className="flex-1">
                <div className="text-[13px] font-semibold text-[#1a1d2e]">Step {s.step}: {s.name}</div>
                <div className="text-[11px] text-[#8898aa] mt-0.5">{s.desc}</div>
              </div>
              <Badge variant={statusMap[s.status]}>{s.status}</Badge>
              {s.status === 'In Progress' && (
                <button className="bg-[#4f6ef7] text-white px-3 py-1.5 rounded-lg text-[10px] font-semibold">Continue →</button>
              )}
              {s.status === 'Pending' && (
                <button className="bg-white border border-[#e0e5ef] px-3 py-1.5 rounded-lg text-[10px] text-[#8898aa]" disabled>Locked</button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
