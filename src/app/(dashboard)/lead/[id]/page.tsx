'use client'

export const dynamic = 'force-dynamic'

import { use, useState, useEffect, useCallback, lazy, Suspense } from 'react'
import Link from 'next/link'
import { useLead, useUpdateLead, useChangeStatut } from '@/hooks/use-leads'
import { trackLeadView } from '@/components/ui/CommandPalette'
import { useMessages, useSendMessage } from '@/hooks/use-messages'
import { useCadenceInstances } from '@/hooks/use-cadences'
import { useAIResearch } from '@/hooks/use-ai'
import { STATUTS_LEAD, type Lead, type StatutLead, type Message, type CanalMessage, type Inscription, type Financement } from '@/types'
import { formatEuro, formatDate, formatPhone } from '@/lib/utils'
import { getScoreColor, getScoreLabel } from '@/lib/scoring'
import { ActivityTimeline } from '@/components/ui/ActivityTimeline'
import { InscrireLeadDialog } from '@/components/ui/InscrireLeadDialog'
import { AssignCommercialDialog } from '@/components/ui/AssignCommercialDialog'
import { PaymentLinkButton } from '@/components/ui/PaymentLinkButton'
import { ProspectReportViewer } from '@/components/ui/ProspectReportViewer'
import { ProspectReviewsPanel } from '@/components/ui/ProspectReviewsPanel'
import { EnrichedDataSection } from '@/components/crm/EnrichedDataSection'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { toast } from 'sonner'
import {
  ArrowLeft, Phone, Mail, MessageCircle, MessageSquare,
  User, MessageSquareText, CreditCard, FileText, Clock,
  Edit3, Save, Plus, Send, Check, X,
  Tag, MapPin, GraduationCap, Building2,
  Target, Play, Pause, AlertCircle, Download,
  Wallet, Circle, CheckCircle, ChevronDown, Copy,
  Sparkles, Calendar,
  MoreHorizontal, FolderOpen, Activity
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { IllustrationEmptyDossier, IllustrationEmptyDocuments, IllustrationEmptyMessages } from '@/components/ui/Illustrations'

// Briques CRM intelligentes
import LeadActionHub from '@/components/crm/LeadActionHub'
import FormationSuggester from '@/components/crm/FormationSuggester'
import FinancementExpress from '@/components/crm/FinancementExpress'
const WizardInscription = lazy(() => import('@/components/crm/WizardInscription'))

// ===== TYPES & CONFIG =====

// Layout 2 colonnes — plus de tabs

const CANAUX_MESSAGE: { id: CanalMessage; label: string; icon: React.ElementType; color: string; hint: string }[] = [
  { id: 'email', label: 'Email', icon: Mail, color: '#3B82F6', hint: 'Envoi via Resend' },
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, color: '#22C55E', hint: 'Ouvre WhatsApp' },
  { id: 'sms', label: 'SMS', icon: MessageSquare, color: '#8B5CF6', hint: 'Envoi SMS' },
  { id: 'appel', label: 'Appel', icon: Phone, color: '#F59E0B', hint: 'Logger un appel' },
  { id: 'note_interne', label: 'Note', icon: Edit3, color: '#6B7280', hint: 'Note interne' },
]

const STATUT_PRO_OPTIONS = [
  { value: 'salariee', label: 'Salariée' },
  { value: 'independante', label: 'Indépendante' },
  { value: 'auto_entrepreneur', label: 'Auto-entrepreneur' },
  { value: 'demandeur_emploi', label: 'Demandeur d\'emploi' },
  { value: 'reconversion', label: 'En reconversion' },
  { value: 'etudiante', label: 'Étudiante' },
  { value: 'gerant_institut', label: 'Gérante institut' },
  { value: 'autre', label: 'Autre' },
]

const EXPERIENCE_OPTIONS = [
  { value: 'aucune', label: 'Aucune' },
  { value: 'debutante', label: 'Débutante' },
  { value: 'intermediaire', label: 'Intermédiaire' },
  { value: 'confirmee', label: 'Confirmée' },
  { value: 'experte', label: 'Experte' },
]

const VALID_LEAD_TRANSITIONS: Record<StatutLead, StatutLead[]> = {
  NOUVEAU: ['CONTACTE', 'QUALIFIE', 'PERDU', 'SPAM'],
  CONTACTE: ['QUALIFIE', 'FINANCEMENT_EN_COURS', 'PERDU', 'REPORTE', 'SPAM'],
  QUALIFIE: ['FINANCEMENT_EN_COURS', 'INSCRIT', 'PERDU', 'REPORTE'],
  FINANCEMENT_EN_COURS: ['INSCRIT', 'PERDU', 'REPORTE', 'QUALIFIE'],
  INSCRIT: ['EN_FORMATION', 'PERDU', 'REPORTE'],
  EN_FORMATION: ['FORME', 'PERDU'],
  FORME: ['ALUMNI', 'PERDU'],
  ALUMNI: ['QUALIFIE'],
  PERDU: ['NOUVEAU', 'CONTACTE'],
  REPORTE: ['CONTACTE', 'QUALIFIE', 'PERDU'],
  SPAM: [],
}

// Parcours client — micro-stepper
const ETAPES_PARCOURS: { id: string; label: string; statuts: string[] }[] = [
  { id: 'prospect', label: 'Prospect', statuts: ['NOUVEAU', 'CONTACTE'] },
  { id: 'qualifie', label: 'Qualifié', statuts: ['QUALIFIE'] },
  { id: 'financement', label: 'Finance', statuts: ['FINANCEMENT_EN_COURS'] },
  { id: 'inscrit', label: 'Inscrit', statuts: ['INSCRIT'] },
  { id: 'formation', label: 'Formation', statuts: ['EN_FORMATION'] },
  { id: 'forme', label: 'Formé', statuts: ['FORME', 'ALUMNI'] },
]

function getEtapeIndex(statut: StatutLead): number {
  for (let i = 0; i < ETAPES_PARCOURS.length; i++) {
    if (ETAPES_PARCOURS[i].statuts.includes(statut)) return i
  }
  return -1
}

// ===== MAIN PAGE =====

export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [isEditing, setIsEditing] = useState(false)
  const [editedLead, setEditedLead] = useState<Partial<Lead>>({})
  const [newTag, setNewTag] = useState('')
  const [messageCanal, setMessageCanal] = useState<CanalMessage>('email')
  const [messageContent, setMessageContent] = useState('')
  const [messageSubject, setMessageSubject] = useState('')
  const [showInscrire, setShowInscrire] = useState(false)
  const [showAssign, setShowAssign] = useState(false)
  const [showStatutMenu, setShowStatutMenu] = useState(false)
  const [showMoreActions, setShowMoreActions] = useState(false)
  const [showWizard, setShowWizard] = useState(false)
  const [researchData, setResearchData] = useState<Record<string, unknown> | null>(null)

  const { data: lead, isLoading } = useLead(id)
  const { data: messages = [] } = useMessages(id)
  const { data: cadenceInstances = [] } = useCadenceInstances({ lead_id: id, statut: 'active' })

  useEffect(() => {
    if (lead) trackLeadView(id, `${lead.prenom} ${lead.nom}`, lead.email)
  }, [lead, id])

  const updateLead = useUpdateLead()
  const changeStatut = useChangeStatut()
  const sendMessage = useSendMessage()
  const aiResearch = useAIResearch()

  const handleSave = useCallback(async () => {
    try {
      await updateLead.mutateAsync({ id, ...editedLead })
      setIsEditing(false)
      setEditedLead({})
    } catch { /* toast géré par le hook */ }
  }, [id, editedLead, updateLead])

  const handleChangeStatut = useCallback(async (newStatut: StatutLead) => {
    setShowStatutMenu(false)
    try {
      await changeStatut.mutateAsync({ id, statut: newStatut })
    } catch { /* toast géré par le hook */ }
  }, [id, changeStatut])

  const handleAddTag = useCallback(() => {
    if (!newTag.trim() || lead?.tags.includes(newTag)) return
    updateLead.mutate({ id, tags: [...(lead?.tags || []), newTag.trim()] })
    setNewTag('')
  }, [newTag, lead, id, updateLead])

  const handleRemoveTag = useCallback((tag: string) => {
    updateLead.mutate({ id, tags: (lead?.tags || []).filter(t => t !== tag) })
  }, [lead, id, updateLead])

  const handleSendMessage = useCallback(async () => {
    if (!messageContent.trim()) return
    try {
      await sendMessage.mutateAsync({
        lead_id: id, canal: messageCanal,
        contenu: messageContent, sujet: messageSubject || undefined
      })
      setMessageContent('')
      setMessageSubject('')
      toast.success('Message envoyé')
    } catch { /* toast géré par le hook */ }
  }, [id, messageCanal, messageContent, messageSubject, sendMessage])

  const handleCopy = useCallback((text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copié`)
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="skeleton h-5 w-5 rounded" />
          <div className="skeleton h-12 w-12 rounded-full" />
          <div className="space-y-2"><div className="skeleton h-6 w-48" /><div className="skeleton h-4 w-32" /></div>
        </div>
        <SkeletonCard />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><SkeletonCard /><SkeletonCard /></div>
      </div>
    )
  }

  if (!lead) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
          <User className="w-6 h-6 text-gray-300" />
        </div>
        <h3 className="text-sm font-semibold text-gray-900 mb-1">Lead introuvable</h3>
        <p className="text-sm text-gray-500 mb-4">Ce lead n&apos;existe pas ou a été supprimé</p>
        <Link href="/leads" className="text-sm text-primary hover:underline">Retour aux prospects</Link>
      </div>
    )
  }

  const statut = STATUTS_LEAD[lead.statut]
  const scoreColor = getScoreColor(lead.score_chaud)
  const scoreLabel = getScoreLabel(lead.score_chaud)
  const completionPct = getCompletionPercent(lead)
  const validTransitions = VALID_LEAD_TRANSITIONS[lead.statut] || []
  const etapeIndex = getEtapeIndex(lead.statut)
  const dossierCount = (lead.financements?.length || 0) + (lead.inscriptions?.length || 0) + (lead.documents?.length || 0)

  return (
    <div className="space-y-4">
      {/* ===== HEADER COMPACT ===== */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5">
        {/* Ligne 1 : Back + Avatar + Nom + Score */}
        <div className="flex items-center gap-3">
          <Link href="/leads" className="p-1.5 hover:bg-gray-100 rounded-lg transition shrink-0 -ml-1">
            <ArrowLeft className="w-4 h-4 text-gray-400" />
          </Link>
          <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0" style={{ backgroundColor: scoreColor }}>
            {(lead.prenom[0] + (lead.nom?.[0] || '')).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-bold text-accent truncate">
                {lead.prenom} {lead.nom}
              </h1>
              {/* Statut cliquable */}
              <div className="relative">
                <button onClick={() => setShowStatutMenu(p => !p)} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium text-white hover:opacity-90 transition" style={{ backgroundColor: statut.color }}>
                  {statut.label}
                  {validTransitions.length > 0 && <ChevronDown className="w-2.5 h-2.5" />}
                </button>
                {showStatutMenu && validTransitions.length > 0 && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowStatutMenu(false)} />
                    <div className="absolute left-0 top-full mt-1 w-44 bg-white rounded-xl shadow-xl border border-gray-100 z-50 py-1 max-h-56 overflow-y-auto animate-scaleIn origin-top-left">
                      {validTransitions.map((sk) => (
                        <button key={sk} onClick={() => handleChangeStatut(sk)} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 transition text-left">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: STATUTS_LEAD[sk].color }} />
                          {STATUTS_LEAD[sk].label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              {/* Score */}
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs border-2 border-white shadow" style={{ backgroundColor: scoreColor }} title={`Score: ${lead.score_chaud}/100 — ${scoreLabel}`}>
                {lead.score_chaud}
              </div>
            </div>
            {/* Contact inline */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-500 mt-1">
              {lead.email && (
                <button onClick={() => handleCopy(lead.email!, 'Email')} className="flex items-center gap-1 hover:text-primary transition truncate max-w-[180px]">
                  <Mail className="w-3 h-3 shrink-0" /><span className="truncate">{lead.email}</span>
                </button>
              )}
              {lead.telephone && (
                <button onClick={() => handleCopy(lead.telephone!, 'Téléphone')} className="flex items-center gap-1 hover:text-primary transition">
                  <Phone className="w-3 h-3" />{formatPhone(lead.telephone)}
                </button>
              )}
              <span className="text-gray-300">·</span>
              <span>{lead.source.replace(/_/g, ' ')} · {formatDate(lead.created_at)}</span>
            </div>
          </div>
        </div>

        {/* Ligne 2 : Micro-stepper + Actions */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
          {/* Micro-stepper parcours */}
          <div className="flex items-center gap-1">
            {ETAPES_PARCOURS.map((etape, i) => {
              const isComplete = i < etapeIndex
              const isActive = i === etapeIndex
              return (
                <div key={etape.id} className="flex items-center gap-1">
                  {i > 0 && <div className={cn('w-4 sm:w-6 h-0.5 rounded-full', isComplete ? 'bg-primary' : 'bg-gray-200')} />}
                  <div className={cn(
                    'flex items-center gap-1 px-1.5 sm:px-2 py-1 rounded-full text-[10px] font-medium transition-all',
                    isActive && 'bg-primary/10 text-primary ring-1 ring-primary/30',
                    isComplete && 'bg-green-50 text-green-600',
                    !isActive && !isComplete && 'text-gray-400'
                  )} title={etape.label}>
                    {isComplete ? <CheckCircle className="w-3 h-3" /> : isActive ? <Circle className="w-3 h-3 fill-[#2EC6F3]" /> : <Circle className="w-3 h-3" />}
                    <span className="hidden sm:inline">{etape.label}</span>
                  </div>
                </div>
              )
            })}
            {etapeIndex === -1 && (
              <span className="text-[10px] text-red-400 ml-1">
                {lead.statut === 'PERDU' ? '✕ Perdu' : lead.statut === 'SPAM' ? '✕ Spam' : '⏸ Reporté'}
              </span>
            )}
          </div>

          {/* 3 actions visibles + menu overflow */}
          <div className="flex items-center gap-1.5">
            {lead.telephone && (
              <a href={`tel:${lead.telephone}`} className="flex items-center justify-center w-9 h-9 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition" title="Appeler"><Phone className="w-4 h-4" /></a>
            )}
            {lead.email && (
              <a href={`mailto:${lead.email}`} className="flex items-center justify-center w-9 h-9 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition" title="Email"><Mail className="w-4 h-4" /></a>
            )}
            {lead.telephone && (
              <a href={`https://wa.me/${lead.telephone.replace(/[^\d]/g, '').replace(/^0/, '33')}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-9 h-9 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition" title="WhatsApp"><MessageCircle className="w-4 h-4" /></a>
            )}
            <div className="relative">
              <button onClick={() => setShowMoreActions(p => !p)} className="flex items-center justify-center w-9 h-9 bg-gray-50 text-gray-500 rounded-lg hover:bg-gray-100 transition" title="Plus d'actions"><MoreHorizontal className="w-4 h-4" /></button>
              {showMoreActions && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMoreActions(false)} />
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-50 py-1 animate-scaleIn origin-top-right">
                    <button onClick={() => { setShowMoreActions(false); toast.info('Recherche en cours...'); aiResearch.mutateAsync({ nom: `${lead.prenom} ${lead.nom || ''}`.trim(), entreprise: lead.entreprise_nom || undefined, ville: lead.adresse?.ville || 'Paris', secteur: 'esthetique formation beaute' }).then(r => { setResearchData(r); toast.success('Recherche terminée') }).catch(() => toast.error('Recherche indisponible')) }} disabled={aiResearch.isPending} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-gray-50 transition text-left disabled:opacity-50">
                      <Sparkles className={cn('w-4 h-4 text-cyan-500', aiResearch.isPending && 'animate-spin')} />{aiResearch.isPending ? 'Enrichissement...' : 'Enrichir (IA)'}
                    </button>
                    <button onClick={() => { setShowMoreActions(false); setShowWizard(true) }} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-gray-50 transition text-left">
                      <GraduationCap className="w-4 h-4 text-violet-500" />Inscrire à une formation
                    </button>
                    <button onClick={() => { setShowMoreActions(false); setShowInscrire(true) }} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-gray-50 transition text-left">
                      <Calendar className="w-4 h-4 text-amber-500" />Inscrire (rapide)
                    </button>
                    <button onClick={() => { setShowMoreActions(false); setShowAssign(true) }} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-gray-50 transition text-left">
                      <Target className="w-4 h-4 text-gray-500" />{lead.commercial_assigne ? `Réassigner (${lead.commercial_assigne.prenom})` : 'Assigner un commercial'}
                    </button>
                    <div className="border-t border-gray-100 my-1" />
                    <Link href={`/lead/${id}/rapport`} target="_blank" onClick={() => setShowMoreActions(false)} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-gray-50 transition text-left">
                      <FileText className="w-4 h-4 text-[#2EC6F3]" />Briefing commercial
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Résultat recherche IA — collapsible */}
      {researchData && (
        <div className="bg-cyan-50/50 border border-cyan-200 rounded-xl p-4 space-y-2 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-cyan-800 flex items-center gap-2"><Sparkles className="w-4 h-4" />Recherche prospect</h3>
            <button onClick={() => setResearchData(null)} className="text-cyan-400 hover:text-cyan-600 transition"><X className="w-4 h-4" /></button>
          </div>
          {!!researchData.resume && <p className="text-sm text-gray-700">{String(researchData.resume)}</p>}
          {Array.isArray(researchData.talking_points) && researchData.talking_points.length > 0 && (
            <div><p className="text-xs font-medium text-cyan-700 mb-1">Points de conversation</p>
              <ul className="space-y-0.5">{(researchData.talking_points as string[]).map((p, i) => <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5"><span className="text-cyan-400 mt-0.5">—</span>{p}</li>)}</ul>
            </div>
          )}
          {Array.isArray(researchData.opportunites) && researchData.opportunites.length > 0 && (
            <div><p className="text-xs font-medium text-green-700 mb-1">Opportunités</p>
              <ul className="space-y-0.5">{(researchData.opportunites as string[]).map((o, i) => <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5"><Check className="w-3 h-3 text-green-500 mt-0.5 shrink-0" />{o}</li>)}</ul>
            </div>
          )}
        </div>
      )}

      {/* ===== LAYOUT 2 COLONNES ===== */}
      <div className="flex flex-col lg:flex-row gap-4">

        {/* ── COLONNE GAUCHE — Profil sticky ── */}
        <div className="lg:w-[320px] lg:shrink-0 space-y-3 lg:sticky lg:top-[72px] lg:self-start lg:max-h-[calc(100vh-88px)] lg:overflow-y-auto lg:scrollbar-hide">
          {/* Contact */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#2EC6F3]" />
                <span className="text-xs font-semibold text-[#082545]">Contact</span>
              </div>
              {isEditing ? (
                <div className="flex gap-1">
                  <button onClick={() => { setIsEditing(false); setEditedLead(() => ({})) }} className="px-2 py-1 text-[10px] text-gray-500 border border-gray-200 rounded hover:bg-gray-50 transition">Annuler</button>
                  <button onClick={handleSave} disabled={updateLead.isPending} className="flex items-center gap-1 px-2 py-1 text-[10px] bg-[#2EC6F3] text-white rounded hover:bg-[#0284C7] transition disabled:opacity-50">
                    {updateLead.isPending ? <div className="w-2.5 h-2.5 border border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-2.5 h-2.5" />}OK
                  </button>
                </div>
              ) : (
                <button onClick={() => setIsEditing(true)} className="p-1 rounded hover:bg-gray-100 text-gray-400 transition"><Edit3 className="w-3 h-3" /></button>
              )}
            </div>
            <div className="space-y-2">
              <EditableField label="Prénom" value={lead.prenom} field="prenom" isEditing={isEditing} editedLead={editedLead} setEditedLead={setEditedLead} autoFocus />
              <EditableField label="Nom" value={lead.nom || ''} field="nom" isEditing={isEditing} editedLead={editedLead} setEditedLead={setEditedLead} />
              <EditableField label="Email" value={lead.email || ''} field="email" isEditing={isEditing} editedLead={editedLead} setEditedLead={setEditedLead} type="email" />
              <EditableField label="Téléphone" value={lead.telephone || ''} field="telephone" isEditing={isEditing} editedLead={editedLead} setEditedLead={setEditedLead} type="tel" displayValue={formatPhone(lead.telephone || '')} />
            </div>
          </div>

          {/* Profil pro */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-2">
            <div className="flex items-center gap-1.5 mb-1">
              <Building2 className="w-3.5 h-3.5 text-[#2EC6F3]" />
              <span className="text-xs font-semibold text-[#082545]">Profil</span>
            </div>
            <SelectField label="Statut pro" value={lead.statut_pro || ''} field="statut_pro" isEditing={isEditing} editedLead={editedLead} setEditedLead={setEditedLead} options={STATUT_PRO_OPTIONS} />
            <SelectField label="Expérience" value={lead.experience_esthetique || ''} field="experience_esthetique" isEditing={isEditing} editedLead={editedLead} setEditedLead={setEditedLead} options={EXPERIENCE_OPTIONS} />
            <EditableField label="Entreprise" value={lead.entreprise_nom || ''} field="entreprise_nom" isEditing={isEditing} editedLead={editedLead} setEditedLead={setEditedLead} />
            <EditableField label="Ville" value={lead.adresse?.ville || ''} field="adresse.ville" isEditing={isEditing} editedLead={editedLead} setEditedLead={setEditedLead} isAddress />
          </div>

          {/* Tags */}
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <Tag className="w-3.5 h-3.5 text-[#2EC6F3]" />
              <span className="text-xs font-semibold text-[#082545]">Tags</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {lead.tags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-[11px] group">
                  {tag}
                  <button onClick={() => handleRemoveTag(tag)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"><X className="w-2.5 h-2.5" /></button>
                </span>
              ))}
              <input type="text" value={newTag} onChange={(e) => setNewTag(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddTag()} placeholder="+" className="w-10 px-1.5 py-0.5 border border-dashed border-gray-300 rounded-full text-[11px] text-center focus:border-[#2EC6F3] focus:w-24 transition-all outline-none" />
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <Edit3 className="w-3.5 h-3.5 text-[#2EC6F3]" />
              <span className="text-xs font-semibold text-[#082545]">Notes</span>
            </div>
            <textarea value={isEditing ? (editedLead.notes ?? lead.notes ?? '') : (lead.notes || '')} onChange={(e) => setEditedLead(prev => ({ ...prev, notes: e.target.value }))} disabled={!isEditing} rows={3} placeholder={isEditing ? 'Notes internes...' : 'Aucune note'} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs disabled:bg-gray-50 disabled:text-gray-600 resize-none focus:outline-none focus:border-[#2EC6F3]" />
          </div>

          {/* Complétion */}
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-gray-400">Complétion fiche</span>
              <span className={cn('text-xs font-bold', completionPct >= 80 ? 'text-emerald-600' : completionPct >= 50 ? 'text-amber-600' : 'text-gray-400')}>{completionPct}%</span>
            </div>
            <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${completionPct}%`, backgroundColor: completionPct >= 80 ? '#22C55E' : completionPct >= 50 ? '#F59E0B' : '#94A3B8' }} />
            </div>
          </div>

          {/* Source + date */}
          <div className="px-1 flex items-center justify-between text-[10px] text-gray-400">
            <span>Source : {lead.source.replace(/_/g, ' ')}</span>
            <span>Créé {formatDate(lead.created_at)}</span>
          </div>
        </div>

        {/* ── COLONNE DROITE — Contenu scrollable ── */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Actions intelligentes */}
          <LeadActionHub leadId={lead.id} onActionClick={(action) => {
            if (action === 'inscrire' || action === 'proposer_formation') setShowWizard(true)
            if (action === 'qualifier') setIsEditing(true)
          }} />

          {/* Formation souhaitée + suggestions */}
          {lead.formation_principale && (
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <GraduationCap className="w-3.5 h-3.5 text-[#2EC6F3]" />
                <span className="text-xs font-semibold text-[#082545]">Formation souhaitée</span>
              </div>
              <div className="p-3 bg-[#2EC6F3]/5 border border-[#2EC6F3]/20 rounded-lg">
                <div className="flex items-start justify-between">
                  <div><h4 className="font-medium text-[#082545] text-sm">{lead.formation_principale.nom}</h4><p className="text-[11px] text-gray-500 mt-0.5">{lead.formation_principale.categorie}</p></div>
                  <span className="text-sm font-bold text-[#2EC6F3]">{formatEuro(lead.formation_principale.prix_ht)}</span>
                </div>
                {lead.financement_souhaite && (
                  <div className="mt-2 flex items-center gap-1 text-[11px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md w-fit">
                    <Wallet className="w-3 h-3" />Financement souhaité {lead.organisme_financement && `(${lead.organisme_financement})`}
                  </div>
                )}
              </div>
            </div>
          )}
          <FormationSuggester leadId={lead.id} compact onSelect={() => setShowWizard(true)} />

          {/* Inscriptions */}
          {lead.inscriptions && lead.inscriptions.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <GraduationCap className="w-3.5 h-3.5 text-[#2EC6F3]" />
                <span className="text-xs font-semibold text-[#082545]">Inscriptions ({lead.inscriptions.length})</span>
              </div>
              <div className="space-y-2">
                {lead.inscriptions.map((insc: Inscription) => (
                  <div key={insc.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition">
                    <div className="min-w-0">
                      <h4 className="font-medium text-[#082545] text-sm truncate">{insc.session?.formation?.nom || 'Formation'}</h4>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-500">
                        {insc.session && <Link href={`/session/${insc.session.id}`} className="text-[#2EC6F3] hover:underline">{formatDate(insc.session.date_debut, { day: 'numeric', month: 'short' })}</Link>}
                        <span>{formatEuro(insc.montant_total)}</span>
                        <span className={cn('px-1.5 py-0.5 rounded-full text-[10px] font-medium', insc.paiement_statut === 'PAYE' ? 'bg-green-100 text-green-700' : insc.paiement_statut === 'EN_ATTENTE' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600')}>
                          {insc.paiement_statut.replace(/_/g, ' ').toLowerCase()}
                        </span>
                      </div>
                    </div>
                    {insc.paiement_statut !== 'PAYE' && <PaymentLinkButton lead={lead} inscription={insc} />}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Financement */}
          {lead.financements && lead.financements.length > 0 && (
            <div className="bg-amber-50/50 border border-amber-200/50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-semibold text-amber-800">{lead.financements.length} dossier{lead.financements.length > 1 ? 's' : ''} financement</span>
              </div>
              {lead.financements.map((fin: Financement, i: number) => (
                <div key={i} className="flex items-center justify-between text-xs text-amber-700">
                  <span>{fin.organisme}</span>
                  <span className="font-medium">{fin.statut.replace(/_/g, ' ')}</span>
                </div>
              ))}
            </div>
          )}

          {/* Briefing commercial IA */}
          <ProspectReportViewer leadId={lead.id} leadName={`${lead.prenom || ''} ${lead.nom || ''}`.trim()} />

          {/* Données enrichies */}
          <EnrichedDataSection leadId={lead.id} />

          {/* Avis clients */}
          <ProspectReviewsPanel leadId={lead.id} />

          {/* Timeline activité (anciennement onglet Communication) */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#2EC6F3]" />
                <span className="text-sm font-semibold text-[#082545]">Activité & Échanges</span>
                {messages.length > 0 && <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{messages.length}</span>}
              </div>
            </div>
            {/* Formulaire envoi rapide */}
            <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/50">
              <div className="flex items-center gap-2 mb-2">
                {CANAUX_MESSAGE.map(c => (
                  <button key={c.id} onClick={() => setMessageCanal(c.id)} className={cn('flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] transition', messageCanal === c.id ? 'bg-white shadow-sm font-medium' : 'text-gray-500 hover:bg-white/50')} title={c.hint}>
                    <c.icon className="w-3 h-3" style={{ color: messageCanal === c.id ? c.color : undefined }} />{c.label}
                  </button>
                ))}
              </div>
              {messageCanal === 'email' && (
                <input type="text" value={messageSubject} onChange={(e) => setMessageSubject(e.target.value)} placeholder="Objet..." className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs mb-2 focus:outline-none focus:border-[#2EC6F3]" />
              )}
              <div className="flex gap-2">
                <textarea value={messageContent} onChange={(e) => setMessageContent(e.target.value)} placeholder={messageCanal === 'note_interne' ? 'Ajouter une note...' : 'Votre message...'} rows={2} className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-xs resize-none focus:outline-none focus:border-[#2EC6F3]" />
                <button onClick={handleSendMessage} disabled={sendMessage.isPending || !messageContent.trim()} className="self-end px-3 py-2 bg-[#2EC6F3] text-white rounded-lg text-xs font-medium hover:bg-[#0284C7] transition disabled:opacity-50">
                  {sendMessage.isPending ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            {/* Timeline */}
            <div className="p-4">
              <ActivityTimeline leadId={lead.id} limit={15} />
            </div>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <InscrireLeadDialog open={showInscrire} onClose={() => setShowInscrire(false)} lead={lead} />
      <AssignCommercialDialog open={showAssign} onClose={() => setShowAssign(false)} lead={lead} />
      {showWizard && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <Suspense fallback={<div className="p-8 flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /><span className="ml-3 text-slate-600">Chargement...</span></div>}>
              <WizardInscription leadId={id} onComplete={() => { setShowWizard(false); toast.success('Inscription créée') }} onCancel={() => setShowWizard(false)} />
            </Suspense>
          </div>
        </div>
      )}
    </div>
  )
}

// ===== TAB 1 : RÉSUMÉ =====
function ResumeTab({ lead, isEditing, editedLead, setEditedLead, setIsEditing, handleSave, newTag, setNewTag, handleAddTag, handleRemoveTag, isLoading, completionPct, onShowWizard, onActionClick }: {
  lead: Lead; isEditing: boolean; editedLead: Partial<Lead>; setEditedLead: (fn: (prev: Partial<Lead>) => Partial<Lead>) => void; setIsEditing: (v: boolean) => void; handleSave: () => void; newTag: string; setNewTag: (v: string) => void; handleAddTag: () => void; handleRemoveTag: (t: string) => void; isLoading: boolean; completionPct: number; onShowWizard: () => void; onActionClick: (a: string) => void
}) {
  return (
    <div className="space-y-4">
      {/* Barre édition + complétion */}
      <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${completionPct}%`, backgroundColor: completionPct >= 80 ? '#22C55E' : completionPct >= 50 ? '#F59E0B' : '#94A3B8' }} />
          </div>
          <span className="text-[10px] text-gray-400">{completionPct}%</span>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <button onClick={() => { setIsEditing(false); setEditedLead(() => ({})) }} disabled={isLoading} className="px-3 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-white transition">Annuler</button>
              <button onClick={handleSave} disabled={isLoading} className="flex items-center gap-1 px-3 py-1.5 text-xs bg-primary text-white rounded-lg hover:bg-primary/90 transition disabled:opacity-50">
                {isLoading ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-3 h-3" />}Sauvegarder
              </button>
            </>
          ) : (
            <button onClick={() => setIsEditing(true)} className="flex items-center gap-1 px-3 py-1.5 text-xs bg-primary text-white rounded-lg hover:bg-primary/90 transition">
              <Edit3 className="w-3 h-3" />Modifier
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Gauche (2/5) — Contact + Profil + Tags + Notes */}
        <div className="lg:col-span-2 space-y-4">
          <Section title="Contact" icon={<Phone className="w-4 h-4" />}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <EditableField label="Prénom *" value={lead.prenom} field="prenom" isEditing={isEditing} editedLead={editedLead} setEditedLead={setEditedLead} autoFocus />
              <EditableField label="Nom" value={lead.nom || ''} field="nom" isEditing={isEditing} editedLead={editedLead} setEditedLead={setEditedLead} />
              <EditableField label="Email" value={lead.email || ''} field="email" isEditing={isEditing} editedLead={editedLead} setEditedLead={setEditedLead} type="email" />
              <EditableField label="Téléphone" value={lead.telephone || ''} field="telephone" isEditing={isEditing} editedLead={editedLead} setEditedLead={setEditedLead} type="tel" displayValue={formatPhone(lead.telephone || '')} />
            </div>
          </Section>

          <Section title="Profil" icon={<Building2 className="w-4 h-4" />}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <SelectField label="Statut pro" value={lead.statut_pro || ''} field="statut_pro" isEditing={isEditing} editedLead={editedLead} setEditedLead={setEditedLead} options={STATUT_PRO_OPTIONS} />
              <SelectField label="Expérience" value={lead.experience_esthetique || ''} field="experience_esthetique" isEditing={isEditing} editedLead={editedLead} setEditedLead={setEditedLead} options={EXPERIENCE_OPTIONS} />
              <EditableField label="Entreprise" value={lead.entreprise_nom || ''} field="entreprise_nom" isEditing={isEditing} editedLead={editedLead} setEditedLead={setEditedLead} />
              <EditableField label="Ville" value={lead.adresse?.ville || ''} field="adresse.ville" isEditing={isEditing} editedLead={editedLead} setEditedLead={setEditedLead} isAddress />
            </div>
          </Section>

          <Section title="Tags" icon={<Tag className="w-4 h-4" />}>
            <div className="flex flex-wrap gap-1.5">
              {lead.tags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs group">
                  {tag}
                  <button onClick={() => handleRemoveTag(tag)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"><X className="w-2.5 h-2.5" /></button>
                </span>
              ))}
              <input type="text" value={newTag} onChange={(e) => setNewTag(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddTag()} placeholder="+ tag" className="w-16 px-2 py-0.5 border border-dashed border-gray-300 rounded-full text-xs text-center focus:border-primary focus:w-28 transition-all outline-none" />
            </div>
          </Section>

          <Section title="Notes" icon={<Edit3 className="w-4 h-4" />}>
            <textarea value={isEditing ? (editedLead.notes ?? lead.notes ?? '') : (lead.notes || '')} onChange={(e) => setEditedLead(prev => ({ ...prev, notes: e.target.value }))} disabled={!isEditing} rows={2} placeholder={isEditing ? 'Notes internes...' : 'Aucune note'} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm disabled:bg-gray-50 disabled:text-gray-600 resize-none" />
          </Section>
        </div>

        {/* Droite (3/5) — Formation + Inscriptions + Actions */}
        <div className="lg:col-span-3 space-y-4">
          <Section title="Formation souhaitée" icon={<GraduationCap className="w-4 h-4" />}>
            {lead.formation_principale ? (
              <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                <div className="flex items-start justify-between">
                  <div><h4 className="font-medium text-accent text-sm">{lead.formation_principale.nom}</h4><p className="text-xs text-gray-500 mt-0.5">{lead.formation_principale.categorie}</p></div>
                  <span className="text-base font-bold text-primary">{formatEuro(lead.formation_principale.prix_ht)}</span>
                </div>
                {lead.financement_souhaite && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md w-fit">
                    <Wallet className="w-3 h-3" />Financement souhaité {lead.organisme_financement && `(${lead.organisme_financement})`}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">Aucune formation sélectionnée</p>
            )}
          </Section>

          <FormationSuggester leadId={lead.id} compact onSelect={() => onShowWizard()} />

          {lead.inscriptions && lead.inscriptions.length > 0 && (
            <Section title={`Inscriptions (${lead.inscriptions.length})`} icon={<GraduationCap className="w-4 h-4" />}>
              <div className="space-y-2">
                {lead.inscriptions.map((insc: Inscription) => (
                  <div key={insc.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition">
                    <div className="min-w-0">
                      <h4 className="font-medium text-accent text-sm truncate">{insc.session?.formation?.nom || 'Formation'}</h4>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                        {insc.session && <Link href={`/session/${insc.session.id}`} className="text-primary hover:underline">{formatDate(insc.session.date_debut, { day: 'numeric', month: 'short' })}</Link>}
                        <span>{formatEuro(insc.montant_total)}</span>
                        <span className={cn('px-1.5 py-0.5 rounded-full text-[10px] font-medium', insc.paiement_statut === 'PAYE' ? 'bg-green-100 text-green-700' : insc.paiement_statut === 'EN_ATTENTE' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600')}>
                          {insc.paiement_statut.replace(/_/g, ' ').toLowerCase()}
                        </span>
                      </div>
                    </div>
                    {insc.paiement_statut !== 'PAYE' && <PaymentLinkButton lead={lead} inscription={insc} />}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {lead.financements && lead.financements.length > 0 && (
            <div className="bg-amber-50/50 border border-amber-200/50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-sm">
                <CreditCard className="w-4 h-4 text-amber-600" />
                <span className="font-medium text-amber-800">{lead.financements.length} dossier{lead.financements.length > 1 ? 's' : ''}</span>
                <span className="text-amber-600 text-xs">{lead.financements[0].organisme} — {lead.financements[0].statut.replace(/_/g, ' ')}</span>
              </div>
            </div>
          )}

          <LeadActionHub leadId={lead.id} onActionClick={onActionClick} />
        </div>
      </div>

      {/* Rapport de Prospection IA */}
      <ProspectReportViewer leadId={lead.id} leadName={`${lead.prenom || ''} ${lead.nom || ''}`.trim()} />

      {/* Données enrichies (Sirene, Pappers, Google, Social, Quartier) */}
      <EnrichedDataSection leadId={lead.id} />

      {/* Avis clients récupérés */}
      <ProspectReviewsPanel leadId={lead.id} />
    </div>
  )
}

// ===== TAB 2 : ACTIVITÉ =====
function ActiviteTab({ lead, messages, cadenceInstances, messageCanal, setMessageCanal, messageContent, setMessageContent, messageSubject, setMessageSubject, handleSendMessage, isSending }: {
  lead: Lead; messages: Message[]; cadenceInstances: any[]; messageCanal: CanalMessage; setMessageCanal: (c: CanalMessage) => void; messageContent: string; setMessageContent: (c: string) => void; messageSubject: string; setMessageSubject: (s: string) => void; handleSendMessage: () => void; isSending: boolean
}) {
  const sortedMessages = [...messages].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return (
    <div className="space-y-4">
      {/* Composer */}
      <Section title="Nouveau message" icon={<Send className="w-4 h-4" />}>
        <div className="space-y-3">
          <div className="flex gap-1.5 flex-wrap">
            {CANAUX_MESSAGE.map((canal) => {
              const Icon = canal.icon
              return (
                <button key={canal.id} onClick={() => setMessageCanal(canal.id)} className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition',
                  messageCanal === canal.id ? 'bg-primary/10 text-primary ring-1 ring-primary/30' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                )}>
                  <Icon className="w-3.5 h-3.5" />{canal.label}
                </button>
              )
            })}
          </div>
          {messageCanal === 'email' && <input type="text" placeholder="Sujet de l'email..." value={messageSubject} onChange={(e) => setMessageSubject(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none" />}
          {messageCanal === 'appel' && (
            <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-2 flex items-center gap-2"><Phone className="w-3.5 h-3.5" />Notez le résumé de l'appel puis cliquez "Marquer effectué"</div>
          )}
          <textarea placeholder={messageCanal === 'appel' ? 'Notes de l\'appel...' : `Votre message...`} value={messageContent} onChange={(e) => setMessageContent(e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none" />
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-gray-400">{CANAUX_MESSAGE.find(c => c.id === messageCanal)?.hint}</p>
            <button onClick={handleSendMessage} disabled={!messageContent.trim() || isSending} className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition disabled:opacity-50 text-sm font-medium min-h-[40px]">
              {isSending ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              {messageCanal === 'appel' ? 'Marquer effectué' : 'Envoyer'}
            </button>
          </div>
        </div>
      </Section>

      {/* Cadences actives */}
      {cadenceInstances.length > 0 && (
        <div className="space-y-2">
          {cadenceInstances.map((inst) => (
            <div key={inst.id} className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div><p className="font-medium text-amber-900 text-sm">{inst.template?.nom}</p><p className="text-xs text-amber-700">Étape {inst.etape_courante + 1} · Prochaine: {formatDate(inst.prochaine_execution)}</p></div>
              <button className="p-2 text-amber-600 hover:bg-amber-100 rounded-lg"><Pause className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      )}

      {/* Messages */}
      {sortedMessages.length > 0 && (
        <Section title={`Messages (${messages.length})`} icon={<MessageSquareText className="w-4 h-4" />}>
          <div className="space-y-2.5 max-h-[300px] overflow-y-auto">
            {sortedMessages.map((msg) => {
              const cc = CANAUX_MESSAGE.find(c => c.id === msg.canal)
              const Icon = cc?.icon || MessageSquare
              const color = cc?.color || '#6B7280'
              const out = msg.direction === 'outbound'
              return (
                <div key={msg.id} className={cn('flex', out ? 'justify-end' : 'justify-start')}>
                  <div className="max-w-[80%]">
                    <div className={cn('p-2.5 rounded-2xl', out ? 'bg-primary text-white rounded-br-md' : msg.canal === 'note_interne' ? 'bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-bl-md' : 'bg-gray-100 text-gray-800 rounded-bl-md')}>
                      <div className="flex items-center gap-1.5 mb-0.5"><Icon className="w-3 h-3" style={{ color: out ? 'white' : color }} />{msg.sujet && <span className="font-medium text-xs">{msg.sujet}</span>}</div>
                      <p className="text-sm whitespace-pre-wrap">{msg.contenu}</p>
                    </div>
                    <div className={cn('flex items-center gap-2 mt-0.5 text-[10px] text-gray-400', out ? 'justify-end' : '')}>
                      <span>{formatDate(msg.created_at)}</span>
                      {msg.statut === 'delivre' && <Check className="w-3 h-3 text-green-500" />}
                      {msg.statut === 'erreur' && <AlertCircle className="w-3 h-3 text-red-500" />}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </Section>
      )}

      {/* Historique complet */}
      <Section title="Historique complet" icon={<Clock className="w-4 h-4" />}>
        <ActivityTimeline leadId={lead.id} limit={30} />
      </Section>
    </div>
  )
}

// ===== TAB 3 : DOSSIER =====
function DossierTab({ lead }: { lead: Lead }) {
  const hasFin = lead.financements && lead.financements.length > 0
  const hasInsc = lead.inscriptions && lead.inscriptions.length > 0
  const hasDocs = lead.documents && lead.documents.length > 0
  const isEmpty = !hasFin && !hasInsc && !hasDocs

  return (
    <div className="space-y-4">
      <FinancementExpress leadId={lead.id} formationPrix={lead.formation_principale?.prix_ht || 1400} formationDureeHeures={lead.formation_principale?.duree_heures || 14} compact />

      {hasInsc && (
        <Section title={`Inscriptions (${lead.inscriptions!.length})`} icon={<GraduationCap className="w-4 h-4" />}>
          <div className="space-y-3">
            {lead.inscriptions!.map((insc: Inscription) => (
              <div key={insc.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="font-medium text-accent text-sm truncate">{insc.session?.formation?.nom || 'Formation'}</h4>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-gray-500">
                      {insc.session && <Link href={`/session/${insc.session.id}`} className="text-primary hover:underline">{formatDate(insc.session.date_debut, { day: 'numeric', month: 'short' })}</Link>}
                      <span>{formatEuro(insc.montant_total)}</span>
                      <span className={cn('px-1.5 py-0.5 rounded-full text-[10px] font-medium', insc.paiement_statut === 'PAYE' ? 'bg-green-100 text-green-700' : insc.paiement_statut === 'EN_ATTENTE' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600')}>{insc.paiement_statut.replace(/_/g, ' ').toLowerCase()}</span>
                    </div>
                  </div>
                  {insc.paiement_statut !== 'PAYE' && <PaymentLinkButton lead={lead} inscription={insc} />}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {hasFin ? (
        <Section title={`Financement (${lead.financements!.length})`} icon={<Wallet className="w-4 h-4" />}>
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Financement souhaité</label>
                <div className={cn('flex items-center gap-2 text-sm', lead.financement_souhaite ? 'text-green-600' : 'text-gray-400')}>
                  {lead.financement_souhaite ? <CheckCircle className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                  <span className="font-medium">{lead.financement_souhaite ? 'Oui' : 'Non'}</span>
                </div>
              </div>
              {lead.organisme_financement && <div><label className="block text-xs font-medium text-gray-500 mb-1">Organisme ciblé</label><span className="text-sm font-medium text-gray-700">{lead.organisme_financement}</span></div>}
            </div>
            {lead.financements!.map((fin: Financement) => (
              <div key={fin.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-medium text-accent">{fin.organisme}</h4>
                      <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', fin.statut === 'VALIDE' || fin.statut === 'VERSE' ? 'bg-green-100 text-green-800' : fin.statut === 'REFUSE' ? 'bg-red-100 text-red-800' : fin.statut === 'EN_EXAMEN' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800')}>{fin.statut.replace(/_/g, ' ')}</span>
                    </div>
                    <div className="text-sm text-gray-600 flex flex-wrap gap-x-4 gap-y-1">
                      <span>Demandé: {formatEuro(fin.montant_demande || 0)}</span>
                      {fin.montant_accorde && <span className="text-green-600 font-medium">Accordé: {formatEuro(fin.montant_accorde)}</span>}
                      {fin.date_soumission && <span>Soumis: {formatDate(fin.date_soumission)}</span>}
                    </div>
                  </div>
                </div>
                {fin.documents && fin.documents.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex flex-wrap gap-2">
                      {fin.documents.map((doc, i) => (
                        <span key={i} className={cn('inline-flex items-center gap-1 px-2 py-1 rounded text-[11px]', doc.statut === 'valide' ? 'bg-green-50 text-green-700' : doc.statut === 'fourni' ? 'bg-amber-50 text-amber-700' : 'bg-gray-50 text-gray-500')}>
                          {doc.statut === 'valide' ? <CheckCircle className="w-3 h-3" /> : doc.statut === 'fourni' ? <Clock className="w-3 h-3" /> : <Circle className="w-3 h-3" />}{doc.nom}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>
      ) : (
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500"><CreditCard className="w-4 h-4" />{lead.financement_souhaite ? 'Financement souhaité — aucun dossier créé' : 'Aucun financement demandé'}</div>
          <button className="mt-2 inline-flex items-center gap-1.5 px-3 py-2 bg-primary text-white rounded-lg text-xs hover:bg-primary/90 transition"><Plus className="w-3.5 h-3.5" />Créer un dossier</button>
        </div>
      )}

      <Section title={`Documents (${lead.documents?.length || 0})`} icon={<FileText className="w-4 h-4" />}>
        {hasDocs ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {lead.documents!.map((doc) => (
              <div key={doc.id} className="border border-gray-200 rounded-lg p-3 hover:shadow-sm transition group">
                <div className="flex items-start justify-between mb-1.5">
                  <FileText className="w-5 h-5 text-gray-400" />
                  {doc.is_signed && <span className="px-1.5 py-0.5 bg-green-100 text-green-800 text-[10px] rounded-full font-medium">Signé</span>}
                </div>
                <h4 className="font-medium text-sm text-accent truncate">{doc.filename}</h4>
                <p className="text-xs text-gray-400 mt-0.5">{doc.type.replace(/_/g, ' ')} · {formatDate(doc.created_at)}</p>
                <button className="flex items-center gap-1 text-primary text-xs mt-2 opacity-0 group-hover:opacity-100 transition"><Download className="w-3 h-3" />Télécharger</button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <IllustrationEmptyDocuments size={120} className="mx-auto mb-2" />
            <p className="text-gray-400 text-sm mb-3">Aucun document</p>
            <button className="inline-flex items-center gap-1.5 px-3 py-2 bg-primary text-white rounded-lg text-xs hover:bg-primary/90 transition"><Plus className="w-3.5 h-3.5" />Ajouter un document</button>
          </div>
        )}
      </Section>

      {isEmpty && !lead.financement_souhaite && (
        <div className="text-center py-8">
          <IllustrationEmptyDossier size={130} className="mx-auto mb-2" />
          <p className="text-gray-500 text-sm mb-1">Dossier vide</p>
          <p className="text-gray-400 text-xs">Les inscriptions, financements et documents apparaîtront ici</p>
        </div>
      )}
    </div>
  )
}

// ===== SHARED COMPONENTS =====

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <h3 className="font-semibold text-accent flex items-center gap-2 mb-3 text-sm">
        <span className="text-primary">{icon}</span>{title}
      </h3>
      {children}
    </div>
  )
}

function EditableField({ label, value, field, isEditing, editedLead, setEditedLead, type = 'text', displayValue, autoFocus, isAddress }: {
  label: string; value: string; field: string; isEditing: boolean; editedLead: Partial<Lead>; setEditedLead: (fn: (prev: Partial<Lead>) => Partial<Lead>) => void; type?: string; displayValue?: string; autoFocus?: boolean; isAddress?: boolean
}) {
  const getEditValue = () => {
    if (isAddress) return (editedLead.adresse as any)?.[field.split('.')[1]] ?? value
    return (editedLead as any)[field.split('.').pop()!] ?? value
  }
  const handleChange = (v: string) => {
    if (isAddress) { const k = field.split('.')[1]; setEditedLead(prev => ({ ...prev, adresse: { ...prev.adresse, [k]: v } })) }
    else setEditedLead(prev => ({ ...prev, [field]: v }))
  }
  return (
    <div>
      <label className="block text-[11px] font-medium text-gray-500 mb-0.5">{label}</label>
      {isEditing ? (
        <input type={type} value={getEditValue()} onChange={(e) => handleChange(e.target.value)} autoFocus={autoFocus} className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none" />
      ) : (
        <p className="text-sm text-gray-800 py-1.5 min-h-[32px]">{displayValue || value || <span className="text-gray-300 italic">—</span>}</p>
      )}
    </div>
  )
}

function SelectField({ label, value, field, isEditing, editedLead, setEditedLead, options }: {
  label: string; value: string; field: string; isEditing: boolean; editedLead: Partial<Lead>; setEditedLead: (fn: (prev: Partial<Lead>) => Partial<Lead>) => void; options: { value: string; label: string }[]
}) {
  const currentValue = (editedLead as any)[field] ?? value
  if (!isEditing) {
    const opt = options.find(o => o.value === value)
    return <div><label className="block text-[11px] font-medium text-gray-500 mb-0.5">{label}</label><p className="text-sm text-gray-800 py-1.5 min-h-[32px]">{opt?.label || value || <span className="text-gray-300 italic">—</span>}</p></div>
  }
  return (
    <div>
      <label className="block text-[11px] font-medium text-gray-500 mb-0.5">{label}</label>
      <select value={currentValue} onChange={(e) => setEditedLead(prev => ({ ...prev, [field]: e.target.value }))} className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none">
        <option value="">— Sélectionner —</option>
        {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
    </div>
  )
}

function getCompletionPercent(lead: Lead): number {
  const fields = [lead.prenom, lead.nom, lead.email, lead.telephone, lead.statut_pro, lead.experience_esthetique, lead.formation_principale_id, lead.objectif_pro, lead.adresse?.ville, lead.date_naissance]
  return Math.round((fields.filter(Boolean).length / fields.length) * 100)
}
