'use client'
import { useState, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { CardType, OrganizerRole } from '@/types'
import { getCardTypeIcon, cn } from '@/lib/utils'
import { CheckCircle2, Upload, ArrowLeft, ArrowRight, Check, Loader2, LogIn } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useToast } from '@/components/ui/Toast'
import { createCard } from '@/lib/cards'
import { geocodeAddress } from '@/lib/locationCoords'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

const TOTAL_STEPS = 5

const COUNTRY_CODES = [
  { code: '+972', flag: '🇮🇱' }, { code: '+1', flag: '🇺🇸' }, { code: '+44', flag: '🇬🇧' },
  { code: '+49', flag: '🇩🇪' }, { code: '+33', flag: '🇫🇷' }, { code: '+39', flag: '🇮🇹' },
  { code: '+34', flag: '🇪🇸' }, { code: '+61', flag: '🇦🇺' }, { code: '+81', flag: '🇯🇵' },
  { code: '+91', flag: '🇮🇳' }, { code: '+55', flag: '🇧🇷' }, { code: '+86', flag: '🇨🇳' },
  { code: '+27', flag: '🇿🇦' }, { code: '+20', flag: '🇪🇬' }, { code: '+90', flag: '🇹🇷' },
]

interface FormData {
  title: string; description: string; type: CardType; organizerRole: OrganizerRole
  address: string; city: string; country: string
  minParticipants: number; maxParticipants: number
  eventDate: string; eventTime: string; minDeadline: string
  phoneCode: string; phoneNumber: string
  contactInfo: string; whatsappLink: string; telegramLink: string
  tags: string
}

const cardTypes: CardType[] = ['trip', 'attraction', 'workshop', 'sport', 'food', 'other']
const organizerRoles: OrganizerRole[] = ['traveler', 'guide', 'coach', 'driver', 'organizer']

const inputClass =
  'w-full px-3.5 py-2.5 bg-[--color-ink-850] border border-[rgba(255,255,255,.06)] rounded-sm ' +
  'text-[--color-bone-50] text-[13px] placeholder:text-[--color-bone-600] ' +
  'focus:outline-none focus:border-[--color-amber-400]/40 transition-all'

export function CreateCardPage() {
  const t = useTranslations('create')
  const tFilters = useTranslations('filters')
  const tRoles = useTranslations('organizerRole')
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const [form, setForm] = useState<FormData>({
    title: '', description: '', type: 'trip', organizerRole: 'traveler',
    address: '', city: '', country: '',
    minParticipants: 5, maxParticipants: 15,
    eventDate: '', eventTime: '', minDeadline: '',
    phoneCode: '+972', phoneNumber: '',
    contactInfo: '', whatsappLink: '', telegramLink: '',
    tags: '',
  })

  const params = useParams()
  const router = useRouter()
  const locale = params.locale as string
  const { user, profile } = useAuth()

  const set = <K extends keyof FormData>(key: K, value: FormData[K]) =>
    setForm(f => ({ ...f, [key]: value }))

  const stepLabels = [t('step1'), t('step2'), t('step3'), t('step4'), t('step5')]

  const handleSubmit = async () => {
    if (!user) return
    setLoading(true)
    try {
      const coords = await geocodeAddress(form.address, form.city, form.country)
      const result = await createCard({
        userId: user.id,
        title: form.title,
        description: form.description,
        type: form.type,
        organizerRole: form.organizerRole,
        address: form.address,
        city: form.city,
        country: form.country,
        lat: coords?.[0],
        lng: coords?.[1],
        minParticipants: form.minParticipants,
        maxParticipants: form.maxParticipants,
        eventDate: form.eventDate || undefined,
        eventTime: form.eventTime || undefined,
        minDeadline: form.minDeadline || undefined,
        contactInfo: form.contactInfo || profile?.email || '',
        phone: form.phoneNumber ? `${form.phoneCode}${form.phoneNumber}` : undefined,
        whatsappLink: form.whatsappLink || undefined,
        telegramLink: form.telegramLink || undefined,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      })
      if (!result) throw new Error('Failed to create card')

      if (imageFiles.length > 0) {
        await Promise.all(imageFiles.map(async (file, i) => {
          const ext = file.name.split('.').pop()
          const path = `${user.id}/${result.id}/${i}.${ext}`
          const { error: upErr } = await supabase.storage
            .from('card-images')
            .upload(path, file, { upsert: true })
          if (!upErr) {
            const { data } = supabase.storage.from('card-images').getPublicUrl(path)
            await supabase.from('card_images').insert({
              card_id: result.id,
              url: data.publicUrl,
              position: i,
            })
          }
        }))
      }

      setSubmitted(true)
      setTimeout(() => router.push(`/${locale}/cards/${result.id}`), 1500)
    } catch (e) {
      console.error('Create card error:', e)
      const msg = e instanceof Error ? e.message : 'שגיאה לא ידועה'
      toast(`שגיאה ביצירת הכרטיסייה: ${msg}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen grid place-items-center px-4">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-5 max-w-sm">
          <div className="font-display text-7xl text-[--color-bone-600]">⛓</div>
          <h2 className="font-display text-[--color-bone-50] text-2xl">{t('loginRequired')}</h2>
          <Link href={`/${locale}/auth`}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-sm
                       font-mono text-[11px] tracking-[0.18em] uppercase font-semibold
                       bg-[--color-amber-400] text-[--color-amber-ink] hover:bg-[--color-amber-500]
                       transition-all shadow-[0_8px_28px_rgba(251,191,36,.18)]">
            <LogIn className="w-3.5 h-3.5" strokeWidth={2.5} /> sign in / register
          </Link>
        </motion.div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen grid place-items-center px-4">
        <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="text-center space-y-5">
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.15 }}
            className="w-20 h-20 mx-auto rounded-full grid place-items-center
                       bg-[--color-amber-400]/10 border border-[--color-amber-400]/30 corner-marks">
            <CheckCircle2 className="w-9 h-9 text-[--color-amber-400]" strokeWidth={1.6} />
          </motion.div>
          <h2 className="font-display text-[--color-bone-50] text-3xl">{t('success')}</h2>
          <p className="font-mono text-[11px] tracking-[0.18em] uppercase text-[--color-bone-400]">redirecting…</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-28 pb-20 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-12 space-y-3">
          <div className="flex items-center gap-3">
            <span className="w-8 h-px bg-[--color-amber-400]" />
            <span className="eyebrow text-[--color-amber-400]">— new dispatch · step {step}/{TOTAL_STEPS}</span>
          </div>
          <h1 className="headline text-[--color-bone-50] text-4xl sm:text-5xl">{t('title')}</h1>
          <p className="text-[--color-bone-400] text-sm">{t('subtitle')}</p>
        </motion.div>

        {/* Step indicator */}
        <div className="flex items-center justify-between mb-12 gap-1">
          {stepLabels.map((label, i) => {
            const num = i + 1
            const isDone = num < step
            const isActive = num === step
            return (
              <div key={i} className="flex-1 flex flex-col items-stretch gap-2 min-w-0">
                <button
                  onClick={() => num < step && setStep(num)}
                  disabled={num >= step}
                  className={cn(
                    'h-1 rounded-full transition-colors',
                    isActive ? 'bg-[--color-amber-400]' :
                    isDone   ? 'bg-[--color-amber-400]/40 cursor-pointer' :
                               'bg-[--color-ink-800]'
                  )}
                />
                <div className={cn(
                  'flex items-center gap-1.5 font-mono text-[10px] tracking-[0.14em] uppercase truncate',
                  isActive ? 'text-[--color-amber-400]' : isDone ? 'text-[--color-bone-200]' : 'text-[--color-bone-600]'
                )}>
                  <span className="tabular-nums">{String(num).padStart(2, '0')}</span>
                  {isDone && <Check className="w-3 h-3" strokeWidth={2.5} />}
                  <span className="hidden sm:inline truncate">{label}</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Form panel */}
        <motion.div className="border border-[rgba(255,255,255,.06)] rounded-sm p-6 sm:p-8 bg-[--color-ink-900] corner-marks">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
              className="space-y-5"
            >
              {step === 1 && (
                <>
                  {/* Organizer role */}
                  <div className="space-y-2">
                    <label className="eyebrow">{t('organizerRoleLabel')}</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => set('organizerRole', 'traveler')}
                        className={cn('p-3 rounded-sm border text-[12px] transition-all text-start',
                          form.organizerRole === 'traveler'
                            ? 'border-[--color-amber-400]/50 bg-[--color-amber-400]/5 text-[--color-amber-400]'
                            : 'border-[--color-ink-700] text-[--color-bone-400] hover:border-[--color-ink-600]'
                        )}>
                        🧳 {t('iAmTraveler')}
                      </button>
                      <button onClick={() => set('organizerRole', 'guide')}
                        className={cn('p-3 rounded-sm border text-[12px] transition-all text-start',
                          form.organizerRole !== 'traveler'
                            ? 'border-[--color-amber-400]/50 bg-[--color-amber-400]/5 text-[--color-amber-400]'
                            : 'border-[--color-ink-700] text-[--color-bone-400] hover:border-[--color-ink-600]'
                        )}>
                        🎯 {t('iAmOrganizer')}
                      </button>
                    </div>
                    {form.organizerRole !== 'traveler' && (
                      <div className="grid grid-cols-4 gap-1.5 mt-2">
                        {organizerRoles.filter(r => r !== 'traveler').map(role => (
                          <button key={role} onClick={() => set('organizerRole', role)}
                            className={cn('py-2 rounded-sm border font-mono text-[10px] tracking-[0.14em] uppercase transition-all',
                              form.organizerRole === role
                                ? 'border-[--color-amber-400]/50 bg-[--color-amber-400]/10 text-[--color-amber-400]'
                                : 'border-[--color-ink-700] text-[--color-bone-400]'
                            )}>
                            {tRoles(role)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <Field label={t('titleLabel')}>
                    <input value={form.title} onChange={e => set('title', e.target.value)}
                      placeholder={t('titlePlaceholder')} className={inputClass} />
                  </Field>

                  <Field label={t('descLabel')}>
                    <textarea value={form.description} onChange={e => set('description', e.target.value)}
                      placeholder={t('descPlaceholder')} rows={4}
                      className={`${inputClass} resize-none`} />
                  </Field>

                  <div className="space-y-2">
                    <label className="eyebrow">{t('typeLabel')}</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {cardTypes.map(type => (
                        <button key={type} onClick={() => set('type', type)}
                          className={cn('p-3 rounded-sm border transition-all flex flex-col items-center gap-1',
                            form.type === type
                              ? 'border-[--color-amber-400]/50 bg-[--color-amber-400]/5'
                              : 'border-[--color-ink-700] hover:border-[--color-ink-600]'
                          )}>
                          <span className="text-xl">{getCardTypeIcon(type)}</span>
                          <span className={cn('font-mono text-[10px] tracking-[0.12em] uppercase',
                            form.type === type ? 'text-[--color-amber-400]' : 'text-[--color-bone-400]'
                          )}>{tFilters(type)}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <Field label="תגיות (מופרדות בפסיק)">
                    <input value={form.tags} onChange={e => set('tags', e.target.value)}
                      placeholder="hiking, sunrise, adventure" className={inputClass} />
                  </Field>
                </>
              )}

              {step === 2 && (
                <>
                  <Field label={t('addressLabel')}>
                    <input value={form.address} onChange={e => set('address', e.target.value)}
                      placeholder={t('addressPlaceholder')} className={inputClass} />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label={t('cityLabel')}>
                      <input value={form.city} onChange={e => set('city', e.target.value)} className={inputClass} />
                    </Field>
                    <Field label={t('countryLabel')}>
                      <input value={form.country} onChange={e => set('country', e.target.value)} className={inputClass} />
                    </Field>
                  </div>
                  <div className="h-40 rounded-sm border border-dashed border-[--color-ink-700] grid place-items-center
                                  font-mono text-[10px] tracking-[0.18em] uppercase text-[--color-bone-600]">
                    🗺 map picker — coming soon
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label={t('minLabel')}>
                      <input type="number" min={2} value={form.minParticipants}
                        onChange={e => set('minParticipants', Number(e.target.value))}
                        className={inputClass} />
                    </Field>
                    <Field label={t('maxLabel')}>
                      <input type="number" min={form.minParticipants} value={form.maxParticipants}
                        onChange={e => set('maxParticipants', Number(e.target.value))}
                        className={inputClass} />
                    </Field>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label={t('eventDateLabel')}>
                      <input type="date" value={form.eventDate} onChange={e => set('eventDate', e.target.value)}
                        className={inputClass} style={{ colorScheme: 'dark' }} />
                    </Field>
                    <Field label={t('eventTimeLabel')}>
                      <input type="time" value={form.eventTime} onChange={e => set('eventTime', e.target.value)}
                        className={inputClass} style={{ colorScheme: 'dark' }} />
                    </Field>
                  </div>
                  <Field label={t('minDeadlineLabel')}>
                    <input type="date" value={form.minDeadline} onChange={e => set('minDeadline', e.target.value)}
                      className={inputClass} style={{ colorScheme: 'dark' }} />
                  </Field>

                  {/* Preview */}
                  <div className="rounded-sm border border-[--color-ink-700] p-4 space-y-3 bg-[--color-ink-850]">
                    <div className="flex justify-between items-center">
                      <span className="eyebrow">— preview</span>
                      <span className="font-mono text-[11px] text-[--color-bone-400] tabular-nums">
                        00 / {String(form.maxParticipants).padStart(2, '0')}
                      </span>
                    </div>
                    <div className="relative h-1 bg-[--color-ink-800] rounded-full overflow-visible">
                      <div className="absolute top-1/2 -translate-y-1/2 w-px h-2.5 bg-[--color-amber-400]"
                        style={{ insetInlineStart: `${(form.minParticipants / form.maxParticipants) * 100}%` }} />
                    </div>
                    <div className="flex justify-between font-mono text-[10px] tracking-[0.14em] uppercase">
                      <span className="text-[--color-amber-400]">min · {form.minParticipants}</span>
                      <span className="text-[--color-bone-400]">max · {form.maxParticipants}</span>
                    </div>
                  </div>
                </>
              )}

              {step === 4 && (
                <>
                  <Field label={t('contactLabel')}>
                    <input value={form.contactInfo} onChange={e => set('contactInfo', e.target.value)}
                      placeholder={user?.email || ''} className={inputClass} />
                  </Field>
                  <Field label={t('phoneLabel')}>
                    <div className="flex gap-2">
                      <select value={form.phoneCode} onChange={e => set('phoneCode', e.target.value)}
                        className="px-2.5 py-2.5 bg-[--color-ink-850] border border-[rgba(255,255,255,.06)] rounded-sm
                                   text-[--color-bone-50] text-[12px] font-mono focus:outline-none focus:border-[--color-amber-400]/40">
                        {COUNTRY_CODES.map(c => (
                          <option key={c.code} value={c.code} className="bg-[--color-ink-850]">{c.flag} {c.code}</option>
                        ))}
                      </select>
                      <input value={form.phoneNumber} onChange={e => set('phoneNumber', e.target.value)}
                        placeholder="050-000-0000" className={`${inputClass} flex-1`} />
                    </div>
                  </Field>
                  <Field label={`💬 ${t('whatsappLabel')}`}>
                    <input value={form.whatsappLink} onChange={e => set('whatsappLink', e.target.value)}
                      placeholder="https://chat.whatsapp.com/..." className={inputClass} />
                  </Field>
                  <Field label={`✈ ${t('telegramLabel')}`}>
                    <input value={form.telegramLink} onChange={e => set('telegramLink', e.target.value)}
                      placeholder="https://t.me/..." className={inputClass} />
                  </Field>
                </>
              )}

              {step === 5 && (
                <div className="space-y-4">
                  <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
                    onChange={e => {
                      const files = Array.from(e.target.files || []).slice(0, 5)
                      setImageFiles(files)
                      setImagePreviews(files.map(f => URL.createObjectURL(f)))
                    }} />
                  {imagePreviews.length === 0 ? (
                    <button type="button" onClick={() => fileInputRef.current?.click()}
                      className="w-full border border-dashed border-[--color-ink-700] rounded-sm p-12 text-center
                                 hover:border-[--color-amber-400]/40 transition-colors group">
                      <Upload className="w-9 h-9 text-[--color-bone-600] group-hover:text-[--color-amber-400] mx-auto mb-3 transition-colors" strokeWidth={1.5} />
                      <p className="font-display text-[--color-bone-200] text-base">{t('uploadImages')}</p>
                      <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-[--color-bone-600] mt-2">{t('uploadHint')}</p>
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {imagePreviews.map((src, i) => (
                          <div key={i} className="relative aspect-video rounded-sm overflow-hidden group">
                            <img src={src} alt="" className="w-full h-full object-cover" />
                            <button type="button"
                              onClick={() => {
                                setImageFiles(f => f.filter((_, j) => j !== i))
                                setImagePreviews(p => p.filter((_, j) => j !== i))
                              }}
                              className="absolute top-1.5 end-1.5 w-6 h-6 rounded-full bg-[--color-ink-950]/80 text-[--color-bone-50]
                                         text-xs grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                          </div>
                        ))}
                        {imagePreviews.length < 5 && (
                          <button type="button" onClick={() => fileInputRef.current?.click()}
                            className="aspect-video rounded-sm border border-dashed border-[--color-ink-700]
                                       hover:border-[--color-amber-400]/40 grid place-items-center transition-colors">
                            <Upload className="w-5 h-5 text-[--color-bone-600]" strokeWidth={1.5} />
                          </button>
                        )}
                      </div>
                      <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-[--color-bone-600] text-center tabular-nums">
                        {imagePreviews.length}/5 images
                      </p>
                    </div>
                  )}
                  <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-[--color-bone-600] text-center">
                    optional — you can publish without images
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t border-[--color-ink-800]">
            <button onClick={() => step > 1 ? setStep(s => s - 1) : router.back()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-sm
                         font-mono text-[11px] tracking-[0.18em] uppercase
                         text-[--color-bone-400] hover:text-[--color-amber-400] transition-colors link-underline">
              <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} />
              {t('back')}
            </button>
            <button
              onClick={() => step < TOTAL_STEPS ? setStep(s => s + 1) : handleSubmit()}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-sm
                         font-mono text-[11px] tracking-[0.18em] uppercase font-semibold
                         bg-[--color-amber-400] text-[--color-amber-ink] hover:bg-[--color-amber-500]
                         transition-all shadow-[0_8px_28px_rgba(251,191,36,.18)] disabled:opacity-50">
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {step < TOTAL_STEPS ? t('next') : t('submit')}
              {step < TOTAL_STEPS && <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.5} />}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="eyebrow">{label}</label>
      {children}
    </div>
  )
}
