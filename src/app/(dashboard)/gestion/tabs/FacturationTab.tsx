'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { SearchInput } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { IllustrationEmptyCommandes } from '@/components/ui/Illustrations'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { Card } from '@/components/ui/Card'
import { Receipt, Plus, Download, Clock, CheckCircle, AlertTriangle, Eye } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'

// Type temporaire pour les factures
interface Facture {
  id: string
  numero: string
  client_nom: string
  montant_ht: number
  montant_ttc: number
  statut: 'brouillon' | 'envoyee' | 'payee' | 'en_retard'
  date_emission: string
  date_echeance: string
  date_paiement?: string
  formation: string
}

// Mock data
const MOCK_FACTURES: Facture[] = [
  {
    id: '1',
    numero: 'FAC-2024-001',
    client_nom: 'Institut Belle & Bien',
    montant_ht: 2083.33,
    montant_ttc: 2500,
    statut: 'payee',
    date_emission: '2024-02-01T00:00:00Z',
    date_echeance: '2024-03-01T00:00:00Z',
    date_paiement: '2024-02-28T00:00:00Z',
    formation: 'Maquillage Permanent'
  },
  {
    id: '2',
    numero: 'FAC-2024-002',
    client_nom: 'Centre Beauté Moderne',
    montant_ht: 1500,
    montant_ttc: 1800,
    statut: 'envoyee',
    date_emission: '2024-03-01T00:00:00Z',
    date_echeance: '2024-04-01T00:00:00Z',
    formation: 'Épilation Laser'
  },
  {
    id: '3',
    numero: 'FAC-2024-003',
    client_nom: 'OPCO Santé',
    montant_ht: 2666.67,
    montant_ttc: 3200,
    statut: 'en_retard',
    date_emission: '2024-01-15T00:00:00Z',
    date_echeance: '2024-02-15T00:00:00Z',
    formation: 'Dermo-cosmétique'
  },
  {
    id: '4',
    numero: 'BROU-2024-004',
    client_nom: 'Spa Wellness',
    montant_ht: 2083.33,
    montant_ttc: 2500,
    statut: 'brouillon',
    date_emission: '2024-03-15T00:00:00Z',
    date_echeance: '2024-04-15T00:00:00Z',
    formation: 'Massage thérapeutique'
  }
]

const STATUT_CONFIG = {
  brouillon: {
    label: 'Brouillon',
    color: 'bg-[#FAF8F5] text-[#777777] border-[#EEEEEE]',
    icon: Clock
  },
  envoyee: {
    label: 'Envoyée',
    color: 'bg-[#E0EBF5] text-[#6B8CAE] border-[#6B8CAE]/30',
    icon: Clock
  },
  payee: {
    label: 'Payée',
    color: 'bg-[#ECFDF5] text-[#10B981] border-[#10B981]/30',
    icon: CheckCircle
  },
  en_retard: {
    label: 'En retard',
    color: 'bg-[#FFE0EF] text-[#FF2D78] border-[#FF2D78]/30',
    icon: AlertTriangle
  }
}

export default function FacturationTab() {
  const t = useTranslations('facturation')
  const [search, setSearch] = useState('')
  const [statutFilter, setStatutFilter] = useState<string>('')

  const isLoading = false
  const factures = MOCK_FACTURES.filter(f =>
    (search === '' || f.numero.toLowerCase().includes(search.toLowerCase()) || f.client_nom.toLowerCase().includes(search.toLowerCase())) &&
    (statutFilter === '' || f.statut === statutFilter)
  )

  if (isLoading) {
    return <SkeletonTable rows={5} cols={7} />
  }

  // Calculs de stats
  const stats = {
    total: factures.length,
    ca_mensuel: factures.filter(f => f.statut === 'payee' && new Date(f.date_paiement!).getMonth() === new Date().getMonth()).reduce((sum, f) => sum + f.montant_ttc, 0),
    en_attente: factures.filter(f => f.statut === 'envoyee').reduce((sum, f) => sum + f.montant_ttc, 0),
    en_retard: factures.filter(f => f.statut === 'en_retard').length
  }

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#777777]">Factures totales</p>
              <p className="text-xl font-bold text-[#111111]">{stats.total}</p>
            </div>
            <Receipt className="w-8 h-8 text-[#999999]" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#777777]">CA ce mois</p>
              <p className="text-xl font-bold text-[#10B981]">{stats.ca_mensuel.toLocaleString('fr-FR')}€</p>
            </div>
            <CheckCircle className="w-8 h-8 text-[#10B981]" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#777777]">En attente</p>
              <p className="text-xl font-bold text-[#6B8CAE]">{stats.en_attente.toLocaleString('fr-FR')}€</p>
            </div>
            <Clock className="w-8 h-8 text-[#6B8CAE]" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#777777]">En retard</p>
              <p className="text-xl font-bold text-[#FF2D78]">{stats.en_retard}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-[#FF2D78]" />
          </div>
        </Card>
      </div>

      {/* Filtres et actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-3">
          <SearchInput
            value={search}
            onChange={(e: any) => setSearch(e.target ? e.target.value : e)}
            placeholder="Rechercher une facture..."
            className="w-80"
          />
          <select
            value={statutFilter}
            onChange={(e) => setStatutFilter(e.target.value)}
            className="px-3 py-2 border border-[#EEEEEE] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">Tous les statuts</option>
            <option value="brouillon">Brouillon</option>
            <option value="envoyee">Envoyée</option>
            <option value="payee">Payée</option>
            <option value="en_retard">En retard</option>
          </select>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle facture
          </Button>
        </div>
      </div>

      {/* Table des factures */}
      {factures.length === 0 ? (
        <EmptyState
          illustration={<IllustrationEmptyCommandes size={120} />}
          icon={<Receipt className="w-4 h-4" />}
          title="Aucune facture"
          description="Les factures de formation apparaîtront ici une fois émises."
        />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-[#F4F0EB] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#FAF8F5]/50 border-b border-[#F4F0EB]">
                <tr>
                  <th className="text-left text-xs font-semibold text-[#777777] uppercase tracking-wider px-6 py-3">
                    Numéro
                  </th>
                  <th className="text-left text-xs font-semibold text-[#777777] uppercase tracking-wider px-6 py-3">
                    Client
                  </th>
                  <th className="text-left text-xs font-semibold text-[#777777] uppercase tracking-wider px-6 py-3">
                    Formation
                  </th>
                  <th className="text-left text-xs font-semibold text-[#777777] uppercase tracking-wider px-6 py-3">
                    Montant HT
                  </th>
                  <th className="text-left text-xs font-semibold text-[#777777] uppercase tracking-wider px-6 py-3">
                    Montant TTC
                  </th>
                  <th className="text-left text-xs font-semibold text-[#777777] uppercase tracking-wider px-6 py-3">
                    Statut
                  </th>
                  <th className="text-left text-xs font-semibold text-[#777777] uppercase tracking-wider px-6 py-3">
                    Échéance
                  </th>
                  <th className="text-left text-xs font-semibold text-[#777777] uppercase tracking-wider px-6 py-3">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F4F0EB]">
                {factures.map((facture) => {
                  const statutConfig = STATUT_CONFIG[facture.statut]
                  const StatutIcon = statutConfig.icon
                  const isOverdue = facture.statut === 'envoyee' && new Date(facture.date_echeance) < new Date()

                  return (
                    <tr key={facture.id} className="hover:bg-[#FAF8F5]/50 transition-colors">
                      <td className="px-6 py-4">
                        <Link href={`/facture/${facture.id}`} className="text-primary hover:text-primary-dark font-medium text-sm">
                          {facture.numero}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-[#111111]">{facture.client_nom}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-[#777777]">{facture.formation}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-[#111111]">
                          {facture.montant_ht.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-[#111111]">
                          {facture.montant_ttc.toLocaleString('fr-FR')}€
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <StatutIcon className="w-4 h-4" />
                          <Badge className={statutConfig.color} size="sm">
                            {statutConfig.label}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-sm ${isOverdue ? 'text-[#FF2D78] font-medium' : 'text-[#777777]'}`}>
                          {new Date(facture.date_echeance).toLocaleDateString('fr-FR')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="w-3 h-3 mr-1" />
                            Voir
                          </Button>
                          <Button size="sm" variant="outline">
                            <Download className="w-3 h-3 mr-1" />
                            PDF
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}