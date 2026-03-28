'use client'

import React, { useEffect, useState } from 'react'
import { useFamilyTree } from './FamilyTreeContext'
import PersonCard from './PersonCard'
import { Person, Union } from '@/lib/types'
import { Heart, HeartCrack, ZoomIn, ZoomOut, Maximize2, SlidersHorizontal, X, Info } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from './PersonCard'
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch'

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
        <div className="flex items-center justify-center relative px-6 md:px-12 lg:px-20">
          <div className="flex items-center gap-0">
            {/* Split unions for symmetry: Left Spouses | Main Person | Right Spouses */}
            {(() => {
              const half = Math.ceil(unions.length / 2)
              const leftUnions = unions.slice(0, half)
              const rightUnions = unions.slice(half)

              const renderUnion = (union: Union) => {
                const isDivorced = union.type === 'divorced'
                const isInteractive = Boolean(onToggleDivorce)
                return (
                  <div className="flex items-center w-14 md:w-20 lg:w-24 relative group/marriage">
                    <div className={cn(
                      "w-full h-0.5 transition-all",
                      isDivorced ? "bg-zinc-300 dark:bg-zinc-700 bg-dashed border-t-2 border-dashed border-zinc-400/50" : "bg-zinc-400 dark:bg-zinc-600"
                    )} />
                    <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center">
                      <button 
                        onClick={() => onToggleDivorce?.(union.id, union.type || 'married')}
                        title={isDivorced ? "Klik untuk Rujuk" : "Klik untuk Cerai"}
                        disabled={!isInteractive}
                        className={cn(
                          "w-10 h-10 rounded-full border-2 flex items-center justify-center shadow-lg z-10 transition-all group/divorce",
                          isInteractive && "hover:scale-110 active:scale-95",
                          !isInteractive && "cursor-default",
                          isDivorced ? "bg-zinc-200 dark:bg-zinc-900 border-zinc-400 text-zinc-400" : "bg-white dark:bg-zinc-950 border-zinc-400 dark:border-zinc-600 text-pink-500"
                        )}
                      >
                        {isDivorced ? <HeartCrack size={16} /> : <Heart className="fill-current" size={16} />}
                        <div className={cn(
                          "absolute -bottom-8 whitespace-nowrap text-[10px] px-2 py-1 rounded pointer-events-none font-bold uppercase tracking-wider transition-opacity",
                          isInteractive
                            ? "bg-black text-white opacity-100 md:opacity-0 md:group-hover/divorce:opacity-100"
                            : "bg-zinc-800 text-zinc-300 opacity-100"
                        )}>
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
          <div className="relative pt-14 md:pt-16 mt-0 w-full flex flex-col items-center">
            {/* Vertical line from parents level down to children group */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-14 md:h-16 bg-zinc-400 dark:bg-zinc-600" />

            <div className="flex gap-8 md:gap-16 lg:gap-24 items-start justify-center relative w-full px-6 md:px-12 lg:px-20">
              {/* Collect all children from all unions and display in one balanced row */}
              {(() => {
                const childrenPerUnion = unions.map(u => ({ union: u, children: getChildren(u.id) }))
                const allChildren = childrenPerUnion.flatMap(item => item.children)

                if (allChildren.length === 0) return null

                return (
                  <>
                    {/* Robust horizontal connector bar */}
                    {allChildren.length > 1 && (
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 bg-zinc-400 dark:bg-zinc-600 w-[calc(100%-48px)] md:w-[calc(100%-96px)] lg:w-[calc(100%-160px)]" />
                    )}

                    {allChildren.map((child, idx) => (
                      <div key={`${child.id}-${idx}`} className="relative flex flex-col items-center">
                        {/* Individual Vertical Stem to each child */}
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
  const [showMobileZoomControls, setShowMobileZoomControls] = useState(false)
  const [showLegendMobile, setShowLegendMobile] = useState(false)
  const [mobileZoomActivity, setMobileZoomActivity] = useState(0)

  useEffect(() => {
    if (!showMobileZoomControls) return
    const timer = window.setTimeout(() => {
      setShowMobileZoomControls(false)
    }, 3500)
    return () => window.clearTimeout(timer)
  }, [showMobileZoomControls, mobileZoomActivity])

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
    <TransformWrapper
      initialScale={0.9}
      minScale={0.55}
      maxScale={2.2}
      centerOnInit
      limitToBounds
      doubleClick={{ disabled: true }}
      pinch={{ step: 4 }}
      panning={{ velocityDisabled: true }}
      // On desktop, mouse wheel controls zoom for easier navigation.
      wheel={{ step: 0.06 }}
    >
      {({ zoomIn, zoomOut, resetTransform }) => (
        <div className="w-full h-full relative bg-zinc-50 dark:bg-transparent touch-none">
          <div className="absolute top-3 right-3 md:top-4 md:right-4 z-20 hidden lg:flex items-center gap-2 bg-zinc-900/80 backdrop-blur-md border border-white/10 rounded-xl p-1.5 shadow-xl">
            <button
              onClick={() => zoomOut()}
              className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-200 flex items-center justify-center transition-colors"
              title="Zoom Out"
            >
              <ZoomOut size={16} />
            </button>
            <button
              onClick={() => resetTransform()}
              className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-200 flex items-center justify-center transition-colors"
              title="Reset Zoom"
            >
              <Maximize2 size={16} />
            </button>
            <button
              onClick={() => zoomIn()}
              className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-200 flex items-center justify-center transition-colors"
              title="Zoom In"
            >
              <ZoomIn size={16} />
            </button>
          </div>
          <div className="absolute bottom-24 right-6 z-20 lg:hidden">
            <AnimatePresence>
              {showMobileZoomControls && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.96 }}
                  transition={{ duration: 0.16 }}
                  className="mb-2 flex flex-col items-center gap-2 bg-zinc-900/85 backdrop-blur-md border border-white/10 rounded-xl p-1.5 shadow-xl"
                >
                  <button
                    onClick={() => { zoomIn(); setMobileZoomActivity((v) => v + 1) }}
                    className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-200 flex items-center justify-center transition-colors"
                    title="Zoom In"
                  >
                    <ZoomIn size={18} />
                  </button>
                  <button
                    onClick={() => { resetTransform(); setMobileZoomActivity((v) => v + 1) }}
                    className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-200 flex items-center justify-center transition-colors"
                    title="Reset Zoom"
                  >
                    <Maximize2 size={18} />
                  </button>
                  <button
                    onClick={() => { zoomOut(); setMobileZoomActivity((v) => v + 1) }}
                    className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-200 flex items-center justify-center transition-colors"
                    title="Zoom Out"
                  >
                    <ZoomOut size={18} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
            <motion.button
              onClick={() => setShowMobileZoomControls((prev) => !prev)}
              className="w-10 h-10 rounded-xl bg-zinc-900/90 border border-white/10 text-zinc-200 flex items-center justify-center shadow-xl"
              title={showMobileZoomControls ? 'Tutup Kontrol Zoom' : 'Buka Kontrol Zoom'}
              whileTap={{ scale: 0.95 }}
            >
              <motion.span
                key={showMobileZoomControls ? 'close' : 'open'}
                initial={{ rotate: -12, opacity: 0.5 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 12, opacity: 0.5 }}
                transition={{ duration: 0.15 }}
                className="inline-flex"
              >
                {showMobileZoomControls ? <X size={16} /> : <SlidersHorizontal size={16} />}
              </motion.span>
            </motion.button>
          </div>
          <div className="absolute left-4 bottom-4 z-20 hidden lg:block">
            <div className="bg-zinc-900/80 backdrop-blur-md border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-200 space-y-2 shadow-xl">
              <div className="font-semibold text-zinc-100">Keterangan</div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white text-pink-500 border border-zinc-500">
                  <Heart size={10} className="fill-current" />
                </span>
                <span>Nikah</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-zinc-900 text-zinc-400 border border-zinc-500">
                  <HeartCrack size={10} />
                </span>
                <span>Cerai</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Hidup</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-zinc-400" />
                <span>Wafat</span>
              </div>
            </div>
          </div>
          <div className="absolute left-4 bottom-4 z-20 lg:hidden">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowLegendMobile((prev) => !prev)}
              className="h-10 px-3 rounded-xl bg-zinc-900/90 border border-white/10 text-zinc-200 flex items-center gap-2 shadow-xl"
            >
              <Info size={16} />
              <span className="text-xs font-medium">Info</span>
            </motion.button>
            <AnimatePresence>
              {showLegendMobile && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  transition={{ duration: 0.16 }}
                  className="mt-2 w-44 bg-zinc-900/85 backdrop-blur-md border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-200 space-y-2 shadow-xl"
                >
                  <div className="font-semibold text-zinc-100">Keterangan</div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white text-pink-500 border border-zinc-500">
                      <Heart size={10} className="fill-current" />
                    </span>
                    <span>Nikah</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-zinc-900 text-zinc-400 border border-zinc-500">
                      <HeartCrack size={10} />
                    </span>
                    <span>Cerai</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span>Hidup</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-zinc-400" />
                    <span>Wafat</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <TransformComponent wrapperClass="!w-full !h-full" contentClass="!w-max !h-max">
            <div className="p-6 md:p-12 lg:p-24 min-w-max min-h-max flex items-start justify-center">
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
          </TransformComponent>
        </div>
      )}
    </TransformWrapper>
  )
}
