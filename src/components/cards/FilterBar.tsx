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
      {/* Filter pills — refined, mono labels, single amber active state */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => onChange(f)}
            className={cn(
              'relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-sm whitespace-nowrap transition-colors',
              'font-mono text-[11px] tracking-[0.14em] uppercase',
              active === f
                ? 'text-[--color-amber-ink]'
                : 'text-[--color-bone-400] hover:text-[--color-bone-50]'
            )}
          >
            {active === f && (
              <motion.div
                layoutId="activeFilter"
                className="absolute inset-0 rounded-sm bg-[--color-amber-400]"
                transition={{ type: 'spring', bounce: 0.18, duration: 0.45 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {f === 'almost_full' && <span aria-hidden>◆</span>}
              {f !== 'all' && f !== 'almost_full' && <span aria-hidden>{getCardTypeIcon(f as CardType)}</span>}
              <span>{t(f)}</span>
            </span>
          </button>
        ))}
      </div>

      {/* Date range — editorial label */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2.5">
          <label className="eyebrow">{t('dateFrom')}</label>
          <LocaleDatePicker value={dateFrom} onChange={onDateFromChange} locale={locale} />
        </div>
        <div className="hidden sm:block w-px h-4 bg-[--color-ink-700]" />
        <div className="flex items-center gap-2.5">
          <label className="eyebrow">{t('dateTo')}</label>
          <LocaleDatePicker value={dateTo} onChange={onDateToChange} locale={locale} />
        </div>
        {(dateFrom || dateTo) && (
          <button
            onClick={() => { onDateFromChange(''); onDateToChange('') }}
            className="font-mono text-[10px] tracking-[0.14em] uppercase
                       text-[--color-bone-400] hover:text-[--color-amber-400] transition-colors link-underline"
          >
            ✕ clear
          </button>
        )}
      </div>
    </div>
  )
}
