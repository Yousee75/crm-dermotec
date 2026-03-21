'use client'

import { useState } from 'react'
import { useLeads } from '@/hooks/use-leads'
import { STATUTS_LEAD, type StatutLead, type StatutInscription } from '@/types'
import { GraduationCap, Search, Filter, Calendar, FileCheck, Star, Award } from 'lucide-react'
import Link from 'next/link'
import { formatEuro, formatDate, formatPhone } from '@/lib/utils'

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
  const [statutInscriptionFilter, setStatutInscriptionFilter] = useState('')
  const [hasCertificat, setHasCertificat] = useState(false)
  const [page, setPage] = useState(1)

  const { data, isLoading } = useLeads({
    search: search || undefined,
    statut: STATUTS_STAGIAIRES,
    page,
    per_page: 20,
  })

  // Extraire les formations uniques depuis les leads
  const formations = data?.leads
    .map(lead => lead.formation_principale)
    .filter(Boolean)
    .reduce((acc, formation) => {
      if (!acc.find(f => f?.id === formation?.id)) {
        acc.push(formation)
      }
      return acc
    }, [] as typeof data.leads[0]['formation_principale'][])

  // Filtrer les leads avec inscriptions
  const stagiaires = data?.leads.filter(lead =>
    lead.inscriptions && lead.inscriptions.length > 0 &&
    (!formationFilter || lead.formation_principale?.id === formationFilter) &&
    (!hasCertificat || lead.inscriptions.some(i => i.certificat_genere))
  ) || []

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#082545]" style={{ fontFamily: 'var(--font-heading)' }}>
            Stagiaires
          </h1>
          <p className="text-sm text-gray-500">{stagiaires.length} stagiaires inscrits</p>
        </div>
        <div className="flex items-center gap-2">
          <GraduationCap className="w-8 h-8 text-[#2EC6F3]" />
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Rechercher un stagiaire..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:border-[#2EC6F3] focus:ring-1 focus:ring-[#2EC6F3]/20 outline-none"
          />
        </div>

        <select
          value={formationFilter}
          onChange={(e) => { setFormationFilter(e.target.value); setPage(1) }}
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-[#2EC6F3] outline-none"
        >
          <option value="">Toutes les formations</option>
          {formations?.map(formation => (
            <option key={formation?.id} value={formation?.id}>{formation?.nom}</option>
          ))}
        </select>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={hasCertificat}
            onChange={(e) => { setHasCertificat(e.target.checked); setPage(1) }}
            className="rounded"
          />
          <span className="text-sm">Avec certificat</span>
        </label>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-4 py-3 font-medium text-gray-500">Nom</th>
                <th className="px-4 py-3 font-medium text-gray-500">Formation</th>
                <th className="px-4 py-3 font-medium text-gray-500">Session</th>
                <th className="px-4 py-3 font-medium text-gray-500">Statut</th>
                <th className="px-4 py-3 font-medium text-gray-500">Paiement</th>
                <th className="px-4 py-3 font-medium text-gray-500">Présence</th>
                <th className="px-4 py-3 font-medium text-gray-500">Satisfaction</th>
                <th className="px-4 py-3 font-medium text-gray-500">Certificat</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400">Chargement...</td></tr>
              ) : stagiaires.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                  {search || formationFilter || hasCertificat ? 'Aucun résultat pour ces filtres' : 'Aucun stagiaire inscrit'}
                </td></tr>
              ) : stagiaires.map((lead) => {
                const inscription = lead.inscriptions?.[0] // Première inscription pour simplifier
                const session = inscription?.session
                const statutInscription = inscription ? STATUTS_INSCRIPTION[inscription.statut] : null
                const statutLead = STATUTS_LEAD[lead.statut]

                return (
                  <tr key={lead.id} className="border-t border-gray-50 hover:bg-gray-50/50 transition">
                    <td className="px-4 py-3">
                      <Link href={`/lead/${lead.id}`} className="block">
                        <p className="font-medium text-[#082545]">{lead.prenom} {lead.nom}</p>
                        <p className="text-xs text-gray-400">{lead.statut_pro?.replace('_', ' ') || '—'}</p>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-700">{lead.formation_principale?.nom || '—'}</p>
                      <p className="text-xs text-gray-400">{lead.formation_principale?.categorie}</p>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {session ? (
                        <Link href={`/session/${session.id}`} className="text-[#2EC6F3] hover:underline">
                          <div>
                            <p>{formatDate(session.date_debut, { day: 'numeric', month: 'short' })}</p>
                            <p className="text-gray-400">{session.horaire_debut} - {session.horaire_fin}</p>
                          </div>
                        </Link>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <span
                          className="inline-block px-2 py-0.5 rounded-full text-xs font-medium text-white"
                          style={{ backgroundColor: statutLead.color }}
                        >
                          {statutLead.label}
                        </span>
                        {statutInscription && (
                          <span
                            className="inline-block px-2 py-0.5 rounded-full text-xs font-medium text-white"
                            style={{ backgroundColor: statutInscription.color }}
                          >
                            {statutInscription.label}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {inscription ? (
                        <div>
                          <p className="font-medium">{formatEuro(inscription.montant_total)}</p>
                          <p className="text-gray-400 capitalize">{inscription.paiement_statut.toLowerCase()}</p>
                        </div>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {inscription?.taux_presence ? (
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-green-500"
                              style={{ width: `${inscription.taux_presence}%` }}
                            />
                          </div>
                          <span className="font-medium">{inscription.taux_presence}%</span>
                        </div>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {inscription?.note_satisfaction ? (
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium">{inscription.note_satisfaction}/5</span>
                        </div>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {inscription?.certificat_genere ? (
                        <div className="flex items-center gap-1 text-green-600">
                          <Award className="w-4 h-4" />
                          <span className="text-xs font-medium">Généré</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats résumé */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <h3 className="font-semibold text-[#082545] mb-3 text-sm">Résumé</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-[#2EC6F3]">
              {stagiaires.filter(s => s.statut === 'INSCRIT').length}
            </p>
            <p className="text-xs text-gray-500">Inscrits</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-[#F59E0B]">
              {stagiaires.filter(s => s.statut === 'EN_FORMATION').length}
            </p>
            <p className="text-xs text-gray-500">En formation</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-[#22C55E]">
              {stagiaires.filter(s => s.statut === 'FORME').length}
            </p>
            <p className="text-xs text-gray-500">Formés</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-[#6366F1]">
              {stagiaires.filter(s => s.inscriptions?.some(i => i.certificat_genere)).length}
            </p>
            <p className="text-xs text-gray-500">Certificats</p>
          </div>
        </div>
      </div>
    </div>
  )
}