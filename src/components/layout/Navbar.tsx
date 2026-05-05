'use client'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { usePathname, useRouter } from 'next/navigation'
import { Globe, Plus, CalendarDays, LogOut, LogIn, ChevronDown, UserCircle, Search, X } from 'lucide-react'
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
                 bg-[--color-ink-950]/85 backdrop-blur-2xl
                 border-b border-[rgba(255,255,255,.04)]"
    >
      {/* ── Wordmark — refined editorial logo ── */}
      <Link href={`/${locale}`} className="flex items-center gap-2.5 group shrink-0">
        <div className="relative w-9 h-9 grid place-items-center
                        rounded-sm border border-[--color-amber-400]/40 bg-[--color-amber-400]/5
                        transition-all duration-300 group-hover:bg-[--color-amber-400]/15 group-hover:border-[--color-amber-400]/70
                        corner-marks">
          <span className="font-display font-medium text-[--color-amber-400] text-base leading-none translate-y-[1px]">
            G
          </span>
        </div>
        <span className="hidden sm:flex flex-col leading-none">
          <span className="font-display text-[--color-bone-50] text-[15px] font-medium tracking-tight">
            {t('logo')}
          </span>
          <span className="eyebrow mt-0.5 text-[8.5px]">find your crew</span>
        </span>
      </Link>

      {/* ── Search ── */}
      <div ref={searchRef} className="relative flex-1 max-w-sm mx-2">
        <div className={`flex items-center gap-2.5 px-3 py-2 rounded-sm border transition-all duration-300
          ${searchOpen
            ? 'bg-[--color-ink-850] border-[--color-amber-400]/40'
            : 'bg-[--color-ink-900] border-[rgba(255,255,255,.06)] hover:border-[rgba(255,255,255,.12)]'}`}>
          <Search className="w-3.5 h-3.5 text-[--color-bone-400] shrink-0" strokeWidth={2} />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onFocus={() => setSearchOpen(true)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            placeholder={t('searchUsers')}
            className="flex-1 bg-transparent text-[--color-bone-50] text-[13px]
                       placeholder:text-[--color-bone-600] focus:outline-none min-w-0"
          />
          {searchQuery && (
            <button onClick={() => { setSearchQuery(''); setSearchResults([]) }} aria-label="Clear">
              <X className="w-3.5 h-3.5 text-[--color-bone-400] hover:text-[--color-bone-50] transition-colors" />
            </button>
          )}
        </div>

        <AnimatePresence>
          {searchOpen && searchResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
              className="absolute top-full mt-2 w-full z-[200] overflow-hidden
                         bg-[--color-ink-850] border border-[rgba(255,255,255,.08)] rounded-sm
                         shadow-[0_24px_64px_rgba(0,0,0,.5)]"
            >
              <div className="px-3 py-1.5 border-b border-[--color-ink-700] eyebrow">{t('searchUsers')}</div>
              {searchResults.map((r, i) => (
                <button
                  key={r.id}
                  onClick={() => handleSelectProfile(r.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 transition-colors text-start ${
                    i === selectedIndex
                      ? 'bg-[--color-amber-400]/10 text-[--color-amber-400]'
                      : 'hover:bg-[rgba(255,255,255,.03)]'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden grid place-items-center text-[11px] font-mono shrink-0
                                  bg-[--color-ink-800] text-[--color-bone-200] border border-[--color-ink-700]">
                    {r.avatar_url
                      ? <img src={r.avatar_url} alt={r.full_name} className="w-full h-full object-cover" />
                      : r.full_name[0]?.toUpperCase()}
                  </div>
                  <span className="text-[13px] text-[--color-bone-50] truncate">{r.full_name}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Right cluster ── */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Locale toggle — mono label */}
        <button
          onClick={toggleLocale}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm
                     font-mono text-[11px] tracking-[0.14em] uppercase
                     text-[--color-bone-400] hover:text-[--color-bone-50] hover:bg-[rgba(255,255,255,.03)]
                     transition-colors"
        >
          <Globe className="w-3.5 h-3.5" strokeWidth={2} />
          <span className="hidden sm:block">{locale === 'he' ? tLang('en') : tLang('he')}</span>
        </button>

        {user ? (
          <>
            <NotificationsBell userId={user.id} locale={locale} />

            <Link
              href={`/${locale}/my-events`}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm
                         font-mono text-[11px] tracking-[0.14em] uppercase
                         text-[--color-bone-400] hover:text-[--color-bone-50] hover:bg-[rgba(255,255,255,.03)]
                         transition-colors"
            >
              <CalendarDays className="w-3.5 h-3.5" strokeWidth={2} />
              <span className="hidden sm:block">{t('myEvents')}</span>
            </Link>

            {/* Create — primary CTA */}
            <Link
              href={`/${locale}/create`}
              className="ms-1 flex items-center gap-1.5 px-3.5 py-2 rounded-sm
                         font-mono text-[11px] tracking-[0.18em] uppercase font-semibold
                         bg-[--color-amber-400] text-[--color-amber-ink]
                         hover:bg-[--color-amber-500]
                         transition-all duration-200
                         shadow-[0_4px_20px_rgba(251,191,36,.18)] hover:shadow-[0_6px_28px_rgba(251,191,36,.28)]"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
              <span className="hidden sm:block">{t('create')}</span>
            </Link>

            {/* User menu */}
            <div className="relative ms-1">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-sm
                           hover:bg-[rgba(255,255,255,.03)] transition-colors"
              >
                <div className="w-7 h-7 rounded-full overflow-hidden grid place-items-center text-[11px] font-mono
                                bg-[--color-ink-800] text-[--color-bone-200]
                                border border-[--color-ink-700] group-hover:border-[--color-amber-400]/40">
                  {profile?.avatar_url
                    ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                    : (profile?.full_name?.[0]?.toUpperCase() || '?')
                  }
                </div>
                <ChevronDown className="w-3 h-3 text-[--color-bone-400]" strokeWidth={2} />
              </button>

              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
                    className="absolute end-0 top-full mt-2 w-60 z-50 overflow-hidden
                               bg-[--color-ink-850] border border-[rgba(255,255,255,.08)] rounded-sm
                               shadow-[0_24px_64px_rgba(0,0,0,.5)]"
                  >
                    <div className="p-3.5 border-b border-[--color-ink-700] flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden grid place-items-center text-[13px] font-mono
                                      bg-[--color-ink-800] text-[--color-bone-200]
                                      border border-[--color-amber-400]/30">
                        {profile?.avatar_url
                          ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                          : (profile?.full_name?.[0]?.toUpperCase() || '?')
                        }
                      </div>
                      <div className="min-w-0">
                        <div className="font-display text-[14px] font-medium text-[--color-bone-50] truncate leading-tight">
                          {profile?.full_name || 'משתמש'}
                        </div>
                        <div className="text-[11px] font-mono text-[--color-bone-400] truncate mt-0.5">
                          {user.email}
                        </div>
                      </div>
                    </div>
                    <Link
                      href={`/${locale}/profile`}
                      onClick={() => setMenuOpen(false)}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5
                                 text-[13px] text-[--color-bone-200]
                                 hover:bg-[rgba(255,255,255,.03)] hover:text-[--color-bone-50] transition-colors"
                    >
                      <UserCircle className="w-3.5 h-3.5" strokeWidth={2} />
                      {t('profile')}
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 border-t border-[--color-ink-800]
                                 text-[13px] text-[--color-coral-400]
                                 hover:bg-[--color-coral-500]/10 transition-colors"
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
            className="ms-1 flex items-center gap-1.5 px-3.5 py-2 rounded-sm
                       font-mono text-[11px] tracking-[0.18em] uppercase font-semibold
                       bg-[--color-amber-400] text-[--color-amber-ink]
                       hover:bg-[--color-amber-500] transition-all duration-200
                       shadow-[0_4px_20px_rgba(251,191,36,.18)]"
          >
            <LogIn className="w-3.5 h-3.5" strokeWidth={2.5} />
            <span>{t('signIn')}</span>
          </Link>
        )}
      </div>
    </motion.nav>
  )
}
