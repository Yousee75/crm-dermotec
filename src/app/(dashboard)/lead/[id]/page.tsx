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
import { getScoreColor, getScoreLabel, scoreLead } from '@/lib/scoring'
import { ActivityTimeline } from '@/components/ui/ActivityTimeline'
import { InscrireLeadDialog } from '@/components/ui/InscrireLeadDialog'
import { AssignCommercialDialog } from '@/components/ui/AssignCommercialDialog'
import { PaymentLinkButton } from '@/components/ui/PaymentLinkButton'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { toast } from 'sonner'
import {
  ArrowLeft, Phone, Mail, MessageCircle, MessageSquare,
  User, MessageSquareText, CreditCard, FileText, Clock,
  Edit3, Save, Plus, Send, Check, X, ExternalLink,
  Tag, MapPin, GraduationCap, Building2,
  Target, Play, Pause, AlertCircle, Download,
  Wallet, Circle, CheckCircle, ChevronDown, Copy,
  Sparkles, TrendingUp, Calendar, Info
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Briques CRM intelligentes
import LeadActionHub from '@/components/crm/LeadActionHub'
import ParcoursClient from '@/components/crm/ParcoursClient'
import FormationSuggester from '@/components/crm/FormationSuggester'
import FinancementExpress from '@/components/crm/FinancementExpress'
// Import dynamique pour éviter les erreurs de build
const WizardInscription = lazy(() => import('@/components/crm/WizardInscription'))

type TabId = 'infos' | 'communication' | 'financement' | 'documents' | 'historique'

const TABS: { id: TabId; label: string; mobileLabel: string; icon: React.ElementType }[] = [
  { id: 'infos', label: 'Informations', mobileLabel: 'Infos', icon: User },
  { id: 'communication', label: 'Communication', mobileLabel: 'Com.', icon: MessageSquareText },
  { id: 'financement', label: 'Financement', mobileLabel: 'Finance', icon: CreditCard },
  { id: 'documents', label: 'Documents', mobileLabel: 'Docs', icon: FileText },
  { id: 'historique', label: 'Historique', mobileLabel: 'Histo.', icon: Clock },
]

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

// Transitions valides pour le statut — filtrées dans le menu
const VALID_LEAD_TRANSITIONS: Record<StatutLead, StatutLead[]> = {
  NOUVEAU: ['CONTACTE', 'QUALIFIE', 'PERDU', 'SPAM'],
  CONTACTE: ['QUALIFIE', 'FINANCEMENT_EN_COURS', 'PERDU', 'REPORTE', 'SPAM'],
  QUALIFIE: ['FINANCEMENT_EN_COURS', 'INSCRIT', 'PERDU', 'REPORTE'],
  FINANCEMENT_EN_COURS: ['INSCRIT', 'PERDU', 'REPORTE', 'QUALIFIE'],
  INSCRIT: ['EN_FORMATION', 'PERDU', 'REPORTE'],
  EN_FORMATION: ['FORME', 'PERDU'],
  FORME: ['ALUMNI', 'PERDU'],
  ALUMNI: ['QUALIFIE'], // Re-inscription possible
  PERDU: ['NOUVEAU', 'CONTACTE'], // Réactivation
  REPORTE: ['CONTACTE', 'QUALIFIE', 'PERDU'],
  SPAM: [], // Terminal
}

export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [activeTab, setActiveTab] = useState<TabId>('infos')
  const [isEditing, setIsEditing] = useState(false)
  const [editedLead, setEditedLead] = useState<Partial<Lead>>({})
  const [newTag, setNewTag] = useState('')
  const [messageCanal, setMessageCanal] = useState<CanalMessage>('email')
  const [messageContent, setMessageContent] = useState('')
  const [messageSubject, setMessageSubject] = useState('')
  const [showInscrire, setShowInscrire] = useState(false)
  const [showAssign, setShowAssign] = useState(false)
  const [showStatutMenu, setShowStatutMenu] = useState(false)
  const [showWizard, setShowWizard] = useState(false)

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
  const [researchData, setResearchData] = useState<Record<string, unknown> | null>(null)

  const handleSave = useCallback(async () => {
    try {
      await updateLead.mutateAsync({ id, ...editedLead })
      setIsEditing(false)
      setEditedLead({})
    } catch {
      // toast géré par le hook
    }
  }, [id, editedLead, updateLead])

  const handleChangeStatut = useCallback(async (newStatut: StatutLead) => {
    setShowStatutMenu(false)
    try {
      await changeStatut.mutateAsync({ id, statut: newStatut })
    } catch {
      // toast géré par le hook
    }
  }, [id, changeStatut])

  const handleAddTag = useCallback(() => {
    if (!newTag.trim() || lead?.tags.includes(newTag)) return
    const updatedTags = [...(lead?.tags || []), newTag.trim()]
    updateLead.mutate({ id, tags: updatedTags })
    setNewTag('')
  }, [newTag, lead, id, updateLead])

  const handleRemoveTag = useCallback((tag: string) => {
    const updatedTags = (lead?.tags || []).filter(t => t !== tag)
    updateLead.mutate({ id, tags: updatedTags })
  }, [lead, id, updateLead])

  const handleSendMessage = useCallback(async () => {
    if (!messageContent.trim()) return
    try {
      await sendMessage.mutateAsync({
        lead_id: id,
        canal: messageCanal,
        contenu: messageContent,
        sujet: messageSubject || undefined
      })
      setMessageContent('')
      setMessageSubject('')
      toast.success('Message envoyé')
    } catch {
      // toast géré par le hook
    }
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
          <div className="skeleton h-14 w-14 rounded-full" />
          <div className="space-y-2">
            <div className="skeleton h-6 w-48" />
            <div className="skeleton h-4 w-32" />
          </div>
        </div>
        <SkeletonCard />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonCard />
          <SkeletonCard />
        </div>
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
        <Link href="/leads" className="text-sm text-[#2EC6F3] hover:underline">
          Retour aux leads
        </Link>
      </div>
    )
  }

  const statut = STATUTS_LEAD[lead.statut]
  const scoreColor = getScoreColor(lead.score_chaud)
  const scoreLabel = getScoreLabel(lead.score_chaud)
  const completionPct = getCompletionPercent(lead)
  const validTransitions = VALID_LEAD_TRANSITIONS[lead.statut] || []

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* ===== HEADER — Mobile responsive + score proéminent ===== */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6">
        <div className="flex flex-col gap-4">
          {/* Ligne 1: Navigation + Nom + Score */}
          <div className="flex items-start gap-3 sm:gap-4">
            <Link href="/leads" className="p-2 hover:bg-gray-100 rounded-lg transition shrink-0 -ml-2 mt-1">
              <ArrowLeft className="w-5 h-5 text-gray-400" />
            </Link>

            {/* Avatar */}
            <div className="shrink-0">
              <div
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-white font-semibold text-lg"
                style={{ backgroundColor: scoreColor }}
              >
                {(lead.prenom[0] + (lead.nom?.[0] || '')).toUpperCase()}
              </div>
            </div>

            <div className="min-w-0 flex-1 space-y-2">
              {/* Nom + Statut */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-[#082545] truncate" style={{ fontFamily: 'var(--font-heading)' }}>
                  {lead.civilite} {lead.prenom} {lead.nom}
                </h1>

                {/* Statut cliquable — menu filtré */}
                <div className="relative">
                  <button
                    onClick={() => setShowStatutMenu(p => !p)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium text-white hover:opacity-90 transition"
                    style={{ backgroundColor: statut.color }}
                  >
                    {statut.label}
                    <ChevronDown className="w-3 h-3" />
                  </button>

                  {showStatutMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowStatutMenu(false)} />
                      <div className="absolute left-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-50 py-1 max-h-64 overflow-y-auto animate-scaleIn origin-top-left">
                        {validTransitions.map((statusKey) => {
                          const statusConfig = STATUTS_LEAD[statusKey]
                          return (
                            <button
                              key={statusKey}
                              onClick={() => handleChangeStatut(statusKey)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 transition text-left"
                            >
                              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: statusConfig.color }} />
                              {statusConfig.label}
                            </button>
                          )
                        })}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Contact info + copie */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500">
                {lead.email && (
                  <button onClick={() => handleCopy(lead.email!, 'Email')} className="flex items-center gap-1 hover:text-[#2EC6F3] transition truncate max-w-[200px]" title={lead.email}>
                    <Mail className="w-3 h-3 shrink-0" />
                    <span className="truncate">{lead.email}</span>
                    <Copy className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100" />
                  </button>
                )}
                {lead.telephone && (
                  <button onClick={() => handleCopy(lead.telephone!, 'Téléphone')} className="flex items-center gap-1 hover:text-[#2EC6F3] transition" title={lead.telephone}>
                    <Phone className="w-3 h-3" />
                    {formatPhone(lead.telephone)}
                  </button>
                )}
                <span className="text-gray-300">|</span>
                <span className="text-xs">{scoreLabel} · {lead.source.replace(/_/g, ' ')} · {formatDate(lead.created_at)}</span>
              </div>
            </div>

            {/* Score proéminent - cercle 48px */}
            <div className="shrink-0">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg border-2 border-white shadow-lg"
                style={{ backgroundColor: scoreColor }}
                title={`Score: ${lead.score_chaud}/100 - ${scoreLabel}`}
              >
                {lead.score_chaud}
              </div>
            </div>
          </div>

          {/* Ligne 2: Barre complétion + Actions tactiles */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
            {/* Barre de complétion profil */}
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="flex-1 max-w-[200px] h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${completionPct}%`,
                    backgroundColor: completionPct >= 80 ? '#22C55E' : completionPct >= 50 ? '#F59E0B' : '#94A3B8'
                  }}
                />
              </div>
              <span className="text-[10px] text-gray-400 whitespace-nowrap">Profil {completionPct}%</span>
              {completionPct < 80 && (
                <button
                  onClick={() => { setActiveTab('infos'); setIsEditing(true) }}
                  className="text-[10px] text-[#2EC6F3] hover:underline whitespace-nowrap"
                >
                  Compléter
                </button>
              )}
            </div>

            {/* Actions rapides — 44x44px tactile */}
            <div className="flex flex-wrap items-center gap-2">
              {lead.telephone && (
                <a href={`tel:${lead.telephone}`} className="flex items-center justify-center w-11 h-11 sm:w-auto sm:h-auto sm:px-3 sm:py-2.5 bg-green-50 text-green-700 rounded-lg text-sm hover:bg-green-100 transition font-medium">
                  <Phone className="w-4 h-4" />
                  <span className="hidden sm:inline sm:ml-2">Appeler</span>
                </a>
              )}
              {lead.email && (
                <a href={`mailto:${lead.email}`} className="flex items-center justify-center w-11 h-11 sm:w-auto sm:h-auto sm:px-3 sm:py-2.5 bg-blue-50 text-blue-700 rounded-lg text-sm hover:bg-blue-100 transition font-medium">
                  <Mail className="w-4 h-4" />
                  <span className="hidden sm:inline sm:ml-2">Email</span>
                </a>
              )}
              {lead.whatsapp && (
                <a href={`https://wa.me/${lead.whatsapp.replace(/[^\d]/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-11 h-11 sm:w-auto sm:h-auto sm:px-3 sm:py-2.5 bg-emerald-50 text-emerald-700 rounded-lg text-sm hover:bg-emerald-100 transition font-medium">
                  <MessageCircle className="w-4 h-4" />
                  <span className="hidden sm:inline sm:ml-2">WhatsApp</span>
                </a>
              )}
              <button
                onClick={async () => {
                  if (!lead) return
                  toast.info('Recherche en cours...')
                  try {
                    const result = await aiResearch.mutateAsync({
                      nom: `${lead.prenom} ${lead.nom || ''}`.trim(),
                      entreprise: lead.entreprise_nom || undefined,
                      ville: lead.adresse?.ville || 'Paris',
                      secteur: 'esthetique formation beaute',
                    })
                    setResearchData(result)
                    toast.success('Recherche terminee')
                  } catch {
                    toast.error('Recherche indisponible')
                  }
                }}
                disabled={aiResearch.isPending}
                className="flex items-center justify-center w-11 h-11 sm:w-auto sm:h-auto sm:px-3 sm:py-2.5 bg-cyan-50 text-cyan-700 rounded-lg text-sm hover:bg-cyan-100 transition font-medium disabled:opacity-50"
                title="Rechercher des informations sur ce prospect"
              >
                <Sparkles className={cn('w-4 h-4', aiResearch.isPending && 'animate-spin')} />
                <span className="hidden sm:inline sm:ml-2">{aiResearch.isPending ? 'Recherche...' : 'Enrichir'}</span>
              </button>
              <div className="hidden sm:block w-px h-6 bg-gray-200" />
              <button onClick={() => setShowInscrire(true)} className="flex items-center justify-center w-11 h-11 sm:w-auto sm:h-auto sm:px-3 sm:py-2.5 bg-violet-50 text-violet-700 rounded-lg text-sm hover:bg-violet-100 transition font-medium">
                <GraduationCap className="w-4 h-4" />
                <span className="hidden sm:inline sm:ml-2">Inscrire</span>
              </button>
              <button onClick={() => setShowAssign(true)} className="flex items-center justify-center w-11 h-11 sm:w-auto sm:h-auto sm:px-3 sm:py-2.5 bg-gray-50 text-gray-600 rounded-lg text-sm hover:bg-gray-100 transition">
                <Target className="w-4 h-4" />
                <span className="hidden lg:inline lg:ml-2">{lead.commercial_assigne ? lead.commercial_assigne.prenom : 'Assigner'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Resultats recherche prospect IA */}
      {researchData && (
        <div className="bg-cyan-50/50 border border-cyan-200 rounded-xl p-4 space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-cyan-800 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Recherche prospect
            </h3>
            <button onClick={() => setResearchData(null)} className="text-cyan-400 hover:text-cyan-600 transition">
              <X className="w-4 h-4" />
            </button>
          </div>
          {!!researchData.resume && (
            <p className="text-sm text-gray-700">{String(researchData.resume)}</p>
          )}
          {Array.isArray(researchData.talking_points) && researchData.talking_points.length > 0 && (
            <div>
              <p className="text-xs font-medium text-cyan-700 mb-1">Points de conversation</p>
              <ul className="space-y-1">
                {(researchData.talking_points as string[]).map((point: string, i: number) => (
                  <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                    <span className="text-cyan-400 mt-0.5">-</span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {Array.isArray(researchData.opportunites) && researchData.opportunites.length > 0 && (
            <div>
              <p className="text-xs font-medium text-green-700 mb-1">Opportunites</p>
              <ul className="space-y-1">
                {(researchData.opportunites as string[]).map((opp: string, i: number) => (
                  <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                    <Check className="w-3 h-3 text-green-500 mt-0.5 shrink-0" />
                    {opp}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* ===== BRIQUES CRM INTELLIGENTES ===== */}
      {/* Parcours client - barre de progression compacte */}
      <ParcoursClient leadId={id} compact />

      {/* Actions contextuelles intelligentes */}
      <LeadActionHub
        leadId={id}
        onActionClick={(action) => {
          if (action === 'inscrire' || action === 'proposer_formation') {
            setShowWizard(true)
          }
          if (action === 'qualifier') {
            setActiveTab('infos')
            setIsEditing(true)
          }
          if (action === 'simuler_financement') {
            setActiveTab('financement')
          }
        }}
      />

      {/* ===== TABS — Scrollable mobile avec fade gradient ===== */}
      <div className="border-b border-gray-200 -mx-4 sm:mx-0 px-4 sm:px-0">
        <div className="relative">
          <div className="flex gap-1 sm:gap-6 overflow-x-auto scroll-smooth scrollbar-hide -webkit-overflow-scrolling-touch">
            {TABS.map((tab) => {
              const Icon = tab.icon
              const count = tab.id === 'communication' ? messages.length
                : tab.id === 'documents' ? (lead.documents?.length || 0)
                : tab.id === 'financement' ? (lead.financements?.length || 0)
                : undefined
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-4 sm:px-1 py-3 text-sm font-medium border-b-2 transition-colors min-w-fit whitespace-nowrap',
                    activeTab === tab.id
                      ? 'border-[#2EC6F3] text-[#2EC6F3]'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.mobileLabel}</span>
                  {count !== undefined && count > 0 && (
                    <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[10px] rounded-full font-medium">{count}</span>
                  )}
                </button>
              )
            })}
          </div>
          {/* Fade gradient à droite pour indiquer plus de tabs */}
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none sm:hidden" />
        </div>
      </div>

      {/* ===== TAB CONTENT ===== */}
      <div className="space-y-6">
        {activeTab === 'infos' && (
          <InformationsTab
            lead={lead}
            isEditing={isEditing}
            editedLead={editedLead}
            setEditedLead={setEditedLead}
            setIsEditing={setIsEditing}
            handleSave={handleSave}
            newTag={newTag}
            setNewTag={setNewTag}
            handleAddTag={handleAddTag}
            handleRemoveTag={handleRemoveTag}
            isLoading={updateLead.isPending}
          />
        )}
        {activeTab === 'communication' && (
          <CommunicationTab
            lead={lead}
            messages={messages}
            cadenceInstances={cadenceInstances}
            messageCanal={messageCanal}
            setMessageCanal={setMessageCanal}
            messageContent={messageContent}
            setMessageContent={setMessageContent}
            messageSubject={messageSubject}
            setMessageSubject={setMessageSubject}
            handleSendMessage={handleSendMessage}
            isSending={sendMessage.isPending}
          />
        )}
        {activeTab === 'financement' && <FinancementTab lead={lead} />}
        {activeTab === 'documents' && <DocumentsTab lead={lead} />}
        {activeTab === 'historique' && <HistoriqueTab leadId={lead.id} />}
      </div>

      {/* Dialogs */}
      <InscrireLeadDialog open={showInscrire} onClose={() => setShowInscrire(false)} lead={lead} />
      <AssignCommercialDialog open={showAssign} onClose={() => setShowAssign(false)} lead={lead} />

      {/* Wizard inscription intelligent */}
      {showWizard && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <Suspense fallback={
              <div className="p-8 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-[#2EC6F3] border-t-transparent rounded-full animate-spin" />
                <span className="ml-3 text-slate-600">Chargement du wizard...</span>
              </div>
            }>
              <WizardInscription
                leadId={id}
                onComplete={(inscriptionId) => {
                  setShowWizard(false)
                  toast.success('Inscription créée avec succès')
                }}
                onCancel={() => setShowWizard(false)}
              />
            </Suspense>
          </div>
        </div>
      )}
    </div>
  )
}

// ===== INFORMATIONS TAB — Réorganisée pour la vitesse =====
function InformationsTab({
  lead, isEditing, editedLead, setEditedLead, setIsEditing,
  handleSave, newTag, setNewTag, handleAddTag, handleRemoveTag, isLoading
}: {
  lead: Lead; isEditing: boolean; editedLead: Partial<Lead>
  setEditedLead: (fn: (prev: Partial<Lead>) => Partial<Lead>) => void
  setIsEditing: (editing: boolean) => void; handleSave: () => void
  newTag: string; setNewTag: (tag: string) => void
  handleAddTag: () => void; handleRemoveTag: (tag: string) => void
  isLoading: boolean
}) {
  return (
    <div className="space-y-6">
      {/* Actions bar — toujours visible en haut */}
      <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Info className="w-3.5 h-3.5" />
          {isEditing ? 'Modifiez les champs puis sauvegardez' : 'Cliquez sur Modifier pour éditer'}
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <button
                onClick={() => { setIsEditing(false); setEditedLead(() => ({})) }}
                disabled={isLoading}
                className="px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-white transition min-h-[36px]"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#2EC6F3] text-white rounded-lg hover:bg-[#2EC6F3]/90 transition disabled:opacity-50 min-h-[36px]"
              >
                {isLoading ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Sauvegarder
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#2EC6F3] text-white rounded-lg hover:bg-[#2EC6F3]/90 transition min-h-[36px]"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Modifier
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Colonne gauche — Contact (le plus important en premier) */}
        <div className="space-y-4 sm:space-y-6">
          <Section title="Contact" icon={<Phone className="w-4 h-4" />}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <EditableField label="Prénom *" value={lead.prenom} field="prenom" isEditing={isEditing} editedLead={editedLead} setEditedLead={setEditedLead} autoFocus />
              <EditableField label="Nom" value={lead.nom || ''} field="nom" isEditing={isEditing} editedLead={editedLead} setEditedLead={setEditedLead} />
              <EditableField label="Email" value={lead.email || ''} field="email" isEditing={isEditing} editedLead={editedLead} setEditedLead={setEditedLead} type="email" />
              <EditableField label="Téléphone" value={lead.telephone || ''} field="telephone" isEditing={isEditing} editedLead={editedLead} setEditedLead={setEditedLead} type="tel" displayValue={formatPhone(lead.telephone || '')} />
              <EditableField label="WhatsApp" value={lead.whatsapp || ''} field="whatsapp" isEditing={isEditing} editedLead={editedLead} setEditedLead={setEditedLead} />
              <EditableField label="Date de naissance" value={lead.date_naissance || ''} field="date_naissance" isEditing={isEditing} editedLead={editedLead} setEditedLead={setEditedLead} type="date" />
            </div>
          </Section>

          <Section title="Profil professionnel" icon={<Building2 className="w-4 h-4" />}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <SelectField label="Statut pro" value={lead.statut_pro || ''} field="statut_pro" isEditing={isEditing} editedLead={editedLead} setEditedLead={setEditedLead} options={STATUT_PRO_OPTIONS} />
              <SelectField label="Expérience" value={lead.experience_esthetique || ''} field="experience_esthetique" isEditing={isEditing} editedLead={editedLead} setEditedLead={setEditedLead} options={EXPERIENCE_OPTIONS} />
              <EditableField label="Entreprise" value={lead.entreprise_nom || ''} field="entreprise_nom" isEditing={isEditing} editedLead={editedLead} setEditedLead={setEditedLead} />
              <EditableField label="SIRET" value={lead.siret || ''} field="siret" isEditing={isEditing} editedLead={editedLead} setEditedLead={setEditedLead} />
            </div>
            <div className="mt-3">
              <label className="block text-xs font-medium text-gray-500 mb-1">Objectif professionnel</label>
              <textarea
                value={isEditing ? (editedLead.objectif_pro ?? lead.objectif_pro ?? '') : (lead.objectif_pro || '')}
                onChange={(e) => setEditedLead(prev => ({ ...prev, objectif_pro: e.target.value }))}
                disabled={!isEditing}
                rows={2}
                placeholder={isEditing ? 'Ex: Ouvrir mon institut, ajouter une prestation...' : ''}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm disabled:bg-gray-50 disabled:text-gray-600 resize-none"
              />
            </div>
          </Section>
        </div>

        {/* Colonne droite — Contexte */}
        <div className="space-y-4 sm:space-y-6">
          {/* Formation principale — mise en avant */}
          <Section title="Formation souhaitée" icon={<GraduationCap className="w-4 h-4" />}>
            {lead.formation_principale ? (
              <div className="p-4 bg-[#2EC6F3]/5 border border-[#2EC6F3]/20 rounded-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-[#082545]">{lead.formation_principale.nom}</h4>
                    <p className="text-sm text-gray-500 mt-0.5">{lead.formation_principale.categorie}</p>
                  </div>
                  <span className="text-lg font-bold text-[#2EC6F3]">{formatEuro(lead.formation_principale.prix_ht)}</span>
                </div>
                {lead.financement_souhaite && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-md w-fit">
                    <Wallet className="w-3 h-3" />
                    Financement souhaité {lead.organisme_financement && `(${lead.organisme_financement})`}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">Aucune formation sélectionnée</p>
            )}
          </Section>

          {/* Formations recommandées */}
          <FormationSuggester
            leadId={lead.id}
            compact
            onSelect={(formationId) => {
              // Ouvrir le wizard avec la formation pré-sélectionnée
              setShowWizard(true)
            }}
          />

          {/* Adresse */}
          <Section title="Adresse" icon={<MapPin className="w-4 h-4" />}>
            <div className="space-y-3">
              <EditableField label="Rue" value={lead.adresse?.rue || ''} field="adresse.rue" isEditing={isEditing} editedLead={editedLead} setEditedLead={setEditedLead} isAddress />
              <div className="grid grid-cols-2 gap-3">
                <EditableField label="Code postal" value={lead.adresse?.code_postal || ''} field="adresse.code_postal" isEditing={isEditing} editedLead={editedLead} setEditedLead={setEditedLead} isAddress />
                <EditableField label="Ville" value={lead.adresse?.ville || ''} field="adresse.ville" isEditing={isEditing} editedLead={editedLead} setEditedLead={setEditedLead} isAddress />
              </div>
            </div>
          </Section>

          {/* Inscriptions — affiche les inscriptions existantes + lien paiement */}
          {lead.inscriptions && lead.inscriptions.length > 0 && (
            <Section title={`Inscriptions (${lead.inscriptions.length})`} icon={<GraduationCap className="w-4 h-4" />}>
              <div className="space-y-3">
                {lead.inscriptions.map((insc: Inscription) => {
                  const formation = insc.session?.formation
                  return (
                    <div key={insc.id} className="border border-gray-200 rounded-lg p-3 hover:border-gray-300 transition">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="font-medium text-[#082545] text-sm truncate">{formation?.nom || 'Formation'}</h4>
                          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-gray-500">
                            {insc.session && (
                              <Link href={`/session/${insc.session.id}`} className="text-[#2EC6F3] hover:underline">
                                {formatDate(insc.session.date_debut, { day: 'numeric', month: 'short' })}
                              </Link>
                            )}
                            <span>{formatEuro(insc.montant_total)}</span>
                            <span className={cn(
                              'px-1.5 py-0.5 rounded-full text-[10px] font-medium',
                              insc.paiement_statut === 'PAYE' ? 'bg-green-100 text-green-700' :
                              insc.paiement_statut === 'EN_ATTENTE' ? 'bg-amber-100 text-amber-700' :
                              'bg-gray-100 text-gray-600'
                            )}>
                              {insc.paiement_statut.replace(/_/g, ' ').toLowerCase()}
                            </span>
                          </div>
                        </div>
                        {insc.paiement_statut !== 'PAYE' && (
                          <PaymentLinkButton lead={lead} inscription={insc} />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </Section>
          )}

          {/* Tags — inline edit, pas besoin de mode édition */}
          <Section title="Tags" icon={<Tag className="w-4 h-4" />}>
            <div className="flex flex-wrap gap-2">
              {lead.tags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-xs group">
                  {tag}
                  <button onClick={() => handleRemoveTag(tag)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <div className="inline-flex items-center gap-1">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                  placeholder="+ tag"
                  className="w-20 px-2 py-1 border border-dashed border-gray-300 rounded-full text-xs text-center focus:border-[#2EC6F3] focus:w-32 transition-all outline-none"
                />
              </div>
            </div>
          </Section>

          {/* Notes */}
          <Section title="Notes" icon={<Edit3 className="w-4 h-4" />}>
            <textarea
              value={isEditing ? (editedLead.notes ?? lead.notes ?? '') : (lead.notes || '')}
              onChange={(e) => setEditedLead(prev => ({ ...prev, notes: e.target.value }))}
              disabled={!isEditing}
              rows={3}
              placeholder={isEditing ? 'Notes internes sur ce lead...' : 'Aucune note'}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm disabled:bg-gray-50 disabled:text-gray-600 resize-none"
            />
          </Section>
        </div>
      </div>
    </div>
  )
}

// ===== COMMUNICATION TAB — Message canal UI améliorée =====
function CommunicationTab({
  lead, messages, cadenceInstances,
  messageCanal, setMessageCanal, messageContent, setMessageContent,
  messageSubject, setMessageSubject, handleSendMessage, isSending
}: {
  lead: Lead; messages: Message[]; cadenceInstances: any[]
  messageCanal: CanalMessage; setMessageCanal: (c: CanalMessage) => void
  messageContent: string; setMessageContent: (c: string) => void
  messageSubject: string; setMessageSubject: (s: string) => void
  handleSendMessage: () => void; isSending: boolean
}) {
  const sortedMessages = [...messages].sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  const renderMessageFields = () => {
    switch (messageCanal) {
      case 'email':
        return (
          <>
            <input
              type="text"
              placeholder="Sujet de l'email..."
              value={messageSubject}
              onChange={(e) => setMessageSubject(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#2EC6F3]/30 focus:border-[#2EC6F3] outline-none"
            />
            <textarea
              placeholder="Votre message email..."
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              rows={4}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm resize-none focus:ring-2 focus:ring-[#2EC6F3]/30 focus:border-[#2EC6F3] outline-none"
            />
          </>
        )
      case 'appel':
        return (
          <div className="space-y-3">
            <div className="text-sm text-gray-600 bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Phone className="w-4 h-4 text-amber-600" />
                <span className="font-medium">Appel téléphonique</span>
              </div>
              <p className="text-xs">Une fois l'appel terminé, ajoutez vos notes ci-dessous et cliquez sur "Marquer comme effectué".</p>
            </div>
            <textarea
              placeholder="Notes de l'appel : sujets abordés, réponses du prospect, prochaines étapes..."
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              rows={3}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm resize-none focus:ring-2 focus:ring-[#2EC6F3]/30 focus:border-[#2EC6F3] outline-none"
            />
          </div>
        )
      default:
        return (
          <textarea
            placeholder={`Votre message ${CANAUX_MESSAGE.find(c => c.id === messageCanal)?.label.toLowerCase()}...`}
            value={messageContent}
            onChange={(e) => setMessageContent(e.target.value)}
            rows={3}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm resize-none focus:ring-2 focus:ring-[#2EC6F3]/30 focus:border-[#2EC6F3] outline-none"
          />
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Composer — en haut, toujours visible */}
      <Section title="Nouveau message" icon={<Send className="w-4 h-4" />}>
        <div className="space-y-3">
          {/* Canal selector — grille responsive */}
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {CANAUX_MESSAGE.map((canal) => {
              const Icon = canal.icon
              return (
                <button
                  key={canal.id}
                  onClick={() => setMessageCanal(canal.id)}
                  className={cn(
                    'flex flex-col items-center gap-1 p-2.5 sm:p-3 rounded-lg text-xs transition min-h-[56px]',
                    messageCanal === canal.id
                      ? 'bg-[#2EC6F3]/10 text-[#2EC6F3] ring-2 ring-[#2EC6F3]/30'
                      : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{canal.label}</span>
                </button>
              )
            })}
          </div>

          {/* Champs contextuels selon le canal */}
          {renderMessageFields()}

          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400">
              {CANAUX_MESSAGE.find(c => c.id === messageCanal)?.hint}
            </p>
            <button
              onClick={handleSendMessage}
              disabled={!messageContent.trim() || isSending}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#2EC6F3] text-white rounded-lg hover:bg-[#2EC6F3]/90 transition disabled:opacity-50 min-h-[44px] font-medium"
            >
              {isSending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
              {messageCanal === 'appel' ? 'Marquer comme effectué' : 'Envoyer'}
            </button>
          </div>
        </div>
      </Section>

      {/* Cadences actives */}
      {cadenceInstances.length > 0 && (
        <Section title="Cadences actives" icon={<Play className="w-4 h-4" />}>
          {cadenceInstances.map((instance) => (
            <div key={instance.id} className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div>
                <p className="font-medium text-amber-900 text-sm">{instance.template?.nom}</p>
                <p className="text-xs text-amber-700">Étape {instance.etape_courante + 1} · Prochaine: {formatDate(instance.prochaine_execution)}</p>
              </div>
              <button className="p-2 text-amber-600 hover:bg-amber-100 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center">
                <Pause className="w-4 h-4" />
              </button>
            </div>
          ))}
        </Section>
      )}

      {/* Timeline messages */}
      <Section title={`Messages (${messages.length})`} icon={<MessageSquareText className="w-4 h-4" />}>
        {sortedMessages.length > 0 ? (
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {sortedMessages.map((message) => {
              const canalConfig = CANAUX_MESSAGE.find(c => c.id === message.canal)
              const Icon = canalConfig?.icon || MessageSquare
              const color = canalConfig?.color || '#6B7280'
              const isOutbound = message.direction === 'outbound'
              return (
                <div key={message.id} className={cn('flex', isOutbound ? 'justify-end' : 'justify-start')}>
                  <div className={cn('max-w-[85%] sm:max-w-[70%]', isOutbound ? 'order-2' : 'order-1')}>
                    <div className={cn(
                      'p-3 rounded-2xl',
                      isOutbound ? 'bg-[#2EC6F3] text-white rounded-br-md' :
                      message.canal === 'note_interne' ? 'bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-bl-md' :
                      'bg-gray-100 text-gray-800 rounded-bl-md'
                    )}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <Icon className="w-3 h-3" style={{ color: isOutbound ? 'white' : color }} />
                        {message.sujet && <span className="font-medium text-xs">{message.sujet}</span>}
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{message.contenu}</p>
                    </div>
                    <div className={cn('flex items-center gap-2 mt-1 text-[10px] text-gray-400', isOutbound ? 'justify-end' : '')}>
                      <span>{formatDate(message.created_at)}</span>
                      {message.statut === 'delivre' && <Check className="w-3 h-3 text-green-500" />}
                      {message.statut === 'erreur' && <AlertCircle className="w-3 h-3 text-red-500" />}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-center text-gray-400 py-8 text-sm">Aucun message échangé</p>
        )}
      </Section>
    </div>
  )
}

// ===== FINANCEMENT TAB =====
function FinancementTab({ lead }: { lead: Lead }) {
  return (
    <div className="space-y-6">
      {/* Financement express - simulation rapide */}
      <FinancementExpress
        leadId={lead.id}
        formationPrix={lead.formation_principale?.prix_ht || 1400}
        formationDureeHeures={lead.formation_principale?.duree_heures || 14}
        compact
      />

      <Section title="Statut financement" icon={<Wallet className="w-4 h-4" />}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Financement souhaité</label>
            <div className={cn('flex items-center gap-2', lead.financement_souhaite ? 'text-green-600' : 'text-gray-400')}>
              {lead.financement_souhaite ? <CheckCircle className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
              <span className="text-sm font-medium">{lead.financement_souhaite ? 'Oui' : 'Non'}</span>
            </div>
          </div>
          {lead.organisme_financement && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Organisme ciblé</label>
              <span className="text-sm font-medium text-gray-700">{lead.organisme_financement}</span>
            </div>
          )}
        </div>
      </Section>

      {lead.financements && lead.financements.length > 0 && (
        <Section title={`Dossiers (${lead.financements.length})`} icon={<FileText className="w-4 h-4" />}>
          <div className="space-y-4">
            {lead.financements.map((fin: Financement) => (
              <div key={fin.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-medium text-[#082545]">{fin.organisme}</h4>
                      <span className={cn(
                        'px-2 py-0.5 rounded-full text-xs font-medium',
                        fin.statut === 'VALIDE' || fin.statut === 'VERSE' ? 'bg-green-100 text-green-800' :
                        fin.statut === 'REFUSE' ? 'bg-red-100 text-red-800' :
                        fin.statut === 'EN_EXAMEN' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      )}>
                        {fin.statut.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 flex flex-wrap gap-x-4 gap-y-1">
                      <span>Demandé: {formatEuro(fin.montant_demande || 0)}</span>
                      {fin.montant_accorde && <span className="text-green-600 font-medium">Accordé: {formatEuro(fin.montant_accorde)}</span>}
                      {fin.date_soumission && <span>Soumis: {formatDate(fin.date_soumission)}</span>}
                    </div>
                  </div>
                  <Link href={`/financement`} className="flex items-center gap-1 text-[#2EC6F3] hover:text-[#2EC6F3]/80 text-xs shrink-0">
                    Détails <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>

                {fin.documents && fin.documents.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex flex-wrap gap-2">
                      {fin.documents.map((doc, i) => (
                        <span key={i} className={cn(
                          'inline-flex items-center gap-1 px-2 py-1 rounded text-[11px]',
                          doc.statut === 'valide' ? 'bg-green-50 text-green-700' :
                          doc.statut === 'fourni' ? 'bg-amber-50 text-amber-700' :
                          'bg-gray-50 text-gray-500'
                        )}>
                          {doc.statut === 'valide' ? <CheckCircle className="w-3 h-3" /> :
                           doc.statut === 'fourni' ? <Clock className="w-3 h-3" /> :
                           <Circle className="w-3 h-3" />}
                          {doc.nom}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {(!lead.financements || lead.financements.length === 0) && (
        <div className="text-center py-10">
          <CreditCard className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm mb-4">{lead.financement_souhaite ? 'Aucun dossier créé' : 'Aucun financement demandé'}</p>
          <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#2EC6F3] text-white rounded-lg text-sm hover:bg-[#2EC6F3]/90 transition min-h-[44px]">
            <Plus className="w-4 h-4" />
            Créer un dossier
          </button>
        </div>
      )}
    </div>
  )
}

// ===== DOCUMENTS TAB =====
function DocumentsTab({ lead }: { lead: Lead }) {
  return (
    <div>
      {lead.documents && lead.documents.length > 0 ? (
        <Section title={`Documents (${lead.documents.length})`} icon={<FileText className="w-4 h-4" />}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {lead.documents.map((doc) => (
              <div key={doc.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition group">
                <div className="flex items-start justify-between mb-2">
                  <FileText className="w-6 h-6 text-gray-400" />
                  {doc.is_signed && (
                    <span className="px-2 py-0.5 bg-green-100 text-green-800 text-[10px] rounded-full font-medium">Signé</span>
                  )}
                </div>
                <h4 className="font-medium text-sm text-[#082545] truncate">{doc.filename}</h4>
                <p className="text-xs text-gray-400 mt-1">{doc.type.replace(/_/g, ' ')} · {formatDate(doc.created_at)}</p>
                <button className="flex items-center gap-1 text-[#2EC6F3] text-xs mt-3 opacity-0 group-hover:opacity-100 transition min-h-[32px]">
                  <Download className="w-3 h-3" />
                  Télécharger
                </button>
              </div>
            ))}
          </div>
        </Section>
      ) : (
        <div className="text-center py-10">
          <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm mb-4">Aucun document</p>
          <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#2EC6F3] text-white rounded-lg text-sm hover:bg-[#2EC6F3]/90 transition min-h-[44px]">
            <Plus className="w-4 h-4" />
            Ajouter un document
          </button>
        </div>
      )}
    </div>
  )
}

// ===== HISTORIQUE TAB =====
function HistoriqueTab({ leadId }: { leadId: string }) {
  return (
    <Section title="Historique des activités" icon={<Clock className="w-4 h-4" />}>
      <ActivityTimeline leadId={leadId} limit={50} />
    </Section>
  )
}

// ===== SHARED COMPONENTS =====

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6">
      <h3 className="font-semibold text-[#082545] flex items-center gap-2 mb-4 text-sm sm:text-base">
        <span className="text-[#2EC6F3]">{icon}</span>
        {title}
      </h3>
      {children}
    </div>
  )
}

function EditableField({
  label, value, field, isEditing, editedLead, setEditedLead,
  type = 'text', displayValue, autoFocus, isAddress
}: {
  label: string; value: string; field: string; isEditing: boolean
  editedLead: Partial<Lead>; setEditedLead: (fn: (prev: Partial<Lead>) => Partial<Lead>) => void
  type?: string; displayValue?: string; autoFocus?: boolean; isAddress?: boolean
}) {
  const getEditValue = () => {
    if (isAddress) {
      const parts = field.split('.')
      return (editedLead.adresse as any)?.[parts[1]] ?? value
    }
    return (editedLead as any)[field.split('.').pop()!] ?? value
  }

  const handleChange = (newValue: string) => {
    if (isAddress) {
      const parts = field.split('.')
      setEditedLead(prev => ({
        ...prev,
        adresse: { ...prev.adresse, [parts[1]]: newValue }
      }))
    } else {
      setEditedLead(prev => ({ ...prev, [field]: newValue }))
    }
  }

  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      {isEditing ? (
        <input
          type={type}
          value={getEditValue()}
          onChange={(e) => handleChange(e.target.value)}
          autoFocus={autoFocus}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#2EC6F3]/30 focus:border-[#2EC6F3] outline-none"
        />
      ) : (
        <p className="text-sm text-gray-800 py-2 min-h-[36px]">
          {displayValue || value || <span className="text-gray-300 italic">—</span>}
        </p>
      )}
    </div>
  )
}

function SelectField({
  label, value, field, isEditing, editedLead, setEditedLead, options
}: {
  label: string; value: string; field: string; isEditing: boolean
  editedLead: Partial<Lead>; setEditedLead: (fn: (prev: Partial<Lead>) => Partial<Lead>) => void
  options: { value: string; label: string }[]
}) {
  const currentValue = (editedLead as any)[field] ?? value

  if (!isEditing) {
    const opt = options.find(o => o.value === value)
    return (
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
        <p className="text-sm text-gray-800 py-2 min-h-[36px]">
          {opt?.label || value || <span className="text-gray-300 italic">—</span>}
        </p>
      </div>
    )
  }

  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <select
        value={currentValue}
        onChange={(e) => setEditedLead(prev => ({ ...prev, [field]: e.target.value }))}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#2EC6F3]/30 focus:border-[#2EC6F3] outline-none"
      >
        <option value="">— Sélectionner —</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  )
}

// Calcul complétion profil
function getCompletionPercent(lead: Lead): number {
  const fields = [
    lead.prenom, lead.nom, lead.email, lead.telephone,
    lead.statut_pro, lead.experience_esthetique,
    lead.formation_principale_id, lead.objectif_pro,
    lead.adresse?.ville, lead.date_naissance
  ]
  const filled = fields.filter(Boolean).length
  return Math.round((filled / fields.length) * 100)
}