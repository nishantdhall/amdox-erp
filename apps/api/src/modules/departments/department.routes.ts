import { FastifyInstance } from 'fastify'
export async function departmentRoutes(app: FastifyInstance) {
  app.get('/', async () => ({ message: 'Get all departments', data: [] }))
  app.post('/', async (req: any) => ({ message: 'Department created', data: req.body }))
  app.get('/:id', async (req: any) => ({ message: 'Get department', id: req.params.id }))
  app.put('/:id', async (req: any) => ({ message: 'Department updated', id: req.params.id }))
  app.delete('/:id', async (req: any) => ({ message: 'Department deleted', id: req.params.id }))
}
