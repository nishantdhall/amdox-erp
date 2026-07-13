"use client"
import { useState } from "react"
import { RBACGuard } from "@/components/rbac-guard"

const AVAILABLE_WIDGETS = [
  { id: "revenue-region", title: "Revenue by Region", type: "bar" },
  { id: "dept-headcount", title: "Department Headcount", type: "pie" },
  { id: "inventory-value", title: "Inventory Value", type: "kpi" },
  { id: "ai-accuracy", title: "AI Forecast Accuracy", type: "kpi" },
  { id: "po-approval", title: "PO Approval Time", type: "kpi" },
  { id: "payroll-trend", title: "Payroll Trend", type: "bar" },
  { id: "leave-summary", title: "Leave Summary", type: "pie" },
]

const REGIONS = ["North","South","East","West","Export"]
const REGION_DATA = [42,28,51,35,44]
const DEPT_DATA = [
  { name: "Engineering", pct: 35, color: "#3b82f6" },
  { name: "Finance", pct: 20, color: "#22c55e" },
  { name: "HR", pct: 15, color: "#f59e0b" },
  { name: "Supply", pct: 18, color: "#ef4444" },
  { name: "Marketing", pct: 12, color: "#a855f7" },
]

export default function AnalyticsPage() {
  const [widgets, setWidgets] = useState(["revenue-region","dept-headcount","inventory-value","ai-accuracy","po-approval"])
  const [dragOver, setDragOver] = useState(false)
  const [dragWidget, setDragWidget] = useState<string|null>(null)
  const [saved, setSaved] = useState(false)
  const [scheduled, setScheduled] = useState(false)
  const maxRev = Math.max(...REGION_DATA)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const widgetId = e.dataTransfer.getData("widgetId") || dragWidget
    if (widgetId && !widgets.includes(widgetId)) {
      setWidgets(prev => [...prev, widgetId])
    }
    setDragOver(false)
    setDragWidget(null)
  }

  const removeWidget = (id: string) => setWidgets(prev => prev.filter(w => w !== id))

  const handleExportPDF = () => {
    alert("📄 Exporting Dashboard as PDF...\n\nIn production this would generate a PDF with:\n• All current widgets\n• CEO View timestamp\n• Company branding")
  }

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000) }
  const handleSchedule = () => { setScheduled(true); setTimeout(() => setScheduled(false), 3000) }

  const renderWidget = (id: string) => {
    const widget = AVAILABLE_WIDGETS.find(w => w.id === id)
    if (!widget) return null

    return (
      <div key={id} className="bg-white rounded-xl border p-5 relative group">
        <button onClick={() => removeWidget(id)}
          className="absolute top-3 right-3 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity text-lg">×</button>
        <h3 className="font-semibold text-gray-900 mb-4">{widget.title}</h3>

        {id === "revenue-region" && (
          <div className="flex items-end gap-3 h-32">
            {REGIONS.map((r, i) => (
              <div key={r} className="flex-1 flex flex-col items-center gap-1">
                <div className={`w-full rounded-t ${i % 2 === 0 ? "bg-blue-500" : "bg-green-400"}`}
                  style={{ height: `${(REGION_DATA[i]/maxRev)*100}%` }} />
                <span className="text-xs text-gray-500">{r}</span>
              </div>
            ))}
          </div>
        )}

        {id === "dept-headcount" && (
          <div className="flex gap-4 items-center">
            <svg viewBox="0 0 32 32" className="w-24 h-24">
              {DEPT_DATA.reduce((acc, d, i) => {
                const startAngle = acc.angle
                const angle = (d.pct / 100) * 360
                const endAngle = startAngle + angle
                const x1 = 16 + 14 * Math.cos((startAngle * Math.PI) / 180)
                const y1 = 16 + 14 * Math.sin((startAngle * Math.PI) / 180)
                const x2 = 16 + 14 * Math.cos((endAngle * Math.PI) / 180)
                const y2 = 16 + 14 * Math.sin((endAngle * Math.PI) / 180)
                const largeArc = angle > 180 ? 1 : 0
                acc.paths.push(
                  <path key={i} d={`M 16 16 L ${x1} ${y1} A 14 14 0 ${largeArc} 1 ${x2} ${y2} Z`} fill={d.color} />
                )
                acc.angle = endAngle
                return acc
              }, { angle: -90, paths: [] as any[] }).paths}
            </svg>
            <div className="space-y-1">
              {DEPT_DATA.map(d => (
                <div key={d.name} className="flex items-center gap-2 text-xs">
                  <span className="w-3 h-3 rounded-full" style={{ background: d.color }} />
                  <span className="text-gray-600">{d.name} {d.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {id === "inventory-value" && (
          <div>
            <p className="text-2xl font-bold text-gray-900">₹24.5Cr</p>
            <p className="text-xs text-green-500 mt-1">↑ 3.2% this month</p>
          </div>
        )}

        {id === "ai-accuracy" && (
          <div>
            <p className="text-2xl font-bold text-green-600">91.4% ✓</p>
            <p className="text-xs text-gray-400 mt-1">Accuracy rate</p>
          </div>
        )}

        {id === "po-approval" && (
          <div>
            <p className="text-2xl font-bold text-gray-900">2.4 days</p>
            <div className="mt-2 h-2 bg-gray-100 rounded-full">
              <div className="h-2 bg-blue-500 rounded-full" style={{ width: "40%" }} />
            </div>
          </div>
        )}

        {id === "payroll-trend" && (
          <div className="flex items-end gap-2 h-24">
            {[38,40,41,39,42,43].map((v, i) => (
              <div key={i} className="flex-1 bg-purple-400 rounded-t" style={{ height: `${(v/45)*100}%` }} />
            ))}
          </div>
        )}

        {id === "leave-summary" && (
          <div className="text-sm space-y-1">
            {[["Annual","42 days"],["Sick","12 days"],["Casual","8 days"]].map(([t,v]) => (
              <div key={t} className="flex justify-between"><span className="text-gray-500">{t}</span><span className="font-medium">{v}</span></div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <RBACGuard module="analytics">
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">📊 Dashboard Builder — CEO View</h2>
          <div className="flex gap-2">
            <button onClick={handleSchedule}
              className="px-3 py-2 border rounded-lg text-sm hover:bg-gray-50 flex items-center gap-1">
              {scheduled ? "✅ Scheduled!" : "📅 Schedule Report"}
            </button>
            <button onClick={handleSave}
              className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700">
              {saved ? "✅ Saved!" : "💾 Save"}
            </button>
            <button onClick={handleExportPDF}
              className="px-3 py-2 border rounded-lg text-sm hover:bg-gray-50">
              ↓ Export PDF
            </button>
          </div>
        </div>

        {/* Widget Palette */}
        <div className="bg-gray-50 border border-dashed rounded-xl p-4 mb-6">
          <p className="text-xs text-gray-500 font-medium mb-3">AVAILABLE WIDGETS — drag to dashboard or click +</p>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_WIDGETS.filter(w => !widgets.includes(w.id)).map(w => (
              <button key={w.id}
                draggable
                onDragStart={e => { e.dataTransfer.setData("widgetId", w.id); setDragWidget(w.id) }}
                onClick={() => setWidgets(prev => [...prev, w.id])}
                className="px-3 py-1.5 bg-white border border-blue-200 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-50 cursor-grab active:cursor-grabbing">
                + {w.title}
              </button>
            ))}
            {AVAILABLE_WIDGETS.every(w => widgets.includes(w.id)) && (
              <span className="text-xs text-gray-400 italic">All widgets added! Remove some to add different ones.</span>
            )}
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {widgets.slice(0, 4).map(id => renderWidget(id))}
        </div>

        {widgets.length > 4 && (
          <div className="grid grid-cols-3 gap-4 mb-4">
            {widgets.slice(4).map(id => renderWidget(id))}
          </div>
        )}

        {/* Drop Zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
            dragOver ? "border-blue-400 bg-blue-50" : "border-gray-200 hover:border-gray-300"
          }`}>
          <p className="text-sm text-gray-400">
            {dragOver ? "Drop widget here!" : "+ Drag a widget here — Bar / Line / Pie / Table / KPI Card / Heatmap"}
          </p>
        </div>
      </div>
    </RBACGuard>
  )
}
