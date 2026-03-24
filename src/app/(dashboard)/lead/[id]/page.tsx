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
import { EnrichmentTabs } from '@/components/ui/EnrichmentTabs'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { toast } from 'sonner'
import {
  ArrowLeft, Phone, Mail, MessageCircle, MessageSquare,
  User, MessageSquareText, CreditCard, FileText, Clock,
  Edit3, Save, Plus, Send, Check, X,
  Tag, MapPin, GraduationCap, Building2,
  Target, Play, Pause, AlertCircle, Download,
  Wallet, Circle, CheckCircle, ChevronDown, Copy,
  Sparkles, Calendar, Activity,
  MoreHorizontal, FolderOpen
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Briques CRM intelligentes
import LeadActionHub from '@/components/crm/LeadActionHub'
import { GenerateDevisButton } from '@/components/leads/GenerateDevisButton'
import FormationSuggester from '@/components/crm/FormationSuggester'
import FinancementExpress from '@/components/crm/FinancementExpress'
const WizardInscription = lazy(() => import('@/components/crm/WizardInscription'))

// Composants IA invisibles
import { ProspectSummary } from '@/components/ui/ProspectSummary'
import { SmartActions } from '@/components/ui/SmartActions'

// ===== TYPES & CONFIG =====

const CANAUX_MESSAGE: { id: CanalMessage; label: string; icon: React.ElementType; color: string; hint: string }[] = [
  { id: 'email', label: 'Email', icon: Mail, color: '#3B82F6', hint: 'Envoi via Resend' },
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, color: '#10B981', hint: 'Ouvre WhatsApp' },
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

// Parcours client — stepper
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

function getCompletionPercent(lead: Lead): number {
  const fields = [lead.prenom, lead.nom, lead.email, lead.telephone, lead.statut_pro, lead.experience_esthetique, lead.formation_principale_id, lead.objectif_pro, lead.adresse?.ville, lead.date_naissance]
  return Math.round((fields.filter(Boolean).length / fields.length) * 100)
}

// ===== COMPOSANTS COLLAPSIBLES =====

function CollapsibleSection({
  title,
  icon,
  defaultOpen = false,
  children,
  badge,
  className = ""
}: {
  title: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
  badge?: string | number;
  className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className={cn("bg-white rounded-xl border border-[#EEEEEE]", className)}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#FAF8F5] transition"
      >
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="font-semibold text-[#111111]" style={{ fontFamily: 'var(--font-heading)' }}>
            {title}
          </h3>
          {badge && (
            <span className="text-[10px] bg-[#FAF8F5] text-[#666666] px-2 py-0.5 rounded-full">
              {badge}
            </span>
          )}
        </div>
        <ChevronDown className={cn("w-4 h-4 transition-transform text-[#666666]", open && "rotate-180")} />
      </button>
      {open && (
        <div className="px-5 pb-5 border-t border-[#EEEEEE] pt-4">
          {children}
        </div>
      )}
    </div>
  )
}

function ParcoursSteps({ statut }: { statut: StatutLead }) {
  const etapeIndex = getEtapeIndex(statut)

  return (
    <div className="bg-white rounded-xl border border-[#EEEEEE] p-5">
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-4 h-4 text-[#FF5C00]" />
        <h3 className="font-semibold text-[#111111]" style={{ fontFamily: 'var(--font-heading)' }}>
          Parcours client
        </h3>
      </div>

      <div className="flex items-center justify-between">
        {ETAPES_PARCOURS.map((etape, i) => {
          const isComplete = i < etapeIndex
          const isActive = i === etapeIndex
          const isFuture = i > etapeIndex

          return (
            <div key={etape.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium mb-2',
                  isActive ? 'bg-[#FF5C00] text-white' :
                  isComplete ? 'bg-[#10B981] text-white' :
                  'bg-[#EEEEEE] text-[#666666]'
                )}>
                  {isComplete ? <Check className="w-4 h-4" /> : i + 1}
                </div>
                <span className={cn(
                  'text-xs font-medium text-center',
                  isActive ? 'text-[#FF5C00]' :
                  isComplete ? 'text-[#10B981]' :
                  'text-[#666666]'
                )}>
                  {etape.label}
                </span>
              </div>
              {i < ETAPES_PARCOURS.length - 1 && (
                <div className={cn(
                  'flex-1 h-0.5 mx-2 mt-[-16px]',
                  isComplete ? 'bg-[#10B981]' : 'bg-[#EEEEEE]'
                )} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function EditableField({ label, value, field, isEditing, editedLead, setEditedLead, type = 'text', displayValue, autoFocus = false, isAddress = false }: {
  label: string; value: string; field: string; isEditing: boolean; editedLead: Partial<Lead>; setEditedLead: (fn: (prev: Partial<Lead>) => Partial<Lead>) => void; type?: string; displayValue?: string; autoFocus?: boolean; isAddress?: boolean
}) {
  const getEditValue = () => {
    if (isAddress) return (editedLead.adresse as any)?.[field.split('.')[1]] ?? value
    return (editedLead as any)[field.split('.').pop()!] ?? value
  }

  const handleChange = (v: string) => {
    if (isAddress) {
      const k = field.split('.')[1]
      setEditedLead(prev => ({ ...prev, adresse: { ...prev.adresse, [k]: v } }))
    } else {
      setEditedLead(prev => ({ ...prev, [field]: v }))
    }
  }

  return (
    <div>
      <label className="block text-xs font-medium text-[#666666] mb-1">{label}</label>
      {isEditing ? (
        <input
          type={type}
          value={getEditValue()}
          onChange={(e) => handleChange(e.target.value)}
          autoFocus={autoFocus}
          className="w-full px-3 py-2 border border-[#EEEEEE] rounded-lg text-sm focus:ring-2 focus:ring-[#FF5C00]/30 focus:border-[#FF5C00] outline-none"
        />
      ) : (
        <p className="text-sm text-[#111111] py-2 min-h-[36px] flex items-center">
          {displayValue || value || <span className="text-[#999999] italic">—</span>}
        </p>
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
    return (
      <div>
        <label className="block text-xs font-medium text-[#666666] mb-1">{label}</label>
        <p className="text-sm text-[#111111] py-2 min-h-[36px] flex items-center">
          {opt?.label || value || <span className="text-[#999999] italic">—</span>}
        </p>
      </div>
    )
  }

  return (
    <div>
      <label className="block text-xs font-medium text-[#666666] mb-1">{label}</label>
      <select
        value={currentValue}
        onChange={(e) => setEditedLead(prev => ({ ...prev, [field]: e.target.value }))}
        className="w-full px-3 py-2 border border-[#EEEEEE] rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#FF5C00]/30 focus:border-[#FF5C00] outline-none"
      >
        <option value="">— Sélectionner —</option>
        {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
    </div>
  )
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
  const [showCelebrate, setShowCelebrate] = useState(false)

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
      setShowCelebrate(true)
      setTimeout(() => setShowCelebrate(false), 600)
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
      <div className="space-y-6 bg-[#FAF8F5] min-h-screen p-6">
        <div className="flex items-center gap-3">
          <div className="skeleton h-5 w-5 rounded" />
          <div className="skeleton h-12 w-12 rounded-full" />
          <div className="space-y-2"><div className="skeleton h-6 w-48" /><div className="skeleton h-4 w-32" /></div>
        </div>
        <SkeletonCard />
        <SkeletonCard />
      </div>
    )
  }

  if (!lead) {
    return (
      <div className="bg-[#FAF8F5] min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center mb-4">
            <User className="w-6 h-6 text-[#999999]" />
          </div>
          <h3 className="text-sm font-semibold text-[#111111] mb-1">Lead introuvable</h3>
          <p className="text-sm text-[#666666] mb-4">Ce lead n&apos;existe pas ou a été supprimé</p>
          <Link href="/leads" className="text-sm text-[#FF5C00] hover:underline">Retour aux prospects</Link>
        </div>
      </div>
    )
  }

  const statut = STATUTS_LEAD[lead.statut]
  const scoreColor = getScoreColor(lead.score_chaud)
  const scoreLabel = getScoreLabel(lead.score_chaud)
  const completionPct = getCompletionPercent(lead)
  const validTransitions = VALID_LEAD_TRANSITIONS[lead.statut] || []

  // Handler pour les actions intelligentes
  const handleSmartAction = (actionId: string) => {
    switch (actionId) {
      case 'first-call':
      case 'follow-up':
        window.open(`tel:${lead.telephone}`)
        break
      case 'verify-email':
        window.open(`mailto:${lead.email}`)
        break
      case 'hot-prospect':
        setShowWizard(true)
        break
      case 'send-quote':
        // Logique pour générer un devis
        break
      case 'follow-funding':
        // Logique pour relancer OPCO
        break
      case 'upsell-training':
        // Logique pour proposer formation complémentaire
        break
      default:
        console.log('Action non gérée:', actionId)
    }
  }

  return (
    <div className="bg-[#FAF8F5] min-h-screen">
      {/* ===== HEADER STICKY ===== */}
      <div className="sticky top-0 z-10 bg-white border-b border-[#EEEEEE] px-6 py-4">
        <div className="max-w-4xl mx-auto">
          {/* Ligne 1: Navigation + Nom + Score + Statut */}
          <div className="flex items-center gap-4 mb-3">
            <Link
              href="/leads"
              className="p-2 hover:bg-[#FAF8F5] rounded-lg transition shrink-0"
            >
              <ArrowLeft className="w-4 h-4 text-[#666666]" />
            </Link>

            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0" style={{ backgroundColor: scoreColor }}>
              {(lead.prenom[0] + (lead.nom?.[0] || '')).toUpperCase()}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-xl font-bold text-[#111111]" style={{ fontFamily: 'var(--font-heading)' }}>
                  {lead.prenom} {lead.nom}
                </h1>

                <div className="relative">
                  <button
                    onClick={() => setShowStatutMenu(p => !p)}
                    className={cn(
                      "flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium text-white",
                      showCelebrate && "animate-pulse"
                    )}
                    style={{ backgroundColor: statut.color }}
                  >
                    {statut.label}
                    {validTransitions.length > 0 && <ChevronDown className="w-3 h-3" />}
                  </button>

                  {showStatutMenu && validTransitions.length > 0 && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowStatutMenu(false)} />
                      <div className="absolute left-0 top-full mt-1 w-48 bg-white rounded-lg shadow-xl border z-50 py-1">
                        {validTransitions.map(sk => (
                          <button
                            key={sk}
                            onClick={() => handleChangeStatut(sk)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-[#FAF8F5] text-left"
                          >
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUTS_LEAD[sk].color }} />
                            {STATUTS_LEAD[sk].label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs"
                  style={{ backgroundColor: scoreColor }}
                  title={scoreLabel}
                >
                  {lead.score_chaud}
                </div>
              </div>

              <div className="text-xs text-[#666666]">
                {lead.entreprise_nom && <span className="font-medium text-[#111111]">{lead.entreprise_nom}</span>}
                {lead.entreprise_nom && <span className="mx-2">•</span>}
                <span>{lead.source.replace(/_/g, ' ')}</span>
                <span className="mx-2">•</span>
                <span>Ajouté le {formatDate(lead.created_at)}</span>
              </div>
            </div>
          </div>

          {/* Ligne 2: Actions rapides */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {lead.telephone && (
                <a
                  href={`tel:${lead.telephone}`}
                  className="flex items-center justify-center w-10 h-10 bg-[#10B981]/10 text-[#10B981] rounded-lg hover:bg-[#10B981]/20 transition"
                  title="Appeler"
                >
                  <Phone className="w-4 h-4" />
                </a>
              )}

              {lead.email && (
                <a
                  href={`mailto:${lead.email}`}
                  className="flex items-center justify-center w-10 h-10 bg-[#3B82F6]/10 text-[#3B82F6] rounded-lg hover:bg-[#3B82F6]/20 transition"
                  title="Email"
                >
                  <Mail className="w-4 h-4" />
                </a>
              )}

              {lead.telephone && (
                <a
                  href={`https://wa.me/${lead.telephone.replace(/[^\d]/g, '').replace(/^0/, '33')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-10 h-10 bg-[#10B981]/10 text-[#10B981] rounded-lg hover:bg-[#10B981]/20 transition"
                  title="WhatsApp"
                >
                  <MessageCircle className="w-4 h-4" />
                </a>
              )}

              <button
                onClick={() => setShowWizard(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#FF5C00] text-white rounded-lg hover:bg-[#E65200] transition text-sm font-medium"
              >
                <GraduationCap className="w-4 h-4" />
                Inscrire
              </button>
            </div>

            <div className="relative">
              <button
                onClick={() => setShowMoreActions(p => !p)}
                className="flex items-center justify-center w-10 h-10 bg-[#FAF8F5] text-[#666666] rounded-lg hover:bg-[#F4F0EB] transition"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {showMoreActions && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMoreActions(false)} />
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border z-50 py-1">
                    <button
                      onClick={() => { setShowMoreActions(false); setShowAssign(true) }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-xs hover:bg-[#FAF8F5] text-left"
                    >
                      <Target className="w-4 h-4 text-[#666666]" />
                      {lead.commercial_assigne ? 'Réassigner' : 'Assigner commercial'}
                    </button>
                    <button
                      onClick={() => { setShowMoreActions(false); setIsEditing(true) }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-xs hover:bg-[#FAF8F5] text-left"
                    >
                      <Edit3 className="w-4 h-4 text-[#666666]" />
                      Modifier la fiche
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ===== CONTENU PRINCIPAL ===== */}
      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* Stepper parcours */}
        <div className="mb-6">
          <ParcoursSteps statut={lead.statut} />
        </div>

        {/* Résumé contextuel IA */}
        <ProspectSummary lead={lead} />

        {/* Layout responsive : 2 colonnes desktop, 1 colonne mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonne principale - Contenu */}
          <div className="lg:col-span-2 space-y-6">
            {/* Actions intelligentes */}
            <LeadActionHub leadId={lead.id} onActionClick={(action) => {
              if (action === 'inscrire' || action === 'proposer_formation') setShowWizard(true)
              if (action === 'qualifier') setIsEditing(true)
            }} />

        {/* Section Informations */}
        <CollapsibleSection
          title="Informations"
          icon={<User className="w-4 h-4 text-[#FF5C00]" />}
          defaultOpen
          badge={`${completionPct}%`}
        >
          {isEditing && (
            <div className="flex items-center justify-end gap-2 mb-4 pb-4 border-b border-[#EEEEEE]">
              <button
                onClick={() => { setIsEditing(false); setEditedLead({}) }}
                className="px-3 py-1.5 text-xs text-[#666666] border border-[#EEEEEE] rounded-lg hover:bg-[#FAF8F5] transition"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-1 px-3 py-1.5 text-xs bg-[#FF5C00] text-white rounded-lg hover:bg-[#E65200] transition"
              >
                <Save className="w-3 h-3" />
                Sauvegarder
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <EditableField
              label="Prénom"
              value={lead.prenom}
              field="prenom"
              isEditing={isEditing}
              editedLead={editedLead}
              setEditedLead={setEditedLead}
              autoFocus
            />
            <EditableField
              label="Nom"
              value={lead.nom || ''}
              field="nom"
              isEditing={isEditing}
              editedLead={editedLead}
              setEditedLead={setEditedLead}
            />
            <EditableField
              label="Email"
              value={lead.email || ''}
              field="email"
              isEditing={isEditing}
              editedLead={editedLead}
              setEditedLead={setEditedLead}
              type="email"
            />
            <EditableField
              label="Téléphone"
              value={lead.telephone || ''}
              field="telephone"
              isEditing={isEditing}
              editedLead={editedLead}
              setEditedLead={setEditedLead}
              type="tel"
              displayValue={formatPhone(lead.telephone || '')}
            />
            <SelectField
              label="Statut professionnel"
              value={lead.statut_pro || ''}
              field="statut_pro"
              isEditing={isEditing}
              editedLead={editedLead}
              setEditedLead={setEditedLead}
              options={STATUT_PRO_OPTIONS}
            />
            <SelectField
              label="Expérience esthétique"
              value={lead.experience_esthetique || ''}
              field="experience_esthetique"
              isEditing={isEditing}
              editedLead={editedLead}
              setEditedLead={setEditedLead}
              options={EXPERIENCE_OPTIONS}
            />
            <EditableField
              label="Entreprise"
              value={lead.entreprise_nom || ''}
              field="entreprise_nom"
              isEditing={isEditing}
              editedLead={editedLead}
              setEditedLead={setEditedLead}
            />
            <EditableField
              label="Ville"
              value={lead.adresse?.ville || ''}
              field="adresse.ville"
              isEditing={isEditing}
              editedLead={editedLead}
              setEditedLead={setEditedLead}
              isAddress
            />
          </div>

          {/* Formation souhaitée */}
          {lead.formation_principale && (
            <div className="mt-6 p-4 bg-[#FF5C00]/5 border border-[#FF5C00]/20 rounded-lg">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium text-[#111111]">{lead.formation_principale.nom}</h4>
                  <p className="text-xs text-[#666666] mt-1">{lead.formation_principale.categorie}</p>
                </div>
                <span className="text-lg font-bold text-[#FF5C00]">
                  {formatEuro(lead.formation_principale.prix_ht)}
                </span>
              </div>
            </div>
          )}

          {/* Tags */}
          <div className="mt-6">
            <label className="block text-xs font-medium text-[#666666] mb-2">Tags</label>
            <div className="flex flex-wrap gap-2">
              {lead.tags.map(tag => (
                <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 bg-[#FAF8F5] text-[#111111] rounded-full text-xs group">
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="text-[#999999] hover:text-[#FF2D78] opacity-0 group-hover:opacity-100 transition"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={newTag}
                onChange={e => setNewTag(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddTag()}
                placeholder="+ tag"
                className="px-2 py-1 border border-dashed border-[#EEEEEE] rounded-full text-xs text-center focus:border-[#FF5C00] focus:w-20 transition-all outline-none w-12"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="mt-6">
            <label className="block text-xs font-medium text-[#666666] mb-2">Notes</label>
            <textarea
              value={isEditing ? (editedLead.notes ?? lead.notes ?? '') : (lead.notes || '')}
              onChange={e => setEditedLead(prev => ({ ...prev, notes: e.target.value }))}
              disabled={!isEditing}
              rows={3}
              placeholder="Notes internes..."
              className="w-full px-3 py-2 border border-[#EEEEEE] rounded-lg text-sm disabled:bg-[#FAF8F5] disabled:text-[#666666] resize-none focus:ring-2 focus:ring-[#FF5C00]/30 focus:border-[#FF5C00] outline-none"
            />
          </div>
        </CollapsibleSection>

        {/* Section Financement */}
        {(lead.financements && lead.financements.length > 0) && (
          <CollapsibleSection
            title="Financement"
            icon={<CreditCard className="w-4 h-4 text-[#FF5C00]" />}
            defaultOpen
            badge={lead.financements.length}
          >
            <div className="space-y-3">
              {lead.financements.map((fin: Financement, i: number) => (
                <div key={i} className="flex items-center justify-between p-4 bg-[#FAF8F5] rounded-lg">
                  <div>
                    <h4 className="font-medium text-[#111111]">{fin.organisme}</h4>
                    <p className="text-xs text-[#666666] mt-1">
                      {fin.statut.replace(/_/g, ' ')}
                    </p>
                  </div>
                  {fin.montant_accorde && (
                    <span className="font-bold text-[#10B981]">
                      {formatEuro(fin.montant_accorde)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CollapsibleSection>
        )}

        {/* Section Inscriptions */}
        {(lead.inscriptions && lead.inscriptions.length > 0) && (
          <CollapsibleSection
            title="Inscriptions"
            icon={<GraduationCap className="w-4 h-4 text-[#FF5C00]" />}
            defaultOpen
            badge={lead.inscriptions.length}
          >
            <div className="space-y-3">
              {lead.inscriptions.map((insc: Inscription) => (
                <div key={insc.id} className="flex items-center justify-between p-4 border border-[#EEEEEE] rounded-lg">
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium text-[#111111] truncate">
                      {insc.session?.formation?.nom || 'Formation'}
                    </h4>
                    <div className="flex items-center gap-3 mt-1 text-xs text-[#666666]">
                      {insc.session && (
                        <Link href={`/sessions/${insc.session.id}`} className="text-[#FF5C00] hover:underline">
                          {formatDate(insc.session.date_debut, { day: 'numeric', month: 'short' })}
                        </Link>
                      )}
                      <span>{formatEuro(insc.montant_total)}</span>
                      <span className={cn(
                        'px-2 py-0.5 rounded-full text-[10px] font-medium',
                        insc.paiement_statut === 'PAYE' ? 'bg-[#10B981]/10 text-[#10B981]' :
                        insc.paiement_statut === 'EN_ATTENTE' ? 'bg-[#FF8C42]/10 text-[#FF8C42]' :
                        'bg-[#FAF8F5] text-[#666666]'
                      )}>
                        {insc.paiement_statut.replace(/_/g, ' ').toLowerCase()}
                      </span>
                    </div>
                  </div>
                  {insc.paiement_statut !== 'PAYE' && (
                    <PaymentLinkButton lead={lead} inscription={insc} />
                  )}
                </div>
              ))}
            </div>
          </CollapsibleSection>
        )}

        {/* Briefing commercial IA */}
        <ProspectReportViewer leadId={lead.id} leadName={`${lead.prenom || ''} ${lead.nom || ''}`.trim()} />

        {/* Intelligence commerciale */}
        <EnrichmentTabs leadId={lead.id} />

        {/* Avis clients */}
        <ProspectReviewsPanel leadId={lead.id} />

        {/* Formation suggérée */}
        <FormationSuggester leadId={lead.id} compact onSelect={() => setShowWizard(true)} />

        {/* Section Timeline - TOUJOURS OUVERTE */}
        <div className="bg-white rounded-xl border border-[#EEEEEE]">
          <div className="px-5 py-4 border-b border-[#EEEEEE] flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#FF5C00]" />
            <h3 className="font-semibold text-[#111111]" style={{ fontFamily: 'var(--font-heading)' }}>
              Timeline
            </h3>
            {messages.length > 0 && (
              <span className="text-[10px] bg-[#FAF8F5] text-[#666666] px-2 py-0.5 rounded-full">
                {messages.length}
              </span>
            )}
          </div>

          {/* Envoi rapide */}
          <div className="px-5 py-4 border-b border-[#EEEEEE] bg-[#FAF8F5]/50">
            <div className="flex items-center gap-2 mb-3 overflow-x-auto">
              {CANAUX_MESSAGE.map(c => (
                <button
                  key={c.id}
                  onClick={() => setMessageCanal(c.id)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg text-xs whitespace-nowrap transition',
                    messageCanal === c.id ? 'bg-white shadow-sm font-medium border border-[#EEEEEE]' : 'text-[#666666] hover:bg-white/50'
                  )}
                >
                  <c.icon
                    className="w-3 h-3"
                    style={{ color: messageCanal === c.id ? c.color : undefined }}
                  />
                  {c.label}
                </button>
              ))}
            </div>

            {messageCanal === 'email' && (
              <input
                type="text"
                value={messageSubject}
                onChange={e => setMessageSubject(e.target.value)}
                placeholder="Objet..."
                className="w-full px-3 py-2 border border-[#EEEEEE] rounded-lg text-sm mb-3 focus:ring-2 focus:ring-[#FF5C00]/30 focus:border-[#FF5C00] outline-none"
              />
            )}

            <div className="flex gap-2">
              <textarea
                value={messageContent}
                onChange={e => setMessageContent(e.target.value)}
                placeholder={messageCanal === 'note_interne' ? 'Note...' : 'Message...'}
                rows={2}
                className="flex-1 px-3 py-2 border border-[#EEEEEE] rounded-lg text-sm resize-none focus:ring-2 focus:ring-[#FF5C00]/30 focus:border-[#FF5C00] outline-none"
              />
              <button
                onClick={handleSendMessage}
                disabled={sendMessage.isPending || !messageContent.trim()}
                className="self-end px-4 py-2 bg-[#FF5C00] text-white rounded-lg hover:bg-[#E65200] transition disabled:opacity-50"
              >
                {sendMessage.isPending ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div className="p-5">
            <ActivityTimeline leadId={lead.id} limit={20} />
          </div>
        </div>

        {/* Smart Actions sur mobile seulement */}
        <div className="lg:hidden">
          <div className="bg-white rounded-xl border border-[#EEEEEE] p-5">
            <SmartActions lead={lead} onAction={handleSmartAction} />
          </div>
        </div>

          </div>

          {/* Colonne droite - Actions intelligentes (desktop seulement) */}
          <div className="hidden lg:block space-y-6">
            <div className="bg-white rounded-xl border border-[#EEEEEE] p-5 sticky top-24">
              <SmartActions lead={lead} onAction={handleSmartAction} />
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
            <Suspense fallback={
              <div className="p-8 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-[#FF5C00] border-t-transparent rounded-full animate-spin" />
                <span className="ml-3 text-[#666666]">Chargement...</span>
              </div>
            }>
              <WizardInscription
                leadId={id}
                onComplete={() => {
                  setShowWizard(false);
                  toast.success('Inscription créée')
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