'use client'
import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { mockCards } from '@/lib/mock-data'
import { CardType, TravelCard } from '@/types'
import { TravelCardComponent } from './cards/TravelCardComponent'
import { FilterBar } from './cards/FilterBar'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, MapPin, Compass } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

type FilterType = CardType | 'all'

export function ExplorePage() {
  const t = useTranslations('hero')
  const tEmpty = useTranslations('empty')
  const [filter, setFilter] = useState<FilterType>('all')
  const [search, setSearch] = useState('')
  const params = useParams()
  const locale = params.locale as string

  const filtered = useMemo(() => {
    return mockCards.filter((card) => {
      const matchesFilter = filter === 'all' || card.type === filter
      const matchesSearch =
        !search ||
        card.title.toLowerCase().includes(search.toLowerCase()) ||
        card.location.city.toLowerCase().includes(search.toLowerCase()) ||
        card.location.country.toLowerCase().includes(search.toLowerCase())
      return matchesFilter && matchesSearch
    })
  }, [filter, search])

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="relative overflow-hidden pt-24 pb-16 px-6">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-teal-950/30 via-gray-950 to-gray-950" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-teal-500/10 rounded-full blur-3xl" />

        <div className="relative max-w-4xl mx-auto text-center space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-sm mb-6">
              <Compass className="w-4 h-4" />
              <span>GoTogether</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight">
              {t('title')}
            </h1>
            <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
              {t('subtitle')}
            </p>
          </motion.div>

          {/* Search bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex gap-2 max-w-xl mx-auto"
          >
            <div className="flex-1 relative">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="w-full ps-10 pe-4 py-3 bg-gray-900 border border-white/10 rounded-xl text-white 
                           placeholder:text-gray-500 focus:outline-none focus:border-teal-500/50 focus:ring-1 
                           focus:ring-teal-500/20 transition-all"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-3 bg-gray-900 border border-white/10 rounded-xl 
                               text-gray-400 hover:text-teal-400 hover:border-teal-500/30 transition-all text-sm whitespace-nowrap">
              <MapPin className="w-4 h-4" />
              <span className="hidden sm:block">{t('useLocation')}</span>
            </button>
          </motion.div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-6 pb-16 space-y-6">
        {/* Filters */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <FilterBar active={filter} onChange={setFilter} />
        </motion.div>

        {/* Results count */}
        <div className="text-sm text-gray-500">
          {filtered.length} {filtered.length === 1 ? 'card' : 'cards'} found
        </div>

        {/* Grid */}
        <AnimatePresence mode="wait">
          {filtered.length > 0 ? (
            <motion.div
              key={filter + search}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            >
              {filtered.map((card, i) => (
                <TravelCardComponent key={card.id} card={card} index={i} />
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-24 space-y-4"
            >
              <div className="text-5xl">🌍</div>
              <h3 className="text-xl font-semibold text-white">{tEmpty('title')}</h3>
              <p className="text-gray-400">{tEmpty('subtitle')}</p>
              <Link
                href={`/${locale}/create`}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 
                           text-white font-medium hover:from-teal-400 hover:to-cyan-400 transition-all mt-4"
              >
                {tEmpty('cta')}
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
