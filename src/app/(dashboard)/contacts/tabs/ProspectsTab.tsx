'use client'

import { useState } from 'react'
import { useLeads } from '@/hooks/use-leads'
import { useTranslations } from 'next-intl'
import { SearchInput } from '@/components/ui/Input'
import { FilterDropdown, FilterOption } from '@/components/ui/FilterDropdown'
import { Button } from '@/components/ui/Button'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { IllustrationEmptyLeads } from '@/components/ui/Illustrations'
import { Plus, Users, Download } from 'lucide-react'
import { STATUTS_LEAD } from '@/types'
import type { StatutLead, SourceLead } from '@/types'
import Link from 'next/link'
import { Badge, StatusBadge } from '@/components/ui/Badge'
import { ScoreChip } from '@/components/ui/ScoreChip'
import { SourceBadge } from '@/components/ui/SourceBadge'

interface ProspectsTabProps {
  onCreateLead?: () => void
}

export default function ProspectsTab({ onCreateLead }: ProspectsTabProps) {
  const t = useTranslations('leads')
  const [search, setSearch] = useState('')
  const [statutFilter, setStatutFilter] = useState<StatutLead[]>([])
  const [sourceFilter, setSourceFilter] = useState<SourceLead[]>([])

  const { data, isLoading } = useLeads({
    search: search || undefined,
    statut: statutFilter.length ? statutFilter : undefined,
    per_page: 10, // Limité pour la tab
  })

  const statutOptions = Object.keys(STATUTS_LEAD).map(s => ({
    value: s,
    label: t(`statut.${s}`)
  }))

  const sourceOptions = ['formulaire', 'linkedin', 'telephone', 'referral', 'publicite'].map(s => ({
    value: s,
    label: t(`source.${s}`)
  }))

  if (isLoading) {
    return <SkeletonTable rows={5} cols={5} />
  }

  const leads = data?.leads || []

  if (leads.length === 0 && !search && statutFilter.length === 0) {
    return (
      <EmptyState
        illustration={<IllustrationEmptyLeads size={120} />}
        icon={<Users className="w-4 h-4" />}
        title="Aucun prospect"
        description="Commencez par créer votre premier prospect pour développer votre portefeuille client."
        action={{ label: 'Créer un prospect', onClick: () => onCreateLead?.(), icon: <Plus className="w-4 h-4" /> }}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Barre d'outils */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-col sm:flex-row gap-3">
          <SearchInput
            value={search}
            onChange={(e: any) => setSearch(e.target ? e.target.value : e)}
            placeholder="Rechercher un prospect..."
            className="w-full sm:w-80"
          />
          <div className="flex gap-2">
            <select
              value={statutFilter[0] || ''}
              onChange={(e) => setStatutFilter(e.target.value ? [e.target.value as StatutLead] : [])}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">Tous les statuts</option>
              {statutOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <select
              value={sourceFilter[0] || ''}
              onChange={(e) => setSourceFilter(e.target.value ? [e.target.value as SourceLead] : [])}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">Toutes les sources</option>
              {sourceOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={onCreateLead} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Nouveau prospect
          </Button>
        </div>
      </div>

      {/* Table simplifiée */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-6 py-3">
                  Prospect
                </th>
                <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-6 py-3">
                  Score
                </th>
                <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-6 py-3">
                  Statut
                </th>
                <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-6 py-3">
                  Source
                </th>
                <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-6 py-3">
                  Date création
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {leads.map((lead: any) => (
                <tr key={lead.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <Link href={`/lead/${lead.id}`} className="group block">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#2EC6F3] to-[#1A94CC] flex items-center justify-center text-white text-xs font-medium shadow-sm">
                          {lead.prenom?.[0] || lead.nom?.[0] || 'L'}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 group-hover:text-primary transition-colors">
                            {lead.prenom} {lead.nom}
                          </p>
                          <p className="text-xs text-gray-500">{lead.email}</p>
                        </div>
                      </div>
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <ScoreChip score={lead.score || 0} />
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={lead.statut} label={lead.statut} color="" />
                  </td>
                  <td className="px-6 py-4">
                    <SourceBadge source={lead.source} />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(lead.created_at).toLocaleDateString('fr-FR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination simple */}
      {data && data.total > 10 && (
        <div className="flex justify-center">
          <p className="text-sm text-gray-500">
            Affichage de 10 prospects · <Link href="/leads" className="text-primary hover:underline">Voir tous</Link>
          </p>
        </div>
      )}
    </div>
  )
}