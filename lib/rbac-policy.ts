import { UserRole } from './types'

export const TREE_EDITOR_ROLES: UserRole[] = ['admin', 'editor']
export const ADMIN_ROLES: UserRole[] = ['admin']
export const VIEWER_ROLES: UserRole[] = ['admin', 'editor', 'viewer']

export function hasRole(role: UserRole, allowed: UserRole[]) {
  return allowed.includes(role)
}

export function canManageTree(role: UserRole | null | undefined) {
  return !!role && hasRole(role, TREE_EDITOR_ROLES)
}

export function canManageUsers(role: UserRole | null | undefined) {
  return !!role && hasRole(role, ADMIN_ROLES)
}

export function canViewTree(role: UserRole | null | undefined) {
  return !!role && hasRole(role, VIEWER_ROLES)
}

