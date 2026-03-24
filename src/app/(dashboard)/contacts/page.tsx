'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { PageHeader } from '@/components/ui/PageHeader'
import { CreateLeadDialog } from '@/components/ui/CreateLeadDialog'
import { useLeads } from '@/hooks/use-leads'
import { cn } from '@/lib/utils'

// Lazy imports pour les onglets
import dynamic from 'next/dynamic'

const ProspectsTab = dynamic(() => import('./tabs/ProspectsTab'), {
  loading: () => <div className="animate-pulse bg-[#F4F0EB] rounded-lg h-96" />
})

const PipelineTab = dynamic(() => import('./tabs/PipelineTab'), {
  loading: () => <div className="animate-pulse bg-[#F4F0EB] rounded-lg h-96" />
})

const ClientsTab = dynamic(() => import('./tabs/ClientsTab'), {
  loading: () => <div className="animate-pulse bg-[#F4F0EB] rounded-lg h-96" />
})

const ApprenantsTab = dynamic(() => import('./tabs/ApprenantsTab'), {
  loading: () => <div className="animate-pulse bg-[#F4F0EB] rounded-lg h-96" />
})

export default function ContactsPage() {
  const t = useTranslations('contacts')
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState(searchParams?.get('tab') || 'prospects')
  const [showCreateLead, setShowCreateLead] = useState(false)
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table') // Pour toggle vue prospects

  // Récupérer les données pour les compteurs
  const { data: leadsData } = useLeads({ per_page: 1000 })

  // Sync URL avec l'onglet actif
  useEffect(() => {
    const url = new URL(window.location.href)
    if (activeTab === 'prospects') {
      url.searchParams.delete('tab')
    } else {
      url.searchParams.set('tab', activeTab)
    }
    window.history.replaceState({}, '', url.toString())
  }, [activeTab])

  // Calculer les compteurs pour chaque onglet
  const leads = leadsData?.leads || []
  const prospectCount = leads.filter((l: any) => !['inscrit', 'forme'].includes(l.statut || '')).length

  // Stagiaires = leads inscrits en formation
  const stagiaireCount = leads.filter((l: any) => l.statut === 'inscrit').length

  // Alumni = leads formés
  const alumniCount = leads.filter((l: any) => l.statut === 'forme').length

  const tabs = [
    { id: 'prospects', label: 'Prospects', count: prospectCount },
    { id: 'stagiaires', label: 'Stagiaires', count: stagiaireCount },
    { id: 'alumni', label: 'Alumni', count: alumniCount },
  ]

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'prospects':
        return viewMode === 'table'
          ? <ProspectsTab onCreateLead={() => setShowCreateLead(true)} />
          : <PipelineTab />
      case 'stagiaires':
        return <ClientsTab onCreateClient={() => {}} />
      case 'alumni':
        return <ApprenantsTab onCreateApprenant={() => {}} />
      default:
        return <ProspectsTab onCreateLead={() => setShowCreateLead(true)} />
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contacts"
        description="Gérez vos prospects, clients et apprenants depuis une vue unifiée."
      />

      {/* Toggle personnalisé Satorea - 3 onglets */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 p-1 bg-[#FAF8F5] rounded-xl">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200',
                activeTab === tab.id
                  ? 'bg-[#FF5C00] text-white shadow-sm'
                  : 'bg-white text-[#777777] hover:text-[#1A1A1A] hover:bg-[#FAF8F5] border border-[#EEEEEE]'
              )}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className={cn(
                  'ml-1.5 text-xs',
                  activeTab === tab.id ? 'text-orange-100' : 'text-[#999999]'
                )}>
                  ({tab.count})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Toggle vue table/kanban pour l'onglet Prospects */}
        {activeTab === 'prospects' && (
          <div className="flex items-center gap-2 p-1 bg-[#FAF8F5] rounded-lg">
            <button
              onClick={() => setViewMode('table')}
              className={cn(
                'px-3 py-2 text-xs font-medium rounded-md transition-all',
                viewMode === 'table'
                  ? 'bg-[#FF5C00] text-white'
                  : 'text-[#777777] hover:text-[#1A1A1A]'
              )}
            >
              Table
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={cn(
                'px-3 py-2 text-xs font-medium rounded-md transition-all',
                viewMode === 'kanban'
                  ? 'bg-[#FF5C00] text-white'
                  : 'text-[#777777] hover:text-[#1A1A1A]'
              )}
            >
              Kanban
            </button>
          </div>
        )}
      </div>

      <div className="min-h-[600px]">
        {renderActiveTab()}
      </div>

      {/* Dialog création de lead */}
      <CreateLeadDialog
        open={showCreateLead}
        onOpenChange={setShowCreateLead}
      />
    </div>
  )
}