import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import * as dotenv from 'dotenv'
import { employeeRoutes } from './modules/employees/employee.routes'
import { departmentRoutes } from './modules/departments/department.routes'
dotenv.config({ path: '../../.env' })
const app = Fastify({ logger: true })
app.register(cors, { origin: true })
app.register(helmet)
app.register(employeeRoutes, { prefix: '/api/v1/employees' })
app.register(departmentRoutes, { prefix: '/api/v1/departments' })
app.get('/api/v1/health', async () => ({ status: 'ok', service: 'AMDOX ERP API', framework: 'Fastify', timestamp: new Date().toISOString() }))
const start = async () => { try { await app.listen({ port: Number(process.env.PORT) || 3001, host: '0.0.0.0' }); console.log('🚀 API running on http://localhost:3001') } catch (err) { app.log.error(err); process.exit(1) } }
start()
