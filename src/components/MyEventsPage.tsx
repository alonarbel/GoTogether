'use client'
import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '@/lib/auth-context'
import { fetchMyCards } from '@/lib/cards'
import { TravelCard } from '@/types'
import { TravelCardComponent } from './cards/TravelCardComponent'
import { Loader2, LogIn, Plus, Sparkles } from 'lucide-react'
import Link from 'next/link'

export function MyEventsPage() {
  const t = useTranslations('myEvents')
  const { user } = useAuth()
  const params = useParams()
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
      <div className="min-h-screen grid place-items-center px-4">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-5">
          <div className="text-7xl">🔒</div>
          <h2 className="font-display text-[--color-mist-50] text-2xl font-semibold">נדרשת התחברות</h2>
          <Link href={`/${locale}/auth`}
            className="btn-primary inline-flex items-center gap-2 px-5 py-3 rounded-full text-[13px] font-semibold">
            <LogIn className="w-4 h-4 relative z-[1]" strokeWidth={2.5} /> <span className="relative z-[1]">sign in / register</span>
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

  const Section = ({ accent, label, cards, emptyMsg }: {
    accent: 'coral' | 'cyan' | 'mist'; label: string; cards: TravelCard[]; emptyMsg?: string
  }) => (
    <section className="space-y-5">
      <header className="flex items-center gap-3">
        <span className={`w-8 h-px bg-gradient-to-r ${
          accent === 'coral' ? 'from-[--color-coral-500]' :
          accent === 'cyan'  ? 'from-[--color-cyan-400]' :
                               'from-[--color-mist-400]'
        } to-transparent`} />
        <h2 className="font-display text-[--color-mist-50] text-2xl font-semibold flex items-baseline gap-2">
          {label}
          <span className="font-mono text-sm text-[--color-mist-300] tabular-nums">
            {cards.length}
          </span>
        </h2>
      </header>
      {cards.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {cards.map((card, i) => <TravelCardComponent key={card.id} card={card} index={i} />)}
        </div>
      ) : (
        <div className="py-12 text-center text-[12px] font-medium text-[--color-mist-500]
                        rounded-xl border border-dashed border-[--color-mist-500]">
          {emptyMsg || t('empty')}
        </div>
      )}
    </section>
  )

  return (
    <div className="min-h-screen pt-28 pb-20 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto space-y-12">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-end justify-between gap-6 flex-wrap">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full
                            bg-[--color-night-900] border border-[--color-mist-500] backdrop-blur-md
                            text-[11px] font-mono text-[--color-mist-200] tracking-wide">
              <Sparkles className="w-3 h-3 text-[--color-amber-400]" strokeWidth={2.5} />
              <span>your dossier</span>
            </div>
            <h1 className="headline-xl text-[--color-mist-50] text-5xl sm:text-6xl">
              <span className="text-gradient">{t('title')}</span>
            </h1>
            <p className="text-[--color-mist-300] text-base max-w-md">{t('emptySub')}</p>
          </div>
          <Link href={`/${locale}/create`}
            className="btn-primary flex items-center gap-2 px-5 py-3 rounded-full text-[13px] font-semibold">
            <Plus className="w-4 h-4 relative z-[1]" strokeWidth={2.5} />
            <span className="hidden sm:block relative z-[1]">{t('created')}</span>
          </Link>
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-32">
            <Loader2 className="w-6 h-6 text-[--color-coral-400] animate-spin" />
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
            className="space-y-14">
            <Section accent="coral" label={`${t('created')} · ${t('active')}`} cards={activeCreated} />
            <Section accent="cyan" label={`${t('joined')} · ${t('active')}`} cards={activeJoined} />

            {(pastCreated.length > 0 || pastJoined.length > 0) && (
              <div className="space-y-14 pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-[--color-night-900]" />
                  <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-[--color-mist-500]">
                    archive · {t('past')}
                  </span>
                  <div className="flex-1 h-px bg-[--color-night-900]" />
                </div>
                {pastCreated.length > 0 && <Section accent="mist" label={`${t('created')} · ${t('past')}`} cards={pastCreated} />}
                {pastJoined.length > 0 && <Section accent="mist" label={`${t('joined')} · ${t('past')}`} cards={pastJoined} />}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  )
}
