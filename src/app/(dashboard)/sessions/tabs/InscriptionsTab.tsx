'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase-client'
import { SearchInput } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { EmptyState } from '@/components/ui/EmptyState'
import { IllustrationEmptyStagiaires } from '@/components/ui/Illustrations'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { Users, Calendar, Filter, Euro, CheckCircle, XCircle, Clock } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface Inscription {
  id: string
  statut: 'EN_ATTENTE' | 'CONFIRMEE' | 'EN_COURS' | 'COMPLETEE' | 'ANNULEE' | 'REMBOURSEE' | 'NO_SHOW'
  montant_total: number
  paiement_statut: 'EN_ATTENTE' | 'ACOMPTE' | 'PARTIEL' | 'PAYE' | 'REMBOURSE' | 'LITIGE'
  created_at: string
  lead: {
    id: string
    prenom: string
    nom: string
    email: string
  }
  session: {
    id: string
    date_debut: string
    formation: {
      nom: string
    }
  }
}

const STATUT_INSCRIPTION = {
  EN_ATTENTE: { label: 'En attente', color: '#F59E0B', icon: Clock },
  CONFIRMEE: { label: 'Confirmée', color: '#3B82F6', icon: CheckCircle },
  EN_COURS: { label: 'En cours', color: '#10B981', icon: Clock },
  COMPLETEE: { label: 'Terminée', color: '#FF2D78', icon: CheckCircle },
  ANNULEE: { label: 'Annulée', color: '#EF4444', icon: XCircle },
  REMBOURSEE: { label: 'Remboursée', color: '#6B7280', icon: XCircle },
  NO_SHOW: { label: 'No-show', color: '#EF4444', icon: XCircle }
}

const STATUT_PAIEMENT = {
  EN_ATTENTE: { label: 'En attente', color: '#F59E0B' },
  ACOMPTE: { label: 'Acompte', color: '#F97316' },
  PARTIEL: { label: 'Partiel', color: '#FF8C00' },
  PAYE: { label: 'Payé', color: '#10B981' },
  REMBOURSE: { label: 'Remboursé', color: '#6B7280' },
  LITIGE: { label: 'Litige', color: '#EF4444' }
}

export default function InscriptionsTab() {
  const supabase = createClient()
  const [search, setSearch] = useState('')
  const [sessionFilter, setSessionFilter] = useState('')
  const [statutFilter, setStatutFilter] = useState('')

  // Récupérer toutes les inscriptions
  const { data: inscriptions, isLoading } = useQuery({
    queryKey: ['inscriptions-all'],
    queryFn: async () => {
      const { data } = await supabase
        .from('inscriptions')
        .select(`
          id,
          statut,
          montant_total,
          paiement_statut,
          created_at,
          lead:leads!lead_id (
            id,
            prenom,
            nom,
            email
          ),
          session:sessions!session_id (
            id,
            date_debut,
            formation:formations (
              nom
            )
          )
        `)
        .order('created_at', { ascending: false })

      return data || []
    }
  })

  // Récupérer liste des sessions pour le filtre
  const { data: sessions } = useQuery({
    queryKey: ['sessions-list'],
    queryFn: async () => {
      const { data } = await supabase
        .from('sessions')
        .select(`
          id,
          date_debut,
          formation:formations (nom)
        `)
        .order('date_debut', { ascending: false })
        .limit(50)

      return data || []
    }
  })

  // Filtrer les inscriptions
  const filteredInscriptions = inscriptions?.filter(inscription => {
    const matchSearch = search === '' ||
      inscription.lead?.prenom?.toLowerCase().includes(search.toLowerCase()) ||
      inscription.lead?.nom?.toLowerCase().includes(search.toLowerCase()) ||
      inscription.session?.formation?.nom?.toLowerCase().includes(search.toLowerCase())

    const matchSession = sessionFilter === '' || inscription.session?.id === sessionFilter
    const matchStatut = statutFilter === '' || inscription.statut === statutFilter

    return matchSearch && matchSession && matchStatut
  })

  if (isLoading) {
    return <SkeletonTable rows={5} cols={6} />
  }

  // Stats
  const stats = {
    total: filteredInscriptions?.length || 0,
    confirmees: filteredInscriptions?.filter(i => i.statut === 'CONFIRMEE').length || 0,
    en_cours: filteredInscriptions?.filter(i => i.statut === 'EN_COURS').length || 0,
    completees: filteredInscriptions?.filter(i => i.statut === 'COMPLETEE').length || 0,
    ca_total: filteredInscriptions?.reduce((sum, i) => sum + (i.prix_total || 0), 0) || 0
  }

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Users className="w-6 h-6 text-gray-400" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Confirmées</p>
              <p className="text-xl font-bold text-blue-600">{stats.confirmees}</p>
            </div>
            <CheckCircle className="w-6 h-6 text-blue-400" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">En cours</p>
              <p className="text-xl font-bold text-green-600">{stats.en_cours}</p>
            </div>
            <Clock className="w-6 h-6 text-green-400" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Terminées</p>
              <p className="text-xl font-bold text-purple-600">{stats.completees}</p>
            </div>
            <CheckCircle className="w-6 h-6 text-purple-400" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">CA total</p>
              <p className="text-lg font-bold text-green-600">
                {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(stats.ca_total)}
              </p>
            </div>
            <Euro className="w-6 h-6 text-green-400" />
          </div>
        </Card>
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-4">
        <SearchInput
          value={search}
          onChange={(e: any) => setSearch(e.target ? e.target.value : e)}
          placeholder="Rechercher par nom ou formation..."
          className="sm:w-80"
        />

        <select
          value={sessionFilter}
          onChange={(e) => setSessionFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          <option value="">Toutes les sessions</option>
          {sessions?.map(session => (
            <option key={session.id} value={session.id}>
              {session.formation?.nom} - {new Date(session.date_debut).toLocaleDateString('fr-FR')}
            </option>
          ))}
        </select>

        <select
          value={statutFilter}
          onChange={(e) => setStatutFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          <option value="">Tous les statuts</option>
          <option value="EN_ATTENTE">En attente</option>
          <option value="CONFIRMEE">Confirmée</option>
          <option value="EN_COURS">En cours</option>
          <option value="COMPLETEE">Terminée</option>
          <option value="ANNULEE">Annulée</option>
        </select>
      </div>

      {/* Table des inscriptions */}
      {filteredInscriptions?.length === 0 ? (
        <Card>
          <EmptyState
            illustration={<IllustrationEmptyStagiaires size={120} />}
            icon={<Users className="w-7 h-7" />}
            title={search || sessionFilter || statutFilter ? "Aucune inscription trouvée" : "Aucune inscription"}
            description={search || sessionFilter || statutFilter ? "Modifiez vos filtres pour voir plus de résultats." : "Les inscriptions apparaîtront ici."}
          />
        </Card>
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
                    Session
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-6 py-3">
                    Formation
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-6 py-3">
                    Statut
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-6 py-3">
                    Paiement
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-6 py-3">
                    Date inscription
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredInscriptions?.map((inscription: any) => {
                  const statutConfig = STATUT_INSCRIPTION[inscription.statut as keyof typeof STATUT_INSCRIPTION] || STATUT_INSCRIPTION.EN_ATTENTE
                  const paiementConfig = STATUT_PAIEMENT[inscription.paiement_statut as keyof typeof STATUT_PAIEMENT] || STATUT_PAIEMENT.EN_ATTENTE
                  const StatusIcon = statutConfig.icon

                  return (
                    <tr key={inscription.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar
                            name={`${inscription.lead?.prenom} ${inscription.lead?.nom}`}
                            size="sm"
                          />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {inscription.lead?.prenom} {inscription.lead?.nom}
                            </p>
                            <p className="text-xs text-gray-500">{inscription.lead?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/session/${inscription.session?.id}`}
                          className="text-sm text-primary hover:text-accent transition"
                        >
                          {new Date(inscription.session?.date_debut || '').toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                          {inscription.session?.formation?.nom}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <StatusIcon className="w-4 h-4" style={{ color: statutConfig.color }} />
                          <Badge
                            className="border-0"
                            style={{
                              backgroundColor: `${statutConfig.color}15`,
                              color: statutConfig.color
                            }}
                            size="sm"
                          >
                            {statutConfig.label}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <Badge
                            className="border-0"
                            style={{
                              backgroundColor: `${paiementConfig.color}15`,
                              color: paiementConfig.color
                            }}
                            size="sm"
                          >
                            {paiementConfig.label}
                          </Badge>
                          <p className="text-xs text-gray-500">
                            {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(inscription.montant_total || 0)}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600">
                          {new Date(inscription.created_at).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(inscription.created_at).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
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