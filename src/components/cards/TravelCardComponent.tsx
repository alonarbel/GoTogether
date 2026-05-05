'use client'
import { TravelCard } from '@/types'
import { useTranslations } from 'next-intl'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { MapPin, Users, Calendar, AlertTriangle } from 'lucide-react'
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
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.045, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      onClick={() => router.push(`/${locale}/cards/${card.id}`)}
      className="card-halo group relative cursor-pointer overflow-hidden rounded-md
                 bg-[--color-ink-850] border border-[rgba(255,255,255,.05)]
                 flex flex-col"
    >
      {/* ── Image / hero ── */}
      <div className="relative aspect-[5/3] overflow-hidden bg-[--color-ink-800]">
        {card.images[0] ? (
          <img
            src={card.images[0]}
            alt={card.title}
            className="w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
          />
        ) : (
          <div className="w-full h-full grid place-items-center text-6xl text-[--color-bone-600] font-display select-none">
            {getCardTypeIcon(card.type)}
          </div>
        )}

        {/* darkening gradient at the bottom of the image for text legibility on overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[--color-ink-850] via-[--color-ink-850]/30 to-transparent" />

        {/* Type label — top-left, eyebrow-style */}
        <div className="absolute top-3 start-3 inline-flex items-center gap-1.5 px-2 py-1 rounded-sm
                        bg-[--color-ink-950]/70 backdrop-blur-sm text-[--color-bone-200]
                        font-mono text-[10px] tracking-[0.2em] uppercase">
          <span aria-hidden>{getCardTypeIcon(card.type)}</span>
          <span>{tFilters(card.type as Parameters<typeof tFilters>[0])}</span>
        </div>

        {/* Status badge — top-right */}
        {isFull ? (
          <div className="absolute top-3 end-3 px-2 py-1 rounded-sm font-mono text-[10px] tracking-[0.2em] uppercase
                          bg-[--color-coral-500]/15 text-[--color-coral-400] border border-[--color-coral-500]/30 backdrop-blur-sm">
            {t('full')}
          </div>
        ) : hasMinimum ? (
          <div className="absolute top-3 end-3 px-2 py-1 rounded-sm font-mono text-[10px] tracking-[0.2em] uppercase
                          bg-[--color-emerald-500]/15 text-[--color-emerald-400] border border-[--color-emerald-500]/30 backdrop-blur-sm">
            {t('spotsLeftCount', { count: spotsLeft })}
          </div>
        ) : null}

        {/* Last-day urgent ribbon */}
        {lastDay && !hasMinimum && (
          <div className="absolute bottom-0 inset-x-0 px-3 py-1.5
                          bg-[--color-amber-400] text-[--color-amber-ink] flex items-center gap-1.5 urgent-pulse">
            <AlertTriangle className="w-3 h-3 flex-shrink-0" strokeWidth={2.5} />
            <span className="font-mono text-[10px] tracking-[0.18em] uppercase font-semibold truncate">
              {t('lastDayWarning')}
            </span>
          </div>
        )}
      </div>

      {/* ── Body ── */}
      <div className="p-4 sm:p-5 space-y-3.5 flex flex-col flex-1">
        {/* Date · Location row */}
        <div className="flex items-center gap-3 text-[11px] font-mono uppercase tracking-[0.14em] text-[--color-bone-400]">
          {dateStr && (
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3 h-3" strokeWidth={2} />
              {dateStr}
              {card.eventTime && <span className="text-[--color-bone-600]">·</span>}
              {card.eventTime && <span>{card.eventTime}</span>}
            </span>
          )}
          {dateStr && <span className="w-px h-3 bg-[--color-ink-700]" />}
          <span className="flex items-center gap-1.5 truncate">
            <MapPin className="w-3 h-3" strokeWidth={2} />
            <span className="truncate">{card.location.city}</span>
          </span>
        </div>

        {/* Editorial title */}
        <h3 className="headline text-[--color-bone-50] text-xl leading-[1.1] line-clamp-2
                       transition-colors duration-300 group-hover:text-[--color-amber-400]">
          {card.title}
        </h3>

        {/* Description */}
        <p className="text-[13px] leading-relaxed text-[--color-bone-400] line-clamp-2 flex-1">
          {card.description}
        </p>

        {/* Footer — participants */}
        <div className="space-y-2 pt-2 border-t border-[--color-ink-800]">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className={cn(
              'flex items-center gap-1.5 tracking-[0.1em]',
              hasMinimum ? 'text-[--color-emerald-400]' : 'text-[--color-bone-400]'
            )}>
              <Users className="w-3 h-3" strokeWidth={2} />
              <span className="tabular-nums">{card.currentParticipants}/{card.maxParticipants}</span>
            </span>
            {!hasMinimum && neededForMin > 0 && (
              <span className="text-[--color-amber-400] tracking-[0.08em]">
                {t('needMore', { count: neededForMin })}
              </span>
            )}
            {hasMinimum && !isFull && (
              <span className="text-[--color-bone-400] tracking-[0.18em] uppercase
                               opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                {t('viewDetails')} →
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
