'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import { SignatureCanvas } from '@/components/ui/SignatureCanvas'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { CheckCircle, Clock, Users, Calendar, Signature, AlertCircle } from 'lucide-react'
import type { Session, Inscription, Formation, Lead, Emargement, CreneauEmargement } from '@/types'

interface EmargementPageData {
  session: Session & {
    formation: Formation
    inscriptions: (Inscription & {
      lead: Lead
    })[]
  }
  inscription: Inscription & {
    lead: Lead
  }
  existingEmargement?: Emargement
}

export default function EmargementPage() {
  const params = useParams()
  const searchParams = useSearchParams()

  const sessionId = params.sessionId as string
  const date = searchParams.get('date')
  const inscriptionId = searchParams.get('inscription')
  const token = searchParams.get('token')

  const [data, setData] = useState<EmargementPageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [signatureData, setSignatureData] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  // Détermine le créneau en fonction de l'heure actuelle
  const getCurrentCreneau = useCallback((): CreneauEmargement => {
    const now = new Date()
    const hour = now.getHours()

    if (hour < 14) {
      return 'matin'
    } else {
      return 'apres_midi'
    }
  }, [])

  const creneau = getCurrentCreneau()

  // Format de date pour l'affichage
  const formatDate = useCallback((dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }, [])

  // Format du créneau pour l'affichage
  const formatCreneau = useCallback((creneau: CreneauEmargement) => {
    switch (creneau) {
      case 'matin':
        return 'Matin'
      case 'apres_midi':
        return 'Après-midi'
      case 'journee':
        return 'Journée complète'
      default:
        return creneau
    }
  }, [])

  // Chargement des données
  useEffect(() => {
    if (!sessionId || !date || !inscriptionId) {
      setError('Paramètres manquants dans l\'URL')
      setLoading(false)
      return
    }

    const loadData = async () => {
      try {
        const supabase = createClient()

        // Récupérer les informations de la session
        const { data: sessionData, error: sessionError } = await supabase
          .from('sessions')
          .select(`
            *,
            formation:formations(*),
            inscriptions:inscriptions(
              *,
              lead:leads(*)
            )
          `)
          .eq('id', sessionId)
          .single()

        if (sessionError || !sessionData) {
          throw new Error('Session non trouvée')
        }

        // Trouver l'inscription spécifique
        const inscription = sessionData.inscriptions?.find(
          (ins: any) => ins.id === inscriptionId
        )

        if (!inscription) {
          throw new Error('Inscription non trouvée pour cette session')
        }

        // Vérifier s'il existe déjà un émargement pour cette combinaison
        const { data: existingEmargement } = await supabase
          .from('emargements')
          .select('*')
          .eq('session_id', sessionId)
          .eq('inscription_id', inscriptionId)
          .eq('date', date)
          .eq('creneau', creneau)
          .single()

        setData({
          session: sessionData,
          inscription,
          existingEmargement: existingEmargement || undefined
        })

      } catch (err) {
        console.error('Erreur chargement données:', err)
        setError(err instanceof Error ? err.message : 'Erreur de chargement')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [sessionId, date, inscriptionId, creneau])

  // Gestion de la signature
  const handleSignature = useCallback((dataUrl: string) => {
    setSignatureData(dataUrl)
  }, [])

  // Soumission de l'émargement
  const handleSubmit = async () => {
    if (!signatureData || !data) return

    setSubmitting(true)
    try {
      const response = await fetch('/api/emargement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          inscription_id: inscriptionId,
          date,
          creneau,
          signature_data: signatureData
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de l\'émargement')
      }

      setSuccess(true)

      // Recharger les données pour afficher l'émargement
      const supabase = createClient()
      const { data: newEmargement } = await supabase
        .from('emargements')
        .select('*')
        .eq('session_id', sessionId)
        .eq('inscription_id', inscriptionId)
        .eq('date', date)
        .eq('creneau', creneau)
        .single()

      if (newEmargement) {
        setData(prev => prev ? {
          ...prev,
          existingEmargement: newEmargement
        } : null)
      }

    } catch (err) {
      console.error('Erreur émargement:', err)
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'émargement')
    } finally {
      setSubmitting(false)
    }
  }

  // États de chargement et d'erreur
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Erreur
            </h2>
            <p className="text-gray-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!data) return null

  const { session, inscription, existingEmargement } = data
  const isAlreadySigned = !!existingEmargement

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Dermotec */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-xl font-bold text-[#082545]">
                DERMOTEC ADVANCED
              </h1>
              <p className="text-sm text-gray-600">
                Centre de Formation Esthétique
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Titre principal */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-[#082545] mb-2">
            Feuille d'émargement
          </h2>
          <p className="text-gray-600">
            Signez numériquement pour confirmer votre présence
          </p>
        </div>

        {/* Informations de la formation */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle icon={<Users />}>
              Informations Formation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Formation</label>
                <p className="text-lg font-semibold text-[#082545]">
                  {session.formation.nom}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Catégorie</label>
                <p className="text-gray-900">{session.formation.categorie}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Date</label>
                <p className="text-gray-900 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[#2EC6F3]" />
                  {date ? formatDate(date) : 'Date non spécifiée'}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Créneau</label>
                <p className="text-gray-900 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[#2EC6F3]" />
                  {formatCreneau(creneau)}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t">
              <label className="text-sm font-medium text-gray-700">Stagiaire</label>
              <p className="text-lg font-medium text-[#082545]">
                {inscription.lead.prenom} {inscription.lead.nom || ''}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* État de l'émargement */}
        {isAlreadySigned ? (
          <Card className="mb-6 bg-green-50 border-green-200">
            <CardContent className="p-6 text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-green-800 mb-2">
                Émargement déjà effectué
              </h3>
              <p className="text-green-700">
                Vous avez déjà signé la feuille d'émargement pour cette séance.
              </p>
              <p className="text-sm text-green-600 mt-2">
                Signé le {existingEmargement.signed_at ? new Date(existingEmargement.signed_at).toLocaleString('fr-FR') : 'Date inconnue'}
              </p>
            </CardContent>
          </Card>
        ) : success ? (
          <Card className="mb-6 bg-green-50 border-green-200">
            <CardContent className="p-6 text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-green-800 mb-2">
                Émargement réussi !
              </h3>
              <p className="text-green-700">
                Votre présence a été enregistrée avec succès.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle icon={<Signature />}>
                Signature d'émargement
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <p className="text-gray-700 mb-4">
                  Signez dans la zone ci-dessous pour confirmer votre présence
                </p>
              </div>

              <SignatureCanvas
                onSignature={handleSignature}
                width={400}
                height={150}
              />

              <Button
                onClick={handleSubmit}
                disabled={!signatureData || submitting}
                loading={submitting}
                className="w-full min-h-[56px] text-lg"
                size="lg"
              >
                {submitting ? 'Enregistrement...' : 'Confirmer ma présence'}
              </Button>

              <div className="text-center text-sm text-gray-500">
                <p>
                  En signant, vous certifiez votre présence à cette séance de formation.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 mt-8 space-y-1">
          <p>Dermotec Advanced - Centre de Formation Esthétique</p>
          <p>75 Bd Richard Lenoir, 75011 Paris</p>
        </div>
      </main>
    </div>
  )
}