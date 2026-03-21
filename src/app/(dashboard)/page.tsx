'use client'

import { useLeads } from '@/hooks/use-leads'
import { useSessions } from '@/hooks/use-sessions'
import { useOverdueRappels, useTodayRappels } from '@/hooks/use-reminders'
import {
  Users, UserCheck, Calendar, CreditCard, TrendingUp,
  AlertTriangle, Phone, Clock, GraduationCap, Euro
} from 'lucide-react'

function KpiCard({ icon: Icon, label, value, color, subtitle }: {
  icon: React.ElementType; label: string; value: string | number; color: string; subtitle?: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition animate-fadeIn">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold mt-1" style={{ color }}>{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
        <div className="p-2.5 rounded-lg" style={{ backgroundColor: `${color}15` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { data: leadsData } = useLeads({ per_page: 1 })
  const { data: newLeads } = useLeads({ statut: ['NOUVEAU'], per_page: 1 })
  const { data: qualifiedLeads } = useLeads({ statut: ['QUALIFIE', 'FINANCEMENT_EN_COURS', 'INSCRIT'], per_page: 1 })
  const { data: sessionsData } = useSessions()
  const { data: overdueRappels } = useOverdueRappels()
  const { data: todayRappels } = useTodayRappels()

  const totalLeads = leadsData?.total || 0
  const nouveaux = newLeads?.total || 0
  const enPipeline = qualifiedLeads?.total || 0
  const sessionsAVenir = sessionsData?.filter(s => s.statut === 'PLANIFIEE' || s.statut === 'CONFIRMEE').length || 0
  const overdueCount = overdueRappels?.length || 0
  const todayCount = todayRappels?.length || 0

  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#082545]" style={{ fontFamily: 'var(--font-heading)' }}>
            {greeting}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {overdueCount > 0
              ? `${overdueCount} rappel${overdueCount > 1 ? 's' : ''} en retard`
              : 'Tout est à jour'
            }
            {todayCount > 0 && ` · ${todayCount} rappel${todayCount > 1 ? 's' : ''} aujourd'hui`}
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <KpiCard icon={Users} label="Total Leads" value={totalLeads} color="#3B82F6" />
        <KpiCard icon={UserCheck} label="Nouveaux" value={nouveaux} color="#22C55E" subtitle="À contacter" />
        <KpiCard icon={TrendingUp} label="En Pipeline" value={enPipeline} color="#F59E0B" subtitle="Qualifiés → Inscrits" />
        <KpiCard icon={Calendar} label="Sessions à venir" value={sessionsAVenir} color="#8B5CF6" />
        <KpiCard icon={AlertTriangle} label="Rappels en retard" value={overdueCount} color={overdueCount > 0 ? '#EF4444' : '#22C55E'} />
      </div>

      {/* Grille principale */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rappels aujourd'hui */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-semibold text-[#082545] flex items-center gap-2 mb-4">
            <Phone className="w-4 h-4 text-[#2EC6F3]" />
            Rappels aujourd&apos;hui ({todayCount})
          </h3>
          {todayRappels && todayRappels.length > 0 ? (
            <div className="space-y-3">
              {todayRappels.slice(0, 5).map((r) => (
                <div key={r.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{r.titre || r.type}</p>
                    <p className="text-xs text-gray-400">
                      {r.lead?.prenom} {r.lead?.nom} · {new Date(r.date_rappel).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-600">{r.type}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">Aucun rappel prévu aujourd&apos;hui</p>
          )}
        </div>

        {/* Sessions à venir */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-semibold text-[#082545] flex items-center gap-2 mb-4">
            <GraduationCap className="w-4 h-4 text-[#2EC6F3]" />
            Prochaines sessions
          </h3>
          {sessionsData && sessionsData.filter(s => s.statut !== 'TERMINEE' && s.statut !== 'ANNULEE').length > 0 ? (
            <div className="space-y-3">
              {sessionsData
                .filter(s => s.statut !== 'TERMINEE' && s.statut !== 'ANNULEE')
                .slice(0, 5)
                .map((s) => (
                  <div key={s.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium">{s.formation?.nom}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(s.date_debut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                        {' · '}{s.places_occupees}/{s.places_max} places
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      s.places_occupees >= s.places_max
                        ? 'bg-red-50 text-red-600'
                        : s.places_occupees >= s.places_max - 2
                          ? 'bg-orange-50 text-orange-600'
                          : 'bg-green-50 text-green-600'
                    }`}>
                      {s.places_max - s.places_occupees} dispo
                    </span>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">Aucune session planifiée</p>
          )}
        </div>
      </div>
    </div>
  )
}
