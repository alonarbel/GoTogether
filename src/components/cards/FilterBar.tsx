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
    <div className="space-y-4">
      {/* Filter pills — vibrant gradient on active */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => onChange(f)}
            className={cn(
              'relative flex items-center gap-1.5 px-4 py-2 rounded-full whitespace-nowrap transition-colors',
              'text-[12px] font-medium',
              active === f
                ? 'text-white'
                : 'text-[--color-mist-300] hover:text-[--color-mist-50] hover:bg-white/[0.04]'
            )}
          >
            {active === f && (
              <motion.div
                layoutId="activeFilter"
                className="absolute inset-0 rounded-full
                           bg-gradient-to-r from-[--color-coral-500] via-[--color-violet-500] to-[--color-cyan-400]
                           shadow-[0_0_20px_rgba(255,84,112,.45)]"
                transition={{ type: 'spring', bounce: 0.18, duration: 0.5 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {f === 'almost_full' && <span aria-hidden>🔥</span>}
              {f !== 'all' && f !== 'almost_full' && <span aria-hidden>{getCardTypeIcon(f as CardType)}</span>}
              <span>{t(f)}</span>
            </span>
          </button>
        ))}
      </div>

      {/* Date filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2.5">
          <label className="eyebrow">{t('dateFrom')}</label>
          <LocaleDatePicker value={dateFrom} onChange={onDateFromChange} locale={locale} />
        </div>
        <div className="hidden sm:block w-px h-4 bg-white/[0.08]" />
        <div className="flex items-center gap-2.5">
          <label className="eyebrow">{t('dateTo')}</label>
          <LocaleDatePicker value={dateTo} onChange={onDateToChange} locale={locale} />
        </div>
        {(dateFrom || dateTo) && (
          <button
            onClick={() => { onDateFromChange(''); onDateToChange('') }}
            className="text-[11px] font-mono text-[--color-mist-400] hover:text-[--color-coral-400] transition-colors"
          >
            ✕ clear
          </button>
        )}
      </div>
    </div>
  )
}
