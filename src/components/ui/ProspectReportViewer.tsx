'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  FileText, Download, Save, RefreshCw, Loader2,
  Sparkles, Phone, Target, MessageSquare,
  GraduationCap, Wallet, Edit3, Zap, Shield,
  MapPin, TrendingUp, Clock, ChevronDown, ChevronUp,
  Star, Scissors
} from 'lucide-react'
import { Badge } from '@/components/ui'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { ProspectNarrative } from '@/lib/prospect/narrator'

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
        <h3 className="text-sm font-bold text-[#111111] mb-1">
          Briefing Commercial IA
        </h3>
        <p className="text-xs text-[#777777] mb-4 max-w-xs mx-auto">
          Enrichissement intelligent + analyse IA + stratégie de vente personnalisée + script téléphonique
        </p>
        <button
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isPending}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-dark transition disabled:opacity-50 shadow-sm shadow-primary/20"
        >
          {generateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {generateMutation.isPending ? 'Analyse en cours...' : 'Générer le briefing'}
        </button>
        {generateMutation.isPending && (
          <div className="mt-3 space-y-1">
            <p className="text-[10px] text-[#999999]">SIRET → Pappers → Google → Réseaux → IA...</p>
            <div className="w-32 h-1 bg-[#EEEEEE] rounded-full mx-auto overflow-hidden">
              <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: '60%' }} />
            </div>
          </div>
        )}
      </div>
    )
  }

  if (isLoading) {
    return <div className="bg-white rounded-xl border p-6 animate-pulse"><div className="h-4 bg-[#EEEEEE] rounded w-1/2 mb-3" /><div className="h-3 bg-[#F5F5F5] rounded w-3/4 mb-2" /><div className="h-3 bg-[#F5F5F5] rounded w-2/3" /></div>
  }

  if (!n) return null

  const scoreColor = n.score_chaleur >= 60 ? 'bg-emerald-500' : n.score_chaleur >= 30 ? 'bg-[#FF8C42]' : 'bg-[#FF2D78]'
  const badgeVariant = n.classification === 'CHAUD' ? 'success' as const : n.classification === 'TIEDE' ? 'warning' as const : 'default' as const

  return (
    <div className="bg-white rounded-xl border border-[#F0F0F0] overflow-hidden shadow-sm">
      {/* ── HEADER ── */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-accent to-accent-light">
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
              <option value="latest" className="text-[#111111]">Dernière</option>
              {versions.map((v: any) => (
                <option key={v.version} value={v.version} className="text-[#111111]">v{v.version}</option>
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

      <div className="divide-y divide-[#F0F0F0]">
        {/* ── VERDICT (toujours visible) ── */}
        <div className={cn('px-4 py-3', n.classification === 'CHAUD' ? 'bg-emerald-50' : n.classification === 'TIEDE' ? 'bg-[#FFF3E8]' : 'bg-[#FAFAFA]')}>
          <p className={cn('text-sm font-semibold', n.classification === 'CHAUD' ? 'text-emerald-800' : n.classification === 'TIEDE' ? 'text-[#FF8C42]' : 'text-[#3A3A3A]')}>
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
            <div className="mt-2 pt-2 border-t border-[#F0F0F0]">
              <p className="text-[10px] font-semibold text-[#999999] uppercase tracking-wider mb-1">Réputation & visibilité</p>
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
              <p className="text-[10px] font-bold text-[#FF8C42] uppercase tracking-wider mb-1.5">Évite ça</p>
              {n.pieges_eviter.map((p, i) => (
                <p key={i} className="text-xs text-[#FF8C42] mb-1.5 pl-3 border-l-2 border-amber-300">⚠ {p}</p>
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

              <div className="bg-[#FFF3E8] rounded-lg p-3 mt-2">
                <p className="text-[10px] font-bold text-[#FF8C42] uppercase tracking-wider mb-2">Si objection...</p>
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
                f.niveau_priorite === 'principal' ? 'bg-sky-50 border-sky-200' : 'bg-[#FAFAFA] border-[#F0F0F0]'
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
                <p className="text-[11px] text-[#3A3A3A] mb-1">{f.pourquoi_elle}</p>
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
                <div className="text-[10px] text-[#777777]">
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
              <div className="flex items-center gap-2 pl-6 text-xs text-[#777777]">
                <Clock className="w-3 h-3" />
                {n.plan_action.rappel}
              </div>
            </div>
          )}
        </CollapsibleSection>

        {/* ── RÉPUTATION MULTI-PLATEFORMES ── */}
        {reportData?.intelligence?.plateformes_avis?.length > 0 && (
          <CollapsibleSection icon={<Star />} title="Réputation Multi-Plateformes" id="reputation-plateformes" expanded={expandedSections} toggle={toggleSection}>
            <div className="space-y-2">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-1 text-[#777777] font-medium">Plateforme</th>
                      <th className="text-left py-1 text-[#777777] font-medium">Note</th>
                      <th className="text-left py-1 text-[#777777] font-medium">Nb Avis</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.intelligence.plateformes_avis.map((p: any, i: number) => (
                      <tr key={i} className="border-b border-[#F0F0F0]">
                        <td className="py-2 font-medium text-[#1A1A1A]">{p.plateforme}</td>
                        <td className="py-2">
                          {p.note && (
                            <div className="flex items-center gap-2">
                              <div className="w-12 bg-[#EEEEEE] rounded-full h-1.5">
                                <div
                                  className={cn("h-1.5 rounded-full", p.note >= 4 ? "bg-orange-500" : "bg-[#999999]")}
                                  style={{ width: `${(p.note / 5) * 100}%` }}
                                />
                              </div>
                              <span className="text-xs font-medium">{p.note}/5</span>
                            </div>
                          )}
                        </td>
                        <td className="py-2 text-[#777777]">{p.nb_avis || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="text-xs text-[#777777] pt-2 border-t border-[#F0F0F0]">
                Total avis : {reportData.intelligence.plateformes_avis.reduce((acc: number, p: any) => acc + (p.nb_avis || 0), 0)}
              </div>
            </div>
          </CollapsibleSection>
        )}

        {/* ── CARTE DES SOINS ── */}
        {reportData?.intelligence?.carte_soins?.length > 0 && (
          <CollapsibleSection icon={<Scissors />} title="Carte des Soins" id="carte-soins" expanded={expandedSections} toggle={toggleSection}>
            <div className="space-y-2">
              <p className="text-xs text-[#777777]">
                {reportData.intelligence.carte_soins.length} soins détectés sur les plateformes de réservation
              </p>
              <div className="flex flex-wrap gap-1.5">
                {reportData.intelligence.carte_soins.map((soin: any, i: number) => (
                  <span
                    key={i}
                    className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-full border border-primary/20"
                  >
                    {soin}
                  </span>
                ))}
              </div>
            </div>
          </CollapsibleSection>
        )}

        {/* ── CONCURRENCE LOCALE ── */}
        {reportData?.intelligence?.concurrents_zone?.length > 0 && (
          <CollapsibleSection icon={<MapPin />} title="Concurrence Locale" id="concurrence" expanded={expandedSections} toggle={toggleSection}>
            <div className="space-y-2">
              <p className="text-xs text-[#777777]">
                {reportData.intelligence.concurrents_zone.length} établissements beauté dans un rayon de 2km
              </p>
              {reportData.intelligence.signaux?.zone_saturee && (
                <div className="inline-flex items-center px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full border border-orange-200">
                  Zone saturée
                </div>
              )}
              <div className="space-y-1">
                {reportData.intelligence.concurrents_zone.slice(0, 5).map((c: any, i: number) => (
                  <div key={i} className="flex items-center justify-between py-1.5 px-2 bg-[#FAFAFA] rounded-lg">
                    <div>
                      <span className="text-xs font-medium text-[#1A1A1A]">{c.nom || 'Sans nom'}</span>
                      <span className="ml-2 text-xs text-[#777777] capitalize">{c.type}</span>
                    </div>
                    {c.distance_metres && (
                      <span className="text-xs text-[#777777]">{c.distance_metres}m</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </CollapsibleSection>
        )}

        {/* ── FINANCEMENT & CONVENTION ── */}
        {(reportData?.intelligence?.convention_collective || reportData?.intelligence?.aides_disponibles?.length > 0) && (
          <CollapsibleSection icon={<Wallet />} title="Financement & Convention" id="financement-convention" expanded={expandedSections} toggle={toggleSection}>
            <div className="space-y-3">
              {reportData.intelligence.convention_collective && (
                <div className="bg-[#E0EBF5] rounded-lg p-3 border border-[#6B8CAE]/30">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-[#6B8CAE]">
                      IDCC {reportData.intelligence.convention_collective.code_convention} — {reportData.intelligence.convention_collective.intitule}
                    </span>
                    {reportData.intelligence.convention_collective.est_secteur_beaute && (
                      <span className="px-1.5 py-0.5 text-[10px] bg-emerald-200 text-emerald-800 rounded font-medium">
                        Secteur beauté
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#6B8CAE]">
                    {reportData.intelligence.convention_collective.droit_formation_heures}h/an de formation
                  </p>
                </div>
              )}

              {reportData.intelligence.aides_disponibles?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-[#3A3A3A] mb-2">Aides disponibles :</p>
                  <div className="space-y-2">
                    {reportData.intelligence.aides_disponibles.map((aide: any, i: number) => (
                      <div key={i} className="flex items-center justify-between py-1.5 px-2 bg-[#ECFDF5] rounded-lg border border-[#10B981]/30">
                        <div>
                          <span className="text-xs font-medium text-[#10B981]">{aide.nom}</span>
                          <span className="ml-2 text-xs text-[#10B981]">{aide.financeur}</span>
                        </div>
                        {aide.montant_max && (
                          <span className="text-xs font-bold text-[#10B981]">{aide.montant_max}€</span>
                        )}
                      </div>
                    ))}
                    <div className="text-xs text-[#10B981] font-medium pt-1 border-t border-[#10B981]/30">
                      Total cumulé : {reportData.intelligence.aides_disponibles.reduce((acc: number, a: any) => acc + (a.montant_max || 0), 0)}€
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CollapsibleSection>
        )}

        {/* ── SIGNAUX COMMERCIAUX ── */}
        {reportData?.intelligence?.signaux && (
          <CollapsibleSection icon={<Zap />} title="Signaux Commerciaux" id="signaux" expanded={expandedSections} toggle={toggleSection}>
            <div className="flex flex-wrap gap-2">
              {reportData.intelligence.signaux.est_sur_promo && (
                <span className="px-2 py-1 text-xs bg-pink-100 text-pink-800 rounded-full border border-pink-200">
                  Sur plateforme promo
                </span>
              )}
              {reportData.intelligence.signaux.est_organisme_concurrent && (
                <span className="px-2 py-1 text-xs bg-[#FFE0EF] text-[#FF2D78] rounded-full border border-[#FF2D78]/30">
                  Concurrent OF
                </span>
              )}
              {reportData.intelligence.signaux.avis_insuffisants && (
                <span className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full border border-orange-200">
                  Peu d'avis en ligne
                </span>
              )}
              {reportData.intelligence.signaux.zone_saturee && (
                <span className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full border border-orange-200">
                  Zone saturée
                </span>
              )}
              {reportData.intelligence.signaux.droits_formation_non_consommes && (
                <span className="px-2 py-1 text-xs bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">
                  Droits formation dispo
                </span>
              )}
              {reportData.intelligence.signaux.en_difficulte && (
                <span className="px-2 py-1 text-xs bg-[#FFE0EF] text-[#FF2D78] rounded-full border border-[#FF2D78]/30">
                  Difficulté financière
                </span>
              )}
            </div>
          </CollapsibleSection>
        )}
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
      <button onClick={() => toggle(id)} className="flex items-center justify-between w-full px-4 py-2.5 hover:bg-[#FAFAFA] transition">
        <div className="flex items-center gap-2">
          <span className="text-primary w-4 h-4 [&>svg]:w-4 [&>svg]:h-4">{icon}</span>
          <span className="text-xs font-semibold text-accent">{title}</span>
        </div>
        {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-[#999999]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#999999]" />}
      </button>
      {isOpen && <div className="px-4 pb-3">{children}</div>}
    </div>
  )
}

function EditableText({ value, editing, onChange }: { value: string; editing: boolean; onChange: (v: string) => void }) {
  if (editing) {
    return <textarea value={value} onChange={(e) => onChange(e.target.value)}
      className="w-full text-xs text-[#1A1A1A] bg-white border border-[#F0F0F0] rounded-lg p-2 resize-none focus:outline-none focus:border-primary min-h-[60px]" />
  }
  return <p className="text-xs text-[#3A3A3A] leading-relaxed">{value}</p>
}

function MiniCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="bg-[#FAFAFA] rounded-lg p-2.5 border border-[#F0F0F0]">
      <p className="text-[10px] text-[#999999] mb-0.5">{icon} {label}</p>
      <p className="text-xs text-[#1A1A1A]">{value}</p>
    </div>
  )
}

function ScriptLine({ label, text, color }: { label: string; text: string; color: string }) {
  const colors: Record<string, string> = {
    sky: 'border-l-sky-400 bg-sky-50',
    indigo: 'border-l-[#FF5C00] bg-[#FFF0E5]',
    emerald: 'border-l-emerald-400 bg-emerald-50',
    violet: 'border-l-[#FF2D78] bg-[#FFE0EF]',
  }
  return (
    <div className={cn('border-l-3 rounded-r-lg p-2.5', colors[color] || 'border-l-gray-400 bg-[#FAFAFA]')}>
      <p className="text-[10px] font-bold text-[#777777] uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-xs text-[#1A1A1A] italic">« {text} »</p>
    </div>
  )
}

function ObjLine({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-[#FF8C42]">{label}</p>
      <p className="text-xs text-[#FF8C42]">→ {text}</p>
    </div>
  )
}

function ActionStep({ num, text, color }: { num: number; text: string; color: string }) {
  const colors: Record<string, string> = { emerald: 'bg-emerald-500', sky: 'bg-sky-500', violet: 'bg-[#FFE0EF]0' }
  return (
    <div className="flex items-start gap-2.5">
      <div className={cn('w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 mt-0.5', colors[color] || 'bg-[#FAFAFA]0')}>
        {num}
      </div>
      <p className="text-xs text-[#1A1A1A]">{text}</p>
    </div>
  )
}
