'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Mail, Lock, ArrowRight, Sparkles } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'password' | 'magic'>('password')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    if (mode === 'password') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message)
      } else {
        router.push('/')
        router.refresh()
      }
    } else {
      const { error } = await supabase.auth.signInWithOtp({ email })
      if (error) {
        setError(error.message)
      } else {
        setMessage('Lien magique envoyé ! Vérifiez votre email.')
      }
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex bg-[#082545]">
      {/* Left: branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center">
        {/* Background decorations */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-[#2EC6F3]/10 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full bg-[#3B82F6]/8 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-[#2EC6F3]/5 blur-2xl" />
        </div>

        <div className="relative z-10 max-w-md text-center px-8">
          {/* Logo */}
          <div className="w-20 h-20 rounded-2xl gradient-primary mx-auto flex items-center justify-center shadow-xl shadow-[#2EC6F3]/25 mb-8">
            <span className="text-3xl font-bold text-white" style={{ fontFamily: 'var(--font-heading)' }}>D</span>
          </div>

          <h1 className="text-4xl font-bold text-white tracking-tight mb-3" style={{ fontFamily: 'var(--font-heading)' }}>
            Dermotec
            <span className="text-gradient block text-lg font-medium mt-1">Advanced CRM</span>
          </h1>

          <p className="text-blue-200/70 text-sm leading-relaxed mt-4">
            Centre de Formation Esthétique Certifié Qualiopi<br />
            Gestion complète des leads, formations et stagiaires
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-10">
            {[
              { label: 'Formations', value: '11' },
              { label: 'Catégories', value: '4' },
              { label: 'Indicateurs', value: '32' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/5 rounded-xl p-3 backdrop-blur-sm border border-white/5">
                <p className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-heading)' }}>{stat.value}</p>
                <p className="text-[10px] text-blue-300/60 uppercase tracking-wider mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: login form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-8 bg-[#F8FAFC] lg:rounded-l-[2rem]">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-14 h-14 rounded-xl gradient-primary mx-auto flex items-center justify-center shadow-lg shadow-[#2EC6F3]/20 mb-4">
              <span className="text-xl font-bold text-white">D</span>
            </div>
            <h1 className="text-xl font-bold text-[#082545]" style={{ fontFamily: 'var(--font-heading)' }}>
              Dermotec CRM
            </h1>
          </div>

          {/* Form card */}
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-[#082545]" style={{ fontFamily: 'var(--font-heading)' }}>
                Connexion
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {mode === 'password'
                  ? 'Connectez-vous à votre espace'
                  : 'Recevez un lien de connexion par email'
                }
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="votre@email.com"
                icon={<Mail className="w-4 h-4" />}
              />

              {mode === 'password' && (
                <Input
                  label="Mot de passe"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  icon={<Lock className="w-4 h-4" />}
                />
              )}

              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
                  <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-red-500 text-xs font-bold">!</span>
                  </div>
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {message && (
                <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-100 rounded-xl">
                  <Sparkles className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-green-600">{message}</p>
                </div>
              )}

              <Button
                type="submit"
                loading={loading}
                className="w-full h-11"
                size="lg"
              >
                {mode === 'password' ? 'Se connecter' : 'Envoyer le lien'}
                {!loading && <ArrowRight className="w-4 h-4 ml-1" />}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-[#F8FAFC] px-3 text-gray-400">ou</span>
              </div>
            </div>

            <button
              onClick={() => setMode(mode === 'password' ? 'magic' : 'password')}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-white hover:border-gray-300 hover:text-gray-900 transition"
            >
              {mode === 'password' ? (
                <>
                  <Sparkles className="w-4 h-4 text-[#2EC6F3]" />
                  Connexion par lien magique
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Connexion par mot de passe
                </>
              )}
            </button>
          </div>

          <p className="text-center text-gray-400 text-xs mt-8">
            Dermotec Advanced — 75 Bd Richard Lenoir, Paris 11e
          </p>
        </div>
      </div>
    </div>
  )
}
