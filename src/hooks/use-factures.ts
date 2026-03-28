'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

// ── Types ──
export interface FactureFormation {
  id: string
  lead_id?: string
  financement_id?: string
  inscription_id?: string
  session_id?: string
  numero_facture: string
  type: 'facture' | 'avoir' | 'acompte' | 'proforma'
  destinataire_type: 'organisme_financeur' | 'stagiaire' | 'entreprise'
  destinataire_nom: string
  destinataire_adresse?: string
  destinataire_siret?: string
  destinataire_email?: string
  montant_ht: number
  taux_tva: number
  montant_tva: number
  montant_ttc: number
  facture_origine_id?: string
  statut: string
  date_emission?: string
  date_envoi?: string
  date_echeance?: string
  date_paiement?: string
  montant_paye: number
  reste_a_payer: number
  relance_count: number
  derniere_relance?: string
  pdf_url?: string
  mentions?: string
  conditions_paiement?: string
  notes?: string
  created_by?: string
  created_at: string
  updated_at: string
  deleted_at?: string
  // Jointure
  leads?: {
    id: string
    nom: string
    prenom: string
    email: string
    entreprise_nom?: string
    telephone?: string
  }
}

export interface FactureFilters {
  search?: string
  statut?: string
  type?: string
  date_from?: string
  date_to?: string
  page?: number
  per_page?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

export interface FacturesResponse {
  factures: FactureFormation[]
  stats: {
    total: number
    ca_total: number
    en_attente: number
    en_retard: number
    montant_en_retard: number
  }
  pagination: {
    page: number
    per_page: number
    total: number
    total_pages: number
  }
}

// ── Hook liste factures ──
export function useFactures(filters: FactureFilters = {}) {
  const { page = 1, per_page = 20, sort_by = 'created_at', sort_order = 'desc' } = filters

  return useQuery<FacturesResponse>({
    queryKey: ['factures', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('per_page', String(per_page))
      params.set('sort_by', sort_by)
      params.set('sort_order', sort_order)
      if (filters.search) params.set('search', filters.search)
      if (filters.statut) params.set('statut', filters.statut)
      if (filters.type) params.set('type', filters.type)
      if (filters.date_from) params.set('date_from', filters.date_from)
      if (filters.date_to) params.set('date_to', filters.date_to)

      const res = await fetch(`/api/factures?${params}`)
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Erreur serveur' }))
        throw new Error(err.error || 'Erreur chargement factures')
      }
      return res.json()
    },
    staleTime: 30_000,
  })
}

// ── Hook détail facture ──
export function useFacture(id: string | null) {
  return useQuery({
    queryKey: ['facture', id],
    queryFn: async () => {
      const res = await fetch(`/api/factures/${id}`)
      if (!res.ok) throw new Error('Facture non trouvée')
      return res.json() as Promise<{ facture: FactureFormation; paiements: any[] }>
    },
    enabled: !!id,
    staleTime: 30_000,
  })
}

// ── Mutation créer facture ──
export function useCreateFacture() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      lead_id?: string
      financement_id?: string
      inscription_id?: string
      session_id?: string
      type?: string
      destinataire_type: string
      destinataire_nom: string
      destinataire_adresse?: string
      destinataire_siret?: string
      destinataire_email?: string
      montant_ht: number
      taux_tva?: number
      mentions?: string
      conditions_paiement?: string
      notes?: string
    }) => {
      const res = await fetch('/api/factures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Erreur création' }))
        throw new Error(err.error)
      }
      return res.json() as Promise<{ facture: FactureFormation }>
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['factures'] })
      toast.success(`Facture ${data.facture.numero_facture} créée`)
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Erreur création facture')
    },
  })
}

// ── Mutation modifier facture ──
export function useUpdateFacture() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Record<string, any>) => {
      const res = await fetch(`/api/factures/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Erreur modification' }))
        throw new Error(err.error)
      }
      return res.json() as Promise<{ facture: FactureFormation }>
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['factures'] })
      qc.invalidateQueries({ queryKey: ['facture', data.facture.id] })
      toast.success('Facture mise à jour')
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Erreur modification')
    },
  })
}

// ── Mutation supprimer facture ──
export function useDeleteFacture() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/factures/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Erreur suppression' }))
        throw new Error(err.error)
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['factures'] })
      toast.success('Facture supprimée')
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Erreur suppression')
    },
  })
}

// ── Mutation convertir devis → facture ──
export function useConvertDevis() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (devis_id: string) => {
      const res = await fetch('/api/factures/from-devis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ devis_id }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Erreur conversion' }))
        throw new Error(err.error)
      }
      return res.json() as Promise<{ facture: FactureFormation; devis_id: string }>
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['factures'] })
      toast.success(`Facture ${data.facture.numero_facture} créée depuis le devis`)
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Erreur conversion devis')
    },
  })
}

// ── Mutation annuler facture (crée un avoir automatiquement) ──
export function useAnnulerFacture() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, motif }: { id: string; motif?: string }) => {
      const res = await fetch(`/api/factures/${id}/annuler`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motif: motif || 'Annulation demandée' }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Erreur annulation' }))
        throw new Error(err.error)
      }
      return res.json() as Promise<{
        success: boolean
        facture_annulee: { id: string; numero: string }
        avoir_cree: { id: string; numero: string; montant_ttc: number }
        motif: string
      }>
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['factures'] })
      toast.success(`Facture ${data.facture_annulee.numero} annulée — Avoir ${data.avoir_cree.numero} créé`)
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Erreur annulation')
    },
  })
}

// ── Mutation envoyer facture par email ──
export function useSendFacture() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/factures/${id}/send`, { method: 'POST' })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Erreur envoi' }))
        throw new Error(err.error)
      }
      return res.json() as Promise<{ success: boolean; email_sent_to: string }>
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['factures'] })
      toast.success(`Facture envoyée à ${data.email_sent_to}`)
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Erreur envoi facture')
    },
  })
}
