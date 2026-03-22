'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { PageHeader } from '@/components/ui/PageHeader'
import { TabBar } from '@/components/ui/TabBar'
import { CreateSessionDialog } from '@/components/ui/CreateSessionDialog'
import { Calendar, Users, QrCode } from 'lucide-react'
import { useSessions } from '@/hooks/use-sessions'

// Lazy imports pour les onglets
import nextDynamic from 'next/dynamic'

const PlanningTab = nextDynamic(() => import('./tabs/PlanningTab'), {
  loading: () => <div className="animate-pulse bg-gray-100 rounded-lg h-96" />
})

const InscriptionsTab = nextDynamic(() => import('./tabs/InscriptionsTab'), {
  loading: () => <div className="animate-pulse bg-gray-100 rounded-lg h-96" />
})

const EmargementTab = nextDynamic(() => import('./tabs/EmargementTab'), {
  loading: () => <div className="animate-pulse bg-gray-100 rounded-lg h-96" />
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

  const { data: allSessions } = useSessions()
  const sessionsCount = allSessions?.length || 0
  const inscriptionsCount = allSessions?.reduce((sum, s) => sum + (s.inscriptions?.length || 0), 0) || 0
  const emargementCount = allSessions?.filter(s => s.statut === 'EN_COURS' || s.statut === 'TERMINEE').length || 0

  const tabs = [
    { id: 'planning', label: 'Planning' },
    { id: 'inscriptions', label: 'Inscriptions', count: inscriptionsCount },
    { id: 'emargement', label: 'Émargement' },
  ]

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'planning':
        return <PlanningTab onCreateSession={() => setShowCreate(true)} />
      case 'inscriptions':
        return <InscriptionsTab />
      case 'emargement':
        return <EmargementTab />
      default:
        return <PlanningTab onCreateSession={() => setShowCreate(true)} />
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sessions de formation"
        description="Gérez vos sessions, inscriptions et émargements depuis une vue unifiée."
      />

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
