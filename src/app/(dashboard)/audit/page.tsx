'use client'

// ============================================================
// CRM DERMOTEC — Audit Page
// Timeline complète de TOUS les mouvements utilisateurs
// Vue admin : qui fait quoi, quand, où
// ============================================================

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase-client'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { DatePicker } from '@/components/ui/DatePicker'
import { usePageTracker } from '@/hooks/use-tracker'
import {
  Eye, Download, Search, Filter, Clock, Users, MousePointer,
  Activity, FileText, BarChart3, RefreshCw, Calendar,
  ChevronDown, ExternalLink, User, MapPin, Smartphone
} from 'lucide-react'
import { format, formatDistanceToNow, isToday, startOfDay, endOfDay } from 'date-fns'
import { fr } from 'date-fns/locale'

interface UserEvent {
  id: string
  user_id: string
  event: string
  page: string
  target: string | null
  duration_ms: number | null
  metadata: Record<string, any>
  ip_address: string
  user_agent: string
  created_at: string
  user_name?: string
  user_email?: string
}

interface ActivityStats {
  total_today: number
  unique_users_today: number
  most_visited_page: string
  avg_session_time_ms: number
}

const EVENT_TYPES = [
  'page_view', 'page_leave', 'lead_viewed', 'lead_edited', 'lead_created',
  'lead_deleted', 'lead_status_changed', 'session_viewed', 'session_created',
  'inscription_created', 'document_uploaded', 'document_downloaded',
  'export_csv', 'export_pdf', 'email_sent', 'call_logged', 'note_added',
  'search_performed', 'filter_applied', 'pipeline_drag', 'reminder_created',
  'financement_updated', 'login', 'logout', 'settings_changed', 'ai_used', 'click'
]

const EVENT_COLORS: Record<string, string> = {
  'lead_created': 'bg-[#10B981]',
  'lead_edited': 'bg-[#6B8CAE]',
  'lead_deleted': 'bg-[#FF2D78]',
  'lead_viewed': 'bg-[#FF2D78]',
  'page_view': 'bg-[#999999]',
  'login': 'bg-[#10B981]',
  'logout': 'bg-red-400',
  'export_csv': 'bg-orange-500',
  'export_pdf': 'bg-orange-600',
  'document_uploaded': 'bg-indigo-500',
  'ai_used': 'bg-pink-500',
  'click': 'bg-[#EEEEEE]',
  'default': 'bg-slate-400'
}

function getEventColor(eventType: string): string {
  return EVENT_COLORS[eventType] || EVENT_COLORS.default
}

function formatDuration(ms: number | null): string {
  if (!ms) return '-'
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${(ms / 60000).toFixed(1)}min`
}

function formatEventDescription(event: UserEvent): string {
  const { event: type, target, metadata } = event

  switch (type) {
    case 'lead_viewed':
      return `A consulté le lead ${metadata.lead_id || target}`
    case 'lead_edited':
      return `A modifié ${metadata.field || 'un champ'} sur le lead ${metadata.lead_id || target}`
    case 'lead_status_changed':
      return `Statut changé : ${metadata.old_status} → ${metadata.new_status}`
    case 'page_view':
      return `A visité ${event.page}`
    case 'export_csv':
      return `Export CSV : ${metadata.entity || 'données'} (${metadata.record_count || '?'} lignes)`
    case 'search_performed':
      return `Recherche : "${metadata.query}" (${metadata.result_count || 0} résultats)`
    case 'document_uploaded':
      return `Upload : ${metadata.file_name || metadata.document_type || target}`
    case 'ai_used':
      return `IA utilisée : ${metadata.feature || target}`
    case 'click':
      return `Clic sur ${target || 'élément'}`
    default:
      return `${type} ${target ? `sur ${target}` : ''}`
  }
}

export default function AuditPage() {
  usePageTracker()

  const [events, setEvents] = useState<UserEvent[]>([])
  const [stats, setStats] = useState<ActivityStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  // Filtres
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUser, setSelectedUser] = useState<string>('')
  const [selectedEvent, setSelectedEvent] = useState<string>('')
  const [dateFrom, setDateFrom] = useState<Date>(startOfDay(new Date()))
  const [dateTo, setDateTo] = useState<Date>(endOfDay(new Date()))

  // Users disponibles
  const [users, setUsers] = useState<Array<{ id: string; email: string; full_name?: string }>>([])

  const ITEMS_PER_PAGE = 50

  // Charger les utilisateurs
  useEffect(() => {
    async function loadUsers() {
      const supabase = createClient()
      const { data } = await supabase
        .from('profiles')
        .select('id, email, prenom, nom')
        .order('email')

      if (data) {
        setUsers(data.map(u => ({
          id: u.id,
          email: u.email,
          full_name: `${u.prenom || ''} ${u.nom || ''}`.trim()
        })))
      }
    }
    loadUsers()
  }, [])

  // Charger les statistiques
  const loadStats = async () => {
    try {
      const supabase = createClient()
      const today = new Date()
      const startOfToday = startOfDay(today).toISOString()
      const endOfToday = endOfDay(today).toISOString()

      // Stats du jour
      const { data: todayEvents } = await supabase
        .from('user_events')
        .select('user_id, page, duration_ms')
        .gte('created_at', startOfToday)
        .lte('created_at', endOfToday)

      if (todayEvents) {
        const uniqueUsers = new Set(todayEvents.map(e => e.user_id)).size
        const pageVisits = todayEvents.reduce((acc: Record<string, number>, e) => {
          acc[e.page] = (acc[e.page] || 0) + 1
          return acc
        }, {})
        const mostVisited = Object.entries(pageVisits).sort(([,a], [,b]) => b - a)[0]?.[0] || '/'

        const durations = todayEvents.filter(e => e.duration_ms).map(e => e.duration_ms!)
        const avgDuration = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0

        setStats({
          total_today: todayEvents.length,
          unique_users_today: uniqueUsers,
          most_visited_page: mostVisited,
          avg_session_time_ms: avgDuration
        })
      }
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  // Charger les événements avec filtres
  const loadEvents = async (pageNum: number = 1, append: boolean = false) => {
    try {
      setLoading(true)
      const supabase = createClient()

      let query = supabase
        .from('user_events')
        .select(`
          id, user_id, event, page, target, duration_ms, metadata,
          ip_address, user_agent, created_at,
          profiles!user_id (email, prenom, nom)
        `)
        .gte('created_at', dateFrom.toISOString())
        .lte('created_at', dateTo.toISOString())
        .order('created_at', { ascending: false })
        .range((pageNum - 1) * ITEMS_PER_PAGE, pageNum * ITEMS_PER_PAGE - 1)

      // Appliquer les filtres
      if (selectedUser) {
        query = query.eq('user_id', selectedUser)
      }
      if (selectedEvent) {
        query = query.eq('event', selectedEvent)
      }
      if (searchQuery) {
        query = query.or(`page.ilike.%${searchQuery}%,target.ilike.%${searchQuery}%,event.ilike.%${searchQuery}%`)
      }

      const { data, error } = await query

      if (error) throw error

      const enrichedEvents = (data || []).map((event: any) => ({
        ...event,
        user_name: event.profiles ? `${event.profiles.prenom || ''} ${event.profiles.nom || ''}`.trim() : null,
        user_email: event.profiles?.email
      }))

      if (append) {
        setEvents(prev => [...prev, ...enrichedEvents])
      } else {
        setEvents(enrichedEvents)
      }

      setHasMore(enrichedEvents.length === ITEMS_PER_PAGE)
    } catch (error) {
      console.error('Failed to load events:', error)
    } finally {
      setLoading(false)
    }
  }

  // Charger au montage et changement de filtres
  useEffect(() => {
    loadStats()
    loadEvents(1, false)
    setPage(1)
  }, [dateFrom, dateTo, selectedUser, selectedEvent, searchQuery])

  // Export CSV
  const exportCSV = async () => {
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from('user_events')
        .select(`
          created_at, user_id, event, page, target, duration_ms,
          ip_address, profiles!user_id (email, prenom, nom)
        `)
        .gte('created_at', dateFrom.toISOString())
        .lte('created_at', dateTo.toISOString())
        .order('created_at', { ascending: false })

      if (!data) return

      const csv = [
        'Timestamp,User,Event,Page,Target,Duration,IP',
        ...data.map(e => [
          e.created_at,
          e.profiles ? `${e.profiles.prenom} ${e.profiles.nom} (${e.profiles.email})` : e.user_id,
          e.event,
          e.page,
          e.target || '',
          formatDuration(e.duration_ms),
          e.ip_address
        ].join(','))
      ].join('\n')

      const blob = new Blob([csv], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `audit-${format(new Date(), 'yyyy-MM-dd')}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  const filteredEvents = useMemo(() => events, [events])

  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 rounded-lg">
            <Eye className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Audit Système</h1>
            <p className="text-slate-600">Timeline complète des actions utilisateurs</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-[#FFE0EF] text-[#FF2D78] border-[#FF2D78]/30">
            ADMIN ONLY
          </Badge>
          <Button onClick={exportCSV} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={() => window.location.reload()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* KPIs */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Activity className="h-8 w-8 text-[#6B8CAE]" />
              <div>
                <p className="text-sm text-slate-600">Actions aujourd'hui</p>
                <p className="text-2xl font-bold text-slate-900">{stats.total_today.toLocaleString()}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-[#10B981]" />
              <div>
                <p className="text-sm text-slate-600">Utilisateurs actifs</p>
                <p className="text-2xl font-bold text-slate-900">{stats.unique_users_today}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-[#FF2D78]" />
              <div>
                <p className="text-sm text-slate-600">Page la plus visitée</p>
                <p className="text-sm font-medium text-slate-900">{stats.most_visited_page}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm text-slate-600">Temps moyen/page</p>
                <p className="text-2xl font-bold text-slate-900">{formatDuration(stats.avg_session_time_ms)}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Filtres */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Recherche
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Page, cible, événement..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Utilisateur
            </label>
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <option value="">Tous</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.full_name || user.email}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Type d'événement
            </label>
            <Select value={selectedEvent} onValueChange={setSelectedEvent}>
              <option value="">Tous</option>
              {EVENT_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Du
            </label>
            <DatePicker
              selected={dateFrom}
              onChange={(date) => date && setDateFrom(startOfDay(date))}
              dateFormat="dd/MM/yyyy"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Au
            </label>
            <DatePicker
              selected={dateTo}
              onChange={(date) => date && setDateTo(endOfDay(date))}
              dateFormat="dd/MM/yyyy"
            />
          </div>
        </div>
      </Card>

      {/* Timeline des événements */}
      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
          <h3 className="font-semibold text-slate-900">Timeline des Activités</h3>
          <p className="text-sm text-slate-600">{filteredEvents.length} événements</p>
        </div>

        {loading && page === 1 ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredEvents.map((event) => (
              <div key={event.id} className="p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className={`w-3 h-3 rounded-full mt-2 ${getEventColor(event.event)}`} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {event.event}
                        </Badge>
                        {event.user_name && (
                          <span className="text-sm font-medium text-slate-900">
                            {event.user_name}
                          </span>
                        )}
                        {event.user_email && (
                          <span className="text-xs text-slate-500">
                            ({event.user_email})
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        {event.duration_ms && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDuration(event.duration_ms)}
                          </span>
                        )}
                        <span title={event.created_at}>
                          {isToday(new Date(event.created_at))
                            ? format(new Date(event.created_at), 'HH:mm:ss')
                            : format(new Date(event.created_at), 'dd/MM HH:mm')
                          }
                        </span>
                      </div>
                    </div>

                    <p className="text-sm text-slate-700 mb-2">
                      {formatEventDescription(event)}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <ExternalLink className="h-3 w-3" />
                        {event.page}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {event.ip_address}
                      </span>
                      {event.user_agent && (
                        <span className="flex items-center gap-1 truncate max-w-xs">
                          <Smartphone className="h-3 w-3" />
                          {event.user_agent.split(' ')[0]}
                        </span>
                      )}
                    </div>

                    {/* Métadonnées détaillées */}
                    {Object.keys(event.metadata).length > 0 && (
                      <details className="mt-2">
                        <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-600">
                          Détails techniques
                        </summary>
                        <pre className="mt-1 text-xs text-slate-600 bg-slate-50 p-2 rounded overflow-auto">
                          {JSON.stringify(event.metadata, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Load More */}
            {hasMore && (
              <div className="p-4 text-center">
                <Button
                  variant="outline"
                  onClick={() => {
                    const nextPage = page + 1
                    setPage(nextPage)
                    loadEvents(nextPage, true)
                  }}
                  disabled={loading}
                >
                  {loading ? 'Chargement...' : 'Charger plus'}
                </Button>
              </div>
            )}

            {filteredEvents.length === 0 && !loading && (
              <div className="p-8 text-center text-slate-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                <p>Aucun événement trouvé pour ces filtres</p>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}