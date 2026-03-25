'use client'

export const dynamic = 'force-dynamic'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase-client'
import { ORGANISMES_FINANCEMENT, type Financement, type StatutFinancement, type OrganismeFinancement } from '@/types'
import {
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  Banknote,
  Plus,
  FileText,
  Calendar,
  Users,
  Filter,
  LayoutGrid,
  Table,
  ChevronRight,
  Upload,
  Eye,
  Edit3,
  AlertCircle,
  CheckCircle2
} from 'lucide-react'
import { formatEuro, formatDate, cn } from '@/lib/utils'
import Link from 'next/link'
import { PageHeader } from '@/components/ui/PageHeader'
import { KpiCard } from '@/components/ui/KpiCard'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { EmptyState } from '@/components/ui/EmptyState'
import { IllustrationEmptyFinancement } from '@/components/ui/Illustrations'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/Button'

// Colonnes du Kanban avec leurs statuts correspondants
const KANBAN_COLUMNS = [
  {
    id: 'PREPARATION',
    title: 'Préparation',
    statuts: ['PREPARATION'],
    color: 'bg-[#F4F0EB] border-[#EEEEEE]',
    badge: 'default' as const
  },
  {
    id: 'DOCUMENTS_REQUIS',
    title: 'Documents requis',
    statuts: ['DOCUMENTS_REQUIS', 'DOSSIER_COMPLET'],
    color: 'bg-orange-50 border-orange-200',
    badge: 'warning' as const
  },
  {
    id: 'SOUMIS',
    title: 'Soumis',
    statuts: ['SOUMIS'],
    color: 'bg-[#E0EBF5] border-[#6B8CAE]/30',
    badge: 'primary' as const
  },
  {
    id: 'EN_EXAMEN',
    title: 'En examen',
    statuts: ['EN_EXAMEN', 'COMPLEMENT_DEMANDE'],
    color: 'bg-[#FFE0EF] border-[#FF2D78]/30',
    badge: 'info' as const
  },
  {
    id: 'VALIDE',
    title: 'Validé',
    statuts: ['VALIDE', 'VERSE'],
    color: 'bg-[#ECFDF5] border-[#10B981]/30',
    badge: 'success' as const
  },
  {
    id: 'REFUSE',
    title: 'Refusé',
    statuts: ['REFUSE', 'CLOTURE'],
    color: 'bg-[#FFE0EF] border-[#FF2D78]/30',
    badge: 'error' as const
  }
]

const STATUT_LABELS: Record<StatutFinancement, string> = {
  PREPARATION: 'Préparation',
  DOCUMENTS_REQUIS: 'Documents requis',
  DOSSIER_COMPLET: 'Dossier complet',
  SOUMIS: 'Soumis',
  EN_EXAMEN: 'En examen',
  COMPLEMENT_DEMANDE: 'Complément demandé',
  VALIDE: 'Validé',
  REFUSE: 'Refusé',
  VERSE: 'Versé',
  CLOTURE: 'Clôturé'
}

const ORGANISME_COLORS: Record<OrganismeFinancement, string> = {
  OPCO_EP: 'blue',
  AKTO: 'blue',
  FAFCEA: 'blue',
  FIFPL: 'blue',
  CPF: 'green',
  FRANCE_TRAVAIL: 'orange',
  AGEFIPH: 'purple',
  MISSIONS_LOCALES: 'pink',
  REGION: 'indigo',
  EMPLOYEUR: 'gray',
  TRANSITIONS_PRO: 'orange',
  AUTRE: 'gray'
}

// @ts-expect-error — narrowing lead/inscription from base Financement type
interface FinancementWithLead extends Financement {
  lead: {
    id: string
    prenom: string
    nom: string
    email: string
  }
  inscription?: {
    id: string
    session?: {
      id: string
      formation?: {
        nom: string
        categorie?: string
      }
    }
  }
}

function getDaysSince(date: string): number {
  return Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24))
}

function FinancementCard({ financement, onClick }: { financement: FinancementWithLead; onClick: () => void }) {
  const organisme = ORGANISMES_FINANCEMENT[financement.organisme]
  const daysSince = financement.date_soumission ? getDaysSince(financement.date_soumission) : null

  return (
    <Card
      className="p-3 cursor-pointer hover:shadow-md transition-all duration-200 hover:border-primary/40 group"
      onClick={onClick}
    >
      <div className="space-y-2">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Avatar
              name={`${financement.lead.prenom} ${financement.lead.nom}`}
              size="xs"
            />
            <div className="min-w-0 flex-1">
              <p className="font-medium text-sm text-accent truncate">
                {financement.lead.prenom} {financement.lead.nom}
              </p>
              {financement.inscription?.session?.formation && (
                <p className="text-xs text-[#777777] truncate">
                  {financement.inscription?.session?.formation?.nom}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Organisme */}
        <Badge
          variant="outline"
          size="sm"
          className={cn(
            'text-xs',
            ORGANISME_COLORS[financement.organisme] === 'blue' && 'border-[#6B8CAE]/30 text-[#6B8CAE] bg-[#E0EBF5]',
            ORGANISME_COLORS[financement.organisme] === 'green' && 'border-[#10B981]/30 text-[#10B981] bg-[#ECFDF5]',
            ORGANISME_COLORS[financement.organisme] === 'orange' && 'border-orange-200 text-orange-700 bg-orange-50',
            ORGANISME_COLORS[financement.organisme] === 'purple' && 'border-[#FF2D78]/30 text-[#FF2D78] bg-[#FFE0EF]',
            ORGANISME_COLORS[financement.organisme] === 'pink' && 'border-pink-200 text-pink-700 bg-pink-50',
            ORGANISME_COLORS[financement.organisme] === 'indigo' && 'border-indigo-200 text-indigo-700 bg-indigo-50',
            ORGANISME_COLORS[financement.organisme] === 'cyan' && 'border-[#FF8C42] text-[#FF5C00] bg-[#FFF0E5]',
            ORGANISME_COLORS[financement.organisme] === 'gray' && 'border-[#EEEEEE] text-[#3A3A3A] bg-[#FAF8F5]'
          )}
        >
          {organisme?.label || financement.organisme}
        </Badge>

        {/* Montant */}
        <div className="space-y-1">
          {financement.montant_demande && (
            <p className="font-semibold text-sm text-accent">
              {formatEuro(financement.montant_demande)}
            </p>
          )}
          {financement.montant_accorde && financement.montant_accorde > 0 && (
            <p className="text-xs text-[#10B981] font-medium">
              Accordé: {formatEuro(financement.montant_accorde)}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-[#777777]">
          {financement.date_soumission ? (
            <span>{formatDate(financement.date_soumission)}</span>
          ) : (
            <span>—</span>
          )}
          {daysSince !== null && (
            <span className={cn(
              'font-medium',
              daysSince > 30 && 'text-[#FF2D78]',
              daysSince > 14 && daysSince <= 30 && 'text-orange-600',
              daysSince <= 14 && 'text-[#777777]'
            )}>
              {daysSince}j
            </span>
          )}
        </div>

        {/* Numéro dossier si disponible */}
        {financement.numero_dossier && (
          <div className="pt-1 border-t border-[#F4F0EB]">
            <p className="text-xs font-mono text-[#777777]">
              {financement.numero_dossier}
            </p>
          </div>
        )}
      </div>
    </Card>
  )
}

function KanbanView({ financements }: { financements: FinancementWithLead[] }) {
  const [selectedFinancement, setSelectedFinancement] = useState<FinancementWithLead | null>(null)

  const columnData = useMemo(() => {
    return KANBAN_COLUMNS.map(column => ({
      ...column,
      financements: financements.filter(f => column.statuts.includes(f.statut))
    }))
  }, [financements])

  return (
    <>
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-6 min-w-max">
          {columnData.map(column => (
            <div key={column.id} className="w-80 flex-shrink-0">
              <div className="mb-4">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-accent">{column.title}</h3>
                  <Badge variant={column.badge} size="sm">
                    {column.financements.length}
                  </Badge>
                </div>
                <div className={cn('w-full h-1 rounded-full', column.color.split(' ')[0])} />
              </div>

              <div className="space-y-3 min-h-[200px]">
                {column.financements.length === 0 ? (
                  <div className={cn(
                    'rounded-lg border-2 border-dashed p-8 text-center',
                    column.color
                  )}>
                    <p className="text-sm text-[#777777]">Aucun dossier</p>
                  </div>
                ) : (
                  column.financements.map(financement => (
                    <FinancementCard
                      key={financement.id}
                      financement={financement}
                      onClick={() => setSelectedFinancement(financement)}
                    />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedFinancement && (
        <DetailPanel
          financement={selectedFinancement}
          onClose={() => setSelectedFinancement(null)}
        />
      )}
    </>
  )
}

function DetailPanel({ financement, onClose }: { financement: FinancementWithLead; onClose: () => void }) {
  const organisme = ORGANISMES_FINANCEMENT[financement.organisme]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-[#F4F0EB] flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-accent">Dossier de financement</h2>
            <p className="text-[#777777]">
              {financement.lead.prenom} {financement.lead.nom} · {organisme?.label}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ×
          </Button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Informations générales */}
            <div className="space-y-4">
              <h3 className="font-semibold text-accent">Informations générales</h3>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-[#777777]">Statut</p>
                  <Badge variant="outline" className="mt-1">
                    {STATUT_LABELS[financement.statut]}
                  </Badge>
                </div>
                <div>
                  <p className="text-[#777777]">Organisme</p>
                  <p className="font-medium">{organisme?.label}</p>
                </div>
                {financement.numero_dossier && (
                  <div>
                    <p className="text-[#777777]">N° dossier</p>
                    <p className="font-mono text-xs">{financement.numero_dossier}</p>
                  </div>
                )}
                {financement.date_soumission && (
                  <div>
                    <p className="text-[#777777]">Date soumission</p>
                    <p>{formatDate(financement.date_soumission)}</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                {financement.montant_demande && (
                  <div>
                    <p className="text-[#777777]">Montant demandé</p>
                    <p className="font-semibold text-accent">
                      {formatEuro(financement.montant_demande)}
                    </p>
                  </div>
                )}
                {financement.montant_accorde && (
                  <div>
                    <p className="text-[#777777]">Montant accordé</p>
                    <p className="font-semibold text-[#10B981]">
                      {formatEuro(financement.montant_accorde)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Documents requis */}
            <div className="space-y-4">
              <h3 className="font-semibold text-accent">Documents requis</h3>

              <div className="space-y-2">
                {organisme?.documents_requis.map((doc, index) => (
                  <div key={index} className="flex items-center gap-3 p-2 bg-[#FAF8F5] rounded-lg">
                    <CheckCircle2 className="w-4 h-4 text-[#999999]" />
                    <span className="text-sm text-[#3A3A3A]">{doc}</span>
                    <div className="ml-auto flex gap-1">
                      <Button size="sm" variant="ghost">
                        <Upload className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <Eye className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                )) || (
                  <p className="text-sm text-[#777777]">Aucun document requis spécifié</p>
                )}
              </div>
            </div>

            {/* Contact */}
            {(financement.contact_nom || financement.contact_email) && (
              <div className="space-y-4">
                <h3 className="font-semibold text-accent">Contact organisme</h3>

                <div className="space-y-2 text-sm">
                  {financement.contact_nom && (
                    <div>
                      <p className="text-[#777777]">Nom</p>
                      <p>{financement.contact_nom}</p>
                    </div>
                  )}
                  {financement.contact_email && (
                    <div>
                      <p className="text-[#777777]">Email</p>
                      <p>{financement.contact_email}</p>
                    </div>
                  )}
                  {financement.contact_telephone && (
                    <div>
                      <p className="text-[#777777]">Téléphone</p>
                      <p>{financement.contact_telephone}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Dates importantes */}
            <div className="space-y-4">
              <h3 className="font-semibold text-accent">Dates importantes</h3>

              <div className="space-y-2 text-sm">
                {financement.date_reponse && (
                  <div className="flex justify-between">
                    <span className="text-[#777777]">Réponse</span>
                    <span>{formatDate(financement.date_reponse)}</span>
                  </div>
                )}
                {financement.date_versement && (
                  <div className="flex justify-between">
                    <span className="text-[#777777]">Versement</span>
                    <span>{formatDate(financement.date_versement)}</span>
                  </div>
                )}
                {financement.date_limite && (
                  <div className="flex justify-between">
                    <span className="text-[#777777]">Limite</span>
                    <span className={cn(
                      new Date(financement.date_limite) < new Date() && 'text-[#FF2D78] font-medium'
                    )}>
                      {formatDate(financement.date_limite)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Notes */}
          {financement.motif_refus && (
            <div className="mt-6 p-4 bg-[#FFE0EF] border border-[#FF2D78]/30 rounded-lg">
              <div className="flex gap-2">
                <AlertCircle className="w-4 h-4 text-[#FF2D78] mt-0.5" />
                <div>
                  <p className="font-medium text-[#FF2D78]">Motif de refus</p>
                  <p className="text-sm text-[#FF2D78] mt-1">{financement.motif_refus}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-[#F4F0EB] flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
          <Button>
            <Edit3 className="w-4 h-4 mr-2" />
            Modifier
          </Button>
        </div>
      </Card>
    </div>
  )
}

function TableView({ financements }: { financements: FinancementWithLead[] }) {
  return (
    <Card padding="none">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#FAF8F5]/80 border-b border-[#F4F0EB]">
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#777777] uppercase tracking-wider">Lead</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#777777] uppercase tracking-wider">Organisme</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#777777] uppercase tracking-wider">Formation</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#777777] uppercase tracking-wider">Montant demandé</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#777777] uppercase tracking-wider">Montant accordé</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#777777] uppercase tracking-wider">Statut</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#777777] uppercase tracking-wider">Date soumission</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#777777] uppercase tracking-wider">Dernière MAJ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#FAF8F5]">
            {financements.map((financement) => {
              const organisme = ORGANISMES_FINANCEMENT[financement.organisme]

              return (
                <tr key={financement.id} className="group hover:bg-primary/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/lead/${financement.lead.id}`} className="flex items-center gap-3">
                      <Avatar name={`${financement.lead.prenom} ${financement.lead.nom}`} size="sm" />
                      <span className="font-medium text-accent">
                        {financement.lead.prenom} {financement.lead.nom}
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant="outline"
                      size="sm"
                      className={cn(
                        ORGANISME_COLORS[financement.organisme] === 'blue' && 'border-[#6B8CAE]/30 text-[#6B8CAE] bg-[#E0EBF5]',
                        ORGANISME_COLORS[financement.organisme] === 'green' && 'border-[#10B981]/30 text-[#10B981] bg-[#ECFDF5]',
                        ORGANISME_COLORS[financement.organisme] === 'orange' && 'border-orange-200 text-orange-700 bg-orange-50'
                      )}
                    >
                      {organisme?.label || financement.organisme}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {financement.inscription?.session?.formation ? (
                      <span className="text-[#3A3A3A]">{financement.inscription?.session?.formation?.nom}</span>
                    ) : (
                      <span className="text-[#999999]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {financement.montant_demande ? (
                      <span className="font-medium">{formatEuro(financement.montant_demande)}</span>
                    ) : (
                      <span className="text-[#999999]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {financement.montant_accorde ? (
                      <span className="font-medium text-[#10B981]">{formatEuro(financement.montant_accorde)}</span>
                    ) : (
                      <span className="text-[#999999]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" size="sm">
                      {STATUT_LABELS[financement.statut]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-[#777777]">
                    {financement.date_soumission ? formatDate(financement.date_soumission) : '—'}
                  </td>
                  <td className="px-4 py-3 text-[#999999] text-xs">
                    {formatDate(financement.updated_at || financement.created_at)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

export default function FinancementPage() {
  const supabase = createClient()
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban')

  const { data: financements, isLoading } = useQuery({
    queryKey: ['financements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('financements')
        .select(`
          *,
          lead:leads(id, prenom, nom, email),
          inscription:inscriptions(
            id,
            session:sessions(
              id,
              formation:formations(nom, categorie)
            )
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as FinancementWithLead[]
    },
  })

  // Calcul des KPIs
  const kpis = useMemo(() => {
    if (!financements) return { enCours: 0, montantAttente: 0, validesCeMois: 0, refusesCeMois: 0, montantVerse: 0 }

    const now = new Date()
    const debutMois = new Date(now.getFullYear(), now.getMonth(), 1)

    const enCours = financements.filter(f =>
      !['VALIDE', 'REFUSE', 'VERSE', 'CLOTURE'].includes(f.statut)
    ).length

    const montantAttente = financements
      .filter(f => ['SOUMIS', 'EN_EXAMEN'].includes(f.statut))
      .reduce((sum, f) => sum + (f.montant_demande || 0), 0)

    const validesCeMois = financements.filter(f =>
      ['VALIDE', 'VERSE'].includes(f.statut) &&
      new Date(f.date_reponse || f.updated_at || f.created_at) >= debutMois
    ).length

    const refusesCeMois = financements.filter(f =>
      f.statut === 'REFUSE' &&
      new Date(f.date_reponse || f.updated_at || f.created_at) >= debutMois
    ).length

    const montantVerse = financements
      .filter(f => f.statut === 'VERSE')
      .reduce((sum, f) => sum + (f.montant_verse || 0), 0)

    return { enCours, montantAttente, validesCeMois, refusesCeMois, montantVerse }
  }, [financements])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-8 w-64 bg-[#EEEEEE] rounded animate-pulse" />
          <div className="h-10 w-32 bg-[#EEEEEE] rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 bg-[#EEEEEE] rounded animate-pulse" />
          ))}
        </div>
        <SkeletonTable rows={6} cols={8} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Financement"
          description={`${financements?.length || 0} dossiers · ${kpis.enCours} en cours`}
        />

        <div className="flex items-center gap-3">
          <div className="flex items-center border border-[#EEEEEE] rounded-lg p-1">
            <Button
              size="sm"
              variant={viewMode === 'kanban' ? 'primary' : 'ghost'}
              onClick={() => setViewMode('kanban')}
              className="gap-2"
            >
              <LayoutGrid className="w-4 h-4" />
              Kanban
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'table' ? 'primary' : 'ghost'}
              onClick={() => setViewMode('table')}
              className="gap-2"
            >
              <Table className="w-4 h-4" />
              Table
            </Button>
          </div>

          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Nouveau dossier
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
        <KpiCard
          icon={Clock}
          label="Dossiers en cours"
          value={kpis.enCours}
          color="#6B7280"
        />
        <KpiCard
          icon={Banknote}
          label="Montant en attente"
          value={formatEuro(kpis.montantAttente)}
          color="#F59E0B"
        />
        <KpiCard
          icon={CheckCircle}
          label="Validés ce mois"
          value={kpis.validesCeMois}
          color="var(--color-success)"
        />
        <KpiCard
          icon={XCircle}
          label="Refusés ce mois"
          value={kpis.refusesCeMois}
          color="#EF4444"
        />
        <KpiCard
          icon={CreditCard}
          label="Montant total versé"
          value={formatEuro(kpis.montantVerse)}
          color="var(--color-primary)"
        />
      </div>

      {/* Content */}
      {!financements?.length ? (
        <Card className="py-12">
          <EmptyState
            illustration={<IllustrationEmptyFinancement size={120} />}
            icon={<FileText className="w-12 h-12" />}
            title="Aucun dossier de financement"
            description="Les dossiers de financement apparaîtront ici une fois créés."
            action={{
              label: 'Créer un dossier',
              onClick: () => {},
              icon: <Plus className="w-4 h-4" />
            }}
          />
        </Card>
      ) : viewMode === 'kanban' ? (
        <KanbanView financements={financements} />
      ) : (
        <TableView financements={financements} />
      )}
    </div>
  )
}