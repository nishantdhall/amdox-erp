import { FastifyInstance } from 'fastify'
import { db } from '../../lib/supabase'

export async function leaveRoutes(app: FastifyInstance) {

  app.get('/', async (request, reply) => {
    try {
      const { data, error } = await db
        .from('leave_requests')
        .select('*, employee:employees(*, user:users(*))')
      if (error) return reply.status(500).send({ success: false, error: error.message })
      return { success: true, data: data || [], count: data?.length || 0 }
    } catch (e: any) {
      reply.status(500).send({ success: false, error: e.message })
    }
  })

  app.post('/', async (request: any, reply) => {
    try {
      const { employeeId, leaveType, startDate, endDate, reason } = request.body
      const { data, error } = await db
        .from('leave_requests')
        .insert({
          tenantId: '55ac8fa1-60e1-47f4-8dab-3dfdb3ec1f23',
          employeeId, leaveType, startDate, endDate,
          reason: reason || null,
          status: 'PENDING'
        })
        .select()
        .single()
      if (error) return reply.status(500).send({ success: false, error: error.message })
      return reply.status(201).send({ success: true, data })
    } catch (e: any) {
      reply.status(500).send({ success: false, error: e.message })
    }
  })

  app.put('/:id/status', async (request: any, reply) => {
    try {
      const { status, approvedBy } = request.body
      const { data, error } = await db
        .from('leave_requests')
        .update({ status, approvedBy })
        .eq('id', request.params.id)
        .select()
        .single()
      if (error) return reply.status(500).send({ success: false, error: error.message })
      return { success: true, data }
    } catch (e: any) {
      reply.status(500).send({ success: false, error: e.message })
    }
  })
}
