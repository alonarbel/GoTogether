'use client'
import { TravelCard } from '@/types'
import { useTranslations } from 'next-intl'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { MapPin, Users, Calendar, AlertTriangle } from 'lucide-react'
import { isLastDayForMinimum } from '@/lib/utils'
import { getCardTypeColor, getCardTypeIcon, getParticipantStatus, cn } from '@/lib/utils'
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
  const { isFull, hasMinimum, neededForMin } = getParticipantStatus(
    card.currentParticipants,
    card.minParticipants,
    card.maxParticipants
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35, ease: 'easeOut' }}
      whileHover={{ y: -3 }}
      onClick={() => router.push(`/${locale}/cards/${card.id}`)}
      className="group relative bg-gray-900 rounded-2xl overflow-hidden border border-white/5
                 hover:border-teal-500/25 cursor-pointer transition-all duration-300 card-glow"
    >
      {/* Image */}
      <div className="relative h-44 overflow-hidden bg-gray-800">
        {card.images[0] ? (
          <img
            src={card.images[0]}
            alt={card.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-teal-900/60 to-cyan-900/40 flex items-center justify-center text-5xl select-none">
            {getCardTypeIcon(card.type)}
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/10 to-transparent" />

        {/* Type badge */}
        <div className={cn(
          'absolute top-3 start-3 px-2.5 py-1 rounded-lg text-xs font-semibold border backdrop-blur-sm',
          getCardTypeColor(card.type)
        )}>
          {getCardTypeIcon(card.type)} {tFilters(card.type as Parameters<typeof tFilters>[0])}
        </div>

        {/* Status badge */}
        {isFull ? (
          <div className="absolute top-3 end-3 px-2.5 py-1 rounded-lg text-xs font-semibold bg-red-500/20 text-red-300 border border-red-500/30 backdrop-blur-sm">
            {t('full')}
          </div>
        ) : hasMinimum ? (
          <div className="absolute top-3 end-3 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 backdrop-blur-sm">
            ✓ {t('spotsLeft')}
          </div>
        ) : null}

        {/* Last day warning */}
        {lastDay && !hasMinimum && (
          <div className="absolute bottom-0 inset-x-0 px-3 py-2 bg-gradient-to-r from-amber-500/90 to-orange-500/90 backdrop-blur-sm flex items-center gap-1.5 urgent-pulse">
            <AlertTriangle className="w-3.5 h-3.5 text-black flex-shrink-0" />
            <span className="text-xs font-bold text-black truncate">{t('lastDayWarning')}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Title + description */}
        <div>
          <h3 className="font-semibold text-white text-sm group-hover:text-teal-300 transition-colors line-clamp-1 leading-snug">
            {card.title}
          </h3>
          <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">{card.description}</p>
        </div>

        {/* Meta info */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <MapPin className="w-3 h-3 text-teal-500/70 flex-shrink-0" />
            <span className="truncate">{card.location.city}, {card.location.country}</span>
          </div>
          {card.eventDate && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Calendar className="w-3 h-3 text-teal-500/70 flex-shrink-0" />
              <span>{new Date(card.eventDate).toLocaleDateString()}{card.eventTime ? ` · ${card.eventTime}` : ''}</span>
            </div>
          )}
        </div>

        {/* Participants */}
        <div className="space-y-1.5">
          <ParticipantBar
            current={card.currentParticipants}
            min={card.minParticipants}
            max={card.maxParticipants}
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Users className="w-3 h-3" />
              <span>{card.currentParticipants}/{card.maxParticipants}</span>
              {!hasMinimum && neededForMin > 0 && (
                <span className="text-amber-400/90 ms-1">· {t('needMore', { count: neededForMin })}</span>
              )}
            </div>
            <span className="text-xs text-teal-400/0 group-hover:text-teal-400/80 transition-all duration-200">
              {t('viewDetails')} →
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
