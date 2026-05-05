'use client'
import { useState, useMemo, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { TravelCard } from '@/types'
import { TravelCardComponent } from './cards/TravelCardComponent'
import { FilterBar, FilterType } from './cards/FilterBar'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, MapPin, Plus, ChevronLeft, ChevronRight, LayoutGrid, Map as MapIcon, Sparkles } from 'lucide-react'
import { CardSkeletonGrid } from './ui/CardSkeleton'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { fetchCards } from '@/lib/cards'
import { resolveCardCoords, distanceKm } from '@/lib/locationCoords'
import { useToast } from '@/components/ui/Toast'
import dynamic from 'next/dynamic'

const CardsMap = dynamic(() => import('./cards/CardsMap'), { ssr: false })

export function ExplorePage() {
  const t = useTranslations('hero')
  const tEmpty = useTranslations('empty')
  const [filter, setFilter] = useState<FilterType>('all')
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [cards, setCards] = useState<TravelCard[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [view, setView] = useState<'grid' | 'map'>('grid')
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [locating, setLocating] = useState(false)
  const CARDS_PER_PAGE = 12
  const params = useParams()
  const locale = params.locale as string
  const { toast } = useToast()

  const handleUseLocation = () => {
    if (userLocation) {
      setUserLocation(null)
      toast(t('locationCleared'), 'info')
      return
    }
    if (!navigator.geolocation) {
      toast(t('locationUnsupported'), 'error')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        setUserLocation([pos.coords.latitude, pos.coords.longitude])
        setLocating(false)
        toast(t('locationFound'), 'success')
      },
      () => {
        setLocating(false)
        toast(t('locationDenied'), 'error')
      },
      { timeout: 10000 }
    )
  }

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchCards()
        setCards(data)
      } catch (e) {
        console.error('Failed to fetch cards:', e)
        setCards([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    let result = cards.filter((card) => {
      const matchesFilter =
        filter === 'all' ? true :
        filter === 'almost_full' ? (card.maxParticipants - card.currentParticipants === 1) :
        card.type === filter

      const matchesSearch =
        !search ||
        card.title.toLowerCase().includes(search.toLowerCase()) ||
        card.location.city.toLowerCase().includes(search.toLowerCase()) ||
        card.location.country.toLowerCase().includes(search.toLowerCase())

      const matchesDateFrom = !dateFrom || !card.eventDate || card.eventDate >= dateFrom
      const matchesDateTo = !dateTo || !card.eventDate || card.eventDate <= dateTo

      const today = new Date().toISOString().split('T')[0]
      const notPast = !card.eventDate || card.eventDate >= today

      return matchesFilter && matchesSearch && matchesDateFrom && matchesDateTo && notPast
    })

    if (userLocation) {
      result = result.sort((a, b) => {
        const ca = resolveCardCoords(a)
        const cb = resolveCardCoords(b)
        if (!ca && !cb) return 0
        if (!ca) return 1
        if (!cb) return -1
        return distanceKm(userLocation, ca) - distanceKm(userLocation, cb)
      })
    } else {
      result = result.sort((a, b) => {
        if (!a.eventDate && !b.eventDate) return 0
        if (!a.eventDate) return 1
        if (!b.eventDate) return -1
        return a.eventDate.localeCompare(b.eventDate)
      })
    }

    return result
  }, [filter, search, dateFrom, dateTo, cards, userLocation])

  const totalPages = Math.ceil(filtered.length / CARDS_PER_PAGE)
  const paginated = filtered.slice((page - 1) * CARDS_PER_PAGE, page * CARDS_PER_PAGE)

  useEffect(() => { setPage(1) }, [filter, search, dateFrom, dateTo])

  return (
    <div className="min-h-screen">
      {/* ── Hero ── */}
      <section className="relative pt-32 pb-24 px-4 sm:px-8">
        <div className="relative max-w-6xl mx-auto">
          {/* Live badge — brighter, bigger */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2.5 px-4 py-2 mb-8 rounded-full
                       bg-white/[0.08] border border-white/[0.16] backdrop-blur-md
                       text-[13px] font-bold text-[--color-mist-100]"
          >
            <span className="live-dot" />
            <span><span className="text-[--color-emerald-400] font-bold tabular-nums">{cards.length}</span> active adventures</span>
            <span className="text-[--color-mist-400]">·</span>
            <Sparkles className="w-3.5 h-3.5 text-[--color-amber-400] pulse-glow" strokeWidth={2.5} />
            <span>fresh today</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-6 max-w-4xl"
          >
            <h1 className="headline-xl text-[--color-mist-50] text-7xl sm:text-8xl md:text-9xl"
                style={{ fontVariationSettings: "'wdth' 115" }}>
              {t('title').split(' ').slice(0, -1).join(' ')}{' '}
              <span className="text-gradient">{t('title').split(' ').slice(-1)[0]}</span>
            </h1>

            <p className="text-[--color-mist-200] text-xl sm:text-2xl max-w-2xl leading-relaxed font-medium">
              {t('subtitle')}
            </p>
          </motion.div>

          {/* Search bar — bigger, brighter */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="mt-12 flex gap-3 max-w-2xl"
          >
            <div className="flex-1 relative group">
              <Search className="absolute start-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[--color-mist-300] pointer-events-none" strokeWidth={2.25} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="w-full ps-14 pe-5 py-5 rounded-2xl
                           bg-white/[0.06] backdrop-blur-md border border-white/[0.14]
                           text-[--color-mist-50] text-[16px] font-semibold placeholder:text-[--color-mist-400] placeholder:font-medium
                           focus:outline-none focus:border-[--color-coral-500]/60 focus:bg-white/[0.10]
                           focus:shadow-[0_0_36px_rgba(255,84,112,.30)]
                           transition-all duration-300"
              />
            </div>
            <button
              onClick={handleUseLocation}
              disabled={locating}
              className={`flex items-center gap-2 px-5 py-5 rounded-2xl transition-all
                          text-[14px] font-bold whitespace-nowrap disabled:opacity-60 ${
                userLocation
                  ? 'bg-gradient-to-r from-[--color-coral-500] to-[--color-violet-500] border border-white/20 text-white shadow-[0_0_28px_rgba(255,84,112,.45)]'
                  : 'bg-white/[0.06] backdrop-blur-md border border-white/[0.14] text-[--color-mist-100] hover:border-white/[0.24] hover:bg-white/[0.10]'
              }`}
            >
              <MapPin className={`w-5 h-5 ${locating ? 'animate-pulse' : ''}`} strokeWidth={2.25} />
              <span className="hidden sm:block">
                {userLocation ? t('locationActive') : t('useLocation')}
              </span>
            </button>
          </motion.div>
        </div>
      </section>

      {/* ── Filters + content ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pb-24 space-y-7">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <FilterBar
            active={filter}
            onChange={setFilter}
            dateFrom={dateFrom}
            dateTo={dateTo}
            onDateFromChange={setDateFrom}
            onDateToChange={setDateTo}
            locale={locale}
          />
        </motion.div>

        {loading ? (
          <CardSkeletonGrid count={6} />
        ) : (
          <>
            {/* Count + view toggle */}
            <div className="flex items-end justify-between gap-4 pt-2">
              <div className="text-[12px] font-mono text-[--color-mist-300] tabular-nums">
                <span className="text-[--color-coral-400] font-semibold">{filtered.length}</span> {filtered.length === 1 ? 'experience' : 'experiences'} found
              </div>
              <div className="glass flex items-center gap-0.5 p-1 rounded-full">
                <button
                  onClick={() => setView('grid')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all text-[11px] font-semibold ${
                    view === 'grid'
                      ? 'bg-gradient-to-r from-[--color-coral-500] to-[--color-violet-500] text-white shadow-[0_0_16px_rgba(255,84,112,.4)]'
                      : 'text-[--color-mist-300] hover:text-[--color-mist-50]'
                  }`}
                >
                  <LayoutGrid className="w-3 h-3" strokeWidth={2.5} />
                  {t('viewGrid')}
                </button>
                <button
                  onClick={() => setView('map')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all text-[11px] font-semibold ${
                    view === 'map'
                      ? 'bg-gradient-to-r from-[--color-cyan-400] to-[--color-violet-500] text-white shadow-[0_0_16px_rgba(34,211,238,.4)]'
                      : 'text-[--color-mist-300] hover:text-[--color-mist-50]'
                  }`}
                >
                  <MapIcon className="w-3 h-3" strokeWidth={2.5} />
                  {t('viewMap')}
                </button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {filtered.length > 0 ? (
                view === 'map' ? (
                  <motion.div
                    key="map-view"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <CardsMap cards={filtered} />
                  </motion.div>
                ) : (
                  <>
                    <motion.div
                      key={filter + search + page}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6"
                    >
                      {paginated.map((card, i) => (
                        <TravelCardComponent key={card.id} card={card} index={i} />
                      ))}
                    </motion.div>

                    {totalPages > 1 && (
                      <div className="flex items-center justify-center gap-1.5 pt-8">
                        <button
                          onClick={() => setPage(p => Math.max(1, p - 1))}
                          disabled={page === 1}
                          className="p-2 rounded-lg border border-white/[0.06] bg-white/[0.02]
                                     text-[--color-mist-300] hover:text-[--color-coral-400] hover:border-[--color-coral-500]/30
                                     disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>

                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                          <button
                            key={n}
                            onClick={() => setPage(n)}
                            className={`w-9 h-9 rounded-lg text-[12px] font-mono font-semibold tabular-nums transition-all ${
                              n === page
                                ? 'bg-gradient-to-r from-[--color-coral-500] to-[--color-violet-500] text-white shadow-[0_0_16px_rgba(255,84,112,.4)]'
                                : 'border border-white/[0.06] bg-white/[0.02] text-[--color-mist-300] hover:text-[--color-mist-50] hover:border-white/[0.16]'
                            }`}
                          >
                            {n}
                          </button>
                        ))}

                        <button
                          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                          disabled={page === totalPages}
                          className="p-2 rounded-lg border border-white/[0.06] bg-white/[0.02]
                                     text-[--color-mist-300] hover:text-[--color-coral-400] hover:border-[--color-coral-500]/30
                                     disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </>
                )
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-32 space-y-5"
                >
                  <div className="text-7xl mb-4 float">🌍</div>
                  <h3 className="font-display text-[--color-mist-50] text-3xl font-semibold">{tEmpty('title')}</h3>
                  <p className="text-[--color-mist-300] text-base max-w-sm mx-auto">{tEmpty('subtitle')}</p>
                  <Link
                    href={`/${locale}/create`}
                    className="btn-primary inline-flex items-center gap-2 px-6 py-3 mt-2 rounded-full
                               text-[13px] font-semibold"
                  >
                    <Plus className="w-4 h-4 relative z-[1]" strokeWidth={2.5} />
                    <span className="relative z-[1]">{tEmpty('cta')}</span>
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
