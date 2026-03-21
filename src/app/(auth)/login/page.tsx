'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-client'
import { useRouter } from 'next/navigation'

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#082545] to-[#0F3A6E] px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'var(--font-heading)' }}>
            Dermotec
          </h1>
          <p className="text-[#7EDCF7] mt-1 text-sm">CRM — Centre de Formation</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-[#082545] mb-6">Connexion</h2>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-[#2EC6F3] focus:ring-2 focus:ring-[#2EC6F3]/20 outline-none transition"
                placeholder="votre@email.com"
              />
            </div>

            {mode === 'password' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-[#2EC6F3] focus:ring-2 focus:ring-[#2EC6F3]/20 outline-none transition"
                  placeholder="••••••••"
                />
              </div>
            )}

            {error && (
              <p className="text-red-500 text-sm bg-red-50 p-2 rounded">{error}</p>
            )}
            {message && (
              <p className="text-green-600 text-sm bg-green-50 p-2 rounded">{message}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-[#2EC6F3] hover:bg-[#1BA8D4] text-white font-medium transition disabled:opacity-50"
            >
              {loading ? 'Chargement...' : mode === 'password' ? 'Se connecter' : 'Envoyer le lien'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => setMode(mode === 'password' ? 'magic' : 'password')}
              className="text-sm text-[#2EC6F3] hover:underline"
            >
              {mode === 'password' ? 'Connexion par lien magique' : 'Connexion par mot de passe'}
            </button>
          </div>
        </div>

        <p className="text-center text-white/40 text-xs mt-6">
          Dermotec Advanced — Paris 11e
        </p>
      </div>
    </div>
  )
}
