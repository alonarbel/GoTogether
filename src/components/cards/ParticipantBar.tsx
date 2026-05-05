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
      <div className="relative h-[3px] bg-[--color-ink-800] rounded-full overflow-visible">
        {/* Fill — single solid amber/coral, no gradients */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1], delay: 0.08 }}
          className={cn(
            'absolute inset-y-0 start-0 rounded-full',
            isFull
              ? 'bg-[--color-coral-400]'
              : hasMinimum
              ? 'bg-[--color-emerald-400]'
              : 'bg-[--color-amber-400]'
          )}
          style={{
            boxShadow: isFull
              ? '0 0 8px rgba(248,113,113,.4)'
              : hasMinimum
              ? '0 0 8px rgba(52,211,153,.35)'
              : '0 0 8px rgba(251,191,36,.35)',
          }}
        />
        {/* Min marker — vertical tick */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-px h-2.5 bg-[--color-bone-400]"
          style={{ insetInlineStart: `${minPercentage}%` }}
        />
      </div>
    </div>
  )
}
