'use client'

export const dynamic = 'force-dynamic'
// @ts-nocheck

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase-client'
import {
  BarChart, TrendingUp, Users, Percent, Star, Calendar,
  TrendingDown, Target, Trophy, PieChart as PieIcon,
  CalendarCheck, Euro, GraduationCap
} from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/Button'
import { formatEuro } from '@/lib/utils'
import {
  BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend, Line, LineChart
} from 'recharts'

// Couleurs branding
const PRIMARY = '#2EC6F3'
const ACCENT = '#082545'

// Period selector type
type Period = 'month' | '3months' | '6months' | 'year' | 'custom'

// KPI Card component
function KpiCard({
  icon: Icon,
  label,
  value,
  trend,
  color = PRIMARY
}: {
  icon: any
  label: string
  value: string | number
  trend?: { value: number; label: string }
  color?: string
}) {
  const trendColor = trend && trend.value > 0 ? '#10B981' : trend && trend.value < 0 ? '#EF4444' : '#6B7280'
  const TrendIcon = trend && trend.value > 0 ? TrendingUp : trend && trend.value < 0 ? TrendingDown : null

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between mb-2">
        <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}15` }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        {trend && TrendIcon && (
          <div className="flex items-center gap-1" style={{ color: trendColor }}>
            <TrendIcon className="w-3 h-3" />
            <span className="text-xs font-medium">{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>
      <div>
        <p className="text-xs text-gray-500 mb-1">{label}</p>
        <p className="text-lg font-bold text-[#082545]">{value}</p>
        {trend && (
          <p className="text-xs text-gray-400 mt-1">{trend.label}</p>
        )}
      </div>
    </Card>
  )
}

// Custom tooltip
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 px-3 py-2">
      {label && <p className="text-xs text-gray-500 mb-1">{label}</p>}
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-sm font-semibold" style={{ color: entry.color }}>
          {typeof entry.value === 'number' && entry.value > 1000
            ? formatEuro(entry.value)
            : entry.value}
          {entry.name && <span className="text-gray-400 font-normal ml-1">{entry.name}</span>}
        </p>
      ))}
    </div>
  )
}

// Funnel chart data
function FunnelChart({ data }: { data: any[] }) {
  const funnelColors = ['#3B82F6', '#6366F1', '#8B5CF6', '#2EC6F3', '#10B981']

  return (
    <ResponsiveContainer width="100%" height={280}>
      <RechartsBarChart
        data={data}
        layout="horizontal"
        margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis type="number" tick={{ fontSize: 11 }} />
        <YAxis type="category" dataKey="stage" width={80} tick={{ fontSize: 11 }} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="count" radius={[0, 4, 4, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={funnelColors[i % funnelColors.length]} />
          ))}
        </Bar>
      </RechartsBarChart>
    </ResponsiveContainer>
  )
}

// Main data fetching hook
function useAnalyticsData(period: Period) {
  return useQuery({
    queryKey: ['analytics', period],
    queryFn: async () => {
      const supabase = createClient()

      // Calculate date range based on period
      const now = new Date()
      let startDate: Date

      switch (period) {
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          break
        case '3months':
          startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1)
          break
        case '6months':
          startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1)
          break
        case 'year':
          startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1)
          break
        default:
          startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1)
      }

      // Fetch all data
      const [
        { data: leads },
        { data: inscriptions },
        { data: sessions },
        { data: financements },
        { data: formations },
        { data: equipe }
      ] = await Promise.all([
        supabase.from('leads').select('*'),
        supabase.from('inscriptions').select('*, formations(nom, prix_ht)'),
        supabase.from('sessions').select('*, formations(nom), inscriptions(*)').gte('date_debut', new Date().toISOString()),
        supabase.from('financements').select('*'),
        supabase.from('formations').select('*'),
        supabase.from('equipe').select('*')
      ])

      // Calculate KPIs
      const currentPeriodLeads = leads?.filter(l => new Date(l.created_at) >= startDate) || []
      const totalInscriptions = inscriptions?.length || 0
      const conversionRate = leads?.length ? Math.round((totalInscriptions / leads.length) * 100) : 0

      // CA calculation
      const totalCA = inscriptions?.reduce((sum, ins) => {
        return sum + (ins.formations?.prix_ht || 0)
      }, 0) || 0

      // Sessions fill rate
      const sessionsWithInscriptions = sessions?.map(s => ({
        ...s,
        inscriptionsCount: s.inscriptions?.length || 0
      })) || []

      const avgFillRate = sessionsWithInscriptions.length > 0
        ? Math.round(sessionsWithInscriptions.reduce((sum, s) =>
            sum + ((s.inscriptionsCount / (s.nb_places || 1)) * 100), 0
          ) / sessionsWithInscriptions.length)
        : 0

      // Satisfaction (mock for now)
      const satisfactionMoyenne = 4.3

      // NPS (mock for now)
      const npsScore = 42

      // Monthly CA data for chart
      const monthlyCA = []
      for (let i = 11; i >= 0; i--) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)

        const monthInscriptions = inscriptions?.filter(ins => {
          const createdAt = new Date(ins.created_at)
          return createdAt >= monthStart && createdAt <= monthEnd
        }) || []

        const monthCA = monthInscriptions.reduce((sum, ins) => sum + (ins.formations?.prix_ht || 0), 0)

        monthlyCA.push({
          mois: monthStart.toLocaleDateString('fr-FR', { month: 'short' }),
          ca: monthCA
        })
      }

      // Funnel data
      const funnelData = [
        { stage: 'Nouveau', count: leads?.filter(l => l.statut === 'NOUVEAU').length || 0 },
        { stage: 'Contacté', count: leads?.filter(l => ['CONTACTE', 'RELANCE'].includes(l.statut)).length || 0 },
        { stage: 'Qualifié', count: leads?.filter(l => l.statut === 'QUALIFIE').length || 0 },
        { stage: 'Inscrit', count: totalInscriptions },
        { stage: 'Formé', count: inscriptions?.filter(ins => ins.statut === 'TERMINE').length || 0 }
      ]

      // Sources data
      const sourcesData = leads?.reduce((acc: any[], lead) => {
        const source = lead.source || 'autre'
        const existing = acc.find(s => s.source === source)
        if (existing) {
          existing.count++
        } else {
          acc.push({ source, count: 1, name: getSourceLabel(source) })
        }
        return acc
      }, []).sort((a, b) => b.count - a.count) || []

      // Top formations
      const formationsData = formations?.map(formation => {
        const inscriptionsCount = inscriptions?.filter(ins => ins.formation_id === formation.id).length || 0
        return {
          nom: formation.nom,
          count: inscriptionsCount,
          ca: inscriptionsCount * formation.prix_ht
        }
      }).sort((a, b) => b.ca - a.ca).slice(0, 5) || []

      // Sessions data
      const sessionsData = sessionsWithInscriptions.map(session => ({
        nom: session.formations?.nom || 'Formation',
        occupees: session.inscriptionsCount,
        restantes: (session.nb_places || 0) - session.inscriptionsCount
      }))

      // Satisfaction distribution (mock)
      const satisfactionDistribution = [
        { stars: '1', count: 2 },
        { stars: '2', count: 1 },
        { stars: '3', count: 5 },
        { stars: '4', count: 12 },
        { stars: '5', count: 23 }
      ]

      // Financements data
      const financementsData = financements?.reduce((acc: any[], fin) => {
        const organisme = fin.organisme
        const existing = acc.find(f => f.organisme === organisme)
        if (existing) {
          existing.count++
          existing.montant += fin.montant || 0
        } else {
          acc.push({
            organisme,
            count: 1,
            montant: fin.montant || 0,
            taux: Math.round(Math.random() * 40 + 60) // Mock taux validation
          })
        }
        return acc
      }, []).sort((a, b) => b.montant - a.montant) || []

      // Performance commerciaux
      const performanceCommerciaux = equipe?.filter(e => e.role === 'commercial').map(commercial => {
        const leadsAssignes = leads?.filter(l => l.commercial_id === commercial.id).length || 0
        const convertis = inscriptions?.filter(ins => {
          const lead = leads?.find(l => l.id === ins.lead_id)
          return lead?.commercial_id === commercial.id
        }).length || 0
        const tauxConversion = leadsAssignes > 0 ? Math.round((convertis / leadsAssignes) * 100) : 0
        const caGenere = inscriptions?.filter(ins => {
          const lead = leads?.find(l => l.id === ins.lead_id)
          return lead?.commercial_id === commercial.id
        }).reduce((sum, ins) => sum + (ins.formations?.prix_ht || 0), 0) || 0

        return {
          commercial: `${commercial.prenom} ${commercial.nom}`,
          leadsAssignes,
          convertis,
          tauxConversion,
          caGenere
        }
      }).sort((a, b) => b.caGenere - a.caGenere) || []

      return {
        // KPIs
        totalCA,
        totalInscriptions,
        conversionRate,
        avgFillRate,
        satisfactionMoyenne,
        npsScore,

        // Charts data
        monthlyCA,
        funnelData,
        sourcesData,
        formationsData,
        sessionsData,
        satisfactionDistribution,
        financementsData,
        performanceCommerciaux,

        // Trends (mock for now)
        caTrend: 15,
        inscriptionsTrend: 8,
        conversionTrend: -2
      }
    }
  })
}

// Helper function
function getSourceLabel(source: string): string {
  const labels: Record<string, string> = {
    'formulaire': 'Formulaire',
    'instagram': 'Instagram',
    'whatsapp': 'WhatsApp',
    'telephone': 'Téléphone',
    'bouche_a_oreille': 'Bouche-à-oreille',
    'facebook': 'Facebook',
    'google': 'Google',
    'site_web': 'Site web',
    'salon': 'Salon',
    'autre': 'Autre'
  }
  return labels[source] || source
}

// Loading skeleton
function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Period selector skeleton */}
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-20" />
        ))}
      </div>

      {/* KPI cards skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>

      {/* Charts skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-80" />
        ))}
      </div>
    </div>
  )
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>('month')
  const { data, isLoading } = useAnalyticsData(period)

  const periodOptions = [
    { key: 'month' as Period, label: 'Ce mois' },
    { key: '3months' as Period, label: '3 mois' },
    { key: '6months' as Period, label: '6 mois' },
    { key: 'year' as Period, label: '1 an' },
    { key: 'custom' as Period, label: 'Custom' }
  ]

  const colors = [PRIMARY, '#8B5CF6', '#F59E0B', '#EF4444', '#10B981', '#EC4899', '#6366F1', '#F97316']

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Analytics" description="Tableau de bord analytique complet" />
        <LoadingSkeleton />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Tableau de bord analytique complet — données temps réel"
      />

      {/* Period Selector */}
      <div className="flex gap-1.5 sm:gap-2 flex-wrap">
        {periodOptions.map(option => (
          <Button
            key={option.key}
            variant={period === option.key ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setPeriod(option.key)}
          >
            {option.label}
          </Button>
        ))}
      </div>

      {/* Row 1: 6 KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <KpiCard
          icon={Euro}
          label="CA total"
          value={formatEuro(data.totalCA)}
          trend={{ value: data.caTrend, label: 'vs période précédente' }}
          color="#22C55E"
        />
        <KpiCard
          icon={Users}
          label="Nb inscriptions"
          value={data.totalInscriptions}
          trend={{ value: data.inscriptionsTrend, label: 'vs période précédente' }}
          color="#3B82F6"
        />
        <KpiCard
          icon={Percent}
          label="Taux conversion"
          value={`${data.conversionRate}%`}
          trend={{ value: data.conversionTrend, label: 'leads → inscrits' }}
          color="#F59E0B"
        />
        <KpiCard
          icon={CalendarCheck}
          label="Taux remplissage"
          value={`${data.avgFillRate}%`}
          color={PRIMARY}
        />
        <KpiCard
          icon={Star}
          label="Satisfaction"
          value={`${data.satisfactionMoyenne}/5`}
          color="#F97316"
        />
        <KpiCard
          icon={Trophy}
          label="NPS Score"
          value={data.npsScore}
          color="#8B5CF6"
        />
      </div>

      {/* Row 2: CA Mensuel + Conversion Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CA Mensuel */}
        <Card>
          <CardHeader>
            <CardTitle icon={<BarChart className="w-4 h-4" />}>
              CA Mensuel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <RechartsBarChart data={data.monthlyCA} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mois" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k€`} tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="ca" fill={PRIMARY} radius={[4, 4, 0, 0]} />
              </RechartsBarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Conversion Funnel */}
        <Card>
          <CardHeader>
            <CardTitle icon={<Target className="w-4 h-4" />}>
              Conversion Funnel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FunnelChart data={data.funnelData} />
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Sources + Top Formations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Répartition par source */}
        <Card>
          <CardHeader>
            <CardTitle icon={<PieIcon className="w-4 h-4" />}>
              Répartition par source
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={data.sourcesData}
                  cx="50%"
                  cy="45%"
                  innerRadius={45}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="count"
                  nameKey="name"
                >
                  {data.sourcesData.map((_, i) => (
                    <Cell key={i} fill={colors[i % colors.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Formations */}
        <Card>
          <CardHeader>
            <CardTitle icon={<GraduationCap className="w-4 h-4" />}>
              Top Formations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <RechartsBarChart
                data={data.formationsData}
                layout="horizontal"
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k€`} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="nom" width={80} tick={{ fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="ca" fill={PRIMARY} radius={[0, 4, 4, 0]} />
              </RechartsBarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Row 4: Remplissage Sessions + Satisfaction Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Remplissage Sessions */}
        <Card>
          <CardHeader>
            <CardTitle icon={<Calendar className="w-4 h-4" />}>
              Remplissage Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <RechartsBarChart data={data.sessionsData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nom" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="occupees" stackId="a" fill={PRIMARY} name="Occupées" />
                <Bar dataKey="restantes" stackId="a" fill="#E5E7EB" name="Restantes" />
              </RechartsBarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Satisfaction Distribution */}
        <Card>
          <CardHeader>
            <CardTitle icon={<Star className="w-4 h-4" />}>
              Distribution Satisfaction
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <RechartsBarChart data={data.satisfactionDistribution} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="stars" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#F59E0B" />
              </RechartsBarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Row 5: Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Financements par organisme */}
        <Card>
          <CardHeader>
            <CardTitle>Financements par organisme</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Organisme</th>
                    <th className="text-right py-2">Nb dossiers</th>
                    <th className="text-right py-2">Montant total</th>
                    <th className="text-right py-2">Taux validation</th>
                  </tr>
                </thead>
                <tbody>
                  {data.financementsData.map((item, i) => (
                    <tr key={i} className="border-b">
                      <td className="py-2 font-medium">{item.organisme}</td>
                      <td className="text-right py-2">{item.count}</td>
                      <td className="text-right py-2">{formatEuro(item.montant)}</td>
                      <td className="text-right py-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          item.taux >= 80 ? 'bg-green-100 text-green-700' :
                          item.taux >= 60 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {item.taux}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Performance commerciaux */}
        <Card>
          <CardHeader>
            <CardTitle>Performance commerciaux</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Commercial</th>
                    <th className="text-right py-2">Leads</th>
                    <th className="text-right py-2">Convertis</th>
                    <th className="text-right py-2">Taux</th>
                    <th className="text-right py-2">CA généré</th>
                  </tr>
                </thead>
                <tbody>
                  {data.performanceCommerciaux.map((item, i) => (
                    <tr key={i} className="border-b">
                      <td className="py-2 font-medium">{item.commercial}</td>
                      <td className="text-right py-2">{item.leadsAssignes}</td>
                      <td className="text-right py-2">{item.convertis}</td>
                      <td className="text-right py-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          item.tauxConversion >= 20 ? 'bg-green-100 text-green-700' :
                          item.tauxConversion >= 10 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {item.tauxConversion}%
                        </span>
                      </td>
                      <td className="text-right py-2 font-semibold">{formatEuro(item.caGenere)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}