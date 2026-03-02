'use client'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { usePathname, useRouter } from 'next/navigation'
import { Globe, Plus, Compass } from 'lucide-react'
import { motion } from 'framer-motion'

interface NavbarProps {
  locale: string
}

export function Navbar({ locale }: NavbarProps) {
  const t = useTranslations('nav')
  const tLang = useTranslations('lang')
  const pathname = usePathname()
  const router = useRouter()

  const toggleLocale = () => {
    const newLocale = locale === 'he' ? 'en' : 'he'
    const segments = pathname.split('/')
    segments[1] = newLocale
    router.push(segments.join('/'))
  }

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 
                 bg-gray-950/80 backdrop-blur-xl border-b border-white/5"
    >
      <Link href={`/${locale}`} className="flex items-center gap-2 group">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/25">
          <Compass className="w-4 h-4 text-white" />
        </div>
        <span className="text-lg font-bold bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
          {t('logo')}
        </span>
      </Link>

      <div className="flex items-center gap-3">
        <button
          onClick={toggleLocale}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-gray-400 
                     hover:text-white hover:bg-white/5 transition-all"
        >
          <Globe className="w-4 h-4" />
          <span>{locale === 'he' ? tLang('en') : tLang('he')}</span>
        </button>

        <Link
          href={`/${locale}/create`}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 
                     text-white text-sm font-medium hover:from-teal-400 hover:to-cyan-400 transition-all 
                     shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:block">{t('create')}</span>
        </Link>
      </div>
    </motion.nav>
  )
}
