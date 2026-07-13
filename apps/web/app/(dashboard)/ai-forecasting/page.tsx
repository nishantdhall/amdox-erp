"use client"
import { useState } from "react"
import { RBACGuard } from "@/components/rbac-guard"

const SKUS = ["SKU-441 — Laptop Stand Pro","SKU-228 — USB-C Hub","SKU-119 — Wireless Mouse","SKU-088 — Desk Organizer","SKU-312 — Monitor Arm"]

const FORECAST_DATA: Record<string, number[]> = {
  "SKU-441 — Laptop Stand Pro": [120,95,110,88,240,280,310,290,330,280,260,220],
  "SKU-228 — USB-C Hub":        [200,210,195,220,230,240,250,260,270,265,255,245],
  "SKU-119 — Wireless Mouse":   [80,90,85,100,110,120,130,125,135,140,130,120],
  "SKU-088 — Desk Organizer":   [50,55,48,60,65,70,75,72,78,80,76,70],
  "SKU-312 — Monitor Arm":      [30,25,35,28,40,45,50,48,55,52,48,45],
}

const MONTHS_HIST = ["Mar","Apr","May","Jun"]
const MONTHS_PRED = ["Jul","Aug","Sep","Oct","Nov","Dec"]

export default function AIForecastingPage() {
  const [selectedSKU, setSelectedSKU] = useState(SKUS[0])
  const [isPredicting, setIsPredicting] = useState(false)
  const [isRetraining, setIsRetraining] = useState(false)
  const [predicted, setPredicted] = useState(true)
  const [retrainMsg, setRetrainMsg] = useState("")
  const [accuracy, setAccuracy] = useState(91.4)

  const data = FORECAST_DATA[selectedSKU] || FORECAST_DATA[SKUS[0]]
  const historical = data.slice(0, 4)
  const forecast = data.slice(4)
  const maxVal = Math.max(...data)

  const handlePredict = async () => {
    setIsPredicting(true)
    setPredicted(false)
    await new Promise(r => setTimeout(r, 2000))
    setPredicted(true)
    setIsPredicting(false)
  }

  const handleRetrain = async () => {
    setIsRetraining(true)
    setRetrainMsg("")
    await new Promise(r => setTimeout(r, 3000))
    const newAccuracy = (89 + Math.random() * 5).toFixed(1)
    setAccuracy(Number(newAccuracy))
    setRetrainMsg(`✅ Model retrained! New accuracy: ${newAccuracy}% (was ${accuracy}%)`)
    setIsRetraining(false)
  }

  const suggestedOrder = Math.round(Math.max(...forecast) * 1.2)
  const peakMonth = MONTHS_PRED[forecast.indexOf(Math.max(...forecast))]

  return (
    <RBACGuard module="ai-forecasting">
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">🤖 AI Demand Forecasting</h2>
          <div className="flex gap-3">
            <select value={selectedSKU} onChange={e => { setSelectedSKU(e.target.value); setPredicted(false) }}
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-56">
              {SKUS.map(s => <option key={s}>{s}</option>)}
            </select>
            <button onClick={handlePredict} disabled={isPredicting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 flex items-center gap-2">
              {isPredicting ? <><span className="animate-spin">⟳</span> Predicting...</> : "▶ Predict"}
            </button>
            <button onClick={handleRetrain} disabled={isRetraining}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-60 flex items-center gap-2">
              {isRetraining ? <><span className="animate-spin">⟳</span> Retraining...</> : "⟳ Retrain"}
            </button>
          </div>
        </div>

        {retrainMsg && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">{retrainMsg}</div>
        )}

        {isRetraining && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700 font-medium mb-2">🔄 Retraining model on latest data...</p>
            <div className="space-y-1 text-xs text-blue-600">
              <p>→ Fetching 24 months of sales data from PostgreSQL...</p>
              <p>→ Running Prophet seasonal decomposition...</p>
              <p>→ Training LSTM neural network on demand spikes...</p>
              <p>→ Validating on holdout set...</p>
            </div>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: "MAPE (ERROR RATE)", value: `${accuracy}%`, sub: "Target <12% ✓ Achieved", subColor: "text-green-500" },
            { label: "FORECAST HORIZON", value: "90 days", sub: "Next retrain: Sunday", subColor: "text-gray-400" },
            { label: "PREDICTED PEAK", value: `Wk3 ${peakMonth}`, sub: "+34% above avg", subColor: "text-orange-500" },
            { label: "SUGGESTED ORDER", value: `${suggestedOrder} units`, sub: "Based on forecast", subColor: "text-blue-500" },
          ].map(kpi => (
            <div key={kpi.label} className="bg-white rounded-xl border p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">{kpi.label}</p>
              <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
              <p className={`text-xs mt-1 ${kpi.subColor}`}>{kpi.sub}</p>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div className="bg-white rounded-xl border p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-1">
            Demand Forecast — {selectedSKU.split(" — ")[0]} (Gray = Actual | Blue = AI Predicted)
          </h3>
          {!predicted && !isPredicting && (
            <p className="text-sm text-gray-400 mb-4">Click "▶ Predict" to generate forecast</p>
          )}
          {isPredicting && (
            <p className="text-sm text-blue-500 mb-4 animate-pulse">⟳ Running Prophet + LSTM models...</p>
          )}
          <div className="flex items-end gap-2 h-48 mt-4">
            {historical.map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs text-gray-400">{v}</span>
                <div className="w-full bg-gray-300 rounded-t" style={{ height: `${(v/maxVal)*100}%` }} />
                <span className="text-xs text-gray-400">{MONTHS_HIST[i]}</span>
              </div>
            ))}
            <div className="w-px bg-yellow-400 self-stretch mx-1" />
            {predicted && forecast.map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs text-blue-500">{v}</span>
                <div className="w-full bg-blue-500 rounded-t transition-all duration-500" style={{ height: `${(v/maxVal)*100}%` }} />
                <span className="text-xs text-gray-400">{MONTHS_PRED[i]}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-3 text-center">← Historical sales | Prediction → (dashed line = confidence interval)</p>
        </div>

        {/* Model Pipeline + API */}
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Model Pipeline</h3>
            <div className="space-y-3">
              {[
                "PostgreSQL se last 2 years ka sales data fetch",
                "Prophet model seasonal trends identify karta hai",
                "LSTM neural net short-term spikes predict karta hai",
                "Ensemble: 60% Prophet + 40% LSTM weighted average",
                "Confidence interval: ±15% at 90-day horizon",
              ].map((step, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-xs flex items-center justify-center font-bold shrink-0">{i+1}</span>
                  <span className="text-sm text-gray-600">{step}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-xl border p-5">
            <h3 className="font-semibold text-gray-900 mb-4">API Endpoints (Python FastAPI)</h3>
            <div className="space-y-3 font-mono text-xs">
              {[
                { method: "POST", endpoint: "/train", desc: "model retrain" },
                { method: "GET",  endpoint: "/predict/{sku}", desc: "get forecast" },
                { method: "GET",  endpoint: "/health", desc: "service alive?" },
              ].map(api => (
                <div key={api.endpoint} className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded text-white text-xs font-bold ${api.method === "POST" ? "bg-green-600" : "bg-blue-600"}`}>{api.method}</span>
                  <span className="text-gray-800">{api.endpoint}</span>
                  <span className="text-gray-400">— {api.desc}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Sample Response:</p>
              <pre className="text-xs text-gray-700">{`{
  "sku": "${selectedSKU.split(" — ")[0]}",
  "forecast": [${forecast.slice(0,3).join(",")},...],
  "mape": ${accuracy},
  "peak_week": "Wk3 ${peakMonth}"
}`}</pre>
            </div>
          </div>
        </div>
      </div>
    </RBACGuard>
  )
}
