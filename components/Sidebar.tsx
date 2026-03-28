'use client'

import React from 'react'
import Link from 'next/link'
import { Plus, Users, Search, ChevronRight, Edit2, Download, Upload, LogIn, LogOut, User, ClipboardList } from 'lucide-react'
import { cn } from './PersonCard'
import { Person, TreeData } from '@/lib/types'
import { useFamilyTree } from './FamilyTreeContext'

interface SidebarProps {
  people: Person[]
  searchTerm: string
  onSearch: (term: string) => void
  onSelectRoot: (id: string) => void
  currentRootId?: string | null
  onAddMember: () => void
  onEditMember: (person: Person) => void
  isSidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  onExport?: () => void
  onImport?: (data: TreeData) => void
  onError?: (title: string, msg: string) => void
}

export default function Sidebar({
  people,
  searchTerm,
  onSearch,
  onSelectRoot,
  onAddMember,
  onEditMember,
  isSidebarOpen,
  setSidebarOpen,
  onExport,
  onImport,
  onError,
  currentRootId
}: SidebarProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const { isLoggedIn, canEditTree, canManageUsers, setLoginModalOpen, setSettingsModalOpen, logout } = useFamilyTree()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string)
        onImport?.(json)
      } catch {
        onError?.('Format Tidak Valid', 'File yang Anda unggah bukan format JSON silsilah yang benar.')
      }
    }
    reader.readAsText(file)
  }

  return (
    <aside className={cn(
      'fixed inset-y-0 left-0 z-40 w-80 bg-zinc-900/50 backdrop-blur-xl border-r border-white/5 flex flex-col h-screen transition-all duration-500 ease-in-out overflow-hidden',
      isSidebarOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 pointer-events-none'
    )}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json"
        className="hidden"
      />
      <div className="p-8 pb-4 shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Users size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Silsilah</h1>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Pohon Keturunan</p>
          </div>
        </div>
        <button
          onClick={() => setSidebarOpen(false)}
          className="p-2 rounded-xl hover:bg-zinc-800 transition-all text-zinc-500 border border-white/5 shadow-inner"
        >
          <ChevronRight className="rotate-180" size={20} />
        </button>
      </div>

      <div className="px-8 mb-6">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-white transition-colors" size={16} />
          <input
            type="text"
            placeholder="Cari leluhur..."
            value={searchTerm}
            onChange={(e) => onSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-11 pr-4 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all font-medium text-sm"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar">
        <div className="space-y-1.5 flex flex-col gap-1">
          {people.map(person => (
            <div
              key={person.id}
              onClick={() => {
                if (person.id !== currentRootId) {
                  onSelectRoot(person.id)
                }
                if (window.innerWidth < 1024) setSidebarOpen(false)
              }}
              className={cn(
                'group flex items-center justify-between p-4 rounded-2xl transition-all cursor-pointer border border-transparent',
                person.id === currentRootId ? 'bg-indigo-500/10 border-indigo-500/50' : 'hover:bg-white/5 hover:border-white/5'
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center font-bold text-xs border border-white/5',
                  person.gender === 'male' ? 'text-blue-400' : person.gender === 'female' ? 'text-pink-400' : 'text-zinc-400'
                )}>
                  {person.name.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-sm text-zinc-200 group-hover:text-white transition-colors">{person.name}</p>
                  <p className="text-[10px] text-zinc-500">{person.status === 'alive' ? 'Hidup' : 'Wafat'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {canEditTree && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onEditMember(person) }}
                    className="p-1.5 rounded-lg hover:bg-white/10 transition-all text-zinc-500 hover:text-indigo-400"
                  >
                    <Edit2 size={12} />
                  </button>
                )}
                <ChevronRight size={14} className="text-zinc-600 group-hover:text-zinc-400 group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 mt-auto shrink-0 border-t border-white/5 bg-zinc-900/50 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {canEditTree && (
              <>
                <button
                  onClick={onExport}
                  title="Ekspor Data"
                  className="p-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all border border-white/5"
                >
                  <Download size={18} />
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  title="Impor Data"
                  className="p-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all border border-white/5"
                >
                  <Upload size={18} />
                </button>
              </>
            )}
            {isLoggedIn && (
              <button
                onClick={() => setSettingsModalOpen(true)}
                title="Pengaturan Akun"
                className="p-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-xl transition-all border border-indigo-500/20"
              >
                <User size={18} />
              </button>
            )}
            {canManageUsers && (
              <>
                <Link
                  href="/users"
                  title="Kelola User"
                  className="p-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-xl transition-all border border-emerald-500/20"
                >
                  <Users size={18} />
                </Link>
                <Link
                  href="/audit-logs"
                  title="Audit Logs"
                  className="p-2.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 rounded-xl transition-all border border-cyan-500/20"
                >
                  <ClipboardList size={18} />
                </Link>
              </>
            )}
            <button
              onClick={isLoggedIn ? logout : () => setLoginModalOpen(true)}
              title={isLoggedIn ? 'Logout' : 'Login'}
              className={cn(
                'p-2.5 rounded-xl transition-all border border-white/5',
                isLoggedIn ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' : 'bg-white/5 hover:bg-white/10 text-white'
              )}
            >
              {isLoggedIn ? <LogOut size={18} /> : <LogIn size={18} />}
            </button>
          </div>
        </div>
        {canEditTree ? (
          <button
            onClick={onAddMember}
            className="w-full bg-indigo-500 text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-indigo-600 transition-all shadow-xl active:scale-95 text-sm"
          >
            <Plus size={18} />
            Anggota Baru
          </button>
        ) : (
          <div className="text-center py-2">
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Mode Viewer</p>
            <p className="text-xs text-zinc-500 mt-2 leading-relaxed">Anda dapat mencari anggota, memilih akar keluarga, dan melihat silsilah, tetapi tidak bisa mengubah data.</p>
          </div>
        )}
      </div>
    </aside>
  )
}
