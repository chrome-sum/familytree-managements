import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

function getJwtKey() {
  const secretKey = process.env.JWT_SECRET
  if (!secretKey) {
    throw new Error('JWT_SECRET should set on env files!')
  }

  return new TextEncoder().encode(secretKey)
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const session = request.cookies.get('session')?.value

  if (!session && !pathname.startsWith('/login') && !pathname.startsWith('/init-admin')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (session) {
    try {
      const { payload } = await jwtVerify(session, getJwtKey(), {
        algorithms: ['HS256'],
      })
      const role = typeof payload.role === 'string' ? payload.role : 'viewer'

      if ((pathname.startsWith('/users') || pathname.startsWith('/audit-logs')) && role !== 'admin') {
        return NextResponse.redirect(new URL('/', request.url))
      }

      if (pathname.startsWith('/login')) {
        return NextResponse.redirect(new URL('/', request.url))
      }
    } catch {
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
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
