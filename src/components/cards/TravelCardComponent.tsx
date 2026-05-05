'use client'
import { TravelCard } from '@/types'
import { useTranslations } from 'next-intl'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { MapPin, Users, Calendar, AlertTriangle, ArrowUpRight } from 'lucide-react'
import { isLastDayForMinimum } from '@/lib/utils'
import { getCardTypeIcon, getParticipantStatus, cn } from '@/lib/utils'
import { ParticipantBar } from './ParticipantBar'
import { useRef } from 'react'

interface TravelCardProps {
  card: TravelCard
  index?: number
}

export function TravelCardComponent({ card, index = 0 }: TravelCardProps) {
  const t = useTranslations('card')
  const tFilters = useTranslations('filters')
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string
  const cardRef = useRef<HTMLElement>(null)
  const lastDay = isLastDayForMinimum(card.minDeadline)
  const { isFull, hasMinimum, neededForMin, spotsLeft } = getParticipantStatus(
    card.currentParticipants,
    card.minParticipants,
    card.maxParticipants
  )

  const dateStr = card.eventDate
    ? new Date(card.eventDate).toLocaleDateString(locale === 'he' ? 'he-IL' : 'en-US', {
        day: 'numeric', month: 'short',
      })
    : null

  // Cursor spotlight effect
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    cardRef.current.style.setProperty('--mx', `${e.clientX - rect.left}px`)
    cardRef.current.style.setProperty('--my', `${e.clientY - rect.top}px`)
  }

  return (
    <motion.article
      ref={cardRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      onClick={() => router.push(`/${locale}/cards/${card.id}`)}
      onMouseMove={handleMouseMove}
      className="card-vivid spotlight group relative cursor-pointer overflow-hidden rounded-2xl flex flex-col"
    >
      {/* ── Image / hero ── */}
      <div className="relative aspect-[5/3] overflow-hidden bg-[--color-night-800]">
        {card.images[0] ? (
          <img
            src={card.images[0]}
            alt={card.title}
            className="w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.08]"
          />
        ) : (
          <div className="w-full h-full grid place-items-center text-7xl select-none
                          bg-gradient-to-br from-[--color-coral-500]/30 via-[--color-violet-500]/25 to-[--color-cyan-400]/25">
            <span className="font-display float">{getCardTypeIcon(card.type)}</span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-[--color-night-950] via-[--color-night-900]/30 to-transparent" />

        {/* Type pill — top-left, brighter */}
        <div className="absolute top-3 start-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full
                        bg-black/50 backdrop-blur-md border border-white/20
                        text-[12px] font-bold text-white">
          <span aria-hidden>{getCardTypeIcon(card.type)}</span>
          <span>{tFilters(card.type as Parameters<typeof tFilters>[0])}</span>
        </div>

        {/* Status — top-right */}
        {isFull ? (
          <div className="absolute top-3 end-3 px-3 py-1.5 rounded-full text-[11px] font-bold
                          bg-gradient-to-r from-[--color-rose-500] to-[--color-coral-500] text-white border border-white/20
                          shadow-[0_0_24px_rgba(244,63,94,.6)]">
            {t('full')}
          </div>
        ) : hasMinimum ? (
          <div className="absolute top-3 end-3 inline-flex items-center px-3 py-1.5 rounded-full text-[11px] font-bold
                          bg-gradient-to-r from-[--color-emerald-500] to-[--color-cyan-500] text-white border border-white/20
                          shadow-[0_0_24px_rgba(16,185,129,.55)] live-dot">
            {t('spotsLeftCount', { count: spotsLeft })}
          </div>
        ) : null}

        {/* Last-day urgent ribbon */}
        {lastDay && !hasMinimum && (
          <div className="absolute bottom-0 inset-x-0 px-4 py-2 flex items-center gap-2 urgent-pulse
                          bg-gradient-to-r from-[--color-rose-500] to-[--color-coral-500] text-white">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" strokeWidth={2.5} />
            <span className="text-[12px] font-bold truncate">{t('lastDayWarning')}</span>
          </div>
        )}

        {/* Hover arrow (cursor follow) */}
        <div className="absolute bottom-3 end-3 w-10 h-10 rounded-full
                        bg-gradient-to-br from-[--color-coral-500] to-[--color-violet-500]
                        border border-white/20 grid place-items-center
                        opacity-0 translate-y-3 group-hover:opacity-100 group-hover:translate-y-0
                        transition-all duration-500">
          <ArrowUpRight className="w-5 h-5 text-white" strokeWidth={2.5} />
        </div>
      </div>

      {/* ── Body ── */}
      <div className="p-5 sm:p-6 space-y-4 flex flex-col flex-1 relative z-[2]">
        {/* Date · Location row */}
        <div className="flex items-center gap-3 text-[12px] font-medium text-[--color-mist-200]">
          {dateStr && (
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[--color-coral-400]" strokeWidth={2.5} />
              <span className="font-semibold">{dateStr}</span>
              {card.eventTime && <span className="text-[--color-mist-400]">·</span>}
              {card.eventTime && <span className="font-mono text-[11px]">{card.eventTime}</span>}
            </span>
          )}
          {dateStr && <span className="w-1 h-1 rounded-full bg-[--color-mist-400]" />}
          <span className="flex items-center gap-1.5 truncate">
            <MapPin className="w-3.5 h-3.5 text-[--color-cyan-400]" strokeWidth={2.5} />
            <span className="truncate font-semibold">{card.location.city}</span>
          </span>
        </div>

        {/* HEADLINE — bigger, bolder */}
        <h3 className="headline text-[--color-mist-50] text-[24px] line-clamp-2
                       transition-colors duration-300 group-hover:text-[--color-coral-300]">
          {card.title}
        </h3>

        {/* Description */}
        <p className="text-[14px] leading-relaxed text-[--color-mist-300] line-clamp-2 flex-1">
          {card.description}
        </p>

        {/* Footer — participants */}
        <div className="space-y-3 pt-3 border-t border-white/[0.08]">
          <div className="flex items-center justify-between">
            <span className={cn(
              'flex items-center gap-2 font-mono text-[14px] font-bold',
              hasMinimum ? 'text-[--color-emerald-400]' : 'text-[--color-mist-100]'
            )}>
              <Users className="w-4 h-4" strokeWidth={2.5} />
              <span className="tabular-nums">
                {card.currentParticipants}<span className="text-[--color-mist-400]">/</span>{card.maxParticipants}
              </span>
            </span>
            {!hasMinimum && neededForMin > 0 && (
              <span className="text-[12px] font-bold text-[--color-amber-400]">
                {t('needMore', { count: neededForMin })}
              </span>
            )}
          </div>
          <ParticipantBar
            current={card.currentParticipants}
            min={card.minParticipants}
            max={card.maxParticipants}
          />
        </div>
      </div>
    </motion.article>
  )
}
