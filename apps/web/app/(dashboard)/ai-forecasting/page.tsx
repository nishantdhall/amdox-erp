'use client'
import { KpiCard } from '@/components/kpi-card'
import { Badge } from '@/components/badge'
import { forecastKpis, forecastChartData } from '@/lib/mock-data'

export default function AIForecastingPage() {
  const allValues = [...forecastChartData.historicalValues, ...forecastChartData.predictedValues]
  const maxVal = Math.max(...allValues)

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5">
        <h2 className="text-lg font-bold text-[#1a1d2e]">🤖 AI Demand Forecasting</h2>
        <div className="flex gap-2 mt-2 sm:mt-0">
          <select className="px-3 py-2 border border-[#e0e5ef] rounded-lg text-[12px] bg-white focus:outline-none focus:border-[#4f6ef7] min-w-[200px]">
            <option>SKU-441 — Laptop Stand Pro</option>
            <option>SKU-228 — USB-C Hub 7-Port</option>
            <option>SKU-119 — Wireless Mouse</option>
          </select>
          <button className="bg-[#4f6ef7] text-white px-4 py-2 rounded-lg text-[12px] font-semibold hover:bg-[#3d5bd9] transition-colors">▶ Predict</button>
          <button className="bg-white border border-[#e0e5ef] px-4 py-2 rounded-lg text-[12px] text-[#555] hover:bg-[#f4f6fb] transition-colors">🔄 Retrain</button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {forecastKpis.map((kpi, i) => (
          <KpiCard key={kpi.label} {...kpi} delay={i * 100} />
        ))}
      </div>

      {/* Forecast Chart */}
      <div className="bg-white rounded-xl border border-[#e0e5ef] p-5 shadow-sm mb-5">
        <h3 className="text-[13px] font-bold text-[#1a1d2e] mb-4 pb-3 border-b border-[#f0f2f7]">
          Demand Forecast — SKU-441 (Gray = Actual | Blue = AI Predicted)
        </h3>
        <div className="flex items-end gap-1.5 h-[180px] px-4 pb-8 relative">
          {/* Historical bars */}
          {forecastChartData.historicalValues.map((val, i) => (
            <div key={`h-${i}`} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full bg-[#cdd5e3] rounded-t animate-bar hover:bg-[#b0bcd4] transition-colors cursor-pointer"
                style={{ height: `${(val / maxVal) * 150}px`, animationDelay: `${i * 80}ms` }}
              />
              <div className="text-[9px] text-[#8898aa] mt-1">{forecastChartData.historicalLabels[i]}</div>
            </div>
          ))}

          {/* Divider */}
          <div className="w-[2px] bg-[#f59e0b] self-stretch mx-2 rounded-full opacity-60" />

          {/* Predicted bars */}
          {forecastChartData.predictedValues.map((val, i) => (
            <div key={`p-${i}`} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full bg-[#4f6ef7] rounded-t animate-bar hover:bg-[#3d5bd9] transition-colors cursor-pointer"
                style={{ height: `${(val / maxVal) * 150}px`, animationDelay: `${(i + 4) * 80}ms` }}
              />
              <div className="text-[9px] text-[#8898aa] mt-1">{forecastChartData.predictedLabels[i]}</div>
            </div>
          ))}
        </div>
        <div className="text-center text-[10px] text-[#8898aa] mt-2">
          ← Historical sales | Prediction → (dashed line = confidence interval)
        </div>
      </div>

      {/* Model Pipeline + API Endpoints */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pipeline */}
        <div className="bg-white rounded-xl border border-[#e0e5ef] p-5 shadow-sm">
          <h3 className="text-[13px] font-bold text-[#1a1d2e] mb-4 pb-3 border-b border-[#f0f2f7]">Model Pipeline</h3>
          <div className="space-y-3">
            {[
              'PostgreSQL se last 2 years ka sales data fetch',
              'Prophet model seasonal trends identify karta hai',
              'LSTM neural net short-term spikes predict karta hai',
              'Results Redis mein cache → NestJS ko forward',
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#4f6ef7] text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                  {i + 1}
                </div>
                <div className="text-[12px] text-[#555] leading-relaxed">{step}</div>
              </div>
            ))}
          </div>
        </div>

        {/* API Endpoints */}
        <div className="bg-white rounded-xl border border-[#e0e5ef] p-5 shadow-sm">
          <h3 className="text-[13px] font-bold text-[#1a1d2e] mb-4 pb-3 border-b border-[#f0f2f7]">API Endpoints (Python FastAPI)</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-[12px]">
              <Badge variant="info">POST</Badge>
              <code className="text-[#555] bg-[#f7f8fb] px-2 py-0.5 rounded font-mono text-[11px]">/train</code>
              <span className="text-[#8898aa]">— model retrain</span>
            </div>
            <div className="flex items-center gap-3 text-[12px]">
              <Badge variant="success">GET</Badge>
              <code className="text-[#555] bg-[#f7f8fb] px-2 py-0.5 rounded font-mono text-[11px]">/predict/{'{sku}'}</code>
              <span className="text-[#8898aa]">— get forecast</span>
            </div>
            <div className="flex items-center gap-3 text-[12px]">
              <Badge variant="success">GET</Badge>
              <code className="text-[#555] bg-[#f7f8fb] px-2 py-0.5 rounded font-mono text-[11px]">/health</code>
              <span className="text-[#8898aa]">— service alive?</span>
            </div>
            <div className="mt-4 pt-3 border-t border-[#f0f2f7] text-[10px] text-[#8898aa]">
              Every Sunday auto-retrain via BullMQ cron job
            </div>
          </div>
        </div>
      </div>

      {/* Info note */}
      <div className="mt-4 bg-[#eef3ff] border-l-[3px] border-[#4f6ef7] px-4 py-3 rounded-r-lg text-[11px] text-[#2d4aa8] leading-relaxed">
        <strong className="text-[#1e3489]">MAPE = 8.6%:</strong> Our model is 91.4% accurate. Project requirement was &lt;12% — we&apos;re beating the target!
      </div>
    </div>
  )
}
