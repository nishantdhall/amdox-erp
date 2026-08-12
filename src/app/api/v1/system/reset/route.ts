import { apiRoute, ok } from '@/lib/api/handler'
import { resetStore } from '@/lib/db/store'

/** Restore the demo dataset — useful before recording a walkthrough. */
export const POST = apiRoute({ permission: 'system.reset' }, async () => {
  resetStore()
  return ok({ reset: true, message: 'Demo dataset restored to its seeded state.' })
})
