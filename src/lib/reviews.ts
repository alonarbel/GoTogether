import { supabase } from './supabase'

export interface Review {
  id: string
  card_id: string
  card_title?: string
  reviewer_id: string
  reviewer_name: string
  reviewer_avatar?: string
  card_rating?: number
  organizer_rating?: number
  comment?: string
  photos?: string[]
  created_at: string
}

export async function fetchReviews(cardId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select('*, profiles!reviews_reviewer_id_fkey(full_name, avatar_url)')
    .eq('card_id', cardId)
    .order('created_at', { ascending: false })

  if (error || !data) return []

  return data.map((r: Record<string, unknown>) => {
    const profile = r.profiles as { full_name: string; avatar_url?: string } | null
    return {
      id: r.id as string,
      card_id: r.card_id as string,
      reviewer_id: r.reviewer_id as string,
      reviewer_name: profile?.full_name || 'Unknown',
      reviewer_avatar: profile?.avatar_url,
      card_rating: r.card_rating as number | undefined,
      organizer_rating: r.organizer_rating as number | undefined,
      comment: r.comment as string | undefined,
      photos: r.photos as string[] | undefined,
      created_at: r.created_at as string,
    }
  })
}

export async function submitReview(data: {
  cardId: string
  reviewerId: string
  cardRating?: number
  organizerRating?: number
  comment?: string
  photos?: string[]
}): Promise<boolean> {
  const { error } = await supabase.from('reviews').upsert({
    card_id: data.cardId,
    reviewer_id: data.reviewerId,
    card_rating: data.cardRating || null,
    organizer_rating: data.organizerRating || null,
    comment: data.comment?.trim() || null,
    photos: data.photos || [],
  }, { onConflict: 'card_id,reviewer_id' })

  return !error
}

// Reviews received as organizer for a given user
export async function fetchOrganizerReviews(userId: string): Promise<{ reviews: Review[]; average: number | null }> {
  const { data: cards } = await supabase
    .from('travel_cards')
    .select('id, title')
    .eq('user_id', userId)

  if (!cards || cards.length === 0) return { reviews: [], average: null }

  const cardIds = cards.map((c: { id: string }) => c.id)
  const cardTitleMap = Object.fromEntries(cards.map((c: { id: string; title: string }) => [c.id, c.title]))

  const { data, error } = await supabase
    .from('reviews')
    .select('*, profiles!reviews_reviewer_id_fkey(full_name, avatar_url)')
    .in('card_id', cardIds)
    .order('created_at', { ascending: false })

  if (error || !data) return { reviews: [], average: null }

  const reviews: Review[] = data.map((r: Record<string, unknown>) => {
    const profile = r.profiles as { full_name: string; avatar_url?: string } | null
    return {
      id: r.id as string,
      card_id: r.card_id as string,
      card_title: cardTitleMap[r.card_id as string],
      reviewer_id: r.reviewer_id as string,
      reviewer_name: profile?.full_name || 'Unknown',
      reviewer_avatar: profile?.avatar_url,
      card_rating: r.card_rating as number | undefined,
      organizer_rating: r.organizer_rating as number | undefined,
      comment: r.comment as string | undefined,
      created_at: r.created_at as string,
    }
  })

  // Average across both organizer_rating and card_rating (whichever is present)
  const allRatings = reviews.flatMap(r => [r.organizer_rating, r.card_rating]).filter(Boolean) as number[]
  const average = allRatings.length > 0
    ? Math.round((allRatings.reduce((a, b) => a + b, 0) / allRatings.length) * 10) / 10
    : null

  return { reviews, average }
}
