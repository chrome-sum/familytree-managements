'use server'

import sql from './db'
import { Person, Union, ParentChild, TreeData } from './types'
import { revalidatePath } from 'next/cache'
import { requireRole, requireSession, TREE_EDITOR_ROLES } from './permissions'
import { logAudit } from './audit'

async function requireTreeEditor() {
  return requireRole(TREE_EDITOR_ROLES)
}

export async function getTreeData(): Promise<TreeData> {
  await requireSession()
  const people = await sql<Person[]>`SELECT * FROM people ORDER BY created_at ASC`
  const unions = await sql<Union[]>`SELECT * FROM unions`
  const parentChild = await sql<ParentChild[]>`SELECT * FROM parent_child`
  
  return {
    people,
    unions,
    parentChild
  }
}

export async function addPerson(person: Partial<Person>) {
  const session = await requireTreeEditor()
  const { name, birth_date, status, photo_url, gender } = person
  const [newPerson] = await sql<Person[]>`
    INSERT INTO people (name, birth_date, status, photo_url, gender)
    VALUES (${name!}, ${birth_date || null}, ${status || 'alive'}, ${photo_url || null}, ${gender || 'other'})
    RETURNING *
  `
  await logAudit({
    actorId: session.id,
    actorEmail: session.email,
    actorRole: session.role,
    action: 'ADD_PERSON',
    targetType: 'person',
    targetId: newPerson.id,
    details: { name: newPerson.name },
  })
  revalidatePath('/')
  return newPerson
}

export async function addUnion(partner1_id: string, partner2_id: string, type: string = 'married') {
  const session = await requireTreeEditor()
  // Sort partner IDs to ensure partner1_id < partner2_id for the UNIQUE constraint
  const [p1, p2] = [partner1_id, partner2_id].sort()
  
  const [newUnion] = await sql<Union[]>`
    INSERT INTO unions (partner1_id, partner2_id, type)
    VALUES (${p1}, ${p2}, ${type})
    ON CONFLICT (partner1_id, partner2_id) DO UPDATE SET type = EXCLUDED.type
    RETURNING *
  `
  await logAudit({
    actorId: session.id,
    actorEmail: session.email,
    actorRole: session.role,
    action: 'ADD_UNION',
    targetType: 'union',
    targetId: newUnion.id,
    details: { partner1_id: p1, partner2_id: p2, type },
  })
  revalidatePath('/')
  return newUnion
}

export async function updateUnionStatus(id: string, type: string) {
  const session = await requireTreeEditor()
  await sql`
    UPDATE unions SET type = ${type} WHERE id = ${id}
  `
  await logAudit({
    actorId: session.id,
    actorEmail: session.email,
    actorRole: session.role,
    action: 'UPDATE_UNION_STATUS',
    targetType: 'union',
    targetId: id,
    details: { type },
  })
  revalidatePath('/')
}

export async function addChildToUnion(union_id: string, child_id: string) {
  const session = await requireTreeEditor()
  const [newParentChild] = await sql<ParentChild[]>`
    INSERT INTO parent_child (union_id, child_id)
    VALUES (${union_id}, ${child_id})
    ON CONFLICT (union_id, child_id) DO NOTHING
    RETURNING *
  `
  await logAudit({
    actorId: session.id,
    actorEmail: session.email,
    actorRole: session.role,
    action: 'ADD_CHILD_TO_UNION',
    targetType: 'parent_child',
    targetId: newParentChild?.id || null,
    details: { union_id, child_id },
  })
  revalidatePath('/')
  return newParentChild
}

export async function updatePerson(id: string, updates: Partial<Person>) {
  const session = await requireTreeEditor()
  const { name, birth_date, status, photo_url, gender } = updates
  await sql`
    UPDATE people 
    SET name = ${name!}, 
        birth_date = ${birth_date || null}, 
        status = ${status || 'alive'}, 
        photo_url = ${photo_url || null}, 
        gender = ${gender || 'other'}
    WHERE id = ${id}
  `
  await logAudit({
    actorId: session.id,
    actorEmail: session.email,
    actorRole: session.role,
    action: 'UPDATE_PERSON',
    targetType: 'person',
    targetId: id,
    details: { name, status, gender },
  })
  revalidatePath('/')
}

export async function deletePerson(id: string) {
  const session = await requireTreeEditor()
  await sql`DELETE FROM people WHERE id = ${id}`
  await logAudit({
    actorId: session.id,
    actorEmail: session.email,
    actorRole: session.role,
    action: 'DELETE_PERSON',
    targetType: 'person',
    targetId: id,
  })
  revalidatePath('/')
}

export async function replaceFullData(data: TreeData) {
  const session = await requireTreeEditor()
  const { people, unions, parentChild } = data
  
  await sql.begin(async (t) => {
    const tx = t as unknown as typeof sql

    // 1. Clear existing data
    await tx`TRUNCATE people CASCADE`
    
    // 2. Re-insert people
    if (people.length > 0) {
      await tx`
        INSERT INTO people ${tx(people, 'id', 'name', 'gender', 'status', 'birth_date', 'photo_url', 'created_at')}
      `
    }

    // 3. Re-insert unions
    if (unions.length > 0) {
      await tx`
        INSERT INTO unions ${tx(unions, 'id', 'partner1_id', 'partner2_id', 'type')}
      `
    }

    // 4. Re-insert parent-child relations
    if (parentChild.length > 0) {
      const pcToInsert = parentChild.map(({ union_id, child_id }) => ({ union_id, child_id }))
      await tx`
        INSERT INTO parent_child ${tx(pcToInsert, 'union_id', 'child_id')}
      `
    }
  })
  await logAudit({
    actorId: session.id,
    actorEmail: session.email,
    actorRole: session.role,
    action: 'REPLACE_FULL_TREE_DATA',
    targetType: 'tree',
    details: {
      people: people.length,
      unions: unions.length,
      parentChild: parentChild.length,
    },
  })

  revalidatePath('/')
}
