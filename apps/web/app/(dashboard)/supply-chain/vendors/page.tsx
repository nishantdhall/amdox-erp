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

const vendors = [
  { id: 'V-001', name: 'TechParts India', contact: 'Rajesh Mehta', email: 'rajesh@techparts.in', phone: '+91 98765-43210', rating: 4.8, orders: 24, status: 'Active' },
  { id: 'V-002', name: 'OfficeHub Delhi', contact: 'Sanjay Verma', email: 'sanjay@officehub.com', phone: '+91 98765-11111', rating: 4.5, orders: 18, status: 'Active' },
  { id: 'V-003', name: 'Digital World', contact: 'Amit Shah', email: 'amit@digitalworld.in', phone: '+91 98765-22222', rating: 3.9, orders: 7, status: 'Active' },
  { id: 'V-004', name: 'MegaSupply Co.', contact: 'Deepak Sharma', email: 'deepak@megasupply.com', phone: '+91 98765-33333', rating: 4.2, orders: 31, status: 'Active' },
  { id: 'V-005', name: 'CloudServe Inc.', contact: 'Neha Gupta', email: 'neha@cloudserve.io', phone: '+91 98765-44444', rating: 4.7, orders: 12, status: 'Inactive' },
]

export default function VendorsPage() {
  const pathname = usePathname()

  return (
    <div className="flex gap-4 animate-fade-in">
      <SubNav items={supplyNavItems} title="Supply Chain" icon="📦" currentPath={pathname} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-[#1a1d2e]">Vendor Directory</h2>
          <button className="bg-[#4f6ef7] text-white px-4 py-2 rounded-lg text-[12px] font-semibold hover:bg-[#3d5bd9] transition-colors">+ Add Vendor</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vendors.map((v) => (
            <div key={v.id} className="bg-white rounded-xl border border-[#e0e5ef] p-4 shadow-sm card-hover">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="text-[13px] font-bold text-[#1a1d2e]">{v.name}</h4>
                  <div className="text-[11px] text-[#8898aa] mt-0.5">{v.contact}</div>
                </div>
                <Badge variant={v.status === 'Active' ? 'success' : 'danger'}>{v.status}</Badge>
              </div>
              <div className="space-y-1.5 text-[11px] text-[#555]">
                <div>📧 {v.email}</div>
                <div>📞 {v.phone}</div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#f0f2f7]">
                <div className="text-[11px]">
                  <span className="text-[#f59e0b]">{'★'.repeat(Math.floor(v.rating))}</span>
                  <span className="text-[#8898aa] ml-1">{v.rating}</span>
                </div>
                <div className="text-[10px] text-[#8898aa]">{v.orders} orders</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
