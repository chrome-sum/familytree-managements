'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, CheckCircle2, X } from 'lucide-react'
import { cn } from './PersonCard'

interface AppAlertProps {
  isOpen: boolean
  onClose: () => void
  onConfirm?: () => void
  title: string
  message: string
  type?: 'danger' | 'warning' | 'info' | 'success'
  confirmText?: string
  cancelText?: string
}

export default function AppAlert({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'danger',
  confirmText = 'Lanjutkan',
  cancelText = 'Batal'
}: AppAlertProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-sm bg-zinc-900 border border-white/10 rounded-3xl p-8 shadow-2xl overflow-hidden"
          >
            {/* Background Accent */}
            <div className={cn(
              "absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[80px] opacity-20",
              type === 'danger' ? "bg-red-500" : type === 'warning' ? "bg-amber-500" : "bg-indigo-500"
            )} />

            <div className="flex flex-col items-center text-center">
              <div className={cn(
                "w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-xl",
                type === 'danger' ? "bg-red-500/10 text-red-500" : 
                type === 'warning' ? "bg-amber-500/10 text-amber-500" : 
                "bg-indigo-500/10 text-indigo-500"
              )}>
                {type === 'danger' || type === 'warning' ? <AlertCircle size={32} /> : <CheckCircle2 size={32} />}
              </div>
              
              <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
              <p className="text-zinc-400 text-sm leading-relaxed mb-8">{message}</p>

              <div className="flex flex-col gap-2 w-full">
                {onConfirm && (
                   <button 
                    onClick={() => { onConfirm(); onClose(); }}
                    className={cn(
                      "w-full py-4 rounded-2xl font-bold transition-all active:scale-95 shadow-lg",
                      type === 'danger' ? "bg-red-500 hover:bg-red-600 text-white shadow-red-500/20" : 
                      "bg-white text-black hover:bg-zinc-200"
                    )}
                  >
                    {confirmText}
                  </button>
                )}
                <button 
                  onClick={onClose}
                  className="w-full py-4 rounded-2xl font-bold text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
                >
                  {onConfirm ? cancelText : 'Tutup'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
