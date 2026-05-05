'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, useMotionValue, useSpring, useTransform, animate, type MotionValue } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { Search, MapPin, Sparkles, ArrowDown } from 'lucide-react'
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

const PHOTO_POSITIONS: Array<{
  topPct: number
  leftPct: number
  rotate: number
  size: number
  depth: number
  delay: number
}> = [
  { topPct: 8,  leftPct: 6,  rotate: -10, size: 168, depth: 0.55, delay: 0.10 },
  { topPct: 18, leftPct: 82, rotate:  9,  size: 192, depth: 0.40, delay: 0.20 },
  { topPct: 60, leftPct: 4,  rotate:  6,  size: 180, depth: 0.65, delay: 0.30 },
  { topPct: 70, leftPct: 86, rotate: -8,  size: 156, depth: 0.50, delay: 0.40 },
  { topPct: 38, leftPct: 90, rotate: -14, size: 132, depth: 0.30, delay: 0.50 },
  { topPct: 80, leftPct: 38, rotate:  4,  size: 144, depth: 0.45, delay: 0.60 },
  { topPct: 4,  leftPct: 46, rotate: -6,  size: 128, depth: 0.35, delay: 0.70 },
]

interface PhotoTileProps {
  url?: string
  pos: typeof PHOTO_POSITIONS[number]
  smx: MotionValue<number>
  smy: MotionValue<number>
}

function PhotoTile({ url, pos, smx, smy }: PhotoTileProps) {
  const tx = useTransform(smx, v => v * 60 * pos.depth)
  const ty = useTransform(smy, v => v * 60 * pos.depth)
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.4, y: 40, rotate: pos.rotate * 0.3 }}
      animate={{
        opacity: url ? 1 : 0.55,
        scale: 1,
        y: 0,
        rotate: pos.rotate,
      }}
      transition={{
        delay: 0.4 + pos.delay,
        duration: 1.1,
        ease: [0.16, 1, 0.3, 1],
      }}
      style={{
        top: `${pos.topPct}%`,
        left: `${pos.leftPct}%`,
        width: pos.size,
        height: pos.size * 1.18,
        x: tx,
        y: ty,
      }}
      className="absolute -translate-x-1/2 -translate-y-1/2 photo-tile float-slow"
    >
      {url ? (
        <img
          src={url}
          alt=""
          loading="lazy"
          className="w-full h-full object-cover rounded-2xl"
        />
      ) : (
        <div className="w-full h-full rounded-2xl bg-gradient-to-br from-[--color-coral-500]/30 via-[--color-violet-500]/30 to-[--color-cyan-400]/30" />
      )}
    </motion.div>
  )
}

function AnimatedCounter({ to }: { to: number }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    const controls = animate(0, to, {
      duration: 1.4,
      ease: [0.16, 1, 0.3, 1],
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
      if (urls.length >= PHOTO_POSITIONS.length) break
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

  return (
    <section
      ref={containerRef}
      className="relative min-h-[100svh] overflow-hidden hero-cinematic flex items-center"
    >
      {/* Mouse-tracking spotlight */}
      <div className="hero-spotlight" />

      {/* Floating photo collage */}
      <div className="absolute inset-0 pointer-events-none">
        {PHOTO_POSITIONS.map((pos, i) => (
          <PhotoTile key={i} pos={pos} url={photoUrls[i]} smx={smx} smy={smy} />
        ))}
      </div>

      {/* Soft vignette so text stays legible over photos */}
      <div className="absolute inset-0 pointer-events-none hero-vignette" />

      {/* Content */}
      <div className="relative z-10 w-full px-4 sm:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Live badge */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-flex items-center gap-2.5 px-4 py-2 mb-8 rounded-full
                       bg-white/[0.10] border border-white/[0.18] backdrop-blur-md
                       text-[13px] font-bold text-[--color-mist-100] shadow-[0_8px_32px_rgba(0,0,0,.25)]"
          >
            <span className="live-dot" />
            <span>
              <span className="text-[--color-emerald-400] font-bold tabular-nums">
                <AnimatedCounter to={cards.length} />
              </span>{' '}
              active adventures
            </span>
            <span className="text-[--color-mist-400]">·</span>
            <Sparkles className="w-3.5 h-3.5 text-[--color-amber-400] pulse-glow" strokeWidth={2.5} />
            <span>fresh today</span>
          </motion.div>

          {/* Headline — word-by-word reveal */}
          <h1 className="headline-xl text-[--color-mist-50] text-6xl sm:text-7xl md:text-8xl lg:text-[7.5rem] leading-[0.92] max-w-5xl"
              style={{ fontVariationSettings: "'wdth' 115" }}>
            {titleWords.map((word, i) => (
              <span
                key={i}
                className="inline-block overflow-hidden align-baseline mr-[0.22em] rtl:mr-0 rtl:ml-[0.22em]"
                style={{ paddingBottom: '0.12em' }}
              >
                <motion.span
                  className={`inline-block ${i === lastIdx ? 'text-gradient' : ''}`}
                  initial={{ y: '110%', opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{
                    delay: 0.25 + i * 0.08,
                    duration: 0.9,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                >
                  {word}
                </motion.span>
              </span>
            ))}
          </h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 + titleWords.length * 0.08 + 0.1, duration: 0.7 }}
            className="mt-7 text-[--color-mist-200] text-xl sm:text-2xl max-w-2xl leading-relaxed font-medium"
          >
            {t('subtitle')}
          </motion.p>

          {/* Search bar */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.25 + titleWords.length * 0.08 + 0.25,
              duration: 0.7,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="mt-12 flex gap-3 max-w-2xl"
          >
            <div className="flex-1 relative group">
              <div className="absolute inset-0 rounded-2xl pointer-events-none search-aura" />
              <Search
                className="absolute start-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[--color-mist-300] pointer-events-none z-10"
                strokeWidth={2.25}
              />
              <input
                type="text"
                value={search}
                onChange={e => onSearchChange(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="relative w-full ps-14 pe-5 py-5 rounded-2xl
                           bg-white/[0.08] backdrop-blur-md border border-white/[0.18]
                           text-[--color-mist-50] text-[16px] font-semibold placeholder:text-[--color-mist-400] placeholder:font-medium
                           focus:outline-none focus:border-[--color-coral-500]/70 focus:bg-white/[0.12]
                           focus:shadow-[0_0_48px_rgba(255,84,112,.40)]
                           transition-all duration-300"
              />
            </div>
            <button
              onClick={onUseLocation}
              disabled={locating}
              className={`flex items-center gap-2 px-5 py-5 rounded-2xl transition-all
                          text-[14px] font-bold whitespace-nowrap disabled:opacity-60 ${
                userLocation
                  ? 'bg-gradient-to-r from-[--color-coral-500] to-[--color-violet-500] border border-white/20 text-white shadow-[0_0_28px_rgba(255,84,112,.45)]'
                  : 'bg-white/[0.08] backdrop-blur-md border border-white/[0.18] text-[--color-mist-100] hover:border-white/[0.28] hover:bg-white/[0.12]'
              }`}
            >
              <MapPin className={`w-5 h-5 ${locating ? 'animate-pulse' : ''}`} strokeWidth={2.25} />
              <span className="hidden sm:block">
                {userLocation ? t('locationActive') : t('useLocation')}
              </span>
            </button>
          </motion.div>
        </div>
      </div>

      {/* Scroll cue */}
      <motion.button
        onClick={onScrollCue}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.6, duration: 0.6 }}
        aria-label="Scroll to discover"
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10
                   flex flex-col items-center gap-2 group"
      >
        <span className="eyebrow text-[--color-mist-300] group-hover:text-[--color-mist-50] transition-colors">
          {t('scrollDiscover')}
        </span>
        <span className="flex items-center justify-center w-10 h-10 rounded-full
                         bg-white/[0.08] border border-white/[0.18] backdrop-blur-md
                         text-[--color-mist-100] group-hover:border-[--color-coral-500]/60 group-hover:text-[--color-coral-300]
                         scroll-cue-bounce">
          <ArrowDown className="w-4 h-4" strokeWidth={2.5} />
        </span>
      </motion.button>
    </section>
  )
}
