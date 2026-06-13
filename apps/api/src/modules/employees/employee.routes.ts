import { FastifyInstance } from 'fastify'
export async function employeeRoutes(app: FastifyInstance) {
  app.get('/', async () => ({ message: 'Get all employees', data: [] }))
  app.post('/', async (req: any) => ({ message: 'Employee created', data: req.body }))
  app.get('/:id', async (req: any) => ({ message: 'Get employee', id: req.params.id }))
  app.put('/:id', async (req: any) => ({ message: 'Employee updated', id: req.params.id }))
  app.delete('/:id', async (req: any) => ({ message: 'Employee deleted', id: req.params.id }))
}
