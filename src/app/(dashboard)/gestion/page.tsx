'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { PageHeader } from '@/components/ui/PageHeader'
import { TabBar } from '@/components/ui/TabBar'
// Lazy imports pour les onglets
import dynamic from 'next/dynamic'

const FinancementTab = dynamic(() => import('./tabs/FinancementTab'), {
  loading: () => <div className="animate-pulse bg-gray-100 rounded-lg h-96" />
})

const FacturationTab = dynamic(() => import('./tabs/FacturationTab'), {
  loading: () => <div className="animate-pulse bg-gray-100 rounded-lg h-96" />
})

const EShopTab = dynamic(() => import('./tabs/EShopTab'), {
  loading: () => <div className="animate-pulse bg-gray-100 rounded-lg h-96" />
})

export default function GestionPage() {
  const t = useTranslations('gestion')
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState(searchParams?.get('tab') || 'financement')

  // Sync URL avec l'onglet actif
  useEffect(() => {
    const url = new URL(window.location.href)
    if (activeTab === 'financement') {
      url.searchParams.delete('tab')
    } else {
      url.searchParams.set('tab', activeTab)
    }
    window.history.replaceState({}, '', url.toString())
  }, [activeTab])

  const tabs = [
    { id: 'financement', label: 'Financement' },
    { id: 'facturation', label: 'Facturation' },
    { id: 'eshop', label: 'E-Shop' },
  ]

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'financement':
        return <FinancementTab />
      case 'facturation':
        return <FacturationTab />
      case 'eshop':
        return <EShopTab />
      default:
        return <FinancementTab />
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestion"
        description="Pilotez le financement, la facturation et les ventes de votre centre de formation."
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