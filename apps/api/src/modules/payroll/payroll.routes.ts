import { FastifyInstance } from 'fastify'
import { db } from '../../lib/supabase'

export async function payrollRoutes(app: FastifyInstance) {

  app.get('/', async (request, reply) => {
    try {
      const { data, error } = await db
        .from('payrolls')
        .select('*, employee:employees(*, user:users(*))')
      if (error) return reply.status(500).send({ success: false, error: error.message })
      return { success: true, data: data || [], count: data?.length || 0 }
    } catch (e: any) {
      reply.status(500).send({ success: false, error: e.message })
    }
  })

  app.post('/generate', async (request: any, reply) => {
    try {
      const { employeeId, payrollMonth, basicSalary, allowances, deductions } = request.body
      const tax = basicSalary * 0.1
      const net = basicSalary + (allowances || 0) - (deductions || 0) - tax
      const { data, error } = await db
        .from('payrolls')
        .insert({
          tenantId: '55ac8fa1-60e1-47f4-8dab-3dfdb3ec1f23',
          employeeId, payrollMonth,
          basicSalary, allowances: allowances || 0,
          deductions: deductions || 0,
          taxAmount: tax, netSalary: net,
          status: 'GENERATED'
        })
        .select()
        .single()
      if (error) return reply.status(500).send({ success: false, error: error.message })
      return reply.status(201).send({ success: true, data })
    } catch (e: any) {
      reply.status(500).send({ success: false, error: e.message })
    }
  })

  app.get('/employee/:employeeId', async (request: any, reply) => {
    try {
      const { data, error } = await db
        .from('payrolls')
        .select('*')
        .eq('employeeId', request.params.employeeId)
        .order('createdAt', { ascending: false })
      if (error) return reply.status(500).send({ success: false, error: error.message })
      return { success: true, data: data || [] }
    } catch (e: any) {
      reply.status(500).send({ success: false, error: e.message })
    }
  })
}
