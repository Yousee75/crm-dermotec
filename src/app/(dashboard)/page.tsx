'use client'

import { Suspense } from 'react'
import { useLeads } from '@/hooks/use-leads'
import { useSessions } from '@/hooks/use-sessions'
import { useOverdueRappels, useTodayRappels } from '@/hooks/use-reminders'
import { createClient } from '@/lib/supabase-client'
import { useQuery } from '@tanstack/react-query'
import {
  Users, UserCheck, Euro, Target, AlertTriangle,
  Phone, ChevronRight, MessageCircle, Mail
} from 'lucide-react'
import {
  UsersThree, Warning, PhoneCall, CalendarCheck
} from '@phosphor-icons/react'
import Link from 'next/link'
import Image from 'next/image'
import { useCurrentUser } from '@/hooks/use-current-user'
import { cn } from '@/lib/utils'
import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton'

// Composant skeleton pour le dashboard
function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
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
    <div className="space-y-6">
      {/* ZONE 1 — SALUTATION IA CONTEXTUELLE */}
      <div className="bg-white rounded-xl border border-[#EEEEEE] shadow-sm p-4">
        <div className="flex items-center gap-4">
          <Image
            src="/logo-dermotec.png"
            alt="Dermotec Advanced"
            width={120}
            height={40}
            className="h-8 w-auto object-contain"
          />
          <div className="flex-1">
            <h1 className="text-lg font-[family-name:var(--font-heading)] font-bold text-[#1A1A1A]">
              {greeting}{currentUser?.prenom ? ` ${currentUser.prenom}` : ''} 👋
            </h1>
            <p className="text-sm text-gray-500">
              {overdueCount > 0
                ? `${overdueCount} rappel${overdueCount > 1 ? 's' : ''} urgent${overdueCount > 1 ? 's' : ''} et ${(todayCount + enPipeline)} prospect${(todayCount + enPipeline) > 1 ? 's' : ''} chaud${(todayCount + enPipeline) > 1 ? 's' : ''} vous attendent.`
                : todayCount > 0
                  ? `${todayCount} prospect${todayCount > 1 ? 's' : ''} à rappeler aujourd'hui et ${enPipeline} en pipeline.`
                  : `Tout va bien ! ${enPipeline} prospects en cours et ${sessionsAVenir} formation${sessionsAVenir > 1 ? 's' : ''} planifiée${sessionsAVenir > 1 ? 's' : ''}.`
              }
            </p>
          </div>
        </div>
      </div>

      {/* ZONE 2 — ACTIONS URGENTES (MAX 5 ITEMS) */}
      <div className="space-y-3">
        {/* Rappels en retard - border rouge */}
        {overdueRappels && overdueRappels.length > 0 && overdueRappels.slice(0, 3).map((r) => (
          <div key={r.id} className="bg-white rounded-xl border-l-4 border-[#FF2D78] border border-[#EEEEEE] shadow-sm p-4 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-4 h-4 text-[#FF2D78]" />
                  <span className="text-sm font-medium text-gray-900">
                    {r.lead?.prenom} {r.lead?.nom}
                  </span>
                  <span className="text-xs px-2 py-0.5 bg-red-50 text-red-600 rounded-full font-medium">
                    EN RETARD
                  </span>
                </div>
                <p className="text-xs text-gray-500">{r.titre || r.type}</p>
              </div>
              <div className="flex items-center gap-2">
                {r.lead?.telephone && (
                  <a
                    href={`tel:${r.lead.telephone}`}
                    className="p-2 rounded-lg bg-[#FF5C00] hover:bg-[#E65200] text-white transition-colors"
                    title="Appeler maintenant"
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                )}
                {r.lead?.telephone && (
                  <a
                    href={`https://wa.me/${(r.lead.telephone || '').replace(/\s/g, '').replace(/^0/, '33')}`}
                    target="_blank"
                    className="p-2 rounded-lg bg-green-500 hover:bg-green-600 text-white transition-colors"
                    title="WhatsApp"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </a>
                )}
                {r.lead?.email && (
                  <a
                    href={`mailto:${r.lead.email}`}
                    className="p-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors"
                    title="Email"
                  >
                    <Mail className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Rappels du jour - border orange */}
        {todayRappels && todayRappels.length > 0 && todayRappels.slice(0, 2).map((r) => (
          <div key={r.id} className="bg-white rounded-xl border-l-4 border-[#FF5C00] border border-[#EEEEEE] shadow-sm p-4 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Phone className="w-4 h-4 text-[#FF5C00]" />
                  <span className="text-sm font-medium text-gray-900">
                    {r.lead?.prenom} {r.lead?.nom}
                  </span>
                  <span className="text-xs px-2 py-0.5 bg-orange-50 text-orange-600 rounded-full font-medium">
                    AUJOURD'HUI
                  </span>
                </div>
                <p className="text-xs text-gray-500">{r.titre || r.type}</p>
              </div>
              <div className="flex items-center gap-2">
                {r.lead?.telephone && (
                  <a
                    href={`tel:${r.lead.telephone}`}
                    className="p-2 rounded-lg bg-[#FF5C00] hover:bg-[#E65200] text-white transition-colors"
                    title="Appeler"
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                )}
                {r.lead?.telephone && (
                  <a
                    href={`https://wa.me/${(r.lead.telephone || '').replace(/\s/g, '').replace(/^0/, '33')}`}
                    target="_blank"
                    className="p-2 rounded-lg bg-green-500 hover:bg-green-600 text-white transition-colors"
                    title="WhatsApp"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ZONE 3 — PIPELINE EXPRESS (BARRE HORIZONTALE CLIQUABLE) */}
      <div className="bg-white rounded-xl border border-[#EEEEEE] shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-[family-name:var(--font-heading)] font-semibold text-[#1A1A1A]">
            Pipeline Commercial
          </h3>
          <Link href="/pipeline" className="text-sm text-[#FF5C00] hover:text-[#E65200] font-medium flex items-center gap-1">
            Voir le Kanban <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-5 gap-3">
          {[
            { label: 'Nouveau', count: leadsData?.leads?.filter(l => l.statut === 'NOUVEAU').length || 0, color: '#999999', href: '/leads?statut=NOUVEAU' },
            { label: 'Qualifié', count: leadsData?.leads?.filter(l => l.statut === 'QUALIFIE').length || 0, color: '#FF5C00', href: '/leads?statut=QUALIFIE' },
            { label: 'Financement', count: leadsData?.leads?.filter(l => l.statut === 'FINANCEMENT_EN_COURS').length || 0, color: '#FF5C00', href: '/leads?statut=FINANCEMENT_EN_COURS' },
            { label: 'Inscrit', count: leadsData?.leads?.filter(l => l.statut === 'INSCRIT').length || 0, color: '#FF2D78', href: '/leads?statut=INSCRIT' },
            { label: 'Formé', count: leadsData?.leads?.filter(l => l.statut === 'FORME' || l.statut === 'ALUMNI').length || 0, color: '#10B981', href: '/leads?statut=FORME,ALUMNI' },
          ].map((stage) => (
            <Link
              key={stage.label}
              href={stage.href}
              className="group cursor-pointer"
            >
              <div className="text-center p-4 rounded-lg border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all">
                <div className="text-3xl font-bold text-gray-900 mb-1 count-up tabular-nums group-hover:scale-110 transition-transform">
                  {stage.count}
                </div>
                <div className="text-sm font-medium text-gray-600 mb-2">{stage.label}</div>
                <div
                  className="h-1 rounded-full"
                  style={{ backgroundColor: stage.color }}
                />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ZONE 4 — KPIS DU MOIS (4 CARDS) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
          icon={(p: any) => <UsersThree weight="duotone" {...p} />}
          label="Nouveaux contacts"
          value={nouveauxCeMois.toLocaleString()}
          color="#FF5C00"
          variation={variationNouveaux}
        />
        <KpiCard
          icon={(p: any) => <UserCheck weight="duotone" {...p} />}
          label="Inscriptions"
          value={pipelineLeads?.leads?.filter(l => l.statut === 'INSCRIT' || l.statut === 'FORME').length || 0}
          color="#FF2D78"
        />
        <KpiCard
          icon={(p: any) => <Euro weight="duotone" {...p} />}
          label="CA ce mois"
          value={formatEuro(caRealise)}
          color="#FF5C00"
        />
        <KpiCard
          icon={(p: any) => <Target weight="duotone" {...p} />}
          label="Taux conversion"
          value={`${tauxConversion.toFixed(1)}%`}
          color="#10B981"
        />
      </div>

      {/* ZONE 5 — ACTIVITÉ RÉCENTE (TIMELINE) */}
      <div className="bg-white rounded-xl border border-[#EEEEEE] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-[family-name:var(--font-heading)] font-semibold text-[#1A1A1A] flex items-center gap-2">
            <Users className="w-5 h-5 text-[#FF5C00]" />
            Activité Récente
          </h3>
        </div>
        <div className="max-h-80 overflow-y-auto">
          <div className="divide-y divide-gray-50">
            {leadsData?.leads && leadsData.leads.length > 0 ? leadsData.leads.slice(0, 10).map((lead) => (
              <Link key={lead.id} href={`/lead/${lead.id}`} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors group">
                <div className="w-10 h-10 rounded-full bg-[#FF5C00]/10 flex items-center justify-center text-sm font-bold text-[#FF5C00] shrink-0">
                  {lead.prenom?.[0]}{lead.nom?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{lead.prenom} {lead.nom}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                      {lead.statut}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{formatRelativeTime(lead.created_at)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="w-12 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${lead.score_chaud || 0}%`,
                        backgroundColor: (lead.score_chaud || 0) >= 80 ? '#10B981' : (lead.score_chaud || 0) >= 60 ? '#FF8C42' : '#999999'
                      }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 w-6 text-right">{lead.score_chaud || 0}</span>
                  <ChevronRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            )) : (
              <div className="text-center py-12 text-gray-400">
                <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-sm font-medium">Aucune activité récente</p>
                <Link href="/leads" className="text-sm text-[#FF5C00] hover:text-[#E65200] mt-2 inline-block">
                  Créer votre premier prospect
                </Link>
              </div>
            )}
          </div>
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
    <div className="bg-white rounded-xl border border-[#EEEEEE] shadow-sm p-6 hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-4">
        <div
          className="p-3 rounded-lg"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon className="w-6 h-6" style={{ color }} />
        </div>
        {variation !== undefined && variation !== 0 && (
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
            variation > 0
              ? 'bg-green-50 text-green-600'
              : 'bg-red-50 text-red-600'
          }`}>
            {variation > 0 ? '+' : ''}{variation.toFixed(0)}%
          </span>
        )}
      </div>
      <div>
        <p className="text-3xl font-bold text-[#1A1A1A] count-up tabular-nums mb-2">
          {value}
        </p>
        <p className="text-sm text-gray-500 font-medium">{label}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      </div>
    </div>
  )
}