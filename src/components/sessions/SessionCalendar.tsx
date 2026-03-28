'use client'

import { useState, useMemo, useCallback } from 'react'
import { Calendar, ChevronLeft, ChevronRight, Clock, MapPin, User, Users } from 'lucide-react'
import { CATEGORIES_FORMATION, type CategorieFormation } from '@/types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CalendarSession {
  id: string
  formation_nom: string
  formation_categorie: string
  date_debut: string
  date_fin: string
  horaire_debut?: string
  horaire_fin?: string
  formatrice_nom?: string
  salle?: string
  places_max: number
  places_occupees: number
  statut: string
}

export interface SessionCalendarProps {
  sessions: CalendarSession[]
  onSessionClick: (id: string) => void
  initialView?: 'month' | 'week'
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'] as const
const MOIS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
] as const

const HEURES = Array.from({ length: 12 }, (_, i) => i + 8) // 8h -> 19h

/** Map catégorie -> couleurs Tailwind-safe */
const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  'Dermo-Esthétique':  { bg: 'bg-rose-50',    text: 'text-rose-700',    border: 'border-rose-200',  dot: 'bg-rose-500' },
  'Dermo-Correctrice': { bg: 'bg-pink-50',     text: 'text-pink-700',    border: 'border-pink-200',  dot: 'bg-pink-500' },
  'Soins Visage':      { bg: 'bg-[#FFF3E8]',    text: 'text-[#FF8C42]',   border: 'border-[#FF8C42]/30', dot: 'bg-[#FF8C42]' },
  'Laser & IPL':       { bg: 'bg-[#FFE0EF]',   text: 'text-[#FF2D78]',  border: 'border-[#FF2D78]/30', dot: 'bg-[#FFE0EF]0' },
  'Soins Corps':       { bg: 'bg-emerald-50',  text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  'Hygiène':           { bg: 'bg-[#E0EBF5]',     text: 'text-[#6B8CAE]',    border: 'border-[#6B8CAE]/30',  dot: 'bg-[#6B8CAE]' },
}

const DEFAULT_COLOR = { bg: 'bg-[#FAF8F5]', text: 'text-[#3A3A3A]', border: 'border-[#EEEEEE]', dot: 'bg-[#999999]' }

function getCategoryColor(cat: string) {
  return CATEGORY_COLORS[cat] ?? DEFAULT_COLOR
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function isToday(d: Date) {
  return isSameDay(d, new Date())
}

/** Parse "HH:MM" or "HH:MM:SS" to fractional hours */
function parseHour(t?: string): number {
  if (!t) return 9
  const [h, m] = t.split(':').map(Number)
  return h + (m || 0) / 60
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

/** Get Monday of the week containing `date` */
function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

/** Build array of dates for a month grid (includes padding from prev/next months) */
function getMonthGrid(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  // Monday = 0 in our grid
  let startDow = firstDay.getDay() - 1
  if (startDow < 0) startDow = 6

  const dates: Date[] = []

  // Previous month padding
  for (let i = startDow - 1; i >= 0; i--) {
    const d = new Date(year, month, -i)
    dates.push(d)
  }

  // Current month
  for (let i = 1; i <= lastDay.getDate(); i++) {
    dates.push(new Date(year, month, i))
  }

  // Next month padding to fill last row
  while (dates.length % 7 !== 0) {
    const last = dates[dates.length - 1]
    const next = new Date(last)
    next.setDate(next.getDate() + 1)
    dates.push(next)
  }

  return dates
}

/** Check if a session spans a given date */
function sessionOnDate(session: CalendarSession, date: Date): boolean {
  const start = new Date(session.date_debut)
  start.setHours(0, 0, 0, 0)
  const end = new Date(session.date_fin)
  end.setHours(23, 59, 59, 999)
  const check = new Date(date)
  check.setHours(12, 0, 0, 0)
  return check >= start && check <= end
}

// ---------------------------------------------------------------------------
// Tooltip
// ---------------------------------------------------------------------------

function SessionTooltip({ session }: { session: CalendarSession }) {
  const startDate = new Date(session.date_debut).toLocaleDateString('fr-FR')
  const endDate = new Date(session.date_fin).toLocaleDateString('fr-FR')
  const colors = getCategoryColor(session.formation_categorie)

  return (
    <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-white rounded-lg shadow-lg border border-[#EEEEEE] p-3 pointer-events-none">
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-white border-r border-b border-[#EEEEEE]" />
      <p className={`font-semibold text-sm ${colors.text} mb-1`}>{session.formation_nom}</p>
      <div className="space-y-1 text-xs text-[#777777]">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3 h-3 shrink-0" />
          <span>{startDate}{startDate !== endDate ? ` → ${endDate}` : ''}</span>
          {session.horaire_debut && (
            <span className="text-[#999999]">
              {session.horaire_debut?.slice(0, 5)}–{session.horaire_fin?.slice(0, 5)}
            </span>
          )}
        </div>
        {session.formatrice_nom && (
          <div className="flex items-center gap-1.5">
            <User className="w-3 h-3 shrink-0" />
            <span>{session.formatrice_nom}</span>
          </div>
        )}
        {session.salle && (
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3 h-3 shrink-0" />
            <span>{session.salle}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <Users className="w-3 h-3 shrink-0" />
          <span>{session.places_occupees}/{session.places_max} inscrits</span>
          {session.places_occupees >= session.places_max && (
            <span className="text-rose-600 font-medium">Complet</span>
          )}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Session pill (month view)
// ---------------------------------------------------------------------------

function SessionPill({
  session,
  onClick,
}: {
  session: CalendarSession
  onClick: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const colors = getCategoryColor(session.formation_categorie)
  const full = session.places_occupees >= session.places_max

  return (
    <div className="relative">
      {hovered && <SessionTooltip session={session} />}
      <button
        type="button"
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`
          w-full text-left px-1.5 py-0.5 rounded text-[11px] leading-tight truncate
          border transition-all duration-150
          ${colors.bg} ${colors.text} ${colors.border}
          hover:shadow-sm hover:brightness-95
          focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00]
        `}
      >
        <span className="flex items-center gap-1">
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${colors.dot}`} />
          <span className="truncate">{session.formation_nom}</span>
          <span className={`ml-auto shrink-0 text-[10px] ${full ? 'text-rose-600 font-semibold' : 'opacity-60'}`}>
            {session.places_occupees}/{session.places_max}
          </span>
        </span>
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Week view block
// ---------------------------------------------------------------------------

function WeekBlock({
  session,
  onClick,
}: {
  session: CalendarSession
  onClick: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const colors = getCategoryColor(session.formation_categorie)
  const startH = parseHour(session.horaire_debut)
  const endH = parseHour(session.horaire_fin)
  const duration = Math.max(endH - startH, 0.5)
  const top = (startH - 8) * 60 // px offset from 8h
  const height = duration * 60
  const full = session.places_occupees >= session.places_max

  return (
    <div className="relative" style={{ position: 'absolute', top: `${top}px`, height: `${height}px`, left: '2px', right: '2px' }}>
      {hovered && <SessionTooltip session={session} />}
      <button
        type="button"
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`
          w-full h-full rounded-md border px-2 py-1 text-left overflow-hidden
          transition-all duration-150
          ${colors.bg} ${colors.text} ${colors.border}
          hover:shadow-md hover:brightness-95
          focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00]
        `}
      >
        <p className="text-xs font-semibold truncate">{session.formation_nom}</p>
        {height >= 50 && (
          <p className="text-[10px] opacity-70 truncate">
            {session.horaire_debut?.slice(0, 5)}–{session.horaire_fin?.slice(0, 5)}
          </p>
        )}
        {height >= 70 && session.formatrice_nom && (
          <p className="text-[10px] opacity-60 truncate">{session.formatrice_nom}</p>
        )}
        {height >= 90 && (
          <p className={`text-[10px] ${full ? 'text-rose-600 font-semibold' : 'opacity-60'}`}>
            {session.places_occupees}/{session.places_max} inscrits
          </p>
        )}
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function SessionCalendar({ sessions, onSessionClick, initialView = 'month' }: SessionCalendarProps) {
  const [view, setView] = useState<'month' | 'week'>(initialView)
  const [currentDate, setCurrentDate] = useState(() => new Date())

  // ---- Navigation ----
  const navigate = useCallback((dir: -1 | 1) => {
    setCurrentDate(prev => {
      const d = new Date(prev)
      if (view === 'month') {
        d.setMonth(d.getMonth() + dir)
      } else {
        d.setDate(d.getDate() + 7 * dir)
      }
      return d
    })
  }, [view])

  const goToday = useCallback(() => setCurrentDate(new Date()), [])

  // ---- Month view data ----
  const monthGrid = useMemo(
    () => getMonthGrid(currentDate.getFullYear(), currentDate.getMonth()),
    [currentDate],
  )

  // ---- Week view data ----
  const weekDates = useMemo(() => {
    const start = getWeekStart(currentDate)
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start)
      d.setDate(d.getDate() + i)
      return d
    })
  }, [currentDate])

  // ---- Index sessions by date string for fast lookup ----
  const sessionsByDate = useMemo(() => {
    const map = new Map<string, CalendarSession[]>()

    const allDates = view === 'month' ? monthGrid : weekDates
    const minDate = allDates[0]
    const maxDate = allDates[allDates.length - 1]

    for (const session of sessions) {
      const start = new Date(session.date_debut)
      const end = new Date(session.date_fin)

      // Iterate each day the session spans within visible range
      const iterDate = new Date(Math.max(start.getTime(), minDate.getTime()))
      iterDate.setHours(0, 0, 0, 0)
      const boundEnd = new Date(Math.min(end.getTime(), maxDate.getTime()))
      boundEnd.setHours(23, 59, 59, 999)

      while (iterDate <= boundEnd) {
        const key = `${iterDate.getFullYear()}-${iterDate.getMonth()}-${iterDate.getDate()}`
        const arr = map.get(key) || []
        arr.push(session)
        map.set(key, arr)
        iterDate.setDate(iterDate.getDate() + 1)
      }
    }
    return map
  }, [sessions, monthGrid, weekDates, view])

  function getSessionsForDate(date: Date): CalendarSession[] {
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
    return sessionsByDate.get(key) || []
  }

  // ---- Title ----
  const title = view === 'month'
    ? `${MOIS[currentDate.getMonth()]} ${currentDate.getFullYear()}`
    : `${formatDate(weekDates[0])} — ${formatDate(weekDates[6])} ${weekDates[6].getFullYear()}`

  // ---- Legend ----
  const activeCategories = useMemo(() => {
    const cats = new Set(sessions.map(s => s.formation_categorie))
    return CATEGORIES_FORMATION.filter(c => cats.has(c.id))
  }, [sessions])

  return (
    <div className="bg-white rounded-xl border border-[#F4F0EB] overflow-hidden">
      {/* ===== Header ===== */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-[#F4F0EB]">
        {/* Navigation */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-lg hover:bg-[#F4F0EB] transition-colors"
            aria-label="Précédent"
          >
            <ChevronLeft className="w-5 h-5 text-[#777777]" />
          </button>
          <h2 className="text-base font-semibold text-[#111111] min-w-[200px] text-center">{title}</h2>
          <button
            type="button"
            onClick={() => navigate(1)}
            className="p-1.5 rounded-lg hover:bg-[#F4F0EB] transition-colors"
            aria-label="Suivant"
          >
            <ChevronRight className="w-5 h-5 text-[#777777]" />
          </button>
          <button
            type="button"
            onClick={goToday}
            className="ml-1 px-3 py-1 text-xs font-medium rounded-md border border-[#EEEEEE] text-[#777777] hover:bg-[#FAF8F5] transition-colors"
          >
            Aujourd&apos;hui
          </button>
        </div>

        {/* View toggle */}
        <div className="flex rounded-lg border border-[#EEEEEE] overflow-hidden">
          {(['month', 'week'] as const).map(v => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={`
                px-4 py-1.5 text-xs font-medium transition-colors
                ${view === v
                  ? 'bg-[#1A1A1A] text-white'
                  : 'bg-white text-[#777777] hover:bg-[#FAF8F5]'
                }
              `}
            >
              {v === 'month' ? 'Mois' : 'Semaine'}
            </button>
          ))}
        </div>
      </div>

      {/* ===== Month view ===== */}
      {view === 'month' && (
        <div className="overflow-x-auto">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-[#F4F0EB]">
            {JOURS.map(j => (
              <div key={j} className="py-2 text-center text-xs font-medium text-[#777777] uppercase tracking-wider">
                {j}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7">
            {monthGrid.map((date, i) => {
              const inMonth = date.getMonth() === currentDate.getMonth()
              const today = isToday(date)
              const daySessions = getSessionsForDate(date)

              return (
                <div
                  key={i}
                  className={`
                    min-h-[100px] border-b border-r border-[#FAF8F5] p-1
                    ${!inMonth ? 'bg-[#FAF8F5]/50' : ''}
                    ${today ? 'ring-2 ring-inset ring-[#FF5C00]/40 bg-[#FFF0E5]/30' : ''}
                    ${i % 7 === 0 ? 'border-l border-[#FAF8F5]' : ''}
                  `}
                >
                  <div className={`
                    text-xs font-medium mb-1 px-1
                    ${today
                      ? 'text-[#FF5C00] font-bold'
                      : inMonth ? 'text-[#3A3A3A]' : 'text-[#999999]'
                    }
                  `}>
                    {date.getDate()}
                  </div>
                  <div className="space-y-0.5">
                    {daySessions.slice(0, 3).map(s => (
                      <SessionPill
                        key={s.id}
                        session={s}
                        onClick={() => onSessionClick(s.id)}
                      />
                    ))}
                    {daySessions.length > 3 && (
                      <p className="text-[10px] text-[#999999] px-1.5">
                        +{daySessions.length - 3} autre{daySessions.length - 3 > 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ===== Week view ===== */}
      {view === 'week' && (
        <div className="overflow-x-auto">
          {/* Day headers */}
          <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-[#F4F0EB]">
            <div className="py-2" /> {/* gutter */}
            {weekDates.map((date, i) => {
              const today = isToday(date)
              return (
                <div
                  key={i}
                  className={`
                    py-2 text-center border-l border-[#F4F0EB]
                    ${today ? 'bg-[#FFF0E5]/50' : ''}
                  `}
                >
                  <div className="text-xs text-[#777777] uppercase">{JOURS[i]}</div>
                  <div className={`
                    text-sm font-semibold
                    ${today ? 'text-[#FF5C00]' : 'text-[#1A1A1A]'}
                  `}>
                    {date.getDate()}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Time grid */}
          <div className="grid grid-cols-[60px_repeat(7,1fr)]" style={{ height: `${HEURES.length * 60}px` }}>
            {/* Hour labels */}
            <div className="relative border-r border-[#F4F0EB]">
              {HEURES.map(h => (
                <div
                  key={h}
                  className="absolute text-[11px] text-[#999999] text-right pr-2 w-full"
                  style={{ top: `${(h - 8) * 60}px` }}
                >
                  {h}h
                </div>
              ))}
            </div>

            {/* Day columns */}
            {weekDates.map((date, di) => {
              const today = isToday(date)
              const daySessions = getSessionsForDate(date)

              return (
                <div
                  key={di}
                  className={`
                    relative border-l border-[#F4F0EB]
                    ${today ? 'bg-[#FFF0E5]/20' : ''}
                  `}
                >
                  {/* Hour lines */}
                  {HEURES.map(h => (
                    <div
                      key={h}
                      className="absolute w-full border-t border-[#FAF8F5]"
                      style={{ top: `${(h - 8) * 60}px` }}
                    />
                  ))}

                  {/* Session blocks */}
                  {daySessions.map(s => (
                    <WeekBlock
                      key={s.id}
                      session={s}
                      onClick={() => onSessionClick(s.id)}
                    />
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ===== Legend ===== */}
      {activeCategories.length > 0 && (
        <div className="flex flex-wrap gap-3 px-4 py-2.5 border-t border-[#F4F0EB] bg-[#FAF8F5]/50">
          {activeCategories.map(cat => {
            const colors = getCategoryColor(cat.id)
            return (
              <div key={cat.id} className="flex items-center gap-1.5 text-xs text-[#777777]">
                <span className={`w-2.5 h-2.5 rounded-full ${colors.dot}`} />
                {cat.label}
              </div>
            )
          })}
        </div>
      )}

      {/* Empty state */}
      {sessions.length === 0 && (
        <div className="py-16 text-center text-[#999999]">
          <Calendar className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Aucune session à afficher</p>
        </div>
      )}
    </div>
  )
}
