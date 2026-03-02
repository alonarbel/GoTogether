'use client'
import { TravelCard } from '@/types'
import { useTranslations } from 'next-intl'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { MapPin, Users, ArrowRight } from 'lucide-react'
import { getCardTypeColor, getCardTypeIcon, getParticipantStatus, cn } from '@/lib/utils'
import { ParticipantBar } from './ParticipantBar'
import Image from 'next/image'

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
  const { isFull, hasMinimum, neededForMin, spotsLeft } = getParticipantStatus(
    card.currentParticipants,
    card.minParticipants,
    card.maxParticipants
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      whileHover={{ y: -4, scale: 1.01 }}
      onClick={() => router.push(`/${locale}/cards/${card.id}`)}
      className="group relative bg-gray-900 rounded-2xl overflow-hidden border border-white/5 
                 hover:border-teal-500/30 cursor-pointer transition-all duration-300
                 hover:shadow-xl hover:shadow-teal-500/10"
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        {card.images[0] ? (
          <img
            src={card.images[0]}
            alt={card.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-teal-900 to-cyan-900 flex items-center justify-center text-4xl">
            {getCardTypeIcon(card.type)}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/20 to-transparent" />

        {/* Type badge */}
        <div className={cn(
          'absolute top-3 start-3 px-2.5 py-1 rounded-lg text-xs font-medium border',
          getCardTypeColor(card.type)
        )}>
          {getCardTypeIcon(card.type)} {tFilters(card.type)}
        </div>

        {/* Status badge */}
        {isFull && (
          <div className="absolute top-3 end-3 px-2.5 py-1 rounded-lg text-xs font-medium bg-red-500/20 text-red-300 border border-red-500/30">
            {t('full')}
          </div>
        )}
        {!isFull && hasMinimum && (
          <div className="absolute top-3 end-3 px-2.5 py-1 rounded-lg text-xs font-medium bg-green-500/20 text-green-300 border border-green-500/30">
            ✓ {t('spotsLeft')}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-white group-hover:text-teal-400 transition-colors line-clamp-1">
            {card.title}
          </h3>
          <p className="text-sm text-gray-400 mt-1 line-clamp-2">{card.description}</p>
        </div>

        {/* Location */}
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <MapPin className="w-3.5 h-3.5 text-teal-500 flex-shrink-0" />
          <span>{card.location.city}, {card.location.country}</span>
        </div>

        {/* Participant bar */}
        <ParticipantBar
          current={card.currentParticipants}
          min={card.minParticipants}
          max={card.maxParticipants}
        />

        {/* Footer */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Users className="w-3.5 h-3.5" />
            <span>{card.currentParticipants}/{card.maxParticipants}</span>
            {!hasMinimum && neededForMin > 0 && (
              <span className="text-amber-400 ms-1">
                · {t('needMore', { count: neededForMin })}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-teal-400 opacity-0 group-hover:opacity-100 transition-opacity">
            <span>{t('viewDetails')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </motion.div>
  )
}
