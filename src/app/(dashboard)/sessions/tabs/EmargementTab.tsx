'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase-client'
import { SearchInput } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonCard } from '@/components/ui/Skeleton'
import {
  QrCode, Calendar, MapPin, Users, Clock, ExternalLink,
  CheckCircle, AlertCircle, Play, Square
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface SessionEmargement {
  id: string
  date_debut: string
  date_fin: string
  horaire_debut: string
  horaire_fin: string
  salle: string
  statut: string
  places_occupees: number
  formation: {
    nom: string
    duree_heures: number
  }
  formatrice: {
    prenom: string
    nom: string
  }
  inscriptions: Array<{
    id: string
    statut: string
    lead: {
      prenom: string
      nom: string
    }
  }>
}

// Couleurs centralisées (source unique : status-config.ts)
import { SESSION_STATUS } from '@/lib/status-config'
const STATUT_SESSION = {
  PLANIFIEE: { ...SESSION_STATUS.PLANIFIEE, icon: Calendar },
  CONFIRMEE: { ...SESSION_STATUS.CONFIRMEE, icon: CheckCircle },
  EN_COURS: { ...SESSION_STATUS.EN_COURS, icon: Play },
  TERMINEE: { ...SESSION_STATUS.TERMINEE, icon: CheckCircle },
  ANNULEE: { ...SESSION_STATUS.ANNULEE, icon: Square },
}

export default function EmargementTab() {
  const supabase = createClient()
  const [search, setSearch] = useState('')
  const [statutFilter, setStatutFilter] = useState('EN_COURS,TERMINEE')

  // Récupérer les sessions éligibles à l'émargement
  const { data: sessions, isLoading } = useQuery({
    queryKey: ['sessions-emargement', statutFilter],
    queryFn: async () => {
      const statuts = statutFilter ? statutFilter.split(',') : ['EN_COURS', 'TERMINEE']

      const { data } = await supabase
        .from('sessions')
        .select(`
          id,
          date_debut,
          date_fin,
          horaire_debut,
          horaire_fin,
          salle,
          statut,
          places_occupees,
          formation:formations (
            nom,
            duree_heures
          ),
          formatrice:equipe!formatrice_id (
            prenom,
            nom
          ),
          inscriptions!inner (
            id,
            statut,
            lead:leads!lead_id (
              prenom,
              nom
            )
          )
        `)
        .in('statut', statuts)
        .gte('date_debut', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Derniers 30 jours
        .order('date_debut', { ascending: false })

      return data || []
    }
  })

  // Filtrer les sessions
  const filteredSessions = sessions?.filter(session => {
    if (!search) return true

    const searchLower = search.toLowerCase()
    return (
      session.formation?.nom?.toLowerCase().includes(searchLower) ||
      session.salle?.toLowerCase().includes(searchLower) ||
      session.formatrice?.nom?.toLowerCase().includes(searchLower) ||
      session.formatrice?.prenom?.toLowerCase().includes(searchLower)
    )
  })

  if (isLoading) {
    return (
      <div className="grid gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    )
  }

  const generateQrCodeUrl = (sessionId: string) => {
    const baseUrl = process.env.NODE_ENV === 'production'
      ? 'https://votre-app.dermotec.fr'
      : 'http://localhost:3000'
    return `${baseUrl}/emargement/${sessionId}`
  }

  return (
    <div className="space-y-6">
      {/* En-tête et filtres */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-3">
          <SearchInput
            value={search}
            onChange={(e: any) => setSearch(e.target ? e.target.value : e)}
            placeholder="Rechercher une session..."
            className="sm:w-80"
          />

          <select
            value={statutFilter}
            onChange={(e) => setStatutFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2EC6F3] focus:border-transparent"
          >
            <option value="EN_COURS,TERMINEE">En cours et terminées</option>
            <option value="EN_COURS">En cours uniquement</option>
            <option value="TERMINEE">Terminées uniquement</option>
            <option value="CONFIRMEE,EN_COURS,TERMINEE">Toutes les sessions actives</option>
          </select>
        </div>

        <div className="text-sm text-gray-500">
          {filteredSessions?.length || 0} session{(filteredSessions?.length || 0) > 1 ? 's' : ''} trouvée{(filteredSessions?.length || 0) > 1 ? 's' : ''}
        </div>
      </div>

      {/* Liste des sessions */}
      {filteredSessions?.length === 0 ? (
        <Card>
          <EmptyState
            icon={<QrCode className="w-7 h-7" />}
            title={search || statutFilter !== 'EN_COURS,TERMINEE' ? "Aucune session trouvée" : "Aucune session en émargement"}
            description={search || statutFilter !== 'EN_COURS,TERMINEE' ? "Modifiez vos filtres pour voir plus de résultats." : "Les sessions en cours ou terminées récemment apparaîtront ici."}
          />
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredSessions?.map((session, i) => {
            const statutConfig = STATUT_SESSION[session.statut as keyof typeof STATUT_SESSION] || STATUT_SESSION.PLANIFIEE
            const StatusIcon = statutConfig.icon
            const inscriptionsConfirmees = session.inscriptions?.filter(i => i.statut === 'CONFIRMEE' || i.statut === 'EN_COURS') || []
            const qrCodeUrl = generateQrCodeUrl(session.id)

            return (
              <Card
                key={session.id}
                className="p-6 animate-fadeIn"
                style={{ animationDelay: `${i * 60}ms` } as React.CSSProperties}
              >
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-1 min-w-0">
                    {/* En-tête */}
                    <div className="flex items-center gap-3 mb-4">
                      <h3 className="text-lg font-semibold text-[#082545] truncate">
                        {session.formation?.nom}
                      </h3>
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
                    </div>

                    {/* Informations session */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>
                          {new Date(session.date_debut).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                          {session.date_debut !== session.date_fin && (
                            <> → {new Date(session.date_fin).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</>
                          )}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span>{session.horaire_debut} — {session.horaire_fin}</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span>{session.salle}</span>
                      </div>
                    </div>

                    {/* Formatrice */}
                    {session.formatrice && (
                      <div className="text-sm text-gray-600 mb-4">
                        <span className="font-medium">Formatrice :</span> {session.formatrice.prenom} {session.formatrice.nom}
                      </div>
                    )}

                    {/* Participants confirmés */}
                    <div className="text-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-700">
                          {inscriptionsConfirmees.length} participant{inscriptionsConfirmees.length > 1 ? 's' : ''} confirmé{inscriptionsConfirmees.length > 1 ? 's' : ''}
                        </span>
                      </div>
                      {inscriptionsConfirmees.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {inscriptionsConfirmees.slice(0, 5).map((inscription) => (
                            <Badge key={inscription.id} variant="outline" size="sm">
                              {inscription.lead?.prenom} {inscription.lead?.nom}
                            </Badge>
                          ))}
                          {inscriptionsConfirmees.length > 5 && (
                            <Badge variant="outline" size="sm">
                              +{inscriptionsConfirmees.length - 5} autre{inscriptionsConfirmees.length - 5 > 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions émargement */}
                  <div className="shrink-0 text-right space-y-3">
                    {/* QR Code */}
                    <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center mb-2">
                      <QrCode className="w-8 h-8 text-gray-400" />
                    </div>

                    <div className="space-y-2">
                      <Button size="sm" variant="outline" className="w-full">
                        <QrCode className="w-3.5 h-3.5 mr-1.5" />
                        Générer QR
                      </Button>

                      <Link href={`/session/${session.id}/emargement`}>
                        <Button size="sm" className="w-full">
                          <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                          Émargement
                        </Button>
                      </Link>

                      <Link href={`/session/${session.id}`}>
                        <Button size="sm" variant="ghost" className="w-full text-xs">
                          Voir session
                        </Button>
                      </Link>
                    </div>

                    {/* URL QR Code (pour développement) */}
                    <div className="text-xs text-gray-400 max-w-24 break-all">
                      {qrCodeUrl}
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Info box */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-blue-900 mb-1">À propos de l'émargement</p>
            <p className="text-blue-700">
              Les codes QR permettent aux apprenants de s'émarginer automatiquement sur leurs appareils mobiles.
              Les sessions en cours et terminées récemment sont disponibles pour l'émargement.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}