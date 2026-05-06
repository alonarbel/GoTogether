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
        {filters.map((f) => {
          const isActive = active === f
          return (
            <button
              key={f}
              onClick={() => onChange(f)}
              aria-pressed={isActive}
              className={cn(
                'relative flex items-center gap-1.5 px-4 py-2 rounded-full whitespace-nowrap transition-colors',
                'text-[12px] font-semibold',
                isActive
                  ? 'text-white'
                  : 'text-[--color-mist-300] hover:text-[--color-mist-50] hover:bg-[--color-night-900] border border-[--color-mist-500]'
              )}
              style={isActive ? { boxShadow: '0 6px 20px -6px rgba(231,133,105,0.45)' } : undefined}
            >
              {isActive && (
                <motion.div
                  layoutId="activeFilter"
                  className="absolute inset-0 rounded-full"
                  transition={{ type: 'spring', bounce: 0.18, duration: 0.5 }}
                  style={{
                    background: 'linear-gradient(90deg, #d04a2d 0%, #b33a1f 100%)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18)',
                  }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                {f === 'almost_full' && <span aria-hidden>🔥</span>}
                {f !== 'all' && f !== 'almost_full' && <span aria-hidden>{getCardTypeIcon(f as CardType)}</span>}
                <span>{t(f)}</span>
              </span>
            </button>
          )
        })}
      </div>

      {/* Date filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2.5">
          <label className="eyebrow">{t('dateFrom')}</label>
          <LocaleDatePicker value={dateFrom} onChange={onDateFromChange} locale={locale} />
        </div>
        <div className="hidden sm:block w-px h-4 bg-[--color-mist-500]" />
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
