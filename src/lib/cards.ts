import { supabase } from './supabase'
import { TravelCard, Participant } from '@/types'

// Fetch all cards with images and participant count
export async function fetchCards(): Promise<TravelCard[]> {
  const { data: cards, error } = await supabase
    .from('travel_cards')
    .select(`
      *,
      profiles!travel_cards_user_id_fkey(full_name, phone),
      card_images(url, position),
      participants(id, user_id, joined_at, profiles(full_name, phone, avatar_url))
    `)
    .order('created_at', { ascending: false })

  if (error || !cards) return []
  return cards.map(mapCard)
}

// Fetch single card
export async function fetchCard(id: string): Promise<TravelCard | null> {
  const { data: card, error } = await supabase
    .from('travel_cards')
    .select(`
      *,
      profiles!travel_cards_user_id_fkey(full_name, phone),
      card_images(url, position),
      participants(id, user_id, joined_at, profiles(full_name, phone, avatar_url))
    `)
    .eq('id', id)
    .single()

  if (error || !card) return null
  return mapCard(card)
}

// Fetch cards for a user (created + joined)
export async function fetchMyCards(userId: string): Promise<{ created: TravelCard[]; joined: TravelCard[] }> {
  const [createdRes, joinedRes] = await Promise.all([
    supabase
      .from('travel_cards')
      .select(`*, profiles!travel_cards_user_id_fkey(full_name, phone), card_images(url, position), participants(id, user_id, joined_at, profiles(full_name, phone, avatar_url))`)
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    supabase
      .from('participants')
      .select(`card_id`)
      .eq('user_id', userId),
  ])

  const created = (createdRes.data || []).map(mapCard)

  let joined: TravelCard[] = []
  if (joinedRes.data && joinedRes.data.length > 0) {
    const cardIds = joinedRes.data.map((p: { card_id: string }) => p.card_id)
    const { data: joinedCards } = await supabase
      .from('travel_cards')
      .select(`*, profiles!travel_cards_user_id_fkey(full_name, phone), card_images(url, position), participants(id, user_id, joined_at, profiles(full_name, phone, avatar_url))`)
      .in('id', cardIds)
      .neq('user_id', userId)
    joined = (joinedCards || []).map(mapCard)
  }

  return { created, joined }
}

// Create a card
export async function createCard(data: {
  userId: string
  title: string
  description: string
  type: string
  organizerRole: string
  address: string
  city: string
  country: string
  minParticipants: number
  maxParticipants: number
  eventDate?: string
  eventTime?: string
  minDeadline?: string
  contactInfo: string
  phone?: string
  whatsappLink?: string
  telegramLink?: string
  tags?: string[]
}): Promise<TravelCard | null> {
  const { data: card, error } = await supabase
    .from('travel_cards')
    .insert({
      user_id: data.userId,
      title: data.title,
      description: data.description,
      type: data.type,
      organizer_role: data.organizerRole,
      address: data.address,
      city: data.city,
      country: data.country,
      min_participants: data.minParticipants,
      max_participants: data.maxParticipants,
      event_date: data.eventDate || null,
      event_time: data.eventTime || null,
      min_deadline: data.minDeadline || null,
      contact_info: data.contactInfo,
      phone: data.phone || null,
      whatsapp_link: data.whatsappLink || null,
      telegram_link: data.telegramLink || null,
      tags: data.tags || [],
    })
    .select()
    .single()

  if (error || !card) {
    throw new Error(error?.message || error?.code || 'Unknown Supabase error')
  }
  return fetchCard(card.id)
}

// Update a card
export async function updateCard(id: string, data: Partial<{
  title: string; description: string; type: string; organizer_role: string
  address: string; city: string; country: string
  min_participants: number; max_participants: number
  event_date: string; event_time: string; min_deadline: string
  contact_info: string; phone: string; whatsapp_link: string; telegram_link: string; tags: string[]
}>): Promise<boolean> {
  const { error } = await supabase.from('travel_cards').update(data).eq('id', id)
  return !error
}

// Join a card
export async function joinCard(cardId: string, userId: string): Promise<boolean> {
  const { error } = await supabase.from('participants').insert({ card_id: cardId, user_id: userId })
  return !error
}

// Leave a card
export async function leaveCard(cardId: string, userId: string): Promise<boolean> {
  const { error } = await supabase.from('participants').delete().eq('card_id', cardId).eq('user_id', userId)
  return !error
}

// Check if user joined a card
export async function hasJoined(cardId: string, userId: string): Promise<boolean> {
  const { data } = await supabase.from('participants').select('id').eq('card_id', cardId).eq('user_id', userId).single()
  return !!data
}

// Map raw Supabase row to TravelCard
function mapCard(raw: Record<string, unknown>): TravelCard {
  const images = ((raw.card_images as {url:string, position:number}[]) || [])
    .sort((a, b) => a.position - b.position)
    .map((i) => i.url)

  const profile = raw.profiles as { full_name: string; phone: string } | null
  const participantsRaw = (raw.participants as Record<string, unknown>[]) || []

  const participants: Participant[] = participantsRaw.map((p) => {
    const pProfile = p.profiles as { full_name: string; phone: string; avatar_url?: string } | null
    return {
      id: p.id as string,
      user_id: p.user_id as string,
      name: pProfile?.full_name || 'Unknown',
      phone: pProfile?.phone,
      avatar: pProfile?.avatar_url,
      joinedAt: p.joined_at as string,
    }
  })

  return {
    id: raw.id as string,
    title: raw.title as string,
    description: raw.description as string,
    type: raw.type as TravelCard['type'],
    organizer_role: (raw.organizer_role as TravelCard['organizer_role']) || 'traveler',
    location: {
      address: raw.address as string,
      city: raw.city as string,
      country: raw.country as string,
      lat: raw.lat as number | undefined,
      lng: raw.lng as number | undefined,
    },
    images,
    minParticipants: raw.min_participants as number,
    maxParticipants: raw.max_participants as number,
    currentParticipants: participants.length,
    participants,
    eventDate: raw.event_date as string | undefined,
    eventTime: raw.event_time as string | undefined,
    minDeadline: raw.min_deadline as string | undefined,
    whatsappLink: raw.whatsapp_link as string | undefined,
    telegramLink: raw.telegram_link as string | undefined,
    contactInfo: raw.contact_info as string,
    phone: raw.phone as string | undefined || profile?.phone,
    createdBy: profile?.full_name || 'Unknown',
    createdByUserId: raw.user_id as string,
    createdAt: raw.created_at as string,
    expiresAt: raw.expires_at as string | undefined,
    tags: raw.tags as string[] | undefined,
  }
}
