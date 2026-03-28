'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClient } from '@/lib/infra/supabase-client'
import { getInscriptionSchema } from '@/lib/validators-inscription'
import {
  User,
  Briefcase,
  ClipboardCheck,
  Euro,
  FileCheck,
  CheckCircle,
  Calendar,
  Clock,
  Users,
  MapPin,
} from 'lucide-react'
import type {
  Formation,
  Session,
  TypeFinancementInscription,
  InscriptionPubliqueData,
  StatutPro,
  NiveauExperience
} from '@/types'

const STATUTS_PRO_OPTIONS: { value: StatutPro; label: string }[] = [
  { value: 'salariee', label: 'Salariée' },
  { value: 'independante', label: 'Indépendante' },
  { value: 'auto_entrepreneur', label: 'Auto-entrepreneur' },
  { value: 'demandeur_emploi', label: 'Demandeur d\'emploi' },
  { value: 'reconversion', label: 'En reconversion' },
  { value: 'etudiante', label: 'Étudiante' },
  { value: 'gerant_institut', label: 'Gérant(e) d\'institut' },
  { value: 'autre', label: 'Autre' }
]

const EXPERIENCE_OPTIONS: { value: NiveauExperience; label: string }[] = [
  { value: 'aucune', label: 'Aucune expérience' },
  { value: 'debutante', label: 'Débutante (< 1 an)' },
  { value: 'intermediaire', label: 'Intermédiaire (1-3 ans)' },
  { value: 'confirmee', label: 'Confirmée (3-5 ans)' },
  { value: 'experte', label: 'Experte (> 5 ans)' }
]

const FINANCEMENT_OPTIONS: { value: TypeFinancementInscription; label: string; description: string }[] = [
  {
    value: 'personnel',
    label: 'Financement personnel',
    description: 'Je finance moi-même ma formation'
  },
  {
    value: 'opco',
    label: 'OPCO',
    description: 'Financement par mon OPCO (salariée)'
  },
  {
    value: 'cpf',
    label: 'CPF',
    description: 'Compte Personnel de Formation'
  },
  {
    value: 'france_travail',
    label: 'France Travail',
    description: 'Aide Individuelle à la Formation (AIF)'
  },
  {
    value: 'employeur',
    label: 'Employeur',
    description: 'Financement direct par l\'employeur'
  },
  {
    value: 'autre',
    label: 'Autre',
    description: 'Autre mode de financement'
  }
]

const OPCO_OPTIONS = [
  { value: 'OPCO_EP', label: 'OPCO EP (Entreprises de proximité)' },
  { value: 'AKTO', label: 'AKTO (Services)' },
  { value: 'FAFCEA', label: 'FAFCEA (Artisanat)' },
  { value: 'FIFPL', label: 'FIF-PL (Professions libérales)' },
  { value: 'TRANSITIONS_PRO', label: 'Transitions Pro (Reconversion)' }
]

// Définition des étapes du parcours inscription
const INSCRIPTION_STEPS = [
  { id: 1, label: 'Identité', icon: User },
  { id: 2, label: 'Profil', icon: Briefcase },
  { id: 3, label: 'Positionnement', icon: ClipboardCheck },
  { id: 4, label: 'Financement', icon: Euro },
  { id: 5, label: 'Récapitulatif', icon: FileCheck },
]

const TOTAL_STEPS = INSCRIPTION_STEPS.length

// Questions de positionnement Qualiopi (I8)
const POSITIONNEMENT_QUESTIONS = [
  {
    id: 'motivation',
    question: 'Quelle est votre principale motivation pour cette formation ?',
    type: 'radio' as const,
    options: [
      'Développer une nouvelle compétence',
      'Me spécialiser dans mon domaine',
      'Reconversion professionnelle',
      'Obligation réglementaire',
      'Développer mon activité'
    ]
  },
  {
    id: 'objectif',
    question: 'Quel est votre objectif après cette formation ?',
    type: 'radio' as const,
    options: [
      'Pratiquer en institut existant',
      'Ouvrir mon propre institut',
      'Ajouter une prestation à mon offre',
      'Formation continue / perfectionnement',
      'Autre'
    ]
  },
  {
    id: 'connaissance_prealable',
    question: 'Avez-vous déjà des connaissances dans ce domaine ?',
    type: 'radio' as const,
    options: [
      'Aucune — je découvre',
      'Notions de base (cours / tutoriels)',
      'J\'ai déjà pratiqué occasionnellement',
      'Je pratique régulièrement',
      'Expert(e) — je veux me perfectionner'
    ]
  },
  {
    id: 'besoin_specifique',
    question: 'Avez-vous des besoins spécifiques d\'accessibilité ?',
    type: 'radio' as const,
    options: [
      'Non, aucun besoin particulier',
      'Oui — mobilité réduite',
      'Oui — déficience visuelle ou auditive',
      'Oui — autre (précisez dans le champ ci-dessous)',
    ]
  },
  {
    id: 'commentaire',
    question: 'Un commentaire ou une question avant la formation ? (optionnel)',
    type: 'text' as const,
    options: []
  },
]

export default function InscriptionPage() {
  const router = useRouter()
  const params = useParams()
  const formationId = params?.formationId as string
  const [currentStep, setCurrentStep] = useState(1)
  const [formation, setFormation] = useState<Formation | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [selectedFinancement, setSelectedFinancement] = useState<TypeFinancementInscription>('personnel')
  const [success, setSuccess] = useState(false)
  const [positionnement, setPositionnement] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [positionnementError, setPositionnementError] = useState(false)

  const supabase = createClient()

  const {
    register,
    watch,
    setValue,
    getValues,
    trigger,
    handleSubmit,
    formState: { errors }
  } = useForm<InscriptionPubliqueData>({
    resolver: zodResolver(getInscriptionSchema(selectedFinancement)),
    mode: 'onChange',
    defaultValues: {
      type_financement: 'personnel',
      civilite: 'Mme',
      rgpd_consent: false,
      reglement_interieur_accepte: false
    }
  })

  const watchedFinancement = watch('type_financement')

  useEffect(() => {
    if (watchedFinancement && watchedFinancement !== selectedFinancement) {
      setSelectedFinancement(watchedFinancement)
    }
  }, [watchedFinancement, selectedFinancement])

  useEffect(() => {
    loadFormationData()
  }, [formationId])

  async function loadFormationData() {
    try {
      setLoading(true)

      // Charger formation
      const { data: formationData, error: formationError } = await supabase
        .from('formations')
        .select('*')
        .eq('id', formationId)
        .eq('is_active', true)
        .single()

      if (formationError) throw formationError
      setFormation(formationData)
      setValue('formation_id', formationData.id)

      // Charger sessions disponibles
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('sessions')
        .select('*')
        .eq('formation_id', formationId)
        .in('statut', ['PLANIFIEE', 'CONFIRMEE'])
        .gte('date_debut', new Date().toISOString().split('T')[0])
        .order('date_debut', { ascending: true })

      if (sessionsError) throw sessionsError

      // Filtrer les sessions avec des places disponibles
      const sessionsAvailable = sessionsData.filter(
        session => session.places_occupees < session.places_max
      )

      setSessions(sessionsAvailable)
    } catch (error) {
      console.error('Erreur chargement formation:', error)
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  async function onSubmit(data: InscriptionPubliqueData) {
    if (submitting) return // Protection double-clic
    try {
      setSubmitting(true)
      setSubmitError(null)

      // Préparer les données pour l'API
      const inscriptionData = {
        ...data,
        source: 'formulaire' as const,
        sujet: 'formation' as const,
        formation_principale_id: data.formation_id
      }

      // Appel API pour créer le lead
      const response = await fetch('/api/webhook/formulaire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inscriptionData)
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la soumission')
      }

      setSuccess(true)
    } catch (error) {
      console.error('Erreur soumission:', error)
      setSubmitError('Erreur lors de l\'envoi. Vérifiez votre connexion et réessayez.')
    } finally {
      setSubmitting(false)
    }
  }

  async function nextStep() {
    let fieldsToValidate: (keyof InscriptionPubliqueData)[] = []

    switch (currentStep) {
      case 1:
        fieldsToValidate = ['civilite', 'prenom', 'nom', 'email', 'telephone', 'date_naissance']
        break
      case 2:
        fieldsToValidate = ['statut_pro', 'experience_esthetique', 'session_id']
        break
      case 3:
        // Positionnement — pas de validation zod, juste vérifier qu'au moins motivation est remplie
        if (!positionnement.motivation) {
          setPositionnementError(true)
          return
        }
        setPositionnementError(false)
        setCurrentStep(currentStep + 1)
        window.scrollTo({ top: 0, behavior: 'smooth' })
        return
      case 4:
        fieldsToValidate = ['type_financement']
        // Ajouter les champs conditionnels selon le type de financement
        switch (selectedFinancement) {
          case 'opco':
            fieldsToValidate.push('opco_employeur_nom', 'opco_employeur_siret', 'opco_organisme')
            break
          case 'cpf':
            fieldsToValidate.push('cpf_numero')
            break
          case 'france_travail':
            fieldsToValidate.push('ft_identifiant', 'ft_agence')
            break
          case 'employeur':
            fieldsToValidate.push('emp_nom', 'emp_siret')
            break
        }
        break
    }

    const isStepValid = await trigger(fieldsToValidate)
    if (isStepValid && currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  function prevStep() {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-[#777777]">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!formation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#111111]">Formation non trouvée</h1>
          <p className="mt-2 text-[#777777]">Cette formation n'existe pas ou n'est plus disponible.</p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#ECFDF5]">
        <div className="max-w-md mx-auto text-center bg-white p-8 rounded-lg shadow-lg">
          <div className="w-16 h-16 bg-[#D1FAE5] rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[#10B981]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#111111] mb-4">
            Demande d'inscription enregistrée !
          </h1>
          <p className="text-[#777777] mb-6">
            Votre demande d'inscription a été enregistrée avec succès.
            Nous vous recontacterons sous 48h pour finaliser votre dossier.
          </p>
          <div className="bg-[#E0EBF5] p-4 rounded-lg">
            <p className="text-sm text-[#6B8CAE]">
              <strong>Formation :</strong> {formation.nom}<br />
              <strong>Email de confirmation :</strong> Envoyé à {watch('email')}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Formation Info */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-[#111111] mb-2">
              Inscription : {formation.nom}
            </h1>
            <div className="flex flex-wrap gap-4 text-sm text-[#777777]">
              <span className="flex items-center">
                ⏱️ {formation.duree_jours} jours ({formation.duree_heures}h)
              </span>
              <span className="flex items-center">
                💰 {formation.prix_ht.toLocaleString('fr-FR')}€ HT
              </span>
              <span className="flex items-center">
                👥 Max {formation.places_max} places
              </span>
            </div>
          </div>
          <div className="mt-4 md:mt-0">
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">
                {formation.prix_ht.toLocaleString('fr-FR')}€ HT
              </div>
              <div className="text-sm text-[#777777]">
                soit {(formation.prix_ht * 1.2).toLocaleString('fr-FR')}€ TTC
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stepper visuel */}
      <div className="mb-8">
        <div className="flex items-center justify-between relative">
          {/* Ligne de fond */}
          <div className="absolute top-5 left-6 right-6 h-0.5" style={{ backgroundColor: '#EEEEEE' }} />
          {/* Ligne de progression */}
          <div
            className="absolute top-5 left-6 h-0.5 transition-all duration-500"
            style={{
              backgroundColor: '#FF5C00',
              width: `${Math.max(0, ((currentStep - 1) / (TOTAL_STEPS - 1)) * 100)}%`,
            }}
          />

          {INSCRIPTION_STEPS.map((step) => {
            const Icon = step.icon
            const isCompleted = currentStep > step.id
            const isActive = currentStep === step.id

            return (
              <div key={step.id} className="relative flex flex-col items-center" style={{ zIndex: 1 }}>
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
                  style={{
                    backgroundColor: isCompleted ? '#FF5C00' : isActive ? '#FFFFFF' : '#F4F0EB',
                    border: isActive ? '2px solid #FF5C00' : isCompleted ? 'none' : '1px solid #EEEEEE',
                    boxShadow: isActive ? '0 0 0 4px rgba(255,92,0,0.15)' : 'none',
                  }}
                >
                  {isCompleted ? (
                    <CheckCircle size={20} className="text-white" />
                  ) : (
                    <Icon size={18} style={{ color: isActive ? '#FF5C00' : '#999999' }} />
                  )}
                </div>
                <span className="mt-2 text-xs font-medium hidden sm:block" style={{
                  color: isCompleted ? '#FF5C00' : isActive ? '#111111' : '#999999'
                }}>
                  {step.label}
                </span>
              </div>
            )
          })}
        </div>
        <div className="mt-4 text-sm text-center" style={{ color: '#777777' }}>
          Étape {currentStep} sur {TOTAL_STEPS} — {INSCRIPTION_STEPS[currentStep - 1]?.label}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow-sm p-6">
        {/* Étape 1: Identité */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-[#111111] mb-6">
              1. Vos informations personnelles
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-[#3A3A3A] mb-2">
                  Civilité *
                </label>
                <div className="flex space-x-4">
                  {['Mme', 'M.'].map((option) => (
                    <label key={option} className="flex items-center">
                      <input
                        type="radio"
                        {...register('civilite')}
                        value={option}
                        className="h-4 w-4 text-primary focus:ring-primary border-[#EEEEEE]"
                      />
                      <span className="ml-2 text-sm text-[#111111]">{option}</span>
                    </label>
                  ))}
                </div>
                {errors.civilite && (
                  <p className="mt-1 text-sm text-[#FF2D78]">{errors.civilite.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="prenom" className="block text-sm font-medium text-[#3A3A3A] mb-2">
                  Prénom *
                </label>
                <input
                  type="text"
                  id="prenom"
                  {...register('prenom')}
                  className="mt-1 block w-full rounded-md border border-[#EEEEEE] px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                {errors.prenom && (
                  <p className="mt-1 text-sm text-[#FF2D78]">{errors.prenom.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="nom" className="block text-sm font-medium text-[#3A3A3A] mb-2">
                  Nom *
                </label>
                <input
                  type="text"
                  id="nom"
                  {...register('nom')}
                  className="mt-1 block w-full rounded-md border border-[#EEEEEE] px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                {errors.nom && (
                  <p className="mt-1 text-sm text-[#FF2D78]">{errors.nom.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#3A3A3A] mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  {...register('email')}
                  className="mt-1 block w-full rounded-md border border-[#EEEEEE] px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-[#FF2D78]">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="telephone" className="block text-sm font-medium text-[#3A3A3A] mb-2">
                  Téléphone *
                </label>
                <input
                  type="tel"
                  id="telephone"
                  placeholder="0X XX XX XX XX"
                  {...register('telephone')}
                  className="mt-1 block w-full rounded-md border border-[#EEEEEE] px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                {errors.telephone && (
                  <p className="mt-1 text-sm text-[#FF2D78]">{errors.telephone.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="date_naissance" className="block text-sm font-medium text-[#3A3A3A] mb-2">
                Date de naissance
              </label>
              <input
                type="date"
                id="date_naissance"
                {...register('date_naissance')}
                max={new Date(new Date().setFullYear(new Date().getFullYear() - 16)).toISOString().split('T')[0]}
                className="mt-1 block w-full md:w-auto rounded-md border border-[#EEEEEE] px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {errors.date_naissance && (
                <p className="mt-1 text-sm text-[#FF2D78]">{errors.date_naissance.message}</p>
              )}
            </div>

            <div>
              <h3 className="text-lg font-medium text-[#111111] mb-4">Adresse (optionnel)</h3>
              <div className="space-y-4">
                <div>
                  <input
                    type="text"
                    placeholder="Rue, numéro"
                    {...register('adresse.rue' as any)}
                    className="mt-1 block w-full rounded-md border border-[#EEEEEE] px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Code postal"
                    {...register('adresse.code_postal' as any)}
                    className="block w-full rounded-md border border-[#EEEEEE] px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <input
                    type="text"
                    placeholder="Ville"
                    {...register('adresse.ville' as any)}
                    className="block w-full rounded-md border border-[#EEEEEE] px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Étape 2: Profil */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-[#111111] mb-6">
              2. Votre profil professionnel
            </h2>

            <div>
              <label htmlFor="statut_pro" className="block text-sm font-medium text-[#3A3A3A] mb-2">
                Statut professionnel *
              </label>
              <select
                id="statut_pro"
                {...register('statut_pro')}
                className="mt-1 block w-full rounded-md border border-[#EEEEEE] px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Sélectionnez votre statut</option>
                {STATUTS_PRO_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.statut_pro && (
                <p className="mt-1 text-sm text-[#FF2D78]">{errors.statut_pro.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="experience_esthetique" className="block text-sm font-medium text-[#3A3A3A] mb-2">
                Expérience en esthétique *
              </label>
              <select
                id="experience_esthetique"
                {...register('experience_esthetique')}
                className="mt-1 block w-full rounded-md border border-[#EEEEEE] px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Sélectionnez votre niveau</option>
                {EXPERIENCE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.experience_esthetique && (
                <p className="mt-1 text-sm text-[#FF2D78]">{errors.experience_esthetique.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="objectif_pro" className="block text-sm font-medium text-[#3A3A3A] mb-2">
                Objectif professionnel (optionnel)
              </label>
              <textarea
                id="objectif_pro"
                rows={4}
                placeholder="Décrivez vos objectifs professionnels après cette formation..."
                {...register('objectif_pro')}
                className="mt-1 block w-full rounded-md border border-[#EEEEEE] px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {errors.objectif_pro && (
                <p className="mt-1 text-sm text-[#FF2D78]">{errors.objectif_pro.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#3A3A3A] mb-4">
                Choisir une session *
              </label>
              {sessions.length === 0 ? (
                <div className="text-center py-8 bg-[#FAF8F5] rounded-lg">
                  <p className="text-[#777777]">Aucune session disponible pour cette formation.</p>
                  <p className="text-sm text-[#777777] mt-2">
                    Contactez-nous au 01 43 14 28 28 pour être informé(e) des prochaines sessions.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sessions.map((session) => {
                    const placesRestantes = session.places_max - session.places_occupees
                    return (
                      <label key={session.id} className="cursor-pointer">
                        <input
                          type="radio"
                          {...register('session_id')}
                          value={session.id}
                          className="sr-only"
                        />
                        <div className="border-2 border-[#EEEEEE] rounded-lg p-4 hover:border-primary transition-colors">
                          <div className="flex justify-between items-start mb-2">
                            <div className="font-medium text-[#111111]">
                              {new Date(session.date_debut).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </div>
                            <div className={`text-sm px-2 py-1 rounded ${
                              placesRestantes <= 2
                                ? 'bg-[#FFE0EF] text-[#FF2D78]'
                                : 'bg-[#D1FAE5] text-[#10B981]'
                            }`}>
                              {placesRestantes} place{placesRestantes > 1 ? 's' : ''} restante{placesRestantes > 1 ? 's' : ''}
                            </div>
                          </div>
                          <div className="text-sm text-[#777777]">
                            Du {new Date(session.date_debut).toLocaleDateString('fr-FR')} au {' '}
                            {new Date(session.date_fin).toLocaleDateString('fr-FR')}
                          </div>
                          <div className="text-sm text-[#777777] mt-1">
                            {session.horaire_debut} - {session.horaire_fin}
                          </div>
                          <div className="text-sm text-[#777777] mt-1">
                            📍 {session.salle}
                          </div>
                        </div>
                      </label>
                    )
                  })}
                </div>
              )}
              {errors.session_id && (
                <p className="mt-1 text-sm text-[#FF2D78]">{errors.session_id.message}</p>
              )}
            </div>
          </div>
        )}

        {/* Étape 3: Positionnement Qualiopi (I8) */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-1" style={{ color: '#111111' }}>
                3. Positionnement pré-formation
              </h2>
              <p className="text-sm" style={{ color: '#777777' }}>
                Ces questions nous permettent d'adapter la formation à votre profil (obligation Qualiopi).
              </p>
            </div>

            {POSITIONNEMENT_QUESTIONS.map((q) => (
              <div key={q.id} className="space-y-3">
                <label className="block text-sm font-medium" style={{ color: '#3A3A3A' }}>
                  {q.question}
                </label>

                {q.type === 'radio' ? (
                  <div className="space-y-2">
                    {q.options.map((option) => (
                      <label
                        key={option}
                        className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors"
                        style={{
                          backgroundColor: positionnement[q.id] === option ? '#FFF0E5' : '#FAF8F5',
                          border: `1px solid ${positionnement[q.id] === option ? '#FF5C00' : '#EEEEEE'}`,
                        }}
                      >
                        <input
                          type="radio"
                          name={q.id}
                          value={option}
                          checked={positionnement[q.id] === option}
                          onChange={(e) => setPositionnement(prev => ({ ...prev, [q.id]: e.target.value }))}
                          className="h-4 w-4 border-[#EEEEEE]"
                          style={{ accentColor: '#FF5C00' }}
                        />
                        <span className="text-sm" style={{ color: '#111111' }}>{option}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <textarea
                    value={positionnement[q.id] || ''}
                    onChange={(e) => setPositionnement(prev => ({ ...prev, [q.id]: e.target.value }))}
                    placeholder="Écrivez ici..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2"
                    style={{
                      backgroundColor: '#FAF8F5',
                      border: '1px solid #EEEEEE',
                      color: '#111111',
                      // @ts-expect-error -- CSS custom property
                      '--tw-ring-color': '#FF5C00',
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Étape 4: Financement */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-[#111111] mb-6">
              4. Mode de financement
            </h2>

            <div>
              <label className="block text-sm font-medium text-[#3A3A3A] mb-4">
                Comment souhaitez-vous financer votre formation ? *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {FINANCEMENT_OPTIONS.map((option) => (
                  <label key={option.value} className="cursor-pointer">
                    <input
                      type="radio"
                      {...register('type_financement')}
                      value={option.value}
                      className="sr-only"
                      onChange={(e) => {
                        setValue('type_financement', e.target.value as TypeFinancementInscription)
                        setSelectedFinancement(e.target.value as TypeFinancementInscription)
                      }}
                    />
                    <div className={`border-2 rounded-lg p-4 transition-colors ${
                      watch('type_financement') === option.value
                        ? 'border-primary bg-[#E0EBF5]'
                        : 'border-[#EEEEEE] hover:border-primary'
                    }`}>
                      <div className="font-medium text-[#111111] mb-1">
                        {option.label}
                      </div>
                      <div className="text-sm text-[#777777]">
                        {option.description}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
              {errors.type_financement && (
                <p className="mt-1 text-sm text-[#FF2D78]">{errors.type_financement.message}</p>
              )}
            </div>

            {/* Champs conditionnels selon le financement */}
            <div className="transition-all duration-300">
              {selectedFinancement === 'opco' && (
                <div className="space-y-4 bg-[#E0EBF5] p-4 rounded-lg">
                  <h3 className="font-medium text-[#111111]">Informations OPCO</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="opco_employeur_nom" className="block text-sm font-medium text-[#3A3A3A] mb-2">
                        Nom de l'employeur *
                      </label>
                      <input
                        type="text"
                        id="opco_employeur_nom"
                        {...register('opco_employeur_nom')}
                        className="mt-1 block w-full rounded-md border border-[#EEEEEE] px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      {errors.opco_employeur_nom && (
                        <p className="mt-1 text-sm text-[#FF2D78]">{errors.opco_employeur_nom.message}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="opco_employeur_siret" className="block text-sm font-medium text-[#3A3A3A] mb-2">
                        SIRET employeur *
                      </label>
                      <input
                        type="text"
                        id="opco_employeur_siret"
                        placeholder="14 chiffres"
                        {...register('opco_employeur_siret')}
                        className="mt-1 block w-full rounded-md border border-[#EEEEEE] px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      {errors.opco_employeur_siret && (
                        <p className="mt-1 text-sm text-[#FF2D78]">{errors.opco_employeur_siret.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="opco_organisme" className="block text-sm font-medium text-[#3A3A3A] mb-2">
                      Votre OPCO *
                    </label>
                    <select
                      id="opco_organisme"
                      {...register('opco_organisme')}
                      className="mt-1 block w-full rounded-md border border-[#EEEEEE] px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="">Sélectionnez votre OPCO</option>
                      {OPCO_OPTIONS.map((opco) => (
                        <option key={opco.value} value={opco.value}>
                          {opco.label}
                        </option>
                      ))}
                    </select>
                    {errors.opco_organisme && (
                      <p className="mt-1 text-sm text-[#FF2D78]">{errors.opco_organisme.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="opco_contact_rh_email" className="block text-sm font-medium text-[#3A3A3A] mb-2">
                      Email contact RH (optionnel)
                    </label>
                    <input
                      type="email"
                      id="opco_contact_rh_email"
                      {...register('opco_contact_rh_email')}
                      className="mt-1 block w-full rounded-md border border-[#EEEEEE] px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    {errors.opco_contact_rh_email && (
                      <p className="mt-1 text-sm text-[#FF2D78]">{errors.opco_contact_rh_email.message}</p>
                    )}
                  </div>
                </div>
              )}

              {selectedFinancement === 'cpf' && (
                <div className="space-y-4 bg-[#E0EBF5] p-4 rounded-lg">
                  <h3 className="font-medium text-[#111111]">Informations CPF</h3>

                  <div>
                    <label htmlFor="cpf_numero" className="block text-sm font-medium text-[#3A3A3A] mb-2">
                      Numéro CPF *
                    </label>
                    <input
                      type="text"
                      id="cpf_numero"
                      placeholder="11 chiffres"
                      {...register('cpf_numero')}
                      className="mt-1 block w-full rounded-md border border-[#EEEEEE] px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    {errors.cpf_numero && (
                      <p className="mt-1 text-sm text-[#FF2D78]">{errors.cpf_numero.message}</p>
                    )}
                  </div>
                </div>
              )}

              {selectedFinancement === 'france_travail' && (
                <div className="space-y-4 bg-[#E0EBF5] p-4 rounded-lg">
                  <h3 className="font-medium text-[#111111]">Informations France Travail</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="ft_identifiant" className="block text-sm font-medium text-[#3A3A3A] mb-2">
                        Identifiant France Travail *
                      </label>
                      <input
                        type="text"
                        id="ft_identifiant"
                        {...register('ft_identifiant')}
                        className="mt-1 block w-full rounded-md border border-[#EEEEEE] px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      {errors.ft_identifiant && (
                        <p className="mt-1 text-sm text-[#FF2D78]">{errors.ft_identifiant.message}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="ft_agence" className="block text-sm font-medium text-[#3A3A3A] mb-2">
                        Agence de rattachement *
                      </label>
                      <input
                        type="text"
                        id="ft_agence"
                        {...register('ft_agence')}
                        className="mt-1 block w-full rounded-md border border-[#EEEEEE] px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      {errors.ft_agence && (
                        <p className="mt-1 text-sm text-[#FF2D78]">{errors.ft_agence.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="ft_conseiller" className="block text-sm font-medium text-[#3A3A3A] mb-2">
                      Nom du conseiller (optionnel)
                    </label>
                    <input
                      type="text"
                      id="ft_conseiller"
                      {...register('ft_conseiller')}
                      className="mt-1 block w-full rounded-md border border-[#EEEEEE] px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    {errors.ft_conseiller && (
                      <p className="mt-1 text-sm text-[#FF2D78]">{errors.ft_conseiller.message}</p>
                    )}
                  </div>
                </div>
              )}

              {selectedFinancement === 'employeur' && (
                <div className="space-y-4 bg-[#E0EBF5] p-4 rounded-lg">
                  <h3 className="font-medium text-[#111111]">Informations employeur</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="emp_nom" className="block text-sm font-medium text-[#3A3A3A] mb-2">
                        Nom de l'employeur *
                      </label>
                      <input
                        type="text"
                        id="emp_nom"
                        {...register('emp_nom')}
                        className="mt-1 block w-full rounded-md border border-[#EEEEEE] px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      {errors.emp_nom && (
                        <p className="mt-1 text-sm text-[#FF2D78]">{errors.emp_nom.message}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="emp_siret" className="block text-sm font-medium text-[#3A3A3A] mb-2">
                        SIRET *
                      </label>
                      <input
                        type="text"
                        id="emp_siret"
                        placeholder="14 chiffres"
                        {...register('emp_siret')}
                        className="mt-1 block w-full rounded-md border border-[#EEEEEE] px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      {errors.emp_siret && (
                        <p className="mt-1 text-sm text-[#FF2D78]">{errors.emp_siret.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="emp_contact" className="block text-sm font-medium text-[#3A3A3A] mb-2">
                      Nom du contact (optionnel)
                    </label>
                    <input
                      type="text"
                      id="emp_contact"
                      {...register('emp_contact')}
                      className="mt-1 block w-full rounded-md border border-[#EEEEEE] px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    {errors.emp_contact && (
                      <p className="mt-1 text-sm text-[#FF2D78]">{errors.emp_contact.message}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Étape 5: Récapitulatif & Validation */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-[#111111] mb-6">
              5. Récapitulatif et validation
            </h2>

            <div className="bg-[#FAF8F5] p-6 rounded-lg space-y-4">
              <div>
                <h3 className="font-medium text-[#111111] mb-2">Formation sélectionnée</h3>
                <p className="text-[#3A3A3A]">{formation.nom}</p>
                <p className="text-sm text-[#777777]">
                  {formation.duree_jours} jours • {formation.prix_ht.toLocaleString('fr-FR')}€ HT
                </p>
              </div>

              <div>
                <h3 className="font-medium text-[#111111] mb-2">Vos informations</h3>
                <p className="text-[#3A3A3A]">
                  {watch('civilite')} {watch('prenom')} {watch('nom')}
                </p>
                <p className="text-sm text-[#777777]">{watch('email')}</p>
                <p className="text-sm text-[#777777]">{watch('telephone')}</p>
              </div>

              <div>
                <h3 className="font-medium text-[#111111] mb-2">Session choisie</h3>
                {watch('session_id') && sessions.find(s => s.id === watch('session_id')) && (
                  <p className="text-[#3A3A3A]">
                    Du {new Date(sessions.find(s => s.id === watch('session_id'))!.date_debut).toLocaleDateString('fr-FR')} au {' '}
                    {new Date(sessions.find(s => s.id === watch('session_id'))!.date_fin).toLocaleDateString('fr-FR')}
                  </p>
                )}
              </div>

              <div>
                <h3 className="font-medium text-[#111111] mb-2">Financement</h3>
                <p className="text-[#3A3A3A]">
                  {FINANCEMENT_OPTIONS.find(f => f.value === watch('type_financement'))?.label}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <label className="flex items-start">
                <input
                  type="checkbox"
                  {...register('rgpd_consent')}
                  className="mt-1 h-4 w-4 text-primary focus:ring-primary border-[#EEEEEE] rounded"
                />
                <span className="ml-2 text-sm text-[#3A3A3A]">
                  J'accepte que mes données personnelles soient collectées et traitées pour le traitement de ma demande d'inscription.
                  <a href="/politique-confidentialite" target="_blank" className="text-primary hover:underline ml-1">
                    En savoir plus sur notre politique de confidentialité
                  </a> *
                </span>
              </label>
              {errors.rgpd_consent && (
                <p className="text-sm text-[#FF2D78]">{errors.rgpd_consent.message}</p>
              )}

              <label className="flex items-start">
                <input
                  type="checkbox"
                  {...register('reglement_interieur_accepte')}
                  className="mt-1 h-4 w-4 text-primary focus:ring-primary border-[#EEEEEE] rounded"
                />
                <span className="ml-2 text-sm text-[#3A3A3A]">
                  J'accepte le règlement intérieur de Dermotec Advanced.
                  <a href="/reglement-interieur" target="_blank" className="text-primary hover:underline ml-1">
                    Consulter le règlement intérieur
                  </a> *
                </span>
              </label>
              {errors.reglement_interieur_accepte && (
                <p className="text-sm text-[#FF2D78]">{errors.reglement_interieur_accepte.message}</p>
              )}
            </div>

            <div className="bg-[#E0EBF5] p-4 rounded-lg">
              <h3 className="font-medium text-[#6B8CAE] mb-2">Prochaines étapes</h3>
              <ul className="text-sm text-[#6B8CAE] space-y-1">
                <li>• Votre demande sera traitée sous 48h</li>
                <li>• Nous vous recontacterons pour finaliser votre dossier</li>
                <li>• Les documents de formation vous seront envoyés par email</li>
                {selectedFinancement !== 'personnel' && (
                  <li>• Nous vous accompagnerons dans votre dossier de financement</li>
                )}
              </ul>
            </div>
          </div>
        )}

        {/* Boutons de navigation */}
        <div className="flex justify-between pt-8 border-t">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={prevStep}
              className="px-6 py-2 border border-[#EEEEEE] text-[#3A3A3A] rounded-md hover:bg-[#FAF8F5] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              Retour
            </button>
          ) : (
            <div></div>
          )}

          {/* Erreur soumission */}
          {submitError && (
            <div className="px-4 py-3 rounded-xl text-sm font-medium" style={{ backgroundColor: '#FFE0EF', color: '#FF2D78', border: '1px solid #FF2D78' }}>
              {submitError}
            </div>
          )}
          {positionnementError && currentStep === 3 && (
            <div className="px-4 py-3 rounded-xl text-sm font-medium" style={{ backgroundColor: '#FFE0EF', color: '#FF2D78', border: '1px solid #FF2D78' }}>
              Veuillez répondre à la question sur votre motivation avant de continuer.
            </div>
          )}

          {currentStep < TOTAL_STEPS ? (
            <button
              type="button"
              onClick={nextStep}
              className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              Continuer
            </button>
          ) : (
            <button
              type="submit"
              disabled={submitting}
              className="px-8 py-3 bg-primary text-white rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Envoi en cours...
                </>
              ) : (
                'Envoyer ma demande d\'inscription'
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  )
}