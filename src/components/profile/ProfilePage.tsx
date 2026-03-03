'use client'
import { useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '@/lib/auth-context'
import { useToast } from '@/components/ui/Toast'
import { supabase } from '@/lib/supabase'
import { Camera, Save, Loader2, LogOut, Mail, Phone, User, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

const COUNTRY_CODES = [
  { code: '+972', flag: '🇮🇱' }, { code: '+1', flag: '🇺🇸' }, { code: '+44', flag: '🇬🇧' },
  { code: '+49', flag: '🇩🇪' }, { code: '+33', flag: '🇫🇷' }, { code: '+39', flag: '🇮🇹' },
  { code: '+34', flag: '🇪🇸' }, { code: '+61', flag: '🇦🇺' }, { code: '+81', flag: '🇯🇵' },
  { code: '+91', flag: '🇮🇳' }, { code: '+55', flag: '🇧🇷' }, { code: '+86', flag: '🇨🇳' },
  { code: '+90', flag: '🇹🇷' }, { code: '+20', flag: '🇪🇬' },
]

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
  const [phoneCode, setPhoneCode] = useState(defaultCode)
  const [phoneNumber, setPhoneNumber] = useState(defaultNumber)
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

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

      // Upload avatar if changed
      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop()
        const path = `avatars/${user.id}.${ext}`
        const { error: uploadErr } = await supabase.storage
          .from('card-images')
          .upload(path, avatarFile, { upsert: true })
        if (!uploadErr) {
          const { data } = supabase.storage.from('card-images').getPublicUrl(path)
          finalAvatarUrl = data.publicUrl
        }
      }

      const { error } = await supabase.from('profiles').update({
        full_name: name.trim(),
        phone: phoneNumber ? `${phoneCode}${phoneNumber}` : null,
        avatar_url: finalAvatarUrl || null,
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
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-lg mx-auto px-4">

        {/* Back */}
        <button onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors mb-6 group text-sm">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          חזור
        </button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

          {/* Avatar */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className={cn(
                'w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold text-white',
                'bg-gradient-to-br from-teal-500 to-cyan-600 shadow-xl shadow-teal-500/20 overflow-hidden'
              )}>
                {displayAvatar
                  ? <img src={displayAvatar} alt={name} className="w-full h-full object-cover" />
                  : initials
                }
              </div>
              <button
                onClick={() => avatarInputRef.current?.click()}
                className="absolute bottom-0 end-0 w-8 h-8 rounded-full bg-teal-500 hover:bg-teal-400 transition-colors flex items-center justify-center shadow-lg"
              >
                <Camera className="w-4 h-4 text-white" />
              </button>
              <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>
            <div className="text-center">
              <h1 className="text-xl font-bold text-white">{profile.full_name || 'משתמש'}</h1>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>

          {/* Form card */}
          <div className="bg-gray-900/60 border border-white/8 rounded-2xl p-6 space-y-5 backdrop-blur-sm">

            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> שם מלא
              </label>
              <input
                value={name} onChange={e => setName(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800/60 border border-white/8 rounded-xl text-white text-sm
                           placeholder:text-gray-600 focus:outline-none focus:border-teal-500/50 transition-all"
                placeholder="ישראל ישראלי"
              />
            </div>

            {/* Email (read-only) */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" /> אימייל
              </label>
              <div className="w-full px-4 py-3 bg-gray-800/30 border border-white/5 rounded-xl text-gray-500 text-sm" dir="ltr">
                {user.email}
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" /> טלפון
              </label>
              <div className="flex gap-2">
                <select value={phoneCode} onChange={e => setPhoneCode(e.target.value)}
                  className="w-24 px-3 py-3 bg-gray-800/60 border border-white/8 rounded-xl text-white text-sm
                             focus:outline-none focus:border-teal-500/50 transition-all" dir="ltr">
                  {COUNTRY_CODES.map(c => (
                    <option key={c.code} value={c.code} className="bg-gray-900">{c.flag} {c.code}</option>
                  ))}
                </select>
                <input value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)}
                  dir="ltr" placeholder="050-0000000"
                  className="flex-1 px-4 py-3 bg-gray-800/60 border border-white/8 rounded-xl text-white text-sm
                             placeholder:text-gray-600 focus:outline-none focus:border-teal-500/50 transition-all" />
              </div>
            </div>

            {/* Save */}
            <button onClick={handleSave} disabled={saving}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold
                         hover:from-teal-400 hover:to-cyan-400 transition-all shadow-lg shadow-teal-500/20
                         disabled:opacity-50 flex items-center justify-center gap-2 text-sm">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              שמור שינויים
            </button>
          </div>

          {/* Sign out */}
          <button onClick={handleSignOut}
            className="w-full py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 border border-red-500/20
                       hover:border-red-500/30 transition-all text-sm flex items-center justify-center gap-2">
            <LogOut className="w-4 h-4" />
            התנתקות
          </button>

        </motion.div>
      </div>
    </div>
  )
}
