'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { SearchInput } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { IllustrationEmptyEquipe } from '@/components/ui/Illustrations'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { Card } from '@/components/ui/Card'
import { Users, Plus, UserCheck, Crown, Shield, Settings, Mail, Phone } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'

// Type temporaire pour les membres d'équipe
interface Membre {
  id: string
  prenom: string
  nom: string
  email: string
  telephone?: string
  role: 'admin' | 'formateur' | 'commercial' | 'secretariat'
  statut: 'actif' | 'inactif' | 'invite_pending'
  derniere_connexion?: string
  date_creation: string
}

// Mock data
const MOCK_EQUIPE: Membre[] = [
  {
    id: '1',
    prenom: 'Sophie',
    nom: 'Directrice',
    email: 'sophie@dermotec.fr',
    telephone: '01 42 34 56 78',
    role: 'admin',
    statut: 'actif',
    derniere_connexion: '2024-03-20T08:30:00Z',
    date_creation: '2023-06-01T00:00:00Z'
  },
  {
    id: '2',
    prenom: 'Julie',
    nom: 'Martin',
    email: 'julie.martin@dermotec.fr',
    telephone: '06 12 34 56 78',
    role: 'formateur',
    statut: 'actif',
    derniere_connexion: '2024-03-19T16:45:00Z',
    date_creation: '2023-08-15T00:00:00Z'
  },
  {
    id: '3',
    prenom: 'Thomas',
    nom: 'Commercial',
    email: 'thomas@dermotec.fr',
    role: 'commercial',
    statut: 'actif',
    derniere_connexion: '2024-03-20T09:15:00Z',
    date_creation: '2023-09-01T00:00:00Z'
  },
  {
    id: '4',
    prenom: 'Marie',
    nom: 'Assistante',
    email: 'marie@dermotec.fr',
    role: 'secretariat',
    statut: 'invite_pending',
    date_creation: '2024-03-15T00:00:00Z'
  }
]

const ROLE_CONFIG = {
  admin: {
    label: 'Administrateur',
    color: 'bg-[#FFE0EF] text-[#FF2D78] border-[#FF2D78]/30',
    icon: Crown
  },
  formateur: {
    label: 'Formateur',
    color: 'bg-[#E0EBF5] text-[#6B8CAE] border-[#6B8CAE]/30',
    icon: Users
  },
  commercial: {
    label: 'Commercial',
    color: 'bg-[#ECFDF5] text-[#10B981] border-[#10B981]/30',
    icon: UserCheck
  },
  secretariat: {
    label: 'Secrétariat',
    color: 'bg-[#FFE0EF] text-[#FF2D78] border-[#FF2D78]/30',
    icon: Settings
  }
}

const STATUT_CONFIG = {
  actif: {
    label: 'Actif',
    color: 'bg-[#ECFDF5] text-[#10B981] border-[#10B981]/30'
  },
  inactif: {
    label: 'Inactif',
    color: 'bg-[#FAF8F5] text-[#777777] border-[#EEEEEE]'
  },
  invite_pending: {
    label: 'Invitation en attente',
    color: 'bg-[#FFF3E8] text-[#FF8C42] border-[#FF8C42]/30'
  }
}

export default function EquipeTab() {
  const t = useTranslations('equipe')
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('')

  const isLoading = false
  const equipe = MOCK_EQUIPE.filter(m =>
    (search === '' || `${m.prenom} ${m.nom}`.toLowerCase().includes(search.toLowerCase()) || m.email.toLowerCase().includes(search.toLowerCase())) &&
    (roleFilter === '' || m.role === roleFilter)
  )

  if (isLoading) {
    return <SkeletonTable rows={5} cols={6} />
  }

  // Calculs de stats
  const stats = {
    total: equipe.length,
    actifs: equipe.filter(m => m.statut === 'actif').length,
    invitations: equipe.filter(m => m.statut === 'invite_pending').length,
    roles: {
      admin: equipe.filter(m => m.role === 'admin').length,
      formateur: equipe.filter(m => m.role === 'formateur').length,
      commercial: equipe.filter(m => m.role === 'commercial').length,
      secretariat: equipe.filter(m => m.role === 'secretariat').length
    }
  }

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#777777]">Membres total</p>
              <p className="text-xl font-bold text-[#111111]">{stats.total}</p>
            </div>
            <Users className="w-8 h-8 text-[#999999]" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#777777]">Actifs</p>
              <p className="text-xl font-bold text-[#10B981]">{stats.actifs}</p>
            </div>
            <UserCheck className="w-8 h-8 text-[#10B981]" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#777777]">Invitations</p>
              <p className="text-xl font-bold text-[#FF8C42]">{stats.invitations}</p>
            </div>
            <Mail className="w-8 h-8 text-yellow-400" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#777777]">Formateurs</p>
              <p className="text-xl font-bold text-[#6B8CAE]">{stats.roles.formateur}</p>
            </div>
            <Users className="w-8 h-8 text-[#6B8CAE]" />
          </div>
        </Card>
      </div>

      {/* Répartition par rôle */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-[#111111] mb-4">Répartition par rôle</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(ROLE_CONFIG).map(([role, config]) => {
            const RoleIcon = config.icon
            const count = stats.roles[role as keyof typeof stats.roles]

            return (
              <div key={role} className="text-center p-4 bg-[#FAF8F5] rounded-lg">
                <div className="w-10 h-10 mx-auto mb-2 bg-white rounded-lg flex items-center justify-center shadow-sm">
                  <RoleIcon className="w-5 h-5 text-[#777777]" />
                </div>
                <p className="text-sm font-medium text-[#111111]">{config.label}</p>
                <p className="text-xs text-[#777777]">{count} membre{count !== 1 ? 's' : ''}</p>
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
            placeholder="Rechercher un membre..."
            className="w-80"
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 border border-[#EEEEEE] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">Tous les rôles</option>
            <option value="admin">Administrateur</option>
            <option value="formateur">Formateur</option>
            <option value="commercial">Commercial</option>
            <option value="secretariat">Secrétariat</option>
          </select>
        </div>
        <Button size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Inviter un membre
        </Button>
      </div>

      {/* Liste de l'équipe */}
      {equipe.length === 0 ? (
        <EmptyState
          illustration={<IllustrationEmptyEquipe size={120} />}
          icon={<Users className="w-4 h-4" />}
          title={search || roleFilter ? "Aucun membre trouvé" : "Aucun membre d'équipe"}
          description={search || roleFilter ? "Modifiez vos filtres pour voir plus de résultats." : "Commencez par inviter des membres à rejoindre votre équipe."}
        />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-[#F4F0EB] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#FAF8F5]/50 border-b border-[#F4F0EB]">
                <tr>
                  <th className="text-left text-xs font-semibold text-[#777777] uppercase tracking-wider px-6 py-3">
                    Membre
                  </th>
                  <th className="text-left text-xs font-semibold text-[#777777] uppercase tracking-wider px-6 py-3">
                    Contact
                  </th>
                  <th className="text-left text-xs font-semibold text-[#777777] uppercase tracking-wider px-6 py-3">
                    Rôle
                  </th>
                  <th className="text-left text-xs font-semibold text-[#777777] uppercase tracking-wider px-6 py-3">
                    Statut
                  </th>
                  <th className="text-left text-xs font-semibold text-[#777777] uppercase tracking-wider px-6 py-3">
                    Dernière connexion
                  </th>
                  <th className="text-left text-xs font-semibold text-[#777777] uppercase tracking-wider px-6 py-3">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F4F0EB]">
                {equipe.map((membre) => {
                  const roleConfig = ROLE_CONFIG[membre.role]
                  const statutConfig = STATUT_CONFIG[membre.statut]
                  const RoleIcon = roleConfig.icon

                  return (
                    <tr key={membre.id} className="hover:bg-[#FAF8F5]/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar
                            name={`${membre.prenom} ${membre.nom}`}
                            size="md"
                            color="var(--color-primary)"
                          />
                          <div>
                            <p className="text-sm font-medium text-[#111111]">
                              {membre.prenom} {membre.nom}
                            </p>
                            <p className="text-xs text-[#777777]">
                              Rejoint le {new Date(membre.date_creation).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs text-[#777777]">
                            <Mail className="w-3 h-3" />
                            <span className="truncate">{membre.email}</span>
                          </div>
                          {membre.telephone && (
                            <div className="flex items-center gap-2 text-xs text-[#777777]">
                              <Phone className="w-3 h-3" />
                              <span>{membre.telephone}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <RoleIcon className="w-4 h-4" />
                          <Badge className={roleConfig.color} size="sm">
                            {roleConfig.label}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={statutConfig.color} size="sm">
                          {statutConfig.label}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        {membre.derniere_connexion ? (
                          <span className="text-sm text-[#777777]">
                            {new Date(membre.derniere_connexion).toLocaleDateString('fr-FR')}
                          </span>
                        ) : (
                          <span className="text-sm text-[#999999]">Jamais</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline">
                            <Settings className="w-3 h-3 mr-1" />
                            Modifier
                          </Button>
                          {membre.statut === 'invite_pending' && (
                            <Button size="sm" variant="outline">
                              <Mail className="w-3 h-3 mr-1" />
                              Renvoyer
                            </Button>
                          )}
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

      {/* Permissions par rôle */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-[#111111] mb-4">Permissions par rôle</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <h4 className="font-medium text-[#FF2D78] mb-3 flex items-center gap-2">
              <Crown className="w-4 h-4" />
              Administrateur
            </h4>
            <ul className="text-xs text-[#777777] space-y-1">
              <li>• Accès complet au CRM</li>
              <li>• Gestion de l'équipe</li>
              <li>• Configuration système</li>
              <li>• Exports de données</li>
              <li>• Analytics avancées</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-[#6B8CAE] mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Formateur
            </h4>
            <ul className="text-xs text-[#777777] space-y-1">
              <li>• Gestion des sessions</li>
              <li>• Émargement numérique</li>
              <li>• Suivi des apprenants</li>
              <li>• Génération d'attestations</li>
              <li>• Lecture seule des leads</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-[#10B981] mb-3 flex items-center gap-2">
              <UserCheck className="w-4 h-4" />
              Commercial
            </h4>
            <ul className="text-xs text-[#777777] space-y-1">
              <li>• Gestion des prospects</li>
              <li>• Pipeline de vente</li>
              <li>• Création de devis</li>
              <li>• Suivi des rappels</li>
              <li>• Analytics ventes</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-[#FF2D78] mb-3 flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Secrétariat
            </h4>
            <ul className="text-xs text-[#777777] space-y-1">
              <li>• Inscriptions formation</li>
              <li>• Gestion du planning</li>
              <li>• Suivi administratif</li>
              <li>• Documents stagiaires</li>
              <li>• Lecture seule facturation</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}