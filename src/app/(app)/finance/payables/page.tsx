import type { Metadata } from 'next'
import { requireSession } from '@/lib/auth/session'
import { InvoiceWorkspace } from '@/components/finance/invoice-workspace'

export const metadata: Metadata = { title: 'Accounts payable' }
export const dynamic = 'force-dynamic'

export default async function PayablesPage() {
  const session = await requireSession()
  return <InvoiceWorkspace session={session} kind="AP" />
}
