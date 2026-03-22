'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase-client'
import { calculateGamificationData, type CommercialStats } from '@/lib/gamification'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { cn } from '@/lib/utils'
import { Trophy, Flame, TrendingUp } from 'lucide-react'

interface LeaderboardWidgetProps {
  limit?: number
  className?: string
}

interface LeaderboardEntry {
  id: string
  prenom: string
  nom: string
  avatar_color: string
  points: number
  level: { level: number; name: string; color: string }
  streak: number
  isCurrentUser: boolean
  rank: number
}

export function LeaderboardWidget({ limit = 5, className }: LeaderboardWidgetProps) {
  const supabase = createClient()

  // Identifier le commercial connecté pour le highlight
  const { data: currentEquipe } = useQuery({
    queryKey: ['current-equipe-leaderboard'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null
      const { data } = await supabase
        .from('equipe')
        .select('id')
        .eq('auth_user_id', user.id)
        .maybeSingle()
      return data?.id || null
    },
    staleTime: 10 * 60 * 1000,
  })

  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ['leaderboard', limit, currentEquipe],
    queryFn: async () => {
      // Récupérer tous les commerciaux
      const { data: commerciaux } = await supabase
        .from('equipe')
        .select('id, prenom, nom, avatar_color, role')
        .eq('role', 'commercial')
        .eq('is_active', true)

      if (!commerciaux) return []

      // Calculer les points pour chaque commercial
      const leaderboardData: LeaderboardEntry[] = []

      for (const commercial of commerciaux) {
        // Activités du commercial
        const { data: activities } = await supabase
          .from('activites')
          .select('*')
          .eq('user_id', commercial.id)
          .order('created_at', { ascending: false })

        // Stats du mois en cours
        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)

        const { data: inscriptions } = await supabase
          .from('inscriptions')
          .select('montant_total')
          .eq('statut', 'CONFIRMEE')
          .gte('created_at', startOfMonth.toISOString())

        const { data: leads } = await supabase
          .from('leads')
          .select('id')
          .eq('commercial_assigne_id', commercial.id)
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
          appels_jour: 0,
          emails_envoyes: 0,
          rdv_planifies: 0,
          inscriptions_mois,
          ca_mois,
          streak: 0,
          sessions_pleines: 0,
          nps_moyen,
          financements_valides: 0,
          parrainages: 0,
          avis_google_obtenus: 0,
          derniere_activite: new Date(),
          jours_actifs_ce_mois: 0
        }

        const gamificationData = calculateGamificationData(activities || [], stats)

        leaderboardData.push({
          id: commercial.id,
          prenom: commercial.prenom,
          nom: commercial.nom,
          avatar_color: commercial.avatar_color,
          points: gamificationData.points,
          level: gamificationData.level,
          streak: gamificationData.streak,
          isCurrentUser: commercial.id === (currentEquipe || ''),
          rank: 0 // Sera défini après le tri
        })
      }

      // Trier par points et assigner les rangs
      leaderboardData.sort((a, b) => b.points - a.points)
      leaderboardData.forEach((entry, index) => {
        entry.rank = index + 1
      })

      return leaderboardData.slice(0, limit)
    }
  })

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle icon={<Trophy className="w-4 h-4" />}>
            Classement équipe
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(limit)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-8 h-8 bg-gray-200 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-1" />
                  <div className="h-3 bg-gray-200 rounded w-16" />
                </div>
                <div className="h-6 bg-gray-200 rounded w-12" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!leaderboard?.length) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle icon={<Trophy className="w-4 h-4" />}>
            Classement équipe
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-gray-500">
            <Trophy className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <div>Aucune donnée disponible</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getMedalIcon = (rank: number) => {
    switch (rank) {
      case 1: return '🥇'
      case 2: return '🥈'
      case 3: return '🥉'
      default: return null
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle icon={<Trophy className="w-4 h-4" />}>
          Classement équipe
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {leaderboard.map((entry, index) => (
            <div
              key={entry.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg transition-all duration-300",
                entry.isCurrentUser
                  ? "bg-blue-50 ring-2 ring-blue-200 shadow-sm"
                  : "hover:bg-gray-50"
              )}
            >
              {/* Rang + Médaille */}
              <div className="flex items-center justify-center w-8 h-8 shrink-0">
                {getMedalIcon(entry.rank) ? (
                  <span className="text-xl">{getMedalIcon(entry.rank)}</span>
                ) : (
                  <span className="text-sm font-bold text-gray-500">#{entry.rank}</span>
                )}
              </div>

              {/* Avatar */}
              <Avatar
                name={`${entry.prenom} ${entry.nom}`}
                color={entry.avatar_color}
                size="sm"
                className="shrink-0"
              />

              {/* Infos commercial */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "font-medium text-sm truncate",
                    entry.isCurrentUser ? "text-blue-700" : "text-gray-900"
                  )}>
                    {entry.prenom} {entry.nom}
                  </span>
                  {entry.isCurrentUser && (
                    <Badge size="sm" variant="primary">
                      Toi
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <div className="flex items-center gap-1">
                    <Badge
                      size="sm"
                      style={{
                        backgroundColor: `${entry.level.color}15`,
                        color: entry.level.color,
                        borderColor: `${entry.level.color}30`
                      }}
                    >
                      Niv. {entry.level.level}
                    </Badge>
                  </div>
                  {entry.streak > 0 && (
                    <div className="flex items-center gap-1">
                      <Flame className={cn(
                        "w-3 h-3",
                        entry.streak >= 5 ? "text-orange-500" : "text-gray-400"
                      )} />
                      <span className="text-xs text-gray-600">{entry.streak}j</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Points */}
              <div className="text-right shrink-0">
                <div className="text-sm font-bold text-gray-900">
                  {entry.points}
                </div>
                <div className="text-xs text-gray-500">points</div>
              </div>
            </div>
          ))}
        </div>

        {/* Évolution du classement */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
            <TrendingUp className="w-3 h-3" />
            <span>Classement mis à jour en temps réel</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}