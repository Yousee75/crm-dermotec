'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { SearchInput } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { Card } from '@/components/ui/Card'
import { AlertTriangle, Plus, MessageSquare, Clock, CheckCircle, XCircle } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'

// Type temporaire pour les réclamations
interface Reclamation {
  id: string
  numero: string
  apprenant_nom: string
  formation: string
  type: 'formation' | 'formateur' | 'organisation' | 'materiel' | 'autre'
  description: string
  statut: 'ouverte' | 'en_cours' | 'resolue' | 'fermee'
  gravite: 'faible' | 'moyenne' | 'elevee'
  date_creation: string
  date_resolution?: string
  responsable?: string
}

// Mock data
const MOCK_RECLAMATIONS: Reclamation[] = [
  {
    id: '1',
    numero: 'REC-2024-001',
    apprenant_nom: 'Sophie Martin',
    formation: 'Maquillage Permanent',
    type: 'materiel',
    description: 'Appareil de dermographe défaillant pendant le cours pratique',
    statut: 'resolue',
    gravite: 'moyenne',
    date_creation: '2024-02-15T10:00:00Z',
    date_resolution: '2024-02-16T14:30:00Z',
    responsable: 'Julie Formateur'
  },
  {
    id: '2',
    numero: 'REC-2024-002',
    apprenant_nom: 'Marie Dubois',
    formation: 'Épilation Laser',
    type: 'formation',
    description: 'Contenu théorique insuffisant sur les contre-indications',
    statut: 'en_cours',
    gravite: 'elevee',
    date_creation: '2024-03-01T14:30:00Z',
    responsable: 'Admin'
  },
  {
    id: '3',
    numero: 'REC-2024-003',
    apprenant_nom: 'Julie Leroy',
    formation: 'Dermo-cosmétique',
    type: 'organisation',
    description: 'Salle de formation trop petite pour le groupe',
    statut: 'ouverte',
    gravite: 'faible',
    date_creation: '2024-03-10T09:15:00Z'
  }
]

const TYPE_CONFIG = {
  formation: { label: 'Formation', color: 'bg-blue-50 text-blue-700' },
  formateur: { label: 'Formateur', color: 'bg-purple-50 text-purple-700' },
  organisation: { label: 'Organisation', color: 'bg-orange-50 text-orange-700' },
  materiel: { label: 'Matériel', color: 'bg-green-50 text-green-700' },
  autre: { label: 'Autre', color: 'bg-gray-50 text-gray-600' }
}

const STATUT_CONFIG = {
  ouverte: {
    label: 'Ouverte',
    color: 'bg-red-50 text-red-700 border-red-200',
    icon: AlertTriangle
  },
  en_cours: {
    label: 'En cours',
    color: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    icon: Clock
  },
  resolue: {
    label: 'Résolue',
    color: 'bg-green-50 text-green-700 border-green-200',
    icon: CheckCircle
  },
  fermee: {
    label: 'Fermée',
    color: 'bg-gray-50 text-gray-600 border-gray-200',
    icon: XCircle
  }
}

const GRAVITE_CONFIG = {
  faible: { label: 'Faible', color: 'bg-green-50 text-green-700' },
  moyenne: { label: 'Moyenne', color: 'bg-yellow-50 text-yellow-700' },
  elevee: { label: 'Élevée', color: 'bg-red-50 text-red-700' }
}

export default function ReclamationsTab() {
  const t = useTranslations('reclamations')
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [statutFilter, setStatutFilter] = useState<string>('')

  const isLoading = false
  const reclamations = MOCK_RECLAMATIONS.filter(r =>
    (search === '' || r.numero.toLowerCase().includes(search.toLowerCase()) || r.apprenant_nom.toLowerCase().includes(search.toLowerCase())) &&
    (typeFilter === '' || r.type === typeFilter) &&
    (statutFilter === '' || r.statut === statutFilter)
  )

  if (isLoading) {
    return <SkeletonTable rows={5} columns={7} />
  }

  // Calculs de stats
  const stats = {
    total: reclamations.length,
    ouvertes: reclamations.filter(r => r.statut === 'ouverte').length,
    en_cours: reclamations.filter(r => r.statut === 'en_cours').length,
    resolues: reclamations.filter(r => r.statut === 'resolue').length
  }

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Réclamations totales</p>
              <p className="text-xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <MessageSquare className="w-8 h-8 text-gray-400" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Ouvertes</p>
              <p className="text-xl font-bold text-red-600">{stats.ouvertes}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">En cours</p>
              <p className="text-xl font-bold text-yellow-600">{stats.en_cours}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-400" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Résolues</p>
              <p className="text-xl font-bold text-green-600">{stats.resolues}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </Card>
      </div>

      {/* Alerte réclamations urgentes */}
      {stats.ouvertes > 0 && (
        <Card className="p-4 border-red-200 bg-red-50">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">
                {stats.ouvertes} réclamation{stats.ouvertes > 1 ? 's' : ''} en attente de traitement
              </p>
              <p className="text-sm text-red-700">
                Traitez rapidement les réclamations pour maintenir votre certification Qualiopi.
              </p>
            </div>
            <Button size="sm" variant="outline" className="border-red-300 text-red-700 hover:bg-red-100">
              Traiter
            </Button>
          </div>
        </Card>
      )}

      {/* Filtres et actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-3">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Rechercher une réclamation..."
            className="w-80"
          />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2EC6F3] focus:border-transparent"
          >
            <option value="">Tous les types</option>
            <option value="formation">Formation</option>
            <option value="formateur">Formateur</option>
            <option value="organisation">Organisation</option>
            <option value="materiel">Matériel</option>
            <option value="autre">Autre</option>
          </select>
          <select
            value={statutFilter}
            onChange={(e) => setStatutFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2EC6F3] focus:border-transparent"
          >
            <option value="">Tous les statuts</option>
            <option value="ouverte">Ouverte</option>
            <option value="en_cours">En cours</option>
            <option value="resolue">Résolue</option>
            <option value="fermee">Fermée</option>
          </select>
        </div>
        <Button size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle réclamation
        </Button>
      </div>

      {/* Table des réclamations */}
      {reclamations.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title={search || typeFilter || statutFilter ? "Aucune réclamation trouvée" : "Aucune réclamation"}
          description={search || typeFilter || statutFilter ? "Modifiez vos filtres pour voir plus de résultats." : "Les réclamations d'apprenants apparaîtront ici."}
        />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/50 border-b border-gray-100">
                <tr>
                  <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-6 py-3">
                    Numéro
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-6 py-3">
                    Apprenant
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-6 py-3">
                    Formation
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-6 py-3">
                    Type
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-6 py-3">
                    Gravité
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-6 py-3">
                    Statut
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-6 py-3">
                    Date création
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-6 py-3">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reclamations.map((reclamation) => {
                  const statutConfig = STATUT_CONFIG[reclamation.statut]
                  const typeConfig = TYPE_CONFIG[reclamation.type]
                  const graviteConfig = GRAVITE_CONFIG[reclamation.gravite]
                  const StatutIcon = statutConfig.icon

                  return (
                    <tr key={reclamation.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-[#2EC6F3]">
                          {reclamation.numero}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-gray-900">{reclamation.apprenant_nom}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">{reclamation.formation}</span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={typeConfig.color} size="sm">
                          {typeConfig.label}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={graviteConfig.color} size="sm">
                          {graviteConfig.label}
                        </Badge>
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
                        <span className="text-sm text-gray-500">
                          {new Date(reclamation.date_creation).toLocaleDateString('fr-FR')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Button size="xs" variant="outline">
                          Voir détail
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Procédure de gestion */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Procédure de gestion des réclamations</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-red-600 font-bold">1</span>
            </div>
            <h4 className="font-medium text-gray-900 mb-1">Réception</h4>
            <p className="text-xs text-gray-600">Enregistrement dans les 24h</p>
          </div>
          <div className="text-center p-4">
            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-yellow-600 font-bold">2</span>
            </div>
            <h4 className="font-medium text-gray-900 mb-1">Analyse</h4>
            <p className="text-xs text-gray-600">Évaluation et plan d'action</p>
          </div>
          <div className="text-center p-4">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-blue-600 font-bold">3</span>
            </div>
            <h4 className="font-medium text-gray-900 mb-1">Traitement</h4>
            <p className="text-xs text-gray-600">Mise en œuvre des actions</p>
          </div>
          <div className="text-center p-4">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-green-600 font-bold">4</span>
            </div>
            <h4 className="font-medium text-gray-900 mb-1">Clôture</h4>
            <p className="text-xs text-gray-600">Validation et amélioration</p>
          </div>
        </div>
      </Card>
    </div>
  )
}