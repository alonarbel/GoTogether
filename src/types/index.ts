export type CardType = 'trip' | 'attraction' | 'workshop' | 'sport' | 'food' | 'other'

export interface Location {
  address: string
  city: string
  country: string
  lat: number
  lng: number
}

export interface Participant {
  id: string
  name: string
  avatar?: string
  joinedAt: string
}

export interface TravelCard {
  id: string
  title: string
  description: string
  type: CardType
  location: Location
  images: string[]
  minParticipants: number
  maxParticipants: number
  currentParticipants: number
  participants: Participant[]
  whatsappLink?: string
  telegramLink?: string
  contactInfo: string
  createdBy: string
  createdAt: string
  expiresAt?: string
  tags?: string[]
}
