'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { SearchInput } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { IllustrationEmptyStagiaires } from '@/components/ui/Illustrations'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { GraduationCap, Plus, Phone, Mail, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'

// Type temporaire pour les apprenants (à remplacer par le vrai hook)
interface Apprenant {
  id: string
  prenom: string
  nom: string
  email?: string
  telephone?: string
  formations_suivies: number
  formations_en_cours: number
  certifie: boolean
  derniere_formation: string
  created_at: string
}

// Mock data temporaire
const MOCK_APPRENANTS: Apprenant[] = [
  {
    id: '1',
    prenom: 'Julie',
    nom: 'Martin',
    email: 'julie.martin@email.com',
    telephone: '06 12 34 56 78',
    formations_suivies: 2,
    formations_en_cours: 1,
    certifie: true,
    derniere_formation: 'Maquillage Permanent',
    created_at: '2024-01-15T10:00:00Z'
  },
  {
    id: '2',
    prenom: 'Sophie',
    nom: 'Dubois',
    email: 'sophie.dubois@email.com',
    formations_suivies: 1,
    formations_en_cours: 0,
    certifie: true,
    derniere_formation: 'Épilation Laser',
    created_at: '2024-02-20T14:30:00Z'
  },
  {
    id: '3',
    prenom: 'Marie',
    nom: 'Leroy',
    email: 'marie.leroy@email.com',
    formations_suivies: 0,
    formations_en_cours: 1,
    certifie: false,
    derniere_formation: 'Dermo-cosmétique',
    created_at: '2024-03-10T09:15:00Z'
  }
]

interface ApprenantsTabProps {
  onCreateApprenant?: () => void
}

export default function ApprenantsTab({ onCreateApprenant }: ApprenantsTabProps) {
  const t = useTranslations('apprenants')
  const [search, setSearch] = useState('')

  // Donnees de demonstration — brancher sur useApprenants() quand la table apprenants sera creee
  const isLoading = false
  const apprenants = MOCK_APPRENANTS.filter(a =>
    search === '' ||
    `${a.prenom} ${a.nom}`.toLowerCase().includes(search.toLowerCase()) ||
    a.email?.toLowerCase().includes(search.toLowerCase())
  )

  if (isLoading) {
    return <SkeletonTable rows={5} cols={5} />
  }

  if (apprenants.length === 0 && !search) {
    return (
      <EmptyState
        illustration={<IllustrationEmptyStagiaires size={120} />}
        icon={<GraduationCap className="w-4 h-4" />}
        title="Aucun apprenant"
        description="Les personnes inscrites aux formations apparaîtront ici."
        action={{ label: 'Ajouter un apprenant', onClick: () => onCreateApprenant?.(), icon: <Plus className="w-4 h-4" /> }}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Barre de recherche */}
      <div className="flex justify-between items-center">
        <SearchInput
          value={search}
          onChange={(e: any) => setSearch(e.target ? e.target.value : e)}
          placeholder="Rechercher un apprenant..."
          className="w-80"
        />
        <Button onClick={onCreateApprenant} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Nouvel apprenant
        </Button>
      </div>

      {/* Liste des apprenants */}
      {apprenants.length === 0 ? (
        <EmptyState
          illustration={<IllustrationEmptyStagiaires size={120} />}
          icon={<GraduationCap className="w-4 h-4" />}
          title="Aucun résultat"
          description="Aucun apprenant ne correspond à votre recherche."
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
                    Contact
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-6 py-3">
                    Formations
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-6 py-3">
                    Statut
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-6 py-3">
                    Dernière formation
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {apprenants.map((apprenant) => (
                  <tr key={apprenant.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <Link href={`/apprenant/${apprenant.id}`} className="group block">
                        <div className="flex items-center gap-3">
                          <Avatar
                            name={`${apprenant.prenom} ${apprenant.nom}`}
                            size="md"
                            color="var(--color-primary)"
                          />
                          <div>
                            <p className="text-sm font-medium text-gray-900 group-hover:text-primary transition-colors">
                              {apprenant.prenom} {apprenant.nom}
                            </p>
                            {apprenant.certifie && (
                              <div className="flex items-center gap-1 mt-1">
                                <CheckCircle className="w-3 h-3 text-green-500" />
                                <span className="text-xs text-green-600">Certifié</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {apprenant.email && (
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <Mail className="w-3 h-3" />
                            <span className="truncate">{apprenant.email}</span>
                          </div>
                        )}
                        {apprenant.telephone && (
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <Phone className="w-3 h-3" />
                            <span>{apprenant.telephone}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Badge variant="primary" size="sm">
                          {apprenant.formations_suivies} terminées
                        </Badge>
                        {apprenant.formations_en_cours > 0 && (
                          <Badge variant="warning" size="sm">
                            {apprenant.formations_en_cours} en cours
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {apprenant.formations_en_cours > 0 ? (
                          <Badge variant="warning" size="sm">En formation</Badge>
                        ) : apprenant.formations_suivies > 0 ? (
                          <Badge variant="success" size="sm">Alumni</Badge>
                        ) : (
                          <Badge variant="outline" size="sm">Inscrit</Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900">{apprenant.derniere_formation}</span>
                      <p className="text-xs text-gray-500">
                        Inscrit le {new Date(apprenant.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stats rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-100 p-4">
          <div className="text-sm text-gray-600">Total apprenants</div>
          <div className="text-xl font-semibold text-gray-900">{apprenants.length}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 p-4">
          <div className="text-sm text-gray-600">En formation</div>
          <div className="text-xl font-semibold text-orange-600">
            {apprenants.filter(a => a.formations_en_cours > 0).length}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 p-4">
          <div className="text-sm text-gray-600">Certifiés</div>
          <div className="text-xl font-semibold text-green-600">
            {apprenants.filter(a => a.certifie).length}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 p-4">
          <div className="text-sm text-gray-600">Alumni</div>
          <div className="text-xl font-semibold text-blue-600">
            {apprenants.filter(a => a.formations_suivies > 0 && a.formations_en_cours === 0).length}
          </div>
        </div>
      </div>
    </div>
  )
}