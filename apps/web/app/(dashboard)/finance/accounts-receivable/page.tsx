'use client'
import { usePathname } from 'next/navigation'
import { SubNav } from '@/components/sub-nav'
import { Badge } from '@/components/badge'
import { DataTable } from '@/components/data-table'
import { KpiCard } from '@/components/kpi-card'
import { accountsReceivable } from '@/lib/mock-data'

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

export default function AccountsReceivablePage() {
  const pathname = usePathname()

  const columns = [
    { key: 'id', label: 'AR ID', render: (v: string) => <span className="font-mono font-semibold text-[#1a1d2e]">{v}</span> },
    { key: 'customer', label: 'Customer', render: (v: string) => <span className="font-medium">{v}</span> },
    { key: 'invoiceNo', label: 'Invoice No', render: (v: string) => <span className="font-mono text-[#8898aa]">{v}</span> },
    { key: 'amount', label: 'Amount', render: (v: string) => <span className="font-semibold">{v}</span> },
    { key: 'dueDate', label: 'Due Date' },
    { key: 'aging', label: 'Aging', render: (v: string) => <span className={v !== '—' ? 'text-[#e6820a] font-medium' : 'text-[#ccc]'}>{v}</span> },
    { key: 'status', label: 'Status', render: (v: string) => <Badge variant={statusMap[v] || 'info'}>{v}</Badge> },
  ]

  return (
    <div className="flex gap-4 animate-fade-in">
      <SubNav items={financeNavItems} title="Finance" icon="💰" currentPath={pathname} />
      <div className="flex-1 min-w-0">
        <h2 className="text-lg font-bold text-[#1a1d2e] mb-5">Accounts Receivable — Client Invoices</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          <KpiCard icon="💰" label="Total Receivable" value="₹12,60,000" change="4 invoices outstanding" changeColor="#4f6ef7" delay={0} />
          <KpiCard icon="⚠️" label="Overdue Amount" value="₹2,30,000" change="1 invoice overdue" changeColor="#e5484d" delay={100} />
          <KpiCard icon="📅" label="Avg Collection" value="22 days" change="Target: <30 days ✓" changeColor="#22a06b" delay={200} />
        </div>

        <DataTable columns={columns} data={accountsReceivable} title="Client Invoices" />
      </div>
    </div>
  )
}
