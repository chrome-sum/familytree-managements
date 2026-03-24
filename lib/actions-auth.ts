'use server'

import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import sql from './db'
import { encrypt, decrypt } from './auth'
import { revalidatePath } from 'next/cache'

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  try {
    const [user] = await sql`SELECT * FROM users WHERE email = ${email}`
    if (!user || !bcrypt.compareSync(password, user.password as string)) {
      return { error: 'Email atau password salah' }
    }

    // Create session
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000)
    const session = await encrypt({ id: user.id, email: user.email, expires })

    // Save in cookie
    const cookieStore = await cookies()
    cookieStore.set('session', session, { 
      expires, 
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    })

    revalidatePath('/')
    return { success: true }
  } catch (err) {
    console.error('Login error:', err)
    return { error: 'Terjadi kesalahan sistem' }
  }
}

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.set('session', '', { expires: new Date(0), path: '/' })
  revalidatePath('/')
}

export async function checkAuthStatus() {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')?.value
  if (!session) return false
  
  try {
    await decrypt(session)
    return true
  } catch (e) {
    return false
  }
}

// Temporary debug function to create an admin user
export async function createAdmin(email: string, pass: string) {
  const hashed = bcrypt.hashSync(pass, 10)
  try {
    await sql`
      INSERT INTO users (email, password) 
      VALUES (${email}, ${hashed}) 
      ON CONFLICT (email) DO UPDATE SET password = ${hashed}
    `
    return { success: true }
  } catch (err) {
    console.error('Create admin error:', err)
    return { error: 'Gagal membuat admin' }
  }
}

export async function changePassword(currentEmail: string, oldPass: string, newPass: string) {
  try {
    const [user] = await sql`SELECT * FROM users WHERE email = ${currentEmail}`
    if (!user || !bcrypt.compareSync(oldPass, user.password as string)) {
      return { error: 'Password lama salah' }
    }

    const hashed = bcrypt.hashSync(newPass, 10)
    await sql`UPDATE users SET password = ${hashed} WHERE email = ${currentEmail}`
    return { success: true }
  } catch (err) {
    console.error('Change password error:', err)
    return { error: 'Terjadi kesalahan saat mengganti password' }
  }
}
