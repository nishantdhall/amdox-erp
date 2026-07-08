'use client'
import { usePathname } from 'next/navigation'
import { SubNav } from '@/components/sub-nav'
import { useState } from 'react'

const financeNavItems = [
  { label: 'General Ledger', href: '/finance' },
  { label: 'Accounts Payable', href: '/finance/accounts-payable' },
  { label: 'Accounts Receivable', href: '/finance/accounts-receivable' },
  { label: 'Multi-Currency', href: '/finance/multi-currency' },
  { label: 'Period Close', href: '/finance/period-close' },
  { label: 'Reports', href: '/finance/reports' },
  { label: 'Tax Settings', href: '/finance/tax-settings' },
]

const taxSlabs = [
  { category: 'Standard Goods', hsnRange: '1001-9999', cgst: '9%', sgst: '9%', igst: '18%', total: '18%' },
  { category: 'Essential Goods', hsnRange: '0201-0210', cgst: '2.5%', sgst: '2.5%', igst: '5%', total: '5%' },
  { category: 'Luxury / Sin Goods', hsnRange: '2401-2403', cgst: '14%', sgst: '14%', igst: '28%', total: '28%' },
  { category: 'Exempt / Zero Rated', hsnRange: '0101-0199', cgst: '0%', sgst: '0%', igst: '0%', total: '0%' },
  { category: 'IT Services (SAC)', hsnRange: '998311-998399', cgst: '9%', sgst: '9%', igst: '18%', total: '18%' },
]

export default function TaxSettingsPage() {
  const pathname = usePathname()
  const [gstNo, setGstNo] = useState('07AABCT1234D1Z5')
  const [pan, setPan] = useState('AABCT1234D')

  return (
    <div className="flex gap-4 animate-fade-in">
      <SubNav items={financeNavItems} title="Finance" icon="💰" currentPath={pathname} />
      <div className="flex-1 min-w-0">
        <h2 className="text-lg font-bold text-[#1a1d2e] mb-5">Tax Settings (GST)</h2>

        {/* Registration Info */}
        <div className="bg-white rounded-xl border border-[#e0e5ef] p-5 shadow-sm mb-5">
          <h3 className="text-[13px] font-bold text-[#1a1d2e] mb-4 pb-3 border-b border-[#f0f2f7]">GST Registration</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-[#555] mb-1.5 uppercase tracking-wider">GSTIN</label>
              <input type="text" value={gstNo} onChange={(e) => setGstNo(e.target.value)}
                className="w-full px-3 py-2.5 border border-[#e0e5ef] rounded-lg text-sm font-mono focus:outline-none focus:border-[#4f6ef7] bg-white" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#555] mb-1.5 uppercase tracking-wider">PAN</label>
              <input type="text" value={pan} onChange={(e) => setPan(e.target.value)}
                className="w-full px-3 py-2.5 border border-[#e0e5ef] rounded-lg text-sm font-mono focus:outline-none focus:border-[#4f6ef7] bg-white" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#555] mb-1.5 uppercase tracking-wider">Filing Frequency</label>
              <select className="w-full px-3 py-2.5 border border-[#e0e5ef] rounded-lg text-sm focus:outline-none focus:border-[#4f6ef7] bg-white">
                <option>Monthly (GSTR-1, GSTR-3B)</option>
                <option>Quarterly (QRMP Scheme)</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#555] mb-1.5 uppercase tracking-wider">State</label>
              <select className="w-full px-3 py-2.5 border border-[#e0e5ef] rounded-lg text-sm focus:outline-none focus:border-[#4f6ef7] bg-white">
                <option>07 - Delhi</option>
                <option>09 - Uttar Pradesh</option>
                <option>06 - Haryana</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tax Slabs */}
        <div className="bg-white rounded-xl border border-[#e0e5ef] overflow-hidden shadow-sm mb-5">
          <div className="px-5 py-3.5 border-b border-[#f0f2f7] flex items-center justify-between">
            <h3 className="text-[13px] font-bold text-[#1a1d2e]">GST Rate Configuration</h3>
            <button className="bg-[#4f6ef7] text-white px-3 py-1.5 rounded-lg text-[10px] font-semibold">+ Add Slab</button>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#f0f2f7]">
                {['Category', 'HSN/SAC Range', 'CGST', 'SGST', 'IGST', 'Effective Rate'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-[10px] uppercase tracking-wider font-semibold text-[#8898aa] bg-[#f7f8fb]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {taxSlabs.map((t, i) => (
                <tr key={i} className="border-b border-[#f7f8fb] table-row-hover">
                  <td className="px-5 py-3 text-[12px] font-semibold text-[#1a1d2e]">{t.category}</td>
                  <td className="px-5 py-3 text-[12px] font-mono text-[#8898aa]">{t.hsnRange}</td>
                  <td className="px-5 py-3 text-[12px]">{t.cgst}</td>
                  <td className="px-5 py-3 text-[12px]">{t.sgst}</td>
                  <td className="px-5 py-3 text-[12px]">{t.igst}</td>
                  <td className="px-5 py-3 text-[12px] font-bold text-[#4f6ef7]">{t.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex gap-2">
          <button className="bg-[#4f6ef7] text-white px-5 py-2 rounded-lg text-[12px] font-semibold hover:bg-[#3d5bd9] transition-colors">Save Settings</button>
          <button className="bg-white border border-[#e0e5ef] px-4 py-2 rounded-lg text-[12px] text-[#555] hover:bg-[#f4f6fb] transition-colors">Reset</button>
        </div>
      </div>
    </div>
  )
}
