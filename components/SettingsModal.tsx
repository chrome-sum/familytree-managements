'use client'

import React, { useState } from 'react'
import { X, Lock, ShieldCheck, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { changePassword } from '@/lib/actions-auth'
import { useFamilyTree } from './FamilyTreeContext'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { isLoggedIn } = useFamilyTree()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)
    
    const formData = new FormData(e.currentTarget)
    const oldPass = formData.get('oldPassword') as string
    const newPass = formData.get('newPassword') as string
    const confirmPass = formData.get('confirmPassword') as string

    if (newPass !== confirmPass) {
      setError('Konfirmasi password tidak cocok')
      setLoading(false)
      return
    }

    const result = await changePassword(oldPass, newPass)
    
    setLoading(false)
    if (result.success) {
      setSuccess(true)
      setTimeout(() => {
        onClose()
        setSuccess(false)
      }, 2000)
    } else {
      setError(result.error || 'Gagal mengubah password')
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-md bg-zinc-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Pengaturan Profil</h2>
              <p className="text-zinc-500 text-sm mt-1">Ganti password akun Anda</p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-white/5 text-zinc-500 transition-all"
            >
              <X size={20} />
            </button>
          </div>

          {!isLoggedIn ? (
            <div className="py-8 text-center">
              <AlertCircle size={40} className="mx-auto text-amber-500 mb-4" />
              <p className="text-white font-medium">Anda harus login untuk mengakses pengaturan</p>
            </div>
          ) : success ? (
            <div className="py-12 text-center animate-in zoom-in-95">
              <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={40} className="text-emerald-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Berhasil!</h3>
              <p className="text-zinc-400">Password Anda telah diperbarui</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-in slide-in-from-top-2">
                  <AlertCircle size={18} />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">Password Lama</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
                  <input 
                    type="password" 
                    name="oldPassword"
                    required
                    placeholder="••••••••"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all font-medium text-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5 pt-2">
                <div className="h-px bg-white/5 mx-1" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">Password Baru</label>
                <div className="relative group">
                  <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-emerald-400 transition-colors" size={18} />
                  <input 
                    type="password" 
                    name="newPassword"
                    required
                    placeholder="Minimal 6 karakter"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all font-medium text-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">Konfirmasi Password</label>
                <div className="relative group">
                  <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-emerald-400 transition-colors" size={18} />
                  <input 
                    type="password" 
                    name="confirmPassword"
                    required
                    placeholder="Ulangi password baru"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all font-medium text-white"
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:hover:bg-indigo-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-indigo-500/20 mt-4 h-14"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <span>Perbarui Password</span>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
