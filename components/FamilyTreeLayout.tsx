'use client'

import React from 'react'
import { useFamilyTree } from './FamilyTreeContext'
import PersonCard from './PersonCard'
import { Person, Union } from '@/lib/types'
import { Heart, HeartCrack } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from './PersonCard'

interface FamilyNodeProps {
  person: Person
  onAddSpouse?: (id: string) => void
  onAddChild?: (id: string) => void
  onDelete?: (id: string) => void
  onEdit?: (person: Person) => void
  onToggleDivorce?: (id: string, currentStatus: string) => void
  visited?: Set<string>
  isRoot?: boolean
}

function FamilyNode({ person, onAddSpouse, onAddChild, onDelete, onEdit, onToggleDivorce, visited = new Set(), isRoot = false }: FamilyNodeProps) {
  const { getUnions, getChildren, data } = useFamilyTree()
  const unions = getUnions(person.id)

  if (visited.has(person.id)) return null
  const nextVisited = new Set(visited)
  nextVisited.add(person.id)

  return (
    <div className="flex flex-col items-center group/node">
      {/* 1. Incoming line from parent (Top Stem) */}
      {!isRoot && (
        <div className="w-0.5 h-16 bg-zinc-400 dark:bg-zinc-600 shrink-0" />
      )}

      {/* 2. Main Marriage Unit container */}
      <div className="flex flex-col items-center w-full">
        {/* Row of Spouses and Main Person */}
        <div className="flex items-center justify-center relative px-20">
          <div className="flex items-center gap-0">
            {/* Split unions for symmetry: Left Spouses | Main Person | Right Spouses */}
            {(() => {
              const half = Math.ceil(unions.length / 2)
              const leftUnions = unions.slice(0, half)
              const rightUnions = unions.slice(half)

              const renderUnion = (union: Union) => {
                const isDivorced = union.type === 'divorced'
                return (
                  <div className="flex items-center w-24 relative group/marriage">
                    <div className={cn(
                      "w-full h-0.5 transition-all",
                      isDivorced ? "bg-zinc-300 dark:bg-zinc-700 bg-dashed border-t-2 border-dashed border-zinc-400/50" : "bg-zinc-400 dark:bg-zinc-600"
                    )} />
                    <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center">
                      <button 
                        onClick={() => onToggleDivorce?.(union.id, union.type || 'married')}
                        title={isDivorced ? "Klik untuk Rujuk" : "Klik untuk Cerai"}
                        className={cn(
                          "w-10 h-10 rounded-full border-2 flex items-center justify-center shadow-lg z-10 transition-all hover:scale-110 active:scale-95 group/divorce",
                          isDivorced ? "bg-zinc-200 dark:bg-zinc-900 border-zinc-400 text-zinc-400" : "bg-white dark:bg-zinc-950 border-zinc-400 dark:border-zinc-600 text-pink-500"
                        )}
                      >
                        {isDivorced ? <HeartCrack size={16} /> : <Heart className="fill-current" size={16} />}
                        <div className="absolute -bottom-8 opacity-0 group-hover/divorce:opacity-100 transition-opacity whitespace-nowrap bg-black text-white text-[10px] px-2 py-1 rounded pointer-events-none font-bold uppercase tracking-wider">
                          {isDivorced ? 'Cerai' : 'Nikah'}
                        </div>
                      </button>
                    </div>
                  </div>
                )
              }

              return (
                <>
                  {/* Left Spouses branch */}
                  {leftUnions.reverse().map(union => {
                    const spouseId = union.partner1_id === person.id ? union.partner2_id : union.partner1_id
                    const spouse = data.people.find(p => p.id === spouseId)
                    if (!spouse) return null
                    return (
                      <div key={union.id} className="flex items-center flex-row-reverse group/marriage">
                        {renderUnion(union)}
                        <PersonCard
                          person={spouse}
                          onAddSpouse={onAddSpouse}
                          onAddChild={onAddChild}
                          onDelete={onDelete}
                          onEdit={onEdit}
                        />
                      </div>
                    )
                  })}

                  {/* Central Person Card */}
                  <div className="z-20">
                    <PersonCard
                      person={person}
                      onAddSpouse={onAddSpouse}
                      onAddChild={onAddChild}
                      onDelete={onDelete}
                      onEdit={onEdit}
                    />
                  </div>

                  {/* Right Spouses branch */}
                  {rightUnions.map(union => {
                    const spouseId = union.partner1_id === person.id ? union.partner2_id : union.partner1_id
                    const spouse = data.people.find(p => p.id === spouseId)
                    if (!spouse) return null
                    return (
                      <div key={union.id} className="flex items-center group/marriage">
                        {renderUnion(union)}
                        <PersonCard
                          person={spouse}
                          onAddSpouse={onAddSpouse}
                          onAddChild={onAddChild}
                          onDelete={onDelete}
                          onEdit={onEdit}
                        />
                      </div>
                    )
                  })}
                </>
              )
            })()}
          </div>
        </div>

        {/* 3. Children Row (One big row for all children of this node, organized by union) */}
        {unions.some(u => getChildren(u.id).length > 0) && (
          <div className="relative pt-16 mt-0 w-full flex flex-col items-center">
            {/* Vertical line from parents level down to children group */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-16 bg-zinc-400 dark:bg-zinc-600" />

            <div className="flex gap-24 items-start justify-center relative w-full px-20">
              {/* Collect all children from all unions and display in one balanced row */}
              {(() => {
                const childrenPerUnion = unions.map(u => ({ union: u, children: getChildren(u.id) }))
                const allChildren = childrenPerUnion.flatMap(item => item.children)

                if (allChildren.length === 0) return null

                return (
                  <>
                    {/* Robust horizontal connector bar */}
                    {allChildren.length > 1 && (
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 bg-zinc-400 dark:bg-zinc-600 w-[calc(100%-160px)]" />
                    )}

                    {allChildren.map((child, idx) => (
                      <div key={`${child.id}-${idx}`} className="relative flex flex-col items-center">
                        {/* Individual Vertical Stem to each child */}
                        <div className="w-0.5 h-8 bg-zinc-400 dark:bg-zinc-600 -mt-8" />
                        <FamilyNode
                          person={child}
                          onAddSpouse={onAddSpouse}
                          onAddChild={onAddChild}
                          onDelete={onDelete}
                          onEdit={onEdit}
                          onToggleDivorce={onToggleDivorce}
                          visited={nextVisited}
                        />
                      </div>
                    ))}
                  </>
                )
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

interface FamilyTreeLayoutProps {
  onAddSpouse?: (id: string) => void
  onAddChild?: (id: string) => void
  onDelete?: (id: string) => void
  onEdit?: (person: Person) => void
  onToggleDivorce?: (id: string, currentStatus: string) => void
}

export default function FamilyTreeLayout({ onAddSpouse, onDelete, onAddChild, onEdit, onToggleDivorce }: FamilyTreeLayoutProps) {
  const { rootPersonId, data } = useFamilyTree()
  const rootPerson = data.people.find(p => p.id === rootPersonId)

  if (!rootPerson) return (
    <div className="flex items-center justify-center p-20 text-indigo-500/50">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center mx-auto mb-4">
          <Heart size={32} className="text-indigo-500 animate-pulse" />
        </div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">Akar Belum Dipilih</h1>
        <p className="text-sm mt-2 opacity-60">Pilih anggota dari sidebar untuk memvisualisasikan silsilah.</p>
      </motion.div>
    </div>
  )

  return (
    <div className="p-40 pt-20 overflow-auto min-h-screen custom-scrollbar flex items-start justify-center bg-zinc-50 dark:bg-transparent">
      <div className="scale-[0.8] origin-top">
        <FamilyNode
          person={rootPerson}
          onAddSpouse={onAddSpouse}
          onAddChild={onAddChild}
          onDelete={onDelete}
          onEdit={onEdit}
          onToggleDivorce={onToggleDivorce}
          isRoot={true}
        />
      </div>
    </div>
  )
}
