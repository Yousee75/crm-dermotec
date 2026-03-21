'use client'

import { useState } from 'react'
import { useSessions } from '@/hooks/use-sessions'
import { Calendar, Plus, Users, Clock, MapPin } from 'lucide-react'
import Link from 'next/link'

export default function SessionsPage() {
  const now = new Date()
  const [month, setMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)
  const { data: sessions, isLoading } = useSessions({ month })

  const statuts: Record<string, { label: string; color: string }> = {
    BROUILLON: { label: 'Brouillon', color: '#9CA3AF' },
    PLANIFIEE: { label: 'Planifiée', color: '#3B82F6' },
    CONFIRMEE: { label: 'Confirmée', color: '#22C55E' },
    EN_COURS: { label: 'En cours', color: '#F59E0B' },
    TERMINEE: { label: 'Terminée', color: '#6366F1' },
    ANNULEE: { label: 'Annulée', color: '#EF4444' },
    REPORTEE: { label: 'Reportée', color: '#F97316' },
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#082545]" style={{ fontFamily: 'var(--font-heading)' }}>
            Sessions de formation
          </h1>
          <p className="text-sm text-gray-500">{sessions?.length || 0} sessions ce mois</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
          />
          <button className="flex items-center gap-2 px-4 py-2 bg-[#2EC6F3] hover:bg-[#1BA8D4] text-white rounded-xl text-sm font-medium transition">
            <Plus className="w-4 h-4" />
            Nouvelle session
          </button>
        </div>
      </div>

      {/* Sessions list */}
      <div className="grid gap-4">
        {isLoading ? (
          <div className="bg-white rounded-xl p-12 text-center text-gray-400">Chargement...</div>
        ) : sessions?.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center text-gray-400">
            Aucune session ce mois. Planifiez la première !
          </div>
        ) : sessions?.map((session) => {
          const s = statuts[session.statut] || { label: session.statut, color: '#9CA3AF' }
          const placesRestantes = session.places_max - session.places_occupees
          return (
            <Link
              key={session.id}
              href={`/session/${session.id}`}
              className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-[#082545] group-hover:text-[#2EC6F3] transition">
                      {session.formation?.nom}
                    </h3>
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: s.color }}
                    >
                      {s.label}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      {new Date(session.date_debut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      {session.date_debut !== session.date_fin && (
                        <> → {new Date(session.date_fin).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      {session.horaire_debut} — {session.horaire_fin}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4" />
                      {session.salle}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-4 h-4" />
                      <span className={placesRestantes <= 1 ? 'text-red-500 font-medium' : ''}>
                        {session.places_occupees}/{session.places_max} inscrits
                      </span>
                    </div>
                  </div>

                  {session.formatrice && (
                    <p className="text-xs text-gray-400 mt-2">
                      Formatrice : {session.formatrice.prenom} {session.formatrice.nom}
                    </p>
                  )}
                </div>

                {/* Places visuelles */}
                <div className="flex gap-1 ml-4">
                  {Array.from({ length: session.places_max }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-3 h-3 rounded-full ${i < session.places_occupees ? 'bg-[#2EC6F3]' : 'bg-gray-200'}`}
                    />
                  ))}
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
