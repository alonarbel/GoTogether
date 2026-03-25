'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { fetchMyCards } from '@/lib/cards'
import { fetchOrganizerReviews, Review } from '@/lib/reviews'
import { TravelCard } from '@/types'
import { getCardTypeIcon, cn } from '@/lib/utils'
import { ArrowLeft, Star, MapPin, Calendar, Users, Briefcase } from 'lucide-react'
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
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen pt-24 text-center text-gray-500">User not found</div>
    )
  }

  const initials = profile.full_name.trim().split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2) || '?'
  const organizedEvents = [...activeEvents, ...pastEvents].filter(c => c.createdByUserId === userId)
  const totalEventsOrganized = organizedEvents.length
  // Unique event types they organize
  const organizedTypes = [...new Set(organizedEvents.map(c => c.type))]

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-2xl mx-auto px-4 space-y-8">
        <button onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors group text-sm">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back
        </button>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 overflow-hidden flex items-center justify-center text-2xl font-bold text-white shadow-xl shadow-teal-500/20 shrink-0">
              {profile.avatar_url
                ? <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
                : initials}
            </div>
            <div className="space-y-1 min-w-0">
              <h1 className="text-2xl font-bold text-white">{profile.full_name}</h1>
              {profile.title && (
                <p className="text-sm text-teal-400 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 shrink-0" />
                  {profile.title}
                </p>
              )}
              <p className="text-sm text-gray-500">{activeEvents.length + pastEvents.length} events</p>
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="text-sm text-gray-300 leading-relaxed bg-gray-900/60 border border-white/5 rounded-xl px-4 py-3">
              {profile.bio}
            </p>
          )}

          {/* Event types they organize */}
          {organizedTypes.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {organizedTypes.map(type => (
                <span key={type} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-900/60 border border-white/8 text-sm text-gray-300">
                  {getCardTypeIcon(type)} {type}
                </span>
              ))}
            </div>
          )}

          {/* Rating banner — only shown if there are reviews */}
          {orgAvg && (
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex flex-col items-center justify-center gap-1">
                <div className="text-3xl font-bold text-amber-400">{orgAvg}</div>
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star key={i} className={cn('w-3.5 h-3.5', i < Math.round(orgAvg) ? 'text-amber-400 fill-amber-400' : 'text-amber-900')} />
                  ))}
                </div>
                <div className="text-xs text-amber-500/70">avg rating</div>
              </div>
              <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center gap-1">
                <div className="text-3xl font-bold text-white">{orgReviews.length}</div>
                <div className="text-xs text-gray-500">reviews</div>
              </div>
              <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center gap-1">
                <div className="text-3xl font-bold text-white">{totalEventsOrganized}</div>
                <div className="text-xs text-gray-500">organized</div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Active events */}
        {activeEvents.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-2">
              <Calendar className="w-4 h-4 text-teal-400" /> Active Events
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {activeEvents.map(card => (
                <button
                  key={card.id}
                  onClick={() => router.push(`/${locale}/cards/${card.id}`)}
                  className="text-start p-4 rounded-xl bg-gray-900/60 border border-teal-500/15 hover:border-teal-500/30 transition-all space-y-1.5"
                >
                  <div className="flex items-center gap-2 text-sm">
                    <span>{getCardTypeIcon(card.type)}</span>
                    <span className="font-medium text-white truncate">{card.title}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{card.location.city}</span>
                    {card.eventDate && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(card.eventDate).toLocaleDateString()}</span>}
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{card.currentParticipants}</span>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Past events */}
        {pastEvents.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-2">
              <Calendar className="w-4 h-4" /> {t('pastEvents')}
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {pastEvents.map(card => (
                <button
                  key={card.id}
                  onClick={() => router.push(`/${locale}/cards/${card.id}`)}
                  className="text-start p-4 rounded-xl bg-gray-900/60 border border-white/5 hover:border-teal-500/20 transition-all space-y-1.5"
                >
                  <div className="flex items-center gap-2 text-sm">
                    <span>{getCardTypeIcon(card.type)}</span>
                    <span className="font-medium text-white truncate">{card.title}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{card.location.city}</span>
                    {card.eventDate && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(card.eventDate).toLocaleDateString()}</span>}
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{card.currentParticipants}</span>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Organizer reviews */}
        {orgReviews.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-400" /> {t('reviewsReceived')}
            </h2>
            <div className="space-y-3">
              {orgReviews.map(r => (
                <div key={r.id} className="p-4 rounded-xl bg-gray-900/60 border border-white/5 space-y-3">
                  {/* Reviewer + rating */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 overflow-hidden flex items-center justify-center text-xs font-bold text-white shrink-0">
                        {r.reviewer_avatar
                          ? <img src={r.reviewer_avatar} alt={r.reviewer_name} className="w-full h-full object-cover" />
                          : r.reviewer_name[0]}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">{r.reviewer_name}</div>
                        {r.card_title && <div className="text-xs text-gray-500">{r.card_title}</div>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }, (_, i) => {
                          const rating = r.organizer_rating || r.card_rating || 0
                          return <Star key={i} className={cn('w-4 h-4', i < rating ? 'text-amber-400 fill-amber-400' : 'text-gray-700')} />
                        })}
                      </div>
                      {!r.organizer_rating && r.card_rating && (
                        <span className="text-xs text-gray-500">(experience)</span>
                      )}
                    </div>
                  </div>
                  {/* Comment */}
                  {r.comment && (
                    <p className="text-sm text-gray-300 leading-relaxed border-s-2 border-teal-500/40 ps-3 italic">
                      "{r.comment}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
