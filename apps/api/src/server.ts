import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import * as dotenv from 'dotenv'

dotenv.config({ path: '../../.env' })

const app = Fastify({ logger: true })

app.register(cors, { origin: true })
app.register(helmet)

app.get('/api/v1/health', async () => {
  return {
    status: 'ok',
    service: 'AMDOX ERP API',
    framework: 'Fastify',
    database: 'Supabase PostgreSQL',
    timestamp: new Date().toISOString()
  }
})

const start = async () => {
  try {
    await app.listen({ port: Number(process.env.PORT) || 3001, host: '0.0.0.0' })
    console.log('🚀 AMDOX API running on http://localhost:3001')
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
