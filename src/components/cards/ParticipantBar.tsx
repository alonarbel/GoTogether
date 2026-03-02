'use client'
import { motion } from 'framer-motion'
import { getParticipantStatus } from '@/lib/utils'
import { useTranslations } from 'next-intl'

interface ParticipantBarProps {
  current: number
  min: number
  max: number
  showLabels?: boolean
  size?: 'sm' | 'lg'
}

export function ParticipantBar({ current, min, max, showLabels = false, size = 'sm' }: ParticipantBarProps) {
  const t = useTranslations('card')
  const { percentage, isFull, hasMinimum } = getParticipantStatus(current, min, max)
  const minPercentage = (min / max) * 100

  const barColor = isFull
    ? 'from-red-500 to-rose-500'
    : hasMinimum
    ? 'from-teal-500 to-cyan-400'
    : 'from-amber-500 to-orange-400'

  return (
    <div className="space-y-1.5">
      {showLabels && (
        <div className="flex justify-between text-xs text-gray-400">
          <span>{t('participants')}: <span className="text-white font-medium">{current}</span></span>
          <span>{t('min')}: <span className="text-amber-400 font-medium">{min}</span> · {t('max')}: <span className="text-teal-400 font-medium">{max}</span></span>
        </div>
      )}
      <div className={`relative bg-gray-800 rounded-full overflow-hidden ${size === 'lg' ? 'h-3' : 'h-2'}`}>
        {/* Min marker */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-amber-500/60 z-10"
          style={{ left: `${minPercentage}%` }}
        />
        {/* Fill bar */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(percentage, 100)}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
          className={`h-full rounded-full bg-gradient-to-r ${barColor} shadow-lg`}
          style={{ boxShadow: hasMinimum ? '0 0 8px rgba(20,184,166,0.4)' : '0 0 8px rgba(245,158,11,0.4)' }}
        />
      </div>
      {!showLabels && (
        <div className="flex justify-between text-xs text-gray-600">
          <span className="text-amber-500/80">{min} min</span>
          <span className="text-teal-500/80">{max} max</span>
        </div>
      )}
    </div>
  )
}
