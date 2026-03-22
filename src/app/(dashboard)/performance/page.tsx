'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useCommercialPerformance, type Periode } from '@/hooks/use-commercial-performance'
import { formatEuro } from '@/lib/utils'
import {
  TrendingUp, TrendingDown, Target, Users, Phone, AlertTriangle,
  Trophy, Medal, Award, BarChart3, ArrowUpRight, ArrowDownRight, Minus,
} from 'lucide-react'

// ============================================================
// PAGE: Performance Commerciaux — Vue Manager
// Leaderboard + KPIs individuels + Comparaison + Tendances
// Inspiré de: HubSpot Sales Dashboard + Pipedrive Insights
// ============================================================

export default function PerformancePage() {
  const [periode, setPeriode] = useState<Periode>('mois')
  const { data, isLoading, error } = useCommercialPerformance(periode)

  const periodeLabels: Record<Periode, string> = {
    mois: 'Ce mois',
    trimestre: 'Ce trimestre',
    annee: 'Cette année',
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-500">
        Accès réservé aux managers et administrateurs.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-accent">
            Performance Commerciaux
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Suivi en temps réel de l&apos;équipe commerciale
          </p>
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {(['mois', 'trimestre', 'annee'] as Periode[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriode(p)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                periode === p
                  ? 'bg-white text-accent shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {periodeLabels[p]}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : data ? (
        <>
          {/* KPIs Globaux Équipe */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard
              label="CA Équipe"
              value={formatEuro(data.totaux.ca_total)}
              subvalue={`Objectif: ${formatEuro(data.totaux.objectif_total)}`}
              progress={data.totaux.progression_objectif_global}
              icon={<Target className="w-5 h-5" />}
              color="#22C55E"
            />
            <KpiCard
              label="Taux Conversion"
              value={`${data.totaux.taux_conversion_moyen}%`}
              subvalue={`${data.totaux.conversions_total} / ${data.totaux.leads_total} leads`}
              icon={<TrendingUp className="w-5 h-5" />}
              color="#2EC6F3"
            />
            <KpiCard
              label="Pipeline Actif"
              value={String(data.totaux.pipeline_total)}
              subvalue="prospects en cours"
              icon={<BarChart3 className="w-5 h-5" />}
              color="#8B5CF6"
            />
            <KpiCard
              label="Rappels en Retard"
              value={String(data.totaux.rappels_overdue_total)}
              subvalue="à traiter"
              icon={<AlertTriangle className="w-5 h-5" />}
              color={data.totaux.rappels_overdue_total > 0 ? '#EF4444' : '#22C55E'}
              alert={data.totaux.rappels_overdue_total > 5}
            />
          </div>

          {/* Barre de progression globale */}
          <div className="bg-white rounded-xl border p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Progression objectif global
              </span>
              <span className="text-sm font-bold text-accent">
                {data.totaux.progression_objectif_global}%
              </span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, data.totaux.progression_objectif_global)}%`,
                  backgroundColor: data.totaux.progression_objectif_global >= 100 ? '#22C55E'
                    : data.totaux.progression_objectif_global >= 70 ? '#2EC6F3'
                    : data.totaux.progression_objectif_global >= 40 ? '#F59E0B'
                    : '#EF4444',
                }}
              />
            </div>
          </div>

          {/* Leaderboard */}
          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="p-4 border-b bg-gray-50">
              <h2 className="font-semibold text-accent flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Classement — {periodeLabels[periode]}
              </h2>
            </div>
            <div className="divide-y">
              {data.commerciaux.map((commercial) => (
                <div key={commercial.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    {/* Rang */}
                    <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg"
                      style={{
                        backgroundColor: commercial.rang === 1 ? '#FEF3C7' : commercial.rang === 2 ? '#F3F4F6' : commercial.rang === 3 ? '#FED7AA' : '#F9FAFB',
                        color: commercial.rang === 1 ? '#D97706' : commercial.rang === 2 ? '#6B7280' : commercial.rang === 3 ? '#EA580C' : '#9CA3AF',
                      }}
                    >
                      {commercial.rang <= 3 ? (
                        commercial.rang === 1 ? <Trophy className="w-5 h-5" /> :
                        commercial.rang === 2 ? <Medal className="w-5 h-5" /> :
                        <Award className="w-5 h-5" />
                      ) : commercial.rang}
                    </div>

                    {/* Avatar + Nom */}
                    <div className="flex items-center gap-3 min-w-[180px]">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                        style={{ backgroundColor: commercial.avatar_color || '#082545' }}
                      >
                        {commercial.prenom[0]}{commercial.nom[0]}
                      </div>
                      <div>
                        <p className="font-medium text-accent">
                          {commercial.prenom} {commercial.nom}
                        </p>
                        <p className="text-xs text-gray-500">{commercial.role}</p>
                      </div>
                    </div>

                    {/* Métriques */}
                    <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-4">
                      {/* CA */}
                      <div>
                        <p className="text-xs text-gray-500">CA</p>
                        <p className="font-semibold text-accent">{formatEuro(commercial.ca_periode)}</p>
                        <TendanceBadge value={commercial.tendance_ca} />
                      </div>

                      {/* Objectif */}
                      <div>
                        <p className="text-xs text-gray-500">Objectif</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${Math.min(100, commercial.progression_objectif)}%`,
                                backgroundColor: commercial.progression_objectif >= 100 ? '#22C55E'
                                  : commercial.progression_objectif >= 70 ? '#2EC6F3' : '#F59E0B',
                              }}
                            />
                          </div>
                          <span className="text-xs font-medium">{commercial.progression_objectif}%</span>
                        </div>
                      </div>

                      {/* Conversion */}
                      <div>
                        <p className="text-xs text-gray-500">Conversion</p>
                        <p className={`font-semibold ${
                          commercial.taux_conversion >= 20 ? 'text-green-600' :
                          commercial.taux_conversion >= 10 ? 'text-orange-500' : 'text-red-500'
                        }`}>
                          {commercial.taux_conversion}%
                        </p>
                        <p className="text-xs text-gray-400">{commercial.conversions_periode}/{commercial.leads_periode}</p>
                      </div>

                      {/* Pipeline */}
                      <div>
                        <p className="text-xs text-gray-500">Pipeline</p>
                        <p className="font-semibold text-accent">{commercial.pipeline_actif}</p>
                        <p className="text-xs text-gray-400">score moy. {commercial.pipeline_score_moyen}</p>
                      </div>

                      {/* Activité / Alertes */}
                      <div>
                        <p className="text-xs text-gray-500">Activité</p>
                        <p className="font-semibold text-accent">{commercial.activites_periode}</p>
                        {commercial.rappels_overdue > 0 && (
                          <p className="text-xs text-red-500 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            {commercial.rappels_overdue} retard
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Détail par commercial (cards) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.commerciaux.map((c) => (
              <div key={c.id} className="bg-white rounded-xl border p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: c.avatar_color || '#082545' }}
                  >
                    {c.prenom[0]}{c.nom[0]}
                  </div>
                  <div>
                    <h3 className="font-semibold text-accent">{c.prenom} {c.nom}</h3>
                    <p className="text-xs text-gray-500">#{c.rang} — {c.role}</p>
                  </div>
                  {c.rang === 1 && <Trophy className="w-6 h-6 text-yellow-500 ml-auto" />}
                </div>

                {/* Progress bar objectif */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500">
                      {formatEuro(c.ca_periode)} / {formatEuro(c.objectif_mensuel)}
                    </span>
                    <span className="font-medium">{c.progression_objectif}%</span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, c.progression_objectif)}%`,
                        backgroundColor: c.progression_objectif >= 100 ? '#22C55E' : '#2EC6F3',
                      }}
                    />
                  </div>
                </div>

                {/* Mini KPIs */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-lg font-bold text-accent">{c.leads_periode}</p>
                    <p className="text-[10px] text-gray-500">Leads</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-lg font-bold" style={{ color: c.taux_conversion >= 20 ? '#22C55E' : '#F59E0B' }}>
                      {c.taux_conversion}%
                    </p>
                    <p className="text-[10px] text-gray-500">Conversion</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-lg font-bold text-accent">{c.pipeline_actif}</p>
                    <p className="text-[10px] text-gray-500">Pipeline</p>
                  </div>
                </div>

                {/* Alertes */}
                {c.rappels_overdue > 0 && (
                  <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                    <AlertTriangle className="w-4 h-4" />
                    {c.rappels_overdue} rappel{c.rappels_overdue > 1 ? 's' : ''} en retard
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      ) : null}
    </div>
  )
}

// ============================================================
// Composants internes
// ============================================================

function KpiCard({ label, value, subvalue, progress, icon, color, alert }: {
  label: string
  value: string
  subvalue: string
  progress?: number
  icon: React.ReactNode
  color: string
  alert?: boolean
}) {
  return (
    <div className={`bg-white rounded-xl border p-4 ${alert ? 'border-red-200 bg-red-50' : ''}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-500">{label}</span>
        <div style={{ color }}>{icon}</div>
      </div>
      <p className="text-2xl font-bold text-accent">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{subvalue}</p>
      {progress !== undefined && (
        <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: `${Math.min(100, progress)}%`,
              backgroundColor: color,
            }}
          />
        </div>
      )}
    </div>
  )
}

function TendanceBadge({ value }: { value: number }) {
  if (value > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs text-green-600">
        <ArrowUpRight className="w-3 h-3" />+{value}%
      </span>
    )
  }
  if (value < 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs text-red-600">
        <ArrowDownRight className="w-3 h-3" />{value}%
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-0.5 text-xs text-gray-400">
      <Minus className="w-3 h-3" />0%
    </span>
  )
}
