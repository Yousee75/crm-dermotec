'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { Award, CheckCircle, AlertTriangle, Clock, FileText, Users, Target } from 'lucide-react'
import { useQualiopiIndicateurs } from '@/hooks/use-qualiopi'

export default function IndicateursTab() {
  const [selectedCritere, setSelectedCritere] = useState<number | null>(null)
  const { data, isLoading, error } = useQualiopiIndicateurs()

  if (isLoading) return <SkeletonTable rows={4} cols={4} />

  if (error) {
    return (
      <Card className="p-8 text-center">
        <AlertTriangle className="w-8 h-8 text-[#FF2D78] mx-auto mb-2" />
        <p className="text-[#777777]">{(error as Error).message}</p>
      </Card>
    )
  }

  const score_global = data?.score_global || 0
  const criteres = data?.criteres || []
  const stats = data?.stats

  const totalIndicateursConformes = criteres.reduce((s, c) => s + c.indicateurs_conformes, 0)
  const totalIndicateurs = criteres.reduce((s, c) => s + c.indicateurs_total, 0)

  return (
    <div className="space-y-6">
      {/* Vue d'ensemble */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#777777]">Score global</p>
              <p className="text-2xl font-bold text-[#111111]">{score_global}%</p>
            </div>
            <Award className="w-8 h-8 text-primary" />
          </div>
          <ProgressBar value={score_global} className="mt-2" />
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#777777]">Indicateurs</p>
              <p className="text-2xl font-bold text-[#111111]">{totalIndicateursConformes}/{totalIndicateurs}</p>
            </div>
            <Target className="w-8 h-8 text-[#10B981]" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#777777]">Formations</p>
              <p className="text-2xl font-bold text-[#111111]">{stats?.nb_formations || 0}</p>
            </div>
            <FileText className="w-8 h-8 text-[#6B8CAE]" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#777777]">Satisfaction</p>
              <p className="text-2xl font-bold text-[#10B981]">{stats?.taux_satisfaction || 0}%</p>
            </div>
            <Users className="w-8 h-8 text-[#10B981]" />
          </div>
        </Card>
      </div>

      {/* Alerte conformité */}
      {score_global < 80 && (
        <Card className="p-4 border-[#FF8C42]/30 bg-[#FFF3E8]">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-[#FF8C42] shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-[#FF8C42]">
                Score de conformité insuffisant ({score_global}%)
              </p>
              <p className="text-sm text-[#FF8C42]">
                Objectif minimum : 80% pour passer l'audit Qualiopi sereinement.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Données clés */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <Card className="p-3 text-center">
            <p className="text-xs text-[#777777]">Sessions</p>
            <p className="text-lg font-bold text-[#111111]">{stats.nb_sessions}</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-xs text-[#777777]">Inscriptions</p>
            <p className="text-lg font-bold text-[#111111]">{stats.nb_inscriptions}</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-xs text-[#777777]">Certificats</p>
            <p className="text-lg font-bold text-[#10B981]">{stats.nb_certificats}</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-xs text-[#777777]">Présence</p>
            <p className="text-lg font-bold text-[#111111]">{stats.taux_presence}%</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-xs text-[#777777]">Réclamations</p>
            <p className="text-lg font-bold text-[#FF2D78]">{stats.nb_reclamations}</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-xs text-[#777777]">Formatrices</p>
            <p className="text-lg font-bold text-[#111111]">{stats.nb_formatrices}</p>
          </Card>
        </div>
      )}

      {/* Liste des 7 critères */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {criteres.map((critere) => {
          const pourcentage = critere.score
          const isSelected = selectedCritere === critere.numero

          return (
            <Card
              key={critere.numero}
              className={`p-6 cursor-pointer transition-all hover:shadow-md ${
                isSelected ? 'ring-2 ring-primary border-primary' : ''
              }`}
              onClick={() => setSelectedCritere(isSelected ? null : critere.numero)}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-[#111111] mb-1">
                      Critère {critere.numero} — {critere.label}
                    </h3>
                  </div>
                  <Badge
                    className={
                      pourcentage >= 80 ? 'bg-[#ECFDF5] text-[#10B981]' :
                      pourcentage >= 50 ? 'bg-[#FFF3E8] text-[#FF8C42]' :
                      'bg-[#FFE0EF] text-[#FF2D78]'
                    }
                  >
                    {critere.indicateurs_conformes}/{critere.indicateurs_total}
                  </Badge>
                </div>

                <ProgressBar
                  value={pourcentage}
                  className="h-2"
                  color={pourcentage >= 80 ? 'var(--color-success)' : pourcentage >= 50 ? '#FF8C42' : '#FF2D78'}
                />

                <div className="flex items-center justify-between text-xs text-[#777777]">
                  <span>Score : {pourcentage}%</span>
                  <span>{critere.indicateurs_conformes} conforme{critere.indicateurs_conformes > 1 ? 's' : ''} sur {critere.indicateurs_total}</span>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Dernière mise à jour */}
      {data?.updated_at && (
        <p className="text-xs text-[#999999] text-center">
          Dernière actualisation : {new Date(data.updated_at).toLocaleString('fr-FR')}
        </p>
      )}
    </div>
  )
}
