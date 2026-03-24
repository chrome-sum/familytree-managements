export type Gender = 'male' | 'female' | 'other'
export type Status = 'alive' | 'deceased'

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
