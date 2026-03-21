'use client'

import { useState, useCallback } from 'react'
import { useLeads, useCreateLead, useChangeStatut } from '@/hooks/use-leads'
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog'
import { STATUTS_LEAD, type StatutLead } from '@/types'
import { Plus, Phone, Mail, MessageCircle, Download, Filter, ArrowUpDown, ChevronLeft, ChevronRight, Users } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { SearchInput } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Badge, StatusBadge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { PageHeader } from '@/components/ui/PageHeader'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { cn } from '@/lib/utils'
import { SourceBadge, SOURCE_CONFIG } from '@/components/ui/SourceBadge'
import { ScoreChip } from '@/components/ui/ScoreChip'
import { FilterDropdown, FilterOption } from '@/components/ui/FilterDropdown'
import { getScoreColor } from '@/lib/scoring'
import type { SourceLead } from '@/types'

export default function LeadsPage() {
  const [search, setSearch] = useState('')
  const [statutFilter, setStatutFilter] = useState<StatutLead[]>([])
  const [sourceFilter, setSourceFilter] = useState<SourceLead[]>([])
  const [page, setPage] = useState(1)
  const [showCreate, setShowCreate] = useState(false)

  const { data, isLoading } = useLeads({
    search: search || undefined,
    statut: statutFilter.length ? statutFilter : undefined,
    page,
    per_page: 20,
  })

  return (
    <div className="space-y-5">
      {/* Header */}
      <PageHeader
        title="Leads"
        description={`${data?.total || 0} leads au total`}
      >
        <Button variant="outline" size="sm" icon={<Download className="w-3.5 h-3.5" />}>
          Export
        </Button>
        <Button
          size="sm"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => setShowCreate(true)}
        >
          Nouveau Lead
        </Button>
      </PageHeader>

      {/* Filters */}
      <div className="space-y-3">
        <div className="w-full sm:max-w-md">
          <SearchInput
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Rechercher (nom, email, téléphone...)"
          />
        </div>

        {/* Smart filter dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Statut dropdown */}
          <FilterDropdown
            label="Statut"
            icon={Filter}
            activeCount={statutFilter.length || undefined}
            onClear={() => { setStatutFilter([]); setPage(1) }}
          >
            {Object.entries(STATUTS_LEAD).map(([key, val]) => (
              <FilterOption
                key={key}
                selected={statutFilter.includes(key as StatutLead)}
                color={val.color}
                onClick={() => {
                  setStatutFilter(prev =>
                    prev.includes(key as StatutLead)
                      ? prev.filter(s => s !== key)
                      : [...prev, key as StatutLead]
                  )
                  setPage(1)
                }}
              >
                {val.label}
              </FilterOption>
            ))}
          </FilterDropdown>

          {/* Source dropdown */}
          <FilterDropdown
            label="Source"
            icon={Users}
            activeCount={sourceFilter.length || undefined}
            onClear={() => { setSourceFilter([]); setPage(1) }}
          >
            {Object.entries(SOURCE_CONFIG).map(([key, cfg]) => {
              const SrcIcon = cfg.icon
              return (
                <FilterOption
                  key={key}
                  selected={sourceFilter.includes(key as SourceLead)}
                  onClick={() => {
                    setSourceFilter(prev =>
                      prev.includes(key as SourceLead)
                        ? prev.filter(s => s !== key)
                        : [...prev, key as SourceLead]
                    )
                    setPage(1)
                  }}
                >
                  <span className="flex items-center gap-2">
                    <SrcIcon className="w-3 h-3" style={{ color: cfg.color }} />
                    {cfg.label}
                  </span>
                </FilterOption>
              )
            })}
          </FilterDropdown>

          {/* Clear all */}
          {(statutFilter.length > 0 || sourceFilter.length > 0) && (
            <button
              onClick={() => { setStatutFilter([]); setSourceFilter([]); setPage(1) }}
              className="text-xs text-gray-400 hover:text-red-500 transition px-2"
            >
              Tout effacer
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <SkeletonTable rows={8} cols={6} />
      ) : (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  <th className="px-4 py-3 text-left">
                    <button className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700 transition">
                      Lead
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Formation</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
                  <th className="hidden lg:table-cell px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Source</th>
                  <th className="hidden sm:table-cell px-4 py-3 text-left">
                    <button className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700 transition">
                      Score
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="hidden lg:table-cell px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data?.leads.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <EmptyState
                        icon={<Users className="w-7 h-7" />}
                        title={search || statutFilter.length ? 'Aucun lead trouvé' : 'Commencez ici'}
                        description={search || statutFilter.length
                          ? 'Modifiez vos filtres ou essayez un autre terme de recherche'
                          : 'Ajoutez votre premier prospect pour démarrer votre pipeline commercial'
                        }
                        action={!search && !statutFilter.length ? {
                          label: 'Créer votre premier lead',
                          onClick: () => setShowCreate(true),
                          icon: <Plus className="w-3.5 h-3.5" />,
                        } : undefined}
                      />
                    </td>
                  </tr>
                ) : data?.leads.map((lead) => {
                  const statut = STATUTS_LEAD[lead.statut]
                  return (
                    <tr
                      key={lead.id}
                      className="group hover:bg-[#2EC6F3]/[0.02] transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3">
                        <Link href={`/lead/${lead.id}`} className="flex items-center gap-3">
                          <div className="relative">
                            <Avatar name={`${lead.prenom} ${lead.nom}`} size="sm" />
                            <div
                              className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white"
                              style={{ backgroundColor: getScoreColor(lead.score_chaud) }}
                              title={`Score: ${lead.score_chaud}`}
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-[#082545] truncate group-hover:text-[#2EC6F3] transition">{lead.prenom} {lead.nom}</p>
                            <p className="text-[11px] text-gray-400 truncate">
                              {lead.statut_pro?.replace(/_/g, ' ') || '—'}
                              {lead.financement_souhaite && <span className="ml-1 text-[#2EC6F3]" title="Financement souhaité">$</span>}
                            </p>
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {lead.telephone && (
                            <a
                              href={`tel:${lead.telephone}`}
                              className="p-2 sm:p-1.5 rounded-md hover:bg-blue-50 text-gray-400 hover:text-blue-500 transition"
                              title={lead.telephone}
                              onClick={e => e.stopPropagation()}
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {lead.email && (
                            <a
                              href={`mailto:${lead.email}`}
                              className="p-2 sm:p-1.5 rounded-md hover:bg-blue-50 text-gray-400 hover:text-blue-500 transition"
                              title={lead.email}
                              onClick={e => e.stopPropagation()}
                            >
                              <Mail className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {lead.whatsapp && (
                            <a
                              href={`https://wa.me/${lead.whatsapp}`}
                              target="_blank"
                              className="p-2 sm:p-1.5 rounded-md hover:bg-green-50 text-gray-400 hover:text-green-500 transition"
                              onClick={e => e.stopPropagation()}
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="hidden md:table-cell px-4 py-3">
                        <span className="text-xs text-gray-600 truncate block max-w-[160px]">
                          {lead.formation_principale?.nom || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge
                          status={lead.statut}
                          label={statut.label}
                          color={statut.color}
                        />
                      </td>
                      <td className="hidden lg:table-cell px-4 py-3">
                        <SourceBadge source={lead.source} />
                      </td>
                      <td className="hidden sm:table-cell px-4 py-3">
                        <ScoreChip score={lead.score_chaud} />
                      </td>
                      <td className="hidden lg:table-cell px-4 py-3">
                        <div>
                          <span className="text-xs text-gray-500 whitespace-nowrap block">
                            {new Date(lead.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                          </span>
                          <span className="text-[10px] text-gray-300">
                            {(() => {
                              const d = Math.floor((Date.now() - new Date(lead.created_at).getTime()) / 86400000)
                              return d === 0 ? "Aujourd'hui" : d === 1 ? 'Hier' : `il y a ${d}j`
                            })()}
                          </span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data && data.total_pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                Page <span className="font-medium text-gray-700">{data.page}</span> sur {data.total_pages}
                <span className="text-gray-300 mx-1">·</span>
                {data.total} leads
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  icon={<ChevronLeft className="w-3.5 h-3.5" />}
                >
                  Précédent
                </Button>

                {/* Page numbers */}
                <div className="hidden sm:flex items-center gap-0.5 mx-1">
                  {Array.from({ length: Math.min(data.total_pages, 5) }, (_, i) => {
                    let pageNum: number
                    if (data.total_pages <= 5) {
                      pageNum = i + 1
                    } else if (page <= 3) {
                      pageNum = i + 1
                    } else if (page >= data.total_pages - 2) {
                      pageNum = data.total_pages - 4 + i
                    } else {
                      pageNum = page - 2 + i
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={cn(
                          'w-8 h-8 rounded-md text-xs font-medium transition',
                          pageNum === page
                            ? 'bg-[#2EC6F3] text-white shadow-sm'
                            : 'text-gray-500 hover:bg-gray-100'
                        )}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(data.total_pages, p + 1))}
                  disabled={page === data.total_pages}
                >
                  Suivant
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
