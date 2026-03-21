'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase-client'
import { type EmailTemplate, type Partenaire } from '@/types'
import { BRAND } from '@/lib/constants'
import { formatEuro } from '@/lib/utils'
import {
  Settings, Building2, Mail, Link2, Users2, Database,
  CheckCircle2, XCircle, Upload, Download, Plus, Eye,
  ToggleLeft, ToggleRight, Edit2, Save, Trash2, Copy,
  CreditCard, MessageSquare, Smartphone, Send, Globe,
  Shield, Clock
} from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

// Types pour les onglets
type Tab = 'general' | 'templates' | 'integrations' | 'partenaires' | 'import-export'

// Constantes pour les intégrations
const INTEGRATIONS = [
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Paiements & facturation',
    icon: CreditCard,
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-50',
    envVars: ['STRIPE_SECRET_KEY', 'STRIPE_PUBLISHABLE_KEY'],
    status: process.env.NODE_ENV === 'production' ? 'test' : 'configured',
    accountId: 'acct_1RpvbQ1NzDARltfq'
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    description: 'Messagerie instantanée',
    icon: MessageSquare,
    color: 'text-green-500',
    bgColor: 'bg-green-50',
    envVars: ['WHATSAPP_API_TOKEN'],
    status: 'not_configured'
  },
  {
    id: 'sms',
    name: 'SMS (Telnyx)',
    description: 'SMS transactionnels',
    icon: Smartphone,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    envVars: ['TELNYX_API_KEY', 'TELNYX_PHONE_NUMBER'],
    status: 'not_configured'
  },
  {
    id: 'resend',
    name: 'Resend',
    description: 'Emails transactionnels',
    icon: Send,
    color: 'text-purple-500',
    bgColor: 'bg-purple-50',
    envVars: ['RESEND_API_KEY'],
    status: 'configured'
  },
  {
    id: 'supabase',
    name: 'Supabase',
    description: 'Base de données PostgreSQL',
    icon: Database,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-50',
    envVars: ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'],
    status: 'configured',
    projectUrl: 'https://wtbrdxijvtelluwfmgsf.supabase.co'
  }
] as const

// Fonction pour copier dans le presse-papiers
const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text)
  toast.success('Copié dans le presse-papiers')
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('general')
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null)
  const [templateForm, setTemplateForm] = useState({
    nom: '',
    sujet: '',
    contenu_html: '',
    categorie: 'autre' as EmailTemplate['categorie']
  })

  const supabase = createClient()
  const queryClient = useQueryClient()

  // Queries
  const { data: emailTemplates, isLoading: templatesLoading } = useQuery({
    queryKey: ['email-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .order('categorie')
        .order('nom')
      if (error) throw error
      return data as EmailTemplate[]
    },
  })

  const { data: partenaires, isLoading: partenairesLoading } = useQuery({
    queryKey: ['partenaires'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partenaires')
        .select('*')
        .order('nom')
      if (error) throw error
      return data as Partenaire[]
    },
  })

  const { data: dbStats } = useQuery({
    queryKey: ['db-stats'],
    queryFn: async () => {
      const tables = ['leads', 'sessions', 'inscriptions', 'financements', 'commandes', 'equipe'] as const
      const results = await Promise.all(
        tables.map(t => supabase.from(t).select('*', { count: 'exact', head: true }))
      )
      return Object.fromEntries(tables.map((t, i) => [t, results[i].count || 0]))
    },
  })

  // Mutations
  const toggleTemplate = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('email_templates')
        .update({ is_active, updated_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] })
      toast.success('Template mis à jour')
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  })

  const togglePartenaire = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('partenaires')
        .update({ is_active, updated_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partenaires'] })
      toast.success('Partenaire mis à jour')
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  })

  // Export functions
  const exportData = async (table: string) => {
    try {
      const { data, error } = await supabase.from(table).select('*')
      if (error) throw error

      const headers = Object.keys(data[0] || {}).join(',')
      const rows = data.map(row =>
        Object.values(row).map(v => `"${v}"`).join(',')
      )
      const content = [headers, ...rows].join('\n')

      const blob = new Blob([content], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${table}-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success(`Export ${table} téléchargé`)
    } catch {
      toast.error("Erreur lors de l'export")
    }
  }

  // Badge pour statut intégration
  const getIntegrationStatusBadge = (status: string) => {
    switch (status) {
      case 'configured':
        return <Badge variant="success" size="sm"><CheckCircle2 className="w-3 h-3" /> Configuré</Badge>
      case 'test':
        return <Badge variant="warning" size="sm">Mode test</Badge>
      default:
        return <Badge variant="error" size="sm"><XCircle className="w-3 h-3" /> Non configuré</Badge>
    }
  }

  // Rendu des onglets
  const TabButton = ({ id, icon: Icon, label, isActive, onClick }: {
    id: Tab
    icon: any
    label: string
    isActive: boolean
    onClick: () => void
  }) => (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
        isActive
          ? 'bg-blue-50 text-blue-600 border border-blue-200'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
      )}
    >
      <Icon className="w-4 h-4" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Paramètres"
        description="Configuration du centre et du système"
      />

      {/* Navigation onglets */}
      <Card>
        <div className="p-4 border-b border-gray-100">
          <div className="flex flex-wrap gap-2">
            <TabButton
              id="general"
              icon={Building2}
              label="Général"
              isActive={activeTab === 'general'}
              onClick={() => setActiveTab('general')}
            />
            <TabButton
              id="templates"
              icon={Mail}
              label="Templates Email"
              isActive={activeTab === 'templates'}
              onClick={() => setActiveTab('templates')}
            />
            <TabButton
              id="integrations"
              icon={Link2}
              label="Intégrations"
              isActive={activeTab === 'integrations'}
              onClick={() => setActiveTab('integrations')}
            />
            <TabButton
              id="partenaires"
              icon={Users2}
              label="Partenaires"
              isActive={activeTab === 'partenaires'}
              onClick={() => setActiveTab('partenaires')}
            />
            <TabButton
              id="import-export"
              icon={Database}
              label="Import/Export"
              isActive={activeTab === 'import-export'}
              onClick={() => setActiveTab('import-export')}
            />
          </div>
        </div>

        <div className="p-6">
          {/* Tab 1: Général */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations générales</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { label: 'Nom organisme', value: BRAND.name },
                    { label: 'Adresse', value: `${BRAND.address}, ${BRAND.zipCode} ${BRAND.city}` },
                    { label: 'Téléphone', value: BRAND.phone, copyable: true },
                    { label: 'Email', value: BRAND.email, copyable: true },
                    { label: 'SIRET', value: BRAND.siret || 'Non renseigné' },
                    { label: 'NDA', value: BRAND.nda || 'Non renseigné' }
                  ].map(item => (
                    <div key={item.label}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {item.label}
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-900">{item.value}</span>
                        {item.copyable && (
                          <button
                            onClick={() => copyToClipboard(item.value)}
                            className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 transition"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Logo</h4>
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Glisser-déposer ou cliquer pour uploader</p>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG jusqu'à 2MB</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Horaires d'ouverture</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Ouverture</label>
                    <input
                      type="time"
                      defaultValue="09:00"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Fermeture</label>
                    <input
                      type="time"
                      defaultValue="18:00"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button variant="primary">
                  <Save className="w-4 h-4 mr-2" />
                  Sauvegarder
                </Button>
              </div>
            </div>
          )}

          {/* Tab 2: Templates Email */}
          {activeTab === 'templates' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Templates Email</h3>
                <Button variant="primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Nouveau template
                </Button>
              </div>

              {templatesLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">Chargement des templates...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {emailTemplates?.map(template => (
                    <div key={template.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-medium text-gray-900">{template.nom}</h4>
                            <Badge variant="default" size="sm">
                              {template.categorie}
                            </Badge>
                            <button
                              onClick={() => toggleTemplate.mutate({
                                id: template.id,
                                is_active: !template.is_active
                              })}
                              className={cn(
                                'transition',
                                template.is_active ? 'text-green-500' : 'text-gray-300'
                              )}
                            >
                              {template.is_active ? (
                                <ToggleRight className="w-5 h-5" />
                              ) : (
                                <ToggleLeft className="w-5 h-5" />
                              )}
                            </button>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{template.sujet}</p>
                          {template.variables.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {template.variables.map(variable => (
                                <code
                                  key={variable}
                                  className="px-2 py-1 bg-gray-100 text-xs rounded text-gray-700"
                                >
                                  {variable}
                                </code>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Intégrations */}
          {activeTab === 'integrations' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Intégrations</h3>

              <div className="space-y-4">
                {INTEGRATIONS.map(integration => (
                  <div key={integration.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', integration.bgColor)}>
                          <integration.icon className={cn('w-5 h-5', integration.color)} />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{integration.name}</h4>
                          <p className="text-sm text-gray-500">{integration.description}</p>
                          {'accountId' in integration && integration.accountId && (
                            <p className="text-xs text-gray-400 mt-1">ID: {integration.accountId}</p>
                          )}
                          {'projectUrl' in integration && integration.projectUrl && (
                            <p className="text-xs text-gray-400 mt-1">{integration.projectUrl}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getIntegrationStatusBadge(integration.status)}
                        {integration.id === 'stripe' && (integration.status as string) !== 'not_configured' && (
                          <a
                            href="https://dashboard.stripe.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 hover:bg-gray-100 rounded-lg transition"
                          >
                            <Globe className="w-4 h-4 text-gray-400" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 4: Partenaires */}
          {activeTab === 'partenaires' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Partenaires</h3>
                <Button variant="primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter partenaire
                </Button>
              </div>

              {partenairesLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">Chargement des partenaires...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Nom</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Type</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Contact</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Commission</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Leads</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">CA généré</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Statut</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {partenaires?.map(partenaire => (
                        <tr key={partenaire.id} className="border-b border-gray-100">
                          <td className="py-3 px-4 font-medium text-gray-900">{partenaire.nom}</td>
                          <td className="py-3 px-4">
                            <Badge variant="outline" size="sm">
                              {partenaire.type}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {partenaire.contact_email}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {partenaire.commission_taux}%
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {partenaire.leads_envoyes}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {formatEuro(partenaire.ca_genere)}
                          </td>
                          <td className="py-3 px-4">
                            <button
                              onClick={() => togglePartenaire.mutate({
                                id: partenaire.id,
                                is_active: !partenaire.is_active
                              })}
                              className={cn(
                                'transition',
                                partenaire.is_active ? 'text-green-500' : 'text-gray-300'
                              )}
                            >
                              {partenaire.is_active ? (
                                <ToggleRight className="w-5 h-5" />
                              ) : (
                                <ToggleLeft className="w-5 h-5" />
                              )}
                            </button>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm">
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button variant="outline" size="sm">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab 5: Import/Export */}
          {activeTab === 'import-export' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Import/Export</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Export */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-4">Exporter les données</h4>
                  <div className="space-y-3">
                    {[
                      { label: 'Leads', table: 'leads' },
                      { label: 'Inscriptions', table: 'inscriptions' },
                      { label: 'Financements', table: 'financements' }
                    ].map(item => (
                      <div key={item.table} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{item.label}</p>
                          <p className="text-sm text-gray-500">Export CSV</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => exportData(item.table)}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Télécharger
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Import */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-4">Importer des données</h4>
                  <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 mb-1">Glisser-déposer un fichier CSV</p>
                    <p className="text-xs text-gray-400">Format leads uniquement</p>
                    <Button variant="outline" size="sm" className="mt-3">
                      Choisir un fichier
                    </Button>
                  </div>
                </div>
              </div>

              {/* Stats DB */}
              {dbStats && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-4">Statistiques base de données</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {Object.entries(dbStats).map(([table, count]) => (
                      <div key={table} className="text-center p-4 bg-gray-50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">{count}</p>
                        <p className="text-sm text-gray-500 capitalize">{table}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}