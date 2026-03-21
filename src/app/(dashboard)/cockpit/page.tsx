'use client'

export const dynamic = 'force-dynamic'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase-client'
import { formatEuro } from '@/lib/utils'
import { STATUTS_LEAD, type Lead, type Session, type Inscription, type Financement, type Rappel, type Activite, type Formation } from '@/types'
import {
  TrendingUp, TrendingDown, Minus, AlertTriangle, Calendar, Clock,
  Star, BarChart3, Users, Target, DollarSign, Zap, Phone, Bell, Eye,
  ChevronRight, Activity, Check, User, ArrowRight
} from 'lucide-react'
import Link from 'next/link'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

export default function CockpitPage() {
  const supabase = createClient()

  // KPI Data - CA du mois
  const { data: caData } = useQuery({
    queryKey: ['cockpit-ca'],
    queryFn: async () => {
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

      const { data: currentMonth } = await supabase
        .from('inscriptions')
        .select('prix_total')
        .eq('statut', 'COMPLETEE')
        .gte('created_at', startOfMonth.toISOString())

      const { data: lastMonth } = await supabase
        .from('inscriptions')
        .select('prix_total')
        .eq('statut', 'COMPLETEE')
        .gte('created_at', startOfLastMonth.toISOString())
        .lte('created_at', endOfLastMonth.toISOString())

      const currentTotal = currentMonth?.reduce((sum, i) => sum + i.prix_total, 0) || 0
      const lastTotal = lastMonth?.reduce((sum, i) => sum + i.prix_total, 0) || 0
      const percentage = lastTotal > 0 ? ((currentTotal - lastTotal) / lastTotal) * 100 : 0

      return { current: currentTotal, percentage }
    }
  })

  // Leads ce mois
  const { data: leadsData } = useQuery({
    queryKey: ['cockpit-leads'],
    queryFn: async () => {
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)

      const { data: leads } = await supabase
        .from('leads')
        .select('id, statut')
        .gte('created_at', startOfMonth.toISOString())

      const { data: inscriptions } = await supabase
        .from('inscriptions')
        .select('lead_id')
        .eq('statut', 'COMPLETEE')
        .gte('created_at', startOfMonth.toISOString())

      const totalLeads = leads?.length || 0
      const convertedLeads = inscriptions?.length || 0
      const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0

      return { count: totalLeads, conversionRate }
    }
  })

  // Sessions à venir
  const { data: sessionsData } = useQuery({
    queryKey: ['cockpit-sessions'],
    queryFn: async () => {
      const { data: sessions } = await supabase
        .from('sessions')
        .select(`
          id, places_max, statut,
          inscriptions!inner(id, statut)
        `)
        .eq('statut', 'PLANIFIEE')
        .gte('date_debut', new Date().toISOString())

      const totalSessions = sessions?.length || 0
      const totalPlaces = sessions?.reduce((sum, s) => sum + s.places_max, 0) || 1
      const occupiedPlaces = sessions?.reduce((sum, s) =>
        sum + (s.inscriptions?.filter((i: { statut: string }) => ['CONFIRMEE', 'EN_COURS', 'COMPLETEE'].includes(i.statut)).length || 0), 0) || 0

      const fillRate = (occupiedPlaces / totalPlaces) * 100

      return { count: totalSessions, fillRate }
    }
  })

  // NPS Score (simulation)
  const { data: npsData } = useQuery({
    queryKey: ['cockpit-nps'],
    queryFn: async () => {
      // Simulation NPS - en pratique, viendrais d'une enquête satisfaction
      return { score: 72, trend: 5 }
    }
  })

  // CA mensuel sur 6 mois
  const { data: caMonthlyData } = useQuery({
    queryKey: ['cockpit-ca-monthly'],
    queryFn: async () => {
      const months = []
      for (let i = 5; i >= 0; i--) {
        const date = new Date()
        date.setMonth(date.getMonth() - i)
        const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1)
        const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0)

        const { data } = await supabase
          .from('inscriptions')
          .select('prix_total')
          .eq('statut', 'COMPLETEE')
          .gte('created_at', startOfMonth.toISOString())
          .lte('created_at', endOfMonth.toISOString())

        const total = data?.reduce((sum, i) => sum + i.prix_total, 0) || 0

        months.push({
          month: date.toLocaleDateString('fr-FR', { month: 'short' }),
          ca: total
        })
      }
      return months
    }
  })

  // Funnel conversion
  const { data: funnelData } = useQuery({
    queryKey: ['cockpit-funnel'],
    queryFn: async () => {
      const { data: leads } = await supabase.from('leads').select('statut')

      const stats = {
        NOUVEAU: leads?.filter(l => l.statut === 'NOUVEAU').length || 0,
        CONTACTE: leads?.filter(l => ['CONTACTE', 'QUALIFIE'].includes(l.statut)).length || 0,
        QUALIFIE: leads?.filter(l => l.statut === 'QUALIFIE').length || 0,
        INSCRIT: leads?.filter(l => ['INSCRIT', 'EN_FORMATION', 'FORME'].includes(l.statut)).length || 0,
        FORME: leads?.filter(l => l.statut === 'FORME').length || 0
      }

      const total = stats.NOUVEAU + stats.CONTACTE + stats.INSCRIT + stats.FORME

      return [
        { stage: 'Nouveau', count: stats.NOUVEAU, percentage: total > 0 ? (stats.NOUVEAU / total) * 100 : 0 },
        { stage: 'Contacté', count: stats.CONTACTE, percentage: total > 0 ? (stats.CONTACTE / total) * 100 : 0 },
        { stage: 'Qualifié', count: stats.QUALIFIE, percentage: total > 0 ? (stats.QUALIFIE / total) * 100 : 0 },
        { stage: 'Inscrit', count: stats.INSCRIT, percentage: total > 0 ? (stats.INSCRIT / total) * 100 : 0 },
        { stage: 'Formé', count: stats.FORME, percentage: total > 0 ? (stats.FORME / total) * 100 : 0 }
      ]
    }
  })

  // Alertes & Anomalies
  const { data: alertesData } = useQuery({
    queryKey: ['cockpit-alertes'],
    queryFn: async () => {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)

      const in7Days = new Date()
      in7Days.setDate(in7Days.getDate() + 7)

      const ago15Days = new Date()
      ago15Days.setDate(ago15Days.getDate() - 15)

      // Leads stagnants > 7 jours
      const { data: leadsStagnants } = await supabase
        .from('leads')
        .select('id')
        .in('statut', ['NOUVEAU', 'CONTACTE'])
        .lt('updated_at', weekAgo.toISOString())

      // Sessions peu remplies dans 7 jours
      const { data: sessionsVides } = await supabase
        .from('sessions')
        .select(`
          id, places_max,
          inscriptions!inner(id, statut)
        `)
        .eq('statut', 'PLANIFIEE')
        .gte('date_debut', new Date().toISOString())
        .lte('date_debut', in7Days.toISOString())

      const sessionsPeuRemplies = sessionsVides?.filter(s => {
        const confirmed = s.inscriptions?.filter((i: { statut: string }) => ['CONFIRMEE', 'EN_COURS'].includes(i.statut)).length || 0
        return (confirmed / s.places_max) < 0.5
      }) || []

      // Financements en retard > 15 jours
      const { data: financementsRetard } = await supabase
        .from('financements')
        .select('id')
        .in('statut', ['SOUMIS', 'EN_EXAMEN', 'COMPLEMENT_DEMANDE'])
        .lt('updated_at', ago15Days.toISOString())

      // Rappels en retard
      const { data: rappelsRetard } = await supabase
        .from('rappels')
        .select('id')
        .eq('statut', 'EN_ATTENTE')
        .lt('date_rappel', new Date().toISOString())

      return {
        leadsStagnants: leadsStagnants?.length || 0,
        sessionsVides: sessionsPeuRemplies.length,
        financementsRetard: financementsRetard?.length || 0,
        rappelsRetard: rappelsRetard?.length || 0
      }
    }
  })

  // Pipeline santé
  const { data: pipelineData } = useQuery({
    queryKey: ['cockpit-pipeline'],
    queryFn: async () => {
      const { data: leads } = await supabase.from('leads').select('statut')

      return Object.entries(STATUTS_LEAD).map(([status, config]) => ({
        status,
        label: config.label,
        color: config.color,
        count: leads?.filter(l => l.statut === status).length || 0
      })).filter(s => !['PERDU', 'SPAM', 'REPORTE'].includes(s.status))
    }
  })

  // Top formations
  const { data: topFormationsData } = useQuery({
    queryKey: ['cockpit-top-formations'],
    queryFn: async () => {
      const { data: inscriptions } = await supabase
        .from('inscriptions')
        .select(`
          prix_total,
          session:sessions!inner(
            formation:formations!inner(id, titre)
          )
        `)
        .eq('statut', 'COMPLETEE')

      const formationsStats: Record<string, { titre: string; ca: number; count: number }> = {}

      inscriptions?.forEach((i: any) => {
        const session = Array.isArray(i.session) ? i.session[0] : i.session
        const formation = session ? (Array.isArray(session.formation) ? session.formation[0] : session.formation) : null
        if (!formation) return
        const formationId = formation.id
        const titre = formation.titre

        if (!formationsStats[formationId]) {
          formationsStats[formationId] = { titre, ca: 0, count: 0 }
        }

        formationsStats[formationId].ca += i.prix_total
        formationsStats[formationId].count += 1
      })

      return Object.values(formationsStats)
        .sort((a, b) => b.ca - a.ca)
        .slice(0, 5)
    }
  })

  // Activités récentes
  const { data: activitesData } = useQuery({
    queryKey: ['cockpit-activites'],
    queryFn: async () => {
      const { data } = await supabase
        .from('activites')
        .select(`
          id, type, description, created_at,
          user:equipe(prenom, nom)
        `)
        .order('created_at', { ascending: false })
        .limit(10)

      return data || []
    }
  })

  const getTrendIcon = (percentage: number) => {
    if (percentage > 0) return <TrendingUp className="w-4 h-4 text-green-500" />
    if (percentage < 0) return <TrendingDown className="w-4 h-4 text-red-500" />
    return <Minus className="w-4 h-4 text-gray-400" />
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'LEAD_CREE': return <User className="w-4 h-4 text-blue-500" />
      case 'INSCRIPTION': return <Check className="w-4 h-4 text-green-500" />
      case 'CONTACT': return <Phone className="w-4 h-4 text-purple-500" />
      case 'FINANCEMENT': return <DollarSign className="w-4 h-4 text-orange-500" />
      default: return <Activity className="w-4 h-4 text-gray-500" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Row 1: 4 KPI cards — 2x2 sur mobile */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">CA du mois</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900">
                  {formatEuro(caData?.current || 0)}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {getTrendIcon(caData?.percentage || 0)}
                  <span className={cn(
                    "text-sm font-medium",
                    (caData?.percentage || 0) > 0 ? "text-green-500" :
                    (caData?.percentage || 0) < 0 ? "text-red-500" : "text-gray-400"
                  )}>
                    {caData?.percentage ? `${Math.abs(caData.percentage).toFixed(1)}%` : '0%'}
                  </span>
                </div>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 md:w-6 md:h-6 text-[#0EA5E9]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Leads ce mois</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900">{leadsData?.count || 0}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {leadsData?.conversionRate?.toFixed(1) || 0}% conversion
                </p>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sessions à venir</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900">{sessionsData?.count || 0}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {sessionsData?.fillRate?.toFixed(1) || 0}% remplissage
                </p>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 bg-orange-50 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">NPS Score</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900">{npsData?.score || 0}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium text-green-500">
                    +{npsData?.trend || 0}
                  </span>
                </div>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <Star className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Charts — empilés mobile, côte à côte desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Card>
          <CardHeader>
            <CardTitle icon={<BarChart3 className="w-4 h-4" />}>
              CA mensuel (6 derniers mois)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={caMonthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                <XAxis dataKey="month" className="text-gray-600" />
                <YAxis tickFormatter={(value) => formatEuro(value)} className="text-gray-600" />
                <Bar dataKey="ca" fill="#0EA5E9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle icon={<Target className="w-4 h-4" />}>
              Funnel de conversion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {funnelData?.map((stage, index) => (
                <div key={stage.stage} className="flex items-center gap-3">
                  <div className="w-16 text-sm text-gray-600 shrink-0">{stage.stage}</div>
                  <div className="flex-1">
                    <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full transition-all duration-300 bg-[#0EA5E9]"
                        style={{ width: `${stage.percentage}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-medium">{stage.count}</span>
                    <span className="text-xs text-gray-500">({stage.percentage.toFixed(1)}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Alertes (prioritaire mobile) + Pipeline + Top formations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Alertes & Anomalies */}
        <Card>
          <CardHeader>
            <CardTitle icon={<AlertTriangle className="w-4 h-4" />} className="text-red-600">
              Alertes & Anomalies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                {
                  label: 'Leads stagnants > 7j',
                  count: alertesData?.leadsStagnants || 0,
                  href: '/leads',
                  color: 'text-orange-600'
                },
                {
                  label: 'Sessions < 50% remplissage',
                  count: alertesData?.sessionsVides || 0,
                  href: '/sessions?filter=low-fill',
                  color: 'text-yellow-600'
                },
                {
                  label: 'Financements retard > 15j',
                  count: alertesData?.financementsRetard || 0,
                  href: '/financements?filter=late',
                  color: 'text-red-600'
                },
                {
                  label: 'Rappels en retard',
                  count: alertesData?.rappelsRetard || 0,
                  href: '/rappels?filter=overdue',
                  color: 'text-red-600'
                }
              ].map((alerte) => (
                <Link
                  key={alerte.label}
                  href={alerte.href}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition group"
                >
                  <div className="flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full",
                      alerte.count > 0 ? "bg-red-500" : "bg-green-500"
                    )} />
                    <span className="text-sm text-gray-700">{alerte.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={alerte.count > 0 ? "error" : "success"}
                      size="sm"
                    >
                      {alerte.count}
                    </Badge>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pipeline santé */}
        <Card>
          <CardHeader>
            <CardTitle icon={<Zap className="w-4 h-4" />}>
              Pipeline santé
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pipelineData?.map((stage) => (
                <div key={stage.status} className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: stage.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 truncate">
                        {stage.label}
                      </span>
                      <span className="text-sm text-gray-500 shrink-0 ml-2">
                        {stage.count}
                      </span>
                    </div>
                    <div className="bg-gray-100 rounded-full h-1.5 mt-1 overflow-hidden">
                      <div
                        className="h-full transition-all duration-300"
                        style={{
                          backgroundColor: stage.color,
                          width: `${Math.min((stage.count / 20) * 100, 100)}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top formations */}
        <Card>
          <CardHeader>
            <CardTitle icon={<Target className="w-4 h-4" />}>
              Top formations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topFormationsData?.map((formation, index) => (
                <div key={formation.titre} className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-[#0EA5E9] text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate">
                      {formation.titre}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-green-600 font-medium">
                        {formatEuro(formation.ca)}
                      </span>
                      <span className="text-xs text-gray-500">
                        • {formation.count} inscr.
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 4: Activity Feed */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle icon={<Activity className="w-4 h-4" />}>
              Activité récente
            </CardTitle>
            <Link href="/activites" className="text-sm text-[#0EA5E9] hover:text-[#082545] transition flex items-center gap-1">
              Voir tout <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activitesData?.map((activite) => (
              <div key={activite.id} className="flex items-start gap-3">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                  {getActivityIcon(activite.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700">{activite.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500">
                      {new Date(activite.created_at).toLocaleString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit',
                        day: 'numeric',
                        month: 'short'
                      })}
                    </span>
                    {activite.user && !Array.isArray(activite.user) && (
                      <>
                        <span className="text-xs text-gray-300">•</span>
                        <span className="text-xs text-gray-500">
                          {(activite.user as any).prenom} {(activite.user as any).nom}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}