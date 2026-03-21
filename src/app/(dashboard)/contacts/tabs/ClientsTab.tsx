'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { SearchInput } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { Building2, Plus, Phone, Mail } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'

// Type temporaire pour les clients (à remplacer par le vrai hook)
interface Client {
  id: string
  nom: string
  email?: string
  telephone?: string
  secteur?: string
  nb_formations: number
  ca_total: number
  created_at: string
}

// Mock data temporaire
const MOCK_CLIENTS: Client[] = [
  {
    id: '1',
    nom: 'Institut Belle & Bien',
    email: 'contact@belle-bien.fr',
    telephone: '01 42 34 56 78',
    secteur: 'Esthétique',
    nb_formations: 3,
    ca_total: 7500,
    created_at: '2024-01-15T10:00:00Z'
  },
  {
    id: '2',
    nom: 'Centre Beauté Moderne',
    email: 'info@beaute-moderne.com',
    secteur: 'Esthétique',
    nb_formations: 1,
    ca_total: 2500,
    created_at: '2024-02-20T14:30:00Z'
  }
]

interface ClientsTabProps {
  onCreateClient?: () => void
}

export default function ClientsTab({ onCreateClient }: ClientsTabProps) {
  const t = useTranslations('clients')
  const [search, setSearch] = useState('')

  // TODO: Remplacer par le vrai hook useClients()
  const isLoading = false
  const clients = MOCK_CLIENTS.filter(c =>
    search === '' ||
    c.nom.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  )

  if (isLoading) {
    return <SkeletonTable rows={5} columns={5} />
  }

  if (clients.length === 0 && !search) {
    return (
      <EmptyState
        icon={Building2}
        title="Aucun client"
        description="Les prospects convertis apparaîtront ici en tant que clients actifs."
        action={
          <Button onClick={onCreateClient} className="mt-4" variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Ajouter un client
          </Button>
        }
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Barre de recherche */}
      <div className="flex justify-between items-center">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Rechercher un client..."
          className="w-80"
        />
        <Button onClick={onCreateClient} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Nouveau client
        </Button>
      </div>

      {/* Liste des clients */}
      {clients.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Aucun résultat"
          description="Aucun client ne correspond à votre recherche."
        />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/50 border-b border-gray-100">
                <tr>
                  <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-6 py-3">
                    Client
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-6 py-3">
                    Contact
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-6 py-3">
                    Formations
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-6 py-3">
                    CA Total
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-6 py-3">
                    Depuis
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {clients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <Link href={`/client/${client.id}`} className="group block">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white text-sm font-medium shadow-sm">
                            {client.nom.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 group-hover:text-[#2EC6F3] transition-colors">
                              {client.nom}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" size="xs">
                                {client.secteur || 'Esthétique'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {client.email && (
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <Mail className="w-3 h-3" />
                            <span className="truncate">{client.email}</span>
                          </div>
                        )}
                        {client.telephone && (
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <Phone className="w-3 h-3" />
                            <span>{client.telephone}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="primary" size="sm">
                        {client.nb_formations}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900">
                        {client.ca_total.toLocaleString('fr-FR')}€
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(client.created_at).toLocaleDateString('fr-FR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stats rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-100 p-4">
          <div className="text-sm text-gray-600">Total clients</div>
          <div className="text-xl font-semibold text-gray-900">{clients.length}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 p-4">
          <div className="text-sm text-gray-600">CA total</div>
          <div className="text-xl font-semibold text-gray-900">
            {clients.reduce((sum, c) => sum + c.ca_total, 0).toLocaleString('fr-FR')}€
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 p-4">
          <div className="text-sm text-gray-600">Formations totales</div>
          <div className="text-xl font-semibold text-gray-900">
            {clients.reduce((sum, c) => sum + c.nb_formations, 0)}
          </div>
        </div>
      </div>
    </div>
  )
}