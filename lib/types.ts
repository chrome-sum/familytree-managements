export type Gender = 'male' | 'female' | 'other'
export type Status = 'alive' | 'deceased'
export type UserRole = 'admin' | 'editor' | 'viewer'

export interface SessionUser {
  id: string
  email: string
  role: UserRole
  expires?: string | Date
}

export interface UserAccount {
  id: string
  email: string
  role: UserRole
  created_at: string
}

export interface AuditLog {
  id: string
  actor_id?: string | null
  actor_email?: string | null
  actor_role?: string | null
  action: string
  target_type: string
  target_id?: string | null
  details?: Record<string, unknown> | null
  created_at: string
}

export interface Person {
  id: string
  name: string
  birth_date?: string
  status: Status
  photo_url?: string
  gender?: Gender
  created_at: string
}

export interface Union {
  id: string
  partner1_id: string
  partner2_id: string
  type: string
}

export interface ParentChild {
  id: string
  union_id: string
  child_id: string
}

export interface TreeData {
  people: Person[]
  unions: Union[]
  parentChild: ParentChild[]
}
