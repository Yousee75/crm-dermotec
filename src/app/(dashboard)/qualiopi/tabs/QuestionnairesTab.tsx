'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { IllustrationEmptyCommandes } from '@/components/ui/Illustrations'
import {
  ClipboardList, Send, Eye, CheckCircle, Clock, AlertTriangle,
  BarChart3, Users, Mail, TrendingUp
} from 'lucide-react'
import { useQuestionnaires } from '@/hooks/use-qualiopi'
import { toast } from 'sonner'

const TYPE_CONFIG: Record<string, { label: string; color: string; icon: any; qualiopi: string }> = {
  positionnement: {
    label: 'Positionnement',
    color: 'bg-[#E0EBF5] text-[#6B8CAE] border-[#6B8CAE]/30',
    icon: Users,
    qualiopi: 'I4, I8'
  },
  evaluation_acquis: {
    label: 'Éval. acquis',
    color: 'bg-[#FFF0E5] text-[#FF5C00] border-[#FF5C00]/30',
    icon: CheckCircle,
    qualiopi: 'I11'
  },
  satisfaction: {
    label: 'Satisfaction (J+1)',
    color: 'bg-[#ECFDF5] text-[#10B981] border-[#10B981]/30',
    icon: TrendingUp,
    qualiopi: 'I30'
  },
  satisfaction_froid: {
    label: 'Satisfaction (J+30)',
    color: 'bg-[#FFE0EF] text-[#FF2D78] border-[#FF2D78]/30',
    icon: BarChart3,
    qualiopi: 'I30'
  },
  insertion: {
    label: 'Insertion (J+90)',
    color: 'bg-[#FFF3E8] text-[#FF8C42] border-[#FF8C42]/30',
    icon: TrendingUp,
    qualiopi: 'I2'
  },
}

const DECLENCHEUR_LABELS: Record<string, string> = {
  inscription_confirmee: 'À l\'inscription',
  session_j_moins_7: 'J-7 avant session',
  session_terminee: 'Fin de session',
  j_plus_1: 'J+1 après formation',
  j_plus_30: 'J+30 après formation',
  j_plus_90: 'J+90 après formation',
  manuel: 'Envoi manuel',
}

const STATUT_CONFIG: Record<string, { label: string; color: string }> = {
  en_attente: { label: 'En attente', color: 'bg-[#FAF8F5] text-[#777777]' },
  envoye: { label: 'Envoyé', color: 'bg-[#E0EBF5] text-[#6B8CAE]' },
  ouvert: { label: 'Ouvert', color: 'bg-[#FFF0E5] text-[#FF5C00]' },
  en_cours: { label: 'En cours', color: 'bg-[#FFF3E8] text-[#FF8C42]' },
  complete: { label: 'Complété', color: 'bg-[#ECFDF5] text-[#10B981]' },
  expire: { label: 'Expiré', color: 'bg-[#FFE0EF] text-[#FF2D78]' },
}

export default function QuestionnairesTab() {
  const { data, isLoading, error } = useQuestionnaires()

  if (isLoading) return <SkeletonTable rows={4} cols={5} />

  if (error) {
    return (
      <EmptyState
        illustration={<IllustrationEmptyCommandes size={120} />}
        icon={<AlertTriangle className="w-4 h-4" />}
        title="Erreur chargement"
        description={(error as Error).message}
      />
    )
  }

  const templates = data?.templates || []
  const stats = data?.stats || {}

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#777777]">Templates actifs</p>
              <p className="text-xl font-bold text-[#111111]">{templates.filter((t: any) => t.is_active).length}</p>
            </div>
            <ClipboardList className="w-8 h-8 text-[#999999]" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#777777]">Envois total</p>
              <p className="text-xl font-bold text-[#6B8CAE]">{stats.total_envois || 0}</p>
            </div>
            <Mail className="w-8 h-8 text-[#6B8CAE]" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#777777]">Taux réponse</p>
              <p className="text-xl font-bold text-[#10B981]">{stats.taux_reponse || 0}%</p>
            </div>
            <CheckCircle className="w-8 h-8 text-[#10B981]" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#777777]">Score moyen</p>
              <p className="text-xl font-bold text-[#FF5C00]">{stats.score_moyen || '—'}/10</p>
            </div>
            <BarChart3 className="w-8 h-8 text-[#FF5C00]" />
          </div>
        </Card>
      </div>

      {/* Templates questionnaires */}
      <div>
        <h3 className="text-lg font-semibold text-[#111111] mb-4">Modèles de questionnaires</h3>
        {templates.length === 0 ? (
          <EmptyState
            illustration={<IllustrationEmptyCommandes size={120} />}
            icon={<ClipboardList className="w-4 h-4" />}
            title="Aucun template"
            description="Les modèles de questionnaires seront chargés depuis la base de données."
          />
        ) : (
          <div className="space-y-3">
            {templates.map((template: any) => {
              const conf = TYPE_CONFIG[template.type] || TYPE_CONFIG.satisfaction
              const TypeIcon = conf.icon
              const nbQuestions = Array.isArray(template.questions) ? template.questions.length : 0

              return (
                <Card key={template.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-[#FAF8F5] rounded-lg flex items-center justify-center">
                        <TypeIcon className="w-5 h-5 text-[#FF5C00]" />
                      </div>
                      <div>
                        <h4 className="font-medium text-[#111111]">{template.titre}</h4>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-[#777777]">{nbQuestions} questions</span>
                          <span className="text-xs text-[#999999]">·</span>
                          <span className="text-xs text-[#777777]">
                            {DECLENCHEUR_LABELS[template.declencheur] || template.declencheur}
                          </span>
                          <span className="text-xs text-[#999999]">·</span>
                          <Badge className={conf.color} size="sm">Qualiopi {conf.qualiopi}</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {template.envoi_auto && (
                        <Badge className="bg-[#ECFDF5] text-[#10B981]" size="sm">
                          Auto
                        </Badge>
                      )}
                      <Badge className={template.is_active ? 'bg-[#ECFDF5] text-[#10B981]' : 'bg-[#FAF8F5] text-[#999999]'} size="sm">
                        {template.is_active ? 'Actif' : 'Inactif'}
                      </Badge>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Mapping Qualiopi */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-[#111111] mb-4">Couverture indicateurs Qualiopi</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(TYPE_CONFIG).map(([type, conf]) => {
            const TypeIcon = conf.icon
            const hasTemplate = templates.some((t: any) => t.type === type && t.is_active)
            return (
              <div key={type} className="flex items-center gap-3 p-3 rounded-lg bg-[#FAF8F5]">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${hasTemplate ? 'bg-[#ECFDF5]' : 'bg-[#FFE0EF]'}`}>
                  {hasTemplate ? (
                    <CheckCircle className="w-4 h-4 text-[#10B981]" />
                  ) : (
                    <Clock className="w-4 h-4 text-[#FF2D78]" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#111111]">{conf.label}</p>
                  <p className="text-xs text-[#777777]">Indicateur{conf.qualiopi.includes(',') ? 's' : ''} {conf.qualiopi}</p>
                </div>
                <Badge className={conf.color} size="sm">{hasTemplate ? 'Couvert' : 'À configurer'}</Badge>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
