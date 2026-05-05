'use client'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { usePathname, useRouter } from 'next/navigation'
import { Globe, Plus, Compass, CalendarDays, LogOut, LogIn, ChevronDown, UserCircle, Search, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/lib/auth-context'
import { useState, useRef, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { NotificationsBell } from './NotificationsBell'

interface NavbarProps {
  locale: string
}

interface ProfileResult {
  id: string
  full_name: string
  avatar_url?: string
}

export function Navbar({ locale }: NavbarProps) {
  const t = useTranslations('nav')
  const tLang = useTranslations('lang')
  const pathname = usePathname()
  const router = useRouter()
  const { user, profile, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<ProfileResult[]>([])
  const [searchOpen, setSearchOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const toggleLocale = () => {
    const newLocale = locale === 'he' ? 'en' : 'he'
    const segments = pathname.split('/')
    segments[1] = newLocale
    router.push(segments.join('/'))
  }

  const handleSignOut = async () => {
    setMenuOpen(false)
    await signOut()
    router.push(`/${locale}`)
  }

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return }
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .ilike('full_name', `%${searchQuery}%`)
        .limit(6)
      setSearchResults(data || [])
      setSelectedIndex(-1)
    }, 250)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false)
        setSearchQuery('')
        setSearchResults([])
        setSelectedIndex(-1)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSelectProfile = (id: string) => {
    router.push(`/${locale}/profile/${id}`)
    setSearchOpen(false)
    setSearchQuery('')
    setSearchResults([])
    setSelectedIndex(-1)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!searchResults.length) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(i => Math.min(i + 1, searchResults.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(i => Math.max(i - 1, -1))
    } else if (e.key === 'Enter') {
      const target = searchResults[selectedIndex] ?? searchResults[0]
      if (target) handleSelectProfile(target.id)
    } else if (e.key === 'Escape') {
      setSearchOpen(false)
      setSearchQuery('')
      setSearchResults([])
      setSelectedIndex(-1)
    }
  }

  return (
    <motion.nav
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between gap-3
                 px-4 sm:px-8 py-3.5
                 bg-[--color-night-1000]/65 backdrop-blur-2xl
                 border-b border-white/[0.08]"
    >
      {/* ── Logo with gradient orb ── */}
      <Link href={`/${locale}`} className="flex items-center gap-2.5 group shrink-0">
        <div className="relative w-10 h-10 grid place-items-center rounded-xl
                        bg-gradient-to-br from-[--color-coral-500] via-[--color-violet-500] to-[--color-cyan-400]
                        shadow-[0_0_20px_rgba(255,84,112,.4)]
                        transition-all duration-500 group-hover:scale-105 group-hover:rotate-[-4deg]">
          <Compass className="w-5 h-5 text-white" strokeWidth={2.5} />
          <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-br from-[--color-coral-500] via-[--color-violet-500] to-[--color-cyan-400]
                          opacity-0 group-hover:opacity-50 blur-md transition-opacity duration-500 -z-10" />
        </div>
        <span className="hidden sm:flex flex-col leading-none">
          <span className="font-display text-[--color-mist-50] text-[18px] font-bold tracking-tight"
                style={{ fontVariationSettings: "'wdth' 110" }}>
            {t('logo')}
          </span>
          <span className="font-mono text-[10px] text-[--color-mist-300] tracking-[0.2em] uppercase mt-1 font-bold">
            find your crew
          </span>
        </span>
      </Link>

      {/* ── Search ── */}
      <div ref={searchRef} className="relative flex-1 max-w-sm mx-2">
        <div className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl border transition-all duration-300
          ${searchOpen
            ? 'bg-[--color-night-800]/80 border-[--color-coral-500]/40 shadow-[0_0_24px_rgba(255,84,112,.18)]'
            : 'bg-[--color-night-900]/60 border-white/[0.06] hover:border-white/[0.14]'}`}>
          <Search className="w-3.5 h-3.5 text-[--color-mist-400] shrink-0" strokeWidth={2} />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onFocus={() => setSearchOpen(true)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            placeholder={t('searchUsers')}
            className="flex-1 bg-transparent text-[--color-mist-50] text-[13px]
                       placeholder:text-[--color-mist-500] focus:outline-none min-w-0"
          />
          {searchQuery && (
            <button onClick={() => { setSearchQuery(''); setSearchResults([]) }} aria-label="Clear">
              <X className="w-3.5 h-3.5 text-[--color-mist-400] hover:text-[--color-mist-50] transition-colors" />
            </button>
          )}
        </div>

        <AnimatePresence>
          {searchOpen && searchResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
              className="glass-strong absolute top-full mt-2 w-full z-[200] overflow-hidden rounded-xl"
            >
              <div className="px-3.5 py-2 border-b border-white/[0.06] eyebrow">
                {t('searchUsers')}
              </div>
              {searchResults.map((r, i) => (
                <button
                  key={r.id}
                  onClick={() => handleSelectProfile(r.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 transition-all text-start ${
                    i === selectedIndex
                      ? 'bg-gradient-to-r from-[--color-coral-500]/12 to-[--color-violet-500]/8 text-[--color-coral-300]'
                      : 'hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden grid place-items-center text-[11px] font-mono shrink-0
                                  bg-gradient-to-br from-[--color-violet-500]/20 to-[--color-cyan-400]/20
                                  text-[--color-mist-100] border border-white/[0.06]">
                    {r.avatar_url
                      ? <img src={r.avatar_url} alt={r.full_name} className="w-full h-full object-cover" />
                      : r.full_name[0]?.toUpperCase()}
                  </div>
                  <span className="text-[13px] text-[--color-mist-50] truncate">{r.full_name}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Right cluster ── */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={toggleLocale}
          className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl
                     text-[13px] font-bold
                     text-[--color-mist-200] hover:text-[--color-mist-50] hover:bg-white/[0.06]
                     transition-all"
        >
          <Globe className="w-4 h-4" strokeWidth={2.25} />
          <span className="hidden sm:block">{locale === 'he' ? tLang('en') : tLang('he')}</span>
        </button>

        {user ? (
          <>
            <NotificationsBell userId={user.id} locale={locale} />

            <Link
              href={`/${locale}/my-events`}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl
                         text-[13px] font-bold
                         text-[--color-mist-200] hover:text-[--color-mist-50] hover:bg-white/[0.06]
                         transition-all"
            >
              <CalendarDays className="w-4 h-4" strokeWidth={2.25} />
              <span className="hidden sm:block">{t('myEvents')}</span>
            </Link>

            {/* Primary CTA — bigger, bolder */}
            <Link
              href={`/${locale}/create`}
              className="btn-primary ms-1 flex items-center gap-2 px-5 py-2.5 rounded-xl
                         text-[13px] font-bold tracking-tight"
            >
              <Plus className="w-4 h-4 relative z-[1]" strokeWidth={3} />
              <span className="hidden sm:block relative z-[1]">{t('create')}</span>
            </Link>

            {/* User menu */}
            <div className="relative ms-1">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="glow-ring flex items-center gap-2 p-1.5 rounded-full
                           hover:bg-white/[0.04] transition-colors"
              >
                <div className="w-7 h-7 rounded-full overflow-hidden grid place-items-center text-[11px] font-mono
                                bg-gradient-to-br from-[--color-coral-500] to-[--color-violet-500]
                                text-white">
                  {profile?.avatar_url
                    ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                    : (profile?.full_name?.[0]?.toUpperCase() || '?')
                  }
                </div>
                <ChevronDown className="w-3 h-3 text-[--color-mist-300] me-1" strokeWidth={2} />
              </button>

              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.96 }}
                    transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
                    className="glass-strong absolute end-0 top-full mt-2 w-64 z-50 overflow-hidden rounded-xl"
                  >
                    <div className="p-4 border-b border-white/[0.06] flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full overflow-hidden grid place-items-center text-[14px] font-display font-semibold
                                      bg-gradient-to-br from-[--color-coral-500] to-[--color-violet-500] text-white">
                        {profile?.avatar_url
                          ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                          : (profile?.full_name?.[0]?.toUpperCase() || '?')
                        }
                      </div>
                      <div className="min-w-0">
                        <div className="font-display text-[14px] font-semibold text-[--color-mist-50] truncate leading-tight">
                          {profile?.full_name || 'משתמש'}
                        </div>
                        <div className="text-[11px] font-mono text-[--color-mist-400] truncate mt-1">
                          {user.email}
                        </div>
                      </div>
                    </div>
                    <Link
                      href={`/${locale}/profile`}
                      onClick={() => setMenuOpen(false)}
                      className="w-full flex items-center gap-2.5 px-4 py-3
                                 text-[13px] text-[--color-mist-200]
                                 hover:bg-white/[0.04] hover:text-[--color-mist-50] transition-colors"
                    >
                      <UserCircle className="w-3.5 h-3.5" strokeWidth={2} />
                      {t('profile')}
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2.5 px-4 py-3 border-t border-white/[0.06]
                                 text-[13px] text-[--color-rose-400]
                                 hover:bg-[--color-rose-500]/10 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" strokeWidth={2} />
                      {t('signOut')}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        ) : (
          <Link
            href={`/${locale}/auth`}
            className="btn-primary ms-1 flex items-center gap-2 px-5 py-2.5 rounded-xl
                       text-[13px] font-bold tracking-tight"
          >
            <LogIn className="w-4 h-4 relative z-[1]" strokeWidth={3} />
            <span className="relative z-[1]">{t('signIn')}</span>
          </Link>
        )}
      </div>
    </motion.nav>
  )
}
