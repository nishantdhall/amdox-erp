import { FastifyInstance } from 'fastify'
import { prisma } from '../../lib/prisma'

export async function attendanceRoutes(app: FastifyInstance) {

  // GET all attendance
  app.get('/', async (request, reply) => {
    try {
      const records = await prisma.attendance.findMany({
        include: { employee: { include: { user: true } } }
      })
      return { success: true, data: records, count: records.length }
    } catch (error: any) {
      reply.status(500).send({ success: false, error: error.message })
    }
  })

  // POST mark attendance
  app.post('/', async (request: any, reply) => {
    try {
      const { employeeId, attendanceDate, clockIn, clockOut, status } = request.body
      const record = await prisma.attendance.create({
        data: {
          tenantId: '55ac8fa1-60e1-47f4-8dab-3dfdb3ec1f23',
          employeeId,
          attendanceDate: new Date(attendanceDate),
          clockIn: clockIn ? new Date(clockIn) : null,
          clockOut: clockOut ? new Date(clockOut) : null,
          status: status || 'PRESENT'
        }
      })
      return reply.status(201).send({ success: true, data: record })
    } catch (error: any) {
      reply.status(500).send({ success: false, error: error.message })
    }
  })

  // GET employee attendance
  app.get('/employee/:employeeId', async (request: any, reply) => {
    try {
      const records = await prisma.attendance.findMany({
        where: { employeeId: request.params.employeeId },
        orderBy: { attendanceDate: 'desc' }
      })
      return { success: true, data: records, count: records.length }
    } catch (error: any) {
      reply.status(500).send({ success: false, error: error.message })
    }
  })
}
