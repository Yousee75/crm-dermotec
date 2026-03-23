'use client'

import { Sparkles } from 'lucide-react'
import { Lead } from '@/types'
import { formatRelativeDate } from '@/lib/utils'
import { CATEGORIES_FORMATION } from '@/types'

interface ProspectSummaryProps {
  lead: Lead
}

export function ProspectSummary({ lead }: ProspectSummaryProps) {
  // Génération automatique du résumé (pas d'IA, juste template intelligent)
  const generateSummary = (): string => {
    const summary: string[] = []

    // Métier/Profession
    if (lead.statut_pro) {
      const metierMap: Record<string, string> = {
        'salariee': 'Salariée',
        'independante': 'Indépendante',
        'auto_entrepreneur': 'Auto-entrepreneur',
        'demandeur_emploi': 'En recherche d\'emploi',
        'reconversion': 'En reconversion',
        'etudiante': 'Étudiante',
        'gerant_institut': 'Gérant d\'institut',
        'autre': 'Professionnelle'
      }
      summary.push(metierMap[lead.statut_pro] || 'Professionnelle')
    }

    // Localisation
    if (lead.adresse?.ville) {
      summary.push(`à ${lead.adresse.ville}`)
    }

    // Formation d'intérêt
    if (lead.formation_principale) {
      summary.push(`intéressée ${lead.formation_principale.nom}`)
    } else if (lead.formations_interessees.length > 0) {
      const categoriesInteressees = lead.formations_interessees
        .slice(0, 2) // Max 2 pour éviter la surcharge
        .map(formationId => {
          // Trouvez la catégorie basée sur l'ID de formation
          // Pour simplifier, on affiche juste "formations spécialisées"
          return 'formations esthétiques'
        })
        .join(', ')
      summary.push(`intéressée ${categoriesInteressees}`)
    }

    // Score
    if (lead.score_chaud && lead.score_chaud > 0) {
      summary.push(`score ${lead.score_chaud}/100`)
    }

    // Statut financement
    if (lead.financement_souhaite && lead.financements && lead.financements.length > 0) {
      const dernierFinancement = lead.financements[0]
      const statutMap: Record<string, string> = {
        'PREPARATION': 'financement en préparation',
        'DOCUMENTS_REQUIS': 'documents requis',
        'DOSSIER_COMPLET': 'dossier complet',
        'SOUMIS': 'dossier soumis',
        'EN_EXAMEN': 'financement en examen',
        'COMPLEMENT_DEMANDE': 'complément demandé',
        'VALIDE': 'financement validé',
        'REFUSE': 'financement refusé',
        'VERSE': 'financement versé',
        'CLOTURE': 'financement clos'
      }
      summary.push(statutMap[dernierFinancement.statut] || 'financement en cours')
    } else if (lead.financement_souhaite) {
      summary.push('financement souhaité')
    }

    // Dernier contact
    if (lead.date_dernier_contact) {
      summary.push(`dernier contact ${formatRelativeDate(lead.date_dernier_contact)}`)
    } else if (lead.created_at) {
      summary.push(`prospect ${formatRelativeDate(lead.created_at)}`)
    }

    return summary.join(', ')
  }

  const summaryText = generateSummary()

  // Ne pas afficher si pas assez d'informations
  if (summaryText.split(', ').length < 2) {
    return null
  }

  return (
    <div className="bg-[#FFF0E5] border border-[#FF5C00]/20 rounded-lg px-4 py-3 mb-4">
      <div className="flex items-start gap-3">
        <Sparkles className="w-4 h-4 text-[#FF5C00] mt-0.5 flex-shrink-0" />
        <p className="text-sm text-[#3A3A3A] leading-relaxed">
          {summaryText.charAt(0).toUpperCase() + summaryText.slice(1)}.
        </p>
      </div>
    </div>
  )
}