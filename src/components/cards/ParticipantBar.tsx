'use client'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ParticipantBarProps {
  current: number
  min: number
  max: number
  className?: string
  showLabels?: boolean
}

export function ParticipantBar({ current, min, max, className, showLabels = false }: ParticipantBarProps) {
  const percentage = Math.min((current / max) * 100, 100)
  const minPercentage = (min / max) * 100
  const isFull = current >= max
  const hasMinimum = current >= min

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="bar-track relative h-3 rounded-full overflow-visible">
        {/* Animated fill */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.95, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          className={cn(
            'absolute inset-y-0 start-0 rounded-full',
            isFull
              ? 'bar-fill-rose'
              : hasMinimum
              ? 'bar-fill-emerald'
              : 'bar-fill-coral'
          )}
        />

        {/* Min marker — thin neutral line */}
        <div
          className="absolute -top-1 -bottom-1 w-px bg-[--color-mist-200]/60"
          style={{ insetInlineStart: `calc(${minPercentage}% - 0.5px)` }}
        />
        {/* Min marker caption — subtle sans label */}
        <div
          className="absolute -top-5 -translate-x-1/2
                     text-[10px] font-medium tracking-wide
                     text-[--color-mist-300] whitespace-nowrap"
          style={{ insetInlineStart: `${minPercentage}%` }}
        >
          min · {min}
        </div>
      </div>

      {showLabels && (
        <div className="flex items-center justify-between text-[10px] font-mono font-bold tabular-nums">
          <span className="text-[--color-mist-100]">0</span>
          <span className="text-[--color-mist-100]">{max}</span>
        </div>
      )}
    </div>
  )
}
