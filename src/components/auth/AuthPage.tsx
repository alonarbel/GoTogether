'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { Compass, Eye, EyeOff, Loader2, Mail, Lock, User, Phone, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

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
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string
  const t = useTranslations('auth')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (mode === 'reset') {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/${locale}/auth?mode=update-password`,
      })
      if (resetError) { setError(resetError.message); setLoading(false); return }
      setResetSent(true)
      setLoading(false)
      return
    }

    if (mode === 'register') {
      const fullPhone = `${phoneCode}${phoneNumber}`
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
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
    <div className="min-h-screen flex items-center justify-center px-4 pt-16 pb-8">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-teal-950/20 to-gray-950 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shadow-2xl shadow-teal-500/30 mx-auto mb-4"
          >
            <Compass className="w-7 h-7 text-white" />
          </motion.div>
          <h1 className="text-2xl font-bold text-white">GoTogether</h1>
          <AnimatePresence mode="wait">
            <motion.p
              key={mode}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="text-gray-400 text-sm mt-1"
            >
              {mode === 'reset' ? t('resetPassword') : mode === 'login' ? t('welcomeBack') : t('joinCommunity')}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Card */}
        <div className="bg-gray-900/80 backdrop-blur-sm rounded-3xl border border-white/8 shadow-2xl shadow-black/40 overflow-hidden">
          {/* Tab switcher — hidden in reset mode */}
          {mode !== 'reset' && (
            <div className="flex bg-gray-950/50 p-1.5 gap-1">
              {(['login', 'register'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setError('') }}
                  className={cn(
                    'flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                    mode === m
                      ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-500/20'
                      : 'text-gray-500 hover:text-gray-300'
                  )}
                >
                  {m === 'login' ? t('loginTab') : t('registerTab')}
                </button>
              ))}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <AnimatePresence mode="wait">
              {mode === 'register' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4 overflow-hidden"
                >
                  {/* Full name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">{t('fullNameLabel')}</label>
                    <div className="relative">
                      <User className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                      <input
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder={t('fullNamePlaceholder')}
                        required
                        className="w-full ps-10 pe-4 py-3 bg-gray-800/60 border border-white/8 rounded-xl text-white text-sm
                                   placeholder:text-gray-600 focus:outline-none focus:border-teal-500/50 focus:bg-gray-800
                                   transition-all duration-200"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">{t('phoneLabel')}</label>
                    <div className="flex gap-2">
                      <div className="relative">
                        <select
                          value={phoneCode}
                          onChange={(e) => setPhoneCode(e.target.value)}
                          className="appearance-none ps-3 pe-7 py-3 bg-gray-800/60 border border-white/8 rounded-xl text-white
                                     text-sm focus:outline-none focus:border-teal-500/50 transition-all cursor-pointer"
                          dir="ltr"
                        >
                          {COUNTRY_CODES.map((c) => (
                            <option key={c.code} value={c.code} className="bg-gray-900">
                              {c.flag} {c.code}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute end-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none" />
                      </div>
                      <div className="relative flex-1">
                        <Phone className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                        <input
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder={t('phonePlaceholder')}
                          required
                          dir="ltr"
                          className="w-full ps-10 pe-4 py-3 bg-gray-800/60 border border-white/8 rounded-xl text-white text-sm
                                     placeholder:text-gray-600 focus:outline-none focus:border-teal-500/50 focus:bg-gray-800
                                     transition-all duration-200"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">{t('emailLabel')}</label>
              <div className="relative">
                <Mail className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('emailPlaceholder')}
                  required
                  dir="ltr"
                  className="w-full ps-10 pe-4 py-3 bg-gray-800/60 border border-white/8 rounded-xl text-white text-sm
                             placeholder:text-gray-600 focus:outline-none focus:border-teal-500/50 focus:bg-gray-800
                             transition-all duration-200"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">{t('passwordLabel')}</label>
              <div className="relative">
                <Lock className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('passwordPlaceholder')}
                  required
                  minLength={6}
                  dir="ltr"
                  className="w-full ps-10 pe-11 py-3 bg-gray-800/60 border border-white/8 rounded-xl text-white text-sm
                             placeholder:text-gray-600 focus:outline-none focus:border-teal-500/50 focus:bg-gray-800
                             transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute end-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors p-0.5"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {error}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Forgot password (login mode only) */}
            {mode === 'login' && (
              <div className="text-center">
                <button type="button" onClick={() => { setMode('reset'); setError('') }}
                  className="text-xs text-gray-500 hover:text-teal-400 transition-colors">
                  {t('forgotPassword')}
                </button>
              </div>
            )}

            {/* Reset mode UI */}
            {mode === 'reset' && (
              <AnimatePresence>
                {resetSent ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm text-center">
                    ✉️ {t('resetSent')}
                  </motion.div>
                ) : null}
              </AnimatePresence>
            )}

            {/* Submit */}
            {!resetSent && (
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500
                           text-white font-semibold text-sm hover:from-teal-400 hover:to-cyan-400
                           transition-all shadow-lg shadow-teal-500/20 disabled:opacity-50
                           disabled:cursor-not-allowed flex items-center justify-center gap-2
                           active:scale-[0.98]"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {mode === 'login' ? t('signInBtn') : mode === 'reset' ? t('resetBtn') : t('createAccountBtn')}
              </button>
            )}

            {/* Back to login from reset */}
            {mode === 'reset' && (
              <button type="button" onClick={() => { setMode('login'); setResetSent(false); setError('') }}
                className="w-full text-center text-sm text-gray-500 hover:text-white transition-colors">
                ← {t('backToLogin')}
              </button>
            )}
          </form>
        </div>
      </motion.div>
    </div>
  )
}
