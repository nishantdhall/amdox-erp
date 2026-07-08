'use client'
import { usePathname } from 'next/navigation'
import { SubNav } from '@/components/sub-nav'
import { Badge } from '@/components/badge'
import { KpiCard } from '@/components/kpi-card'
import { inventoryItems } from '@/lib/mock-data'

const supplyNavItems = [
  { label: 'Purchase Orders', href: '/supply-chain/purchase-orders' },
  { label: 'Inventory', href: '/supply-chain' },
  { label: 'Vendors', href: '/supply-chain/vendors' },
  { label: 'Goods Receipt', href: '/supply-chain/goods-receipt' },
  { label: 'Reorder Rules', href: '/supply-chain/reorder-rules' },
  { label: 'Vendor Portal', href: '/supply-chain/vendor-portal' },
]

const statusBadge: Record<string, { variant: 'success' | 'warning' | 'danger'; label: string }> = {
  OK: { variant: 'success', label: 'OK' },
  WATCH: { variant: 'warning', label: 'WATCH' },
  LOW: { variant: 'danger', label: '⚠ LOW' },
}

export default function SupplyChainPage() {
  const pathname = usePathname()

  return (
    <div className="flex gap-4 animate-fade-in">
      <SubNav items={supplyNavItems} title="Supply Chain" icon="📦" currentPath={pathname} />

      <div className="flex-1 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5">
          <h2 className="text-lg font-bold text-[#1a1d2e]">Inventory — Real-Time Stock Levels</h2>
          <button className="mt-2 sm:mt-0 bg-[#4f6ef7] text-white px-4 py-2 rounded-lg text-[12px] font-semibold hover:bg-[#3d5bd9] transition-colors">
            + Add SKU
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          <KpiCard icon="📦" label="Total SKUs" value="1,284" change="Across 4 warehouses" changeColor="#4f6ef7" delay={0} />
          <KpiCard icon="⚠️" label="Low Stock Alerts" value="12" change="Immediate action needed" changeColor="#e5484d" delay={100} />
          <KpiCard icon="✅" label="Auto POs Today" value="3" change="Generated automatically" changeColor="#22a06b" delay={200} />
        </div>

        {/* Inventory Table */}
        <div className="bg-white rounded-xl border border-[#e0e5ef] overflow-hidden shadow-sm">
          <div className="px-5 py-3.5 border-b border-[#f0f2f7]">
            <h3 className="text-[13px] font-bold text-[#1a1d2e]">Stock Levels</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#f0f2f7]">
                {['SKU', 'Product', 'In Stock', 'Reorder At', 'Status', 'Action'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-[10px] uppercase tracking-wider font-semibold text-[#8898aa] bg-[#f7f8fb]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {inventoryItems.map((item) => (
                <tr key={item.sku} className="border-b border-[#f7f8fb] table-row-hover">
                  <td className="px-5 py-3 text-[12px] font-mono font-semibold text-[#1a1d2e]">{item.sku}</td>
                  <td className="px-5 py-3 text-[12px] text-[#444]">{item.product}</td>
                  <td className={`px-5 py-3 text-[12px] font-bold ${
                    item.status === 'LOW' ? 'text-[#e5484d]' : item.status === 'WATCH' ? 'text-[#e6820a]' : 'text-[#444]'
                  }`}>
                    {item.inStock} units
                  </td>
                  <td className="px-5 py-3 text-[12px] text-[#8898aa]">{item.reorderAt} units</td>
                  <td className="px-5 py-3">
                    <Badge variant={statusBadge[item.status].variant}>{statusBadge[item.status].label}</Badge>
                  </td>
                  <td className="px-5 py-3">
                    {item.status !== 'OK' ? (
                      <button className="bg-[#4f6ef7] text-white px-3 py-1 rounded text-[10px] font-semibold hover:bg-[#3d5bd9] transition-colors">
                        Create PO
                      </button>
                    ) : (
                      <button className="bg-white border border-[#e0e5ef] px-3 py-1 rounded text-[10px] text-[#555] hover:bg-[#f4f6fb] transition-colors">
                        View
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Auto-reorder note */}
        <div className="mt-4 bg-[#fffceb] border-l-[3px] border-[#f59e0b] px-4 py-3 rounded-r-lg text-[11px] text-[#92651a] leading-relaxed">
          <strong className="text-[#78500a]">Auto-reorder:</strong> When stock ≤ threshold → System drafts PO → Vendor email sent → Finance 3-way match (PO ↔ GR ↔ Invoice) → GL entry auto-posted.
        </div>
      </div>
    </div>
  )
}
