'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Lock, Eye, EyeOff, CheckCircle, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const passwordStrength = getPasswordStrength(password)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères')
      return
    }
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message === 'New password should be different from the old password.'
        ? 'Le nouveau mot de passe doit être différent de l\'ancien'
        : 'Erreur lors de la réinitialisation. Le lien a peut-être expiré.'
      )
    } else {
      setSuccess(true)
      setTimeout(() => router.push('/'), 3000)
    }

    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-[#ECFDF5] flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-[#10B981]" />
          </div>
          <h2 className="text-xl font-bold text-accent mb-2">
            Mot de passe mis à jour
          </h2>
          <p className="text-[#777777] mb-4">
            Vous allez être redirigé vers le dashboard...
          </p>
          <Link href="/" className="text-primary hover:underline text-sm">
            Accéder au dashboard maintenant
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
            <ShieldCheck className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-accent mb-2" style={{ fontFamily: 'DM Sans, system-ui' }}>
            Nouveau mot de passe
          </h2>
          <p className="text-[#777777]">
            Choisissez un mot de passe sécurisé pour votre compte.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nouveau mot de passe"
              icon={<Lock className="w-5 h-5" />}
              trailing={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[#999999] hover:text-[#777777] transition"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              }
              required
              className="h-12 text-base"
              autoFocus
            />
            {/* Password strength indicator */}
            {password && (
              <div className="mt-2 space-y-1">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map(level => (
                    <div
                      key={level}
                      className="h-1 flex-1 rounded-full transition-colors"
                      style={{
                        backgroundColor: passwordStrength.level >= level
                          ? passwordStrength.color
                          : '#E5E7EB'
                      }}
                    />
                  ))}
                </div>
                <p className="text-xs" style={{ color: passwordStrength.color }}>
                  {passwordStrength.label}
                </p>
              </div>
            )}
          </div>

          <Input
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirmer le mot de passe"
            icon={<Lock className="w-5 h-5" />}
            required
            className="h-12 text-base"
          />

          {error && (
            <div className="bg-[#FFE0EF] border border-[#FF2D78]/30 rounded-lg p-3">
              <p className="text-[#FF2D78] text-sm">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            loading={loading}
            disabled={!password || !confirmPassword || password.length < 8}
            className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary-dark"
          >
            {loading ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
          </Button>
        </form>
      </div>
    </div>
  )
}

function getPasswordStrength(password: string) {
  if (!password) return { level: 0, label: '', color: '#94A3B8' }

  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  if (score <= 1) return { level: 1, label: 'Faible', color: '#EF4444' }
  if (score <= 2) return { level: 2, label: 'Moyen', color: '#F59E0B' }
  if (score <= 3) return { level: 3, label: 'Bon', color: 'var(--color-success)' }
  return { level: 4, label: 'Excellent', color: '#10B981' }
}
