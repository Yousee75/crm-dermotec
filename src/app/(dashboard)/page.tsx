'use client'

import { useLeads } from '@/hooks/use-leads'
import { useSessions } from '@/hooks/use-sessions'
import { useOverdueRappels, useTodayRappels } from '@/hooks/use-reminders'
import { createClient } from '@/lib/supabase-client'
import { useQuery } from '@tanstack/react-query'
import {
  Users, UserCheck, TrendingUp, Euro,
  Calendar, Target, AlertTriangle, Clock,
  Phone, Plus, PieChart, ChevronRight, Zap,
  MessageCircle, Mail
} from 'lucide-react'
import Link from 'next/link'
import { useCurrentUser } from '@/hooks/use-current-user'

export default function DashboardPage() {
  const supabase = createClient()
  const { data: currentUser } = useCurrentUser()

  // Données existantes
  const { data: leadsData } = useLeads({ per_page: 5 })
  const { data: sessions } = useSessions()
  const { data: overdueRappels } = useOverdueRappels()
  const { data: todayRappels } = useTodayRappels()

  // Nouveaux leads du mois avec variation
  const { data: newThisMonth } = useLeads({
    date_from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
    per_page: 1
  })

  const { data: newLastMonth } = useLeads({
    date_from: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString(),
    date_to: new Date(new Date().getFullYear(), new Date().getMonth(), 0, 23, 59, 59).toISOString(),
    per_page: 1
  })

  // Leads en pipeline
  const { data: pipelineLeads } = useLeads({
    statut: ['QUALIFIE', 'FINANCEMENT_EN_COURS', 'INSCRIT'],
    per_page: 1
  })

  // CA réalisé ce mois
  const { data: caData } = useQuery({
    queryKey: ['ca-ce-mois'],
    queryFn: async () => {
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
      const { data, error } = await supabase
        .from('inscriptions')
        .select('montant_total')
        .eq('paiement_statut', 'PAYE')
        .gte('updated_at', startOfMonth)

      if (error) throw error

      const total = data?.reduce((sum, inscription) => sum + (inscription.montant_total || 0), 0) || 0
      return total
    }
  })

  // Taux de conversion
  const { data: totalLeadsCount } = useLeads({ per_page: 1 })
  const { data: convertedLeads } = useLeads({
    statut: ['FORME', 'ALUMNI'],
    per_page: 1
  })

  // Calculs des KPIs
  const totalLeads = leadsData?.total || 0
  const nouveauxCeMois = newThisMonth?.total || 0
  const nouveauxMoisPrecedent = newLastMonth?.total || 0
  const variationNouveaux = nouveauxMoisPrecedent > 0
    ? ((nouveauxCeMois - nouveauxMoisPrecedent) / nouveauxMoisPrecedent * 100)
    : 0

  const enPipeline = pipelineLeads?.total || 0
  const caRealise = caData || 0
  const sessionsAVenir = sessions?.filter(s => s.statut === 'PLANIFIEE' || s.statut === 'CONFIRMEE').length || 0
  const tauxConversion = totalLeadsCount?.total && convertedLeads?.total
    ? (convertedLeads.total / totalLeadsCount.total * 100)
    : 0

  const overdueCount = overdueRappels?.length || 0
  const todayCount = todayRappels?.length || 0

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'

  const formatEuro = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatRelativeTime = (date: string) => {
    const now = new Date()
    const past = new Date(date)
    const diffMs = now.getTime() - past.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffHours < 1) return 'À l\'instant'
    if (diffHours < 24) return `Il y a ${diffHours}h`
    if (diffDays < 7) return `Il y a ${diffDays}j`
    return past.toLocaleDateString('fr-FR')
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] space-y-6">
      {/* Hero compact — personnalisé */}
      <div className="bg-gradient-to-r from-[#082545] to-[#0F3A6E] rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
            {greeting}{currentUser?.prenom ? ` ${currentUser.prenom}` : ''} 👋
          </h1>
          <p className="text-blue-200 mt-1 text-sm">
            {overdueCount > 0 && <span className="text-amber-300">{overdueCount} rappel{overdueCount > 1 ? 's' : ''} en retard</span>}
            {overdueCount > 0 && (todayCount > 0 || sessionsAVenir > 0) && <span> · </span>}
            {todayCount > 0 && <span>{todayCount} rappel{todayCount > 1 ? 's' : ''} aujourd&apos;hui</span>}
            {todayCount > 0 && sessionsAVenir > 0 && <span> · </span>}
            {sessionsAVenir > 0 && <span>{sessionsAVenir} session{sessionsAVenir > 1 ? 's' : ''} à venir</span>}
          </p>
        </div>
      </div>

      {/* 2 colonnes : ACTIONS D'ABORD (principe noCRM : "quoi faire maintenant ?") */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Actions du jour */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-sm text-[#082545] flex items-center gap-2">
              <Phone className="w-4 h-4 text-[#2EC6F3]" />
              Actions du jour
            </h3>
            <Link href="/leads" className="text-xs text-[#2EC6F3] hover:underline flex items-center gap-1">
              Voir tout <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {overdueRappels && overdueRappels.length > 0 && overdueRappels.slice(0, 3).map((r) => (
              <div key={r.id} className="flex items-center gap-3 px-5 py-3 hover:bg-red-50/50 transition group">
                <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                <Link href={`/lead/${r.lead_id}`} className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate">{r.lead?.prenom} {r.lead?.nom}</p>
                  <p className="text-xs text-red-400">{r.titre || r.type} · en retard</p>
                </Link>
                <div className="flex items-center gap-1 shrink-0">
                  {r.lead?.telephone && (
                    <a href={`tel:${r.lead.telephone}`} className="p-1.5 rounded-lg hover:bg-red-100 transition" title="Appeler">
                      <Phone className="w-3.5 h-3.5 text-red-500" />
                    </a>
                  )}
                  {r.lead?.telephone && (
                    <a href={`https://wa.me/${(r.lead.telephone || '').replace(/\s/g, '').replace(/^0/, '33')}`} target="_blank" className="p-1.5 rounded-lg hover:bg-green-100 transition" title="WhatsApp">
                      <MessageCircle className="w-3.5 h-3.5 text-green-600" />
                    </a>
                  )}
                  {r.lead?.email && (
                    <a href={`mailto:${r.lead.email}`} className="p-1.5 rounded-lg hover:bg-blue-100 transition" title="Email">
                      <Mail className="w-3.5 h-3.5 text-blue-500" />
                    </a>
                  )}
                </div>
              </div>
            ))}
            {todayRappels && todayRappels.length > 0 && todayRappels.slice(0, 3).map((r) => (
              <div key={r.id} className="flex items-center gap-3 px-5 py-3 hover:bg-amber-50/50 transition group">
                <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                <Link href={`/lead/${r.lead_id}`} className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate">{r.lead?.prenom} {r.lead?.nom}</p>
                  <p className="text-xs text-amber-500">{r.titre || r.type}</p>
                </Link>
                <div className="flex items-center gap-1 shrink-0">
                  {r.lead?.telephone && (
                    <a href={`tel:${r.lead.telephone}`} className="p-1.5 rounded-lg hover:bg-amber-100 transition" title="Appeler">
                      <Phone className="w-3.5 h-3.5 text-amber-600" />
                    </a>
                  )}
                  {r.lead?.telephone && (
                    <a href={`https://wa.me/${(r.lead.telephone || '').replace(/\s/g, '').replace(/^0/, '33')}`} target="_blank" className="p-1.5 rounded-lg hover:bg-green-100 transition" title="WhatsApp">
                      <MessageCircle className="w-3.5 h-3.5 text-green-600" />
                    </a>
                  )}
                </div>
              </div>
            ))}
            {sessions?.filter(s => s.statut === 'CONFIRMEE' || s.statut === 'PLANIFIEE').slice(0, 2).map((s) => (
              <Link key={s.id} href={`/session/${s.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-blue-50/50 transition group">
                <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate">{s.formation?.nom}</p>
                  <p className="text-xs text-blue-500">{new Date(s.date_debut).toLocaleDateString('fr-FR')} · {s.places_occupees}/{s.places_max} inscrits</p>
                </div>
                <Calendar className="w-4 h-4 text-blue-500 opacity-0 group-hover:opacity-100 transition" />
              </Link>
            ))}
            {(!overdueRappels?.length && !todayRappels?.length) && (
              <div className="px-5 py-8 text-center text-sm text-gray-400">Aucune action prévue aujourd&apos;hui</div>
            )}
          </div>
        </div>

        {/* Derniers leads */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
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
            {leadsData?.leads && leadsData.leads.length > 0 ? leadsData.leads.slice(0, 5).map((lead) => (
              <Link key={lead.id} href={`/lead/${lead.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition group">
                <div className="w-8 h-8 rounded-full bg-[#2EC6F3]/10 flex items-center justify-center text-xs font-bold text-[#2EC6F3] shrink-0">
                  {lead.prenom?.[0]}{lead.nom?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-700 truncate">{lead.prenom} {lead.nom}</p>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 shrink-0">{lead.statut}</span>
                  </div>
                  <p className="text-xs text-gray-400">{formatRelativeTime(lead.created_at)}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <div className="w-8 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{
                      width: `${lead.score_chaud || 0}%`,
                      backgroundColor: (lead.score_chaud || 0) >= 80 ? '#22C55E' : (lead.score_chaud || 0) >= 60 ? '#F59E0B' : '#9CA3AF'
                    }} />
                  </div>
                  <span className="text-[10px] text-gray-400 w-5">{lead.score_chaud || 0}</span>
                </div>
              </Link>
            )) : (
              <div className="px-5 py-8 text-center text-sm text-gray-400">Aucun lead enregistré</div>
            )}
          </div>
        </div>
      </div>

      {/* KPIs compacts (APRÈS les actions) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard
          icon={Users}
          label="Total leads"
          value={totalLeads.toLocaleString()}
          color="#2EC6F3"
        />
        <KpiCard
          icon={UserCheck}
          label="Nouveaux ce mois"
          value={nouveauxCeMois.toLocaleString()}
          color="#22C55E"
          variation={variationNouveaux}
        />
        <KpiCard
          icon={TrendingUp}
          label="En pipeline"
          value={enPipeline.toLocaleString()}
          color="#F59E0B"
        />
        <KpiCard
          icon={Euro}
          label="CA réalisé"
          value={formatEuro(caRealise)}
          color="#2EC6F3"
          subtitle="Ce mois"
        />
        <KpiCard
          icon={Calendar}
          label="Sessions à venir"
          value={sessionsAVenir.toLocaleString()}
          color="#8B5CF6"
        />
        <KpiCard
          icon={Target}
          label="Taux conversion"
          value={`${tauxConversion.toFixed(1)}%`}
          color="#22C55E"
        />
      </div>

      {/* Section leads ancienne supprimée — déjà au-dessus des KPIs */}
      <div className="hidden">
        <div>
          <div className="divide-y divide-gray-50">
            {leadsData?.leads?.slice(0, 5).map((lead) => {
              const statutColors = {
                NOUVEAU: 'bg-green-100 text-green-700',
                QUALIFIE: 'bg-blue-100 text-blue-700',
                FINANCEMENT_EN_COURS: 'bg-yellow-100 text-yellow-700',
                INSCRIT: 'bg-purple-100 text-purple-700',
                FORME: 'bg-emerald-100 text-emerald-700',
                ALUMNI: 'bg-gray-100 text-gray-700',
                SPAM: 'bg-red-100 text-red-700',
                PERDU: 'bg-red-100 text-red-700'
              }

              return (
                <Link key={lead.id} href={`/lead/${lead.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition group">
                  <div className="w-10 h-10 rounded-full bg-[#2EC6F3]/10 flex items-center justify-center text-sm font-semibold text-[#2EC6F3]">
                    {lead.prenom?.[0]}{lead.nom?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-700 truncate">{lead.prenom} {lead.nom}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${statutColors[lead.statut] || 'bg-gray-100 text-gray-700'}`}>
                        {lead.statut}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-gray-400 truncate flex-1">{formatRelativeTime(lead.created_at)}</p>
                      <div className="flex items-center gap-1">
                        <div className="w-8 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${lead.score_chaud}%`,
                              backgroundColor: lead.score_chaud >= 70 ? '#22C55E' : lead.score_chaud >= 40 ? '#F59E0B' : '#9CA3AF',
                            }}
                          />
                        </div>
                        <span className="text-[10px] text-gray-400 tabular-nums">{lead.score_chaud}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
            {(!leadsData?.leads || leadsData.leads.length === 0) && (
              <div className="px-5 py-8 text-center text-sm text-gray-400">
                Aucun lead enregistré
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex flex-wrap gap-3">
          <Link
            href="/leads"
            className="flex items-center gap-2 px-4 py-2.5 border border-[#2EC6F3] text-[#2EC6F3] rounded-lg text-sm font-medium hover:bg-[#2EC6F3]/5 transition min-h-[44px]"
          >
            <Plus className="w-4 h-4" /> Nouveau lead
          </Link>
          <Link
            href="/sessions"
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition min-h-[44px]"
          >
            <Calendar className="w-4 h-4" /> Créer session
          </Link>
          <Link
            href="/pipeline"
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition min-h-[44px]"
          >
            <PieChart className="w-4 h-4" /> Voir pipeline
          </Link>
        </div>
      </div>
    </div>
  )
}

function KpiCard({
  icon: Icon,
  label,
  value,
  color,
  subtitle,
  variation
}: {
  icon: React.ElementType
  label: string
  value: string | number
  color: string
  subtitle?: string
  variation?: number
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition">
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}15` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        {variation !== undefined && variation !== 0 && (
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            variation > 0
              ? 'bg-green-50 text-green-600'
              : 'bg-red-50 text-red-600'
          }`}>
            {variation > 0 ? '+' : ''}{variation.toFixed(0)}%
          </span>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold text-[#082545]" style={{ fontFamily: 'var(--font-heading)' }}>
          {value}
        </p>
        <p className="text-sm text-gray-500 mt-1">{label}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  )
}