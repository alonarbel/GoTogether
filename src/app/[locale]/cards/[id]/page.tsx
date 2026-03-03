import { fetchCard } from '@/lib/cards'
import { CardDetailPage } from '@/components/cards/CardDetailPage'
import { notFound } from 'next/navigation'

export default async function Page({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { id } = await params
  const card = await fetchCard(id)
  if (!card) notFound()
  return <CardDetailPage card={card} />
}
