import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const SECRET_KEY = process.env.JWT_SECRET
if (!SECRET_KEY) {
  throw new Error('JWT_SECRET should set on env files!')
}
const key = new TextEncoder().encode(SECRET_KEY)

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const session = request.cookies.get('session')?.value

  if (!session && !pathname.startsWith('/login') && !pathname.startsWith('/init-admin')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (session) {
    try {
      const { payload } = await jwtVerify(session, key, {
        algorithms: ['HS256'],
      })
      const role = typeof payload.role === 'string' ? payload.role : 'viewer'

      if ((pathname.startsWith('/users') || pathname.startsWith('/audit-logs')) && role !== 'admin') {
        return NextResponse.redirect(new URL('/', request.url))
      }
      
      // If valid session and on login page, redirect to home
      if (pathname.startsWith('/login')) {
        return NextResponse.redirect(new URL('/', request.url))
      }
    } catch {
      // Invalid session, delete it and redirect to login if not already there
      const response = NextResponse.redirect(new URL('/login', request.url))
      response.cookies.delete('session')
      
      if (!pathname.startsWith('/login') && !pathname.startsWith('/init-admin')) {
        return response
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
