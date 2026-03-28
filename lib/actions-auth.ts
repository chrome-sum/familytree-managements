'use server'

import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import sql from './db'
import { encrypt, decrypt } from './auth'
import { revalidatePath } from 'next/cache'
import { requireRole, requireSession } from './permissions'
import { UserAccount, UserRole } from './types'
import { logAudit } from './audit'

type DbUser = {
  id: string
  email: string
  password: string
  role: UserRole | null
}

type AuthStatus = {
  isLoggedIn: boolean
  role: UserRole | null
  email: string | null
}

type ExistingUser = Pick<DbUser, 'id' | 'role'>

function normalizeRole(role: string | null | undefined): UserRole {
  if (role === 'admin' || role === 'editor' || role === 'viewer') return role
  return 'viewer'
}

async function ensureUsersRoleColumn() {
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT`
  await sql`
    UPDATE users
    SET role = 'admin'
    WHERE role IS NULL
      AND NOT EXISTS (
        SELECT 1
        FROM users
        WHERE role = 'admin'
      )
  `
  await sql`UPDATE users SET role = 'viewer' WHERE role IS NULL`
  await sql`ALTER TABLE users ALTER COLUMN role SET DEFAULT 'viewer'`
}

async function countAdmins() {
  const [result] = await sql<{ count: string }[]>`
    SELECT COUNT(*)::text AS count
    FROM users
    WHERE role = 'admin'
  `

  return Number(result?.count || 0)
}

async function findUserById(userId: string): Promise<ExistingUser | null> {
  const [user] = await sql<ExistingUser[]>`
    SELECT id, role
    FROM users
    WHERE id = ${userId}
    LIMIT 1
  `

  return user ?? null
}

export async function hasAnyAdmin() {
  await ensureUsersRoleColumn()
  const totalAdmins = await countAdmins()
  return totalAdmins > 0
}

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  try {
    await ensureUsersRoleColumn()
    const [user] = await sql<DbUser[]>`
      SELECT id, email, password, role
      FROM users
      WHERE email = ${email}
    `

    if (!user || !bcrypt.compareSync(password, user.password)) {
      return { error: 'Email atau password salah' }
    }

    const role = normalizeRole(user.role)
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000)
    const session = await encrypt({ id: user.id, email: user.email, role, expires })

    const cookieStore = await cookies()
    cookieStore.set('session', session, {
      expires,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    })

    revalidatePath('/')
    return { success: true, role }
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

export async function getAuthStatus(): Promise<AuthStatus> {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')?.value
  if (!session) return { isLoggedIn: false, role: null, email: null }

  try {
    const payload = await decrypt(session)
    return { isLoggedIn: true, role: normalizeRole(payload.role), email: payload.email }
  } catch {
    return { isLoggedIn: false, role: null, email: null }
  }
}

export async function checkAuthStatus() {
  const status = await getAuthStatus()
  return status.isLoggedIn
}

export async function createAdmin(email: string, pass: string) {
  try {
    await ensureUsersRoleColumn()
    if (await hasAnyAdmin()) {
      return { error: 'Bootstrap admin sudah dinonaktifkan karena admin pertama sudah ada.' }
    }

    if (!email || !pass) {
      return { error: 'Email dan password wajib diisi.' }
    }

    if (pass.length < 6) {
      return { error: 'Password minimal 6 karakter.' }
    }

    const hashed = bcrypt.hashSync(pass, 10)
    await sql`
      INSERT INTO users (email, password, role)
      VALUES (${email}, ${hashed}, 'admin')
    `
    await logAudit({
      actorEmail: email,
      actorRole: 'admin',
      action: 'BOOTSTRAP_ADMIN',
      targetType: 'user',
      details: { email },
    })
    return { success: true }
  } catch (err) {
    console.error('Create admin error:', err)
    return { error: 'Gagal membuat admin' }
  }
}

export async function changePassword(oldPass: string, newPass: string) {
  try {
    const session = await requireSession()
    const [user] = await sql<DbUser[]>`SELECT * FROM users WHERE id = ${session.id}`
    if (!user || !bcrypt.compareSync(oldPass, user.password)) {
      return { error: 'Password lama salah' }
    }

    const hashed = bcrypt.hashSync(newPass, 10)
    await sql`UPDATE users SET password = ${hashed} WHERE id = ${session.id}`
    await logAudit({
      actorId: session.id,
      actorEmail: session.email,
      actorRole: session.role,
      action: 'CHANGE_OWN_PASSWORD',
      targetType: 'user',
      targetId: session.id,
    })
    return { success: true }
  } catch (err) {
    console.error('Change password error:', err)
    return { error: 'Terjadi kesalahan saat mengganti password' }
  }
}

export async function listUsersByAdmin(): Promise<UserAccount[]> {
  await ensureUsersRoleColumn()
  await requireRole(['admin'])

  const users = await sql<UserAccount[]>`
    SELECT id, email, role, created_at
    FROM users
    ORDER BY created_at ASC
  `

  return users.map((user) => ({ ...user, role: normalizeRole(user.role) }))
}

export async function createUserByAdmin(email: string, password: string, role: UserRole) {
  await ensureUsersRoleColumn()
  const session = await requireRole(['admin'])

  const normalizedRole = normalizeRole(role)
  const hashed = bcrypt.hashSync(password, 10)

  try {
    await sql`
      INSERT INTO users (email, password, role)
      VALUES (${email}, ${hashed}, ${normalizedRole})
    `
    await logAudit({
      actorId: session.id,
      actorEmail: session.email,
      actorRole: session.role,
      action: 'CREATE_USER',
      targetType: 'user',
      details: { email, role: normalizedRole },
    })
    revalidatePath('/users')
    return { success: true }
  } catch (err) {
    console.error('Create user error:', err)
    return { error: 'Gagal membuat user. Pastikan email belum terdaftar.' }
  }
}

export async function updateUserRoleByAdmin(userId: string, role: UserRole) {
  await ensureUsersRoleColumn()
  const session = await requireRole(['admin'])

  if (session.id === userId && role !== 'admin') {
    return { error: 'Admin tidak bisa menurunkan rolenya sendiri.' }
  }

  const targetUser = await findUserById(userId)

  if (!targetUser) {
    return { error: 'User tidak ditemukan.' }
  }

  if (normalizeRole(targetUser.role) === 'admin' && role !== 'admin') {
    const totalAdmins = await countAdmins()
    if (totalAdmins <= 1) {
      return { error: 'Minimal harus ada satu admin aktif.' }
    }
  }

  const normalizedRole = normalizeRole(role)
  const [updatedUser] = await sql<ExistingUser[]>`
    UPDATE users
    SET role = ${normalizedRole}
    WHERE id = ${userId}
    RETURNING id, role
  `

  if (!updatedUser) {
    return { error: 'User tidak ditemukan.' }
  }

  await logAudit({
    actorId: session.id,
    actorEmail: session.email,
    actorRole: session.role,
    action: 'UPDATE_USER_ROLE',
    targetType: 'user',
    targetId: userId,
    details: { role: normalizedRole },
  })
  revalidatePath('/users')
  return { success: true }
}

export async function updateUserPasswordByAdmin(userId: string, newPassword: string) {
  const session = await requireRole(['admin'])

  if (newPassword.length < 6) {
    return { error: 'Password minimal 6 karakter.' }
  }

  const targetUser = await findUserById(userId)
  if (!targetUser) {
    return { error: 'User tidak ditemukan.' }
  }

  const hashed = bcrypt.hashSync(newPassword, 10)
  const [updatedUser] = await sql<Pick<DbUser, 'id'>[]>`
    UPDATE users
    SET password = ${hashed}
    WHERE id = ${userId}
    RETURNING id
  `

  if (!updatedUser) {
    return { error: 'User tidak ditemukan.' }
  }

  await logAudit({
    actorId: session.id,
    actorEmail: session.email,
    actorRole: session.role,
    action: 'RESET_USER_PASSWORD',
    targetType: 'user',
    targetId: userId,
  })
  revalidatePath('/users')
  return { success: true }
}

export async function deleteUserByAdmin(userId: string) {
  const session = await requireRole(['admin'])

  if (session.id === userId) {
    return { error: 'Admin tidak bisa menghapus akun sendiri.' }
  }

  const targetUser = await findUserById(userId)

  if (!targetUser) {
    return { error: 'User tidak ditemukan.' }
  }

  if (normalizeRole(targetUser.role) === 'admin') {
    const totalAdmins = await countAdmins()
    if (totalAdmins <= 1) {
      return { error: 'Minimal harus ada satu admin aktif.' }
    }
  }

  const [deletedUser] = await sql<Pick<DbUser, 'id'>[]>`
    DELETE FROM users
    WHERE id = ${userId}
    RETURNING id
  `

  if (!deletedUser) {
    return { error: 'User tidak ditemukan.' }
  }

  await logAudit({
    actorId: session.id,
    actorEmail: session.email,
    actorRole: session.role,
    action: 'DELETE_USER',
    targetType: 'user',
    targetId: userId,
  })
  revalidatePath('/users')
  return { success: true }
}
