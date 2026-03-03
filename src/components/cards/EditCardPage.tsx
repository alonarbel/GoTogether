'use client'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { TravelCard, CardType, OrganizerRole } from '@/types'
import { updateCard } from '@/lib/cards'
import { getCardTypeIcon, cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth-context'
import { useToast } from '@/components/ui/Toast'
import { ArrowLeft, Save, Loader2, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const CARD_TYPES: CardType[] = ['trip', 'attraction', 'workshop', 'sport', 'food', 'other']
const ORGANIZER_ROLES: OrganizerRole[] = ['traveler', 'guide', 'coach', 'driver', 'organizer']

const COUNTRY_CODES = [
  { code: '+972', flag: '🇮🇱' }, { code: '+1', flag: '🇺🇸' }, { code: '+44', flag: '🇬🇧' },
  { code: '+49', flag: '🇩🇪' }, { code: '+33', flag: '🇫🇷' }, { code: '+39', flag: '🇮🇹' },
  { code: '+34', flag: '🇪🇸' }, { code: '+61', flag: '🇦🇺' }, { code: '+81', flag: '🇯🇵' },
  { code: '+91', flag: '🇮🇳' }, { code: '+55', flag: '🇧🇷' }, { code: '+86', flag: '🇨🇳' },
  { code: '+27', flag: '🇿🇦' }, { code: '+20', flag: '🇪🇬' }, { code: '+90', flag: '🇹🇷' },
]

export function EditCardPage({ card }: { card: TravelCard }) {
  const t = useTranslations('create')
  const tFilters = useTranslations('filters')
  const tRoles = useTranslations('organizerRole')
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const { toast } = useToast()

  // Parse phone if stored as "+972050..."
  const existingPhone = card.phone || ''
  const matchedCode = COUNTRY_CODES.find(c => existingPhone.startsWith(c.code)) 
  const defaultCode = matchedCode?.code || '+972'
  const defaultNumber = matchedCode ? existingPhone.slice(defaultCode.length) : existingPhone

  const [form, setForm] = useState({
    title: card.title,
    description: card.description,
    type: card.type,
    organizer_role: card.organizer_role,
    address: card.location.address,
    city: card.location.city,
    country: card.location.country,
    min_participants: card.minParticipants,
    max_participants: card.maxParticipants,
    event_date: card.eventDate || '',
    event_time: card.eventTime || '',
    min_deadline: card.minDeadline || '',
    phoneCode: defaultCode,
    phoneNumber: defaultNumber,
    contact_info: card.contactInfo,
    whatsapp_link: card.whatsappLink || '',
    telegram_link: card.telegramLink || '',
    tags: (card.tags || []).join(', '),
  })

  const set = <K extends keyof typeof form>(key: K, val: typeof form[K]) =>
    setForm(f => ({ ...f, [key]: val }))

  // Guard: only owner can edit
  if (user?.id !== card.createdByUserId) {
    router.push(`/${locale}/cards/${card.id}`)
    return null
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const ok = await updateCard(card.id, {
        title: form.title,
        description: form.description,
        type: form.type,
        organizer_role: form.organizer_role,
        address: form.address,
        city: form.city,
        country: form.country,
        min_participants: form.min_participants,
        max_participants: form.max_participants,
        event_date: form.event_date || undefined,
        event_time: form.event_time || undefined,
        min_deadline: form.min_deadline || undefined,
        phone: form.phoneNumber ? `${form.phoneCode}${form.phoneNumber}` : undefined,
        contact_info: form.contact_info,
        whatsapp_link: form.whatsapp_link || undefined,
        telegram_link: form.telegram_link || undefined,
        tags: form.tags ? form.tags.split(',').map(s => s.trim()).filter(Boolean) : [],
      })
      if (ok) {
        toast('השינויים נשמרו בהצלחה', 'success')
        router.push(`/${locale}/cards/${card.id}`)
      } else throw new Error('Update failed')
    } catch (e) {
      toast('שגיאה בשמירת השינויים', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('למחוק את הכרטיסייה לצמיתות?')) return
    setDeleting(true)
    const { error } = await supabase.from('travel_cards').delete().eq('id', card.id)
    if (!error) {
      toast('הכרטיסייה נמחקה', 'info')
      router.push(`/${locale}`)
    } else {
      toast('שגיאה במחיקה', 'error')
      setDeleting(false)
    }
  }

  return (
    <div className="min-h-screen pt-20 pb-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <motion.button
            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm">חזור</span>
          </motion.button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-all text-sm"
          >
            {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            מחק כרטיסייה
          </button>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <h1 className="text-2xl font-bold text-white">{t('title').replace('חדשה', '').trim()} — עריכה</h1>

          {/* Title */}
          <Field label={t('titleLabel')}>
            <input value={form.title} onChange={e => set('title', e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-teal-500/50 transition-colors placeholder:text-gray-600" placeholder={t('titlePlaceholder')} />
          </Field>

          {/* Description */}
          <Field label={t('descLabel')}>
            <textarea value={form.description} onChange={e => set('description', e.target.value)}
              rows={4} className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-teal-500/50 transition-colors placeholder:text-gray-600 resize-none" placeholder={t('descPlaceholder')} />
          </Field>

          {/* Type */}
          <Field label={t('typeLabel')}>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {CARD_TYPES.map(type => (
                <button key={type} type="button" onClick={() => set('type', type)}
                  className={cn('flex flex-col items-center gap-1 py-3 rounded-xl text-xs transition-all border',
                    form.type === type
                      ? 'bg-teal-500/15 border-teal-500/40 text-teal-300'
                      : 'bg-gray-900 border-white/5 text-gray-400 hover:border-white/15'
                  )}>
                  <span className="text-xl">{getCardTypeIcon(type)}</span>
                  <span>{tFilters(type as Parameters<typeof tFilters>[0])}</span>
                </button>
              ))}
            </div>
          </Field>

          {/* Organizer role */}
          <Field label={t('organizerRoleLabel')}>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ORGANIZER_ROLES.map(role => (
                <button key={role} type="button" onClick={() => set('organizer_role', role)}
                  className={cn('py-2.5 px-3 rounded-xl text-sm transition-all border',
                    form.organizer_role === role
                      ? 'bg-teal-500/15 border-teal-500/40 text-teal-300'
                      : 'bg-gray-900 border-white/5 text-gray-400 hover:border-white/15'
                  )}>
                  {tRoles(role as Parameters<typeof tRoles>[0])}
                </button>
              ))}
            </div>
          </Field>

          {/* Location */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label={t('addressLabel')} className="sm:col-span-1">
              <input value={form.address} onChange={e => set('address', e.target.value)} className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-teal-500/50 transition-colors placeholder:text-gray-600" />
            </Field>
            <Field label={t('cityLabel')}>
              <input value={form.city} onChange={e => set('city', e.target.value)} className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-teal-500/50 transition-colors placeholder:text-gray-600" />
            </Field>
            <Field label={t('countryLabel')}>
              <input value={form.country} onChange={e => set('country', e.target.value)} className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-teal-500/50 transition-colors placeholder:text-gray-600" />
            </Field>
          </div>

          {/* Participants */}
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('minLabel')}>
              <input type="number" min={1} value={form.min_participants}
                onChange={e => set('min_participants', +e.target.value)} className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-teal-500/50 transition-colors placeholder:text-gray-600" />
            </Field>
            <Field label={t('maxLabel')}>
              <input type="number" min={1} value={form.max_participants}
                onChange={e => set('max_participants', +e.target.value)} className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-teal-500/50 transition-colors placeholder:text-gray-600" />
            </Field>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label={t('eventDateLabel')}>
              <input type="date" value={form.event_date} onChange={e => set('event_date', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-teal-500/50 transition-colors placeholder:text-gray-600" style={{ colorScheme: 'dark' }} />
            </Field>
            <Field label={t('eventTimeLabel')}>
              <input type="time" value={form.event_time} onChange={e => set('event_time', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-teal-500/50 transition-colors placeholder:text-gray-600" style={{ colorScheme: 'dark' }} />
            </Field>
            <Field label={t('minDeadlineLabel')}>
              <input type="date" value={form.min_deadline} onChange={e => set('min_deadline', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-teal-500/50 transition-colors placeholder:text-gray-600" style={{ colorScheme: 'dark' }} />
            </Field>
          </div>

          {/* Phone */}
          <Field label={t('phoneLabel')}>
            <div className="flex gap-2">
              <select value={form.phoneCode} onChange={e => set('phoneCode', e.target.value)}
                className="w-28 flex-shrink-0 px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-teal-500/50 transition-colors" dir="ltr">
                {COUNTRY_CODES.map(c => (
                  <option key={c.code} value={c.code} className="bg-gray-900">{c.flag} {c.code}</option>
                ))}
              </select>
              <input value={form.phoneNumber} onChange={e => set('phoneNumber', e.target.value)}
                className="flex-1 px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-teal-500/50 transition-colors placeholder:text-gray-600" dir="ltr" placeholder="050-0000000" />
            </div>
          </Field>

          {/* Contact */}
          <Field label={t('contactLabel')}>
            <input value={form.contact_info} onChange={e => set('contact_info', e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-teal-500/50 transition-colors placeholder:text-gray-600" dir="ltr" />
          </Field>

          {/* Chat links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label={t('whatsappLabel')}>
              <input value={form.whatsapp_link} onChange={e => set('whatsapp_link', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-teal-500/50 transition-colors placeholder:text-gray-600" dir="ltr" placeholder="https://chat.whatsapp.com/..." />
            </Field>
            <Field label={t('telegramLabel')}>
              <input value={form.telegram_link} onChange={e => set('telegram_link', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-teal-500/50 transition-colors placeholder:text-gray-600" dir="ltr" placeholder="https://t.me/..." />
            </Field>
          </div>

          {/* Tags */}
          <Field label="תגיות (מופרדות בפסיק)">
            <input value={form.tags} onChange={e => set('tags', e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-teal-500/50 transition-colors placeholder:text-gray-600" placeholder="ים, שקיעה, ירושלים..." />
          </Field>

          {/* Save */}
          <button onClick={handleSave} disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500
                       text-white font-semibold hover:from-teal-400 hover:to-cyan-400 transition-all
                       shadow-lg shadow-teal-500/20 disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            שמור שינויים
          </button>
        </motion.div>
      </div>


    </div>
  )
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  )
}
