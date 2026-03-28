'use client'

import { useState, useEffect, FormEvent, ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import FamilyTreeLayout from './FamilyTreeLayout'
import { Users, Search, ChevronRight, X, LogOut, Plus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Person, Gender, Status, TreeData } from '@/lib/types'
import { addPerson, addUnion, addChildToUnion, deletePerson, updatePerson, replaceFullData, getTreeData, updateUnionStatus } from '@/lib/actions'
import { logout } from '@/lib/actions-auth'
import { cn } from './PersonCard'
import Sidebar from './Sidebar'
import AppAlert from './AppAlert'
import { useFamilyTree } from './FamilyTreeContext'

const THEMES = [
  { name: 'Indigo', primary: '263.4 70% 50.4%', bg: '240 10% 3.9%' },
  { name: 'Rose', primary: '346.8 77% 49.8%', bg: '350 10% 3.9%' },
  { name: 'Emerald', primary: '142.1 70.6% 45.3%', bg: '150 10% 2%' },
  { name: 'Amber', primary: '37.9 92.1% 50.2%', bg: '40 10% 2%' },
]

export default function TreeContainer() {
  const router = useRouter()
  const { data, setRootPersonId, rootPersonId, canEditTree } = useFamilyTree()
  const [isModalOpen, setModalOpen] = useState(false)
  const [modalType, setModalType] = useState<'add' | 'spouse' | 'child' | 'edit'>('add')
  const [targetId, setTargetId] = useState<string | null>(null)
  const [editingPerson, setEditingPerson] = useState<Person | null>(null)
  const [isSidebarOpen, setSidebarOpen] = useState(true)
  const [alertState, setAlertState] = useState<{ isOpen: boolean; title: string; message: string; type: 'danger' | 'warning' | 'info' | 'success'; onConfirm?: () => void }>({ isOpen: false, title: '', message: '', type: 'info' })
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTheme, setActiveTheme] = useState('indigo')
  const [modalTab, setModalTab] = useState<'new' | 'existing'>('new')

  const showAlert = (title: string, message: string, type: 'danger' | 'warning' | 'info' | 'success' = 'info', onConfirm?: () => void) => {
    setAlertState({ isOpen: true, title, message, type, onConfirm })
  }

  const handleToggleDivorce = async (id: string, currentStatus: string) => {
    if (!canEditTree) return
    const nextStatus = currentStatus === 'divorced' ? 'married' : 'divorced'
    try {
      await updateUnionStatus(id, nextStatus)
      showAlert('Berhasil', nextStatus === 'divorced' ? 'Status hubungan telah diubah menjadi cerai.' : 'Status hubungan telah kembali rujuk.', 'success')
    } catch {
      showAlert('Gagal', 'Terjadi kesalahan saat mengubah status hubungan.', 'danger')
    }
  }

  useEffect(() => {
    const theme = THEMES.find(t => t.name === activeTheme) || THEMES[0]
    document.documentElement.style.setProperty('--primary', theme.primary)
    // Update background color based on theme
    document.documentElement.style.setProperty('--background', theme.bg)
  }, [activeTheme])

  const handleAddPerson = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!canEditTree) return
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const personData: Partial<Person> = {
      name: formData.get('name') as string,
      gender: formData.get('gender') as Gender,
      status: formData.get('status') as Status,
      birth_date: formData.get('birth_date') as string || undefined,
      photo_url: formData.get('photo_url') as string || undefined,
    }

    try {
      if (modalType === 'edit' && editingPerson) {
        await updatePerson(editingPerson.id, personData)
        showAlert('Berhasil', `Data ${personData.name} telah diperbarui.`, 'success')
      } else {
        const newPerson = await addPerson(personData)

        if (modalType === 'spouse' && targetId) {
          await addUnion(targetId, newPerson.id)
          showAlert('Berhasil', `${personData.name} telah ditambahkan sebagai pasangan.`, 'success')
        } else if (modalType === 'child' && targetId) {
          const unions = data.unions.filter(u => u.partner1_id === targetId || u.partner2_id === targetId)
          if (unions.length > 0) {
            await addChildToUnion(unions[0].id, newPerson.id)
            showAlert('Berhasil', `${personData.name} telah ditambahkan sebagai anak.`, 'success')
          }
        } else {
          showAlert('Berhasil', `${personData.name} telah ditambahkan ke silsilah.`, 'success')
        }
      }

      setModalOpen(false)
      setTargetId(null)
      setEditingPerson(null)
    } catch {
      showAlert('Gagal', 'Terjadi kesalahan saat memproses permintaan Anda.', 'danger')
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      // Find the photo_url input in the form and set its value
      const photoInput = document.getElementsByName('photo_url')[0] as HTMLInputElement
      if (photoInput) {
        photoInput.value = dataUrl
        // Update editing person preview if editing
        if (editingPerson) {
          setEditingPerson({ ...editingPerson, photo_url: dataUrl })
        }
      }
    }
    reader.readAsDataURL(file)
  }

  const handleConnectExistingSpouse = async (existingId: string) => {
    if (!targetId || !canEditTree) return
    setLoading(true)
    try {
      await addUnion(targetId, existingId)
      showAlert('Berhasil', 'Anggota telah berhasil disambungkan sebagai pasangan.', 'success')
      setModalOpen(false)
      setTargetId(null)
    } catch {
      showAlert('Gagal', 'Gagal menyambungkan pasangan.', 'danger')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    const data = await getTreeData()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `family-tree-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    showAlert('Berhasil', 'Data silsilah telah diekspor ke file JSON.', 'success')
  }

  const handleImport = async (importData: TreeData) => {
    if (!canEditTree) return
    showAlert(
      'Konfirmasi Impor',
      'Ini akan menghapus SEMUA data saat ini dan menggantinya dengan data impor. Lanjutkan?',
      'danger',
      async () => {
        setLoading(true)
        try {
          await replaceFullData(importData)
          window.location.reload()
        } catch {
          showAlert('Gagal Mengimpor', 'Terjadi kesalahan saat memproses data JSON.', 'danger')
        } finally {
          setLoading(false)
        }
      }
    )
  }

  const filteredPeople = data.people.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <div className="flex h-screen bg-zinc-950 text-white overflow-hidden font-sans selection:bg-indigo-500/30">
      <Sidebar
        people={filteredPeople}
        searchTerm={searchTerm}
        onSearch={setSearchTerm}
        onSelectRoot={setRootPersonId}
        currentRootId={rootPersonId}
        onAddMember={() => { setModalType('add'); setTargetId(null); setModalOpen(true); setModalTab('new'); }}
        onEditMember={(person) => { setEditingPerson(person); setModalType('edit'); setModalOpen(true); setModalTab('new'); }}
        isSidebarOpen={isSidebarOpen}
        setSidebarOpen={setSidebarOpen}
        onExport={handleExport}
        onImport={handleImport}
        onError={(title, msg) => showAlert(title, msg, 'danger')}
      />

      <button
        onClick={() => setSidebarOpen(!isSidebarOpen)}
        className="fixed bottom-6 right-6 z-50 p-4 rounded-full bg-white text-black shadow-2xl lg:hidden hover:scale-110 active:scale-95 transition-all"
      >
        <Users size={24} />
      </button>

      {/* Main Content (Infinite-X Tree) */}
      <main className={cn(
        "flex-1 relative overflow-hidden bg-background transition-all duration-500 ease-in-out",
        isSidebarOpen ? "lg:pl-80" : "pl-0"
      )}>
        {/* Toggle Button (When Hidden/Desktop) */}
        {!isSidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="absolute top-8 left-8 z-30 p-3 bg-zinc-900/80 backdrop-blur-md rounded-2xl border border-white/10 hover:bg-white/5 transition-all flex items-center gap-2 group shadow-2xl"
          >
            <ChevronRight size={20} className="text-indigo-400 group-hover:translate-x-0.5 transition-transform" />
            <span className="text-sm font-bold text-zinc-300 pr-2">Buka Menu</span>
          </button>
        )}

        {/* Floating Controls */}
        <div className="absolute top-8 right-8 z-30 flex items-center gap-2">
          <div className="flex bg-zinc-900/80 backdrop-blur-md py-2 px-3 gap-1 items-center rounded-2xl border border-white/10 shadow-2xl">
            {THEMES.map((theme) => (
              <button
                key={theme.name}
                onClick={() => setActiveTheme(theme.name)}
                className={cn(
                  "w-4 h-4 rounded-xl transition-all border-2",
                  activeTheme === theme.name ? "border-white scale-110 shadow-lg ring-2 ring-white/20" : "border-transparent opacity-40 hover:opacity-100"
                )}
                style={{ backgroundColor: `hsl(${theme.primary})` }}
              />
            ))}
            <button
              onClick={() => {
                showAlert(
                  'Keluar',
                  'Apakah Anda yakin ingin keluar dari aplikasi?',
                  'warning',
                  async () => {
                    await logout()
                    router.push('/login')
                    router.refresh()
                  }
                )
              }}
              className="p-1.5 ml-2 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-red-400 transition-colors"
              title="Keluar"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>

        {/* Tree Container with gesture pan/zoom (no manual scroll) */}
        <div
          onPointerDown={() => setSidebarOpen(false)}
          onClick={() => setSidebarOpen(false)}
          className="w-full h-full overflow-hidden">
          <FamilyTreeLayout
            onAddSpouse={canEditTree ? (id) => { setTargetId(id); setModalType('spouse'); setModalOpen(true); setModalTab('new'); } : undefined}
            onAddChild={canEditTree ? (id) => { setTargetId(id); setModalType('child'); setModalOpen(true); setModalTab('new'); } : undefined}
            onToggleDivorce={canEditTree ? handleToggleDivorce : undefined}
            onDelete={canEditTree ? (id) => {
              showAlert(
                'Hapus Anggota',
                'Apakah Anda yakin ingin menghapus anggota ini? Tindakan ini tidak dapat dibatalkan.',
                'danger',
                async () => {
                  await deletePerson(id)
                  showAlert('Berhasil', 'Anggota telah dihapus.', 'success')
                }
              )
            } : undefined}
            onEdit={canEditTree ? (person) => { setEditingPerson(person); setModalType('edit'); setModalOpen(true); setModalTab('new'); } : undefined}
          />
        </div>
      </main>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setModalOpen(false); setEditingPerson(null); }}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-zinc-900 border border-white/10 rounded-3xl p-8 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between mb-6 shrink-0">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">
                    {modalType === 'add' ? 'Tambah Anggota' : modalType === 'spouse' ? 'Tambah Pasangan' : modalType === 'child' ? 'Tambah Anak' : 'Edit Anggota'}
                  </h1>
                  <p className="text-zinc-500 text-sm mt-1">
                    {modalType === 'edit' ? `Memperbarui data ${editingPerson?.name}` : 'Lengkapi data hubungan keluarga ini'}
                  </p>
                </div>
                <button
                  onClick={() => { setModalOpen(false); setEditingPerson(null); }}
                  className="p-2 rounded-xl hover:bg-white/5 transition-all text-zinc-500"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Tabs for Add Spouse/Child */}
              {(modalType === 'spouse' || modalType === 'child') && (
                <div className="flex p-1 bg-white/5 rounded-2xl mb-6 gap-1 shrink-0">
                  <button
                    onClick={() => setModalTab('new')}
                    className={cn(
                      "flex-1 py-2 rounded-xl text-sm font-bold transition-all",
                      modalTab === 'new' ? "bg-white text-black shadow-lg" : "text-zinc-500 hover:text-white"
                    )}
                  >
                    Baru
                  </button>
                  <button
                    onClick={() => setModalTab('existing')}
                    className={cn(
                      "flex-1 py-2 rounded-xl text-sm font-bold transition-all",
                      modalTab === 'existing' ? "bg-white text-black shadow-lg" : "text-zinc-500 hover:text-white"
                    )}
                  >
                    Anggota Terdaftar
                  </button>
                </div>
              )}

              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                {modalTab === 'new' ? (
                  <form onSubmit={handleAddPerson} className="space-y-5 pb-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase px-1 tracking-wider">Nama Lengkap</label>
                      <input
                        name="name"
                        required
                        defaultValue={editingPerson?.name}
                        placeholder="Contoh: John Doe"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium text-lg"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5 relative">
                        <label className="text-xs font-bold text-zinc-500 uppercase px-1 tracking-wider">Jenis Kelamin</label>
                        <div className="relative">
                          <select
                            name="gender"
                            defaultValue={editingPerson?.gender}
                            style={{ colorScheme: 'dark' }}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none cursor-pointer text-white font-medium"
                          >
                            <option value="male" className="bg-zinc-900">Laki-laki</option>
                            <option value="female" className="bg-zinc-900">Perempuan</option>
                            <option value="other" className="bg-zinc-900">Lainnya</option>
                          </select>
                          <ChevronRight size={16} className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-zinc-500 pointer-events-none" />
                        </div>
                      </div>
                      <div className="space-y-1.5 relative">
                        <label className="text-xs font-bold text-zinc-500 uppercase px-1 tracking-wider">Status</label>
                        <div className="relative">
                          <select
                            name="status"
                            defaultValue={editingPerson?.status}
                            style={{ colorScheme: 'dark' }}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none cursor-pointer text-white font-medium"
                          >
                            <option value="alive" className="bg-zinc-900">Hidup</option>
                            <option value="deceased" className="bg-zinc-900">Wafat</option>
                          </select>
                          <ChevronRight size={16} className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-zinc-500 pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase px-1 tracking-wider">Foto Profil</label>
                      <div className="space-y-3">
                        <div className="relative group">
                          <input
                            name="photo_url"
                            defaultValue={editingPerson?.photo_url}
                            placeholder="URL Gambar (https://...)"
                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium text-sm"
                          />
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <label className="relative group flex items-center justify-center border-2 border-dashed border-white/10 rounded-2xl p-4 cursor-pointer hover:border-indigo-500/50 transition-all bg-white/5">
                              <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileChange}
                              />
                              <div className="flex flex-col items-center gap-1">
                                <Plus size={20} className="text-zinc-500 group-hover:text-indigo-400" />
                                <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Unggah File</span>
                              </div>
                            </label>
                          </div>
                          {editingPerson?.photo_url && (
                            <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-white/10 flex-shrink-0">
                              {/* Preview supports dynamic URLs and data URLs from uploads */}
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={editingPerson.photo_url} alt="Preview" className="w-full h-full object-cover" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase px-1 tracking-wider">Tanggal Lahir (Opsional)</label>
                      <input
                        name="birth_date"
                        type="date"
                        defaultValue={editingPerson?.birth_date?.split('T')[0]}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
                      />
                    </div>

                    <button
                      disabled={loading}
                      className="w-full bg-white text-black font-bold py-4 rounded-2xl mt-4 hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 group shadow-xl active:scale-95 disabled:opacity-50"
                    >
                      {loading ? 'Menyimpan...' : (
                        modalType === 'edit' ? 'Simpan Perubahan' : 'Buat Anggota'
                      )}
                      {!loading && <ChevronRight size={18} className="translate-x-0 group-hover:translate-x-1 transition-transform" />}
                    </button>
                  </form>
                ) : (
                  <div className="space-y-4 pb-2">
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                      <input
                        placeholder="Cari anggota yang sudah ada..."
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pl-12 outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      {(() => {
                        const targetPerson = data.people.find(p => p.id === targetId)
                        return data.people
                          .filter(p => {
                            if (p.id === targetId) return false
                            if (!p.name.toLowerCase().includes(searchTerm.toLowerCase())) return false
                            // Gender filter for marriage (spouse)
                            if (modalType === 'spouse' && targetPerson && p.gender === targetPerson.gender) return false
                            return true
                          })
                          .slice(0, 5)
                          .map(p => (
                            <button
                              key={p.id}
                              onClick={() => handleConnectExistingSpouse(p.id)}
                              className="w-full p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-indigo-500/50 flex items-center justify-between group transition-all"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center font-bold text-zinc-400 group-hover:from-indigo-500 group-hover:to-purple-600 group-hover:text-white transition-all shadow-lg leading-none">
                                  {p.name[0]}
                                </div>
                                <div className="text-left">
                                  <div className="font-bold text-white group-hover:text-indigo-400 transition-colors uppercase tracking-tight text-xs tracking-wider font-bold">{p.name}</div>
                                  <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">{p.gender === 'male' ? 'Laki-laki' : 'Perempuan'}</div>
                                </div>
                              </div>
                              <Plus size={18} className="text-zinc-500 group-hover:text-white" />
                            </button>
                          ))
                      })()}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AppAlert
        isOpen={alertState.isOpen}
        title={alertState.title}
        message={alertState.message}
        onConfirm={alertState.onConfirm}
        onClose={() => setAlertState(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  )
}
