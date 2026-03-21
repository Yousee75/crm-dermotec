'use client'

import { useLeads } from '@/hooks/use-leads'
import { useSessions } from '@/hooks/use-sessions'
import { STATUTS_LEAD, CATEGORIES_FORMATION } from '@/types'
import { BarChart3, Users, GraduationCap, Percent, TrendingUp, ArrowRight } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { KpiCard } from '@/components/ui/KpiCard'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { cn } from '@/lib/utils'
import Link from 'next/link'

export default function AnalyticsPage() {
  const { data: allLeads } = useLeads({ per_page: 1 })
  const { data: formes } = useLeads({ statut: ['FORME', 'ALUMNI'], per_page: 1 })
  const { data: sessions } = useSessions()

  const total = allLeads?.total || 0
  const convertis = formes?.total || 0
  const tauxConversion = total > 0 ? ((convertis / total) * 100).toFixed(1) : '0'
  const sessionsPlanned = sessions?.filter(s => s.statut === 'PLANIFIEE').length || 0

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Vue d'ensemble des performances"
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-children">
        <KpiCard icon={Users} label="Total leads" value={total} color="#3B82F6" trend={{ value: 12, label: 'vs mois dernier' }} />
        <KpiCard icon={GraduationCap} label="Formé(e)s" value={convertis} color="#22C55E" />
        <KpiCard icon={Percent} label="Taux conversion" value={`${tauxConversion}%`} color="#F59E0B" />
        <KpiCard icon={BarChart3} label="Sessions planifiées" value={sessionsPlanned} color="#8B5CF6" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline funnel */}
        <Card padding="none">
          <CardHeader className="px-6 pt-6 pb-0">
            <CardTitle icon={<TrendingUp className="w-4 h-4" />}>Pipeline par statut</CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-4">
            <div className="space-y-3">
              {Object.entries(STATUTS_LEAD).map(([key, val], i) => {
                // Placeholder — connecter avec des données réelles
                const fakePercent = Math.max(5, 100 - i * 12)
                return (
                  <div key={key} className="group">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: val.color }}
                        />
                        <span className="text-xs font-medium text-gray-600">{val.label}</span>
                      </div>
                      <span className="text-xs text-gray-400 tabular-nums">0</span>
                    </div>
                    <ProgressBar value={fakePercent} size="md" color={val.color} />
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Catégories formations */}
        <Card padding="none">
          <CardHeader className="px-6 pt-6 pb-0">
            <CardTitle icon={<GraduationCap className="w-4 h-4" />}>Formations par catégorie</CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-4">
            <div className="grid grid-cols-2 gap-3">
              {CATEGORIES_FORMATION.map((cat) => (
                <div
                  key={cat.id}
                  className="group p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition cursor-pointer"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                    style={{ backgroundColor: `${cat.color}12` }}
                  >
                    <GraduationCap className="w-5 h-5" style={{ color: cat.color }} />
                  </div>
                  <p className="text-sm font-semibold text-gray-800 group-hover:text-[#082545]">{cat.label}</p>
                  <p className="text-xs text-gray-400 mt-1">Données à venir</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CTA */}
      <Card className="gradient-mesh" padding="lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-[#082545] text-sm">Graphiques détaillés</h3>
            <p className="text-xs text-gray-500 mt-0.5">Charts Recharts à venir : revenus, conversion funnel, tendances mensuelles</p>
          </div>
          <Badge variant="primary" size="lg">Bientôt</Badge>
        </div>
      </Card>
    </div>
  )
}
