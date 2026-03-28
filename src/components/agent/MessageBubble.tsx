'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Bot, CheckCircle, Loader2, AlertTriangle, Copy,
  ThumbsUp, ThumbsDown, ChevronDown, ChevronUp,
  User, Wrench, Bell, Mail, BookOpen, Calendar,
  CreditCard, BarChart3, TrendingUp, Target, Zap,
  RefreshCw, ArrowRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { AgentMessage } from '@/hooks/use-agent-chat'

const S = {
  primary: '#FF5C00',
  accent: '#1A1A1A',
  success: '#10B981',
  action: '#FF2D78',
  muted: '#8A8A8A',
  border: '#E5E2DE',
  cardBg: '#FFFFFF',
} as const

const TOOL_LABELS: Record<string, { label: string; icon: any; hidden?: boolean }> = {
  think: { label: 'Reflexion...', icon: Bot, hidden: true },
  searchLeads: { label: 'Recherche leads', icon: User },
  getLeadDetails: { label: 'Fiche lead', icon: User },
  getProactiveInsights: { label: 'Analyse urgences', icon: Bell },
  findSimilarSuccess: { label: 'Leads similaires', icon: BarChart3 },
  createReminder: { label: 'Creation rappel', icon: Bell },
  getNextSessions: { label: 'Sessions dispo', icon: Calendar },
  analyzeFinancement: { label: 'Analyse financement', icon: CreditCard },
  searchKnowledgeBase: { label: 'Base de connaissances', icon: BookOpen },
  getPlaybookResponse: { label: 'Playbook', icon: BookOpen },
  getPipelineStats: { label: 'Stats pipeline', icon: BarChart3 },
  updateLeadStatus: { label: 'Changement statut', icon: RefreshCw },
  sendEmail: { label: 'Envoi email', icon: Mail },
  getPipelineForecast: { label: 'Forecast pipeline', icon: TrendingUp },
  getRevenueGraph: { label: 'Vue 360', icon: Target },
}

function RenderMarkdown({ text }: { text: string }) {
  const lines = text.split('\n')
  return (
    <>
      {lines.map((line, i) => {
        if (/^[-*]\s+/.test(line)) {
          const content = line.replace(/^[-*]\s+/, '')
          return (
            <div key={i} className="flex gap-1.5 items-start">
              <span className="mt-0.5 shrink-0" style={{ color: S.muted }}>•</span>
              <span>{renderInline(content)}</span>
            </div>
          )
        }
        if (/^###?\s+/.test(line)) {
          return <p key={i} className="font-semibold mt-2 mb-0.5" style={{ color: S.accent }}>{line.replace(/^###?\s+/, '')}</p>
        }
        return <span key={i}>{renderInline(line)}{i < lines.length - 1 ? '\n' : ''}</span>
      })}
    </>
  )
}

function renderInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = []
  const regex = /(\*\*(.+?)\*\*)|(\[([^\]]+)\]\(([^)]+)\))|(`([^`]+)`)/g
  let lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index))
    if (match[1]) parts.push(<strong key={match.index} className="font-semibold">{match[2]}</strong>)
    else if (match[3]) parts.push(<a key={match.index} href={match[5]} target="_blank" rel="noopener noreferrer" className="underline hover:opacity-80" style={{ color: S.primary }}>{match[4]}</a>)
    else if (match[6]) parts.push(<code key={match.index} className="px-1 py-0.5 rounded text-[11px]" style={{ backgroundColor: S.primary + '10', color: S.primary }}>{match[7]}</code>)
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex))
  return parts.length > 0 ? parts : [text]
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function ToolResultCard({ toolName, result }: { toolName: string; result: any }) {
  const [expanded, setExpanded] = useState(true)
  if (toolName === 'think') return null
  if (!result || result.error) return <div className="text-xs text-[#FF2D78] bg-[#FFE0EF] rounded-lg px-2.5 py-1.5 mt-1">{result?.error || 'Erreur'}</div>

  if (['createReminder', 'updateLeadStatus', 'sendEmail'].includes(toolName)) {
    const ok = toolName !== 'sendEmail' || result.mode === 'envoye'
    const color = ok ? S.success : '#F59E0B'
    const Icon = toolName === 'createReminder' ? Bell : toolName === 'sendEmail' ? Mail : CheckCircle
    return (<div className="mt-1.5 flex items-center gap-2 rounded-lg px-2.5 py-2 border" style={{ backgroundColor: color + '10', borderColor: color + '30' }}><Icon className="w-4 h-4 shrink-0" style={{ color }} /><p className="text-xs flex-1" style={{ color }}>{result.message}</p></div>)
  }

  if (toolName === 'searchLeads' && result.leads?.length) {
    return (<div className="mt-1.5 space-y-1">{result.leads.slice(0, 3).map((lead: any) => (<Link key={lead.id} href={'/lead/' + lead.id} className="flex items-center gap-2 rounded-lg px-2.5 py-2 border transition hover:shadow-sm" style={{ backgroundColor: S.cardBg, borderColor: S.border }}><div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: S.primary + '15', color: S.primary }}>{lead.prenom?.[0]}{lead.nom?.[0]}</div><div className="flex-1 min-w-0"><p className="text-xs font-medium truncate" style={{ color: S.accent }}>{lead.prenom} {lead.nom}</p><p className="text-[10px] truncate" style={{ color: S.muted }}>{lead.statut} · Score {lead.score_chaud}</p></div><ArrowRight className="w-3 h-3 shrink-0" style={{ color: S.muted }} /></Link>))}{result.count > 3 && <p className="text-[10px] text-center" style={{ color: S.muted }}>+{result.count - 3} autres</p>}</div>)
  }

  if (toolName === 'getNextSessions' && result.sessions?.length) {
    return (<div className="mt-1.5 space-y-1">{result.sessions.slice(0, 4).map((s: any, i: number) => (<div key={i} className="flex items-center gap-2 rounded-lg px-2.5 py-2 border" style={{ backgroundColor: S.cardBg, borderColor: S.border }}><div className="w-8 h-8 rounded-lg flex flex-col items-center justify-center shrink-0" style={{ backgroundColor: S.primary + '10' }}><span className="text-[8px] uppercase leading-none" style={{ color: S.primary }}>{new Date(s.date_debut).toLocaleDateString('fr-FR', { month: 'short' })}</span><span className="text-xs font-bold leading-tight" style={{ color: S.accent }}>{new Date(s.date_debut).getDate()}</span></div><div className="flex-1 min-w-0"><p className="text-xs font-medium truncate" style={{ color: S.accent }}>{s.formation}</p><p className="text-[10px]" style={{ color: S.muted }}>{s.horaires} · {s.prix_ht}€ HT</p></div><span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full', s.complet ? 'bg-[#FFE0EF] text-[#FF2D78]' : s.places_restantes <= 2 ? 'bg-[#FFF3E8] text-[#FF8C42]' : 'text-white')} style={!s.complet && s.places_restantes > 2 ? { backgroundColor: S.success } : undefined}>{s.complet ? 'Complet' : s.places_restantes + ' places'}</span></div>))}</div>)
  }

  if (toolName === 'analyzeFinancement') {
    return (<div className="mt-1.5 space-y-1"><div className="rounded-lg px-2.5 py-2 border" style={{ backgroundColor: S.cardBg, borderColor: S.border }}><p className="text-[10px] mb-1" style={{ color: S.muted }}>{result.formation} · {result.prix_ht}€ HT</p>{result.recommandations?.map((r: any, i: number) => (<div key={i} className="flex items-center justify-between py-1" style={{ borderTopWidth: i > 0 ? 1 : 0, borderColor: S.border }}><div><p className="text-xs font-medium" style={{ color: S.accent }}>{r.organisme}</p><p className="text-[10px]" style={{ color: S.muted }}>{r.delai}</p></div><div className="text-right"><p className="text-xs font-bold" style={{ color: r.reste_a_charge === '0€' ? S.success : '#F59E0B' }}>{r.reste_a_charge === '0€' ? 'Gratuit' : 'RAC: ' + r.reste_a_charge}</p><p className="text-[10px]" style={{ color: S.muted }}>{r.taux_prise_en_charge}</p></div></div>))}</div>{result.script_telephone && (<button onClick={() => { navigator.clipboard.writeText(result.script_telephone.replace(/^"|"$/g, '')); toast.success('Script copie') }} className="flex items-center gap-1.5 text-[10px] transition hover:opacity-80" style={{ color: S.primary }}><Copy className="w-3 h-3" /> Copier le script telephone</button>)}</div>)
  }

  if (toolName === 'getPipelineStats') {
    return (<div className="mt-1.5 grid grid-cols-3 gap-1">{[{ label: 'Leads actifs', value: result.total_leads_actifs, color: S.primary }, { label: 'Score moy.', value: result.score_moyen, color: '#F59E0B' }, { label: 'Rappels retard', value: result.rappels_en_retard, color: result.rappels_en_retard > 0 ? '#EF4444' : S.success }].map((stat, i) => (<div key={i} className="rounded-lg px-2 py-1.5 border text-center" style={{ backgroundColor: S.cardBg, borderColor: S.border }}><p className="text-sm font-bold" style={{ color: stat.color }}>{stat.value}</p><p className="text-[9px]" style={{ color: S.muted }}>{stat.label}</p></div>))}</div>)
  }

  if (toolName === 'getProactiveInsights') {
    if (!result.urgences?.length && !result.insights?.length) return null
    return (<div className="mt-1.5 space-y-1">{result.urgences?.map((u: string, i: number) => (<div key={i} className="text-xs bg-[#FFE0EF] text-[#FF2D78] rounded-lg px-2.5 py-1.5 border border-[#FF2D78]/20">{u}</div>))}{result.insights?.map((ins: string, i: number) => (<div key={i} className="text-xs rounded-lg px-2.5 py-1.5 border" style={{ backgroundColor: S.primary + '08', color: S.primary, borderColor: S.primary + '20' }}>{ins}</div>))}</div>)
  }

  if (toolName === 'findSimilarSuccess') {
    if (!result.found) return <div className="text-xs mt-1" style={{ color: S.muted }}>{result.message}</div>
    return (
      <div className="mt-1.5 rounded-lg px-2.5 py-2 border" style={{ backgroundColor: S.cardBg, borderColor: S.border }}>
        <p className="text-[10px] mb-1" style={{ color: S.muted }}>Base sur {result.nb_leads_similaires} leads similaires</p>
        <div className="grid grid-cols-2 gap-1.5">
          {result.contacts_moyens && (
            <div className="text-center">
              <p className="text-sm font-bold" style={{ color: S.primary }}>{result.contacts_moyens}</p>
              <p className="text-[9px]" style={{ color: S.muted }}>contacts moy.</p>
            </div>
          )}
          {result.delai_conversion_jours && (
            <div className="text-center">
              <p className="text-sm font-bold" style={{ color: S.success }}>{result.delai_conversion_jours}j</p>
              <p className="text-[9px]" style={{ color: S.muted }}>delai conversion</p>
            </div>
          )}
          {result.financement_principal && (
            <div className="text-center">
              <p className="text-sm font-bold" style={{ color: S.action }}>{result.financement_principal.organisme}</p>
              <p className="text-[9px]" style={{ color: S.muted }}>financement #1</p>
            </div>
          )}
          {result.satisfaction_moyenne && (
            <div className="text-center">
              <p className="text-sm font-bold" style={{ color: '#F59E0B' }}>{result.satisfaction_moyenne}/5</p>
              <p className="text-[9px]" style={{ color: S.muted }}>satisfaction</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (toolName === 'getPlaybookResponse') {
    if (!result.found) return <div className="text-xs mt-1" style={{ color: S.muted }}>{result.message}</div>
    return (<div className="mt-1.5 rounded-lg px-2.5 py-2 border" style={{ backgroundColor: S.cardBg, borderColor: S.border }}><div className="flex items-center gap-1.5 mb-1"><BookOpen className="w-3 h-3" style={{ color: S.primary }} /><span className="text-[10px] font-medium" style={{ color: S.primary }}>Playbook · {result.taux_succes} succes</span>{result.validee_equipe && <span className="text-[10px] px-1 rounded" style={{ backgroundColor: S.success + '15', color: S.success }}>Validee</span>}</div>{result.meilleure_reponse && (<><p className="text-xs italic" style={{ color: S.accent }}>"{result.meilleure_reponse}"</p><button onClick={() => { navigator.clipboard.writeText(result.meilleure_reponse); toast.success('Reponse copiee') }} className="flex items-center gap-1 text-[10px] mt-1 hover:opacity-80" style={{ color: S.primary }}><Copy className="w-3 h-3" /> Copier</button></>)}</div>)
  }

  if (toolName === 'getPipelineForecast' && result.forecast) {
    return (<div className="mt-1.5 space-y-1.5"><div className="grid grid-cols-2 gap-1"><div className="rounded-lg px-2 py-1.5 border text-center" style={{ backgroundColor: S.cardBg, borderColor: S.border }}><p className="text-sm font-bold" style={{ color: S.primary }}>{(result.ca_pondere_total || 0).toLocaleString('fr-FR')}€</p><p className="text-[9px]" style={{ color: S.muted }}>CA pondere total</p></div><div className="rounded-lg px-2 py-1.5 border text-center" style={{ backgroundColor: S.cardBg, borderColor: S.border }}><p className="text-sm font-bold" style={{ color: S.accent }}>{result.total_leads_actifs || 0}</p><p className="text-[9px]" style={{ color: S.muted }}>leads actifs</p></div></div><div className="rounded-lg px-2.5 py-2 border" style={{ backgroundColor: S.cardBg, borderColor: S.border }}><p className="text-[10px] mb-1.5 flex items-center gap-1" style={{ color: S.muted }}><TrendingUp className="w-3 h-3" /> Previsions</p>{[{ label: '30 jours', value: result.forecast['30_jours'], color: S.success }, { label: '60 jours', value: result.forecast['60_jours'], color: S.primary }, { label: '90 jours', value: result.forecast['90_jours'], color: S.action }].map((f) => (<div key={f.label} className="flex items-center gap-2 mb-0.5"><span className="text-[10px] w-14" style={{ color: S.muted }}>{f.label}</span><div className="flex-1 rounded-full h-2 overflow-hidden" style={{ backgroundColor: S.border }}><div className="h-full rounded-full transition-all" style={{ width: Math.min(100, (f.value / Math.max(result.forecast['90_jours'] || 1, 1)) * 100) + '%', backgroundColor: f.color }} /></div><span className="text-[10px] font-medium w-16 text-right" style={{ color: S.accent }}>{(f.value || 0).toLocaleString('fr-FR')}€</span></div>))}</div>{result.top_win_patterns?.length > 0 && (<div className="rounded-lg px-2.5 py-2 border" style={{ background: 'linear-gradient(135deg, ' + S.primary + '08, ' + S.action + '08)', borderColor: S.primary + '25' }}><p className="text-[10px] font-medium mb-1 flex items-center gap-1" style={{ color: S.primary }}><Zap className="w-3 h-3" /> Patterns gagnants</p>{result.top_win_patterns.slice(0, 3).map((w: any, i: number) => (<p key={i} className="text-[10px]" style={{ color: S.accent }}>{w.valeur} — {w.nb_wins} wins, {w.delai_moyen}, {w.panier}€</p>))}</div>)}</div>)
  }

  if (toolName === 'getRevenueGraph' && result.lead) {
    const l = result.lead
    const s360 = result.score_360
    return (<div className="mt-1.5 space-y-1.5">
      {/* Score 360 card */}
      {s360 && (<div className="rounded-lg px-2.5 py-2 border" style={{ borderColor: (s360.label === 'Champion' ? S.success : s360.label === 'Prometteur' ? S.primary : '#F59E0B') + '30', backgroundColor: (s360.label === 'Champion' ? S.success : s360.label === 'Prometteur' ? S.primary : '#F59E0B') + '08' }}><div className="flex items-center justify-between mb-1.5"><span className="text-xs font-semibold flex items-center gap-1" style={{ color: S.accent }}><Target className="w-3.5 h-3.5" style={{ color: S.primary }} />Score 360 : {s360.global}/100</span><span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: s360.label === 'Champion' ? S.success : s360.label === 'Prometteur' ? S.primary : '#F59E0B' }}>{s360.label}</span></div><div className="grid grid-cols-2 gap-x-3 gap-y-1">{[{ label: 'Engagement', value: s360.engagement, color: S.primary }, { label: 'LTV', value: s360.lifetime_value, color: S.success }, { label: 'Sante', value: s360.health, color: S.action }, { label: 'Churn', value: s360.churn_risk, color: '#EF4444' }].map((axis) => (<div key={axis.label} className="flex items-center gap-1.5"><span className="text-[9px] w-14 truncate" style={{ color: S.muted }}>{axis.label}</span><div className="flex-1 rounded-full h-1.5 overflow-hidden" style={{ backgroundColor: S.border }}><div className="h-full rounded-full" style={{ width: axis.value + '%', backgroundColor: axis.color }} /></div><span className="text-[9px] font-medium w-5 text-right" style={{ color: S.accent }}>{axis.value}</span></div>))}</div>{s360.action_recommandee && <p className="text-[10px] mt-1.5 pt-1.5" style={{ color: S.accent, borderTopWidth: 1, borderColor: S.border }}>→ {s360.action_recommandee}</p>}</div>)}
      {/* Lead detail card — nom, engagement, LTV, jours sans contact, financements */}
      <div className="rounded-lg px-2.5 py-2 border" style={{ backgroundColor: S.cardBg, borderColor: S.border }}>
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-xs font-medium" style={{ color: S.accent }}>{l.prenom} {l.nom}</p>
          <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full')}
            style={{
              backgroundColor: l.engagement_score >= 60 ? S.success + '15' : l.engagement_score >= 30 ? '#FFF7ED' : '#FEF2F2',
              color: l.engagement_score >= 60 ? S.success : l.engagement_score >= 30 ? '#92400E' : '#DC2626',
            }}>
            Eng. {l.engagement_score}/100
          </span>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          <div className="text-center">
            <p className="text-sm font-bold" style={{ color: S.primary }}>{(l.lifetime_value || 0).toLocaleString('fr-FR')}€</p>
            <p className="text-[8px]" style={{ color: S.muted }}>Lifetime Value</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold" style={{ color: l.jours_sans_contact > 14 ? '#EF4444' : l.jours_sans_contact > 7 ? '#F59E0B' : S.success }}>
              {l.jours_sans_contact || 0}j
            </p>
            <p className="text-[8px]" style={{ color: S.muted }}>sans contact</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold" style={{ color: l.rappels_overdue > 0 ? '#EF4444' : S.success }}>
              {l.rappels_overdue || 0}
            </p>
            <p className="text-[8px]" style={{ color: S.muted }}>rappels retard</p>
          </div>
        </div>
        {(l.nb_financements_en_cours > 0 || l.nb_financements_ok > 0) && (
          <div className="flex gap-2 mt-1.5 pt-1.5" style={{ borderTopWidth: 1, borderColor: S.border }}>
            {l.nb_financements_ok > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: S.success + '15', color: S.success }}>{l.nb_financements_ok} financement(s) OK</span>
            )}
            {l.nb_financements_en_cours > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: '#FFF7ED', color: '#92400E' }}>{l.nb_financements_en_cours} en cours</span>
            )}
          </div>
        )}
      </div>
    </div>)
  }

  // getRevenueGraph — leads list view (filtre)
  if (toolName === 'getRevenueGraph' && result.leads?.length) {
    return (
      <div className="mt-1.5 space-y-1">
        <p className="text-[10px]" style={{ color: S.muted }}>{result.count} leads · filtre : {result.filtre}</p>
        {result.leads.slice(0, 5).map((l: any) => (
          <Link key={l.id} href={'/lead/' + l.id}
            className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 border transition hover:shadow-sm"
            style={{ backgroundColor: S.cardBg, borderColor: S.border }}>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate" style={{ color: S.accent }}>{l.prenom} {l.nom}</p>
              <p className="text-[10px] truncate" style={{ color: S.muted }}>
                {l.statut} · Score {l.score} · Eng. {l.engagement_score}
                {l.jours_sans_contact > 7 && <span className="text-[#FF2D78] ml-1">· {l.jours_sans_contact}j sans contact</span>}
              </p>
            </div>
            <ArrowRight className="w-3 h-3 shrink-0" style={{ color: S.muted }} />
          </Link>
        ))}
      </div>
    )
  }

  if (toolName === 'getRevenueGraph') {
    return <div className="text-xs mt-1" style={{ color: S.muted }}>Aucun resultat</div>
  }

  if (toolName === 'searchLeads' && !result.leads?.length) return <div className="text-xs mt-1" style={{ color: S.muted }}>Aucun lead trouve</div>
  if (toolName === 'getNextSessions' && !result.sessions?.length) return <div className="text-xs mt-1" style={{ color: S.muted }}>Aucune session disponible</div>

  // Generic fallback
  return (<div className="mt-1"><button onClick={() => setExpanded(!expanded)} className="flex items-center gap-1 text-[10px] hover:opacity-80" style={{ color: S.muted }}>{expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}{expanded ? 'Masquer' : 'Details'}</button>{expanded && <pre className="text-[10px] mt-1 p-2 rounded-lg overflow-x-auto" style={{ backgroundColor: S.primary + '05', color: S.muted }}>{JSON.stringify(result, null, 2).slice(0, 500)}</pre>}</div>)
}

// ============================================================
// MESSAGE BUBBLE
// ============================================================
interface MessageBubbleProps {
  message: AgentMessage
  onFeedback: (id: string, feedback: 'up' | 'down') => void
}

export function MessageBubble({ message, onFeedback }: MessageBubbleProps) {
  const textParts = message.parts.filter(p => p.type === 'text')
  const toolParts = message.parts.filter(p => p.type === 'tool-invocation')
  const textContent = textParts.map(p => (p as any).text).join('')
  const hasContent = textContent.length > 0
  const hasToolParts = toolParts.length > 0
  const isError = textContent.startsWith('Erreur :')

  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-br-md px-4 py-2.5 text-[13px] leading-relaxed text-white" style={{ backgroundColor: S.primary }}>
          <div className="whitespace-pre-wrap">{textContent}</div>
          <div className="text-[9px] mt-1 text-right" style={{ color: 'rgba(255,255,255,0.6)' }}>{formatTime(message.timestamp)}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-2.5 justify-start group">
      <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: S.primary + '12' }}>
        <Bot className="w-3.5 h-3.5" style={{ color: S.primary }} />
      </div>
      <div className="max-w-[85%] min-w-0">
        {hasToolParts && (
          <div className="space-y-1.5 mb-1.5">
            {toolParts.map((part, idx) => {
              const p = part as any
              const toolInfo = TOOL_LABELS[p.toolName]
              if (toolInfo?.hidden) return null
              const ToolIcon = toolInfo?.icon || Wrench
              const isComplete = p.state === 'output-available'
              const hasError = p.state === 'output-error'
              return (
                <div key={p.toolCallId || idx}>
                  <div className="flex items-center gap-1.5 text-[10px] mb-0.5" style={{ color: S.muted }}>
                    {isComplete ? <CheckCircle className="w-3 h-3" style={{ color: S.success }} /> : hasError ? <AlertTriangle className="w-3 h-3 text-[#FF2D78]" /> : <Loader2 className="w-3 h-3 animate-spin" style={{ color: S.primary }} />}
                    <ToolIcon className="w-3 h-3" /><span>{toolInfo?.label || p.toolName}</span>
                  </div>
                  {isComplete && p.output && <ToolResultCard toolName={p.toolName} result={p.output} />}
                  {hasError && <div className="text-xs text-[#FF2D78] bg-[#FFE0EF] rounded-lg px-2.5 py-1.5 mt-1">{p.errorText || 'Erreur'}</div>}
                </div>
              )
            })}
          </div>
        )}

        {hasContent && (
          <div className={cn('rounded-2xl rounded-bl-md px-4 py-2.5 text-[13px] leading-relaxed', isError && 'border-[#FF2D78]/20')}
            style={{ backgroundColor: isError ? '#FFE0EF' : S.cardBg, color: isError ? '#FF2D78' : S.accent, border: '1px solid ' + (isError ? '#FF2D78' + '30' : S.border) }}>
            <div className="whitespace-pre-wrap"><RenderMarkdown text={textContent} /></div>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-[9px]" style={{ color: S.muted }}>{formatTime(message.timestamp)}</span>
              {!isError && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { navigator.clipboard.writeText(textContent); toast.success('Copie') }} className="p-1 rounded hover:bg-[#F4F0EB] transition" title="Copier"><Copy className="w-3 h-3" style={{ color: S.muted }} /></button>
                  <button onClick={() => onFeedback(message.id, 'up')} className={cn('p-1 rounded transition', message.feedback === 'up' ? 'bg-[#10B981]/10' : 'hover:bg-[#F4F0EB]')}><ThumbsUp className="w-3 h-3" style={{ color: message.feedback === 'up' ? S.success : S.muted }} /></button>
                  <button onClick={() => onFeedback(message.id, 'down')} className={cn('p-1 rounded transition', message.feedback === 'down' ? 'bg-[#FF2D78]/10' : 'hover:bg-[#F4F0EB]')}><ThumbsDown className="w-3 h-3" style={{ color: message.feedback === 'down' ? '#FF2D78' : S.muted }} /></button>
                </div>
              )}
            </div>
          </div>
        )}

        {!hasContent && !hasToolParts && (
          <div className="rounded-2xl rounded-bl-md px-4 py-3 inline-flex items-center gap-1.5" style={{ backgroundColor: S.cardBg, border: '1px solid ' + S.border }}>
            <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: S.primary, animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: S.primary, opacity: 0.6, animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: S.primary, opacity: 0.3, animationDelay: '300ms' }} />
          </div>
        )}
      </div>
    </div>
  )
}
