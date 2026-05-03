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
  participant_joined: 'text-teal-400',
  min_reached: 'text-emerald-400',
  deadline_soon: 'text-amber-400',
}

export function NotificationsBell({ userId, locale }: NotificationsBellProps) {
  const t = useTranslations('notifications')
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<AppNotification[]>([])
  const [count, setCount] = useState(0)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Initial unread count + poll every 60s
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

  // Load list when dropdown opens
  useEffect(() => {
    if (open) {
      fetchNotifications(userId).then(setItems)
    }
  }, [open, userId])

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
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
        className="relative flex items-center justify-center w-9 h-9 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all"
      >
        <Bell className="w-4 h-4" />
        {count > 0 && (
          <span className="absolute top-1 end-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            className="absolute end-0 top-full mt-2 w-80 bg-gray-900 border border-white/10 rounded-xl shadow-xl shadow-black/40 overflow-hidden z-[200]"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
              <h3 className="text-sm font-semibold text-white">{t('title')}</h3>
              {count > 0 && (
                <button
                  onClick={handleMarkAll}
                  className="flex items-center gap-1 text-xs text-teal-400 hover:text-teal-300 transition-colors"
                >
                  <Check className="w-3 h-3" />
                  {t('markAllRead')}
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {items.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-gray-500">
                  {t('empty')}
                </div>
              ) : (
                items.map(n => {
                  const Icon = ICON_BY_TYPE[n.type] || Bell
                  const color = COLOR_BY_TYPE[n.type] || 'text-gray-400'
                  return (
                    <button
                      key={n.id}
                      onClick={() => handleClick(n)}
                      className={`w-full flex items-start gap-3 px-4 py-3 transition-colors text-start border-b border-white/5 last:border-0 ${
                        n.read ? 'hover:bg-white/5' : 'bg-teal-500/5 hover:bg-teal-500/10'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0 ${color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-gray-200 leading-snug">{formatMessage(n)}</p>
                        <p className="text-xs text-gray-500 mt-1">{formatTime(n.created_at)}</p>
                      </div>
                      {!n.read && <div className="w-2 h-2 rounded-full bg-teal-400 flex-shrink-0 mt-2" />}
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
