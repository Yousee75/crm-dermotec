'use client'

import { useState } from 'react'
import { useLeads, useCreateLead, useChangeStatut } from '@/hooks/use-leads'
import { STATUTS_LEAD, type StatutLead, type SourceLead } from '@/types'
import { Plus, Search, Filter, Download, Phone, Mail, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#082545]" style={{ fontFamily: 'var(--font-heading)' }}>
            Leads
          </h1>
          <p className="text-sm text-gray-500">{data?.total || 0} leads au total</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#2EC6F3] hover:bg-[#1BA8D4] text-white rounded-xl text-sm font-medium transition"
        >
          <Plus className="w-4 h-4" />
          Nouveau Lead
        </button>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Rechercher (nom, email, téléphone...)"
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:border-[#2EC6F3] focus:ring-1 focus:ring-[#2EC6F3]/20 outline-none"
          />
        </div>

        {/* Statut badges */}
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(STATUTS_LEAD).slice(0, 7).map(([key, val]) => (
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
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition ${
                statutFilter.includes(key as StatutLead)
                  ? 'text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              style={statutFilter.includes(key as StatutLead) ? { backgroundColor: val.color } : {}}
            >
              {val.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-4 py-3 font-medium text-gray-500">Lead</th>
                <th className="px-4 py-3 font-medium text-gray-500">Contact</th>
                <th className="px-4 py-3 font-medium text-gray-500">Formation</th>
                <th className="px-4 py-3 font-medium text-gray-500">Statut</th>
                <th className="px-4 py-3 font-medium text-gray-500">Source</th>
                <th className="px-4 py-3 font-medium text-gray-500">Score</th>
                <th className="px-4 py-3 font-medium text-gray-500">Date</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">Chargement...</td></tr>
              ) : data?.leads.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                  {search || statutFilter.length ? 'Aucun résultat pour ces filtres' : 'Aucun lead — créez le premier !'}
                </td></tr>
              ) : data?.leads.map((lead) => {
                const statut = STATUTS_LEAD[lead.statut]
                return (
                  <tr key={lead.id} className="border-t border-gray-50 hover:bg-gray-50/50 transition cursor-pointer">
                    <td className="px-4 py-3">
                      <Link href={`/lead/${lead.id}`} className="block">
                        <p className="font-medium text-[#082545]">{lead.prenom} {lead.nom}</p>
                        <p className="text-xs text-gray-400">{lead.statut_pro || '—'}</p>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {lead.telephone && (
                          <a href={`tel:${lead.telephone}`} className="p-1 hover:bg-blue-50 rounded" title={lead.telephone}>
                            <Phone className="w-3.5 h-3.5 text-blue-500" />
                          </a>
                        )}
                        {lead.email && (
                          <a href={`mailto:${lead.email}`} className="p-1 hover:bg-blue-50 rounded" title={lead.email}>
                            <Mail className="w-3.5 h-3.5 text-blue-500" />
                          </a>
                        )}
                        {lead.whatsapp && (
                          <a href={`https://wa.me/${lead.whatsapp}`} target="_blank" className="p-1 hover:bg-green-50 rounded">
                            <MessageCircle className="w-3.5 h-3.5 text-green-500" />
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {lead.formation_principale?.nom || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
                        style={{ backgroundColor: statut.color }}
                      >
                        {statut.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 capitalize">{lead.source.replace('_', ' ')}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-8 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${lead.score_chaud}%`,
                              backgroundColor: lead.score_chaud >= 70 ? '#22C55E' : lead.score_chaud >= 40 ? '#F59E0B' : '#9CA3AF',
                            }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">{lead.score_chaud}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {new Date(lead.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.total_pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50">
            <p className="text-xs text-gray-500">
              Page {data.page} / {data.total_pages} · {data.total} leads
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-xs rounded bg-white border border-gray-200 disabled:opacity-50"
              >
                Précédent
              </button>
              <button
                onClick={() => setPage(p => Math.min(data.total_pages, p + 1))}
                disabled={page === data.total_pages}
                className="px-3 py-1 text-xs rounded bg-white border border-gray-200 disabled:opacity-50"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
