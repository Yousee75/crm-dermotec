'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase-client'
import { type Formation } from '@/types'
import { BRAND } from '@/lib/constants'
import { formatEuro } from '@/lib/utils'
import {
  Building2, GraduationCap, Download, Database,
  CreditCard, CheckCircle, AlertTriangle, Power, PowerOff,
  ChevronDown, ChevronRight, ExternalLink, Copy
} from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface SectionProps {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  iconColor: string
  expanded: boolean
  onToggle: () => void
  badge?: React.ReactNode
  children: React.ReactNode
}

function Section({ title, description, icon, iconColor, expanded, onToggle, badge, children }: SectionProps) {
  return (
    <Card padding="none">
      <button onClick={onToggle} className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50/50 transition">
        <div className="flex items-center gap-3">
          <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', iconColor)}>
            {icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-[#082545] text-sm">{title}</h3>
              {badge}
            </div>
            <p className="text-xs text-gray-400">{description}</p>
          </div>
        </div>
        {expanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
      </button>
      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-4 animate-fadeIn">
          {children}
        </div>
      )}
    </Card>
  )
}

export default function SettingsPage() {
  const [sections, setSections] = useState<Record<string, boolean>>({
    centre: true, formations: false, export: false, integrations: false,
  })
  const toggle = (id: string) => setSections(p => ({ ...p, [id]: !p[id] }))

  const supabase = createClient()
  const queryClient = useQueryClient()

  const { data: formations, isLoading: formationsLoading } = useQuery({
    queryKey: ['formations'],
    queryFn: async () => {
      const { data, error } = await supabase.from('formations').select('*').order('sort_order').order('nom')
      if (error) throw error
      return data as Formation[]
    },
  })

  const { data: stats } = useQuery({
    queryKey: ['db-stats'],
    queryFn: async () => {
      const tables = ['leads', 'sessions', 'inscriptions', 'financements', 'commandes', 'equipe'] as const
      const results = await Promise.all(tables.map(t => supabase.from(t).select('*', { count: 'exact', head: true })))
      return Object.fromEntries(tables.map((t, i) => [t, results[i].count || 0]))
    },
  })

  const toggleFormation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('formations').update({ is_active, updated_at: new Date().toISOString() }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['formations'] }); toast.success('Mis à jour') },
    onError: () => toast.error('Erreur'),
  })

  const exportLeads = async (format: 'csv' | 'json') => {
    try {
      const { data, error } = await supabase.from('leads').select('*')
      if (error) throw error
      let content: string, filename: string, mimeType: string
      if (format === 'csv') {
        const headers = Object.keys(data[0] || {}).join(',')
        const rows = data.map(row => Object.values(row).map(v => `"${v}"`).join(','))
        content = [headers, ...rows].join('\n'); filename = `leads-${new Date().toISOString().split('T')[0]}.csv`; mimeType = 'text/csv'
      } else {
        content = JSON.stringify(data, null, 2); filename = `leads-${new Date().toISOString().split('T')[0]}.json`; mimeType = 'application/json'
      }
      const blob = new Blob([content], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url)
      toast.success(`Export ${format.toUpperCase()} téléchargé`)
    } catch { toast.error("Erreur lors de l'export") }
  }

  const copy = (text: string) => { navigator.clipboard.writeText(text); toast.success('Copié') }

  return (
    <div className="space-y-5 max-w-3xl">
      <PageHeader title="Paramètres" description="Configuration du centre et du système" />

      <div className="space-y-3">
        {/* Centre */}
        <Section
          id="centre" title="Informations Centre" description="Données de l'organisme"
          icon={<Building2 className="w-4 h-4 text-blue-500" />} iconColor="bg-blue-50"
          expanded={sections.centre} onToggle={() => toggle('centre')}
          badge={BRAND.qualiopi ? <Badge variant="success" size="sm"><CheckCircle className="w-3 h-3" /> Qualiopi</Badge> : undefined}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'Nom', value: BRAND.name },
              { label: 'Slogan', value: BRAND.tagline },
              { label: 'Téléphone', value: BRAND.phone, copy: true },
              { label: 'Email', value: BRAND.email, copy: true },
              { label: 'Adresse', value: `${BRAND.address}, ${BRAND.zipCode} ${BRAND.city}` },
            ].map(item => (
              <div key={item.label}>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">{item.label}</p>
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium text-gray-800">{item.value}</p>
                  {item.copy && (
                    <button onClick={() => copy(item.value)} className="p-0.5 hover:bg-gray-100 rounded text-gray-300 hover:text-gray-500 transition">
                      <Copy className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Formations */}
        <Section
          id="formations" title="Catalogue Formations" description={`${formations?.length || 0} formations`}
          icon={<GraduationCap className="w-4 h-4 text-pink-500" />} iconColor="bg-pink-50"
          expanded={sections.formations} onToggle={() => toggle('formations')}
          badge={<Badge variant="default" size="sm">{formations?.filter(f => f.is_active).length || 0} actives</Badge>}
        >
          {formationsLoading ? (
            <p className="text-sm text-gray-400 text-center py-4">Chargement...</p>
          ) : (
            <div className="space-y-2">
              {formations?.map(f => (
                <div key={f.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100/80 transition group">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium text-[#082545] truncate">{f.nom}</h4>
                      <Badge variant="default" size="sm">{f.categorie}</Badge>
                    </div>
                    <div className="flex gap-3 mt-0.5 text-[11px] text-gray-400">
                      <span>{f.duree_jours}j ({f.duree_heures}h)</span>
                      <span>{formatEuro(f.prix_ht)} HT</span>
                      <span>Niv. {f.niveau}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleFormation.mutate({ id: f.id, is_active: !f.is_active })}
                    className={cn(
                      'p-1.5 rounded-lg transition',
                      f.is_active ? 'text-green-500 hover:bg-green-100' : 'text-gray-300 hover:bg-gray-200'
                    )}
                  >
                    {f.is_active ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                  </button>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Export */}
        <Section
          id="export" title="Export & Données" description="Télécharger ou sauvegarder"
          icon={<Download className="w-4 h-4 text-green-500" />} iconColor="bg-green-50"
          expanded={sections.export} onToggle={() => toggle('export')}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
              <div>
                <p className="text-sm font-medium text-gray-800">Export Leads</p>
                <p className="text-xs text-gray-400">Toutes les données leads</p>
              </div>
              <div className="flex gap-1.5">
                <Button variant="outline" size="sm" onClick={() => exportLeads('csv')}>CSV</Button>
                <Button variant="outline" size="sm" onClick={() => exportLeads('json')}>JSON</Button>
              </div>
            </div>

            {/* DB stats — info utile, pas de bruit */}
            {stats && (
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Base de données</p>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {Object.entries(stats).map(([table, count]) => (
                    <div key={table} className="text-center p-2 bg-gray-50 rounded-lg">
                      <p className="text-lg font-bold text-[#082545]">{count}</p>
                      <p className="text-[10px] text-gray-400 capitalize">{table}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Section>

        {/* Intégrations — Supabase + Stripe en un seul bloc */}
        <Section
          id="integrations" title="Intégrations" description="Supabase & Stripe"
          icon={<Database className="w-4 h-4 text-violet-500" />} iconColor="bg-violet-50"
          expanded={sections.integrations} onToggle={() => toggle('integrations')}
          badge={<Badge variant="success" size="sm" dot>Connecté</Badge>}
        >
          <div className="space-y-4">
            {/* Supabase */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                  <Database className="w-4 h-4 text-green-500" />
                </div>
                <div>
                  <p className="text-sm font-medium">Supabase</p>
                  <p className="text-xs text-gray-400">Base de données PostgreSQL</p>
                </div>
              </div>
              <Badge variant="success" size="sm" dot>Actif</Badge>
            </div>

            {/* Stripe */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-indigo-500" />
                </div>
                <div>
                  <p className="text-sm font-medium">Stripe</p>
                  <p className="text-xs text-gray-400">Paiements & facturation</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="warning" size="sm">Mode test</Badge>
                <a href="https://dashboard.stripe.com" target="_blank" rel="noopener noreferrer"
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition">
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </Section>
      </div>
    </div>
  )
}
