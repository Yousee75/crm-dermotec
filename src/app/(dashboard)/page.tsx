'use client'

import { Suspense } from 'react'
import { useLeads } from '@/hooks/use-leads'
import { useSessions } from '@/hooks/use-sessions'
import { useOverdueRappels, useTodayRappels } from '@/hooks/use-reminders'
import { createClient } from '@/lib/supabase-client'
import { useQuery } from '@tanstack/react-query'
import {
  Users, UserCheck, TrendingUp, Euro,
  Calendar, Target, AlertTriangle,
  Phone, ChevronRight,
  MessageCircle, Mail
} from 'lucide-react'
import {
  UsersThree, ChartLineUp, CurrencyEur, CalendarCheck,
  Warning, PhoneCall, Crosshair, Lightning,
} from '@phosphor-icons/react'
import Link from 'next/link'
import Image from 'next/image'
import { useCurrentUser } from '@/hooks/use-current-user'
import { cn } from '@/lib/utils'
import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton'

// Composant skeleton pour le dashboard
function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-32" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </div>

      {/* Focus message skeleton */}
      <div className="h-16 bg-gray-100 rounded-xl" />

      {/* Pipeline mini skeleton */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
        <div className="flex gap-1">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="flex-1">
              <div className="h-2 bg-gray-100 rounded-full mb-1.5" />
              <Skeleton className="h-3 w-4 mx-auto mb-1" />
              <Skeleton className="h-2 w-8 mx-auto" />
            </div>
          ))}
        </div>
      </div>

      {/* 2 colonnes skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Actions du jour */}
        <div className="bg-white rounded-2xl border border-gray-100">
          <div className="px-5 py-3 border-b border-gray-100">
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="space-y-3 p-5">
            {[1,2,3].map(i => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-gray-200" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-2 w-24" />
                </div>
                <div className="flex gap-1">
                  <Skeleton className="h-6 w-6 rounded" />
                  <Skeleton className="h-6 w-6 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Derniers prospects */}
        <div className="bg-white rounded-2xl border border-gray-100">
          <div className="px-5 py-3 border-b border-gray-100">
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="space-y-3 p-5">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-100" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-2 w-16" />
                </div>
                <Skeleton className="h-1.5 w-8" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* KPI cards skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[1,2,3,4,5,6].map(i => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const supabase = createClient()
  const { data: currentUser } = useCurrentUser()

  // Données existantes
  const { data: leadsData, isLoading: leadsLoading } = useLeads({ per_page: 5 })
  const { data: sessions, isLoading: sessionsLoading } = useSessions()
  const { data: overdueRappels, isLoading: rappelsLoading } = useOverdueRappels()
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
  const { data: caData, isLoading: caLoading } = useQuery({
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
    },
    staleTime: 5 * 60_000, // 5 min — CA analytics
    gcTime: 10 * 60_000,
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

  // Loading state global
  const isLoading = leadsLoading || sessionsLoading || rappelsLoading || caLoading

  // Afficher le skeleton pendant le chargement
  if (isLoading) {
    return <DashboardSkeleton />
  }

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
    <div className="min-h-screen bg-slate-50 space-y-6">
      {/* Header avec logo Dermotec */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Image
            src="/logo-dermotec.png"
            alt="Dermotec Advanced"
            width={120}
            height={40}
            className="h-8 w-auto object-contain"
          />
          <div>
            <h1 className="text-2xl font-bold text-accent">
              {greeting}{currentUser?.prenom ? ` ${currentUser.prenom}` : ''} 👋
            </h1>
            <p className="text-sm text-gray-500">
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      {/* FOCUS — Le message le plus important du moment */}
      {overdueCount > 0 ? (
        <Link href="/leads" className="block bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-4 text-white hover:from-red-600 hover:to-red-700 transition-all shadow-lg shadow-red-500/20 group pulse-urgent nudge-repeat">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Warning className="w-5 h-5" weight="duotone" />
              </div>
              <div>
                <p className="font-semibold">{overdueCount} rappel{overdueCount > 1 ? 's' : ''} en retard</p>
                <p className="text-red-100 text-sm">Contactez-les maintenant pour ne pas les perdre</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-white/60 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      ) : todayCount > 0 ? (
        <Link href="/leads" className="block bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl p-4 text-white hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg shadow-amber-500/20 group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <PhoneCall className="w-5 h-5" weight="duotone" />
              </div>
              <div>
                <p className="font-semibold">{todayCount} prospect{todayCount > 1 ? 's' : ''} à rappeler aujourd&apos;hui</p>
                <p className="text-amber-100 text-sm">Le meilleur moment pour appeler : maintenant</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-white/60 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      ) : sessionsAVenir > 0 ? (
        <Link href="/sessions" className="block bg-gradient-to-r from-primary to-blue-500 rounded-xl p-4 text-white hover:from-primary-dark hover:to-blue-600 transition-all shadow-lg shadow-primary/20 group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <CalendarCheck className="w-5 h-5" weight="duotone" />
              </div>
              <div>
                <p className="font-semibold">{sessionsAVenir} formation{sessionsAVenir > 1 ? 's' : ''} planifiée{sessionsAVenir > 1 ? 's' : ''}</p>
                <p className="text-blue-100 text-sm">Vérifiez les inscriptions et le taux de remplissage</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-white/60 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      ) : (
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl p-4 text-white shadow-lg shadow-emerald-500/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Crosshair className="w-5 h-5" weight="duotone" />
            </div>
            <div>
              <p className="font-semibold">Tout est en ordre</p>
              <p className="text-emerald-100 text-sm">Aucune action urgente. Profitez-en pour prospecter !</p>
            </div>
          </div>
        </div>
      )}

      {/* PIPELINE MINI — Vue rapide cliquable */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-accent flex items-center gap-2">
            Pipeline commercial
          </h3>
          <Link href="/pipeline" className="text-xs text-primary hover:underline flex items-center gap-1">
            Voir le Kanban <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="flex items-center gap-1">
          {[
            { label: 'Nouveau', count: leadsData?.leads?.filter(l => l.statut === 'NOUVEAU').length || 0, color: '#94A3B8' },
            { label: 'Qualifié', count: leadsData?.leads?.filter(l => l.statut === 'QUALIFIE').length || 0, color: '#2EC6F3' },
            { label: 'Financement', count: leadsData?.leads?.filter(l => l.statut === 'FINANCEMENT_EN_COURS').length || 0, color: '#F59E0B' },
            { label: 'Inscrit', count: leadsData?.leads?.filter(l => l.statut === 'INSCRIT').length || 0, color: '#8B5CF6' },
            { label: 'Formé', count: leadsData?.leads?.filter(l => l.statut === 'FORME' || l.statut === 'ALUMNI').length || 0, color: '#22C55E' },
          ].map((stage) => (
            <Link
              key={stage.label}
              href={`/pipeline`}
              className="flex-1 group"
            >
              <div
                className="h-2 rounded-full transition-all group-hover:h-3"
                style={{ backgroundColor: `${stage.color}30` }}
              >
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    backgroundColor: stage.color,
                    width: stage.count > 0 ? '100%' : '0%',
                    opacity: stage.count > 0 ? 1 : 0.3,
                  }}
                />
              </div>
              <div className="mt-1.5 text-center">
                <p className="text-xs font-bold text-gray-700" style={{ fontVariantNumeric: 'tabular-nums' }}>{stage.count}</p>
                <p className="text-[10px] text-gray-400 truncate">{stage.label}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* 2 colonnes : ACTIONS + DERNIERS PROSPECTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Actions du jour */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-sm text-accent flex items-center gap-2">
              <Phone className="w-4 h-4 text-primary" />
              Actions du jour
            </h3>
            <Link href="/leads" className="text-xs text-primary hover:underline flex items-center gap-1">
              Voir tout <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50 stagger-children">
            {overdueRappels && overdueRappels.length > 0 && overdueRappels.slice(0, 3).map((r) => (
              <div key={r.id} className="flex items-center gap-3 px-5 py-3 hover:bg-red-50/50 transition group list-row list-row-urgent pulse-urgent">
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
              <div key={r.id} className="flex items-center gap-3 px-5 py-3 hover:bg-amber-50/50 transition group list-row">
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
            {(!overdueRappels?.length && !todayRappels?.length && !sessions?.filter(s => s.statut === 'CONFIRMEE' || s.statut === 'PLANIFIEE').length) && (
              <div className="text-center py-8 text-gray-400">
                <Phone className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Aucune action pour le moment</p>
                <p className="text-xs mt-1">Parfait ! Vous êtes à jour 🎉</p>
              </div>
            )}
          </div>
        </div>

        {/* Derniers prospects */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-sm text-accent flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Derniers prospects
            </h3>
            <Link href="/leads" className="text-xs text-primary hover:underline flex items-center gap-1">
              Voir tout <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50 stagger-children">
            {leadsData?.leads && leadsData.leads.length > 0 ? leadsData.leads.slice(0, 5).map((lead) => (
              <Link key={lead.id} href={`/lead/${lead.id}`} className={cn('flex items-center gap-3 px-5 py-3 transition group list-row', lead.score_chaud >= 80 && 'list-row-hot glow-hot')}>
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
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
              <div className="text-center py-8 text-gray-400">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Aucun prospect enregistré</p>
                <Link href="/leads" className="text-xs text-primary hover:underline mt-1 inline-block">
                  Créer le premier prospect
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* KPIs compacts (APRÈS les actions) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard
          icon={(p: any) => <UsersThree weight="duotone" {...p} />}
          label="Total prospects"
          value={totalLeads.toLocaleString()}
          color="#2EC6F3"
        />
        <KpiCard
          icon={(p: any) => <Lightning weight="duotone" {...p} />}
          label="Nouveaux ce mois"
          value={nouveauxCeMois.toLocaleString()}
          color="#22C55E"
          variation={variationNouveaux}
        />
        <KpiCard
          icon={(p: any) => <ChartLineUp weight="duotone" {...p} />}
          label="En pipeline"
          value={enPipeline.toLocaleString()}
          color="#F59E0B"
        />
        <KpiCard
          icon={(p: any) => <CurrencyEur weight="duotone" {...p} />}
          label="CA realise"
          value={formatEuro(caRealise)}
          color="#2EC6F3"
          subtitle="Ce mois"
        />
        <KpiCard
          icon={(p: any) => <CalendarCheck weight="duotone" {...p} />}
          label="Formations a venir"
          value={sessionsAVenir.toLocaleString()}
          color="#8B5CF6"
        />
        <KpiCard
          icon={(p: any) => <Crosshair weight="duotone" {...p} />}
          label="Taux conversion"
          value={`${tauxConversion.toFixed(1)}%`}
          color="#22C55E"
        />
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
    <div className="bg-white rounded-xl border-l-4 border-r border-t border-b border-gray-100 shadow-sm p-4 card-interactive" style={{ borderLeftColor: color }}>
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}15` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        {variation !== undefined && variation !== 0 && (
          <span className={`text-xs px-2 py-0.5 rounded-full bounce-badge ${
            variation > 0
              ? 'bg-green-50 text-green-600'
              : 'bg-red-50 text-red-600'
          }`}>
            {variation > 0 ? '+' : ''}{variation.toFixed(0)}%
          </span>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold text-accent count-up tabular-nums">
          {value}
        </p>
        <p className="text-sm text-gray-500 mt-1">{label}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  )
}