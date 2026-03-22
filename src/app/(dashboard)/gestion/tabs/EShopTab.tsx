'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { SearchInput } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { Card } from '@/components/ui/Card'
import { ShoppingBag, Plus, Package, TrendingUp, Clock, CheckCircle, Truck } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'

// Type temporaire pour les commandes
interface Commande {
  id: string
  numero: string
  client_nom: string
  client_email: string
  produits: {
    nom: string
    quantite: number
    prix: number
  }[]
  montant_total: number
  statut: 'en_attente' | 'confirmee' | 'expediee' | 'livree'
  date_commande: string
  date_livraison?: string
}

// Mock data
const MOCK_COMMANDES: Commande[] = [
  {
    id: '1',
    numero: 'CMD-2024-001',
    client_nom: 'Sophie Martin',
    client_email: 'sophie.martin@email.com',
    produits: [
      { nom: 'Kit Maquillage Permanent', quantite: 1, prix: 299 },
      { nom: 'Pigments Couleur', quantite: 3, prix: 45 }
    ],
    montant_total: 434,
    statut: 'livree',
    date_commande: '2024-02-15T10:00:00Z',
    date_livraison: '2024-02-18T14:30:00Z'
  },
  {
    id: '2',
    numero: 'CMD-2024-002',
    client_nom: 'Julie Dubois',
    client_email: 'julie.dubois@email.com',
    produits: [
      { nom: 'Appareil Épilation Laser', quantite: 1, prix: 1299 }
    ],
    montant_total: 1299,
    statut: 'expediee',
    date_commande: '2024-03-01T14:30:00Z'
  },
  {
    id: '3',
    numero: 'CMD-2024-003',
    client_nom: 'Marie Leroy',
    client_email: 'marie.leroy@email.com',
    produits: [
      { nom: 'Formation Dermo-cosmétique', quantite: 1, prix: 2500 }
    ],
    montant_total: 2500,
    statut: 'confirmee',
    date_commande: '2024-03-10T09:15:00Z'
  }
]

const STATUT_CONFIG = {
  en_attente: {
    label: 'En attente',
    color: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    icon: Clock
  },
  confirmee: {
    label: 'Confirmée',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: CheckCircle
  },
  expediee: {
    label: 'Expédiée',
    color: 'bg-purple-50 text-purple-700 border-purple-200',
    icon: Truck
  },
  livree: {
    label: 'Livrée',
    color: 'bg-green-50 text-green-700 border-green-200',
    icon: CheckCircle
  }
}

export default function EShopTab() {
  const t = useTranslations('eshop')
  const [search, setSearch] = useState('')
  const [statutFilter, setStatutFilter] = useState<string>('')

  const isLoading = false
  const commandes = MOCK_COMMANDES.filter(c =>
    (search === '' || c.numero.toLowerCase().includes(search.toLowerCase()) || c.client_nom.toLowerCase().includes(search.toLowerCase())) &&
    (statutFilter === '' || c.statut === statutFilter)
  )

  if (isLoading) {
    return <SkeletonTable rows={5} cols={6} />
  }

  // Calculs de stats
  const stats = {
    total: commandes.length,
    ca_total: commandes.reduce((sum, c) => sum + c.montant_total, 0),
    en_cours: commandes.filter(c => ['en_attente', 'confirmee', 'expediee'].includes(c.statut)).length,
    panier_moyen: commandes.length > 0 ? commandes.reduce((sum, c) => sum + c.montant_total, 0) / commandes.length : 0
  }

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Commandes totales</p>
              <p className="text-xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <ShoppingBag className="w-8 h-8 text-gray-400" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">CA E-Shop</p>
              <p className="text-xl font-bold text-green-600">{stats.ca_total.toLocaleString('fr-FR')}€</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-400" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">En cours</p>
              <p className="text-xl font-bold text-orange-600">{stats.en_cours}</p>
            </div>
            <Package className="w-8 h-8 text-orange-400" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Panier moyen</p>
              <p className="text-xl font-bold text-blue-600">{stats.panier_moyen.toLocaleString('fr-FR')}€</p>
            </div>
            <ShoppingBag className="w-8 h-8 text-blue-400" />
          </div>
        </Card>
      </div>

      {/* Filtres et actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-3">
          <SearchInput
            value={search}
            onChange={(e: any) => setSearch(e.target ? e.target.value : e)}
            placeholder="Rechercher une commande..."
            className="w-80"
          />
          <select
            value={statutFilter}
            onChange={(e) => setStatutFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">Tous les statuts</option>
            <option value="en_attente">En attente</option>
            <option value="confirmee">Confirmée</option>
            <option value="expediee">Expédiée</option>
            <option value="livree">Livrée</option>
          </select>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Package className="w-4 h-4 mr-2" />
            Gérer stock
          </Button>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Nouveau produit
          </Button>
        </div>
      </div>

      {/* Table des commandes */}
      {commandes.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag className="w-4 h-4" />}
          title="Aucune commande"
          description="Les commandes de produits et formations en ligne apparaîtront ici."
        />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/50 border-b border-gray-100">
                <tr>
                  <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-6 py-3">
                    Commande
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-6 py-3">
                    Client
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-6 py-3">
                    Produits
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-6 py-3">
                    Montant
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-6 py-3">
                    Statut
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-6 py-3">
                    Date
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-6 py-3">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {commandes.map((commande) => {
                  const statutConfig = STATUT_CONFIG[commande.statut]
                  const StatutIcon = statutConfig.icon

                  return (
                    <tr key={commande.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <Link href={`/commande/${commande.id}`} className="text-primary hover:text-[#1A94CC] font-medium text-sm">
                          {commande.numero}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <span className="text-sm font-medium text-gray-900">{commande.client_nom}</span>
                          <p className="text-xs text-gray-500">{commande.client_email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {commande.produits.slice(0, 2).map((produit, index) => (
                            <div key={index} className="text-xs text-gray-600">
                              {produit.nom} × {produit.quantite}
                            </div>
                          ))}
                          {commande.produits.length > 2 && (
                            <div className="text-xs text-gray-400">
                              +{commande.produits.length - 2} autres
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-gray-900">
                          {commande.montant_total.toLocaleString('fr-FR')}€
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
                        <div>
                          <span className="text-sm text-gray-500">
                            {new Date(commande.date_commande).toLocaleDateString('fr-FR')}
                          </span>
                          {commande.date_livraison && (
                            <p className="text-xs text-green-600">
                              Livré le {new Date(commande.date_livraison).toLocaleDateString('fr-FR')}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Button size="sm" variant="outline">
                          Détails
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

      {/* Produits populaires */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Produits les plus vendus</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-[#2EC6F3] to-[#1A94CC] rounded-lg flex items-center justify-center text-white font-medium">
              1
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Kit Maquillage Permanent</p>
              <p className="text-xs text-gray-500">12 ventes · 299€</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center text-white font-medium">
              2
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Pigments Couleur</p>
              <p className="text-xs text-gray-500">8 ventes · 45€</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center text-white font-medium">
              3
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Appareil Épilation Laser</p>
              <p className="text-xs text-gray-500">3 ventes · 1299€</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}