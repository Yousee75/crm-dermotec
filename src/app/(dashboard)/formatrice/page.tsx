'use client'

export const dynamic = 'force-dynamic'

import { useMemo } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/infra/supabase-client'
import { useCurrentUser } from '@/hooks/use-current-user'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { KpiCard } from '@/components/ui/KpiCard'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton, SkeletonCard, SkeletonTable } from '@/components/ui/Skeleton'
import {
  Calendar, Users, Clock, CheckCircle2,
  Star, BarChart3, ClipboardList, Play,
  ChevronRight, AlertTriangle, Sparkles,
} from 'lucide-react'
import type { Session, Inscription } from '@/types'

// ============================================================
// Helpers
// ============================================================

function formatDateFr(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

function formatDateLongFr(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function isToday(dateStr: string): boolean {
  const d = new Date(dateStr)
  const now = new Date()
  return d.toDateString() === now.toDateString()
}

function isTomorrow(dateStr: string): boolean {
  const d = new Date(dateStr)
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return d.toDateString() === tomorrow.toDateString()
}

function getWeekRange(): { start: string; end: string } {
  const now = new Date()
  const day = now.getDay()
  const diffToMonday = day === 0 ? -6 : 1 - day
  const monday = new Date(now)
  monday.setDate(now.getDate() + diffToMonday)
  monday.setHours(0, 0, 0, 0)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)
  return {
    start: monday.toISOString().split('T')[0],
    end: sunday.toISOString().split('T')[0],
  }
}

function getMonthRange(): { start: string; end: string } {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  }
}

// ============================================================
// Hook : sessions de la formatrice
// ============================================================

function useFormatriceSessions(formatriceId: string | null) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['formatrice-sessions', formatriceId],
    queryFn: async () => {
      if (!formatriceId) return []
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          *,
          formation:formations(id, nom, slug, duree_jours, duree_heures, places_max, categorie),
          inscriptions(
            id, lead_id, statut, taux_presence, note_satisfaction,
            presence_jour1, presence_jour2, presence_jour3, presence_jour4, presence_jour5,
            lead:leads(id, prenom, nom, email, telephone, photo_url)
          )
        `)
        .eq('formatrice_id', formatriceId)
        .in('statut', ['PLANIFIEE', 'CONFIRMEE', 'EN_COURS', 'TERMINEE'])
        .order('date_debut', { ascending: true })

      if (error) throw error
      return (data || []) as Session[]
    },
    enabled: !!formatriceId,
    staleTime: 2 * 60_000,
    gcTime: 10 * 60_000,
  })
}

// ============================================================
// Skeleton loading
// ============================================================

function FormatriceSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      {/* Session du jour */}
      <div className="bg-white rounded-xl border p-6 space-y-4">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-64" />
        <div className="flex gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
      </div>
      {/* Sessions semaine */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SkeletonCard />
        <SkeletonCard />
      </div>
      {/* Table */}
      <SkeletonTable rows={5} cols={5} />
    </div>
  )
}

// ============================================================
// Composants sections
// ============================================================

function SessionDuJour({ session }: { session: Session }) {
  const inscriptions = (session.inscriptions || []).filter(
    (i: Inscription) => i.statut !== 'ANNULEE' && i.statut !== 'REMBOURSEE'
  )

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-white ring-1 ring-primary/10">
      <CardHeader>
        <CardTitle icon={<Sparkles className="w-5 h-5" />}>
          Session du jour
        </CardTitle>
        <Badge variant="warning" size="lg" dot pulse>
          En cours
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Info formation */}
        <div>
          <h4 className="font-semibold text-accent text-lg">
            {session.formation?.nom || 'Formation'}
          </h4>
          <p className="text-sm text-[#777777] flex items-center gap-2 mt-1">
            <Clock className="w-4 h-4" />
            {session.horaire_debut} — {session.horaire_fin}
            <span className="text-[#999999]">|</span>
            {session.salle || 'Salle 1'}
          </p>
        </div>

        {/* Stagiaires inscrits */}
        <div>
          <p className="text-xs font-medium text-[#777777] uppercase tracking-wide mb-2">
            Stagiaires ({inscriptions.length}/{session.places_max})
          </p>
          {inscriptions.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {inscriptions.map((ins: Inscription) => (
                <div key={ins.id} className="flex items-center gap-2 bg-[#FAF8F5] rounded-lg px-3 py-2">
                  <Avatar
                    name={`${ins.lead?.prenom || ''} ${ins.lead?.nom || ''}`}
                    src={ins.lead?.photo_url}
                    size="sm"
                  />
                  <span className="text-sm font-medium text-[#3A3A3A]">
                    {ins.lead?.prenom} {ins.lead?.nom}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#999999] italic">Aucun stagiaire inscrit</p>
          )}
        </div>

        {/* Checklist rapide */}
        <div>
          <p className="text-xs font-medium text-[#777777] uppercase tracking-wide mb-2">
            Checklist
          </p>
          <div className="flex flex-wrap gap-2">
            <ChecklistItem label="Materiel prepare" checked={session.materiel_prepare} />
            <ChecklistItem label="Supports envoyes" checked={session.supports_envoyes} />
            <ChecklistItem label="Convocations envoyees" checked={session.convocations_envoyees ?? false} />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Link href={`/session/${session.id}/emargement-live`}>
            <Button icon={<Play className="w-4 h-4" />}>
              Lancer l'emargement
            </Button>
          </Link>
          <Link href={`/session/${session.id}`}>
            <Button variant="outline" icon={<ChevronRight className="w-4 h-4" />}>
              Voir details
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

function ChecklistItem({ label, checked }: { label: string; checked: boolean }) {
  return (
    <span className={`
      inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
      ${checked
        ? 'bg-[#ECFDF5] text-[#10B981]'
        : 'bg-[#FFF3E8] text-[#FF8C42]'
      }
    `}>
      <CheckCircle2 className={`w-3.5 h-3.5 ${checked ? 'text-[#10B981]' : 'text-[#FF8C42]'}`} />
      {label}
    </span>
  )
}

function SessionWeekCard({ session }: { session: Session }) {
  const inscriptions = (session.inscriptions || []).filter(
    (i: Inscription) => i.statut !== 'ANNULEE' && i.statut !== 'REMBOURSEE'
  )
  const today = isToday(session.date_debut)
  const tomorrow = isTomorrow(session.date_debut)

  return (
    <Card hover className="relative">
      {/* Badge urgence */}
      {(today || tomorrow) && (
        <div className="absolute top-3 right-3">
          <Badge
            variant={today ? 'error' : 'warning'}
            size="sm"
            dot
            pulse={today}
          >
            {today ? "Aujourd'hui" : 'Demain'}
          </Badge>
        </div>
      )}

      <CardContent className="space-y-3">
        {/* Formation */}
        <div>
          <p className="text-xs text-[#999999] uppercase tracking-wide">
            {session.formation?.categorie || 'Formation'}
          </p>
          <h4 className="font-semibold text-accent mt-0.5 pr-20">
            {session.formation?.nom || 'Formation'}
          </h4>
        </div>

        {/* Dates */}
        <div className="flex items-center gap-2 text-sm text-[#777777]">
          <Calendar className="w-4 h-4 text-primary" />
          {formatDateFr(session.date_debut)}
          {session.date_fin !== session.date_debut && (
            <> — {formatDateFr(session.date_fin)}</>
          )}
        </div>

        {/* Places */}
        <div className="flex items-center gap-2 text-sm text-[#777777]">
          <Users className="w-4 h-4 text-primary" />
          {inscriptions.length}/{session.places_max} inscrits
          {inscriptions.length >= session.places_max && (
            <Badge variant="success" size="xs">Complet</Badge>
          )}
        </div>

        {/* Statut */}
        <div className="flex items-center justify-between pt-1">
          <SessionStatutBadge statut={session.statut} />
          <Link href={`/session/${session.id}`}>
            <Button variant="ghost" size="sm" icon={<ChevronRight className="w-4 h-4" />}>
              Voir details
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

function SessionStatutBadge({ statut }: { statut: string }) {
  const config: Record<string, { variant: 'success' | 'warning' | 'info' | 'error' | 'default'; label: string }> = {
    PLANIFIEE: { variant: 'info', label: 'Planifiee' },
    CONFIRMEE: { variant: 'success', label: 'Confirmee' },
    EN_COURS: { variant: 'warning', label: 'En cours' },
    TERMINEE: { variant: 'default', label: 'Terminee' },
    ANNULEE: { variant: 'error', label: 'Annulee' },
    REPORTEE: { variant: 'warning', label: 'Reportee' },
  }
  const c = config[statut] || { variant: 'default' as const, label: statut }
  return <Badge variant={c.variant} size="sm">{c.label}</Badge>
}

function StagiairesRecentsTable({ sessions }: { sessions: Session[] }) {
  // Extraire les stagiaires des sessions terminees, tries par date
  const stagiaires = useMemo(() => {
    const result: {
      id: string
      prenom: string
      nom: string
      formation: string
      date: string
      presence: number | null
      satisfaction: number | null
    }[] = []

    const terminated = sessions
      .filter(s => s.statut === 'TERMINEE')
      .sort((a, b) => new Date(b.date_fin).getTime() - new Date(a.date_fin).getTime())

    for (const session of terminated) {
      for (const ins of (session.inscriptions || []) as Inscription[]) {
        if (ins.statut === 'ANNULEE' || ins.statut === 'REMBOURSEE') continue
        result.push({
          id: ins.id,
          prenom: ins.lead?.prenom || '',
          nom: ins.lead?.nom || '',
          formation: session.formation?.nom || '',
          date: session.date_fin,
          presence: ins.taux_presence ?? null,
          satisfaction: ins.note_satisfaction ?? null,
        })
      }
    }

    return result.slice(0, 10)
  }, [sessions])

  if (stagiaires.length === 0) {
    return (
      <EmptyState
        icon={<Users className="w-6 h-6" />}
        title="Aucun stagiaire forme"
        description="Vos stagiaires apparaitront ici apres vos premieres sessions"
      />
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#F4F0EB]">
            <th className="text-left py-3 px-3 text-xs font-medium text-[#777777] uppercase tracking-wide">Stagiaire</th>
            <th className="text-left py-3 px-3 text-xs font-medium text-[#777777] uppercase tracking-wide hidden md:table-cell">Formation</th>
            <th className="text-left py-3 px-3 text-xs font-medium text-[#777777] uppercase tracking-wide">Date</th>
            <th className="text-center py-3 px-3 text-xs font-medium text-[#777777] uppercase tracking-wide">Presence</th>
            <th className="text-center py-3 px-3 text-xs font-medium text-[#777777] uppercase tracking-wide">Satisfaction</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#FAF8F5]">
          {stagiaires.map((s) => (
            <tr key={s.id} className="hover:bg-[#FAF8F5]/50 transition-colors">
              <td className="py-3 px-3">
                <div className="flex items-center gap-2">
                  <Avatar name={`${s.prenom} ${s.nom}`} size="xs" />
                  <span className="font-medium text-[#3A3A3A]">{s.prenom} {s.nom}</span>
                </div>
              </td>
              <td className="py-3 px-3 text-[#777777] hidden md:table-cell max-w-[200px] truncate">
                {s.formation}
              </td>
              <td className="py-3 px-3 text-[#777777]">{formatDateFr(s.date)}</td>
              <td className="py-3 px-3 text-center">
                {s.presence !== null ? (
                  <Badge variant={s.presence >= 80 ? 'success' : s.presence >= 50 ? 'warning' : 'error'} size="sm">
                    {s.presence}%
                  </Badge>
                ) : (
                  <span className="text-[#999999]">—</span>
                )}
              </td>
              <td className="py-3 px-3 text-center">
                {s.satisfaction !== null ? (
                  <div className="flex items-center justify-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        className={`w-3.5 h-3.5 ${
                          n <= (s.satisfaction || 0)
                            ? 'text-[#FF8C42] fill-amber-400'
                            : 'text-[#EEEEEE]'
                        }`}
                      />
                    ))}
                  </div>
                ) : (
                  <span className="text-[#999999]">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ============================================================
// Page principale
// ============================================================

export default function FormatricePage() {
  const { data: currentUser, isLoading: userLoading } = useCurrentUser()
  const { data: sessions = [], isLoading: sessionsLoading } = useFormatriceSessions(
    currentUser?.equipe_id || null
  )

  const isLoading = userLoading || sessionsLoading

  // Calculs derives
  const { weekRange, monthRange } = useMemo(() => ({
    weekRange: getWeekRange(),
    monthRange: getMonthRange(),
  }), [])

  const { sessionDuJour, sessionsSemaine, stats } = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]

    // Session du jour : date_debut <= aujourd'hui <= date_fin ET pas terminee/annulee
    const sessionDuJour = sessions.find(s =>
      s.date_debut <= today &&
      s.date_fin >= today &&
      (s.statut === 'CONFIRMEE' || s.statut === 'EN_COURS' || s.statut === 'PLANIFIEE')
    ) || null

    // Sessions de la semaine (hors terminee/annulee)
    const sessionsSemaine = sessions.filter(s =>
      s.date_debut >= weekRange.start &&
      s.date_debut <= weekRange.end &&
      s.statut !== 'TERMINEE' &&
      s.statut !== 'ANNULEE'
    )

    // Stats du mois
    const sessionsMois = sessions.filter(s =>
      s.date_debut >= monthRange.start &&
      s.date_debut <= monthRange.end
    )
    const sessionsTerminees = sessionsMois.filter(s => s.statut === 'TERMINEE')

    let totalStagiaires = 0
    let totalPresence = 0
    let countPresence = 0
    let totalSatisfaction = 0
    let countSatisfaction = 0

    for (const session of sessionsTerminees) {
      for (const ins of (session.inscriptions || []) as Inscription[]) {
        if (ins.statut === 'ANNULEE' || ins.statut === 'REMBOURSEE') continue
        totalStagiaires++
        if (ins.taux_presence !== null && ins.taux_presence !== undefined) {
          totalPresence += ins.taux_presence
          countPresence++
        }
        if (ins.note_satisfaction !== null && ins.note_satisfaction !== undefined) {
          totalSatisfaction += ins.note_satisfaction
          countSatisfaction++
        }
      }
    }

    return {
      sessionDuJour,
      sessionsSemaine,
      stats: {
        sessionsMois: sessionsMois.length,
        stagiairesFormes: totalStagiaires,
        satisfactionMoyenne: countSatisfaction > 0
          ? (totalSatisfaction / countSatisfaction).toFixed(1)
          : '—',
        tauxPresence: countPresence > 0
          ? Math.round(totalPresence / countPresence)
          : null,
      },
    }
  }, [sessions, weekRange, monthRange])

  // --- Loading ---
  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-6">
        <FormatriceSkeleton />
      </div>
    )
  }

  const prenom = currentUser?.prenom || 'Formatrice'
  const todayStr = formatDateLongFr(new Date().toISOString())

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* ── Header personnalise ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <PageHeader
            title={`Bonjour ${prenom} \u{1F44B}`}
            description={todayStr}
          />
        </div>
        <Badge variant="primary" size="lg">
          Formatrice
        </Badge>
      </div>

      {/* ── KPIs du mois ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          icon={Calendar}
          label="Sessions ce mois"
          value={stats.sessionsMois}
          color="#FF5C00"
        />
        <KpiCard
          icon={Users}
          label="Stagiaires formes"
          value={stats.stagiairesFormes}
          color="#FF2D78"
        />
        <KpiCard
          icon={Star}
          label="Satisfaction moyenne"
          value={stats.satisfactionMoyenne !== '—' ? `${stats.satisfactionMoyenne}/5` : '—'}
          color="#F59E0B"
        />
        <KpiCard
          icon={BarChart3}
          label="Taux presence moyen"
          value={stats.tauxPresence !== null ? `${stats.tauxPresence}%` : '—'}
          color="#22C55E"
        />
      </div>

      {/* ── Session du jour ── */}
      {sessionDuJour ? (
        <SessionDuJour session={sessionDuJour} />
      ) : (
        <Card className="border-dashed border-[#EEEEEE]">
          <CardContent>
            <div className="flex items-center gap-3 py-2">
              <div className="p-2.5 rounded-xl bg-[#FAF8F5]">
                <Calendar className="w-5 h-5 text-[#999999]" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#777777]">Pas de session aujourd'hui</p>
                <p className="text-xs text-[#999999]">Profitez-en pour preparer vos prochaines formations</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Sessions de la semaine ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-accent flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-primary" />
            Sessions a venir cette semaine
          </h2>
          <Link href="/sessions">
            <Button variant="ghost" size="sm" icon={<ChevronRight className="w-4 h-4" />}>
              Tout voir
            </Button>
          </Link>
        </div>

        {sessionsSemaine.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sessionsSemaine.map((session) => (
              <SessionWeekCard key={session.id} session={session} />
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <EmptyState
              icon={<Calendar className="w-6 h-6" />}
              title="Aucune session cette semaine"
              description="Votre planning est libre cette semaine"
            />
          </Card>
        )}
      </div>

      {/* ── Stagiaires recents ── */}
      <Card>
        <CardHeader>
          <CardTitle icon={<Users className="w-5 h-5" />}>
            Mes stagiaires recents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <StagiairesRecentsTable sessions={sessions} />
        </CardContent>
      </Card>
    </div>
  )
}
