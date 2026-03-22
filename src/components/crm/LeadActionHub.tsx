'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useLead } from '@/hooks/use-leads'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { toast } from 'sonner'
import {
  Phone, Mail, MessageCircle, Target, GraduationCap,
  CreditCard, Calendar, FileCheck, Award, Users,
  TrendingUp, Sparkles, Send, AlertCircle, CheckCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { StatutLead } from '@/types'

interface LeadActionHubProps {
  leadId: string
  onActionClick?: (action: string) => void
}

interface ActionSuggestion {
  id: string
  label: string
  icon: React.ElementType
  variant: 'primary' | 'secondary' | 'success' | 'warning'
  tooltip: string
  priority: number
  aiSuggested?: boolean
}

// Actions contextuelles selon le statut du lead
const getActionsForStatut = (statut: StatutLead): ActionSuggestion[] => {
  const baseActions: Record<StatutLead, ActionSuggestion[]> = {
    NOUVEAU: [
      {
        id: 'qualifier',
        label: 'Qualifier ce lead',
        icon: Target,
        variant: 'primary',
        tooltip: 'Valider le profil et les besoins',
        priority: 1,
        aiSuggested: true,
      },
      {
        id: 'appeler',
        label: 'Appeler',
        icon: Phone,
        variant: 'secondary',
        tooltip: 'Premier contact téléphonique',
        priority: 2,
      },
      {
        id: 'email_bienvenue',
        label: 'Email bienvenue',
        icon: Mail,
        variant: 'secondary',
        tooltip: 'Envoyer email de bienvenue personnalisé',
        priority: 3,
      },
    ],
    CONTACTE: [
      {
        id: 'qualifier',
        label: 'Qualifier',
        icon: Target,
        variant: 'primary',
        tooltip: 'Valider le profil et les besoins',
        priority: 1,
      },
      {
        id: 'proposer_formation',
        label: 'Proposer formation',
        icon: GraduationCap,
        variant: 'primary',
        tooltip: 'Recommander une formation adaptée',
        priority: 2,
        aiSuggested: true,
      },
      {
        id: 'planifier_rappel',
        label: 'Planifier rappel',
        icon: Calendar,
        variant: 'secondary',
        tooltip: 'Programmer un suivi',
        priority: 3,
      },
    ],
    QUALIFIE: [
      {
        id: 'proposer_formation',
        label: 'Proposer formation',
        icon: GraduationCap,
        variant: 'primary',
        tooltip: 'Recommander une formation adaptée',
        priority: 1,
        aiSuggested: true,
      },
      {
        id: 'simuler_financement',
        label: 'Simuler financement',
        icon: CreditCard,
        variant: 'primary',
        tooltip: 'Calculer les aides disponibles',
        priority: 2,
      },
      {
        id: 'envoyer_devis',
        label: 'Envoyer devis',
        icon: Send,
        variant: 'secondary',
        tooltip: 'Générer et envoyer un devis personnalisé',
        priority: 3,
      },
    ],
    FINANCEMENT_EN_COURS: [
      {
        id: 'verifier_dossier',
        label: 'Vérifier dossier',
        icon: FileCheck,
        variant: 'primary',
        tooltip: 'Contrôler l\'avancement du dossier',
        priority: 1,
        aiSuggested: true,
      },
      {
        id: 'relancer_financeur',
        label: 'Relancer financeur',
        icon: AlertCircle,
        variant: 'warning',
        tooltip: 'Contacter l\'organisme de financement',
        priority: 2,
      },
      {
        id: 'inscrire_si_accorde',
        label: 'Inscrire (si accordé)',
        icon: CheckCircle,
        variant: 'success',
        tooltip: 'Finaliser l\'inscription si financement validé',
        priority: 3,
      },
    ],
    INSCRIT: [
      {
        id: 'envoyer_convocation',
        label: 'Convocation',
        icon: Send,
        variant: 'primary',
        tooltip: 'Envoyer la convocation de formation',
        priority: 1,
        aiSuggested: true,
      },
      {
        id: 'verifier_paiement',
        label: 'Vérifier paiement',
        icon: CreditCard,
        variant: 'warning',
        tooltip: 'Contrôler le statut de paiement',
        priority: 2,
      },
      {
        id: 'affecter_session',
        label: 'Affecter session',
        icon: Calendar,
        variant: 'secondary',
        tooltip: 'Assigner à une session de formation',
        priority: 3,
      },
    ],
    EN_FORMATION: [
      {
        id: 'verifier_emargement',
        label: 'Émargement',
        icon: FileCheck,
        variant: 'primary',
        tooltip: 'Vérifier l\'émargement quotidien',
        priority: 1,
        aiSuggested: true,
      },
      {
        id: 'suivi_presence',
        label: 'Suivi présence',
        icon: Users,
        variant: 'warning',
        tooltip: 'Contrôler l\'assiduité',
        priority: 2,
      },
    ],
    FORME: [
      {
        id: 'envoyer_certificat',
        label: 'Certificat',
        icon: Award,
        variant: 'success',
        tooltip: 'Générer et envoyer le certificat',
        priority: 1,
        aiSuggested: true,
      },
      {
        id: 'enquete_satisfaction',
        label: 'Enquête satisfaction',
        icon: MessageCircle,
        variant: 'secondary',
        tooltip: 'Envoyer questionnaire de satisfaction',
        priority: 2,
      },
      {
        id: 'proposer_upsell',
        label: 'Proposer upsell',
        icon: TrendingUp,
        variant: 'primary',
        tooltip: 'Recommander formations complémentaires',
        priority: 3,
      },
    ],
    ALUMNI: [
      {
        id: 'proposer_perfectionnement',
        label: 'Perfectionnement',
        icon: GraduationCap,
        variant: 'primary',
        tooltip: 'Formations de niveau supérieur',
        priority: 1,
        aiSuggested: true,
      },
      {
        id: 'activer_parrainage',
        label: 'Parrainage',
        icon: Users,
        variant: 'success',
        tooltip: 'Programme de parrainage',
        priority: 2,
      },
      {
        id: 'commande_eshop',
        label: 'E-shop',
        icon: TrendingUp,
        variant: 'secondary',
        tooltip: 'Proposer matériel et équipements',
        priority: 3,
      },
    ],
    PERDU: [
      {
        id: 'analyser_echec',
        label: 'Analyser échec',
        icon: Target,
        variant: 'warning',
        tooltip: 'Comprendre les raisons de l\'échec',
        priority: 1,
      },
    ],
    REPORTE: [
      {
        id: 'replanifier',
        label: 'Replanifier',
        icon: Calendar,
        variant: 'primary',
        tooltip: 'Reprogrammer le suivi',
        priority: 1,
      },
    ],
    SPAM: [],
  }

  return baseActions[statut] || []
}

export default function LeadActionHub({ leadId, onActionClick }: LeadActionHubProps) {
  const { data: lead, isLoading } = useLead(leadId)
  const [activeAction, setActiveAction] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="w-full h-16 bg-slate-100 rounded-lg animate-pulse" />
    )
  }

  if (!lead) {
    return (
      <div className="p-4 text-center text-slate-500">
        Données du lead non disponibles
      </div>
    )
  }

  const actions = getActionsForStatut(lead.statut)
    .sort((a, b) => a.priority - b.priority)

  const handleActionClick = (action: ActionSuggestion) => {
    setActiveAction(action.id)
    onActionClick?.(action.id)

    // Simpler la notification pour certaines actions
    switch (action.id) {
      case 'appeler':
        toast.info(`Clic pour appeler ${lead.telephone || 'numéro non renseigné'}`)
        break
      case 'email_bienvenue':
        toast.success('Email de bienvenue préparé')
        break
      case 'planifier_rappel':
        toast.info('Rappel programmé')
        break
      default:
        toast.info(`Action "${action.label}" sélectionnée`)
    }

    // Reset après 2s
    setTimeout(() => setActiveAction(null), 2000)
  }

  if (actions.length === 0) {
    return (
      <div className="p-4 text-center text-slate-500 bg-slate-50 rounded-lg border">
        Aucune action disponible pour ce statut
      </div>
    )
  }

  return (
    <div className="w-full bg-white border rounded-lg p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <h3 className="font-medium text-slate-900">Actions recommandées</h3>
        <Badge variant="outline" className="text-xs">
          {lead.statut.replace('_', ' ')}
        </Badge>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {actions.map((action, index) => {
          const Icon = action.icon
          const isActive = activeAction === action.id
          const isPrimary = action.variant === 'primary'
          const isAISuggested = action.aiSuggested

          return (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Button
                variant={isPrimary ? 'default' : 'outline'}
                size="sm"
                className={cn(
                  'flex-shrink-0 h-auto py-2 px-3 flex items-center gap-2 min-h-[44px]',
                  'hover:scale-[1.02] transition-all duration-200',
                  {
                    'bg-primary hover:bg-[#0284C7] text-white border-primary': isPrimary,
                    'bg-green-50 border-green-200 text-green-700 hover:bg-green-100': action.variant === 'success',
                    'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100': action.variant === 'warning',
                    'ring-2 ring-primary ring-offset-1': isActive,
                    'shadow-md': isPrimary || isActive,
                  }
                )}
                onClick={() => handleActionClick(action)}
                title={action.tooltip}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm font-medium whitespace-nowrap">
                  {action.label}
                </span>
                {isAISuggested && (
                  <Badge
                    variant="secondary"
                    className="ml-1 px-1.5 py-0 text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0"
                  >
                    <Sparkles className="h-2.5 w-2.5 mr-0.5" />
                    IA
                  </Badge>
                )}
              </Button>
            </motion.div>
          )
        })}
      </div>

      {/* Actions supplémentaires en mode mobile */}
      <div className="md:hidden mt-3 pt-3 border-t">
        <div className="flex gap-2 justify-center">
          <Button variant="outline" size="sm" className="flex-1" title="WhatsApp">
            <MessageCircle className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="flex-1" title="Email">
            <Mail className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="flex-1" title="Appel">
            <Phone className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}