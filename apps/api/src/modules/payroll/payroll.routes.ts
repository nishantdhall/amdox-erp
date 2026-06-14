import { FastifyInstance } from 'fastify'
import { prisma } from '../../lib/prisma'

export async function payrollRoutes(app: FastifyInstance) {

  // GET all payrolls
  app.get('/', async (request, reply) => {
    try {
      const payrolls = await prisma.payroll.findMany({
        include: { employee: { include: { user: true } } }
      })
      return { success: true, data: payrolls, count: payrolls.length }
    } catch (error: any) {
      reply.status(500).send({ success: false, error: error.message })
    }
  })

  // POST generate payroll
  app.post('/generate', async (request: any, reply) => {
    try {
      const { employeeId, payrollMonth, basicSalary, allowances, deductions } = request.body
      const taxAmount = (basicSalary * 0.1)
      const netSalary = basicSalary + (allowances || 0) - (deductions || 0) - taxAmount
      
      const payroll = await prisma.payroll.create({
        data: {
          tenantId: 'default-tenant',
          employeeId,
          payrollMonth,
          basicSalary,
          allowances: allowances || 0,
          deductions: deductions || 0,
          taxAmount,
          netSalary,
          status: 'GENERATED'
        }
      })
      return reply.status(201).send({ success: true, data: payroll })
    } catch (error: any) {
      reply.status(500).send({ success: false, error: error.message })
    }
  })

  // GET employee payroll history
  app.get('/employee/:employeeId', async (request: any, reply) => {
    try {
      const payrolls = await prisma.payroll.findMany({
        where: { employeeId: request.params.employeeId },
        orderBy: { createdAt: 'desc' }
      })
      return { success: true, data: payrolls }
    } catch (error: any) {
      reply.status(500).send({ success: false, error: error.message })
    }
  })
}
