import { z } from 'zod'
import { apiRoute, created, paginate } from '@/lib/api/handler'
import { listPayments, recordPayment } from '@/lib/db/repo'

const paymentInput = z.object({
  invoiceId: z.string().min(1),
  amount: z.number().positive(),
  method: z.enum(['Bank Transfer', 'UPI', 'Card', 'Cheque']).default('Bank Transfer'),
})

export const GET = apiRoute({ permission: 'finance.view' }, async ({ session, query }) =>
  paginate(listPayments(session.tenantId), query),
)

export const POST = apiRoute({ permission: 'payment.record' }, async ({ session, audit, body }) => {
  const input = await body(paymentInput)
  return created(recordPayment(session.tenantId, input, audit))
})
