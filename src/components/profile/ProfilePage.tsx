'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '@/lib/auth-context'
import { useToast } from '@/components/ui/Toast'
import { supabase } from '@/lib/supabase'
import { Camera, Save, Loader2, LogOut, Mail, Phone, User, ArrowLeft, Star, MapPin, Briefcase, FileText } from 'lucide-react'
import { cn, getCardTypeIcon } from '@/lib/utils'
import { fetchMyCards } from '@/lib/cards'
import { fetchOrganizerReviews, Review } from '@/lib/reviews'
import { TravelCard } from '@/types'

const COUNTRY_CODES = [
  { code: '+972', flag: '🇮🇱' }, { code: '+1', flag: '🇺🇸' }, { code: '+44', flag: '🇬🇧' },
  { code: '+49', flag: '🇩🇪' }, { code: '+33', flag: '🇫🇷' }, { code: '+39', flag: '🇮🇹' },
  { code: '+34', flag: '🇪🇸' }, { code: '+61', flag: '🇦🇺' }, { code: '+81', flag: '🇯🇵' },
  { code: '+91', flag: '🇮🇳' }, { code: '+55', flag: '🇧🇷' }, { code: '+86', flag: '🇨🇳' },
  { code: '+90', flag: '🇹🇷' }, { code: '+20', flag: '🇪🇬' },
]

const inputClass =
  'w-full px-3.5 py-2.5 bg-[--color-ink-850] border border-[rgba(255,255,255,.06)] rounded-sm ' +
  'text-[--color-bone-50] text-[13px] placeholder:text-[--color-bone-600] ' +
  'focus:outline-none focus:border-[--color-amber-400]/40 transition-all'

export function ProfilePage() {
  const { user, profile, signOut, refreshProfile } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const existingPhone = profile?.phone || ''
  const matchedCode = COUNTRY_CODES.find(c => existingPhone.startsWith(c.code))
  const defaultCode = matchedCode?.code || '+972'
  const defaultNumber = matchedCode ? existingPhone.slice(defaultCode.length) : existingPhone

  const [name, setName] = useState(profile?.full_name || '')
  const [title, setTitle] = useState(profile?.title || '')
  const [bio, setBio] = useState(profile?.bio || '')
  const [phoneCode, setPhoneCode] = useState(defaultCode)
  const [phoneNumber, setPhoneNumber] = useState(defaultNumber)
  const [avatarUrl] = useState(profile?.avatar_url || '')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [activeEvents, setActiveEvents] = useState<TravelCard[]>([])
  const [pastEvents, setPastEvents] = useState<TravelCard[]>([])
  const [orgReviews, setOrgReviews] = useState<Review[]>([])
  const [orgAvg, setOrgAvg] = useState<number | null>(null)

  useEffect(() => {
    if (!user) return
    const today = new Date().toISOString().split('T')[0]
    fetchMyCards(user.id).then(({ created, joined }) => {
      const all = [...created, ...joined]
      const seen = new Set<string>()
      const dedup = (arr: TravelCard[]) => arr.filter(c => { if (seen.has(c.id)) return false; seen.add(c.id); return true })
      const past = all.filter(c => c.eventDate && c.eventDate < today)
      seen.clear(); setPastEvents(dedup(past))
      seen.clear()
      const active = all.filter(c => !c.eventDate || c.eventDate >= today)
      setActiveEvents(dedup(active))
    })
    fetchOrganizerReviews(user.id).then(({ reviews, average }) => {
      setOrgReviews(reviews)
      setOrgAvg(average)
    })
  }, [user])

  if (!user || !profile) {
    router.push(`/${locale}/auth`)
    return null
  }

  const initials = name.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      let finalAvatarUrl = avatarUrl
      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop()
        const path = `avatars/${user.id}.${ext}`
        const { error: uploadErr } = await supabase.storage
          .from('card-images').upload(path, avatarFile, { upsert: true })
        if (!uploadErr) {
          const { data } = supabase.storage.from('card-images').getPublicUrl(path)
          finalAvatarUrl = data.publicUrl
        }
      }

      const { error } = await supabase.from('profiles').update({
        full_name: name.trim(),
        phone: phoneNumber ? `${phoneCode}${phoneNumber}` : null,
        avatar_url: finalAvatarUrl || null,
        title: title.trim() || null,
        bio: bio.trim() || null,
      }).eq('id', user.id)

      if (error) throw error
      await refreshProfile()
      toast('הפרופיל עודכן בהצלחה', 'success')
    } catch {
      toast('שגיאה בעדכון הפרופיל', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push(`/${locale}`)
  }

  const displayAvatar = avatarPreview || avatarUrl

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="max-w-2xl mx-auto px-4 sm:px-8">
        {/* Back */}
        <button onClick={() => router.back()}
          className="flex items-center gap-2 mb-10 group
                     font-mono text-[11px] tracking-[0.18em] uppercase
                     text-[--color-bone-400] hover:text-[--color-amber-400] transition-colors link-underline">
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" strokeWidth={2} />
          back
        </button>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-12"
        >
          {/* Header */}
          <div className="flex items-start gap-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-full overflow-hidden grid place-items-center
                              bg-[--color-ink-800] border border-[--color-amber-400]/30
                              text-[--color-bone-200] font-display text-2xl">
                {displayAvatar
                  ? <img src={displayAvatar} alt={name} className="w-full h-full object-cover" />
                  : initials}
              </div>
              <button onClick={() => avatarInputRef.current?.click()}
                className="absolute -bottom-1 -end-1 w-7 h-7 rounded-full grid place-items-center
                           bg-[--color-amber-400] text-[--color-amber-ink] hover:bg-[--color-amber-500] transition-all
                           shadow-[0_4px_16px_rgba(251,191,36,.25)]">
                <Camera className="w-3.5 h-3.5" strokeWidth={2.5} />
              </button>
              <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>
            <div className="flex-1 min-w-0 pt-1">
              <div className="eyebrow mb-1.5">— your profile</div>
              <h1 className="headline text-[--color-bone-50] text-3xl">{profile.full_name || 'משתמש'}</h1>
              <p className="font-mono text-[11px] text-[--color-bone-400] mt-1 truncate">{user.email}</p>
            </div>
          </div>

          {/* Form */}
          <section className="space-y-5">
            <header className="flex items-center gap-3 pb-3 border-b border-[--color-ink-800]">
              <span className="w-6 h-px bg-[--color-amber-400]" />
              <h2 className="eyebrow">— edit details</h2>
            </header>

            <Field icon={<User className="w-3 h-3" strokeWidth={2} />} label="שם מלא">
              <input value={name} onChange={e => setName(e.target.value)}
                className={inputClass} placeholder="ישראל ישראלי" />
            </Field>

            <Field icon={<Briefcase className="w-3 h-3" strokeWidth={2} />} label="כותרת">
              <input value={title} onChange={e => setTitle(e.target.value)}
                placeholder="למשל: מדריך גלישה, מאמן ריצה..."
                className={inputClass} />
            </Field>

            <Field icon={<FileText className="w-3 h-3" strokeWidth={2} />} label="אודות">
              <textarea value={bio} onChange={e => setBio(e.target.value)}
                placeholder="ספר קצת על עצמך, הניסיון שלך, מה אתה אוהב..."
                rows={3}
                className={`${inputClass} resize-none`} />
            </Field>

            <Field icon={<Mail className="w-3 h-3" strokeWidth={2} />} label="אימייל">
              <div className="w-full px-3.5 py-2.5 bg-[--color-ink-900] border border-[rgba(255,255,255,.04)] rounded-sm
                              text-[--color-bone-400] font-mono text-[12px]" dir="ltr">
                {user.email}
              </div>
            </Field>

            <Field icon={<Phone className="w-3 h-3" strokeWidth={2} />} label="טלפון">
              <div className="flex gap-2">
                <select value={phoneCode} onChange={e => setPhoneCode(e.target.value)}
                  className="w-24 px-2.5 py-2.5 bg-[--color-ink-850] border border-[rgba(255,255,255,.06)] rounded-sm
                             text-[--color-bone-50] text-[12px] font-mono focus:outline-none focus:border-[--color-amber-400]/40 transition-all"
                  dir="ltr">
                  {COUNTRY_CODES.map(c => (
                    <option key={c.code} value={c.code} className="bg-[--color-ink-850]">{c.flag} {c.code}</option>
                  ))}
                </select>
                <input value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)}
                  dir="ltr" placeholder="050-0000000"
                  className={`${inputClass} flex-1`} />
              </div>
            </Field>

            <button onClick={handleSave} disabled={saving}
              className="w-full py-3 mt-2 rounded-sm
                         font-mono text-[11px] tracking-[0.2em] uppercase font-semibold
                         bg-[--color-amber-400] text-[--color-amber-ink] hover:bg-[--color-amber-500]
                         transition-all shadow-[0_8px_28px_rgba(251,191,36,.18)]
                         disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" strokeWidth={2.5} />}
              שמור שינויים
            </button>
          </section>

          {/* Active events */}
          {activeEvents.length > 0 && (
            <section className="space-y-4">
              <header className="flex items-center gap-3 pb-3 border-b border-[--color-ink-800]">
                <span className="w-6 h-px bg-[--color-amber-400]" />
                <h2 className="eyebrow">— active events <span className="text-[--color-bone-600] tabular-nums">{String(activeEvents.length).padStart(2, '0')}</span></h2>
              </header>
              <div className="space-y-1.5">
                {activeEvents.map(card => <ProfileEventRow key={card.id} card={card} locale={locale} />)}
              </div>
            </section>
          )}

          {/* Past events */}
          {pastEvents.length > 0 && (
            <section className="space-y-4">
              <header className="flex items-center gap-3 pb-3 border-b border-[--color-ink-800]">
                <span className="w-6 h-px bg-[--color-bone-400]" />
                <h2 className="eyebrow">— past events <span className="text-[--color-bone-600] tabular-nums">{String(pastEvents.length).padStart(2, '0')}</span></h2>
              </header>
              <div className="space-y-1.5">
                {pastEvents.map(card => <ProfileEventRow key={card.id} card={card} locale={locale} muted />)}
              </div>
            </section>
          )}

          {/* Organizer reviews */}
          {orgReviews.length > 0 && (
            <section className="space-y-4">
              <header className="flex items-center justify-between pb-3 border-b border-[--color-ink-800]">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-px bg-[--color-amber-400]" />
                  <h2 className="eyebrow">— reviews as organizer</h2>
                </div>
                {orgAvg && (
                  <span className="font-mono text-[11px] text-[--color-amber-400] tabular-nums">
                    ★ {orgAvg.toFixed(1)}
                  </span>
                )}
              </header>
              <div className="space-y-3">
                {orgReviews.map(r => (
                  <div key={r.id} className="p-4 rounded-sm border border-[rgba(255,255,255,.05)] space-y-2.5 bg-[--color-ink-900]">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-[--color-bone-400]">{r.card_title}</span>
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star key={i} className={cn('w-3 h-3',
                            i < (r.organizer_rating || 0) ? 'text-[--color-amber-400] fill-[--color-amber-400]' : 'text-[--color-ink-700]'
                          )} />
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full overflow-hidden grid place-items-center bg-[--color-ink-800] text-[10px] font-mono text-[--color-bone-200] border border-[--color-ink-700]">
                        {r.reviewer_avatar
                          ? <img src={r.reviewer_avatar} alt={r.reviewer_name} className="w-full h-full object-cover" />
                          : r.reviewer_name[0]?.toUpperCase()}
                      </div>
                      <span className="text-[12px] text-[--color-bone-200]">{r.reviewer_name}</span>
                    </div>
                    {r.comment && (
                      <p className="text-[13px] text-[--color-bone-200] leading-relaxed border-s-2 border-[--color-amber-400]/30 ps-3 italic">
                        &ldquo;{r.comment}&rdquo;
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Sign out */}
          <button onClick={handleSignOut}
            className="w-full py-2.5 rounded-sm border border-[--color-coral-500]/20
                       font-mono text-[11px] tracking-[0.18em] uppercase
                       text-[--color-coral-400] hover:bg-[--color-coral-500]/10 hover:border-[--color-coral-500]/40
                       transition-all flex items-center justify-center gap-2">
            <LogOut className="w-3.5 h-3.5" strokeWidth={2} />
            sign out
          </button>
        </motion.div>
      </div>
    </div>
  )
}

function Field({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="eyebrow flex items-center gap-1.5">
        <span className="text-[--color-amber-400]">{icon}</span>
        {label}
      </label>
      {children}
    </div>
  )
}

function ProfileEventRow({ card, locale, muted = false }: { card: TravelCard; locale: string; muted?: boolean }) {
  const router = useRouter()
  return (
    <button
      onClick={() => router.push(`/${locale}/cards/${card.id}`)}
      className={cn(
        'w-full text-start px-4 py-3 rounded-sm border transition-all group',
        muted
          ? 'border-[rgba(255,255,255,.04)] hover:border-[rgba(255,255,255,.1)] opacity-80 hover:opacity-100'
          : 'border-[rgba(255,255,255,.05)] hover:border-[--color-amber-400]/30'
      )}
    >
      <div className="flex items-center gap-2 text-[13px]">
        <span className="font-display text-[--color-bone-400]" aria-hidden>{getCardTypeIcon(card.type)}</span>
        <span className="font-display text-[--color-bone-50] truncate group-hover:text-[--color-amber-400] transition-colors">
          {card.title}
        </span>
      </div>
      <div className="flex items-center gap-3 mt-1 font-mono text-[10px] tracking-[0.12em] uppercase text-[--color-bone-400]">
        <span className="flex items-center gap-1"><MapPin className="w-2.5 h-2.5" strokeWidth={2} />{card.location.city}</span>
        {card.eventDate && <span>{new Date(card.eventDate).toLocaleDateString()}</span>}
      </div>
    </button>
  )
}
