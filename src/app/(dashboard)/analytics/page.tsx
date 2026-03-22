'use client'

export const dynamic = 'force-dynamic'

import { useState, useMemo } from 'react'
import {
  TrendingUp, TrendingDown, Users, Percent, Euro, GraduationCap,
  Target, PieChart as PieIcon, Activity, BarChart3, ShoppingCart
} from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatEuro } from '@/lib/utils'
import { useAnalytics } from '@/hooks/use-analytics'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer
} from 'recharts'

// ---------------------------------------------------------------------------
// Couleurs branding
// ---------------------------------------------------------------------------
// Recharts exige des hex bruts (pas de CSS vars)
const PRIMARY = '#D4A574'   // Rose Gold — Design System v3
const ACCENT = '#1A1A2E'    // Charcoal — Design System v3
const SUCCESS = '#6B9080'   // Vert doux — Design System v3
const WARNING = '#F59E0B'
const ERROR = '#EF4444'

const FUNNEL_COLORS = ['#6B7280', '#3B82F6', '#8B5CF6', '#F59E0B', '#10B981', '#22C55E']
const PIE_COLORS = [PRIMARY, '#8B5CF6', '#F59E0B', '#EF4444', '#10B981', '#EC4899', '#6366F1', '#F97316']

const SOURCE_LABELS: Record<string, string> = {
  formulaire: 'Site web',
  site_web: 'Site web',
  telephone: 'Telephone',
  whatsapp: 'WhatsApp',
  bouche_a_oreille: 'Bouche a oreille',
  instagram: 'Reseaux sociaux',
  facebook: 'Reseaux sociaux',
  google: 'Google',
  salon: 'Salon',
  autre: 'Autre',
}

// ---------------------------------------------------------------------------
// Periode
// ---------------------------------------------------------------------------
type Period = 'month' | '3months' | '6months' | 'year'

const PERIOD_OPTIONS: { key: Period; label: string }[] = [
  { key: 'month', label: 'Ce mois' },
  { key: '3months', label: '3 mois' },
  { key: '6months', label: '6 mois' },
  { key: 'year', label: '1 an' },
]

// ---------------------------------------------------------------------------
// KPI Card
// ---------------------------------------------------------------------------
function KpiCard({
  icon: Icon,
  label,
  value,
  trend,
  color = PRIMARY,
}: {
  icon: any
  label: string
  value: string | number
  trend?: { value: number; label: string }
  color?: string
}) {
  const trendPositive = trend && trend.value > 0
  const trendNegative = trend && trend.value < 0
  const trendColor = trendPositive ? SUCCESS : trendNegative ? ERROR : '#6B7280'
  const TrendIcon = trendPositive ? TrendingUp : trendNegative ? TrendingDown : null

  return (
    <Card className="p-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-[0.04]" style={{ background: color, transform: 'translate(30%, -30%)' }} />
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}15` }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        {trend && TrendIcon && (
          <div className="flex items-center gap-1" style={{ color: trendColor }}>
            <TrendIcon className="w-3 h-3" />
            <span className="text-xs font-semibold">{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className="text-xl font-bold text-accent">{value}</p>
      {trend && (
        <p className="text-[10px] text-gray-400 mt-1">{trend.label}</p>
      )}
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Tooltip personnalise
// ---------------------------------------------------------------------------
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 px-4 py-3 text-sm">
      {label && <p className="text-xs text-gray-400 mb-1.5 font-medium">{label}</p>}
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-gray-600">{entry.name || 'Valeur'}</span>
          <span className="font-semibold text-accent ml-auto">
            {typeof entry.value === 'number' && entry.value >= 100
              ? formatEuro(entry.value)
              : entry.value}
          </span>
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Funnel avec taux de passage
// ---------------------------------------------------------------------------
function FunnelConversion({ data }: { data: { statut: string; count: number; label: string; color: string }[] }) {
  // Filtrer les etapes du funnel dans l'ordre
  const funnelOrder = ['NOUVEAU', 'CONTACTE', 'QUALIFIE', 'FINANCEMENT_EN_COURS', 'INSCRIT', 'FORME']
  const funnelLabels = ['Nouveau', 'Contacte', 'Qualifie', 'Financement', 'Inscrit', 'Forme']

  const funnelData = funnelOrder.map((statut, i) => {
    const found = data.find(d => d.statut === statut)
    return {
      etape: funnelLabels[i],
      count: found?.count || 0,
      fill: FUNNEL_COLORS[i],
    }
  })

  // Calculer les taux de passage
  const taux = funnelData.map((item, i) => {
    if (i === 0 || funnelData[i - 1].count === 0) return null
    return Math.round((item.count / funnelData[i - 1].count) * 100)
  })

  return (
    <div>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={funnelData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="etape" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
          <Tooltip content={<ChartTooltip />} />
          <Bar dataKey="count" radius={[6, 6, 0, 0]} name="Leads">
            {funnelData.map((entry, i) => (
              <Cell key={i} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {/* Taux de passage */}
      <div className="flex items-center justify-center gap-1 mt-2 flex-wrap">
        {taux.map((t, i) => {
          if (t === null || i === 0) return null
          return (
            <div key={i} className="flex items-center gap-1">
              <span className="text-[10px] text-gray-400">{funnelData[i - 1].etape}</span>
              <Badge variant="outline" size="xs" className="font-mono">
                {t}%
              </Badge>
              <span className="text-gray-300 text-[10px]">→</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Donut avec legende a droite
// ---------------------------------------------------------------------------
function SourcesDonut({ data }: { data: { source: string; count: number }[] }) {
  // Regrouper les sources par label lisible
  const grouped = data.reduce<Record<string, number>>((acc, item) => {
    const label = SOURCE_LABELS[item.source] || item.source
    acc[label] = (acc[label] || 0) + item.count
    return acc
  }, {})

  const chartData = Object.entries(grouped)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  const total = chartData.reduce((s, d) => s + d.value, 0)

  return (
    <div className="flex items-center gap-4">
      <div className="flex-1 min-w-0" style={{ minHeight: 260 }}>
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={95}
              paddingAngle={3}
              dataKey="value"
              nameKey="name"
              strokeWidth={0}
            >
              {chartData.map((_, i) => (
                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      {/* Legende a droite */}
      <div className="flex flex-col gap-2 min-w-[130px]">
        {chartData.map((item, i) => {
          const pct = total > 0 ? Math.round((item.value / total) * 100) : 0
          return (
            <div key={item.name} className="flex items-center gap-2 text-xs">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
              <span className="text-gray-600 truncate">{item.name}</span>
              <span className="font-semibold text-accent ml-auto">{pct}%</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Donnees demo pour leads par semaine (non dispo dans le hook)
// ---------------------------------------------------------------------------
function generateWeeklyLeadsData() {
  // TODO: brancher sur les vraies donnees quand l'API le permettra
  const weeks = []
  const now = new Date()
  for (let i = 11; i >= 0; i--) {
    const weekStart = new Date(now)
    weekStart.setDate(weekStart.getDate() - i * 7)
    const base = 8 + Math.floor(Math.random() * 12)
    const trend = Math.max(0, base + Math.floor((11 - i) * 0.5))
    weeks.push({
      semaine: `S${weekStart.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}`,
      leads: trend,
    })
  }
  return weeks
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------
function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-20" />
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[360px] rounded-xl" />
        ))}
      </div>
    </div>
  )
}

// ===========================================================================
// PAGE PRINCIPALE
// ===========================================================================
export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>('month')
  const { data, isLoading } = useAnalytics()

  // Donnees leads par semaine (demo)
  const weeklyLeads = useMemo(() => generateWeeklyLeadsData(), [])

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Analytics" description="Tableau de bord analytique" />
        <LoadingSkeleton />
      </div>
    )
  }

  const panierMoyen = data.panierMoyen || 0

  return (
    <div className="space-y-6">
      {/* ---------------------------------------------------------------- */}
      {/* Header + selecteur de periode                                    */}
      {/* ---------------------------------------------------------------- */}
      <PageHeader title="Analytics" description="Vue d'ensemble de l'activite commerciale">
        <div className="flex gap-1.5">
          {PERIOD_OPTIONS.map(opt => (
            <Button
              key={opt.key}
              variant={period === opt.key ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setPeriod(opt.key)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </PageHeader>

      {/* ---------------------------------------------------------------- */}
      {/* KPI Cards                                                        */}
      {/* ---------------------------------------------------------------- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          icon={Users}
          label="Leads total"
          value={data.totalLeads}
          trend={{ value: data.leadsTrend, label: 'vs mois precedent' }}
          color="#3B82F6"
        />
        <KpiCard
          icon={Percent}
          label="Taux conversion"
          value={`${data.tauxConversion}%`}
          trend={{ value: 0, label: 'leads → formes' }}
          color={WARNING}
        />
        <KpiCard
          icon={Euro}
          label="CA du mois"
          value={formatEuro(data.caThisMonth)}
          trend={{ value: data.caTrend, label: 'vs mois precedent' }}
          color={SUCCESS}
        />
        <KpiCard
          icon={ShoppingCart}
          label="Panier moyen"
          value={formatEuro(panierMoyen)}
          color={PRIMARY}
        />
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Row 1 : Funnel + CA Mensuel                                      */}
      {/* ---------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Funnel de conversion */}
        <Card>
          <CardHeader>
            <CardTitle icon={<Target className="w-4 h-4" />}>
              Funnel de conversion
            </CardTitle>
            <Badge variant="outline" size="sm">{data.totalLeads} leads</Badge>
          </CardHeader>
          <CardContent>
            <FunnelConversion data={data.pipeline} />
          </CardContent>
        </Card>

        {/* CA mensuel — LineChart avec gradient */}
        <Card>
          <CardHeader>
            <CardTitle icon={<BarChart3 className="w-4 h-4" />}>
              CA mensuel
            </CardTitle>
            <Badge variant="success" size="sm">{formatEuro(data.caThisMonth)} ce mois</Badge>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data.caMensuel} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="gradientCA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={PRIMARY} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={PRIMARY} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="mois" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="ca"
                  stroke={PRIMARY}
                  strokeWidth={2.5}
                  fill="url(#gradientCA)"
                  name="CA"
                  dot={{ r: 3, fill: PRIMARY, strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: PRIMARY, strokeWidth: 2, stroke: '#fff' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Row 2 : Sources + Top formations                                 */}
      {/* ---------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leads par source — Donut */}
        <Card>
          <CardHeader>
            <CardTitle icon={<PieIcon className="w-4 h-4" />}>
              Leads par source
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.sources.length > 0 ? (
              <SourcesDonut data={data.sources} />
            ) : (
              <div className="flex items-center justify-center h-[260px] text-gray-400 text-sm">
                Aucune donnee de source
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top formations — BarChart horizontal */}
        <Card>
          <CardHeader>
            <CardTitle icon={<GraduationCap className="w-4 h-4" />}>
              Top formations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.topFormations.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={data.topFormations.slice(0, 5)}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`} tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="nom" width={120} tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="ca" fill={PRIMARY} radius={[0, 6, 6, 0]} name="CA" barSize={24}>
                    {data.topFormations.slice(0, 5).map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[280px] text-gray-400 text-sm">
                Aucune inscription completee
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Row 3 : Evolution leads (AreaChart)                              */}
      {/* ---------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle icon={<Activity className="w-4 h-4" />}>
              Evolution leads
            </CardTitle>
            <Badge variant="outline" size="sm">12 dernieres semaines</Badge>
          </CardHeader>
          <CardContent>
            {/* TODO: brancher sur les vraies donnees */}
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={weeklyLeads} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="gradientLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="semaine" tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="leads"
                  stroke="#8B5CF6"
                  strokeWidth={2.5}
                  fill="url(#gradientLeads)"
                  name="Nouveaux leads"
                  dot={{ r: 3, fill: '#8B5CF6', strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: '#8B5CF6', strokeWidth: 2, stroke: '#fff' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Financements */}
        <Card>
          <CardHeader>
            <CardTitle icon={<Euro className="w-4 h-4" />}>
              Financements par organisme
            </CardTitle>
            <Badge variant="warning" size="sm">Taux validation {data.tauxFinancement}%</Badge>
          </CardHeader>
          <CardContent>
            {data.financement.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-2.5 text-xs text-gray-500 font-medium">Organisme</th>
                      <th className="text-right py-2.5 text-xs text-gray-500 font-medium">Dossiers</th>
                      <th className="text-right py-2.5 text-xs text-gray-500 font-medium">Montant</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.financement.map((item, i) => (
                      <tr key={i} className="border-b border-gray-50 last:border-0">
                        <td className="py-2.5 font-medium text-accent">{item.organisme}</td>
                        <td className="text-right py-2.5 text-gray-600">{item.count}</td>
                        <td className="text-right py-2.5 font-semibold text-accent">{formatEuro(item.montant)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-gray-400 text-sm">
                Aucun financement enregistre
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
