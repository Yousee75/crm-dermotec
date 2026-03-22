'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Message, CanalMessage, InboxConversation } from '@/types'

export function useMessages(leadId: string) {
  return useQuery({
    queryKey: ['messages', leadId],
    queryFn: async () => {
      const res = await fetch(`/api/messages?lead_id=${leadId}`)
      if (!res.ok) throw new Error('Erreur récupération messages')
      const data = await res.json()
      return data.messages as Message[]
    },
    enabled: !!leadId,
    staleTime: 60_000, // 1 min — messages d'un lead
    gcTime: 10 * 60_000,
  })
}

export function useInbox(searchQuery?: string) {
  return useQuery({
    queryKey: ['inbox', searchQuery],
    queryFn: async () => {
      const res = await fetch('/api/messages?per_page=100')
      if (!res.ok) throw new Error('Erreur récupération inbox')
      const data = await res.json()
      const messages = data.messages as (Message & {
        lead?: {
          id: string
          prenom: string
          nom?: string
          email?: string
          telephone?: string
          photo_url?: string
          statut: string
        }
      })[]

      // Grouper par lead_id et créer les conversations
      const conversations = new Map<string, InboxConversation>()

      messages.forEach((message) => {
        if (!message.lead) return

        const existing = conversations.get(message.lead_id)
        if (!existing || new Date(message.created_at) > new Date(existing.dernier_date)) {
          conversations.set(message.lead_id, {
            lead_id: message.lead_id,
            lead_prenom: message.lead.prenom,
            lead_nom: message.lead.nom || '',
            lead_email: message.lead.email || null,
            lead_telephone: message.lead.telephone || null,
            lead_photo_url: message.lead.photo_url || null,
            dernier_message: message.contenu,
            dernier_canal: message.canal,
            dernier_date: message.created_at,
            non_lus: message.direction === 'inbound' && !message.lu_at ?
              (existing?.non_lus || 0) + 1 : (existing?.non_lus || 0),
            statut_lead: message.lead.statut as any,
          })
        }
      })

      const result = Array.from(conversations.values())
        .sort((a, b) => new Date(b.dernier_date).getTime() - new Date(a.dernier_date).getTime())

      // Filtrer par recherche si nécessaire
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return result.filter(conv =>
          conv.lead_prenom.toLowerCase().includes(query) ||
          conv.lead_nom.toLowerCase().includes(query) ||
          conv.lead_email?.toLowerCase().includes(query) ||
          conv.dernier_message.toLowerCase().includes(query)
        )
      }

      return result
    },
    staleTime: 60_000, // 1 min — inbox
    gcTime: 10 * 60_000,
  })
}

export function useSendMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: {
      lead_id: string
      canal: CanalMessage
      contenu: string
      sujet?: string
    }) => {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erreur envoi message')
      }
      return res.json()
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['messages', vars.lead_id] })
      queryClient.invalidateQueries({ queryKey: ['inbox'] })
    },
  })
}
