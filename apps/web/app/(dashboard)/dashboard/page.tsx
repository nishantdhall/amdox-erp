"use client"
import { useState } from "react"
import { useAuth } from "@/lib/auth-context"

const ALERTS = [
  { type: "LOW STOCK", color: "bg-orange-100 text-orange-700", msg: "SKU-441 below reorder level" },
  { type: "APPROVAL", color: "bg-yellow-100 text-yellow-700", msg: "PO #2891 awaiting your OK" },
  { type: "DONE", color: "bg-green-100 text-green-700", msg: "June payroll processed ✓" },
  { type: "REPORT", color: "bg-blue-100 text-blue-700", msg: "Q2 Finance report ready" },
]

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun"]
const REVENUE = [2.8,3.6,3.2,4.8,4.2,5.4]

export default function DashboardPage() {
  const { user } = useAuth()
  const [showModal, setShowModal] = useState(false)
  const [task, setTask] = useState({ title: "", type: "Invoice", priority: "Medium" })
  const [tasks, setTasks] = useState<any[]>([])
  const [saved, setSaved] = useState("")
  const max = Math.max(...REVENUE)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setTasks(prev => [...prev, { ...task, id: Date.now(), date: new Date().toLocaleDateString() }])
    setSaved(`"${task.title}" added!`)
    setShowModal(false)
    setTask({ title: "", type: "Invoice", priority: "Medium" })
    setTimeout(() => setSaved(""), 3000)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Good morning, {user?.name?.split(" ")[0] || "Nishant"} 👋</h2>
          <p className="text-gray-500 text-sm mt-1">July 2026 • Q3 Summary</p>
        </div>
        <div className="flex gap-3">
          {saved && <span className="text-green-600 text-sm self-center">{saved}</span>}
          <button className="relative px-2 py-2 text-gray-500 hover:bg-gray-100 rounded-lg">
            🔔 <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">3</span>
          </button>
          <button onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700">
            + New
          </button>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-900 text-lg">Create New Item</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Title</label>
                <input required value={task.title} onChange={e => setTask({...task, title: e.target.value})}
                  placeholder="e.g. Invoice for Client ABC"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Type</label>
                <select value={task.type} onChange={e => setTask({...task, type: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {["Invoice","Purchase Order","Leave Request","Journal Entry","Task","Report"].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Priority</label>
                <select value={task.priority} onChange={e => setTask({...task, priority: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {["High","Medium","Low"].map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700">Create</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 border rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { icon: "💰", label: "REVENUE (MTD)", value: "₹4.2Cr", sub: "↑ 12% vs last month", subColor: "text-green-500" },
          { icon: "👥", label: "ACTIVE EMPLOYEES", value: "248", sub: "↑ 5 new this month", subColor: "text-green-500" },
          { icon: "📦", label: "OPEN POs", value: "34", sub: "8 need approval", subColor: "text-orange-500" },
          { icon: "🤖", label: "AI ACCURACY", value: "91.4%", sub: "MAPE: 8.6% ✓", subColor: "text-green-500" },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-xl border p-5">
            <div className="text-2xl mb-2">{kpi.icon}</div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">{kpi.label}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{kpi.value}</p>
            <p className={`text-xs mt-1 ${kpi.subColor}`}>{kpi.sub}</p>
          </div>
        ))}
      </div>

      {tasks.length > 0 && (
        <div className="bg-white rounded-xl border p-5 mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">Recently Created</h3>
          <div className="space-y-2">
            {tasks.map(t => (
              <div key={t.id} className="flex items-center justify-between text-sm">
                <span className="font-medium">{t.title}</span>
                <div className="flex gap-2 items-center">
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{t.type}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${t.priority==="High"?"bg-red-100 text-red-700":t.priority==="Medium"?"bg-yellow-100 text-yellow-700":"bg-gray-100 text-gray-600"}`}>{t.priority}</span>
                  <span className="text-gray-400">{t.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Revenue — Last 6 Months</h3>
          <div className="flex items-end gap-3 h-40">
            {MONTHS.map((m, i) => (
              <div key={m} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs text-gray-500">₹{REVENUE[i]}Cr</span>
                <div className={`w-full rounded-t ${i === MONTHS.length-1 ? "bg-green-500" : "bg-blue-500"}`}
                  style={{ height: `${(REVENUE[i]/max)*100}%` }} />
                <span className="text-xs text-gray-500">{m}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-semibold text-gray-900 mb-4">⚠ Alerts (Live)</h3>
          <div className="space-y-3">
            {ALERTS.map((a, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className={`text-xs px-2 py-1 rounded font-semibold ${a.color}`}>{a.type}</span>
                <span className="text-sm text-gray-600">{a.msg}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
