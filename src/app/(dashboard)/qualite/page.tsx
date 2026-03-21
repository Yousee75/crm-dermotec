'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase-client'
import { useQualiopi } from '@/hooks/use-qualiopi'
import type { QualiopiCritere, QualiopiIndicateur, StatutIndicateur } from '@/types'
import {
  Award,
  AlertTriangle,
  CheckCircle,
  Clock,
  Plus,
  ChevronDown,
  ChevronUp,
  XCircle,
  Target,
  Shield,
} from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts'

const STATUT_COLORS = {
  conforme: '#22C55E',
  a_surveiller: '#F59E0B',
  non_conforme: '#EF4444',
}

const CircularProgress = ({ score }: { score: number }) => {
  const radius = 45
  const strokeWidth = 8
  const normalizedRadius = radius - strokeWidth * 2
  const circumference = normalizedRadius * 2 * Math.PI
  const strokeDasharray = `${(score / 100) * circumference} ${circumference}`

  let color = '#EF4444' // red
  if (score >= 80) color = '#22C55E' // green
  else if (score >= 50) color = '#F59E0B' // orange

  return (
    <div className="relative w-24 h-24">
      <svg width="100%" height="100%" viewBox="0 0 90 90">
        <circle
          stroke="#E5E7EB"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={normalizedRadius}
          cx="45"
          cy="45"
        />
        <circle
          stroke={color}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          strokeLinecap="round"
          style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
          r={normalizedRadius}
          cx="45"
          cy="45"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold text-gray-900">{score}</span>
      </div>
    </div>
  )
}

const StatusDot = ({ statut }: { statut: StatutIndicateur }) => {
  const color = STATUT_COLORS[statut]
  const Icon = statut === 'conforme' ? CheckCircle : statut === 'a_surveiller' ? AlertTriangle : XCircle

  return <Icon className="w-4 h-4" style={{ color }} />
}

const ScoreBar = ({ score }: { score: number }) => {
  let bgColor = 'bg-red-500'
  if (score >= 80) bgColor = 'bg-green-500'
  else if (score >= 50) bgColor = 'bg-orange-500'

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${bgColor}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-xs font-medium text-gray-600 w-8">{score}%</span>
    </div>
  )
}

export default function QualitePage() {
  const [activeTab, setActiveTab] = useState<'criteres' | 'reclamations'>('criteres')
  const [expandedCriteres, setExpandedCriteres] = useState<Set<number>>(new Set())

  const supabase = createClient()
  const { data: qualiopiData, isLoading } = useQualiopi()

  const { data: items } = useQuery({
    queryKey: ['qualite'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('qualite')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })

  const ouvertes = items?.filter(i => i.statut === 'OUVERTE').length || 0
  const enCours = items?.filter(i => i.statut === 'EN_COURS').length || 0
  const resolues = items?.filter(i => i.statut === 'RESOLUE' || i.statut === 'CLOTUREE').length || 0

  const toggleCritere = (numero: number) => {
    const newExpanded = new Set(expandedCriteres)
    if (newExpanded.has(numero)) {
      newExpanded.delete(numero)
    } else {
      newExpanded.add(numero)
    }
    setExpandedCriteres(newExpanded)
  }

  if (isLoading || !qualiopiData) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6, 7].map(i => (
            <div key={i} className="bg-white rounded-xl border p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-16 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const { criteres, score_total, stats } = qualiopiData

  // Calculer les statistiques des indicateurs
  const allIndicateurs = criteres.flatMap(c => c.indicateurs)
  const conformes = allIndicateurs.filter(ind => ind.statut === 'conforme').length
  const aSurveiller = allIndicateurs.filter(ind => ind.statut === 'a_surveiller').length
  const nonConformes = allIndicateurs.filter(ind => ind.statut === 'non_conforme').length

  const pieData = [
    { name: 'Conforme', value: conformes, color: '#22C55E' },
    { name: 'À surveiller', value: aSurveiller, color: '#F59E0B' },
    { name: 'Non conforme', value: nonConformes, color: '#EF4444' },
  ]

  const actionsUrgentes = allIndicateurs
    .filter(ind => ind.statut === 'non_conforme')
    .flatMap(ind => ind.actions_requises)

  let scoreColor = 'text-red-600'
  let scoreBg = 'bg-red-500'
  if (score_total >= 80) {
    scoreColor = 'text-green-600'
    scoreBg = 'bg-green-500'
  } else if (score_total >= 50) {
    scoreColor = 'text-orange-600'
    scoreBg = 'bg-orange-500'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#082545]" style={{ fontFamily: 'var(--font-heading)' }}>
              Qualité — Qualiopi
            </h1>
            <p className="text-sm text-gray-500">Suivi de conformité et amélioration continue</p>
          </div>
          <CircularProgress score={score_total} />
          <div className="text-center">
            <div className={`text-2xl font-bold ${scoreColor}`}>{score_total}/100</div>
            <div className="text-xs text-gray-500">Score global</div>
          </div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#2EC6F3] text-white rounded-xl text-sm font-medium">
          <Plus className="w-4 h-4" /> Nouvelle entrée
        </button>
      </div>

      {/* Score global bar */}
      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-[#082545] flex items-center gap-2">
            <Target className="w-5 h-5 text-[#2EC6F3]" />
            Score global Qualiopi
          </h3>
          <span className={`text-sm font-medium ${scoreColor}`}>
            {score_total >= 80 ? 'Conforme' : score_total >= 50 ? 'À surveiller' : 'Non conforme'}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex-1 bg-gray-200 rounded-full h-4">
            <div
              className={`h-4 rounded-full transition-all ${scoreBg}`}
              style={{ width: `${score_total}%` }}
            />
          </div>
          <span className="text-lg font-bold text-gray-900">{score_total}%</span>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4 text-center text-sm">
          <div>
            <span className="text-red-500 font-medium">{'<'} 50%</span>
            <p className="text-xs text-gray-500">Non conforme</p>
          </div>
          <div>
            <span className="text-orange-500 font-medium">50% - 79%</span>
            <p className="text-xs text-gray-500">À surveiller</p>
          </div>
          <div>
            <span className="text-green-500 font-medium">≥ 80%</span>
            <p className="text-xs text-gray-500">Conforme</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('criteres')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'criteres'
                  ? 'border-[#2EC6F3] text-[#2EC6F3]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Award className="w-4 h-4 inline mr-2" />
              Critères Qualiopi ({criteres.length})
            </button>
            <button
              onClick={() => setActiveTab('reclamations')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'reclamations'
                  ? 'border-[#2EC6F3] text-[#2EC6F3]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <AlertTriangle className="w-4 h-4 inline mr-2" />
              Réclamations ({ouvertes + enCours + resolues})
            </button>
          </nav>
        </div>

        {activeTab === 'criteres' && (
          <div className="p-6">
            {/* 7 Critères Accordion */}
            <div className="space-y-4">
              {criteres.map((critere) => {
                const isExpanded = expandedCriteres.has(critere.numero)
                const statutColor = critere.score_global >= 80 ? 'green' : critere.score_global >= 50 ? 'orange' : 'red'

                return (
                  <div key={critere.numero} className="border border-gray-200 rounded-lg">
                    <button
                      onClick={() => toggleCritere(critere.numero)}
                      className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-[#2EC6F3]/10 text-[#2EC6F3] flex items-center justify-center text-sm font-bold">
                          {critere.numero}
                        </div>
                        <div className="text-left">
                          <h4 className="font-medium text-gray-900">{critere.label}</h4>
                          <p className="text-xs text-gray-500">{critere.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            statutColor === 'green'
                              ? 'bg-green-100 text-green-700'
                              : statutColor === 'orange'
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {critere.score_global}%
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-gray-200 p-4 bg-gray-50">
                        <div className="space-y-3">
                          {critere.indicateurs.map((indicateur) => (
                            <div key={indicateur.indicateur} className="bg-white rounded-lg p-4 border border-gray-200">
                              <div className="flex items-start gap-3 mb-3">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded font-medium">
                                    {critere.numero}.{indicateur.indicateur}
                                  </span>
                                  <StatusDot statut={indicateur.statut} />
                                </div>
                                <div className="flex-1">
                                  <h5 className="font-medium text-sm text-gray-900 mb-1">{indicateur.label}</h5>
                                  <p className="text-xs text-gray-500 mb-3">{indicateur.description}</p>

                                  <ScoreBar score={indicateur.score} />

                                  {indicateur.preuves.length > 0 && (
                                    <div className="mt-3">
                                      <h6 className="text-xs font-medium text-gray-700 mb-1">Preuves :</h6>
                                      <ul className="text-xs text-gray-600 space-y-1">
                                        {indicateur.preuves.map((preuve, i) => (
                                          <li key={i} className="flex items-start gap-1">
                                            <span className="text-gray-400">•</span>
                                            <span>{preuve}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}

                                  {indicateur.actions_requises.length > 0 && (
                                    <div className="mt-3">
                                      <h6 className="text-xs font-medium text-red-700 mb-1">Actions requises :</h6>
                                      <ul className="text-xs text-red-600 space-y-1">
                                        {indicateur.actions_requises.map((action, i) => (
                                          <li key={i} className="flex items-start gap-1">
                                            <span className="text-red-400">•</span>
                                            <span>{action}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Résumé */}
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Statistiques */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="font-semibold text-[#082545] mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-[#2EC6F3]" />
                  Répartition des conformités
                </h3>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{conformes}</div>
                    <div className="text-xs text-gray-500">Conforme</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{aSurveiller}</div>
                    <div className="text-xs text-gray-500">À surveiller</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{nonConformes}</div>
                    <div className="text-xs text-gray-500">Non conforme</div>
                  </div>
                </div>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Actions urgentes */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="font-semibold text-[#082545] mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  Actions urgentes ({actionsUrgentes.length})
                </h3>
                {actionsUrgentes.length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {actionsUrgentes.map((action, i) => (
                      <div key={i} className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-red-700">{action}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">Aucune action urgente</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reclamations' && (
          <div className="p-6">
            {/* KPIs Réclamations */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-xl border p-5 flex items-center gap-4">
                <AlertTriangle className="w-8 h-8 text-red-500" />
                <div>
                  <p className="text-xs text-gray-500">Ouvertes</p>
                  <p className="text-2xl font-bold text-red-500">{ouvertes}</p>
                </div>
              </div>
              <div className="bg-white rounded-xl border p-5 flex items-center gap-4">
                <Clock className="w-8 h-8 text-orange-500" />
                <div>
                  <p className="text-xs text-gray-500">En cours</p>
                  <p className="text-2xl font-bold text-orange-500">{enCours}</p>
                </div>
              </div>
              <div className="bg-white rounded-xl border p-5 flex items-center gap-4">
                <CheckCircle className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-xs text-gray-500">Résolues</p>
                  <p className="text-2xl font-bold text-green-500">{resolues}</p>
                </div>
              </div>
            </div>

            {/* Liste des réclamations */}
            <div className="space-y-3">
              {items && items.length > 0 ? (
                items.map((item) => (
                  <div key={item.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium text-gray-900">{item.titre}</span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            item.priorite === 'HAUTE' ? 'bg-red-100 text-red-700' :
                            item.priorite === 'NORMALE' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {item.priorite}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>{new Date(item.created_at).toLocaleDateString('fr-FR')}</span>
                          {item.critere_qualiopi && (
                            <span>Critère {item.critere_qualiopi}</span>
                          )}
                          {item.indicateur_qualiopi && (
                            <span>Indicateur {item.indicateur_qualiopi}</span>
                          )}
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        item.statut === 'RESOLUE' || item.statut === 'CLOTUREE' ? 'bg-green-100 text-green-700' :
                        item.statut === 'EN_COURS' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {item.statut}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">Aucune réclamation enregistrée</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
