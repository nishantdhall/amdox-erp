'use client'
import { usePathname } from 'next/navigation'
import { SubNav } from '@/components/sub-nav'
import { Badge } from '@/components/badge'
import { DataTable } from '@/components/data-table'
import { journalEntries } from '@/lib/mock-data'

const financeNavItems = [
  { label: 'General Ledger', href: '/finance' },
  { label: 'Accounts Payable', href: '/finance/accounts-payable' },
  { label: 'Accounts Receivable', href: '/finance/accounts-receivable' },
  { label: 'Multi-Currency', href: '/finance/multi-currency' },
  { label: 'Period Close', href: '/finance/period-close' },
  { label: 'Reports', href: '/finance/reports' },
  { label: 'Tax Settings', href: '/finance/tax-settings' },
]

const statusMap: Record<string, 'success' | 'warning' | 'danger'> = {
  Posted: 'success',
  Pending: 'warning',
  'On Hold': 'danger',
}

export default function FinancePage() {
  const pathname = usePathname()

  const columns = [
    { key: 'date', label: 'Date' },
    { key: 'account', label: 'Account', render: (v: string) => <span className="font-medium text-[#1a1d2e]">{v}</span> },
    { key: 'description', label: 'Description' },
    { key: 'debit', label: 'Debit (₹)', render: (v: string) => <span className={v !== '—' ? 'text-[#22a06b] font-semibold' : 'text-[#ccc]'}>{v}</span> },
    { key: 'credit', label: 'Credit (₹)', render: (v: string) => <span className={v !== '—' ? 'text-[#e5484d] font-semibold' : 'text-[#ccc]'}>{v}</span> },
    { key: 'status', label: 'Status', render: (v: string) => <Badge variant={statusMap[v] || 'info'}>{v}</Badge> },
  ]

  return (
    <div className="flex gap-4 animate-fade-in">
      <SubNav items={financeNavItems} title="Finance" icon="💰" currentPath={pathname} />

      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5">
          <h2 className="text-lg font-bold text-[#1a1d2e]">General Ledger — June 2026</h2>
          <div className="flex gap-2 mt-2 sm:mt-0">
            <button className="bg-[#4f6ef7] text-white px-4 py-2 rounded-lg text-[12px] font-semibold hover:bg-[#3d5bd9] transition-colors">
              + Journal Entry
            </button>
            <button className="bg-white border border-[#e0e5ef] px-4 py-2 rounded-lg text-[12px] text-[#555] hover:bg-[#f4f6fb] transition-colors">
              Export ↓
            </button>
          </div>
        </div>

        {/* KPI Summary */}
        <div className="grid grid-cols-2 gap-4 mb-5">
          <div className="bg-white rounded-xl border border-[#e0e5ef] p-4 shadow-sm">
            <div className="text-[11px] text-[#8898aa] font-medium">Total Debits (Jun)</div>
            <div className="text-xl font-bold text-[#22a06b] mt-1">₹1,24,50,000</div>
          </div>
          <div className="bg-white rounded-xl border border-[#e0e5ef] p-4 shadow-sm">
            <div className="text-[11px] text-[#8898aa] font-medium">Total Credits (Jun)</div>
            <div className="text-xl font-bold text-[#e5484d] mt-1">₹1,24,50,000</div>
          </div>
        </div>

        {/* Journal Entries Table */}
        <DataTable
          columns={columns}
          data={journalEntries}
          title="Journal Entries"
        />

        {/* Info Note */}
        <div className="mt-4 bg-[#fffceb] border-l-[3px] border-[#f59e0b] px-4 py-3 rounded-r-lg text-[11px] text-[#92651a] leading-relaxed">
          <strong className="text-[#78500a]">Double-Entry Rule:</strong> Every transaction must have equal Debit and Credit amounts. The system enforces zero unbalanced entries.
        </div>
      </div>
    </div>
  )
}
