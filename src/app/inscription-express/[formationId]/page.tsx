'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ChevronDown, ChevronUp, Lock, ShieldCheck, Calendar, Users, Timer, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase-client'
import { Formation, Session } from '@/types'

// Validation schema
const inscriptionSchema = z.object({
  prenom: z.string().min(2, 'Prénom requis (2 caractères min.)'),
  nom: z.string().min(2, 'Nom requis (2 caractères min.)'),
  email: z.string().email('Email invalide'),
  telephone: z.string().min(10, 'Téléphone requis (10 chiffres min.)'),
  convention_accepted: z.boolean().refine(val => val, 'Vous devez accepter la convention'),
  reglement_accepted: z.boolean().refine(val => val, 'Vous devez accepter le règlement intérieur'),
  rgpd_accepted: z.boolean().refine(val => val, 'Vous devez accepter le traitement de vos données'),
  payment_mode: z.enum(['immediate', '3x', '4x']),
})

type InscriptionForm = z.infer<typeof inscriptionSchema>

export default function InscriptionExpressPage() {
  const params = useParams()
  const formationId = params?.formationId as string

  const [formation, setFormation] = useState<Formation | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [showConvention, setShowConvention] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<InscriptionForm>({
    resolver: zodResolver(inscriptionSchema),
    defaultValues: {
      payment_mode: 'immediate',
      convention_accepted: false,
      reglement_accepted: false,
      rgpd_accepted: false,
    }
  })

  const paymentMode = watch('payment_mode')

  useEffect(() => {
    if (!formationId) return

    async function fetchData() {
      const supabase = createClient()

      // Fetch formation
      const { data: formationData } = await supabase
        .from('formations')
        .select('*')
        .eq('id', formationId)
        .eq('is_active', true)
        .single()

      if (formationData) {
        setFormation(formationData)

        // Fetch prochaine session
        const { data: sessionData } = await supabase
          .from('sessions')
          .select('*')
          .eq('formation_id', formationId)
          .eq('statut', 'CONFIRMEE')
          .gte('date_debut', new Date().toISOString())
          .order('date_debut')
          .limit(1)
          .single()

        if (sessionData) {
          setSession(sessionData)
        }
      }

      setLoading(false)
    }

    fetchData()
  }, [formationId])

  const onSubmit = async (data: InscriptionForm) => {
    if (!formation || !session) return

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/inscription-express', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          formation_id: formation.id,
          session_id: session.id,
        }),
      })

      const result = await response.json()

      if (response.ok && result.checkout_url) {
        window.location.href = result.checkout_url
      } else {
        alert(result.error || 'Erreur lors de l\'inscription')
      }
    } catch (error) {
      console.error('Erreur inscription:', error)
      alert('Erreur lors de l\'inscription. Veuillez réessayer.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-12">
        <div className="mx-auto max-w-2xl px-4">
          <div className="animate-pulse space-y-6">
            <div className="h-48 bg-gray-200 rounded-2xl"></div>
            <div className="h-32 bg-gray-200 rounded-2xl"></div>
            <div className="h-64 bg-gray-200 rounded-2xl"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!formation) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-12">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Formation non trouvée</h1>
          <p className="text-gray-600">Cette formation n'existe pas ou n'est plus disponible.</p>
        </div>
      </div>
    )
  }

  const placesRestantes = session ? session.places_max - session.places_occupees : 0
  const sessionDate = session ? new Date(session.date_debut) : null
  const isUrgent = sessionDate ? (sessionDate.getTime() - Date.now()) < 30 * 24 * 60 * 60 * 1000 : false

  const montantTotal = formation.prix_ht * (1 + formation.tva_rate / 100)
  const montant3x = Math.round((montantTotal / 3) * 100) / 100
  const montant4x = Math.round((montantTotal / 4) * 100) / 100

  const getMontantDisplay = () => {
    switch (paymentMode) {
      case '3x': return `${montant3x}€`
      case '4x': return `${montant4x}€`
      default: return `${montantTotal}€`
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-8">
      <div className="mx-auto max-w-2xl px-4">
        {/* Formation Card */}
        <div className="mb-8 overflow-hidden rounded-2xl bg-white shadow-xl border border-gray-100">
          <div className="p-8">
            <div className="mb-4">
              <span className="inline-flex rounded-full bg-[#2EC6F3]/10 px-4 py-1.5 text-sm font-semibold text-[#2EC6F3]">
                {formation.categorie}
              </span>
            </div>

            <h1 className="mb-4 text-3xl font-bold text-[#082545] leading-tight font-[BricolageGrotesque]">
              {formation.nom}
            </h1>

            <div className="mb-6 flex items-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Timer className="h-4 w-4" />
                <span>{formation.duree_jours} jours • {formation.duree_heures}h</span>
              </div>
              {sessionDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{sessionDate.toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long'
                  })}</span>
                </div>
              )}
              {placesRestantes > 0 && (
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span className={placesRestantes < 3 ? 'text-red-600 font-semibold' : ''}>
                    {placesRestantes} place{placesRestantes > 1 ? 's' : ''} restante{placesRestantes > 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>

            <div className="mb-6">
              <div className="mb-2 text-4xl font-bold text-[#082545]">
                {montantTotal}€
                <span className="ml-2 text-lg font-normal text-gray-500">TTC</span>
              </div>
              <div className="text-sm text-[#2EC6F3] font-semibold">
                ou 3x {montant3x}€ sans frais avec Alma
              </div>
            </div>

            {isUrgent && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-center">
                <p className="text-red-800 font-semibold">🔥 Session dans moins de 30 jours — Places limitées !</p>
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Formulaire Identité */}
          <div className="rounded-2xl bg-white p-8 shadow-lg border border-gray-100">
            <h2 className="mb-6 text-xl font-bold text-[#082545]">Vos informations</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prénom *
                </label>
                <input
                  {...register('prenom')}
                  type="text"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-[#2EC6F3] focus:outline-none focus:ring-1 focus:ring-[#2EC6F3]"
                  placeholder="Votre prénom"
                />
                {errors.prenom && (
                  <p className="mt-1 text-sm text-red-600">{errors.prenom.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom *
                </label>
                <input
                  {...register('nom')}
                  type="text"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-[#2EC6F3] focus:outline-none focus:ring-1 focus:ring-[#2EC6F3]"
                  placeholder="Votre nom"
                />
                {errors.nom && (
                  <p className="mt-1 text-sm text-red-600">{errors.nom.message}</p>
                )}
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                {...register('email')}
                type="email"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-[#2EC6F3] focus:outline-none focus:ring-1 focus:ring-[#2EC6F3]"
                placeholder="votre@email.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Téléphone *
              </label>
              <input
                {...register('telephone')}
                type="tel"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-[#2EC6F3] focus:outline-none focus:ring-1 focus:ring-[#2EC6F3]"
                placeholder="06 XX XX XX XX"
              />
              {errors.telephone && (
                <p className="mt-1 text-sm text-red-600">{errors.telephone.message}</p>
              )}
            </div>
          </div>

          {/* Convention */}
          <div className="rounded-2xl bg-white p-8 shadow-lg border border-gray-100">
            <button
              type="button"
              onClick={() => setShowConvention(!showConvention)}
              className="mb-4 flex w-full items-center justify-between text-xl font-bold text-[#082545]"
            >
              Convention de formation
              {showConvention ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>

            {showConvention && (
              <div className="mb-6 space-y-4 rounded-lg bg-gray-50 p-6">
                <div>
                  <h4 className="font-semibold text-gray-900">Objet</h4>
                  <p className="text-sm text-gray-600">Formation {formation.nom} — {formation.duree_jours} jours ({formation.duree_heures}h)</p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900">Dates et lieu</h4>
                  <p className="text-sm text-gray-600">
                    {sessionDate?.toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })} — Dermotec Advanced, 75 Bd Richard Lenoir, Paris 11e
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900">Programme</h4>
                  <ul className="text-sm text-gray-600 list-disc pl-4">
                    {formation.objectifs.slice(0, 3).map((objectif, index) => (
                      <li key={index}>{objectif}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900">Tarif</h4>
                  <p className="text-sm text-gray-600">
                    {formation.prix_ht}€ HT ({montantTotal}€ TTC) — Matériel {formation.materiel_inclus ? 'inclus' : 'non inclus'}
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900">Droit de rétractation</h4>
                  <p className="text-sm text-gray-600">
                    Vous disposez de 14 jours pour vous rétracter. Passé ce délai, aucun remboursement ne sera effectué.
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <label className="flex items-start gap-3">
                <input
                  {...register('convention_accepted')}
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-[#2EC6F3] focus:ring-[#2EC6F3]"
                />
                <span className="text-sm text-gray-700">
                  J'ai lu et j'accepte les termes de la convention de formation
                </span>
              </label>
              {errors.convention_accepted && (
                <p className="text-sm text-red-600">{errors.convention_accepted.message}</p>
              )}

              <label className="flex items-start gap-3">
                <input
                  {...register('reglement_accepted')}
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-[#2EC6F3] focus:ring-[#2EC6F3]"
                />
                <span className="text-sm text-gray-700">
                  J'accepte le règlement intérieur
                </span>
              </label>
              {errors.reglement_accepted && (
                <p className="text-sm text-red-600">{errors.reglement_accepted.message}</p>
              )}

              <label className="flex items-start gap-3">
                <input
                  {...register('rgpd_accepted')}
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-[#2EC6F3] focus:ring-[#2EC6F3]"
                />
                <span className="text-sm text-gray-700">
                  J'accepte que mes données soient traitées conformément au RGPD
                </span>
              </label>
              {errors.rgpd_accepted && (
                <p className="text-sm text-red-600">{errors.rgpd_accepted.message}</p>
              )}
            </div>
          </div>

          {/* Paiement */}
          <div className="rounded-2xl bg-white p-8 shadow-lg border border-gray-100">
            <h2 className="mb-6 text-xl font-bold text-[#082545]">Mode de paiement</h2>

            <div className="space-y-4">
              <label className="block">
                <input
                  {...register('payment_mode')}
                  type="radio"
                  value="immediate"
                  className="sr-only"
                />
                <div className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${
                  paymentMode === 'immediate' ? 'border-[#2EC6F3] bg-[#2EC6F3]/5' : 'border-gray-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-900">Payer maintenant</div>
                      <div className="text-sm text-gray-600">{montantTotal}€ en une fois</div>
                    </div>
                    <div className="text-2xl font-bold text-[#2EC6F3]">{montantTotal}€</div>
                  </div>
                </div>
              </label>

              <label className="block">
                <input
                  {...register('payment_mode')}
                  type="radio"
                  value="3x"
                  className="sr-only"
                />
                <div className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${
                  paymentMode === '3x' ? 'border-[#2EC6F3] bg-[#2EC6F3]/5' : 'border-gray-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-900">Payer en 3x sans frais</div>
                      <div className="text-sm text-gray-600">3 × {montant3x}€</div>
                      <div className="text-xs text-[#2EC6F3]">Powered by Alma</div>
                    </div>
                    <div className="text-2xl font-bold text-[#2EC6F3]">{montant3x}€</div>
                  </div>
                </div>
              </label>

              <label className="block">
                <input
                  {...register('payment_mode')}
                  type="radio"
                  value="4x"
                  className="sr-only"
                />
                <div className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${
                  paymentMode === '4x' ? 'border-[#2EC6F3] bg-[#2EC6F3]/5' : 'border-gray-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-900">Payer en 4x sans frais</div>
                      <div className="text-sm text-gray-600">4 × {montant4x}€</div>
                      <div className="text-xs text-[#2EC6F3]">Powered by Alma</div>
                    </div>
                    <div className="text-2xl font-bold text-[#2EC6F3]">{montant4x}€</div>
                  </div>
                </div>
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || placesRestantes === 0}
              className="mt-8 w-full rounded-xl bg-[#2EC6F3] px-8 py-4 text-lg font-bold text-white transition-all hover:bg-[#2EC6F3]/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                'Redirection en cours...'
              ) : (
                `Réserver ma place — ${getMontantDisplay()}`
              )}
            </button>

            {placesRestantes === 0 && (
              <p className="mt-4 text-center text-red-600 font-semibold">
                Session complète — Plus de places disponibles
              </p>
            )}

            {/* Trust badges */}
            <div className="mt-6 flex items-center justify-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Lock className="h-4 w-4" />
                <span>Paiement sécurisé</span>
              </div>
              <div className="flex items-center gap-1">
                <ShieldCheck className="h-4 w-4" />
                <span>Qualiopi</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4" />
                <span>Alma</span>
              </div>
            </div>
          </div>
        </form>

        {/* Social proof sidebar - Desktop only */}
        <div className="fixed right-6 top-1/2 transform -translate-y-1/2 w-64 hidden xl:block">
          <div className="rounded-2xl bg-white p-6 shadow-xl border border-gray-100">
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-lg font-bold text-[#2EC6F3]">12 personnes</div>
                <div className="text-sm text-gray-600">consultent cette formation</div>
              </div>

              <hr className="border-gray-100" />

              <div>
                <div className="text-sm font-semibold text-gray-900 mb-2">Inscriptions récentes</div>
                <div className="space-y-2 text-xs text-gray-600">
                  <div>Marie L. — il y a 2h</div>
                  <div>Sophie M. — il y a 4h</div>
                  <div>Emma R. — hier</div>
                </div>
              </div>

              <hr className="border-gray-100" />

              <div className="text-center">
                <div className="text-lg font-bold text-[#2EC6F3]">4.9/5</div>
                <div className="text-sm text-gray-600">87 avis Google</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}