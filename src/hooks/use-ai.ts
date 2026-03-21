'use client'

import { useMutation } from '@tanstack/react-query'

// --- Score IA ---
export function useAIScore() {
  return useMutation({
    mutationFn: async (lead_id: string) => {
      const res = await fetch('/api/ai/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_id }),
      })
      if (!res.ok) throw new Error('Erreur scoring IA')
      return res.json()
    },
  })
}

// --- Génération email/message ---
export function useAIGenerate() {
  return useMutation({
    mutationFn: async (params: {
      type: 'premier_contact' | 'relance' | 'financement' | 'post_formation' | 'upsell' | 'reactivation'
      lead: {
        prenom: string
        nom?: string
        statut_pro?: string
        formation_interessee?: string
        financement_souhaite?: boolean
        nb_contacts: number
      }
      contexte?: string
    }) => {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      })
      if (!res.ok) throw new Error('Erreur génération IA')
      return res.json()
    },
  })
}

// --- Recherche prospect ---
export function useAIResearch() {
  return useMutation({
    mutationFn: async (params: {
      nom?: string
      entreprise?: string
      ville?: string
      secteur?: string
    }) => {
      const res = await fetch('/api/ai/prospect-research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      })
      if (!res.ok) throw new Error('Erreur recherche IA')
      return res.json()
    },
  })
}

// --- Objection handling ---
export function useAIObjection() {
  return useMutation({
    mutationFn: async (params: {
      objection: string
      contexte_lead?: {
        formation?: string
        prix?: number
        statut_pro?: string
        financement?: boolean
      }
    }) => {
      const res = await fetch('/api/ai/objection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      })
      if (!res.ok) throw new Error('Erreur objection IA')
      return res.json()
    },
  })
}

// --- Analytics dashboard ---
export function useAnalyticsDashboard() {
  return useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/analytics/dashboard')
      if (!res.ok) throw new Error('Erreur analytics')
      return res.json()
    },
  })
}
