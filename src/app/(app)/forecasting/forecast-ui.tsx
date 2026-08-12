'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { Card, CardBody, CardHeader } from '@/components/ui/primitives'

export function ForecastControls({
  skus,
  selectedSku,
  horizon,
  model,
}: {
  skus: { sku: string; name: string }[]
  selectedSku: string
  horizon: number
  model: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const navigate = (patch: { sku?: string; horizon?: number; model?: string }) => {
    const next = new URLSearchParams()
    next.set('sku', patch.sku ?? selectedSku)
    next.set('horizon', String(patch.horizon ?? horizon))
    const chosenModel = patch.model ?? model
    if (chosenModel) next.set('model', chosenModel)
    startTransition(() => router.push(`/forecasting?${next.toString()}`))
  }

  return (
    <Card>
      <CardHeader title="Forecast controls" subtitle={pending ? 'Refitting the models…' : 'Models refit on every change'} />
      <CardBody className="space-y-3">
        <div>
          <label className="label" htmlFor="forecast-sku">
            SKU
          </label>
          <select id="forecast-sku" className="input" value={selectedSku} onChange={(event) => navigate({ sku: event.target.value })}>
            {skus.map((entry) => (
              <option key={entry.sku} value={entry.sku}>
                {entry.sku} — {entry.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="forecast-horizon">
            Horizon — {horizon} month{horizon === 1 ? '' : 's'}
          </label>
          <input
            id="forecast-horizon"
            type="range"
            min={1}
            max={12}
            step={1}
            value={horizon}
            onChange={(event) => navigate({ horizon: Number(event.target.value) })}
            className="w-full accent-brand-500"
          />
          <div className="mt-0.5 flex justify-between text-[10px] text-ink-muted">
            <span>1</span>
            <span>6</span>
            <span>12</span>
          </div>
        </div>

        <div>
          <label className="label" htmlFor="forecast-model">
            Model
          </label>
          <select id="forecast-model" className="input" value={model} onChange={(event) => navigate({ model: event.target.value })}>
            <option value="">Auto — pick by backtest</option>
            <option value="Ensemble">Ensemble (weighted blend)</option>
            <option value="Holt-Winters">Holt-Winters only</option>
            <option value="Prophet-style Additive">Additive decomposition only</option>
          </select>
        </div>

        <p className="text-[11px] leading-relaxed text-ink-muted">
          Forecasts are computed on request from the full 36-month history — nothing is cached, so every parameter change is a
          genuine refit.
        </p>
      </CardBody>
    </Card>
  )
}
