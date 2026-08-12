import { NextResponse, type NextRequest } from 'next/server'
import { SESSION_COOKIE, requiredRoleFor, satisfiesRole, verifySession } from '@/lib/auth/tokens'

/**
 * Edge middleware: authentication gate + coarse role check on page routes.
 *
 * This is defence in depth, not the only check — every API route and server
 * action re-verifies the session and the specific permission it needs.
 */

const PUBLIC_PATHS = ['/login', '/api/v1/health', '/api/v1/openapi.json', '/api/v1/auth/login', '/manifest.webmanifest', '/sw.js', '/offline']

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (isPublic(pathname)) return NextResponse.next()

  const session = verifySession(request.cookies.get(SESSION_COOKIE)?.value)

  if (!session) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: { code: 'unauthenticated', message: 'A valid session is required.' } },
        { status: 401 },
      )
    }
    const loginUrl = new URL('/login', request.url)
    if (pathname !== '/') loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // A session issued before the second factor was confirmed can reach nothing
  // but the MFA step itself.
  if (!session.mfaVerified) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: { code: 'mfa_required', message: 'Second-factor verification is required.' } },
        { status: 403 },
      )
    }
    const mfaUrl = new URL('/login', request.url)
    mfaUrl.searchParams.set('step', 'mfa')
    return NextResponse.redirect(mfaUrl)
  }

  const required = requiredRoleFor(pathname)
  if (required && !satisfiesRole(session.role, required)) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: { code: 'forbidden', message: `Role "${required}" or higher is required.` } },
        { status: 403 },
      )
    }
    return NextResponse.redirect(new URL('/forbidden', request.url))
  }

  // Surface identity to downstream handlers for logging.
  const response = NextResponse.next()
  response.headers.set('x-amdox-tenant', session.tenantId)
  response.headers.set('x-amdox-role', session.role)
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons/|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)'],
}
