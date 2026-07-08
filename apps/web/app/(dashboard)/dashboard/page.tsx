'use client'
import { KpiCard } from '@/components/kpi-card'
import { Badge } from '@/components/badge'
import { dashboardKpis, dashboardAlerts, revenueChartData } from '@/lib/mock-data'

export default function DashboardPage() {
  const maxVal = Math.max(...revenueChartData.values)

  return (
    <div className="animate-fade-in">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#1a1d2e]">Good morning, Nishant 👋</h1>
          <p className="text-sm text-[#8898aa] mt-0.5">July 2026 &nbsp;•&nbsp; Q3 Summary</p>
        </div>
        <div className="flex gap-2 mt-3 sm:mt-0">
          <button className="bg-[#4f6ef7] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#3d5bd9] transition-colors shadow-sm">
            + New
          </button>
          <button className="bg-white border border-[#e0e5ef] px-3 py-2 rounded-lg text-sm hover:bg-[#f4f6fb] transition-colors relative">
            🔔 <span className="ml-1 text-[#1a1d2e] font-semibold">3</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {dashboardKpis.map((kpi, i) => (
          <KpiCard key={kpi.label} {...kpi} delay={i * 100} />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue Chart */}
        <div className="bg-white rounded-xl border border-[#e0e5ef] p-5 shadow-sm card-hover">
          <h3 className="text-[13px] font-bold text-[#1a1d2e] mb-4">Revenue — Last 6 Months</h3>
          <div className="flex items-end gap-3 h-[200px] px-2 pb-8 relative">
            {revenueChartData.values.map((val, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="text-[10px] text-[#8898aa] font-medium">
                  {val >= 100 ? `₹${(val / 100).toFixed(1)}Cr` : `₹${val}L`}
                </div>
                <div
                  className={`w-full rounded-t-md animate-bar transition-all hover:opacity-80 cursor-pointer ${
                    i === revenueChartData.values.length - 1 ? 'bg-[#22a06b]' : 'bg-[#4f6ef7]'
                  }`}
                  style={{
                    height: `${(val / maxVal) * 150}px`,
                    animationDelay: `${i * 100}ms`,
                  }}
                />
                <div className="text-[10px] text-[#8898aa] mt-1">{revenueChartData.labels[i]}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Alerts */}
        <div className="bg-white rounded-xl border border-[#e0e5ef] p-5 shadow-sm card-hover">
          <h3 className="text-[13px] font-bold text-[#1a1d2e] mb-4">⚠️ Alerts (Live)</h3>
          <div className="space-y-3">
            {dashboardAlerts.map((alert, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-lg bg-[#f7f8fb] hover:bg-[#f0f2f7] transition-colors cursor-pointer"
              >
                <Badge variant={alert.type}>{alert.label}</Badge>
                <span className="text-[12px] text-[#444]">{alert.message}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
