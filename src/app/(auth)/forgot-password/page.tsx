'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-client'
import Link from 'next/link'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    })

    if (error) {
      setError('Une erreur est survenue. Vérifiez votre email et réessayez.')
    } else {
      setSent(true)
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm">
        {/* Back link */}
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm text-[#777777] hover:text-primary transition mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à la connexion
        </Link>

        {sent ? (
          /* Success state */
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#ECFDF5] flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-[#10B981]" />
            </div>
            <h2 className="text-xl font-bold text-accent mb-2">
              Email envoyé
            </h2>
            <p className="text-[#777777] mb-6">
              Si un compte existe avec <strong>{email}</strong>, vous recevrez un lien de réinitialisation dans quelques minutes.
            </p>
            <p className="text-sm text-[#999999]">
              Vérifiez aussi vos spams.
            </p>
          </div>
        ) : (
          /* Form */
          <>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-accent mb-2" style={{ fontFamily: 'DM Sans, system-ui' }}>
                Mot de passe oublié
              </h2>
              <p className="text-[#777777]">
                Entrez votre email et nous vous enverrons un lien de réinitialisation.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                icon={<Mail className="w-5 h-5" />}
                required
                className="h-12 text-base"
                autoFocus
              />

              {error && (
                <div className="bg-[#FFE0EF] border border-[#FF2D78]/30 rounded-lg p-3">
                  <p className="text-[#FF2D78] text-sm">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                loading={loading}
                disabled={!email}
                className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary-dark"
              >
                {loading ? 'Envoi...' : 'Envoyer le lien'}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
