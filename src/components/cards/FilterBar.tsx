'use client'
import { useTranslations } from 'next-intl'
import { CardType } from '@/types'
import { getCardTypeIcon, cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { LocaleDatePicker } from '@/components/ui/LocaleDatePicker'

export type FilterType = CardType | 'all' | 'almost_full'

interface FilterBarProps {
  active: FilterType
  onChange: (type: FilterType) => void
  dateFrom: string
  dateTo: string
  onDateFromChange: (v: string) => void
  onDateToChange: (v: string) => void
  locale: string
}

const filters: FilterType[] = ['all', 'trip', 'attraction', 'workshop', 'sport', 'food', 'other', 'almost_full']

export function FilterBar({ active, onChange, dateFrom, dateTo, onDateFromChange, onDateToChange, locale }: FilterBarProps) {
  const t = useTranslations('filters')

  return (
    <div className="space-y-3">
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
              {f === 'almost_full' ? '🔥' : f !== 'all' ? getCardTypeIcon(f as CardType) : null}{' '}
              {t(f)}
            </span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500 whitespace-nowrap">{t('dateFrom')}</label>
          <LocaleDatePicker value={dateFrom} onChange={onDateFromChange} locale={locale} />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500 whitespace-nowrap">{t('dateTo')}</label>
          <LocaleDatePicker value={dateTo} onChange={onDateToChange} locale={locale} />
        </div>
        {(dateFrom || dateTo) && (
          <button
            onClick={() => { onDateFromChange(''); onDateToChange('') }}
            className="text-xs text-gray-500 hover:text-teal-400 transition-colors"
          >
            ✕ clear dates
          </button>
        )}
      </div>
    </div>
  )
}
