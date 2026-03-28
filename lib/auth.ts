import { SignJWT, jwtVerify } from 'jose'
import type { JWTPayload } from 'jose'
import { cookies } from 'next/headers'
import { SessionUser, UserRole } from './types'

function getJwtKey() {
  const secretKey = process.env.JWT_SECRET
  if (!secretKey) {
    throw new Error('JWT_SECRET should set on env files!')
  }

  return new TextEncoder().encode(secretKey)
}

export async function encrypt(payload: SessionUser) {
  const jwtPayload: JWTPayload & Pick<SessionUser, 'id' | 'email' | 'role'> = {
    id: payload.id,
    email: payload.email,
    role: payload.role,
  }

  return await new SignJWT(jwtPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(getJwtKey())
}

export async function decrypt(input: string): Promise<SessionUser> {
  const { payload } = await jwtVerify(input, getJwtKey(), {
    algorithms: ['HS256'],
  })

  return {
    id: String(payload.id),
    email: String(payload.email),
    role: (payload.role as UserRole) || 'viewer',
    expires: payload.expires ? String(payload.expires) : undefined,
  }
}

export async function getSession() {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')?.value
  if (!session) return null
  try {
    return await decrypt(session)
  } catch {
    return null
  }
}
