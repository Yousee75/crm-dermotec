'use client'

import { useState, useEffect } from 'react'
import { useLeads } from '@/hooks/use-leads'
import { useSessions } from '@/hooks/use-sessions'
import { createClient } from '@/lib/infra/supabase-client'
import { useQuery } from '@tanstack/react-query'
import { X, Check, Users, Mail, Calendar, FileText, UserPlus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface OnboardingStep {
  id: string
  icon: React.ElementType
  label: string
  completed: boolean
}

export function OnboardingProgressBar() {
  const [dismissed, setDismissed] = useState(false)
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set())
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [celebrateComplete, setCelebrateComplete] = useState(false)

  const supabase = createClient()

  // Vérifier les données pour chaque étape
  const { data: leadsData } = useLeads({ per_page: 1 })
  const { data: sessions } = useSessions()

  // Vérifier si un email/WhatsApp a été envoyé
  const { data: hasEmailActivity } = useQuery({
    queryKey: ['onboarding-email-activity'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activites')
        .select('id')
        .in('type', ['EMAIL', 'WHATSAPP'])
        .limit(1)

      if (error) throw error
      return data && data.length > 0
    },
    staleTime: 5 * 60_000, // 5 min
  })

  // Vérifier si un devis a été généré
  const { data: hasDevis } = useQuery({
    queryKey: ['onboarding-devis'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activites')
        .select('id')
        .eq('type', 'DEVIS_GENERE')
        .limit(1)

      if (error) throw error
      return data && data.length > 0
    },
    staleTime: 5 * 60_000,
  })

  // Vérifier les membres d'équipe
  const { data: hasTeamMembers } = useQuery({
    queryKey: ['onboarding-team'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('membres_equipe')
        .select('id')
        .limit(2) // Plus de 1 (= le owner + au moins 1 autre)

      if (error) throw error
      return data && data.length > 1
    },
    staleTime: 5 * 60_000,
  })

  // Initialiser depuis localStorage
  useEffect(() => {
    const savedSteps = localStorage.getItem('onboarding_completed_steps')
    const savedStart = localStorage.getItem('onboarding_start_date')
    const dismissedUntil = localStorage.getItem('onboarding_dismissed_until')

    if (savedSteps) {
      setCompletedSteps(new Set(JSON.parse(savedSteps)))
    }

    if (savedStart) {
      setStartDate(new Date(savedStart))
    } else {
      // Première fois - enregistrer la date de début
      const now = new Date()
      localStorage.setItem('onboarding_start_date', now.toISOString())
      setStartDate(now)
    }

    // Vérifier si dismissed temporairement
    if (dismissedUntil) {
      const dismissDate = new Date(dismissedUntil)
      if (dismissDate > new Date()) {
        setDismissed(true)
      }
    }
  }, [])

  // Mettre à jour les étapes complétées
  useEffect(() => {
    const newCompleted = new Set(completedSteps)

    // Étape 1: Premier prospect
    if ((leadsData?.total || 0) > 0) {
      newCompleted.add('first_lead')
    }

    // Étape 2: Email/WhatsApp envoyé
    if (hasEmailActivity) {
      newCompleted.add('first_contact')
    }

    // Étape 3: Session planifiée
    if (sessions && sessions.length > 0) {
      newCompleted.add('first_session')
    }

    // Étape 4: Devis généré
    if (hasDevis) {
      newCompleted.add('first_devis')
    }

    // Étape 5: Membre d'équipe invité
    if (hasTeamMembers) {
      newCompleted.add('team_member')
    }

    // Sauvegarder si changement
    if (newCompleted.size !== completedSteps.size ||
        ![...newCompleted].every(step => completedSteps.has(step))) {
      setCompletedSteps(newCompleted)
      localStorage.setItem('onboarding_completed_steps', JSON.stringify([...newCompleted]))

      // Animation de célébration si toutes les étapes sont complétées
      if (newCompleted.size === 5 && completedSteps.size < 5) {
        setCelebrateComplete(true)
        setTimeout(() => setCelebrateComplete(false), 3000)

        // Masquer définitivement après quelques secondes
        setTimeout(() => {
          localStorage.setItem('onboarding_complete', 'true')
          setDismissed(true)
        }, 5000)
      }
    }
  }, [leadsData, hasEmailActivity, sessions, hasDevis, hasTeamMembers, completedSteps])

  // Vérifier si 7 jours se sont écoulés
  useEffect(() => {
    if (startDate) {
      const daysSinceStart = (new Date().getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      if (daysSinceStart >= 7) {
        setDismissed(true)
      }
    }
  }, [startDate])

  const handleDismiss = () => {
    // Masquer pour 24h
    const dismissUntil = new Date()
    dismissUntil.setHours(dismissUntil.getHours() + 24)
    localStorage.setItem('onboarding_dismissed_until', dismissUntil.toISOString())
    setDismissed(true)
  }

  // Ne pas afficher si dismissed, complété, ou plus de 7 jours
  if (dismissed || localStorage.getItem('onboarding_complete')) {
    return null
  }

  const steps: OnboardingStep[] = [
    {
      id: 'first_lead',
      icon: Users,
      label: 'Ajouter votre premier prospect',
      completed: completedSteps.has('first_lead')
    },
    {
      id: 'first_contact',
      icon: Mail,
      label: 'Envoyer un premier email ou WhatsApp',
      completed: completedSteps.has('first_contact')
    },
    {
      id: 'first_session',
      icon: Calendar,
      label: 'Planifier une session de formation',
      completed: completedSteps.has('first_session')
    },
    {
      id: 'first_devis',
      icon: FileText,
      label: 'Générer un premier devis',
      completed: completedSteps.has('first_devis')
    },
    {
      id: 'team_member',
      icon: UserPlus,
      label: 'Inviter un membre de l\'équipe',
      completed: completedSteps.has('team_member')
    }
  ]

  const completedCount = steps.filter(step => step.completed).length
  const progressPercent = (completedCount / steps.length) * 100

  return (
    <div className={cn(
      "sticky top-0 z-20 bg-white border-b border-[#F0F0F0] px-4 py-3 transition-all duration-500",
      celebrateComplete && "animate-pulse bg-gradient-to-r from-[#FFF0E5] via-white to-[#FFE0EF]"
    )}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          {/* Titre et progression */}
          <div className="flex items-center gap-4 flex-1">
            <div className="flex items-center gap-2">
              {celebrateComplete ? (
                <>
                  <div className="w-6 h-6 rounded-full bg-[#10B981] flex items-center justify-center animate-bounce">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-[#10B981]">
                    🎉 Félicitations ! Configuration terminée !
                  </span>
                </>
              ) : (
                <>
                  <span className="text-sm font-medium text-[#111111]">
                    {completedCount}/5 étapes complétées
                  </span>
                  {completedCount < 5 && (
                    <span className="text-xs text-[#777777]">
                      — Configurez votre CRM en quelques clics
                    </span>
                  )}
                </>
              )}
            </div>

            {/* Barre de progression */}
            <div className="flex-1 max-w-md">
              <div className="h-1.5 bg-[#F5F5F5] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${progressPercent}%`,
                    backgroundColor: completedCount === 5 ? '#10B981' : '#FF5C00'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Étapes avec checkmarks */}
          <div className="hidden md:flex items-center gap-3 mx-6">
            {steps.map((step) => {
              const Icon = step.icon
              return (
                <div
                  key={step.id}
                  className={cn(
                    "flex items-center gap-2 px-2 py-1 rounded-md text-xs transition-all",
                    step.completed
                      ? "bg-[#ECFDF5] text-[#10B981]"
                      : "bg-[#F5F5F5] text-[#777777]"
                  )}
                  title={step.label}
                >
                  <div className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center transition-all",
                    step.completed
                      ? "bg-[#10B981] text-white"
                      : "bg-[#EEEEEE] text-[#999999]"
                  )}>
                    {step.completed ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      <Icon className="w-3 h-3" />
                    )}
                  </div>
                  <span className="hidden lg:inline font-medium">
                    {step.label}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Bouton dismiss */}
          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-md hover:bg-[#F5F5F5] text-[#999999] hover:text-[#777777] transition-colors"
            title="Masquer pour 24h"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}