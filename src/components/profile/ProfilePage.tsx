'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '@/lib/auth-context'
import { useToast } from '@/components/ui/Toast'
import { supabase } from '@/lib/supabase'
import { Camera, Save, Loader2, LogOut, Mail, Phone, User, ArrowLeft, Star, MapPin, Briefcase, FileText, Calendar } from 'lucide-react'
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
  'w-full px-3.5 py-2.5 rounded-xl ' +
  'bg-[--color-night-950] border border-[--color-mist-500] ' +
  'text-[--color-mist-50] text-[13px] placeholder:text-[--color-mist-500] ' +
  'focus:outline-none focus:border-[--color-coral-500]/40 transition-all'

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
        <button onClick={() => router.back()}
          className="flex items-center gap-2 mb-10 group
                     text-[12px] font-medium
                     text-[--color-mist-300] hover:text-[--color-coral-400] transition-colors link-underline">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" strokeWidth={2} />
          back
        </button>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-12"
        >
          {/* Avatar header */}
          <div className="flex items-start gap-5">
            <div className="relative glow-ring rounded-full">
              <div className="w-24 h-24 rounded-full overflow-hidden grid place-items-center
                              bg-gradient-to-br from-[--color-coral-500] via-[--color-violet-500] to-[--color-cyan-400]
                              text-white font-display text-3xl font-semibold">
                {displayAvatar
                  ? <img src={displayAvatar} alt={name} className="w-full h-full object-cover" />
                  : initials}
              </div>
              <button onClick={() => avatarInputRef.current?.click()}
                className="absolute -bottom-1 -end-1 w-9 h-9 rounded-full grid place-items-center
                           btn-primary transition-transform hover:scale-110">
                <Camera className="w-4 h-4 relative z-[1]" strokeWidth={2.5} />
              </button>
              <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>
            <div className="flex-1 min-w-0 pt-1">
              <div className="eyebrow mb-1.5">— your profile</div>
              <h1 className="headline text-[--color-mist-50] text-3xl">{profile.full_name || 'משתמש'}</h1>
              <p className="font-mono text-[11px] text-[--color-mist-400] mt-1 truncate">{user.email}</p>
            </div>
          </div>

          {/* Form section */}
          <section className="space-y-5">
            <header className="flex items-center gap-3">
              <span className="w-8 h-px bg-gradient-to-r from-[--color-coral-500] to-transparent" />
              <h2 className="eyebrow">— edit details</h2>
            </header>

            <Field icon={<User className="w-3 h-3" strokeWidth={2} />} label="שם מלא">
              <input value={name} onChange={e => setName(e.target.value)}
                className={inputClass} placeholder="ישראל ישראלי" />
            </Field>

            <Field icon={<Briefcase className="w-3 h-3" strokeWidth={2} />} label="כותרת">
              <input value={title} onChange={e => setTitle(e.target.value)}
                placeholder="למשל: מדריך גלישה, מאמן ריצה..." className={inputClass} />
            </Field>

            <Field icon={<FileText className="w-3 h-3" strokeWidth={2} />} label="אודות">
              <textarea value={bio} onChange={e => setBio(e.target.value)}
                placeholder="ספר קצת על עצמך, הניסיון שלך, מה אתה אוהב..."
                rows={3} className={`${inputClass} resize-none`} />
            </Field>

            <Field icon={<Mail className="w-3 h-3" strokeWidth={2} />} label="אימייל">
              <div className="w-full px-3.5 py-2.5 rounded-xl bg-[--color-night-950] border border-[--color-mist-500]
                              text-[--color-mist-400] font-mono text-[13px]" dir="ltr">
                {user.email}
              </div>
            </Field>

            <Field icon={<Phone className="w-3 h-3" strokeWidth={2} />} label="טלפון">
              <div className="flex gap-2">
                <select value={phoneCode} onChange={e => setPhoneCode(e.target.value)}
                  className="w-24 px-2.5 py-2.5 bg-[--color-night-950] border border-[--color-mist-500] rounded-xl
                             text-[--color-mist-50] text-[12px] font-mono focus:outline-none focus:border-[--color-coral-500]/40 transition-all"
                  dir="ltr">
                  {COUNTRY_CODES.map(c => (
                    <option key={c.code} value={c.code} className="bg-[--color-night-900]">{c.flag} {c.code}</option>
                  ))}
                </select>
                <input value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)}
                  dir="ltr" placeholder="050-0000000" className={`${inputClass} flex-1`} />
              </div>
            </Field>

            <button onClick={handleSave} disabled={saving}
              className="btn-primary w-full py-3.5 mt-2 rounded-xl text-[13px] font-semibold
                         disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin relative z-[1]" /> : <Save className="w-4 h-4 relative z-[1]" strokeWidth={2.5} />}
              <span className="relative z-[1]">שמור שינויים</span>
            </button>
          </section>

          {activeEvents.length > 0 && (
            <section className="space-y-4">
              <header className="flex items-center gap-3">
                <span className="w-8 h-px bg-gradient-to-r from-[--color-emerald-400] to-transparent" />
                <h2 className="eyebrow">
                  — active events <span className="text-[--color-emerald-400] tabular-nums">{activeEvents.length}</span>
                </h2>
              </header>
              <div className="space-y-1.5">
                {activeEvents.map(card => <ProfileEventRow key={card.id} card={card} locale={locale} />)}
              </div>
            </section>
          )}

          {pastEvents.length > 0 && (
            <section className="space-y-4">
              <header className="flex items-center gap-3">
                <span className="w-8 h-px bg-gradient-to-r from-[--color-mist-400] to-transparent" />
                <h2 className="eyebrow">— past events <span className="text-[--color-mist-300] tabular-nums">{pastEvents.length}</span></h2>
              </header>
              <div className="space-y-1.5">
                {pastEvents.map(card => <ProfileEventRow key={card.id} card={card} locale={locale} muted />)}
              </div>
            </section>
          )}

          {orgReviews.length > 0 && (
            <section className="space-y-4">
              <header className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-px bg-gradient-to-r from-[--color-amber-400] to-transparent" />
                  <h2 className="eyebrow">— reviews as organizer</h2>
                </div>
                {orgAvg && (
                  <span className="font-mono text-[12px] text-[--color-amber-400] tabular-nums font-semibold">
                    ★ {orgAvg.toFixed(1)}
                  </span>
                )}
              </header>
              <div className="space-y-3">
                {orgReviews.map(r => (
                  <div key={r.id} className="glass rounded-xl p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-[--color-mist-400]">{r.card_title}</span>
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }, (_, i) => {
                          const filled = i < (r.organizer_rating || 0)
                          return (
                            <Star
                              key={i}
                              className="w-3 h-3"
                              style={{
                                color: filled ? '#fbbf24' : 'rgba(255,255,255,0.18)',
                                fill: filled ? '#fbbf24' : 'transparent',
                              }}
                            />
                          )
                        })}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full overflow-hidden grid place-items-center bg-gradient-to-br from-[--color-violet-500] to-[--color-cyan-400] text-white text-[10px] font-mono">
                        {r.reviewer_avatar
                          ? <img src={r.reviewer_avatar} alt={r.reviewer_name} className="w-full h-full object-cover" />
                          : r.reviewer_name[0]?.toUpperCase()}
                      </div>
                      <span className="text-[12px] text-[--color-mist-200]">{r.reviewer_name}</span>
                    </div>
                    {r.comment && (
                      <p className="text-[13px] text-[--color-mist-200] leading-relaxed border-s-2 border-[--color-coral-500]/30 ps-3 italic">
                        &ldquo;{r.comment}&rdquo;
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          <button onClick={handleSignOut}
            className="w-full py-2.5 rounded-xl border border-[--color-rose-500]/20
                       text-[12px] font-semibold
                       text-[--color-rose-400] hover:bg-[--color-rose-500]/10 hover:border-[--color-rose-500]/40
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
        <span className="text-[--color-coral-400]">{icon}</span>
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
        'w-full text-start px-4 py-3 rounded-xl border transition-all group',
        muted
          ? 'border-[--color-mist-500] hover:border-[--color-mist-400] opacity-80 hover:opacity-100'
          : 'border-[--color-mist-500] hover:border-[--color-coral-500]/30 hover:bg-[--color-night-900]'
      )}
    >
      <div className="flex items-center gap-2 text-[13px]">
        <span className="text-base" aria-hidden>{getCardTypeIcon(card.type)}</span>
        <span className="font-display font-semibold text-[--color-mist-50] truncate group-hover:text-[--color-coral-300] transition-colors">
          {card.title}
        </span>
      </div>
      <div className="flex items-center gap-3 mt-1 text-[11px] font-mono text-[--color-mist-400]">
        <span className="flex items-center gap-1"><MapPin className="w-2.5 h-2.5" strokeWidth={2} />{card.location.city}</span>
        {card.eventDate && <span className="flex items-center gap-1"><Calendar className="w-2.5 h-2.5" strokeWidth={2} />{new Date(card.eventDate).toLocaleDateString()}</span>}
      </div>
    </button>
  )
}
