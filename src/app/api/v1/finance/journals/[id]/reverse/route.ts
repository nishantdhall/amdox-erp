import { apiRoute, created } from '@/lib/api/handler'
import { reverseJournal } from '@/lib/db/repo'

type Params = { id: string }

export const POST = apiRoute<Params>({ permission: 'finance.post' }, async ({ session, audit, params }) =>
  created(reverseJournal(session.tenantId, params.id, audit)),
)
