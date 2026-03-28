'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { Shield, KeyRound, TriangleAlert, Settings2, Check } from 'lucide-react'
import { UserAccount, UserRole } from '@/lib/types'
import {
  createUserByAdmin,
  deleteUserByAdmin,
  updateUserPasswordByAdmin,
  updateUserRoleByAdmin,
} from '@/lib/actions-auth'

interface UserManagementPanelProps {
  users: UserAccount[]
  currentUserId: string
}

const roleOptions: UserRole[] = ['admin', 'editor', 'viewer']
const roleMeta: Record<UserRole, { label: string; description: string }> = {
  admin: {
    label: 'Admin',
    description: 'Kelola user dan seluruh data silsilah.',
  },
  editor: {
    label: 'Editor',
    description: 'Kelola data silsilah tanpa akses manajemen user.',
  },
  viewer: {
    label: 'Viewer',
    description: 'Hanya melihat data silsilah.',
  },
}

function roleBadgeClass(role: UserRole) {
  if (role === 'admin') return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
  if (role === 'editor') return 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
  return 'bg-zinc-700/40 text-zinc-300 border-zinc-600/50'
}

function roleChipClass(isActive: boolean) {
  return isActive
    ? 'bg-indigo-500 text-white border-indigo-400 ring-2 ring-indigo-300/40 shadow-lg shadow-indigo-500/20'
    : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700/80'
}

export default function UserManagementPanel({ users, currentUserId }: UserManagementPanelProps) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>('viewer')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null)
  const [selectedRole, setSelectedRole] = useState<UserRole>('viewer')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [modalError, setModalError] = useState<string | null>(null)
  const [modalMessage, setModalMessage] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [modalLoadingAction, setModalLoadingAction] = useState<'save_role' | 'reset_password' | 'delete_user' | ''>('')
  const [roleSavedNotice, setRoleSavedNotice] = useState(false)
  const modalRef = useRef<HTMLDivElement | null>(null)

  const sortedUsers = useMemo(() => [...users].sort((a, b) => a.email.localeCompare(b.email)), [users])

  function openManageModal(user: UserAccount) {
    setSelectedUser(user)
    setSelectedRole(user.role)
    setNewPassword('')
    setConfirmPassword('')
    setModalError(null)
    setModalMessage(null)
    setConfirmDelete(false)
    setModalLoadingAction('')
    setRoleSavedNotice(false)
  }

  const closeManageModal = useCallback(() => {
    if (loading) return
    setSelectedUser(null)
    setModalError(null)
    setModalMessage(null)
    setConfirmDelete(false)
    setModalLoadingAction('')
  }, [loading])

  useEffect(() => {
    if (!selectedUser) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeManageModal()
        return
      }

      if (event.key !== 'Tab' || !modalRef.current) return

      const selectors = [
        'button:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
      ]
      const focusable = Array.from(
        modalRef.current.querySelectorAll<HTMLElement>(selectors.join(','))
      ).filter((element) => !element.hasAttribute('disabled'))

      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const current = document.activeElement as HTMLElement | null

      if (event.shiftKey && current === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && current === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [closeManageModal, selectedUser])

  useEffect(() => {
    if (!selectedUser || !modalRef.current) return
    const firstInput = modalRef.current.querySelector<HTMLElement>(
      'select:not([disabled]), input:not([disabled]), button:not([disabled])'
    )
    firstInput?.focus()
  }, [selectedUser])

  async function refreshWithMessage(successMessage: string) {
    setMessage(successMessage)
    setError(null)
    router.refresh()
  }

  async function handleCreateUser(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    setError(null)

    const result = await createUserByAdmin(email.trim().toLowerCase(), password, role)
    setLoading(false)

    if (!result.success) {
      setError(result.error || 'Gagal membuat user')
      return
    }

    setEmail('')
    setPassword('')
    setRole('viewer')
    await refreshWithMessage('User berhasil dibuat.')
  }

  async function handleSaveRole() {
    if (!selectedUser) return
    setLoading(true)
    setModalLoadingAction('save_role')
    setModalError(null)
    setModalMessage(null)
    const result = await updateUserRoleByAdmin(selectedUser.id, selectedRole)
    setLoading(false)
    setModalLoadingAction('')

    if (!result.success) {
      setModalError(result.error || 'Gagal mengubah role')
      return
    }

    setSelectedUser((prev) => (prev ? { ...prev, role: selectedRole } : prev))
    setRoleSavedNotice(true)
    setTimeout(() => setRoleSavedNotice(false), 1600)
    setModalMessage('Role user berhasil diperbarui.')
    await refreshWithMessage('Role user berhasil diperbarui.')
  }

  async function handleResetPassword() {
    if (!selectedUser) return
    if (newPassword.length < 6) {
      setModalError('Password minimal 6 karakter.')
      return
    }
    if (newPassword !== confirmPassword) {
      setModalError('Konfirmasi password tidak sama.')
      return
    }

    setLoading(true)
    setModalLoadingAction('reset_password')
    setModalError(null)
    setModalMessage(null)
    const result = await updateUserPasswordByAdmin(selectedUser.id, newPassword)
    setLoading(false)
    setModalLoadingAction('')

    if (!result.success) {
      setModalError(result.error || 'Gagal reset password')
      return
    }

    setNewPassword('')
    setConfirmPassword('')
    setModalMessage('Password user berhasil direset.')
    await refreshWithMessage('Password user berhasil direset.')
  }

  async function handleDeleteUser() {
    if (!selectedUser) return
    if (selectedUser.id === currentUserId) {
      setModalError('Akun sendiri tidak bisa dihapus.')
      return
    }
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }

    setLoading(true)
    setModalLoadingAction('delete_user')
    setModalError(null)
    setModalMessage(null)
    const result = await deleteUserByAdmin(selectedUser.id)
    setLoading(false)
    setModalLoadingAction('')

    if (!result.success) {
      setModalError(result.error || 'Gagal menghapus user')
      return
    }

    closeManageModal()
    await refreshWithMessage('User berhasil dihapus.')
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-5 md:p-10">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Kelola User</h1>
          <p className="text-zinc-400 mt-1">Hanya admin yang bisa mengatur akun dan role user.</p>
          <Link href="/" className="inline-block text-indigo-400 hover:text-indigo-300 mt-3 text-sm">
            Kembali ke silsilah
          </Link>
        </div>

        <form onSubmit={handleCreateUser} className="bg-zinc-900 border border-white/10 rounded-2xl p-5 space-y-4">
          <h2 className="text-lg font-semibold">Tambah User Baru</h2>
          <div className="grid md:grid-cols-3 gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="email@domain.com"
              className="bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="Password minimal 6 karakter"
              className="bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="md:col-span-1">
              <p className="text-xs uppercase tracking-wider text-zinc-400 mb-2">Role</p>
              <div className="grid grid-cols-3 gap-2">
                {roleOptions.map((option) => (
                  <motion.button
                    key={option}
                    type="button"
                    onClick={() => setRole(option)}
                    whileTap={{ scale: 0.97 }}
                    animate={{ scale: role === option ? 1.02 : 1 }}
                    transition={{ type: 'spring', stiffness: 420, damping: 26 }}
                    className={`min-h-11 rounded-xl border text-sm md:text-base font-medium capitalize transition-all flex items-center justify-center gap-1.5 ${roleChipClass(role === option)}`}
                    aria-pressed={role === option}
                  >
                    {role === option && <Check size={14} />}
                    {option}
                  </motion.button>
                ))}
              </div>
              <div className="mt-2 rounded-xl border border-indigo-500/20 bg-indigo-500/10 px-3 py-2.5">
                <p className="text-xs text-indigo-200">
                  Role dipilih: <span className="font-semibold">{roleMeta[role].label}</span>
                </p>
                <p className="text-xs text-zinc-300 mt-1">{roleMeta[role].description}</p>
              </div>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-500 hover:bg-indigo-600 disabled:opacity-60 px-5 py-2.5 rounded-xl font-semibold"
          >
            Tambah User
          </button>
        </form>

        {message && <p className="text-emerald-400 text-sm">{message}</p>}
        {error && <p className="text-red-400 text-sm">{error}</p>}

        <div className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10 text-xs uppercase tracking-wider text-zinc-400">
            Daftar User
          </div>
          <div className="divide-y divide-white/5">
            {sortedUsers.map((user) => (
              <div key={user.id} className="px-4 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm break-all">{user.email}</p>
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <span className={`text-xs px-2.5 py-1 rounded-full border ${roleBadgeClass(user.role)}`}>
                      {user.role}
                    </span>
                    <span className="text-xs text-zinc-500">
                      Dibuat: {new Date(user.created_at).toLocaleDateString('id-ID')}
                    </span>
                    {user.id === currentUserId && (
                      <span className="text-xs text-amber-400">(Akun Anda)</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => openManageModal(user)}
                  className="self-start md:self-auto px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-sm font-medium"
                >
                  Kelola
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70"
              onClick={closeManageModal}
            />
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.18 }}
              ref={modalRef}
              role="dialog"
              aria-modal="true"
              aria-label="Kelola User"
              className="relative w-full max-w-lg bg-zinc-900 border border-white/10 rounded-2xl p-5 space-y-5 max-h-[90vh] overflow-y-auto"
            >
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Settings2 size={18} className="text-indigo-300" />
                Kelola User
              </h3>
              <p className="text-sm text-zinc-400 break-all mt-1">{selectedUser.email}</p>
            </div>

            {modalMessage && <p className="text-sm text-emerald-400">{modalMessage}</p>}
            {modalError && <p className="text-sm text-red-400">{modalError}</p>}

            <section className="space-y-3 rounded-xl border border-white/10 p-4 bg-zinc-950/50">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Shield size={16} className="text-indigo-300" />
                Role Akses
              </h4>
              <p className="text-xs text-zinc-400">
                Role saat ini:
                <span className={`ml-2 inline-flex px-2 py-0.5 rounded-full border capitalize ${roleBadgeClass(selectedUser.role)}`}>
                  {selectedUser.role}
                </span>
              </p>
              <p className="text-xs text-zinc-400">
                Role dipilih:
                <span className={`ml-2 inline-flex px-2 py-0.5 rounded-full border capitalize ${roleBadgeClass(selectedRole)}`}>
                  {selectedRole}
                </span>
              </p>
              <div className="grid grid-cols-3 gap-2">
                {roleOptions.map((option) => (
                  <motion.button
                    key={option}
                    type="button"
                    onClick={() => setSelectedRole(option)}
                    whileTap={{ scale: 0.97 }}
                    animate={{ scale: selectedRole === option ? 1.02 : 1 }}
                    transition={{ type: 'spring', stiffness: 420, damping: 26 }}
                    className={`min-h-11 rounded-xl border text-sm md:text-base font-medium capitalize transition-all flex items-center justify-center gap-1.5 ${roleChipClass(selectedRole === option)}`}
                    aria-pressed={selectedRole === option}
                  >
                    {selectedRole === option && <Check size={14} />}
                    {option}
                  </motion.button>
                ))}
              </div>
              <div className="rounded-xl border border-white/10 bg-zinc-900/60 px-3 py-2.5">
                <p className="text-xs text-zinc-200">{roleMeta[selectedRole].description}</p>
                {selectedRole !== selectedUser.role ? (
                  <p className="text-xs text-amber-300 mt-1">Perubahan role belum disimpan. Tekan &quot;Simpan Role&quot;.</p>
                ) : (
                  <p className="text-xs text-zinc-500 mt-1">Belum ada perubahan role.</p>
                )}
              </div>
              {roleSavedNotice && (
                <p className="text-xs text-emerald-400">Perubahan role tersimpan.</p>
              )}
              <button
                disabled={loading || selectedRole === selectedUser.role}
                onClick={() => void handleSaveRole()}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {modalLoadingAction === 'save_role' ? 'Menyimpan...' : 'Simpan Role'}
              </button>
            </section>

            <section className="space-y-3 rounded-xl border border-white/10 p-4 bg-zinc-950/50">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <KeyRound size={16} className="text-amber-300" />
                Reset Password
              </h4>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Password baru (minimal 6 karakter)"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Konfirmasi password baru"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                disabled={loading}
                onClick={() => void handleResetPassword()}
                className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-60"
              >
                {modalLoadingAction === 'reset_password' ? 'Mereset...' : 'Reset Password'}
              </button>
            </section>

            <section className="space-y-3 rounded-xl border border-red-500/20 p-4 bg-red-500/5">
              <h4 className="text-sm font-semibold text-red-300 flex items-center gap-2">
                <TriangleAlert size={16} />
                Zona Bahaya
              </h4>
              {selectedUser.id === currentUserId ? (
                <p className="text-xs text-zinc-400">Akun sendiri tidak bisa dihapus.</p>
              ) : (
                <>
                  <p className="text-xs text-zinc-400">
                    Menghapus user akan menghilangkan akses login akun tersebut.
                  </p>
                  {confirmDelete && (
                    <p className="text-xs text-red-300">
                      Klik sekali lagi untuk konfirmasi hapus.
                    </p>
                  )}
                  <button
                    disabled={loading}
                    onClick={() => void handleDeleteUser()}
                    className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-60"
                  >
                    {modalLoadingAction === 'delete_user'
                      ? 'Menghapus...'
                      : confirmDelete
                        ? 'Ya, Hapus User'
                        : 'Hapus User'}
                  </button>
                </>
              )}
            </section>

            <div className="flex justify-end pt-1">
              <button
                disabled={loading}
                onClick={closeManageModal}
                className="px-4 py-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 disabled:opacity-60"
              >
                Tutup
              </button>
            </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
