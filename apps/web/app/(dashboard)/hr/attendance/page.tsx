'use client'
import { usePathname } from 'next/navigation'
import { SubNav } from '@/components/sub-nav'
import { Badge } from '@/components/badge'
import { useState } from 'react'

const hrNavItems = [
  { label: 'Employees', href: '/hr' },
  { label: 'Attendance', href: '/hr/attendance' },
  { label: 'Leave Mgmt', href: '/hr/leave' },
  { label: 'Run Payroll', href: '/hr/payroll' },
  { label: 'Org Chart', href: '/hr/org-chart' },
  { label: 'Compliance', href: '/hr/compliance' },
  { label: 'Payslips', href: '/hr/payslips' },
]

const mockAttendance = [
  { name: 'Nishant Dhall', date: '08 Jul', checkIn: '09:15 AM', checkOut: '06:30 PM', hours: '9h 15m', status: 'Present' },
  { name: 'Priya Sharma', date: '08 Jul', checkIn: '09:02 AM', checkOut: '06:00 PM', hours: '8h 58m', status: 'Present' },
  { name: 'Rahul Kumar', date: '08 Jul', checkIn: '10:30 AM', checkOut: '—', hours: '—', status: 'Late' },
  { name: 'Anita Singh', date: '08 Jul', checkIn: '—', checkOut: '—', hours: '—', status: 'On Leave' },
  { name: 'Vikram Patel', date: '08 Jul', checkIn: '08:55 AM', checkOut: '07:00 PM', hours: '10h 05m', status: 'Present' },
  { name: 'Sneha Gupta', date: '08 Jul', checkIn: '09:30 AM', checkOut: '05:45 PM', hours: '8h 15m', status: 'Present' },
  { name: 'Arjun Reddy', date: '08 Jul', checkIn: '—', checkOut: '—', hours: '—', status: 'Absent' },
]

const statusMap: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
  Present: 'success', Late: 'warning', 'On Leave': 'info', Absent: 'danger',
}

export default function AttendancePage() {
  const pathname = usePathname()
  const [selectedDate, setSelectedDate] = useState('2026-07-08')

  return (
    <div className="flex gap-4 animate-fade-in">
      <SubNav items={hrNavItems} title="HR & Payroll" icon="👥" currentPath={pathname} />
      <div className="flex-1 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5">
          <h2 className="text-lg font-bold text-[#1a1d2e]">Attendance Tracker</h2>
          <div className="flex gap-2 mt-2 sm:mt-0">
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-[#e0e5ef] rounded-lg text-[12px] bg-white focus:outline-none focus:border-[#4f6ef7]" />
            <button className="bg-[#22a06b] text-white px-4 py-2 rounded-lg text-[12px] font-semibold hover:bg-[#1a8f5c] transition-colors">
              📥 Export CSV
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-3 mb-5">
          {[
            { label: 'Present', value: '4', color: '#22a06b', bg: '#e6f9f0' },
            { label: 'Late', value: '1', color: '#e6820a', bg: '#fff8e6' },
            { label: 'On Leave', value: '1', color: '#4f6ef7', bg: '#e8edff' },
            { label: 'Absent', value: '1', color: '#e5484d', bg: '#ffebe9' },
          ].map((s) => (
            <div key={s.label} className="rounded-xl p-3 text-center border" style={{ backgroundColor: s.bg, borderColor: `${s.color}20` }}>
              <div className="text-xl font-bold" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: s.color }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Attendance Table */}
        <div className="bg-white rounded-xl border border-[#e0e5ef] overflow-hidden shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#f0f2f7]">
                {['Employee', 'Date', 'Check In', 'Check Out', 'Total Hours', 'Status'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-[10px] uppercase tracking-wider font-semibold text-[#8898aa] bg-[#f7f8fb]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mockAttendance.map((r, i) => (
                <tr key={i} className="border-b border-[#f7f8fb] table-row-hover">
                  <td className="px-5 py-3 text-[12px] font-semibold text-[#1a1d2e]">{r.name}</td>
                  <td className="px-5 py-3 text-[12px] text-[#555]">{r.date}</td>
                  <td className="px-5 py-3 text-[12px] text-[#555] font-mono">{r.checkIn}</td>
                  <td className="px-5 py-3 text-[12px] text-[#555] font-mono">{r.checkOut}</td>
                  <td className="px-5 py-3 text-[12px] font-medium text-[#1a1d2e]">{r.hours}</td>
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
