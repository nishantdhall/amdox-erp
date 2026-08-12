import { z } from 'zod'
import { apiRoute, paginate } from '@/lib/api/handler'
import { listNotifications, markAllNotificationsRead, markNotificationRead } from '@/lib/db/repo'

const readSchema = z.object({
  id: z.string().optional(),
  all: z.boolean().optional(),
})

export const GET = apiRoute({ permission: 'dashboard.view' }, async ({ session, query }) => {
  const rows = listNotifications(session.tenantId, { unreadOnly: query.get('unreadOnly') === 'true' })
  return { ...paginate(rows, query), unreadCount: rows.filter((n) => !n.read).length }
})

export const POST = apiRoute({ permission: 'notification.manage' }, async ({ session, body }) => {
  const input = await body(readSchema)

  if (input.all) {
    return { updated: markAllNotificationsRead(session.tenantId) }
  }
  if (!input.id) {
    return { updated: 0, message: 'Provide either an id or all: true.' }
  }
  return markNotificationRead(session.tenantId, input.id)
})
