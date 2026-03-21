'use client'

import { useLeads } from '@/hooks/use-leads'
import { useSessions } from '@/hooks/use-sessions'
import { STATUTS_LEAD, CATEGORIES_FORMATION } from '@/types'
import { BarChart3, TrendingUp, Users, Euro, GraduationCap, Percent } from 'lucide-react'

export default function AnalyticsPage() {
  const { data: allLeads } = useLeads({ per_page: 1 })
  const { data: formes } = useLeads({ statut: ['FORME', 'ALUMNI'], per_page: 1 })
  const { data: sessions } = useSessions()

  const total = allLeads?.total || 0
  const convertis = formes?.total || 0
  const tauxConversion = total > 0 ? ((convertis / total) * 100).toFixed(1) : '0'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#082545]" style={{ fontFamily: 'var(--font-heading)' }}>
          Analytics
        </h1>
        <p className="text-sm text-gray-500">Vue d&apos;ensemble des performances</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiBox icon={Users} label="Total leads" value={total} color="#3B82F6" />
        <KpiBox icon={GraduationCap} label="Formé(e)s" value={convertis} color="#22C55E" />
        <KpiBox icon={Percent} label="Taux conversion" value={`${tauxConversion}%`} color="#F59E0B" />
        <KpiBox icon={BarChart3} label="Sessions planifiées" value={sessions?.filter(s => s.statut === 'PLANIFIEE').length || 0} color="#8B5CF6" />
      </div>

      {/* Pipeline funnel */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h3 className="font-semibold text-[#082545] mb-4">Pipeline par statut</h3>
        <div className="space-y-3">
          {Object.entries(STATUTS_LEAD).map(([key, val]) => {
            // On affichera les vrais chiffres quand les données seront là
            return (
              <div key={key} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-28">{val.label}</span>
                <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ backgroundColor: val.color, width: '0%' }}
                  />
                </div>
                <span className="text-xs text-gray-400 w-8 text-right">0</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Catégories formations */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h3 className="font-semibold text-[#082545] mb-4">Formations par catégorie</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {CATEGORIES_FORMATION.map((cat) => (
            <div key={cat.id} className="p-4 rounded-lg border border-gray-100 hover:shadow-sm transition">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ backgroundColor: `${cat.color}15` }}>
                <span style={{ color: cat.color }}>●</span>
              </div>
              <p className="text-sm font-medium text-gray-700">{cat.label}</p>
              <p className="text-xs text-gray-400 mt-1">Données à venir</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function KpiBox({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string | number; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 animate-fadeIn">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}15` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <div>
          <p className="text-xs text-gray-500">{label}</p>
          <p className="text-xl font-bold" style={{ color }}>{value}</p>
        </div>
      </div>
    </div>
  )
}
