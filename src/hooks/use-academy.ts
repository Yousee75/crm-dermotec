'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase-client'
import type { AcademyModule, AcademyLesson, AcademyProgress, AcademyBadge, AcademyUserStats } from '@/types'

export function useAcademyModules() {
  const supabase = createClient()
  return useQuery({
    queryKey: ['academy-modules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('academy_modules')
        .select('*, lessons:academy_lessons(id)')
        .eq('is_published', true)
        .order('ordre', { ascending: true })
      if (error) throw error
      return (data || []).map(m => ({
        ...m,
        total_lessons: m.lessons?.length || 0,
        lessons: undefined,
      })) as AcademyModule[]
    },
  })
}

export function useAcademyModule(slug: string) {
  const supabase = createClient()
  return useQuery({
    queryKey: ['academy-module', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('academy_modules')
        .select('*, lessons:academy_lessons(*)')
        .eq('slug', slug)
        .eq('is_published', true)
        .single()
      if (error) throw error
      // Trier les leçons
      if (data.lessons) {
        data.lessons.sort((a: AcademyLesson, b: AcademyLesson) => a.ordre - b.ordre)
      }
      return data as AcademyModule
    },
    enabled: !!slug,
  })
}

export function useAcademyProgress(userId?: string) {
  const supabase = createClient()
  return useQuery({
    queryKey: ['academy-progress', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('academy_progress')
        .select('*')
        .eq('user_id', userId!)
      if (error) throw error
      return data as AcademyProgress[]
    },
    enabled: !!userId,
  })
}

export function useAcademyBadges(userId?: string) {
  const supabase = createClient()
  return useQuery({
    queryKey: ['academy-badges', userId],
    queryFn: async () => {
      const { data: allBadges } = await supabase
        .from('academy_badges')
        .select('*')
        .order('created_at', { ascending: true })

      const { data: earned } = await supabase
        .from('academy_user_badges')
        .select('badge_id, earned_at')
        .eq('user_id', userId!)

      const earnedMap = new Map((earned || []).map(e => [e.badge_id, e.earned_at]))

      return (allBadges || []).map(b => ({
        ...b,
        earned: earnedMap.has(b.id),
        earned_at: earnedMap.get(b.id),
      })) as AcademyBadge[]
    },
    enabled: !!userId,
  })
}

export function useAcademyStats(userId?: string) {
  const supabase = createClient()
  return useQuery({
    queryKey: ['academy-stats', userId],
    queryFn: async () => {
      const [progressRes, modulesRes, badgesRes] = await Promise.all([
        supabase.from('academy_progress').select('*').eq('user_id', userId!),
        supabase.from('academy_modules').select('id, lessons:academy_lessons(id)').eq('is_published', true),
        supabase.from('academy_user_badges').select('id').eq('user_id', userId!),
      ])

      const progress = progressRes.data || []
      const modules = modulesRes.data || []
      const badges = badgesRes.data || []

      const completed = progress.filter(p => p.statut === 'complete')
      const totalLessons = modules.reduce((acc, m) => acc + ((m.lessons as unknown[])?.length || 0), 0)
      const totalPoints = completed.reduce((acc, p) => acc + (p.score_quiz || 10), 0)

      // Modules complétés : toutes les leçons du module sont complétées
      const completedLessonIds = new Set(completed.map(p => p.lesson_id))
      const modulesCompleted = modules.filter(m => {
        const lessonIds = ((m.lessons as { id: string }[]) || []).map(l => l.id)
        return lessonIds.length > 0 && lessonIds.every(id => completedLessonIds.has(id))
      }).length

      return {
        total_points: totalPoints,
        lessons_completed: completed.length,
        lessons_total: totalLessons,
        modules_completed: modulesCompleted,
        modules_total: modules.length,
        badges_earned: badges.length,
        streak_days: 0, // TODO: calculer
        completion_percent: totalLessons > 0 ? Math.round((completed.length / totalLessons) * 100) : 0,
      } as AcademyUserStats
    },
    enabled: !!userId,
  })
}

export function useCompleteLesson() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (params: { user_id: string; lesson_id: string; score_quiz?: number }) => {
      const { data, error } = await supabase
        .from('academy_progress')
        .upsert({
          user_id: params.user_id,
          lesson_id: params.lesson_id,
          statut: 'complete',
          score_quiz: params.score_quiz,
          completed_at: new Date().toISOString(),
        }, { onConflict: 'user_id,lesson_id' })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academy-progress'] })
      queryClient.invalidateQueries({ queryKey: ['academy-stats'] })
    },
  })
}
