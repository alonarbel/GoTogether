'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Users, Check, Sparkles, AlertTriangle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import {
  fetchNotifications, markAsRead, markAllAsRead, unreadCount,
  AppNotification, NotificationType,
} from '@/lib/notifications'

interface NotificationsBellProps {
  userId: string
  locale: string
}

const ICON_BY_TYPE: Record<NotificationType, typeof Users> = {
  participant_joined: Users,
  min_reached: Sparkles,
  deadline_soon: AlertTriangle,
}

const COLOR_BY_TYPE: Record<NotificationType, string> = {
  participant_joined: 'text-[--color-coral-400]',
  min_reached: 'text-[--color-emerald-400]',
  deadline_soon: 'text-[--color-amber-400]',
}

export function NotificationsBell({ userId, locale }: NotificationsBellProps) {
  const t = useTranslations('notifications')
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<AppNotification[]>([])
  const [count, setCount] = useState(0)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    const tick = async () => {
      const n = await unreadCount(userId)
      if (!cancelled) setCount(n)
    }
    tick()
    const id = setInterval(tick, 60000)
    return () => { cancelled = true; clearInterval(id) }
  }, [userId])

  useEffect(() => {
    if (open) fetchNotifications(userId).then(setItems)
  }, [open, userId])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleClick = async (n: AppNotification) => {
    if (!n.read) {
      await markAsRead(n.id)
      setItems(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))
      setCount(c => Math.max(0, c - 1))
    }
    if (n.card_id) router.push(`/${locale}/cards/${n.card_id}`)
    setOpen(false)
  }

  const handleMarkAll = async () => {
    await markAllAsRead(userId)
    setItems(prev => prev.map(x => ({ ...x, read: true })))
    setCount(0)
  }

  const formatMessage = (n: AppNotification) => {
    const actor = n.actor_name || t('someone')
    const title = n.card_title || ''
    if (n.type === 'participant_joined') return t('participantJoined', { name: actor, card: title })
    if (n.type === 'min_reached') return t('minReached', { card: title })
    if (n.type === 'deadline_soon') return t('deadlineSoon', { card: title })
    return ''
  }

  const formatTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return t('justNow')
    if (mins < 60) return t('minutesAgo', { count: mins })
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return t('hoursAgo', { count: hrs })
    const days = Math.floor(hrs / 24)
    return t('daysAgo', { count: days })
  }

  return (
    <div ref={wrapperRef} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="relative flex items-center justify-center w-9 h-9 rounded-lg
                   text-[--color-mist-300] hover:text-[--color-coral-400] hover:bg-white/[0.04]
                   transition-all"
      >
        <Bell className="w-3.5 h-3.5" strokeWidth={2} />
        {count > 0 && (
          <span className="absolute top-0.5 end-0.5 min-w-[16px] h-[16px] px-1 rounded-full
                           bg-gradient-to-br from-[--color-coral-500] to-[--color-rose-500]
                           text-white text-[10px] font-mono font-bold tabular-nums
                           grid place-items-center
                           shadow-[0_0_8px_rgba(255,84,112,.5)]">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
            className="glass-strong absolute end-0 top-full mt-2 w-80 z-[200] overflow-hidden rounded-xl"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
              <h3 className="font-display text-[--color-mist-50] text-sm font-semibold">{t('title')}</h3>
              {count > 0 && (
                <button
                  onClick={handleMarkAll}
                  className="flex items-center gap-1 text-[11px] font-semibold
                             text-[--color-coral-400] hover:text-[--color-coral-300] transition-colors"
                >
                  <Check className="w-3 h-3" strokeWidth={2.5} />
                  {t('markAllRead')}
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {items.length === 0 ? (
                <div className="px-4 py-12 text-center text-[12px] text-[--color-mist-500]">
                  {t('empty')}
                </div>
              ) : (
                items.map(n => {
                  const Icon = ICON_BY_TYPE[n.type] || Bell
                  const color = COLOR_BY_TYPE[n.type] || 'text-[--color-mist-300]'
                  return (
                    <button
                      key={n.id}
                      onClick={() => handleClick(n)}
                      className={`w-full flex items-start gap-3 px-4 py-3 transition-colors text-start
                                  border-b border-white/[0.04] last:border-0 ${
                        n.read ? 'hover:bg-white/[0.03]'
                               : 'bg-gradient-to-r from-[--color-coral-500]/8 to-transparent hover:from-[--color-coral-500]/12'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full grid place-items-center flex-shrink-0
                                       bg-white/[0.05] border border-white/[0.06] ${color}`}>
                        <Icon className="w-3.5 h-3.5" strokeWidth={2} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] text-[--color-mist-100] leading-snug">{formatMessage(n)}</p>
                        <p className="text-[10px] font-mono text-[--color-mist-400] mt-1">
                          {formatTime(n.created_at)}
                        </p>
                      </div>
                      {!n.read && <div className="w-2 h-2 rounded-full bg-[--color-coral-500] flex-shrink-0 mt-2 shadow-[0_0_6px_rgba(255,84,112,.6)]" />}
                    </button>
                  )
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
