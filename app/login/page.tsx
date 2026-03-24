'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, Mail, Loader2, AlertCircle, CheckCircle2, ChevronRight, ArrowRight } from 'lucide-react'
import { login } from '@/lib/actions-auth'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<{ type: 'error' | 'success', message: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setStatus(null)

    const formData = new FormData()
    formData.append('email', email)
    formData.append('password', password)

    try {
      const res = await login(formData)
      if (res.success) {
        setStatus({ type: 'success', message: 'Login berhasil! Mengalihkan...' })
        setTimeout(() => {
          router.push('/')
          router.refresh()
        }, 1000)
      } else {
        setStatus({ type: 'error', message: res.error || 'Login gagal' })
        setLoading(false)
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'Terjadi kesalahan sistem' })
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-zinc-950 selection:bg-indigo-500/30 selection:text-indigo-500 overflow-hidden relative">
      {/* Background elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="mb-8 text-center">
          <motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 mb-6"
          >
            <Lock className="w-8 h-8 text-indigo-500" />
          </motion.div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Selamat Datang</h1>
          <p className="text-zinc-400">Masuk untuk mengakses aplikasi pohon keluarga</p>
        </div>

        <motion.div 
          className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 p-8 rounded-3xl"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300 ml-1">Email</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-zinc-500 group-focus-within:text-indigo-500 transition-colors" />
                </div>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  className="block w-full pl-11 pr-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-white placeholder:text-zinc-600 outline-hidden"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300 ml-1">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-zinc-500 group-focus-within:text-indigo-500 transition-colors" />
                </div>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="block w-full pl-11 pr-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-white placeholder:text-zinc-600 outline-hidden"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <AnimatePresence mode="wait">
              {status && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`flex items-start gap-3 p-4 rounded-xl text-sm ${
                    status.type === 'error' 
                      ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  }`}
                >
                  {status.type === 'error' ? (
                    <AlertCircle className="w-5 h-5 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                  )}
                  <p>{status.message}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading}
              className="w-full relative group"
            >
              <div className="absolute inset-0 bg-indigo-600 rounded-xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity" />
              <div className="relative flex items-center justify-center w-full py-3 px-6 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-500 active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100 disabled:cursor-not-allowed">
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <>
                    <span>Masuk</span>
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </div>
            </button>
          </form>
        </motion.div>

        <p className="mt-8 text-center text-sm text-zinc-500">
          Belum punya akun? Hubungi <a target='_blank' href="https://link.fiandev.com" className="text-indigo-500 hover:text-indigo-400">admin</a> untuk akses
        </p>
      </motion.div>
    </div>
  )
}
