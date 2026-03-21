'use client'

import { useState } from 'react'
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Search, Users, Euro, TrendingUp } from 'lucide-react'
import { useLeads, useChangeStatut } from '@/hooks/use-leads'
import { PHASES_PIPELINE, STATUTS_LEAD } from '@/types'
import type { Lead, StatutLead } from '@/types'
import { formatEuro, formatDateShort, daysBetween, getInitials } from '@/lib/utils'
import { cn } from '@/lib/utils'

// --- Component: Lead Card (Draggable) ---
interface DraggableLeadCardProps {
  lead: Lead
}

function DraggableLeadCard({ lead }: DraggableLeadCardProps) {
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
        "bg-white p-3 rounded-lg shadow-sm border border-gray-200 cursor-grab",
        "hover:shadow-md transition-shadow",
        isDragging && "opacity-50"
      )}
    >
      <LeadCard lead={lead} />
    </div>
  )
}

// --- Component: Lead Card Content ---
function LeadCard({ lead }: { lead: Lead }) {
  const daysSinceCreated = daysBetween(lead.created_at, new Date())
  const scoreColor = lead.score_chaud >= 80 ? 'bg-green-100 text-green-800'
                   : lead.score_chaud >= 60 ? 'bg-yellow-100 text-yellow-800'
                   : 'bg-red-100 text-red-800'

  return (
    <div className="space-y-2">
      {/* Header: nom + score */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {lead.commercial_assigne ? (
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium text-white"
              style={{ backgroundColor: lead.commercial_assigne.avatar_color }}
            >
              {getInitials(lead.commercial_assigne.prenom, lead.commercial_assigne.nom)}
            </div>
          ) : (
            <div className="w-6 h-6 rounded-full bg-gray-200"></div>
          )}
          <span className="font-medium text-gray-900 text-sm">
            {lead.prenom} {lead.nom}
          </span>
        </div>
        <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-medium", scoreColor)}>
          {lead.score_chaud}
        </span>
      </div>

      {/* Formation souhaitée */}
      {lead.formation_principale && (
        <div className="text-xs text-gray-600 truncate">
          {lead.formation_principale.nom}
        </div>
      )}

      {/* Footer: source + jours */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span className="capitalize">{lead.source.replace('_', ' ')}</span>
        <span>{daysSinceCreated}j</span>
      </div>
    </div>
  )
}

// --- Component: Pipeline Column ---
interface PipelineColumnProps {
  phase: typeof PHASES_PIPELINE[0]
  leads: Lead[]
  totalValue: number
}

function PipelineColumn({ phase, leads, totalValue }: PipelineColumnProps) {
  const primaryStatut = phase.statuts[0]
  const statutConfig = STATUTS_LEAD[primaryStatut]

  return (
    <div className="flex-shrink-0 w-72 bg-gray-50 rounded-lg">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-900">{phase.label}</h3>
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: statutConfig.color }}
          />
        </div>
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span className="flex items-center">
            <Users className="w-4 h-4 mr-1" />
            {leads.length}
          </span>
          {totalValue > 0 && (
            <span className="flex items-center">
              <Euro className="w-4 h-4 mr-1" />
              {formatEuro(totalValue)}
            </span>
          )}
        </div>
      </div>

      {/* Lead Cards */}
      <div className="p-3 space-y-2 max-h-96 overflow-y-auto">
        <SortableContext items={leads.map(l => l.id)} strategy={verticalListSortingStrategy}>
          {leads.map(lead => (
            <DraggableLeadCard key={lead.id} lead={lead} />
          ))}
        </SortableContext>
        {leads.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-sm">
            Aucun lead
          </div>
        )}
      </div>
    </div>
  )
}

// --- Main Page Component ---
export default function PipelinePage() {
  const [search, setSearch] = useState('')
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null)

  const { data: leadsData } = useLeads({
    search,
    per_page: 1000 // Get all leads for pipeline view
  })
  const changeStatut = useChangeStatut()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  // Group leads by phases
  const leadsByPhase = PHASES_PIPELINE.map(phase => {
    const phaseLeads = leadsData?.leads.filter(lead =>
      phase.statuts.includes(lead.statut)
    ) || []

    // Calculate total value from inscriptions
    const totalValue = phaseLeads.reduce((sum, lead) => {
      const inscriptionValue = lead.inscriptions?.reduce((inscSum, insc) =>
        inscSum + insc.montant_total, 0) || 0
      return sum + inscriptionValue
    }, 0)

    return {
      phase,
      leads: phaseLeads,
      totalValue
    }
  })

  const handleDragStart = (event: any) => {
    const lead = leadsData?.leads.find(l => l.id === event.active.id)
    setDraggedLead(lead || null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setDraggedLead(null)

    if (!over) return

    const leadId = active.id as string
    const newPhaseId = over.id as string

    // Find the target phase and its primary status
    const targetPhase = PHASES_PIPELINE.find(p => p.id === newPhaseId)
    if (!targetPhase) return

    const newStatut = targetPhase.statuts[0] as StatutLead
    const currentLead = leadsData?.leads.find(l => l.id === leadId)

    if (!currentLead || currentLead.statut === newStatut) return

    changeStatut.mutate({
      id: leadId,
      statut: newStatut,
      notes: `Déplacé vers ${targetPhase.label} depuis le pipeline`
    })
  }

  const totalLeads = leadsData?.leads.length || 0
  const totalValue = leadsByPhase.reduce((sum, { totalValue }) => sum + totalValue, 0)

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pipeline Commercial</h1>
          <p className="text-gray-600 mt-1">
            Vue d'ensemble du parcours leads → clients
          </p>
        </div>
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center text-gray-600">
            <Users className="w-4 h-4 mr-1" />
            {totalLeads} leads
          </div>
          <div className="flex items-center text-gray-600">
            <TrendingUp className="w-4 h-4 mr-1" />
            {formatEuro(totalValue)} CA
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un lead..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2EC6F3] focus:border-transparent"
          />
        </div>
      </div>

      {/* Pipeline Columns */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex space-x-4 overflow-x-auto pb-4">
          {leadsByPhase.map(({ phase, leads, totalValue }) => (
            <div key={phase.id} id={phase.id} className="droppable">
              <PipelineColumn
                phase={phase}
                leads={leads}
                totalValue={totalValue}
              />
            </div>
          ))}
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {draggedLead && (
            <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200 opacity-90">
              <LeadCard lead={draggedLead} />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Mobile Warning */}
      <div className="md:hidden mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          Pour une meilleure expérience du pipeline, utilisez un écran plus large.
        </p>
      </div>
    </div>
  )
}