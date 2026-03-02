'use client'
import { TravelCard } from '@/types'
import { useTranslations } from 'next-intl'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  MapPin, Users, ArrowLeft, Share2, MessageCircle,
  Calendar, User, CheckCircle2, ChevronLeft, ChevronRight
} from 'lucide-react'
import { getCardTypeColor, getCardTypeIcon, getParticipantStatus, cn } from '@/lib/utils'
import { ParticipantBar } from './ParticipantBar'
import { useState } from 'react'

interface CardDetailPageProps {
  card: TravelCard
}

export function CardDetailPage({ card }: CardDetailPageProps) {
  const t = useTranslations('card')
  const tFilters = useTranslations('filters')
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string
  const [joined, setJoined] = useState(false)
  const [imgIndex, setImgIndex] = useState(0)

  const { isFull, hasMinimum, neededForMin, spotsLeft } = getParticipantStatus(
    card.currentParticipants + (joined ? 1 : 0),
    card.minParticipants,
    card.maxParticipants
  )

  return (
    <div className="min-h-screen pt-20 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Back button */}
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm">Back</span>
        </motion.button>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Left column */}
          <div className="lg:col-span-3 space-y-6">
            {/* Image carousel */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative h-72 sm:h-96 rounded-2xl overflow-hidden bg-gray-900"
            >
              {card.images.length > 0 ? (
                <>
                  <img
                    src={card.images[imgIndex]}
                    alt={card.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 to-transparent" />
                  {card.images.length > 1 && (
                    <>
                      <button
                        onClick={() => setImgIndex((i) => (i - 1 + card.images.length) % card.images.length)}
                        className="absolute start-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/60 transition-colors"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setImgIndex((i) => (i + 1) % card.images.length)}
                        className="absolute end-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/60 transition-colors"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {card.images.map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setImgIndex(i)}
                            className={cn('w-1.5 h-1.5 rounded-full transition-all', i === imgIndex ? 'bg-white w-4' : 'bg-white/40')}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-6xl">
                  {getCardTypeIcon(card.type)}
                </div>
              )}

              {/* Type badge */}
              <div className={cn(
                'absolute top-4 start-4 px-3 py-1.5 rounded-xl text-sm font-medium border',
                getCardTypeColor(card.type)
              )}>
                {getCardTypeIcon(card.type)} {tFilters(card.type)}
              </div>
            </motion.div>

            {/* Title & description */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-4"
            >
              <h1 className="text-2xl sm:text-3xl font-bold text-white">{card.title}</h1>

              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-teal-400" />
                  {card.location.address}, {card.location.city}, {card.location.country}
                </span>
                <span className="flex items-center gap-1.5">
                  <User className="w-4 h-4 text-teal-400" />
                  {t('createdBy')} {card.createdBy}
                </span>
                {card.expiresAt && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-teal-400" />
                    {t('expiresAt')} {new Date(card.expiresAt).toLocaleDateString()}
                  </span>
                )}
              </div>

              <p className="text-gray-300 leading-relaxed">{card.description}</p>

              {/* Tags */}
              {card.tags && card.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {card.tags.map((tag) => (
                    <span key={tag} className="px-3 py-1 rounded-lg bg-gray-800 text-gray-400 text-xs">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Participants list */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gray-900 rounded-2xl p-5 space-y-4 border border-white/5"
            >
              <h2 className="font-semibold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-teal-400" />
                {t('participantsList')} ({card.currentParticipants + (joined ? 1 : 0)}/{card.maxParticipants})
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {card.participants.map((p, i) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 + i * 0.05 }}
                    className="flex items-center gap-2.5"
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-teal-500 to-cyan-500 flex-shrink-0">
                      {p.avatar ? (
                        <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white">
                          {p.name[0]}
                        </div>
                      )}
                    </div>
                    <span className="text-sm text-gray-300 truncate">{p.name}</span>
                  </motion.div>
                ))}
                {joined && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-2.5"
                  >
                    <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-white">You</span>
                    </div>
                    <span className="text-sm text-teal-400 truncate">You</span>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Right column — sticky sidebar */}
          <div className="lg:col-span-2 space-y-4">
            <div className="lg:sticky lg:top-24 space-y-4">
              {/* Participant progress card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-gray-900 rounded-2xl p-5 space-y-4 border border-white/5"
              >
                <h2 className="font-semibold text-white">{t('participants')}</h2>
                <ParticipantBar
                  current={card.currentParticipants + (joined ? 1 : 0)}
                  min={card.minParticipants}
                  max={card.maxParticipants}
                  showLabels
                  size="lg"
                />
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-gray-800 rounded-xl p-3">
                    <div className="text-xl font-bold text-white">{card.currentParticipants + (joined ? 1 : 0)}</div>
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
                  <div className="flex items-center gap-2 text-sm text-amber-400 bg-amber-500/10 rounded-xl p-3 border border-amber-500/20">
                    <span>⚡</span>
                    <span>{t('needMore', { count: neededForMin })} to meet minimum</span>
                  </div>
                )}

                {/* Join button */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setJoined(!joined)}
                  disabled={isFull && !joined}
                  className={cn(
                    'w-full py-3.5 rounded-xl font-semibold transition-all text-sm',
                    joined
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20'
                      : isFull
                      ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white hover:from-teal-400 hover:to-cyan-400 shadow-lg shadow-teal-500/25'
                  )}
                >
                  {joined ? (
                    <span className="flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4" /> {t('joined')}
                    </span>
                  ) : isFull ? (
                    t('full')
                  ) : (
                    t('joinBtn')
                  )}
                </motion.button>
              </motion.div>

              {/* Group chat & contact */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-gray-900 rounded-2xl p-5 space-y-3 border border-white/5"
              >
                <h2 className="font-semibold text-white">{t('groupChat')}</h2>
                {card.whatsappLink && (
                  <a
                    href={card.whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl bg-green-500/10 border border-green-500/20 
                               text-green-400 hover:bg-green-500/15 transition-all text-sm font-medium"
                  >
                    <MessageCircle className="w-5 h-5" />
                    {t('whatsapp')} Group
                  </a>
                )}
                {card.telegramLink && (
                  <a
                    href={card.telegramLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 
                               text-blue-400 hover:bg-blue-500/15 transition-all text-sm font-medium"
                  >
                    <MessageCircle className="w-5 h-5" />
                    {t('telegram')} Group
                  </a>
                )}
                <div className="p-3 rounded-xl bg-gray-800 text-gray-400 text-sm">
                  <span className="text-gray-500">{t('contact')}: </span>
                  {card.contactInfo}
                </div>
              </motion.div>

              {/* Share */}
              <motion.button
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                onClick={() => navigator.share?.({ title: card.title, url: window.location.href })}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-white/10 
                           text-gray-400 hover:text-white hover:border-white/20 transition-all text-sm"
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
