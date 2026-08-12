import { NextResponse, type NextRequest } from 'next/server'
import { openApiDocument } from '@/lib/api/openapi'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const origin = new URL(request.url).origin
  return NextResponse.json(openApiDocument(origin), {
    headers: { 'Cache-Control': 'public, max-age=300' },
  })
}
