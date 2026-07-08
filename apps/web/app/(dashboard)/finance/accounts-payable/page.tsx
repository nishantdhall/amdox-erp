'use client'
import { usePathname } from 'next/navigation'
import { SubNav } from '@/components/sub-nav'
import { Badge } from '@/components/badge'
import { DataTable } from '@/components/data-table'
import { KpiCard } from '@/components/kpi-card'
import { accountsPayable } from '@/lib/mock-data'

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
  Paid: 'success',
  Pending: 'warning',
  Overdue: 'danger',
}

export default function AccountsPayablePage() {
  const pathname = usePathname()

  const columns = [
    { key: 'id', label: 'Bill ID', render: (v: string) => <span className="font-mono font-semibold text-[#1a1d2e]">{v}</span> },
    { key: 'vendor', label: 'Vendor' },
    { key: 'invoiceNo', label: 'Invoice No', render: (v: string) => <span className="font-mono text-[#8898aa]">{v}</span> },
    { key: 'amount', label: 'Amount', render: (v: string) => <span className="font-semibold">{v}</span> },
    { key: 'dueDate', label: 'Due Date' },
    { key: 'matched', label: '3-Way Match', render: (v: boolean) => (
      v ? <span className="text-[#22a06b] font-semibold text-[11px]">✓ Matched</span>
        : <span className="text-[#e5484d] font-semibold text-[11px]">✗ Unmatched</span>
    )},
    { key: 'status', label: 'Status', render: (v: string) => <Badge variant={statusMap[v] || 'info'}>{v}</Badge> },
  ]

  return (
    <div className="flex gap-4 animate-fade-in">
      <SubNav items={financeNavItems} title="Finance" icon="💰" currentPath={pathname} />

      <div className="flex-1 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5">
          <h2 className="text-lg font-bold text-[#1a1d2e]">Accounts Payable — Vendor Bills</h2>
          <div className="flex gap-2 mt-2 sm:mt-0">
            <button className="bg-[#4f6ef7] text-white px-4 py-2 rounded-lg text-[12px] font-semibold hover:bg-[#3d5bd9] transition-colors">+ New Bill</button>
            <button className="bg-white border border-[#e0e5ef] px-4 py-2 rounded-lg text-[12px] text-[#555] hover:bg-[#f4f6fb] transition-colors">Upload Invoice</button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          <KpiCard icon="💳" label="Total Outstanding" value="₹7,27,500" change="4 pending bills" changeColor="#e6820a" delay={0} />
          <KpiCard icon="⚠️" label="Overdue Bills" value="1" change="₹45,000 overdue" changeColor="#e5484d" delay={100} />
          <KpiCard icon="⏱" label="Avg Payment Time" value="18 days" change="Target: <30 days ✓" changeColor="#22a06b" delay={200} />
        </div>

        <DataTable columns={columns} data={accountsPayable} title="Vendor Bills" />

        {/* OCR Upload Zone */}
        <div className="mt-4 border-2 border-dashed border-[#4f6ef7]/30 rounded-xl p-8 text-center bg-[#f8f9ff] hover:bg-[#f0f3ff] transition-colors cursor-pointer">
          <div className="text-3xl mb-2">📄</div>
          <div className="text-sm text-[#4f6ef7] font-medium">Drop vendor invoice PDF here for OCR processing</div>
          <div className="text-[11px] text-[#8898aa] mt-1">95%+ extraction accuracy • Auto 3-way matching</div>
        </div>
      </div>
    </div>
  )
}
