'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { Eye, EyeOff, Loader2, Mail, Lock, User, Phone, ChevronDown, Compass, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

const COUNTRY_CODES = [
  { code: '+972', flag: '🇮🇱', name: 'IL' },
  { code: '+1',   flag: '🇺🇸', name: 'US' },
  { code: '+44',  flag: '🇬🇧', name: 'UK' },
  { code: '+49',  flag: '🇩🇪', name: 'DE' },
  { code: '+33',  flag: '🇫🇷', name: 'FR' },
  { code: '+39',  flag: '🇮🇹', name: 'IT' },
  { code: '+34',  flag: '🇪🇸', name: 'ES' },
  { code: '+31',  flag: '🇳🇱', name: 'NL' },
  { code: '+61',  flag: '🇦🇺', name: 'AU' },
  { code: '+81',  flag: '🇯🇵', name: 'JP' },
  { code: '+91',  flag: '🇮🇳', name: 'IN' },
  { code: '+55',  flag: '🇧🇷', name: 'BR' },
  { code: '+86',  flag: '🇨🇳', name: 'CN' },
  { code: '+90',  flag: '🇹🇷', name: 'TR' },
  { code: '+20',  flag: '🇪🇬', name: 'EG' },
]

const inputClass =
  'w-full ps-11 pe-4 py-3 rounded-xl ' +
  'bg-white/[0.03] border border-white/[0.08] ' +
  'text-[--color-mist-50] text-[14px] placeholder:text-[--color-mist-500] ' +
  'focus:outline-none focus:border-[--color-coral-500]/50 focus:bg-white/[0.05] ' +
  'focus: ' +
  'transition-all duration-300'

export function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register' | 'reset'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [phoneCode, setPhoneCode] = useState('+972')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resetSent, setResetSent] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [isRecovery, setIsRecovery] = useState(false)
  const [passwordUpdated, setPasswordUpdated] = useState(false)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setMode('reset')
        setIsRecovery(true)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string
  const t = useTranslations('auth')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (mode === 'reset') {
      if (isRecovery) {
        const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
        if (updateError) { setError(updateError.message); setLoading(false); return }
        setPasswordUpdated(true)
        setLoading(false)
        setTimeout(() => router.push(`/${locale}`), 2000)
        return
      }
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/${locale}/auth`,
      })
      if (resetError) { setError(resetError.message); setLoading(false); return }
      setResetSent(true)
      setLoading(false)
      return
    }

    if (mode === 'register') {
      const fullPhone = `${phoneCode}${phoneNumber}`
      const { error: signUpError } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: fullName, phone: fullPhone } },
      })
      if (signUpError) { setError(signUpError.message); setLoading(false); return }
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) { setError(signInError.message); setLoading(false); return }
    }

    setLoading(false)
    router.push(`/${locale}`)
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* ── Left: Vivid hero panel (desktop) ── */}
      <div className="hidden lg:flex relative overflow-hidden">
        {/* Layered gradient orbs */}
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full
                        bg-gradient-to-br from-[--color-coral-500] to-[--color-violet-500] blur-[120px] opacity-50" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full
                        bg-gradient-to-br from-[--color-violet-500] to-[--color-cyan-400] blur-[120px] opacity-40" />

        <div className="relative w-full p-12 xl:p-16 flex flex-col justify-between z-10">
          <Link href={`/${locale}`} className="flex items-center gap-2.5 group w-fit">
            <div className="w-10 h-10 grid place-items-center rounded-xl
                            bg-gradient-to-br from-[--color-coral-500] via-[--color-violet-500] to-[--color-cyan-400]
                            transition-transform duration-500 group-hover:rotate-[-8deg]">
              <Compass className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <div className="leading-none">
              <div className="font-display text-[--color-mist-50] text-base font-semibold tracking-tight">GoTogether</div>
              <div className="font-mono text-[9px] text-[--color-mist-400] tracking-[0.18em] uppercase mt-0.5">find your crew</div>
            </div>
          </Link>

          <div className="space-y-7 max-w-md">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full
                            bg-white/[0.04] border border-white/[0.08] backdrop-blur-md
                            text-[11px] font-mono text-[--color-mist-200] tracking-wide">
              <Sparkles className="w-3 h-3 text-[--color-amber-400]" strokeWidth={2.5} />
              <span>built for adventurers</span>
            </div>

            <h2 className="headline-xl text-[--color-mist-50] text-6xl xl:text-7xl">
              Travel<br />
              <span className="text-gradient">together.</span>
            </h2>
            <p className="text-[--color-mist-300] text-lg leading-relaxed max-w-sm">
              Find your crew for the next trip. Hike, eat, ride — but never alone.
            </p>

            {/* feature dots */}
            <div className="space-y-3 pt-4">
              {[
                { c: 'coral', l: 'Discover events near you' },
                { c: 'violet', l: 'Join travelers worldwide' },
                { c: 'cyan', l: 'Photos, reviews, real connections' },
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-3 text-[13px] text-[--color-mist-200]">
                  <span className={cn(
                    'w-1.5 h-1.5 rounded-full',
                    f.c === 'coral'  && 'bg-[--color-coral-500]',
                    f.c === 'violet' && 'bg-[--color-violet-400]',
                    f.c === 'cyan'   && 'bg-[--color-cyan-400]',
                  )} />
                  {f.l}
                </div>
              ))}
            </div>
          </div>

          <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-[--color-mist-400]">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
        </div>
      </div>

      {/* ── Right: form ── */}
      <div className="flex items-center justify-center px-4 sm:px-12 py-16 sm:py-24">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-sm"
        >
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-10">
            <div className="inline-flex items-center gap-2.5">
              <div className="w-10 h-10 grid place-items-center rounded-xl
                              bg-gradient-to-br from-[--color-coral-500] via-[--color-violet-500] to-[--color-cyan-400]">
                <Compass className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <div className="font-display text-[--color-mist-50] text-base font-semibold tracking-tight">GoTogether</div>
            </div>
          </div>

          <div className="space-y-2 mb-8">
            <AnimatePresence mode="wait">
              <motion.h1
                key={mode}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="headline text-[--color-mist-50] text-4xl"
              >
                {mode === 'reset' ? t('resetPassword') : mode === 'login' ? t('welcomeBack') : t('joinCommunity')}
              </motion.h1>
            </AnimatePresence>
            <p className="text-[--color-mist-400] text-[13px]">
              {mode === 'reset' ? 'we will send you a magic link' : mode === 'login' ? 'sign in to continue your journey' : 'create your account in seconds'}
            </p>
          </div>

          {/* Tabs */}
          {mode !== 'reset' && (
            <div className="flex gap-1 p-1 mb-6 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              {(['login', 'register'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setError('') }}
                  className={cn(
                    'flex-1 py-2 rounded-lg text-[12px] font-semibold transition-all relative',
                    mode === m
                      ? 'bg-[--color-coral-500] text-[--color-night-1000]'
                      : 'text-[--color-mist-300] hover:text-[--color-mist-50]'
                  )}
                >
                  {m === 'login' ? t('loginTab') : t('registerTab')}
                </button>
              ))}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {mode === 'register' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.22 }}
                  className="space-y-4 overflow-hidden"
                >
                  <div className="space-y-1.5">
                    <label className="eyebrow">{t('fullNameLabel')}</label>
                    <div className="relative">
                      <User className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[--color-mist-400] pointer-events-none" strokeWidth={2} />
                      <input value={fullName} onChange={(e) => setFullName(e.target.value)}
                        placeholder={t('fullNamePlaceholder')} required className={inputClass} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="eyebrow">{t('phoneLabel')}</label>
                    <div className="flex gap-2">
                      <div className="relative">
                        <select value={phoneCode} onChange={(e) => setPhoneCode(e.target.value)}
                          className="appearance-none ps-3 pe-7 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl
                                     text-[--color-mist-50] text-[13px] font-mono focus:outline-none focus:border-[--color-coral-500]/50 cursor-pointer"
                          dir="ltr">
                          {COUNTRY_CODES.map((c) => (
                            <option key={c.code} value={c.code} className="bg-[--color-night-900]">
                              {c.flag} {c.code}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute end-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[--color-mist-400] pointer-events-none" />
                      </div>
                      <div className="relative flex-1">
                        <Phone className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[--color-mist-400] pointer-events-none" strokeWidth={2} />
                        <input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder={t('phonePlaceholder')} required dir="ltr" className={inputClass} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {!isRecovery && (
              <div className="space-y-1.5">
                <label className="eyebrow">{t('emailLabel')}</label>
                <div className="relative">
                  <Mail className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[--color-mist-400] pointer-events-none" strokeWidth={2} />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('emailPlaceholder')} required dir="ltr" className={inputClass} />
                </div>
              </div>
            )}

            {!isRecovery && mode !== 'reset' && (
              <div className="space-y-1.5">
                <label className="eyebrow">{t('passwordLabel')}</label>
                <div className="relative">
                  <Lock className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[--color-mist-400] pointer-events-none" strokeWidth={2} />
                  <input type={showPass ? 'text' : 'password'} value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('passwordPlaceholder')} required minLength={6} dir="ltr"
                    className={`${inputClass} pe-12`} />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute end-3.5 top-1/2 -translate-y-1/2 text-[--color-mist-400] hover:text-[--color-mist-50] transition-colors">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-3 rounded-xl bg-[--color-rose-500]/10 border border-[--color-rose-500]/20 text-[--color-rose-400] text-[13px]">
                    {error}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {mode === 'login' && (
              <div className="text-center">
                <button type="button" onClick={() => { setMode('reset'); setError('') }}
                  className="text-[12px] text-[--color-mist-400] hover:text-[--color-coral-400] transition-colors link-underline">
                  {t('forgotPassword')}
                </button>
              </div>
            )}

            {mode === 'reset' && isRecovery && !passwordUpdated && (
              <div className="space-y-1.5">
                <label className="eyebrow">סיסמה חדשה</label>
                <div className="relative">
                  <Lock className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[--color-mist-400] pointer-events-none" strokeWidth={2} />
                  <input type={showPass ? 'text' : 'password'} value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="לפחות 6 תווים" required minLength={6} dir="ltr"
                    className={`${inputClass} pe-12`} />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute end-3.5 top-1/2 -translate-y-1/2 text-[--color-mist-400] hover:text-[--color-mist-50] transition-colors">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {passwordUpdated && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="p-4 rounded-xl bg-[--color-emerald-500]/10 border border-[--color-emerald-500]/20 text-[--color-emerald-400] text-[13px] text-center font-medium">
                ✓ הסיסמה עודכנה — מעביר אותך
              </motion.div>
            )}

            {mode === 'reset' && !isRecovery && resetSent && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="p-4 rounded-xl bg-[--color-emerald-500]/10 border border-[--color-emerald-500]/20 text-[--color-emerald-400] text-[13px] text-center font-medium">
                ✉ {t('resetSent')}
              </motion.div>
            )}

            {!resetSent && !passwordUpdated && (
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3.5 mt-2 rounded-xl text-[13px] font-semibold
                           disabled:opacity-50 disabled:cursor-not-allowed
                           flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin relative z-[1]" />}
                <span className="relative z-[1]">
                  {mode === 'login' ? t('signInBtn') : mode === 'reset' ? t('resetBtn') : t('createAccountBtn')}
                </span>
              </button>
            )}

            {mode === 'reset' && (
              <button type="button" onClick={() => { setMode('login'); setResetSent(false); setError('') }}
                className="w-full text-center text-[12px] text-[--color-mist-400] hover:text-[--color-coral-400] transition-colors">
                ← {t('backToLogin')}
              </button>
            )}
          </form>
        </motion.div>
      </div>
    </div>
  )
}
