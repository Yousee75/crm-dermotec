'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useMFA } from '@/hooks/use-mfa'
import { createClient } from '@/lib/supabase-client'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { PageHeader } from '@/components/ui/PageHeader'
import {
  Shield, Smartphone, Key, Lock, CheckCircle, AlertTriangle,
  QrCode, Copy, Plus, Trash2, RotateCcw, Users,
  ShieldAlert, ShieldBan, ShieldCheck, Monitor, Activity,
  Eye, Ban, RefreshCw, Fingerprint, Globe, Zap
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// ============================================================
// Types pour le dashboard sécurité
// ============================================================

interface SecurityStats {
  total_events: number
  critical_events: number
  high_events: number
  medium_events: number
  unique_ips: number
  unique_devices: number
  unique_users: number
  blocked_requests: number
  impossible_travel_events: number
  new_device_events: number
  bot_detected_events: number
}

interface SecurityAlert {
  id: string
  user_id: string
  risk_level: 'medium' | 'high' | 'critical'
  risk_score: number
  flags: string[]
  action_taken: string
  details: string | null
  device_fingerprint: string | null
  ip_address: string | null
  geo_city: string | null
  geo_country: string | null
  resolved: boolean
  resolved_at: string | null
  resolved_by: string | null
  resolution_notes: string | null
  created_at: string
}

interface KnownDevice {
  id: string
  user_id: string
  fingerprint: string
  name: string | null
  user_agent: string | null
  platform: string | null
  ip_addresses: string[]
  first_seen: string
  last_seen: string
  login_count: number
  trusted: boolean
  blocked: boolean
  blocked_reason: string | null
}

interface SecurityEvent {
  id: string
  user_id: string
  action: string
  device_fingerprint: string | null
  ip_address: string | null
  geo_city: string | null
  geo_country: string | null
  risk_score: number
  risk_level: string | null
  risk_flags: string[]
  risk_action: string | null
  created_at: string
}

// ============================================================
// Hooks sécurité
// ============================================================

function useSecurityStats() {
  const supabase = createClient()
  return useQuery<SecurityStats>({
    queryKey: ['security-stats-7d'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_security_stats_7d')
        .select('*')
        .single()
      if (error) throw error
      return data as SecurityStats
    },
    staleTime: 60_000,
  })
}

function useSecurityAlerts() {
  const supabase = createClient()
  return useQuery<SecurityAlert[]>({
    queryKey: ['security-alerts-pending'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('security_alerts')
        .select('*')
        .eq('resolved', false)
        .order('created_at', { ascending: false })
        .limit(20)
      if (error) throw error
      return (data ?? []) as SecurityAlert[]
    },
    staleTime: 30_000,
  })
}

function useKnownDevices() {
  const supabase = createClient()
  return useQuery<KnownDevice[]>({
    queryKey: ['known-devices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('known_devices')
        .select('*')
        .order('last_seen', { ascending: false })
        .limit(30)
      if (error) throw error
      return (data ?? []) as KnownDevice[]
    },
    staleTime: 60_000,
  })
}

function useRecentRiskEvents() {
  const supabase = createClient()
  return useQuery<SecurityEvent[]>({
    queryKey: ['security-events-risk'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('security_events')
        .select('*')
        .gte('risk_score', 30)
        .order('created_at', { ascending: false })
        .limit(30)
      if (error) throw error
      return (data ?? []) as SecurityEvent[]
    },
    staleTime: 30_000,
  })
}

// ============================================================
// Composants du dashboard sécurité
// ============================================================

function SecurityStatsCards() {
  const { data: stats, isLoading, error } = useSecurityStats()

  if (error) return null

  const kpis = [
    {
      label: 'Evenements 7j',
      value: stats?.total_events ?? 0,
      icon: <Activity className="w-5 h-5" />,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Bloqués',
      value: stats?.blocked_requests ?? 0,
      icon: <ShieldBan className="w-5 h-5" />,
      color: 'bg-red-50 text-red-600',
    },
    {
      label: 'Injection IA',
      value: stats?.bot_detected_events ?? 0,
      icon: <Zap className="w-5 h-5" />,
      color: 'bg-amber-50 text-amber-600',
    },
    {
      label: 'Appareils non validés',
      value: stats?.new_device_events ?? 0,
      icon: <Monitor className="w-5 h-5" />,
      color: 'bg-purple-50 text-purple-600',
    },
  ]

  return (
    <Card padding="none">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
            <ShieldAlert className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Statistiques sécurité — 7 derniers jours
            </h3>
            <p className="text-sm text-gray-600">
              Vue d'ensemble des événements de sécurité
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {kpis.map((kpi) => (
            <div
              key={kpi.label}
              className="border border-gray-100 rounded-xl p-4 flex flex-col gap-3"
            >
              <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', kpi.color)}>
                {kpi.icon}
              </div>
              <div>
                {isLoading ? (
                  <div className="h-8 w-16 bg-gray-100 rounded animate-pulse" />
                ) : (
                  <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">{kpi.label}</p>
              </div>
            </div>
          ))}
        </div>

        {stats && (stats.critical_events > 0 || stats.high_events > 0 || stats.impossible_travel_events > 0) && (
          <div className="mt-4 flex flex-wrap gap-2">
            {stats.critical_events > 0 && (
              <Badge variant="error" size="sm" dot pulse>
                {stats.critical_events} critique{stats.critical_events > 1 ? 's' : ''}
              </Badge>
            )}
            {stats.high_events > 0 && (
              <Badge variant="warning" size="sm" dot>
                {stats.high_events} élevé{stats.high_events > 1 ? 's' : ''}
              </Badge>
            )}
            {stats.impossible_travel_events > 0 && (
              <Badge variant="info" size="sm" dot>
                {stats.impossible_travel_events} impossible travel
              </Badge>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}

function riskBadge(level: string) {
  switch (level) {
    case 'critical':
      return <Badge variant="error" size="sm" dot pulse>Critique</Badge>
    case 'high':
      return <Badge variant="warning" size="sm" dot>Élevé</Badge>
    case 'medium':
      return <Badge variant="info" size="sm" dot>Moyen</Badge>
    default:
      return <Badge variant="default" size="sm">{level}</Badge>
  }
}

function formatDateFR(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function truncate(str: string | null, len = 12) {
  if (!str) return '—'
  return str.length > len ? str.slice(0, len) + '...' : str
}

function PendingAlertsTable() {
  const { data: alerts, isLoading, error } = useSecurityAlerts()
  const queryClient = useQueryClient()
  const supabase = createClient()

  const resolveMutation = useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from('security_alerts')
        .update({
          resolved: true,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', alertId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security-alerts-pending'] })
      queryClient.invalidateQueries({ queryKey: ['security-stats-7d'] })
      toast.success('Alerte résolue')
    },
    onError: () => {
      toast.error('Erreur lors de la résolution')
    },
  })

  if (error) return null

  return (
    <Card padding="none">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Alertes non résolues
            </h3>
            <p className="text-sm text-gray-600">
              Événements suspects nécessitant une action
            </p>
          </div>
          {alerts && alerts.length > 0 && (
            <Badge variant="error" size="sm" className="ml-auto">{alerts.length}</Badge>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-gray-50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : !alerts || alerts.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <ShieldCheck className="w-10 h-10 mx-auto mb-2 text-green-400" />
            <p className="text-sm font-medium text-green-600">Aucune alerte en attente</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-6 py-2 text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 uppercase">Niveau</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 uppercase">Flags</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 uppercase">Action</th>
                  <th className="text-right px-6 py-2 text-xs font-medium text-gray-500 uppercase"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {alerts.map((alert) => (
                  <tr key={alert.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-3 text-gray-600 whitespace-nowrap">
                      {formatDateFR(alert.created_at)}
                    </td>
                    <td className="px-3 py-3 text-gray-700 font-mono text-xs">
                      {truncate(alert.user_id, 8)}
                    </td>
                    <td className="px-3 py-3">{riskBadge(alert.risk_level)}</td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(alert.flags ?? []).slice(0, 3).map((flag) => (
                          <Badge key={flag} variant="outline" size="xs">{flag}</Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-gray-600 text-xs">{alert.action_taken}</td>
                    <td className="px-6 py-3 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => resolveMutation.mutate(alert.id)}
                        disabled={resolveMutation.isPending}
                      >
                        <CheckCircle className="w-3.5 h-3.5 mr-1" />
                        Résoudre
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Card>
  )
}

function KnownDevicesTable() {
  const { data: devices, isLoading, error } = useKnownDevices()
  const queryClient = useQueryClient()
  const supabase = createClient()

  const trustMutation = useMutation({
    mutationFn: async ({ deviceId, trust }: { deviceId: string; trust: boolean }) => {
      const updates: Record<string, any> = trust
        ? { trusted: true, trusted_at: new Date().toISOString(), blocked: false, blocked_reason: null }
        : { blocked: true, blocked_reason: 'Bloqué manuellement par admin', trusted: false }
      const { error } = await supabase
        .from('known_devices')
        .update(updates)
        .eq('id', deviceId)
      if (error) throw error
    },
    onSuccess: (_, { trust }) => {
      queryClient.invalidateQueries({ queryKey: ['known-devices'] })
      toast.success(trust ? 'Appareil validé' : 'Appareil bloqué')
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour')
    },
  })

  if (error) return null

  function deviceStatus(d: KnownDevice) {
    if (d.blocked) return <Badge variant="error" size="sm" dot>Bloqué</Badge>
    if (d.trusted) return <Badge variant="success" size="sm" dot>Validé</Badge>
    return <Badge variant="warning" size="sm" dot>En attente</Badge>
  }

  return (
    <Card padding="none">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
            <Fingerprint className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Appareils connus
            </h3>
            <p className="text-sm text-gray-600">
              Fingerprints des appareils détectés
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-gray-50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : !devices || devices.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Monitor className="w-10 h-10 mx-auto mb-2" />
            <p className="text-sm">Aucun appareil enregistré</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-6 py-2 text-xs font-medium text-gray-500 uppercase">Fingerprint</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 uppercase">Dernière connexion</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 uppercase">IPs</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 uppercase">Statut</th>
                  <th className="text-right px-6 py-2 text-xs font-medium text-gray-500 uppercase"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {devices.map((device) => (
                  <tr key={device.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-3">
                      <code className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-700">
                        {truncate(device.fingerprint, 16)}
                      </code>
                    </td>
                    <td className="px-3 py-3 text-gray-700 font-mono text-xs">
                      {truncate(device.user_id, 8)}
                    </td>
                    <td className="px-3 py-3 text-gray-600 whitespace-nowrap text-xs">
                      {formatDateFR(device.last_seen)}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(device.ip_addresses ?? []).slice(0, 2).map((ip) => (
                          <span key={ip} className="text-xs text-gray-500 font-mono">{ip}</span>
                        ))}
                        {(device.ip_addresses ?? []).length > 2 && (
                          <Badge variant="outline" size="xs">+{device.ip_addresses.length - 2}</Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3">{deviceStatus(device)}</td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex gap-1 justify-end">
                        {!device.trusted && !device.blocked && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => trustMutation.mutate({ deviceId: device.id, trust: true })}
                              disabled={trustMutation.isPending}
                            >
                              <ShieldCheck className="w-3.5 h-3.5 mr-1 text-green-600" />
                              Valider
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => trustMutation.mutate({ deviceId: device.id, trust: false })}
                              disabled={trustMutation.isPending}
                              className="text-red-600 hover:bg-red-50"
                            >
                              <Ban className="w-3.5 h-3.5 mr-1" />
                              Bloquer
                            </Button>
                          </>
                        )}
                        {device.trusted && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => trustMutation.mutate({ deviceId: device.id, trust: false })}
                            disabled={trustMutation.isPending}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Ban className="w-3.5 h-3.5 mr-1" />
                            Bloquer
                          </Button>
                        )}
                        {device.blocked && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => trustMutation.mutate({ deviceId: device.id, trust: true })}
                            disabled={trustMutation.isPending}
                          >
                            <ShieldCheck className="w-3.5 h-3.5 mr-1 text-green-600" />
                            Valider
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Card>
  )
}

function RecentRiskEventsTable() {
  const { data: events, isLoading, error } = useRecentRiskEvents()

  if (error) return null

  const actionLabels: Record<string, string> = {
    login: 'Connexion',
    logout: 'Déconnexion',
    api_call: 'Appel API',
    enrichment: 'Enrichissement',
    export: 'Export',
    admin_action: 'Action admin',
    password_change: 'Changement MDP',
    mfa_challenge: 'Challenge MFA',
    device_trust: 'Trust appareil',
  }

  function riskScoreColor(score: number) {
    if (score >= 80) return 'text-red-600 bg-red-50'
    if (score >= 50) return 'text-amber-600 bg-amber-50'
    return 'text-blue-600 bg-blue-50'
  }

  return (
    <Card padding="none">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-rose-50 rounded-lg flex items-center justify-center">
            <Eye className="w-5 h-5 text-rose-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Derniers événements à risque
            </h3>
            <p className="text-sm text-gray-600">
              Événements avec score de risque &ge; 30
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-gray-50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : !events || events.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <ShieldCheck className="w-10 h-10 mx-auto mb-2 text-green-400" />
            <p className="text-sm font-medium text-green-600">Aucun événement à risque récent</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-6 py-2 text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 uppercase">Action</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 uppercase">IP</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 uppercase">Score</th>
                  <th className="text-left px-6 py-2 text-xs font-medium text-gray-500 uppercase">Flags</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {events.map((event) => (
                  <tr key={event.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-3 text-gray-600 whitespace-nowrap text-xs">
                      {formatDateFR(event.created_at)}
                    </td>
                    <td className="px-3 py-3 text-gray-700 font-mono text-xs">
                      {truncate(event.user_id, 8)}
                    </td>
                    <td className="px-3 py-3 text-gray-700 text-xs">
                      {actionLabels[event.action] ?? event.action}
                    </td>
                    <td className="px-3 py-3 font-mono text-xs text-gray-500">
                      {event.ip_address ?? '—'}
                    </td>
                    <td className="px-3 py-3">
                      <span className={cn(
                        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold',
                        riskScoreColor(event.risk_score)
                      )}>
                        {event.risk_score}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(event.risk_flags ?? []).slice(0, 3).map((flag) => (
                          <Badge key={flag} variant="outline" size="xs">{flag}</Badge>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Card>
  )
}

interface Factor {
  id: string
  factor_type: 'totp' | 'phone'
  status: 'verified' | 'unverified'
  friendly_name?: string
  phone?: string
  created_at: string
  updated_at: string
}

interface EnrollmentData {
  id: string
  type: 'totp' | 'phone'
  totp?: {
    qr_code: string
    secret: string
    uri: string
  }
  phone?: string
}

export default function SecuritySettingsPage() {
  const [activeMethod, setActiveMethod] = useState<string | null>(null)
  const [factors, setFactors] = useState<{ totp: Factor[], phone: Factor[] }>({ totp: [], phone: [] })
  const [loading, setLoading] = useState(true)
  const [enrollmentData, setEnrollmentData] = useState<EnrollmentData | null>(null)
  const [verificationCode, setVerificationCode] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [challengeId, setChallengeId] = useState('')
  const [verifying, setVerifying] = useState(false)

  const {
    listFactors, enrollTOTP, enrollPhone, challenge, verify, unenroll,
    getAssuranceLevel
  } = useMFA()

  // Charger les facteurs
  const loadFactors = async () => {
    try {
      setLoading(true)
      const result = await listFactors()
      if (result) {
        setFactors(result)
      }
    } catch (error: any) {
      toast.error('Erreur lors du chargement des méthodes de sécurité')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFactors()
  }, [])

  // Générer un SVG QR code simple (fallback)
  const generateQRCodeSVG = (data: string): string => {
    // Cette fonction génère un placeholder SVG
    // En production, utilisez une vraie librairie QR code
    return `data:image/svg+xml;base64,${btoa(`
      <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="200" fill="white" stroke="#ddd"/>
        <text x="100" y="100" text-anchor="middle" fill="#666" font-size="12">
          QR Code
        </text>
        <text x="100" y="120" text-anchor="middle" fill="#666" font-size="10">
          ${data.substring(0, 20)}...
        </text>
      </svg>
    `)}`
  }

  // Activer TOTP
  const handleEnrollTOTP = async () => {
    try {
      setVerifying(true)
      const result = await enrollTOTP()

      if (result.error) {
        throw new Error(result.error.message)
      }

      setEnrollmentData({
        id: result.data!.id,
        type: 'totp',
        totp: {
          qr_code: result.data!.totp?.qr_code || generateQRCodeSVG(result.data!.totp?.uri || ''),
          secret: result.data!.totp?.secret || '',
          uri: result.data!.totp?.uri || ''
        }
      })
      setActiveMethod('totp-verify')
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de l\'activation TOTP')
    } finally {
      setVerifying(false)
    }
  }

  // Activer Phone (SMS)
  const handleEnrollPhone = async (channel: 'sms' | 'whatsapp' = 'sms') => {
    if (!phoneNumber.trim()) {
      toast.error('Veuillez saisir un numéro de téléphone')
      return
    }

    // Validation basique du format français
    const phoneRegex = /^(\+33|0)[1-9]\d{8}$/
    if (!phoneRegex.test(phoneNumber.replace(/\s/g, ''))) {
      toast.error('Format de téléphone invalide (ex: +33 6 12 34 56 78)')
      return
    }

    try {
      setVerifying(true)
      const result = await enrollPhone(phoneNumber.replace(/\s/g, ''), channel)

      if (result.error) {
        throw new Error(result.error.message)
      }

      // Créer un challenge pour envoyer le code
      const challengeResult = await challenge(result.data!.id, channel)
      if (challengeResult.error) {
        throw new Error(challengeResult.error.message)
      }

      setEnrollmentData({
        id: result.data!.id,
        type: 'phone',
        phone: phoneNumber
      })
      setChallengeId(challengeResult.data!.id)
      setActiveMethod(`phone-verify-${channel}`)
      toast.success(`Code ${channel === 'sms' ? 'SMS' : 'WhatsApp'} envoyé`)
    } catch (error: any) {
      toast.error(error.message || `Erreur lors de l'activation ${channel}`)
    } finally {
      setVerifying(false)
    }
  }

  // Vérifier le code d'activation
  const handleVerifyEnrollment = async () => {
    if (!verificationCode.trim()) {
      toast.error('Veuillez saisir le code de vérification')
      return
    }

    if (!enrollmentData) return

    try {
      setVerifying(true)

      let challengeIdToUse = challengeId

      // Pour TOTP, créer un challenge à la volée
      if (enrollmentData.type === 'totp') {
        const challengeResult = await challenge(enrollmentData.id)
        if (challengeResult.error) {
          throw new Error(challengeResult.error.message)
        }
        challengeIdToUse = challengeResult.data!.id
      }

      const result = await verify(enrollmentData.id, challengeIdToUse, verificationCode)

      if (result.error) {
        throw new Error(result.error.message)
      }

      toast.success('Méthode d\'authentification activée avec succès')
      setActiveMethod(null)
      setEnrollmentData(null)
      setVerificationCode('')
      setPhoneNumber('')
      setChallengeId('')
      await loadFactors()
    } catch (error: any) {
      toast.error(error.message === 'Invalid code'
        ? 'Code incorrect. Veuillez réessayer.'
        : error.message || 'Erreur lors de la vérification'
      )
    } finally {
      setVerifying(false)
    }
  }

  // Supprimer un facteur
  const handleUnenroll = async (factorId: string, type: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer cette méthode ${type} ?`)) {
      return
    }

    try {
      const result = await unenroll(factorId)
      if (result.error) {
        throw new Error(result.error.message)
      }

      toast.success('Méthode d\'authentification supprimée')
      await loadFactors()
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la suppression')
    }
  }

  // Copier dans le presse-papiers
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copié dans le presse-papiers')
  }

  // Annuler l'activation
  const cancelEnrollment = () => {
    setActiveMethod(null)
    setEnrollmentData(null)
    setVerificationCode('')
    setPhoneNumber('')
    setChallengeId('')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sécurité"
        description="Gérez vos méthodes d'authentification à deux facteurs"
      />

      {/* Section 2FA */}
      <Card>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Authentification à deux facteurs (2FA)
              </h3>
              <p className="text-sm text-gray-600">
                Sécurisez votre compte avec une couche de protection supplémentaire
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* TOTP Method */}
            <div className="border border-gray-200 rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center mt-1">
                    <Key className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900">App Authenticator (TOTP)</h4>
                      <Badge variant="success" size="sm">Recommandé</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      Google Authenticator, Authy, 1Password, etc. — Gratuit et hors-ligne
                    </p>
                    {factors.totp.length > 0 && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-green-600 font-medium">Activé</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  {factors.totp.length > 0 ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUnenroll(factors.totp[0].id, 'TOTP')}
                    >
                      <Trash2 className="w-4 h-4" />
                      Désactiver
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleEnrollTOTP}
                      loading={verifying && !activeMethod}
                      disabled={!!activeMethod}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Activer
                    </Button>
                  )}
                </div>
              </div>

              {/* Activation TOTP */}
              {activeMethod === 'totp-verify' && enrollmentData?.type === 'totp' && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h5 className="font-medium text-gray-900 mb-3">1. Scannez le QR Code</h5>
                      <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                        <img
                          src={enrollmentData.totp?.qr_code}
                          alt="QR Code"
                          className="w-40 h-40 mx-auto"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Utilisez votre app d'authentification pour scanner ce code
                      </p>
                    </div>

                    <div>
                      <h5 className="font-medium text-gray-900 mb-3">2. Code de secours (optionnel)</h5>
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
                        <div className="flex items-center justify-between">
                          <code className="text-sm font-mono text-gray-800 break-all">
                            {enrollmentData.totp?.secret}
                          </code>
                          <button
                            onClick={() => copyToClipboard(enrollmentData.totp?.secret || '')}
                            className="ml-2 p-1 hover:bg-gray-200 rounded text-gray-500 hover:text-gray-700 transition"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <h5 className="font-medium text-gray-900 mb-3">3. Vérification</h5>
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="Code à 6 chiffres"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-primary focus:ring-0"
                          maxLength={6}
                        />
                        <div className="flex gap-2">
                          <Button
                            onClick={handleVerifyEnrollment}
                            loading={verifying}
                            disabled={verificationCode.length !== 6 || verifying}
                            size="sm"
                          >
                            Vérifier et activer
                          </Button>
                          <Button
                            variant="outline"
                            onClick={cancelEnrollment}
                            disabled={verifying}
                            size="sm"
                          >
                            Annuler
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* SMS Method */}
            <div className="border border-gray-200 rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mt-1">
                    <Smartphone className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-1">SMS</h4>
                    <p className="text-sm text-gray-600 mb-2">
                      Recevoir un code par SMS — Nécessite Twilio configuré
                    </p>
                    {factors.phone.length > 0 && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-green-600 font-medium">
                          Activé ({factors.phone[0].phone})
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  {factors.phone.length > 0 ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUnenroll(factors.phone[0].id, 'SMS')}
                    >
                      <Trash2 className="w-4 h-4" />
                      Désactiver
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setActiveMethod('phone-enroll-sms')}
                      disabled={!!activeMethod}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Activer
                    </Button>
                  )}
                </div>
              </div>

              {/* Activation SMS */}
              {activeMethod === 'phone-enroll-sms' && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="max-w-md">
                    <h5 className="font-medium text-gray-900 mb-3">Configuration SMS</h5>
                    <div className="space-y-3">
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="+33 6 12 34 56 78"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-primary focus:ring-0"
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleEnrollPhone('sms')}
                          loading={verifying}
                          disabled={!phoneNumber.trim() || verifying}
                          size="sm"
                        >
                          Envoyer code SMS
                        </Button>
                        <Button
                          variant="outline"
                          onClick={cancelEnrollment}
                          disabled={verifying}
                          size="sm"
                        >
                          Annuler
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Vérification SMS */}
              {activeMethod === 'phone-verify-sms' && enrollmentData?.type === 'phone' && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="max-w-md">
                    <h5 className="font-medium text-gray-900 mb-3">
                      Code envoyé au {enrollmentData.phone}
                    </h5>
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="Code à 6 chiffres"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-primary focus:ring-0"
                        maxLength={6}
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={handleVerifyEnrollment}
                          loading={verifying}
                          disabled={verificationCode.length !== 6 || verifying}
                          size="sm"
                        >
                          Vérifier et activer
                        </Button>
                        <Button
                          variant="outline"
                          onClick={cancelEnrollment}
                          disabled={verifying}
                          size="sm"
                        >
                          Annuler
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* WhatsApp Method */}
            <div className="border border-gray-200 rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center mt-1">
                    <Smartphone className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-1">WhatsApp</h4>
                    <p className="text-sm text-gray-600 mb-1">
                      Recevoir un code par WhatsApp — Nécessite Twilio WhatsApp Business
                    </p>
                    <p className="text-xs text-amber-600">
                      Nécessite un numéro WhatsApp Business configuré
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setActiveMethod('phone-enroll-whatsapp')}
                    disabled={!!activeMethod}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Activer
                  </Button>
                </div>
              </div>

              {/* Activation WhatsApp */}
              {activeMethod === 'phone-enroll-whatsapp' && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="max-w-md">
                    <h5 className="font-medium text-gray-900 mb-3">Configuration WhatsApp</h5>
                    <div className="space-y-3">
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="+33 6 12 34 56 78"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-primary focus:ring-0"
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleEnrollPhone('whatsapp')}
                          loading={verifying}
                          disabled={!phoneNumber.trim() || verifying}
                          size="sm"
                        >
                          Envoyer code WhatsApp
                        </Button>
                        <Button
                          variant="outline"
                          onClick={cancelEnrollment}
                          disabled={verifying}
                          size="sm"
                        >
                          Annuler
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Vérification WhatsApp */}
              {activeMethod === 'phone-verify-whatsapp' && enrollmentData?.type === 'phone' && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="max-w-md">
                    <h5 className="font-medium text-gray-900 mb-3">
                      Code WhatsApp envoyé au {enrollmentData.phone}
                    </h5>
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="Code à 6 chiffres"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-primary focus:ring-0"
                        maxLength={6}
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={handleVerifyEnrollment}
                          loading={verifying}
                          disabled={verificationCode.length !== 6 || verifying}
                          size="sm"
                        >
                          Vérifier et activer
                        </Button>
                        <Button
                          variant="outline"
                          onClick={cancelEnrollment}
                          disabled={verifying}
                          size="sm"
                        >
                          Annuler
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Sessions actives */}
      <Card>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Sessions actives
              </h3>
              <p className="text-sm text-gray-600">
                Gérez vos connexions actives
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Session actuelle</p>
                <p className="text-sm text-gray-600">
                  Paris, France • {new Date().toLocaleDateString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <Badge variant="success" size="sm">Actuelle</Badge>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Déconnecter toutes les autres sessions
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* ============================================================ */}
      {/* DASHBOARD SECURITE ADMIN */}
      {/* ============================================================ */}

      <div className="pt-4 border-t border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          Dashboard sécurité
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          Surveillance en temps réel des menaces et appareils
        </p>
      </div>

      {/* 1. Stats sécurité 7 jours */}
      <SecurityStatsCards />

      {/* 2. Alertes non résolues */}
      <PendingAlertsTable />

      {/* 3. Appareils connus */}
      <KnownDevicesTable />

      {/* 4. Derniers événements à risque */}
      <RecentRiskEventsTable />
    </div>
  )
}