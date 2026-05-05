'use client'
import { TravelCard } from '@/types'
import { useTranslations } from 'next-intl'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { MapPin, Users, Calendar, AlertTriangle, ArrowUpRight } from 'lucide-react'
import { isLastDayForMinimum } from '@/lib/utils'
import { getCardTypeIcon, getParticipantStatus, cn } from '@/lib/utils'
import { ParticipantBar } from './ParticipantBar'

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

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      onClick={() => router.push(`/${locale}/cards/${card.id}`)}
      className="card-vivid group relative cursor-pointer overflow-hidden rounded-2xl flex flex-col"
    >
      {/* ── Image / hero ── */}
      <div className="relative aspect-[5/3] overflow-hidden bg-[--color-night-800]">
        {card.images[0] ? (
          <img
            src={card.images[0]}
            alt={card.title}
            className="w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06]"
          />
        ) : (
          <div className="w-full h-full grid place-items-center text-7xl select-none
                          bg-gradient-to-br from-[--color-coral-500]/20 via-[--color-violet-500]/15 to-[--color-cyan-400]/15">
            <span className="font-display">{getCardTypeIcon(card.type)}</span>
          </div>
        )}

        {/* gradient overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-[--color-night-900] via-[--color-night-900]/30 to-transparent" />

        {/* Type pill — top-left, glassy */}
        <div className="absolute top-3 start-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
                        bg-black/40 backdrop-blur-md border border-white/10
                        text-[10px] font-semibold text-white tracking-wide">
          <span aria-hidden>{getCardTypeIcon(card.type)}</span>
          <span>{tFilters(card.type as Parameters<typeof tFilters>[0])}</span>
        </div>

        {/* Status — top-right */}
        {isFull ? (
          <div className="absolute top-3 end-3 px-2.5 py-1 rounded-full text-[10px] font-semibold
                          bg-[--color-rose-500] text-white border border-white/15
                          shadow-[0_0_16px_rgba(244,63,94,.45)]">
            {t('full')}
          </div>
        ) : hasMinimum ? (
          <div className="absolute top-3 end-3 px-2.5 py-1 rounded-full text-[10px] font-semibold
                          bg-[--color-emerald-500] text-white border border-white/15
                          shadow-[0_0_16px_rgba(16,185,129,.45)] live-dot">
            {t('spotsLeftCount', { count: spotsLeft })}
          </div>
        ) : null}

        {/* Last-day urgent ribbon */}
        {lastDay && !hasMinimum && (
          <div className="absolute bottom-0 inset-x-0 px-3 py-1.5 flex items-center gap-1.5 urgent-pulse
                          bg-gradient-to-r from-[--color-rose-500] to-[--color-coral-500] text-white">
            <AlertTriangle className="w-3 h-3 flex-shrink-0" strokeWidth={2.5} />
            <span className="text-[11px] font-semibold truncate">{t('lastDayWarning')}</span>
          </div>
        )}

        {/* Hover arrow */}
        <div className="absolute bottom-3 end-3 w-8 h-8 rounded-full
                        bg-white/10 backdrop-blur-md border border-white/15
                        grid place-items-center
                        opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0
                        transition-all duration-500">
          <ArrowUpRight className="w-4 h-4 text-white" strokeWidth={2.5} />
        </div>
      </div>

      {/* ── Body ── */}
      <div className="p-5 space-y-3.5 flex flex-col flex-1">
        {/* Date · Location row */}
        <div className="flex items-center gap-2.5 text-[11px] font-mono text-[--color-mist-400]">
          {dateStr && (
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3 h-3 text-[--color-coral-400]" strokeWidth={2} />
              <span className="text-[--color-mist-200]">{dateStr}</span>
              {card.eventTime && <span className="text-[--color-mist-500]">·</span>}
              {card.eventTime && <span>{card.eventTime}</span>}
            </span>
          )}
          {dateStr && <span className="w-px h-3 bg-[--color-night-700]" />}
          <span className="flex items-center gap-1.5 truncate">
            <MapPin className="w-3 h-3 text-[--color-cyan-400]" strokeWidth={2} />
            <span className="truncate">{card.location.city}</span>
          </span>
        </div>

        {/* Headline title — Bricolage display */}
        <h3 className="headline text-[--color-mist-50] text-[20px] line-clamp-2
                       transition-colors duration-300 group-hover:text-[--color-coral-300]">
          {card.title}
        </h3>

        {/* Description */}
        <p className="text-[13px] leading-relaxed text-[--color-mist-300] line-clamp-2 flex-1">
          {card.description}
        </p>

        {/* Footer */}
        <div className="space-y-2 pt-3 border-t border-white/[0.04]">
          <div className="flex items-center justify-between text-[11px]">
            <span className={cn(
              'flex items-center gap-1.5 font-mono',
              hasMinimum ? 'text-[--color-emerald-400]' : 'text-[--color-mist-300]'
            )}>
              <Users className="w-3 h-3" strokeWidth={2} />
              <span className="tabular-nums font-semibold">{card.currentParticipants}/{card.maxParticipants}</span>
            </span>
            {!hasMinimum && neededForMin > 0 && (
              <span className="font-mono text-[--color-amber-400]">
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
