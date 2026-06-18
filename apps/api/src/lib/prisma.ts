import { PrismaClient } from '@prisma/client'

process.env.DATABASE_URL = "postgresql://postgres.qrqdavorzpxwvaxflpbu:NishuERP2026@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"

export const prisma = new PrismaClient()
