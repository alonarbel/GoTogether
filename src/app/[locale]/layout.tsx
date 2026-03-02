import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import { Geist } from 'next/font/google'
import '../globals.css'
import { Navbar } from '@/components/layout/Navbar'

const geist = Geist({ subsets: ['latin'] })

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

  return (
    <html lang={locale} dir={isRTL ? 'rtl' : 'ltr'} className="dark">
      <body className={`${geist.className} bg-gray-950 text-white min-h-screen`}>
        <NextIntlClientProvider messages={messages}>
          <Navbar locale={locale} />
          <main>{children}</main>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
