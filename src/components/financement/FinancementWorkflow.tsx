'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  ChevronRight,
  Check,
  AlertCircle,
  Clock,
  Euro,
  FileText,
  Upload,
  Download,
  Eye,
  Edit3,
  Trash2,
  Plus,
  Send,
  CreditCard,
  CheckCircle,
  XCircle,
  ArrowRight,
  User,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  Percent,
  AlertTriangle,
  Info,
  PlusCircle,
  ExternalLink,
  Copy,
  Save,
  Filter,
  RotateCcw
} from 'lucide-react'
import { formatEuro, formatDate, cn } from '@/lib/utils'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Progress } from '@/components/ui/progress'
import { TabsRoot as Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { useFinancement } from '@/hooks/use-financements'
import { toast } from 'sonner'

interface FinancementWorkflowProps {
  financementId: string
  onClose?: () => void
}

// Les 14 étapes du workflow financement
const WORKFLOW_STEPS = [
  { id: 'QUALIFICATION', label: 'Qualification', description: 'Évaluation du besoin et de la demande' },
  { id: 'COLLECTE_DOCS', label: 'Collecte docs', description: 'Rassemblement des documents requis' },
  { id: 'DOSSIER_COMPLET', label: 'Dossier complet', description: 'Validation complétude du dossier' },
  { id: 'DEPOSE', label: 'Déposé', description: 'Soumission officielle au financeur' },
  { id: 'EN_INSTRUCTION', label: 'En instruction', description: 'Examen par le financeur' },
  { id: 'COMPLEMENT_DEMANDE', label: 'Complément demandé', description: 'Informations supplémentaires requises' },
  { id: 'ACCORDE', label: 'Accordé (APC reçu)', description: 'Accord de prise en charge obtenu' },
  { id: 'INSCRIPTION_CONFIRMEE', label: 'Inscription confirmée', description: 'Place réservée en formation' },
  { id: 'EN_FORMATION', label: 'En formation', description: 'Stagiaire en cours de formation' },
  { id: 'FACTURE_ENVOYEE', label: 'Facture envoyée', description: 'Facturation émise au financeur' },
  { id: 'PAIEMENT_RECU', label: 'Paiement reçu', description: 'Encaissement effectué' },
  { id: 'CLOTURE', label: 'Clôturé', description: 'Dossier définitivement terminé' },
  { id: 'REFUSE', label: 'Refusé', description: 'Demande de financement rejetée' },
  { id: 'ANNULE', label: 'Annulé', description: 'Dossier annulé par le demandeur' }
] as const

// Mock data pour les fonctionnalités non implémentées
// TODO: Remplacer par de vrais hooks quand les tables seront créées
const mockFactures: Array<{
  id: string; numero: string; type: string; destinataire: string;
  montantHT: number; tauxTVA: number; montantTTC: number;
  statut: 'brouillon' | 'envoyee' | 'payee'; dateEmission: string;
  dateEcheance: string; dateEnvoi?: string; relances: number;
}> = [
  {
    id: '1',
    numero: 'FAC-2026-0001',
    type: 'facture',
    destinataire: 'OPCO EP',
    montantHT: 1200,
    tauxTVA: 0,
    montantTTC: 1200,
    statut: 'envoyee',
    dateEmission: '2026-03-15',
    dateEcheance: '2026-04-15',
    dateEnvoi: '2026-03-15',
    relances: 0
  },
  {
    id: '2',
    numero: 'FAC-2026-0002',
    type: 'avoir',
    destinataire: 'Stagiaire',
    montantHT: -200,
    tauxTVA: 20,
    montantTTC: -240,
    statut: 'brouillon',
    dateEmission: '2026-03-20',
    dateEcheance: '2026-04-20',
    relances: 0
  }
]

const mockPaiements = [
  {
    id: '1',
    type: 'financement_organisme',
    moyen: 'virement',
    montant: 1200,
    statut: 'en_attente' as const,
    dateEcheance: '2026-04-15',
    reference: 'VIR-OPCO-2026-1234',
    factureId: '1'
  },
  {
    id: '2',
    type: 'reste_a_charge',
    moyen: 'cb',
    montant: 300,
    statut: 'recu' as const,
    datePaiement: '2026-03-10',
    reference: 'CB-****-1234'
  }
]

const mockDocuments = [
  {
    id: '1',
    nom: 'Devis formation',
    type: 'pdf',
    statut: 'valide' as const,
    dateUpload: '2026-03-01',
    etapeRequise: 'QUALIFICATION',
    obligatoire: true
  },
  {
    id: '2',
    nom: 'Programme pédagogique',
    type: 'pdf',
    statut: 'valide' as const,
    dateUpload: '2026-03-02',
    etapeRequise: 'COLLECTE_DOCS',
    obligatoire: true
  },
  {
    id: '3',
    nom: 'Convention de formation',
    type: 'pdf',
    statut: 'en_attente' as const,
    etapeRequise: 'DOSSIER_COMPLET',
    obligatoire: true
  },
  {
    id: '4',
    nom: 'Attestation URSSAF',
    type: 'pdf',
    statut: 'refuse' as const,
    dateUpload: '2026-03-05',
    etapeRequise: 'DOSSIER_COMPLET',
    obligatoire: true,
    commentaire: 'Document expiré, à renouveler'
  }
]

const mockEcheancier = [
  {
    id: '1',
    numero: 1,
    montant: 600,
    date: '2026-04-15',
    statut: 'a_venir' as const
  },
  {
    id: '2',
    numero: 2,
    montant: 600,
    date: '2026-05-15',
    statut: 'a_venir' as const
  }
]

const mockHistorique = [
  {
    id: '1',
    date: '2026-03-22T10:30:00Z',
    utilisateur: 'Marine Durand',
    action: 'Création' as const,
    description: 'Dossier de financement créé',
    details: 'Organisme: OPCO EP - Montant: 1 500€'
  },
  {
    id: '2',
    date: '2026-03-21T14:15:00Z',
    utilisateur: 'Système',
    action: 'Changement étape' as const,
    description: 'Qualification → Collecte docs',
    details: 'Transition automatique après validation'
  },
  {
    id: '3',
    date: '2026-03-20T09:45:00Z',
    utilisateur: 'Thomas Martin',
    action: 'Document' as const,
    description: 'Attestation URSSAF uploadée',
    details: 'Fichier: attestation_urssaf_2026.pdf'
  },
  {
    id: '4',
    date: '2026-03-19T16:20:00Z',
    utilisateur: 'Marine Durand',
    action: 'Modification' as const,
    description: 'Montant demandé: 1 200€ → 1 500€',
    details: 'Mise à jour suite à discussion client'
  }
]

function getCurrentStepIndex(statut: string): number {
  const mapping: Record<string, number> = {
    PREPARATION: 0,
    DOCUMENTS_REQUIS: 1,
    DOSSIER_COMPLET: 2,
    SOUMIS: 3,
    EN_EXAMEN: 4,
    COMPLEMENT_DEMANDE: 5,
    VALIDE: 6,
    // Mapping des autres statuts vers les nouvelles étapes
    VERSE: 11,
    REFUSE: 12,
    CLOTURE: 11
  }
  return mapping[statut] || 0
}

function getNextAction(currentStep: number): string {
  const actions = [
    'Qualifier le besoin de financement',
    'Collecter les documents requis',
    'Valider la complétude du dossier',
    'Déposer le dossier au financeur',
    'Suivre l\'instruction du dossier',
    'Fournir les compléments demandés',
    'Confirmer l\'inscription en formation',
    'Valider la place en session',
    'Suivre la formation du stagiaire',
    'Envoyer la facture au financeur',
    'Confirmer la réception du paiement',
    'Archiver le dossier',
    'Traiter le refus',
    'Finaliser l\'annulation'
  ]
  return actions[currentStep] || 'Action à définir'
}

// Composant pour la barre de pipeline
function PipelineBar({ currentStep, onStepClick }: { currentStep: number; onStepClick: (step: number) => void }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-accent">Pipeline de financement</h2>
        <div className="text-sm text-gray-500">
          Étape {Math.min(currentStep + 1, 12)}/12 — {Math.round(((currentStep + 1) / 12) * 100)}%
        </div>
      </div>

      {/* Desktop pipeline */}
      <div className="hidden md:flex items-center gap-2 mb-4">
        {WORKFLOW_STEPS.slice(0, 12).map((step, index) => {
          const isActive = index === currentStep
          const isCompleted = index < currentStep
          const isFuture = index > currentStep

          return (
            <motion.div
              key={step.id}
              className="flex-1 min-w-0"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div
                className={cn(
                  'relative cursor-pointer group',
                  'h-12 rounded-lg border-2 flex items-center justify-center text-xs font-medium transition-all',
                  isCompleted && 'bg-green-50 border-green-200 text-green-700',
                  isActive && 'bg-primary/10 border-primary text-accent',
                  isFuture && 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                )}
                onClick={() => onStepClick(index)}
              >
                <div className="flex items-center gap-1">
                  {isCompleted && <Check className="w-3 h-3" />}
                  {isActive && <Clock className="w-3 h-3" />}
                  <span className="truncate max-w-[80px]">{step.label}</span>
                </div>

                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                    {step.description}
                  </div>
                </div>
              </div>

              {/* Connector */}
              {index < 11 && (
                <div className={cn(
                  'h-0.5 w-2 bg-gray-200 absolute top-1/2 transform -translate-y-1/2',
                  index < currentStep && 'bg-green-400'
                )} />
              )}
            </motion.div>
          )
        })}
      </div>

      {/* Mobile pipeline */}
      <div className="md:hidden overflow-x-auto pb-2">
        <div className="flex gap-2 min-w-max">
          {WORKFLOW_STEPS.slice(Math.max(0, currentStep - 2), Math.min(12, currentStep + 3)).map((step, index) => {
            const actualIndex = Math.max(0, currentStep - 2) + index
            const isActive = actualIndex === currentStep
            const isCompleted = actualIndex < currentStep

            return (
              <div
                key={step.id}
                className={cn(
                  'flex-shrink-0 w-20 h-12 rounded-lg border-2 flex items-center justify-center text-xs font-medium',
                  isCompleted && 'bg-green-50 border-green-200 text-green-700',
                  isActive && 'bg-primary/10 border-primary text-accent',
                  !isCompleted && !isActive && 'bg-gray-50 border-gray-200 text-gray-500'
                )}
              >
                <div className="flex items-center gap-1">
                  {isCompleted && <Check className="w-3 h-3" />}
                  {isActive && <Clock className="w-3 h-3" />}
                  <span className="truncate">{step.label}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Prochaine action */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          <span className="text-sm font-medium text-accent">Prochaine action:</span>
          <span className="text-sm text-gray-600">{getNextAction(currentStep)}</span>
        </div>
      </div>
    </div>
  )
}

// Composant pour l'onglet Résumé & Actions
function ResumeActionsTab({ financement }: { financement: any }) {
  const [showActionModal, setShowActionModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  return (
    <div className="space-y-6">
      {/* Card résumé */}
      <Card className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Informations principales */}
          <div className="space-y-4">
            <h3 className="font-semibold text-accent flex items-center gap-2">
              <User className="w-4 h-4" />
              Informations principales
            </h3>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700">
                  OPCO EP
                </Badge>
                <span className="text-sm text-gray-500">Organisme financeur</span>
              </div>

              <div className="flex items-center gap-3">
                <Avatar name="Sophie Martin" size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-accent">Sophie Martin</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <a href="tel:0123456789" className="flex items-center gap-1 hover:text-primary">
                      <Phone className="w-3 h-3" />
                      01 23 45 67 89
                    </a>
                    <a href="mailto:sophie.martin@email.com" className="flex items-center gap-1 hover:text-primary">
                      <Mail className="w-3 h-3" />
                      sophie.martin@email.com
                    </a>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100">
                <p className="text-sm text-gray-500 mb-1">N° dossier</p>
                <p className="font-mono text-sm">OPCO-2026-0341</p>
              </div>
            </div>
          </div>

          {/* Montants */}
          <div className="space-y-4">
            <h3 className="font-semibold text-accent flex items-center gap-2">
              <Euro className="w-4 h-4" />
              Suivi financier
            </h3>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Demandé</p>
                  <p className="text-lg font-semibold text-accent">1 500,00 €</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">APC accordé</p>
                  <p className="text-lg font-semibold text-green-600">1 200,00 €</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Facturé</span>
                  <span className="font-medium">1 200,00 €</span>
                </div>
                <Progress value={100} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Payé</span>
                  <span className="font-medium">0,00 €</span>
                </div>
                <Progress value={0} className="h-2" />
              </div>

              <div className="pt-2 border-t border-gray-100">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Reste à charge</span>
                  <span className="font-semibold text-orange-600">300,00 €</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mode de paiement */}
        <div className="mt-6 pt-6 border-t border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard className="w-4 h-4 text-primary" />
            <span className="font-medium text-accent">Mode de paiement:</span>
            <Badge variant="outline">Subrogation</Badge>
          </div>
          <p className="text-sm text-gray-600">
            Le financeur verse directement à l'organisme de formation. Le stagiaire paie uniquement le reste à charge.
          </p>
        </div>

        {/* Dates clés */}
        <div className="mt-6 pt-6 border-t border-gray-100">
          <h4 className="font-medium text-accent mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Dates importantes
          </h4>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Soumission</p>
              <p className="font-medium">15/03/2026</p>
            </div>
            <div>
              <p className="text-gray-500">Accord</p>
              <p className="font-medium text-green-600">20/03/2026</p>
            </div>
            <div>
              <p className="text-gray-500">Formation</p>
              <p className="font-medium">15/04/2026</p>
            </div>
            <div>
              <p className="text-gray-500">Facturation</p>
              <p className="font-medium text-orange-600">En attente</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Actions rapides */}
      <Card className="p-6">
        <h3 className="font-semibold text-accent mb-4">Actions rapides</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Button
            className="justify-start gap-2"
            variant="outline"
            onClick={() => setShowActionModal(true)}
          >
            <ArrowRight className="w-4 h-4" />
            Avancer étape
          </Button>
          <Button className="justify-start gap-2" variant="outline">
            <Send className="w-4 h-4" />
            Relancer
          </Button>
          <Button className="justify-start gap-2" variant="outline">
            <FileText className="w-4 h-4" />
            Générer facture
          </Button>
          <Button
            className="justify-start gap-2"
            variant="outline"
            onClick={() => setShowPaymentModal(true)}
          >
            <Euro className="w-4 h-4" />
            Paiement reçu
          </Button>
        </div>
      </Card>

      {/* Alertes */}
      <div className="space-y-3">
        <Card className="p-4 border-orange-200 bg-orange-50">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
            <div>
              <p className="font-medium text-orange-800">Document manquant</p>
              <p className="text-sm text-orange-700">L'attestation URSSAF a été refusée et doit être renouvelée</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-yellow-200 bg-yellow-50">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-800">Échéance qui approche</p>
              <p className="text-sm text-yellow-700">Première échéance prévue le 15/04/2026 (dans 24 jours)</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-blue-200 bg-blue-50">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-800">Budget OPCO</p>
              <p className="text-sm text-blue-700">Budget annuel de la branche consommé à 75% - Dépôt prioritaire recommandé</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showActionModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowActionModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-semibold text-accent mb-4">Avancer à l'étape suivante</h3>
              <div className="space-y-4">
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir la nouvelle étape" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EN_FORMATION">En formation</SelectItem>
                    <SelectItem value="FACTURE_ENVOYEE">Facture envoyée</SelectItem>
                  </SelectContent>
                </Select>
                <Textarea placeholder="Commentaire (optionnel)" />
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setShowActionModal(false)}>
                    Annuler
                  </Button>
                  <Button onClick={() => {
                    toast.success('Étape mise à jour')
                    setShowActionModal(false)
                  }}>
                    Valider
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showPaymentModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowPaymentModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-semibold text-accent mb-4">Enregistrer un paiement</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Montant</label>
                  <Input type="number" placeholder="1200" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Moyen de paiement</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="virement">Virement</SelectItem>
                      <SelectItem value="cheque">Chèque</SelectItem>
                      <SelectItem value="cb">Carte bancaire</SelectItem>
                      <SelectItem value="especes">Espèces</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Référence</label>
                  <Input placeholder="N° de virement, chèque..." />
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setShowPaymentModal(false)}>
                    Annuler
                  </Button>
                  <Button onClick={() => {
                    toast.success('Paiement enregistré')
                    setShowPaymentModal(false)
                  }}>
                    Enregistrer
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Composant pour l'onglet Documents
function DocumentsTab() {
  const [filter, setFilter] = useState('tous')

  const filteredDocuments = mockDocuments.filter(doc => {
    if (filter === 'tous') return true
    return doc.statut === filter
  })

  const documentsByStatus = mockDocuments.reduce((acc, doc) => {
    acc[doc.statut] = (acc[doc.statut] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const validatedCount = documentsByStatus.valide || 0
  const totalCount = mockDocuments.length
  const progressPercentage = (validatedCount / totalCount) * 100

  return (
    <div className="space-y-6">
      {/* Progress et filtres */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-accent">Progression des documents</h3>
            <p className="text-sm text-gray-600">{validatedCount}/{totalCount} documents validés</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">{Math.round(progressPercentage)}%</p>
            <p className="text-xs text-gray-500">Complétude</p>
          </div>
        </div>
        <Progress value={progressPercentage} className="h-2 mb-4" />

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={filter === 'tous' ? 'primary' : 'outline'}
            onClick={() => setFilter('tous')}
          >
            Tous ({totalCount})
          </Button>
          <Button
            size="sm"
            variant={filter === 'valide' ? 'primary' : 'outline'}
            onClick={() => setFilter('valide')}
            className="gap-1"
          >
            <CheckCircle className="w-3 h-3" />
            Validés ({documentsByStatus.valide || 0})
          </Button>
          <Button
            size="sm"
            variant={filter === 'en_attente' ? 'primary' : 'outline'}
            onClick={() => setFilter('en_attente')}
            className="gap-1"
          >
            <Clock className="w-3 h-3" />
            En attente ({documentsByStatus.en_attente || 0})
          </Button>
          <Button
            size="sm"
            variant={filter === 'refuse' ? 'primary' : 'outline'}
            onClick={() => setFilter('refuse')}
            className="gap-1"
          >
            <XCircle className="w-3 h-3" />
            Refusés ({documentsByStatus.refuse || 0})
          </Button>
        </div>
      </Card>

      {/* Documents manquants pour avancer */}
      <Card className="p-4 border-orange-200 bg-orange-50">
        <h4 className="font-medium text-orange-800 mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          Documents requis pour avancer
        </h4>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-orange-400 rounded-full" />
            <span className="text-sm text-orange-700">Convention de formation (obligatoire)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-400 rounded-full" />
            <span className="text-sm text-red-700">Attestation URSSAF renouvelée (refusée)</span>
          </div>
        </div>
      </Card>

      {/* Liste des documents */}
      <Card padding="none">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-semibold text-accent">Documents du dossier</h3>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Télécharger tout
            </Button>
            <Button size="sm" className="gap-2">
              <Upload className="w-4 h-4" />
              Ajouter
            </Button>
          </div>
        </div>

        <div className="divide-y divide-gray-50">
          {filteredDocuments.map((doc) => (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 hover:bg-gray-50/50 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="mt-1">
                  <FileText className="w-5 h-5 text-gray-400" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-medium text-accent truncate">{doc.nom}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          size="sm"
                          variant={
                            doc.statut === 'valide' ? 'success' :
                            doc.statut === 'refuse' ? 'error' :
                            'warning'
                          }
                        >
                          {doc.statut === 'valide' && 'Validé'}
                          {doc.statut === 'refuse' && 'Refusé'}
                          {doc.statut === 'en_attente' && 'En attente'}
                        </Badge>
                        {doc.obligatoire && (
                          <Badge variant="outline" size="sm">
                            Obligatoire
                          </Badge>
                        )}
                      </div>
                      {doc.dateUpload && (
                        <p className="text-xs text-gray-500 mt-1">
                          Uploadé le {formatDate(doc.dateUpload)}
                        </p>
                      )}
                      {doc.commentaire && (
                        <p className="text-xs text-red-600 mt-1">{doc.commentaire}</p>
                      )}
                    </div>

                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost">
                        <Eye className="w-4 h-4" />
                      </Button>
                      {doc.statut === 'en_attente' && (
                        <>
                          <Button size="sm" variant="ghost" className="text-green-600">
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-red-600">
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      <Button size="sm" variant="ghost">
                        <Upload className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </Card>
    </div>
  )
}

// Composant pour l'onglet Paiements & Facturation
function PaiementsTab() {
  const [activeSubTab, setActiveSubTab] = useState('factures')

  const totalFacture = mockFactures.reduce((sum, f) => sum + f.montantTTC, 0)
  const totalPaye = mockPaiements.filter(p => p.statut === 'recu').reduce((sum, p) => sum + p.montant, 0)
  const soldeRestant = totalFacture - totalPaye

  return (
    <div className="space-y-6">
      {/* Résumé financier */}
      <Card className="p-6">
        <h3 className="font-semibold text-accent mb-4">Résumé financier</h3>
        <div className="grid grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-accent">{formatEuro(Math.abs(totalFacture))}</p>
            <p className="text-sm text-gray-600">Total facturé</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{formatEuro(totalPaye)}</p>
            <p className="text-sm text-gray-600">Total payé</p>
          </div>
          <div className="text-center">
            <p className={cn(
              "text-2xl font-bold",
              soldeRestant > 0 ? "text-orange-600" : soldeRestant < 0 ? "text-red-600" : "text-green-600"
            )}>
              {formatEuro(Math.abs(soldeRestant))}
            </p>
            <p className="text-sm text-gray-600">
              {soldeRestant > 0 ? 'Reste à encaisser' : soldeRestant < 0 ? 'Trop-perçu' : 'Soldé'}
            </p>
          </div>
        </div>
      </Card>

      {/* Sous-onglets */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { key: 'factures', label: 'Factures', count: mockFactures.length },
            { key: 'paiements', label: 'Paiements', count: mockPaiements.length },
            { key: 'echeancier', label: 'Échéancier', count: mockEcheancier.length }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveSubTab(tab.key)}
              className={cn(
                'py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap',
                activeSubTab === tab.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </nav>
      </div>

      {/* Contenu des sous-onglets */}
      {activeSubTab === 'factures' && (
        <Card padding="none">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <h4 className="font-medium text-accent">Factures émises</h4>
            <Button size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              Nouvelle facture
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">N° facture</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Type</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Destinataire</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">Montant TTC</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Statut</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Date</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {mockFactures.map((facture) => (
                  <tr key={facture.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-mono text-xs">{facture.numero}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" size="sm">
                        {facture.type}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">{facture.destinataire}</td>
                    <td className="px-4 py-3 text-right font-medium">
                      {formatEuro(facture.montantTTC)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          facture.statut === 'payee' ? 'success' :
                          facture.statut === 'envoyee' ? 'primary' :
                          'default'
                        }
                        size="sm"
                      >
                        {facture.statut === 'brouillon' && 'Brouillon'}
                        {facture.statut === 'envoyee' && 'Envoyée'}
                        {facture.statut === 'payee' && 'Payée'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">{formatDate(facture.dateEmission)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost">
                          <Eye className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Send className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Edit3 className="w-3 h-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeSubTab === 'paiements' && (
        <Card padding="none">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <h4 className="font-medium text-accent">Paiements reçus</h4>
            <Button size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              Enregistrer paiement
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Type</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Moyen</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">Montant</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Référence</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Statut</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {mockPaiements.map((paiement) => (
                  <tr key={paiement.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <Badge variant="outline" size="sm">
                        {paiement.type.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 capitalize">{paiement.moyen}</td>
                    <td className="px-4 py-3 text-right font-medium">
                      {formatEuro(paiement.montant)}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{paiement.reference}</td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={paiement.statut === 'recu' ? 'success' : 'warning'}
                        size="sm"
                      >
                        {paiement.statut === 'recu' ? 'Reçu' : 'En attente'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {paiement.datePaiement
                        ? formatDate(paiement.datePaiement)
                        : formatDate(paiement.dateEcheance || '')
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeSubTab === 'echeancier' && (
        <Card padding="none">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <h4 className="font-medium text-accent">Échéancier de paiement</h4>
            <Button size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              Créer échéancier
            </Button>
          </div>

          <div className="p-4">
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span>Progression</span>
                <span>0/2 échéances payées</span>
              </div>
              <Progress value={0} className="h-2" />
            </div>

            <div className="space-y-3">
              {mockEcheancier.map((echeance) => (
                <div key={echeance.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium">
                      {echeance.numero}
                    </div>
                    <div>
                      <p className="font-medium">{formatEuro(echeance.montant)}</p>
                      <p className="text-sm text-gray-500">Échéance {formatDate(echeance.date)}</p>
                    </div>
                  </div>
                  <Badge variant="outline" size="sm">
                    À venir
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

// Composant pour l'onglet Multi-Financement
function MultiFinancementTab() {
  const [isEnabled, setIsEnabled] = useState(false)
  const [lignes, setLignes] = useState([
    { id: '1', organisme: 'OPCO EP', montantDemande: 1200, montantAccorde: 1200, statut: 'Accordé', numeroDossier: 'OPCO-2026-0341' }
  ])

  const totalCouvert = lignes.reduce((sum, ligne) => sum + ligne.montantAccorde, 0)
  const montantFormation = 1500
  const resteACharge = montantFormation - totalCouvert
  const tauxCouverture = (totalCouvert / montantFormation) * 100

  return (
    <div className="space-y-6">
      {/* Toggle activation */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-accent">Multi-financement</h3>
            <p className="text-sm text-gray-600">Combiner plusieurs organismes pour un même dossier</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only"
              checked={isEnabled}
              onChange={(e) => setIsEnabled(e.target.checked)}
            />
            <div className={cn(
              "w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer transition-colors",
              isEnabled && "bg-primary"
            )}>
              <div className={cn(
                "w-5 h-5 bg-white rounded-full shadow transform transition-transform",
                isEnabled ? "translate-x-5" : "translate-x-0"
              )} />
            </div>
          </label>
        </div>
      </Card>

      {isEnabled && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-6"
        >
          {/* Résumé */}
          <Card className="p-6">
            <h4 className="font-semibold text-accent mb-4">Répartition financière</h4>
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{formatEuro(totalCouvert)}</p>
                <p className="text-sm text-gray-600">Total couvert</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{formatEuro(resteACharge)}</p>
                <p className="text-sm text-gray-600">Reste à charge</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{Math.round(tauxCouverture)}%</p>
                <p className="text-sm text-gray-600">Taux de couverture</p>
              </div>
            </div>

            {/* Barre de progression multi-couleur */}
            <div className="mt-4">
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-500"
                  style={{ width: `${(lignes[0].montantAccorde / montantFormation) * 100}%` }}
                />
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>0 €</span>
                <span>{formatEuro(montantFormation)}</span>
              </div>
            </div>
          </Card>

          {/* Lignes de financement */}
          <Card padding="none">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <h4 className="font-medium text-accent">Lignes de financement</h4>
              <Button size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                Ajouter une ligne
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Organisme</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-600">Demandé</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-600">Accordé</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Statut</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">N° dossier</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {lignes.map((ligne) => (
                    <tr key={ligne.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700">
                          {ligne.organisme}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {formatEuro(ligne.montantDemande)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-green-600">
                        {formatEuro(ligne.montantAccorde)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="success" size="sm">
                          {ligne.statut}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">{ligne.numeroDossier}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center gap-1">
                          <Button size="sm" variant="ghost">
                            <Edit3 className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-red-600">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Alertes de compatibilité */}
          <Card className="p-4 border-green-200 bg-green-50">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-green-800">Combinaison compatible</p>
                <p className="text-sm text-green-700">OPCO EP peut financer seul cette formation selon les règles en vigueur</p>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {!isEnabled && (
        <Card className="p-8 text-center">
          <div className="max-w-md mx-auto">
            <PlusCircle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="font-medium text-accent mb-2">Multi-financement désactivé</h3>
            <p className="text-sm text-gray-600 mb-4">
              Activez cette option pour combiner plusieurs organismes financeurs sur un même dossier.
            </p>
            <p className="text-xs text-gray-500">
              Utile pour maximiser la prise en charge quand un seul organisme ne couvre pas l'intégralité des coûts.
            </p>
          </div>
        </Card>
      )}
    </div>
  )
}

// Composant pour l'onglet Historique & Audit
function HistoriqueTab() {
  const [filter, setFilter] = useState('tous')
  const [showNoteModal, setShowNoteModal] = useState(false)

  const filteredHistorique = mockHistorique.filter(entry => {
    if (filter === 'tous') return true
    return entry.action.toLowerCase().includes(filter.toLowerCase())
  })

  const actionIcons = {
    'Création': PlusCircle,
    'Changement étape': ArrowRight,
    'Document': FileText,
    'Modification': Edit3,
    'Paiement': Euro,
    'Facture': FileText,
    'Relance': Send,
    'Alerte': AlertTriangle
  }

  const actionColors = {
    'Création': 'bg-blue-100 text-blue-700',
    'Changement étape': 'bg-purple-100 text-purple-700',
    'Document': 'bg-green-100 text-green-700',
    'Modification': 'bg-orange-100 text-orange-700',
    'Paiement': 'bg-cyan-100 text-cyan-700',
    'Facture': 'bg-indigo-100 text-indigo-700',
    'Relance': 'bg-yellow-100 text-yellow-700',
    'Alerte': 'bg-red-100 text-red-700'
  }

  return (
    <div className="space-y-6">
      {/* Filtres et actions */}
      <div className="flex justify-between items-center">
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={filter === 'tous' ? 'primary' : 'outline'}
            onClick={() => setFilter('tous')}
          >
            Tous
          </Button>
          <Button
            size="sm"
            variant={filter === 'étape' ? 'primary' : 'outline'}
            onClick={() => setFilter('étape')}
            className="gap-1"
          >
            <ArrowRight className="w-3 h-3" />
            Étapes
          </Button>
          <Button
            size="sm"
            variant={filter === 'document' ? 'primary' : 'outline'}
            onClick={() => setFilter('document')}
            className="gap-1"
          >
            <FileText className="w-3 h-3" />
            Documents
          </Button>
          <Button
            size="sm"
            variant={filter === 'paiement' ? 'primary' : 'outline'}
            onClick={() => setFilter('paiement')}
            className="gap-1"
          >
            <Euro className="w-3 h-3" />
            Paiements
          </Button>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="gap-2"
            onClick={() => setShowNoteModal(true)}
          >
            <Plus className="w-4 h-4" />
            Ajouter note
          </Button>
          <Button size="sm" variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Timeline */}
      <Card className="p-6">
        <h3 className="font-semibold text-accent mb-6">Historique complet</h3>

        <div className="space-y-6">
          {filteredHistorique.map((entry, index) => {
            const Icon = actionIcons[entry.action as keyof typeof actionIcons] || Info
            const colorClass = actionColors[entry.action as keyof typeof actionColors] || 'bg-gray-100 text-gray-700'

            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex gap-4"
              >
                {/* Timeline line */}
                <div className="flex flex-col items-center">
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center',
                    colorClass
                  )}>
                    <Icon className="w-4 h-4" />
                  </div>
                  {index < filteredHistorique.length - 1 && (
                    <div className="w-0.5 h-6 bg-gray-200 mt-2" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pb-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge size="sm" className={colorClass}>
                          {entry.action}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          par {entry.utilisateur}
                        </span>
                      </div>
                      <p className="font-medium text-accent mb-1">
                        {entry.description}
                      </p>
                      {entry.details && (
                        <p className="text-sm text-gray-600">{entry.details}</p>
                      )}
                    </div>

                    <div className="text-right text-xs text-gray-500 whitespace-nowrap">
                      {formatDate(entry.date)}
                      <br />
                      {new Date(entry.date).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </Card>

      {/* Modal pour ajouter une note */}
      <AnimatePresence>
        {showNoteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowNoteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-semibold text-accent mb-4">Ajouter une note</h3>
              <div className="space-y-4">
                <Textarea
                  placeholder="Saisissez votre note..."
                  rows={4}
                />
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setShowNoteModal(false)}>
                    Annuler
                  </Button>
                  <Button onClick={() => {
                    toast.success('Note ajoutée à l\'historique')
                    setShowNoteModal(false)
                  }}>
                    Ajouter
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Composant principal
export default function FinancementWorkflow({ financementId, onClose }: FinancementWorkflowProps) {
  const { data: financement, isLoading } = useFinancement(financementId)
  const [activeTab, setActiveTab] = useState('resume')

  // Mock data pour la démo
  const currentStep = financement ? getCurrentStepIndex(financement.statut) : 6 // Accordé par défaut
  const nextAction = getNextAction(currentStep)

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-6xl max-h-[90vh] p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/2" />
            <div className="h-4 bg-gray-200 rounded w-1/4" />
            <div className="h-64 bg-gray-200 rounded" />
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-6xl max-h-[90vh] bg-white rounded-lg shadow-xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
          <div>
            <h1 className="text-xl font-bold text-accent">Workflow de financement</h1>
            <p className="text-gray-600">
              Sophie Martin · OPCO EP · N° OPCO-2026-0341
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Pipeline Bar */}
        <div className="px-6">
          <PipelineBar
            currentStep={currentStep}
            onStepClick={() => {}}
          />
        </div>

        {/* Tabs */}
        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <div className="px-6 border-b border-gray-200">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="resume">Résumé & Actions</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="paiements">Paiements</TabsTrigger>
                <TabsTrigger value="multi">Multi-Financement</TabsTrigger>
                <TabsTrigger value="historique">Historique</TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto">
              <TabsContent value="resume" className="p-6 m-0">
                <ResumeActionsTab financement={financement} />
              </TabsContent>

              <TabsContent value="documents" className="p-6 m-0">
                <DocumentsTab />
              </TabsContent>

              <TabsContent value="paiements" className="p-6 m-0">
                <PaiementsTab />
              </TabsContent>

              <TabsContent value="multi" className="p-6 m-0">
                <MultiFinancementTab />
              </TabsContent>

              <TabsContent value="historique" className="p-6 m-0">
                <HistoriqueTab />
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Footer sticky */}
        <div className="border-t border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Badge variant="primary">Accordé (APC reçu)</Badge>
                <span className="text-sm text-gray-500">Étape actuelle</span>
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-medium">1 200,00 €</span> accordé —
                <span className="font-medium"> 1 200,00 €</span> facturé —
                <span className="font-medium"> 0,00 €</span> payé
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Prochaine action: <span className="font-medium">{nextAction}</span>
              </span>
              <Button className="gap-2">
                <ArrowRight className="w-4 h-4" />
                Confirmer inscription
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}