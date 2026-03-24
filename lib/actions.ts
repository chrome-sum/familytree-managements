'use server'

import sql from './db'
import { Person, Union, ParentChild, TreeData } from './types'
import { revalidatePath } from 'next/cache'
import { getSession } from './auth'

async function checkAuth() {
  const session = await getSession()
  if (!session) throw new Error('Unauthorized: Harus login untuk melakukan perubahan data')
}

export async function getTreeData(): Promise<TreeData> {
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
  await checkAuth()
  const { name, birth_date, status, photo_url, gender } = person
  const [newPerson] = await sql<Person[]>`
    INSERT INTO people (name, birth_date, status, photo_url, gender)
    VALUES (${name!}, ${birth_date || null}, ${status || 'alive'}, ${photo_url || null}, ${gender || 'other'})
    RETURNING *
  `
  revalidatePath('/')
  return newPerson
}

export async function addUnion(partner1_id: string, partner2_id: string, type: string = 'married') {
  await checkAuth()
  // Sort partner IDs to ensure partner1_id < partner2_id for the UNIQUE constraint
  const [p1, p2] = [partner1_id, partner2_id].sort()
  
  const [newUnion] = await sql<Union[]>`
    INSERT INTO unions (partner1_id, partner2_id, type)
    VALUES (${p1}, ${p2}, ${type})
    ON CONFLICT (partner1_id, partner2_id) DO UPDATE SET type = EXCLUDED.type
    RETURNING *
  `
  revalidatePath('/')
  return newUnion
}

export async function updateUnionStatus(id: string, type: string) {
  await checkAuth()
  await sql`
    UPDATE unions SET type = ${type} WHERE id = ${id}
  `
  revalidatePath('/')
}

export async function addChildToUnion(union_id: string, child_id: string) {
  await checkAuth()
  const [newParentChild] = await sql<ParentChild[]>`
    INSERT INTO parent_child (union_id, child_id)
    VALUES (${union_id}, ${child_id})
    ON CONFLICT (union_id, child_id) DO NOTHING
    RETURNING *
  `
  revalidatePath('/')
  return newParentChild
}

export async function updatePerson(id: string, updates: Partial<Person>) {
  await checkAuth()
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
  revalidatePath('/')
}

export async function deletePerson(id: string) {
  await checkAuth()
  await sql`DELETE FROM people WHERE id = ${id}`
  revalidatePath('/')
}

export async function replaceFullData(data: TreeData) {
  await checkAuth()
  const { people, unions, parentChild } = data
  
  await sql.begin(async (t) => {
    // 1. Clear existing data
    await (t as any)`TRUNCATE people CASCADE`
    
    // 2. Re-insert people
    if (people.length > 0) {
      await (t as any)`
        INSERT INTO people ${(t as any)(people, 'id', 'name', 'gender', 'status', 'birth_date', 'photo_url', 'created_at')}
      `
    }

    // 3. Re-insert unions
    if (unions.length > 0) {
      await (t as any)`
        INSERT INTO unions ${(t as any)(unions, 'id', 'partner1_id', 'partner2_id', 'type')}
      `
    }

    // 4. Re-insert parent-child relations
    if (parentChild.length > 0) {
      const pcToInsert = parentChild.map(({ union_id, child_id }) => ({ union_id, child_id }))
      await (t as any)`
        INSERT INTO parent_child ${(t as any)(pcToInsert, 'union_id', 'child_id')}
      `
    }
  })

  revalidatePath('/')
}
