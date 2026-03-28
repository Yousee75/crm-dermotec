'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/infra/supabase-client'
import {
  Inscription,
  StatutInscription,
  PaiementStatut,
  Lead,
  Session,
  Formation
} from '@/types'
import {
  GraduationCap,
  Search,
  Star,
  Award,
  ChevronLeft,
  ChevronRight,
  Users,
  Download,
  Eye,
  ExternalLink,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  BookOpen,
  Trophy
} from 'lucide-react'
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
import { IllustrationEmptyStagiaires } from '@/components/ui/Illustrations'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { cn } from '@/lib/utils'

// Statuts d'inscription avec couleurs
const STATUTS_INSCRIPTION: Record<StatutInscription, { label: string; color: string }> = {
  EN_ATTENTE: { label: 'En attente', color: '#F59E0B' },
  CONFIRMEE: { label: 'Confirmée', color: 'var(--color-success)' },
  EN_COURS: { label: 'En cours', color: '#3B82F6' },
  COMPLETEE: { label: 'Complétée', color: '#10B981' },
  ANNULEE: { label: 'Annulée', color: '#EF4444' },
  REMBOURSEE: { label: 'Remboursée', color: '#F97316' },
  NO_SHOW: { label: 'Absent', color: '#DC2626' },
}

// Statuts de paiement avec couleurs
const PAIEMENT_STATUTS: Record<PaiementStatut, { label: string; color: string }> = {
  EN_ATTENTE: { label: 'En attente', color: '#F59E0B' },
  ACOMPTE: { label: 'Acompte', color: '#8B5CF6' },
  PARTIEL: { label: 'Partiel', color: '#F59E0B' },
  PAYE: { label: 'Payé', color: 'var(--color-success)' },
  REMBOURSE: { label: 'Remboursé', color: '#6B7280' },
  LITIGE: { label: 'Litige', color: '#EF4444' },
}

// Types étendus avec relations
type InscriptionWithJoins = Inscription & {
  lead?: Lead
  session?: Session & {
    formation?: Formation
  }
}

export default function StagiairesPage() {
  const [search, setSearch] = useState('')
  const [statutFilter, setStatutFilter] = useState<StatutInscription | ''>('')
  const [formationFilter, setFormationFilter] = useState('')
  const [sessionFilter, setSessionFilter] = useState('')
  const [paiementFilter, setPaiementFilter] = useState<PaiementStatut | ''>('')
  const [activeTab, setActiveTab] = useState<'all' | 'alumni'>('all')
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState<'date' | 'nom' | 'formation' | 'statut'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const PER_PAGE = 20

  // Fetch inscriptions avec joins
  const { data, isLoading } = useQuery({
    queryKey: ['inscriptions', search, statutFilter, formationFilter, sessionFilter, paiementFilter, page, sortBy, sortOrder, activeTab],
    queryFn: async () => {
      const supabase = createClient()

      let query = supabase
        .from('inscriptions')
        .select(`
          *,
          lead:leads(id, prenom, nom, email, telephone, photo_url, statut),
          session:sessions(
            id,
            date_debut,
            date_fin,
            horaire_debut,
            horaire_fin,
            formation:formations(id, nom, categorie)
          )
        `)

      // Filtres
      if (activeTab === 'alumni') {
        query = query.eq('statut', 'COMPLETEE')
      }

      if (statutFilter) {
        query = query.eq('statut', statutFilter)
      }

      if (paiementFilter) {
        query = query.eq('paiement_statut', paiementFilter)
      }

      if (formationFilter) {
        query = query.eq('session.formation.id', formationFilter)
      }

      if (sessionFilter) {
        query = query.eq('session_id', sessionFilter)
      }

      if (search) {
        query = query.or(`lead.prenom.ilike.%${search}%,lead.nom.ilike.%${search}%,lead.email.ilike.%${search}%`)
      }

      // Tri
      switch (sortBy) {
        case 'nom':
          query = query.order('lead.prenom', { ascending: sortOrder === 'asc' })
          break
        case 'formation':
          query = query.order('session.formation.nom', { ascending: sortOrder === 'asc' })
          break
        case 'statut':
          query = query.order('statut', { ascending: sortOrder === 'asc' })
          break
        default:
          query = query.order('created_at', { ascending: sortOrder === 'asc' })
      }

      // Pagination
      const start = (page - 1) * PER_PAGE
      query = query.range(start, start + PER_PAGE - 1)

      const { data: inscriptions, error, count } = await query

      if (error) throw error

      // Fetch formations pour les filtres
      const { data: formations } = await supabase
        .from('formations')
        .select('id, nom, categorie')
        .eq('is_active', true)
        .order('nom')

      // Fetch sessions pour les filtres
      const { data: sessions } = await supabase
        .from('sessions')
        .select('id, date_debut, formation:formations(nom)')
        .order('date_debut', { ascending: false })

      return {
        inscriptions: inscriptions as InscriptionWithJoins[],
        total: count || 0,
        formations: formations || [],
        sessions: sessions || []
      }
    },
  })

  const inscriptions = data?.inscriptions || []
  const total = data?.total || 0
  const formations = data?.formations || []
  const sessions = data?.sessions || []

  // Calcul des KPIs
  const totalInscrits = inscriptions.length
  const enCours = inscriptions.filter(i => i.statut === 'EN_COURS').length
  const completees = inscriptions.filter(i => i.statut === 'COMPLETEE').length
  const tauxPresenceMoyen = inscriptions
    .filter(i => i.taux_presence !== null)
    .reduce((acc, i) => acc + (i.taux_presence || 0), 0) /
    inscriptions.filter(i => i.taux_presence !== null).length || 0
  const satisfactionMoyenne = inscriptions
    .filter(i => i.note_satisfaction !== null)
    .reduce((acc, i) => acc + (i.note_satisfaction || 0), 0) /
    inscriptions.filter(i => i.note_satisfaction !== null).length || 0

  // Pagination
  const totalPages = Math.ceil(total / PER_PAGE)

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('asc')
    }
    setPage(1)
  }

  const SortableHeader = ({ column, children }: { column: typeof sortBy, children: React.ReactNode }) => (
    <th
      className="px-4 py-3 text-left text-xs font-semibold text-[#777777] uppercase tracking-wider cursor-pointer hover:bg-[#F5F5F5] transition-colors"
      onClick={() => handleSort(column)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortBy === column && (
          <span className="text-primary">
            {sortOrder === 'asc' ? '↑' : '↓'}
          </span>
        )}
      </div>
    </th>
  )

  const StarRating = ({ rating }: { rating: number }) => (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "w-3 h-3",
            i < rating ? "fill-amber-400 text-[#FF8C42]" : "text-[#EEEEEE]"
          )}
        />
      ))}
    </div>
  )

  const renderPresenceBar = (taux: number | null) => {
    if (!taux) return <span className="text-xs text-[#999999]">—</span>

    const color = taux >= 80 ? 'var(--color-success)' : taux >= 50 ? '#F59E0B' : '#EF4444'
    return (
      <div className="w-20">
        <ProgressBar
          value={taux}
          size="sm"
          showLabel
          color={color}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <PageHeader
          title="Stagiaires"
          description={`${total} inscriptions ${activeTab === 'alumni' ? 'complétées' : 'au total'}`}
        />
        <Button variant="outline" icon={<Download className="w-4 h-4" />}>
          Exporter
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <KpiCard
          icon={Users}
          label="Total inscrits"
          value={totalInscrits}
          color="var(--color-primary)"
        />
        <KpiCard
          icon={Clock}
          label="En formation"
          value={enCours}
          color="#F59E0B"
        />
        <KpiCard
          icon={Trophy}
          label="Complétées"
          value={completees}
          color="var(--color-success)"
        />
        <KpiCard
          icon={BookOpen}
          label="Taux présence"
          value={`${Math.round(tauxPresenceMoyen)}%`}
          color="#3B82F6"
        />
        <KpiCard
          icon={Star}
          label="Satisfaction"
          value={`${satisfactionMoyenne.toFixed(1)}/5`}
          color="#F59E0B"
        />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-[#F5F5F5] rounded-lg w-fit">
        <button
          className={cn(
            "px-3 py-2 rounded-md text-sm font-medium transition-colors",
            activeTab === 'all' ? "bg-white text-accent shadow-sm" : "text-[#777777] hover:text-[#111111]"
          )}
          onClick={() => { setActiveTab('all'); setPage(1) }}
        >
          Toutes les inscriptions
        </button>
        <button
          className={cn(
            "px-3 py-2 rounded-md text-sm font-medium transition-colors",
            activeTab === 'alumni' ? "bg-white text-accent shadow-sm" : "text-[#777777] hover:text-[#111111]"
          )}
          onClick={() => { setActiveTab('alumni'); setPage(1) }}
        >
          Alumni
        </button>
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

        {activeTab === 'all' && (
          <select
            value={statutFilter}
            onChange={(e) => { setStatutFilter(e.target.value as StatutInscription | ''); setPage(1) }}
            className="px-3 py-2 rounded-lg border border-[#F0F0F0] text-sm focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none bg-white"
          >
            <option value="">Tous les statuts</option>
            {Object.entries(STATUTS_INSCRIPTION).map(([value, { label }]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        )}

        <select
          value={formationFilter}
          onChange={(e) => { setFormationFilter(e.target.value); setPage(1) }}
          className="px-3 py-2 rounded-lg border border-[#F0F0F0] text-sm focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none bg-white"
        >
          <option value="">Toutes les formations</option>
          {formations.map(formation => (
            <option key={formation.id} value={formation.id}>{formation.nom}</option>
          ))}
        </select>

        <select
          value={sessionFilter}
          onChange={(e) => { setSessionFilter(e.target.value); setPage(1) }}
          className="px-3 py-2 rounded-lg border border-[#F0F0F0] text-sm focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none bg-white"
        >
          <option value="">Toutes les sessions</option>
          {sessions.map(session => (
            <option key={session.id} value={session.id}>
              {formatDate(session.date_debut, { day: 'numeric', month: 'short' })} - {(session.formation as unknown as {nom?: string})?.nom}
            </option>
          ))}
        </select>

        <select
          value={paiementFilter}
          onChange={(e) => { setPaiementFilter(e.target.value as PaiementStatut | ''); setPage(1) }}
          className="px-3 py-2 rounded-lg border border-[#F0F0F0] text-sm focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none bg-white"
        >
          <option value="">Tous les paiements</option>
          {Object.entries(PAIEMENT_STATUTS).map(([value, { label }]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <SkeletonTable rows={8} cols={9} />
      ) : (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#FAFAFA]/80 border-b border-[#F0F0F0]">
                  <SortableHeader column="nom">Stagiaire</SortableHeader>
                  <SortableHeader column="formation">Formation</SortableHeader>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#777777] uppercase tracking-wider">Session</th>
                  <SortableHeader column="statut">Statut</SortableHeader>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#777777] uppercase tracking-wider">Paiement</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#777777] uppercase tracking-wider">Présence</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#777777] uppercase tracking-wider">Satisfaction</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#777777] uppercase tracking-wider">Certificat</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#777777] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#FAFAFA]">
                {inscriptions.length === 0 ? (
                  <tr>
                    <td colSpan={9}>
                      <EmptyState
                        illustration={<IllustrationEmptyStagiaires size={120} />}
                        icon={<GraduationCap className="w-7 h-7" />}
                        title="Aucune inscription"
                        description={activeTab === 'alumni' ? 'Aucun alumni trouvé' : 'Aucune inscription trouvée'}
                      />
                    </td>
                  </tr>
                ) : inscriptions.map((inscription) => {
                  const lead = inscription.lead
                  const session = inscription.session
                  const formation = session?.formation
                  const statutInscription = STATUTS_INSCRIPTION[inscription.statut]
                  const paiementStatut = PAIEMENT_STATUTS[inscription.paiement_statut]

                  return (
                    <tr
                      key={inscription.id}
                      className="group hover:bg-primary/[0.02] transition-colors cursor-pointer"
                      onClick={() => window.open(`/lead/${lead?.id}`, '_blank')}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar
                            name={`${lead?.prenom} ${lead?.nom || ''}`}
                            src={lead?.photo_url}
                            size="sm"
                          />
                          <div>
                            <p className="font-medium text-accent">
                              {lead?.prenom} {lead?.nom || ''}
                            </p>
                            <p className="text-xs text-[#999999]">{lead?.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-[#3A3A3A] text-xs">{formation?.nom || '—'}</p>
                          <p className="text-[10px] text-[#999999]">{formation?.categorie}</p>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-xs">
                        {session ? (
                          <Link
                            href={`/session/${session.id}`}
                            className="text-primary hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <p>{formatDate(session.date_debut, { day: 'numeric', month: 'short' })}</p>
                            <p className="text-[#999999]">{session.horaire_debut} - {session.horaire_fin}</p>
                          </Link>
                        ) : <span className="text-[#999999]">—</span>}
                      </td>

                      <td className="px-4 py-3">
                        <StatusBadge
                          status={inscription.statut}
                          label={statutInscription.label}
                          color={statutInscription.color}
                        />
                      </td>

                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <p className="font-semibold text-[#3A3A3A] text-xs">
                            {formatEuro(inscription.montant_total)}
                          </p>
                          <StatusBadge
                            status={inscription.paiement_statut}
                            label={paiementStatut.label}
                            color={paiementStatut.color}
                          />
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        {renderPresenceBar(inscription.taux_presence ?? null)}
                      </td>

                      <td className="px-4 py-3">
                        {inscription.note_satisfaction ? (
                          <StarRating rating={inscription.note_satisfaction} />
                        ) : <span className="text-xs text-[#999999]">—</span>}
                      </td>

                      <td className="px-4 py-3">
                        {inscription.certificat_genere ? (
                          <div className="flex items-center gap-1 text-[#10B981]">
                            <CheckCircle2 className="w-4 h-4" />
                            <span className="text-xs font-medium">Généré</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-[#999999]">
                            <XCircle className="w-4 h-4" />
                            <span className="text-xs">Non généré</span>
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="sm"
                            variant="ghost"
                            icon={<Eye className="w-4 h-4" />}
                            onClick={(e) => {
                              e.stopPropagation()
                              window.open(`/lead/${lead?.id}`, '_blank')
                            }}
                          />
                          {inscription.certificat_genere && (
                            <Button
                              size="sm"
                              variant="ghost"
                              icon={<FileText className="w-4 h-4" />}
                              onClick={(e) => {
                                e.stopPropagation()
                                // Action pour télécharger le certificat
                              }}
                            />
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            icon={<ExternalLink className="w-4 h-4" />}
                            onClick={(e) => {
                              e.stopPropagation()
                              // Action pour ouvrir le portail
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-[#777777]">
            Page {page} sur {totalPages} ({total} inscriptions)
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              icon={<ChevronLeft className="w-4 h-4" />}
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            />
            <Button
              variant="outline"
              size="sm"
              icon={<ChevronRight className="w-4 h-4" />}
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
            />
          </div>
        </div>
      )}
    </div>
  )
}