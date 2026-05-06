'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, useMotionValue, useSpring, useTransform, animate, type MotionValue } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { Search, MapPin, ArrowRight, ArrowDown } from 'lucide-react'
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

// One anchor photo + two supporting tiles. Anchored to the right column on desktop.
const PHOTO_SPECS: PhotoSpec[] = [
  // Primary anchor — large, slight tilt, right-center
  { rightPct: 6,  topPct: 50, rotate:  4,   width: 380, ratio: 1.32, depth: 0.20, delay: 0.10, zIndex: 3, primary: true },
  // Secondary upper-right
  { rightPct: 26, topPct: 14, rotate: -7,   width: 200, ratio: 1.18, depth: 0.45, delay: 0.30, zIndex: 2 },
  // Secondary lower-left of cluster
  { rightPct: 28, topPct: 78, rotate:  9,   width: 180, ratio: 1.20, depth: 0.55, delay: 0.50, zIndex: 1 },
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
      initial={{ opacity: 0, scale: 0.92, y: 20, rotate: spec.rotate * 0.4 }}
      animate={{ opacity: 1, scale: 1, y: 0, rotate: spec.rotate }}
      transition={{ delay: 0.95 + spec.delay, duration: 1.1, ease: EASE_ENTRY }}
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
            background: 'linear-gradient(135deg, rgba(242,167,143,0.55), rgba(224,191,182,0.55))',
          }}
        />
      )}
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
  const containerRef = useRef<HTMLDivElement>(null)

  const photoUrls = useMemo(() => {
    const urls: string[] = []
    for (const c of cards) {
      if (c.images?.[0]) urls.push(c.images[0])
      if (urls.length >= PHOTO_SPECS.length) break
    }
    return urls
  }, [cards])

  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const smx = useSpring(mx, { stiffness: 50, damping: 20, mass: 0.6 })
  const smy = useSpring(my, { stiffness: 50, damping: 20, mass: 0.6 })

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
  const subheadDelay = 0.30 + titleWords.length * 0.08 + 0.05

  return (
    <section
      ref={containerRef}
      className="relative min-h-[100svh] overflow-hidden hero-cinematic flex items-center"
    >
      {/* Mouse-tracking warm spotlight */}
      <div className="hero-spotlight" />

      {/* Photo collage — only on desktop, doesn't compete with content on mobile */}
      <div className="absolute inset-0 pointer-events-none hidden lg:block">
        {PHOTO_SPECS.map((spec, i) => (
          <PhotoTile key={i} spec={spec} url={photoUrls[i]} smx={smx} smy={smy} />
        ))}
      </div>

      {/* Soft fade-out vignette for legibility */}
      <div className="absolute inset-0 pointer-events-none hero-vignette" />

      {/* Content */}
      <div className="relative z-10 w-full px-5 sm:px-8 lg:px-12 py-24">
        <div className="max-w-7xl mx-auto">
          <div className="lg:grid lg:grid-cols-12 lg:gap-12 items-center">
            {/* LEFT — type + CTA (7 cols) */}
            <div className="lg:col-span-7">
              {/* Eyebrow */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.7, ease: EASE_ENTRY }}
                className="mb-7 flex items-center gap-3"
              >
                <span className="eyebrow">— go together</span>
                <span className="h-px flex-1 max-w-[120px] bg-[--color-mist-500]" />
              </motion.div>

              {/* Headline — word-by-word reveal, last word gets sumac gradient */}
              <h1
                className="headline-xl text-[clamp(3rem,8vw,7.5rem)] max-w-[18ch]"
              >
                {titleWords.map((word, i) => (
                  <span
                    key={i}
                    className="inline-block overflow-hidden align-baseline mr-[0.22em] rtl:mr-0 rtl:ml-[0.22em]"
                    style={{ paddingBottom: '0.12em' }}
                  >
                    <motion.span
                      className={`inline-block ${i === lastIdx ? 'text-gradient' : ''}`}
                      initial={{ y: '110%' }}
                      animate={{ y: 0 }}
                      transition={{
                        delay: 0.30 + i * 0.08,
                        duration: 0.9,
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
                className="mt-8 text-[--color-mist-200] text-lg sm:text-xl lg:text-2xl max-w-[44ch] leading-[1.45] font-normal"
              >
                {t('subtitle')}
              </motion.p>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: subheadDelay + 0.15, duration: 0.7, ease: EASE_ENTRY }}
                className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4"
              >
                <button
                  onClick={onScrollCue}
                  className="btn-primary group inline-flex items-center gap-2.5 ps-7 pe-6 h-14 rounded-full text-[15px]"
                >
                  <span className="relative z-[1]">{t('cta')}</span>
                  <ArrowRight
                    className="w-4 h-4 relative z-[1] transition-transform duration-300 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1"
                    strokeWidth={2.5}
                  />
                </button>

                <button
                  onClick={onUseLocation}
                  disabled={locating}
                  className="link-underline inline-flex items-center gap-2 h-14 px-2 text-[14px] font-semibold text-[--color-mist-100] hover:text-[--color-coral-600] transition-colors disabled:opacity-60"
                >
                  <MapPin className={`w-4 h-4 ${locating ? 'animate-pulse' : ''}`} strokeWidth={2.25} />
                  <span>{userLocation ? t('locationActive') : t('useLocation')}</span>
                </button>
              </motion.div>

              {/* Search input — secondary affordance below CTAs */}
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

              {/* Social proof line */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: subheadDelay + 0.4, duration: 0.7 }}
                className="mt-7 flex items-center gap-3 text-[12px] text-[--color-mist-300]"
              >
                <span className="live-dot" />
                <span className="font-medium">
                  <span className="text-[--color-mist-100] font-semibold tabular-nums">
                    <AnimatedCounter to={cards.length} />
                  </span>{' '}
                  active adventures
                </span>
                <span className="text-[--color-mist-400]">·</span>
                <span className="font-mono uppercase tracking-[0.16em] text-[10px]">fresh today</span>
              </motion.div>
            </div>

            {/* RIGHT — left empty, photo collage absolutely-positioned over the col area */}
            <div className="hidden lg:block lg:col-span-5 min-h-[640px]" aria-hidden />
          </div>
        </div>
      </div>

      {/* Scroll cue */}
      <motion.button
        onClick={onScrollCue}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.7, duration: 0.7, ease: EASE_ENTRY }}
        aria-label="Scroll to discover"
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10
                   flex flex-col items-center gap-2 group"
      >
        <span className="eyebrow group-hover:text-[--color-coral-600] transition-colors">
          {t('scrollDiscover')}
        </span>
        <span
          className="flex items-center justify-center w-10 h-10 rounded-full
                     bg-white border border-[--color-mist-500]
                     text-[--color-mist-100] group-hover:border-[--color-coral-500] group-hover:text-[--color-coral-600]
                     scroll-cue-bounce transition-colors"
        >
          <ArrowDown className="w-4 h-4" strokeWidth={2.25} />
        </span>
      </motion.button>
    </section>
  )
}
