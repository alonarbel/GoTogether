'use client'
import { TravelCard } from '@/types'
import { useTranslations } from 'next-intl'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  MapPin, Users, ArrowLeft, Share2, MessageCircle,
  Calendar, Clock, CheckCircle2, ChevronLeft, ChevronRight,
  Phone, Pencil, AlertTriangle, Loader2,
} from 'lucide-react'
import { getCardTypeIcon, getParticipantStatus, cn, isLastDayForMinimum } from '@/lib/utils'
import { ParticipantBar } from './ParticipantBar'
import { ReviewSection } from './ReviewSection'
import { EventPhotoGallery } from './EventPhotoGallery'
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useToast } from '@/components/ui/Toast'
import { joinCard, leaveCard, hasJoined } from '@/lib/cards'
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
      if (ok) { setJoined(true); toast(t('joinedCard'), 'success') } else toast('שגיאה בהצטרפות לכרטיסייה', 'error')
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
      <div className="max-w-5xl mx-auto px-4 sm:px-8">
        {/* ── Back ── */}
        <motion.button
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          onClick={() => router.back()}
          className="flex items-center gap-2 mb-8
                     font-mono text-[11px] tracking-[0.18em] uppercase
                     text-[--color-bone-400] hover:text-[--color-amber-400] transition-colors group link-underline"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" strokeWidth={2} />
          <span>{t('back')}</span>
        </motion.button>

        {/* ── Last-day urgent banner ── */}
        {lastDay && !hasMinimum && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex items-center gap-3 px-4 py-3
                       bg-[--color-amber-400] text-[--color-amber-ink] rounded-sm urgent-pulse"
          >
            <AlertTriangle className="w-4 h-4 shrink-0" strokeWidth={2.5} />
            <span className="font-mono text-[11px] tracking-[0.16em] uppercase font-semibold">
              {t('lastDayWarning')}
            </span>
          </motion.div>
        )}

        <div className="grid lg:grid-cols-12 gap-10 lg:gap-14">
          {/* ── Main column ── */}
          <div className="lg:col-span-8 space-y-10">
            {/* Image hero */}
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="relative aspect-[4/3] sm:aspect-[16/10] rounded-sm overflow-hidden bg-[--color-ink-850]"
            >
              {card.images.length > 0 ? (
                <>
                  <img src={card.images[imgIndex]} alt={card.title}
                    className="w-full h-full object-cover" />
                  {card.images.length > 1 && (
                    <>
                      <button
                        onClick={() => setImgIndex(i => (i - 1 + card.images.length) % card.images.length)}
                        className="absolute start-3 top-1/2 -translate-y-1/2 w-9 h-9 grid place-items-center
                                   bg-[--color-ink-950]/70 text-[--color-bone-50] rounded-full backdrop-blur-sm
                                   hover:bg-[--color-amber-400] hover:text-[--color-amber-ink] transition-all">
                        <ChevronLeft className="w-4 h-4" strokeWidth={2} />
                      </button>
                      <button
                        onClick={() => setImgIndex(i => (i + 1) % card.images.length)}
                        className="absolute end-3 top-1/2 -translate-y-1/2 w-9 h-9 grid place-items-center
                                   bg-[--color-ink-950]/70 text-[--color-bone-50] rounded-full backdrop-blur-sm
                                   hover:bg-[--color-amber-400] hover:text-[--color-amber-ink] transition-all">
                        <ChevronRight className="w-4 h-4" strokeWidth={2} />
                      </button>
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {card.images.map((_, i) => (
                          <button key={i} onClick={() => setImgIndex(i)}
                            className={cn('h-px transition-all',
                              i === imgIndex ? 'w-8 bg-[--color-amber-400]' : 'w-4 bg-[--color-bone-50]/40')} />
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full grid place-items-center text-9xl text-[--color-bone-600] font-display">
                  {getCardTypeIcon(card.type)}
                </div>
              )}

              {isOwner && (
                <button
                  onClick={() => router.push(`/${locale}/cards/${card.id}/edit`)}
                  className="absolute top-3 end-3 flex items-center gap-1.5 px-3 py-1.5 rounded-sm
                             bg-[--color-ink-950]/80 backdrop-blur-sm
                             font-mono text-[10px] tracking-[0.18em] uppercase
                             text-[--color-bone-50] hover:text-[--color-amber-400] transition-colors">
                  <Pencil className="w-3 h-3" strokeWidth={2} />
                  {t('editCard')}
                </button>
              )}
            </motion.div>

            {/* Editorial title block */}
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-5"
            >
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm
                                 bg-[--color-amber-400]/10 text-[--color-amber-400] border border-[--color-amber-400]/20
                                 font-mono text-[10px] tracking-[0.2em] uppercase">
                  {getCardTypeIcon(card.type)} {tFilters(card.type)}
                </span>
                {card.organizer_role !== 'traveler' && (
                  <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-[--color-bone-400]">
                    · {tRoles(card.organizer_role)}
                  </span>
                )}
              </div>

              <h1 className="headline text-[--color-bone-50] text-4xl sm:text-6xl">
                {card.title}
              </h1>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-2 border-t border-[--color-ink-800]
                              font-mono text-[11px] tracking-[0.14em] uppercase text-[--color-bone-400]">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3 h-3 text-[--color-amber-400]" strokeWidth={2} />
                  {card.location.address && <>{card.location.address} ·</>} {card.location.city}, {card.location.country}
                </span>
                {formattedDate && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 text-[--color-amber-400]" strokeWidth={2} />
                    {formattedDate}
                  </span>
                )}
                {card.eventTime && (
                  <span className="flex items-center gap-1.5 tabular-nums">
                    <Clock className="w-3 h-3 text-[--color-amber-400]" strokeWidth={2} />
                    {card.eventTime}
                  </span>
                )}
                {card.minDeadline && (
                  <span className={cn('flex items-center gap-1.5', lastDay && 'text-[--color-coral-400]')}>
                    <AlertTriangle className="w-3 h-3" strokeWidth={2} />
                    {t('minDeadline')}: {new Date(card.minDeadline).toLocaleDateString(locale === 'he' ? 'he-IL' : 'en-US', { month: 'short', day: 'numeric' })}
                  </span>
                )}
              </div>
            </motion.div>

            {/* Lead paragraph (description) */}
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-4"
            >
              <p className="font-display text-[--color-bone-50] text-xl leading-relaxed first-letter:text-5xl first-letter:font-medium first-letter:me-1.5 first-letter:float-start first-letter:leading-[0.85] first-letter:text-[--color-amber-400]">
                {card.description}
              </p>

              {card.tags && card.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-4 border-t border-[--color-ink-800]">
                  {card.tags.map(tag => (
                    <span key={tag} className="font-mono text-[10px] tracking-[0.14em] uppercase
                                               px-2 py-0.5 text-[--color-bone-400]
                                               border border-[--color-ink-700]">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Participants section */}
            <motion.section
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-5 pt-4"
            >
              <header className="flex items-end justify-between">
                <div>
                  <div className="eyebrow mb-1">— roster</div>
                  <h2 className="font-display text-[--color-bone-50] text-2xl flex items-baseline gap-2">
                    {t('participantsList')}
                    <span className="font-mono text-sm text-[--color-bone-400] tabular-nums">
                      {String(currentCount).padStart(2, '0')}/{String(card.maxParticipants).padStart(2, '0')}
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
                      className="flex items-center gap-3 px-3 py-2.5
                                 border border-[rgba(255,255,255,.04)] hover:border-[--color-amber-400]/30
                                 transition-colors rounded-sm group"
                    >
                      <div className="w-9 h-9 rounded-full overflow-hidden grid place-items-center
                                      bg-[--color-ink-800] text-[--color-bone-200] text-sm font-mono
                                      border border-[--color-ink-700] shrink-0">
                        {p.avatar
                          ? <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
                          : p.name[0]?.toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[13px] text-[--color-bone-50] truncate group-hover:text-[--color-amber-400] transition-colors">
                          {p.name}
                        </div>
                        {p.phone && (
                          <div className="font-mono text-[10px] text-[--color-bone-400] truncate flex items-center gap-1 mt-0.5">
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

            {/* Photos from event (past only) */}
            {isPast && (
              <EventPhotoGallery cardId={card.id} isParticipant={isParticipant || joined} />
            )}

            {/* Reviews */}
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
            <div className="lg:sticky lg:top-28 space-y-5">
              {/* Roster + Join card */}
              <motion.div
                initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="border border-[rgba(255,255,255,.06)] rounded-sm p-5 space-y-5
                           bg-[--color-ink-900] corner-marks"
              >
                <div className="space-y-3">
                  <div className="eyebrow">— capacity</div>
                  <div className="grid grid-cols-3 gap-px bg-[--color-ink-700] rounded-sm overflow-hidden">
                    <div className="bg-[--color-ink-850] p-3 text-center">
                      <div className="font-display text-3xl text-[--color-bone-50] tabular-nums leading-none">
                        {String(currentCount).padStart(2, '0')}
                      </div>
                      <div className="eyebrow mt-2">{t('participants')}</div>
                    </div>
                    <div className="bg-[--color-ink-850] p-3 text-center">
                      <div className="font-display text-3xl text-[--color-amber-400] tabular-nums leading-none">
                        {String(card.minParticipants).padStart(2, '0')}
                      </div>
                      <div className="eyebrow mt-2">{t('min')}</div>
                    </div>
                    <div className="bg-[--color-ink-850] p-3 text-center">
                      <div className="font-display text-3xl text-[--color-bone-50] tabular-nums leading-none">
                        {String(card.maxParticipants).padStart(2, '0')}
                      </div>
                      <div className="eyebrow mt-2">{t('max')}</div>
                    </div>
                  </div>
                  <ParticipantBar current={currentCount} min={card.minParticipants} max={card.maxParticipants} />
                </div>

                {!hasMinimum && neededForMin > 0 && (
                  <div className={cn(
                    'flex items-start gap-2 px-3 py-2.5 rounded-sm font-mono text-[11px] tracking-[0.06em] leading-relaxed',
                    lastDay
                      ? 'bg-[--color-coral-500]/10 text-[--color-coral-400] border border-[--color-coral-500]/20'
                      : 'bg-[--color-amber-400]/8 text-[--color-amber-400] border border-[--color-amber-400]/20'
                  )}>
                    <span className="shrink-0 mt-px">{lastDay ? '◇' : '◇'}</span>
                    <span>{lastDay ? t('lastDayWarning') : t('needMore', { count: neededForMin })}</span>
                  </div>
                )}

                {!isOwner && !isPast && (
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleJoin}
                    disabled={(isFull && !joined) || joinLoading}
                    className={cn(
                      'w-full py-3.5 rounded-sm transition-all flex items-center justify-center gap-2',
                      'font-mono text-[11px] tracking-[0.2em] uppercase font-semibold',
                      joined
                        ? 'bg-[--color-emerald-500]/15 text-[--color-emerald-400] border border-[--color-emerald-500]/30 hover:bg-[--color-coral-500]/10 hover:text-[--color-coral-400] hover:border-[--color-coral-500]/30'
                        : isFull
                        ? 'bg-[--color-ink-800] text-[--color-bone-600] cursor-not-allowed'
                        : 'bg-[--color-amber-400] text-[--color-amber-ink] hover:bg-[--color-amber-500] shadow-[0_8px_28px_rgba(251,191,36,.18)]'
                    )}
                  >
                    {joinLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :
                      joined ? <><CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2.5} /> {t('joined')}</> :
                      isFull ? t('full') : t('joinBtn')}
                  </motion.button>
                )}
              </motion.div>

              {/* Organizer card */}
              <motion.div
                initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.16, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="border border-[rgba(255,255,255,.06)] rounded-sm p-5 space-y-4 bg-[--color-ink-900]"
              >
                <div className="eyebrow">— organized by</div>
                <Link href={`/${locale}/profile/${card.createdByUserId}`}
                  className="flex items-center gap-3 group">
                  <div className="w-12 h-12 rounded-full overflow-hidden grid place-items-center
                                  bg-[--color-ink-800] text-[--color-bone-200] font-mono text-base
                                  border border-[--color-amber-400]/30">
                    {card.createdBy[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div className="font-display text-[--color-bone-50] text-base
                                    group-hover:text-[--color-amber-400] transition-colors">
                      {card.createdBy}
                    </div>
                    {card.organizer_role !== 'traveler' && (
                      <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-[--color-bone-400] mt-0.5">
                        {tRoles(card.organizer_role)}
                      </div>
                    )}
                  </div>
                </Link>
                {card.phone && (
                  <a href={`tel:${card.phone}`}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-sm
                               border border-[--color-ink-800]
                               font-mono text-[12px] text-[--color-bone-200]
                               hover:text-[--color-amber-400] hover:border-[--color-amber-400]/30 transition-colors">
                    <Phone className="w-3.5 h-3.5" strokeWidth={2} />
                    {card.phone}
                  </a>
                )}
                <div className="px-3 py-2 rounded-sm bg-[--color-ink-850] text-[12px] text-[--color-bone-200]">
                  <div className="eyebrow mb-1">{t('contact')}</div>
                  {card.contactInfo}
                </div>
              </motion.div>

              {/* Group chat */}
              {(card.whatsappLink || card.telegramLink) && (
                <motion.div
                  initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.22, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="border border-[rgba(255,255,255,.06)] rounded-sm p-5 space-y-3 bg-[--color-ink-900]"
                >
                  <div className="eyebrow">— group chat</div>
                  {card.whatsappLink && (
                    <a href={card.whatsappLink} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 px-3 py-2.5 rounded-sm
                                 border border-[--color-emerald-500]/20 text-[--color-emerald-400]
                                 hover:bg-[--color-emerald-500]/10 transition-all
                                 font-mono text-[11px] tracking-[0.16em] uppercase">
                      <MessageCircle className="w-4 h-4" strokeWidth={2} /> {t('whatsapp')}
                    </a>
                  )}
                  {card.telegramLink && (
                    <a href={card.telegramLink} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 px-3 py-2.5 rounded-sm
                                 border border-blue-500/20 text-blue-400
                                 hover:bg-blue-500/10 transition-all
                                 font-mono text-[11px] tracking-[0.16em] uppercase">
                      <MessageCircle className="w-4 h-4" strokeWidth={2} /> {t('telegram')}
                    </a>
                  )}
                </motion.div>
              )}

              {/* Share */}
              <motion.button
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.28 }}
                onClick={() => navigator.share?.({ title: card.title, url: window.location.href })}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-sm
                           border border-[rgba(255,255,255,.06)]
                           font-mono text-[11px] tracking-[0.2em] uppercase
                           text-[--color-bone-400] hover:text-[--color-amber-400] hover:border-[--color-amber-400]/30
                           transition-all"
              >
                <Share2 className="w-3.5 h-3.5" strokeWidth={2} />
                {t('share')}
              </motion.button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
