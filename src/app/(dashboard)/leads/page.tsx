'use client'

export const dynamic = 'force-dynamic'

import { useState, useCallback, useMemo, Suspense } from 'react'
import { useTranslations } from 'next-intl'
import { useLeads, useChangeStatut } from '@/hooks/use-leads'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useQueryClient } from '@tanstack/react-query'
import { STATUTS_LEAD, type StatutLead } from '@/types'
import { Plus, Phone, Mail, MessageCircle, Download, Filter, ArrowUpDown, ChevronLeft, ChevronRight, Users, CheckSquare, UserPlus, Tag, Trash2, X, Upload, Flame, Clock, Calendar, Wallet, AlertTriangle, UserCheck, GraduationCap, SortAsc, SortDesc, ChevronDown } from 'lucide-react'
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
import { IllustrationEmptyLeads } from '@/components/ui/Illustrations'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { cn } from '@/lib/utils'
import { getRoleView } from '@/lib/role-config'
import { exportToCSV } from '@/lib/export-csv'
import { ExportButton } from '@/components/ui/ExportButton'
import type { ColumnDef } from '@/lib/export-data'
import { SourceBadge, SOURCE_CONFIG } from '@/components/ui/SourceBadge'
import { ScoreChip } from '@/components/ui/ScoreChip'
import { FilterDropdown, FilterOption } from '@/components/ui/FilterDropdown'
import { getScoreColor } from '@/lib/scoring'
import { FORMATIONS_SEED } from '@/lib/constants'
import type { SourceLead } from '@/types'
import { ImportCSVDialog } from '@/components/leads/ImportCSVDialog'
import { CreateLeadDialog } from '@/components/leads/CreateLeadDialog'

// Smart filter presets — scénarios les plus fréquents d'un commercial
type SmartFilter = 'chauds' | 'aujourdhui' | 'stagnants' | 'financement' | 'priorite'

const SMART_FILTERS: { id: SmartFilter; label: string; icon: React.ElementType; color: string; tooltip: string }[] = [
  { id: 'chauds', label: 'Chauds', icon: Flame, color: '#EF4444', tooltip: 'Score ≥ 60 — prêts à convertir' },
  { id: 'aujourdhui', label: "Aujourd'hui", icon: Calendar, color: '#8B5CF6', tooltip: 'Créés aujourd\'hui' },
  { id: 'stagnants', label: 'Stagnants', icon: Clock, color: '#F59E0B', tooltip: 'Pas de contact depuis 7+ jours' },
  { id: 'financement', label: 'Financement', icon: Wallet, color: '#06B6D4', tooltip: 'Financement souhaité' },
  { id: 'priorite', label: 'Urgents', icon: AlertTriangle, color: '#EF4444', tooltip: 'Priorité urgente ou haute' },
]

const SORT_OPTIONS = [
  { value: 'created_at:desc', label: 'Plus récents' },
  { value: 'created_at:asc', label: 'Plus anciens' },
  { value: 'score_chaud:desc', label: 'Score ↓' },
  { value: 'score_chaud:asc', label: 'Score ↑' },
  { value: 'date_dernier_contact:asc', label: 'Dernier contact ↑ (stagnants)' },
  { value: 'nom:asc', label: 'Nom A→Z' },
]

// Catégories de formations pour le filtre groupé
const FORMATION_CATEGORIES = [...new Set(FORMATIONS_SEED.map(f => f.categorie))]

// Colonnes pour l'export CSV/PDF
const LEADS_EXPORT_COLUMNS: ColumnDef[] = [
  { header: 'Nom', accessor: 'nom', width: 1.2 },
  { header: 'Prénom', accessor: 'prenom', width: 1.2 },
  { header: 'Email', accessor: 'email', width: 1.5 },
  { header: 'Téléphone', accessor: (r) => r.telephone || '', width: 1.2 },
  { header: 'Entreprise', accessor: (r) => r.entreprise || '', width: 1.2 },
  { header: 'Statut', accessor: 'statut', width: 1 },
  { header: 'Score', accessor: (r) => String(r.score_chaud ?? ''), width: 0.6 },
  { header: 'Source', accessor: (r) => r.source || '', width: 1 },
  { header: 'Date', accessor: (r) => r.created_at ? new Date(r.created_at).toLocaleDateString('fr-FR') : '', width: 1 },
]

export default function LeadsPage() {
  const t = useTranslations('leads')
  const tc = useTranslations('common')
  const { data: currentUser } = useCurrentUser()
  const [search, setSearch] = useState('')
  const [statutFilter, setStatutFilter] = useState<StatutLead[]>([])
  const [sourceFilter, setSourceFilter] = useState<SourceLead[]>([])
  const [formationFilter, setFormationFilter] = useState('')
  const [smartFilter, setSmartFilter] = useState<SmartFilter | null>(null)
  const [sortBy, setSortBy] = useState('created_at:desc')
  // Commercial voit "Mes leads" par défaut (gouvernance rôle)
  const roleView = getRoleView(currentUser?.role || 'admin')
  const [showMyLeads, setShowMyLeads] = useState(roleView.filterByCommercial)
  const [page, setPage] = useState(1)
  const [showCreate, setShowCreate] = useState(false)
  const [showCsvImport, setShowCsvImport] = useState(false)
  const [showSortMenu, setShowSortMenu] = useState(false)
  const changeStatut = useChangeStatut()
  const queryClient = useQueryClient()
  const isAdminOrManager = currentUser?.isAdmin || currentUser?.role === 'manager'

  // Form state pour nouveau lead — géré par CreateLeadDialog

  // Construire les filtres à partir du smart filter actif + filtres avancés
  const [sort_field, sort_dir] = sortBy.split(':') as [string, 'asc' | 'desc']
  const today = new Date().toISOString().split('T')[0]

  const computedFilters = useMemo(() => {
    const f: Record<string, any> = {
      search: search || undefined,
      statut: statutFilter.length ? statutFilter : undefined,
      source: sourceFilter.length ? sourceFilter[0] as SourceLead : undefined,
      formation_id: formationFilter || undefined,
      commercial_id: showMyLeads && isAdminOrManager && currentUser?.equipe_id ? currentUser.equipe_id : undefined,
      sort_by: sort_field,
      sort_order: sort_dir,
      page,
      per_page: 20,
    }
    // Smart filter overrides
    if (smartFilter === 'chauds') f.score_min = 60
    if (smartFilter === 'aujourdhui') f.date_from = today
    if (smartFilter === 'stagnants') {
      f.statut = ['NOUVEAU', 'CONTACTE', 'QUALIFIE'] as StatutLead[]
      f.sort_by = 'date_dernier_contact'
      f.sort_order = 'asc'
    }
    if (smartFilter === 'financement') f.financement = true
    if (smartFilter === 'priorite') f.priorite = 'URGENTE'
    return f
  }, [search, statutFilter, sourceFilter, formationFilter, smartFilter, sort_field, sort_dir, page, showMyLeads, isAdminOrManager, currentUser?.equipe_id, today])

  const { data, isLoading } = useLeads(computedFilters)

  // Compteurs pour les smart chips (utilise les données chargées — pas de requêtes supplémentaires)
  const smartCounts = useMemo(() => {
    if (!data?.leads) return {}
    const all = data.leads
    return {
      chauds: all.filter(l => l.score_chaud >= 60).length,
      stagnants: all.filter(l => {
        if (!['NOUVEAU', 'CONTACTE', 'QUALIFIE'].includes(l.statut)) return false
        const ref = l.date_dernier_contact || l.created_at
        return (Date.now() - new Date(ref).getTime()) / 86400000 > 7
      }).length,
      financement: all.filter(l => l.financement_souhaite).length,
    }
  }, [data?.leads])

  const hasAnyFilter = statutFilter.length > 0 || sourceFilter.length > 0 || formationFilter || smartFilter || search

  const clearAllFilters = useCallback(() => {
    setStatutFilter([])
    setSourceFilter([])
    setFormationFilter('')
    setSmartFilter(null)
    setSearch('')
    setPage(1)
  }, [])

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkStatut, setBulkStatut] = useState<string>('')

  const allLeadIds = useMemo(() => data?.leads.map(l => l.id) || [], [data?.leads])
  const allSelected = allLeadIds.length > 0 && allLeadIds.every(id => selectedIds.has(id))
  const someSelected = selectedIds.size > 0

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const toggleAll = useCallback(() => {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(allLeadIds))
    }
  }, [allSelected, allLeadIds])

  const clearSelection = useCallback(() => setSelectedIds(new Set()), [])

  // handleCreateLead est désormais dans CreateLeadDialog

  return (
    <div className="space-y-5">
      {/* Header */}
      <PageHeader
        title="Prospects"
        description={<span><span className="count-up tabular-nums">{data?.total || 0}</span> prospects au total</span>}
      >
        <Button
          variant="outline"
          size="sm"
          icon={<Upload className="w-3.5 h-3.5" />}
          onClick={() => setShowCsvImport(true)}
        >
          Importer CSV
        </Button>
        <ExportButton
          data={data?.leads || []}
          columns={LEADS_EXPORT_COLUMNS}
          filename="leads"
          title="Prospects — CRM Dermotec"
        />
        <Button
          size="sm"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => setShowCreate(true)}
        >
          Nouveau prospect
        </Button>
      </PageHeader>

      {/* ===== FILTRAGE 3 NIVEAUX ===== */}
      <div className="space-y-3">
        {/* Niveau 0 : Recherche + Mes leads + Tri */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex-1 min-w-[200px] sm:max-w-md">
            <SearchInput
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Rechercher (nom, email, téléphone...)"
            />
          </div>
          {isAdminOrManager && (
            <button
              onClick={() => { setShowMyLeads(p => !p); setPage(1) }}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition whitespace-nowrap border',
                showMyLeads
                  ? 'bg-primary/10 text-primary border-primary/30'
                  : 'bg-white text-[#777777] border-[#EEEEEE] hover:bg-[#FAF8F5]'
              )}
            >
              <UserCheck className="w-3.5 h-3.5" />
              {showMyLeads ? 'Mes leads' : 'Tous'}
            </button>
          )}
          {/* Tri */}
          <div className="relative">
            <button
              onClick={() => setShowSortMenu(p => !p)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition border bg-white text-[#777777] border-[#EEEEEE] hover:bg-[#FAF8F5] whitespace-nowrap"
            >
              {sort_dir === 'desc' ? <SortDesc className="w-3.5 h-3.5" /> : <SortAsc className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{SORT_OPTIONS.find(s => s.value === sortBy)?.label || 'Trier'}</span>
              <ChevronDown className="w-3 h-3 text-[#999999]" />
            </button>
            {showSortMenu && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowSortMenu(false)} />
                <div className="absolute right-0 top-full mt-1 z-40 bg-white rounded-xl shadow-xl border border-[#F4F0EB] py-1 min-w-[220px] animate-fadeIn">
                  {SORT_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => { setSortBy(opt.value); setShowSortMenu(false); setPage(1) }}
                      className={cn(
                        'w-full flex items-center gap-2 px-3 py-2 text-xs transition hover:bg-[#FAF8F5] text-left',
                        sortBy === opt.value && 'text-primary font-medium bg-primary/5'
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Niveau 1 : Smart Chips — scénarios 1 clic */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
          {SMART_FILTERS.map(sf => {
            const Icon = sf.icon
            const isActive = smartFilter === sf.id
            const count = (smartCounts as any)[sf.id]
            return (
              <button
                key={sf.id}
                onClick={() => { setSmartFilter(isActive ? null : sf.id); setPage(1) }}
                title={sf.tooltip}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition whitespace-nowrap border shrink-0',
                  isActive
                    ? 'text-white border-transparent shadow-sm'
                    : 'bg-white text-[#777777] border-[#EEEEEE] hover:border-[#EEEEEE]'
                )}
                style={isActive ? { backgroundColor: sf.color } : undefined}
              >
                <Icon className="w-3.5 h-3.5" />
                {sf.label}
                {count !== undefined && count > 0 && !isActive && (
                  <span className="min-w-[16px] h-4 rounded-full bg-[#F4F0EB] text-[#777777] text-[10px] flex items-center justify-center bounce-badge count-up tabular-nums">{count}</span>
                )}
              </button>
            )
          })}
        </div>

        {/* Niveau 2 : Filtres avancés — dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Statut */}
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

          {/* Source */}
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

          {/* Formation */}
          <FilterDropdown
            label="Formation"
            icon={GraduationCap}
            activeCount={formationFilter ? 1 : undefined}
            onClear={() => { setFormationFilter(''); setPage(1) }}
          >
            {FORMATION_CATEGORIES.map(cat => (
              <div key={cat}>
                <div className="px-3 py-1.5 text-[10px] font-semibold text-[#999999] uppercase tracking-wider">{cat}</div>
                {FORMATIONS_SEED.filter(f => f.categorie === cat).map(f => (
                  <FilterOption
                    key={f.slug}
                    selected={formationFilter === f.slug}
                    onClick={() => {
                      setFormationFilter(prev => prev === f.slug ? '' : f.slug)
                      setPage(1)
                    }}
                  >
                    <span className="flex items-center justify-between w-full">
                      <span className="truncate">{f.nom}</span>
                      <span className="text-[10px] text-[#999999] ml-2 shrink-0">{f.prix_ht}€</span>
                    </span>
                  </FilterOption>
                ))}
              </div>
            ))}
          </FilterDropdown>

          {/* Résumé filtres actifs + Clear */}
          {hasAnyFilter && (
            <button
              onClick={clearAllFilters}
              className="flex items-center gap-1 text-xs text-[#999999] hover:text-[#FF2D78] transition px-2"
            >
              <X className="w-3 h-3" />
              Tout effacer
            </button>
          )}
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {someSelected && (
        <div className="flex items-center gap-3 bg-slate-900 text-white rounded-xl px-4 py-3 animate-in slide-in-from-bottom-2">
          <CheckSquare className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium"><span className="count-up tabular-nums">{selectedIds.size}</span> sélectionné{selectedIds.size > 1 ? 's' : ''}</span>
          <div className="flex-1" />
          <select
            value={bulkStatut}
            onChange={(e) => setBulkStatut(e.target.value)}
            className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-sm text-white"
          >
            <option value="">Changer statut...</option>
            {Object.entries(STATUTS_LEAD).map(([key, val]) => (
              <option key={key} value={key} className="text-[#111111]">{val.label}</option>
            ))}
          </select>
          <button
            onClick={async () => {
              if (!bulkStatut) { toast.error('Sélectionnez un statut'); return }
              const target = bulkStatut as StatutLead
              let success = 0, errors = 0
              for (const id of selectedIds) {
                try {
                  await changeStatut.mutateAsync({ id, statut: target })
                  success++
                } catch {
                  errors++
                }
              }
              if (success > 0) toast.success(`${success} lead${success > 1 ? 's' : ''} → ${STATUTS_LEAD[target]?.label}`)
              if (errors > 0) toast.error(`${errors} transition${errors > 1 ? 's' : ''} invalide${errors > 1 ? 's' : ''}`)
              clearSelection()
              setBulkStatut('')
            }}
            className="px-3 py-1.5 bg-primary rounded-lg text-sm font-medium hover:bg-primary/80 transition"
            disabled={!bulkStatut || changeStatut.isPending}
          >
            {changeStatut.isPending ? 'En cours...' : 'Appliquer'}
          </button>
          <button
            onClick={() => {
              if (!data?.leads) return
              const selectedLeads = data.leads.filter(l => selectedIds.has(l.id))
              exportToCSV(selectedLeads as unknown as Record<string, unknown>[], `leads-selection-${new Date().toISOString().split('T')[0]}`)
              toast.success(`${selectedLeads.length} prospects exportés`)
              clearSelection()
            }}
            className="p-1.5 hover:bg-white/10 rounded-lg transition"
            title="Exporter la sélection"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={clearSelection}
            className="p-1.5 hover:bg-white/10 rounded-lg transition"
            title="Désélectionner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Mobile Card View */}
      {!isLoading && data?.leads && data.leads.length > 0 && (
        <div className={cn("md:hidden mobile-card-stack", smartFilter && 'filter-reveal-stagger')}>
          {data.leads.map((lead) => {
            const statut = STATUTS_LEAD[lead.statut]
            return (
              <Link key={lead.id} href={`/lead/${lead.id}`} className={cn("block bg-white rounded-xl border border-[#F4F0EB] p-4 haptic-press active:bg-[#FAF8F5] transition hover-row", lead.score_chaud >= 80 && 'row-hot glow-hot', lead.score_chaud >= 60 && lead.score_chaud < 80 && 'row-hot')}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative flex-shrink-0">
                      <Avatar name={`${lead.prenom} ${lead.nom}`} size="sm" />
                      <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white" style={{ backgroundColor: getScoreColor(lead.score_chaud) }} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-text truncate">{lead.prenom} {lead.nom}</p>
                      <p className="text-xs text-[#999999] truncate">{lead.formation_principale?.nom || lead.statut_pro?.replace(/_/g, ' ') || '—'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <ScoreChip score={lead.score_chaud} />
                    <StatusBadge status={lead.statut} label={statut.label} color={statut.color} />
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[#FAF8F5]">
                  {lead.telephone && (
                    <a href={`tel:${lead.telephone}`} onClick={e => e.stopPropagation()} className="flex items-center gap-1.5 text-xs text-[#777777] hover:text-primary">
                      <Phone className="w-3.5 h-3.5" /> {lead.telephone}
                    </a>
                  )}
                  {lead.email && (
                    <a href={`mailto:${lead.email}`} onClick={e => e.stopPropagation()} className="flex items-center gap-1.5 text-xs text-[#777777] hover:text-primary truncate">
                      <Mail className="w-3.5 h-3.5" /> <span className="truncate">{lead.email}</span>
                    </a>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* Desktop Table */}
      {isLoading ? (
        <SkeletonTable rows={8} cols={6} />
      ) : (
        <Card padding="none" className="hidden md:block">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#FAF8F5]/80 border-b border-[#F4F0EB]">
                  <th className="w-10 px-3 py-3">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      className="w-4 h-4 rounded border-[#EEEEEE] text-primary focus:ring-primary cursor-pointer"
                    />
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button className="flex items-center gap-1.5 text-xs font-semibold text-[#777777] uppercase tracking-wider hover:text-[#3A3A3A] transition">
                      Lead
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#777777] uppercase tracking-wider">Contact</th>
                  <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-semibold text-[#777777] uppercase tracking-wider">Formation</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#777777] uppercase tracking-wider">Statut</th>
                  <th className="hidden lg:table-cell px-4 py-3 text-left text-xs font-semibold text-[#777777] uppercase tracking-wider">Source</th>
                  <th className="hidden sm:table-cell px-4 py-3 text-left">
                    <button className="flex items-center gap-1.5 text-xs font-semibold text-[#777777] uppercase tracking-wider hover:text-[#3A3A3A] transition">
                      Score
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="hidden lg:table-cell px-4 py-3 text-left text-xs font-semibold text-[#777777] uppercase tracking-wider">Activité</th>
                  <th className="px-2 py-3 text-left text-xs font-semibold text-[#777777] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className={cn("divide-y divide-[#FAF8F5]", smartFilter && 'filter-reveal-stagger')}>
                {data?.leads.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <EmptyState
                        illustration={<IllustrationEmptyLeads size={140} />}
                        title={hasAnyFilter ? 'Aucun lead trouvé' : 'Commencez ici'}
                        description={hasAnyFilter
                          ? 'Modifiez vos filtres ou essayez un autre terme de recherche'
                          : 'Ajoutez votre premier prospect pour démarrer votre pipeline commercial'
                        }
                        action={!hasAnyFilter ? {
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
                      className={cn(
                        "group hover:bg-primary/[0.02] transition-colors cursor-pointer hover-row",
                        selectedIds.has(lead.id) && "bg-primary/[0.05]",
                        lead.score_chaud >= 80 && 'row-hot glow-hot',
                        lead.score_chaud >= 60 && lead.score_chaud < 80 && 'row-hot'
                      )}
                    >
                      <td className="w-10 px-3 py-3" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(lead.id)}
                          onChange={() => toggleSelect(lead.id)}
                          className="w-4 h-4 rounded border-[#EEEEEE] text-primary focus:ring-primary cursor-pointer"
                        />
                      </td>
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
                            <p className="font-medium text-text truncate group-hover:text-primary transition">{lead.prenom} {lead.nom}</p>
                            <p className="text-[11px] text-[#999999] truncate">
                              {lead.statut_pro?.replace(/_/g, ' ') || '—'}
                              {lead.financement_souhaite && <span className="ml-1 text-primary" title="Financement souhaité">F</span>}
                            </p>
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {lead.telephone && (
                            <a
                              href={`tel:${lead.telephone}`}
                              className="p-2 sm:p-1.5 rounded-md hover:bg-[#E0EBF5] text-[#999999] hover:text-[#6B8CAE] transition"
                              title={lead.telephone}
                              onClick={e => e.stopPropagation()}
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {lead.email && (
                            <a
                              href={`mailto:${lead.email}`}
                              className="p-2 sm:p-1.5 rounded-md hover:bg-[#E0EBF5] text-[#999999] hover:text-[#6B8CAE] transition"
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
                              className="p-2 sm:p-1.5 rounded-md hover:bg-[#ECFDF5] text-[#999999] hover:text-[#10B981] transition"
                              onClick={e => e.stopPropagation()}
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="hidden md:table-cell px-4 py-3">
                        <span className="text-xs text-[#777777] truncate block max-w-[160px]">
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
                        {(() => {
                          const ref = lead.date_dernier_contact || lead.created_at
                          const d = Math.floor((Date.now() - new Date(ref).getTime()) / 86400000)
                          const isStale = d > 7 && ['NOUVEAU', 'CONTACTE', 'QUALIFIE'].includes(lead.statut)
                          const label = lead.date_dernier_contact ? 'Contact' : 'Cree'
                          return (
                            <div>
                              <span className={cn(
                                'text-xs whitespace-nowrap block',
                                isStale ? 'text-[#FF2D78] font-medium' : 'text-[#777777]'
                              )}>
                                {d === 0 ? "Aujourd'hui" : d === 1 ? 'Hier' : `il y a ${d}j`}
                              </span>
                              <span className="text-[10px] text-[#999999]">
                                {label} {new Date(ref).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                              </span>
                            </div>
                          )
                        })()}
                      </td>

                      {/* Actions rapides */}
                      <td className="px-2 py-3">
                        <div className="flex items-center gap-1">
                          {lead.telephone && (
                            <a
                              href={`tel:${lead.telephone.replace(/[\s.-]/g, '').replace(/^0/, '+33')}`}
                              onClick={e => e.stopPropagation()}
                              className="p-1.5 rounded-lg hover:bg-[#E0EBF5] text-[#999999] hover:text-[#6B8CAE] transition-colors"
                              title="Appeler"
                            >
                              <Phone size={14} />
                            </a>
                          )}
                          {lead.email && (
                            <a
                              href={`mailto:${lead.email}`}
                              onClick={e => e.stopPropagation()}
                              className="p-1.5 rounded-lg hover:bg-[#FFE0EF] text-[#999999] hover:text-[#FF2D78] transition-colors"
                              title="Email"
                            >
                              <Mail size={14} />
                            </a>
                          )}
                          {lead.telephone && (
                            <a
                              href={`https://wa.me/${lead.telephone.replace(/[\s.+-]/g, '').replace(/^0/, '33')}`}
                              onClick={e => e.stopPropagation()}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg hover:bg-[#ECFDF5] text-[#999999] hover:text-[#10B981] transition-colors"
                              title="WhatsApp"
                            >
                              <MessageCircle size={14} />
                            </a>
                          )}
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
            <div className="flex items-center justify-between px-4 py-3 border-t border-[#F4F0EB]">
              <p className="text-xs text-[#777777]">
                Page <span className="font-medium text-[#3A3A3A] count-up tabular-nums">{data.page}</span> sur <span className="tabular-nums">{data.total_pages}</span>
                <span className="text-[#999999] mx-1">·</span>
                <span className="count-up tabular-nums">{data.total}</span> leads
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
                            ? 'bg-primary text-white shadow-sm'
                            : 'text-[#777777] hover:bg-[#F4F0EB]'
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

      {/* Dialog import CSV — multi-step avec API server-side */}
      <ImportCSVDialog
        open={showCsvImport}
        onClose={() => setShowCsvImport(false)}
        onImported={(count) => {
          queryClient.invalidateQueries({ queryKey: ['leads'] })
          setShowCsvImport(false)
        }}
      />

      {/* Dialog création lead */}
      <CreateLeadDialog open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  )
}
