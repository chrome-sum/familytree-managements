'use server'

import sql from './db'
import { requireRole } from './permissions'
import { ensureAuditTable } from './audit'
import { AuditLog } from './types'

export async function listAuditLogsByAdmin(limit = 200): Promise<AuditLog[]> {
  await requireRole(['admin'])
  await ensureAuditTable()

  const safeLimit = Math.max(1, Math.min(limit, 1000))
  const logs = await sql<AuditLog[]>`
    SELECT id, actor_id, actor_email, actor_role, action, target_type, target_id, details, created_at
    FROM audit_logs
    ORDER BY created_at DESC
    LIMIT ${safeLimit}
  `

  return logs
}

