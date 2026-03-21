'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { useLead, useUpdateLead } from '@/hooks/use-leads'
import { useMessages, useSendMessage } from '@/hooks/use-messages'
import { useCadenceInstances } from '@/hooks/use-cadences'
import { STATUTS_LEAD, type Lead, type Message, type CanalMessage, type Inscription, type Financement } from '@/types'
import { formatEuro, formatDate, formatPhone } from '@/lib/utils'
import { getScoreColor, getScoreLabel } from '@/lib/scoring'
import { ActivityTimeline } from '@/components/ui/ActivityTimeline'
import {
  ArrowLeft, Phone, Mail, MessageCircle, MessageSquare,
  User, MessageSquareText, CreditCard, FileText, Clock,
  Edit3, Save, Plus, Send, Check, X, ExternalLink,
  ChevronDown, Tag, MapPin, GraduationCap, Building2,
  Calendar, Target, Play, Pause, AlertCircle, Download,
  Wallet, Circle, CheckCircle
} from 'lucide-react'

type TabId = 'infos' | 'communication' | 'financement' | 'documents' | 'historique'

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'infos', label: 'Informations', icon: User },
  { id: 'communication', label: 'Communication', icon: MessageSquareText },
  { id: 'financement', label: 'Financement', icon: CreditCard },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'historique', label: 'Historique', icon: Clock },
]

const CANAUX_MESSAGE: { id: CanalMessage; label: string; icon: React.ElementType; color: string }[] = [
  { id: 'email', label: 'Email', icon: Mail, color: '#3B82F6' },
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, color: '#22C55E' },
  { id: 'sms', label: 'SMS', icon: MessageSquare, color: '#8B5CF6' },
  { id: 'appel', label: 'Appel', icon: Phone, color: '#F59E0B' },
  { id: 'note_interne', label: 'Note', icon: Edit3, color: '#6B7280' },
]

export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [activeTab, setActiveTab] = useState<TabId>('infos')
  const [isEditing, setIsEditing] = useState(false)
  const [editedLead, setEditedLead] = useState<Partial<Lead>>({})
  const [newTag, setNewTag] = useState('')
  const [messageCanal, setMessageCanal] = useState<CanalMessage>('email')
  const [messageContent, setMessageContent] = useState('')
  const [messageSubject, setMessageSubject] = useState('')

  const { data: lead, isLoading } = useLead(id)
  const { data: messages = [] } = useMessages(id)
  const { data: cadenceInstances = [] } = useCadenceInstances({ lead_id: id, statut: 'active' })
  const updateLead = useUpdateLead()
  const sendMessage = useSendMessage()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Chargement...</div>
      </div>
    )
  }

  if (!lead) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Lead introuvable</div>
      </div>
    )
  }

  const statut = STATUTS_LEAD[lead.statut]
  const scoreColor = getScoreColor(lead.score_chaud)
  const scoreLabel = getScoreLabel(lead.score_chaud)

  const handleSave = async () => {
    try {
      await updateLead.mutateAsync({ id, ...editedLead })
      setIsEditing(false)
      setEditedLead({})
    } catch (error) {
      console.error('Erreur sauvegarde:', error)
    }
  }

  const handleAddTag = () => {
    if (!newTag.trim() || lead.tags.includes(newTag)) return
    const updatedTags = [...lead.tags, newTag.trim()]
    setEditedLead(prev => ({ ...prev, tags: updatedTags }))
    setNewTag('')
  }

  const handleRemoveTag = (tag: string) => {
    const updatedTags = lead.tags.filter(t => t !== tag)
    setEditedLead(prev => ({ ...prev, tags: updatedTags }))
  }

  const handleSendMessage = async () => {
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
    } catch (error) {
      console.error('Erreur envoi message:', error)
    }
  }

  const getInitials = (prenom: string, nom?: string) => {
    return (prenom[0] + (nom?.[0] || '')).toUpperCase()
  }

  const getCanalIcon = (canal: CanalMessage) => {
    const config = CANAUX_MESSAGE.find(c => c.id === canal)
    return config ? config.icon : MessageSquare
  }

  const getCanalColor = (canal: CanalMessage) => {
    const config = CANAUX_MESSAGE.find(c => c.id === canal)
    return config ? config.color : '#6B7280'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
        <div className="flex items-start gap-4">
          <Link href="/leads" className="p-2 hover:bg-gray-100 rounded-lg transition">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </Link>

          {/* Avatar */}
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-white font-semibold text-lg"
            style={{ backgroundColor: scoreColor }}
          >
            {getInitials(lead.prenom, lead.nom)}
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-[#082545]" style={{ fontFamily: 'var(--font-heading)' }}>
                {lead.civilite} {lead.prenom} {lead.nom}
              </h1>
              <span
                className="px-3 py-1 rounded-full text-xs font-medium text-white"
                style={{ backgroundColor: statut.color }}
              >
                {statut.label}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: scoreColor }}
                />
                <span>Score: {lead.score_chaud}/100 ({scoreLabel})</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span>{lead.source.replace('_', ' ')}</span>
              </div>
              <span>Créé le {formatDate(lead.created_at)}</span>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap items-center gap-2">
          {lead.telephone && (
            <a
              href={`tel:${lead.telephone}`}
              className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm hover:bg-green-100 transition"
            >
              <Phone className="w-4 h-4" />
              Appeler
            </a>
          )}
          {lead.email && (
            <a
              href={`mailto:${lead.email}`}
              className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm hover:bg-blue-100 transition"
            >
              <Mail className="w-4 h-4" />
              Email
            </a>
          )}
          {lead.whatsapp && (
            <a
              href={`https://wa.me/${lead.whatsapp.replace(/[^\d]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-sm hover:bg-emerald-100 transition"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </a>
          )}
          <button
            className="flex items-center gap-2 px-4 py-2 bg-[#2EC6F3] text-white rounded-lg text-sm hover:bg-[#2EC6F3]/90 transition"
          >
            <MessageSquare className="w-4 h-4" />
            SMS
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex space-x-8 overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-1 py-3 text-sm font-medium border-b-2 transition-colors min-w-max ${
                  activeTab === tab.id
                    ? 'border-[#2EC6F3] text-[#2EC6F3]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab Content */}
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

        {activeTab === 'financement' && (
          <FinancementTab lead={lead} />
        )}

        {activeTab === 'documents' && (
          <DocumentsTab lead={lead} />
        )}

        {activeTab === 'historique' && (
          <HistoriqueTab leadId={lead.id} />
        )}
      </div>
    </div>
  )
}

function InformationsTab({
  lead,
  isEditing,
  editedLead,
  setEditedLead,
  setIsEditing,
  handleSave,
  newTag,
  setNewTag,
  handleAddTag,
  handleRemoveTag,
  isLoading
}: {
  lead: Lead
  isEditing: boolean
  editedLead: Partial<Lead>
  setEditedLead: (fn: (prev: Partial<Lead>) => Partial<Lead>) => void
  setIsEditing: (editing: boolean) => void
  handleSave: () => void
  newTag: string
  setNewTag: (tag: string) => void
  handleAddTag: () => void
  handleRemoveTag: (tag: string) => void
  isLoading: boolean
}) {
  const displayedTags = isEditing ? editedLead.tags || lead.tags : lead.tags

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Colonne gauche */}
      <div className="space-y-6">
        {/* Identité */}
        <Section title="Identité" icon={<User className="w-4 h-4" />}>
          <div className="grid grid-cols-2 gap-4">
            <InputField
              label="Civilité"
              value={isEditing ? editedLead.civilite || lead.civilite || '' : lead.civilite || ''}
              onChange={(value) => setEditedLead(prev => ({ ...prev, civilite: value }))}
              disabled={!isEditing}
            />
            <InputField
              label="Prénom"
              value={isEditing ? editedLead.prenom || lead.prenom : lead.prenom}
              onChange={(value) => setEditedLead(prev => ({ ...prev, prenom: value }))}
              disabled={!isEditing}
            />
            <InputField
              label="Nom"
              value={isEditing ? editedLead.nom || lead.nom || '' : lead.nom || ''}
              onChange={(value) => setEditedLead(prev => ({ ...prev, nom: value }))}
              disabled={!isEditing}
            />
            <InputField
              label="Email"
              value={isEditing ? editedLead.email || lead.email || '' : lead.email || ''}
              onChange={(value) => setEditedLead(prev => ({ ...prev, email: value }))}
              disabled={!isEditing}
              type="email"
            />
            <InputField
              label="Téléphone"
              value={isEditing ? editedLead.telephone || lead.telephone || '' : formatPhone(lead.telephone) || ''}
              onChange={(value) => setEditedLead(prev => ({ ...prev, telephone: value }))}
              disabled={!isEditing}
            />
            <InputField
              label="WhatsApp"
              value={isEditing ? editedLead.whatsapp || lead.whatsapp || '' : lead.whatsapp || ''}
              onChange={(value) => setEditedLead(prev => ({ ...prev, whatsapp: value }))}
              disabled={!isEditing}
            />
            <InputField
              label="Date de naissance"
              value={isEditing ? editedLead.date_naissance || lead.date_naissance || '' : lead.date_naissance || ''}
              onChange={(value) => setEditedLead(prev => ({ ...prev, date_naissance: value }))}
              disabled={!isEditing}
              type="date"
            />
          </div>
        </Section>

        {/* Adresse */}
        <Section title="Adresse" icon={<MapPin className="w-4 h-4" />}>
          <div className="grid grid-cols-1 gap-4">
            <InputField
              label="Rue"
              value={isEditing ? editedLead.adresse?.rue || lead.adresse?.rue || '' : lead.adresse?.rue || ''}
              onChange={(value) => setEditedLead(prev => ({
                ...prev,
                adresse: { ...prev.adresse, ...lead.adresse, rue: value }
              }))}
              disabled={!isEditing}
            />
            <div className="grid grid-cols-2 gap-4">
              <InputField
                label="Code postal"
                value={isEditing ? editedLead.adresse?.code_postal || lead.adresse?.code_postal || '' : lead.adresse?.code_postal || ''}
                onChange={(value) => setEditedLead(prev => ({
                  ...prev,
                  adresse: { ...prev.adresse, ...lead.adresse, code_postal: value }
                }))}
                disabled={!isEditing}
              />
              <InputField
                label="Ville"
                value={isEditing ? editedLead.adresse?.ville || lead.adresse?.ville || '' : lead.adresse?.ville || ''}
                onChange={(value) => setEditedLead(prev => ({
                  ...prev,
                  adresse: { ...prev.adresse, ...lead.adresse, ville: value }
                }))}
                disabled={!isEditing}
              />
            </div>
          </div>
        </Section>
      </div>

      {/* Colonne droite */}
      <div className="space-y-6">
        {/* Profil professionnel */}
        <Section title="Profil professionnel" icon={<Building2 className="w-4 h-4" />}>
          <div className="grid grid-cols-1 gap-4">
            <InputField
              label="Statut professionnel"
              value={isEditing ? editedLead.statut_pro || lead.statut_pro || '' : lead.statut_pro?.replace('_', ' ') || ''}
              onChange={(value) => setEditedLead(prev => ({ ...prev, statut_pro: value as any }))}
              disabled={!isEditing}
            />
            <InputField
              label="Expérience esthétique"
              value={isEditing ? editedLead.experience_esthetique || lead.experience_esthetique || '' : lead.experience_esthetique || ''}
              onChange={(value) => setEditedLead(prev => ({ ...prev, experience_esthetique: value as any }))}
              disabled={!isEditing}
            />
            <InputField
              label="Entreprise"
              value={isEditing ? editedLead.entreprise_nom || lead.entreprise_nom || '' : lead.entreprise_nom || ''}
              onChange={(value) => setEditedLead(prev => ({ ...prev, entreprise_nom: value }))}
              disabled={!isEditing}
            />
            <InputField
              label="SIRET"
              value={isEditing ? editedLead.siret || lead.siret || '' : lead.siret || ''}
              onChange={(value) => setEditedLead(prev => ({ ...prev, siret: value }))}
              disabled={!isEditing}
            />
            <div className="col-span-1">
              <label className="block text-xs font-medium text-gray-500 mb-1">Objectif professionnel</label>
              <textarea
                value={isEditing ? editedLead.objectif_pro || lead.objectif_pro || '' : lead.objectif_pro || ''}
                onChange={(e) => setEditedLead(prev => ({ ...prev, objectif_pro: e.target.value }))}
                disabled={!isEditing}
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm disabled:bg-gray-50 disabled:text-gray-600"
              />
            </div>
          </div>
        </Section>

        {/* Formation principale */}
        {lead.formation_principale && (
          <Section title="Formation principale" icon={<GraduationCap className="w-4 h-4" />}>
            <div className="p-4 bg-[#2EC6F3]/5 border border-[#2EC6F3]/20 rounded-lg">
              <h4 className="font-medium text-[#082545]">{lead.formation_principale.nom}</h4>
              <div className="text-sm text-gray-600 mt-1">
                {lead.formation_principale.categorie} • {formatEuro(lead.formation_principale.prix_ht)} HT
              </div>
            </div>
          </Section>
        )}

        {/* Tags */}
        <Section title="Tags" icon={<Tag className="w-4 h-4" />}>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {displayedTags.map((tag) => (
                <div key={tag} className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                  <span>{tag}</span>
                  {isEditing && (
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {isEditing && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                  placeholder="Nouveau tag..."
                  className="flex-1 px-3 py-1 border border-gray-200 rounded-lg text-xs"
                />
                <button
                  onClick={handleAddTag}
                  className="px-3 py-1 bg-[#2EC6F3] text-white rounded-lg text-xs hover:bg-[#2EC6F3]/90"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </Section>

        {/* Notes */}
        <Section title="Notes" icon={<Edit3 className="w-4 h-4" />}>
          <textarea
            value={isEditing ? editedLead.notes || lead.notes || '' : lead.notes || ''}
            onChange={(e) => setEditedLead(prev => ({ ...prev, notes: e.target.value }))}
            disabled={!isEditing}
            rows={4}
            placeholder="Notes internes..."
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm disabled:bg-gray-50 disabled:text-gray-600"
          />
        </Section>
      </div>

      {/* Actions */}
      <div className="lg:col-span-2 flex justify-end gap-3">
        {isEditing ? (
          <>
            <button
              onClick={() => {
                setIsEditing(false)
                setEditedLead({})
              }}
              className="px-4 py-2 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
              disabled={isLoading}
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-[#2EC6F3] text-white rounded-lg hover:bg-[#2EC6F3]/90 transition disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Sauvegarder
            </button>
          </>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#2EC6F3] text-white rounded-lg hover:bg-[#2EC6F3]/90 transition"
          >
            <Edit3 className="w-4 h-4" />
            Modifier
          </button>
        )}
      </div>
    </div>
  )
}

function CommunicationTab({
  lead,
  messages,
  cadenceInstances,
  messageCanal,
  setMessageCanal,
  messageContent,
  setMessageContent,
  messageSubject,
  setMessageSubject,
  handleSendMessage,
  isSending
}: {
  lead: Lead
  messages: Message[]
  cadenceInstances: any[]
  messageCanal: CanalMessage
  setMessageCanal: (canal: CanalMessage) => void
  messageContent: string
  setMessageContent: (content: string) => void
  messageSubject: string
  setMessageSubject: (subject: string) => void
  handleSendMessage: () => void
  isSending: boolean
}) {
  const sortedMessages = [...messages].sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  return (
    <div className="space-y-6">
      {/* Message composer */}
      <Section title="Nouveau message" icon={<Send className="w-4 h-4" />}>
        <div className="space-y-4">
          {/* Canal selector */}
          <div className="grid grid-cols-5 gap-2">
            {CANAUX_MESSAGE.map((canal) => {
              const Icon = canal.icon
              return (
                <button
                  key={canal.id}
                  onClick={() => setMessageCanal(canal.id)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-lg text-xs transition ${
                    messageCanal === canal.id
                      ? 'bg-[#2EC6F3]/10 text-[#2EC6F3] border-2 border-[#2EC6F3]/30'
                      : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{canal.label}</span>
                </button>
              )
            })}
          </div>

          {/* Subject for email */}
          {messageCanal === 'email' && (
            <input
              type="text"
              placeholder="Sujet de l'email..."
              value={messageSubject}
              onChange={(e) => setMessageSubject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            />
          )}

          {/* Content */}
          <textarea
            placeholder={`Votre message ${CANAUX_MESSAGE.find(c => c.id === messageCanal)?.label.toLowerCase()}...`}
            value={messageContent}
            onChange={(e) => setMessageContent(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none"
          />

          <div className="flex justify-end">
            <button
              onClick={handleSendMessage}
              disabled={!messageContent.trim() || isSending}
              className="flex items-center gap-2 px-4 py-2 bg-[#2EC6F3] text-white rounded-lg hover:bg-[#2EC6F3]/90 transition disabled:opacity-50"
            >
              {isSending ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Envoyer
            </button>
          </div>
        </div>
      </Section>

      {/* Active cadences */}
      {cadenceInstances.length > 0 && (
        <Section title="Cadences actives" icon={<Play className="w-4 h-4" />}>
          <div className="space-y-3">
            {cadenceInstances.map((instance) => (
              <div key={instance.id} className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div>
                  <p className="font-medium text-amber-900">{instance.template?.nom}</p>
                  <p className="text-sm text-amber-700">
                    Étape {instance.etape_courante + 1} • Prochaine: {formatDate(instance.prochaine_execution)}
                  </p>
                </div>
                <button className="p-1 text-amber-600 hover:bg-amber-100 rounded">
                  <Pause className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Messages timeline */}
      <Section title={`Messages (${messages.length})`} icon={<MessageSquareText className="w-4 h-4" />}>
        {sortedMessages.length > 0 ? (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {sortedMessages.map((message) => {
              const Icon = getCanalIcon(message.canal)
              const color = getCanalColor(message.canal)
              const isOutbound = message.direction === 'outbound'

              return (
                <div key={message.id} className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs lg:max-w-md ${isOutbound ? 'order-2' : 'order-1'}`}>
                    <div className={`p-3 rounded-lg ${
                      isOutbound
                        ? 'bg-[#2EC6F3] text-white'
                        : message.canal === 'note_interne'
                          ? 'bg-yellow-50 border border-yellow-200 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className="w-3 h-3" style={{ color: isOutbound ? 'white' : color }} />
                        {message.sujet && (
                          <span className="font-medium text-xs">{message.sujet}</span>
                        )}
                        <span className={`text-xs ${isOutbound ? 'text-white/80' : 'text-gray-500'}`}>
                          {isOutbound ? '→' : '←'}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{message.contenu}</p>
                    </div>
                    <div className={`flex items-center gap-2 mt-1 text-xs text-gray-400 ${isOutbound ? 'justify-end' : 'justify-start'}`}>
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
          <div className="text-center text-gray-400 py-8">
            Aucun message
          </div>
        )}
      </Section>
    </div>
  )
}

function FinancementTab({ lead }: { lead: Lead }) {
  return (
    <div className="space-y-6">
      {/* Statut financement */}
      <Section title="Statut financement" icon={<Wallet className="w-4 h-4" />}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">Financement souhaité</label>
            <div className={`flex items-center gap-2 ${lead.financement_souhaite ? 'text-green-600' : 'text-gray-400'}`}>
              {lead.financement_souhaite ? <CheckCircle className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
              <span className="text-sm">{lead.financement_souhaite ? 'Oui' : 'Non'}</span>
            </div>
          </div>
          {lead.organisme_financement && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">Organisme ciblé</label>
              <span className="text-sm text-gray-700">{lead.organisme_financement}</span>
            </div>
          )}
        </div>
      </Section>

      {/* Dossiers de financement */}
      {lead.financements && lead.financements.length > 0 && (
        <Section title="Dossiers de financement" icon={<FileText className="w-4 h-4" />}>
          <div className="space-y-4">
            {lead.financements.map((financement: Financement) => (
              <div key={financement.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h4 className="font-medium text-[#082545]">{financement.organisme}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        financement.statut === 'VALIDE' ? 'bg-green-100 text-green-800' :
                        financement.statut === 'REFUSE' ? 'bg-red-100 text-red-800' :
                        financement.statut === 'EN_EXAMEN' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {financement.statut.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Montant demandé: {formatEuro(financement.montant_demande)}</p>
                      {financement.montant_accorde && (
                        <p>Montant accordé: {formatEuro(financement.montant_accorde)}</p>
                      )}
                      {financement.date_soumission && (
                        <p>Soumis le: {formatDate(financement.date_soumission)}</p>
                      )}
                    </div>
                    {financement.notes && (
                      <p className="text-sm text-gray-600 italic">{financement.notes}</p>
                    )}
                  </div>
                  <Link
                    href={`/financement/${financement.id}`}
                    className="flex items-center gap-1 text-[#2EC6F3] hover:text-[#2EC6F3]/80 text-sm"
                  >
                    Détails
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>

                {/* Documents checklist */}
                {financement.documents && financement.documents.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <h5 className="text-xs font-medium text-gray-500 mb-2">Documents</h5>
                    <div className="grid grid-cols-2 gap-2">
                      {financement.documents.map((doc, index) => (
                        <div key={index} className="flex items-center gap-2 text-xs">
                          {doc.statut === 'valide' ? (
                            <CheckCircle className="w-3 h-3 text-green-500" />
                          ) : doc.statut === 'fourni' ? (
                            <Clock className="w-3 h-3 text-yellow-500" />
                          ) : (
                            <Circle className="w-3 h-3 text-gray-400" />
                          )}
                          <span className={doc.statut === 'valide' ? 'text-green-700' : 'text-gray-600'}>
                            {doc.nom}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Action si pas de financement */}
      {!lead.financement_souhaite && (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-4">
            <CreditCard className="w-12 h-12 mx-auto mb-2" />
            <p>Aucun financement demandé</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#2EC6F3] text-white rounded-lg hover:bg-[#2EC6F3]/90 transition mx-auto">
            <Plus className="w-4 h-4" />
            Créer un dossier
          </button>
        </div>
      )}
    </div>
  )
}

function DocumentsTab({ lead }: { lead: Lead }) {
  return (
    <div className="space-y-6">
      {lead.documents && lead.documents.length > 0 ? (
        <Section title={`Documents (${lead.documents.length})`} icon={<FileText className="w-4 h-4" />}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lead.documents.map((doc) => (
              <div key={doc.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition">
                <div className="flex items-start justify-between mb-3">
                  <FileText className="w-8 h-8 text-gray-400" />
                  {doc.is_signed && (
                    <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                      Signé
                    </span>
                  )}
                </div>
                <h4 className="font-medium text-sm text-[#082545] mb-1">{doc.filename}</h4>
                <p className="text-xs text-gray-500 mb-2">{doc.type.replace('_', ' ')}</p>
                <p className="text-xs text-gray-400">{formatDate(doc.created_at)}</p>
                <button className="flex items-center gap-1 text-[#2EC6F3] hover:text-[#2EC6F3]/80 text-xs mt-2">
                  <Download className="w-3 h-3" />
                  Télécharger
                </button>
              </div>
            ))}
          </div>
        </Section>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <FileText className="w-16 h-16 mx-auto mb-4" />
            <p className="text-lg">Aucun document</p>
            <p className="text-sm">Les documents liés à ce lead apparaîtront ici</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#2EC6F3] text-white rounded-lg hover:bg-[#2EC6F3]/90 transition mx-auto">
            <Plus className="w-4 h-4" />
            Ajouter un document
          </button>
        </div>
      )}
    </div>
  )
}

function HistoriqueTab({ leadId }: { leadId: string }) {
  return (
    <div>
      <Section title="Historique des activités" icon={<Clock className="w-4 h-4" />}>
        <ActivityTimeline leadId={leadId} limit={50} />
      </Section>
    </div>
  )
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6">
      <h3 className="font-semibold text-[#082545] flex items-center gap-2 mb-4">
        <span className="text-[#2EC6F3]">{icon}</span>
        {title}
      </h3>
      {children}
    </div>
  )
}

function InputField({
  label,
  value,
  onChange,
  disabled,
  type = 'text'
}: {
  label: string
  value: string
  onChange: (value: string) => void
  disabled: boolean
  type?: string
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm disabled:bg-gray-50 disabled:text-gray-600"
      />
    </div>
  )
}