'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle, Calendar, MapPin, Mail, Phone } from 'lucide-react'
import { createClient } from '@/lib/supabase-client'

interface InscriptionData {
  inscription: {
    id: string
    montant_total: number
    session: {
      date_debut: string
      date_fin: string
      horaire_debut: string
      horaire_fin: string
      salle: string
      adresse: string
      formation: {
        nom: string
        duree_jours: number
        materiel_inclus: boolean
      }
    }
    lead: {
      prenom: string
      email: string
    }
  }
}

function InscriptionSuccessContent() {
  const searchParams = useSearchParams()
  const inscriptionId = searchParams?.get('inscription_id')
  const [data, setData] = useState<InscriptionData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!inscriptionId) {
      setLoading(false)
      return
    }

    async function fetchInscription() {
      const supabase = createClient()

      const { data: inscription } = await supabase
        .from('inscriptions')
        .select(`
          id,
          montant_total,
          session:sessions (
            date_debut,
            date_fin,
            horaire_debut,
            horaire_fin,
            salle,
            adresse,
            formation:formations (
              nom,
              duree_jours,
              materiel_inclus
            )
          ),
          lead:leads (
            prenom,
            email
          )
        `)
        .eq('id', inscriptionId)
        .single()

      if (inscription) {
        // Supabase returns arrays for joined relations; extract first element
        const raw = inscription as Record<string, unknown>
        const sessionRaw = Array.isArray(raw.session) ? raw.session[0] : raw.session
        const leadRaw = Array.isArray(raw.lead) ? raw.lead[0] : raw.lead
        if (sessionRaw && typeof sessionRaw === 'object') {
          const s = sessionRaw as Record<string, unknown>
          s.formation = Array.isArray(s.formation) ? s.formation[0] : s.formation
        }
        setData({ inscription: { ...inscription, session: sessionRaw, lead: leadRaw } as unknown as InscriptionData['inscription'] })
      }

      setLoading(false)
    }

    fetchInscription()
  }, [inscriptionId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-12">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <div className="animate-pulse">
            <div className="h-16 w-16 mx-auto bg-gray-200 rounded-full mb-4"></div>
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!inscriptionId || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-12">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Inscription non trouvée</h1>
          <p className="text-gray-600 mb-8">
            Nous n'avons pas pu retrouver votre inscription. Veuillez nous contacter si le problème persiste.
          </p>
          <a
            href="tel:+33123456789"
            className="inline-flex items-center gap-2 rounded-xl bg-[#2EC6F3] px-6 py-3 font-semibold text-white hover:bg-[#2EC6F3]/90"
          >
            <Phone className="h-4 w-4" />
            Nous contacter
          </a>
        </div>
      </div>
    )
  }

  const { inscription } = data
  const sessionDate = new Date(inscription.session.date_debut)
  const endDate = new Date(inscription.session.date_fin)

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-12">
      <div className="mx-auto max-w-2xl px-4">
        {/* Header Success */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-green-800 mb-2">
            Inscription confirmée !
          </h1>
          <p className="text-green-700">
            Félicitations {inscription.lead.prenom}, votre place est réservée
          </p>
        </div>

        {/* Détails de l'inscription */}
        <div className="rounded-2xl bg-white p-8 shadow-lg border border-gray-100 mb-6">
          <h2 className="text-xl font-bold text-[#082545] mb-6">Détails de votre formation</h2>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">
                {inscription.session.formation.nom}
              </h3>
              <p className="text-gray-600">
                {inscription.session.formation.duree_jours} jour{inscription.session.formation.duree_jours > 1 ? 's' : ''} de formation
              </p>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-[#2EC6F3] mt-1 flex-shrink-0" />
              <div>
                <div className="font-medium text-gray-900">
                  Du {sessionDate.toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })} au {endDate.toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </div>
                <div className="text-sm text-gray-600">
                  {inscription.session.horaire_debut} - {inscription.session.horaire_fin}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-[#2EC6F3] mt-1 flex-shrink-0" />
              <div>
                <div className="font-medium text-gray-900">{inscription.session.salle}</div>
                <div className="text-sm text-gray-600">{inscription.session.adresse}</div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-900">Montant payé</span>
                <span className="text-xl font-bold text-[#2EC6F3]">
                  {inscription.montant_total}€
                </span>
              </div>
              {inscription.session.formation.materiel_inclus && (
                <p className="text-sm text-green-600 mt-1">
                  ✓ Matériel inclus
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Prochaines étapes */}
        <div className="rounded-2xl bg-white p-8 shadow-lg border border-gray-100 mb-6">
          <h2 className="text-xl font-bold text-[#082545] mb-6">Prochaines étapes</h2>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#2EC6F3] text-xs font-bold text-white">
                1
              </div>
              <div>
                <div className="font-medium text-gray-900">Email de confirmation</div>
                <div className="text-sm text-gray-600">
                  Vous allez recevoir un email avec votre facture et les détails pratiques
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#2EC6F3] text-xs font-bold text-white">
                2
              </div>
              <div>
                <div className="font-medium text-gray-900">Convocation</div>
                <div className="text-sm text-gray-600">
                  Une convocation vous sera envoyée 7 jours avant le début de la formation
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#2EC6F3] text-xs font-bold text-white">
                3
              </div>
              <div>
                <div className="font-medium text-gray-900">Jour J</div>
                <div className="text-sm text-gray-600">
                  Présentez-vous 15 minutes avant le début avec une pièce d'identité
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="rounded-2xl bg-[#2EC6F3]/5 p-8 border border-[#2EC6F3]/20 text-center">
          <h2 className="text-xl font-bold text-[#082545] mb-4">Une question ?</h2>
          <p className="text-gray-600 mb-6">
            Notre équipe est là pour vous accompagner
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={`mailto:formation@dermotec-advanced.com?subject=Formation ${inscription.session.formation.nom} - ${inscription.lead.prenom}`}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2EC6F3] px-6 py-3 font-semibold text-white hover:bg-[#2EC6F3]/90"
            >
              <Mail className="h-4 w-4" />
              Nous écrire
            </a>
            <a
              href="tel:+33123456789"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#2EC6F3] px-6 py-3 font-semibold text-[#2EC6F3] hover:bg-[#2EC6F3]/10"
            >
              <Phone className="h-4 w-4" />
              01 23 45 67 89
            </a>
          </div>
        </div>

        {/* Social proof */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 mb-4">
            Vous rejoignez plus de 2,000 professionnelles formées chez Dermotec Advanced
          </p>
          <div className="flex justify-center items-center gap-4 text-xs text-gray-400">
            <span>4.9/5 sur Google</span>
            <span>•</span>
            <span>Certifié Qualiopi</span>
            <span>•</span>
            <span>15 ans d'expérience</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function InscriptionSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-12">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <div className="animate-pulse">
            <div className="h-16 w-16 mx-auto bg-gray-200 rounded-full mb-4" />
            <div className="h-8 bg-gray-200 rounded mb-4" />
            <div className="h-64 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    }>
      <InscriptionSuccessContent />
    </Suspense>
  )
}