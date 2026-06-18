import { FastifyInstance } from 'fastify'
import { db } from '../../lib/supabase'

export async function employeeRoutes(app: FastifyInstance) {

  app.get('/', async (request, reply) => {
    try {
      const { data, error } = await db
        .from('employees')
        .select('*, user:users(*), department:departments(*)')
      if (error) return reply.status(500).send({ success: false, error: error.message })
      return { success: true, data: data || [], count: data?.length || 0 }
    } catch (e: any) {
      reply.status(500).send({ success: false, error: e.message })
    }
  })

  app.get('/:id', async (request: any, reply) => {
    try {
      const { data, error } = await db
        .from('employees')
        .select('*, user:users(*), department:departments(*)')
        .eq('id', request.params.id)
        .single()
      if (error) return reply.status(404).send({ success: false, error: 'Employee not found' })
      return { success: true, data }
    } catch (e: any) {
      reply.status(500).send({ success: false, error: e.message })
    }
  })

  app.post('/', async (request: any, reply) => {
    try {
      const { firstName, lastName, email, employeeCode, departmentId, designation, phone, salary } = request.body
      const tenantId = '55ac8fa1-60e1-47f4-8dab-3dfdb3ec1f23'

      const { data: user, error: userErr } = await db
        .from('users')
        .insert({ tenantId, email, firstName, lastName, role: 'EMPLOYEE', status: 'ACTIVE' })
        .select()
        .single()
      if (userErr) return reply.status(500).send({ success: false, error: userErr.message })

      const { data: employee, error: empErr } = await db
        .from('employees')
        .insert({
          tenantId,
          userId: user.id,
          employeeCode,
          departmentId: departmentId || null,
          designation: designation || null,
          phone: phone || null,
          salary: salary || null,
          status: 'ACTIVE'
        })
        .select('*, user:users(*), department:departments(*)')
        .single()
      if (empErr) return reply.status(500).send({ success: false, error: empErr.message })
      return reply.status(201).send({ success: true, data: employee })
    } catch (e: any) {
      reply.status(500).send({ success: false, error: e.message })
    }
  })

  app.put('/:id', async (request: any, reply) => {
    try {
      const { designation, phone, salary, departmentId } = request.body
      const { data, error } = await db
        .from('employees')
        .update({ designation, phone, salary, departmentId })
        .eq('id', request.params.id)
        .select('*, user:users(*), department:departments(*)')
        .single()
      if (error) return reply.status(500).send({ success: false, error: error.message })
      return { success: true, data }
    } catch (e: any) {
      reply.status(500).send({ success: false, error: e.message })
    }
  })

  app.delete('/:id', async (request: any, reply) => {
    try {
      const { error } = await db.from('employees').delete().eq('id', request.params.id)
      if (error) return reply.status(500).send({ success: false, error: error.message })
      return { success: true, message: 'Employee deleted' }
    } catch (e: any) {
      reply.status(500).send({ success: false, error: e.message })
    }
  })
}
