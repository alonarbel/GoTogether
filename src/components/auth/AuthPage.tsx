'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { Eye, EyeOff, Loader2, Mail, Lock, User, Phone, ChevronDown } from 'lucide-react'
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
  'w-full ps-10 pe-4 py-3 bg-[--color-ink-850] border border-[rgba(255,255,255,.06)] rounded-sm ' +
  'text-[--color-bone-50] text-[13px] placeholder:text-[--color-bone-600] ' +
  'focus:outline-none focus:border-[--color-amber-400]/40 focus:bg-[--color-ink-800] ' +
  'transition-all duration-200'

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
    <div className="min-h-screen grid lg:grid-cols-5">
      {/* ── Left: editorial side panel (desktop only) ── */}
      <div className="hidden lg:flex lg:col-span-2 relative overflow-hidden bg-[--color-ink-900] border-e border-[rgba(255,255,255,.04)]">
        {/* decorative ticket-stub edge */}
        <div className="absolute end-0 inset-y-0 flex flex-col items-center justify-around w-px"
             style={{ backgroundImage: 'repeating-linear-gradient(to bottom, rgba(255,255,255,.08) 0 6px, transparent 6px 12px)' }} />

        <div className="relative w-full p-12 xl:p-16 flex flex-col justify-between">
          <div className="space-y-8">
            <Link href={`/${locale}`}>
              <div className="flex items-center gap-2.5 group cursor-pointer">
                <div className="w-10 h-10 grid place-items-center
                                rounded-sm border border-[--color-amber-400]/40 bg-[--color-amber-400]/5 corner-marks">
                  <span className="font-display text-[--color-amber-400] text-base translate-y-[1px]">G</span>
                </div>
                <div className="leading-none">
                  <div className="font-display text-[--color-bone-50] text-base tracking-tight">GoTogether</div>
                  <div className="eyebrow mt-1 text-[8.5px]">find your crew</div>
                </div>
              </div>
            </Link>

            <div className="space-y-5 mt-16">
              <div className="eyebrow text-[--color-amber-400]">— №1 issue · vol. {new Date().getFullYear()}</div>
              <h2 className="headline text-[--color-bone-50] text-5xl xl:text-6xl">
                Travel<br />
                <span className="text-[--color-amber-400]">together.</span>
              </h2>
              <p className="text-[--color-bone-200] text-base leading-relaxed max-w-sm">
                Find your crew for the next adventure. Hike, eat, explore — but never alone.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="h-px bg-gradient-to-r from-[--color-ink-700] via-[--color-amber-400]/40 to-transparent" />
            <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-[--color-bone-400]">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Right: form ── */}
      <div className="lg:col-span-3 flex items-center justify-center px-4 sm:px-8 py-16 sm:py-24">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-sm"
        >
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-10">
            <div className="inline-flex items-center gap-2.5 mb-3">
              <div className="w-10 h-10 grid place-items-center
                              rounded-sm border border-[--color-amber-400]/40 bg-[--color-amber-400]/5 corner-marks">
                <span className="font-display text-[--color-amber-400] text-base translate-y-[1px]">G</span>
              </div>
              <div className="font-display text-[--color-bone-50] text-base tracking-tight">GoTogether</div>
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-2 mb-8">
            <div className="eyebrow text-[--color-amber-400]">— {mode === 'reset' ? 'recovery' : mode === 'login' ? 'sign in' : 'create account'}</div>
            <AnimatePresence mode="wait">
              <motion.h1
                key={mode}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="headline text-[--color-bone-50] text-3xl"
              >
                {mode === 'reset' ? t('resetPassword') : mode === 'login' ? t('welcomeBack') : t('joinCommunity')}
              </motion.h1>
            </AnimatePresence>
          </div>

          {/* Tab switcher — login/register only */}
          {mode !== 'reset' && (
            <div className="flex border-b border-[--color-ink-800] mb-6">
              {(['login', 'register'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setError('') }}
                  className={cn(
                    'flex-1 pb-3 -mb-px font-mono text-[11px] tracking-[0.18em] uppercase transition-colors relative',
                    mode === m
                      ? 'text-[--color-amber-400]'
                      : 'text-[--color-bone-400] hover:text-[--color-bone-50]'
                  )}
                >
                  {m === 'login' ? t('loginTab') : t('registerTab')}
                  {mode === m && (
                    <motion.div
                      layoutId="auth-tab"
                      className="absolute inset-x-0 bottom-0 h-px bg-[--color-amber-400]"
                    />
                  )}
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
                  transition={{ duration: 0.2 }}
                  className="space-y-4 overflow-hidden"
                >
                  <div className="space-y-1.5">
                    <label className="eyebrow">{t('fullNameLabel')}</label>
                    <div className="relative">
                      <User className="absolute start-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[--color-bone-400] pointer-events-none" strokeWidth={2} />
                      <input value={fullName} onChange={(e) => setFullName(e.target.value)}
                        placeholder={t('fullNamePlaceholder')} required className={inputClass} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="eyebrow">{t('phoneLabel')}</label>
                    <div className="flex gap-2">
                      <div className="relative">
                        <select value={phoneCode} onChange={(e) => setPhoneCode(e.target.value)}
                          className="appearance-none ps-3 pe-7 py-3 bg-[--color-ink-850] border border-[rgba(255,255,255,.06)] rounded-sm
                                     text-[--color-bone-50] text-[13px] font-mono focus:outline-none focus:border-[--color-amber-400]/40 cursor-pointer"
                          dir="ltr">
                          {COUNTRY_CODES.map((c) => (
                            <option key={c.code} value={c.code} className="bg-[--color-ink-850]">
                              {c.flag} {c.code}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute end-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[--color-bone-400] pointer-events-none" />
                      </div>
                      <div className="relative flex-1">
                        <Phone className="absolute start-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[--color-bone-400] pointer-events-none" strokeWidth={2} />
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
                  <Mail className="absolute start-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[--color-bone-400] pointer-events-none" strokeWidth={2} />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('emailPlaceholder')} required dir="ltr" className={inputClass} />
                </div>
              </div>
            )}

            {!isRecovery && mode !== 'reset' && (
              <div className="space-y-1.5">
                <label className="eyebrow">{t('passwordLabel')}</label>
                <div className="relative">
                  <Lock className="absolute start-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[--color-bone-400] pointer-events-none" strokeWidth={2} />
                  <input type={showPass ? 'text' : 'password'} value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('passwordPlaceholder')} required minLength={6} dir="ltr"
                    className={`${inputClass} pe-11`} />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute end-3.5 top-1/2 -translate-y-1/2 text-[--color-bone-400] hover:text-[--color-bone-50] transition-colors p-0.5">
                    {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
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
                  <div className="p-3 rounded-sm bg-[--color-coral-500]/10 border border-[--color-coral-500]/20 text-[--color-coral-400] text-[12px] font-mono">
                    {error}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {mode === 'login' && (
              <div className="text-center">
                <button type="button" onClick={() => { setMode('reset'); setError('') }}
                  className="font-mono text-[10px] tracking-[0.16em] uppercase
                             text-[--color-bone-400] hover:text-[--color-amber-400] transition-colors link-underline">
                  {t('forgotPassword')}
                </button>
              </div>
            )}

            {mode === 'reset' && isRecovery && !passwordUpdated && (
              <div className="space-y-1.5">
                <label className="eyebrow">סיסמה חדשה</label>
                <div className="relative">
                  <Lock className="absolute start-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[--color-bone-400] pointer-events-none" strokeWidth={2} />
                  <input type={showPass ? 'text' : 'password'} value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="לפחות 6 תווים" required minLength={6} dir="ltr"
                    className={`${inputClass} pe-11`} />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute end-3.5 top-1/2 -translate-y-1/2 text-[--color-bone-400] hover:text-[--color-bone-50] transition-colors p-0.5">
                    {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            )}

            {passwordUpdated && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="p-4 rounded-sm bg-[--color-emerald-500]/10 border border-[--color-emerald-500]/20 text-[--color-emerald-400] text-[12px] font-mono text-center">
                ✓ הסיסמה עודכנה — מעביר אותך
              </motion.div>
            )}

            {mode === 'reset' && !isRecovery && resetSent && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="p-4 rounded-sm bg-[--color-emerald-500]/10 border border-[--color-emerald-500]/20 text-[--color-emerald-400] text-[12px] font-mono text-center">
                ✉ {t('resetSent')}
              </motion.div>
            )}

            {!resetSent && !passwordUpdated && (
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 mt-2 rounded-sm
                           font-mono text-[11px] tracking-[0.2em] uppercase font-semibold
                           bg-[--color-amber-400] text-[--color-amber-ink]
                           hover:bg-[--color-amber-500] active:scale-[0.99]
                           transition-all shadow-[0_8px_28px_rgba(251,191,36,.18)]
                           disabled:opacity-50 disabled:cursor-not-allowed
                           flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {mode === 'login' ? t('signInBtn') : mode === 'reset' ? t('resetBtn') : t('createAccountBtn')}
              </button>
            )}

            {mode === 'reset' && (
              <button type="button" onClick={() => { setMode('login'); setResetSent(false); setError('') }}
                className="w-full text-center font-mono text-[10px] tracking-[0.16em] uppercase
                           text-[--color-bone-400] hover:text-[--color-amber-400] transition-colors">
                ← {t('backToLogin')}
              </button>
            )}
          </form>
        </motion.div>
      </div>
    </div>
  )
}
