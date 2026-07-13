'use client'
import { RBACGuard } from "@/components/rbac-guard"
import { useState } from 'react'
import { orgSettings } from '@/lib/mock-data'

export default function SettingsPage() {
  const [form, setForm] = useState(orgSettings)
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const inputClass = "w-full px-3 py-2.5 border border-[#e0e5ef] rounded-lg text-sm text-[#1a1d2e] focus:outline-none focus:border-[#4f6ef7] focus:ring-1 focus:ring-[#4f6ef7]/20 bg-white transition-all"
  const labelClass = "block text-[11px] font-semibold text-[#555] mb-1.5 uppercase tracking-wider"

  return (
    <RBACGuard module="settings">
    <div className="animate-fade-in max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-[#1a1d2e]">Organization Settings</h2>
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="bg-[#4f6ef7] text-white px-5 py-2 rounded-lg text-[12px] font-semibold hover:bg-[#3d5bd9] transition-colors"
          >
            {saved ? '✓ Saved!' : 'Save Changes'}
          </button>
          <button
            onClick={() => setForm(orgSettings)}
            className="bg-white border border-[#e0e5ef] px-4 py-2 rounded-lg text-[12px] text-[#555] hover:bg-[#f4f6fb] transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      {saved && (
        <div className="mb-4 bg-[#e6f9f0] border border-[#22a06b]/20 text-[#22a06b] px-4 py-2.5 rounded-lg text-sm font-medium animate-slide-up">
          ✓ Settings saved successfully!
        </div>
      )}

      {/* Organization Info */}
      <div className="bg-white rounded-xl border border-[#e0e5ef] p-5 shadow-sm mb-5">
        <h3 className="text-[13px] font-bold text-[#1a1d2e] mb-4 pb-3 border-b border-[#f0f2f7]">Company Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Company Name</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Industry</label>
            <select value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} className={inputClass}>
              <option>Information Technology</option>
              <option>Manufacturing</option>
              <option>Retail</option>
              <option>Healthcare</option>
              <option>Finance</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className={labelClass}>Address</label>
            <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={2} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Phone</label>
            <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Tax ID (PAN)</label>
            <input type="text" value={form.taxId} onChange={(e) => setForm({ ...form, taxId: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>GST Number</label>
            <input type="text" value={form.gstNumber} onChange={(e) => setForm({ ...form, gstNumber: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Currency</label>
            <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className={inputClass}>
              <option>INR (₹)</option>
              <option>USD ($)</option>
              <option>EUR (€)</option>
              <option>GBP (£)</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Financial Year Start</label>
            <select value={form.financialYearStart} onChange={(e) => setForm({ ...form, financialYearStart: e.target.value })} className={inputClass}>
              {['January','February','March','April','May','June','July','August','September','October','November','December'].map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Users & Roles */}
      <div className="bg-white rounded-xl border border-[#e0e5ef] p-5 shadow-sm mb-5">
        <h3 className="text-[13px] font-bold text-[#1a1d2e] mb-4 pb-3 border-b border-[#f0f2f7]">Users & Roles</h3>
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#f0f2f7]">
              {['User', 'Email', 'Role', 'Status'].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left text-[10px] uppercase tracking-wider font-semibold text-[#8898aa] bg-[#f7f8fb]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              { name: 'Nishant Dhall', email: 'nishant@amdox.com', role: 'Admin', status: 'Active' },
              { name: 'Priya Sharma', email: 'priya@amdox.com', role: 'Manager', status: 'Active' },
              { name: 'Rahul Kumar', email: 'rahul@amdox.com', role: 'Viewer', status: 'Active' },
            ].map((u) => (
              <tr key={u.email} className="border-b border-[#f7f8fb] table-row-hover">
                <td className="px-4 py-3 text-[12px] font-medium text-[#1a1d2e]">{u.name}</td>
                <td className="px-4 py-3 text-[12px] text-[#8898aa]">{u.email}</td>
                <td className="px-4 py-3 text-[12px]">
                  <span className="bg-[#e8edff] text-[#4f6ef7] px-2 py-0.5 rounded-full text-[10px] font-semibold">{u.role}</span>
                </td>
                <td className="px-4 py-3 text-[12px]">
                  <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-semibold">{u.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Notification Preferences */}
      <div className="bg-white rounded-xl border border-[#e0e5ef] p-5 shadow-sm">
        <h3 className="text-[13px] font-bold text-[#1a1d2e] mb-4 pb-3 border-b border-[#f0f2f7]">Notification Preferences</h3>
        <div className="space-y-3">
          {[
            { label: 'Email Notifications', desc: 'Receive alerts via email', on: true },
            { label: 'SMS Notifications', desc: 'Get SMS for critical alerts', on: false },
            { label: 'In-App Notifications', desc: 'Show notifications in the app', on: true },
            { label: 'Webhook Notifications', desc: 'Forward events to external services', on: false },
          ].map((n) => (
            <div key={n.label} className="flex items-center justify-between py-2">
              <div>
                <div className="text-[13px] font-medium text-[#1a1d2e]">{n.label}</div>
                <div className="text-[11px] text-[#8898aa]">{n.desc}</div>
              </div>
              <button
                className={`w-11 h-6 rounded-full transition-colors relative ${
                  n.on ? 'bg-[#4f6ef7]' : 'bg-[#e0e5ef]'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full shadow absolute top-0.5 transition-all ${
                    n.on ? 'left-[22px]' : 'left-0.5'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
    </RBACGuard>
  )
}

