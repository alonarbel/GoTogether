'use client'
import { useState, useMemo, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { TravelCard, CardType } from '@/types'
import { TravelCardComponent } from './cards/TravelCardComponent'
import { FilterBar } from './cards/FilterBar'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, MapPin, Compass, Loader2, Plus } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { fetchCards } from '@/lib/cards'
import { mockCards } from '@/lib/mock-data'

type FilterType = CardType | 'all'

export function ExplorePage() {
  const t = useTranslations('hero')
  const tEmpty = useTranslations('empty')
  const [filter, setFilter] = useState<FilterType>('all')
  const [search, setSearch] = useState('')
  const [cards, setCards] = useState<TravelCard[]>([])
  const [loading, setLoading] = useState(true)
  const params = useParams()
  const locale = params.locale as string

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchCards()
        setCards(data.length > 0 ? data : mockCards)
      } catch {
        setCards(mockCards)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    return cards.filter((card) => {
      const matchesFilter = filter === 'all' || card.type === filter
      const matchesSearch =
        !search ||
        card.title.toLowerCase().includes(search.toLowerCase()) ||
        card.location.city.toLowerCase().includes(search.toLowerCase()) ||
        card.location.country.toLowerCase().includes(search.toLowerCase())
      return matchesFilter && matchesSearch
    })
  }, [filter, search, cards])

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="relative overflow-hidden pt-24 pb-14 px-4 sm:px-6">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-teal-950/25 via-gray-950/80 to-gray-950 pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-teal-500/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-20 right-1/4 w-[200px] h-[200px] bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-medium mb-6">
              <Compass className="w-3.5 h-3.5" />
              <span>GoTogether</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight tracking-tight">
              {t('title')}
            </h1>
            <p className="mt-4 text-base sm:text-lg text-gray-400 max-w-xl mx-auto leading-relaxed">
              {t('subtitle')}
            </p>
          </motion.div>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.45 }}
            className="mt-8 flex gap-2.5 max-w-lg mx-auto"
          >
            <div className="flex-1 relative">
              <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="w-full ps-10 pe-4 py-3 bg-gray-900/90 border border-white/8 rounded-xl text-white text-sm
                           placeholder:text-gray-600 focus:outline-none focus:border-teal-500/40 focus:bg-gray-900
                           transition-all duration-200 shadow-lg shadow-black/20"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-3 bg-gray-900/90 border border-white/8 rounded-xl
                               text-gray-400 hover:text-teal-400 hover:border-teal-500/25 transition-all text-sm
                               whitespace-nowrap shadow-lg shadow-black/20">
              <MapPin className="w-4 h-4" />
              <span className="hidden sm:block">{t('useLocation')}</span>
            </button>
          </motion.div>
        </div>
      </div>

      {/* Filters + content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-16 space-y-5">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
          <FilterBar active={filter} onChange={setFilter} />
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
              <p className="text-sm text-gray-600">Loading...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Count */}
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-600">{t('cardsFound', { count: filtered.length })}</p>
            </div>

            <AnimatePresence mode="wait">
              {filtered.length > 0 ? (
                <motion.div
                  key={filter + search}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                >
                  {filtered.map((card, i) => (
                    <TravelCardComponent key={card.id} card={card} index={i} />
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-28 space-y-4"
                >
                  <div className="text-6xl mb-2">🌍</div>
                  <h3 className="text-xl font-semibold text-white">{tEmpty('title')}</h3>
                  <p className="text-gray-500 text-sm">{tEmpty('subtitle')}</p>
                  <Link
                    href={`/${locale}/create`}
                    className="inline-flex items-center gap-2 px-6 py-3 mt-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500
                               text-white text-sm font-semibold hover:from-teal-400 hover:to-cyan-400 transition-all
                               shadow-lg shadow-teal-500/20"
                  >
                    <Plus className="w-4 h-4" />
                    {tEmpty('cta')}
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  )
}
