'use client'

import { Suspense } from 'react'
import { useLeads } from '@/hooks/use-leads'
import { useSessions } from '@/hooks/use-sessions'
import { useOverdueRappels, useTodayRappels } from '@/hooks/use-reminders'
import { createClient } from '@/lib/infra/supabase-client'
import { useQuery } from '@tanstack/react-query'
import {
  Phone
} from 'lucide-react'
import Link from 'next/link'
import { useCurrentUser } from '@/hooks/use-current-user'
import { cn } from '@/lib/utils'
import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton'
import { OnboardingProgressBar } from '@/components/ui/OnboardingProgressBar'

// Composant skeleton pour le dashboard
function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header skeleton */}
      <div>
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-48" />
      </div>

      {/* KPI cards skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => (
          <div key={i} className="bg-white rounded-2xl border border-[var(--color-border)] p-5">
            <Skeleton className="h-3 w-20 mb-2" />
            <Skeleton className="h-9 w-16" />
          </div>
        ))}
      </div>

      {/* À faire skeleton */}
      <div className="bg-white rounded-2xl border border-[var(--color-border)]">
        <div className="px-5 py-4 border-b border-[var(--color-border)]">
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="divide-y divide-[var(--color-border)]">
          {[1,2,3].map(i => (
            <div key={i} className="flex items-center justify-between px-5 py-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-[#EEEEEE]" />
                <div className="space-y-1">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
              <Skeleton className="h-6 w-6 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Leads skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1,2,3].map(i => (
          <div key={i} className="bg-white rounded-2xl border border-[var(--color-border)] p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-[#F4F0EB]" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-1.5 w-full rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const supabase = createClient()
  const { data: currentUser } = useCurrentUser()

  // Données existantes
  const { data: leadsData, isLoading: leadsLoading } = useLeads({ per_page: 50 })
  const recentLeads = leadsData?.leads || []
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
  const firstName = currentUser?.prenom || ''

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


  return (
    <div>
      {/* Barre d'onboarding sticky */}
      <OnboardingProgressBar />

      <div className="space-y-8">
        {/* Header Zen Futur */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[28px] font-bold text-[#111111] tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
              {greeting} {firstName} 👋
            </h1>
            <p className="text-[15px] text-[#777777] mt-1">
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
              {overdueCount > 0 && ` — ${overdueCount} action${overdueCount > 1 ? 's' : ''} en attente`}
            </p>
          </div>
        </div>

        {/* KPIs — chiffres géants */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Leads actifs', value: enPipeline || 0, color: '#FF5C00' },
            { label: 'Sessions à venir', value: sessionsAVenir || 0, color: '#FF2D78' },
            { label: 'CA ce mois', value: formatEuro(caRealise || 0), color: '#FF5C00' },
            { label: 'Conversion', value: `${tauxConversion || 0}%`, color: '#10B981' },
          ].map((kpi, i) => (
            <div key={i} className="bg-white rounded-2xl border border-[var(--color-border)] p-5 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] hover:-translate-y-0.5 transition-all duration-200">
              <p className="text-[13px] text-[#777777] uppercase tracking-wide font-medium">{kpi.label}</p>
              <p className="text-[36px] font-bold text-[#111111] mt-1 tabular-nums count-up" style={{ fontFamily: 'var(--font-heading)', color: kpi.color === '#10B981' ? '#111111' : '#111111' }}>
                {kpi.value}
              </p>
            </div>
          ))}
        </div>

        {/* À faire aujourd'hui */}
        {((overdueRappels?.length ?? 0) > 0 || (todayRappels?.length ?? 0) > 0) && (
          <div className="bg-white rounded-2xl border border-[var(--color-border)] shadow-[var(--shadow-card)] overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--color-border)]">
              <h2 className="text-[16px] font-semibold text-[#111111] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#FF5C00] animate-pulse" />
                À faire aujourd'hui
              </h2>
            </div>
            <div className="divide-y divide-[var(--color-border)]">
              {[...(overdueRappels || []).slice(0, 3), ...(todayRappels || []).slice(0, 2)].map((rappel, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-3 hover:bg-[#FAFAFA] transition-colors">
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      'w-2 h-2 rounded-full flex-shrink-0',
                      i < (overdueRappels?.length || 0) ? 'bg-[#FF2D78]' : 'bg-[#FF5C00]'
                    )} />
                    <div>
                      <p className="text-[14px] text-[#111111] font-medium">{(rappel as any).lead_nom || (rappel as any).nom || 'Lead'}</p>
                      <p className="text-[13px] text-[#777777]">{rappel.description || (rappel as any).type_activite || 'Rappel'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="p-2 rounded-lg hover:bg-[#FFF5EE] text-[#FF5C00] transition-colors">
                      <Phone size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Leads chauds */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[16px] font-semibold text-[#111111]">Leads chauds</h2>
            <Link href="/leads" className="text-[13px] text-[#FF5C00] hover:underline font-medium">
              Voir tous →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(recentLeads || [])
              .filter(l => (l.score_chaud || 0) >= 60)
              .slice(0, 3)
              .map(lead => (
                <Link
                  key={lead.id}
                  href={`/lead/${lead.id}`}
                  className="bg-white rounded-2xl border border-[var(--color-border)] p-5 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] hover:-translate-y-0.5 transition-all duration-200 block"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-[#FF5C00] flex items-center justify-center text-white text-sm font-semibold">
                      {(lead.prenom?.[0] || '').toUpperCase()}{(lead.nom?.[0] || '').toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold text-[#111111] truncate">{lead.prenom} {lead.nom}</p>
                      <p className="text-[13px] text-[#777777] truncate">{(lead as any).formation_souhaitee || 'Non spécifié'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-[#F5F5F5] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${lead.score_chaud || 0}%`,
                          backgroundColor: (lead.score_chaud || 0) >= 80 ? '#FF5C00' : '#FF8C42'
                        }}
                      />
                    </div>
                    <span className="text-[12px] font-semibold tabular-nums text-[#FF5C00]">
                      {lead.score_chaud || 0}
                    </span>
                  </div>
                </Link>
              ))}
            {(!recentLeads || recentLeads.filter(l => (l.score_chaud || 0) >= 60).length === 0) && (
              <div className="col-span-full text-center py-8 text-[#777777] text-[14px]">
                Aucun lead chaud pour le moment
              </div>
            )}
          </div>
        </div>

        {/* Prochaines sessions */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[16px] font-semibold text-[#111111]">Prochaines sessions</h2>
            <Link href="/sessions" className="text-[13px] text-[#FF5C00] hover:underline font-medium">
              Voir le planning →
            </Link>
          </div>
          <div className="bg-white rounded-2xl border border-[var(--color-border)] shadow-[var(--shadow-card)] overflow-hidden">
            {sessions && sessions.length > 0 ? (
              <div className="divide-y divide-[var(--color-border)]">
                {sessions.slice(0, 5).map((session) => (
                  <Link
                    key={session.id}
                    href={`/session/${session.id}`}
                    className="flex items-center justify-between px-5 py-3.5 hover:bg-[#FAFAFA] transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-center min-w-[48px]">
                        <p className="text-[12px] text-[#777777] uppercase font-medium">
                          {new Date(session.date_debut).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                        </p>
                      </div>
                      <div>
                        <p className="text-[14px] font-medium text-[#111111]">{(session as any).formation_nom || (session as any).titre || 'Session'}</p>
                        <p className="text-[13px] text-[#777777]">{(session as any).formatrice_nom || ''}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[13px] text-[#777777] tabular-nums">
                        {(session as any).nb_inscrits || 0}/{session.places_max || 0}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-[#777777] text-[14px]">
                Aucune session planifiée
              </div>
            )}
          </div>
        </div>


    </div>
    </div>
  )
}

