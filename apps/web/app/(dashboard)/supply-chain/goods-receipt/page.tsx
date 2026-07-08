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

const receipts = [
  { grn: 'GRN-1042', po: 'PO-2891', vendor: 'TechParts India', date: '10 Jul 2026', items: 5, qcStatus: 'Passed', status: 'Completed' },
  { grn: 'GRN-1041', po: 'PO-2890', vendor: 'OfficeHub Delhi', date: '09 Jul 2026', items: 3, qcStatus: 'Passed', status: 'Completed' },
  { grn: 'GRN-1040', po: 'PO-2888', vendor: 'MegaSupply Co.', date: '07 Jul 2026', items: 8, qcStatus: 'Partial', status: 'Under QC' },
  { grn: 'GRN-1039', po: 'PO-2885', vendor: 'Digital World', date: '05 Jul 2026', items: 2, qcStatus: 'Failed', status: 'Rejected' },
]

const statusMap: Record<string, 'success' | 'warning' | 'danger' | 'info'> = { Completed: 'success', 'Under QC': 'warning', Rejected: 'danger' }
const qcMap: Record<string, 'success' | 'warning' | 'danger'> = { Passed: 'success', Partial: 'warning', Failed: 'danger' }

export default function GoodsReceiptPage() {
  const pathname = usePathname()

  return (
    <div className="flex gap-4 animate-fade-in">
      <SubNav items={supplyNavItems} title="Supply Chain" icon="📦" currentPath={pathname} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-[#1a1d2e]">Goods Receipt Notes</h2>
          <button className="bg-[#4f6ef7] text-white px-4 py-2 rounded-lg text-[12px] font-semibold hover:bg-[#3d5bd9] transition-colors">+ New GRN</button>
        </div>

        <div className="bg-white rounded-xl border border-[#e0e5ef] overflow-hidden shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#f0f2f7]">
                {['GRN #', 'PO Ref', 'Vendor', 'Date', 'Items', 'QC Status', 'Status'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-[10px] uppercase tracking-wider font-semibold text-[#8898aa] bg-[#f7f8fb]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {receipts.map((r, i) => (
                <tr key={i} className="border-b border-[#f7f8fb] table-row-hover">
                  <td className="px-5 py-3 text-[12px] font-mono font-semibold text-[#1a1d2e]">{r.grn}</td>
                  <td className="px-5 py-3 text-[12px] font-mono text-[#4f6ef7]">{r.po}</td>
                  <td className="px-5 py-3 text-[12px] text-[#555]">{r.vendor}</td>
                  <td className="px-5 py-3 text-[12px] text-[#555]">{r.date}</td>
                  <td className="px-5 py-3 text-[12px] font-medium text-[#1a1d2e]">{r.items}</td>
                  <td className="px-5 py-3"><Badge variant={qcMap[r.qcStatus]}>{r.qcStatus}</Badge></td>
                  <td className="px-5 py-3"><Badge variant={statusMap[r.status]}>{r.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
