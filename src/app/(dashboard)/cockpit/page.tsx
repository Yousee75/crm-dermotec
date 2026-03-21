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
import { KpiCard } from '@/components/ui/KpiCard'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { cn } from '@/lib/utils'

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
      <div className="relative overflow-hidden rounded-2xl gradient-accent p-8 text-white">
        <div className="absolute inset-0 opacity-[0.07]">
          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-[#2EC6F3]" />
          <div className="absolute -left-8 -bottom-8 w-40 h-40 rounded-full bg-[#3B82F6]" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-sm">
              <Rocket className="w-5 h-5 text-[#2EC6F3]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
                {greeting} ! Voici votre journée.
              </h1>
              <p className="text-blue-200 text-sm mt-0.5">
                {smartActions.length} action{smartActions.length > 1 ? 's' : ''} suggérée{smartActions.length > 1 ? 's' : ''}
                {' · '}{todayRappels?.length || 0} rappel{(todayRappels?.length || 0) > 1 ? 's' : ''} aujourd&apos;hui
                {overdueRappels && overdueRappels.length > 0 && (
                  <span className="text-amber-300 font-medium"> · {overdueRappels.length} en retard !</span>
                )}
              </p>
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            {[
              { icon: AlertTriangle, label: 'Critiques', value: critiques.length, color: critiques.length > 0 ? '#EF4444' : '#22C55E' },
              { icon: Target, label: 'Prioritaires', value: hautes.length, color: '#F59E0B' },
              { icon: Calendar, label: 'Sessions', value: sessions?.filter(s => s.statut === 'PLANIFIEE').length || 0, color: '#8B5CF6' },
              { icon: TrendingUp, label: 'Pipeline', value: pipelineLeads?.total || 0, color: '#2EC6F3' },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="bg-white/[0.08] backdrop-blur-sm rounded-xl p-3 text-center border border-white/[0.06]">
                <Icon className="w-4 h-4 mx-auto mb-1.5" style={{ color }} />
                <p className="text-xl font-bold">{value}</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Actions critiques */}
      {critiques.length > 0 && (
        <ActionSection
          title="Actions critiques"
          icon={<AlertTriangle className="w-4 h-4" />}
          variant="error"
          actions={critiques}
        />
      )}

      {/* Actions prioritaires */}
      {hautes.length > 0 && (
        <ActionSection
          title="Prioritaires"
          icon={<Zap className="w-4 h-4" />}
          variant="warning"
          actions={hautes.slice(0, 5)}
        />
      )}

      {/* Rappels aujourd'hui */}
      {todayRappels && todayRappels.length > 0 && (
        <Card padding="none">
          <CardHeader className="px-5 pt-5 pb-0">
            <CardTitle icon={<Phone className="w-4 h-4" />}>
              Rappels aujourd&apos;hui ({todayRappels.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-gray-50">
            {todayRappels.map((r) => (
              <Link
                key={r.id}
                href={`/lead/${r.lead_id}`}
                className="flex items-center justify-between py-3 px-5 hover:bg-gray-50 transition group"
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center',
                    r.type === 'APPEL' ? 'bg-blue-50 text-blue-500' : 'bg-gray-50 text-gray-400'
                  )}>
                    {r.type === 'APPEL' ? <Phone className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 group-hover:text-[#2EC6F3] transition">{r.titre || r.type}</p>
                    <p className="text-xs text-gray-400">
                      {r.lead?.prenom} {r.lead?.nom} · {new Date(r.date_rappel).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[#2EC6F3] transition" />
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Actions normales */}
      {normales.length > 0 && (
        <ActionSection
          title={`Autres suggestions (${normales.length})`}
          icon={<CheckCircle className="w-4 h-4" />}
          variant="default"
          actions={normales.slice(0, 5)}
          compact
          extra={normales.length > 5 ? `+ ${normales.length - 5} autres suggestions` : undefined}
        />
      )}

      {/* All clear */}
      {smartActions.length === 0 && (!todayRappels || todayRappels.length === 0) && (
        <Card className="text-center" padding="lg">
          <EmptyState
            icon={<CheckCircle className="w-8 h-8 text-green-500" />}
            title="Tout est à jour !"
            description="Aucune action urgente. Profitez-en pour prospecter."
            action={{
              label: 'Voir les leads',
              onClick: () => {},
              icon: <ArrowRight className="w-3.5 h-3.5" />,
            }}
          />
        </Card>
      )}
    </div>
  )
}

// --- Sub-components ---

const prioriteColors = {
  CRITIQUE: 'bg-red-500',
  HAUTE: 'bg-amber-500',
  NORMALE: 'bg-blue-500',
  BASSE: 'bg-gray-400',
}

function ActionSection({ title, icon, variant, actions, compact, extra }: {
  title: string
  icon: React.ReactNode
  variant: 'error' | 'warning' | 'default'
  actions: ReturnType<typeof generateSmartActions>
  compact?: boolean
  extra?: string
}) {
  const headerBg = variant === 'error' ? 'bg-red-50/50' : variant === 'warning' ? 'bg-amber-50/50' : 'bg-gray-50/50'
  const iconColor = variant === 'error' ? 'text-red-500' : variant === 'warning' ? 'text-amber-500' : 'text-gray-400'

  return (
    <Card padding="none">
      <div className={cn('px-5 py-3 border-b border-gray-100 flex items-center gap-2', headerBg)}>
        <span className={iconColor}>{icon}</span>
        <h3 className="font-semibold text-sm text-[#082545]">{title}</h3>
      </div>
      <div className="divide-y divide-gray-50">
        {actions.map((action, i) => (
          <Link
            key={i}
            href={action.action_url}
            className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition group"
          >
            <div className={cn('w-2 h-2 rounded-full shrink-0', prioriteColors[action.priorite])} />
            <div className="flex-1 min-w-0">
              <p className={cn(
                'font-medium text-gray-700 group-hover:text-[#2EC6F3] transition truncate',
                compact ? 'text-xs' : 'text-sm'
              )}>
                {action.titre}
              </p>
              {!compact && <p className="text-xs text-gray-400 mt-0.5 truncate">{action.description}</p>}
            </div>
            <Badge variant="primary" size="sm" className="opacity-0 group-hover:opacity-100 transition shrink-0">
              {action.action_cta}
            </Badge>
          </Link>
        ))}
        {extra && (
          <p className="text-xs text-gray-400 text-center py-3">{extra}</p>
        )}
      </div>
    </Card>
  )
}
