import { TravelCard } from '@/types'

// Fallback coordinates for cards without explicit lat/lng — keyed by city name (Hebrew + English)
export const CITY_COORDS: Record<string, [number, number]> = {
  'תל אביב': [32.0853, 34.7818],
  'tel aviv': [32.0853, 34.7818],
  'ירושלים': [31.7683, 35.2137],
  'jerusalem': [31.7683, 35.2137],
  'אילת': [29.5577, 34.9519],
  'eilat': [29.5577, 34.9519],
  'נתניה': [32.3215, 34.8532],
  'netanya': [32.3215, 34.8532],
  'קצרין': [32.9899, 35.6951],
  'katzrin': [32.9899, 35.6951],
  'קרית שמונה': [33.2074, 35.5697],
  'kiryat shmona': [33.2074, 35.5697],
  'ים המלח': [31.5, 35.5],
  'dead sea': [31.5, 35.5],
  'חיפה': [32.7940, 34.9896],
  'haifa': [32.7940, 34.9896],
  'באר שבע': [31.2516, 34.7913],
  'beer sheva': [31.2516, 34.7913],
}

export function resolveCardCoords(card: TravelCard): [number, number] | null {
  if (typeof card.location.lat === 'number' && typeof card.location.lng === 'number') {
    return [card.location.lat, card.location.lng]
  }
  const raw = card.location.city.trim()
  return CITY_COORDS[raw] || CITY_COORDS[raw.toLowerCase()] || null
}

// Haversine distance in km between two [lat, lng] points
export function distanceKm(a: [number, number], b: [number, number]): number {
  const R = 6371
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(b[0] - a[0])
  const dLng = toRad(b[1] - a[1])
  const lat1 = toRad(a[0])
  const lat2 = toRad(b[0])
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(x))
}
