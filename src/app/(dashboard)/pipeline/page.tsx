'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors, DragOverlay, DragOverEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Search, Users, Euro, TrendingUp, GripVertical, Phone, Mail, Eye, Sparkles, List } from 'lucide-react'
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
import Link from 'next/link'

// --- Component: Lead Card (Draggable) ---
function DraggableLeadCard({ lead }: { lead: Lead }) {
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
      {...listeners}
      className={cn(
        "bg-white p-3 rounded-xl border border-gray-100 shadow-card cursor-grab",
        "hover:shadow-md hover:border-gray-200 transition-all duration-150",
        "active:cursor-grabbing active:shadow-lg active:scale-[1.02]",
        "relative group/drag",
        isDragging && "opacity-70 shadow-none"
      )}
    >
      <LeadCard lead={lead} />
    </div>
  )
}

// --- Component: Lead Card Content ---
function LeadCard({ lead }: { lead: Lead }) {
  const daysSinceCreated = daysBetween(lead.created_at, new Date())

  return (
    <div className="space-y-2.5">
      {/* Grip handle */}
      <div className="absolute top-3 left-1 opacity-0 group-hover/drag:opacity-100 transition-opacity">
        <GripVertical className="w-4 h-4 text-gray-300" />
      </div>

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
            className="font-medium text-gray-900 text-sm truncate hover:text-[#2EC6F3] transition"
            onClick={e => e.stopPropagation()}
          >
            {lead.prenom} {lead.nom}
          </Link>
        </div>
        <div className="shrink-0">
          <div className={cn(
            "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold",
            lead.score_chaud >= 70 ? "bg-green-100 text-green-700" :
            lead.score_chaud >= 40 ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600"
          )}>
            {lead.score_chaud}
          </div>
        </div>
      </div>

      {/* Formation */}
      {lead.formation_principale && (
        <p className="text-xs text-gray-500 truncate pl-5">
          {lead.formation_principale.nom}
        </p>
      )}

      {/* Footer: source + jours + quick actions */}
      <div className="flex items-center justify-between text-xs pl-5">
        <div className="flex items-center gap-2 text-gray-400">
          <span className="capitalize">{lead.source.replace('_', ' ')}</span>
          <span className="text-gray-300">·</span>
          <span>{daysSinceCreated}j</span>
        </div>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition">
          {lead.telephone && (
            <a
              href={`tel:${lead.telephone}`}
              className="p-1 rounded hover:bg-blue-50 text-gray-400 hover:text-blue-500 transition"
              onClick={e => e.stopPropagation()}
            >
              <Phone className="w-3 h-3" />
            </a>
          )}
          {lead.email && (
            <a
              href={`mailto:${lead.email}`}
              className="p-1 rounded hover:bg-blue-50 text-gray-400 hover:text-blue-500 transition"
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

// --- Component: Pipeline Column ---
function PipelineColumn({ phase, leads, totalValue, isDropTarget }: {
  phase: typeof PHASES_PIPELINE[0]
  leads: Lead[]
  totalValue: number
  isDropTarget?: boolean
}) {
  const primaryStatut = phase.statuts[0]
  const statutConfig = STATUTS_LEAD[primaryStatut]

  return (
    <div className={cn(
      "flex-shrink-0 w-[280px] flex flex-col transition-all duration-200",
      isDropTarget && "ring-2 ring-[#2EC6F3] ring-offset-2 bg-blue-50/50 rounded-xl"
    )}>
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-card p-3.5 mb-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: statutConfig.color }}
            />
            <h3 className="font-semibold text-gray-900 text-sm">{phase.label}</h3>
          </div>
          <Badge variant="default" size="sm">{leads.length}</Badge>
        </div>
        {totalValue > 0 && (
          <div className="flex items-center gap-1 text-xs text-gray-400">
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
      <div className="flex-1 space-y-2 overflow-y-auto max-h-[calc(100dvh-320px)] pr-1">
        <SortableContext items={leads.map(l => l.id)} strategy={verticalListSortingStrategy}>
          {leads.map(lead => (
            <div key={lead.id} className="group">
              <DraggableLeadCard lead={lead} />
            </div>
          ))}
        </SortableContext>
        {leads.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center mb-2">
              <Sparkles className="w-5 h-5 text-gray-300" />
            </div>
            <p className="text-xs text-gray-500 font-medium mb-0.5">Colonne vide</p>
            <p className="text-[11px] text-gray-400">Glissez un lead ici</p>
          </div>
        )}
      </div>
    </div>
  )
}

// --- Component: Mobile List View ---
function MobileListView({ leadsByPhase }: { leadsByPhase: Array<{ phase: any, leads: Lead[], totalValue: number }> }) {
  return (
    <div className="md:hidden space-y-4">
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
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
                <h3 className="font-semibold text-gray-900 text-sm">{phase.label}</h3>
                <Badge variant="default" size="sm">{leads.length}</Badge>
              </div>
              <div className="space-y-2 pl-4">
                {leads.map(lead => (
                  <div key={lead.id} className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Avatar
                          name={lead.commercial_assigne ? `${lead.commercial_assigne.prenom} ${lead.commercial_assigne.nom}` : '?'}
                          size="xs"
                          color={lead.commercial_assigne?.avatar_color}
                        />
                        <Link
                          href={`/lead/${lead.id}`}
                          className="font-medium text-gray-900 text-sm hover:text-[#2EC6F3] transition"
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
                      <p className="text-xs text-gray-500 mb-2">{lead.formation_principale.nom}</p>
                    )}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-gray-400">
                        <span className="capitalize">{lead.source.replace('_', ' ')}</span>
                        <span>·</span>
                        <span>{daysBetween(lead.created_at, new Date())}j</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {lead.telephone && (
                          <a href={`tel:${lead.telephone}`} className="p-1 text-gray-400 hover:text-blue-500">
                            <Phone className="w-3 h-3" />
                          </a>
                        )}
                        {lead.email && (
                          <a href={`mailto:${lead.email}`} className="p-1 text-gray-400 hover:text-blue-500">
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

// --- Main Page ---
export default function PipelinePage() {
  const [search, setSearch] = useState('')
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null)
  const [activeDropColumn, setActiveDropColumn] = useState<string | null>(null)

  const { data: leadsData } = useLeads({ search, per_page: 1000 })
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
    const newPhaseId = over.id as string
    const targetPhase = PHASES_PIPELINE.find(p => p.id === newPhaseId)
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
        toast.success(`Lead déplacé vers ${targetPhase.label}`, {
          description: `${currentLead.prenom} ${currentLead.nom} • ${STATUTS_LEAD[previousStatut]?.label || previousStatut} → ${targetPhase.label}`,
        })
      },
      onError: () => {
        toast.error('Impossible de changer le statut', {
          description: 'Cette transition n\'est pas autorisée',
        })
      }
    })
  }

  const totalLeads = leadsData?.leads.length || 0
  const totalValue = leadsByPhase.reduce((sum, { totalValue }) => sum + totalValue, 0)

  return (
    <div className="space-y-5">
      {/* Header */}
      <PageHeader
        title="Pipeline Commercial"
        description="Vue d'ensemble du parcours leads → clients"
      >
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            <span className="font-medium text-gray-700">{totalLeads}</span> leads
          </div>
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4" />
            <span className="font-medium text-gray-700">{formatEuro(totalValue)}</span> CA
          </div>
        </div>
      </PageHeader>

      {/* Search */}
      <div className="max-w-sm">
        <SearchInput
          placeholder="Rechercher un lead..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
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
              <div key={phase.id} id={phase.id} className="droppable">
                <PipelineColumn
                  phase={phase}
                  leads={leads}
                  totalValue={totalValue}
                  isDropTarget={activeDropColumn === phase.id}
                />
              </div>
            ))}
          </div>

          <DragOverlay>
            {draggedLead && (
              <div className="bg-white p-3 rounded-xl shadow-xl border border-[#2EC6F3]/20 opacity-95 w-[280px]">
                <LeadCard lead={draggedLead} />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Mobile: List View */}
      <MobileListView leadsByPhase={leadsByPhase} />
    </div>
  )
}
