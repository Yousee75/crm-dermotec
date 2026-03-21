'use client'

export const dynamic = 'force-dynamic'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase'
import {
  Users, UserCheck, Calendar, TrendingUp, DollarSign, FileText,
  AlertTriangle, Phone, Clock, GraduationCap, Plus,
  MessageSquare, PipeIcon, TrendingDown, Activity,
  Mail, ChevronRight, Sparkles, Euro
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
import { AreaChart, Area, ResponsiveContainer } from 'recharts'

interface DashboardData {
  leadsMonth: { count: number; trend: number }
  inscriptionsMonth: { count: number; trend: number }
  caMonth: { amount: number; trend: number }
  rappelsToday: number
  rappelsOverdue: number
  sessionsWeek: number
  financementInProgress: number
  recentLeads: any[]
  todayRappels: any[]
  weekSessions: any[]
  recentActivities: any[]
  caChart: Array<{ date: string; amount: number }>
}

async function fetchDashboardData(): Promise<DashboardData> {
  const supabase = createClient()
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay() + 1) // Lundi
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6) // Dimanche
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  // Leads ce mois vs mois précédent
  const [leadsThisMonth, leadsLastMonth] = await Promise.all([
    supabase
      .from('leads')
      .select('id, created_at')
      .gte('created_at', startOfMonth.toISOString()),
    supabase
      .from('leads')
      .select('id, created_at')
      .gte('created_at', startOfLastMonth.toISOString())
      .lt('created_at', startOfMonth.toISOString())
  ])

  // Inscriptions ce mois vs mois précédent
  const [inscriptionsThisMonth, inscriptionsLastMonth] = await Promise.all([
    supabase
      .from('inscriptions')
      .select('id, created_at')
      .gte('created_at', startOfMonth.toISOString()),
    supabase
      .from('inscriptions')
      .select('id, created_at')
      .gte('created_at', startOfLastMonth.toISOString())
      .lt('created_at', startOfMonth.toISOString())
  ])

  // CA ce mois vs mois précédent (factures payées)
  const [caThisMonth, caLastMonth] = await Promise.all([
    supabase
      .from('factures')
      .select('montant_ht')
      .eq('statut', 'PAYEE')
      .gte('created_at', startOfMonth.toISOString()),
    supabase
      .from('factures')
      .select('montant_ht')
      .eq('statut', 'PAYEE')
      .gte('created_at', startOfLastMonth.toISOString())
      .lt('created_at', startOfMonth.toISOString())
  ])

  // Rappels aujourd'hui et en retard
  const [todayRappels, overdueRappels] = await Promise.all([
    supabase
      .from('rappels')
      .select(`
        id, type, titre, date_rappel, statut, priorite,
        lead:lead_id (id, prenom, nom, score_chaud)
      `)
      .gte('date_rappel', startToday.toISOString())
      .lt('date_rappel', new Date(startToday.getTime() + 24 * 60 * 60 * 1000).toISOString())
      .eq('statut', 'EN_ATTENTE')
      .order('date_rappel', { ascending: true }),
    supabase
      .from('rappels')
      .select('id')
      .lt('date_rappel', startToday.toISOString())
      .eq('statut', 'EN_ATTENTE')
  ])

  // Sessions cette semaine
  const weekSessions = await supabase
    .from('sessions')
    .select(`
      id, date_debut, places_max, places_occupees, statut,
      formation:formation_id (id, nom),
      formatrice:formatrice_id (id, prenom, nom)
    `)
    .gte('date_debut', startOfWeek.toISOString())
    .lte('date_debut', endOfWeek.toISOString())
    .in('statut', ['PLANIFIEE', 'CONFIRMEE', 'EN_COURS'])
    .order('date_debut', { ascending: true })

  // Dossiers financement en cours
  const financementInProgress = await supabase
    .from('financements')
    .select('id')
    .in('statut', ['PREPARATION', 'DOCUMENTS_REQUIS', 'DOSSIER_COMPLET', 'SOUMIS', 'EN_EXAMEN'])

  // Derniers leads
  const recentLeads = await supabase
    .from('leads')
    .select(`
      id, prenom, nom, score_chaud, source, statut, created_at,
      formation_principale:formation_principale_id (id, nom)
    `)
    .order('created_at', { ascending: false })
    .limit(5)

  // Activités récentes
  const recentActivities = await supabase
    .from('activites')
    .select(`
      id, type, description, created_at,
      user:user_id (id, prenom, nom)
    `)
    .order('created_at', { ascending: false })
    .limit(10)

  // CA des 30 derniers jours pour le graphique
  const caChart30Days = await supabase
    .from('factures')
    .select('montant_ht, created_at')
    .eq('statut', 'PAYEE')
    .gte('created_at', new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: true })

  // Calculs des tendances
  const leadsThisMonthCount = leadsThisMonth.data?.length || 0
  const leadsLastMonthCount = leadsLastMonth.data?.length || 0
  const leadsTrend = leadsLastMonthCount > 0
    ? Math.round(((leadsThisMonthCount - leadsLastMonthCount) / leadsLastMonthCount) * 100)
    : 0

  const inscriptionsThisMonthCount = inscriptionsThisMonth.data?.length || 0
  const inscriptionsLastMonthCount = inscriptionsLastMonth.data?.length || 0
  const inscriptionsTrend = inscriptionsLastMonthCount > 0
    ? Math.round(((inscriptionsThisMonthCount - inscriptionsLastMonthCount) / inscriptionsLastMonthCount) * 100)
    : 0

  const caThisMonthAmount = caThisMonth.data?.reduce((sum, f) => sum + f.montant_ht, 0) || 0
  const caLastMonthAmount = caLastMonth.data?.reduce((sum, f) => sum + f.montant_ht, 0) || 0
  const caTrend = caLastMonthAmount > 0
    ? Math.round(((caThisMonthAmount - caLastMonthAmount) / caLastMonthAmount) * 100)
    : 0

  // Préparation du graphique CA
  const caChartData = []
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)

    const dayAmount = caChart30Days.data
      ?.filter(f => new Date(f.created_at) >= dayStart && new Date(f.created_at) < dayEnd)
      ?.reduce((sum, f) => sum + f.montant_ht, 0) || 0

    caChartData.push({
      date: date.toISOString().split('T')[0],
      amount: dayAmount
    })
  }

  return {
    leadsMonth: { count: leadsThisMonthCount, trend: leadsTrend },
    inscriptionsMonth: { count: inscriptionsThisMonthCount, trend: inscriptionsTrend },
    caMonth: { amount: caThisMonthAmount, trend: caTrend },
    rappelsToday: todayRappels.data?.length || 0,
    rappelsOverdue: overdueRappels.data?.length || 0,
    sessionsWeek: weekSessions.data?.length || 0,
    financementInProgress: financementInProgress.data?.length || 0,
    recentLeads: recentLeads.data || [],
    todayRappels: todayRappels.data || [],
    weekSessions: weekSessions.data || [],
    recentActivities: recentActivities.data || [],
    caChart: caChartData
  }
}

function getActivityIcon(type: string) {
  switch (type) {
    case 'LEAD_CREE':
      return <Users className="w-4 h-4" />
    case 'CONTACT':
      return <Phone className="w-4 h-4" />
    case 'EMAIL':
      return <Mail className="w-4 h-4" />
    case 'INSCRIPTION':
      return <UserCheck className="w-4 h-4" />
    case 'SESSION':
      return <Calendar className="w-4 h-4" />
    case 'FINANCEMENT':
      return <FileText className="w-4 h-4" />
    case 'PAIEMENT':
      return <Euro className="w-4 h-4" />
    default:
      return <Activity className="w-4 h-4" />
  }
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0
  }).format(amount)
}

function getGreeting(userName?: string) {
  const now = new Date()
  const hour = now.getHours()
  let greeting = 'Bonjour'

  if (hour >= 12 && hour < 18) {
    greeting = 'Bon après-midi'
  } else if (hour >= 18) {
    greeting = 'Bonsoir'
  }

  return userName ? `${greeting} ${userName} !` : `${greeting} !`
}

function formatDate() {
  return new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

function getTimeAgo(date: string) {
  const now = new Date()
  const past = new Date(date)
  const diffInHours = Math.floor((now.getTime() - past.getTime()) / (1000 * 60 * 60))

  if (diffInHours < 1) {
    const diffInMinutes = Math.floor((now.getTime() - past.getTime()) / (1000 * 60))
    return `${diffInMinutes}min`
  } else if (diffInHours < 24) {
    return `${diffInHours}h`
  } else {
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}j`
  }
}

export default function DashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboardData,
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <EmptyState
          icon={<AlertTriangle className="w-8 h-8" />}
          title="Erreur de chargement"
          description="Impossible de charger les données du dashboard"
        />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-6">
      {/* Row 1: Welcome + Quick Actions */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#2EC6F3] to-[#082545] px-6 py-5 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-white/20" />
          <div className="absolute -left-8 -bottom-8 w-32 h-32 rounded-full bg-white/10" />
        </div>
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                {getGreeting()}
              </h1>
              <p className="text-blue-100 text-sm">
                {formatDate()}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Link href="/leads/new">
                <Button size="sm" variant="ghost" className="text-white/90 hover:text-white hover:bg-white/10">
                  <Plus className="w-4 h-4 mr-2" />
                  Nouveau Lead
                </Button>
              </Link>
              <Link href="/sessions/new">
                <Button size="sm" variant="ghost" className="text-white/90 hover:text-white hover:bg-white/10">
                  <Plus className="w-4 h-4 mr-2" />
                  Nouvelle Session
                </Button>
              </Link>
              <Link href="/pipeline">
                <Button size="sm" variant="ghost" className="text-white/90 hover:text-white hover:bg-white/10">
                  <PipeIcon className="w-4 h-4 mr-2" />
                  Pipeline
                </Button>
              </Link>
              <Link href="/messages">
                <Button size="sm" variant="ghost" className="text-white/90 hover:text-white hover:bg-white/10">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Messages
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: 6 KPI Cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <KpiCard
            icon={Users}
            label="Leads ce mois"
            value={data?.leadsMonth.count || 0}
            color="#2EC6F3"
            trend={{
              value: data?.leadsMonth.trend || 0,
              label: 'vs mois précédent'
            }}
          />
          <KpiCard
            icon={UserCheck}
            label="Inscriptions ce mois"
            value={data?.inscriptionsMonth.count || 0}
            color="#10B981"
            trend={{
              value: data?.inscriptionsMonth.trend || 0
            }}
          />
          <KpiCard
            icon={Euro}
            label="CA du mois"
            value={formatCurrency(data?.caMonth.amount || 0)}
            color="#059669"
            trend={{
              value: data?.caMonth.trend || 0,
              label: 'vs mois précédent'
            }}
          />
          <KpiCard
            icon={AlertTriangle}
            label="Rappels aujourd'hui"
            value={data?.rappelsToday || 0}
            color={data?.rappelsOverdue && data.rappelsOverdue > 0 ? "#EF4444" : "#6B7280"}
            subtitle={data?.rappelsOverdue ? `${data.rappelsOverdue} en retard` : undefined}
          />
          <KpiCard
            icon={Calendar}
            label="Sessions à venir"
            value={data?.sessionsWeek || 0}
            color="#8B5CF6"
            subtitle="cette semaine"
          />
          <KpiCard
            icon={FileText}
            label="Financement en cours"
            value={data?.financementInProgress || 0}
            color="#F59E0B"
            subtitle="dossiers actifs"
          />
        </div>
      )}

      {/* Row 3: 2 columns - Leads récents + Rappels du jour */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Leads récents */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle icon={<Users className="w-4 h-4" />}>
              Leads récents
            </CardTitle>
            <Link href="/leads">
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-600">
                Voir tous les leads
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <SkeletonList items={5} />
            ) : data?.recentLeads && data.recentLeads.length > 0 ? (
              <div className="space-y-3">
                {data.recentLeads.map((lead) => (
                  <Link
                    key={lead.id}
                    href={`/lead/${lead.id}`}
                    className="flex items-center gap-3 p-2 -m-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Avatar
                      name={`${lead.prenom} ${lead.nom}`}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {lead.prenom} {lead.nom}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" size="sm">
                          {lead.source}
                        </Badge>
                        <Badge
                          variant={
                            lead.statut === 'NOUVEAU' ? 'default' :
                            lead.statut === 'QUALIFIE' ? 'info' :
                            lead.statut === 'INSCRIT' ? 'success' : 'secondary'
                          }
                          size="sm"
                        >
                          {lead.statut}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${lead.score_chaud}%`,
                            backgroundColor: lead.score_chaud >= 70 ? '#10B981' : lead.score_chaud >= 40 ? '#F59E0B' : '#EF4444'
                          }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 tabular-nums w-6 text-right">
                        {lead.score_chaud}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {getTimeAgo(lead.created_at)}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Users className="w-6 h-6" />}
                title="Aucun lead récent"
                description="Les nouveaux prospects apparaîtront ici"
              />
            )}
          </CardContent>
        </Card>

        {/* Right: Rappels du jour */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle icon={<Phone className="w-4 h-4" />}>
              Rappels du jour
            </CardTitle>
            <Link href="/reminders">
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-600">
                Voir tous les rappels
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <SkeletonList items={5} />
            ) : data?.todayRappels && data.todayRappels.length > 0 ? (
              <div className="space-y-3">
                {data.todayRappels.map((rappel) => {
                  const isOverdue = new Date(rappel.date_rappel) < new Date()
                  return (
                    <div
                      key={rappel.id}
                      className={cn(
                        "flex items-center gap-3 p-2 -m-2 rounded-lg transition-colors",
                        isOverdue ? "bg-red-50 border border-red-200" : "hover:bg-gray-50"
                      )}
                    >
                      <div className={cn(
                        'p-2 rounded-lg',
                        rappel.type === 'APPEL' ? 'bg-blue-100 text-blue-600' :
                        rappel.type === 'EMAIL' ? 'bg-purple-100 text-purple-600' :
                        'bg-green-100 text-green-600'
                      )}>
                        {rappel.type === 'APPEL' ? <Phone className="w-4 h-4" /> :
                         rappel.type === 'EMAIL' ? <Mail className="w-4 h-4" /> :
                         <Clock className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {rappel.titre || rappel.type}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {rappel.lead?.prenom} {rappel.lead?.nom}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          {new Date(rappel.date_rappel).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        {rappel.priorite && (
                          <Badge
                            variant={
                              rappel.priorite === 'URGENTE' ? 'destructive' :
                              rappel.priorite === 'HAUTE' ? 'warning' : 'secondary'
                            }
                            size="sm"
                            className="mt-1"
                          >
                            {rappel.priorite}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <EmptyState
                icon={<Phone className="w-6 h-6" />}
                title="Aucun rappel aujourd'hui"
                description="Votre planning est libre pour de nouvelles actions"
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 4: 2 columns - Sessions cette semaine + Activités récentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Sessions cette semaine */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle icon={<Calendar className="w-4 h-4" />}>
              Sessions cette semaine
            </CardTitle>
            <Link href="/sessions">
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-600">
                Voir toutes les sessions
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <SkeletonList items={3} />
            ) : data?.weekSessions && data.weekSessions.length > 0 ? (
              <div className="space-y-3">
                {data.weekSessions.map((session) => {
                  const placesLeft = session.places_max - session.places_occupees
                  const occupancyRate = (session.places_occupees / session.places_max) * 100

                  return (
                    <Link
                      key={session.id}
                      href={`/session/${session.id}`}
                      className="flex items-center gap-3 p-2 -m-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-12 h-12 rounded-lg bg-purple-100 flex flex-col items-center justify-center text-purple-700">
                        <span className="text-[10px] font-medium uppercase leading-tight">
                          {new Date(session.date_debut).toLocaleDateString('fr-FR', { month: 'short' })}
                        </span>
                        <span className="text-sm font-bold leading-tight">
                          {new Date(session.date_debut).getDate()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {session.formation?.nom}
                        </p>
                        <p className="text-sm text-gray-500">
                          {session.formatrice?.prenom} {session.formatrice?.nom}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${occupancyRate}%`,
                                backgroundColor: occupancyRate >= 90 ? '#EF4444' : occupancyRate >= 70 ? '#F59E0B' : '#10B981'
                              }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">
                            {session.places_occupees}/{session.places_max}
                          </span>
                        </div>
                      </div>
                      <Badge
                        variant={
                          placesLeft === 0 ? 'destructive' :
                          placesLeft <= 2 ? 'warning' : 'success'
                        }
                        size="sm"
                      >
                        {placesLeft === 0 ? 'Complet' : `${placesLeft} places`}
                      </Badge>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <EmptyState
                icon={<Calendar className="w-6 h-6" />}
                title="Aucune session planifiée"
                description="Planifiez vos prochaines formations"
              />
            )}
          </CardContent>
        </Card>

        {/* Right: Activités récentes */}
        <Card>
          <CardHeader>
            <CardTitle icon={<Activity className="w-4 h-4" />}>
              Activités récentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <SkeletonList items={5} />
            ) : data?.recentActivities && data.recentActivities.length > 0 ? (
              <div className="space-y-3">
                {data.recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className="p-1.5 rounded-lg bg-gray-100 text-gray-600 mt-0.5">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 leading-relaxed">
                        {activity.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">
                          {getTimeAgo(activity.created_at)}
                        </span>
                        {activity.user && (
                          <>
                            <span className="text-xs text-gray-300">•</span>
                            <span className="text-xs text-gray-500">
                              {activity.user.prenom} {activity.user.nom}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Activity className="w-6 h-6" />}
                title="Aucune activité récente"
                description="Les actions de l'équipe apparaîtront ici"
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 5: Mini chart - CA des 30 derniers jours */}
      <Card>
        <CardHeader>
          <CardTitle icon={<TrendingUp className="w-4 h-4" />}>
            Chiffre d'affaires des 30 derniers jours
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-24 bg-gray-100 rounded animate-pulse" />
          ) : (
            <div className="h-24">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.caChart || []}>
                  <defs>
                    <linearGradient id="caGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2EC6F3" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#2EC6F3" stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#2EC6F3"
                    strokeWidth={2}
                    fill="url(#caGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
