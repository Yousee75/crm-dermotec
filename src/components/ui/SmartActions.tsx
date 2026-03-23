'use client'

import { Lightning, Phone, FileText, CreditCard, GraduationCap, Mail } from 'lucide-react'
import { Lead } from '@/types'
import { daysBetween } from '@/lib/utils'

interface SmartAction {
  id: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  priority: number
  action?: () => void
}

interface SmartActionsProps {
  lead: Lead
  onAction?: (actionId: string) => void
}

export function SmartActions({ lead, onAction }: SmartActionsProps) {
  // Logique de règles métier pour générer les suggestions
  const generateActions = (): SmartAction[] => {
    const actions: SmartAction[] = []
    const now = new Date()

    // Règle 1: Lead nouveau jamais contacté
    if (lead.statut === 'NOUVEAU' && !lead.date_dernier_contact) {
      actions.push({
        id: 'first-call',
        title: 'Appeler pour qualifier',
        description: 'Premier contact pour qualifier le prospect',
        icon: Phone,
        priority: 10
      })
    }

    // Règle 2: Prospect chaud pas encore inscrit
    if (lead.score_chaud >= 70 && !['INSCRIT', 'EN_FORMATION', 'FORME', 'ALUMNI'].includes(lead.statut)) {
      actions.push({
        id: 'hot-prospect',
        title: 'Prospect chaud',
        description: 'Proposer inscription immédiate',
        icon: Lightning,
        priority: 9
      })
    }

    // Règle 3: Financement stagnant
    if (lead.financements && lead.financements.length > 0) {
      const dernierFinancement = lead.financements[0]
      if (dernierFinancement.statut === 'EN_EXAMEN' && dernierFinancement.date_soumission) {
        const daysSince = daysBetween(dernierFinancement.date_soumission, now.toISOString())
        if (daysSince > 14) {
          actions.push({
            id: 'follow-funding',
            title: 'Relancer l\'OPCO',
            description: `Pas de nouvelles depuis ${daysSince} jours`,
            icon: CreditCard,
            priority: 8
          })
        }
      }
    }

    // Règle 4: Qualifié sans devis
    if (lead.statut === 'QUALIFIE' && !lead.metadata?.devis_envoye) {
      actions.push({
        id: 'send-quote',
        title: 'Envoyer un devis',
        description: 'Lead qualifié prêt pour devis',
        icon: FileText,
        priority: 7
      })
    }

    // Règle 5: Formé depuis plus de 30 jours (upsell)
    if (lead.statut === 'FORME' && lead.inscriptions && lead.inscriptions.length > 0) {
      const derniereInscription = lead.inscriptions[0]
      if (derniereInscription.session?.date_fin) {
        const daysSinceEnd = daysBetween(derniereInscription.session.date_fin, now.toISOString())
        if (daysSinceEnd > 30) {
          actions.push({
            id: 'upsell-training',
            title: 'Formation complémentaire',
            description: 'Proposer formation avancée',
            icon: GraduationCap,
            priority: 6
          })
        }
      }
    }

    // Règle 6: Email non vérifié
    if (lead.email && !lead.metadata?.email_verifie) {
      actions.push({
        id: 'verify-email',
        title: 'Vérifier l\'email',
        description: 'Email pas encore confirmé',
        icon: Mail,
        priority: 5
      })
    }

    // Règle 7: Pas de contact depuis longtemps
    if (lead.date_dernier_contact && ['CONTACTE', 'QUALIFIE'].includes(lead.statut)) {
      const daysSince = daysBetween(lead.date_dernier_contact, now.toISOString())
      if (daysSince > 7) {
        actions.push({
          id: 'follow-up',
          title: 'Relance nécessaire',
          description: `Pas de contact depuis ${daysSince} jours`,
          icon: Phone,
          priority: 4
        })
      }
    }

    // Trier par priorité et prendre les 3 premières
    return actions
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 3)
  }

  const actions = generateActions()

  // Ne pas afficher si aucune action
  if (actions.length === 0) {
    return null
  }

  const handleActionClick = (actionId: string) => {
    if (onAction) {
      onAction(actionId)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <Lightning className="w-4 h-4 text-[#FF5C00]" />
        <span className="text-sm font-medium text-[#3A3A3A]">Actions suggérées</span>
      </div>

      <div className="space-y-2">
        {actions.map((action) => {
          const IconComponent = action.icon
          return (
            <button
              key={action.id}
              onClick={() => handleActionClick(action.id)}
              className="w-full p-3 bg-white border border-[#EEEEEE] rounded-lg hover:border-[#FF5C00]/30 hover:shadow-sm transition-all duration-200 text-left group"
            >
              <div className="flex items-start gap-3">
                <IconComponent className="w-4 h-4 text-[#FF5C00] mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm text-[#111111] group-hover:text-[#FF5C00] transition-colors">
                    {action.title}
                  </div>
                  <div className="text-xs text-[#777777] mt-0.5">
                    {action.description}
                  </div>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}