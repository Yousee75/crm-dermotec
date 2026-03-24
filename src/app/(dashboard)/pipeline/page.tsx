'use client'

export const dynamic = 'force-dynamic'

import { useState, Suspense } from 'react'
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors, DragOverlay, DragOverEvent, useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Search, Users, Euro, TrendingUp, GripVertical, Phone, Mail, Eye, List, X, ExternalLink, Calendar, MapPin, UserCheck } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { useLeads, useChangeStatut } from '@/hooks/use-leads'
import { PHASES_PIPELINE, STATUTS_LEAD } from '@/types'
import type { Lead, StatutLead } from '@/types'
import { formatEuro, formatDateShort, daysBetween, getInitials } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/components/ui/PageHeader'
import { SearchInput } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { useCurrentUser } from '@/hooks/use-current-user'
import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton'
import Link from 'next/link'

// --- Component: Lead Card (Draggable) ---
function DraggableLeadCard({ lead, onLeadClick }: { lead: Lead; onLeadClick?: (lead: Lead) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={cn(
        "bg-white p-3 rounded-xl border border-[#F4F0EB] shadow-card",
        "hover:shadow-md hover:border-[#EEEEEE] transition-all duration-150",
        "relative group/drag card-interactive",
        isDragging && "opacity-70 shadow-none",
        lead.score_chaud >= 80 && "glow-hot"
      )}
    >
      {/* Zone de drag : le grip handle */}
      <div
        {...listeners}
        className="absolute top-0 left-0 bottom-0 w-6 cursor-grab active:cursor-grabbing flex items-center justify-center opacity-0 group-hover/drag:opacity-100 transition-opacity"
      >
        <GripVertical className="w-4 h-4 text-[#999999]" />
      </div>

      {/* Clic sur la card = ouvrir le panel */}
      <div
        className="cursor-pointer"
        onClick={() => onLeadClick?.(lead)}
      >
        <LeadCard lead={lead} />
      </div>
    </div>
  )
}

// --- Component: Lead Card Content ---
function LeadCard({ lead }: { lead: Lead }) {
  const daysSinceCreated = daysBetween(lead.created_at, new Date())

  return (
    <div className="space-y-2.5">
      {/* Header: avatar + nom + score */}
      <div className="flex items-center justify-between gap-2 pl-5">
        <div className="flex items-center gap-2 min-w-0">
          <Avatar
            name={lead.commercial_assigne ? `${lead.commercial_assigne.prenom} ${lead.commercial_assigne.nom}` : '?'}
            size="xs"
            color={lead.commercial_assigne?.avatar_color}
          />
          <Link
            href={`/lead/${lead.id}`}
            className="font-medium text-[#111111] text-sm truncate hover:text-primary transition"
            onClick={e => e.stopPropagation()}
          >
            {lead.prenom} {lead.nom}
          </Link>
        </div>
        <div className="shrink-0">
          <div className={cn(
            "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold",
            lead.score_chaud >= 70 ? "bg-[#D1FAE5] text-[#10B981]" :
            lead.score_chaud >= 40 ? "bg-[#FFF3E8] text-[#FF8C42]" : "bg-[#F4F0EB] text-[#777777]"
          )}>
            {lead.score_chaud}
          </div>
        </div>
      </div>

      {/* Formation */}
      {lead.formation_principale && (
        <p className="text-xs text-[#777777] truncate pl-5">
          {lead.formation_principale.nom}
        </p>
      )}

      {/* Footer: source + jours + quick actions */}
      <div className="flex items-center justify-between text-xs pl-5">
        <div className="flex items-center gap-2 text-[#999999]">
          <span className="capitalize">{lead.source.replace('_', ' ')}</span>
          <span className="text-[#999999]">·</span>
          <span>{daysSinceCreated}j</span>
        </div>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition">
          {lead.telephone && (
            <a
              href={`tel:${lead.telephone}`}
              className="p-1 rounded hover:bg-[#E0EBF5] text-[#999999] hover:text-[#6B8CAE] transition"
              onClick={e => e.stopPropagation()}
            >
              <Phone className="w-3 h-3" />
            </a>
          )}
          {lead.email && (
            <a
              href={`mailto:${lead.email}`}
              className="p-1 rounded hover:bg-[#E0EBF5] text-[#999999] hover:text-[#6B8CAE] transition"
              onClick={e => e.stopPropagation()}
            >
              <Mail className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

// --- Component: Pipeline Column (with useDroppable) ---
function PipelineColumn({ phase, leads, totalValue, isDropTarget, onLeadClick }: {
  phase: typeof PHASES_PIPELINE[0]
  leads: Lead[]
  totalValue: number
  isDropTarget?: boolean
  onLeadClick?: (lead: Lead) => void
}) {
  const primaryStatut = phase.statuts[0]
  const statutConfig = STATUTS_LEAD[primaryStatut]

  // FIX: useDroppable pour que la colonne soit un vrai drop target
  const { setNodeRef, isOver } = useDroppable({ id: phase.id })
  const isActive = isDropTarget || isOver

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex-shrink-0 w-[280px] flex flex-col transition-all duration-200 rounded-xl",
        isActive && "ring-2 ring-primary ring-offset-2 bg-[#E0EBF5]/50"
      )}
    >
      {/* Header */}
      <div className="bg-white rounded-xl border border-[#F4F0EB] shadow-card p-3.5 mb-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: statutConfig.color }}
            />
            <h3 className="font-semibold text-[#111111] text-sm">{phase.label}</h3>
          </div>
          <Badge variant="default" size="sm" className="count-up tabular-nums">{leads.length}</Badge>
        </div>
        {totalValue > 0 && (
          <div className="flex items-center gap-1 text-xs text-[#999999]">
            <Euro className="w-3 h-3" />
            {formatEuro(totalValue)}
          </div>
        )}
        {/* Progress indicator */}
        <div className="mt-2">
          <ProgressBar value={leads.length} max={Math.max(leads.length, 10)} size="sm" color={statutConfig.color} />
        </div>
      </div>

      {/* Cards */}
      <div className="flex-1 space-y-2 overflow-y-auto max-h-[calc(100dvh-320px)] pr-1 filter-reveal-stagger">
        <SortableContext items={leads.map(l => l.id)} strategy={verticalListSortingStrategy}>
          {leads.map(lead => (
            <div key={lead.id} className="group">
              <DraggableLeadCard lead={lead} onLeadClick={onLeadClick} />
            </div>
          ))}
        </SortableContext>
        {leads.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] flex items-center justify-center mb-2">
              <Users className="w-5 h-5 text-[#999999]" />
            </div>
            <p className="text-xs text-[#777777] font-medium mb-0.5">Colonne vide</p>
            <p className="text-[11px] text-[#999999]">Glissez un lead ici</p>
          </div>
        )}
      </div>
    </div>
  )
}

// --- Component: Mobile List View ---
function MobileListView({ leadsByPhase }: { leadsByPhase: Array<{ phase: { id: string; label: string; statuts: StatutLead[] }, leads: Lead[], totalValue: number }> }) {
  return (
    <div className="md:hidden space-y-4">
      <div className="flex items-center gap-2 text-sm text-[#777777] mb-4">
        <List className="w-4 h-4" />
        <span>Vue liste mobile</span>
      </div>
      {leadsByPhase.map(({ phase, leads }) => (
        <div key={phase.id} className="space-y-3">
          {leads.length > 0 && (
            <>
              <div className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: STATUTS_LEAD[phase.statuts[0]]?.color }}
                />
                <h3 className="font-semibold text-[#111111] text-sm">{phase.label}</h3>
                <Badge variant="default" size="sm">{leads.length}</Badge>
              </div>
              <div className="space-y-2 pl-4">
                {leads.map(lead => (
                  <div key={lead.id} className="bg-white p-3 rounded-lg border border-[#F4F0EB] shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Avatar
                          name={lead.commercial_assigne ? `${lead.commercial_assigne.prenom} ${lead.commercial_assigne.nom}` : '?'}
                          size="xs"
                          color={lead.commercial_assigne?.avatar_color}
                        />
                        <Link
                          href={`/lead/${lead.id}`}
                          className="font-medium text-[#111111] text-sm hover:text-primary transition"
                        >
                          {lead.prenom} {lead.nom}
                        </Link>
                      </div>
                      <Badge
                        variant={lead.score_chaud >= 70 ? 'success' : lead.score_chaud >= 40 ? 'warning' : 'default'}
                        size="sm"
                      >
                        {lead.score_chaud}
                      </Badge>
                    </div>
                    {lead.formation_principale && (
                      <p className="text-xs text-[#777777] mb-2">{lead.formation_principale.nom}</p>
                    )}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-[#999999]">
                        <span className="capitalize">{lead.source.replace('_', ' ')}</span>
                        <span>·</span>
                        <span>{daysBetween(lead.created_at, new Date())}j</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {lead.telephone && (
                          <a href={`tel:${lead.telephone}`} className="p-1 text-[#999999] hover:text-[#6B8CAE]">
                            <Phone className="w-3 h-3" />
                          </a>
                        )}
                        {lead.email && (
                          <a href={`mailto:${lead.email}`} className="p-1 text-[#999999] hover:text-[#6B8CAE]">
                            <Mail className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  )
}

// --- Component: Lead Slide-Over Panel ---
function LeadSlideOver({ lead, onClose }: { lead: Lead | null; onClose: () => void }) {
  if (!lead) return null

  const daysSinceCreated = daysBetween(lead.created_at, new Date())
  const statutConfig = STATUTS_LEAD[lead.statut]

  return (
    <AnimatePresence>
      {lead && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 z-40"
            onClick={onClose}
          />
          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-50 overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-[#F4F0EB] p-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <Avatar
                  name={`${lead.prenom} ${lead.nom}`}
                  size="md"
                />
                <div>
                  <h3 className="font-semibold text-accent">{lead.prenom} {lead.nom}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: statutConfig?.color || '#6B7280' }}
                    >
                      {statutConfig?.label || lead.statut}
                    </span>
                    <span className="text-xs text-[#999999]">{daysSinceCreated}j</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Link
                  href={`/lead/${lead.id}`}
                  className="p-2 rounded-lg hover:bg-[#F4F0EB] text-[#777777] hover:text-primary transition"
                  title="Ouvrir la fiche complète"
                >
                  <ExternalLink className="w-4 h-4" />
                </Link>
                <button onClick={onClose} className="p-2 rounded-lg hover:bg-[#F4F0EB] text-[#777777] transition">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Contact rapide */}
              <div className="flex gap-2">
                {lead.telephone && (
                  <a
                    href={`tel:${lead.telephone}`}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-[#ECFDF5] text-[#10B981] rounded-lg hover:bg-[#D1FAE5] transition text-sm font-medium"
                  >
                    <Phone className="w-4 h-4" />
                    Appeler
                  </a>
                )}
                {lead.email && (
                  <a
                    href={`mailto:${lead.email}`}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-[#E0EBF5] text-[#6B8CAE] rounded-lg hover:bg-[#E0EBF5] transition text-sm font-medium"
                  >
                    <Mail className="w-4 h-4" />
                    Email
                  </a>
                )}
                {lead.telephone && (
                  <a
                    href={`https://wa.me/${lead.telephone.replace(/\s/g, '')}`}
                    target="_blank"
                    rel="noopener"
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition text-sm font-medium"
                  >
                    WhatsApp
                  </a>
                )}
              </div>

              {/* Infos clés */}
              <div className="bg-[#FAF8F5] rounded-lg p-3 space-y-2">
                <h4 className="text-xs font-semibold text-[#777777] uppercase">Informations</h4>
                {lead.email && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#777777]">Email</span>
                    <span className="text-[#111111] font-medium">{lead.email}</span>
                  </div>
                )}
                {lead.telephone && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#777777]">Téléphone</span>
                    <span className="text-[#111111] font-medium">{lead.telephone}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#777777]">Source</span>
                  <span className="text-[#111111] font-medium capitalize">{lead.source.replace('_', ' ')}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#777777]">Score</span>
                  <span className={cn(
                    "font-bold",
                    lead.score_chaud >= 70 ? "text-[#10B981]" :
                    lead.score_chaud >= 40 ? "text-[#FF8C42]" : "text-[#777777]"
                  )}>
                    {lead.score_chaud}/100
                  </span>
                </div>
                {lead.commercial_assigne && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#777777]">Commercial</span>
                    <span className="text-[#111111] font-medium">
                      {lead.commercial_assigne.prenom} {lead.commercial_assigne.nom}
                    </span>
                  </div>
                )}
              </div>

              {/* Formation */}
              {lead.formation_principale && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                  <h4 className="text-xs font-semibold text-accent uppercase mb-1">Formation intéressée</h4>
                  <p className="text-sm font-medium text-accent">{lead.formation_principale.nom}</p>
                  {lead.formation_principale.prix_ht && (
                    <p className="text-xs text-[#777777] mt-0.5">{lead.formation_principale.prix_ht}€ HT</p>
                  )}
                </div>
              )}

              {/* Notes */}
              {lead.notes && (
                <div className="bg-[#FFF3E8] border border-amber-100 rounded-lg p-3">
                  <h4 className="text-xs font-semibold text-[#FF8C42] uppercase mb-1">Notes</h4>
                  <p className="text-sm text-[#3A3A3A]">{lead.notes}</p>
                </div>
              )}

              {/* Bouton fiche complète */}
              <Link
                href={`/lead/${lead.id}`}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-accent text-white rounded-lg hover:bg-accent-light transition font-medium text-sm"
              >
                <Eye className="w-4 h-4" />
                Voir la fiche complète
              </Link>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// --- Main Page ---
// Skeleton pour le pipeline Kanban
function PipelineSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-9 w-24" />
      </div>

      {/* Search et stats skeleton */}
      <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <Skeleton className="h-9 w-64" />
        <div className="flex gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="flex items-center gap-1.5">
              <Skeleton className="h-3 w-3 rounded" />
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-3 w-8" />
            </div>
          ))}
        </div>
      </div>

      {/* Kanban columns skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 min-h-[600px]">
        {[1,2,3,4,5].map(colIndex => (
          <div key={colIndex} className="bg-[#FAF8F5] rounded-xl p-3">
            {/* Column header */}
            <div className="flex items-center justify-between mb-3">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-5 w-8 rounded-full" />
            </div>
            <Skeleton className="h-3 w-16 mb-4" />

            {/* Cards skeleton */}
            <div className="space-y-2">
              {Array.from({ length: Math.floor(Math.random() * 4) + 1 }).map((_, cardIndex) => (
                <div key={cardIndex} className="bg-white p-3 rounded-xl border border-[#F4F0EB]">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-5 w-5 rounded-full" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-5 w-5 rounded-full" />
                  </div>
                  <Skeleton className="h-2 w-full mb-2" />
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-2 w-12" />
                    <div className="flex gap-1">
                      <Skeleton className="h-4 w-4" />
                      <Skeleton className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function PipelinePage() {
  const [search, setSearch] = useState('')
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null)
  const [activeDropColumn, setActiveDropColumn] = useState<string | null>(null)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [showMyLeadsOnly, setShowMyLeadsOnly] = useState(true)

  const { data: currentUser } = useCurrentUser()
  const isAdminOrManager = currentUser?.isAdmin || currentUser?.role === 'manager'

  // Si admin/manager + filtre "mes leads" actif → filtrer par commercial_id
  const commercialFilter = isAdminOrManager && showMyLeadsOnly && currentUser?.equipe_id
    ? currentUser.equipe_id
    : undefined

  const { data: leadsData, isLoading } = useLeads({ search, per_page: 1000, commercial_id: commercialFilter })
  const changeStatut = useChangeStatut()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const leadsByPhase = PHASES_PIPELINE.map(phase => {
    const phaseLeads = leadsData?.leads.filter(lead =>
      phase.statuts.includes(lead.statut)
    ) || []
    const totalValue = phaseLeads.reduce((sum, lead) => {
      const inscriptionValue = lead.inscriptions?.reduce((inscSum, insc) =>
        inscSum + insc.montant_total, 0) || 0
      return sum + inscriptionValue
    }, 0)
    return { phase, leads: phaseLeads, totalValue }
  })

  const handleDragStart = (event: any) => {
    const lead = leadsData?.leads.find(l => l.id === event.active.id)
    setDraggedLead(lead || null)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event
    if (over) {
      setActiveDropColumn(over.id as string)
    } else {
      setActiveDropColumn(null)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setDraggedLead(null)
    setActiveDropColumn(null)
    if (!over) return

    const leadId = active.id as string
    const overId = over.id as string

    // Trouver la phase cible : soit c'est la colonne directement, soit c'est un lead DANS une colonne
    let targetPhase = PHASES_PIPELINE.find(p => p.id === overId)
    if (!targetPhase) {
      // L'over est un lead, trouver dans quelle colonne il est
      const overLead = leadsData?.leads.find(l => l.id === overId)
      if (overLead) {
        targetPhase = PHASES_PIPELINE.find(p => p.statuts.includes(overLead.statut))
      }
    }
    if (!targetPhase) return

    const newStatut = targetPhase.statuts[0] as StatutLead
    const currentLead = leadsData?.leads.find(l => l.id === leadId)
    if (!currentLead || currentLead.statut === newStatut) return

    const previousStatut = currentLead.statut
    changeStatut.mutate({
      id: leadId,
      statut: newStatut,
      notes: `Déplacé vers ${targetPhase.label} depuis le pipeline`
    }, {
      onSuccess: () => {
        toast.success(`Lead déplacé vers ${targetPhase!.label}`, {
          description: `${currentLead.prenom} ${currentLead.nom} • ${STATUTS_LEAD[previousStatut]?.label || previousStatut} → ${targetPhase!.label}`,
        })
      },
      onError: () => {
        toast.error('Impossible de changer le statut', {
          description: 'Cette transition n\'est pas autorisée par le workflow',
        })
      }
    })
  }

  const totalLeads = leadsData?.leads.length || 0
  const totalValue = leadsByPhase.reduce((sum, { totalValue }) => sum + totalValue, 0)

  // Loading state
  if (isLoading) {
    return <PipelineSkeleton />
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <PageHeader
        title="Suivi commercial"
        description="Parcours prospect du premier contact à la formation"
      >
        <div className="flex items-center gap-4 text-sm text-[#777777]">
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            <span className="font-medium text-[#3A3A3A]">{totalLeads}</span> prospects
          </div>
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4" />
            <span className="font-medium text-[#3A3A3A]">{formatEuro(totalValue)}</span> CA
          </div>
        </div>
      </PageHeader>

      {/* Search + Filtre Mes leads */}
      <div className="flex items-center gap-3">
        <div className="max-w-sm flex-1">
          <SearchInput
            placeholder="Rechercher un prospect..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {isAdminOrManager && (
          <button
            onClick={() => setShowMyLeadsOnly(p => !p)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap',
              showMyLeadsOnly
                ? 'bg-primary/10 text-primary ring-1 ring-primary/30'
                : 'bg-[#F4F0EB] text-[#777777] hover:bg-[#EEEEEE]'
            )}
          >
            <UserCheck className="w-4 h-4" />
            {showMyLeadsOnly ? 'Mes leads' : 'Tous les leads'}
          </button>
        )}
      </div>

      {/* Desktop: Pipeline Columns */}
      <div className="hidden md:block">
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8">
            {leadsByPhase.map(({ phase, leads, totalValue }) => (
              <PipelineColumn
                key={phase.id}
                phase={phase}
                leads={leads}
                totalValue={totalValue}
                isDropTarget={activeDropColumn === phase.id}
                onLeadClick={(lead) => setSelectedLead(lead)}
              />
            ))}
          </div>

          <DragOverlay>
            {draggedLead && (
              <div className="bg-white p-3 rounded-xl shadow-xl border border-primary/20 opacity-95 w-[280px]">
                <LeadCard lead={draggedLead} />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Mobile: List View */}
      <MobileListView leadsByPhase={leadsByPhase} />

      {/* Lead Slide-Over Panel */}
      <LeadSlideOver lead={selectedLead} onClose={() => setSelectedLead(null)} />
    </div>
  )
}
