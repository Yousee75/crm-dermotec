// ============================================================
// CRM DERMOTEC — Soft Delete
// On ne supprime JAMAIS rien. On marque deleted_at.
// L'utilisateur voit "supprimé" mais la donnée reste en base.
// ============================================================

import { toast } from 'sonner'

type DeletableTable = 'leads' | 'sessions' | 'inscriptions' | 'financements' |
  'factures' | 'rappels' | 'documents' | 'commandes' | 'modeles' |
  'notes_lead' | 'partenaires' | 'cadence_instances'

const TABLE_LABELS: Record<DeletableTable, string> = {
  leads: 'Lead',
  sessions: 'Session',
  inscriptions: 'Inscription',
  financements: 'Dossier financement',
  factures: 'Facture',
  rappels: 'Rappel',
  documents: 'Document',
  commandes: 'Commande',
  modeles: 'Modèle',
  notes_lead: 'Note',
  partenaires: 'Partenaire',
  cadence_instances: 'Cadence',
}

interface SoftDeleteResult {
  success: boolean
  message: string
  canUndo: boolean
  undoAction?: () => Promise<void>
}

/**
 * Soft delete côté client — appelle l'API
 * Affiche un toast avec bouton "Annuler" pendant 8 secondes
 */
export async function softDelete(
  table: DeletableTable,
  id: string,
  options?: {
    reason?: string
    skipConfirm?: boolean
    onSuccess?: () => void
    onUndo?: () => void
  }
): Promise<SoftDeleteResult> {
  const label = TABLE_LABELS[table] || table

  // Confirmation si pas skipConfirm
  if (!options?.skipConfirm) {
    const confirmed = window.confirm(
      `Supprimer ce ${label.toLowerCase()} ?\n\nLes données ne sont pas perdues — elles peuvent être restaurées depuis la corbeille.`
    )
    if (!confirmed) return { success: false, message: 'Annulé', canUndo: false }
  }

  try {
    const response = await fetch('/api/soft-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        table,
        id,
        reason: options?.reason || 'Supprimé par l\'utilisateur',
      }),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Erreur' }))
      throw new Error(err.error || 'Erreur serveur')
    }

    const data = await response.json()

    // Toast avec bouton Annuler (8 secondes)
    toast.success(`${label} supprimé`, {
      description: 'Les données sont conservées dans la corbeille.',
      duration: 8000,
      action: {
        label: 'Annuler',
        onClick: async () => {
          try {
            await restoreFromTrash(data.corbeille_id)
            toast.success(`${label} restauré`)
            options?.onUndo?.()
          } catch {
            toast.error('Erreur lors de la restauration')
          }
        },
      },
    })

    options?.onSuccess?.()

    return {
      success: true,
      message: `${label} supprimé (corbeille)`,
      canUndo: true,
      undoAction: async () => restoreFromTrash(data.corbeille_id),
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erreur inconnue'
    toast.error(`Impossible de supprimer : ${msg}`)
    return { success: false, message: msg, canUndo: false }
  }
}

/**
 * Restaurer depuis la corbeille
 */
async function restoreFromTrash(corbeilleId: string): Promise<void> {
  const response = await fetch('/api/soft-delete/restore', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ corbeille_id: corbeilleId }),
  })

  if (!response.ok) {
    throw new Error('Échec de la restauration')
  }
}
