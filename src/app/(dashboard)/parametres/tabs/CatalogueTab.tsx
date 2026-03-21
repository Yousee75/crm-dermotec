'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { SearchInput } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { Card } from '@/components/ui/Card'
import { BookOpen, Plus, Eye, Edit, Clock, Users, Euro, Star } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'

// Type temporaire pour les formations
interface Formation {
  id: string
  titre: string
  categorie: 'maquillage' | 'epilation' | 'soins' | 'massage'
  duree_heures: number
  prix: number
  niveau: 'debutant' | 'intermediaire' | 'avance'
  certifiante: boolean
  nb_sessions: number
  nb_inscrits_total: number
  note_moyenne: number
  statut: 'active' | 'brouillon' | 'archivee'
  derniere_maj: string
}

// Mock data
const MOCK_FORMATIONS: Formation[] = [
  {
    id: '1',
    titre: 'Maquillage Permanent',
    categorie: 'maquillage',
    duree_heures: 35,
    prix: 2500,
    niveau: 'intermediaire',
    certifiante: true,
    nb_sessions: 8,
    nb_inscrits_total: 64,
    note_moyenne: 4.8,
    statut: 'active',
    derniere_maj: '2024-02-15T00:00:00Z'
  },
  {
    id: '2',
    titre: 'Épilation Laser',
    categorie: 'epilation',
    duree_heures: 21,
    prix: 1800,
    niveau: 'debutant',
    certifiante: true,
    nb_sessions: 6,
    nb_inscrits_total: 42,
    note_moyenne: 4.9,
    statut: 'active',
    derniere_maj: '2024-01-20T00:00:00Z'
  },
  {
    id: '3',
    titre: 'Dermo-cosmétique Avancée',
    categorie: 'soins',
    duree_heures: 28,
    prix: 3200,
    niveau: 'avance',
    certifiante: true,
    nb_sessions: 5,
    nb_inscrits_total: 35,
    note_moyenne: 4.7,
    statut: 'active',
    derniere_maj: '2024-03-01T00:00:00Z'
  },
  {
    id: '4',
    titre: 'Massage Thérapeutique',
    categorie: 'massage',
    duree_heures: 42,
    prix: 2800,
    niveau: 'intermediaire',
    certifiante: false,
    nb_sessions: 3,
    nb_inscrits_total: 12,
    note_moyenne: 4.6,
    statut: 'active',
    derniere_maj: '2024-02-28T00:00:00Z'
  },
  {
    id: '5',
    titre: 'Microblading Perfectionnement',
    categorie: 'maquillage',
    duree_heures: 14,
    prix: 1200,
    niveau: 'avance',
    certifiante: false,
    nb_sessions: 2,
    nb_inscrits_total: 8,
    note_moyenne: 4.9,
    statut: 'brouillon',
    derniere_maj: '2024-03-10T00:00:00Z'
  }
]

const CATEGORIE_CONFIG = {
  maquillage: { label: 'Maquillage', color: 'bg-pink-50 text-pink-700' },
  epilation: { label: 'Épilation', color: 'bg-purple-50 text-purple-700' },
  soins: { label: 'Soins', color: 'bg-green-50 text-green-700' },
  massage: { label: 'Massage', color: 'bg-blue-50 text-blue-700' }
}

const NIVEAU_CONFIG = {
  debutant: { label: 'Débutant', color: 'bg-green-50 text-green-700' },
  intermediaire: { label: 'Intermédiaire', color: 'bg-yellow-50 text-yellow-700' },
  avance: { label: 'Avancé', color: 'bg-red-50 text-red-700' }
}

const STATUT_CONFIG = {
  active: { label: 'Active', color: 'bg-green-50 text-green-700' },
  brouillon: { label: 'Brouillon', color: 'bg-gray-50 text-gray-600' },
  archivee: { label: 'Archivée', color: 'bg-red-50 text-red-700' }
}

export default function CatalogueTab() {
  const t = useTranslations('catalogue')
  const [search, setSearch] = useState('')
  const [categorieFilter, setCategorieFilter] = useState<string>('')
  const [statutFilter, setStatutFilter] = useState<string>('')

  const isLoading = false
  const formations = MOCK_FORMATIONS.filter(f =>
    (search === '' || f.titre.toLowerCase().includes(search.toLowerCase())) &&
    (categorieFilter === '' || f.categorie === categorieFilter) &&
    (statutFilter === '' || f.statut === statutFilter)
  )

  if (isLoading) {
    return <SkeletonTable rows={5} cols={8} />
  }

  // Calculs de stats
  const stats = {
    total: formations.length,
    actives: formations.filter(f => f.statut === 'active').length,
    brouillons: formations.filter(f => f.statut === 'brouillon').length,
    ca_potentiel: formations.reduce((sum, f) => sum + (f.prix * f.nb_sessions), 0),
    heures_total: formations.reduce((sum, f) => sum + (f.duree_heures * f.nb_sessions), 0)
  }

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Formations</p>
              <p className="text-xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <BookOpen className="w-8 h-8 text-gray-400" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Actives</p>
              <p className="text-xl font-bold text-green-600">{stats.actives}</p>
            </div>
            <Eye className="w-8 h-8 text-green-400" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">CA potentiel</p>
              <p className="text-xl font-bold text-blue-600">{stats.ca_potentiel.toLocaleString()}€</p>
            </div>
            <Euro className="w-8 h-8 text-blue-400" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Heures total</p>
              <p className="text-xl font-bold text-purple-600">{stats.heures_total}h</p>
            </div>
            <Clock className="w-8 h-8 text-purple-400" />
          </div>
        </Card>
      </div>

      {/* Répartition par catégorie */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Répartition par catégorie</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(CATEGORIE_CONFIG).map(([categorie, config]) => {
            const count = formations.filter(f => f.categorie === categorie).length
            const ca = formations.filter(f => f.categorie === categorie).reduce((sum, f) => sum + (f.prix * f.nb_sessions), 0)

            return (
              <div key={categorie} className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-900">{config.label}</p>
                <p className="text-lg font-bold text-gray-900">{count}</p>
                <p className="text-xs text-gray-500">{ca.toLocaleString()}€ CA</p>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Filtres et actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-3">
          <SearchInput
            value={search}
            onChange={(e: any) => setSearch(e.target ? e.target.value : e)}
            placeholder="Rechercher une formation..."
            className="w-80"
          />
          <select
            value={categorieFilter}
            onChange={(e) => setCategorieFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2EC6F3] focus:border-transparent"
          >
            <option value="">Toutes les catégories</option>
            <option value="maquillage">Maquillage</option>
            <option value="epilation">Épilation</option>
            <option value="soins">Soins</option>
            <option value="massage">Massage</option>
          </select>
          <select
            value={statutFilter}
            onChange={(e) => setStatutFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2EC6F3] focus:border-transparent"
          >
            <option value="">Tous les statuts</option>
            <option value="active">Active</option>
            <option value="brouillon">Brouillon</option>
            <option value="archivee">Archivée</option>
          </select>
        </div>
        <Button size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle formation
        </Button>
      </div>

      {/* Table des formations */}
      {formations.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="w-4 h-4" />}
          title={search || categorieFilter || statutFilter ? "Aucune formation trouvée" : "Aucune formation"}
          description={search || categorieFilter || statutFilter ? "Modifiez vos filtres pour voir plus de résultats." : "Créez votre première formation pour commencer."}
        />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/50 border-b border-gray-100">
                <tr>
                  <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-6 py-3">
                    Formation
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-6 py-3">
                    Catégorie
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-6 py-3">
                    Durée
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-6 py-3">
                    Prix
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-6 py-3">
                    Niveau
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-6 py-3">
                    Sessions
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-6 py-3">
                    Note
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-6 py-3">
                    Statut
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-6 py-3">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {formations.map((formation) => {
                  const categorieConfig = CATEGORIE_CONFIG[formation.categorie]
                  const niveauConfig = NIVEAU_CONFIG[formation.niveau]
                  const statutConfig = STATUT_CONFIG[formation.statut]

                  return (
                    <tr key={formation.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{formation.titre}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {formation.certifiante && (
                              <Badge variant="outline" size="sm">Certifiante</Badge>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={categorieConfig.color} size="sm">
                          {categorieConfig.label}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">{formation.duree_heures}h</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-gray-900">
                          {formation.prix.toLocaleString()}€
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={niveauConfig.color} size="sm">
                          {niveauConfig.label}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">{formation.nb_sessions}</span>
                          <span className="text-gray-400"> sessions</span>
                          <p className="text-xs text-gray-500">{formation.nb_inscrits_total} inscrits</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-400 fill-current" />
                          <span className="text-sm font-medium text-gray-900">
                            {formation.note_moyenne}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={statutConfig.color} size="sm">
                          {statutConfig.label}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="w-3 h-3 mr-1" />
                            Voir
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="w-3 h-3 mr-1" />
                            Modifier
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

      {/* Formations populaires */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 3 formations par popularité</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {formations
            .sort((a, b) => b.nb_inscrits_total - a.nb_inscrits_total)
            .slice(0, 3)
            .map((formation, index) => (
              <div key={formation.id} className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-medium ${
                  index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-500'
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{formation.titre}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>{formation.nb_inscrits_total} inscrits</span>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-400 fill-current" />
                      <span>{formation.note_moyenne}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </Card>
    </div>
  )
}