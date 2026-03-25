'use client'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { usePathname, useRouter } from 'next/navigation'
import { Globe, Plus, Compass, CalendarDays, LogOut, LogIn, ChevronDown, UserCircle, Search, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/lib/auth-context'
import { useState, useRef, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

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

  // Search profiles as user types
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return }
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .ilike('full_name', `%${searchQuery}%`)
        .limit(6)
      setSearchResults(data || [])
    }, 250)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Close search when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false)
        setSearchQuery('')
        setSearchResults([])
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
  }

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-6 py-4
                 bg-gray-950/80 backdrop-blur-xl border-b border-white/5 gap-3"
    >
      {/* Logo */}
      <Link href={`/${locale}`} className="flex items-center gap-2 group shrink-0">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/25">
          <Compass className="w-4 h-4 text-white" />
        </div>
        <span className="text-lg font-bold bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent hidden sm:block">
          {t('logo')}
        </span>
      </Link>

      {/* User search */}
      <div ref={searchRef} className="relative flex-1 max-w-xs">
        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all
          ${searchOpen ? 'bg-gray-900 border-teal-500/40' : 'bg-gray-900/60 border-white/8 hover:border-white/15'}`}>
          <Search className="w-3.5 h-3.5 text-gray-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onFocus={() => setSearchOpen(true)}
            placeholder={t('searchUsers')}
            className="flex-1 bg-transparent text-white text-sm placeholder:text-gray-600 focus:outline-none min-w-0"
          />
          {searchQuery && (
            <button onClick={() => { setSearchQuery(''); setSearchResults([]) }}>
              <X className="w-3.5 h-3.5 text-gray-500 hover:text-white transition-colors" />
            </button>
          )}
        </div>

        <AnimatePresence>
          {searchOpen && searchResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="absolute top-full mt-2 w-full bg-gray-900 border border-white/10 rounded-xl shadow-xl shadow-black/40 overflow-hidden z-50"
            >
              {searchResults.map(r => (
                <button
                  key={r.id}
                  onClick={() => handleSelectProfile(r.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 transition-colors text-start"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 overflow-hidden flex items-center justify-center text-xs font-bold text-white shrink-0">
                    {r.avatar_url
                      ? <img src={r.avatar_url} alt={r.full_name} className="w-full h-full object-cover" />
                      : r.full_name[0]?.toUpperCase()}
                  </div>
                  <span className="text-sm text-white truncate">{r.full_name}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {/* Language toggle */}
        <button
          onClick={toggleLocale}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-400
                     hover:text-white hover:bg-white/5 transition-all"
        >
          <Globe className="w-4 h-4" />
          <span className="hidden sm:block">{locale === 'he' ? tLang('en') : tLang('he')}</span>
        </button>

        {user ? (
          <>
            {/* My Events */}
            <Link
              href={`/${locale}/my-events`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-400
                         hover:text-white hover:bg-white/5 transition-all"
            >
              <CalendarDays className="w-4 h-4" />
              <span className="hidden sm:block">{t('myEvents')}</span>
            </Link>

            {/* Create */}
            <Link
              href={`/${locale}/create`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500
                         text-white text-sm font-medium hover:from-teal-400 hover:to-cyan-400 transition-all
                         shadow-lg shadow-teal-500/20"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:block">{t('create')}</span>
            </Link>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-900 border border-white/10
                           hover:border-teal-500/30 transition-all text-sm"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-white overflow-hidden shrink-0">
                  {profile?.avatar_url
                    ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                    : (profile?.full_name?.[0]?.toUpperCase() || '?')
                  }
                </div>
                <span className="hidden sm:block text-gray-300 max-w-[100px] truncate">
                  {profile?.full_name?.split(' ')[0] || 'User'}
                </span>
                <ChevronDown className="w-3 h-3 text-gray-500" />
              </button>

              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    className="absolute end-0 top-full mt-2 w-52 bg-gray-900 border border-white/10 rounded-xl
                               shadow-xl shadow-black/40 overflow-hidden z-50"
                  >
                    <div className="p-3 border-b border-white/5 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-sm font-bold text-white overflow-hidden shrink-0">
                        {profile?.avatar_url
                          ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                          : (profile?.full_name?.[0]?.toUpperCase() || '?')
                        }
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-white truncate">{profile?.full_name || 'משתמש'}</div>
                        <div className="text-xs text-gray-500 truncate">{user.email}</div>
                      </div>
                    </div>
                    <Link
                      href={`/${locale}/profile`}
                      onClick={() => setMenuOpen(false)}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-gray-300 hover:bg-white/5 transition-colors"
                    >
                      <UserCircle className="w-4 h-4" />
                      {t('profile')}
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
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
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500
                       text-white text-sm font-medium hover:from-teal-400 hover:to-cyan-400 transition-all
                       shadow-lg shadow-teal-500/25"
          >
            <LogIn className="w-4 h-4" />
            <span>{t('signIn')}</span>
          </Link>
        )}
      </div>
    </motion.nav>
  )
}
