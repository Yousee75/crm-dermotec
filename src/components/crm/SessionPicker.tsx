'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useSessions } from '@/hooks/use-sessions'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent } from '@/components/ui/Card'
import { Progress } from '@/components/ui/progress'
import { Avatar } from '@/components/ui/Avatar'
import { FORMATIONS_SEED } from '@/lib/constants'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import {
  Calendar, Clock, MapPin, Users, AlertTriangle,
  CheckCircle, Plus, User
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SessionPickerProps {
  formationId?: string
  onSelect: (sessionId: string) => void
  selectedSessionId?: string
}

const getInitials = (nom?: string, prenom?: string) => {
  if (!nom && !prenom) return 'FM'
  const n = nom?.charAt(0) || ''
  const p = prenom?.charAt(0) || ''
  return `${p}${n}`.toUpperCase()
}

const getAvatarColor = (avatarColor?: string) => {
  const colors = {
    blue: 'bg-[#6B8CAE]',
    green: 'bg-[#10B981]',
    purple: 'bg-[#FF2D78]',
    orange: 'bg-orange-500',
    pink: 'bg-pink-500',
    red: 'bg-[#FF2D78]',
    indigo: 'bg-[#FF5C00]',
    yellow: 'bg-[#FF8C42]',
  }
  return colors[avatarColor as keyof typeof colors] || 'bg-slate-500'
}

const getFillPercentage = (placesOccupees: number, placesMax: number) => {
  return Math.round((placesOccupees / placesMax) * 100)
}

const getFillColor = (percentage: number) => {
  if (percentage >= 90) return 'bg-[#FF2D78]'
  if (percentage >= 70) return 'bg-orange-500'
  if (percentage >= 50) return 'bg-[#FF8C42]'
  return 'bg-[#10B981]'
}

export default function SessionPicker({ formationId, onSelect, selectedSessionId }: SessionPickerProps) {
  const { data: sessions, isLoading } = useSessions({
    formation_id: formationId,
    statut: 'PROGRAMMEE'
  })
  const [selectedSession, setSelectedSession] = useState<string | null>(selectedSessionId || null)

  // Filtrer les sessions futures avec places disponibles
  const availableSessions = sessions?.filter(session => {
    const sessionDate = new Date(session.date_debut)
    const today = new Date()
    const placesOccupees = session.inscriptions?.length || 0
    const placesMax = session.places_max || 12

    return sessionDate > today && placesOccupees < placesMax
  }).sort((a, b) => new Date(a.date_debut).getTime() - new Date(b.date_debut).getTime()) || []

  const handleSelectSession = (sessionId: string) => {
    setSelectedSession(sessionId)
    onSelect(sessionId)
    toast.success('Session sélectionnée')
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 bg-slate-100 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  const formation = formationId ?
    FORMATIONS_SEED.find(f => f.slug === formationId) :
    null

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="font-medium text-slate-900">
          {formation ? `Sessions pour "${formation.nom}"` : 'Sélectionner une session'}
        </h3>
        {availableSessions.length > 0 && (
          <Badge variant="outline" className="text-xs">
            {availableSessions.length} session{availableSessions.length > 1 ? 's' : ''} disponible{availableSessions.length > 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {availableSessions.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <Calendar className="h-12 w-12 text-slate-400 mb-4" />
            <h4 className="font-medium text-slate-900 mb-2">
              Aucune session disponible
            </h4>
            <p className="text-sm text-slate-600 mb-4">
              {formation
                ? `Aucune session programmée pour "${formation.nom}"`
                : 'Aucune session programmée pour cette formation'
              }
            </p>
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => toast.info('Ouverture du formulaire de création de session')}
            >
              <Plus className="h-4 w-4" />
              Créer une session
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {availableSessions.map((session, index) => {
            const placesOccupees = session.inscriptions?.length || 0
            const placesMax = session.places_max || 12
            const placesDisponibles = placesMax - placesOccupees
            const fillPercentage = getFillPercentage(placesOccupees, placesMax)
            const isSelected = selectedSession === session.id
            const isAlmostFull = fillPercentage >= 80

            const dateDebut = new Date(session.date_debut)
            const dateFin = new Date(session.date_fin)
            const isSameDay = dateDebut.toDateString() === dateFin.toDateString()

            return (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={cn(
                  'cursor-pointer transition-all duration-200 hover:shadow-md',
                  isSelected && 'ring-2 ring-primary ring-offset-2 shadow-lg',
                  isAlmostFull && 'border-orange-200 bg-orange-50/30'
                )}>
                  <CardContent
                    className="p-4"
                    onClick={() => handleSelectSession(session.id)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-slate-900">
                            {dateDebut.toLocaleDateString('fr-FR', {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </h4>
                          {isSelected && (
                            <CheckCircle className="h-5 w-5 text-primary" />
                          )}
                          {isAlmostFull && (
                            <Badge variant="secondary" className="px-2 py-0.5 text-xs bg-orange-100 text-orange-700">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Bientôt complet
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-sm text-slate-600 mb-3">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>
                              {isSameDay
                                ? `${session.horaire_debut || '09:00'} - ${session.horaire_fin || '17:00'}`
                                : `Du ${dateDebut.toLocaleDateString('fr-FR')} au ${dateFin.toLocaleDateString('fr-FR')}`
                              }
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            <span>75 Bd Richard Lenoir, Paris 11e</span>
                          </div>
                        </div>

                        {/* Formatrice */}
                        {session.formatrice && (
                          <div className="flex items-center gap-2 mb-3">
                            <Avatar
                              name={`${session.formatrice.prenom} ${session.formatrice.nom}`}
                              color={session.formatrice.avatar_color}
                              size="sm"
                            />
                            <div>
                              <p className="text-sm font-medium text-slate-900">
                                {session.formatrice.prenom} {session.formatrice.nom}
                              </p>
                              <p className="text-xs text-slate-500">Formatrice</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Jauge de places */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-slate-500" />
                          <span className="text-slate-700">Places disponibles</span>
                        </div>
                        <span className={cn(
                          'font-medium',
                          placesDisponibles <= 2 ? 'text-[#FF2D78]' :
                          placesDisponibles <= 5 ? 'text-orange-600' : 'text-[#10B981]'
                        )}>
                          {placesDisponibles} / {placesMax}
                        </span>
                      </div>

                      <div className="relative">
                        <Progress
                          value={fillPercentage}
                          className="h-2"
                        />
                        <div
                          className={cn(
                            'absolute top-0 left-0 h-2 rounded-full transition-all duration-300',
                            getFillColor(fillPercentage)
                          )}
                          style={{ width: `${fillPercentage}%` }}
                        />
                      </div>

                      {placesDisponibles <= 3 && (
                        <div className="flex items-center gap-1 text-xs text-[#FF8C42] mt-1">
                          <AlertTriangle className="h-3 w-3" />
                          <span>Plus que {placesDisponibles} place{placesDisponibles > 1 ? 's' : ''}</span>
                        </div>
                      )}
                    </div>

                    {/* Footer avec action */}
                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <Button
                        className={cn(
                          'w-full min-h-[44px]',
                          isSelected
                            ? 'bg-primary hover:bg-primary-dark text-white'
                            : 'variant-outline'
                        )}
                        variant={isSelected ? 'default' : 'outline'}
                      >
                        {isSelected ? (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Session sélectionnée
                          </>
                        ) : (
                          <>
                            <Calendar className="h-4 w-4 mr-2" />
                            Sélectionner cette session
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}