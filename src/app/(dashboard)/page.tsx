'use client'

import { useLeads } from '@/hooks/use-leads'
import { useSessions } from '@/hooks/use-sessions'
import { useOverdueRappels, useTodayRappels } from '@/hooks/use-reminders'
import {
  Users, UserCheck, Calendar, TrendingUp,
  AlertTriangle, Phone, Clock, GraduationCap,
  ArrowRight, Zap, ChevronRight
} from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const { data: leadsData } = useLeads({ per_page: 5 })
  const { data: newLeads } = useLeads({ statut: ['NOUVEAU'], per_page: 1 })
  const { data: pipelineLeads } = useLeads({ statut: ['QUALIFIE', 'FINANCEMENT_EN_COURS', 'INSCRIT'], per_page: 1 })
  const { data: sessions } = useSessions()
  const { data: overdueRappels } = useOverdueRappels()
  const { data: todayRappels } = useTodayRappels()

  const totalLeads = leadsData?.total || 0
  const nouveaux = newLeads?.total || 0
  const enPipeline = pipelineLeads?.total || 0
  const sessionsAVenir = sessions?.filter(s => s.statut === 'PLANIFIEE' || s.statut === 'CONFIRMEE').length || 0
  const overdueCount = overdueRappels?.length || 0
  const todayCount = todayRappels?.length || 0

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="bg-gradient-to-r from-[#082545] to-[#0F3A6E] rounded-2xl p-6 md:p-8 text-white relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-72 h-72 rounded-full bg-[#2EC6F3]/10" />
        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
            {greeting}
          </h1>
          <p className="text-blue-200 mt-1 text-sm">
            {overdueCount > 0 && <span className="text-amber-300">{overdueCount} rappel{overdueCount > 1 ? 's' : ''} en retard · </span>}
            {todayCount > 0 && <span>{todayCount} rappel{todayCount > 1 ? 's' : ''} aujourd&apos;hui · </span>}
            {sessionsAVenir} session{sessionsAVenir > 1 ? 's' : ''} à venir
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard icon={Users} label="Total leads" value={totalLeads} color="#3B82F6" />
        <KpiCard icon={UserCheck} label="Nouveaux" value={nouveaux} color="#22C55E" subtitle="À contacter" />
        <KpiCard icon={TrendingUp} label="Pipeline" value={enPipeline} color="#F59E0B" />
        <KpiCard icon={AlertTriangle} label="En retard" value={overdueCount} color={overdueCount > 0 ? '#EF4444' : '#22C55E'} />
      </div>

      {/* 2 colonnes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rappels + Actions du jour */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-sm text-[#082545] flex items-center gap-2">
              <Phone className="w-4 h-4 text-[#2EC6F3]" />
              Rappels ({todayCount + overdueCount})
            </h3>
            <Link href="/leads" className="text-xs text-[#2EC6F3] hover:underline flex items-center gap-1">
              Voir tout <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {overdueRappels && overdueRappels.length > 0 && overdueRappels.slice(0, 3).map((r) => (
              <Link key={r.id} href={`/lead/${r.lead_id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-red-50/50 transition group">
                <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate">{r.titre || r.type}</p>
                  <p className="text-xs text-red-400">{r.lead?.prenom} {r.lead?.nom} · en retard</p>
                </div>
              </Link>
            ))}
            {todayRappels && todayRappels.length > 0 && todayRappels.slice(0, 3).map((r) => (
              <Link key={r.id} href={`/lead/${r.lead_id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition group">
                <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate">{r.titre || r.type}</p>
                  <p className="text-xs text-gray-400">
                    {r.lead?.prenom} {r.lead?.nom} · {new Date(r.date_rappel).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </Link>
            ))}
            {(!todayRappels || todayRappels.length === 0) && (!overdueRappels || overdueRappels.length === 0) && (
              <div className="px-5 py-8 text-center text-sm text-gray-400">
                Aucun rappel prévu aujourd&apos;hui
              </div>
            )}
          </div>
        </div>

        {/* Sessions à venir */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-sm text-[#082545] flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-[#2EC6F3]" />
              Prochaines sessions
            </h3>
            <Link href="/sessions" className="text-xs text-[#2EC6F3] hover:underline flex items-center gap-1">
              Voir tout <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {sessions && sessions.filter(s => s.statut !== 'TERMINEE' && s.statut !== 'ANNULEE').slice(0, 4).map((s) => {
              const placesLeft = s.places_max - s.places_occupees
              return (
                <Link key={s.id} href={`/session/${s.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition group">
                  <div className="w-10 h-10 rounded-lg bg-violet-50 flex flex-col items-center justify-center shrink-0">
                    <span className="text-[10px] font-medium text-violet-600 uppercase leading-none">
                      {new Date(s.date_debut).toLocaleDateString('fr-FR', { month: 'short' })}
                    </span>
                    <span className="text-sm font-bold text-violet-700 leading-tight">
                      {new Date(s.date_debut).getDate()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate group-hover:text-[#2EC6F3] transition">{s.formation?.nom}</p>
                    <p className="text-xs text-gray-400">{s.places_occupees}/{s.places_max} inscrits</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${placesLeft <= 0 ? 'bg-red-50 text-red-600' : placesLeft <= 2 ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'}`}>
                    {placesLeft <= 0 ? 'Complet' : `${placesLeft} dispo`}
                  </span>
                </Link>
              )
            })}
            {(!sessions || sessions.filter(s => s.statut !== 'TERMINEE' && s.statut !== 'ANNULEE').length === 0) && (
              <div className="px-5 py-8 text-center text-sm text-gray-400">
                Aucune session planifiée
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Derniers leads */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-sm text-[#082545] flex items-center gap-2">
            <Users className="w-4 h-4 text-[#2EC6F3]" />
            Derniers leads
          </h3>
          <Link href="/leads" className="text-xs text-[#2EC6F3] hover:underline flex items-center gap-1">
            Voir tout <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="divide-y divide-gray-50">
          {leadsData?.leads?.slice(0, 5).map((lead) => (
            <Link key={lead.id} href={`/lead/${lead.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition group">
              <div className="w-8 h-8 rounded-full bg-[#2EC6F3]/10 flex items-center justify-center text-xs font-semibold text-[#2EC6F3]">
                {lead.prenom?.[0]}{lead.nom?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 truncate">{lead.prenom} {lead.nom}</p>
                <p className="text-xs text-gray-400 truncate">{lead.formation_principale?.nom || lead.source || '—'}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{
                    width: `${lead.score_chaud}%`,
                    backgroundColor: lead.score_chaud >= 70 ? '#22C55E' : lead.score_chaud >= 40 ? '#F59E0B' : '#9CA3AF',
                  }} />
                </div>
                <span className="text-[10px] text-gray-400 tabular-nums w-5 text-right">{lead.score_chaud}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Actions rapides */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="flex flex-wrap gap-2">
          <Link href="/leads" className="flex items-center gap-2 px-4 py-2.5 bg-[#2EC6F3]/10 text-[#2EC6F3] rounded-lg text-sm font-medium hover:bg-[#2EC6F3]/20 transition min-h-[44px]">
            <Users className="w-4 h-4" /> Nouveau lead
          </Link>
          <Link href="/sessions" className="flex items-center gap-2 px-4 py-2.5 bg-violet-50 text-violet-600 rounded-lg text-sm font-medium hover:bg-violet-100 transition min-h-[44px]">
            <Calendar className="w-4 h-4" /> Nouvelle session
          </Link>
          <Link href="/analytics" className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-100 transition min-h-[44px]">
            <TrendingUp className="w-4 h-4" /> Voir analytics
          </Link>
        </div>
      </div>
    </div>
  )
}

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
