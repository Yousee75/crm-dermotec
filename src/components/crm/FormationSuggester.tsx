'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useLead } from '@/hooks/use-leads'
import { useSessions } from '@/hooks/use-sessions'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent, CardFooter } from '@/components/ui/Card'
import { FORMATIONS_SEED } from '@/lib/constants'
import { formatEuro } from '@/lib/utils'
import { toast } from 'sonner'
import {
  GraduationCap, Clock, Euro, Calendar, Users,
  Star, CheckCircle, AlertCircle, Plus
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface FormationSuggesterProps {
  leadId: string
  onSelect?: (formationId: string) => void
  compact?: boolean
}

interface FormationSuggestion {
  formation: typeof FORMATIONS_SEED[0]
  score: number
  reason: string
  isRecommended: boolean
  prochaineSession?: {
    date: string
    placesDisponibles: number
    placesTotales: number
  }
}

const getCategoryColor = (categorie: string) => {
  const colors: Record<string, { bg: string; text: string; border: string }> = {
    'Hygiène': { bg: 'bg-[#ECFDF5]', text: 'text-[#10B981]', border: 'border-[#10B981]/30' },
    'Dermo-Esthétique': { bg: 'bg-[#E0EBF5]', text: 'text-[#6B8CAE]', border: 'border-[#6B8CAE]/30' },
    'Dermo-Correctrice': { bg: 'bg-[#FFE0EF]', text: 'text-[#FF2D78]', border: 'border-[#FF2D78]/30' },
    'Soins Visage': { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' },
    'Soins Corps': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
    'Laser & IPL': { bg: 'bg-[#FFE0EF]', text: 'text-[#FF2D78]', border: 'border-[#FF2D78]/30' },
  }
  return colors[categorie] || { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' }
}

const analyzeFormationSuggestions = (lead: any): FormationSuggestion[] => {
  if (!lead) return []

  const suggestions: FormationSuggestion[] = []

  // Si le lead a déjà une formation principale, suggérer des formations complémentaires
  if (lead.formation_principale_id) {
    const formationActuelle = FORMATIONS_SEED.find(f => f.slug === lead.formation_principale?.slug)

    if (formationActuelle) {
      // Upsell : formations de niveau supérieur dans la même catégorie
      const formationsSameCategory = FORMATIONS_SEED.filter(f =>
        f.categorie === formationActuelle.categorie &&
        f.slug !== formationActuelle.slug &&
        (f.niveau === 'intermediaire' || f.niveau === 'confirme')
      )

      formationsSameCategory.forEach(f => {
        suggestions.push({
          formation: f,
          score: 90,
          reason: `Perfectionnement en ${f.categorie}`,
          isRecommended: true,
        })
      })

      // Cross-sell : formations complémentaires populaires
      const crossSellMap: Record<string, string[]> = {
        'hygiene-salubrite': ['microblading', 'full-lips', 'nanoneedling'],
        'microblading': ['full-lips', 'tricopigmentation', 'soin-allin1'],
        'maquillage-permanent': ['full-lips', 'tricopigmentation'],
      }

      const crossSells = crossSellMap[formationActuelle.slug] || []
      crossSells.forEach(slug => {
        const formation = FORMATIONS_SEED.find(f => f.slug === slug)
        if (formation) {
          suggestions.push({
            formation,
            score: 75,
            reason: 'Formation complémentaire populaire',
            isRecommended: false,
          })
        }
      })
    }
  } else {
    // Lead sans formation : recommandations basées sur profil

    // Hygiène & Salubrité toujours en première suggestion (obligatoire)
    const hygiene = FORMATIONS_SEED.find(f => f.slug === 'hygiene-salubrite')
    if (hygiene) {
      suggestions.push({
        formation: hygiene,
        score: 100,
        reason: 'Prérequis légal obligatoire',
        isRecommended: true,
      })
    }

    // Formations populaires pour débutants
    const formationsDebutant = FORMATIONS_SEED.filter(f =>
      f.niveau === 'debutant' &&
      f.slug !== 'hygiene-salubrite' &&
      f.prix_ht <= 1500 // Formations accessibles
    ).sort((a, b) => a.prix_ht - b.prix_ht) // Tri par prix croissant

    formationsDebutant.slice(0, 2).forEach(f => {
      suggestions.push({
        formation: f,
        score: 80,
        reason: 'Formation populaire pour débuter',
        isRecommended: suggestions.length === 1, // La première après hygiène
      })
    })
  }

  return suggestions.slice(0, 3) // Limiter à 3 suggestions
}

export default function FormationSuggester({ leadId, onSelect, compact = false }: FormationSuggesterProps) {
  const { data: lead, isLoading: leadLoading } = useLead(leadId)
  const { data: sessions } = useSessions()
  const [selectedFormation, setSelectedFormation] = useState<string | null>(null)

  if (leadLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 bg-slate-100 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  if (!lead) {
    return (
      <div className="p-4 text-center text-slate-500">
        Données du lead non disponibles
      </div>
    )
  }

  const suggestions = analyzeFormationSuggestions(lead)

  // Enrichir avec les données de sessions
  const enrichedSuggestions = suggestions.map(suggestion => {
    const formationSessions = sessions?.filter(s =>
      s.formation?.slug === suggestion.formation.slug &&
      s.statut === 'PLANIFIEE' &&
      new Date(s.date_debut) > new Date()
    ) || []

    const prochaineSession = formationSessions.sort((a, b) =>
      new Date(a.date_debut).getTime() - new Date(b.date_debut).getTime()
    )[0]

    if (prochaineSession) {
      const placesOccupees = prochaineSession.inscriptions?.length || 0
      const placesTotales = prochaineSession.places_max || 12

      return {
        ...suggestion,
        prochaineSession: {
          date: prochaineSession.date_debut,
          placesDisponibles: placesTotales - placesOccupees,
          placesTotales,
        }
      }
    }

    return suggestion
  })

  const handleSelectFormation = (formationSlug: string) => {
    setSelectedFormation(formationSlug)
    onSelect?.(formationSlug)
    toast.success(`Formation "${FORMATIONS_SEED.find(f => f.slug === formationSlug)?.nom}" sélectionnée`)
  }

  if (suggestions.length === 0) {
    return (
      <div className="p-4 text-center text-slate-500 bg-slate-50 rounded-lg border">
        Aucune suggestion de formation disponible
      </div>
    )
  }

  if (compact) {
    return (
      <div className="space-y-2">
        {enrichedSuggestions.map((suggestion, index) => {
          const categoryColors = getCategoryColor(suggestion.formation.categorie)

          return (
            <motion.div
              key={suggestion.formation.slug}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-3 bg-white border rounded-lg hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-2 h-8 rounded-full',
                  suggestion.isRecommended ? 'bg-primary' : 'bg-slate-300'
                )} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-sm text-slate-900">
                      {suggestion.formation.nom}
                    </h4>
                    {suggestion.isRecommended && (
                      <Badge variant="secondary" className="px-1.5 py-0 text-xs bg-primary text-white">
                        <Star className="h-2.5 w-2.5 mr-0.5" />
                        Recommandé
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600 mt-0.5">
                    <Badge className={cn(categoryColors.bg, categoryColors.text, categoryColors.border, 'px-2 py-0 text-xs border')}>
                      {suggestion.formation.categorie}
                    </Badge>
                    <span>{suggestion.formation.duree_jours}j</span>
                    <span>{formatEuro(suggestion.formation.prix_ht)}</span>
                  </div>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleSelectFormation(suggestion.formation.slug)}
                className="min-h-[36px]"
              >
                Inscrire
              </Button>
            </motion.div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="font-medium text-slate-900">Formations recommandées</h3>
        <Badge variant="outline" className="text-xs">
          {suggestions.length} suggestion{suggestions.length > 1 ? 's' : ''}
        </Badge>
      </div>

      <div className="grid gap-4">
        {enrichedSuggestions.map((suggestion, index) => {
          const categoryColors = getCategoryColor(suggestion.formation.categorie)
          const isSelected = selectedFormation === suggestion.formation.slug

          return (
            <motion.div
              key={suggestion.formation.slug}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.15 }}
            >
              <Card className={cn(
                'transition-all duration-200 hover:shadow-md',
                isSelected && 'ring-2 ring-primary ring-offset-2',
                suggestion.isRecommended && 'border-primary bg-gradient-to-r from-blue-50/30 to-transparent'
              )}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-slate-900">
                          {suggestion.formation.nom}
                        </h4>
                        {suggestion.isRecommended && (
                          <Badge className="px-2 py-0.5 text-xs bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
                            <Star className="h-3 w-3 mr-1" />
                            Recommandé
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mb-2">
                        {suggestion.reason}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-slate-900">
                        {formatEuro(suggestion.formation.prix_ht)}
                      </p>
                      <p className="text-xs text-slate-500">HT</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mb-3">
                    <Badge className={cn(categoryColors.bg, categoryColors.text, categoryColors.border, 'border')}>
                      {suggestion.formation.categorie}
                    </Badge>
                    <div className="flex items-center gap-1 text-xs text-slate-600">
                      <Clock className="h-3 w-3" />
                      <span>{suggestion.formation.duree_jours} jours • {suggestion.formation.duree_heures}h</span>
                    </div>
                  </div>

                  {/* Prochaine session */}
                  {suggestion.prochaineSession ? (
                    <div className="bg-slate-50 rounded p-2 mb-3">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1 text-slate-700">
                          <Calendar className="h-3 w-3" />
                          <span>
                            Prochaine session : {new Date(suggestion.prochaineSession.date).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          <span className={cn(
                            'font-medium',
                            suggestion.prochaineSession.placesDisponibles <= 2 ? 'text-[#FF2D78]' :
                            suggestion.prochaineSession.placesDisponibles <= 5 ? 'text-[#FF8C42]' : 'text-[#10B981]'
                          )}>
                            {suggestion.prochaineSession.placesDisponibles}/{suggestion.prochaineSession.placesTotales} places
                          </span>
                          {suggestion.prochaineSession.placesDisponibles <= 2 && (
                            <Badge variant="destructive" className="px-1.5 py-0 text-xs ml-1">
                              Bientôt complet
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-[#FFF3E8] border border-[#FF8C42]/30 rounded p-2 mb-3">
                      <div className="flex items-center gap-2 text-xs text-[#FF8C42]">
                        <AlertCircle className="h-3 w-3" />
                        <span>Aucune session programmée</span>
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto p-0 text-xs text-[#FF8C42] hover:text-[#FF8C42]"
                        >
                          Créer une session
                        </Button>
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {suggestion.formation.description_commerciale}
                  </p>
                </CardContent>

                <CardFooter className="p-4 pt-0">
                  <Button
                    className="w-full bg-primary hover:bg-primary-dark text-white min-h-[44px]"
                    onClick={() => handleSelectFormation(suggestion.formation.slug)}
                    disabled={!suggestion.prochaineSession}
                  >
                    {suggestion.prochaineSession ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Inscrire à cette formation
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Créer session & inscrire
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}