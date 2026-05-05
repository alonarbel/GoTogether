'use client'
import { useState, useMemo, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { TravelCard } from '@/types'
import { TravelCardComponent } from './cards/TravelCardComponent'
import { FilterBar, FilterType } from './cards/FilterBar'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, MapPin, Plus, ChevronLeft, ChevronRight, LayoutGrid, Map as MapIcon } from 'lucide-react'
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
      {/* ── Editorial Hero ── */}
      <div className="relative overflow-hidden pt-28 sm:pt-32 pb-16 px-4 sm:px-8">
        {/* decorative number marker */}
        <div className="absolute top-24 end-8 hidden md:block font-mono text-[--color-ink-700] text-[11px] tracking-[0.3em]">
          № 001 — EXPLORE
        </div>

        <div className="relative max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-7"
          >
            <div className="flex items-center gap-3">
              <span className="w-8 h-px bg-[--color-amber-400]" />
              <span className="eyebrow text-[--color-amber-400]">issue · {new Date().getFullYear()}</span>
            </div>

            <h1 className="headline text-[--color-bone-50] text-5xl sm:text-7xl md:text-8xl
                           max-w-4xl">
              {t('title')}
            </h1>

            <p className="text-[--color-bone-200] text-base sm:text-lg max-w-xl leading-relaxed">
              {t('subtitle')}
            </p>
          </motion.div>

          {/* Search row */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="mt-10 flex gap-2.5 max-w-2xl"
          >
            <div className="flex-1 relative group">
              <Search className="absolute start-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[--color-bone-400] pointer-events-none" strokeWidth={2} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="w-full ps-11 pe-4 py-3.5 bg-[--color-ink-900] border border-[rgba(255,255,255,.06)] rounded-sm
                           text-[--color-bone-50] text-sm
                           placeholder:text-[--color-bone-600]
                           focus:outline-none focus:border-[--color-amber-400]/40 focus:bg-[--color-ink-850]
                           transition-all duration-300"
              />
            </div>
            <button
              onClick={handleUseLocation}
              disabled={locating}
              className={`flex items-center gap-2 px-4 py-3.5 rounded-sm transition-all
                          font-mono text-[11px] tracking-[0.16em] uppercase whitespace-nowrap
                          disabled:opacity-60 ${
                userLocation
                  ? 'bg-[--color-amber-400]/15 border border-[--color-amber-400]/40 text-[--color-amber-400]'
                  : 'bg-[--color-ink-900] border border-[rgba(255,255,255,.06)] text-[--color-bone-400] hover:border-[rgba(255,255,255,.12)] hover:text-[--color-bone-50]'
              }`}
            >
              <MapPin className={`w-4 h-4 ${locating ? 'animate-pulse' : ''}`} strokeWidth={2} />
              <span className="hidden sm:block">
                {userLocation ? t('locationActive') : t('useLocation')}
              </span>
            </button>
          </motion.div>
        </div>

        {/* bottom horizontal rule */}
        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[--color-ink-700] to-transparent" />
      </div>

      {/* ── Filters + content ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pb-20 pt-10 space-y-8">
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
            <div className="flex items-end justify-between gap-4 pb-4 border-b border-[--color-ink-800]">
              <div>
                <div className="eyebrow mb-1">{filter === 'all' ? 'All experiences' : filter}</div>
                <div className="font-mono text-[11px] tracking-[0.14em] uppercase text-[--color-bone-400] tabular-nums">
                  {t('cardsFound', { count: filtered.length })}
                </div>
              </div>
              <div className="flex items-center gap-0.5 p-0.5 rounded-sm border border-[rgba(255,255,255,.06)] bg-[--color-ink-900]">
                <button
                  onClick={() => setView('grid')}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm transition-colors
                              font-mono text-[10px] tracking-[0.18em] uppercase ${
                    view === 'grid'
                      ? 'bg-[--color-amber-400] text-[--color-amber-ink]'
                      : 'text-[--color-bone-400] hover:text-[--color-bone-50]'
                  }`}
                >
                  <LayoutGrid className="w-3 h-3" strokeWidth={2.5} />
                  {t('viewGrid')}
                </button>
                <button
                  onClick={() => setView('map')}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm transition-colors
                              font-mono text-[10px] tracking-[0.18em] uppercase ${
                    view === 'map'
                      ? 'bg-[--color-amber-400] text-[--color-amber-ink]'
                      : 'text-[--color-bone-400] hover:text-[--color-bone-50]'
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
                      <div className="flex items-center justify-center gap-1 pt-8">
                        <button
                          onClick={() => setPage(p => Math.max(1, p - 1))}
                          disabled={page === 1}
                          className="p-2 rounded-sm border border-[rgba(255,255,255,.06)]
                                     text-[--color-bone-400] hover:text-[--color-amber-400] hover:border-[--color-amber-400]/30
                                     disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>

                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                          <button
                            key={n}
                            onClick={() => setPage(n)}
                            className={`w-9 h-9 rounded-sm font-mono text-[11px] tabular-nums tracking-[0.05em] transition-all ${
                              n === page
                                ? 'bg-[--color-amber-400] text-[--color-amber-ink]'
                                : 'border border-[rgba(255,255,255,.06)] text-[--color-bone-400] hover:text-[--color-bone-50] hover:border-[rgba(255,255,255,.16)]'
                            }`}
                          >
                            {String(n).padStart(2, '0')}
                          </button>
                        ))}

                        <button
                          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                          disabled={page === totalPages}
                          className="p-2 rounded-sm border border-[rgba(255,255,255,.06)]
                                     text-[--color-bone-400] hover:text-[--color-amber-400] hover:border-[--color-amber-400]/30
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
                  <div className="font-display text-7xl text-[--color-bone-600]">∅</div>
                  <h3 className="font-display text-[--color-bone-50] text-2xl">{tEmpty('title')}</h3>
                  <p className="text-[--color-bone-400] text-sm">{tEmpty('subtitle')}</p>
                  <Link
                    href={`/${locale}/create`}
                    className="inline-flex items-center gap-2 px-5 py-3 mt-2 rounded-sm
                               font-mono text-[11px] tracking-[0.18em] uppercase font-semibold
                               bg-[--color-amber-400] text-[--color-amber-ink]
                               hover:bg-[--color-amber-500] transition-all
                               shadow-[0_8px_28px_rgba(251,191,36,.2)]"
                  >
                    <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
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
