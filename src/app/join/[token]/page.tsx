'use client'

export const dynamic = 'force-dynamic'

import { use, useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { CheckCircle, XCircle, Clock, Users, Shield } from 'lucide-react'

interface Invitation {
  id: string
  email: string
  role: string
  expires_at: string
  accepted_at: string | null
  org?: { name: string }
}

export default function JoinPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const [invitation, setInvitation] = useState<Invitation | null>(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function loadInvitation() {
      const { data, error } = await supabase
        .from('invitations')
        .select('id, email, role, expires_at, accepted_at')
        .eq('token', token)
        .single()

      if (error || !data) {
        setError('Invitation introuvable ou expirée')
      } else if (data.accepted_at) {
        setError('Cette invitation a déjà été utilisée')
      } else if (new Date(data.expires_at) < new Date()) {
        setError('Cette invitation a expiré')
      } else {
        setInvitation(data)
      }
      setLoading(false)
    }
    loadInvitation()
  }, [token, supabase])

  async function handleAccept() {
    setAccepting(true)
    try {
      // Vérifier que l'utilisateur est connecté
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        // Rediriger vers login avec retour ici
        router.push(`/login?redirectTo=/join/${token}`)
        return
      }

      // Accepter l'invitation via l'API
      const res = await fetch(`/api/invitations/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erreur lors de l\'acceptation')
      }

      setSuccess(true)
      toast.success('Bienvenue dans l\'équipe !')
      setTimeout(() => router.push('/'), 2000)

    } catch (err) {
      toast.error((err as Error).message)
    }
    setAccepting(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-accent mb-2">Invitation invalide</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => router.push('/login')} className="bg-primary hover:bg-primary-dark">
            Aller à la connexion
          </Button>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-xl font-bold text-accent mb-2">Bienvenue !</h2>
          <p className="text-gray-600">Redirection vers le dashboard...</p>
        </div>
      </div>
    )
  }

  const roleLabel = invitation?.role === 'admin' ? 'Administrateur' : invitation?.role === 'viewer' ? 'Lecteur' : 'Membre'

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-accent px-8 py-6 text-center">
            <h1 className="text-2xl font-bold text-primary mb-1">Dermotec CRM</h1>
            <p className="text-white/60 text-sm">Invitation à rejoindre l&apos;équipe</p>
          </div>

          {/* Content */}
          <div className="p-8">
            <div className="text-center mb-8">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Users className="w-7 h-7 text-primary" />
              </div>
              <h2 className="text-lg font-semibold text-accent mb-2">
                Vous êtes invité(e)
              </h2>
              <p className="text-gray-600 text-sm">
                Vous avez été invité(e) à rejoindre le CRM en tant que <strong className="text-accent">{roleLabel}</strong>.
              </p>
            </div>

            {/* Infos */}
            <div className="space-y-3 mb-8">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Shield className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">Rôle : <strong>{roleLabel}</strong></span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  Expire le {new Date(invitation!.expires_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
            </div>

            {/* Actions */}
            <Button
              onClick={handleAccept}
              loading={accepting}
              className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary-dark"
              icon={<CheckCircle className="w-5 h-5" />}
            >
              {accepting ? 'Acceptation...' : 'Accepter l\'invitation'}
            </Button>

            <p className="text-xs text-gray-400 text-center mt-4">
              En acceptant, vous acceptez les{' '}
              <a href="/conditions-generales" target="_blank" className="text-primary hover:underline">
                conditions générales
              </a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
