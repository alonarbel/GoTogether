'use client'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ParticipantBarProps {
  current: number
  min: number
  max: number
  className?: string
}

export function ParticipantBar({ current, min, max, className }: ParticipantBarProps) {
  const percentage = Math.min((current / max) * 100, 100)
  const minPercentage = (min / max) * 100
  const isFull = current >= max
  const hasMinimum = current >= min

  return (
    <div className={cn('space-y-1', className)}>
      <div className="relative h-1.5 bg-gray-800 rounded-full overflow-visible">
        {/* Fill */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
          className={cn(
            'absolute inset-y-0 start-0 rounded-full',
            isFull
              ? 'bg-red-500'
              : hasMinimum
              ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
              : 'bg-gradient-to-r from-teal-600 to-cyan-500'
          )}
        />
        {/* Min marker */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-0.5 h-3 rounded-full bg-amber-400/60"
          style={{ insetInlineStart: `${minPercentage}%` }}
        />
      </div>
    </div>
  )
}
