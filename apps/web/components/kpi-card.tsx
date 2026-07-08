'use client'
import { useEffect, useState } from 'react'

interface KpiCardProps {
  icon: string
  label: string
  value: string
  change: string
  changeColor?: string
  delay?: number
}

export function KpiCard({ icon, label, value, change, changeColor = '#22a06b', delay = 0 }: KpiCardProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  return (
    <div
      className={`bg-white rounded-xl border border-[#e0e5ef] p-4 shadow-sm card-hover relative overflow-hidden transition-all duration-500 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
      }`}
    >
      {/* Gradient accent */}
      <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-[#4f6ef7] to-[#a78bfa]" />

      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-[11px] text-[#8898aa] font-medium uppercase tracking-wide">{label}</div>
      <div className="text-2xl font-bold text-[#1a1d2e] mt-1">{value}</div>
      <div className="text-[11px] mt-1.5 font-medium" style={{ color: changeColor }}>
        {change}
      </div>
    </div>
  )
}
