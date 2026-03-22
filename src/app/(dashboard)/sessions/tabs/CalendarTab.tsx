'use client'

import { useRouter } from 'next/navigation'
import { useSessions } from '@/hooks/use-sessions'
import SessionCalendar from '@/components/sessions/SessionCalendar'
import type { CalendarSession } from '@/components/sessions/SessionCalendar'

export default function CalendarTab() {
  const router = useRouter()
  const { data: sessions } = useSessions()

  const calendarSessions: CalendarSession[] = (sessions || []).map(s => ({
    id: s.id,
    formation_nom: s.formation?.nom || 'Formation inconnue',
    formation_categorie: s.formation?.categorie || '',
    date_debut: s.date_debut,
    date_fin: s.date_fin,
    horaire_debut: s.horaire_debut,
    horaire_fin: s.horaire_fin,
    formatrice_nom: s.formatrice
      ? `${s.formatrice.prenom || ''} ${s.formatrice.nom || ''}`.trim()
      : undefined,
    salle: s.salle,
    places_max: s.places_max,
    places_occupees: s.inscriptions?.length ?? s.places_occupees ?? 0,
    statut: s.statut,
  }))

  return (
    <SessionCalendar
      sessions={calendarSessions}
      onSessionClick={(id) => router.push(`/session/${id}`)}
    />
  )
}
