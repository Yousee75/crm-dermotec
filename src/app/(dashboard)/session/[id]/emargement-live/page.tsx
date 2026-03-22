// @ts-nocheck
'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase-client'
import { QRCodeGenerator } from '@/components/ui/QRCodeGenerator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import {
  CheckCircle, XCircle, Clock, Users, QrCode, RefreshCw,
  AlertTriangle, Smartphone, Wifi
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================
// Dashboard Émargement Temps Réel — Vue formatrice en salle
// Affiche le QR + statut de chaque stagiaire (signé/en attente)
// Rafraîchissement auto toutes les 10 secondes
// ============================================================

export default function EmargementLivePage() {
  const params = useParams()
  const sessionId = params?.id as string
  const supabase = createClient()

  const today = new Date().toISOString().split('T')[0]
  const hour = new Date().getHours()
  const creneau = hour < 14 ? 'matin' : 'apres_midi'

  // Données session + inscriptions + émargements
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['emargement-live', sessionId, today, creneau],
    queryFn: async () => {
      const { data: session } = await supabase
        .from('sessions')
        .select(`
          id, date_debut, date_fin, horaire_debut, horaire_fin, salle, statut,
          places_max, places_occupees,
          formation:formations(nom, duree_heures),
          formatrice:equipe!formatrice_id(prenom, nom),
          inscriptions:inscriptions(
            id, statut, portail_token,
            lead:leads(id, prenom, nom, telephone, email)
          )
        `)
        .eq('id', sessionId)
        .single()

      if (!session) throw new Error('Session non trouvée')

      // Récupérer les émargements du jour
      const { data: emargements } = await supabase
        .from('emargements')
        .select('*')
        .eq('session_id', sessionId)
        .eq('date', today)

      return { session, emargements: emargements || [] }
    },
    refetchInterval: 10_000, // Rafraîchir toutes les 10 secondes
  })

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin w-8 h-8 border-4 border-[#2EC6F3] border-t-transparent rounded-full" />
      </div>
    )
  }

  const { session, emargements } = data
  const inscriptions = session.inscriptions?.filter(i =>
    ['CONFIRMEE', 'EN_COURS', 'COMPLETEE'].includes(i.statut)
  ) || []

  // Compteurs
  const signedMatin = emargements.filter(e => e.creneau === 'matin').length
  const signedAprem = emargements.filter(e => e.creneau === 'apres_midi').length
  const signedCurrent = creneau === 'matin' ? signedMatin : signedAprem
  const totalExpected = inscriptions.length
  const missingCount = totalExpected - signedCurrent

  // URL d'émargement de base
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#082545]" style={{ fontFamily: 'var(--font-heading)' }}>
            Émargement en direct
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {session.formation?.nom} — {new Date(today).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-sm text-green-600 bg-green-50 px-3 py-1.5 rounded-full">
            <Wifi className="w-3.5 h-3.5" />
            Temps réel
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} icon={<RefreshCw className="w-3.5 h-3.5" />}>
            Actualiser
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-[#082545]">{signedCurrent}/{totalExpected}</p>
          <p className="text-xs text-gray-500">Signatures {creneau === 'matin' ? 'matin' : 'après-midi'}</p>
        </Card>
        <Card className={cn('p-4 text-center', missingCount > 0 && 'border-orange-200 bg-orange-50')}>
          <p className={cn('text-2xl font-bold', missingCount > 0 ? 'text-orange-600' : 'text-green-600')}>
            {missingCount}
          </p>
          <p className="text-xs text-gray-500">En attente</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{signedMatin}</p>
          <p className="text-xs text-gray-500">Matin</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">{signedAprem}</p>
          <p className="text-xs text-gray-500">Après-midi</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* QR Code */}
        <QRCodeGenerator
          value={`${baseUrl}/emargement/${sessionId}?date=${today}`}
          size={220}
          label="Scanner pour émarger"
          sessionInfo={{
            formationNom: session.formation?.nom || '',
            date: new Date(today).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
            horaires: `${session.horaire_debut || '09:00'} — ${session.horaire_fin || '17:00'}`,
            salle: session.salle,
            formatrice: session.formatrice ? `${session.formatrice.prenom} ${session.formatrice.nom}` : undefined,
          }}
        />

        {/* Liste des stagiaires */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="w-4 h-4 text-[#2EC6F3]" />
              Stagiaires ({signedCurrent}/{totalExpected})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {inscriptions.map(inscription => {
              const lead = inscription.lead
              const emargementMatin = emargements.find(
                e => e.inscription_id === inscription.id && e.creneau === 'matin'
              )
              const emargementAprem = emargements.find(
                e => e.inscription_id === inscription.id && e.creneau === 'apres_midi'
              )
              const currentSigned = creneau === 'matin' ? !!emargementMatin : !!emargementAprem

              return (
                <div
                  key={inscription.id}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-xl border transition-all',
                    currentSigned
                      ? 'bg-green-50 border-green-200'
                      : 'bg-white border-gray-200'
                  )}
                >
                  {/* Status icon */}
                  <div className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
                    currentSigned ? 'bg-green-100' : 'bg-gray-100'
                  )}>
                    {currentSigned ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <Clock className="w-5 h-5 text-gray-400" />
                    )}
                  </div>

                  {/* Nom */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {lead?.prenom} {lead?.nom}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {/* Matin */}
                      <span className={cn(
                        'text-[10px] px-1.5 py-0.5 rounded',
                        emargementMatin ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                      )}>
                        {emargementMatin ? '✓ Matin' : '○ Matin'}
                      </span>
                      {/* Après-midi */}
                      <span className={cn(
                        'text-[10px] px-1.5 py-0.5 rounded',
                        emargementAprem ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                      )}>
                        {emargementAprem ? '✓ PM' : '○ PM'}
                      </span>
                    </div>
                  </div>

                  {/* Heure de signature */}
                  {currentSigned && (
                    <span className="text-xs text-green-600 flex-shrink-0">
                      {new Date(
                        creneau === 'matin' ? emargementMatin.signed_at : emargementAprem.signed_at
                      ).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}

                  {/* Relance si pas signé */}
                  {!currentSigned && lead?.telephone && (
                    <a
                      href={`https://wa.me/${lead.telephone.replace(/\s/g, '').replace(/^0/, '33')}`}
                      target="_blank"
                      className="p-2 rounded-lg hover:bg-orange-100 text-orange-500 transition flex-shrink-0"
                      title="Relancer par WhatsApp"
                    >
                      <Smartphone className="w-4 h-4" />
                    </a>
                  )}
                </div>
              )
            })}

            {inscriptions.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Aucun stagiaire inscrit</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alerte absence */}
      {missingCount > 0 && creneau === 'matin' && new Date().getHours() >= 10 && (
        <Card className="border-orange-200 bg-orange-50 p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-orange-800">
                {missingCount} stagiaire{missingCount > 1 ? 's' : ''} n&apos;{missingCount > 1 ? 'ont' : 'a'} pas encore émargé
              </p>
              <p className="text-xs text-orange-600 mt-0.5">
                Il est {new Date().getHours()}h — pensez à vérifier leur présence
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
