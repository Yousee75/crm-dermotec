'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ChevronLeft, ChevronRight, Search, Star, Calendar, MapPin, Users, Clock, Euro, FileCheck, CreditCard, Phone, Mail, Sparkles, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
// Tabs inline — pas de composant Tabs shadcn
import { FORMATIONS_SEED, BRAND, TVA_TAUX } from '@/lib/constants'
import { calculerFinancement } from '@/lib/financement-data'
import { useLead } from '@/hooks/use-leads'
import { useSessions } from '@/hooks/use-sessions'
import { useCreateInscription } from '@/hooks/use-inscriptions'
import { useCreateFinancement } from '@/hooks/use-financements'
import { cn } from '@/lib/utils'

interface WizardInscriptionProps {
  leadId: string
  preselectedFormationId?: string
  preselectedSessionId?: string
  onComplete?: (inscriptionId: string) => void
  onCancel?: () => void
}

interface FormationData {
  nom: string
  slug: string
  categorie: 'Hygiène' | 'Dermo-Esthétique' | 'Dermo-Correctrice' | 'Soins Visage' | 'Soins Corps' | 'Laser & IPL'
  prix_ht: number
  duree_jours: number
  duree_heures: number
  niveau: 'debutant' | 'intermediaire' | 'confirme'
  prerequis?: string
  description_commerciale: string
}

interface WizardData {
  formation: FormationData | null
  session: any | null
  financement: {
    mode: 'organisme' | 'personnel' | 'employeur'
    organisme?: string
    montantPrisEnCharge?: number
    resteACharge?: number
    optionPaiement?: string
  }
  validation: {
    prerequis: boolean
    programme: boolean
    retractation: boolean
  }
}

const ORGANISMES_OPTIONS = [
  { id: 'opco-ep', nom: 'OPCO EP', description: 'Entreprises de proximité' },
  { id: 'fafcea', nom: 'FAFCEA', description: 'Artisans indépendants' },
  { id: 'fifpl', nom: 'FIFPL', description: 'Professions libérales' },
  { id: 'cpf', nom: 'CPF', description: 'Compte personnel de formation' },
  { id: 'france-travail-aif', nom: 'AIF', description: 'Aide individuelle à la formation' },
  { id: 'region-ile-de-france', nom: 'Région IDF', description: 'Dispositifs régionaux' },
]

const CATEGORIES = [
  'Toutes',
  'Hygiène',
  'Dermo-Esthétique',
  'Dermo-Correctrice',
  'Soins Visage',
  'Soins Corps',
  'Laser & IPL',
] as const

const STEPS = [
  { id: 1, label: 'Formation', description: 'Choisir une formation' },
  { id: 2, label: 'Session', description: 'Choisir une session' },
  { id: 3, label: 'Financement', description: 'Mode de financement' },
  { id: 4, label: 'Validation', description: 'Récapitulatif' },
  { id: 5, label: 'Confirmation', description: 'Terminé' },
]

export default function WizardInscription({
  leadId,
  preselectedFormationId,
  preselectedSessionId,
  onComplete,
  onCancel
}: WizardInscriptionProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('Toutes')

  const [wizardData, setWizardData] = useState<WizardData>({
    formation: null,
    session: null,
    financement: {
      mode: 'organisme'
    },
    validation: {
      prerequis: false,
      programme: false,
      retractation: false
    }
  })

  // Hooks
  const { data: lead } = useLead(leadId)
  const { data: sessions } = useSessions({
    formation_id: wizardData.formation ? wizardData.formation.slug : undefined
  })
  const createInscription = useCreateInscription()
  const createFinancement = useCreateFinancement()

  // Formations filtrées
  const filteredFormations = useMemo(() => {
    return FORMATIONS_SEED.filter((formation) => {
      const matchesCategory = selectedCategory === 'Toutes' || formation.categorie === selectedCategory
      const matchesSearch = formation.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          formation.description_commerciale.toLowerCase().includes(searchTerm.toLowerCase())
      return matchesCategory && matchesSearch
    })
  }, [searchTerm, selectedCategory])

  // Sessions filtrées (futures + places disponibles)
  const availableSessions = useMemo(() => {
    if (!sessions || !wizardData.formation) return []

    return sessions.filter(session => {
      const isInFuture = new Date(session.date_debut) > new Date()
      const hasAvailableSpaces = (session.places_max || 12) > (session.places_occupees || 0)
      return isInFuture && hasAvailableSpaces
    })
  }, [sessions, wizardData.formation])

  // Calcul du financement
  const financementCalculation = useMemo(() => {
    if (!wizardData.formation || !wizardData.financement.organisme) {
      return { montantPrisEnCharge: 0, resteACharge: wizardData.formation?.prix_ht || 0, details: '' }
    }

    return calculerFinancement(
      wizardData.formation.prix_ht,
      wizardData.financement.organisme,
      wizardData.formation.duree_heures
    )
  }, [wizardData.formation, wizardData.financement.organisme])

  // Auto-sélection des formations/sessions prédéfinies
  useState(() => {
    if (preselectedFormationId) {
      const formation = FORMATIONS_SEED.find(f => f.slug === preselectedFormationId)
      if (formation) {
        setWizardData(prev => ({ ...prev, formation }))
        setCurrentStep(2)
      }
    }
  })

  // Navigation
  const goToStep = (step: number) => {
    if (step < currentStep || canProceedToStep(step)) {
      setCurrentStep(step)
    }
  }

  const canProceedToStep = (step: number): boolean => {
    switch (step) {
      case 2: return !!wizardData.formation
      case 3: return !!wizardData.formation && !!wizardData.session
      case 4: return !!wizardData.formation && !!wizardData.session && !!wizardData.financement.mode
      case 5: return !!wizardData.formation && !!wizardData.session && wizardData.validation.prerequis && wizardData.validation.programme
      default: return true
    }
  }

  const nextStep = () => {
    if (currentStep < 5 && canProceedToStep(currentStep + 1)) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  // Gestion des sélections
  const selectFormation = (formation: FormationData) => {
    setWizardData(prev => ({ ...prev, formation, session: null }))
    // Auto-sélection si session prédéfinie
    if (preselectedSessionId && availableSessions.find(s => s.id === preselectedSessionId)) {
      const session = availableSessions.find(s => s.id === preselectedSessionId)
      setWizardData(prev => ({ ...prev, session }))
      setCurrentStep(3)
    } else {
      nextStep()
    }
  }

  const selectSession = (session: any) => {
    setWizardData(prev => ({ ...prev, session }))
    nextStep()
  }

  const updateFinancement = (updates: Partial<WizardData['financement']>) => {
    setWizardData(prev => ({
      ...prev,
      financement: { ...prev.financement, ...updates }
    }))
  }

  const updateValidation = (field: keyof WizardData['validation'], value: boolean) => {
    setWizardData(prev => ({
      ...prev,
      validation: { ...prev.validation, [field]: value }
    }))
  }

  // Soumission finale
  const handleSubmit = async () => {
    if (!wizardData.formation || !wizardData.session || !lead) {
      toast.error('Données manquantes pour créer l\'inscription')
      return
    }

    try {
      // Calculer les montants
      const prixTTC = wizardData.formation.prix_ht * (1 + TVA_TAUX.formation / 100)
      const montantFinance = wizardData.financement.mode === 'organisme'
        ? financementCalculation.montantPrisEnCharge
        : 0
      const resteACharge = prixTTC - montantFinance

      // Créer l'inscription
      const inscription = await createInscription.mutateAsync({
        lead_id: leadId,
        session_id: wizardData.session.id,
        montant_total: prixTTC,
        montant_finance: montantFinance,
        reste_a_charge: resteACharge,
        mode_paiement: wizardData.financement.optionPaiement || 'carte',
        statut: 'CONFIRMEE' as const,
        paiement_statut: montantFinance > 0 ? 'EN_ATTENTE' : 'EN_ATTENTE' as const
      })

      // Créer le financement si nécessaire
      if (wizardData.financement.mode === 'organisme' && wizardData.financement.organisme) {
        await createFinancement.mutateAsync({
          lead_id: leadId,
          inscription_id: inscription.id,
          organisme: wizardData.financement.organisme as any,
          montant_demande: wizardData.formation.prix_ht,
          montant_accorde: financementCalculation.montantPrisEnCharge,
          statut: 'PREPARATION' as any,
        })
      }

      setCurrentStep(5)
      toast.success('Inscription créée avec succès!')

      if (onComplete) {
        onComplete(inscription.id)
      }
    } catch (error) {
      console.error('Erreur création inscription:', error)
      toast.error('Erreur lors de la création de l\'inscription')
    }
  }

  // Animation variants
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 300 : -300,
      opacity: 0
    })
  }

  const [direction, setDirection] = useState(0)
  const paginate = (newDirection: number) => {
    setDirection(newDirection)
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header avec barre de progression */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-900">
            Nouvelle Inscription
          </h1>
          {onCancel && (
            <Button variant="ghost" onClick={onCancel} className="text-slate-600">
              Annuler
            </Button>
          )}
        </div>

        {/* Barre de progression */}
        <div className="relative">
          <Progress value={(currentStep / 5) * 100} className="h-2 mb-4" />

          <div className="flex justify-between items-center">
            {STEPS.map((step, index) => (
              <div
                key={step.id}
                className={cn(
                  "flex flex-col items-center cursor-pointer transition-colors",
                  currentStep >= step.id ? "text-blue-600" : "text-slate-400"
                )}
                onClick={() => goToStep(step.id)}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mb-2 transition-colors",
                  currentStep > step.id
                    ? "bg-blue-600 text-white"
                    : currentStep === step.id
                    ? "bg-blue-100 text-blue-600 border-2 border-blue-600"
                    : "bg-slate-100 text-slate-400"
                )}>
                  {currentStep > step.id ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    step.id
                  )}
                </div>
                <span className="text-xs font-medium">{step.label}</span>
                <span className="text-xs text-slate-500 hidden sm:block">{step.description}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Contenu des étapes */}
      <div className="relative min-h-[600px]">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 }
            }}
            className="absolute w-full"
          >
            {/* ÉTAPE 1 — Choisir une formation */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Rechercher une formation..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                          selectedCategory === cat
                            ? 'bg-[#2EC6F3] text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {cat === 'Toutes' ? 'Toutes' : cat.replace('Dermo-', '')}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredFormations.map((formation) => {
                        const isRecommended = lead?.formation_principale?.slug === formation.slug ||
                                            lead?.tags?.includes(formation.categorie)
                        const hasPrerequisites = formation.niveau !== 'debutant' || formation.prerequis

                        return (
                          <motion.div
                            key={formation.slug}
                            whileHover={{ y: -4, scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Card
                              className={cn(
                                "cursor-pointer transition-all duration-200 hover:shadow-lg",
                                wizardData.formation?.slug === formation.slug
                                  ? "ring-2 ring-blue-500 shadow-lg"
                                  : "hover:shadow-md"
                              )}
                              onClick={() => selectFormation(formation)}
                            >
                              <CardHeader className="pb-3">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <CardTitle className="text-lg mb-1">{formation.nom}</CardTitle>
                                    <Badge variant="secondary" className="text-xs">
                                      {formation.categorie}
                                    </Badge>
                                  </div>
                                  {isRecommended && (
                                    <Badge variant="default" className="bg-yellow-500 text-white">
                                      <Star className="w-3 h-3 mr-1" />
                                      Recommandé
                                    </Badge>
                                  )}
                                </div>
                              </CardHeader>
                              <CardContent>
                                <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                                  {formation.description_commerciale}
                                </p>

                                <div className="flex items-center justify-between text-sm text-slate-500 mb-3">
                                  <div className="flex items-center gap-4">
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {formation.duree_jours}j
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Euro className="w-3 h-3" />
                                      {formation.prix_ht}€ HT
                                    </span>
                                  </div>
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "text-xs",
                                      formation.niveau === 'debutant' && "border-green-200 text-green-700",
                                      formation.niveau === 'intermediaire' && "border-orange-200 text-orange-700",
                                      formation.niveau === 'confirme' && "border-red-200 text-red-700"
                                    )}
                                  >
                                    {formation.niveau}
                                  </Badge>
                                </div>

                                {hasPrerequisites && (
                                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-2">
                                    <p className="text-xs text-amber-700">
                                      {formation.prerequis || "Prérequis : Hygiène & Salubrité"}
                                    </p>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          </motion.div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ÉTAPE 2 — Choisir une session */}
            {currentStep === 2 && wizardData.formation && (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">Formation sélectionnée</h3>
                  <div className="flex items-center gap-4">
                    <span className="font-medium">{wizardData.formation.nom}</span>
                    <Badge variant="secondary">{wizardData.formation.categorie}</Badge>
                    <span className="text-sm text-blue-700">{wizardData.formation.prix_ht}€ HT</span>
                  </div>
                </div>

                {availableSessions.length > 0 ? (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Sessions disponibles</h3>

                    <div className="grid gap-4">
                      {availableSessions.map((session) => {
                        const placesRestantes = (session.places_max || 12) - (session.places_occupees || 0)
                        const dateDebut = new Date(session.date_debut)
                        const dateFin = new Date(session.date_fin)

                        return (
                          <motion.div
                            key={session.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Card
                              className={cn(
                                "cursor-pointer transition-all duration-200",
                                wizardData.session?.id === session.id
                                  ? "ring-2 ring-blue-500 shadow-lg"
                                  : "hover:shadow-md"
                              )}
                              onClick={() => selectSession(session)}
                            >
                              <CardContent className="p-6">
                                <div className="flex flex-col lg:flex-row justify-between gap-4">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-3">
                                      <Calendar className="w-5 h-5 text-blue-600" />
                                      <div>
                                        <p className="font-semibold">
                                          {dateDebut.toLocaleDateString('fr-FR', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                          })}
                                        </p>
                                        {dateDebut.getTime() !== dateFin.getTime() && (
                                          <p className="text-sm text-slate-600">
                                            au {dateFin.toLocaleDateString('fr-FR', {
                                              weekday: 'long',
                                              month: 'long',
                                              day: 'numeric'
                                            })}
                                          </p>
                                        )}
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-6 text-sm text-slate-600">
                                      <span className="flex items-center gap-1">
                                        <Clock className="w-4 h-4" />
                                        9h - 17h
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <MapPin className="w-4 h-4" />
                                        {BRAND.address}, {BRAND.city}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex flex-col lg:items-end gap-2">
                                    {session.formatrice && (
                                      <div className="flex items-center gap-2">
                                        <div className={cn(
                                          "w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium",
                                          `bg-${session.formatrice.avatar_color || 'blue'}-500`
                                        )}>
                                          {session.formatrice.prenom?.[0]}{session.formatrice.nom?.[0]}
                                        </div>
                                        <span className="text-sm font-medium">
                                          {session.formatrice.prenom} {session.formatrice.nom}
                                        </span>
                                      </div>
                                    )}

                                    <div className="flex items-center gap-2">
                                      <Users className="w-4 h-4 text-slate-500" />
                                      <span className="text-sm">
                                        {placesRestantes} place{placesRestantes > 1 ? 's' : ''} restante{placesRestantes > 1 ? 's' : ''}
                                      </span>
                                    </div>

                                    <div className="w-full lg:w-32">
                                      <div className="bg-slate-200 rounded-full h-2">
                                        <div
                                          className="bg-green-500 h-2 rounded-full transition-all"
                                          style={{
                                            width: `${Math.max(10, (placesRestantes / (session.places_max || 12)) * 100)}%`
                                          }}
                                        />
                                      </div>
                                    </div>

                                    <div className="font-semibold text-lg">
                                      {(wizardData.formation.prix_ht * 1.2).toFixed(0)}€ TTC
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <Card className="border-dashed border-2 border-slate-300">
                    <CardContent className="text-center py-12">
                      <Calendar className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-slate-600 mb-2">
                        Aucune session disponible
                      </h3>
                      <p className="text-slate-500 mb-4">
                        Il n'y a actuellement aucune session programmée pour cette formation.
                      </p>
                      <div className="flex gap-3 justify-center">
                        <Button variant="outline" size="sm">
                          <Phone className="w-4 h-4 mr-2" />
                          Nous contacter
                        </Button>
                        <Button size="sm">
                          <Calendar className="w-4 h-4 mr-2" />
                          Créer une session
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* ÉTAPE 3 — Financement */}
            {currentStep === 3 && wizardData.formation && wizardData.session && (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">Récapitulatif</h3>
                  <div className="flex flex-col lg:flex-row justify-between gap-2">
                    <div>
                      <p className="font-medium">{wizardData.formation.nom}</p>
                      <p className="text-sm text-blue-700">
                        {new Date(wizardData.session.date_debut).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-lg">{wizardData.formation.prix_ht}€ HT</p>
                      <p className="text-sm text-blue-700">
                        {(wizardData.formation.prix_ht * 1.2).toFixed(0)}€ TTC
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Mode de financement</h3>

                  <RadioGroup
                    value={wizardData.financement.mode}
                    onValueChange={(value) => updateFinancement({ mode: value as any })}
                  >
                    <div className="space-y-3">
                      <Label htmlFor="organisme" className="flex items-center space-x-3 cursor-pointer">
                        <RadioGroupItem value="organisme" id="organisme" />
                        <div className="flex-1">
                          <div className="font-medium">Financement organisme</div>
                          <div className="text-sm text-slate-600">
                            OPCO, FAFCEA, FIFPL, CPF, AIF...
                          </div>
                        </div>
                      </Label>

                      <Label htmlFor="personnel" className="flex items-center space-x-3 cursor-pointer">
                        <RadioGroupItem value="personnel" id="personnel" />
                        <div className="flex-1">
                          <div className="font-medium">Paiement personnel</div>
                          <div className="text-sm text-slate-600">
                            Carte, virement, échelonnement possible
                          </div>
                        </div>
                      </Label>

                      <Label htmlFor="employeur" className="flex items-center space-x-3 cursor-pointer">
                        <RadioGroupItem value="employeur" id="employeur" />
                        <div className="flex-1">
                          <div className="font-medium">Employeur</div>
                          <div className="text-sm text-slate-600">
                            Prise en charge par l'entreprise
                          </div>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>

                  {/* Financement organisme */}
                  {wizardData.financement.mode === 'organisme' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      transition={{ duration: 0.3 }}
                      className="space-y-4"
                    >
                      <div>
                        <Label className="text-sm font-medium mb-2 block">
                          Sélectionnez votre organisme
                        </Label>
                        <RadioGroup
                          value={wizardData.financement.organisme}
                          onValueChange={(value) => updateFinancement({ organisme: value })}
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {ORGANISMES_OPTIONS.map((organisme) => (
                              <Label
                                key={organisme.id}
                                htmlFor={organisme.id}
                                className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50"
                              >
                                <RadioGroupItem value={organisme.id} id={organisme.id} />
                                <div className="flex-1">
                                  <div className="font-medium text-sm">{organisme.nom}</div>
                                  <div className="text-xs text-slate-600">{organisme.description}</div>
                                </div>
                              </Label>
                            ))}
                          </div>
                        </RadioGroup>
                      </div>

                      {wizardData.financement.organisme && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                          className="bg-green-50 border border-green-200 rounded-lg p-4"
                        >
                          <h4 className="font-semibold text-green-900 mb-2">Simulation de prise en charge</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>Montant formation HT :</span>
                              <span className="font-medium">{wizardData.formation.prix_ht}€</span>
                            </div>
                            <div className="flex justify-between text-green-700">
                              <span>Pris en charge :</span>
                              <span className="font-medium">-{financementCalculation.montantPrisEnCharge}€</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between text-lg font-bold">
                              <span>Reste à charge :</span>
                              <span className={financementCalculation.resteACharge === 0 ? "text-green-600" : "text-slate-900"}>
                                {financementCalculation.resteACharge}€
                              </span>
                            </div>
                            {financementCalculation.resteACharge === 0 && (
                              <div className="flex items-center gap-2 text-green-600 mt-2">
                                <CheckCircle2 className="w-4 h-4" />
                                <span className="text-sm font-medium">Formation 100% prise en charge !</span>
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-green-700 mt-2">{financementCalculation.details}</p>
                        </motion.div>
                      )}
                    </motion.div>
                  )}

                  {/* Paiement personnel */}
                  {wizardData.financement.mode === 'personnel' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      transition={{ duration: 0.3 }}
                      className="space-y-4"
                    >
                      <div>
                        <Label className="text-sm font-medium mb-2 block">
                          Options de paiement
                        </Label>
                        <RadioGroup
                          value={wizardData.financement.optionPaiement}
                          onValueChange={(value) => updateFinancement({ optionPaiement: value })}
                        >
                          <div className="space-y-2">
                            <Label htmlFor="1x" className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-slate-50">
                              <div className="flex items-center space-x-3">
                                <RadioGroupItem value="1x" id="1x" />
                                <span className="font-medium">Paiement en 1 fois</span>
                              </div>
                              <span className="font-bold text-lg">{(wizardData.formation.prix_ht * 1.2).toFixed(0)}€</span>
                            </Label>

                            <Label htmlFor="2x" className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-slate-50">
                              <div className="flex items-center space-x-3">
                                <RadioGroupItem value="2x" id="2x" />
                                <span className="font-medium">Paiement en 2 fois</span>
                              </div>
                              <span className="text-sm text-slate-600">
                                2 × {((wizardData.formation.prix_ht * 1.2) / 2).toFixed(0)}€
                              </span>
                            </Label>

                            <Label htmlFor="3x" className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-slate-50">
                              <div className="flex items-center space-x-3">
                                <RadioGroupItem value="3x" id="3x" />
                                <span className="font-medium">Paiement en 3 fois</span>
                              </div>
                              <span className="text-sm text-slate-600">
                                3 × {((wizardData.formation.prix_ht * 1.2) / 3).toFixed(0)}€
                              </span>
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>

                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Moyens de paiement acceptés</h4>
                        <div className="flex items-center gap-4 text-sm text-blue-700">
                          <span className="flex items-center gap-1">
                            <CreditCard className="w-4 h-4" />
                            Carte bancaire
                          </span>
                          <span>•</span>
                          <span>Virement</span>
                          <span>•</span>
                          <span>Chèque</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            )}

            {/* ÉTAPE 4 — Récapitulatif & Validation */}
            {currentStep === 4 && wizardData.formation && wizardData.session && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold">Récapitulatif de l'inscription</h2>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Informations lead */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Stagiaire</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div>
                        <span className="font-medium">{lead?.prenom} {lead?.nom}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Mail className="w-4 h-4" />
                        {lead?.email}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Phone className="w-4 h-4" />
                        {lead?.telephone}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Formation et session */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Formation</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="font-medium">{wizardData.formation.nom}</p>
                        <Badge variant="secondary" className="mt-1">{wizardData.formation.categorie}</Badge>
                      </div>
                      <div className="text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {new Date(wizardData.session.date_debut).toLocaleDateString('fr-FR', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="w-4 h-4" />
                          {wizardData.formation.duree_jours} jour{wizardData.formation.duree_jours > 1 ? 's' : ''} • 9h-17h
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <MapPin className="w-4 h-4" />
                          {BRAND.address}, {BRAND.city}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Financement */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Financement</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium mb-2">Mode de financement</h4>
                        <p className="text-sm text-slate-600">
                          {wizardData.financement.mode === 'organisme' && `Organisme : ${ORGANISMES_OPTIONS.find(o => o.id === wizardData.financement.organisme)?.nom}`}
                          {wizardData.financement.mode === 'personnel' && `Paiement personnel : ${wizardData.financement.optionPaiement}`}
                          {wizardData.financement.mode === 'employeur' && 'Employeur'}
                        </p>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Montants</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>Formation HT :</span>
                            <span>{wizardData.formation.prix_ht}€</span>
                          </div>
                          <div className="flex justify-between">
                            <span>TVA (20%) :</span>
                            <span>{(wizardData.formation.prix_ht * 0.2).toFixed(0)}€</span>
                          </div>
                          <div className="flex justify-between font-medium">
                            <span>Total TTC :</span>
                            <span>{(wizardData.formation.prix_ht * 1.2).toFixed(0)}€</span>
                          </div>
                          {wizardData.financement.mode === 'organisme' && financementCalculation.montantPrisEnCharge > 0 && (
                            <>
                              <div className="flex justify-between text-green-600">
                                <span>Pris en charge :</span>
                                <span>-{financementCalculation.montantPrisEnCharge}€</span>
                              </div>
                              <Separator />
                              <div className="flex justify-between font-bold text-lg">
                                <span>Reste à charge :</span>
                                <span>{financementCalculation.resteACharge}€</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Checklist de validation */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Validation</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="prerequis"
                        checked={wizardData.validation.prerequis}
                        onCheckedChange={(checked) => updateValidation('prerequis', checked as boolean)}
                      />
                      <Label htmlFor="prerequis" className="text-sm cursor-pointer">
                        Le stagiaire a été informé des prérequis
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="programme"
                        checked={wizardData.validation.programme}
                        onCheckedChange={(checked) => updateValidation('programme', checked as boolean)}
                      />
                      <Label htmlFor="programme" className="text-sm cursor-pointer">
                        Le programme de formation a été transmis
                      </Label>
                    </div>

                    {wizardData.financement.mode === 'personnel' && (
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="retractation"
                          checked={wizardData.validation.retractation}
                          onCheckedChange={(checked) => updateValidation('retractation', checked as boolean)}
                        />
                        <Label htmlFor="retractation" className="text-sm cursor-pointer">
                          Le délai de rétractation (10 jours) a été mentionné
                        </Label>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ÉTAPE 5 — Confirmation & Prochaines étapes */}
            {currentStep === 5 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center space-y-6"
              >
                <div className="relative">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4"
                  >
                    <Check className="w-12 h-12 text-white" />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="absolute -top-2 -right-2 text-yellow-500"
                  >
                    <Sparkles className="w-8 h-8" />
                  </motion.div>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">
                    Inscription confirmée !
                  </h2>
                  <p className="text-slate-600">
                    L'inscription de {lead?.prenom} {lead?.nom} a été créée avec succès.
                  </p>
                </div>

                <Card className="text-left max-w-md mx-auto">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                      Ce qui a été créé
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500" />
                      <span>Inscription créée</span>
                    </div>
                    {wizardData.financement.mode === 'organisme' && (
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-500" />
                        <span>Financement initié</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500" />
                      <span>Activité loguée</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="text-left max-w-md mx-auto">
                  <CardHeader>
                    <CardTitle className="text-lg">Prochaines actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button size="sm" className="w-full justify-start">
                      <FileCheck className="w-4 h-4 mr-2" />
                      Envoyer la convention
                    </Button>

                    {wizardData.financement.mode === 'personnel' && (
                      <Button size="sm" variant="outline" className="w-full justify-start">
                        <CreditCard className="w-4 h-4 mr-2" />
                        Envoyer le lien de paiement
                      </Button>
                    )}

                    {wizardData.financement.mode === 'organisme' && (
                      <Button size="sm" variant="outline" className="w-full justify-start">
                        <FileCheck className="w-4 h-4 mr-2" />
                        Monter le dossier de financement
                      </Button>
                    )}

                    <Button size="sm" variant="outline" className="w-full justify-start">
                      <Mail className="w-4 h-4 mr-2" />
                      Envoyer la convocation
                    </Button>
                  </CardContent>
                </Card>

                <div className="flex gap-3 justify-center">
                  <Button
                    variant="outline"
                    onClick={() => {
                      // Reset wizard
                      setWizardData({
                        formation: null,
                        session: null,
                        financement: { mode: 'organisme' },
                        validation: { prerequis: false, programme: false, retractation: false }
                      })
                      setCurrentStep(1)
                    }}
                  >
                    Nouvelle inscription
                  </Button>

                  <Button onClick={onCancel}>
                    Retour au lead
                  </Button>
                </div>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Boutons navigation */}
      {currentStep < 5 && (
        <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-200">
          <Button
            variant="ghost"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Précédent
          </Button>

          <div className="flex gap-2">
            {currentStep === 4 ? (
              <Button
                onClick={handleSubmit}
                disabled={!canProceedToStep(5) || createInscription.isPending}
                className="flex items-center gap-2"
              >
                {createInscription.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Création...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Confirmer l'inscription
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={() => { paginate(1); nextStep(); }}
                disabled={!canProceedToStep(currentStep + 1)}
                className="flex items-center gap-2"
              >
                Suivant
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}