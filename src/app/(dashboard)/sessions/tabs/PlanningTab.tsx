'use client'

import { useState } from 'react'
import { useSessions } from '@/hooks/use-sessions'
import { Calendar, Plus, Users, Clock, MapPin } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge, StatusBadge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { CreateSessionDialog } from '@/components/ui/CreateSessionDialog'
import { cn } from '@/lib/utils'

const statuts: Record<string, { label: string; color: string }> = {
  BROUILLON: { label: 'Brouillon', color: '#9CA3AF' },
  PLANIFIEE: { label: 'Planifiée', color: '#3B82F6' },
  CONFIRMEE: { label: 'Confirmée', color: '#22C55E' },
  EN_COURS: { label: 'En cours', color: '#F59E0B' },
  TERMINEE: { label: 'Terminée', color: '#6366F1' },
  ANNULEE: { label: 'Annulée', color: '#EF4444' },
  REPORTEE: { label: 'Reportée', color: '#F97316' },
}

interface PlanningTabProps {
  onCreateSession: () => void
}

export default function PlanningTab({ onCreateSession }: PlanningTabProps) {
  const now = new Date()
  const [month, setMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)
  const { data: sessions, isLoading } = useSessions({ month })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-gray-600">
          {sessions?.length || 0} sessions ce mois
        </p>
        <div className="flex items-center gap-3">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-[#2EC6F3] focus:ring-2 focus:ring-[#2EC6F3]/15 outline-none"
          />
          <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={onCreateSession}>
            Nouvelle session
          </Button>
        </div>
      </div>

      {/* Sessions grid */}
      <div className="grid gap-4">
        {isLoading ? (
          <div className="grid gap-4 stagger-children">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : sessions?.length === 0 ? (
          <Card>
            <EmptyState
              icon={<Calendar className="w-7 h-7" />}
              title="Aucune session ce mois"
              description="Planifiez votre première session de formation"
              action={{
                label: 'Nouvelle session',
                onClick: onCreateSession,
                icon: <Plus className="w-3.5 h-3.5" />,
              }}
            />
          </Card>
        ) : sessions?.map((session, i) => {
          const s = statuts[session.statut] || { label: session.statut, color: '#9CA3AF' }
          const placesRestantes = session.places_max - session.places_occupees
          const fillPercent = (session.places_occupees / session.places_max) * 100

          return (
            <Link key={session.id} href={`/session/${session.id}`}>
              <Card
                hover
                className="group animate-fadeIn"
                style={{ animationDelay: `${i * 60}ms` } as React.CSSProperties}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Title + status */}
                    <div className="flex items-center gap-2.5 mb-3">
                      <h3 className="font-semibold text-[#082545] group-hover:text-[#2EC6F3] transition truncate">
                        {session.formation?.nom}
                      </h3>
                      <StatusBadge status={session.statut} label={s.label} color={s.color} />
                    </div>

                    {/* Meta info */}
                    <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span>
                          {new Date(session.date_debut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                          {session.date_debut !== session.date_fin && (
                            <> → {new Date(session.date_fin).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <span>{session.horaire_debut} — {session.horaire_fin}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        <span>{session.salle}</span>
                      </div>
                    </div>

                    {/* Formatrice */}
                    {session.formatrice && (
                      <div className="flex items-center gap-2 mt-3">
                        <Avatar
                          name={`${session.formatrice.prenom} ${session.formatrice.nom}`}
                          size="xs"
                        />
                        <span className="text-xs text-gray-400">
                          {session.formatrice.prenom} {session.formatrice.nom}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Places indicator */}
                  <div className="shrink-0 w-28 text-right">
                    <div className="flex items-center justify-end gap-1.5 mb-2">
                      <Users className="w-3.5 h-3.5 text-gray-400" />
                      <span className={cn(
                        'text-sm font-semibold',
                        placesRestantes <= 0 ? 'text-red-500' : placesRestantes <= 2 ? 'text-amber-500' : 'text-gray-700'
                      )}>
                        {session.places_occupees}/{session.places_max}
                      </span>
                    </div>
                    <ProgressBar
                      value={session.places_occupees}
                      max={session.places_max}
                      size="md"
                      color={placesRestantes <= 0 ? '#EF4444' : placesRestantes <= 2 ? '#F59E0B' : '#2EC6F3'}
                    />
                    <p className="text-[10px] text-gray-400 mt-1">
                      {placesRestantes <= 0 ? 'Complet' : `${placesRestantes} place${placesRestantes > 1 ? 's' : ''} dispo`}
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}