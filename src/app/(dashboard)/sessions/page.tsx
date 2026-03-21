'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { PageHeader } from '@/components/ui/PageHeader'
import { TabBar } from '@/components/ui/TabBar'
import { CreateSessionDialog } from '@/components/ui/CreateSessionDialog'
import { Calendar, Users, QrCode } from 'lucide-react'

// Lazy imports pour les onglets
import dynamic from 'next/dynamic'

const PlanningTab = dynamic(() => import('./tabs/PlanningTab'), {
  loading: () => <div className="animate-pulse bg-gray-100 rounded-lg h-96" />
})

const InscriptionsTab = dynamic(() => import('./tabs/InscriptionsTab'), {
  loading: () => <div className="animate-pulse bg-gray-100 rounded-lg h-96" />
})

const EmargementTab = dynamic(() => import('./tabs/EmargementTab'), {
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

  // TODO: Récupérer les vraies données pour les compteurs
  const sessionsCount = 0 // Mock - sera calculé depuis useSessions
  const inscriptionsCount = 0 // Mock - sera calculé depuis les inscriptions
  const emargementCount = 0 // Mock - sessions en émargement

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
