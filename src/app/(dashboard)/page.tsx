'use client'

export const dynamic = 'force-dynamic'

import { useLeads } from '@/hooks/use-leads'
import { useSessions } from '@/hooks/use-sessions'
import { useOverdueRappels, useTodayRappels } from '@/hooks/use-reminders'
import {
  Users, UserCheck, Calendar, TrendingUp,
  AlertTriangle, Phone, Clock, GraduationCap,
  ArrowRight, Zap, ChevronRight, Sparkles
} from 'lucide-react'
import Link from 'next/link'
import { KpiCard } from '@/components/ui/KpiCard'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonCard, SkeletonList } from '@/components/ui/Skeleton'
import { cn } from '@/lib/utils'

export default function DashboardPage() {
  const { data: leadsData, isLoading: leadsLoading } = useLeads({ per_page: 1 })
  const { data: newLeads } = useLeads({ statut: ['NOUVEAU'], per_page: 1 })
  const { data: qualifiedLeads } = useLeads({ statut: ['QUALIFIE', 'FINANCEMENT_EN_COURS', 'INSCRIT'], per_page: 1 })
  const { data: recentLeads, isLoading: recentLoading } = useLeads({ per_page: 5 })
  const { data: sessionsData, isLoading: sessionsLoading } = useSessions()
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
      {/* Hero header — compact sur mobile, expressif sur desktop */}
      <div className="relative overflow-hidden rounded-2xl gradient-accent px-5 py-4 md:p-8 text-white">
        <div className="absolute inset-0 opacity-[0.07] hidden md:block">
          <div className="absolute -right-20 -top-20 w-72 h-72 rounded-full bg-[#0EA5E9]" />
          <div className="absolute -left-10 -bottom-10 w-48 h-48 rounded-full bg-[#6366F1]" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-lg md:text-3xl font-bold tracking-tight truncate" style={{ fontFamily: 'var(--font-heading)' }}>
                {greeting}
              </h1>
              <p className="text-blue-200 mt-0.5 text-xs md:text-base">
                {overdueCount > 0
                  ? <span className="text-amber-300 font-medium">{overdueCount} rappel{overdueCount > 1 ? 's' : ''} en retard</span>
                  : <span>Tout est à jour</span>
                }
                {todayCount > 0 && <span> · {todayCount} aujourd&apos;hui</span>}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Link href="/cockpit">
                <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10" icon={<Zap className="w-4 h-4" />}>
                  <span className="hidden sm:inline">Cockpit</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs — 4 cards, ordonnées par urgence d'action */}
      {leadsLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 stagger-children">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 stagger-children">
          {/* 1. Rappels en retard = le plus urgent */}
          <KpiCard
            icon={AlertTriangle}
            label="En retard"
            value={overdueCount}
            color={overdueCount > 0 ? '#EF4444' : '#10B981'}
            subtitle={overdueCount > 0 ? 'À traiter maintenant' : 'Tout est à jour'}
          />
          {/* 2. Nouveaux leads = à contacter aujourd'hui */}
          <Link href="/leads">
            <KpiCard
              icon={UserCheck}
              label="Nouveaux"
              value={nouveaux}
              color="#0EA5E9"
              subtitle="À contacter"
            />
          </Link>
          {/* 3. En pipeline = en cours de conversion */}
          <Link href="/pipeline">
            <KpiCard
              icon={TrendingUp}
              label="En pipeline"
              value={enPipeline}
              color="#F59E0B"
              subtitle="En conversion"
            />
          </Link>
          {/* 4. Sessions à venir */}
          <Link href="/sessions">
            <KpiCard
              icon={Calendar}
              label="Sessions"
              value={sessionsAVenir}
              color="#6366F1"
              subtitle="À venir"
            />
          </Link>
        </div>
      )}

      {/* Main grid — Rappels FIRST (c'est ce que le commercial doit faire maintenant) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Rappels aujourd'hui - 1 col */}
        <Card padding="none" className="lg:col-span-1 order-1">
          <CardHeader className="px-5 pt-5 pb-0">
            <CardTitle icon={<Phone className="w-4 h-4" />}>
              Rappels ({todayCount})
            </CardTitle>
            {todayCount > 0 && (
              <Badge variant="primary" size="sm">{todayCount} aujourd&apos;hui</Badge>
            )}
          </CardHeader>
          <CardContent className="p-5 pt-3">
            {todayRappels && todayRappels.length > 0 ? (
              <div className="space-y-1">
                {todayRappels.slice(0, 5).map((r, i) => (
                  <div
                    key={r.id}
                    className="flex items-center gap-3 py-2.5 px-3 -mx-3 rounded-lg hover:bg-gray-50 transition group cursor-pointer"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <div className={cn(
                      'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
                      r.type === 'APPEL' ? 'bg-blue-50 text-blue-500'
                        : r.type === 'EMAIL' ? 'bg-violet-50 text-violet-500'
                        : 'bg-green-50 text-green-500'
                    )}>
                      {r.type === 'APPEL' ? <Phone className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{r.titre || r.type}</p>
                      <p className="text-xs text-gray-400 truncate">
                        {r.lead?.prenom} {r.lead?.nom} · {new Date(r.date_rappel).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <Badge variant={r.type === 'APPEL' ? 'info' : 'default'} size="sm">
                      {r.type}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Phone className="w-6 h-6" />}
                title="Journée libre"
                description="Aucun rappel prévu — profitez-en pour prospecter"
              />
            )}
          </CardContent>
        </Card>

        {/* Sessions à venir - 1 col */}
        <Card padding="none" className="lg:col-span-1 order-3 lg:order-2">
          <CardHeader className="px-5 pt-5 pb-0">
            <CardTitle icon={<GraduationCap className="w-4 h-4" />}>
              Prochaines sessions
            </CardTitle>
            <Link href="/sessions">
              <Button variant="ghost" size="sm" className="text-gray-400">
                Voir tout <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-5 pt-3">
            {sessionsLoading ? (
              <SkeletonList items={3} />
            ) : sessionsData && sessionsData.filter(s => s.statut !== 'TERMINEE' && s.statut !== 'ANNULEE').length > 0 ? (
              <div className="space-y-1">
                {sessionsData
                  .filter(s => s.statut !== 'TERMINEE' && s.statut !== 'ANNULEE')
                  .slice(0, 5)
                  .map((s, i) => {
                    const placesLeft = s.places_max - s.places_occupees
                    const isFull = placesLeft <= 0
                    const isAlmostFull = placesLeft <= 2 && !isFull

                    return (
                      <Link
                        key={s.id}
                        href={`/session/${s.id}`}
                        className="flex items-center gap-3 py-2.5 px-3 -mx-3 rounded-lg hover:bg-gray-50 transition group"
                      >
                        <div className="w-10 h-10 rounded-lg bg-violet-50 flex flex-col items-center justify-center shrink-0">
                          <span className="text-[10px] font-medium text-violet-600 uppercase leading-none">
                            {new Date(s.date_debut).toLocaleDateString('fr-FR', { month: 'short' })}
                          </span>
                          <span className="text-sm font-bold text-violet-700 leading-tight">
                            {new Date(s.date_debut).getDate()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{s.formation?.nom}</p>
                          <p className="text-xs text-gray-400">
                            {s.places_occupees}/{s.places_max} places
                          </p>
                        </div>
                        <Badge
                          variant={isFull ? 'error' : isAlmostFull ? 'warning' : 'success'}
                          size="sm"
                        >
                          {isFull ? 'Complet' : `${placesLeft} dispo`}
                        </Badge>
                      </Link>
                    )
                  })}
              </div>
            ) : (
              <EmptyState
                icon={<Calendar className="w-6 h-6" />}
                title="Prêt à planifier"
                description="Planifiez votre prochaine session de formation"
              />
            )}
          </CardContent>
        </Card>

        {/* Derniers leads - 1 col */}
        <Card padding="none" className="lg:col-span-1 order-2 lg:order-3">
          <CardHeader className="px-5 pt-5 pb-0">
            <CardTitle icon={<Users className="w-4 h-4" />}>
              Derniers leads
            </CardTitle>
            <Link href="/leads">
              <Button variant="ghost" size="sm" className="text-gray-400">
                Voir tout <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-5 pt-3">
            {recentLoading ? (
              <SkeletonList items={5} />
            ) : recentLeads && recentLeads.leads.length > 0 ? (
              <div className="space-y-1">
                {recentLeads.leads.map((lead, i) => (
                  <Link
                    key={lead.id}
                    href={`/lead/${lead.id}`}
                    className="flex items-center gap-3 py-2.5 px-3 -mx-3 rounded-lg hover:bg-gray-50 transition group"
                  >
                    <Avatar
                      name={`${lead.prenom} ${lead.nom}`}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {lead.prenom} {lead.nom}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {lead.formation_principale?.nom || lead.statut_pro || '—'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${lead.score_chaud}%`,
                            backgroundColor: lead.score_chaud >= 70 ? '#10B981' : lead.score_chaud >= 40 ? '#F59E0B' : '#94A3B8',
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-gray-400 tabular-nums w-5 text-right">{lead.score_chaud}</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Users className="w-6 h-6" />}
                title="Prêt à démarrer"
                description="Ajoutez votre premier prospect avec le bouton N ou ⌘K"
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick actions — masqué sur mobile (le bottom nav suffit) */}
      <Card padding="lg" className="gradient-mesh hidden md:block">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-md shadow-primary/20">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-[#082545] text-sm">Actions rapides</h3>
              <p className="text-xs text-gray-500">Accédez à vos outils en un clic</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/leads">
              <Button variant="outline" size="sm" icon={<Users className="w-3.5 h-3.5" />}>
                Nouveau lead
              </Button>
            </Link>
            <Link href="/sessions">
              <Button variant="outline" size="sm" icon={<Calendar className="w-3.5 h-3.5" />}>
                Nouvelle session
              </Button>
            </Link>
            <Link href="/analytics">
              <Button variant="outline" size="sm" icon={<TrendingUp className="w-3.5 h-3.5" />}>
                Voir analytics
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  )
}
