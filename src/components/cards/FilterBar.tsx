'use client'
import { useTranslations } from 'next-intl'
import { CardType } from '@/types'
import { getCardTypeIcon, cn } from '@/lib/utils'
import { motion } from 'framer-motion'

type FilterType = CardType | 'all'

interface FilterBarProps {
  active: FilterType
  onChange: (type: FilterType) => void
}

const filters: FilterType[] = ['all', 'trip', 'attraction', 'workshop', 'sport', 'food', 'other']

export function FilterBar({ active, onChange }: FilterBarProps) {
  const t = useTranslations('filters')

  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
      {filters.map((f) => (
        <button
          key={f}
          onClick={() => onChange(f)}
          className={cn(
            'relative flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all',
            active === f
              ? 'text-white'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          )}
        >
          {active === f && (
            <motion.div
              layoutId="activeFilter"
              className="absolute inset-0 rounded-xl bg-gradient-to-r from-teal-500/20 to-cyan-500/20 border border-teal-500/30"
              transition={{ type: 'spring', bounce: 0.3, duration: 0.5 }}
            />
          )}
          <span className="relative z-10">
            {f !== 'all' && getCardTypeIcon(f as CardType)} {t(f)}
          </span>
        </button>
      ))}
    </div>
  )
}
