'use client'
import { useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { TravelCard } from '@/types'
import { useRouter, useParams } from 'next/navigation'
import { getCardTypeIcon } from '@/lib/utils'
import { resolveCardCoords } from '@/lib/locationCoords'

const ISRAEL_CENTER: [number, number] = [31.7683, 34.9519]

interface FitBoundsProps {
  coords: [number, number][]
}
function FitBounds({ coords }: FitBoundsProps) {
  const map = useMap()
  useEffect(() => {
    if (coords.length === 0) return
    if (coords.length === 1) {
      map.setView(coords[0], 11)
      return
    }
    map.fitBounds(coords, { padding: [40, 40] })
  }, [coords, map])
  return null
}

interface CardsMapProps {
  cards: TravelCard[]
}

export default function CardsMap({ cards }: CardsMapProps) {
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string

  const pins = useMemo(() => {
    return cards
      .map(card => {
        const coords = resolveCardCoords(card)
        return coords ? { card, coords } : null
      })
      .filter((p): p is { card: TravelCard; coords: [number, number] } => p !== null)
  }, [cards])

  const allCoords = pins.map(p => p.coords)

  // Build a custom emoji-based icon per card type so pins are visually distinct
  const buildIcon = (card: TravelCard) =>
    L.divIcon({
      html: `<div style="
        width: 36px; height: 36px;
        display: flex; align-items: center; justify-content: center;
        background: linear-gradient(135deg, #14b8a6, #06b6d4);
        border: 2px solid white;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 4px 12px rgba(0,0,0,.4);
      "><span style="transform: rotate(45deg); font-size: 16px;">${getCardTypeIcon(card.type)}</span></div>`,
      className: 'gt-pin',
      iconSize: [36, 36],
      iconAnchor: [18, 36],
      popupAnchor: [0, -32],
    })

  return (
    <div className="relative h-[600px] rounded-2xl overflow-hidden border border-white/8 bg-gray-900">
      <MapContainer
        center={ISRAEL_CENTER}
        zoom={8}
        scrollWheelZoom
        className="h-full w-full"
        style={{ background: '#030712' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {pins.map(({ card, coords }) => (
          <Marker key={card.id} position={coords} icon={buildIcon(card)}>
            <Popup>
              <div style={{ minWidth: 200, fontFamily: 'inherit' }}>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
                  {getCardTypeIcon(card.type)} {card.title}
                </div>
                <div style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>
                  📍 {card.location.city}, {card.location.country}
                </div>
                {card.eventDate && (
                  <div style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>
                    📅 {new Date(card.eventDate).toLocaleDateString()}
                  </div>
                )}
                <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
                  👥 {card.currentParticipants}/{card.maxParticipants}
                </div>
                <button
                  onClick={() => router.push(`/${locale}/cards/${card.id}`)}
                  style={{
                    width: '100%', padding: '6px 12px',
                    background: 'linear-gradient(90deg, #14b8a6, #06b6d4)',
                    color: 'white', border: 'none', borderRadius: 6,
                    fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  View Details →
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
        <FitBounds coords={allCoords} />
      </MapContainer>
      {pins.length < cards.length && (
        <div className="absolute top-3 end-3 z-[400] px-3 py-1.5 rounded-lg bg-gray-900/90 border border-white/10 text-xs text-gray-400 backdrop-blur-sm">
          Showing {pins.length} of {cards.length} cards on map
        </div>
      )}
    </div>
  )
}
