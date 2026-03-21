// @ts-nocheck
'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useUser } from '@/hooks/use-user'
import { createClient } from '@/lib/supabase-client'
import {
  ArrowLeft, Clock, Trophy, BookOpen, Video, HelpCircle,
  CheckSquare, MessageSquare, FileText, PenTool, Check,
  Play, Target, Users
} from 'lucide-react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonCard, SkeletonList } from '@/components/ui/Skeleton'
import { cn } from '@/lib/utils'
import { useAcademyModule, useAcademyProgress } from '@/hooks/use-academy'
import type { AcademyLesson } from '@/types'

function getLessonIcon(type: string, className = "w-5 h-5") {
  switch (type) {
    case 'texte':
      return <BookOpen className={className} />
    case 'video':
      return <Video className={className} />
    case 'quiz':
      return <HelpCircle className={className} />
    case 'checklist':
      return <CheckSquare className={className} />
    case 'script':
      return <MessageSquare className={className} />
    case 'pdf':
      return <FileText className={className} />
    case 'exercice':
      return <PenTool className={className} />
    default:
      return <BookOpen className={className} />
  }
}

function getLessonTypeBadge(type: string) {
  const configs = {
    texte: { label: 'Article', color: 'bg-blue-100 text-blue-700' },
    video: { label: 'Vidéo', color: 'bg-red-100 text-red-700' },
    quiz: { label: 'Quiz', color: 'bg-purple-100 text-purple-700' },
    checklist: { label: 'Checklist', color: 'bg-green-100 text-green-700' },
    script: { label: 'Script', color: 'bg-orange-100 text-orange-700' },
    pdf: { label: 'PDF', color: 'bg-gray-100 text-gray-700' },
    exercice: { label: 'Exercice', color: 'bg-pink-100 text-pink-700' }
  }

  const config = configs[type as keyof typeof configs] || configs.texte
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
      {getLessonIcon(type, "w-3 h-3")}
      {config.label}
    </span>
  )
}

export default function ModuleDetailPage() {
  const params = useParams()
  const router = useRouter()
  const user = useUser()
  const slug = params.slug as string

  // Récupérer les données utilisateur depuis la table equipe
  const { data: currentUser } = useQuery({
    queryKey: ['current-user-equipe', user?.id],
    queryFn: async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('equipe')
        .select('id, prenom, nom')
        .eq('auth_user_id', user!.id)
        .single()
      return data
    },
    enabled: !!user?.id
  })

  const { data: module, isLoading: moduleLoading, error } = useAcademyModule(slug)
  const { data: userProgress } = useAcademyProgress(currentUser?.id)

  if (error) {
    return (
      <div className="min-h-96 flex items-center justify-center">
        <EmptyState
          icon={<BookOpen className="w-8 h-8" />}
          title="Module introuvable"
          description="Ce module n'existe pas ou n'est pas disponible"
        />
      </div>
    )
  }

  if (moduleLoading || !module) {
    return (
      <div className="space-y-6">
        <SkeletonCard className="h-32" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <SkeletonList items={8} />
          </div>
          <SkeletonCard className="h-64" />
        </div>
      </div>
    )
  }

  const lessons = module.lessons || []

  // Calculer la progression
  const moduleProgress = userProgress?.filter(p =>
    lessons.some((l: AcademyLesson) => l.id === p.lesson_id)
  ) || []

  const completedLessons = moduleProgress.filter(p => p.statut === 'complete')
  const progressPercent = lessons.length > 0 ? Math.round((completedLessons.length / lessons.length) * 100) : 0

  // Déterminer la leçon actuelle (première leçon non complétée)
  let currentLessonIndex = completedLessons.length
  if (currentLessonIndex >= lessons.length) {
    currentLessonIndex = lessons.length - 1 // Si tout est fini, pointer sur la dernière
  }

  // Temps total passé (estimation)
  const totalTimeSpent = moduleProgress.reduce((acc, p) => acc + (p.temps_passe_secondes || 0), 0)
  const avgQuizScore = moduleProgress.length > 0
    ? moduleProgress.filter(p => p.score_quiz).reduce((acc, p) => acc + (p.score_quiz || 0), 0) / moduleProgress.filter(p => p.score_quiz).length
    : 0

  return (
    <div className="space-y-6 pb-6">
      {/* Header avec navigation */}
      <div className="space-y-4">
        <Link href="/academy">
          <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à l'Academy
          </Button>
        </Link>

        <div className="flex items-start gap-6">
          <div
            className="p-4 rounded-xl flex-shrink-0"
            style={{
              backgroundColor: `${module.couleur}20`,
              color: module.couleur
            }}
          >
            <div className="w-8 h-8 flex items-center justify-center">
              {module.icone === 'GraduationCap' && <BookOpen className="w-8 h-8" />}
              {module.icone === 'Users' && <Users className="w-8 h-8" />}
              {module.icone === 'Target' && <Target className="w-8 h-8" />}
              {module.icone === 'Trophy' && <Trophy className="w-8 h-8" />}
            </div>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs">
                {module.categorie}
              </Badge>
              <span className="text-sm text-gray-500">•</span>
              <span className="text-sm text-gray-500">{module.duree_minutes} minutes</span>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              {module.titre}
            </h1>

            {module.description && (
              <p className="text-gray-600 leading-relaxed">
                {module.description}
              </p>
            )}

            {/* Progress bar */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-600">Progression</span>
                <span className="font-medium text-gray-900">
                  {completedLessons.length}/{lessons.length} leçons terminées
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${progressPercent}%`,
                    backgroundColor: module.couleur
                  }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">{progressPercent}% complété</p>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Liste des leçons */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Leçons du module</CardTitle>
            </CardHeader>
            <CardContent>
              {lessons.length > 0 ? (
                <div className="space-y-3">
                  {lessons.map((lesson: AcademyLesson, index) => {
                    const lessonProgress = moduleProgress.find(p => p.lesson_id === lesson.id)
                    const isCompleted = lessonProgress?.statut === 'complete'
                    const isCurrent = index === currentLessonIndex && !isCompleted
                    const isLocked = index > currentLessonIndex + 1

                    return (
                      <Link
                        key={lesson.id}
                        href={isLocked ? '#' : `/academy/${slug}/${lesson.slug}`}
                        className={cn(
                          "flex items-center gap-4 p-4 rounded-xl border transition-all duration-200",
                          isCompleted ? "bg-green-50 border-green-200" :
                          isCurrent ? "bg-blue-50 border-[#2EC6F3] ring-2 ring-[#2EC6F3]/20" :
                          isLocked ? "bg-gray-50 border-gray-200 cursor-not-allowed opacity-60" :
                          "bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm"
                        )}
                      >
                        {/* Numéro de leçon */}
                        <div className={cn(
                          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                          isCompleted ? "bg-green-500 text-white" :
                          isCurrent ? "bg-[#2EC6F3] text-white" :
                          isLocked ? "bg-gray-300 text-gray-500" :
                          "bg-gray-200 text-gray-600"
                        )}>
                          {isCompleted ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            index + 1
                          )}
                        </div>

                        {/* Contenu leçon */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className={cn(
                              "font-medium truncate",
                              isCompleted ? "text-green-900 line-through" :
                              isCurrent ? "text-[#2EC6F3]" :
                              isLocked ? "text-gray-400" :
                              "text-gray-900"
                            )}>
                              {lesson.titre}
                            </h3>
                            {isCurrent && (
                              <Play className="w-4 h-4 text-[#2EC6F3] animate-pulse" />
                            )}
                          </div>

                          <div className="flex items-center gap-3">
                            {getLessonTypeBadge(lesson.type)}
                            <span className="text-xs text-gray-500">
                              {lesson.duree_minutes} min
                            </span>
                            <span className="text-xs text-gray-500">
                              {lesson.points} points
                            </span>
                          </div>
                        </div>

                        {/* Score si quiz complété */}
                        {isCompleted && lessonProgress?.score_quiz && (
                          <div className="text-right">
                            <p className="text-sm font-medium text-green-700">
                              {lessonProgress.score_quiz}%
                            </p>
                            <p className="text-xs text-green-600">Score</p>
                          </div>
                        )}
                      </Link>
                    )
                  })}
                </div>
              ) : (
                <EmptyState
                  icon={<BookOpen className="w-6 h-6" />}
                  title="Aucune leçon disponible"
                  description="Ce module ne contient pas encore de leçons"
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar avec stats */}
        <div className="space-y-6">
          {/* Stats du module */}
          <Card>
            <CardHeader>
              <CardTitle icon={<Trophy className="w-4 h-4" />}>
                Statistiques du module
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Progression</span>
                <span className="font-medium">{progressPercent}%</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Temps passé</span>
                <span className="font-medium">
                  {Math.round(totalTimeSpent / 60)} min
                </span>
              </div>

              {avgQuizScore > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Score moyen</span>
                  <span className="font-medium">{Math.round(avgQuizScore)}%</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Leçons</span>
                <span className="font-medium">
                  {completedLessons.length}/{lessons.length}
                </span>
              </div>

              <div className="pt-2 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Points potentiels</span>
                  <span className="font-medium text-[#2EC6F3]">
                    {lessons.reduce((acc: number, lesson: AcademyLesson) => acc + lesson.points, 0)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Navigation rapide */}
          <Card>
            <CardHeader>
              <CardTitle icon={<Clock className="w-4 h-4" />}>
                Navigation rapide
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {lessons.slice(0, 5).map((lesson: AcademyLesson, index) => {
                  const lessonProgress = moduleProgress.find(p => p.lesson_id === lesson.id)
                  const isCompleted = lessonProgress?.statut === 'complete'
                  const isCurrent = index === currentLessonIndex && !isCompleted

                  return (
                    <Link
                      key={lesson.id}
                      href={`/academy/${slug}/${lesson.slug}`}
                      className={cn(
                        "flex items-center gap-3 p-2 rounded-lg text-sm transition-colors",
                        isCurrent ? "bg-blue-50 text-[#2EC6F3]" :
                        isCompleted ? "bg-green-50 text-green-700" :
                        "text-gray-600 hover:bg-gray-50"
                      )}
                    >
                      <div className={cn(
                        "w-4 h-4 rounded-full flex items-center justify-center text-xs",
                        isCompleted ? "bg-green-500 text-white" :
                        isCurrent ? "bg-[#2EC6F3] text-white" :
                        "bg-gray-200 text-gray-500"
                      )}>
                        {isCompleted ? (
                          <Check className="w-2 h-2" />
                        ) : (
                          index + 1
                        )}
                      </div>
                      <span className="truncate">{lesson.titre}</span>
                    </Link>
                  )
                })}

                {lessons.length > 5 && (
                  <p className="text-xs text-gray-500 text-center pt-2">
                    +{lessons.length - 5} autres leçons
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}