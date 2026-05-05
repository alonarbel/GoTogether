import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import { Geist, Geist_Mono, Fraunces, Heebo, Frank_Ruhl_Libre } from 'next/font/google'
import '../globals.css'
import { Navbar } from '@/components/layout/Navbar'
import { AuthProvider } from '@/lib/auth-context'
import { ToastProvider } from '@/components/ui/Toast'

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
  display: 'swap',
})
const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
})
const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
  axes: ['opsz', 'SOFT', 'WONK'],
})
const heebo = Heebo({
  subsets: ['hebrew', 'latin'],
  variable: '--font-heebo',
  display: 'swap',
})
const frankRuhl = Frank_Ruhl_Libre({
  subsets: ['hebrew', 'latin'],
  variable: '--font-frank-ruhl',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'GoTogether — Find Your Travel Crew',
  description: 'Connect with travelers worldwide. Join group trips, workshops, and adventures.',
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!routing.locales.includes(locale as 'he' | 'en')) notFound()
  const messages = await getMessages()
  const isRTL = locale === 'he'

  const fontVars = `${geistSans.variable} ${geistMono.variable} ${fraunces.variable} ${heebo.variable} ${frankRuhl.variable}`

  return (
    <html lang={locale} dir={isRTL ? 'rtl' : 'ltr'} className={`dark ${fontVars}`}>
      <body className="min-h-screen">
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>
            <ToastProvider>
              <Navbar locale={locale} />
              <main>{children}</main>
            </ToastProvider>
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
