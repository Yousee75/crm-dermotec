'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { PageHeader } from '@/components/ui/PageHeader'
import { TabBar } from '@/components/ui/TabBar'
import { CreateSessionDialog } from '@/components/ui/CreateSessionDialog'
import { Calendar, Users, QrCode } from 'lucide-react'
import { useSessions } from '@/hooks/use-sessions'
import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton'
import { ExportButton } from '@/components/ui/ExportButton'
import type { ColumnDef } from '@/lib/export-data'

const SESSIONS_EXPORT_COLUMNS: ColumnDef[] = [
  { header: 'Formation', accessor: (r) => r.formation?.nom || r.formation_nom || '', width: 2 },
  { header: 'Date début', accessor: (r) => r.date_debut ? new Date(r.date_debut).toLocaleDateString('fr-FR') : '', width: 1 },
  { header: 'Date fin', accessor: (r) => r.date_fin ? new Date(r.date_fin).toLocaleDateString('fr-FR') : '', width: 1 },
  { header: 'Formatrice', accessor: (r) => r.formatrice?.nom || r.formatrice_nom || '', width: 1.2 },
  { header: 'Places', accessor: (r) => `${r.inscriptions?.length || 0}/${r.places_max || '—'}`, width: 0.8 },
  { header: 'Statut', accessor: 'statut', width: 1 },
]

// Lazy imports pour les onglets
import nextDynamic from 'next/dynamic'

// Skeleton amélioré pour les onglets sessions
function SessionTabSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <div className="bg-white rounded-xl border border-[var(--color-border)] p-4">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-8 w-24" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="border border-[#F0F0F0] rounded-lg p-3">
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-3 w-1/2 mb-2" />
              <div className="flex justify-between items-center">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-5 w-12" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const PlanningTab = nextDynamic(() => import('./tabs/PlanningTab'), {
  loading: () => <SessionTabSkeleton />
})

const InscriptionsTab = nextDynamic(() => import('./tabs/InscriptionsTab'), {
  loading: () => <SessionTabSkeleton />
})

const EmargementTab = nextDynamic(() => import('./tabs/EmargementTab'), {
  loading: () => <SessionTabSkeleton />
})

const CalendarTab = nextDynamic(() => import('./tabs/CalendarTab'), {
  loading: () => <SessionTabSkeleton />
})

export default function SessionsPage() {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState(searchParams?.get('tab') || 'planning')
  const [showCreate, setShowCreate] = useState(false)

  // Sync URL avec l'onglet actif
  useEffect(() => {
    const url = new URL(window.location.href)
    if (activeTab === 'planning') {
      url.searchParams.delete('tab')
    } else {
      url.searchParams.set('tab', activeTab)
    }
    window.history.replaceState({}, '', url.toString())
  }, [activeTab])

  const { data: allSessions, isLoading } = useSessions()
  const sessionsCount = allSessions?.length || 0
  const inscriptionsCount = allSessions?.reduce((sum, s) => sum + (s.inscriptions?.length || 0), 0) || 0
  const emargementCount = allSessions?.filter(s => s.statut === 'EN_COURS' || s.statut === 'TERMINEE').length || 0

  const tabs = [
    { id: 'planning', label: 'Planning' },
    { id: 'calendrier', label: 'Calendrier' },
    { id: 'inscriptions', label: 'Inscriptions', count: inscriptionsCount },
    { id: 'emargement', label: 'Émargement' },
  ]

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'planning':
        return <PlanningTab onCreateSession={() => setShowCreate(true)} />
      case 'calendrier':
        return <CalendarTab />
      case 'inscriptions':
        return <InscriptionsTab />
      case 'emargement':
        return <EmargementTab />
      default:
        return <PlanningTab onCreateSession={() => setShowCreate(true)} />
    }
  }

  // Loading state pour la page entière
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="flex gap-4 border-b border-[var(--color-border)]">
          {[1,2,3].map(i => (
            <Skeleton key={i} className="h-8 w-24" />
          ))}
        </div>
        <SessionTabSkeleton />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sessions de formation"
        description="Gérez vos sessions, inscriptions et émargements depuis une vue unifiée."
      >
        <ExportButton
          data={allSessions || []}
          columns={SESSIONS_EXPORT_COLUMNS}
          filename="sessions"
          title="Sessions de formation — CRM Dermotec"
        />
      </PageHeader>

      <TabBar
        tabs={tabs}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      <div className="min-h-[600px]">
        {renderActiveTab()}
      </div>

      {/* Dialog création de session */}
      <CreateSessionDialog open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  )
}
