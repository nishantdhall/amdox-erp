'use client'

import { useMemo, useState } from 'react'
import { Badge, Card, CardHeader } from '@/components/ui/primitives'
import { cn } from '@/lib/utils'

export interface EndpointDoc {
  path: string
  method: string
  summary: string
  description: string
  tag: string
  parameters: { name: string; in: string; type: string }[]
  hasBody: boolean
  statuses: string[]
}

const METHOD_TONE: Record<string, string> = {
  GET: 'bg-brand-50 text-brand-700 ring-brand-500/25',
  POST: 'bg-ok-soft text-ok ring-ok/25',
  PATCH: 'bg-warn-soft text-warn ring-warn/25',
  PUT: 'bg-warn-soft text-warn ring-warn/25',
  DELETE: 'bg-danger-soft text-danger ring-danger/25',
}

export function EndpointExplorer({ endpoints, tags }: { endpoints: EndpointDoc[]; tags: { name: string; description: string }[] }) {
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return endpoints.filter((endpoint) => {
      if (activeTag && endpoint.tag !== activeTag) return false
      if (!q) return true
      return (
        endpoint.path.toLowerCase().includes(q) ||
        endpoint.summary.toLowerCase().includes(q) ||
        endpoint.method.toLowerCase().includes(q)
      )
    })
  }, [endpoints, activeTag, query])

  return (
    <Card>
      <CardHeader
        title="Endpoints"
        subtitle={`${filtered.length} of ${endpoints.length} shown`}
        action={
          <input
            className="input py-1.5 text-xs"
            placeholder="Filter by path or summary"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Filter endpoints"
          />
        }
      />

      <div className="flex flex-wrap gap-1.5 border-b border-ink-line px-5 py-3">
        <button
          type="button"
          onClick={() => setActiveTag(null)}
          aria-pressed={activeTag === null}
          className={cn(
            'rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors',
            activeTag === null ? 'bg-ink text-white' : 'bg-surface-sunken text-ink-muted hover:bg-ink-line',
          )}
        >
          All
        </button>
        {tags.map((tag) => (
          <button
            key={tag.name}
            type="button"
            onClick={() => setActiveTag(activeTag === tag.name ? null : tag.name)}
            aria-pressed={activeTag === tag.name}
            title={tag.description}
            className={cn(
              'rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors',
              activeTag === tag.name ? 'bg-ink text-white' : 'bg-surface-sunken text-ink-muted hover:bg-ink-line',
            )}
          >
            {tag.name}
          </button>
        ))}
      </div>

      <ul className="divide-y divide-ink-line">
        {filtered.map((endpoint) => {
          const key = `${endpoint.method} ${endpoint.path}`
          const open = expanded === key
          return (
            <li key={key}>
              <button
                type="button"
                onClick={() => setExpanded(open ? null : key)}
                aria-expanded={open}
                className="flex w-full items-center gap-3 px-5 py-2.5 text-left transition-colors hover:bg-surface-sunken"
              >
                <span
                  className={cn(
                    'w-[58px] shrink-0 rounded-md px-1.5 py-0.5 text-center font-mono text-[10px] font-bold ring-1 ring-inset',
                    METHOD_TONE[endpoint.method] ?? 'bg-ink/5 text-ink ring-ink/10',
                  )}
                >
                  {endpoint.method}
                </span>
                <code className="shrink-0 font-mono text-[11.5px] font-semibold text-ink">/api/v1{endpoint.path}</code>
                <span className="min-w-0 flex-1 truncate text-[11px] text-ink-muted">{endpoint.summary}</span>
                <span aria-hidden className="shrink-0 text-[10px] text-ink-muted">
                  {open ? '▲' : '▼'}
                </span>
              </button>

              {open ? (
                <div className="border-t border-ink-line bg-surface-raised px-5 py-3.5">
                  {endpoint.description ? <p className="mb-3 text-xs leading-relaxed text-ink-muted">{endpoint.description}</p> : null}

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">Parameters</p>
                      {endpoint.parameters.length === 0 ? (
                        <p className="text-[11px] text-ink-muted">None</p>
                      ) : (
                        <ul className="space-y-1">
                          {endpoint.parameters.map((parameter) => (
                            <li key={`${parameter.in}-${parameter.name}`} className="flex items-center gap-2">
                              <code className="rounded bg-white px-1.5 py-0.5 font-mono text-[10px] font-semibold text-ink ring-1 ring-ink-line">
                                {parameter.name}
                              </code>
                              <span className="text-[10px] text-ink-muted">
                                {parameter.in} · {parameter.type}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                      {endpoint.hasBody ? (
                        <p className="mt-2 text-[11px] text-ink-muted">
                          Accepts a JSON request body validated server-side; a mismatch returns 422 with the failing paths.
                        </p>
                      ) : null}
                    </div>

                    <div>
                      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">Responses</p>
                      <div className="flex flex-wrap gap-1.5">
                        {endpoint.statuses.map((status) => (
                          <Badge key={status} tone={status.startsWith('2') ? 'ok' : status.startsWith('4') ? 'warn' : 'muted'}>
                            {status}
                          </Badge>
                        ))}
                      </div>
                      {endpoint.method === 'GET' ? (
                        <a
                          href={`/api/v1${endpoint.path}`}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 inline-block rounded-lg border border-ink-line bg-white px-2.5 py-1.5 text-[11px] font-semibold text-ink hover:bg-surface-sunken"
                        >
                          Try it in a new tab →
                        </a>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : null}
            </li>
          )
        })}
      </ul>

      {filtered.length === 0 ? <p className="px-5 py-10 text-center text-xs text-ink-muted">No endpoints match that filter.</p> : null}
    </Card>
  )
}
