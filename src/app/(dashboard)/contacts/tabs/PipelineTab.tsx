'use client'

import { useLeads } from '@/hooks/use-leads'
import { useTranslations } from 'next-intl'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { STATUTS_LEAD } from '@/types'
import { EmptyState } from '@/components/ui/EmptyState'
import { IllustrationEmptyPipeline } from '@/components/ui/Illustrations'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { Kanban, TrendingUp, Users } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const STATUT_LABELS = {
  nouveau: 'Nouveaux',
  contacte: 'Contactés',
  qualifie: 'Qualifiés',
  devis_envoye: 'Devis envoyés',
  financement: 'En financement',
  inscrit: 'Inscrits',
  forme: 'Formés',
  sans_suite: 'Sans suite',
} as const

const STATUT_COLORS = {
  nouveau: 'bg-blue-50 text-blue-700 border-blue-200',
  contacte: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  qualifie: 'bg-purple-50 text-purple-700 border-purple-200',
  devis_envoye: 'bg-orange-50 text-orange-700 border-orange-200',
  financement: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  inscrit: 'bg-green-50 text-green-700 border-green-200',
  forme: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  sans_suite: 'bg-gray-50 text-gray-500 border-gray-200',
} as const

export default function PipelineTab() {
  const t = useTranslations('leads')

  const { data, isLoading } = useLeads({
    per_page: 100, // Récupérer tous pour les stats
  })

  if (isLoading) {
    return <SkeletonTable rows={4} cols={2} />
  }

  const leads = data?.leads || []

  if (leads.length === 0) {
    return (
      <EmptyState
        illustration={<IllustrationEmptyPipeline size={120} />}
        icon={<Kanban className="w-4 h-4" />}
        title="Pipeline vide"
        description="Aucun prospect dans le pipeline pour le moment."
      />
    )
  }

  // Grouper par statut
  const leadsByStatut = leads.reduce((acc: any, lead: any) => {
    const statut = lead.statut || 'nouveau'
    if (!acc[statut]) acc[statut] = []
    acc[statut].push(lead)
    return acc
  }, {} as Record<string, any[]>)

  // Calculer le CA potentiel
  const caPotentiel = leads
    .filter((l: any) => l.statut && ['qualifie', 'devis_envoye', 'financement'].includes(l.statut))
    .reduce((sum: any, l: any) => sum + (l.ca_potentiel || 2500), 0) // 2500 = prix moyen formation

  return (
    <div className="space-y-6">
      {/* Métriques du pipeline */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total prospects</p>
              <p className="text-2xl font-bold text-gray-900">{leads.length}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">CA potentiel</p>
              <p className="text-2xl font-bold text-gray-900">{caPotentiel.toLocaleString('fr-FR')}€</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Taux conversion</p>
              <p className="text-2xl font-bold text-gray-900">
                {leads.length > 0 ? Math.round(((leadsByStatut.inscrit?.length || 0) + (leadsByStatut.forme?.length || 0)) / leads.length * 100) : 0}%
              </p>
            </div>
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Kanban className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Statuts du pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
        {(Object.keys(STATUT_LABELS) as Array<keyof typeof STATUT_LABELS>).map((statut) => {
          const leads = leadsByStatut[statut] || []
          const count = leads.length

          if (count === 0) return null

          return (
            <Card key={statut} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-900">
                  {STATUT_LABELS[statut] || statut}
                </h3>
                <Badge
                  variant="outline"
                  className={cn("text-xs", STATUT_COLORS[statut] || "bg-gray-50 text-gray-600")}
                >
                  {count}
                </Badge>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {leads.slice(0, 5).map((lead: any) => (
                  <Link
                    key={lead.id}
                    href={`/lead/${lead.id}`}
                    className="block p-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white text-xs font-medium">
                        {lead.prenom?.[0] || lead.nom?.[0] || 'L'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-900 truncate">
                          {lead.prenom} {lead.nom}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{lead.email}</p>
                      </div>
                    </div>
                  </Link>
                ))}
                {leads.length > 5 && (
                  <p className="text-xs text-gray-500 text-center py-1">
                    +{leads.length - 5} autres
                  </p>
                )}
              </div>
            </Card>
          )
        })}
      </div>

      {/* Lien vers pipeline complet */}
      <div className="text-center">
        <Link href="/pipeline" className="text-sm text-primary hover:underline">
          Voir le pipeline complet →
        </Link>
      </div>
    </div>
  )
}