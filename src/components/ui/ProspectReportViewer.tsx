'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  FileText, Download, Save, RefreshCw, Loader2,
  Sparkles, Phone, Target, MessageSquare,
  GraduationCap, Wallet, Edit3, Zap, Shield,
  MapPin, TrendingUp, Clock, ChevronDown, ChevronUp
} from 'lucide-react'
import { Badge } from '@/components/ui'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { ProspectNarrative } from '@/lib/prospect-narrator'

interface ProspectReportViewerProps {
  leadId: string
  leadName?: string
}

export function ProspectReportViewer({ leadId, leadName }: ProspectReportViewerProps) {
  const [editing, setEditing] = useState(false)
  const [editedNarrative, setEditedNarrative] = useState<ProspectNarrative | null>(null)
  const [selectedVersion, setSelectedVersion] = useState<string>('latest')
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['brief', 'strategie', 'script']))
  const queryClient = useQueryClient()

  const toggleSection = (s: string) => setExpandedSections(prev => {
    const next = new Set(prev)
    next.has(s) ? next.delete(s) : next.add(s)
    return next
  })

  // Fetch report
  const { data: reportData, isLoading } = useQuery({
    queryKey: ['prospect-report', leadId, selectedVersion],
    queryFn: async () => {
      const res = await fetch(`/api/enrichment/report?leadId=${leadId}&version=${selectedVersion}`)
      if (res.status === 404) return null
      if (!res.ok) throw new Error('Erreur chargement rapport')
      return res.json()
    },
  })

  // Generate report
  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/enrichment/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId }),
      })
      if (!res.ok) throw new Error('Erreur génération')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prospect-report', leadId] })
      toast.success('Briefing commercial généré')
    },
    onError: () => toast.error('Erreur lors de la génération'),
  })

  // Save edited version
  const saveMutation = useMutation({
    mutationFn: async (narrative: ProspectNarrative) => {
      const res = await fetch('/api/enrichment/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, narrative }),
      })
      if (!res.ok) throw new Error('Erreur sauvegarde')
      return res.json()
    },
    onSuccess: (data) => {
      setEditing(false)
      setEditedNarrative(null)
      queryClient.invalidateQueries({ queryKey: ['prospect-report', leadId] })
      toast.success(`Version ${data.version} sauvegardée`)
    },
  })

  const report = reportData?.report
  const versions = reportData?.versions || []
  const n: ProspectNarrative | null = editing && editedNarrative ? editedNarrative : report?.narrative || null

  // ── Pas de rapport → bouton générer ──
  if (!isLoading && !n) {
    return (
      <div className="bg-gradient-to-br from-sky-50 to-white rounded-xl border border-sky-200/50 p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
          <Zap className="w-6 h-6 text-primary" />
        </div>
        <h3 className="text-sm font-bold text-gray-900 mb-1">
          Briefing Commercial IA
        </h3>
        <p className="text-xs text-gray-500 mb-4 max-w-xs mx-auto">
          Enrichissement intelligent + analyse IA + stratégie de vente personnalisée + script téléphonique
        </p>
        <button
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isPending}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-[#0284C7] transition disabled:opacity-50 shadow-sm shadow-[#2EC6F3]/20"
        >
          {generateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {generateMutation.isPending ? 'Analyse en cours...' : 'Générer le briefing'}
        </button>
        {generateMutation.isPending && (
          <div className="mt-3 space-y-1">
            <p className="text-[10px] text-gray-400">SIRET → Pappers → Google → Réseaux → IA...</p>
            <div className="w-32 h-1 bg-gray-200 rounded-full mx-auto overflow-hidden">
              <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: '60%' }} />
            </div>
          </div>
        )}
      </div>
    )
  }

  if (isLoading) {
    return <div className="bg-white rounded-xl border p-6 animate-pulse"><div className="h-4 bg-gray-200 rounded w-1/2 mb-3" /><div className="h-3 bg-gray-100 rounded w-3/4 mb-2" /><div className="h-3 bg-gray-100 rounded w-2/3" /></div>
  }

  if (!n) return null

  const scoreColor = n.score_chaleur >= 60 ? 'bg-emerald-500' : n.score_chaleur >= 30 ? 'bg-amber-500' : 'bg-red-500'
  const badgeVariant = n.classification === 'CHAUD' ? 'success' as const : n.classification === 'TIEDE' ? 'warning' as const : 'default' as const

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      {/* ── HEADER ── */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#082545] to-[#0F3460]">
        <div className="flex items-center gap-2.5">
          <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold', scoreColor)}>
            {n.score_chaleur}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Briefing Commercial</h3>
            <p className="text-[10px] text-white/60">{leadName}</p>
          </div>
          <Badge variant={badgeVariant} size="sm">{n.classification}</Badge>
        </div>

        <div className="flex items-center gap-1.5">
          {versions.length > 1 && (
            <select value={selectedVersion} onChange={(e) => setSelectedVersion(e.target.value)}
              className="text-[10px] border border-white/20 rounded px-1.5 py-1 bg-white/10 text-white">
              <option value="latest" className="text-gray-900">Dernière</option>
              {versions.map((v: any) => (
                <option key={v.version} value={v.version} className="text-gray-900">v{v.version}</option>
              ))}
            </select>
          )}
          <button onClick={() => { editing ? (setEditing(false), setEditedNarrative(null)) : (setEditing(true), setEditedNarrative({ ...n })) }}
            className={cn('p-1.5 rounded-md transition', editing ? 'bg-amber-400/20 text-amber-300' : 'hover:bg-white/10 text-white/70')}>
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          {editing && editedNarrative && (
            <button onClick={() => saveMutation.mutate(editedNarrative)} disabled={saveMutation.isPending}
              className="flex items-center gap-1 px-2 py-1 bg-emerald-500 text-white rounded text-[10px] font-medium hover:bg-emerald-600 transition">
              {saveMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Sauver
            </button>
          )}
          <button onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending}
            className="p-1.5 rounded-md hover:bg-white/10 text-white/70 transition">
            <RefreshCw className={cn('w-3.5 h-3.5', generateMutation.isPending && 'animate-spin')} />
          </button>
          <button onClick={() => window.open(`/api/enrichment/report/pdf?leadId=${leadId}`, '_blank')}
            className="flex items-center gap-1 px-2 py-1 bg-white/10 text-white rounded text-[10px] font-medium hover:bg-white/20 transition">
            <Download className="w-3 h-3" /> PDF
          </button>
          <button onClick={() => window.open(`/api/enrichment/report/word?leadId=${leadId}`, '_blank')}
            className="flex items-center gap-1 px-2 py-1 bg-white/10 text-white rounded text-[10px] font-medium hover:bg-white/20 transition">
            <FileText className="w-3 h-3" /> Word
          </button>
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        {/* ── VERDICT (toujours visible) ── */}
        <div className={cn('px-4 py-3', n.classification === 'CHAUD' ? 'bg-emerald-50' : n.classification === 'TIEDE' ? 'bg-amber-50' : 'bg-gray-50')}>
          <p className={cn('text-sm font-semibold', n.classification === 'CHAUD' ? 'text-emerald-800' : n.classification === 'TIEDE' ? 'text-amber-800' : 'text-gray-700')}>
            {n.verdict}
          </p>
        </div>

        {/* ── BRIEF COMMERCIAL ── */}
        <CollapsibleSection icon={<Zap />} title="Le brief" id="brief" expanded={expandedSections} toggle={toggleSection}>
          <EditableText value={n.brief_commercial} editing={editing} onChange={(v) => editedNarrative && setEditedNarrative({ ...editedNarrative, brief_commercial: v })} />
        </CollapsibleSection>

        {/* ── HISTOIRE ── */}
        <CollapsibleSection icon={<FileText />} title="Qui est ce prospect ?" id="histoire" expanded={expandedSections} toggle={toggleSection}>
          <EditableText value={n.histoire_prospect} editing={editing} onChange={(v) => editedNarrative && setEditedNarrative({ ...editedNarrative, histoire_prospect: v })} />
        </CollapsibleSection>

        {/* ── SITUATION BUSINESS ── */}
        <CollapsibleSection icon={<TrendingUp />} title="Sa situation business" id="business" expanded={expandedSections} toggle={toggleSection}>
          <EditableText value={n.situation_business} editing={editing} onChange={(v) => editedNarrative && setEditedNarrative({ ...editedNarrative, situation_business: v })} />
          {n.reputation_visibilite && (
            <div className="mt-2 pt-2 border-t border-gray-100">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Réputation & visibilité</p>
              <EditableText value={n.reputation_visibilite} editing={editing} onChange={(v) => editedNarrative && setEditedNarrative({ ...editedNarrative, reputation_visibilite: v })} />
            </div>
          )}
        </CollapsibleSection>

        {/* ── ATOUTS / PIÈGES ── */}
        <CollapsibleSection icon={<Target />} title="Tes atouts pour vendre" id="atouts" expanded={expandedSections} toggle={toggleSection}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1.5">Utilise ça</p>
              {n.atouts_vente.map((a, i) => (
                <p key={i} className="text-xs text-emerald-800 mb-1.5 pl-3 border-l-2 border-emerald-300">✓ {a}</p>
              ))}
            </div>
            <div>
              <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1.5">Évite ça</p>
              {n.pieges_eviter.map((p, i) => (
                <p key={i} className="text-xs text-amber-800 mb-1.5 pl-3 border-l-2 border-amber-300">⚠ {p}</p>
              ))}
            </div>
          </div>
        </CollapsibleSection>

        {/* ── STRATÉGIE D'APPROCHE ── */}
        <CollapsibleSection icon={<Phone />} title="Ta stratégie d'approche" id="strategie" expanded={expandedSections} toggle={toggleSection}>
          {n.strategie && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              <MiniCard label="Canal" value={n.strategie.canal} icon="📞" />
              <MiniCard label="Meilleur moment" value={n.strategie.meilleur_moment} icon="🕐" />
              <MiniCard label="Durée estimée" value={n.strategie.duree_estimee} icon="⏱" />
              <div className="col-span-2 md:col-span-3">
                <MiniCard label="Angle d'attaque" value={n.strategie.angle_attaque} icon="🎯" />
              </div>
              <div className="col-span-2 md:col-span-3">
                <MiniCard label="Objectif de l'appel" value={n.strategie.objectif_appel} icon="✅" />
              </div>
            </div>
          )}
        </CollapsibleSection>

        {/* ── SCRIPT TÉLÉPHONIQUE ── */}
        <CollapsibleSection icon={<MessageSquare />} title="Ton script téléphonique" id="script" expanded={expandedSections} toggle={toggleSection}>
          {n.script_telephone && (
            <div className="space-y-3">
              <ScriptLine label="Accroche" text={n.script_telephone.accroche} color="sky" />
              <ScriptLine label="Transition" text={n.script_telephone.transition} color="indigo" />
              <ScriptLine label="Proposition" text={n.script_telephone.proposition} color="emerald" />
              <ScriptLine label="Closing" text={n.script_telephone.closing} color="violet" />

              <div className="bg-amber-50 rounded-lg p-3 mt-2">
                <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-2">Si objection...</p>
                <div className="space-y-2">
                  <ObjLine label="💰 Trop cher" text={n.script_telephone.si_objection_prix} />
                  <ObjLine label="⏰ Pas le temps" text={n.script_telephone.si_objection_temps} />
                  <ObjLine label="🤷 Pas besoin" text={n.script_telephone.si_objection_besoin} />
                </div>
              </div>
            </div>
          )}
        </CollapsibleSection>

        {/* ── FORMATIONS ── */}
        <CollapsibleSection icon={<GraduationCap />} title="Formations à proposer" id="formations" expanded={expandedSections} toggle={toggleSection}>
          <div className="space-y-2">
            {n.formations_recommandees?.map((f, i) => (
              <div key={i} className={cn(
                'rounded-lg p-3 border',
                f.niveau_priorite === 'principal' ? 'bg-sky-50 border-sky-200' : 'bg-gray-50 border-gray-200'
              )}>
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-accent">{f.nom}</span>
                    {f.niveau_priorite === 'principal' && (
                      <span className="text-[9px] bg-sky-200 text-sky-800 px-1.5 py-0.5 rounded font-medium">PRIORITAIRE</span>
                    )}
                  </div>
                  <span className="text-xs font-bold text-primary">{f.prix}</span>
                </div>
                <p className="text-[11px] text-gray-700 mb-1">{f.pourquoi_elle}</p>
                <p className="text-[10px] text-emerald-700 font-medium">💰 {f.argument_roi}</p>
              </div>
            ))}
          </div>
        </CollapsibleSection>

        {/* ── FINANCEMENT ── */}
        <CollapsibleSection icon={<Wallet />} title="Comment parler financement" id="financement" expanded={expandedSections} toggle={toggleSection}>
          {n.strategie_financement && (
            <div className="space-y-2">
              <MiniCard label="Option principale" value={n.strategie_financement.option_principale} icon="🏆" />
              <MiniCard label="Comment en parler" value={n.strategie_financement.comment_presenter} icon="💡" />
              <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
                <p className="text-[10px] font-bold text-emerald-700 mb-1">LA phrase à dire :</p>
                <p className="text-xs text-emerald-900 italic">« {n.strategie_financement.phrase_cle} »</p>
              </div>
              {n.strategie_financement.alternatives?.length > 0 && (
                <div className="text-[10px] text-gray-500">
                  Alternatives : {n.strategie_financement.alternatives.join(' • ')}
                </div>
              )}
            </div>
          )}
        </CollapsibleSection>

        {/* ── PLAN D'ACTION ── */}
        <CollapsibleSection icon={<Clock />} title="Plan d'action" id="plan" expanded={expandedSections} toggle={toggleSection}>
          {n.plan_action && (
            <div className="space-y-2">
              <ActionStep num={1} text={n.plan_action.action_1} color="emerald" />
              <ActionStep num={2} text={n.plan_action.action_2} color="sky" />
              <ActionStep num={3} text={n.plan_action.action_3} color="violet" />
              <div className="flex items-center gap-2 pl-6 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                {n.plan_action.rappel}
              </div>
            </div>
          )}
        </CollapsibleSection>
      </div>
    </div>
  )
}

// ── Sous-composants ────────────────────────────────────────

function CollapsibleSection({ icon, title, id, expanded, toggle, children }: {
  icon: React.ReactNode; title: string; id: string; expanded: Set<string>; toggle: (s: string) => void; children: React.ReactNode
}) {
  const isOpen = expanded.has(id)
  return (
    <div>
      <button onClick={() => toggle(id)} className="flex items-center justify-between w-full px-4 py-2.5 hover:bg-gray-50 transition">
        <div className="flex items-center gap-2">
          <span className="text-primary w-4 h-4 [&>svg]:w-4 [&>svg]:h-4">{icon}</span>
          <span className="text-xs font-semibold text-accent">{title}</span>
        </div>
        {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
      </button>
      {isOpen && <div className="px-4 pb-3">{children}</div>}
    </div>
  )
}

function EditableText({ value, editing, onChange }: { value: string; editing: boolean; onChange: (v: string) => void }) {
  if (editing) {
    return <textarea value={value} onChange={(e) => onChange(e.target.value)}
      className="w-full text-xs text-gray-800 bg-white border border-gray-200 rounded-lg p-2 resize-none focus:outline-none focus:border-primary min-h-[60px]" />
  }
  return <p className="text-xs text-gray-700 leading-relaxed">{value}</p>
}

function MiniCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-100">
      <p className="text-[10px] text-gray-400 mb-0.5">{icon} {label}</p>
      <p className="text-xs text-gray-800">{value}</p>
    </div>
  )
}

function ScriptLine({ label, text, color }: { label: string; text: string; color: string }) {
  const colors: Record<string, string> = {
    sky: 'border-l-sky-400 bg-sky-50',
    indigo: 'border-l-indigo-400 bg-indigo-50',
    emerald: 'border-l-emerald-400 bg-emerald-50',
    violet: 'border-l-violet-400 bg-violet-50',
  }
  return (
    <div className={cn('border-l-3 rounded-r-lg p-2.5', colors[color] || 'border-l-gray-400 bg-gray-50')}>
      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-xs text-gray-800 italic">« {text} »</p>
    </div>
  )
}

function ObjLine({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-amber-800">{label}</p>
      <p className="text-xs text-amber-900">→ {text}</p>
    </div>
  )
}

function ActionStep({ num, text, color }: { num: number; text: string; color: string }) {
  const colors: Record<string, string> = { emerald: 'bg-emerald-500', sky: 'bg-sky-500', violet: 'bg-violet-500' }
  return (
    <div className="flex items-start gap-2.5">
      <div className={cn('w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 mt-0.5', colors[color] || 'bg-gray-500')}>
        {num}
      </div>
      <p className="text-xs text-gray-800">{text}</p>
    </div>
  )
}
