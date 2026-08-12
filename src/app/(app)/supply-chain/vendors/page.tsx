import type { Metadata } from 'next'
import { requireSession } from '@/lib/auth/session'
import { getTenant, listInvoices, listPurchaseOrders, listVendors } from '@/lib/db/repo'
import { Badge, Card, CardBody, CardHeader, EmptyState, PageHeader, Progress, StatTile, Table } from '@/components/ui/primitives'
import { RankedBars } from '@/components/charts/bar'
import { formatMoney, formatNumber, round } from '@/lib/utils'

export const metadata: Metadata = { title: 'Vendors' }
export const dynamic = 'force-dynamic'

export default async function VendorsPage() {
  const session = await requireSession()
  const tenant = getTenant(session.tenantId)
  const currency = tenant.baseCurrency

  const vendors = listVendors(session.tenantId)
  const orders = listPurchaseOrders(session.tenantId)
  const payables = listInvoices(session.tenantId, { kind: 'AP' })

  const enriched = vendors.map((vendor) => {
    const vendorOrders = orders.filter((po) => po.vendorId === vendor.id)
    const vendorInvoices = payables.filter((invoice) => invoice.counterpartyId === vendor.id)
    const spend = vendorOrders.reduce((s, po) => s + po.total, 0)
    const outstanding = vendorInvoices.reduce((s, invoice) => s + (invoice.total - invoice.amountPaid), 0)
    return { vendor, orderCount: vendorOrders.length, spend, outstanding, invoiceCount: vendorInvoices.length }
  })

  const totalSpend = enriched.reduce((s, row) => s + row.spend, 0)
  const avgOnTime = vendors.length === 0 ? 0 : round(vendors.reduce((s, v) => s + v.onTimeDeliveryPct, 0) / vendors.length, 1)
  const atRisk = vendors.filter((v) => v.onTimeDeliveryPct < 85)

  return (
    <>
      <PageHeader
        title="Vendors"
        description="Supplier master data, delivery performance and open exposure. The reorder engine prefers vendors with the strongest on-time record."
        meta={
          <>
            <Badge tone="muted">{formatNumber(vendors.length)} vendors</Badge>
            <Badge tone={avgOnTime >= 90 ? 'ok' : 'warn'}>{avgOnTime}% average on-time delivery</Badge>
            {atRisk.length > 0 ? <Badge tone="danger">{formatNumber(atRisk.length)} below 85%</Badge> : null}
          </>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Active vendors" value={formatNumber(vendors.filter((v) => v.isActive).length)} icon="⌂" />
        <StatTile label="Total ordered" value={formatMoney(totalSpend, currency, true)} icon="⇄" />
        <StatTile
          label="Open payables"
          value={formatMoney(enriched.reduce((s, r) => s + r.outstanding, 0), currency, true)}
          tone="warn"
          icon="↧"
        />
        <StatTile label="On-time delivery" value={`${avgOnTime}%`} tone={avgOnTime >= 90 ? 'ok' : 'warn'} icon="◔" />
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader title="Spend concentration" subtitle="Where procurement money goes" />
          <CardBody>
            <RankedBars
              data={enriched
                .filter((row) => row.spend > 0)
                .sort((a, b) => b.spend - a.spend)
                .slice(0, 8)
                .map((row) => ({ label: row.vendor.name, value: row.spend }))}
              format={{ kind: 'money', currency, compact: true }}
              emptyLabel="No purchase orders raised yet"
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Delivery reliability" subtitle="On-time delivery percentage" />
          <CardBody>
            <RankedBars
              data={[...vendors]
                .sort((a, b) => b.onTimeDeliveryPct - a.onTimeDeliveryPct)
                .slice(0, 8)
                .map((vendor) => ({
                  label: vendor.name,
                  value: vendor.onTimeDeliveryPct,
                  tone: vendor.onTimeDeliveryPct >= 90 ? '#047857' : vendor.onTimeDeliveryPct >= 85 ? '#a45c00' : '#b03f7a',
                }))}
              format={{ kind: 'percent', dp: 1 }}
              max={100}
              emptyLabel="No vendors configured"
            />
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Vendor directory" />
        {vendors.length === 0 ? (
          <EmptyState title="No vendors" description="No supplier records exist for this tenant." icon="⌂" />
        ) : (
          <Table>
            <thead>
              <tr>
                <th>Vendor</th>
                <th>Country</th>
                <th>Currency</th>
                <th className="text-right">Terms</th>
                <th className="text-right">Orders</th>
                <th className="text-right">Ordered value</th>
                <th className="text-right">Open payables</th>
                <th className="min-w-[120px]">On-time</th>
                <th className="text-right">Rating</th>
              </tr>
            </thead>
            <tbody>
              {enriched.map(({ vendor, orderCount, spend, outstanding }) => (
                <tr key={vendor.id}>
                  <td>
                    <p className="text-xs font-semibold text-ink">{vendor.name}</p>
                    <p className="tnum text-[11px] text-ink-muted">
                      {vendor.code} · {vendor.email}
                    </p>
                  </td>
                  <td className="text-xs text-ink-muted">{vendor.country}</td>
                  <td className="text-xs text-ink-muted">{vendor.currency}</td>
                  <td className="tnum text-right text-xs">{vendor.paymentTermsDays}d</td>
                  <td className="tnum text-right text-xs">{formatNumber(orderCount)}</td>
                  <td className="tnum text-right text-xs font-semibold">{formatMoney(spend, currency, true)}</td>
                  <td className="tnum text-right text-xs">{outstanding > 0 ? formatMoney(outstanding, currency, true) : '—'}</td>
                  <td>
                    <Progress
                      value={vendor.onTimeDeliveryPct}
                      tone={vendor.onTimeDeliveryPct >= 90 ? 'ok' : vendor.onTimeDeliveryPct >= 85 ? 'warn' : 'danger'}
                    />
                    <span className="tnum mt-1 block text-[10px] text-ink-muted">{vendor.onTimeDeliveryPct.toFixed(1)}%</span>
                  </td>
                  <td className="tnum text-right text-xs">
                    {vendor.rating.toFixed(1)}
                    <span className="text-ink-muted"> / 5</span>
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
