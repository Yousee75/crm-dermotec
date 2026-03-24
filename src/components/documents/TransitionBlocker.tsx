'use client'

import { Shield, Upload, Send, CreditCard, Eye, AlertTriangle, CheckCircle } from 'lucide-react'
import { Lead, StatutLead, Document, Inscription } from '@/types'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

interface TransitionBlockerProps {
  lead: Lead
  targetStatus: StatutLead
  documents: Document[]
  inscriptions?: Inscription[]
}

interface Blocker {
  id: string
  type: 'critical' | 'warning'
  message: string
  actionLabel: string
  actionIcon: React.ReactNode
  onClick?: () => void
}

// Règles de transition de statut
const getTransitionBlockers = (
  lead: Lead,
  targetStatus: StatutLead,
  documents: Document[],
  inscriptions: Inscription[] = []
): Blocker[] => {
  const blockers: Blocker[] = []

  // Créer un map des documents par type
  const docsByType = documents.reduce((acc, doc) => {
    acc[doc.type] = doc
    return acc
  }, {} as Record<string, Document>)

  // Règles communes
  const hasPieceIdentite = !!docsByType.piece_identite
  const hasJustificatifStatut = !!docsByType.justificatif_domicile ||
                                !!docsByType.justificatif_paie ||
                                !!docsByType.attestation_inscription

  switch (targetStatus) {
    case 'FINANCEMENT_EN_COURS':
      // Pour passer en financement : pièce d'identité + justificatif statut
      if (!hasPieceIdentite) {
        blockers.push({
          id: 'piece_identite',
          type: 'critical',
          message: 'Pièce d\'identité manquante',
          actionLabel: 'Uploader pièce d\'identité',
          actionIcon: <Upload className="w-4 h-4" />,
          onClick: () => {}
        })
      }

      if (!hasJustificatifStatut) {
        blockers.push({
          id: 'justificatif_statut',
          type: 'critical',
          message: 'Justificatif de statut manquant',
          actionLabel: 'Uploader justificatif',
          actionIcon: <Upload className="w-4 h-4" />,
          onClick: () => {}
        })
      }

      if (!lead.financement_souhaite) {
        blockers.push({
          id: 'financement_souhaite',
          type: 'warning',
          message: 'Financement non demandé par le lead',
          actionLabel: 'Modifier le profil',
          actionIcon: <Eye className="w-4 h-4" />,
          onClick: () => {}
        })
      }
      break

    case 'INSCRIT':
      // Convention signée + (paiement OU financement validé)
      const hasConventionSignee = inscriptions.some(i => i.convention_signee)
      const hasPaiement = inscriptions.some(i => i.paiement_statut === 'PAYE')
      const hasFinancementValide = lead.financements?.some(f => f.statut === 'VALIDE')

      if (!hasConventionSignee) {
        blockers.push({
          id: 'convention',
          type: 'critical',
          message: 'Convention non signée',
          actionLabel: 'Envoyer convention',
          actionIcon: <Send className="w-4 h-4" />,
          onClick: () => {}
        })
      }

      if (!hasPaiement && !hasFinancementValide) {
        blockers.push({
          id: 'paiement_financement',
          type: 'critical',
          message: 'Paiement non reçu ou financement non validé',
          actionLabel: 'Voir paiement',
          actionIcon: <CreditCard className="w-4 h-4" />,
          onClick: () => {}
        })
      }
      break

    case 'EN_FORMATION':
      // Convention signée + paiement confirmé
      const hasConventionSigned = inscriptions.some(i => i.convention_signee)
      const hasPaiementConfirme = inscriptions.some(i =>
        i.paiement_statut === 'PAYE' || i.paiement_statut === 'ACOMPTE'
      )

      if (!hasConventionSigned) {
        blockers.push({
          id: 'convention_formation',
          type: 'critical',
          message: 'Convention non signée',
          actionLabel: 'Envoyer convention',
          actionIcon: <Send className="w-4 h-4" />,
          onClick: () => {}
        })
      }

      if (!hasPaiementConfirme) {
        blockers.push({
          id: 'paiement_confirme',
          type: 'critical',
          message: 'Paiement non confirmé',
          actionLabel: 'Confirmer paiement',
          actionIcon: <CreditCard className="w-4 h-4" />,
          onClick: () => {}
        })
      }
      break

    case 'FORME':
      // Émargement + évaluation + présence >= 80%
      const hasEmargement = !!docsByType.emargement
      const hasEvaluation = inscriptions.some(i => i.note_satisfaction !== null)
      const tauxPresence = inscriptions[0]?.taux_presence || 0

      if (!hasEmargement) {
        blockers.push({
          id: 'emargement',
          type: 'critical',
          message: 'Feuille d\'émargement manquante',
          actionLabel: 'Uploader émargement',
          actionIcon: <Upload className="w-4 h-4" />,
          onClick: () => {}
        })
      }

      if (!hasEvaluation) {
        blockers.push({
          id: 'evaluation',
          type: 'critical',
          message: 'Évaluation de satisfaction manquante',
          actionLabel: 'Saisir évaluation',
          actionIcon: <Eye className="w-4 h-4" />,
          onClick: () => {}
        })
      }

      if (tauxPresence < 80) {
        blockers.push({
          id: 'presence',
          type: 'critical',
          message: `Taux de présence insuffisant (${tauxPresence}% < 80%)`,
          actionLabel: 'Vérifier présence',
          actionIcon: <Eye className="w-4 h-4" />,
          onClick: () => {}
        })
      }
      break

    case 'ALUMNI':
      // Certificat + satisfaction
      const hasCertificat = !!docsByType.certificat
      const hasSatisfaction = inscriptions.some(i =>
        i.note_satisfaction != null && i.note_satisfaction >= 3
      )

      if (!hasCertificat) {
        blockers.push({
          id: 'certificat',
          type: 'critical',
          message: 'Certificat non généré',
          actionLabel: 'Générer certificat',
          actionIcon: <Upload className="w-4 h-4" />,
          onClick: () => {}
        })
      }

      if (!hasSatisfaction) {
        blockers.push({
          id: 'satisfaction',
          type: 'warning',
          message: 'Satisfaction faible (< 3/5)',
          actionLabel: 'Voir évaluation',
          actionIcon: <Eye className="w-4 h-4" />,
          onClick: () => {}
        })
      }
      break
  }

  return blockers
}

const STATUT_LABELS: Record<StatutLead, string> = {
  NOUVEAU: 'Nouveau',
  CONTACTE: 'Contacté',
  QUALIFIE: 'Qualifié',
  FINANCEMENT_EN_COURS: 'Financement',
  INSCRIT: 'Inscrit',
  EN_FORMATION: 'En formation',
  FORME: 'Formé(e)',
  ALUMNI: 'Alumni',
  PERDU: 'Perdu',
  REPORTE: 'Reporté',
  SPAM: 'Spam',
}

export function TransitionBlocker({
  lead,
  targetStatus,
  documents,
  inscriptions = []
}: TransitionBlockerProps) {
  const blockers = getTransitionBlockers(lead, targetStatus, documents, inscriptions)
  const targetLabel = STATUT_LABELS[targetStatus]
  const canTransition = blockers.length === 0

  if (canTransition) {
    return (
      <div className="bg-[#ECFDF5] border border-[#10B981]/30 rounded-xl p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#D1FAE5] rounded-full flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-[#10B981]" />
          </div>

          <div className="flex-1">
            <h3 className="font-semibold text-[#10B981] mb-1">
              Prêt à passer en {targetLabel}
            </h3>
            <p className="text-sm text-[#10B981]">
              Toutes les conditions sont remplies pour la transition.
            </p>
          </div>

          <button className="px-6 py-2 bg-[#10B981] text-white rounded-lg hover:bg-green-700 transition font-medium">
            Passer en {targetLabel}
          </button>
        </div>
      </div>
    )
  }

  const criticalBlockers = blockers.filter(b => b.type === 'critical')
  const warningBlockers = blockers.filter(b => b.type === 'warning')

  return (
    <div className="bg-white border border-[#FF2D78]/30 rounded-xl p-6">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-[#FFE0EF] rounded-full flex items-center justify-center shrink-0">
          <Shield className="w-6 h-6 text-[#FF2D78]" />
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <h3 className="font-semibold text-[#FF2D78]">
              Impossible de passer en {targetLabel}
            </h3>
            <div className="flex gap-2">
              {criticalBlockers.length > 0 && (
                <Badge variant="error" size="sm">
                  {criticalBlockers.length} bloquant{criticalBlockers.length > 1 ? 's' : ''}
                </Badge>
              )}
              {warningBlockers.length > 0 && (
                <Badge variant="warning" size="sm">
                  {warningBlockers.length} alerte{warningBlockers.length > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {/* Bloqueurs critiques */}
            {criticalBlockers.map((blocker) => (
              <div key={blocker.id} className="flex items-center justify-between p-3 bg-[#FFE0EF] rounded-lg border border-red-100">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-4 h-4 text-[#FF2D78] shrink-0" />
                  <span className="text-sm text-[#FF2D78] font-medium">{blocker.message}</span>
                </div>
                <button
                  onClick={blocker.onClick}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                >
                  {blocker.actionIcon}
                  {blocker.actionLabel}
                </button>
              </div>
            ))}

            {/* Bloqueurs d'avertissement */}
            {warningBlockers.map((blocker) => (
              <div key={blocker.id} className="flex items-center justify-between p-3 bg-[#FFF3E8] rounded-lg border border-amber-100">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-4 h-4 text-[#FF8C42] shrink-0" />
                  <span className="text-sm text-[#FF8C42]">{blocker.message}</span>
                </div>
                <button
                  onClick={blocker.onClick}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition font-medium"
                >
                  {blocker.actionIcon}
                  {blocker.actionLabel}
                </button>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-[#FAF8F5] rounded-lg">
            <p className="text-xs text-[#777777]">
              <strong>Note :</strong> Résolvez tous les points bloquants pour permettre la transition.
              Les alertes sont optionnelles mais recommandées.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}