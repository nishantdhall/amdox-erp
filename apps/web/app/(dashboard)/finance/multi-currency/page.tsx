'use client'
import { usePathname } from 'next/navigation'
import { SubNav } from '@/components/sub-nav'
import { Badge } from '@/components/badge'

const financeNavItems = [
  { label: 'General Ledger', href: '/finance' },
  { label: 'Accounts Payable', href: '/finance/accounts-payable' },
  { label: 'Accounts Receivable', href: '/finance/accounts-receivable' },
  { label: 'Multi-Currency', href: '/finance/multi-currency' },
  { label: 'Period Close', href: '/finance/period-close' },
  { label: 'Reports', href: '/finance/reports' },
  { label: 'Tax Settings', href: '/finance/tax-settings' },
]

const rates = [
  { from: 'USD', to: 'INR', rate: '83.42', change: '+0.15', updated: '08 Jul 10:00 AM' },
  { from: 'EUR', to: 'INR', rate: '90.81', change: '-0.23', updated: '08 Jul 10:00 AM' },
  { from: 'GBP', to: 'INR', rate: '105.67', change: '+0.41', updated: '08 Jul 10:00 AM' },
  { from: 'AED', to: 'INR', rate: '22.72', change: '+0.02', updated: '08 Jul 10:00 AM' },
  { from: 'SGD', to: 'INR', rate: '61.55', change: '-0.08', updated: '08 Jul 10:00 AM' },
]

const fxTransactions = [
  { id: 'FX-001', date: '05 Jul', from: 'USD 12,000', to: 'INR 10,01,040', rate: '83.42', gain: '+₹1,200', status: 'Settled' },
  { id: 'FX-002', date: '03 Jul', from: 'EUR 8,500', to: 'INR 7,71,885', rate: '90.81', gain: '-₹850', status: 'Settled' },
  { id: 'FX-003', date: '01 Jul', from: 'GBP 5,000', to: 'INR 5,28,350', rate: '105.67', gain: '+₹2,100', status: 'Pending' },
]

export default function MultiCurrencyPage() {
  const pathname = usePathname()

  return (
    <div className="flex gap-4 animate-fade-in">
      <SubNav items={financeNavItems} title="Finance" icon="💰" currentPath={pathname} />
      <div className="flex-1 min-w-0">
        <h2 className="text-lg font-bold text-[#1a1d2e] mb-5">Multi-Currency Management</h2>

        <div className="grid grid-cols-5 gap-3 mb-5">
          {rates.map((r) => (
            <div key={r.from} className="bg-white rounded-xl border border-[#e0e5ef] p-3 shadow-sm text-center card-hover">
              <div className="text-[10px] text-[#8898aa] font-semibold">{r.from}/INR</div>
              <div className="text-lg font-bold text-[#1a1d2e] mt-1">₹{r.rate}</div>
              <div className={`text-[10px] font-semibold mt-0.5 ${r.change.startsWith('+') ? 'text-[#22a06b]' : 'text-[#e5484d]'}`}>
                {r.change}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-[#e0e5ef] overflow-hidden shadow-sm mb-5">
          <div className="px-5 py-3.5 border-b border-[#f0f2f7] flex items-center justify-between">
            <h3 className="text-[13px] font-bold text-[#1a1d2e]">FX Transactions</h3>
            <button className="bg-[#4f6ef7] text-white px-3 py-1.5 rounded-lg text-[11px] font-semibold">+ Convert</button>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#f0f2f7]">
                {['ID', 'Date', 'From', 'To (INR)', 'Rate', 'Gain/Loss', 'Status'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-[10px] uppercase tracking-wider font-semibold text-[#8898aa] bg-[#f7f8fb]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {fxTransactions.map((t) => (
                <tr key={t.id} className="border-b border-[#f7f8fb] table-row-hover">
                  <td className="px-5 py-3 text-[12px] font-mono font-semibold text-[#1a1d2e]">{t.id}</td>
                  <td className="px-5 py-3 text-[12px] text-[#555]">{t.date}</td>
                  <td className="px-5 py-3 text-[12px] font-medium">{t.from}</td>
                  <td className="px-5 py-3 text-[12px] font-medium">{t.to}</td>
                  <td className="px-5 py-3 text-[12px] text-[#8898aa]">{t.rate}</td>
                  <td className={`px-5 py-3 text-[12px] font-semibold ${t.gain.startsWith('+') ? 'text-[#22a06b]' : 'text-[#e5484d]'}`}>{t.gain}</td>
                  <td className="px-5 py-3"><Badge variant={t.status === 'Settled' ? 'success' : 'warning'}>{t.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-[#eef3ff] border-l-[3px] border-[#4f6ef7] px-4 py-3 rounded-r-lg text-[11px] text-[#2d4aa8]">
          <strong>Auto Revaluation:</strong> Unrealized FX gains/losses are recalculated at each period close using closing exchange rates (IND AS 21).
        </div>
      </div>
    </div>
  )
}
