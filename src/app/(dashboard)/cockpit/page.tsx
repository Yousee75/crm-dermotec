'use client'

import { useLeads } from '@/hooks/use-leads'
import { useSessions } from '@/hooks/use-sessions'
import { useOverdueRappels, useTodayRappels } from '@/hooks/use-reminders'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase-client'
import { generateSmartActions } from '@/lib/smart-actions'
import type { Financement } from '@/types'
import {
  Rocket, AlertTriangle, Phone, Clock, Calendar,
  CheckCircle, ArrowRight, Zap, Target, TrendingUp
} from 'lucide-react'
import Link from 'next/link'

export default function CockpitPage() {
  const { data: newLeads } = useLeads({ statut: ['NOUVEAU'], per_page: 50 })
  const { data: pipelineLeads } = useLeads({ statut: ['QUALIFIE', 'FINANCEMENT_EN_COURS', 'INSCRIT', 'FORME', 'ALUMNI'], per_page: 100 })
  const { data: sessions } = useSessions()
  const { data: overdueRappels } = useOverdueRappels()
  const { data: todayRappels } = useTodayRappels()

  const supabase = createClient()
  const { data: financements } = useQuery({
    queryKey: ['financements-cockpit'],
    queryFn: async () => {
      const { data } = await supabase
        .from('financements')
        .select('*, lead:leads(id, prenom, nom)')
        .in('statut', ['SOUMIS', 'EN_EXAMEN', 'COMPLEMENT_DEMANDE'])
      return (data || []) as Financement[]
    },
  })

  // Générer les smart actions
  const allLeads = [...(newLeads?.leads || []), ...(pipelineLeads?.leads || [])]
  const smartActions = generateSmartActions({
    leads: allLeads,
    sessions: sessions || [],
    financements: financements || [],
    rappelsOverdue: overdueRappels || [],
  })

  const critiques = smartActions.filter(a => a.priorite === 'CRITIQUE')
  const hautes = smartActions.filter(a => a.priorite === 'HAUTE')
  const normales = smartActions.filter(a => a.priorite === 'NORMALE')

  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Bonjour' : hour < 14 ? 'Bon appétit' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Hero */}
      <div className="bg-gradient-to-r from-[#082545] to-[#0F3A6E] rounded-2xl p-8 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Rocket className="w-6 h-6 text-[#2EC6F3]" />
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
            {greeting} ! Voici votre journée.
          </h1>
        </div>
        <p className="text-slate-300 text-sm">
          {smartActions.length} action{smartActions.length > 1 ? 's' : ''} suggérée{smartActions.length > 1 ? 's' : ''}
          {' · '}{todayRappels?.length || 0} rappel{(todayRappels?.length || 0) > 1 ? 's' : ''} aujourd&apos;hui
          {overdueRappels && overdueRappels.length > 0 && (
            <span className="text-red-300 font-medium"> · {overdueRappels.length} en retard !</span>
          )}
        </p>

        {/* Quick stats */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          {[
            { icon: AlertTriangle, label: 'Critiques', value: critiques.length, color: critiques.length > 0 ? '#EF4444' : '#22C55E' },
            { icon: Target, label: 'Prioritaires', value: hautes.length, color: '#F59E0B' },
            { icon: Calendar, label: 'Sessions à venir', value: sessions?.filter(s => s.statut === 'PLANIFIEE').length || 0, color: '#8B5CF6' },
            { icon: TrendingUp, label: 'Leads pipeline', value: pipelineLeads?.total || 0, color: '#2EC6F3' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="bg-white/10 rounded-xl p-3 text-center">
              <Icon className="w-5 h-5 mx-auto mb-1" style={{ color }} />
              <p className="text-lg font-bold">{value}</p>
              <p className="text-xs text-slate-400">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Actions critiques */}
      {critiques.length > 0 && (
        <Section title="Actions critiques" icon={<AlertTriangle className="w-4 h-4 text-red-500" />} color="red">
          {critiques.map((action, i) => (
            <ActionCard key={i} action={action} />
          ))}
        </Section>
      )}

      {/* Actions prioritaires */}
      {hautes.length > 0 && (
        <Section title="Prioritaires" icon={<Zap className="w-4 h-4 text-amber-500" />} color="amber">
          {hautes.slice(0, 5).map((action, i) => (
            <ActionCard key={i} action={action} />
          ))}
        </Section>
      )}

      {/* Rappels aujourd'hui */}
      {todayRappels && todayRappels.length > 0 && (
        <Section title={`Rappels aujourd'hui (${todayRappels.length})`} icon={<Phone className="w-4 h-4 text-blue-500" />} color="blue">
          {todayRappels.map((r) => (
            <Link key={r.id} href={`/lead/${r.lead_id}`} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 px-3 rounded transition">
              <div>
                <p className="text-sm font-medium">{r.titre || r.type}</p>
                <p className="text-xs text-gray-400">{r.lead?.prenom} {r.lead?.nom} · {new Date(r.date_rappel).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-300" />
            </Link>
          ))}
        </Section>
      )}

      {/* Actions normales */}
      {normales.length > 0 && (
        <Section title={`Autres suggestions (${normales.length})`} icon={<CheckCircle className="w-4 h-4 text-gray-400" />} color="gray">
          {normales.slice(0, 5).map((action, i) => (
            <ActionCard key={i} action={action} compact />
          ))}
          {normales.length > 5 && (
            <p className="text-xs text-gray-400 text-center py-2">+ {normales.length - 5} autres suggestions</p>
          )}
        </Section>
      )}

      {/* Rien à faire */}
      {smartActions.length === 0 && (!todayRappels || todayRappels.length === 0) && (
        <div className="bg-white rounded-xl border p-12 text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <h3 className="font-semibold text-lg text-[#082545]">Tout est à jour !</h3>
          <p className="text-sm text-gray-500 mt-1">Aucune action urgente. Profitez-en pour prospecter.</p>
        </div>
      )}
    </div>
  )
}

function Section({ title, icon, color, children }: { title: string; icon: React.ReactNode; color: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className={`px-5 py-3 border-b border-gray-100 flex items-center gap-2 bg-${color}-50/30`}>
        {icon}
        <h3 className="font-semibold text-sm text-[#082545]">{title}</h3>
      </div>
      <div className="divide-y divide-gray-50">
        {children}
      </div>
    </div>
  )
}

function ActionCard({ action, compact = false }: { action: ReturnType<typeof generateSmartActions>[0]; compact?: boolean }) {
  const prioriteColors = {
    CRITIQUE: 'bg-red-500',
    HAUTE: 'bg-amber-500',
    NORMALE: 'bg-blue-500',
    BASSE: 'bg-gray-400',
  }

  return (
    <Link
      href={action.action_url}
      className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition group"
    >
      <div className={`w-2 h-2 rounded-full shrink-0 ${prioriteColors[action.priorite]}`} />
      <div className="flex-1 min-w-0">
        <p className={`font-medium text-gray-700 group-hover:text-[#2EC6F3] transition ${compact ? 'text-xs' : 'text-sm'}`}>
          {action.titre}
        </p>
        {!compact && <p className="text-xs text-gray-400 mt-0.5 truncate">{action.description}</p>}
      </div>
      <span className="text-xs px-2.5 py-1 rounded-full bg-[#2EC6F3]/10 text-[#2EC6F3] font-medium shrink-0 opacity-0 group-hover:opacity-100 transition">
        {action.action_cta}
      </span>
    </Link>
  )
}
