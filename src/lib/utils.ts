import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { CardType } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getCardTypeColor(type: CardType): string {
  const colors: Record<CardType, string> = {
    trip: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    attraction: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    workshop: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    sport: 'bg-green-500/20 text-green-300 border-green-500/30',
    food: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    other: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  }
  return colors[type]
}

export function getCardTypeIcon(type: CardType): string {
  const icons: Record<CardType, string> = {
    trip: '🗺️',
    attraction: '🏛️',
    workshop: '🎨',
    sport: '⚡',
    food: '🍜',
    other: '✨',
  }
  return icons[type]
}

export function getParticipantStatus(current: number, min: number, max: number) {
  const percentage = (current / max) * 100
  const isFull = current >= max
  const hasMinimum = current >= min
  const spotsLeft = max - current
  const neededForMin = Math.max(0, min - current)
  return { percentage, isFull, hasMinimum, spotsLeft, neededForMin }
}

export function isLastDayForMinimum(minDeadline?: string): boolean {
  if (!minDeadline) return false
  const deadline = new Date(minDeadline)
  const today = new Date()
  deadline.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)
  return deadline.getTime() === today.getTime()
}
