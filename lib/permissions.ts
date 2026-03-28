import { getSession } from './auth'
import { SessionUser, UserRole } from './types'
import sql from './db'
import {
  TREE_EDITOR_ROLES,
  ADMIN_ROLES,
  VIEWER_ROLES,
  hasRole,
  canManageTree,
  canManageUsers,
  canViewTree,
} from './rbac-policy'
export {
  TREE_EDITOR_ROLES,
  ADMIN_ROLES,
  VIEWER_ROLES,
  hasRole,
  canManageTree,
  canManageUsers,
  canViewTree,
}

type DbUserRoleRow = {
  id: string
  email: string
  role: UserRole | null
}

async function getCurrentUserFromDb(session: SessionUser): Promise<SessionUser> {
  const [user] = await sql<DbUserRoleRow[]>`
    SELECT id, email, role
    FROM users
    WHERE id = ${session.id}
    LIMIT 1
  `

  if (!user) {
    throw new Error('Unauthorized: User tidak ditemukan')
  }

  const role = user.role === 'admin' || user.role === 'editor' || user.role === 'viewer'
    ? user.role
    : 'viewer'

  return {
    ...session,
    id: user.id,
    email: user.email,
    role,
  }
}

export async function requireSession(): Promise<SessionUser> {
  const session = await getSession()
  if (!session) {
    throw new Error('Unauthorized: Harus login')
  }
  return getCurrentUserFromDb(session)
}

export async function requireRole(allowedRoles: UserRole[]): Promise<SessionUser> {
  const session = await requireSession()
  if (!hasRole(session.role, allowedRoles)) {
    throw new Error('Forbidden: Anda tidak memiliki izin')
  }
  return session
}
