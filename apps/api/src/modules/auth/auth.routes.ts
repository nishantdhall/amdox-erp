import { FastifyInstance } from 'fastify'
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '../../.env' })

const supabaseUrl = process.env.SUPABASE_URL || 'https://qrqdavorzpxwvaxflpbu.supabase.co'
const supabaseKey = process.env.SUPABASE_ANON_KEY || ''

const supabase = createClient(supabaseUrl, supabaseKey)

export async function authRoutes(app: FastifyInstance) {

  app.post('/register', async (request: any, reply) => {
    try {
      const { email, password, firstName, lastName } = request.body
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: { data: { firstName, lastName } }
      })
      if (error) return reply.status(400).send({ success: false, error: error.message })
      return reply.status(201).send({ success: true, data: { user: data.user } })
    } catch (error: any) {
      reply.status(500).send({ success: false, error: error.message })
    }
  })

  app.post('/login', async (request: any, reply) => {
    try {
      const { email, password } = request.body
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) return reply.status(401).send({ success: false, error: error.message })
      return { success: true, data: { user: data.user, token: data.session?.access_token } }
    } catch (error: any) {
      reply.status(500).send({ success: false, error: error.message })
    }
  })

  app.post('/logout', async (request: any, reply) => {
    try {
      await supabase.auth.signOut()
      return { success: true, message: 'Logged out successfully' }
    } catch (error: any) {
      reply.status(500).send({ success: false, error: error.message })
    }
  })

  app.get('/me', async (request: any, reply) => {
    try {
      const authHeader = request.headers.authorization
      if (!authHeader) return reply.status(401).send({ success: false, error: 'No token provided' })
      const token = authHeader.replace('Bearer ', '')
      const { data, error } = await supabase.auth.getUser(token)
      if (error) return reply.status(401).send({ success: false, error: 'Invalid token' })
      return { success: true, data: data.user }
    } catch (error: any) {
      reply.status(500).send({ success: false, error: error.message })
    }
  })
}
