import { NextResponse } from 'next/server'
import { apiRoute } from '@/lib/api/handler'
import { analyticsSummary } from '@/lib/domain/analytics'
import { toCsv } from '@/lib/utils'

export const GET = apiRoute({ permission: 'analytics.view' }, async ({ session, query }) => {
  const summary = analyticsSummary(session.tenantId)

  // `?format=csv&dataset=<name>` powers the export buttons on the BI screen.
  if (query.get('format') === 'csv') {
    const dataset = query.get('dataset') ?? 'revenueSeries'
    const rows = (summary as unknown as Record<string, unknown>)[dataset]
    if (!Array.isArray(rows)) {
      return NextResponse.json({ error: { code: 'unknown_dataset', message: `No dataset named "${dataset}".` } }, { status: 400 })
    }
    return new NextResponse(toCsv(rows as Record<string, unknown>[]), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="amdox-${dataset}.csv"`,
      },
    })
  }

  return summary
})
