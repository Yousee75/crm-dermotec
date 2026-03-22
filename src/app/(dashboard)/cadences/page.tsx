'use client'

export const dynamic = 'force-dynamic'
// @ts-nocheck

import { useState } from 'react'
import Link from 'next/link'
import {
  Mail, MessageCircle, Phone, Bell, Clock, Play, Pause, Square,
  Users, CheckCircle, TrendingUp, BarChart3, Plus, Filter,
  MoreVertical, ChevronDown, Calendar, User, Tag, ArrowRight
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Tooltip } from '@/components/ui/Tooltip'
import { cn } from '@/lib/utils'
import { useCadenceTemplates, useCadenceInstances, useStopCadence } from '@/hooks/use-cadences'
import { CADENCES_PREDEFINES } from '@/lib/cadence-engine'
import type { CadenceTemplate, CadenceInstance, CadenceStepType, CadenceStep } from '@/types'

// Types utilitaires
interface KPI {
  label: string
  value: string
  change?: string
  icon: React.ElementType
  color: string
}

// Configuration des couleurs par type d'étape
const STEP_TYPE_CONFIG: Record<CadenceStepType, { color: string; bgColor: string; icon: React.ElementType }> = {
  email: { color: '#3B82F6', bgColor: '#EFF6FF', icon: Mail },
  whatsapp: { color: '#25D366', bgColor: '#F0FDF4', icon: MessageCircle },
  sms: { color: '#8B5CF6', bgColor: '#F5F3FF', icon: MessageCircle },
  appel: { color: '#F59E0B', bgColor: '#FFFBEB', icon: Phone },
  rappel: { color: '#EF4444', bgColor: '#FEF2F2', icon: Bell },
  attente: { color: '#9CA3AF', bgColor: '#F9FAFB', icon: Clock }
}

// Fonction pour formater les délais
function formatDelai(jours: number, heures: number): string {
  if (jours === 0 && heures === 0) return 'Immédiat'
  if (jours === 0) return `H+${heures}`
  if (heures === 0) return `J+${jours}`
  return `J+${jours} H+${heures}`
}

// Fonction pour formater les dates relatives
function formatRelativeDate(date: string): string {
  const now = new Date()
  const target = new Date(date)
  const diffMs = target.getTime() - now.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

  if (diffMs < 0) return 'En retard'
  if (diffDays === 0) {
    if (diffHours === 0) return 'Dans quelques minutes'
    return `Dans ${diffHours}h`
  }
  if (diffDays === 1) return 'Demain'
  return `Dans ${diffDays}j`
}

// Composant pour une étape de cadence
function CadenceStep({
  step,
  index,
  isLast
}: {
  step: CadenceStep
  index: number
  isLast: boolean
}) {
  const config = STEP_TYPE_CONFIG[step.type]
  const IconComponent = config.icon

  return (
    <div className="relative flex items-start gap-3">
      {/* Timeline line */}
      {!isLast && (
        <div
          className="absolute left-4 top-8 w-px h-12 bg-gray-200"
          style={{ backgroundColor: '#E5E7EB' }}
        />
      )}

      {/* Step icon */}
      <div
        className="relative z-10 w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-sm"
        style={{ backgroundColor: config.bgColor, borderColor: config.color }}
      >
        <IconComponent
          className="w-4 h-4"
          style={{ color: config.color }}
        />
      </div>

      {/* Step content */}
      <div className="flex-1 pb-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-gray-900">
            Étape {step.ordre}
          </span>
          <Badge
            variant="outline"
            size="sm"
            style={{
              borderColor: config.color,
              color: config.color,
              backgroundColor: config.bgColor
            }}
          >
            {formatDelai(step.delai_jours, step.delai_heures)}
          </Badge>
        </div>

        {step.sujet && (
          <p className="text-sm font-medium text-gray-700 mb-1">
            {step.sujet}
          </p>
        )}

        <p className="text-xs text-gray-500 line-clamp-2">
          {step.contenu || 'Contenu automatique'}
        </p>
      </div>
    </div>
  )
}

// Composant pour une carte de template de cadence
function CadenceTemplateCard({
  template,
  isExpanded,
  onToggle
}: {
  template: CadenceTemplate
  isExpanded: boolean
  onToggle: () => void
}) {
  const triggerLabels: Record<string, string> = {
    nouveau_lead: 'Nouveau Lead',
    post_formation: 'Post-Formation',
    relance_financement: 'Financement',
    abandon: 'Réactivation'
  }

  return (
    <Card className="overflow-hidden">
      <div
        className="p-4 cursor-pointer hover:bg-gray-50 transition"
        onClick={onToggle}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-gray-900">{template.nom}</h3>
              <Badge
                variant={template.declencheur === 'nouveau_lead' ? 'primary' : 'outline'}
                size="sm"
              >
                {triggerLabels[template.declencheur] || template.declencheur}
              </Badge>
            </div>
            <p className="text-sm text-gray-600 mb-2">{template.description}</p>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span>{template.etapes.length} étapes</span>
              <span className="flex items-center gap-1">
                <div className={cn(
                  'w-2 h-2 rounded-full',
                  template.is_active ? 'bg-green-500' : 'bg-gray-300'
                )} />
                {template.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ChevronDown className={cn(
              'w-4 h-4 text-gray-400 transition-transform',
              isExpanded && 'rotate-180'
            )} />
          </div>
        </div>
      </div>

      {/* Timeline des étapes (expanded) */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-100 bg-gray-50/50">
          <div className="pt-4 space-y-2">
            <h4 className="text-sm font-medium text-gray-900 mb-3">
              Timeline des étapes
            </h4>
            {template.etapes.map((step, index) => (
              <CadenceStep
                key={index}
                step={step}
                index={index}
                isLast={index === template.etapes.length - 1}
              />
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}

// Composant pour une instance de cadence
function CadenceInstanceRow({
  instance
}: {
  instance: CadenceInstance
}) {
  const stopCadence = useStopCadence()

  const handleStop = (e: React.MouseEvent) => {
    e.preventDefault()
    stopCadence.mutate(instance.id)
  }

  const statutConfig = {
    active: { label: 'Active', color: 'bg-green-100 text-green-800' },
    terminee: { label: 'Terminée', color: 'bg-blue-100 text-blue-800' },
    arretee: { label: 'Arrêtée', color: 'bg-red-100 text-red-800' },
    en_pause: { label: 'En pause', color: 'bg-yellow-100 text-yellow-800' }
  }

  const statut = statutConfig[instance.statut] || statutConfig.active

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
            {instance.lead?.prenom?.charAt(0) || 'L'}
          </div>
          <div>
            <Link
              href={`/leads/${instance.lead_id}`}
              className="font-medium text-gray-900 hover:text-blue-600 transition"
            >
              {instance.lead?.prenom} {instance.lead?.nom}
            </Link>
            <p className="text-xs text-gray-500">{instance.lead?.email}</p>
          </div>
        </div>
      </td>

      <td className="px-4 py-3">
        <span className="text-sm text-gray-900">{instance.template?.nom}</span>
      </td>

      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900">
            {instance.etape_courante}/{instance.template?.etapes.length || 0}
          </span>
          <div className="w-16 bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-blue-500 h-1.5 rounded-full transition-all"
              style={{
                width: `${((instance.etape_courante || 0) / (instance.template?.etapes.length || 1)) * 100}%`
              }}
            />
          </div>
        </div>
      </td>

      <td className="px-4 py-3">
        {instance.prochaine_execution ? (
          <span className="text-sm text-gray-900">
            {formatRelativeDate(instance.prochaine_execution)}
          </span>
        ) : (
          <span className="text-sm text-gray-500">—</span>
        )}
      </td>

      <td className="px-4 py-3">
        <Badge
          className={cn('text-xs', statut.color)}
          variant="outline"
        >
          {statut.label}
        </Badge>
      </td>

      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          {instance.statut === 'active' && (
            <>
              <Tooltip content="Mettre en pause">
                <Button variant="ghost" size="sm">
                  <Pause className="w-4 h-4" />
                </Button>
              </Tooltip>
              <Tooltip content="Arrêter la cadence">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleStop}
                  disabled={stopCadence.isPending}
                >
                  <Square className="w-4 h-4" />
                </Button>
              </Tooltip>
            </>
          )}
          {instance.statut === 'en_pause' && (
            <Tooltip content="Reprendre">
              <Button variant="ghost" size="sm">
                <Play className="w-4 h-4" />
              </Button>
            </Tooltip>
          )}
        </div>
      </td>
    </tr>
  )
}

export default function CadencesPage() {
  const [activeTab, setActiveTab] = useState<'templates' | 'instances'>('templates')
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null)
  const [instancesFilter, setInstancesFilter] = useState<'all' | 'active' | 'terminee' | 'arretee'>('all')

  const { data: templates, isLoading: templatesLoading } = useCadenceTemplates()
  const { data: instances, isLoading: instancesLoading } = useCadenceInstances()

  // KPIs calculés
  const kpis: KPI[] = [
    {
      label: 'Cadences actives',
      value: instances?.filter(i => i.statut === 'active').length.toString() || '0',
      icon: Users,
      color: '#10B981'
    },
    {
      label: 'Terminées ce mois',
      value: instances?.filter(i => {
        const thisMonth = new Date().getMonth()
        const instanceMonth = new Date(i.updated_at).getMonth()
        return i.statut === 'terminee' && instanceMonth === thisMonth
      }).length.toString() || '0',
      icon: CheckCircle,
      color: 'var(--color-primary)'
    },
    {
      label: 'Taux complétion',
      value: instances?.length ?
        Math.round((instances.filter(i => i.statut === 'terminee').length / instances.length) * 100) + '%'
        : '0%',
      icon: TrendingUp,
      color: '#8B5CF6'
    },
    {
      label: 'Messages ce mois',
      value: (() => {
        if (!instances?.length) return '0'
        const thisMonth = new Date().getMonth()
        const thisYear = new Date().getFullYear()
        let count = 0
        instances.forEach(inst => {
          const historique = (inst.historique || []) as Array<{ date?: string }>
          historique.forEach(entry => {
            if (entry.date) {
              const d = new Date(entry.date)
              if (d.getMonth() === thisMonth && d.getFullYear() === thisYear) count++
            }
          })
        })
        return count.toString()
      })(),
      icon: BarChart3,
      color: '#F59E0B'
    }
  ]

  // Filtrer les instances
  const filteredInstances = instances?.filter(instance => {
    if (instancesFilter === 'all') return true
    return instance.statut === instancesFilter
  }) || []

  // Templates avec données des cadences prédéfinies comme fallback
  const displayTemplates = templates || CADENCES_PREDEFINES.map((cadence, index) => ({
    id: `predefined-${index}`,
    ...cadence,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cadences de vente</h1>
          <p className="text-gray-600">Gérez vos séquences marketing automatisées</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle cadence
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => (
          <Card key={index} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{kpi.label}</p>
                <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
                {kpi.change && (
                  <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                    <TrendingUp className="w-3 h-3" />
                    {kpi.change}
                  </p>
                )}
              </div>
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: kpi.color + '15' }}
              >
                {(() => { const KpiIcon = kpi.icon; return <KpiIcon className="w-6 h-6" style={{ color: kpi.color }} /> })()}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('templates')}
            className={cn(
              'py-2 px-1 border-b-2 font-medium text-sm transition',
              activeTab === 'templates'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            )}
          >
            Templates de cadences
          </button>
          <button
            onClick={() => setActiveTab('instances')}
            className={cn(
              'py-2 px-1 border-b-2 font-medium text-sm transition',
              activeTab === 'instances'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            )}
          >
            Instances actives
            {instances && instances.length > 0 && (
              <Badge className="ml-2" variant="outline" size="sm">
                {instances.length}
              </Badge>
            )}
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          {templatesLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="p-4 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-2" />
                  <div className="h-3 bg-gray-200 rounded mb-1 w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {displayTemplates.map((template) => (
                <CadenceTemplateCard
                  key={template.id}
                  template={template}
                  isExpanded={expandedTemplate === template.id}
                  onToggle={() => setExpandedTemplate(
                    expandedTemplate === template.id ? null : template.id
                  )}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'instances' && (
        <div className="space-y-4">
          {/* Filtres */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <div className="flex gap-1">
              {[
                { key: 'all', label: 'Toutes' },
                { key: 'active', label: 'Actives' },
                { key: 'terminee', label: 'Terminées' },
                { key: 'arretee', label: 'Arrêtées' }
              ].map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => setInstancesFilter(filter.key as any)}
                  className={cn(
                    'px-3 py-1 rounded-lg text-sm font-medium transition',
                    instancesFilter === filter.key
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  )}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lead
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cadence
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Étape courante
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prochain envoi
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {instancesLoading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded" /></td>
                        <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded" /></td>
                        <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded" /></td>
                        <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded" /></td>
                        <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded" /></td>
                        <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded" /></td>
                      </tr>
                    ))
                  ) : filteredInstances.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        Aucune instance de cadence trouvée
                      </td>
                    </tr>
                  ) : (
                    filteredInstances.map((instance) => (
                      <CadenceInstanceRow key={instance.id} instance={instance} />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}