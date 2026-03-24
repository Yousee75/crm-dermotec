'use client'

import { useQuery } from '@tanstack/react-query'
import { useUser } from '@/hooks/use-user'
import { createClient } from '@/lib/supabase-client'
import {
  GraduationCap, Trophy, TrendingUp, Users, Clock,
  BookOpen, Video, HelpCircle, CheckSquare, Lock,
  MessageSquare, FileText, PenTool, Flame, Zap
} from 'lucide-react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonCard, SkeletonList } from '@/components/ui/Skeleton'
import { cn } from '@/lib/utils'
import { useAcademyModules, useAcademyStats, useAcademyBadges, useAcademyProgress } from '@/hooks/use-academy'
import type { AcademyModule, AcademyUserStats, AcademyBadge } from '@/types'

function getLessonIcon(type: string, className = "w-4 h-4") {
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

function CircularProgress({ value, size = 80, strokeWidth = 6 }: { value: number, size?: number, strokeWidth?: number }) {
  const center = size / 2
  const radius = center - strokeWidth / 2
  const circumference = 2 * Math.PI * radius
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (value / 100) * circumference

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-[#EEEEEE]"
        />
        {/* Progress circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="var(--color-primary)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-in-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold text-[#111111]">{value}%</span>
      </div>
    </div>
  )
}

async function fetchLeaderboard(): Promise<any[]> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from('equipe')
      .select(`
        id, prenom, nom, avatar_color,
        progress:academy_progress(
          lesson_id,
          score_quiz,
          statut
        ),
        badges:academy_user_badges(id)
      `)
      .eq('is_active', true)

    if (error) throw error

    // Calculer les points pour chaque membre
    return (data || []).map(member => {
      const completedLessons = (member.progress || []).filter((p: any) => p.statut === 'complete')
      const totalPoints = completedLessons.reduce((acc: number, p: any) => acc + (p.score_quiz || 10), 0)
      const badgesCount = (member.badges || []).length

      return {
        ...member,
        total_points: totalPoints,
        badges_count: badgesCount,
        lessons_completed: completedLessons.length
      }
    }).sort((a, b) => b.total_points - a.total_points).slice(0, 5)
  } catch {
    return []
  }
}

export default function AcademyPage() {
  const user = useUser()

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

  const { data: leaderboard, isLoading: leaderboardLoading } = useQuery({
    queryKey: ['academy-leaderboard'],
    queryFn: fetchLeaderboard
  })

  const { data: modules, isLoading: modulesLoading } = useAcademyModules()
  const { data: userStats, isLoading: statsLoading } = useAcademyStats(currentUser?.id)
  const { data: badges, isLoading: badgesLoading } = useAcademyBadges(currentUser?.id)
  const { data: userProgress } = useAcademyProgress(currentUser?.id)

  const isLoading = modulesLoading || statsLoading || badgesLoading

  // Calculer la progression pour chaque module
  const modulesWithProgress = modules?.map(module => {
    const moduleProgress = userProgress?.filter(p =>
      module.lessons?.some((l: any) => l.id === p.lesson_id)
    ) || []
    const completedLessons = moduleProgress.filter(p => p.statut === 'complete').length
    const totalLessons = module.lessons?.length || 0
    const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

    return {
      ...module,
      progress_completed: completedLessons,
      progress_total: totalLessons,
      progress_percent: progressPercent
    }
  })

  if (isLoading) {
    return (
      <div className="space-y-6 pb-6">
        <div className="h-32"><SkeletonCard /></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-40"><SkeletonCard /></div>
          <div className="h-40"><SkeletonCard /></div>
          <div className="h-40"><SkeletonCard /></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48"><SkeletonCard /></div>
          ))}
        </div>
      </div>
    )
  }

  const earnedBadges = badges?.filter(b => b.earned) || []
  const lockedBadges = badges?.filter(b => !b.earned) || []

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-accent px-6 py-6 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-white/20" />
          <div className="absolute -left-8 -bottom-8 w-32 h-32 rounded-full bg-white/10" />
        </div>
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-white/20">
              <GraduationCap className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Mon coaching
              </h1>
              <p className="text-[#6B8CAE] mt-1">
                Formation continue et montée en compétences
              </p>
            </div>
          </div>

          {/* User Stats Bar */}
          <div className="hidden lg:flex items-center gap-6 text-white/90">
            <div className="text-center">
              <p className="text-2xl font-bold">{userStats?.total_points || 0}</p>
              <p className="text-xs text-[#6B8CAE]">Points</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{userStats?.completion_percent || 0}%</p>
              <p className="text-xs text-[#6B8CAE]">Complété</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{earnedBadges.length}</p>
              <p className="text-xs text-[#6B8CAE]">Badges</p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Overall Progress */}
        <Card>
          <CardHeader>
            <CardTitle icon={<TrendingUp className="w-4 h-4" />}>
              Progression globale
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <CircularProgress value={userStats?.completion_percent || 0} />
            <div className="text-center mt-4">
              <p className="text-sm text-[#777777]">
                {userStats?.lessons_completed || 0} / {userStats?.lessons_total || 0} leçons
              </p>
              <p className="text-xs text-[#777777] mt-1">
                {userStats?.modules_completed || 0} modules complétés
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Streak */}
        <Card>
          <CardHeader>
            <CardTitle icon={<Flame className="w-4 h-4" />}>
              Série actuelle
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center">
            <div className="text-4xl font-bold text-orange-500 mb-2">
              {userStats?.streak_days || 0}
            </div>
            <p className="text-sm text-[#777777] text-center">
              jours consécutifs d'apprentissage
            </p>
          </CardContent>
        </Card>

        {/* Badges Earned */}
        <Card>
          <CardHeader>
            <CardTitle icon={<Trophy className="w-4 h-4" />}>
              Badges obtenus
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {earnedBadges.slice(0, 6).map((badge) => (
                <div
                  key={badge.id}
                  className="flex items-center gap-2 bg-[#FFF3E8] text-[#FF8C42] px-2 py-1 rounded-lg text-xs"
                  title={badge.description || undefined}
                >
                  <Trophy className="w-3 h-3" />
                  <span className="font-medium">{badge.nom}</span>
                </div>
              ))}
              {earnedBadges.length === 0 && (
                <p className="text-sm text-[#777777] text-center w-full py-4">
                  Aucun badge obtenu pour le moment
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modules Grid */}
      <div>
        <h2 className="text-xl font-semibold text-[#111111] mb-4">Modules de formation</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {modulesWithProgress?.map((module) => {
            // Vérifier si le module est déverrouillé
            const isLocked = module.prerequis_module_id && !modulesWithProgress.find(m =>
              m.id === module.prerequis_module_id && m.progress_percent === 100
            )

            return (
              <Link
                key={module.id}
                href={isLocked ? '#' : `/academy/${module.slug}`}
                className={cn(
                  "group relative rounded-xl border transition-all duration-200",
                  isLocked
                    ? "bg-[#FAF8F5] border-[#EEEEEE] cursor-not-allowed"
                    : "bg-white border-[#EEEEEE] hover:border-primary hover:shadow-lg cursor-pointer"
                )}
              >
                <div className="p-6">
                  {/* Module Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className={cn(
                        "p-3 rounded-xl",
                        isLocked ? "bg-[#EEEEEE] text-[#999999]" : ""
                      )}
                      style={{
                        backgroundColor: isLocked ? undefined : `${module.couleur}20`,
                        color: isLocked ? undefined : module.couleur
                      }}
                    >
                      {isLocked ? (
                        <Lock className="w-6 h-6" />
                      ) : (
                        <div className="w-6 h-6 flex items-center justify-center">
                          {module.icone === 'GraduationCap' && <GraduationCap className="w-6 h-6" />}
                          {module.icone === 'Users' && <Users className="w-6 h-6" />}
                          {module.icone === 'Zap' && <Zap className="w-6 h-6" />}
                          {module.icone === 'Trophy' && <Trophy className="w-6 h-6" />}
                        </div>
                      )}
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-[#777777]">{module.duree_minutes}min</p>
                      <Badge variant="outline" size="sm" className="mt-1">
                        {module.progress_total} leçons
                      </Badge>
                    </div>
                  </div>

                  {/* Module Content */}
                  <div className="space-y-3">
                    <h3 className={cn(
                      "font-semibold",
                      isLocked ? "text-[#999999]" : "text-[#111111]"
                    )}>
                      {module.titre}
                    </h3>

                    <p className={cn(
                      "text-sm line-clamp-2",
                      isLocked ? "text-[#999999]" : "text-[#777777]"
                    )}>
                      {module.description}
                    </p>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className={cn(
                          isLocked ? "text-[#999999]" : "text-[#777777]"
                        )}>
                          Progression
                        </span>
                        <span className={cn(
                          "font-medium",
                          isLocked ? "text-[#999999]" : "text-[#111111]"
                        )}>
                          {module.progress_completed}/{module.progress_total}
                        </span>
                      </div>
                      <div className="w-full bg-[#EEEEEE] rounded-full h-2">
                        <div
                          className={cn(
                            "h-2 rounded-full transition-all duration-500",
                            isLocked ? "bg-[#EEEEEE]" : ""
                          )}
                          style={{
                            width: `${module.progress_percent}%`,
                            backgroundColor: isLocked ? undefined : module.couleur
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {isLocked && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-xl">
                    <div className="text-center">
                      <Lock className="w-8 h-8 text-[#999999] mx-auto mb-2" />
                      <p className="text-sm text-[#777777]">Module verrouillé</p>
                    </div>
                  </div>
                )}
              </Link>
            )
          })}
        </div>
      </div>

      {/* Bottom Row: Badges + Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* All Badges */}
        <Card>
          <CardHeader>
            <CardTitle icon={<Trophy className="w-4 h-4" />}>
              Collection de badges
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {/* Earned badges */}
              {earnedBadges.map((badge) => (
                <div
                  key={badge.id}
                  className="flex-shrink-0 text-center"
                  title={badge.description || undefined}
                >
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center mb-2">
                    <Trophy className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-xs font-medium text-[#111111] truncate w-16">{badge.nom}</p>
                </div>
              ))}

              {/* Locked badges */}
              {lockedBadges.slice(0, 8).map((badge) => (
                <div
                  key={badge.id}
                  className="flex-shrink-0 text-center opacity-40"
                  title={`Débloquer : ${badge.description}`}
                >
                  <div className="w-16 h-16 rounded-xl bg-[#EEEEEE] flex items-center justify-center mb-2">
                    <Trophy className="w-8 h-8 text-[#999999]" />
                  </div>
                  <p className="text-xs font-medium text-[#777777] truncate w-16">{badge.nom}</p>
                </div>
              ))}
            </div>

            {badges?.length === 0 && (
              <EmptyState
                icon={<Trophy className="w-6 h-6" />}
                title="Aucun badge disponible"
                description="Les badges apparaîtront bientôt"
              />
            )}
          </CardContent>
        </Card>

        {/* Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle icon={<Users className="w-4 h-4" />}>
              Classement équipe
            </CardTitle>
          </CardHeader>
          <CardContent>
            {leaderboardLoading ? (
              <SkeletonList items={5} />
            ) : leaderboard && leaderboard.length > 0 ? (
              <div className="space-y-3">
                {leaderboard.map((member, index) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3"
                  >
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                      index === 0 ? "bg-[#FFF3E8] text-[#FF8C42]" :
                      index === 1 ? "bg-[#F4F0EB] text-[#3A3A3A]" :
                      index === 2 ? "bg-orange-100 text-orange-700" :
                      "bg-[#FAF8F5] text-[#777777]"
                    )}>
                      {index + 1}
                    </div>

                    <Avatar
                      name={`${member.prenom} ${member.nom}`}
                      size="sm"
                      color={member.avatar_color}
                    />

                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[#111111] truncate">
                        {member.prenom} {member.nom}
                      </p>
                      <p className="text-xs text-[#777777]">
                        {member.lessons_completed} leçons • {member.badges_count} badges
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-bold text-primary">
                        {member.total_points}
                      </p>
                      <p className="text-xs text-[#777777]">points</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Users className="w-6 h-6" />}
                title="Aucun membre dans le classement"
                description="Commencez à apprendre pour apparaître ici"
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}