'use client'

const regionData = [
  { label: 'North', value: 55, color: '#4f6ef7' },
  { label: 'South', value: 38, color: '#22a06b' },
  { label: 'East', value: 68, color: '#4f6ef7' },
  { label: 'West', value: 44, color: '#22a06b' },
  { label: 'Export', value: 50, color: '#4f6ef7' },
]

const deptData = [
  { label: 'Engineering', pct: 35, color: '#4f6ef7' },
  { label: 'Finance', pct: 20, color: '#22a06b' },
  { label: 'HR', pct: 15, color: '#f59e0b' },
  { label: 'Supply', pct: 18, color: '#e5484d' },
  { label: 'Marketing', pct: 12, color: '#a78bfa' },
]

export default function AnalyticsPage() {
  const maxRegion = Math.max(...regionData.map((d) => d.value))

  const conicGradient = deptData.reduce((acc, d, i) => {
    const prevPct = deptData.slice(0, i).reduce((s, x) => s + x.pct, 0)
    return `${acc}${i > 0 ? ', ' : ''}${d.color} ${prevPct}% ${prevPct + d.pct}%`
  }, '')

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5">
        <h2 className="text-lg font-bold text-[#1a1d2e]">📈 Dashboard Builder — CEO View</h2>
        <div className="flex gap-2 mt-2 sm:mt-0 flex-wrap">
          <button className="bg-white border border-[#e0e5ef] px-3 py-2 rounded-lg text-[12px] text-[#555] hover:bg-[#f4f6fb] transition-colors">+ Widget</button>
          <button className="bg-white border border-[#e0e5ef] px-3 py-2 rounded-lg text-[12px] text-[#555] hover:bg-[#f4f6fb] transition-colors">📅 Schedule Report</button>
          <button className="bg-[#22a06b] text-white px-3 py-2 rounded-lg text-[12px] font-semibold hover:bg-[#1a8f5c] transition-colors">💾 Save</button>
          <button className="bg-white border border-[#e0e5ef] px-3 py-2 rounded-lg text-[12px] text-[#555] hover:bg-[#f4f6fb] transition-colors">⬇ Export PDF</button>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Revenue by Region */}
        <div className="bg-white rounded-xl border border-[#e0e5ef] p-5 shadow-sm card-hover">
          <h3 className="text-[13px] font-bold text-[#1a1d2e] mb-4 pb-3 border-b border-[#f0f2f7]">
            Revenue by Region (click bar = drill down)
          </h3>
          <div className="flex items-end gap-4 h-[160px] px-4 pb-8">
            {regionData.map((d, i) => (
              <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t animate-bar hover:opacity-80 transition-opacity cursor-pointer"
                  style={{
                    height: `${(d.value / maxRegion) * 130}px`,
                    backgroundColor: d.color,
                    opacity: i % 2 === 1 ? 0.7 : 1,
                    animationDelay: `${i * 100}ms`,
                  }}
                />
                <div className="text-[9px] text-[#8898aa] mt-1">{d.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Department Headcount */}
        <div className="bg-white rounded-xl border border-[#e0e5ef] p-5 shadow-sm card-hover">
          <h3 className="text-[13px] font-bold text-[#1a1d2e] mb-4 pb-3 border-b border-[#f0f2f7]">
            Department Headcount
          </h3>
          <div className="flex items-center justify-center gap-8">
            <div
              className="w-[140px] h-[140px] rounded-full"
              style={{ background: `conic-gradient(${conicGradient})` }}
            />
            <div className="space-y-2">
              {deptData.map((d) => (
                <div key={d.label} className="flex items-center gap-2 text-[11px]">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-[#555]">{d.label}</span>
                  <span className="text-[#8898aa] font-medium">{d.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mini Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <div className="bg-white rounded-xl border border-[#e0e5ef] p-4 shadow-sm card-hover">
          <h4 className="text-[11px] font-bold text-[#8898aa] mb-2 uppercase tracking-wider">Inventory Value (₹)</h4>
          <div className="text-xl font-bold text-[#1a1d2e]">₹24.5Cr</div>
          <div className="text-[11px] text-[#22a06b] mt-1">↑ 3.2% this month</div>
        </div>
        <div className="bg-white rounded-xl border border-[#e0e5ef] p-4 shadow-sm card-hover">
          <h4 className="text-[11px] font-bold text-[#8898aa] mb-2 uppercase tracking-wider">AI Forecast vs Actual</h4>
          <div className="text-xl font-bold text-[#22a06b]">91.4% ✓</div>
          <div className="text-[11px] text-[#8898aa] mt-1">Accuracy rate</div>
        </div>
        <div className="bg-white rounded-xl border border-[#e0e5ef] p-4 shadow-sm card-hover">
          <h4 className="text-[11px] font-bold text-[#8898aa] mb-2 uppercase tracking-wider">PO Approval Time (Avg)</h4>
          <div className="text-xl font-bold text-[#1a1d2e]">2.4 days</div>
          <div className="w-full bg-[#e0e5ef] rounded-full h-2 mt-2">
            <div className="bg-[#4f6ef7] h-2 rounded-full" style={{ width: '35%' }} />
          </div>
        </div>
      </div>

      {/* Widget Drop Zone */}
      <div className="border-2 border-dashed border-[#4f6ef7]/30 rounded-xl p-8 text-center hover:bg-[#4f6ef7]/5 transition-colors cursor-pointer">
        <div className="text-sm text-[#4f6ef7] font-medium">
          + Drag a widget here — Bar / Line / Pie / Table / KPI Card / Heatmap
        </div>
      </div>
    </div>
  )
}
