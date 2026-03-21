'use client'

import { useState } from 'react'
import { useLeads, useCreateLead, useChangeStatut } from '@/hooks/use-leads'
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

export default function LeadsPage() {
  const [search, setSearch] = useState('')
  const [statutFilter, setStatutFilter] = useState<StatutLead[]>([])
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
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="w-full sm:max-w-sm">
          <SearchInput
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Rechercher (nom, email, téléphone...)"
          />
        </div>

        {/* Statut badges filter */}
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(STATUTS_LEAD).slice(0, 7).map(([key, val]) => {
            const isSelected = statutFilter.includes(key as StatutLead)
            return (
              <button
                key={key}
                onClick={() => {
                  setStatutFilter(prev =>
                    prev.includes(key as StatutLead)
                      ? prev.filter(s => s !== key)
                      : [...prev, key as StatutLead]
                  )
                  setPage(1)
                }}
                className={cn(
                  'px-2.5 py-1.5 rounded-full text-xs font-medium transition-all duration-150 border',
                  'min-h-[32px]',
                  isSelected
                    ? 'text-white border-transparent shadow-sm'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                )}
                style={isSelected ? { backgroundColor: val.color, borderColor: val.color } : {}}
              >
                {val.label}
              </button>
            )
          })}
          {statutFilter.length > 0 && (
            <button
              onClick={() => { setStatutFilter([]); setPage(1) }}
              className="px-2.5 py-1.5 rounded-full text-xs text-gray-400 hover:text-gray-600 transition"
            >
              Réinitialiser
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
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Formation</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Source</th>
                  <th className="px-4 py-3 text-left">
                    <button className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700 transition">
                      Score
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data?.leads.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <EmptyState
                        icon={<Users className="w-7 h-7" />}
                        title={search || statutFilter.length ? 'Aucun résultat' : 'Aucun lead'}
                        description={search || statutFilter.length
                          ? 'Essayez de modifier vos filtres'
                          : 'Créez votre premier lead pour commencer'
                        }
                        action={!search && !statutFilter.length ? {
                          label: 'Nouveau Lead',
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
                          <Avatar name={`${lead.prenom} ${lead.nom}`} size="sm" />
                          <div className="min-w-0">
                            <p className="font-medium text-[#082545] truncate">{lead.prenom} {lead.nom}</p>
                            <p className="text-xs text-gray-400 truncate">{lead.statut_pro || '—'}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {lead.telephone && (
                            <a
                              href={`tel:${lead.telephone}`}
                              className="p-1.5 rounded-md hover:bg-blue-50 text-gray-400 hover:text-blue-500 transition"
                              title={lead.telephone}
                              onClick={e => e.stopPropagation()}
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {lead.email && (
                            <a
                              href={`mailto:${lead.email}`}
                              className="p-1.5 rounded-md hover:bg-blue-50 text-gray-400 hover:text-blue-500 transition"
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
                              className="p-1.5 rounded-md hover:bg-green-50 text-gray-400 hover:text-green-500 transition"
                              onClick={e => e.stopPropagation()}
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
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
                      <td className="px-4 py-3">
                        <Badge variant="outline" size="sm">
                          {lead.source.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 w-20">
                          <ProgressBar value={lead.score_chaud} size="sm" />
                          <span className="text-xs text-gray-500 tabular-nums">{lead.score_chaud}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-400 whitespace-nowrap">
                          {new Date(lead.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                        </span>
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
