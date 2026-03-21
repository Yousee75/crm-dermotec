'use client'

import { useState } from 'react'
import { useLeads } from '@/hooks/use-leads'
import { STATUTS_LEAD, type StatutLead, type StatutInscription } from '@/types'
import { GraduationCap, Search, Star, Award, ChevronLeft, ChevronRight, Users } from 'lucide-react'
import Link from 'next/link'
import { formatEuro, formatDate } from '@/lib/utils'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Badge, StatusBadge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { SearchInput } from '@/components/ui/Input'
import { KpiCard } from '@/components/ui/KpiCard'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonTable } from '@/components/ui/Skeleton'

const STATUTS_STAGIAIRES: StatutLead[] = ['INSCRIT', 'EN_FORMATION', 'FORME', 'ALUMNI']

const STATUTS_INSCRIPTION: Record<StatutInscription, { label: string; color: string }> = {
  EN_ATTENTE: { label: 'En attente', color: '#9CA3AF' },
  CONFIRMEE: { label: 'Confirmée', color: '#22C55E' },
  EN_COURS: { label: 'En cours', color: '#F59E0B' },
  COMPLETEE: { label: 'Complétée', color: '#6366F1' },
  ANNULEE: { label: 'Annulée', color: '#EF4444' },
  REMBOURSEE: { label: 'Remboursée', color: '#F97316' },
  NO_SHOW: { label: 'Absent', color: '#DC2626' },
}

export default function StagiairesPage() {
  const [search, setSearch] = useState('')
  const [formationFilter, setFormationFilter] = useState('')
  const [hasCertificat, setHasCertificat] = useState(false)
  const [page, setPage] = useState(1)

  const { data, isLoading } = useLeads({
    search: search || undefined,
    statut: STATUTS_STAGIAIRES,
    page,
    per_page: 20,
  })

  const formations = data?.leads
    .map(lead => lead.formation_principale)
    .filter(Boolean)
    .reduce((acc, formation) => {
      if (!acc.find(f => f?.id === formation?.id)) acc.push(formation)
      return acc
    }, [] as typeof data.leads[0]['formation_principale'][])

  const stagiaires = data?.leads.filter(lead =>
    lead.inscriptions && lead.inscriptions.length > 0 &&
    (!formationFilter || lead.formation_principale?.id === formationFilter) &&
    (!hasCertificat || lead.inscriptions.some(i => i.certificat_genere))
  ) || []

  return (
    <div className="space-y-5">
      <PageHeader title="Stagiaires" description={`${stagiaires.length} stagiaires inscrits`} />

      {/* Stats résumé */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-children">
        <KpiCard icon={Users} label="Inscrits" value={stagiaires.filter(s => s.statut === 'INSCRIT').length} color="#2EC6F3" />
        <KpiCard icon={GraduationCap} label="En formation" value={stagiaires.filter(s => s.statut === 'EN_FORMATION').length} color="#F59E0B" />
        <KpiCard icon={Award} label="Formés" value={stagiaires.filter(s => s.statut === 'FORME').length} color="#22C55E" />
        <KpiCard icon={Star} label="Certificats" value={stagiaires.filter(s => s.inscriptions?.some(i => i.certificat_genere)).length} color="#6366F1" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="w-full sm:max-w-sm">
          <SearchInput
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Rechercher un stagiaire..."
          />
        </div>

        <select
          value={formationFilter}
          onChange={(e) => { setFormationFilter(e.target.value); setPage(1) }}
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-[#2EC6F3] focus:ring-2 focus:ring-[#2EC6F3]/15 outline-none bg-white"
        >
          <option value="">Toutes les formations</option>
          {formations?.map(formation => (
            <option key={formation?.id} value={formation?.id}>{formation?.nom}</option>
          ))}
        </select>

        <label className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition">
          <input
            type="checkbox"
            checked={hasCertificat}
            onChange={(e) => { setHasCertificat(e.target.checked); setPage(1) }}
            className="rounded border-gray-300 text-[#2EC6F3] focus:ring-[#2EC6F3]/20"
          />
          <span className="text-sm text-gray-600">Avec certificat</span>
        </label>
      </div>

      {/* Table */}
      {isLoading ? (
        <SkeletonTable rows={8} cols={7} />
      ) : (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Stagiaire</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Formation</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Session</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Paiement</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Présence</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Satisfaction</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Certificat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {stagiaires.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <EmptyState
                        icon={<GraduationCap className="w-7 h-7" />}
                        title={search || formationFilter || hasCertificat ? 'Aucun résultat' : 'Aucun stagiaire'}
                        description={search || formationFilter ? 'Essayez de modifier vos filtres' : 'Les leads inscrits apparaîtront ici'}
                      />
                    </td>
                  </tr>
                ) : stagiaires.map((lead) => {
                  const inscription = lead.inscriptions?.[0]
                  const session = inscription?.session
                  const statutInscription = inscription ? STATUTS_INSCRIPTION[inscription.statut] : null
                  const statutLead = STATUTS_LEAD[lead.statut]

                  return (
                    <tr key={lead.id} className="group hover:bg-[#2EC6F3]/[0.02] transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/lead/${lead.id}`} className="flex items-center gap-3">
                          <Avatar name={`${lead.prenom} ${lead.nom}`} size="sm" />
                          <div>
                            <p className="font-medium text-[#082545]">{lead.prenom} {lead.nom}</p>
                            <p className="text-xs text-gray-400">{lead.statut_pro?.replace('_', ' ') || '—'}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-700 text-xs">{lead.formation_principale?.nom || '—'}</p>
                        <p className="text-[10px] text-gray-400">{lead.formation_principale?.categorie}</p>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {session ? (
                          <Link href={`/session/${session.id}`} className="text-[#2EC6F3] hover:underline">
                            <p>{formatDate(session.date_debut, { day: 'numeric', month: 'short' })}</p>
                            <p className="text-gray-400">{session.horaire_debut} - {session.horaire_fin}</p>
                          </Link>
                        ) : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <StatusBadge status={lead.statut} label={statutLead.label} color={statutLead.color} />
                          {statutInscription && (
                            <StatusBadge status={inscription!.statut} label={statutInscription.label} color={statutInscription.color} />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {inscription ? (
                          <div>
                            <p className="font-semibold text-gray-700">{formatEuro(inscription.montant_total)}</p>
                            <Badge variant={inscription.paiement_statut === 'PAYE' ? 'success' : 'warning'} size="sm">
                              {inscription.paiement_statut.toLowerCase()}
                            </Badge>
                          </div>
                        ) : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        {inscription?.taux_presence ? (
                          <div className="w-20">
                            <ProgressBar
                              value={inscription.taux_presence}
                              size="sm"
                              showLabel
                              color={inscription.taux_presence >= 80 ? '#22C55E' : inscription.taux_presence >= 50 ? '#F59E0B' : '#EF4444'}
                            />
                          </div>
                        ) : <span className="text-xs text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        {inscription?.note_satisfaction ? (
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3 h-3 ${i < inscription.note_satisfaction! ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`}
                              />
                            ))}
                          </div>
                        ) : <span className="text-xs text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        {inscription?.certificat_genere ? (
                          <Badge variant="success" size="sm">
                            <Award className="w-3 h-3" /> Généré
                          </Badge>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
