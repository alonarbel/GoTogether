'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { fetchMyCards } from '@/lib/cards'
import { fetchOrganizerReviews, Review } from '@/lib/reviews'
import { TravelCard } from '@/types'
import { getCardTypeIcon, cn } from '@/lib/utils'
import { ArrowLeft, Star, MapPin, Briefcase, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface PublicProfilePageProps {
  userId: string
  locale: string
}

export function PublicProfilePage({ userId, locale }: PublicProfilePageProps) {
  const router = useRouter()
  const t = useTranslations('reviews')
  const [profile, setProfile] = useState<{ full_name: string; avatar_url?: string; title?: string; bio?: string } | null>(null)
  const [activeEvents, setActiveEvents] = useState<TravelCard[]>([])
  const [pastEvents, setPastEvents] = useState<TravelCard[]>([])
  const [orgReviews, setOrgReviews] = useState<Review[]>([])
  const [orgAvg, setOrgAvg] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const [{ data: profileData }, myCards, reviewData] = await Promise.all([
        supabase.from('profiles').select('full_name, avatar_url, title, bio').eq('id', userId).single(),
        fetchMyCards(userId),
        fetchOrganizerReviews(userId),
      ])

      setProfile(profileData)

      const today = new Date().toISOString().split('T')[0]
      const all = [...myCards.created, ...myCards.joined]
      const seen = new Set<string>()
      const dedup = (arr: TravelCard[]) => arr.filter(c => { if (seen.has(c.id)) return false; seen.add(c.id); return true })

      seen.clear()
      setActiveEvents(dedup(all.filter(c => !c.eventDate || c.eventDate >= today)))
      seen.clear()
      setPastEvents(dedup(all.filter(c => c.eventDate && c.eventDate < today)))

      setOrgReviews(reviewData.reviews)
      setOrgAvg(reviewData.average)
      setLoading(false)
    }
    load()
  }, [userId])

  if (loading) {
    return (
      <div className="min-h-screen pt-32 grid place-items-center">
        <Loader2 className="w-6 h-6 animate-spin text-[--color-amber-400]" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen pt-32 text-center">
        <div className="font-display text-7xl text-[--color-bone-600] mb-4">∅</div>
        <p className="font-mono text-[11px] tracking-[0.18em] uppercase text-[--color-bone-400]">user not found</p>
      </div>
    )
  }

  const initials = profile.full_name.trim().split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2) || '?'
  const organizedEvents = [...activeEvents, ...pastEvents].filter(c => c.createdByUserId === userId)
  const totalEventsOrganized = organizedEvents.length
  const organizedTypes = [...new Set(organizedEvents.map(c => c.type))]

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-8">
        <button onClick={() => router.back()}
          className="flex items-center gap-2 mb-10 group
                     font-mono text-[11px] tracking-[0.18em] uppercase
                     text-[--color-bone-400] hover:text-[--color-amber-400] transition-colors link-underline">
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" strokeWidth={2} />
          back
        </button>

        {/* Profile masthead */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-7 pb-10 border-b border-[--color-ink-800]"
        >
          <div className="flex items-center gap-3">
            <span className="w-8 h-px bg-[--color-amber-400]" />
            <span className="eyebrow text-[--color-amber-400]">— profile · {totalEventsOrganized} organized</span>
          </div>

          <div className="flex items-center gap-5">
            <div className="w-24 h-24 rounded-full overflow-hidden grid place-items-center
                            bg-[--color-ink-800] border border-[--color-amber-400]/30
                            text-[--color-bone-200] font-display text-3xl shrink-0">
              {profile.avatar_url
                ? <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
                : initials}
            </div>
            <div className="space-y-1.5 min-w-0">
              <h1 className="headline text-[--color-bone-50] text-4xl sm:text-5xl">{profile.full_name}</h1>
              {profile.title && (
                <p className="font-mono text-[11px] tracking-[0.16em] uppercase text-[--color-amber-400] flex items-center gap-1.5">
                  <Briefcase className="w-3 h-3" strokeWidth={2} />
                  {profile.title}
                </p>
              )}
              <p className="font-mono text-[11px] text-[--color-bone-400] tabular-nums">
                {activeEvents.length + pastEvents.length} events · {orgReviews.length} reviews
              </p>
            </div>
          </div>

          {profile.bio && (
            <p className="font-display text-[--color-bone-200] text-base leading-relaxed max-w-xl">
              {profile.bio}
            </p>
          )}

          {organizedTypes.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {organizedTypes.map(type => (
                <span key={type} className="font-mono text-[10px] tracking-[0.16em] uppercase
                                            px-2.5 py-1 text-[--color-bone-200]
                                            border border-[--color-ink-700]">
                  <span aria-hidden>{getCardTypeIcon(type)}</span> {type}
                </span>
              ))}
            </div>
          )}

          {orgAvg && (
            <div className="grid grid-cols-3 gap-px bg-[--color-ink-700] rounded-sm overflow-hidden max-w-md">
              <div className="bg-[--color-ink-900] p-4 text-center">
                <div className="font-display text-3xl text-[--color-amber-400] tabular-nums leading-none">
                  {orgAvg.toFixed(1)}
                </div>
                <div className="flex justify-center gap-0.5 mt-2">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star key={i} className={cn('w-2.5 h-2.5', i < Math.round(orgAvg) ? 'text-[--color-amber-400] fill-[--color-amber-400]' : 'text-[--color-ink-700]')} />
                  ))}
                </div>
                <div className="eyebrow mt-2 text-[8px]">avg rating</div>
              </div>
              <div className="bg-[--color-ink-900] p-4 text-center">
                <div className="font-display text-3xl text-[--color-bone-50] tabular-nums leading-none">
                  {String(orgReviews.length).padStart(2, '0')}
                </div>
                <div className="eyebrow mt-2 text-[8px]">reviews</div>
              </div>
              <div className="bg-[--color-ink-900] p-4 text-center">
                <div className="font-display text-3xl text-[--color-bone-50] tabular-nums leading-none">
                  {String(totalEventsOrganized).padStart(2, '0')}
                </div>
                <div className="eyebrow mt-2 text-[8px]">organized</div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Active events */}
        {activeEvents.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-10 space-y-4"
          >
            <header className="flex items-center gap-3">
              <span className="w-6 h-px bg-[--color-amber-400]" />
              <h2 className="eyebrow">— active events</h2>
            </header>
            <div className="grid sm:grid-cols-2 gap-2">
              {activeEvents.map(card => <PublicEventRow key={card.id} card={card} locale={locale} />)}
            </div>
          </motion.section>
        )}

        {/* Past events */}
        {pastEvents.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.14 }}
            className="mt-10 space-y-4"
          >
            <header className="flex items-center gap-3">
              <span className="w-6 h-px bg-[--color-bone-400]" />
              <h2 className="eyebrow">— {t('pastEvents')}</h2>
            </header>
            <div className="grid sm:grid-cols-2 gap-2">
              {pastEvents.map(card => <PublicEventRow key={card.id} card={card} locale={locale} muted />)}
            </div>
          </motion.section>
        )}

        {/* Reviews */}
        {orgReviews.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="mt-10 space-y-4"
          >
            <header className="flex items-center gap-3">
              <Star className="w-3.5 h-3.5 text-[--color-amber-400] fill-[--color-amber-400]" />
              <h2 className="eyebrow">— {t('reviewsReceived')}</h2>
            </header>
            <div className="space-y-3">
              {orgReviews.map(r => (
                <div key={r.id} className="p-5 border border-[rgba(255,255,255,.05)] rounded-sm space-y-3 bg-[--color-ink-900]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full overflow-hidden grid place-items-center bg-[--color-ink-800] text-[11px] font-mono text-[--color-bone-200] border border-[--color-ink-700]">
                        {r.reviewer_avatar
                          ? <img src={r.reviewer_avatar} alt={r.reviewer_name} className="w-full h-full object-cover" />
                          : r.reviewer_name[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div className="text-[13px] font-display text-[--color-bone-50]">{r.reviewer_name}</div>
                        {r.card_title && <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-[--color-bone-400] mt-0.5">{r.card_title}</div>}
                      </div>
                    </div>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }, (_, i) => {
                        const rating = r.organizer_rating || r.card_rating || 0
                        return <Star key={i} className={cn('w-3 h-3', i < rating ? 'text-[--color-amber-400] fill-[--color-amber-400]' : 'text-[--color-ink-700]')} />
                      })}
                    </div>
                  </div>
                  {r.comment && (
                    <p className="text-[13px] text-[--color-bone-200] leading-relaxed border-s-2 border-[--color-amber-400]/40 ps-3 italic">
                      &ldquo;{r.comment}&rdquo;
                    </p>
                  )}
                </div>
              ))}
            </div>
          </motion.section>
        )}
      </div>
    </div>
  )
}

function PublicEventRow({ card, locale, muted = false }: { card: TravelCard; locale: string; muted?: boolean }) {
  const router = useRouter()
  return (
    <button
      onClick={() => router.push(`/${locale}/cards/${card.id}`)}
      className={cn(
        'text-start px-4 py-3 rounded-sm border transition-all group',
        muted
          ? 'border-[rgba(255,255,255,.04)] hover:border-[rgba(255,255,255,.1)] opacity-75 hover:opacity-100'
          : 'border-[rgba(255,255,255,.05)] hover:border-[--color-amber-400]/30'
      )}
    >
      <div className="flex items-center gap-2 text-[13px]">
        <span className="font-display text-[--color-bone-400]" aria-hidden>{getCardTypeIcon(card.type)}</span>
        <span className="font-display text-[--color-bone-50] truncate group-hover:text-[--color-amber-400] transition-colors">
          {card.title}
        </span>
      </div>
      <div className="flex items-center gap-3 mt-1 font-mono text-[10px] tracking-[0.12em] uppercase text-[--color-bone-400]">
        <span className="flex items-center gap-1"><MapPin className="w-2.5 h-2.5" strokeWidth={2} />{card.location.city}</span>
        {card.eventDate && <span>{new Date(card.eventDate).toLocaleDateString()}</span>}
      </div>
    </button>
  )
}
