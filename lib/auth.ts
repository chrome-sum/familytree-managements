import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { SessionUser, UserRole } from './types'

const SECRET_KEY = process.env.JWT_SECRET
const key = new TextEncoder().encode(SECRET_KEY)

if (!SECRET_KEY) throw new Error("JWT_SECRET should set on env files!");

export async function encrypt(payload: SessionUser) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(key)
}

export async function decrypt(input: string): Promise<SessionUser> {
  const { payload } = await jwtVerify(input, key, {
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
