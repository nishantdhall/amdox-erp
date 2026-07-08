'use client'
import { usePathname } from 'next/navigation'
import { SubNav } from '@/components/sub-nav'
import { Badge } from '@/components/badge'

const supplyNavItems = [
  { label: 'Purchase Orders', href: '/supply-chain/purchase-orders' },
  { label: 'Inventory', href: '/supply-chain' },
  { label: 'Vendors', href: '/supply-chain/vendors' },
  { label: 'Goods Receipt', href: '/supply-chain/goods-receipt' },
  { label: 'Reorder Rules', href: '/supply-chain/reorder-rules' },
  { label: 'Vendor Portal', href: '/supply-chain/vendor-portal' },
]

const rules = [
  { sku: 'SKU-441', product: 'Laptop Stand Pro', threshold: 50, orderQty: 100, vendor: 'TechParts India', enabled: true },
  { sku: 'SKU-228', product: 'USB-C Hub 7-Port', threshold: 30, orderQty: 80, vendor: 'Digital World', enabled: true },
  { sku: 'SKU-119', product: 'Wireless Mouse', threshold: 40, orderQty: 60, vendor: 'OfficeHub Delhi', enabled: true },
  { sku: 'SKU-088', product: 'Desk Organizer Set', threshold: 25, orderQty: 50, vendor: 'MegaSupply Co.', enabled: false },
  { sku: 'SKU-312', product: 'Monitor Arm Dual', threshold: 20, orderQty: 30, vendor: 'TechParts India', enabled: true },
  { sku: 'SKU-567', product: 'Keyboard Mechanical', threshold: 30, orderQty: 50, vendor: 'Digital World', enabled: true },
]

export default function ReorderRulesPage() {
  const pathname = usePathname()

  return (
    <div className="flex gap-4 animate-fade-in">
      <SubNav items={supplyNavItems} title="Supply Chain" icon="📦" currentPath={pathname} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-[#1a1d2e]">Reorder Rules (Auto-PO)</h2>
          <button className="bg-[#4f6ef7] text-white px-4 py-2 rounded-lg text-[12px] font-semibold hover:bg-[#3d5bd9] transition-colors">+ Add Rule</button>
        </div>

        <div className="bg-[#eef3ff] border-l-[3px] border-[#4f6ef7] px-4 py-3 rounded-r-lg text-[11px] text-[#2d4aa8] mb-5">
          <strong>How it works:</strong> When stock ≤ threshold, system auto-creates a PO draft → sends vendor email → awaits 3-way match.
        </div>

        <div className="bg-white rounded-xl border border-[#e0e5ef] overflow-hidden shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#f0f2f7]">
                {['SKU', 'Product', 'Threshold', 'Order Qty', 'Preferred Vendor', 'Enabled'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-[10px] uppercase tracking-wider font-semibold text-[#8898aa] bg-[#f7f8fb]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rules.map((r, i) => (
                <tr key={i} className="border-b border-[#f7f8fb] table-row-hover">
                  <td className="px-5 py-3 text-[12px] font-mono font-semibold text-[#1a1d2e]">{r.sku}</td>
                  <td className="px-5 py-3 text-[12px] text-[#555]">{r.product}</td>
                  <td className="px-5 py-3 text-[12px] font-medium text-[#e5484d]">≤ {r.threshold} units</td>
                  <td className="px-5 py-3 text-[12px] font-medium text-[#22a06b]">{r.orderQty} units</td>
                  <td className="px-5 py-3 text-[12px] text-[#555]">{r.vendor}</td>
                  <td className="px-5 py-3">
                    <div className={`w-9 h-5 rounded-full relative cursor-pointer transition-colors ${r.enabled ? 'bg-[#4f6ef7]' : 'bg-[#e0e5ef]'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full shadow absolute top-0.5 transition-all ${r.enabled ? 'left-[18px]' : 'left-0.5'}`} />
                    </div>
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
