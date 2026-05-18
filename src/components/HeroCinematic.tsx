'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useScroll,
  animate,
  type MotionValue,
} from 'framer-motion'
import { useTranslations } from 'next-intl'
import { Search, MapPin, ArrowRight, ArrowDown, Compass, Sparkles } from 'lucide-react'
import { TravelCard } from '@/types'

interface HeroCinematicProps {
  cards: TravelCard[]
  search: string
  onSearchChange: (v: string) => void
  onUseLocation: () => void
  userLocation: [number, number] | null
  locating: boolean
  onScrollCue: () => void
}

const EASE_ENTRY: [number, number, number, number] = [0.22, 1, 0.36, 1]

interface PhotoSpec {
  rightPct: number
  topPct: number
  rotate: number
  width: number
  ratio: number
  depth: number
  delay: number
  zIndex: number
  primary?: boolean
}

const PHOTO_SPECS: PhotoSpec[] = [
  { rightPct: 4,  topPct: 46, rotate:  4,   width: 360, ratio: 1.30, depth: 0.20, delay: 0.10, zIndex: 5, primary: true },
  { rightPct: 24, topPct: 12, rotate: -7,   width: 200, ratio: 1.18, depth: 0.45, delay: 0.30, zIndex: 4 },
  { rightPct: 28, topPct: 80, rotate:  9,   width: 178, ratio: 1.20, depth: 0.55, delay: 0.50, zIndex: 4 },
  { rightPct: 1,  topPct: 8,  rotate: -3,   width: 120, ratio: 1.30, depth: 0.62, delay: 0.65, zIndex: 2 },
  { rightPct: 2,  topPct: 92, rotate:  6,   width: 140, ratio: 1.10, depth: 0.70, delay: 0.78, zIndex: 2 },
  { rightPct: 44, topPct: 22, rotate: -10,  width: 132, ratio: 1.22, depth: 0.50, delay: 0.42, zIndex: 3 },
  { rightPct: 46, topPct: 72, rotate:  7,   width: 148, ratio: 1.14, depth: 0.58, delay: 0.58, zIndex: 3 },
  { rightPct: 38, topPct: 48, rotate: -5,   width: 108, ratio: 1.32, depth: 0.68, delay: 0.72, zIndex: 1 },
  { rightPct: 18, topPct: 36, rotate:  6,   width: 116, ratio: 1.25, depth: 0.40, delay: 0.86, zIndex: 1 },
]

interface PhotoTileProps {
  url?: string
  spec: PhotoSpec
  smx: MotionValue<number>
  smy: MotionValue<number>
}

function PhotoTile({ url, spec, smx, smy }: PhotoTileProps) {
  const tx = useTransform(smx, v => v * 50 * spec.depth)
  const ty = useTransform(smy, v => v * 50 * spec.depth)
  const height = spec.width * spec.ratio
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 28, rotate: spec.rotate * 0.4 }}
      animate={{ opacity: 1, scale: 1, y: 0, rotate: spec.rotate }}
      transition={{ delay: 0.95 + spec.delay, duration: 1.15, ease: EASE_ENTRY }}
      style={{
        right: `${spec.rightPct}%`,
        top: `${spec.topPct}%`,
        width: spec.width,
        height,
        x: tx,
        y: ty,
        zIndex: spec.zIndex,
      }}
      className="absolute -translate-y-1/2 photo-tile float-slow"
    >
      {url ? (
        <img
          src={url}
          alt=""
          loading={spec.primary ? 'eager' : 'lazy'}
          className="w-full h-full object-cover"
        />
      ) : (
        <div
          className="w-full h-full"
          style={{
            background: 'linear-gradient(135deg, rgba(242,167,143,0.55), rgba(199,154,141,0.55))',
          }}
        />
      )}
      {spec.primary && <span className="specular" />}
    </motion.div>
  )
}

function AnimatedCounter({ to }: { to: number }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    const controls = animate(0, to, {
      duration: 1.4,
      ease: EASE_ENTRY,
      onUpdate: v => setDisplay(Math.round(v)),
    })
    return () => controls.stop()
  }, [to])
  return <span className="tabular-nums">{display}</span>
}

interface MagneticBtnProps {
  children: React.ReactNode
  onClick?: () => void
  className?: string
  primary?: boolean
}

function MagneticButton({ children, onClick, className, primary }: MagneticBtnProps) {
  const ref = useRef<HTMLButtonElement>(null)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const sx = useSpring(mx, { stiffness: 220, damping: 20, mass: 0.5 })
  const sy = useSpring(my, { stiffness: 220, damping: 20, mass: 0.5 })

  const handleMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const dx = e.clientX - (r.left + r.width / 2)
    const dy = e.clientY - (r.top + r.height / 2)
    const strength = primary ? 0.32 : 0.22
    mx.set(dx * strength)
    my.set(dy * strength)
  }
  const handleLeave = () => {
    mx.set(0)
    my.set(0)
  }

  return (
    <motion.button
      ref={ref}
      onClick={onClick}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{ x: sx, y: sy }}
      whileTap={{ scale: 0.97 }}
      className={className}
    >
      {children}
    </motion.button>
  )
}

const FALLBACK_PHOTOS = [
  'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=720&q=80',
  'https://images.unsplash.com/photo-1530789253388-582c481c54b0?w=720&q=80',
  'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=720&q=80',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=720&q=80',
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=720&q=80',
  'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=720&q=80',
  'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=720&q=80',
  'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=720&q=80',
  'https://images.unsplash.com/photo-1517760444937-f6397edcbbcd?w=720&q=80',
]

const TICKER_WORDS = [
  'Lisbon', 'Tel Aviv', 'Tokyo', 'Reykjavík', 'Bali', 'Marrakesh', 'Patagonia',
  'Kyoto', 'Cape Town', 'Seoul', 'Athens', 'Mexico City', 'Tbilisi', 'Lagos', 'Hanoi',
]

export function HeroCinematic({
  cards,
  search,
  onSearchChange,
  onUseLocation,
  userLocation,
  locating,
  onScrollCue,
}: HeroCinematicProps) {
  const t = useTranslations('hero')
  const containerRef = useRef<HTMLElement>(null)

  const photoUrls = useMemo(() => {
    const urls: string[] = []
    const seen = new Set<string>()
    const push = (u?: string) => {
      if (!u || seen.has(u)) return
      urls.push(u)
      seen.add(u)
    }
    // pass 1: first image per card → max card variety
    for (const c of cards) {
      push(c.images?.[0])
      if (urls.length >= PHOTO_SPECS.length) break
    }
    // pass 2: any remaining card images
    if (urls.length < PHOTO_SPECS.length) {
      for (const c of cards) {
        if (!c.images) continue
        for (let i = 1; i < c.images.length; i++) {
          push(c.images[i])
          if (urls.length >= PHOTO_SPECS.length) break
        }
        if (urls.length >= PHOTO_SPECS.length) break
      }
    }
    // pass 3: curated travel fallbacks when DB is sparse
    for (const u of FALLBACK_PHOTOS) {
      if (urls.length >= PHOTO_SPECS.length) break
      push(u)
    }
    return urls
  }, [cards])

  // Cursor parallax
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const smx = useSpring(mx, { stiffness: 50, damping: 20, mass: 0.6 })
  const smy = useSpring(my, { stiffness: 50, damping: 20, mass: 0.6 })

  // Scroll-driven hero exit
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  })
  const photoScrollY = useTransform(scrollYProgress, [0, 1], [0, -180])
  const photoScale = useTransform(scrollYProgress, [0, 1], [1, 1.18])
  const photoBlur = useTransform(scrollYProgress, [0, 0.5, 1], ['blur(0px)', 'blur(2px)', 'blur(8px)'])
  const contentY = useTransform(scrollYProgress, [0, 1], [0, -60])
  const contentOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const handle = (e: MouseEvent) => {
      const r = el.getBoundingClientRect()
      const cx = (e.clientX - r.left) / r.width - 0.5
      const cy = (e.clientY - r.top) / r.height - 0.5
      mx.set(cx)
      my.set(cy)
      el.style.setProperty('--mx', `${(e.clientX - r.left)}px`)
      el.style.setProperty('--my', `${(e.clientY - r.top)}px`)
    }
    el.addEventListener('mousemove', handle)
    return () => el.removeEventListener('mousemove', handle)
  }, [mx, my])

  const titleWords = t('title').split(' ')
  const lastIdx = titleWords.length - 1
  const subheadDelay = 0.30 + titleWords.length * 0.10 + 0.05

  const cities = useMemo(() => {
    const set = new Set<string>()
    for (const c of cards) if (c.location?.city) set.add(c.location.city)
    return Array.from(set).slice(0, 12)
  }, [cards])
  const tickerWords = cities.length >= 6 ? cities : TICKER_WORDS

  return (
    <section
      ref={containerRef}
      className="relative min-h-[100svh] overflow-hidden hero-cinematic flex items-center"
    >
      {/* Layer 0 — aurora drift */}
      <div className="hero-aurora" />

      {/* Layer 0 — conic compass rings */}
      <div className="hero-conic-faint hidden md:block" />
      <div className="hero-conic hidden md:block" />

      {/* Layer 1 — mouse spotlight */}
      <div className="hero-spotlight" />

      {/* Layer 2 — photo wall (desktop) */}
      <motion.div
        style={{ y: photoScrollY, scale: photoScale, filter: photoBlur }}
        className="absolute inset-0 pointer-events-none hidden lg:block z-[2] origin-center"
      >
        {PHOTO_SPECS.map((spec, i) => (
          <PhotoTile
            key={i}
            spec={spec}
            url={photoUrls[i]}
            smx={smx}
            smy={smy}
          />
        ))}
      </motion.div>

      {/* Layer 5 — vignette */}
      <div className="absolute inset-0 pointer-events-none hero-vignette" />

      {/* Layer 6 — grain */}
      <div className="hero-grain" />

      {/* Content */}
      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className="relative z-10 w-full px-5 sm:px-8 lg:px-12 py-24"
      >
        <div className="max-w-7xl mx-auto">
          <div className="lg:grid lg:grid-cols-12 lg:gap-12 items-center">
            {/* LEFT — type + CTA */}
            <div className="lg:col-span-7">
              {/* Eyebrow with live indicator */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.7, ease: EASE_ENTRY }}
                className="mb-8 flex items-center gap-3"
              >
                <span className="eyebrow-marker">
                  <span className="live-dot" />
                  <span>est · 2026 — go together</span>
                </span>
              </motion.div>

              {/* Headline — kinetic split-letter reveal */}
              <h1 className="headline-display text-[clamp(3rem,8.5vw,8rem)] max-w-[16ch]">
                {titleWords.map((word, i) => (
                  <span
                    key={i}
                    className="reveal-mask align-baseline mr-[0.22em] rtl:mr-0 rtl:ml-[0.22em]"
                    style={{ paddingBottom: '0.16em' }}
                  >
                    <motion.span
                      className={`inline-block ${i === lastIdx ? 'text-iridescent headline-italic breathe-axis' : ''}`}
                      initial={{ y: '110%' }}
                      animate={{ y: 0 }}
                      transition={{
                        delay: 0.30 + i * 0.10,
                        duration: 0.95,
                        ease: EASE_ENTRY,
                      }}
                    >
                      {word}
                    </motion.span>
                  </span>
                ))}
              </h1>

              {/* Subhead */}
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: subheadDelay, duration: 0.7, ease: EASE_ENTRY }}
                className="mt-9 text-[--color-mist-200] text-lg sm:text-xl lg:text-[22px] max-w-[42ch] leading-[1.45] font-normal"
                style={{ letterSpacing: '-0.012em' }}
              >
                {t('subtitle')}
              </motion.p>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: subheadDelay + 0.15, duration: 0.7, ease: EASE_ENTRY }}
                className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-4"
              >
                <MagneticButton
                  primary
                  onClick={onScrollCue}
                  className="btn-primary magnet-pulse group inline-flex items-center gap-2.5 ps-7 pe-6 h-14 rounded-full text-[14px]"
                >
                  <Compass className="w-4 h-4 relative z-[1] slow-spin-rev" strokeWidth={2.5} />
                  <span className="relative z-[1] tracking-tight">{t('cta')}</span>
                  <ArrowRight
                    className="w-4 h-4 relative z-[1] transition-transform duration-300 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1"
                    strokeWidth={2.5}
                  />
                </MagneticButton>

                <MagneticButton
                  onClick={onUseLocation}
                  className="link-underline inline-flex items-center gap-2 h-14 px-2 text-[13px] font-semibold text-[--color-mist-100] hover:text-[--color-coral-700] transition-colors disabled:opacity-60"
                >
                  <MapPin className={`w-4 h-4 ${locating ? 'animate-pulse' : ''}`} strokeWidth={2.25} />
                  <span>{userLocation ? t('locationActive') : t('useLocation')}</span>
                </MagneticButton>
              </motion.div>

              {/* Search input */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: subheadDelay + 0.25, duration: 0.7, ease: EASE_ENTRY }}
                className="mt-10 max-w-xl relative"
              >
                <Search
                  className="absolute start-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[--color-mist-300] pointer-events-none z-10"
                  strokeWidth={2}
                />
                <input
                  type="text"
                  value={search}
                  onChange={e => onSearchChange(e.target.value)}
                  placeholder={t('searchPlaceholder')}
                  className="hero-search-input w-full ps-12 pe-5 h-12 rounded-full
                             text-[14px] font-medium"
                />
              </motion.div>

              {/* Holographic stat chips */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: subheadDelay + 0.4, duration: 0.7 }}
                className="mt-9 flex flex-wrap gap-2.5"
              >
                <div className="stat-chip flex items-center gap-2 px-4 py-2 text-[12px]">
                  <span className="live-dot" />
                  <span className="font-semibold text-[--color-mist-50] tabular-nums">
                    <AnimatedCounter to={cards.length} />
                  </span>
                  <span className="font-mono uppercase tracking-[0.18em] text-[10px] text-[--color-mist-300]">
                    live adventures
                  </span>
                </div>
                <div className="stat-chip flex items-center gap-2 px-4 py-2 text-[12px]">
                  <Sparkles className="w-3 h-3 text-[--color-coral-500]" strokeWidth={2.5} />
                  <span className="font-semibold text-[--color-mist-50] tabular-nums">
                    <AnimatedCounter to={cities.length || 24} />
                  </span>
                  <span className="font-mono uppercase tracking-[0.18em] text-[10px] text-[--color-mist-300]">
                    cities
                  </span>
                </div>
                <div className="stat-chip flex items-center gap-2 px-4 py-2 text-[12px]">
                  <span className="font-mono uppercase tracking-[0.18em] text-[10px] text-[--color-mist-300]">
                    fresh today
                  </span>
                  <span className="font-display italic text-[--color-coral-700] text-[13px]">
                    {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </motion.div>
            </div>

            {/* RIGHT — empty col, photo wall sits over this area */}
            <div className="hidden lg:block lg:col-span-5 min-h-[640px]" aria-hidden />
          </div>

          {/* City ticker — subtle bottom marquee */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: subheadDelay + 0.6, duration: 0.9 }}
            className="mt-16 ticker-rail overflow-hidden"
          >
            <div className="ticker-track gap-12">
              {[...tickerWords, ...tickerWords].map((w, i) => (
                <span
                  key={i}
                  className="font-display italic text-[--color-mist-300] text-[28px] sm:text-[36px] whitespace-nowrap"
                  style={{ letterSpacing: '-0.03em', fontVariationSettings: "'opsz' 72, 'SOFT' 80" }}
                >
                  {w} <span className="text-[--color-coral-500] mx-6 not-italic">✦</span>
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Scroll cue */}
      <motion.button
        onClick={onScrollCue}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.7, duration: 0.7, ease: EASE_ENTRY }}
        aria-label="Scroll to discover"
        style={{ opacity: contentOpacity }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10
                   flex flex-col items-center gap-2 group"
      >
        <span className="eyebrow group-hover:text-[--color-coral-700] transition-colors">
          {t('scrollDiscover')}
        </span>
        <span
          className="flex items-center justify-center w-10 h-10 rounded-full
                     bg-white border border-[--color-mist-500]
                     text-[--color-mist-100] group-hover:border-[--color-coral-500] group-hover:text-[--color-coral-700]
                     scroll-cue-bounce transition-colors"
          style={{ boxShadow: '0 8px 24px -8px rgba(15,12,8,0.18)' }}
        >
          <ArrowDown className="w-4 h-4" strokeWidth={2.25} />
        </span>
      </motion.button>
    </section>
  )
}
