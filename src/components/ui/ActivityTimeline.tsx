'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase-client'
import type { Activite } from '@/types'
import { formatDateTime } from '@/lib/utils'
import {
  UserPlus, ArrowRightLeft, Phone, Mail, MessageCircle,
  CreditCard, FileText, Calendar, Bell, StickyNote,
  Download, Cog, AlertTriangle
} from 'lucide-react'

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  LEAD_CREE: { icon: UserPlus, color: '#22C55E', label: 'Lead créé' },
  LEAD_MAJ: { icon: Cog, color: '#3B82F6', label: 'Modifié' },
  STATUT_CHANGE: { icon: ArrowRightLeft, color: '#8B5CF6', label: 'Statut changé' },
  CONTACT: { icon: Phone, color: '#06B6D4', label: 'Contact' },
  INSCRIPTION: { icon: Calendar, color: '#22C55E', label: 'Inscription' },
  FINANCEMENT: { icon: CreditCard, color: '#F59E0B', label: 'Financement' },
  SESSION: { icon: Calendar, color: '#6366F1', label: 'Session' },
  PAIEMENT: { icon: CreditCard, color: '#10B981', label: 'Paiement' },
  DOCUMENT: { icon: FileText, color: '#64748B', label: 'Document' },
  EMAIL: { icon: Mail, color: '#3B82F6', label: 'Email' },
  RAPPEL: { icon: Bell, color: '#F97316', label: 'Rappel' },
  NOTE: { icon: StickyNote, color: '#A855F7', label: 'Note' },
  EXPORT: { icon: Download, color: '#64748B', label: 'Export' },
  SYSTEME: { icon: Cog, color: '#9CA3AF', label: 'Système' },
}

interface Props {
  leadId?: string
  sessionId?: string
  limit?: number
  showFilters?: boolean
}

export function ActivityTimeline({ leadId, sessionId, limit = 20, showFilters = false }: Props) {
  const supabase = createClient()

  const { data: activities, isLoading } = useQuery({
    queryKey: ['activites', leadId, sessionId, limit],
    queryFn: async () => {
      let query = supabase
        .from('activites')
        .select('*, user:equipe(id, prenom, nom, avatar_color)')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (leadId) query = query.eq('lead_id', leadId)
      if (sessionId) query = query.eq('session_id', sessionId)

      const { data, error } = await query
      if (error) throw error
      return data as (Activite & { user?: { prenom: string; nom: string; avatar_color: string } })[]
    },
  })

  if (isLoading) {
    return <div className="text-sm text-gray-400 py-4">Chargement de l&apos;historique...</div>
  }

  if (!activities?.length) {
    return <div className="text-sm text-gray-400 py-4 text-center">Aucune activité</div>
  }

  return (
    <div className="relative">
      {/* Ligne verticale */}
      <div className="absolute left-5 top-0 bottom-0 w-px bg-gray-200" />

      <div className="space-y-0">
        {activities.map((activity, i) => {
          const config = TYPE_CONFIG[activity.type] || TYPE_CONFIG.SYSTEME
          const Icon = config.icon

          return (
            <div key={activity.id} className="relative flex items-start gap-3 py-3 pl-2 group">
              {/* Dot */}
              <div
                className="relative z-10 w-7 h-7 rounded-full flex items-center justify-center shrink-0 ring-4 ring-white"
                style={{ backgroundColor: `${config.color}15` }}
              >
                <Icon className="w-3.5 h-3.5" style={{ color: config.color }} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700">{activity.description}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-gray-400">{formatDateTime(activity.created_at)}</span>
                  {activity.user && (
                    <span className="text-xs text-gray-400">
                      · {activity.user.prenom} {activity.user.nom}
                    </span>
                  )}
                  {activity.ancien_statut && activity.nouveau_statut && (
                    <span className="text-xs">
                      <span className="text-gray-400">{activity.ancien_statut}</span>
                      <span className="text-gray-300 mx-1">→</span>
                      <span className="text-gray-600 font-medium">{activity.nouveau_statut}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
