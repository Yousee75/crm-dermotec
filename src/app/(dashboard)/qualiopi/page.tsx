'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { PageHeader } from '@/components/ui/PageHeader'
import { TabBar } from '@/components/ui/TabBar'
import { Award } from 'lucide-react'

// Lazy imports pour les onglets
import dynamic from 'next/dynamic'

const IndicateursTab = dynamic(() => import('./tabs/IndicateursTab'), {
  loading: () => <div className="animate-pulse bg-gray-100 rounded-lg h-96" />
})

const QuestionnairesTab = dynamic(() => import('./tabs/QuestionnairesTab'), {
  loading: () => <div className="animate-pulse bg-gray-100 rounded-lg h-96" />
})

const BpfTab = dynamic(() => import('./tabs/BpfTab'), {
  loading: () => <div className="animate-pulse bg-gray-100 rounded-lg h-96" />
})

const ReclamationsTab = dynamic(() => import('./tabs/ReclamationsTab'), {
  loading: () => <div className="animate-pulse bg-gray-100 rounded-lg h-96" />
})

export default function QualiopiPage() {
  const t = useTranslations('qualiopi')
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState(searchParams?.get('tab') || 'indicateurs')

  // Sync URL avec l'onglet actif
  useEffect(() => {
    const url = new URL(window.location.href)
    if (activeTab === 'indicateurs') {
      url.searchParams.delete('tab')
    } else {
      url.searchParams.set('tab', activeTab)
    }
    window.history.replaceState({}, '', url.toString())
  }, [activeTab])

  // TODO: Récupérer les vraies données pour les compteurs
  const indicateursCount = 32 // Total des indicateurs Qualiopi
  const questionnairesCount = 0 // Fonctionnalité à venir
  const bpfCount = 1 // BPF de l'année en cours
  const reclamationsCount = 3 // Réclamations actives

  const tabs = [
    { id: 'indicateurs', label: 'Indicateurs', count: indicateursCount },
    { id: 'questionnaires', label: 'Questionnaires', count: questionnairesCount },
    { id: 'bpf', label: 'BPF', count: bpfCount },
    { id: 'reclamations', label: 'Réclamations', count: reclamationsCount },
  ]

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'indicateurs':
        return <IndicateursTab />
      case 'questionnaires':
        return <QuestionnairesTab />
      case 'bpf':
        return <BpfTab />
      case 'reclamations':
        return <ReclamationsTab />
      default:
        return <IndicateursTab />
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Qualiopi"
        description="Suivez vos 32 indicateurs qualité, gérez le BPF et les réclamations pour maintenir votre certification."
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