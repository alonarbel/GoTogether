'use client'
import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '@/lib/auth-context'
import { fetchMyCards } from '@/lib/cards'
import { TravelCard } from '@/types'
import { TravelCardComponent } from './cards/TravelCardComponent'
import { Loader2, LogIn, CalendarDays, Plus } from 'lucide-react'
import Link from 'next/link'

export function MyEventsPage() {
  const t = useTranslations('myEvents')
  const { user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const locale = params.locale as string
  const [created, setCreated] = useState<TravelCard[]>([])
  const [joined, setJoined] = useState<TravelCard[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { setLoading(false); return }
    fetchMyCards(user.id).then(({ created, joined }) => {
      setCreated(created)
      setJoined(joined)
      setLoading(false)
    })
  }, [user])

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4">
          <div className="text-5xl">🔒</div>
          <h2 className="text-xl font-bold text-white">נדרשת התחברות</h2>
          <Link href={`/${locale}/auth`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-medium">
            <LogIn className="w-4 h-4" /> כניסה / הרשמה
          </Link>
        </motion.div>
      </div>
    )
  }

  const isPast = (card: TravelCard) =>
    card.eventDate ? new Date(card.eventDate) < new Date() : false

  const activeCreated = created.filter(c => !isPast(c))
  const pastCreated = created.filter(c => isPast(c))
  const activeJoined = joined.filter(c => !isPast(c))
  const pastJoined = joined.filter(c => isPast(c))

  const Section = ({ title, cards, emptyMsg }: { title: string; cards: TravelCard[]; emptyMsg?: string }) => (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white flex items-center gap-2">
        <CalendarDays className="w-5 h-5 text-teal-400" />
        {title}
        <span className="text-sm font-normal text-gray-500 ms-1">({cards.length})</span>
      </h2>
      {cards.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {cards.map((card, i) => <TravelCardComponent key={card.id} card={card} index={i} />)}
        </div>
      ) : (
        <div className="py-8 text-center text-gray-600 bg-gray-900/40 rounded-2xl border border-white/5">
          {emptyMsg || t('empty')}
        </div>
      )}
    </div>
  )

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">{t('title')}</h1>
            <p className="text-gray-400 mt-1">{t('emptySub')}</p>
          </div>
          <Link href={`/${locale}/create`}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-sm font-medium hover:from-teal-400 hover:to-cyan-400 transition-all">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:block">צור כרטיסייה</span>
          </Link>
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="space-y-10">
            <Section title={`✨ ${t('created')} — ${t('active')}`} cards={activeCreated} />
            <Section title={`👥 ${t('joined')} — ${t('active')}`} cards={activeJoined} />
            {(pastCreated.length > 0 || pastJoined.length > 0) && (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-white/5" />
                  <span className="text-sm text-gray-500">{t('past')}</span>
                  <div className="flex-1 h-px bg-white/5" />
                </div>
                {pastCreated.length > 0 && <Section title={`${t('created')} — ${t('past')}`} cards={pastCreated} />}
                {pastJoined.length > 0 && <Section title={`${t('joined')} — ${t('past')}`} cards={pastJoined} />}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  )
}
