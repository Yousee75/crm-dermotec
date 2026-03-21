'use client'

import { useState } from 'react'
import { useLeads } from '@/hooks/use-leads'
import { useTranslations } from 'next-intl'
import { SearchInput } from '@/components/ui/Input'
import { FilterDropdown, FilterOption } from '@/components/ui/FilterDropdown'
import { Button } from '@/components/ui/Button'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
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

  const statutOptions: FilterOption[] = STATUTS_LEAD.map(s => ({
    value: s,
    label: t(`statut.${s}`)
  }))

  const sourceOptions: FilterOption[] = ['formulaire', 'linkedin', 'telephone', 'referral', 'publicite'].map(s => ({
    value: s,
    label: t(`source.${s}`)
  }))

  if (isLoading) {
    return <SkeletonTable rows={5} columns={5} />
  }

  const leads = data?.data || []

  if (leads.length === 0 && !search && statutFilter.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Aucun prospect"
        description="Commencez par créer votre premier prospect pour développer votre portefeuille client."
        action={
          <Button onClick={onCreateLead} className="mt-4">
            <Plus className="w-4 h-4 mr-2" />
            Créer un prospect
          </Button>
        }
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
            onChange={setSearch}
            placeholder="Rechercher un prospect..."
            className="w-full sm:w-80"
          />
          <div className="flex gap-2">
            <FilterDropdown
              label="Statut"
              options={statutOptions}
              selectedValues={statutFilter}
              onChange={setStatutFilter}
              multiSelect
            />
            <FilterDropdown
              label="Source"
              options={sourceOptions}
              selectedValues={sourceFilter}
              onChange={setSourceFilter}
              multiSelect
            />
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
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <Link href={`/lead/${lead.id}`} className="group block">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#2EC6F3] to-[#1A94CC] flex items-center justify-center text-white text-xs font-medium shadow-sm">
                          {lead.prenom?.[0] || lead.nom?.[0] || 'L'}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 group-hover:text-[#2EC6F3] transition-colors">
                            {lead.prenom} {lead.nom}
                          </p>
                          <p className="text-xs text-gray-500">{lead.email}</p>
                        </div>
                      </div>
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <ScoreChip score={lead.score || 0} size="sm" />
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={lead.statut} size="sm" />
                  </td>
                  <td className="px-6 py-4">
                    <SourceBadge source={lead.source} size="sm" />
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
            Affichage de 10 prospects · <Link href="/leads" className="text-[#2EC6F3] hover:underline">Voir tous</Link>
          </p>
        </div>
      )}
    </div>
  )
}