import type { Metadata } from 'next'
import { requireSession } from '@/lib/auth/session'
import { openApiDocument } from '@/lib/api/openapi'
import { Badge, Card, CardBody, CardHeader, PageHeader, StatTile } from '@/components/ui/primitives'
import { EndpointExplorer } from './api-docs-ui'

export const metadata: Metadata = { title: 'API reference' }
export const dynamic = 'force-dynamic'

const METHOD_ORDER = ['get', 'post', 'patch', 'put', 'delete'] as const

export default async function ApiDocsPage() {
  await requireSession()

  const spec = openApiDocument()
  const paths = spec.paths as Record<string, Record<string, unknown>>

  const endpoints = Object.entries(paths).flatMap(([path, operations]) =>
    METHOD_ORDER.filter((method) => method in operations).map((method) => {
      const operation = operations[method] as {
        summary?: string
        description?: string
        tags?: string[]
        parameters?: { name: string; in: string; schema?: { type?: string } }[]
        requestBody?: unknown
        responses?: Record<string, unknown>
      }
      return {
        path,
        method: method.toUpperCase(),
        summary: operation.summary ?? '',
        description: operation.description ?? '',
        tag: operation.tags?.[0] ?? 'Other',
        parameters: (operation.parameters ?? []).map((p) => ({ name: p.name, in: p.in, type: p.schema?.type ?? 'string' })),
        hasBody: Boolean(operation.requestBody),
        statuses: Object.keys(operation.responses ?? {}),
      }
    }),
  )

  const tags = spec.tags.map((tag) => ({ name: tag.name, description: tag.description }))

  return (
    <>
      <PageHeader
        title="API reference"
        description="Every module is reachable over a versioned REST API described by a published OpenAPI 3.1 document. The spec below is generated from the same source the server serves."
        meta={
          <>
            <Badge tone="brand">OpenAPI {spec.openapi}</Badge>
            <Badge tone="muted">Base path /api/v1</Badge>
            <Badge tone="muted">Session-cookie auth</Badge>
          </>
        }
        actions={
          <a
            href="/api/v1/openapi.json"
            className="rounded-lg bg-brand-500 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-600"
          >
            Download spec
          </a>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Endpoints" value={String(endpoints.length)} icon="⌘" />
        <StatTile label="Resource groups" value={String(tags.length)} icon="≡" />
        <StatTile label="Schemas" value={String(Object.keys(spec.components.schemas).length)} icon="◫" />
        <StatTile label="Rate limit" value="240 / min" hint="Per client IP, per path" icon="◷" />
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Conventions" />
          <CardBody className="grid gap-3 text-[11px] leading-relaxed text-ink-muted sm:grid-cols-2">
            <div>
              <p className="mb-1 text-xs font-semibold text-ink">Authentication</p>
              <p>
                All endpoints except <code className="rounded bg-surface-sunken px-1 font-mono">/health</code>,{' '}
                <code className="rounded bg-surface-sunken px-1 font-mono">/openapi.json</code> and{' '}
                <code className="rounded bg-surface-sunken px-1 font-mono">/auth/login</code> require the HMAC-signed{' '}
                <code className="rounded bg-surface-sunken px-1 font-mono">amdox_session</code> cookie.
              </p>
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold text-ink">Errors</p>
              <p>
                Failures return{' '}
                <code className="rounded bg-surface-sunken px-1 font-mono">{'{ error: { code, message, details? } }'}</code> with a
                meaningful status: 401 unauthenticated, 403 forbidden, 404 not found, 409 conflict, 422 validation, 429 rate limited.
              </p>
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold text-ink">Pagination</p>
              <p>
                Collections accept <code className="rounded bg-surface-sunken px-1 font-mono">limit</code> and{' '}
                <code className="rounded bg-surface-sunken px-1 font-mono">offset</code> and return{' '}
                <code className="rounded bg-surface-sunken px-1 font-mono">{'{ data, meta }'}</code> with a{' '}
                <code className="rounded bg-surface-sunken px-1 font-mono">hasMore</code> flag.
              </p>
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold text-ink">Tenancy</p>
              <p>
                Every response is scoped to the tenant on the session. There is no tenant parameter to tamper with — the filter is
                applied inside the repository layer.
              </p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Quick start" />
          <CardBody>
            <pre className="overflow-x-auto rounded-lg bg-ink p-3 font-mono text-[10.5px] leading-relaxed text-white/85">
              <code>{`# 1. Sign in and keep the session cookie
curl -c jar.txt -X POST \\
  https://<your-app>/api/v1/auth/login \\
  -H 'Content-Type: application/json' \\
  -d '{"email":"admin@amdox.in",
       "password":"Amdox@2026"}'

# 2. Call any resource with that cookie
curl -b jar.txt \\
  'https://<your-app>/api/v1/employees?limit=5'

# 3. Verify the audit hash chain
curl -b jar.txt \\
  https://<your-app>/api/v1/audit/verify`}</code>
            </pre>
          </CardBody>
        </Card>
      </div>

      <EndpointExplorer endpoints={endpoints} tags={tags} />
    </>
  )
}
