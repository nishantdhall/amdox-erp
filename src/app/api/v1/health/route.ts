import { NextResponse } from 'next/server'
import { bootedAt, db } from '@/lib/db/store'
import { verifyAuditChain } from '@/lib/db/store'
import { listTenants } from '@/lib/db/repo'

export const dynamic = 'force-dynamic'

/** Liveness + readiness probe (F-11). Public by design so uptime monitors can poll it. */
export async function GET() {
  const started = Date.now()
  const tables = db()
  const tenants = listTenants()
  const chain = verifyAuditChain(tenants[0]?.id ?? '')

  return NextResponse.json(
    {
      status: 'ok',
      service: 'amdox-erp',
      version: '1.0.0',
      apiVersion: 'v1',
      environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'development',
      region: process.env.VERCEL_REGION ?? 'local',
      bootedAt: bootedAt(),
      uptimeSeconds: Math.round(process.uptime()),
      checks: {
        datastore: 'ok',
        auditChain: chain.valid ? 'ok' : 'tampered',
        forecastEngine: tables.demandSeries.length > 0 ? 'ok' : 'no-series',
      },
      counts: {
        tenants: tables.tenants.length,
        users: tables.users.length,
        employees: tables.employees.length,
        journalEntries: tables.journalEntries.length,
        invoices: tables.invoices.length,
        inventory: tables.inventory.length,
        auditRecords: tables.auditLogs.length,
      },
      responseTimeMs: Date.now() - started,
    },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
