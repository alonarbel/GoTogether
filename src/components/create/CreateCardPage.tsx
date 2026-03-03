'use client'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { CardType, OrganizerRole } from '@/types'
import { getCardTypeIcon, cn } from '@/lib/utils'
import { CheckCircle2, Upload, ArrowLeft, ArrowRight, Check, Loader2, LogIn } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { createCard } from '@/lib/cards'
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

export function CreateCardPage() {
  const t = useTranslations('create')
  const tFilters = useTranslations('filters')
  const tRoles = useTranslations('organizerRole')
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
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
      const result = await createCard({
        userId: user.id,
        title: form.title,
        description: form.description,
        type: form.type,
        organizerRole: form.organizerRole,
        address: form.address,
        city: form.city,
        country: form.country,
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
      setSubmitted(true)
      setTimeout(() => router.push(`/${locale}`), 1500)
    } catch (e) {
      console.error('Create card error:', e)
      const msg = e instanceof Error ? e.message : String(e)
      alert(`שגיאה ביצירת הכרטיסייה: ${msg}\n\nבדוק את הConsole לפרטים.`)
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4 max-w-sm">
          <div className="text-5xl">🔒</div>
          <h2 className="text-xl font-bold text-white">{t('loginRequired')}</h2>
          <Link
            href={`/${locale}/auth`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-medium"
          >
            <LogIn className="w-4 h-4" />
            כניסה / הרשמה
          </Link>
        </motion.div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center space-y-4">
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}
            className="w-20 h-20 rounded-full bg-teal-500/20 border border-teal-500/30 flex items-center justify-center mx-auto"
          >
            <CheckCircle2 className="w-10 h-10 text-teal-400" />
          </motion.div>
          <h2 className="text-2xl font-bold text-white">{t('success')}</h2>
          <p className="text-gray-400">Redirecting...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <h1 className="text-3xl font-bold text-white">{t('title')}</h1>
          <p className="text-gray-400 mt-2">{t('subtitle')}</p>
        </motion.div>

        {/* Step indicator */}
        <div className="flex items-center justify-between mb-10">
          {stepLabels.map((label, i) => {
            const num = i + 1
            const isDone = num < step
            const isActive = num === step
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className="relative w-full flex items-center">
                  {i > 0 && <div className={cn('flex-1 h-0.5 -me-2 transition-colors', isDone ? 'bg-teal-500' : 'bg-gray-800')} />}
                  <button
                    onClick={() => num < step && setStep(num)}
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all z-10 flex-shrink-0',
                      isDone ? 'bg-teal-500 text-white cursor-pointer' :
                      isActive ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-500/30' :
                      'bg-gray-800 text-gray-500'
                    )}
                  >
                    {isDone ? <Check className="w-4 h-4" /> : num}
                  </button>
                  {i < TOTAL_STEPS - 1 && <div className={cn('flex-1 h-0.5 -ms-2 transition-colors', isDone ? 'bg-teal-500' : 'bg-gray-800')} />}
                </div>
                <span className={cn('text-xs hidden sm:block transition-colors', isActive ? 'text-teal-400' : 'text-gray-600')}>{label}</span>
              </div>
            )
          })}
        </div>

        <motion.div className="bg-gray-900 rounded-2xl border border-white/5 p-6 sm:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              {step === 1 && (
                <>
                  {/* Organizer role toggle */}
                  <div className="space-y-2">
                    <label className="text-sm text-gray-400">{t('organizerRoleLabel')}</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => set('organizerRole', 'traveler')}
                        className={cn('p-3 rounded-xl border text-sm transition-all text-start',
                          form.organizerRole === 'traveler' ? 'border-teal-500/50 bg-teal-500/10 text-teal-300' : 'border-white/10 bg-gray-800 text-gray-400 hover:border-white/20'
                        )}
                      >
                        🧳 {t('iAmTraveler')}
                      </button>
                      <button
                        onClick={() => set('organizerRole', 'guide')}
                        className={cn('p-3 rounded-xl border text-sm transition-all text-start',
                          form.organizerRole !== 'traveler' ? 'border-purple-500/50 bg-purple-500/10 text-purple-300' : 'border-white/10 bg-gray-800 text-gray-400 hover:border-white/20'
                        )}
                      >
                        🎯 {t('iAmOrganizer')}
                      </button>
                    </div>
                    {form.organizerRole !== 'traveler' && (
                      <div className="grid grid-cols-4 gap-2 mt-2">
                        {organizerRoles.filter(r => r !== 'traveler').map(role => (
                          <button
                            key={role}
                            onClick={() => set('organizerRole', role)}
                            className={cn('py-2 rounded-lg border text-xs transition-all',
                              form.organizerRole === role ? 'border-purple-500/50 bg-purple-500/10 text-purple-300' : 'border-white/10 bg-gray-800 text-gray-400'
                            )}
                          >
                            {tRoles(role)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Title */}
                  <div className="space-y-1.5">
                    <label className="text-sm text-gray-400">{t('titleLabel')}</label>
                    <input value={form.title} onChange={e => set('title', e.target.value)} placeholder={t('titlePlaceholder')}
                      className="w-full px-4 py-3 bg-gray-800 border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-teal-500/50 transition-all" />
                  </div>
                  {/* Description */}
                  <div className="space-y-1.5">
                    <label className="text-sm text-gray-400">{t('descLabel')}</label>
                    <textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder={t('descPlaceholder')} rows={4}
                      className="w-full px-4 py-3 bg-gray-800 border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-teal-500/50 transition-all resize-none" />
                  </div>
                  {/* Type */}
                  <div className="space-y-2">
                    <label className="text-sm text-gray-400">{t('typeLabel')}</label>
                    <div className="grid grid-cols-3 gap-2">
                      {cardTypes.map(type => (
                        <button key={type} onClick={() => set('type', type)}
                          className={cn('p-3 rounded-xl border text-sm transition-all flex flex-col items-center gap-1',
                            form.type === type ? 'border-teal-500/50 bg-teal-500/10 text-teal-300' : 'border-white/10 bg-gray-800 text-gray-400 hover:border-white/20'
                          )}
                        >
                          <span className="text-xl">{getCardTypeIcon(type)}</span>
                          <span>{tFilters(type)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Tags */}
                  <div className="space-y-1.5">
                    <label className="text-sm text-gray-400">תגיות (מופרדות בפסיק)</label>
                    <input value={form.tags} onChange={e => set('tags', e.target.value)} placeholder="hiking, sunrise, adventure"
                      className="w-full px-4 py-3 bg-gray-800 border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-teal-500/50 transition-all" />
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-sm text-gray-400">{t('addressLabel')}</label>
                    <input value={form.address} onChange={e => set('address', e.target.value)} placeholder={t('addressPlaceholder')}
                      className="w-full px-4 py-3 bg-gray-800 border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-teal-500/50 transition-all" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm text-gray-400">{t('cityLabel')}</label>
                      <input value={form.city} onChange={e => set('city', e.target.value)}
                        className="w-full px-4 py-3 bg-gray-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-teal-500/50 transition-all" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm text-gray-400">{t('countryLabel')}</label>
                      <input value={form.country} onChange={e => set('country', e.target.value)}
                        className="w-full px-4 py-3 bg-gray-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-teal-500/50 transition-all" />
                    </div>
                  </div>
                  <div className="h-48 rounded-xl bg-gray-800 border border-white/5 flex items-center justify-center text-gray-600 text-sm">
                    🗺️ Map picker — coming soon
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm text-gray-400">{t('minLabel')}</label>
                      <input type="number" value={form.minParticipants} onChange={e => set('minParticipants', Number(e.target.value))} min={2}
                        className="w-full px-4 py-3 bg-gray-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-teal-500/50 transition-all" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm text-gray-400">{t('maxLabel')}</label>
                      <input type="number" value={form.maxParticipants} onChange={e => set('maxParticipants', Number(e.target.value))} min={form.minParticipants}
                        className="w-full px-4 py-3 bg-gray-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-teal-500/50 transition-all" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm text-gray-400">{t('eventDateLabel')}</label>
                      <input type="date" value={form.eventDate} onChange={e => set('eventDate', e.target.value)}
                        className="w-full px-4 py-3 bg-gray-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-teal-500/50 transition-all" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm text-gray-400">{t('eventTimeLabel')}</label>
                      <input type="time" value={form.eventTime} onChange={e => set('eventTime', e.target.value)}
                        className="w-full px-4 py-3 bg-gray-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-teal-500/50 transition-all" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm text-gray-400">{t('minDeadlineLabel')}</label>
                    <input type="date" value={form.minDeadline} onChange={e => set('minDeadline', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-teal-500/50 transition-all" />
                  </div>
                  {/* Preview */}
                  <div className="bg-gray-800 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Preview</span>
                      <span className="text-teal-400">0 / {form.maxParticipants}</span>
                    </div>
                    <div className="relative h-3 bg-gray-700 rounded-full overflow-hidden">
                      <div className="absolute top-0 bottom-0 w-0.5 bg-amber-500"
                        style={{ left: `${(form.minParticipants / form.maxParticipants) * 100}%` }} />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span className="text-amber-500">min: {form.minParticipants}</span>
                      <span className="text-teal-500">max: {form.maxParticipants}</span>
                    </div>
                  </div>
                </>
              )}

              {step === 4 && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-sm text-gray-400">{t('contactLabel')}</label>
                    <input value={form.contactInfo} onChange={e => set('contactInfo', e.target.value)} placeholder={user?.email || ''}
                      className="w-full px-4 py-3 bg-gray-800 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-teal-500/50 transition-all" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm text-gray-400">{t('phoneLabel')}</label>
                    <div className="flex gap-2">
                      <select value={form.phoneCode} onChange={e => set('phoneCode', e.target.value)}
                        className="px-3 py-3 bg-gray-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-teal-500/50 text-sm">
                        {COUNTRY_CODES.map(c => (
                          <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                        ))}
                      </select>
                      <input value={form.phoneNumber} onChange={e => set('phoneNumber', e.target.value)} placeholder="050-000-0000"
                        className="flex-1 px-4 py-3 bg-gray-800 border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-teal-500/50 transition-all" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm text-gray-400 flex items-center gap-2"><span className="text-green-400">💬</span> {t('whatsappLabel')}</label>
                    <input value={form.whatsappLink} onChange={e => set('whatsappLink', e.target.value)} placeholder="https://chat.whatsapp.com/..."
                      className="w-full px-4 py-3 bg-gray-800 border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-green-500/50 transition-all" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm text-gray-400 flex items-center gap-2"><span className="text-blue-400">✈️</span> {t('telegramLabel')}</label>
                    <input value={form.telegramLink} onChange={e => set('telegramLink', e.target.value)} placeholder="https://t.me/..."
                      className="w-full px-4 py-3 bg-gray-800 border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 transition-all" />
                  </div>
                </>
              )}

              {step === 5 && (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-white/10 rounded-2xl p-12 text-center hover:border-teal-500/30 transition-colors cursor-pointer group">
                    <Upload className="w-10 h-10 text-gray-600 group-hover:text-teal-500 mx-auto mb-3 transition-colors" />
                    <p className="text-gray-400 font-medium">{t('uploadImages')}</p>
                    <p className="text-sm text-gray-600 mt-1">{t('uploadHint')}</p>
                  </div>
                  <p className="text-xs text-gray-600 text-center">תמונות יתווספו בקרוב. ניתן לפרסם ללא תמונה.</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t border-white/5">
            <button
              onClick={() => step > 1 ? setStep(s => s - 1) : router.back()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('back')}
            </button>
            <button
              onClick={() => step < TOTAL_STEPS ? setStep(s => s + 1) : handleSubmit()}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 
                         text-white text-sm font-medium hover:from-teal-400 hover:to-cyan-400 transition-all 
                         shadow-lg shadow-teal-500/25 disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {step < TOTAL_STEPS ? t('next') : t('submit')}
              {step < TOTAL_STEPS && <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
