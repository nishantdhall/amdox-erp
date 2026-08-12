import { apiRoute } from '@/lib/api/handler'
import { verifyAuditChain } from '@/lib/db/store'

export const GET = apiRoute({ permission: 'audit.view' }, async ({ session }) => ({
  ...verifyAuditChain(session.tenantId),
  algorithm: 'SHA-256 hash chain',
  verifiedAt: new Date().toISOString(),
}))
