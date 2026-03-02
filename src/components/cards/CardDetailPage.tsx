'use client'
import { TravelCard } from '@/types'
import { useTranslations } from 'next-intl'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  MapPin, Users, ArrowLeft, Share2, MessageCircle,
  Calendar, Clock, User, CheckCircle2, ChevronLeft, ChevronRight,
  Phone, Pencil, AlertTriangle, Loader2
} from 'lucide-react'
import { getCardTypeColor, getCardTypeIcon, getParticipantStatus, cn, isLastDayForMinimum } from '@/lib/utils'
import { ParticipantBar } from './ParticipantBar'
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { joinCard, leaveCard, hasJoined } from '@/lib/cards'

interface CardDetailPageProps {
  card: TravelCard
}

export function CardDetailPage({ card }: CardDetailPageProps) {
  const t = useTranslations('card')
  const tFilters = useTranslations('filters')
  const tRoles = useTranslations('organizerRole')
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string
  const { user } = useAuth()
  const [joined, setJoined] = useState(false)
  const [joinLoading, setJoinLoading] = useState(false)
  const [imgIndex, setImgIndex] = useState(0)
  const isOwner = user?.id === card.createdByUserId

  const currentCount = card.currentParticipants + (joined ? 1 : 0)
  const { isFull, hasMinimum, neededForMin } = getParticipantStatus(currentCount, card.minParticipants, card.maxParticipants)
  const lastDay = isLastDayForMinimum(card.minDeadline)

  useEffect(() => {
    if (user) {
      hasJoined(card.id, user.id).then(setJoined)
    }
  }, [user, card.id])

  const handleJoin = async () => {
    if (!user) { router.push(`/${locale}/auth`); return }
    setJoinLoading(true)
    if (joined) {
      await leaveCard(card.id, user.id)
      setJoined(false)
    } else {
      await joinCard(card.id, user.id)
      setJoined(true)
    }
    setJoinLoading(false)
  }

  return (
    <div className="min-h-screen pt-20 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Back */}
        <motion.button
          initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm">Back</span>
        </motion.button>

        {/* Last day warning */}
        {lastDay && !hasMinimum && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400"
          >
            <AlertTriangle className="w-5 h-5 flex-shrink-0 animate-pulse" />
            <span className="font-semibold">{t('lastDayWarning')}</span>
          </motion.div>
        )}

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Left */}
          <div className="lg:col-span-3 space-y-6">
            {/* Image carousel */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="relative h-72 sm:h-96 rounded-2xl overflow-hidden bg-gray-900">
              {card.images.length > 0 ? (
                <>
                  <img src={card.images[imgIndex]} alt={card.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 to-transparent" />
                  {card.images.length > 1 && (
                    <>
                      <button onClick={() => setImgIndex(i => (i - 1 + card.images.length) % card.images.length)}
                        className="absolute start-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/60 transition-colors">
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button onClick={() => setImgIndex(i => (i + 1) % card.images.length)}
                        className="absolute end-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/60 transition-colors">
                        <ChevronRight className="w-5 h-5" />
                      </button>
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {card.images.map((_, i) => (
                          <button key={i} onClick={() => setImgIndex(i)}
                            className={cn('w-1.5 h-1.5 rounded-full transition-all', i === imgIndex ? 'bg-white w-4' : 'bg-white/40')} />
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-6xl bg-gradient-to-br from-teal-900/50 to-cyan-900/50">
                  {getCardTypeIcon(card.type)}
                </div>
              )}

              <div className={cn('absolute top-4 start-4 px-3 py-1.5 rounded-xl text-sm font-medium border', getCardTypeColor(card.type))}>
                {getCardTypeIcon(card.type)} {tFilters(card.type)}
              </div>

              {card.organizer_role !== 'traveler' && (
                <div className="absolute top-4 end-4 px-3 py-1.5 rounded-xl text-sm font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {tRoles(card.organizer_role)}
                </div>
              )}

              {isOwner && (
                <button
                  onClick={() => router.push(`/${locale}/cards/${card.id}/edit`)}
                  className="absolute bottom-4 end-4 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/50 backdrop-blur-sm text-white text-sm hover:bg-black/70 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  {t('editCard')}
                </button>
              )}
            </motion.div>

            {/* Details */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-4">
              <h1 className="text-2xl sm:text-3xl font-bold text-white">{card.title}</h1>

              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-teal-400" />
                  {card.location.address}, {card.location.city}, {card.location.country}
                </span>
                {card.eventDate && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-teal-400" />
                    {new Date(card.eventDate).toLocaleDateString('he-IL')}
                  </span>
                )}
                {card.eventTime && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-teal-400" />
                    {card.eventTime}
                  </span>
                )}
                {card.minDeadline && (
                  <span className={cn('flex items-center gap-1.5', lastDay ? 'text-red-400' : '')}>
                    <AlertTriangle className={cn('w-4 h-4', lastDay ? 'text-red-400' : 'text-amber-400')} />
                    {t('minDeadline')}: {new Date(card.minDeadline).toLocaleDateString('he-IL')}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <User className="w-4 h-4 text-teal-400" />
                  {t('createdBy')} {card.createdBy}
                </span>
              </div>

              <p className="text-gray-300 leading-relaxed">{card.description}</p>

              {card.tags && card.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {card.tags.map(tag => (
                    <span key={tag} className="px-3 py-1 rounded-lg bg-gray-800 text-gray-400 text-xs">#{tag}</span>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Participants */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="bg-gray-900 rounded-2xl p-5 space-y-4 border border-white/5">
              <h2 className="font-semibold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-teal-400" />
                {t('participantsList')} ({currentCount}/{card.maxParticipants})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {card.participants.map((p, i) => (
                  <motion.div key={p.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 + i * 0.04 }}
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-800/50"
                  >
                    <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-teal-500 to-cyan-500 flex-shrink-0">
                      {p.avatar ? (
                        <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sm font-bold text-white">
                          {p.name[0]}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm text-white font-medium truncate">{p.name}</div>
                      {p.phone && (
                        <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3" />
                          {p.phone}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
                {joined && !card.participants.find(p => p.user_id === user?.id) && (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/20">
                    <div className="w-9 h-9 rounded-full bg-teal-500 flex items-center justify-center flex-shrink-0 text-sm font-bold text-white">
                      You
                    </div>
                    <span className="text-sm text-teal-400">You</span>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-2 space-y-4">
            <div className="lg:sticky lg:top-24 space-y-4">
              {/* Participant progress */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
                className="bg-gray-900 rounded-2xl p-5 space-y-4 border border-white/5">
                <h2 className="font-semibold text-white">{t('participants')}</h2>
                <ParticipantBar current={currentCount} min={card.minParticipants} max={card.maxParticipants} showLabels size="lg" />
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-gray-800 rounded-xl p-3">
                    <div className="text-xl font-bold text-white">{currentCount}</div>
                    <div className="text-xs text-gray-500 mt-0.5">joined</div>
                  </div>
                  <div className="bg-gray-800 rounded-xl p-3">
                    <div className="text-xl font-bold text-amber-400">{card.minParticipants}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{t('min')}</div>
                  </div>
                  <div className="bg-gray-800 rounded-xl p-3">
                    <div className="text-xl font-bold text-teal-400">{card.maxParticipants}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{t('max')}</div>
                  </div>
                </div>

                {!hasMinimum && neededForMin > 0 && (
                  <div className={cn('flex items-center gap-2 text-sm rounded-xl p-3 border',
                    lastDay
                      ? 'text-red-400 bg-red-500/10 border-red-500/20'
                      : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                  )}>
                    <span>{lastDay ? '🚨' : '⚡'}</span>
                    <span>{lastDay ? t('lastDayWarning') : `${t('needMore', { count: neededForMin })} to meet minimum`}</span>
                  </div>
                )}

                {!isOwner && (
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleJoin}
                    disabled={(isFull && !joined) || joinLoading}
                    className={cn('w-full py-3.5 rounded-xl font-semibold transition-all text-sm flex items-center justify-center gap-2',
                      joined ? 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20' :
                      isFull ? 'bg-gray-800 text-gray-500 cursor-not-allowed' :
                      'bg-gradient-to-r from-teal-500 to-cyan-500 text-white hover:from-teal-400 hover:to-cyan-400 shadow-lg shadow-teal-500/25'
                    )}
                  >
                    {joinLoading ? <Loader2 className="w-4 h-4 animate-spin" /> :
                     joined ? <><CheckCircle2 className="w-4 h-4" /> {t('joined')}</> :
                     isFull ? t('full') : t('joinBtn')}
                  </motion.button>
                )}
              </motion.div>

              {/* Organizer info */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
                className="bg-gray-900 rounded-2xl p-5 space-y-3 border border-white/5">
                <h2 className="font-semibold text-white">{t('organizer')}</h2>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-white font-bold">
                    {card.createdBy[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">{card.createdBy}</div>
                    {card.organizer_role !== 'traveler' && (
                      <div className="text-xs text-purple-400">{tRoles(card.organizer_role)}</div>
                    )}
                  </div>
                </div>
                {card.phone && (
                  <a href={`tel:${card.phone}`}
                    className="flex items-center gap-2 p-3 rounded-xl bg-gray-800 text-gray-300 hover:text-teal-400 transition-colors text-sm">
                    <Phone className="w-4 h-4 text-teal-400" />
                    {card.phone}
                  </a>
                )}
                <div className="p-3 rounded-xl bg-gray-800 text-gray-400 text-sm">
                  <span className="text-gray-500">{t('contact')}: </span>{card.contactInfo}
                </div>
              </motion.div>

              {/* Group chat */}
              {(card.whatsappLink || card.telegramLink) && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}
                  className="bg-gray-900 rounded-2xl p-5 space-y-3 border border-white/5">
                  <h2 className="font-semibold text-white">{t('groupChat')}</h2>
                  {card.whatsappLink && (
                    <a href={card.whatsappLink} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/15 transition-all text-sm font-medium">
                      <MessageCircle className="w-5 h-5" /> {t('whatsapp')} Group
                    </a>
                  )}
                  {card.telegramLink && (
                    <a href={card.telegramLink} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/15 transition-all text-sm font-medium">
                      <MessageCircle className="w-5 h-5" /> {t('telegram')} Group
                    </a>
                  )}
                </motion.div>
              )}

              {/* Share */}
              <motion.button
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
                onClick={() => navigator.share?.({ title: card.title, url: window.location.href })}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition-all text-sm"
              >
                <Share2 className="w-4 h-4" />
                {t('share')}
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
