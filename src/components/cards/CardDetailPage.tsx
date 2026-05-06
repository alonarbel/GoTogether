'use client'
import { TravelCard } from '@/types'
import { useTranslations } from 'next-intl'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  MapPin, Users, ArrowLeft, Share2, MessageCircle,
  Calendar, Clock, CheckCircle2, ChevronLeft, ChevronRight,
  Phone, Pencil, AlertTriangle, Loader2, Sparkles,
} from 'lucide-react'
import { getCardTypeIcon, getParticipantStatus, cn, isLastDayForMinimum } from '@/lib/utils'
import { ParticipantBar } from './ParticipantBar'
import { ReviewSection } from './ReviewSection'
import { EventPhotoGallery } from './EventPhotoGallery'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useToast } from '@/components/ui/Toast'
import { joinCard, leaveCard, hasJoined } from '@/lib/cards'
import { fireConfetti } from '@/lib/confetti'
import Link from 'next/link'

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
  const { toast } = useToast()
  const [joined, setJoined] = useState(false)
  const [joinLoading, setJoinLoading] = useState(false)
  const [imgIndex, setImgIndex] = useState(0)
  const joinBtnRef = useRef<HTMLButtonElement>(null)
  const isOwner = user?.id === card.createdByUserId
  const today = new Date().toISOString().split('T')[0]
  const isPast = !!card.eventDate && card.eventDate < today
  const isParticipant = !!card.participants.find(p => p.user_id === user?.id)
  const currentCount = card.currentParticipants
  const { isFull, hasMinimum, neededForMin } = getParticipantStatus(currentCount, card.minParticipants, card.maxParticipants)
  const lastDay = isLastDayForMinimum(card.minDeadline)

  useEffect(() => {
    if (user) hasJoined(card.id, user.id).then(setJoined)
  }, [user, card.id])

  const handleJoin = async () => {
    if (!user) { router.push(`/${locale}/auth`); return }
    setJoinLoading(true)
    if (joined) {
      const ok = await leaveCard(card.id, user.id)
      if (ok) { setJoined(false); toast(t('leftCard'), 'info') } else toast('שגיאה בעזיבת הכרטיסייה', 'error')
    } else {
      const ok = await joinCard(card.id, user.id)
      if (ok) {
        setJoined(true)
        toast(t('joinedCard'), 'success')
        fireConfetti({ from: 'button', element: joinBtnRef.current })
      } else toast('שגיאה בהצטרפות לכרטיסייה', 'error')
    }
    setJoinLoading(false)
    router.refresh()
  }

  const formattedDate = card.eventDate
    ? new Date(card.eventDate).toLocaleDateString(locale === 'he' ? 'he-IL' : 'en-US', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      })
    : null

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-8">
        {/* Back */}
        <motion.button
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          onClick={() => router.back()}
          className="flex items-center gap-2 mb-8 group
                     text-[12px] font-medium
                     text-[--color-mist-300] hover:text-[--color-coral-400] transition-colors link-underline"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" strokeWidth={2} />
          <span>{t('back')}</span>
        </motion.button>

        {/* Last-day urgent banner */}
        {lastDay && !hasMinimum && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex items-center gap-3 px-5 py-3 urgent-pulse rounded-2xl
                       bg-gradient-to-r from-[--color-rose-500] to-[--color-coral-500]
                       text-white shadow-[0_0_28px_rgba(244,63,94,.35)]"
          >
            <AlertTriangle className="w-5 h-5 shrink-0" strokeWidth={2.5} />
            <span className="font-semibold">{t('lastDayWarning')}</span>
          </motion.div>
        )}

        <div className="grid lg:grid-cols-12 gap-10">
          {/* ── Main column ── */}
          <div className="lg:col-span-8 space-y-8">
            {/* Image hero */}
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="relative aspect-[4/3] sm:aspect-[16/10] rounded-3xl overflow-hidden bg-[--color-night-800]
                         shadow-[0_24px_64px_rgba(0,0,0,.5)]"
            >
              {card.images.length > 0 ? (
                <>
                  <img src={card.images[imgIndex]} alt={card.title}
                    className="w-full h-full object-cover" />
                  {card.images.length > 1 && (
                    <>
                      <button
                        onClick={() => setImgIndex(i => (i - 1 + card.images.length) % card.images.length)}
                        className="absolute start-4 top-1/2 -translate-y-1/2 w-10 h-10 grid place-items-center
                                   glass rounded-full text-white hover:bg-gradient-to-br hover:from-[--color-coral-500] hover:to-[--color-violet-500] transition-all">
                        <ChevronLeft className="w-5 h-5" strokeWidth={2} />
                      </button>
                      <button
                        onClick={() => setImgIndex(i => (i + 1) % card.images.length)}
                        className="absolute end-4 top-1/2 -translate-y-1/2 w-10 h-10 grid place-items-center
                                   glass rounded-full text-white hover:bg-gradient-to-br hover:from-[--color-coral-500] hover:to-[--color-violet-500] transition-all">
                        <ChevronRight className="w-5 h-5" strokeWidth={2} />
                      </button>
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {card.images.map((_, i) => (
                          <button key={i} onClick={() => setImgIndex(i)}
                            className={cn('h-1 rounded-full transition-all',
                              i === imgIndex
                                ? 'w-10 bg-[--color-coral-500]'
                                : 'w-4 bg-white/40 hover:bg-white/60'
                            )} />
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full grid place-items-center text-9xl
                                bg-gradient-to-br from-[--color-coral-500]/15 via-[--color-violet-500]/12 to-[--color-cyan-400]/12">
                  <span className="font-display">{getCardTypeIcon(card.type)}</span>
                </div>
              )}

              {isOwner && (
                <button
                  onClick={() => router.push(`/${locale}/cards/${card.id}/edit`)}
                  className="glass absolute top-4 end-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full
                             text-[11px] font-semibold text-white hover:text-[--color-coral-300] transition-colors">
                  <Pencil className="w-3 h-3" strokeWidth={2.5} />
                  {t('editCard')}
                </button>
              )}
            </motion.div>

            {/* Title block */}
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-5"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full
                                 bg-gradient-to-r from-[--color-coral-500]/15 to-[--color-violet-500]/15
                                 border border-[--color-coral-500]/30
                                 text-[11px] font-semibold text-[--color-coral-300]">
                  {getCardTypeIcon(card.type)} {tFilters(card.type)}
                </span>
                {card.organizer_role !== 'traveler' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full
                                   bg-[--color-violet-500]/15 border border-[--color-violet-500]/30
                                   text-[11px] font-semibold text-[--color-violet-300]">
                    <Sparkles className="w-3 h-3" strokeWidth={2.5} /> {tRoles(card.organizer_role)}
                  </span>
                )}
              </div>

              <h1 className="headline-xl text-[--color-mist-50] text-4xl sm:text-6xl">
                {card.title}
              </h1>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-2.5 pt-2 border-t border-[--color-mist-500]
                              text-[12px] font-medium text-[--color-mist-300]">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[--color-cyan-400]" strokeWidth={2.5} />
                  {card.location.address && <>{card.location.address} ·</>} {card.location.city}, {card.location.country}
                </span>
                {formattedDate && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[--color-coral-400]" strokeWidth={2.5} />
                    {formattedDate}
                  </span>
                )}
                {card.eventTime && (
                  <span className="flex items-center gap-1.5 tabular-nums font-mono">
                    <Clock className="w-3.5 h-3.5 text-[--color-violet-400]" strokeWidth={2.5} />
                    {card.eventTime}
                  </span>
                )}
                {card.minDeadline && (
                  <span className={cn('flex items-center gap-1.5 font-mono', lastDay && 'text-[--color-rose-400]')}>
                    <AlertTriangle className="w-3.5 h-3.5 text-[--color-amber-400]" strokeWidth={2.5} />
                    {t('minDeadline')}: {new Date(card.minDeadline).toLocaleDateString(locale === 'he' ? 'he-IL' : 'en-US', { month: 'short', day: 'numeric' })}
                  </span>
                )}
              </div>
            </motion.div>

            {/* Description */}
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.14, duration: 0.6 }}
              className="space-y-4"
            >
              <p className="font-display text-[--color-mist-100] text-[18px] leading-relaxed">
                {card.description}
              </p>

              {card.tags && card.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-3 border-t border-[--color-mist-500]">
                  {card.tags.map(tag => (
                    <span key={tag} className="px-2.5 py-1 rounded-full text-[11px] font-medium
                                              bg-[--color-night-950] border border-[--color-mist-500]
                                              text-[--color-mist-300]
                                              hover:border-[--color-coral-500]/30 hover:text-[--color-coral-300]
                                              transition-colors">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Participants */}
            <motion.section
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18, duration: 0.6 }}
              className="space-y-4 pt-4"
            >
              <header className="flex items-end justify-between">
                <div>
                  <div className="eyebrow mb-1.5">— roster</div>
                  <h2 className="font-display text-[--color-mist-50] text-2xl font-semibold flex items-baseline gap-2">
                    {t('participantsList')}
                    <span className="font-mono text-sm text-[--color-mist-300] tabular-nums">
                      {currentCount}/{card.maxParticipants}
                    </span>
                  </h2>
                </div>
              </header>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {card.participants.map((p, i) => (
                  <motion.div key={p.id}
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.04 + i * 0.025 }}
                  >
                    <Link href={`/${locale}/profile/${p.user_id}`}
                      className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl
                                 bg-[--color-night-950] border border-[--color-mist-500]
                                 hover:border-[--color-coral-500]/30 hover:bg-[--color-night-900]
                                 transition-all group"
                    >
                      <div className="w-9 h-9 rounded-full overflow-hidden grid place-items-center
                                      bg-gradient-to-br from-[--color-coral-500] to-[--color-violet-500] text-white text-sm font-semibold shrink-0">
                        {p.avatar
                          ? <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
                          : p.name[0]?.toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[13px] font-medium text-[--color-mist-50] truncate group-hover:text-[--color-coral-300] transition-colors">
                          {p.name}
                        </div>
                        {p.phone && (
                          <div className="font-mono text-[10px] text-[--color-mist-400] truncate flex items-center gap-1 mt-0.5">
                            <Phone className="w-2.5 h-2.5" strokeWidth={2} />
                            {p.phone}
                          </div>
                        )}
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.section>

            {/* Photos & Reviews (past only) */}
            {isPast && (
              <EventPhotoGallery cardId={card.id} isParticipant={isParticipant || joined} />
            )}
            {isPast && (
              <ReviewSection
                cardId={card.id}
                cardOrganizerRole={card.organizer_role}
                cardCreatedByUserId={card.createdByUserId}
                isParticipant={isParticipant || joined}
                isPast={isPast}
              />
            )}
          </div>

          {/* ── Sidebar ── */}
          <aside className="lg:col-span-4">
            <div className="lg:sticky lg:top-28 space-y-4">
              {/* Capacity + Join */}
              <motion.div
                initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1, duration: 0.6 }}
                className="glass rounded-2xl p-5 space-y-5"
              >
                <div className="space-y-4">
                  <div className="eyebrow">— capacity</div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-4 rounded-2xl bg-[--color-night-900] border border-[--color-mist-500] text-center">
                      <div className="font-display text-4xl font-bold text-[--color-mist-50] tabular-nums leading-none">
                        {currentCount}
                      </div>
                      <div className="text-[10px] font-mono font-bold text-[--color-mist-300] mt-2 tracking-widest uppercase">{t('participants')}</div>
                    </div>
                    <div className="p-4 rounded-2xl bg-[--color-amber-400]/15 border border-[--color-amber-400]/35 text-center">
                      <div className="font-display text-4xl font-bold text-[--color-amber-400] tabular-nums leading-none">
                        {card.minParticipants}
                      </div>
                      <div className="text-[10px] font-mono font-bold text-[--color-amber-300] mt-2 tracking-widest uppercase">{t('min')}</div>
                    </div>
                    <div className="p-4 rounded-2xl bg-[--color-cyan-400]/15 border border-[--color-cyan-400]/35 text-center">
                      <div className="font-display text-4xl font-bold text-[--color-cyan-400] tabular-nums leading-none">
                        {card.maxParticipants}
                      </div>
                      <div className="text-[10px] font-mono font-bold text-[--color-cyan-300] mt-2 tracking-widest uppercase">{t('max')}</div>
                    </div>
                  </div>
                  <div className="pt-3">
                    <ParticipantBar current={currentCount} min={card.minParticipants} max={card.maxParticipants} />
                  </div>
                </div>

                {!hasMinimum && neededForMin > 0 && (
                  <div className={cn(
                    'flex items-start gap-2 px-3 py-2.5 rounded-xl text-[12px] leading-relaxed',
                    lastDay
                      ? 'bg-[--color-rose-500]/10 text-[--color-rose-400] border border-[--color-rose-500]/20'
                      : 'bg-[--color-amber-400]/10 text-[--color-amber-400] border border-[--color-amber-400]/20'
                  )}>
                    <span className="shrink-0 mt-px">{lastDay ? '⚠' : '◇'}</span>
                    <span className="font-medium">{lastDay ? t('lastDayWarning') : t('needMore', { count: neededForMin })}</span>
                  </div>
                )}

                {!isOwner && !isPast && (
                  <motion.button
                    ref={joinBtnRef}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleJoin}
                    disabled={(isFull && !joined) || joinLoading}
                    className={cn(
                      'w-full py-4 rounded-2xl transition-all flex items-center justify-center gap-2 text-[15px] font-bold',
                      joined
                        ? 'bg-[--color-emerald-500]/20 text-[--color-emerald-400] border border-[--color-emerald-500]/40 hover:bg-[--color-rose-500]/15 hover:text-[--color-rose-400] hover:border-[--color-rose-500]/40'
                        : isFull
                        ? 'bg-[--color-night-900] text-[--color-mist-500] cursor-not-allowed border border-[--color-mist-500]'
                        : 'btn-primary'
                    )}
                  >
                    {joinLoading ? <Loader2 className="w-5 h-5 animate-spin" /> :
                      joined ? <><CheckCircle2 className="w-5 h-5" strokeWidth={2.5} /> {t('joined')}</> :
                      isFull ? t('full') : <span className="relative z-[1]">{t('joinBtn')}</span>}
                  </motion.button>
                )}
              </motion.div>

              {/* Organizer */}
              <motion.div
                initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.18, duration: 0.6 }}
                className="glass rounded-2xl p-5 space-y-4"
              >
                <div className="eyebrow">— organized by</div>
                <Link href={`/${locale}/profile/${card.createdByUserId}`}
                  className="flex items-center gap-3 group">
                  <div className="w-12 h-12 rounded-full overflow-hidden grid place-items-center
                                  bg-gradient-to-br from-[--color-coral-500] to-[--color-violet-500] text-white text-base font-display font-semibold">
                    {card.createdBy[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div className="font-display text-[--color-mist-50] text-base font-semibold
                                    group-hover:text-[--color-coral-300] transition-colors">
                      {card.createdBy}
                    </div>
                    {card.organizer_role !== 'traveler' && (
                      <div className="text-[11px] font-medium text-[--color-violet-400] mt-0.5">
                        {tRoles(card.organizer_role)}
                      </div>
                    )}
                  </div>
                </Link>
                {card.phone && (
                  <a href={`tel:${card.phone}`}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl
                               bg-[--color-night-950] border border-[--color-mist-500]
                               text-[12px] font-mono text-[--color-mist-200]
                               hover:text-[--color-coral-300] hover:border-[--color-coral-500]/30 transition-colors">
                    <Phone className="w-3.5 h-3.5" strokeWidth={2} />
                    {card.phone}
                  </a>
                )}
                <div className="px-3 py-2 rounded-xl bg-[--color-night-950] text-[12px] text-[--color-mist-200]">
                  <div className="eyebrow mb-1">{t('contact')}</div>
                  {card.contactInfo}
                </div>
              </motion.div>

              {/* Group chat */}
              {(card.whatsappLink || card.telegramLink) && (
                <motion.div
                  initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.24, duration: 0.6 }}
                  className="glass rounded-2xl p-5 space-y-3"
                >
                  <div className="eyebrow">— group chat</div>
                  {card.whatsappLink && (
                    <a href={card.whatsappLink} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl
                                 bg-[--color-emerald-500]/10 border border-[--color-emerald-500]/20 text-[--color-emerald-400]
                                 hover:bg-[--color-emerald-500]/15 transition-all
                                 text-[12px] font-semibold">
                      <MessageCircle className="w-4 h-4" strokeWidth={2} /> {t('whatsapp')}
                    </a>
                  )}
                  {card.telegramLink && (
                    <a href={card.telegramLink} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl
                                 bg-[--color-cyan-400]/10 border border-[--color-cyan-400]/20 text-[--color-cyan-300]
                                 hover:bg-[--color-cyan-400]/15 transition-all
                                 text-[12px] font-semibold">
                      <MessageCircle className="w-4 h-4" strokeWidth={2} /> {t('telegram')}
                    </a>
                  )}
                </motion.div>
              )}

              {/* Share */}
              <motion.button
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                onClick={() => navigator.share?.({ title: card.title, url: window.location.href })}
                className="btn-ghost w-full flex items-center justify-center gap-2 py-3 rounded-xl
                           text-[12px] font-semibold transition-all"
              >
                <Share2 className="w-4 h-4" strokeWidth={2} />
                {t('share')}
              </motion.button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
