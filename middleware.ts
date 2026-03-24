import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const SECRET_KEY = process.env.JWT_SECRET || 'default-secret-key-that-should-be-changed-in-production'
const key = new TextEncoder().encode(SECRET_KEY)

export async function middleware(request: NextRequest) {
  const session = request.cookies.get('session')?.value

  if (!session && !request.nextUrl.pathname.startsWith('/login') && !request.nextUrl.pathname.startsWith('/init-admin')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (session) {
    try {
      await jwtVerify(session, key, {
        algorithms: ['HS256'],
      })
      
      // If valid session and on login page, redirect to home
      if (request.nextUrl.pathname.startsWith('/login')) {
        return NextResponse.redirect(new URL('/', request.url))
      }
    } catch (err) {
      // Invalid session, delete it and redirect to login if not already there
      const response = NextResponse.redirect(new URL('/login', request.url))
      response.cookies.delete('session')
      
      if (!request.nextUrl.pathname.startsWith('/login') && !request.nextUrl.pathname.startsWith('/init-admin')) {
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
