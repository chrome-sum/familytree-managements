import type { JSONValue } from 'postgres'
import sql from './db'
import { UserRole } from './types'

type AuditPayload = {
  actorId?: string | null
  actorEmail?: string | null
  actorRole?: UserRole | null
  action: string
  targetType: string
  targetId?: string | null
  details?: JSONValue
}

export async function ensureAuditTable() {
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      actor_id UUID,
      actor_email TEXT,
      actor_role TEXT,
      action TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT,
      details JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)
}

export async function logAudit(payload: AuditPayload) {
  try {
    await ensureAuditTable()
    await sql`
      INSERT INTO audit_logs (
        actor_id,
        actor_email,
        actor_role,
        action,
        target_type,
        target_id,
        details
      ) VALUES (
        ${payload.actorId || null},
        ${payload.actorEmail || null},
        ${payload.actorRole || null},
        ${payload.action},
        ${payload.targetType},
        ${payload.targetId || null},
        ${sql.json(payload.details || {})}
      )
    `
  } catch (err) {
    console.error('Audit log error:', err)
  }
}

