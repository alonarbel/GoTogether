'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { Compass, Eye, EyeOff, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const COUNTRY_CODES = [
  { code: '+972', flag: '🇮🇱', name: 'IL' },
  { code: '+1', flag: '🇺🇸', name: 'US' },
  { code: '+44', flag: '🇬🇧', name: 'UK' },
  { code: '+49', flag: '🇩🇪', name: 'DE' },
  { code: '+33', flag: '🇫🇷', name: 'FR' },
  { code: '+39', flag: '🇮🇹', name: 'IT' },
  { code: '+34', flag: '🇪🇸', name: 'ES' },
  { code: '+31', flag: '🇳🇱', name: 'NL' },
  { code: '+61', flag: '🇦🇺', name: 'AU' },
  { code: '+81', flag: '🇯🇵', name: 'JP' },
  { code: '+82', flag: '🇰🇷', name: 'KR' },
  { code: '+91', flag: '🇮🇳', name: 'IN' },
  { code: '+55', flag: '🇧🇷', name: 'BR' },
  { code: '+52', flag: '🇲🇽', name: 'MX' },
  { code: '+7', flag: '🇷🇺', name: 'RU' },
  { code: '+86', flag: '🇨🇳', name: 'CN' },
  { code: '+90', flag: '🇹🇷', name: 'TR' },
  { code: '+62', flag: '🇮🇩', name: 'ID' },
  { code: '+27', flag: '🇿🇦', name: 'ZA' },
  { code: '+20', flag: '🇪🇬', name: 'EG' },
]

export function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [phoneCode, setPhoneCode] = useState('+972')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (mode === 'register') {
      const fullPhone = `${phoneCode}${phoneNumber}`
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, phone: fullPhone },
        },
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
    <div className="min-h-screen flex items-center justify-center px-4 pt-20">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-teal-950/20 to-gray-950" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-teal-500/5 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/25 mx-auto mb-3">
            <Compass className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">GoTogether</h1>
          <p className="text-gray-400 text-sm mt-1">
            {mode === 'login' ? 'ברוך השב 👋' : 'הצטרף לקהילה 🌍'}
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-gray-900 rounded-xl p-1 mb-6 border border-white/5">
          {(['login', 'register'] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError('') }}
              className={cn(
                'flex-1 py-2 rounded-lg text-sm font-medium transition-all',
                mode === m ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'
              )}
            >
              {m === 'login' ? 'התחברות' : 'הרשמה'}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-gray-900 rounded-2xl p-6 border border-white/5 space-y-4">
          <AnimatePresence mode="wait">
            {mode === 'register' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4 overflow-hidden"
              >
                <div className="space-y-1.5">
                  <label className="text-sm text-gray-400">שם מלא</label>
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="ישראל ישראלי"
                    required
                    className="w-full px-4 py-3 bg-gray-800 border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-teal-500/50 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm text-gray-400">מספר טלפון</label>
                  <div className="flex gap-2">
                    <select
                      value={phoneCode}
                      onChange={(e) => setPhoneCode(e.target.value)}
                      className="px-3 py-3 bg-gray-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-teal-500/50 transition-all text-sm"
                    >
                      {COUNTRY_CODES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.flag} {c.code}
                        </option>
                      ))}
                    </select>
                    <input
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="050-000-0000"
                      required
                      className="flex-1 px-4 py-3 bg-gray-800 border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-teal-500/50 transition-all"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-1.5">
            <label className="text-sm text-gray-400">אימייל</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full px-4 py-3 bg-gray-800 border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-teal-500/50 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm text-gray-400">סיסמא</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="לפחות 6 תווים"
                required
                minLength={6}
                className="w-full px-4 py-3 pe-12 bg-gray-800 border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-teal-500/50 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
            >
              {error}
            </motion.div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold 
                       hover:from-teal-400 hover:to-cyan-400 transition-all shadow-lg shadow-teal-500/25 
                       disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {mode === 'login' ? 'התחברות' : 'צור חשבון'}
          </button>
        </form>
      </motion.div>
    </div>
  )
}
