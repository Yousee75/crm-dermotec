'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { SearchInput } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { IllustrationEmptyFinancement } from '@/components/ui/Illustrations'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { Card } from '@/components/ui/Card'
import { CreditCard, Plus, FileText, Clock, CheckCircle, AlertCircle, Euro } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'

// Type temporaire pour les financements
interface Financement {
  id: string
  apprenant_nom: string
  formation: string
  organisme: 'OPCO' | 'CPF' | 'Pôle Emploi' | 'Autofinancement'
  montant: number
  statut: 'en_attente' | 'en_cours' | 'accepte' | 'refuse'
  date_demande: string
  date_reponse?: string
}

// Mock data
const MOCK_FINANCEMENTS: Financement[] = [
  {
    id: '1',
    apprenant_nom: 'Julie Martin',
    formation: 'Maquillage Permanent',
    organisme: 'OPCO',
    montant: 2500,
    statut: 'en_cours',
    date_demande: '2024-03-01T10:00:00Z',
  },
  {
    id: '2',
    apprenant_nom: 'Sophie Dubois',
    formation: 'Épilation Laser',
    organisme: 'CPF',
    montant: 1800,
    statut: 'accepte',
    date_demande: '2024-02-15T14:30:00Z',
    date_reponse: '2024-02-20T09:15:00Z'
  },
  {
    id: '3',
    apprenant_nom: 'Marie Leroy',
    formation: 'Dermo-cosmétique',
    organisme: 'Pôle Emploi',
    montant: 3200,
    statut: 'en_attente',
    date_demande: '2024-03-10T16:45:00Z',
  }
]

const STATUT_CONFIG = {
  en_attente: {
    label: 'En attente',
    color: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    icon: Clock
  },
  en_cours: {
    label: 'En cours',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: FileText
  },
  accepte: {
    label: 'Accepté',
    color: 'bg-green-50 text-green-700 border-green-200',
    icon: CheckCircle
  },
  refuse: {
    label: 'Refusé',
    color: 'bg-red-50 text-red-700 border-red-200',
    icon: AlertCircle
  }
}

export default function FinancementTab() {
  const t = useTranslations('financement')
  const [search, setSearch] = useState('')
  const [statutFilter, setStatutFilter] = useState<string>('')

  const isLoading = false
  const financements = MOCK_FINANCEMENTS.filter(f =>
    (search === '' || f.apprenant_nom.toLowerCase().includes(search.toLowerCase()) || f.formation.toLowerCase().includes(search.toLowerCase())) &&
    (statutFilter === '' || f.statut === statutFilter)
  )

  if (isLoading) {
    return <SkeletonTable rows={5} cols={6} />
  }

  // Calculs de stats
  const stats = {
    total: financements.length,
    en_cours: financements.filter(f => f.statut === 'en_cours').length,
    accepte: financements.filter(f => f.statut === 'accepte').length,
    montant_total: financements.reduce((sum, f) => sum + f.montant, 0)
  }

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Dossiers totaux</p>
              <p className="text-xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">En cours</p>
              <p className="text-xl font-bold text-blue-600">{stats.en_cours}</p>
            </div>
            <Clock className="w-8 h-8 text-blue-400" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Acceptés</p>
              <p className="text-xl font-bold text-green-600">{stats.accepte}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Montant total</p>
              <p className="text-xl font-bold text-gray-900">{stats.montant_total.toLocaleString('fr-FR')}€</p>
            </div>
            <Euro className="w-8 h-8 text-gray-400" />
          </div>
        </Card>
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-3">
          <SearchInput
            value={search}
            onChange={(e: any) => setSearch(e.target ? e.target.value : e)}
            placeholder="Rechercher un dossier..."
            className="w-80"
          />
          <select
            value={statutFilter}
            onChange={(e) => setStatutFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">Tous les statuts</option>
            <option value="en_attente">En attente</option>
            <option value="en_cours">En cours</option>
            <option value="accepte">Accepté</option>
            <option value="refuse">Refusé</option>
          </select>
        </div>
        <Button size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Nouveau dossier
        </Button>
      </div>

      {/* Table des financements */}
      {financements.length === 0 ? (
        <EmptyState
          illustration={<IllustrationEmptyFinancement size={120} />}
          icon={<CreditCard className="w-4 h-4" />}
          title="Aucun dossier de financement"
          description="Les demandes de financement OPCO, CPF et Pôle Emploi apparaîtront ici."
        />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/50 border-b border-gray-100">
                <tr>
                  <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-6 py-3">
                    Apprenant
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-6 py-3">
                    Formation
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-6 py-3">
                    Organisme
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-6 py-3">
                    Montant
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-6 py-3">
                    Statut
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-6 py-3">
                    Demande
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-6 py-3">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {financements.map((financement) => {
                  const statutConfig = STATUT_CONFIG[financement.statut]
                  const StatutIcon = statutConfig.icon

                  return (
                    <tr key={financement.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white text-xs font-medium">
                            {financement.apprenant_nom.split(' ').map(n => n[0]).join('')}
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {financement.apprenant_nom}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-900">{financement.formation}</span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" size="sm">
                          {financement.organisme}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-gray-900">
                          {financement.montant.toLocaleString('fr-FR')}€
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
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(financement.date_demande).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/financement/${financement.id}`}
                          className="text-primary hover:text-primary-dark text-sm font-medium"
                        >
                          Voir détail
                        </Link>
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