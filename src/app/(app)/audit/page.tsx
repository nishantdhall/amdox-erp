import type { Metadata } from 'next'
import { requireSession } from '@/lib/auth/session'
import { listAuditLogs } from '@/lib/db/repo'
import { verifyAuditChain } from '@/lib/db/store'
import { Badge, Card, CardBody, CardHeader, EmptyState, PageHeader, StatTile, Table } from '@/components/ui/primitives'
import { RankedBars } from '@/components/charts/bar'
import { formatDateTime, formatNumber } from '@/lib/utils'

export const metadata: Metadata = { title: 'Audit trail' }
export const dynamic = 'force-dynamic'

export default async function AuditPage({ searchParams }: { searchParams: Promise<{ action?: string; search?: string }> }) {
  const params = await searchParams
  const session = await requireSession()

  const all = listAuditLogs(session.tenantId)
  const filtered = listAuditLogs(session.tenantId, { action: params.action, search: params.search })
  const chain = verifyAuditChain(session.tenantId)

  const byAction = all.reduce<Record<string, number>>((acc, log) => {
    acc[log.action] = (acc[log.action] ?? 0) + 1
    return acc
  }, {})
  const actionRanking = Object.entries(byAction)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)

  const byActor = all.reduce<Record<string, number>>((acc, log) => {
    acc[log.actorName] = (acc[log.actorName] ?? 0) + 1
    return acc
  }, {})
  const actorRanking = Object.entries(byActor)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6)

  const last24h = all.filter((log) => Date.now() - new Date(log.at).getTime() < 86_400_000)

  return (
    <>
      <PageHeader
        title="Audit trail"
        description="Every mutation is appended to a hash chain — each record commits to the previous one, so any retroactive edit breaks verification."
        meta={
          <>
            <Badge tone={chain.valid ? 'ok' : 'danger'}>
              {chain.valid ? `Chain verified — ${formatNumber(chain.checked)} records` : `Tampering detected at #${chain.brokenAtSeq}`}
            </Badge>
            <Badge tone="muted">SHA-256 hash chain</Badge>
            <Badge tone="muted">SOC 2 CC7.2</Badge>
          </>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Total records" value={formatNumber(all.length)} icon="⛨" />
        <StatTile label="Last 24 hours" value={formatNumber(last24h.length)} icon="◷" />
        <StatTile label="Distinct actions" value={formatNumber(Object.keys(byAction).length)} icon="≡" />
        <StatTile
          label="Chain integrity"
          value={chain.valid ? 'Verified' : 'Broken'}
          tone={chain.valid ? 'ok' : 'danger'}
          hint={chain.reason ?? 'Every hash matches its contents'}
          icon={chain.valid ? '✓' : '!'}
        />
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader title="Activity by action" />
          <CardBody>
            <RankedBars data={actionRanking} format={{ kind: 'number' }} emptyLabel="No audit activity" />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Activity by actor" />
          <CardBody>
            <RankedBars data={actorRanking} format={{ kind: 'number' }} color="#047857" emptyLabel="No audit activity" />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="How verification works" />
          <CardBody className="space-y-2.5 text-[11px] leading-relaxed text-ink-muted">
            <p>
              Each record stores <code className="rounded bg-surface-sunken px-1 font-mono text-[10px]">prevHash</code> and its own{' '}
              <code className="rounded bg-surface-sunken px-1 font-mono text-[10px]">hash</code>, computed as{' '}
              <code className="rounded bg-surface-sunken px-1 font-mono text-[10px]">SHA-256(prevHash ‖ canonical(payload))</code>.
            </p>
            <p>
              Verification replays the chain from the genesis hash. Editing a summary, deleting a row or reordering the sequence
              all break the very next link, and the endpoint reports the exact sequence number where it fails.
            </p>
            <p>
              The same check is exposed at{' '}
              <a href="/api/v1/audit/verify" className="font-semibold text-brand-600 hover:underline">
                /api/v1/audit/verify
              </a>{' '}
              for external compliance tooling.
            </p>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Audit records"
          subtitle={`${formatNumber(filtered.length)} of ${formatNumber(all.length)} records, newest first`}
          action={
            <form className="flex items-center gap-2" action="/audit">
              <input name="search" defaultValue={params.search ?? ''} placeholder="Search action, actor or summary" className="input py-1.5 text-xs" />
              <button type="submit" className="rounded-lg border border-ink-line px-2.5 py-1.5 text-[11px] font-semibold text-ink hover:bg-surface-sunken">
                Search
              </button>
            </form>
          }
        />
        {filtered.length === 0 ? (
          <EmptyState title="No audit records match" description="Clear the search to see the full trail." icon="⛨" />
        ) : (
          <Table>
            <thead>
              <tr>
                <th className="text-right">#</th>
                <th>When</th>
                <th>Actor</th>
                <th>Action</th>
                <th>Entity</th>
                <th>Summary</th>
                <th>IP</th>
                <th>Hash</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 80).map((log) => (
                <tr key={log.id}>
                  <td className="tnum text-right text-[11px] text-ink-muted">{log.seq}</td>
                  <td className="text-[11px] text-ink-muted">{formatDateTime(log.at)}</td>
                  <td className="text-xs font-medium">{log.actorName}</td>
                  <td>
                    <code className="rounded bg-surface-sunken px-1.5 py-0.5 font-mono text-[10px] text-ink">{log.action}</code>
                  </td>
                  <td className="text-[11px] text-ink-muted">{log.entity}</td>
                  <td className="max-w-[280px] truncate text-xs">{log.summary}</td>
                  <td className="tnum text-[11px] text-ink-muted">{log.ip}</td>
                  <td>
                    <span className="tnum font-mono text-[10px] text-ink-muted" title={`hash ${log.hash}\nprev ${log.prevHash}`}>
                      {log.hash.slice(0, 10)}…
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  )
}
