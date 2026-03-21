'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase-client'
import { type Formation, type CategorieFormation } from '@/types'
import { BRAND, COLORS, FORMATIONS_SEED } from '@/lib/constants'
import { formatEuro } from '@/lib/utils'
import {
  Settings, Building2, GraduationCap, Download, Database,
  CreditCard, CheckCircle, XCircle, AlertTriangle, Power, PowerOff,
  ChevronDown, ChevronRight, ExternalLink, Copy, Zap
} from 'lucide-react'
import { toast } from 'sonner'

interface SettingsSection {
  id: string
  title: string
  icon: any
  expanded: boolean
}

export default function SettingsPage() {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    centre: true,
    formations: true,
    export: false,
    backup: false,
    supabase: false,
    stripe: false,
  })

  const supabase = createClient()
  const queryClient = useQueryClient()

  // Fetch formations
  const { data: formations, isLoading: formationsLoading } = useQuery({
    queryKey: ['formations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('formations')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('nom', { ascending: true })
      if (error) throw error
      return data as Formation[]
    },
  })

  // Fetch stats Supabase
  const { data: supabaseStats } = useQuery({
    queryKey: ['supabase-stats'],
    queryFn: async () => {
      const [leads, sessions, inscriptions, financements, commandes, equipe] = await Promise.all([
        supabase.from('leads').select('*', { count: 'exact', head: true }),
        supabase.from('sessions').select('*', { count: 'exact', head: true }),
        supabase.from('inscriptions').select('*', { count: 'exact', head: true }),
        supabase.from('financements').select('*', { count: 'exact', head: true }),
        supabase.from('commandes').select('*', { count: 'exact', head: true }),
        supabase.from('equipe').select('*', { count: 'exact', head: true }),
      ])
      return {
        leads: leads.count || 0,
        sessions: sessions.count || 0,
        inscriptions: inscriptions.count || 0,
        financements: financements.count || 0,
        commandes: commandes.count || 0,
        equipe: equipe.count || 0,
      }
    },
  })

  // Toggle formation active
  const toggleFormationMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('formations')
        .update({ is_active, updated_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formations'] })
      toast.success('Formation mise à jour')
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  })

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }))
  }

  const exportLeads = async (format: 'csv' | 'json') => {
    try {
      const { data, error } = await supabase.from('leads').select('*')
      if (error) throw error

      let content: string
      let filename: string
      let mimeType: string

      if (format === 'csv') {
        const headers = Object.keys(data[0] || {}).join(',')
        const rows = data.map(row => Object.values(row).map(v => `"${v}"`).join(','))
        content = [headers, ...rows].join('\n')
        filename = `leads-${new Date().toISOString().split('T')[0]}.csv`
        mimeType = 'text/csv'
      } else {
        content = JSON.stringify(data, null, 2)
        filename = `leads-${new Date().toISOString().split('T')[0]}.json`
        mimeType = 'application/json'
      }

      const blob = new Blob([content], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success(`Export ${format.toUpperCase()} téléchargé`)
    } catch (error) {
      toast.error('Erreur lors de l\'export')
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copié !')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#082545]" style={{ fontFamily: 'var(--font-heading)' }}>
          Paramètres
        </h1>
        <p className="text-sm text-gray-500">Configuration du centre et du système</p>
      </div>

      {/* Sections */}
      <div className="space-y-4">

        {/* 1. Informations Centre */}
        <div className="bg-white rounded-xl border">
          <button
            onClick={() => toggleSection('centre')}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition"
          >
            <div className="flex items-center gap-3">
              <Building2 className="w-5 h-5 text-blue-500" />
              <div>
                <h3 className="font-semibold text-[#082545]">Informations Centre</h3>
                <p className="text-xs text-gray-500">Données de l'organisme de formation</p>
              </div>
            </div>
            {expandedSections.centre ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>

          {expandedSections.centre && (
            <div className="p-4 pt-0 border-t border-gray-100">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500">Nom</label>
                  <p className="font-medium">{BRAND.name}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Slogan</label>
                  <p className="font-medium">{BRAND.tagline}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Téléphone</label>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{BRAND.phone}</p>
                    <button onClick={() => copyToClipboard(BRAND.phone)} className="p-1 hover:bg-gray-100 rounded">
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Email</label>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{BRAND.email}</p>
                    <button onClick={() => copyToClipboard(BRAND.email)} className="p-1 hover:bg-gray-100 rounded">
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Adresse</label>
                  <p className="font-medium">{BRAND.address}, {BRAND.zipCode} {BRAND.city}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Certification</label>
                  <div className="flex items-center gap-2">
                    {BRAND.qualiopi ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                    <span className={BRAND.qualiopi ? 'text-green-600' : 'text-red-600'}>
                      Qualiopi {BRAND.qualiopi ? 'certifié' : 'non certifié'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 2. Catalogue Formations */}
        <div className="bg-white rounded-xl border">
          <button
            onClick={() => toggleSection('formations')}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition"
          >
            <div className="flex items-center gap-3">
              <GraduationCap className="w-5 h-5 text-pink-500" />
              <div>
                <h3 className="font-semibold text-[#082545]">Catalogue Formations</h3>
                <p className="text-xs text-gray-500">{formations?.length || 0} formations disponibles</p>
              </div>
            </div>
            {expandedSections.formations ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>

          {expandedSections.formations && (
            <div className="p-4 pt-0 border-t border-gray-100">
              {formationsLoading ? (
                <p className="text-center py-4 text-gray-400">Chargement...</p>
              ) : !formations?.length ? (
                <p className="text-center py-4 text-gray-400">Aucune formation</p>
              ) : (
                <div className="space-y-3">
                  {formations.map(formation => (
                    <div key={formation.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h4 className="font-medium text-[#082545]">{formation.nom}</h4>
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                            {formation.categorie}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                          <span>{formation.duree_jours}j ({formation.duree_heures}h)</span>
                          <span>{formatEuro(formation.prix_ht)} HT</span>
                          <span>Niveau: {formation.niveau}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleFormationMutation.mutate({
                          id: formation.id,
                          is_active: !formation.is_active
                        })}
                        className={`p-2 rounded-lg transition ${
                          formation.is_active
                            ? 'bg-green-100 text-green-600 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                        }`}
                        title={formation.is_active ? 'Désactiver' : 'Activer'}
                      >
                        {formation.is_active ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 3. Export */}
        <div className="bg-white rounded-xl border">
          <button
            onClick={() => toggleSection('export')}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition"
          >
            <div className="flex items-center gap-3">
              <Download className="w-5 h-5 text-green-500" />
              <div>
                <h3 className="font-semibold text-[#082545]">Export Données</h3>
                <p className="text-xs text-gray-500">Télécharger les leads et autres données</p>
              </div>
            </div>
            {expandedSections.export ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>

          {expandedSections.export && (
            <div className="p-4 pt-0 border-t border-gray-100">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium">Export Leads</h4>
                    <p className="text-xs text-gray-500">Tous les leads avec leurs informations complètes</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => exportLeads('csv')}
                      className="px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-sm transition"
                    >
                      CSV
                    </button>
                    <button
                      onClick={() => exportLeads('json')}
                      className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-sm transition"
                    >
                      JSON
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 4. Backup */}
        <div className="bg-white rounded-xl border">
          <button
            onClick={() => toggleSection('backup')}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition"
          >
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-purple-500" />
              <div>
                <h3 className="font-semibold text-[#082545]">Sauvegarde</h3>
                <p className="text-xs text-gray-500">Backup complet des données</p>
              </div>
            </div>
            {expandedSections.backup ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>

          {expandedSections.backup && (
            <div className="p-4 pt-0 border-t border-gray-100">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
                <div className="flex gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-800">Attention</p>
                    <p className="text-amber-700">Cette fonctionnalité nécessite des permissions admin et peut prendre du temps.</p>
                  </div>
                </div>
              </div>
              <button className="w-full py-2 px-4 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg transition">
                <Download className="w-4 h-4 inline mr-2" />
                Télécharger backup complet
              </button>
            </div>
          )}
        </div>

        {/* 5. Statut Supabase */}
        <div className="bg-white rounded-xl border">
          <button
            onClick={() => toggleSection('supabase')}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition"
          >
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-green-500" />
              <div>
                <h3 className="font-semibold text-[#082545]">Statut Supabase</h3>
                <p className="text-xs text-gray-500">Connexion base de données</p>
              </div>
            </div>
            {expandedSections.supabase ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>

          {expandedSections.supabase && (
            <div className="p-4 pt-0 border-t border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium text-green-600">Connexion active</span>
              </div>

              {supabaseStats && (
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-gray-50 rounded p-2 text-center">
                    <p className="text-xl font-bold text-blue-600">{supabaseStats.leads}</p>
                    <p className="text-xs text-gray-500">Leads</p>
                  </div>
                  <div className="bg-gray-50 rounded p-2 text-center">
                    <p className="text-xl font-bold text-purple-600">{supabaseStats.sessions}</p>
                    <p className="text-xs text-gray-500">Sessions</p>
                  </div>
                  <div className="bg-gray-50 rounded p-2 text-center">
                    <p className="text-xl font-bold text-green-600">{supabaseStats.inscriptions}</p>
                    <p className="text-xs text-gray-500">Inscriptions</p>
                  </div>
                  <div className="bg-gray-50 rounded p-2 text-center">
                    <p className="text-xl font-bold text-orange-600">{supabaseStats.financements}</p>
                    <p className="text-xs text-gray-500">Financements</p>
                  </div>
                  <div className="bg-gray-50 rounded p-2 text-center">
                    <p className="text-xl font-bold text-pink-600">{supabaseStats.commandes}</p>
                    <p className="text-xs text-gray-500">Commandes</p>
                  </div>
                  <div className="bg-gray-50 rounded p-2 text-center">
                    <p className="text-xl font-bold text-indigo-600">{supabaseStats.equipe}</p>
                    <p className="text-xs text-gray-500">Équipe</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 6. Statut Stripe */}
        <div className="bg-white rounded-xl border">
          <button
            onClick={() => toggleSection('stripe')}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition"
          >
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-indigo-500" />
              <div>
                <h3 className="font-semibold text-[#082545]">Statut Stripe</h3>
                <p className="text-xs text-gray-500">Intégration paiements</p>
              </div>
            </div>
            {expandedSections.stripe ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>

          {expandedSections.stripe && (
            <div className="p-4 pt-0 border-t border-gray-100">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Mode</span>
                  <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full">Test</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Webhook</span>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                </div>
                <a
                  href="https://dashboard.stripe.com"
                  target="_blank"
                  className="flex items-center gap-2 text-sm text-[#2EC6F3] hover:text-[#1BA8D4]"
                >
                  <ExternalLink className="w-3 h-3" />
                  Dashboard Stripe
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}