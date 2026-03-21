'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { PageHeader } from '@/components/ui/PageHeader'
import { TabBar } from '@/components/ui/TabBar'
import { Settings } from 'lucide-react'

// Lazy imports pour les onglets
import dynamic from 'next/dynamic'

const EquipeTab = dynamic(() => import('./tabs/EquipeTab'), {
  loading: () => <div className="animate-pulse bg-gray-100 rounded-lg h-96" />
})

const CatalogueTab = dynamic(() => import('./tabs/CatalogueTab'), {
  loading: () => <div className="animate-pulse bg-gray-100 rounded-lg h-96" />
})

const SecuriteTab = dynamic(() => import('./tabs/SecuriteTab'), {
  loading: () => <div className="animate-pulse bg-gray-100 rounded-lg h-96" />
})

const PlanTab = dynamic(() => import('./tabs/PlanTab'), {
  loading: () => <div className="animate-pulse bg-gray-100 rounded-lg h-96" />
})

const IntegrationsTab = dynamic(() => import('./tabs/IntegrationsTab'), {
  loading: () => <div className="animate-pulse bg-gray-100 rounded-lg h-96" />
})

export default function ParametresPage() {
  const t = useTranslations('parametres')
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState(searchParams?.get('tab') || 'equipe')

  // Sync URL avec l'onglet actif
  useEffect(() => {
    const url = new URL(window.location.href)
    if (activeTab === 'equipe') {
      url.searchParams.delete('tab')
    } else {
      url.searchParams.set('tab', activeTab)
    }
    window.history.replaceState({}, '', url.toString())
  }, [activeTab])

  // TODO: Récupérer les vraies données pour les compteurs
  const equipeCount = 4 // Nombre de membres d'équipe
  const formationsCount = 11 // Nombre de formations au catalogue
  const integrationsCount = 3 // Nombre d'intégrations connectées

  const tabs = [
    { id: 'equipe', label: 'Équipe', count: equipeCount },
    { id: 'catalogue', label: 'Catalogue', count: formationsCount },
    { id: 'securite', label: 'Sécurité' },
    { id: 'plan', label: 'Mon plan' },
    { id: 'integrations', label: 'Intégrations', count: integrationsCount },
  ]

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'equipe':
        return <EquipeTab />
      case 'catalogue':
        return <CatalogueTab />
      case 'securite':
        return <SecuriteTab />
      case 'plan':
        return <PlanTab />
      case 'integrations':
        return <IntegrationsTab />
      default:
        return <EquipeTab />
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Paramètres"
        description="Configurez votre équipe, catalogue, sécurité et intégrations pour optimiser votre centre de formation."
        icon={Settings}
      />

      <TabBar
        tabs={tabs}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      <div className="min-h-[600px]">
        {renderActiveTab()}
      </div>
    </div>
  )
}