'use client'
import { usePathname } from 'next/navigation'
import { SubNav } from '@/components/sub-nav'

const supplyNavItems = [
  { label: 'Purchase Orders', href: '/supply-chain/purchase-orders' },
  { label: 'Inventory', href: '/supply-chain' },
  { label: 'Vendors', href: '/supply-chain/vendors' },
  { label: 'Goods Receipt', href: '/supply-chain/goods-receipt' },
  { label: 'Reorder Rules', href: '/supply-chain/reorder-rules' },
  { label: 'Vendor Portal', href: '/supply-chain/vendor-portal' },
]

export default function VendorPortalPage() {
  const pathname = usePathname()

  return (
    <div className="flex gap-4 animate-fade-in">
      <SubNav items={supplyNavItems} title="Supply Chain" icon="📦" currentPath={pathname} />
      <div className="flex-1 min-w-0">
        <h2 className="text-lg font-bold text-[#1a1d2e] mb-5">Vendor Self-Service Portal</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          <div className="bg-white rounded-xl border border-[#e0e5ef] p-5 shadow-sm card-hover">
            <div className="text-2xl mb-3">📤</div>
            <h3 className="text-[13px] font-bold text-[#1a1d2e] mb-1">Invoice Upload</h3>
            <p className="text-[11px] text-[#8898aa] leading-relaxed">Vendors can upload invoices directly. OCR extracts data automatically and runs 3-way match.</p>
            <div className="mt-4 border-2 border-dashed border-[#4f6ef7]/20 rounded-lg p-4 text-center text-[11px] text-[#4f6ef7] cursor-pointer hover:bg-[#4f6ef7]/5 transition-colors">
              Drop invoice PDF here
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#e0e5ef] p-5 shadow-sm card-hover">
            <div className="text-2xl mb-3">📊</div>
            <h3 className="text-[13px] font-bold text-[#1a1d2e] mb-1">PO Status Tracking</h3>
            <p className="text-[11px] text-[#8898aa] leading-relaxed">Vendors can track order status, view delivery schedules, and confirm receipt.</p>
            <div className="mt-3 space-y-2">
              {['PO-2891 → Approved ✓', 'PO-2889 → Draft (pending)', 'PO-2888 → Received ✓'].map((po, i) => (
                <div key={i} className="text-[11px] text-[#555] bg-[#f7f8fb] px-3 py-2 rounded-lg">{po}</div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#e0e5ef] p-5 shadow-sm card-hover">
            <div className="text-2xl mb-3">💬</div>
            <h3 className="text-[13px] font-bold text-[#1a1d2e] mb-1">Communication Hub</h3>
            <p className="text-[11px] text-[#8898aa] leading-relaxed">Direct messaging between procurement team and vendors for quote requests and clarifications.</p>
          </div>

          <div className="bg-white rounded-xl border border-[#e0e5ef] p-5 shadow-sm card-hover">
            <div className="text-2xl mb-3">📋</div>
            <h3 className="text-[13px] font-bold text-[#1a1d2e] mb-1">RFQ Management</h3>
            <p className="text-[11px] text-[#8898aa] leading-relaxed">Vendors receive and respond to Request for Quotations. Compare quotes side-by-side.</p>
          </div>
        </div>

        <div className="bg-[#fffceb] border-l-[3px] border-[#f59e0b] px-4 py-3 rounded-r-lg text-[11px] text-[#92651a]">
          <strong>Portal Access:</strong> Vendors are given unique login credentials. All data is tenant-isolated and encrypted.
        </div>
      </div>
    </div>
  )
}
