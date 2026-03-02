export type CardType = 'trip' | 'attraction' | 'workshop' | 'sport' | 'food' | 'other'
export type OrganizerRole = 'traveler' | 'guide' | 'coach' | 'driver' | 'organizer'

export interface Location {
  address: string
  city: string
  country: string
  lat?: number
  lng?: number
}

export interface Participant {
  id: string
  user_id: string
  name: string
  phone?: string
  avatar?: string
  joinedAt: string
}

export interface TravelCard {
  id: string
  title: string
  description: string
  type: CardType
  organizer_role: OrganizerRole
  location: Location
  images: string[]
  minParticipants: number
  maxParticipants: number
  currentParticipants: number
  participants: Participant[]
  eventDate?: string        // ISO date string
  eventTime?: string        // HH:MM
  minDeadline?: string      // ISO date — last day to reach minimum
  whatsappLink?: string
  telegramLink?: string
  contactInfo: string
  phone?: string
  createdBy: string
  createdByUserId: string
  createdAt: string
  expiresAt?: string
  tags?: string[]
}

export interface UserProfile {
  id: string
  email: string
  full_name: string
  phone: string
  avatar_url?: string
  created_at: string
}
