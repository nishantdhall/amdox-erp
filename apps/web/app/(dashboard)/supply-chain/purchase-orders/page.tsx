'use client'
import { usePathname } from 'next/navigation'
import { SubNav } from '@/components/sub-nav'
import { Badge } from '@/components/badge'
import { DataTable } from '@/components/data-table'
import { purchaseOrders } from '@/lib/mock-data'

const supplyNavItems = [
  { label: 'Purchase Orders', href: '/supply-chain/purchase-orders' },
  { label: 'Inventory', href: '/supply-chain' },
  { label: 'Vendors', href: '/supply-chain/vendors' },
  { label: 'Goods Receipt', href: '/supply-chain/goods-receipt' },
  { label: 'Reorder Rules', href: '/supply-chain/reorder-rules' },
  { label: 'Vendor Portal', href: '/supply-chain/vendor-portal' },
]

const statusMap: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
  Draft: 'info',
  Approved: 'success',
  Received: 'success',
  Cancelled: 'danger',
}

export default function PurchaseOrdersPage() {
  const pathname = usePathname()

  const columns = [
    { key: 'poNumber', label: 'PO Number', render: (v: string) => <span className="font-mono font-semibold text-[#1a1d2e]">{v}</span> },
    { key: 'supplier', label: 'Supplier', render: (v: string) => <span className="font-medium">{v}</span> },
    { key: 'date', label: 'Date' },
    { key: 'total', label: 'Total', render: (v: string) => <span className="font-semibold">{v}</span> },
    { key: 'status', label: 'Status', render: (v: string) => <Badge variant={statusMap[v] || 'info'}>{v}</Badge> },
  ]

  return (
    <div className="flex gap-4 animate-fade-in">
      <SubNav items={supplyNavItems} title="Supply Chain" icon="📦" currentPath={pathname} />
      <div className="flex-1 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5">
          <h2 className="text-lg font-bold text-[#1a1d2e]">Purchase Orders</h2>
          <div className="flex gap-2 mt-2 sm:mt-0">
            <button className="bg-[#4f6ef7] text-white px-4 py-2 rounded-lg text-[12px] font-semibold hover:bg-[#3d5bd9] transition-colors">+ New PO</button>
            <button className="bg-white border border-[#e0e5ef] px-4 py-2 rounded-lg text-[12px] text-[#555] hover:bg-[#f4f6fb] transition-colors">Export</button>
          </div>
        </div>

        <DataTable columns={columns} data={purchaseOrders} title="All Purchase Orders" />
      </div>
    </div>
  )
}
