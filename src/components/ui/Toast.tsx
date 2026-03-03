'use client'
import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, XCircle, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToastType = 'success' | 'error' | 'info'
interface Toast { id: string; message: string; type: ToastType }
interface ToastContextValue { toast: (message: string, type?: ToastType) => void }

const ToastContext = createContext<ToastContextValue>({ toast: () => {} })

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }, [])

  const remove = (id: string) => setToasts(prev => prev.filter(t => t.id !== id))

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 inset-x-0 flex flex-col items-center gap-2 z-50 pointer-events-none px-4">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className={cn(
                'pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-xl border max-w-sm w-full',
                t.type === 'success' && 'bg-green-950/80 border-green-500/30 text-green-300',
                t.type === 'error'   && 'bg-red-950/80 border-red-500/30 text-red-300',
                t.type === 'info'    && 'bg-gray-900/90 border-white/10 text-gray-200',
              )}
            >
              {t.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0" />}
              {t.type === 'error'   && <XCircle className="w-4 h-4 shrink-0" />}
              {t.type === 'info'    && <Info className="w-4 h-4 shrink-0" />}
              <span className="text-sm flex-1">{t.message}</span>
              <button onClick={() => remove(t.id)} className="opacity-50 hover:opacity-100 transition-opacity">
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
