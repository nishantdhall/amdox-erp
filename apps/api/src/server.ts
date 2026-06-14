import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import * as dotenv from 'dotenv'
import { employeeRoutes } from './modules/employees/employee.routes'
import { departmentRoutes } from './modules/departments/department.routes'
import { attendanceRoutes } from './modules/attendance/attendance.routes'
import { leaveRoutes } from './modules/leave/leave.routes'
import { payrollRoutes } from './modules/payroll/payroll.routes'
import { authRoutes } from './modules/auth/auth.routes'

dotenv.config({ path: '../../.env' })

const app = Fastify({ logger: true })

app.register(cors, { origin: true })
app.register(helmet)

// Auth routes
app.register(authRoutes, { prefix: '/api/v1/auth' })

// HR routes
app.register(employeeRoutes, { prefix: '/api/v1/employees' })
app.register(departmentRoutes, { prefix: '/api/v1/departments' })
app.register(attendanceRoutes, { prefix: '/api/v1/attendance' })
app.register(leaveRoutes, { prefix: '/api/v1/leave' })
app.register(payrollRoutes, { prefix: '/api/v1/payroll' })

app.get('/api/v1/health', async () => ({
  status: 'ok',
  service: 'AMDOX ERP API',
  framework: 'Fastify',
  database: 'Supabase PostgreSQL',
  timestamp: new Date().toISOString()
}))

const start = async () => {
  try {
    await app.listen({ port: Number(process.env.PORT) || 3001, host: '0.0.0.0' })
    console.log('🚀 API running on http://localhost:3001')
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
