'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { PageHeader } from '@/components/ui/PageHeader'
import { TabBar } from '@/components/ui/TabBar'
import { CreateLeadDialog } from '@/components/ui/CreateLeadDialog'
import { Users, UserPlus, Building2, GraduationCap, Kanban } from 'lucide-react'
import { useLeads } from '@/hooks/use-leads'

// Lazy imports pour les onglets
import dynamic from 'next/dynamic'

const ProspectsTab = dynamic(() => import('./tabs/ProspectsTab'), {
  loading: () => <div className="animate-pulse bg-gray-100 rounded-lg h-96" />
})

const PipelineTab = dynamic(() => import('./tabs/PipelineTab'), {
  loading: () => <div className="animate-pulse bg-gray-100 rounded-lg h-96" />
})

const ClientsTab = dynamic(() => import('./tabs/ClientsTab'), {
  loading: () => <div className="animate-pulse bg-gray-100 rounded-lg h-96" />
})

const ApprenantsTab = dynamic(() => import('./tabs/ApprenantsTab'), {
  loading: () => <div className="animate-pulse bg-gray-100 rounded-lg h-96" />
})

export default function ContactsPage() {
  const t = useTranslations('contacts')
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState(searchParams?.get('tab') || 'prospects')
  const [showCreateLead, setShowCreateLead] = useState(false)

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
  const pipelineCount = leads.filter((l: any) => l.statut && ['qualifie', 'devis_envoye', 'financement'].includes(l.statut)).length

  // TODO: Remplacer par de vraies données
  const clientCount = 2 // Mock
  const apprenantCount = 3 // Mock

  const tabs = [
    { id: 'prospects', label: 'Prospects', count: prospectCount },
    { id: 'pipeline', label: 'Pipeline', count: pipelineCount },
    { id: 'clients', label: 'Clients', count: clientCount },
    { id: 'apprenants', label: 'Apprenants', count: apprenantCount },
  ]

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'prospects':
        return <ProspectsTab onCreateLead={() => setShowCreateLead(true)} />
      case 'pipeline':
        return <PipelineTab />
      case 'clients':
        return <ClientsTab onCreateClient={() => console.log('Créer client')} />
      case 'apprenants':
        return <ApprenantsTab onCreateApprenant={() => console.log('Créer apprenant')} />
      default:
        return <ProspectsTab onCreateLead={() => setShowCreateLead(true)} />
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contacts"
        description="Gérez vos prospects, clients et apprenants depuis une vue unifiée."
        icon={Users}
      />

      <TabBar
        tabs={tabs}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

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