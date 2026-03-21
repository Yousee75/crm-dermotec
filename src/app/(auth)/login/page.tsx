'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Mail, Lock, Eye, EyeOff, Users, Star, Award } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password
    })

    if (error) {
      setError(error.message === 'Invalid login credentials'
        ? 'Email ou mot de passe incorrect'
        : error.message
      )
    } else {
      router.push('/')
      router.refresh()
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Brand */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-[#082545] to-[#0F3460]">
        {/* Background decorations */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 rounded-full bg-[#2EC6F3]/8 blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-[#2EC6F3]/5 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-white/3 blur-2xl" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center text-center px-12 py-16">
          {/* Logo */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-[#2EC6F3] mb-2" style={{ fontFamily: 'Bricolage Grotesque, system-ui' }}>
              DERMOTEC
            </h1>
            <p className="text-white text-lg font-medium">
              On vous forme. On vous équipe. On vous lance.
            </p>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-8 mb-16">
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6 text-[#2EC6F3]" />
              <span className="text-white font-semibold">500+ stagiaires</span>
            </div>
            <div className="flex items-center gap-3">
              <Star className="w-6 h-6 text-[#2EC6F3]" />
              <span className="text-white font-semibold">4.9/5 Google</span>
            </div>
            <div className="flex items-center gap-3">
              <Award className="w-6 h-6 text-[#2EC6F3]" />
              <span className="text-white font-semibold">Certifié Qualiopi</span>
            </div>
          </div>

          {/* Footer */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
            <p className="text-white/60 text-sm">
              © 2026 Dermotec Advanced — Paris 11e
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center px-6 sm:px-12 bg-white">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-10">
            <h1 className="text-2xl font-bold text-[#082545] mb-2" style={{ fontFamily: 'Bricolage Grotesque, system-ui' }}>
              DERMOTEC
            </h1>
            <p className="text-gray-600">Centre de Formation Esthétique</p>
          </div>

          {/* Form Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-[#082545] mb-2" style={{ fontFamily: 'DM Sans, system-ui' }}>
              Connexion au CRM
            </h2>
            <p className="text-gray-600">
              Accédez à votre espace de travail
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                icon={<Mail className="w-5 h-5" />}
                required
                className="h-12 text-base"
              />
            </div>

            <div>
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mot de passe"
                icon={<Lock className="w-5 h-5" />}
                trailing={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-gray-600 transition"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                }
                required
                className="h-12 text-base"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600 text-sm font-medium">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              loading={loading}
              disabled={!email || !password}
              className="w-full h-12 text-base font-semibold bg-[#2EC6F3] hover:bg-[#1BA8D4] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </Button>
          </form>

          {/* Forgot Password */}
          <div className="mt-6 text-center">
            <button
              type="button"
              className="text-[#2EC6F3] hover:text-[#1BA8D4] text-sm font-medium transition"
            >
              Mot de passe oublié ?
            </button>
          </div>

          {/* Footer */}
          <div className="mt-12 text-center">
            <p className="text-gray-400 text-xs">
              75 Bd Richard Lenoir, Paris 11e
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
