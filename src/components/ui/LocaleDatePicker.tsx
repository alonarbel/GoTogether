'use client'
import { useState, useEffect } from 'react'

interface LocaleDatePickerProps {
  value: string       // YYYY-MM-DD or ''
  onChange: (v: string) => void
  locale: string
}

export function LocaleDatePicker({ value, onChange, locale }: LocaleDatePickerProps) {
  const parse = (v: string) => {
    if (!v) return { y: 0, m: 0, d: 0 }
    const parts = v.split('-').map(Number)
    return { y: parts[0] || 0, m: parts[1] || 0, d: parts[2] || 0 }
  }

  const [y, setY] = useState(parse(value).y)
  const [m, setM] = useState(parse(value).m)
  const [d, setD] = useState(parse(value).d)

  // Sync local state when value is cleared externally
  useEffect(() => {
    if (!value) { setY(0); setM(0); setD(0) }
  }, [value])

  const emit = (newY: number, newM: number, newD: number) => {
    if (newY && newM && newD) {
      onChange(`${newY}-${String(newM).padStart(2, '0')}-${String(newD).padStart(2, '0')}`)
    } else {
      onChange('')
    }
  }

  const monthNames = Array.from({ length: 12 }, (_, i) =>
    new Intl.DateTimeFormat(locale, { month: 'long' }).format(new Date(2000, i, 1))
  )

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 4 }, (_, i) => currentYear + i)
  const daysInMonth = y && m ? new Date(y, m, 0).getDate() : 31

  const selectClass =
    'bg-white/[0.06] border border-white/[0.10] rounded-lg ' +
    'text-[--color-mist-50] text-[12px] font-mono px-2 py-1.5 ' +
    'focus:outline-none focus:border-[--color-coral-500]/40 transition-all cursor-pointer'

  // High-contrast options: black text on white (most reliable across browsers/OS)
  const optionStyle = { backgroundColor: '#ffffff', color: '#0a1620' }

  return (
    <div className="flex gap-1 items-center">
      <select
        value={d || ''}
        onChange={(e) => { const val = Number(e.target.value); setD(val); emit(y, m, val) }}
        className={selectClass}
      >
        <option value="" style={optionStyle}>—</option>
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(n => (
          <option key={n} value={n} style={optionStyle}>{n}</option>
        ))}
      </select>

      <select
        value={m || ''}
        onChange={(e) => { const val = Number(e.target.value); setM(val); emit(y, val, d) }}
        className={selectClass}
      >
        <option value="" style={optionStyle}>—</option>
        {monthNames.map((name, i) => (
          <option key={i + 1} value={i + 1} style={optionStyle}>{name}</option>
        ))}
      </select>

      <select
        value={y || ''}
        onChange={(e) => { const val = Number(e.target.value); setY(val); emit(val, m, d) }}
        className={selectClass}
      >
        <option value="" style={optionStyle}>—</option>
        {years.map(n => (
          <option key={n} value={n} style={optionStyle}>{n}</option>
        ))}
      </select>
    </div>
  )
}
