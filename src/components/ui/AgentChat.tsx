'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  Bot, X, Send, Sparkles, Loader2,
  User, Wrench, CheckCircle, Minimize2, Maximize2,
  Phone, Mail, Calendar, CreditCard, BookOpen,
  BarChart3, Bell, ArrowRight, Copy, ExternalLink,
  RefreshCw, Trash2, TrendingUp, Target, GraduationCap,
  Shield, AlertTriangle, Zap, LineChart,
  Search, DollarSign, ChevronRight, MessageSquare
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// ============================================================
// PALETTE SATOREA
// ============================================================
const SATOREA = {
  primary: '#FF5C00',
  accent: '#1A1A1A',
  bg: '#FAF8F5',
  success: '#10B981',
  action: '#FF2D78',
  muted: '#8A8A8A',
  border: '#E5E2DE',
  cardBg: '#FFFFFF',
} as const

// ============================================================
// TOOL RESULT RENDERERS (conservés tels quels)
// ============================================================

function ToolResultCard({ toolName, result }: { toolName: string; result: any }) {
  if (toolName === 'think') return null

  if (!result || result.error) {
    return (
      <div className="text-xs text-[#FF2D78] bg-[#FFE0EF] rounded-lg px-2.5 py-1.5 mt-1">
        {result?.error || 'Erreur'}
      </div>
    )
  }

  switch (toolName) {
    case 'searchLeads':
      if (!result.leads?.length) return <div className="text-xs mt-1" style={{ color: SATOREA.muted }}>Aucun lead trouvé</div>
      return (
        <div className="mt-1.5 space-y-1">
          {result.leads.slice(0, 3).map((lead: any) => (
            <Link
              key={lead.id}
              href={`/lead/${lead.id}`}
              className="flex items-center gap-2 rounded-lg px-2.5 py-2 border transition group"
              style={{ backgroundColor: SATOREA.cardBg, borderColor: SATOREA.border }}
            >
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold"
                style={{ backgroundColor: `${SATOREA.primary}15`, color: SATOREA.primary }}>
                {lead.prenom?.[0]}{lead.nom?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate" style={{ color: SATOREA.accent }}>{lead.prenom} {lead.nom}</p>
                <p className="text-[10px] truncate" style={{ color: SATOREA.muted }}>{lead.statut} · Score {lead.score_chaud}</p>
              </div>
              <ArrowRight className="w-3 h-3 shrink-0 transition" style={{ color: SATOREA.muted }} />
            </Link>
          ))}
          {result.count > 3 && <p className="text-[10px] text-center" style={{ color: SATOREA.muted }}>+{result.count - 3} autres</p>}
        </div>
      )

    case 'getNextSessions':
      if (!result.sessions?.length) return <div className="text-xs mt-1" style={{ color: SATOREA.muted }}>Aucune session disponible</div>
      return (
        <div className="mt-1.5 space-y-1">
          {result.sessions.slice(0, 4).map((s: any, i: number) => (
            <div key={i} className="flex items-center gap-2 rounded-lg px-2.5 py-2 border" style={{ backgroundColor: SATOREA.cardBg, borderColor: SATOREA.border }}>
              <div className="w-8 h-8 rounded-lg flex flex-col items-center justify-center shrink-0" style={{ backgroundColor: `${SATOREA.primary}10` }}>
                <span className="text-[8px] uppercase leading-none" style={{ color: SATOREA.primary }}>{new Date(s.date_debut).toLocaleDateString('fr-FR', { month: 'short' })}</span>
                <span className="text-xs font-bold leading-tight" style={{ color: SATOREA.accent }}>{new Date(s.date_debut).getDate()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate" style={{ color: SATOREA.accent }}>{s.formation}</p>
                <p className="text-[10px]" style={{ color: SATOREA.muted }}>{s.horaires} · {s.prix_ht}€ HT</p>
              </div>
              <span className={cn(
                'text-[10px] font-medium px-1.5 py-0.5 rounded-full',
                s.complet ? 'bg-[#FFE0EF] text-[#FF2D78]' : s.places_restantes <= 2 ? 'bg-[#FFF3E8] text-[#FF8C42]' : 'text-white'
              )} style={!s.complet && s.places_restantes > 2 ? { backgroundColor: SATOREA.success } : undefined}>
                {s.complet ? 'Complet' : `${s.places_restantes} places`}
              </span>
            </div>
          ))}
        </div>
      )

    case 'analyzeFinancement':
      return (
        <div className="mt-1.5 space-y-1">
          <div className="rounded-lg px-2.5 py-2 border" style={{ backgroundColor: SATOREA.cardBg, borderColor: SATOREA.border }}>
            <p className="text-[10px] mb-1" style={{ color: SATOREA.muted }}>{result.formation} · {result.prix_ht}€ HT</p>
            {result.recommandations?.map((r: any, i: number) => (
              <div key={i} className="flex items-center justify-between py-1 first:border-0" style={{ borderTopWidth: i > 0 ? 1 : 0, borderColor: SATOREA.border }}>
                <div>
                  <p className="text-xs font-medium" style={{ color: SATOREA.accent }}>{r.organisme}</p>
                  <p className="text-[10px]" style={{ color: SATOREA.muted }}>{r.delai}</p>
                </div>
                <div className="text-right">
                  <p className={cn('text-xs font-bold', r.reste_a_charge === '0€' ? '' : '')}
                    style={{ color: r.reste_a_charge === '0€' ? SATOREA.success : '#F59E0B' }}>
                    {r.reste_a_charge === '0€' ? 'Gratuit' : `RAC: ${r.reste_a_charge}`}
                  </p>
                  <p className="text-[10px]" style={{ color: SATOREA.muted }}>{r.taux_prise_en_charge}</p>
                </div>
              </div>
            ))}
          </div>
          {result.script_telephone && (
            <button
              onClick={() => { navigator.clipboard.writeText(result.script_telephone.replace(/^"|"$/g, '')); toast.success('Script copié') }}
              className="flex items-center gap-1.5 text-[10px] transition hover:opacity-80"
              style={{ color: SATOREA.primary }}
            >
              <Copy className="w-3 h-3" /> Copier le script téléphone
            </button>
          )}
        </div>
      )

    case 'createReminder':
      return (
        <div className="mt-1.5 flex items-center gap-2 rounded-lg px-2.5 py-2 border" style={{ backgroundColor: `${SATOREA.success}10`, borderColor: `${SATOREA.success}30` }}>
          <Bell className="w-4 h-4 shrink-0" style={{ color: SATOREA.success }} />
          <p className="text-xs" style={{ color: SATOREA.success }}>{result.message}</p>
        </div>
      )

    case 'updateLeadStatus':
      return (
        <div className="mt-1.5 flex items-center gap-2 rounded-lg px-2.5 py-2 border" style={{ backgroundColor: `${SATOREA.primary}10`, borderColor: `${SATOREA.primary}30` }}>
          <CheckCircle className="w-4 h-4 shrink-0" style={{ color: SATOREA.primary }} />
          <p className="text-xs" style={{ color: SATOREA.primary }}>{result.message}</p>
        </div>
      )

    case 'sendEmail':
      return (
        <div className={cn('mt-1.5 flex items-center gap-2 rounded-lg px-2.5 py-2 border')}
          style={{
            backgroundColor: result.mode === 'envoye' ? `${SATOREA.success}10` : '#FFF7ED',
            borderColor: result.mode === 'envoye' ? `${SATOREA.success}30` : '#FDBA7440',
          }}>
          <Mail className="w-4 h-4 shrink-0" style={{ color: result.mode === 'envoye' ? SATOREA.success : '#F59E0B' }} />
          <p className="text-xs" style={{ color: result.mode === 'envoye' ? SATOREA.success : '#92400E' }}>{result.message}</p>
        </div>
      )

    case 'getPlaybookResponse':
      if (!result.found) return <div className="text-xs mt-1" style={{ color: SATOREA.muted }}>{result.message}</div>
      return (
        <div className="mt-1.5 rounded-lg px-2.5 py-2 border" style={{ backgroundColor: SATOREA.cardBg, borderColor: SATOREA.border }}>
          <div className="flex items-center gap-1.5 mb-1">
            <BookOpen className="w-3 h-3" style={{ color: SATOREA.primary }} />
            <span className="text-[10px] font-medium" style={{ color: SATOREA.primary }}>Playbook · {result.taux_succes} succès</span>
            {result.validee_equipe && <span className="text-[10px] px-1 rounded" style={{ backgroundColor: `${SATOREA.success}15`, color: SATOREA.success }}>Validée</span>}
          </div>
          {result.meilleure_reponse && (
            <>
              <p className="text-xs italic" style={{ color: SATOREA.accent }}>"{result.meilleure_reponse}"</p>
              <button
                onClick={() => { navigator.clipboard.writeText(result.meilleure_reponse); toast.success('Réponse copiée') }}
                className="flex items-center gap-1 text-[10px] mt-1 hover:opacity-80"
                style={{ color: SATOREA.primary }}
              >
                <Copy className="w-3 h-3" /> Copier
              </button>
            </>
          )}
        </div>
      )

    case 'getPipelineStats':
      return (
        <div className="mt-1.5 grid grid-cols-3 gap-1">
          {[
            { label: 'Leads actifs', value: result.total_leads_actifs, color: SATOREA.primary },
            { label: 'Score moy.', value: result.score_moyen, color: '#F59E0B' },
            { label: 'Rappels retard', value: result.rappels_en_retard, color: result.rappels_en_retard > 0 ? '#EF4444' : SATOREA.success },
          ].map((stat, i) => (
            <div key={i} className="rounded-lg px-2 py-1.5 border text-center" style={{ backgroundColor: SATOREA.cardBg, borderColor: SATOREA.border }}>
              <p className="text-sm font-bold" style={{ color: stat.color }}>{stat.value}</p>
              <p className="text-[9px]" style={{ color: SATOREA.muted }}>{stat.label}</p>
            </div>
          ))}
        </div>
      )

    case 'getProactiveInsights':
      if (!result.urgences?.length && !result.insights?.length) return null
      return (
        <div className="mt-1.5 space-y-1">
          {result.urgences?.map((u: string, i: number) => (
            <div key={i} className="text-xs bg-[#FFE0EF] text-[#FF2D78] rounded-lg px-2.5 py-1.5 border border-red-100">
              {u}
            </div>
          ))}
          {result.insights?.map((ins: string, i: number) => (
            <div key={i} className="text-xs rounded-lg px-2.5 py-1.5 border"
              style={{ backgroundColor: `${SATOREA.primary}08`, color: SATOREA.primary, borderColor: `${SATOREA.primary}20` }}>
              {ins}
            </div>
          ))}
        </div>
      )

    case 'findSimilarSuccess':
      if (!result.found) return <div className="text-xs mt-1" style={{ color: SATOREA.muted }}>{result.message}</div>
      return (
        <div className="mt-1.5 rounded-lg px-2.5 py-2 border" style={{ backgroundColor: SATOREA.cardBg, borderColor: SATOREA.border }}>
          <p className="text-[10px] mb-1" style={{ color: SATOREA.muted }}>Basé sur {result.nb_leads_similaires} leads similaires</p>
          <div className="grid grid-cols-2 gap-1.5">
            {result.contacts_moyens && (
              <div className="text-center">
                <p className="text-sm font-bold" style={{ color: SATOREA.primary }}>{result.contacts_moyens}</p>
                <p className="text-[9px]" style={{ color: SATOREA.muted }}>contacts moy.</p>
              </div>
            )}
            {result.delai_conversion_jours && (
              <div className="text-center">
                <p className="text-sm font-bold" style={{ color: SATOREA.success }}>{result.delai_conversion_jours}j</p>
                <p className="text-[9px]" style={{ color: SATOREA.muted }}>délai conversion</p>
              </div>
            )}
            {result.financement_principal && (
              <div className="text-center">
                <p className="text-sm font-bold" style={{ color: SATOREA.action }}>{result.financement_principal.organisme}</p>
                <p className="text-[9px]" style={{ color: SATOREA.muted }}>financement #1</p>
              </div>
            )}
            {result.satisfaction_moyenne && (
              <div className="text-center">
                <p className="text-sm font-bold" style={{ color: '#F59E0B' }}>{result.satisfaction_moyenne}/5</p>
                <p className="text-[9px]" style={{ color: SATOREA.muted }}>satisfaction</p>
              </div>
            )}
          </div>
        </div>
      )

    case 'getPipelineForecast':
      return (
        <div className="mt-1.5 space-y-1.5">
          <div className="grid grid-cols-2 gap-1">
            <div className="rounded-lg px-2 py-1.5 border text-center" style={{ backgroundColor: SATOREA.cardBg, borderColor: SATOREA.border }}>
              <p className="text-sm font-bold" style={{ color: SATOREA.primary }}>{(result.ca_pondere_total || 0).toLocaleString('fr-FR')}€</p>
              <p className="text-[9px]" style={{ color: SATOREA.muted }}>CA pondéré total</p>
            </div>
            <div className="rounded-lg px-2 py-1.5 border text-center" style={{ backgroundColor: SATOREA.cardBg, borderColor: SATOREA.border }}>
              <p className="text-sm font-bold" style={{ color: SATOREA.accent }}>{result.total_leads_actifs || 0}</p>
              <p className="text-[9px]" style={{ color: SATOREA.muted }}>leads actifs</p>
            </div>
          </div>
          {result.forecast && (
            <div className="rounded-lg px-2.5 py-2 border" style={{ backgroundColor: SATOREA.cardBg, borderColor: SATOREA.border }}>
              <p className="text-[10px] mb-1.5 flex items-center gap-1" style={{ color: SATOREA.muted }}><TrendingUp className="w-3 h-3" /> Prévisions</p>
              <div className="space-y-1">
                {[
                  { label: '30 jours', value: result.forecast['30_jours'], color: SATOREA.success },
                  { label: '60 jours', value: result.forecast['60_jours'], color: SATOREA.primary },
                  { label: '90 jours', value: result.forecast['90_jours'], color: SATOREA.action },
                ].map((f) => (
                  <div key={f.label} className="flex items-center gap-2">
                    <span className="text-[10px] w-14" style={{ color: SATOREA.muted }}>{f.label}</span>
                    <div className="flex-1 rounded-full h-2 overflow-hidden" style={{ backgroundColor: `${SATOREA.border}` }}>
                      <div className="h-full rounded-full transition-all"
                        style={{ width: `${Math.min(100, (f.value / Math.max(result.forecast['90_jours'] || 1, 1)) * 100)}%`, backgroundColor: f.color }} />
                    </div>
                    <span className="text-[10px] font-medium w-16 text-right" style={{ color: SATOREA.accent }}>{(f.value || 0).toLocaleString('fr-FR')}€</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {result.par_etape?.length > 0 && (
            <div className="rounded-lg px-2.5 py-2 border" style={{ backgroundColor: SATOREA.cardBg, borderColor: SATOREA.border }}>
              <p className="text-[10px] mb-1" style={{ color: SATOREA.muted }}>Par étape</p>
              {result.par_etape.slice(0, 5).map((e: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-0.5 text-[10px]">
                  <span style={{ color: SATOREA.accent }}>{e.statut}</span>
                  <span style={{ color: SATOREA.muted }}>{e.nb_leads} leads · {e.probabilite}</span>
                  <span className="font-medium" style={{ color: SATOREA.accent }}>{(e.ca_pondere || 0).toLocaleString('fr-FR')}€</span>
                </div>
              ))}
            </div>
          )}
          {result.top_win_patterns?.length > 0 && (
            <div className="rounded-lg px-2.5 py-2 border" style={{ background: `linear-gradient(135deg, ${SATOREA.primary}08, ${SATOREA.action}08)`, borderColor: `${SATOREA.primary}25` }}>
              <p className="text-[10px] font-medium mb-1 flex items-center gap-1" style={{ color: SATOREA.primary }}><Zap className="w-3 h-3" /> Patterns gagnants</p>
              {result.top_win_patterns.slice(0, 3).map((w: any, i: number) => (
                <p key={i} className="text-[10px]" style={{ color: SATOREA.accent }}>
                  {w.dimension === 'source' ? '📍' : w.dimension === 'formation' ? '🎓' : w.dimension === 'statut_pro' ? '👤' : '💼'}{' '}
                  {w.valeur} — {w.nb_wins} wins, {w.delai_moyen}, {w.panier}€
                </p>
              ))}
            </div>
          )}
        </div>
      )

    case 'getRevenueGraph':
      if (result.lead) {
        const l = result.lead
        const s360 = result.score_360
        return (
          <div className="mt-1.5 space-y-1.5">
            {s360 && (
              <div className="rounded-lg px-2.5 py-2 border" style={{ borderColor: `${s360.label === 'Champion' ? SATOREA.success : s360.label === 'Prometteur' ? SATOREA.primary : s360.label === 'À surveiller' ? '#F59E0B' : '#EF4444'}30`, backgroundColor: `${s360.label === 'Champion' ? SATOREA.success : s360.label === 'Prometteur' ? SATOREA.primary : s360.label === 'À surveiller' ? '#F59E0B' : '#EF4444'}08` }}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5" style={{ color: s360.label === 'Champion' ? SATOREA.success : s360.label === 'Prometteur' ? SATOREA.primary : s360.label === 'À surveiller' ? '#F59E0B' : '#EF4444' }} />
                    <span className="text-xs font-semibold" style={{ color: SATOREA.accent }}>Score 360° : {s360.global}/100</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: s360.label === 'Champion' ? SATOREA.success : s360.label === 'Prometteur' ? SATOREA.primary : s360.label === 'À surveiller' ? '#F59E0B' : '#EF4444' }}>
                    {s360.label}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                  {[
                    { label: 'Engagement', value: s360.engagement, color: SATOREA.primary },
                    { label: 'Lifetime Value', value: s360.lifetime_value, color: SATOREA.success },
                    { label: 'Santé', value: s360.health, color: SATOREA.action },
                    { label: 'Risque churn', value: s360.churn_risk, color: '#EF4444' },
                  ].map((axis) => (
                    <div key={axis.label} className="flex items-center gap-1.5">
                      <span className="text-[9px] w-16 truncate" style={{ color: SATOREA.muted }}>{axis.label}</span>
                      <div className="flex-1 rounded-full h-1.5 overflow-hidden" style={{ backgroundColor: SATOREA.border }}>
                        <div className="h-full rounded-full" style={{ width: `${axis.value}%`, backgroundColor: axis.color }} />
                      </div>
                      <span className="text-[9px] font-medium w-5 text-right" style={{ color: SATOREA.accent }}>{axis.value}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] mt-1.5 pt-1.5" style={{ color: SATOREA.accent, borderTopWidth: 1, borderColor: SATOREA.border }}>
                  ➡️ {s360.action_recommandee}
                </p>
              </div>
            )}
            <div className="rounded-lg px-2.5 py-2 border" style={{ backgroundColor: SATOREA.cardBg, borderColor: SATOREA.border }}>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs font-medium" style={{ color: SATOREA.accent }}>{l.prenom} {l.nom}</p>
                <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full')}
                  style={{
                    backgroundColor: l.engagement_score >= 60 ? `${SATOREA.success}15` : l.engagement_score >= 30 ? '#FFF7ED' : '#FEF2F2',
                    color: l.engagement_score >= 60 ? SATOREA.success : l.engagement_score >= 30 ? '#92400E' : '#DC2626',
                  }}>
                  Eng. {l.engagement_score}/100
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <div className="text-center">
                  <p className="text-sm font-bold" style={{ color: SATOREA.primary }}>{(l.lifetime_value || 0).toLocaleString('fr-FR')}€</p>
                  <p className="text-[8px]" style={{ color: SATOREA.muted }}>Lifetime Value</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold" style={{ color: l.jours_sans_contact > 14 ? '#EF4444' : l.jours_sans_contact > 7 ? '#F59E0B' : SATOREA.success }}>
                    {l.jours_sans_contact || 0}j
                  </p>
                  <p className="text-[8px]" style={{ color: SATOREA.muted }}>sans contact</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold" style={{ color: l.rappels_overdue > 0 ? '#EF4444' : SATOREA.success }}>
                    {l.rappels_overdue || 0}
                  </p>
                  <p className="text-[8px]" style={{ color: SATOREA.muted }}>rappels retard</p>
                </div>
              </div>
              {(l.nb_financements_en_cours > 0 || l.nb_financements_ok > 0) && (
                <div className="flex gap-2 mt-1.5 pt-1.5" style={{ borderTopWidth: 1, borderColor: SATOREA.border }}>
                  {l.nb_financements_ok > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: `${SATOREA.success}15`, color: SATOREA.success }}>{l.nb_financements_ok} financement(s) OK</span>
                  )}
                  {l.nb_financements_en_cours > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: '#FFF7ED', color: '#92400E' }}>{l.nb_financements_en_cours} en cours</span>
                  )}
                </div>
              )}
            </div>
          </div>
        )
      }
      if (result.leads?.length) {
        return (
          <div className="mt-1.5 space-y-1">
            <p className="text-[10px]" style={{ color: SATOREA.muted }}>{result.count} leads · filtre : {result.filtre}</p>
            {result.leads.slice(0, 5).map((l: any) => (
              <Link key={l.id} href={`/lead/${l.id}`}
                className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 border transition group"
                style={{ backgroundColor: SATOREA.cardBg, borderColor: SATOREA.border }}>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate" style={{ color: SATOREA.accent }}>{l.prenom} {l.nom}</p>
                  <p className="text-[10px] truncate" style={{ color: SATOREA.muted }}>
                    {l.statut} · Score {l.score} · Eng. {l.engagement_score}
                    {l.jours_sans_contact > 7 && <span className="text-[#FF2D78] ml-1">· {l.jours_sans_contact}j sans contact</span>}
                  </p>
                </div>
                <ArrowRight className="w-3 h-3 shrink-0" style={{ color: SATOREA.muted }} />
              </Link>
            ))}
          </div>
        )
      }
      return <div className="text-xs mt-1" style={{ color: SATOREA.muted }}>Aucun résultat</div>

    default:
      return null
  }
}

// ============================================================
// TOOL LABELS (conservés)
// ============================================================
const TOOL_LABELS: Record<string, { label: string; icon: any; hidden?: boolean }> = {
  think: { label: 'Réflexion...', icon: Sparkles, hidden: true },
  searchLeads: { label: 'Recherche leads', icon: User },
  getLeadDetails: { label: 'Fiche lead', icon: User },
  getProactiveInsights: { label: 'Analyse urgences', icon: Bell },
  findSimilarSuccess: { label: 'Leads similaires', icon: BarChart3 },
  createReminder: { label: 'Création rappel', icon: Bell },
  getNextSessions: { label: 'Sessions dispo', icon: Calendar },
  analyzeFinancement: { label: 'Analyse financement', icon: CreditCard },
  searchKnowledgeBase: { label: 'Base de connaissances', icon: BookOpen },
  getPlaybookResponse: { label: 'Playbook', icon: BookOpen },
  getPipelineStats: { label: 'Stats pipeline', icon: BarChart3 },
  updateLeadStatus: { label: 'Changement statut', icon: RefreshCw },
  sendEmail: { label: 'Envoi email', icon: Mail },
  getPipelineForecast: { label: 'Forecast pipeline', icon: TrendingUp },
  getRevenueGraph: { label: 'Vue 360°', icon: Target },
}

// ============================================================
// MARKDOWN RENDERER (conservé)
// ============================================================
function RenderMarkdown({ text }: { text: string }) {
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (/^[-*]\s+/.test(line)) {
      const content = line.replace(/^[-*]\s+/, '')
      elements.push(
        <div key={i} className="flex gap-1.5 items-start">
          <span className="mt-0.5 shrink-0" style={{ color: SATOREA.muted }}>{'•'}</span>
          <span>{renderInline(content)}</span>
        </div>
      )
    } else {
      elements.push(<span key={i}>{renderInline(line)}{i < lines.length - 1 ? '\n' : ''}</span>)
    }
  }

  return <>{elements}</>
}

function renderInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = []
  const regex = /(\*\*(.+?)\*\*)|(\[([^\]]+)\]\(([^)]+)\))/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }
    if (match[1]) {
      parts.push(<strong key={match.index} className="font-semibold">{match[2]}</strong>)
    } else if (match[3]) {
      parts.push(
        <a key={match.index} href={match[5]} target="_blank" rel="noopener noreferrer"
          className="underline hover:opacity-80" style={{ color: SATOREA.primary }}>
          {match[4]}
        </a>
      )
    }
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }
  return parts.length > 0 ? parts : [text]
}

function formatTime(id: string): string {
  const tsMatch = id.match(/\d{13,}/)
  if (tsMatch) {
    const date = new Date(parseInt(tsMatch[0]))
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  }
  return ''
}

// ============================================================
// MODE CONFIG
// ============================================================
type AgentMode = 'commercial' | 'formation'

const MODE_CONFIG: Record<AgentMode, {
  label: string
  sublabel: string
  icon: any
  color: string
}> = {
  commercial: {
    label: 'Commercial',
    sublabel: 'Pipeline, leads, conversion',
    icon: TrendingUp,
    color: SATOREA.primary,
  },
  formation: {
    label: 'Formation',
    sublabel: 'Qualiopi, sessions, stagiaires',
    icon: GraduationCap,
    color: SATOREA.action,
  },
}

// ============================================================
// CONTEXTUAL SUGGESTIONS
// ============================================================
interface SuggestionCard {
  icon: any
  title: string
  subtitle: string
  prompt: string
}

function getSuggestions(pathname: string, mode: AgentMode, leadId?: string): SuggestionCard[] {
  // Page lead/[id]
  if (leadId) {
    return mode === 'formation' ? [
      { icon: GraduationCap, title: 'Suivi stagiaire', subtitle: 'Présences, progression', prompt: 'Suivi de ce stagiaire' },
      { icon: BookOpen, title: 'Documents formation', subtitle: 'Pièces à fournir', prompt: 'Documents de formation' },
      { icon: Target, title: 'Évaluation', subtitle: 'Notes et certificat', prompt: 'Évaluation et certificat' },
      { icon: Calendar, title: 'Prochaine session', subtitle: 'Disponibilités', prompt: 'Prochaines sessions' },
    ] : [
      { icon: Target, title: 'Analyse prospect', subtitle: 'Score 360°, potentiel', prompt: 'Analyse ce lead' },
      { icon: DollarSign, title: 'Financement', subtitle: 'Meilleure option', prompt: 'Quel financement proposer ?' },
      { icon: Mail, title: 'Email de relance', subtitle: 'Rédaction assistée', prompt: 'Rédige un email de relance' },
      { icon: Calendar, title: 'Session dispo', subtitle: 'Places restantes', prompt: 'Prochaine session disponible ?' },
    ]
  }

  const p = pathname ?? ''

  // Page /leads
  if (p.startsWith('/leads')) {
    return [
      { icon: Zap, title: 'Leads chauds', subtitle: 'À contacter en priorité', prompt: 'Qui sont mes leads chauds ?' },
      { icon: Phone, title: 'Non contactés', subtitle: 'Leads en attente', prompt: 'Quels leads n\'ont pas été contactés ?' },
      { icon: BarChart3, title: 'Résumé pipeline', subtitle: 'Vue d\'ensemble', prompt: 'Résumé de mon pipeline' },
      { icon: Bell, title: 'Relances du jour', subtitle: 'Rappels en retard', prompt: 'Leads à relancer aujourd\'hui' },
    ]
  }

  // Page /sessions
  if (p.startsWith('/sessions') || p.startsWith('/session/')) {
    return [
      { icon: Calendar, title: 'Places disponibles', subtitle: 'Sessions ouvertes', prompt: 'Quelles sessions ont des places ?' },
      { icon: User, title: 'Stagiaires du mois', subtitle: 'Comptage mensuel', prompt: 'Combien de stagiaires ce mois ?' },
      { icon: BarChart3, title: 'Taux remplissage', subtitle: 'Statistiques sessions', prompt: 'Taux de remplissage des sessions' },
      { icon: GraduationCap, title: 'Prochaines sessions', subtitle: 'Planning à venir', prompt: 'Prochaines sessions' },
    ]
  }

  // Page /financement
  if (p.startsWith('/financement')) {
    return [
      { icon: CreditCard, title: 'Dossiers en attente', subtitle: 'Validation requise', prompt: 'Dossiers en attente de validation' },
      { icon: DollarSign, title: 'Simuler OPCO', subtitle: 'Calcul financement', prompt: 'Simuler un financement OPCO' },
      { icon: BookOpen, title: 'Documents manquants', subtitle: 'Pièces à fournir', prompt: 'Documents manquants financement' },
      { icon: TrendingUp, title: 'Stats financement', subtitle: 'Taux d\'acceptation', prompt: 'Statistiques de financement' },
    ]
  }

  // Page par défaut — mode formation
  if (mode === 'formation') {
    return [
      { icon: Calendar, title: 'Sessions semaine', subtitle: 'Planning en cours', prompt: 'Sessions de la semaine' },
      { icon: Shield, title: 'Docs Qualiopi', subtitle: 'Documents manquants', prompt: 'Documents manquants Qualiopi' },
      { icon: BarChart3, title: 'Taux remplissage', subtitle: 'Toutes sessions', prompt: 'Taux de remplissage' },
      { icon: GraduationCap, title: 'Heures formation', subtitle: 'Ce mois-ci', prompt: 'Heures formation ce mois' },
    ]
  }

  // Page par défaut — mode commercial
  return [
    { icon: BarChart3, title: 'Mes stats pipeline', subtitle: 'KPIs et conversion', prompt: 'Mes stats du jour' },
    { icon: Search, title: 'Chercher un lead', subtitle: 'Recherche rapide', prompt: 'Leads à relancer cette semaine' },
    { icon: DollarSign, title: 'Simuler financement', subtitle: 'Options de prise en charge', prompt: 'Aide sur le financement' },
    { icon: Calendar, title: 'Prochaines sessions', subtitle: 'Places disponibles', prompt: 'Prochaines sessions' },
  ]
}

function getPlaceholder(pathname: string, leadId?: string): string {
  if (leadId) return 'Question sur ce prospect...'
  const p = pathname ?? ''
  if (p.startsWith('/leads')) return 'Rechercher un lead, stats pipeline...'
  if (p.startsWith('/sessions') || p.startsWith('/session/')) return 'Sessions, stagiaires, planning...'
  if (p.startsWith('/financement')) return 'Financement, OPCO, dossiers...'
  if (p.startsWith('/pipeline')) return 'Pipeline, conversion, forecast...'
  return 'Posez votre question...'
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export function AgentChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [agentMode, setAgentMode] = useState<AgentMode>('commercial')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const pathname = usePathname()

  const leadIdMatch = (pathname ?? '').match(/\/lead\/([a-f0-9-]+)/)
  const currentLeadId = leadIdMatch ? leadIdMatch[1] : undefined
  const modeConfig = MODE_CONFIG[agentMode]

  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  // Has the user sent at least one message?
  const hasConversation = messages.some(m => m.role === 'user')

  const suggestions = useMemo(
    () => getSuggestions(pathname ?? '', agentMode, currentLeadId),
    [pathname, agentMode, currentLeadId]
  )

  const placeholder = useMemo(
    () => getPlaceholder(pathname ?? '', currentLeadId),
    [pathname, currentLeadId]
  )

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (isOpen && !isMinimized) setTimeout(() => inputRef.current?.focus(), 100)
  }, [isOpen, isMinimized])

  useEffect(() => {
    return () => { abortRef.current?.abort() }
  }, [])

  // Lock body scroll on mobile when chat is open
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined' && window.innerWidth < 768) {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
  }, [isOpen])

  const clearChat = useCallback(() => { setMessages([]) }, [])

  // ============================================================
  // FETCH SSE (conservé tel quel)
  // ============================================================
  const doSend = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return

    const userMsg = {
      id: `u-${Date.now()}`,
      role: 'user' as const,
      parts: [{ type: 'text' as const, text }],
    }
    const assistantMsg = {
      id: `a-${Date.now()}`,
      role: 'assistant' as const,
      parts: [] as any[],
    }

    setMessages(prev => [...prev, userMsg, assistantMsg])
    setIsLoading(true)

    const history = [...messages, userMsg].map(m => ({
      role: m.role,
      content: m.parts?.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('') || '',
    }))

    abortRef.current = new AbortController()

    try {
      const res = await fetch('/api/ai/agent-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        signal: abortRef.current.signal,
        body: JSON.stringify({
          messages: history,
          leadId: currentLeadId,
          mode: agentMode,
        }),
      })

      if (!res.ok) {
        const errText = await res.text().catch(() => 'Erreur')
        throw new Error(`${res.status}: ${errText}`)
      }

      const reader = res.body?.getReader()
      if (!reader) throw new Error('Pas de stream')

      const decoder = new TextDecoder()
      let fullText = ''
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data: ') || line === 'data: [DONE]') continue
          try {
            const chunk = JSON.parse(line.slice(6))
            if (chunk.type === 'text-delta' && chunk.delta) {
              fullText += chunk.delta
              setMessages(prev => {
                const updated = prev.map((m, i) =>
                  i === prev.length - 1 && m.role === 'assistant'
                    ? { ...m, parts: [{ type: 'text' as const, text: fullText }] }
                    : m
                )
                return updated
              })
            }
          } catch { /* chunk invalide */ }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return
      console.error('[AgentChat]', err.message)
      setMessages(prev => {
        const updated = prev.map((m, i) =>
          i === prev.length - 1 && m.role === 'assistant'
            ? { ...m, parts: [{ type: 'text' as const, text: `Erreur : ${err.message}` }] }
            : m
        )
        return updated
      })
    } finally {
      setIsLoading(false)
      abortRef.current = null
    }
  }, [messages, isLoading, currentLeadId, agentMode])

  const handleSend = useCallback(async () => {
    const trimmed = input.trim()
    if (!trimmed || isLoading) return
    setInput('')
    await doSend(trimmed)
  }, [input, isLoading, doSend])

  const submitSuggestion = useCallback(async (prompt: string) => {
    if (isLoading) return
    await doSend(prompt)
  }, [isLoading, doSend])

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <>
      {/* ======== FLOATING BUTTON ======== */}
      <button
        onClick={() => { setIsOpen(!isOpen); setIsMinimized(false) }}
        aria-label={isOpen ? 'Fermer le chat' : 'Ouvrir le chat'}
        className={cn(
          'fixed z-[99] w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-200',
          'md:bottom-6 md:right-6 bottom-5 right-4',
          // Hide on mobile when chat is open (fullscreen takes over)
          isOpen && 'hidden md:flex',
        )}
        style={{
          background: isOpen
            ? SATOREA.accent
            : `linear-gradient(135deg, ${SATOREA.primary}, ${SATOREA.action})`,
        }}
      >
        {isOpen
          ? <X className="w-5 h-5 text-white" />
          : <MessageSquare className="w-6 h-6 text-white" />
        }
      </button>

      {/* ======== CHAT PANEL ======== */}
      {isOpen && (
        <div
          className={cn(
            'fixed z-[100] flex flex-col overflow-hidden',
            // Mobile = fullscreen
            'inset-0 md:inset-auto',
            // Desktop = floating panel bottom-right
            'md:bottom-24 md:right-6 md:w-[420px] md:rounded-2xl md:shadow-2xl',
            isMinimized ? 'md:h-[56px]' : 'md:max-h-[620px] md:h-[620px]',
          )}
          style={{
            backgroundColor: SATOREA.bg,
            borderColor: SATOREA.border,
          }}
        >
          {/* ======== HEADER ======== */}
          <div
            className="px-4 py-3 shrink-0"
            style={{ backgroundColor: SATOREA.accent }}
          >
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${SATOREA.primary}25` }}
              >
                <Bot className="w-5 h-5" style={{ color: SATOREA.primary }} />
              </div>

              {/* Title + status */}
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-semibold text-sm leading-tight">
                  Agent {modeConfig.label}
                </h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                      backgroundColor: isLoading ? '#F59E0B' : SATOREA.success,
                      animation: isLoading ? 'pulse 1.5s infinite' : undefined,
                    }}
                  />
                  <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    {isLoading ? 'Réflexion...' : 'En ligne'}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-0.5">
                <button
                  onClick={clearChat}
                  className="p-2 rounded-lg transition hover:bg-white/10"
                  title="Effacer la conversation"
                >
                  <Trash2 className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.4)' }} />
                </button>
                {/* Minimize — desktop only */}
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-2 rounded-lg transition hover:bg-white/10 hidden md:flex"
                >
                  {isMinimized
                    ? <Maximize2 className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.6)' }} />
                    : <Minimize2 className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.6)' }} />
                  }
                </button>
                {/* Close */}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-lg transition hover:bg-white/10"
                >
                  <X className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.6)' }} />
                </button>
              </div>
            </div>

            {/* Mode tabs */}
            {!isMinimized && (
              <div className="flex gap-1 mt-2.5">
                {(Object.keys(MODE_CONFIG) as AgentMode[]).map((mode) => {
                  const cfg = MODE_CONFIG[mode]
                  const ModeIcon = cfg.icon
                  const isActive = agentMode === mode
                  return (
                    <button
                      key={mode}
                      onClick={() => {
                        setAgentMode(mode)
                        setMessages([])
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all"
                      style={{
                        backgroundColor: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
                        color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.4)',
                      }}
                    >
                      <ModeIcon className="w-3.5 h-3.5" />
                      {cfg.label}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {!isMinimized && (
            <>
              {/* ======== BODY ======== */}
              <div className="flex-1 overflow-y-auto">
                {!hasConversation ? (
                  /* ======== WELCOME SCREEN ======== */
                  <div className="flex flex-col items-center px-5 pt-8 pb-4">
                    {/* Bot avatar large */}
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                      style={{
                        background: `linear-gradient(135deg, ${SATOREA.primary}20, ${SATOREA.action}15)`,
                      }}
                    >
                      <Bot className="w-8 h-8" style={{ color: SATOREA.primary }} />
                    </div>

                    <h2 className="text-lg font-bold mb-1" style={{ color: SATOREA.accent }}>
                      Agent {modeConfig.label}
                    </h2>
                    <p className="text-sm mb-1 font-medium" style={{ color: SATOREA.accent }}>
                      Dermotec Advanced
                    </p>
                    <p className="text-[13px] text-center mb-6 max-w-[280px] leading-relaxed" style={{ color: SATOREA.muted }}>
                      {agentMode === 'commercial'
                        ? 'Je vous aide à convertir vos prospects en inscriptions.'
                        : 'Je vous accompagne sur Qualiopi, sessions et stagiaires.'
                      }
                    </p>

                    {/* Suggestion cards */}
                    <div className="w-full space-y-2.5">
                      {suggestions.map((card) => {
                        const CardIcon = card.icon
                        return (
                          <button
                            key={card.prompt}
                            onClick={() => submitSuggestion(card.prompt)}
                            disabled={isLoading}
                            className="w-full flex items-center gap-3 rounded-xl px-4 py-3.5 text-left transition-all hover:shadow-md active:scale-[0.98] disabled:opacity-50"
                            style={{
                              backgroundColor: SATOREA.cardBg,
                              border: `1px solid ${SATOREA.border}`,
                            }}
                          >
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                              style={{ backgroundColor: `${SATOREA.primary}10` }}
                            >
                              <CardIcon className="w-5 h-5" style={{ color: SATOREA.primary }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold" style={{ color: SATOREA.accent }}>
                                {card.title}
                              </p>
                              <p className="text-xs" style={{ color: SATOREA.muted }}>
                                {card.subtitle}
                              </p>
                            </div>
                            <ChevronRight className="w-4 h-4 shrink-0" style={{ color: SATOREA.muted }} />
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  /* ======== MESSAGES ======== */
                  <div className="px-4 py-3 space-y-4">
                    {messages.map((message: any) => {
                      const textParts = (message.parts || []).filter((p: any) => p.type === 'text')
                      const toolParts = (message.parts || []).filter((p: any) =>
                        p.type === 'dynamic-tool' || (typeof p.type === 'string' && p.type.startsWith('tool-'))
                      )
                      const textContent = textParts.map((p: any) => p.text).join('')
                      const hasContent = textContent.length > 0
                      const hasToolParts = toolParts.length > 0

                      if (message.role === 'user') {
                        return (
                          <div key={message.id} className="flex justify-end">
                            <div
                              className="max-w-[80%] rounded-2xl rounded-br-md px-4 py-2.5 text-[13px] leading-relaxed text-white"
                              style={{ backgroundColor: SATOREA.primary }}
                            >
                              <div className="whitespace-pre-wrap">{textContent}</div>
                              <div className="text-[9px] mt-1 text-right" style={{ color: 'rgba(255,255,255,0.6)' }}>
                                {formatTime(message.id)}
                              </div>
                            </div>
                          </div>
                        )
                      }

                      // Assistant message
                      return (
                        <div key={message.id} className="flex gap-2.5 justify-start">
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                            style={{ backgroundColor: `${SATOREA.primary}12` }}
                          >
                            <Bot className="w-3.5 h-3.5" style={{ color: SATOREA.primary }} />
                          </div>
                          <div className="max-w-[85%] min-w-0">
                            {/* Tool invocations */}
                            {hasToolParts && (
                              <div className="space-y-1.5 mb-1.5">
                                {toolParts.map((part: any, idx: number) => {
                                  const toolName = part.toolName
                                  const toolInfo = TOOL_LABELS[toolName]
                                  if (toolInfo?.hidden) return null

                                  const ToolIcon = toolInfo?.icon || Wrench
                                  const isComplete = part.state === 'output-available'
                                  const hasError = part.state === 'output-error'

                                  return (
                                    <div key={part.toolCallId || idx}>
                                      <div className="flex items-center gap-1.5 text-[10px] mb-0.5" style={{ color: SATOREA.muted }}>
                                        {isComplete ? (
                                          <CheckCircle className="w-3 h-3" style={{ color: SATOREA.success }} />
                                        ) : hasError ? (
                                          <AlertTriangle className="w-3 h-3 text-[#FF2D78]" />
                                        ) : (
                                          <Loader2 className="w-3 h-3 animate-spin" style={{ color: SATOREA.primary }} />
                                        )}
                                        <ToolIcon className="w-3 h-3" />
                                        <span>{toolInfo?.label || toolName}</span>
                                      </div>
                                      {isComplete && part.output && (
                                        <ToolResultCard toolName={toolName} result={part.output} />
                                      )}
                                      {hasError && (
                                        <div className="text-xs text-[#FF2D78] bg-[#FFE0EF] rounded-lg px-2.5 py-1.5 mt-1">
                                          {part.errorText || 'Erreur'}
                                        </div>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            )}

                            {/* Text content */}
                            {hasContent && (
                              <div
                                className="rounded-2xl rounded-bl-md px-4 py-2.5 text-[13px] leading-relaxed"
                                style={{
                                  backgroundColor: SATOREA.cardBg,
                                  color: SATOREA.accent,
                                  border: `1px solid ${SATOREA.border}`,
                                }}
                              >
                                <div className="whitespace-pre-wrap">
                                  <RenderMarkdown text={textContent} />
                                </div>
                                <div className="text-[9px] mt-1" style={{ color: SATOREA.muted }}>
                                  {formatTime(message.id)}
                                </div>
                              </div>
                            )}

                            {/* Loading dots */}
                            {!hasContent && !hasToolParts && (
                              <div
                                className="rounded-2xl rounded-bl-md px-4 py-3 inline-flex items-center gap-1.5"
                                style={{
                                  backgroundColor: SATOREA.cardBg,
                                  border: `1px solid ${SATOREA.border}`,
                                }}
                              >
                                <div
                                  className="w-2 h-2 rounded-full animate-bounce"
                                  style={{ backgroundColor: SATOREA.primary, animationDelay: '0ms' }}
                                />
                                <div
                                  className="w-2 h-2 rounded-full animate-bounce"
                                  style={{ backgroundColor: SATOREA.primary, opacity: 0.6, animationDelay: '150ms' }}
                                />
                                <div
                                  className="w-2 h-2 rounded-full animate-bounce"
                                  style={{ backgroundColor: SATOREA.primary, opacity: 0.3, animationDelay: '300ms' }}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}

                    {/* Quick suggestion pills after first response */}
                    {messages.length >= 2 && !isLoading && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {suggestions.slice(0, 3).map((s) => (
                          <button
                            key={s.prompt}
                            onClick={() => submitSuggestion(s.prompt)}
                            className="px-3 py-1.5 rounded-full text-[11px] font-medium transition hover:shadow-sm active:scale-95"
                            style={{
                              backgroundColor: `${SATOREA.primary}10`,
                              color: SATOREA.primary,
                              border: `1px solid ${SATOREA.primary}20`,
                            }}
                          >
                            {s.title}
                          </button>
                        ))}
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* ======== INPUT ======== */}
              <div
                className="shrink-0 px-3 py-3 safe-area-bottom"
                style={{
                  borderTop: `1px solid ${SATOREA.border}`,
                  backgroundColor: SATOREA.cardBg,
                }}
              >
                <form
                  data-agent-form
                  onSubmit={(e) => { e.preventDefault(); handleSend() }}
                  className="flex gap-2 items-end"
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={placeholder}
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none transition"
                    style={{
                      backgroundColor: SATOREA.bg,
                      border: `1.5px solid ${SATOREA.border}`,
                      color: SATOREA.accent,
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = SATOREA.primary
                      e.currentTarget.style.boxShadow = `0 0 0 3px ${SATOREA.primary}15`
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = SATOREA.border
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                    disabled={isLoading}
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className="p-2.5 rounded-xl transition disabled:opacity-30 shrink-0 active:scale-95"
                    style={{
                      backgroundColor: input.trim() && !isLoading ? SATOREA.primary : `${SATOREA.primary}40`,
                      color: '#FFFFFF',
                    }}
                  >
                    {isLoading
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Send className="w-4 h-4" />
                    }
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      )}

      {/* Inline keyframes for pulse animation */}
      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .safe-area-bottom {
          padding-bottom: max(0.75rem, env(safe-area-inset-bottom));
        }
      `}</style>
    </>
  )
}
