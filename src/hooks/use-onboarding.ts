'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/infra/supabase-client'
import { ONBOARDING_STEPS, calculateProgress } from '@/lib/automation/playbook'

const supabase = createClient()

// --- Progression de l'utilisateur ---

export function useOnboardingProgress(userId?: string) {
  return useQuery({
    queryKey: ['onboarding-progress', userId],
    queryFn: async () => {
      if (!userId) return { completedIds: [], basique: { total: 0, completed: 0, percent: 0 }, intermediaire: { total: 0, completed: 0, percent: 0 }, expert: { total: 0, completed: 0, percent: 0 }, global: { total: 0, completed: 0, percent: 0 } }

      const { data, error } = await supabase
        .from('onboarding_progress')
        .select('step_id')
        .eq('user_id', userId)

      if (error) throw error

      const completedIds = (data || []).map(d => d.step_id)

      return {
        completedIds,
        basique: calculateProgress(completedIds, 'basique'),
        intermediaire: calculateProgress(completedIds, 'intermediaire'),
        expert: calculateProgress(completedIds, 'expert'),
        global: calculateProgress(completedIds),
      }
    },
    enabled: !!userId,
    staleTime: 10 * 60_000, // 10 min — onboarding quasi-statique
    gcTime: 10 * 60_000,
  })
}

// --- Compléter un step ---

export function useCompleteOnboardingStep() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: { userId: string; stepId: string }) => {
      const step = ONBOARDING_STEPS.find(s => s.id === params.stepId)
      if (!step) throw new Error(`Step ${params.stepId} non trouvé`)

      const { error } = await supabase
        .from('onboarding_progress')
        .upsert({
          user_id: params.userId,
          step_id: params.stepId,
          niveau: step.niveau,
          completed_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,step_id',
        })

      if (error) throw error
      return { success: true }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-progress'] })
    },
  })
}
