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
  'w-full px-3.5 py-2.5 rounded-xl ' +
  'bg-[--color-night-950] border border-[--color-mist-500] ' +
  'text-[--color-mist-50] text-[13px] placeholder:text-[--color-mist-500] ' +
  'focus:outline-none focus:border-[--color-coral-500]/40 transition-all'

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
        userId: user.id, title: form.title, description: form.description,
        type: form.type, organizerRole: form.organizerRole,
        address: form.address, city: form.city, country: form.country,
        lat: coords?.[0], lng: coords?.[1],
        minParticipants: form.minParticipants, maxParticipants: form.maxParticipants,
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
            .from('card-images').upload(path, file, { upsert: true })
          if (!upErr) {
            const { data } = supabase.storage.from('card-images').getPublicUrl(path)
            await supabase.from('card_images').insert({
              card_id: result.id, url: data.publicUrl, position: i,
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
          <div className="text-7xl">🔒</div>
          <h2 className="font-display text-[--color-mist-50] text-2xl font-semibold">{t('loginRequired')}</h2>
          <Link href={`/${locale}/auth`}
            className="btn-primary inline-flex items-center gap-2 px-5 py-3 rounded-full text-[13px] font-semibold">
            <LogIn className="w-4 h-4 relative z-[1]" strokeWidth={2.5} /> <span className="relative z-[1]">sign in / register</span>
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
            className="w-24 h-24 mx-auto rounded-full grid place-items-center
                       bg-gradient-to-br from-[--color-coral-500] via-[--color-violet-500] to-[--color-cyan-400]">
            <CheckCircle2 className="w-12 h-12 text-white" strokeWidth={2} />
          </motion.div>
          <h2 className="font-display text-[--color-mist-50] text-3xl font-semibold">{t('success')}</h2>
          <p className="text-[--color-mist-300] text-[13px]">redirecting…</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-28 pb-20 px-4">
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full
                          bg-[--color-night-900] border border-[--color-mist-500] backdrop-blur-md
                          text-[11px] font-mono text-[--color-mist-200] tracking-wide">
            <span className="text-[--color-coral-400] font-semibold">step {step}</span>
            <span className="text-[--color-mist-500]">/</span>
            <span className="text-[--color-mist-400]">{TOTAL_STEPS}</span>
          </div>
          <h1 className="headline text-[--color-mist-50] text-4xl sm:text-5xl">
            <span className="text-gradient">{t('title')}</span>
          </h1>
          <p className="text-[--color-mist-300] text-[13px]">{t('subtitle')}</p>
        </motion.div>

        {/* Step bars */}
        <div className="flex items-center justify-between mb-10 gap-1">
          {stepLabels.map((label, i) => {
            const num = i + 1
            const isDone = num < step
            const isActive = num === step
            return (
              <div key={i} className="flex-1 flex flex-col gap-2 min-w-0">
                <button
                  onClick={() => num < step && setStep(num)}
                  disabled={num >= step}
                  className={cn(
                    'h-1 rounded-full transition-all',
                    isActive ? 'bg-[--color-coral-500]' :
                    isDone   ? 'bg-[--color-violet-500]/40 cursor-pointer' :
                               'bg-[--color-night-900]'
                  )}
                />
                <div className={cn(
                  'flex items-center gap-1.5 text-[10px] font-medium truncate',
                  isActive ? 'text-[--color-coral-400]' :
                  isDone   ? 'text-[--color-mist-200]' :
                             'text-[--color-mist-500]'
                )}>
                  <span className="tabular-nums font-mono">{String(num).padStart(2, '0')}</span>
                  {isDone && <Check className="w-3 h-3 text-[--color-emerald-400]" strokeWidth={2.5} />}
                  <span className="hidden sm:inline truncate">{label}</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Form panel */}
        <motion.div className="glass rounded-2xl p-6 sm:p-8">
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
                  <div className="space-y-2">
                    <label className="eyebrow">{t('organizerRoleLabel')}</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => set('organizerRole', 'traveler')}
                        className={cn('p-3 rounded-xl border transition-all text-start text-[12px] font-semibold',
                          form.organizerRole === 'traveler'
                            ? 'border-[--color-coral-500]/50 bg-[--color-coral-500]/10 text-[--color-coral-300]'
                            : 'border-[--color-mist-500] text-[--color-mist-300] hover:border-[--color-mist-400]'
                        )}>
                        🧳 {t('iAmTraveler')}
                      </button>
                      <button onClick={() => set('organizerRole', 'guide')}
                        className={cn('p-3 rounded-xl border transition-all text-start text-[12px] font-semibold',
                          form.organizerRole !== 'traveler'
                            ? 'border-[--color-violet-500]/50 bg-[--color-violet-500]/10 text-[--color-violet-300]'
                            : 'border-[--color-mist-500] text-[--color-mist-300] hover:border-[--color-mist-400]'
                        )}>
                        🎯 {t('iAmOrganizer')}
                      </button>
                    </div>
                    {form.organizerRole !== 'traveler' && (
                      <div className="grid grid-cols-4 gap-1.5 mt-2">
                        {organizerRoles.filter(r => r !== 'traveler').map(role => (
                          <button key={role} onClick={() => set('organizerRole', role)}
                            className={cn('py-2 rounded-xl border text-[11px] font-medium transition-all',
                              form.organizerRole === role
                                ? 'border-[--color-violet-500]/50 bg-[--color-violet-500]/10 text-[--color-violet-300]'
                                : 'border-[--color-mist-500] text-[--color-mist-300]'
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
                      placeholder={t('descPlaceholder')} rows={4} className={`${inputClass} resize-none`} />
                  </Field>

                  <div className="space-y-2">
                    <label className="eyebrow">{t('typeLabel')}</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {cardTypes.map(type => (
                        <button key={type} onClick={() => set('type', type)}
                          className={cn('p-3 rounded-xl border transition-all flex flex-col items-center gap-1',
                            form.type === type
                              ? 'border-[--color-coral-500]/50 bg-[--color-coral-500]/10'
                              : 'border-[--color-mist-500] hover:border-[--color-mist-400]'
                          )}>
                          <span className="text-2xl">{getCardTypeIcon(type)}</span>
                          <span className={cn('text-[11px] font-semibold',
                            form.type === type ? 'text-[--color-coral-300]' : 'text-[--color-mist-300]'
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
                  <div className="h-40 rounded-xl border border-dashed border-[--color-mist-500]
                                  bg-gradient-to-br from-[--color-coral-500]/[0.04] via-[--color-violet-500]/[0.04] to-[--color-cyan-400]/[0.04]
                                  grid place-items-center text-[12px] text-[--color-mist-400]">
                    🗺 map picker — coming soon
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label={t('minLabel')}>
                      <input type="number" min={2} value={form.minParticipants}
                        onChange={e => set('minParticipants', Number(e.target.value))} className={inputClass} />
                    </Field>
                    <Field label={t('maxLabel')}>
                      <input type="number" min={form.minParticipants} value={form.maxParticipants}
                        onChange={e => set('maxParticipants', Number(e.target.value))} className={inputClass} />
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

                  <div className="rounded-xl border border-[--color-mist-500] p-4 space-y-3 bg-[--color-night-950]">
                    <div className="flex justify-between items-center">
                      <span className="eyebrow">— preview</span>
                      <span className="font-mono text-[11px] text-[--color-mist-300] tabular-nums">
                        0 / {form.maxParticipants}
                      </span>
                    </div>
                    <div className="relative h-1.5 bg-[--color-night-800] rounded-full overflow-visible">
                      <div className="absolute top-1/2 -translate-y-1/2 w-0.5 h-3 rounded-full bg-[--color-amber-400]"
                        style={{ insetInlineStart: `${(form.minParticipants / form.maxParticipants) * 100}%` }} />
                    </div>
                    <div className="flex justify-between text-[11px] font-mono">
                      <span className="text-[--color-amber-400]">min · {form.minParticipants}</span>
                      <span className="text-[--color-cyan-400]">max · {form.maxParticipants}</span>
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
                        className="px-2.5 py-2.5 bg-[--color-night-950] border border-[--color-mist-500] rounded-xl
                                   text-[--color-mist-50] text-[12px] font-mono focus:outline-none focus:border-[--color-coral-500]/40">
                        {COUNTRY_CODES.map(c => (
                          <option key={c.code} value={c.code} className="bg-[--color-night-900]">{c.flag} {c.code}</option>
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
                      className="w-full border-2 border-dashed border-[--color-mist-500] rounded-2xl p-12 text-center
                                 bg-gradient-to-br from-[--color-coral-500]/[0.03] via-transparent to-[--color-cyan-400]/[0.03]
                                 hover:border-[--color-coral-500]/40 transition-all group">
                      <Upload className="w-12 h-12 text-[--color-mist-500] group-hover:text-[--color-coral-400] mx-auto mb-3 transition-colors" strokeWidth={1.5} />
                      <p className="font-display text-[--color-mist-100] text-base font-semibold">{t('uploadImages')}</p>
                      <p className="text-[12px] text-[--color-mist-400] mt-1">{t('uploadHint')}</p>
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {imagePreviews.map((src, i) => (
                          <div key={i} className="relative aspect-video rounded-xl overflow-hidden group">
                            <img src={src} alt="" className="w-full h-full object-cover" />
                            <button type="button"
                              onClick={() => {
                                setImageFiles(f => f.filter((_, j) => j !== i))
                                setImagePreviews(p => p.filter((_, j) => j !== i))
                              }}
                              className="absolute top-1.5 end-1.5 w-6 h-6 rounded-full bg-[--color-rose-500] text-white
                                         text-xs grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                          </div>
                        ))}
                        {imagePreviews.length < 5 && (
                          <button type="button" onClick={() => fileInputRef.current?.click()}
                            className="aspect-video rounded-xl border-2 border-dashed border-[--color-mist-500]
                                       hover:border-[--color-coral-500]/40 grid place-items-center transition-colors">
                            <Upload className="w-5 h-5 text-[--color-mist-500]" strokeWidth={1.5} />
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] font-mono text-[--color-mist-400] text-center tabular-nums">
                        {imagePreviews.length}/5 images
                      </p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-between mt-8 pt-6 border-t border-[--color-mist-500]">
            <button onClick={() => step > 1 ? setStep(s => s - 1) : router.back()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl
                         text-[12px] font-medium
                         text-[--color-mist-300] hover:text-[--color-coral-400] transition-colors link-underline">
              <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} />
              {t('back')}
            </button>
            <button
              onClick={() => step < TOTAL_STEPS ? setStep(s => s + 1) : handleSubmit()}
              disabled={loading}
              className="btn-primary flex items-center gap-2 px-5 py-2.5 rounded-xl
                         text-[12px] font-semibold disabled:opacity-50">
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin relative z-[1]" />}
              <span className="relative z-[1]">{step < TOTAL_STEPS ? t('next') : t('submit')}</span>
              {step < TOTAL_STEPS && <ArrowRight className="w-3.5 h-3.5 relative z-[1]" strokeWidth={2.5} />}
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
