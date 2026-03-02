import { CardDetailPage } from '@/components/cards/CardDetailPage'
import { notFound } from 'next/navigation'
import { mockCards } from '@/lib/mock-data'

export default async function Page({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { id } = await params
  const card = mockCards.find((c) => c.id === id)
  if (!card) notFound()
  return <CardDetailPage card={card} />
}
