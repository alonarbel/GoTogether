'use client'
import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '@/lib/auth-context'
import { fetchMyCards } from '@/lib/cards'
import { TravelCard } from '@/types'
import { TravelCardComponent } from './cards/TravelCardComponent'
import { Loader2, LogIn, Plus } from 'lucide-react'
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
          <div className="font-display text-7xl text-[--color-bone-600]">⛓</div>
          <h2 className="font-display text-[--color-bone-50] text-2xl">נדרשת התחברות</h2>
          <Link href={`/${locale}/auth`}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-sm
                       font-mono text-[11px] tracking-[0.18em] uppercase font-semibold
                       bg-[--color-amber-400] text-[--color-amber-ink] hover:bg-[--color-amber-500]
                       transition-all shadow-[0_8px_28px_rgba(251,191,36,.18)]">
            <LogIn className="w-3.5 h-3.5" strokeWidth={2.5} /> sign in / register
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

  const Section = ({ index, label, cards, emptyMsg }: {
    index: string; label: string; cards: TravelCard[]; emptyMsg?: string
  }) => (
    <section className="space-y-5">
      <header className="flex items-center justify-between gap-4 pb-3 border-b border-[--color-ink-800]">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] tracking-[0.18em] text-[--color-amber-400]">№ {index}</span>
          <h2 className="font-display text-[--color-bone-50] text-2xl">{label}</h2>
          <span className="font-mono text-[11px] text-[--color-bone-400] tabular-nums">
            ({String(cards.length).padStart(2, '0')})
          </span>
        </div>
      </header>
      {cards.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {cards.map((card, i) => <TravelCardComponent key={card.id} card={card} index={i} />)}
        </div>
      ) : (
        <div className="py-10 text-center font-mono text-[11px] tracking-[0.16em] uppercase text-[--color-bone-600]
                        rounded-sm border border-dashed border-[--color-ink-800]">
          {emptyMsg || t('empty')}
        </div>
      )}
    </section>
  )

  return (
    <div className="min-h-screen pt-28 pb-20 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-end justify-between gap-6 flex-wrap">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="w-8 h-px bg-[--color-amber-400]" />
              <span className="eyebrow text-[--color-amber-400]">— your dossier</span>
            </div>
            <h1 className="headline text-[--color-bone-50] text-5xl sm:text-6xl">{t('title')}</h1>
            <p className="text-[--color-bone-400] text-sm max-w-md">{t('emptySub')}</p>
          </div>
          <Link href={`/${locale}/create`}
            className="flex items-center gap-2 px-4 py-2.5 rounded-sm
                       font-mono text-[11px] tracking-[0.18em] uppercase font-semibold
                       bg-[--color-amber-400] text-[--color-amber-ink] hover:bg-[--color-amber-500]
                       transition-all shadow-[0_8px_28px_rgba(251,191,36,.18)]">
            <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
            <span className="hidden sm:block">{t('created')}</span>
          </Link>
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-32">
            <Loader2 className="w-6 h-6 text-[--color-amber-400] animate-spin" />
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
            className="space-y-14">
            <Section index="01" label={`${t('created')} · ${t('active')}`} cards={activeCreated} />
            <Section index="02" label={`${t('joined')} · ${t('active')}`} cards={activeJoined} />

            {(pastCreated.length > 0 || pastJoined.length > 0) && (
              <div className="space-y-14 pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-[--color-ink-800]" />
                  <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-[--color-bone-600]">
                    archive · {t('past')}
                  </span>
                  <div className="flex-1 h-px bg-[--color-ink-800]" />
                </div>
                {pastCreated.length > 0 && <Section index="03" label={`${t('created')} · ${t('past')}`} cards={pastCreated} />}
                {pastJoined.length > 0 && <Section index="04" label={`${t('joined')} · ${t('past')}`} cards={pastJoined} />}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  )
}
