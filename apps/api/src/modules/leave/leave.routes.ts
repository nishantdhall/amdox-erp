import { FastifyInstance } from 'fastify'
import { prisma } from '../../lib/prisma'

export async function leaveRoutes(app: FastifyInstance) {

  // GET all leave requests
  app.get('/', async (request, reply) => {
    try {
      const leaves = await prisma.leaveRequest.findMany({
        include: { employee: { include: { user: true } } }
      })
      return { success: true, data: leaves, count: leaves.length }
    } catch (error: any) {
      reply.status(500).send({ success: false, error: error.message })
    }
  })

  // POST apply leave
  app.post('/', async (request: any, reply) => {
    try {
      const { employeeId, leaveType, startDate, endDate, reason } = request.body
      const leave = await prisma.leaveRequest.create({
        data: {
          tenantId: '55ac8fa1-60e1-47f4-8dab-3dfdb3ec1f23',
          employeeId,
          leaveType,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          reason: reason || null,
          status: 'PENDING'
        }
      })
      return reply.status(201).send({ success: true, data: leave })
    } catch (error: any) {
      reply.status(500).send({ success: false, error: error.message })
    }
  })

  // PUT approve/reject leave
  app.put('/:id/status', async (request: any, reply) => {
    try {
      const { status, approvedBy } = request.body
      const leave = await prisma.leaveRequest.update({
        where: { id: request.params.id },
        data: { status, approvedBy }
      })
      return { success: true, data: leave }
    } catch (error: any) {
      reply.status(500).send({ success: false, error: error.message })
    }
  })
}
