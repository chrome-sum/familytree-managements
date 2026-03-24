'use client'

import { Person, Status, Gender } from '@/lib/types'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Calendar, Circle, Heart, Trash2, Edit2, Camera, Plus } from 'lucide-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { useFamilyTree } from './FamilyTreeContext'
import React, { useRef, useEffect } from 'react'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface PersonCardProps {
  person: Person
  onClick?: () => void
  onDelete?: (id: string) => void
  onEdit?: (person: Person) => void
  onAddSpouse?: (id: string) => void
  onAddChild?: (id: string) => void
  className?: string
}

export default function PersonCard({ person, onClick, onDelete, onEdit, onAddSpouse, onAddChild, className }: PersonCardProps) {
  const { highlightPersonId, isLoggedIn } = useFamilyTree()
  const isDeceased = person.status === 'deceased'
  const isHighlighted = highlightPersonId === person.id
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isHighlighted && cardRef.current) {
      cardRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center'
      })
    }
  }, [isHighlighted])
  
  return (
    <motion.div
      ref={cardRef}
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ 
        opacity: 1, 
        scale: isHighlighted ? 1.05 : 1,
        y: isHighlighted ? -5 : 0
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4, boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' }}
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-center gap-2 p-4 rounded-3xl border transition-all cursor-pointer group",
        isHighlighted ? 
          "border-indigo-500 bg-indigo-500/10 dark:bg-indigo-500/10 shadow-[0_0_40px_rgba(99,102,241,0.4)] ring-4 ring-indigo-500/20 z-50" : 
          "border-white/20 dark:border-zinc-800/50 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl shadow-xl w-48",
        isDeceased && !isHighlighted && "opacity-60 grayscale-[0.5]",
        className
      )}
    >
      {isHighlighted && (
        <div className="absolute inset-0 rounded-3xl bg-indigo-500/20 animate-ping pointer-events-none" />
      )}
      <div className="relative">
        <div className={cn(
          "w-20 h-20 rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center border-2 transition-all duration-500",
          isHighlighted ? "border-indigo-500 scale-110 shadow-lg" : 
          person.gender === 'male' ? "border-blue-500/30" : 
          person.gender === 'female' ? "border-pink-500/30" : "border-zinc-400/30",
          "group-hover:scale-105"
        )}>
          {person.photo_url ? (
            <img src={person.photo_url} alt={person.name} className="w-full h-full object-cover" />
          ) : (
            <User size={32} className="text-zinc-400 dark:text-zinc-600" />
          )}
        </div>
        
        <div className={cn(
          "absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white dark:border-zinc-900",
          isDeceased ? "bg-zinc-400" : "bg-emerald-500"
        )} />
      </div>

      <div className="flex flex-col items-center text-center mt-2">
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-1 group-hover:text-indigo-500 transition-colors uppercase tracking-tight text-xs tracking-wider font-bold">{person.name}</h3>
        {person.birth_date && (
          <p suppressHydrationWarning className="text-[10px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1 mt-0.5">
            <Calendar size={10} className="text-zinc-400" />
            {new Date(person.birth_date).toLocaleDateString('id-ID')}
          </p>
        )}
      </div>

      {isLoggedIn && (
        <div className="flex gap-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300 absolute -bottom-3 translate-y-0 md:translate-y-2 md:group-hover:translate-y-0">
          <button 
            onClick={(e) => { e.stopPropagation(); onAddSpouse?.(person.id) }}
            title="Tambah Pasangan"
            className="p-2.5 rounded-full bg-pink-500 text-white hover:bg-pink-600 shadow-lg shadow-pink-500/20 active:scale-95 transition-all"
          >
            <Heart size={16} fill="currentColor" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onAddChild?.(person.id) }}
            title="Tambah Anak"
            className="p-2.5 rounded-full bg-indigo-500 text-white hover:bg-indigo-600 shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
          >
            <Plus size={16} strokeWidth={3} />
          </button>
        </div>
      )}

      {isLoggedIn && (
        <div className="flex gap-2 opacity-100 md:opacity-40 md:group-hover:opacity-100 transition-opacity absolute top-2 right-2">
          {onEdit && (
            <button 
              onClick={(e) => { e.stopPropagation(); onEdit(person) }}
              title="Edit Data"
              className="p-2 rounded-lg bg-zinc-100/90 dark:bg-zinc-800/90 text-zinc-600 dark:text-zinc-400 hover:text-indigo-500"
            >
              <Edit2 size={14} />
            </button>
          )}
          {onDelete && (
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(person.id) }}
              title="Hapus Data"
              className="p-2 rounded-lg bg-zinc-100/90 dark:bg-zinc-800/90 text-zinc-600 dark:text-zinc-400 hover:text-red-500"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      )}
    </motion.div>
  )
}
