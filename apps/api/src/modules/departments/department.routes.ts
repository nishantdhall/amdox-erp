import { FastifyInstance } from 'fastify'
import { prisma } from '../../lib/prisma'

export async function departmentRoutes(app: FastifyInstance) {

  // GET all departments
  app.get('/', async (request, reply) => {
    try {
      const departments = await prisma.department.findMany({
        include: { employees: true }
      })
      return { success: true, data: departments, count: departments.length }
    } catch (error) {
      reply.status(500).send({ success: false, error: 'Failed to fetch departments' })
    }
  })

  // GET single department
  app.get('/:id', async (request: any, reply) => {
    try {
      const department = await prisma.department.findUnique({
        where: { id: request.params.id },
        include: { employees: true }
      })
      if (!department) return reply.status(404).send({ success: false, error: 'Department not found' })
      return { success: true, data: department }
    } catch (error) {
      reply.status(500).send({ success: false, error: 'Failed to fetch department' })
    }
  })

  // POST create department
  app.post('/', async (request: any, reply) => {
    try {
      const { name, code, managerId } = request.body
      const department = await prisma.department.create({
        data: {
          tenantId: 'default-tenant',
          name,
          code,
          managerId: managerId || null,
        }
      })
      return reply.status(201).send({ success: true, data: department })
    } catch (error: any) {
      reply.status(500).send({ success: false, error: error.message })
    }
  })

  // PUT update department
  app.put('/:id', async (request: any, reply) => {
    try {
      const { name, code, managerId } = request.body
      const department = await prisma.department.update({
        where: { id: request.params.id },
        data: { name, code, managerId },
      })
      return { success: true, data: department }
    } catch (error: any) {
      reply.status(500).send({ success: false, error: error.message })
    }
  })

  // DELETE department
  app.delete('/:id', async (request: any, reply) => {
    try {
      await prisma.department.delete({ where: { id: request.params.id } })
      return { success: true, message: 'Department deleted' }
    } catch (error: any) {
      reply.status(500).send({ success: false, error: error.message })
    }
  })
}
