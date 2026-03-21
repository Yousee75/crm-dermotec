'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase-client'
import { calculateGamificationData, type CommercialStats, type GamificationData } from '@/lib/gamification'
import { Badge } from '@/components/ui/Badge'
// Modal removed — inline implementation
import { Card } from '@/components/ui/Card'
import { cn } from '@/lib/utils'
import { Trophy, Flame, Star, TrendingUp, Target, Award } from 'lucide-react'

interface GamificationBarProps {
  className?: string
}

export function GamificationBar({ className }: GamificationBarProps) {
  const supabase = createClient()
  const [showModal, setShowModal] = useState(false)

  // Récupérer les données de gamification du commercial actuel
  const { data: gamificationData } = useQuery({
    queryKey: ['gamification-current-user'],
    queryFn: async () => {
      // Pour l'instant, on simule un commercial
      // TODO: Récupérer l'ID du commercial connecté via auth
      const commercialId = 'current-user'

      // Activités du commercial
      const { data: activities } = await supabase
        .from('activites')
        .select('*')
        .eq('user_id', commercialId)
        .order('created_at', { ascending: false })
        .limit(100)

      // Stats du mois en cours
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)

      const { data: inscriptions } = await supabase
        .from('inscriptions')
        .select('montant_total')
        .eq('statut', 'CONFIRMEE')
        .gte('created_at', startOfMonth.toISOString())

      const { data: leads } = await supabase
        .from('leads')
        .select('id, statut')
        .eq('commercial_assigne_id', commercialId)
        .gte('created_at', startOfMonth.toISOString())

      const { data: satisfactionData } = await supabase
        .from('inscriptions')
        .select('note_satisfaction')
        .not('note_satisfaction', 'is', null)

      // Calculer les stats
      const ca_mois = inscriptions?.reduce((sum, i) => sum + i.montant_total, 0) || 0
      const inscriptions_mois = inscriptions?.length || 0
      const leads_crees = leads?.length || 0
      const nps_moyen = satisfactionData?.length
        ? satisfactionData.reduce((sum, s) => sum + (s.note_satisfaction || 0), 0) / satisfactionData.length
        : 0

      const stats: CommercialStats = {
        leads_crees,
        appels_jour: 0, // TODO: Calculer depuis les activités du jour
        emails_envoyes: 0,
        rdv_planifies: 0,
        inscriptions_mois,
        ca_mois,
        streak: 0, // Sera calculé dans calculateGamificationData
        sessions_pleines: 0,
        nps_moyen,
        financements_valides: 0,
        parrainages: 0,
        avis_google_obtenus: 0,
        derniere_activite: new Date(),
        jours_actifs_ce_mois: 0
      }

      return calculateGamificationData(activities || [], stats)
    }
  })

  if (!gamificationData) {
    return null
  }

  const { points, level, progress, badges, streak, todayPoints } = gamificationData

  return (
    <>
      <div className={cn(
        "bg-gradient-to-r from-slate-800 to-slate-900 text-white px-4 py-3 md:px-6 md:py-4 shadow-lg border-b border-slate-700",
        className
      )}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Points du jour + Streak */}
            <div className="flex items-center gap-4 md:gap-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                  <Star className="w-4 h-4 text-yellow-400" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-300">Aujourd'hui</div>
                  <div className="text-lg font-bold text-white">+{todayPoints} pts</div>
                </div>
              </div>

              <div className="w-px h-8 bg-slate-600 hidden md:block" />

              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center",
                  streak >= 5 ? "bg-orange-500/20 animate-pulse" : "bg-slate-700"
                )}>
                  <Flame className={cn(
                    "w-4 h-4",
                    streak >= 5 ? "text-orange-400" : "text-gray-400"
                  )} />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-300">Streak</div>
                  <div className="text-lg font-bold text-white">{streak} jours</div>
                </div>
              </div>
            </div>

            {/* Niveau + Progress Bar */}
            <div className="flex items-center gap-4 md:gap-6">
              <div className="flex-1 md:w-48">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium" style={{ color: level.color }}>
                    {level.name}
                  </span>
                  <span className="text-xs text-gray-400">
                    {progress.pointsToNext ? `${progress.pointsToNext} pts restants` : 'Max'}
                  </span>
                </div>
                <div className="bg-slate-700 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full transition-all duration-500 rounded-full"
                    style={{
                      backgroundColor: level.color,
                      width: `${progress.progress}%`
                    }}
                  />
                </div>
              </div>

              {/* Badges récents */}
              <div className="flex items-center gap-2">
                {badges.slice(-3).map((badge) => (
                  <div
                    key={badge.id}
                    className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center text-sm hover:bg-slate-600 transition cursor-help"
                    title={`${badge.name}: ${badge.description}`}
                  >
                    {badge.icon}
                  </div>
                ))}
                {badges.length > 3 && (
                  <div className="text-xs text-gray-400">+{badges.length - 3}</div>
                )}
              </div>

              {/* Bouton détails */}
              <button
                onClick={() => setShowModal(true)}
                className="hidden md:flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition text-sm font-medium"
              >
                <Trophy className="w-4 h-4" />
                Détails
              </button>
            </div>

            {/* Version mobile: bouton détails */}
            <button
              onClick={() => setShowModal(true)}
              className="md:hidden flex items-center justify-center gap-2 w-full py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition text-sm font-medium"
            >
              <Trophy className="w-4 h-4" />
              Voir mes stats
            </button>
          </div>
        </div>
      </div>

      {/* Modal détails */}
      {showModal && (
      <div className="fixed inset-0 z-50">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
        <div className="absolute inset-0 sm:inset-auto sm:top-[10%] sm:left-1/2 sm:-translate-x-1/2 sm:max-w-2xl sm:w-full bg-white sm:rounded-2xl shadow-2xl overflow-hidden animate-fadeIn flex flex-col max-h-screen sm:max-h-[80vh]">
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">🏆 Tes performances</h2>
            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">✕</button>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
          {/* Vue d'ensemble */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold" style={{ color: level.color }}>
                {points}
              </div>
              <div className="text-sm text-gray-600">Points total</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-500">
                {streak}
              </div>
              <div className="text-sm text-gray-600">Jours de streak</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-500">
                {badges.length}
              </div>
              <div className="text-sm text-gray-600">Badges</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-green-500">
                {level.level}
              </div>
              <div className="text-sm text-gray-600">Niveau</div>
            </Card>
          </div>

          {/* Niveau actuel */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Target className="w-5 h-5" />
              Progression
            </h3>
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold" style={{ color: level.color }}>
                    Niveau {level.level} — {level.name}
                  </span>
                </div>
                {progress.pointsToNext && (
                  <span className="text-sm text-gray-600">
                    {progress.pointsToNext} points restants
                  </span>
                )}
              </div>
              <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full transition-all duration-500 rounded-full"
                  style={{
                    backgroundColor: level.color,
                    width: `${progress.progress}%`
                  }}
                />
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {progress.progress}% vers le niveau {progress.next || 'Max'}
              </div>
            </Card>
          </div>

          {/* Badges */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Award className="w-5 h-5" />
              Badges débloqués ({badges.length})
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {badges.map((badge) => (
                <Card key={badge.id} className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{badge.icon}</div>
                    <div>
                      <div className="font-medium text-sm">{badge.name}</div>
                      <div className="text-xs text-gray-600">{badge.description}</div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            {badges.length === 0 && (
              <Card className="p-6 text-center text-gray-500">
                <Award className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <div>Aucun badge débloqué pour le moment</div>
                <div className="text-sm mt-1">Continue tes efforts pour débloquer ton premier badge !</div>
              </Card>
            )}
          </div>

          {/* Stats ce mois */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Performance ce mois
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <Card className="p-3 text-center">
                <div className="text-lg font-bold text-blue-500">{gamificationData.stats.inscriptions_mois}</div>
                <div className="text-xs text-gray-600">Inscriptions</div>
              </Card>
              <Card className="p-3 text-center">
                <div className="text-lg font-bold text-green-500">
                  {new Intl.NumberFormat('fr-FR', {
                    style: 'currency',
                    currency: 'EUR',
                    maximumFractionDigits: 0
                  }).format(gamificationData.stats.ca_mois)}
                </div>
                <div className="text-xs text-gray-600">CA généré</div>
              </Card>
              <Card className="p-3 text-center">
                <div className="text-lg font-bold text-purple-500">{gamificationData.stats.leads_crees}</div>
                <div className="text-xs text-gray-600">Leads créés</div>
              </Card>
            </div>
          </div>
        </div>
          </div>
        </div>
      </div>
      )}
    </>
  )
}