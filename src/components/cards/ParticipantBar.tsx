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
      <div className="relative h-1.5 bg-[--color-night-800] rounded-full overflow-visible">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1], delay: 0.08 }}
          className={cn(
            'absolute inset-y-0 start-0 rounded-full',
            isFull
              ? 'bg-gradient-to-r from-[--color-rose-500] to-[--color-coral-500]'
              : hasMinimum
              ? 'bg-gradient-to-r from-[--color-emerald-400] to-[--color-cyan-400]'
              : 'bg-gradient-to-r from-[--color-coral-500] via-[--color-violet-500] to-[--color-cyan-400]'
          )}
          style={{
            boxShadow: isFull
              ? '0 0 12px rgba(244,63,94,.45)'
              : hasMinimum
              ? '0 0 12px rgba(52,211,153,.4)'
              : '0 0 12px rgba(167,139,250,.4)',
          }}
        />
        {/* min marker */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-0.5 h-3 rounded-full bg-[--color-amber-400]"
          style={{ insetInlineStart: `${minPercentage}%`, boxShadow: '0 0 6px rgba(251,191,36,.6)' }}
        />
      </div>
    </div>
  )
}
