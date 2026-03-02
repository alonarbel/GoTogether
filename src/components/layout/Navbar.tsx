'use client'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { usePathname, useRouter } from 'next/navigation'
import { Globe, Plus, Compass, CalendarDays, LogOut, LogIn, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/lib/auth-context'
import { useState } from 'react'

interface NavbarProps {
  locale: string
}

export function Navbar({ locale }: NavbarProps) {
  const t = useTranslations('nav')
  const tLang = useTranslations('lang')
  const pathname = usePathname()
  const router = useRouter()
  const { user, profile, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

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

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-6 py-4 
                 bg-gray-950/80 backdrop-blur-xl border-b border-white/5"
    >
      {/* Logo */}
      <Link href={`/${locale}`} className="flex items-center gap-2 group">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/25">
          <Compass className="w-4 h-4 text-white" />
        </div>
        <span className="text-lg font-bold bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
          {t('logo')}
        </span>
      </Link>

      <div className="flex items-center gap-2">
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
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-white">
                  {profile?.full_name?.[0]?.toUpperCase() || '?'}
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
                    <div className="p-3 border-b border-white/5">
                      <div className="text-sm font-medium text-white">{profile?.full_name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{user.email}</div>
                      {profile?.phone && (
                        <div className="text-xs text-gray-500 mt-0.5">{profile.phone}</div>
                      )}
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      התנתקות
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
            <span>כניסה</span>
          </Link>
        )}
      </div>
    </motion.nav>
  )
}
