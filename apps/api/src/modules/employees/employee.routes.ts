import { FastifyInstance } from 'fastify'
import { prisma } from '../../lib/prisma'

export async function employeeRoutes(app: FastifyInstance) {

  // GET all employees
  app.get('/', async (request, reply) => {
    try {
      const employees = await prisma.employee.findMany({
        include: { user: true, department: true }
      })
      return { success: true, data: employees, count: employees.length }
    } catch (error) {
      reply.status(500).send({ success: false, error: 'Failed to fetch employees' })
    }
  })

  // GET single employee
  app.get('/:id', async (request: any, reply) => {
    try {
      const employee = await prisma.employee.findUnique({
        where: { id: request.params.id },
        include: { user: true, department: true }
      })
      if (!employee) return reply.status(404).send({ success: false, error: 'Employee not found' })
      return { success: true, data: employee }
    } catch (error) {
      reply.status(500).send({ success: false, error: 'Failed to fetch employee' })
    }
  })

  // POST create employee
  app.post('/', async (request: any, reply) => {
    try {
      const { firstName, lastName, email, employeeCode, departmentId, designation, phone, salary } = request.body
      
      const user = await prisma.user.create({
        data: {
          tenantId: '55ac8fa1-60e1-47f4-8dab-3dfdb3ec1f23',
          email,
          firstName,
          lastName,
          role: 'EMPLOYEE'
        }
      })

      const employee = await prisma.employee.create({
        data: {
          tenantId: '55ac8fa1-60e1-47f4-8dab-3dfdb3ec1f23',
          userId: user.id,
          employeeCode,
          departmentId: departmentId || null,
          designation: designation || null,
          phone: phone || null,
          salary: salary || null,
        },
        include: { user: true, department: true }
      })
      return reply.status(201).send({ success: true, data: employee })
    } catch (error: any) {
      reply.status(500).send({ success: false, error: error.message })
    }
  })

  // PUT update employee
  app.put('/:id', async (request: any, reply) => {
    try {
      const { designation, phone, salary, departmentId } = request.body
      const employee = await prisma.employee.update({
        where: { id: request.params.id },
        data: { designation, phone, salary, departmentId },
        include: { user: true, department: true }
      })
      return { success: true, data: employee }
    } catch (error: any) {
      reply.status(500).send({ success: false, error: error.message })
    }
  })

  // DELETE employee
  app.delete('/:id', async (request: any, reply) => {
    try {
      await prisma.employee.delete({ where: { id: request.params.id } })
      return { success: true, message: 'Employee deleted' }
    } catch (error: any) {
      reply.status(500).send({ success: false, error: error.message })
    }
  })
}
