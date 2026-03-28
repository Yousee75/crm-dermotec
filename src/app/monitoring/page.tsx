// ============================================================
// CRM DERMOTEC — Dashboard Monitoring
// Page publique : /monitoring
// Affiche l'historique des checks automatiques
// ============================================================
'use client'

import { useState, useEffect, useCallback } from 'react'

interface MonitoringRun {
  id: string
  started_at: string
  finished_at: string | null
  overall_status: 'running' | 'healthy' | 'degraded' | 'down'
  total_checks: number
  passed: number
  failed: number
  warnings: number
  duration_ms: number | null
  trigger_source: 'cron' | 'manual' | 'api'
}

interface MonitoringCheck {
  id: string
  run_id: string
  category: string
  service_name: string
  check_name: string
  status: 'pass' | 'fail' | 'warn' | 'skip'
  response_time_ms: number
  status_code: number | null
  error_message: string | null
  details: Record<string, unknown> | null
}

const STATUS_CONFIG = {
  healthy: { label: 'OK', color: '#10B981', bg: '#ECFDF5' },
  degraded: { label: 'Dégradé', color: '#FF8C42', bg: '#FFF3E8' },
  down: { label: 'Down', color: '#FF2D78', bg: '#FFF0F5' },
  running: { label: 'En cours...', color: '#6B8CAE', bg: '#F0F5FA' },
}

const CHECK_STATUS = {
  pass: { label: '✓', color: '#10B981' },
  fail: { label: '✗', color: '#FF2D78' },
  warn: { label: '⚠', color: '#FF8C42' },
  skip: { label: '—', color: '#999999' },
}

export default function MonitoringPage() {
  const [runs, setRuns] = useState<MonitoringRun[]>([])
  const [selectedRun, setSelectedRun] = useState<string | null>(null)
  const [checks, setChecks] = useState<MonitoringCheck[]>([])
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)

  const fetchRuns = useCallback(async () => {
    try {
      const res = await fetch('/api/monitoring/run?limit=30')
      const data = await res.json()
      setRuns(data.runs || [])
      if (data.runs?.length > 0 && !selectedRun) {
        loadRunDetails(data.runs[0].id)
      }
    } catch (e) {
      console.error('Failed to fetch runs:', e)
    } finally {
      setLoading(false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadRunDetails = async (runId: string) => {
    setSelectedRun(runId)
    try {
      const res = await fetch(`/api/monitoring/${runId}`)
      const data = await res.json()
      setChecks(data.checks || [])
    } catch (e) {
      console.error('Failed to fetch checks:', e)
    }
  }

  const triggerRun = async () => {
    setRunning(true)
    try {
      const res = await fetch('/api/monitoring/run', { method: 'POST' })
      const data = await res.json()
      if (data.run_id) {
        await fetchRuns()
        loadRunDetails(data.run_id)
      }
    } catch (e) {
      console.error('Failed to trigger run:', e)
    } finally {
      setRunning(false)
    }
  }

  useEffect(() => {
    fetchRuns()
  }, [fetchRuns])

  const lastRun = runs[0]
  const lastStatus = lastRun ? STATUS_CONFIG[lastRun.overall_status] : null

  // Grouper les checks par catégorie
  const checksByCategory = checks.reduce<Record<string, MonitoringCheck[]>>((acc, check) => {
    if (!acc[check.category]) acc[check.category] = []
    acc[check.category].push(check)
    return acc
  }, {})

  const categoryLabels: Record<string, string> = {
    database: 'Base de données',
    external: 'Services externes',
    api: 'Routes API',
    storage: 'Stockage',
    auth: 'Authentification',
    enrichment: 'Enrichissement données',
    scraping: 'Scraping & Concurrents',
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FAF8F5', fontFamily: 'DM Sans, sans-serif' }}>
      {/* Header */}
      <div style={{
        backgroundColor: '#111111',
        color: '#FFFFFF',
        padding: '24px 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, fontFamily: 'Bricolage Grotesque, sans-serif', margin: 0 }}>
            Monitoring CRM Dermotec
          </h1>
          <p style={{ fontSize: 14, color: '#999999', marginTop: 4 }}>
            Tests automatiques quotidiens — tous les services
          </p>
        </div>
        <button
          onClick={triggerRun}
          disabled={running}
          style={{
            backgroundColor: running ? '#3A3A3A' : '#FF5C00',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 10,
            padding: '10px 20px',
            fontSize: 14,
            fontWeight: 600,
            cursor: running ? 'not-allowed' : 'pointer',
          }}
        >
          {running ? 'Test en cours...' : 'Lancer un test maintenant'}
        </button>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
        {/* Status card */}
        {lastRun && lastStatus && (
          <div style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #EEEEEE',
            borderRadius: 14,
            padding: 24,
            marginBottom: 24,
            display: 'flex',
            gap: 24,
            alignItems: 'center',
            boxShadow: '0 1px 4px rgba(26,26,26,0.04)'
          }}>
            <div style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              backgroundColor: lastStatus.bg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
              fontWeight: 700,
              color: lastStatus.color,
              flexShrink: 0
            }}>
              {lastRun.overall_status === 'healthy' ? '✓' : lastRun.overall_status === 'down' ? '✗' : '⚠'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: lastStatus.color }}>
                {lastStatus.label}
              </div>
              <div style={{ fontSize: 14, color: '#3A3A3A', marginTop: 2 }}>
                Dernier test : {new Date(lastRun.started_at).toLocaleString('fr-FR')}
                {' — '}
                <span style={{ color: lastRun.trigger_source === 'cron' ? '#6B8CAE' : '#FF5C00' }}>
                  {lastRun.trigger_source === 'cron' ? 'Automatique' : 'Manuel'}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 16, textAlign: 'center' }}>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#10B981' }}>{lastRun.passed}</div>
                <div style={{ fontSize: 11, color: '#999999' }}>OK</div>
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#FF2D78' }}>{lastRun.failed}</div>
                <div style={{ fontSize: 11, color: '#999999' }}>Erreurs</div>
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#FF8C42' }}>{lastRun.warnings}</div>
                <div style={{ fontSize: 11, color: '#999999' }}>Warnings</div>
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#3A3A3A' }}>{lastRun.duration_ms || '—'}ms</div>
                <div style={{ fontSize: 11, color: '#999999' }}>Durée</div>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24 }}>
          {/* Sidebar — Liste des runs */}
          <div>
            <h2 style={{
              fontSize: 16, fontWeight: 700, color: '#111111', marginBottom: 12,
              fontFamily: 'Bricolage Grotesque, sans-serif'
            }}>
              Historique
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {loading ? (
                <div style={{ padding: 16, textAlign: 'center', color: '#999999' }}>Chargement...</div>
              ) : runs.length === 0 ? (
                <div style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #EEEEEE',
                  borderRadius: 10,
                  padding: 24,
                  textAlign: 'center'
                }}>
                  <p style={{ color: '#3A3A3A', fontSize: 14 }}>Aucun test encore</p>
                  <p style={{ color: '#999999', fontSize: 12, marginTop: 4 }}>
                    Cliquez sur "Lancer un test" pour commencer
                  </p>
                </div>
              ) : runs.map(run => {
                const cfg = STATUS_CONFIG[run.overall_status]
                const isSelected = selectedRun === run.id
                return (
                  <button
                    key={run.id}
                    onClick={() => loadRunDetails(run.id)}
                    style={{
                      backgroundColor: isSelected ? '#F4F0EB' : '#FFFFFF',
                      border: `1px solid ${isSelected ? '#FF5C00' : '#EEEEEE'}`,
                      borderRadius: 10,
                      padding: '12px 14px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: cfg.color,
                        backgroundColor: cfg.bg,
                        padding: '2px 8px',
                        borderRadius: 99
                      }}>
                        {cfg.label}
                      </span>
                      <span style={{ fontSize: 11, color: '#999999' }}>
                        {run.trigger_source === 'cron' ? 'Auto' : 'Manuel'}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: '#111111', marginTop: 6, fontWeight: 500 }}>
                      {new Date(run.started_at).toLocaleDateString('fr-FR', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                      {' '}
                      {new Date(run.started_at).toLocaleTimeString('fr-FR', {
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </div>
                    <div style={{ fontSize: 11, color: '#777777', marginTop: 4 }}>
                      {run.passed} OK · {run.failed} erreurs · {run.warnings} warn · {run.duration_ms}ms
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Main — Détails du run */}
          <div>
            <h2 style={{
              fontSize: 16, fontWeight: 700, color: '#111111', marginBottom: 12,
              fontFamily: 'Bricolage Grotesque, sans-serif'
            }}>
              Détails des checks
            </h2>

            {checks.length === 0 ? (
              <div style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #EEEEEE',
                borderRadius: 14,
                padding: 48,
                textAlign: 'center'
              }}>
                <p style={{ color: '#3A3A3A', fontSize: 14 }}>
                  Sélectionnez un run ou lancez un test
                </p>
              </div>
            ) : (
              Object.entries(checksByCategory).map(([category, categoryChecks]) => (
                <div key={category} style={{ marginBottom: 16 }}>
                  <h3 style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#3A3A3A',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: 8,
                    paddingLeft: 4
                  }}>
                    {categoryLabels[category] || category}
                  </h3>
                  <div style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #EEEEEE',
                    borderRadius: 14,
                    overflow: 'hidden',
                    boxShadow: '0 1px 4px rgba(26,26,26,0.04)'
                  }}>
                    {categoryChecks.map((check, idx) => {
                      const cs = CHECK_STATUS[check.status]
                      return (
                        <div
                          key={check.id}
                          style={{
                            padding: '12px 16px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            borderBottom: idx < categoryChecks.length - 1 ? '1px solid #EEEEEE' : 'none',
                          }}
                        >
                          <span style={{
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 14,
                            fontWeight: 700,
                            color: cs.color,
                            backgroundColor: `${cs.color}15`,
                            flexShrink: 0
                          }}>
                            {cs.label}
                          </span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 14, fontWeight: 500, color: '#111111' }}>
                              {check.service_name}
                              <span style={{ color: '#999999', fontWeight: 400 }}> / {check.check_name}</span>
                            </div>
                            {check.error_message && (
                              <div style={{ fontSize: 12, color: '#FF2D78', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {check.error_message}
                              </div>
                            )}
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#3A3A3A' }}>
                              {check.response_time_ms}ms
                            </div>
                            {check.status_code && (
                              <div style={{ fontSize: 11, color: '#999999' }}>
                                HTTP {check.status_code}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
