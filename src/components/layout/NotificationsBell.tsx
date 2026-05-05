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
  participant_joined: 'text-[--color-amber-400]',
  min_reached: 'text-[--color-emerald-400]',
  deadline_soon: 'text-[--color-rust-400]',
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
        className="relative flex items-center justify-center w-9 h-9 rounded-sm
                   text-[--color-bone-400] hover:text-[--color-amber-400] hover:bg-[rgba(255,255,255,.03)]
                   transition-all"
      >
        <Bell className="w-3.5 h-3.5" strokeWidth={2} />
        {count > 0 && (
          <span className="absolute top-0.5 end-0.5 min-w-[16px] h-[16px] px-1 rounded-full
                           bg-[--color-amber-400] text-[--color-amber-ink] text-[10px] font-mono font-bold
                           tabular-nums flex items-center justify-center">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
            className="absolute end-0 top-full mt-2 w-80 z-[200] overflow-hidden
                       bg-[--color-ink-850] border border-[rgba(255,255,255,.08)] rounded-sm
                       shadow-[0_24px_64px_rgba(0,0,0,.5)]"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-[--color-ink-700]">
              <h3 className="eyebrow">— {t('title')}</h3>
              {count > 0 && (
                <button
                  onClick={handleMarkAll}
                  className="flex items-center gap-1
                             font-mono text-[10px] tracking-[0.14em] uppercase
                             text-[--color-amber-400] hover:text-[--color-amber-500] transition-colors"
                >
                  <Check className="w-3 h-3" strokeWidth={2.5} />
                  {t('markAllRead')}
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {items.length === 0 ? (
                <div className="px-4 py-12 text-center font-mono text-[11px] tracking-[0.14em] uppercase text-[--color-bone-600]">
                  {t('empty')}
                </div>
              ) : (
                items.map(n => {
                  const Icon = ICON_BY_TYPE[n.type] || Bell
                  const color = COLOR_BY_TYPE[n.type] || 'text-[--color-bone-400]'
                  return (
                    <button
                      key={n.id}
                      onClick={() => handleClick(n)}
                      className={`w-full flex items-start gap-3 px-4 py-3 transition-colors text-start
                                  border-b border-[--color-ink-800] last:border-0 ${
                        n.read ? 'hover:bg-[rgba(255,255,255,.03)]'
                               : 'bg-[--color-amber-400]/5 hover:bg-[--color-amber-400]/10'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full bg-[--color-ink-800] border border-[--color-ink-700]
                                       grid place-items-center flex-shrink-0 ${color}`}>
                        <Icon className="w-3.5 h-3.5" strokeWidth={2} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] text-[--color-bone-200] leading-snug">{formatMessage(n)}</p>
                        <p className="font-mono text-[10px] tracking-[0.12em] uppercase text-[--color-bone-400] mt-1">
                          {formatTime(n.created_at)}
                        </p>
                      </div>
                      {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-[--color-amber-400] flex-shrink-0 mt-2" />}
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
