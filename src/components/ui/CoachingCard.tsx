'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase-client'
import { generateSingleCoachingInsight, type CoachingInsight } from '@/lib/ai-coaching'
import { type CommercialStats } from '@/lib/gamification'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { ChevronRight, RefreshCw, Brain, Lightbulb, AlertTriangle, PartyPopper, Target } from 'lucide-react'
import Link from 'next/link'

interface CoachingCardProps {
  className?: string
}

export function CoachingCard({ className }: CoachingCardProps) {
  const supabase = createClient()
  const [currentInsightIndex, setCurrentInsightIndex] = useState(0)

  // Récupérer les stats du commercial pour générer les insights
  const { data: coachingInsights, isLoading } = useQuery({
    queryKey: ['coaching-insights'],
    queryFn: async () => {
      // Pour l'instant, on simule un commercial
      // TODO: Récupérer l'ID du commercial connecté via auth
      const commercialId = 'current-user'

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

      const { data: activities } = await supabase
        .from('activites')
        .select('*')
        .eq('user_id', commercialId)
        .order('created_at', { ascending: false })
        .limit(50)

      // Calculer le streak
      const inscriptionsActivities = activities?.filter(a => a.type === 'INSCRIPTION') || []
      let streak = 0
      const today = new Date().toISOString().split('T')[0]
      let checkDate = today

      // Si pas d'inscription aujourd'hui, commencer par hier
      const todayInscriptions = inscriptionsActivities.filter(a =>
        a.created_at.split('T')[0] === today
      )
      if (!todayInscriptions.length) {
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
        checkDate = yesterday
      }

      // Compter les jours consécutifs avec au moins 1 inscription
      while (true) {
        const dayInscriptions = inscriptionsActivities.filter(a =>
          a.created_at.split('T')[0] === checkDate
        )
        if (dayInscriptions.length > 0) {
          streak++
          const prevDay = new Date(checkDate)
          prevDay.setDate(prevDay.getDate() - 1)
          checkDate = prevDay.toISOString().split('T')[0]
        } else {
          break
        }
      }

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
        streak,
        sessions_pleines: 0,
        nps_moyen,
        financements_valides: 0,
        parrainages: 0,
        avis_google_obtenus: 0,
        derniere_activite: new Date(),
        jours_actifs_ce_mois: 0
      }

      // Générer plusieurs insights possibles
      const insights: CoachingInsight[] = []

      // Insight principal
      insights.push(generateSingleCoachingInsight(stats))

      // Insights additionnels basés sur les stats
      if (stats.streak >= 10) {
        insights.push({
          type: 'celebration',
          title: 'Streak légendaire ! ⚡',
          message: `${stats.streak} jours consécutifs ! Tu es officiellement une machine à inscrire.`,
          priority: 'normal',
          icon: '⚡'
        })
      }

      if (stats.inscriptions_mois === 0 && new Date().getDate() > 7) {
        insights.push({
          type: 'tip',
          title: 'Premier objectif à viser',
          message: 'Concentre-toi sur les leads avec financement OPCO. C\'est le levier le plus efficace.',
          action: { label: 'Voir les leads finançables', url: '/leads?financement=true' },
          priority: 'high',
          icon: '💰'
        })
      }

      if (stats.ca_mois >= 5000 && stats.ca_mois < 10000) {
        insights.push({
          type: 'challenge',
          title: 'Cap sur les 10K ! 🚀',
          message: `Tu es à ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(10000 - stats.ca_mois)} des 10K€. Un dernier effort !`,
          priority: 'normal',
          icon: '🚀'
        })
      }

      // Insight motivationnel
      insights.push({
        type: 'tip',
        title: 'Conseil du coach IA',
        message: 'Les meilleures conversions se font entre 10h et 11h30. Réserve ce créneau pour tes appels les plus importants.',
        priority: 'normal',
        icon: '💡'
      })

      return insights.filter((insight, index, self) =>
        index === self.findIndex(i => i.title === insight.title)
      ) // Supprimer les doublons
    }
  })

  const nextInsight = () => {
    if (coachingInsights && coachingInsights.length > 1) {
      setCurrentInsightIndex((prev) => (prev + 1) % coachingInsights.length)
    }
  }

  const getInsightIcon = (type: CoachingInsight['type']) => {
    switch (type) {
      case 'tip':
        return <Lightbulb className="w-5 h-5 text-blue-500" />
      case 'alert':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />
      case 'celebration':
        return <PartyPopper className="w-5 h-5 text-green-500" />
      case 'challenge':
        return <Target className="w-5 h-5 text-purple-500" />
      default:
        return <Brain className="w-5 h-5 text-gray-500" />
    }
  }

  const getBackgroundClass = (type: CoachingInsight['type']) => {
    switch (type) {
      case 'tip':
        return 'bg-gradient-to-r from-blue-50 to-blue-100/50 border-blue-200'
      case 'alert':
        return 'bg-gradient-to-r from-amber-50 to-amber-100/50 border-amber-200'
      case 'celebration':
        return 'bg-gradient-to-r from-green-50 to-green-100/50 border-green-200'
      case 'challenge':
        return 'bg-gradient-to-r from-purple-50 to-purple-100/50 border-purple-200'
      default:
        return 'bg-gradient-to-r from-gray-50 to-gray-100/50 border-gray-200'
    }
  }

  if (isLoading) {
    return (
      <Card className={cn("animate-pulse", className)}>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-gray-200 rounded-lg" />
            <div className="flex-1 space-y-3">
              <div className="h-4 bg-gray-200 rounded w-32" />
              <div className="h-3 bg-gray-200 rounded w-full" />
              <div className="h-3 bg-gray-200 rounded w-3/4" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!coachingInsights?.length) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 text-gray-500">
            <Brain className="w-5 h-5" />
            <div>
              <div className="font-medium">Coach IA</div>
              <div className="text-sm">Aucune donnée disponible</div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const currentInsight = coachingInsights[currentInsightIndex]

  return (
    <Card className={cn(
      "transition-all duration-500 border-2",
      getBackgroundClass(currentInsight.type),
      className
    )}>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getInsightIcon(currentInsight.type)}
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-purple-600">Coach IA</span>
                  <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-600 rounded-full font-medium">
                    {currentInsightIndex + 1}/{coachingInsights.length}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  Conseil personnalisé
                </div>
              </div>
            </div>

            {coachingInsights.length > 1 && (
              <Button
                onClick={nextInsight}
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 hover:bg-white/50"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Insight content avec animation */}
          <div
            key={currentInsightIndex}
            className="space-y-3 animate-in slide-in-from-right-2 duration-300"
          >
            <div className="flex items-start gap-2">
              <span className="text-xl shrink-0 mt-0.5">{currentInsight.icon}</span>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm leading-tight">
                  {currentInsight.title}
                </h3>
                <p className="text-sm text-gray-700 mt-1 leading-relaxed">
                  {currentInsight.message}
                </p>
              </div>
            </div>

            {/* Action button */}
            {currentInsight.action && (
              <div className="pt-2">
                <Link href={currentInsight.action.url}>
                  <Button
                    size="sm"
                    variant="default"
                    className="h-8 text-xs bg-white/80 hover:bg-white text-gray-700 border border-gray-200"
                  >
                    {currentInsight.action.label}
                    <ChevronRight className="w-3 h-3 ml-1" />
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Indicateurs de pagination */}
          {coachingInsights.length > 1 && (
            <div className="flex justify-center gap-1 pt-2">
              {coachingInsights.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentInsightIndex(index)}
                  className={cn(
                    "w-1.5 h-1.5 rounded-full transition-all",
                    index === currentInsightIndex
                      ? "bg-purple-500 w-4"
                      : "bg-purple-200 hover:bg-purple-300"
                  )}
                />
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}