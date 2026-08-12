import type { Metadata } from 'next'
import Link from 'next/link'
import { requireSession } from '@/lib/auth/session'
import { listNotifications } from '@/lib/db/repo'
import { Badge, Card, CardBody, CardHeader, EmptyState, PageHeader, StatTile } from '@/components/ui/primitives'
import { ActionButton } from '@/components/ui/action'
import { notificationAction } from '@/app/(app)/actions'
import { formatDateTime, formatNumber } from '@/lib/utils'
import type { NotificationSeverity } from '@/lib/types'

export const metadata: Metadata = { title: 'Notifications' }
export const dynamic = 'force-dynamic'

const SEVERITY_TONE: Record<NotificationSeverity, 'brand' | 'ok' | 'warn' | 'danger'> = {
  info: 'brand',
  success: 'ok',
  warning: 'warn',
  critical: 'danger',
}

const SEVERITY_DOT: Record<NotificationSeverity, string> = {
  info: 'bg-brand-500',
  success: 'bg-ok',
  warning: 'bg-warn',
  critical: 'bg-danger',
}

export default async function NotificationsPage() {
  const session = await requireSession()
  const notifications = listNotifications(session.tenantId)
  const unread = notifications.filter((n) => !n.read)

  const bySeverity = (['critical', 'warning', 'success', 'info'] as const).map((severity) => ({
    severity,
    count: notifications.filter((n) => n.severity === severity).length,
  }))

  const channelCounts = {
    inApp: notifications.filter((n) => n.channels.includes('inApp')).length,
    email: notifications.filter((n) => n.channels.includes('email')).length,
    webhook: notifications.filter((n) => n.channels.includes('webhook')).length,
  }

  return (
    <>
      <PageHeader
        title="Notifications"
        description="Domain events published by the notification engine. Each event fans out to the channels configured for its severity, with delivery tracked per attempt."
        meta={
          <>
            <Badge tone={unread.length > 0 ? 'warn' : 'ok'}>{formatNumber(unread.length)} unread</Badge>
            <Badge tone="muted">{formatNumber(notifications.length)} total</Badge>
          </>
        }
        actions={
          unread.length > 0 ? (
            <ActionButton action={notificationAction} fields={{ all: 'true' }} variant="primary" size="md">
              Mark all as read
            </ActionButton>
          ) : null
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {bySeverity.map((entry) => (
          <StatTile
            key={entry.severity}
            label={entry.severity === 'info' ? 'Informational' : entry.severity}
            value={formatNumber(entry.count)}
            tone={SEVERITY_TONE[entry.severity]}
            icon={entry.severity === 'critical' ? '!' : entry.severity === 'warning' ? '⚠' : entry.severity === 'success' ? '✓' : 'ⓘ'}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_300px]">
        <Card>
          <CardHeader title="Event inbox" subtitle="Newest first" />
          {notifications.length === 0 ? (
            <EmptyState title="Nothing here yet" description="Domain events will appear as modules emit them." icon="◉" />
          ) : (
            <ul className="divide-y divide-ink-line">
              {notifications.map((notification) => (
                <li key={notification.id} className={`flex gap-3 px-5 py-3.5 ${notification.read ? '' : 'bg-brand-50/40'}`}>
                  <span aria-hidden className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${SEVERITY_DOT[notification.severity]}`} />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-xs font-semibold text-ink">{notification.title}</p>
                      {!notification.read ? <Badge tone="brand">new</Badge> : null}
                      <code className="rounded bg-surface-sunken px-1.5 py-0.5 font-mono text-[10px] text-ink-muted">
                        {notification.event}
                      </code>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-ink-muted">{notification.body}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-ink-muted">
                      <span>{formatDateTime(notification.createdAt)}</span>
                      <span aria-hidden>·</span>
                      <span>
                        Delivered via {notification.channels.join(', ')} ({notification.deliveryAttempts} attempt
                        {notification.deliveryAttempts === 1 ? '' : 's'})
                      </span>
                      {notification.href ? (
                        <Link href={notification.href} className="font-semibold text-brand-600 hover:underline">
                          Open
                        </Link>
                      ) : null}
                    </div>
                  </div>

                  {!notification.read ? (
                    <div className="shrink-0">
                      <ActionButton action={notificationAction} fields={{ id: notification.id }} variant="secondary">
                        Mark read
                      </ActionButton>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Channel delivery" />
            <CardBody className="space-y-2.5">
              {(
                [
                  { key: 'inApp', label: 'In-app', count: channelCounts.inApp, note: 'Delivered synchronously' },
                  { key: 'email', label: 'Email', count: channelCounts.email, note: 'Queued for the mail worker' },
                  { key: 'webhook', label: 'Webhook', count: channelCounts.webhook, note: 'HMAC-signed POST' },
                ] as const
              ).map((channel) => (
                <div key={channel.key} className="flex items-center justify-between gap-3 rounded-lg border border-ink-line px-3 py-2">
                  <div>
                    <p className="text-xs font-semibold text-ink">{channel.label}</p>
                    <p className="text-[10px] text-ink-muted">{channel.note}</p>
                  </div>
                  <span className="tnum text-sm font-bold text-ink">{formatNumber(channel.count)}</span>
                </div>
              ))}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Retry policy" />
            <CardBody className="space-y-2 text-[11px] leading-relaxed text-ink-muted">
              <p>Failed email and webhook deliveries retry up to three times with exponential backoff before landing in the dead-letter queue.</p>
              <p>Per-user channel preferences are configured under Settings and are respected on every fan-out.</p>
              <p>Webhook payloads are signed with an HMAC so the receiver can verify origin and integrity.</p>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  )
}
