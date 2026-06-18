import { FastifyInstance } from 'fastify'
import { db } from '../../lib/supabase'

export async function departmentRoutes(app: FastifyInstance) {

  app.get('/', async (request, reply) => {
    try {
      const { data, error } = await db.from('departments').select('*')
      if (error) return reply.status(500).send({ success: false, error: error.message })
      return { success: true, data: data || [], count: data?.length || 0 }
    } catch (e: any) {
      reply.status(500).send({ success: false, error: e.message })
    }
  })

  app.get('/:id', async (request: any, reply) => {
    try {
      const { data, error } = await db.from('departments').select('*').eq('id', request.params.id).single()
      if (error) return reply.status(404).send({ success: false, error: 'Not found' })
      return { success: true, data }
    } catch (e: any) {
      reply.status(500).send({ success: false, error: e.message })
    }
  })

  app.post('/', async (request: any, reply) => {
    try {
      const { name, code, managerId } = request.body
      const { data, error } = await db
        .from('departments')
        .insert({ tenantId: '55ac8fa1-60e1-47f4-8dab-3dfdb3ec1f23', name, code, managerId: managerId || null, status: 'ACTIVE' })
        .select()
        .single()
      if (error) return reply.status(500).send({ success: false, error: error.message })
      return reply.status(201).send({ success: true, data })
    } catch (e: any) {
      reply.status(500).send({ success: false, error: e.message })
    }
  })

  app.put('/:id', async (request: any, reply) => {
    try {
      const { name, code, managerId } = request.body
      const { data, error } = await db.from('departments').update({ name, code, managerId }).eq('id', request.params.id).select().single()
      if (error) return reply.status(500).send({ success: false, error: error.message })
      return { success: true, data }
    } catch (e: any) {
      reply.status(500).send({ success: false, error: e.message })
    }
  })

  app.delete('/:id', async (request: any, reply) => {
    try {
      const { error } = await db.from('departments').delete().eq('id', request.params.id)
      if (error) return reply.status(500).send({ success: false, error: error.message })
      return { success: true, message: 'Deleted' }
    } catch (e: any) {
      reply.status(500).send({ success: false, error: e.message })
    }
  })
}
