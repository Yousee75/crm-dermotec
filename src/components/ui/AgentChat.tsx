'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  Bot, X, Send, Sparkles, Loader2,
  User, Wrench, CheckCircle, Minimize2, Maximize2,
  Phone, Mail, Calendar, CreditCard, BookOpen,
  BarChart3, Bell, ArrowRight, Copy, ExternalLink,
  RefreshCw, Trash2, TrendingUp, Target, GraduationCap,
  Shield, AlertTriangle, Zap, LineChart
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// --- Tool Result Renderers ---
// Cartes visuelles pour les résultats des tools (au lieu de JSON brut)

function ToolResultCard({ toolName, result }: { toolName: string; result: any }) {
  // Think tool : ne rien afficher (réflexion privée de l'agent)
  if (toolName === 'think') return null

  if (!result || result.error) {
    return (
      <div className="text-xs text-red-500 bg-red-50 rounded-lg px-2.5 py-1.5 mt-1">
        {result?.error || 'Erreur'}
      </div>
    )
  }

  switch (toolName) {
    case 'searchLeads':
      if (!result.leads?.length) return <div className="text-xs text-gray-400 mt-1">Aucun lead trouvé</div>
      return (
        <div className="mt-1.5 space-y-1">
          {result.leads.slice(0, 3).map((lead: any) => (
            <Link
              key={lead.id}
              href={`/lead/${lead.id}`}
              className="flex items-center gap-2 bg-white rounded-lg px-2.5 py-2 border border-gray-100 hover:border-primary/30 transition group"
            >
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                {lead.prenom?.[0]}{lead.nom?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-900 truncate">{lead.prenom} {lead.nom}</p>
                <p className="text-[10px] text-gray-400 truncate">{lead.statut} · Score {lead.score_chaud}</p>
              </div>
              <ArrowRight className="w-3 h-3 text-gray-300 group-hover:text-primary transition shrink-0" />
            </Link>
          ))}
          {result.count > 3 && <p className="text-[10px] text-gray-400 text-center">+{result.count - 3} autres</p>}
        </div>
      )

    case 'getNextSessions':
      if (!result.sessions?.length) return <div className="text-xs text-gray-400 mt-1">Aucune session disponible</div>
      return (
        <div className="mt-1.5 space-y-1">
          {result.sessions.slice(0, 4).map((s: any, i: number) => (
            <div key={i} className="flex items-center gap-2 bg-white rounded-lg px-2.5 py-2 border border-gray-100">
              <div className="w-8 h-8 rounded-lg bg-violet-50 flex flex-col items-center justify-center shrink-0">
                <span className="text-[8px] text-violet-500 uppercase leading-none">{new Date(s.date_debut).toLocaleDateString('fr-FR', { month: 'short' })}</span>
                <span className="text-xs font-bold text-violet-700 leading-tight">{new Date(s.date_debut).getDate()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-900 truncate">{s.formation}</p>
                <p className="text-[10px] text-gray-400">{s.horaires} · {s.prix_ht}€ HT</p>
              </div>
              <span className={cn(
                'text-[10px] font-medium px-1.5 py-0.5 rounded-full',
                s.complet ? 'bg-red-50 text-red-600' : s.places_restantes <= 2 ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'
              )}>
                {s.complet ? 'Complet' : `${s.places_restantes} places`}
              </span>
            </div>
          ))}
        </div>
      )

    case 'analyzeFinancement':
      return (
        <div className="mt-1.5 space-y-1">
          <div className="bg-white rounded-lg px-2.5 py-2 border border-gray-100">
            <p className="text-[10px] text-gray-400 mb-1">{result.formation} · {result.prix_ht}€ HT</p>
            {result.recommandations?.map((r: any, i: number) => (
              <div key={i} className="flex items-center justify-between py-1 border-t border-gray-50 first:border-0">
                <div>
                  <p className="text-xs font-medium text-gray-900">{r.organisme}</p>
                  <p className="text-[10px] text-gray-400">{r.delai}</p>
                </div>
                <div className="text-right">
                  <p className={cn('text-xs font-bold', r.reste_a_charge === '0€' ? 'text-green-600' : 'text-amber-600')}>
                    {r.reste_a_charge === '0€' ? 'Gratuit' : `RAC: ${r.reste_a_charge}`}
                  </p>
                  <p className="text-[10px] text-gray-400">{r.taux_prise_en_charge}</p>
                </div>
              </div>
            ))}
          </div>
          {result.script_telephone && (
            <button
              onClick={() => { navigator.clipboard.writeText(result.script_telephone.replace(/^"|"$/g, '')); toast.success('Script copié') }}
              className="flex items-center gap-1.5 text-[10px] text-primary hover:text-primary-dark transition"
            >
              <Copy className="w-3 h-3" /> Copier le script téléphone
            </button>
          )}
        </div>
      )

    case 'createReminder':
      return (
        <div className="mt-1.5 flex items-center gap-2 bg-green-50 rounded-lg px-2.5 py-2 border border-green-100">
          <Bell className="w-4 h-4 text-green-600 shrink-0" />
          <p className="text-xs text-green-700">{result.message}</p>
        </div>
      )

    case 'updateLeadStatus':
      return (
        <div className="mt-1.5 flex items-center gap-2 bg-blue-50 rounded-lg px-2.5 py-2 border border-blue-100">
          <CheckCircle className="w-4 h-4 text-blue-600 shrink-0" />
          <p className="text-xs text-blue-700">{result.message}</p>
        </div>
      )

    case 'sendEmail':
      return (
        <div className={cn('mt-1.5 flex items-center gap-2 rounded-lg px-2.5 py-2 border',
          result.mode === 'envoye' ? 'bg-green-50 border-green-100' : 'bg-amber-50 border-amber-100'
        )}>
          <Mail className={cn('w-4 h-4 shrink-0', result.mode === 'envoye' ? 'text-green-600' : 'text-amber-600')} />
          <p className={cn('text-xs', result.mode === 'envoye' ? 'text-green-700' : 'text-amber-700')}>{result.message}</p>
        </div>
      )

    case 'getPlaybookResponse':
      if (!result.found) return <div className="text-xs text-gray-400 mt-1">{result.message}</div>
      return (
        <div className="mt-1.5 bg-white rounded-lg px-2.5 py-2 border border-gray-100">
          <div className="flex items-center gap-1.5 mb-1">
            <BookOpen className="w-3 h-3 text-orange-500" />
            <span className="text-[10px] font-medium text-orange-600">Playbook · {result.taux_succes} succès</span>
            {result.validee_equipe && <span className="text-[10px] bg-green-50 text-green-600 px-1 rounded">Validée</span>}
          </div>
          {result.meilleure_reponse && (
            <>
              <p className="text-xs text-gray-700 italic">"{result.meilleure_reponse}"</p>
              <button
                onClick={() => { navigator.clipboard.writeText(result.meilleure_reponse); toast.success('Réponse copiée') }}
                className="flex items-center gap-1 text-[10px] text-primary mt-1 hover:text-primary-dark"
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
            { label: 'Leads actifs', value: result.total_leads_actifs, color: 'text-blue-600' },
            { label: 'Score moy.', value: result.score_moyen, color: 'text-amber-600' },
            { label: 'Rappels retard', value: result.rappels_en_retard, color: result.rappels_en_retard > 0 ? 'text-red-600' : 'text-green-600' },
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-lg px-2 py-1.5 border border-gray-100 text-center">
              <p className={cn('text-sm font-bold', stat.color)}>{stat.value}</p>
              <p className="text-[9px] text-gray-400">{stat.label}</p>
            </div>
          ))}
        </div>
      )

    case 'getProactiveInsights':
      if (!result.urgences?.length && !result.insights?.length) return null
      return (
        <div className="mt-1.5 space-y-1">
          {result.urgences?.map((u: string, i: number) => (
            <div key={i} className="text-xs bg-red-50 text-red-700 rounded-lg px-2.5 py-1.5 border border-red-100">
              {u}
            </div>
          ))}
          {result.insights?.map((ins: string, i: number) => (
            <div key={i} className="text-xs bg-blue-50 text-blue-700 rounded-lg px-2.5 py-1.5 border border-blue-100">
              {ins}
            </div>
          ))}
        </div>
      )

    case 'findSimilarSuccess':
      if (!result.found) return <div className="text-xs text-gray-400 mt-1">{result.message}</div>
      return (
        <div className="mt-1.5 bg-white rounded-lg px-2.5 py-2 border border-gray-100">
          <p className="text-[10px] text-gray-400 mb-1">Basé sur {result.nb_leads_similaires} leads similaires</p>
          <div className="grid grid-cols-2 gap-1.5">
            {result.contacts_moyens && (
              <div className="text-center">
                <p className="text-sm font-bold text-primary">{result.contacts_moyens}</p>
                <p className="text-[9px] text-gray-400">contacts moy.</p>
              </div>
            )}
            {result.delai_conversion_jours && (
              <div className="text-center">
                <p className="text-sm font-bold text-green-600">{result.delai_conversion_jours}j</p>
                <p className="text-[9px] text-gray-400">délai conversion</p>
              </div>
            )}
            {result.financement_principal && (
              <div className="text-center">
                <p className="text-sm font-bold text-violet-600">{result.financement_principal.organisme}</p>
                <p className="text-[9px] text-gray-400">financement #1</p>
              </div>
            )}
            {result.satisfaction_moyenne && (
              <div className="text-center">
                <p className="text-sm font-bold text-amber-600">{result.satisfaction_moyenne}/5</p>
                <p className="text-[9px] text-gray-400">satisfaction</p>
              </div>
            )}
          </div>
        </div>
      )

    case 'getPipelineForecast':
      return (
        <div className="mt-1.5 space-y-1.5">
          {/* KPIs forecast */}
          <div className="grid grid-cols-2 gap-1">
            <div className="bg-white rounded-lg px-2 py-1.5 border border-gray-100 text-center">
              <p className="text-sm font-bold text-primary">{(result.ca_pondere_total || 0).toLocaleString('fr-FR')}€</p>
              <p className="text-[9px] text-gray-400">CA pondéré total</p>
            </div>
            <div className="bg-white rounded-lg px-2 py-1.5 border border-gray-100 text-center">
              <p className="text-sm font-bold text-gray-800">{result.total_leads_actifs || 0}</p>
              <p className="text-[9px] text-gray-400">leads actifs</p>
            </div>
          </div>
          {/* Forecast 30/60/90j */}
          {result.forecast && (
            <div className="bg-white rounded-lg px-2.5 py-2 border border-gray-100">
              <p className="text-[10px] text-gray-400 mb-1.5 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Prévisions</p>
              <div className="space-y-1">
                {[
                  { label: '30 jours', value: result.forecast['30_jours'], color: 'bg-green-500' },
                  { label: '60 jours', value: result.forecast['60_jours'], color: 'bg-blue-500' },
                  { label: '90 jours', value: result.forecast['90_jours'], color: 'bg-violet-500' },
                ].map((f) => (
                  <div key={f.label} className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-500 w-14">{f.label}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div className={cn('h-full rounded-full transition-all', f.color)}
                        style={{ width: `${Math.min(100, (f.value / Math.max(result.forecast['90_jours'] || 1, 1)) * 100)}%` }} />
                    </div>
                    <span className="text-[10px] font-medium text-gray-700 w-16 text-right">{(f.value || 0).toLocaleString('fr-FR')}€</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Pipeline par étape */}
          {result.par_etape?.length > 0 && (
            <div className="bg-white rounded-lg px-2.5 py-2 border border-gray-100">
              <p className="text-[10px] text-gray-400 mb-1">Par étape</p>
              {result.par_etape.slice(0, 5).map((e: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-0.5 text-[10px]">
                  <span className="text-gray-600">{e.statut}</span>
                  <span className="text-gray-400">{e.nb_leads} leads · {e.probabilite}</span>
                  <span className="font-medium text-gray-800">{(e.ca_pondere || 0).toLocaleString('fr-FR')}€</span>
                </div>
              ))}
            </div>
          )}
          {/* Top win patterns */}
          {result.top_win_patterns?.length > 0 && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg px-2.5 py-2 border border-amber-100">
              <p className="text-[10px] text-amber-600 font-medium mb-1 flex items-center gap-1"><Zap className="w-3 h-3" /> Patterns gagnants</p>
              {result.top_win_patterns.slice(0, 3).map((w: any, i: number) => (
                <p key={i} className="text-[10px] text-gray-600">
                  {w.dimension === 'source' ? '📍' : w.dimension === 'formation' ? '🎓' : w.dimension === 'statut_pro' ? '👤' : '💼'}{' '}
                  {w.valeur} — {w.nb_wins} wins, {w.delai_moyen}, {w.panier}€
                </p>
              ))}
            </div>
          )}
        </div>
      )

    case 'getRevenueGraph':
      // Vue 360° d'un lead unique
      if (result.lead) {
        const l = result.lead
        const s360 = result.score_360
        return (
          <div className="mt-1.5 space-y-1.5">
            {/* Score 360° header */}
            {s360 && (
              <div className="rounded-lg px-2.5 py-2 border" style={{ borderColor: `${s360.label === 'Champion' ? 'var(--color-success)' : s360.label === 'Prometteur' ? '#3B82F6' : s360.label === 'À surveiller' ? '#F59E0B' : '#EF4444'}30`, backgroundColor: `${s360.label === 'Champion' ? 'var(--color-success)' : s360.label === 'Prometteur' ? '#3B82F6' : s360.label === 'À surveiller' ? '#F59E0B' : '#EF4444'}08` }}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5" style={{ color: s360.label === 'Champion' ? 'var(--color-success)' : s360.label === 'Prometteur' ? '#3B82F6' : s360.label === 'À surveiller' ? '#F59E0B' : '#EF4444' }} />
                    <span className="text-xs font-semibold text-gray-900">Score 360° : {s360.global}/100</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: s360.label === 'Champion' ? 'var(--color-success)' : s360.label === 'Prometteur' ? '#3B82F6' : s360.label === 'À surveiller' ? '#F59E0B' : '#EF4444' }}>
                    {s360.label}
                  </span>
                </div>
                {/* 4 axes mini-bars */}
                <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                  {[
                    { label: 'Engagement', value: s360.engagement, color: '#3B82F6' },
                    { label: 'Lifetime Value', value: s360.lifetime_value, color: 'var(--color-success)' },
                    { label: 'Santé', value: s360.health, color: '#8B5CF6' },
                    { label: 'Risque churn', value: s360.churn_risk, color: '#EF4444' },
                  ].map((axis) => (
                    <div key={axis.label} className="flex items-center gap-1.5">
                      <span className="text-[9px] text-gray-500 w-16 truncate">{axis.label}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${axis.value}%`, backgroundColor: axis.color }} />
                      </div>
                      <span className="text-[9px] font-medium text-gray-600 w-5 text-right">{axis.value}</span>
                    </div>
                  ))}
                </div>
                {/* Action recommandée */}
                <p className="text-[10px] text-gray-600 mt-1.5 pt-1.5 border-t border-gray-100">
                  ➡️ {s360.action_recommandee}
                </p>
              </div>
            )}
            {/* Données lead */}
            <div className="bg-white rounded-lg px-2.5 py-2 border border-gray-100">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs font-medium text-gray-900">{l.prenom} {l.nom}</p>
                <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full',
                  l.engagement_score >= 60 ? 'bg-green-50 text-green-600' :
                  l.engagement_score >= 30 ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'
                )}>
                  Eng. {l.engagement_score}/100
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <div className="text-center">
                  <p className="text-sm font-bold text-primary">{(l.lifetime_value || 0).toLocaleString('fr-FR')}€</p>
                  <p className="text-[8px] text-gray-400">Lifetime Value</p>
                </div>
                <div className="text-center">
                  <p className={cn('text-sm font-bold', l.jours_sans_contact > 14 ? 'text-red-600' : l.jours_sans_contact > 7 ? 'text-amber-600' : 'text-green-600')}>
                    {l.jours_sans_contact || 0}j
                  </p>
                  <p className="text-[8px] text-gray-400">sans contact</p>
                </div>
                <div className="text-center">
                  <p className={cn('text-sm font-bold', l.rappels_overdue > 0 ? 'text-red-600' : 'text-green-600')}>
                    {l.rappels_overdue || 0}
                  </p>
                  <p className="text-[8px] text-gray-400">rappels retard</p>
                </div>
              </div>
              {(l.nb_financements_en_cours > 0 || l.nb_financements_ok > 0) && (
                <div className="flex gap-2 mt-1.5 pt-1.5 border-t border-gray-50">
                  {l.nb_financements_ok > 0 && (
                    <span className="text-[10px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded">{l.nb_financements_ok} financement(s) OK</span>
                  )}
                  {l.nb_financements_en_cours > 0 && (
                    <span className="text-[10px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded">{l.nb_financements_en_cours} en cours</span>
                  )}
                </div>
              )}
            </div>
          </div>
        )
      }
      // Liste de leads filtrés
      if (result.leads?.length) {
        return (
          <div className="mt-1.5 space-y-1">
            <p className="text-[10px] text-gray-400">{result.count} leads · filtre : {result.filtre}</p>
            {result.leads.slice(0, 5).map((l: any) => (
              <Link key={l.id} href={`/lead/${l.id}`}
                className="flex items-center gap-2 bg-white rounded-lg px-2.5 py-1.5 border border-gray-100 hover:border-primary/30 transition group">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-900 truncate">{l.prenom} {l.nom}</p>
                  <p className="text-[10px] text-gray-400 truncate">
                    {l.statut} · Score {l.score} · Eng. {l.engagement_score}
                    {l.jours_sans_contact > 7 && <span className="text-red-500 ml-1">· {l.jours_sans_contact}j sans contact</span>}
                  </p>
                </div>
                <ArrowRight className="w-3 h-3 text-gray-300 group-hover:text-primary shrink-0" />
              </Link>
            ))}
          </div>
        )
      }
      return <div className="text-xs text-gray-400 mt-1">Aucun résultat</div>

    default:
      return null // Ne pas afficher le JSON brut
  }
}

// --- Tool name to French label ---
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

// Mode agent : Commercial (défaut) ou Formation/Qualiopi
type AgentMode = 'commercial' | 'formation'

const MODE_CONFIG: Record<AgentMode, {
  label: string
  sublabel: string
  icon: any
  color: string
  suggestions: string[]
  suggestionsLead: string[]
}> = {
  commercial: {
    label: 'Commercial',
    sublabel: 'Pipeline, leads, conversion',
    icon: TrendingUp,
    color: 'var(--color-primary)',
    suggestions: [
      'Leads chauds à rappeler',
      'Forecast pipeline',
      'Quels leads sont en danger ?',
      'Nos patterns gagnants',
    ],
    suggestionsLead: [
      'Analyse ce lead',
      'Options financement',
      'Bilan 360° complet',
      'Prochaines sessions',
    ],
  },
  formation: {
    label: 'Formation',
    sublabel: 'Qualiopi, sessions, stagiaires',
    icon: GraduationCap,
    color: '#8B5CF6',
    suggestions: [
      'Sessions de la semaine',
      'Documents manquants Qualiopi',
      'Taux de remplissage',
      'Heures formation ce mois',
    ],
    suggestionsLead: [
      'Suivi de ce stagiaire',
      'Documents de formation',
      'Présences et absences',
      'Évaluation et certificat',
    ],
  },
}

// --- Main Component ---
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

  // AI SDK v6 / @ai-sdk/react v3 : useChat n'a plus input/handleInputChange/handleSubmit/isLoading
  // Il faut gérer l'input localement et utiliser sendMessage + status + transport
  const transport = useMemo(
    () => new DefaultChatTransport({
      api: '/api/ai/agent-v2',
      body: { leadId: currentLeadId, mode: agentMode },
    }),
    [currentLeadId, agentMode]
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chatHelpers = (useChat as any)({
    transport,
    messages: [{
      id: 'welcome',
      role: 'assistant' as const,
      content: currentLeadId
        ? `Mode ${modeConfig.label} activé. Je suis sur la fiche de ce lead. Que veux-tu savoir ?`
        : `Mode ${modeConfig.label} — ${modeConfig.sublabel}. Comment je peux t'aider ?`,
      parts: [{
        type: 'text' as const,
        text: currentLeadId
          ? `Mode ${modeConfig.label} activé. Je suis sur la fiche de ce lead. Que veux-tu savoir ?`
          : `Mode ${modeConfig.label} — ${modeConfig.sublabel}. Comment je peux t'aider ?`,
      }],
    }],
    onError: (err: any) => {
      console.error('[AgentChat] Error:', err.message)
    },
  }) // AI SDK v6 — sendMessage + status
  const messages = chatHelpers?.messages ?? []
  const sendMessage = chatHelpers?.sendMessage ?? (async () => {})
  const status = chatHelpers?.status ?? 'ready'
  const isLoading = status === 'streaming' || status === 'submitted'
  const setMessages = chatHelpers?.setMessages ?? (() => {})
  const regenerate = chatHelpers?.regenerate ?? (() => {})

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (isOpen && !isMinimized) setTimeout(() => inputRef.current?.focus(), 100)
  }, [isOpen, isMinimized])

  useEffect(() => {
    if (currentLeadId) {
      setMessages([{
        id: `welcome-${currentLeadId}`,
        role: 'assistant' as const,
        content: 'Je suis sur la fiche de ce lead. Analyse, financement, relance — dis-moi.',
        parts: [{ type: 'text' as const, text: 'Je suis sur la fiche de ce lead. Analyse, financement, relance — dis-moi.' }],
      }])
    }
  }, [currentLeadId, setMessages])

  const clearChat = useCallback(() => {
    const text = currentLeadId
      ? 'Conversation effacée. Que veux-tu savoir sur ce lead ?'
      : 'Conversation effacée. Comment je peux t\'aider ?'
    setMessages([{
      id: 'welcome-clear',
      role: 'assistant' as const,
      content: text,
      parts: [{ type: 'text' as const, text }],
    }])
  }, [currentLeadId, setMessages])

  // Suggestions contextuelles dynamiques (basées sur le mode + contexte lead)
  const suggestions = currentLeadId
    ? modeConfig.suggestionsLead
    : modeConfig.suggestions

  const handleSend = useCallback(async () => {
    const trimmed = input.trim()
    if (!trimmed || isLoading) return
    setInput('')
    try {
      await sendMessage({ text: trimmed })
    } catch (err: any) {
      console.error('[AgentChat] sendMessage error:', err?.message)
    }
  }, [input, isLoading, sendMessage])

  const submitSuggestion = useCallback(async (text: string) => {
    if (isLoading) return
    setInput('')
    try {
      await sendMessage({ text })
    } catch (err: any) {
      console.error('[AgentChat] sendMessage error:', err?.message)
    }
  }, [isLoading, sendMessage])

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => { setIsOpen(!isOpen); setIsMinimized(false) }}
        className={cn(
          'fixed z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-200',
          'md:bottom-6 md:right-6 bottom-20 right-4',
          isOpen ? 'bg-gray-700 hover:bg-gray-800 scale-90' : 'bg-gradient-to-br from-primary to-primary-dark hover:shadow-xl hover:scale-105'
        )}
      >
        {isOpen ? <X className="w-5 h-5 text-white" /> : <Bot className="w-6 h-6 text-white" />}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div className={cn(
          'fixed z-50 bg-white rounded-2xl shadow-2xl border border-gray-200/80 flex flex-col overflow-hidden animate-scaleIn',
          'md:bottom-24 md:right-6 md:w-[420px]',
          'bottom-20 right-2 left-2 md:left-auto',
          isMinimized ? 'h-[56px]' : 'md:max-h-[620px] max-h-[70vh]'
        )}>
          {/* Header */}
          <div className="gradient-accent px-4 py-2.5 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${modeConfig.color}30` }}>
                <Sparkles className="w-4 h-4" style={{ color: modeConfig.color }} />
              </div>
              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setIsMinimized(!isMinimized)}>
                <h3 className="text-white font-semibold text-sm">Agent {modeConfig.label}</h3>
                <p className="text-white/50 text-[11px]">
                  {isLoading ? 'Réflexion en cours...' : currentLeadId ? 'Fiche lead active' : '15 outils · Claude Sonnet'}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={clearChat} className="p-1.5 rounded-lg hover:bg-white/10 transition" title="Effacer">
                  <Trash2 className="w-3.5 h-3.5 text-white/40" />
                </button>
                <button onClick={() => setIsMinimized(!isMinimized)} className="p-1.5 rounded-lg hover:bg-white/10 transition">
                  {isMinimized ? <Maximize2 className="w-3.5 h-3.5 text-white/60" /> : <Minimize2 className="w-3.5 h-3.5 text-white/60" />}
                </button>
              </div>
            </div>
            {/* Mode selector tabs */}
            {!isMinimized && (
              <div className="flex gap-1 mt-2">
                {(Object.keys(MODE_CONFIG) as AgentMode[]).map((mode) => {
                  const cfg = MODE_CONFIG[mode]
                  const ModeIcon = cfg.icon
                  const isActive = agentMode === mode
                  return (
                    <button
                      key={mode}
                      onClick={() => {
                        setAgentMode(mode)
                        const modeText = currentLeadId
                            ? `Mode ${cfg.label} activé. Que veux-tu savoir sur ce lead ?`
                            : `Mode ${cfg.label} — ${cfg.sublabel}. Comment je peux t'aider ?`
                        setMessages([{
                          id: `welcome-${mode}-${Date.now()}`,
                          role: 'assistant' as const,
                          content: modeText,
                          parts: [{ type: 'text' as const, text: modeText }],
                        }])
                      }}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all',
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                      )}
                    >
                      <ModeIcon className="w-3 h-3" />
                      {cfg.label}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-[200px]">
                {messages.map((message: any) => (
                  <div key={message.id} className={cn('flex gap-2', message.role === 'user' ? 'justify-end' : 'justify-start')}>
                    {message.role === 'assistant' && (
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Bot className="w-3 h-3 text-primary" />
                      </div>
                    )}
                    <div className={cn(
                      'max-w-[85%] rounded-2xl px-3 py-2 text-[13px] leading-relaxed',
                      message.role === 'user'
                        ? 'bg-primary text-white rounded-br-sm'
                        : 'bg-gray-50 text-gray-800 rounded-bl-sm'
                    )}>
                      {/* Tool invocations — AI SDK v6 : parts[type=tool-invocation] ou fallback toolInvocations */}
                      {(message.toolInvocations || message.parts?.filter((p: any) => p.type === 'tool-invocation'))?.map((toolInvocation: any, i: number) => {
                        const toolName = toolInvocation.toolName || toolInvocation.toolCallId
                        const toolInfo = TOOL_LABELS[toolName] || { label: toolName, icon: Wrench }
                        const ToolIcon = toolInfo.icon
                        const state = toolInvocation.state || (toolInvocation.result !== undefined ? 'result' : 'call')

                        // Masquer le tool "think" complètement (réflexion privée de l'agent)
                        if (toolInfo.hidden && state === 'result') return null

                        return (
                          <div key={i}>
                            <div className="flex items-center gap-1.5 text-[11px] text-gray-500 mb-1">
                              {state === 'result' ? (
                                <CheckCircle className="w-3 h-3 text-green-500 shrink-0" />
                              ) : (
                                <Loader2 className="w-3 h-3 text-primary animate-spin shrink-0" />
                              )}
                              <ToolIcon className="w-3 h-3 shrink-0" />
                              <span>{toolInfo.label}</span>
                            </div>
                            {state === 'result' && (
                              <ToolResultCard toolName={toolName} result={toolInvocation.result} />
                            )}
                          </div>
                        )
                      })}
                      {/* AI SDK v6 : texte dans parts[].text ou fallback content */}
                      {(() => {
                        const textContent = message.content
                          || message.parts?.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('')
                        return textContent ? <div className="whitespace-pre-wrap">{textContent}</div> : null
                      })()}
                    </div>
                    {message.role === 'user' && (
                      <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center shrink-0 mt-0.5">
                        <User className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                ))}

                {isLoading && !messages.some((m: any) =>
                  (m.toolInvocations || m.parts?.filter((p: any) => p.type === 'tool-invocation'))?.some((t: any) => (t.state || (t.result !== undefined ? 'result' : 'call')) !== 'result')
                ) && (
                  <div className="flex gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Bot className="w-3 h-3 text-primary" />
                    </div>
                    <div className="bg-gray-50 rounded-2xl rounded-bl-sm px-3 py-2">
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick suggestions */}
              {messages.length <= 2 && !isLoading && (
                <div className="px-4 pb-2 flex flex-wrap gap-1.5">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => submitSuggestion(s)}
                      className="px-2.5 py-1 rounded-full text-[11px] bg-gray-100 text-gray-600 hover:bg-primary/10 hover:text-primary transition"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <form data-agent-form onSubmit={(e) => { e.preventDefault(); handleSend() }} className="px-3 py-2.5 border-t border-gray-100 flex gap-2 shrink-0">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={currentLeadId ? 'Question sur ce lead...' : 'Pose ta question...'}
                  className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none bg-gray-50"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="p-2 bg-primary hover:bg-primary-dark text-white rounded-xl transition disabled:opacity-40 shrink-0"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  )
}
