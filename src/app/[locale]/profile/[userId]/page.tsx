import { PublicProfilePage } from '@/components/profile/PublicProfilePage'

export default async function Page({ params }: { params: Promise<{ locale: string; userId: string }> }) {
  const { locale, userId } = await params
  return <PublicProfilePage userId={userId} locale={locale} />
}
