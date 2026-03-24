'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef } from 'react'
import { useInbox, useMessages, useSendMessage } from '@/hooks/use-messages'
import { useLeads } from '@/hooks/use-leads'
import { STATUTS_LEAD, type CanalMessage, type StatutLead } from '@/types'
import {
  Search, Mail, MessageCircle, Phone, Smartphone, StickyNote,
  Send, ArrowLeft, Clock, Check, CheckCheck, AlertCircle,
  User, ExternalLink, PhoneCall, Star, ArrowUp
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Badge, StatusBadge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { PageHeader } from '@/components/ui/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { IllustrationEmptyMessages } from '@/components/ui/Illustrations'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { cn, formatRelativeDate, getInitials } from '@/lib/utils'

const CANAUX: { id: CanalMessage; label: string; icon: any; color: string }[] = [
  { id: 'email', label: 'Email', icon: Mail, color: '#3B82F6' },
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, color: '#10B981' },
  { id: 'sms', label: 'SMS', icon: Smartphone, color: '#F59E0B' },
  { id: 'appel', label: 'Appel', icon: Phone, color: '#8B5CF6' },
  { id: 'note_interne', label: 'Note', icon: StickyNote, color: '#EF4444' },
]

function getCanalInfo(canal: CanalMessage) {
  return CANAUX.find(c => c.id === canal) || CANAUX[0]
}

function StatusIcon({ statut }: { statut: string }) {
  switch (statut) {
    case 'delivre':
      return <CheckCheck className="w-3 h-3 text-[#777777]" />
    case 'lu':
      return <CheckCheck className="w-3 h-3 text-[#6B8CAE]" />
    case 'erreur':
      return <AlertCircle className="w-3 h-3 text-[#FF2D78]" />
    default:
      return <Check className="w-3 h-3 text-[#999999]" />
  }
}

export default function MessagesPage() {
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCanal, setSelectedCanal] = useState<CanalMessage>('email')
  const [newMessage, setNewMessage] = useState('')
  const [newSubject, setNewSubject] = useState('')
  const [isMobileView, setIsMobileView] = useState(false)
  const [showThread, setShowThread] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { data: conversations, isLoading: loadingInbox } = useInbox(searchQuery)
  const { data: messages, isLoading: loadingMessages } = useMessages(selectedLeadId || '')
  const { data: leadsData } = useLeads({ search: selectedLeadId || undefined })
  const sendMessage = useSendMessage()

  const selectedLead = leadsData?.leads?.[0]

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobileView(window.innerWidth < 1024)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    }
  }, [messages])

  const handleSendMessage = async () => {
    if (!selectedLeadId || !newMessage.trim()) return

    if (selectedCanal === 'email' && !newSubject.trim()) {
      toast.error('Le sujet est requis pour un email')
      return
    }

    if (selectedCanal === 'sms' && newMessage.length > 160) {
      toast.error('Le SMS ne peut dépasser 160 caractères')
      return
    }

    try {
      await sendMessage.mutateAsync({
        lead_id: selectedLeadId,
        canal: selectedCanal,
        contenu: newMessage,
        sujet: selectedCanal === 'email' ? newSubject : undefined,
      })

      setNewMessage('')
      setNewSubject('')
      toast.success('Message envoyé')
    } catch (error) {
      toast.error('Erreur lors de l\'envoi')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.key === 'Enter') {
      handleSendMessage()
    }
  }

  if (loadingInbox) {
    return <SkeletonTable />
  }

  if (isMobileView && showThread && selectedLeadId) {
    // Vue mobile: thread uniquement
    return (
      <div className="h-screen flex flex-col bg-white">
        {/* Header mobile */}
        <div className="p-4 border-b bg-white flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowThread(false)}
            icon={<ArrowLeft className="w-4 h-4" />}
          >
            Retour
          </Button>
          {selectedLead && (
            <div className="flex items-center gap-3">
              <Avatar
                size="sm"
                name={getInitials(selectedLead.prenom, selectedLead.nom)}
                src={selectedLead.photo_url}
              />
              <div>
                <div className="font-medium text-sm">
                  {selectedLead.prenom} {selectedLead.nom}
                </div>
                <StatusBadge
                  status={selectedLead.statut}
                  label={STATUTS_LEAD[selectedLead.statut].label}
                  color={STATUTS_LEAD[selectedLead.statut].color} />
              </div>
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {loadingMessages ? (
            <div className="text-center py-8 text-[#777777]">Chargement...</div>
          ) : !messages?.length ? (
            <EmptyState
              illustration={<IllustrationEmptyMessages size={120} />}
              icon={<MessageCircle className="w-12 h-12" />}
              title="Aucun message"
              description="Commencez la conversation"
            />
          ) : (
            messages.map((message) => {
              const canal = getCanalInfo(message.canal)
              const isOutbound = message.direction === 'outbound'
              const isNote = message.canal === 'note_interne'

              return (
                <div
                  key={message.id}
                  className={cn(
                    'flex',
                    isOutbound ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div
                    className={cn(
                      'max-w-[80%] rounded-2xl px-4 py-3 space-y-1',
                      isNote
                        ? 'bg-[#FFF3E8] border border-[#FF8C42]/30'
                        : isOutbound
                        ? 'bg-primary text-white'
                        : 'bg-[#F4F0EB] text-[#111111]'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {(() => { const CI = canal.icon; return <CI className="w-3 h-3 opacity-70" /> })()}
                      <span className="text-xs opacity-70">
                        {formatRelativeDate(message.created_at)}
                      </span>
                      {isOutbound && <StatusIcon statut={message.statut} />}
                    </div>
                    {message.sujet && (
                      <div className="font-medium text-sm">{message.sujet}</div>
                    )}
                    <div className="text-sm whitespace-pre-wrap">
                      {message.contenu}
                    </div>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Composer mobile */}
        <div className="p-4 border-t bg-[#FAF8F5]">
          <div className="space-y-3">
            {/* Sélecteur canal */}
            <div className="flex gap-1 overflow-x-auto">
              {CANAUX.map((canal) => (
                <button
                  key={canal.id}
                  onClick={() => setSelectedCanal(canal.id)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap',
                    selectedCanal === canal.id
                      ? 'bg-primary text-white'
                      : 'bg-white border text-[#777777]'
                  )}
                >
                  {(() => { const CI = canal.icon; return <CI className="w-4 h-4" /> })()}
                  {canal.label}
                </button>
              ))}
            </div>

            {/* Sujet si email */}
            {selectedCanal === 'email' && (
              <input
                type="text"
                placeholder="Sujet"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                className="w-full px-3 py-2 bg-white border rounded-lg text-sm"
              />
            )}

            {/* Zone de saisie */}
            <div className="flex gap-2">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Votre ${selectedCanal === 'note_interne' ? 'note' : 'message'}...`}
                className="flex-1 px-3 py-2 bg-white border rounded-lg text-sm resize-none"
                rows={2}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || (selectedCanal === 'email' && !newSubject.trim())}
                size="sm"
                icon={<Send className="w-4 h-4" />}
              />
            </div>

            {selectedCanal === 'sms' && (
              <div className="text-xs text-[#777777] text-right">
                {newMessage.length}/160 caractères
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Vue desktop ou mobile sans thread sélectionné
  return (
    <div className="space-y-5">
      <PageHeader
        title="Messages"
        description="Centre de communication unifié"
      />

      <div className={cn(
        'grid gap-4 h-[calc(100dvh-200px)]',
        isMobileView ? 'grid-cols-1' : 'grid-cols-[300px_1fr_250px]'
      )}>
        {/* Panel 1: Liste des conversations */}
        <Card className={cn(
          'flex flex-col',
          isMobileView && showThread ? 'hidden' : ''
        )}>
          {/* Search */}
          <div className="p-4 border-b">
            <Input
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="w-4 h-4" />}
            />
          </div>

          {/* Filters */}
          <div className="p-3 border-b">
            <div className="flex gap-1 overflow-x-auto">
              <button className="px-2 py-1 text-xs bg-primary text-white rounded">
                Tous
              </button>
              {CANAUX.slice(0, 4).map((canal) => (
                <button
                  key={canal.id}
                  className="px-2 py-1 text-xs border rounded text-[#777777] hover:bg-[#FAF8F5] whitespace-nowrap"
                >
                  {(() => { const CI = canal.icon; return <CI className="w-3 h-3 inline mr-1" /> })()}
                  {canal.label}
                </button>
              ))}
            </div>
          </div>

          {/* Conversations list */}
          <div className="flex-1 overflow-y-auto">
            {!conversations?.length ? (
              <EmptyState
                illustration={<IllustrationEmptyMessages size={120} />}
                icon={<MessageCircle className="w-8 h-8" />}
                title="Aucun message"
                description="Envoyez votre premier message depuis une fiche prospect."
                className="h-40"
              />
            ) : (
              conversations.map((conv) => {
                const canal = getCanalInfo(conv.dernier_canal)
                const isSelected = selectedLeadId === conv.lead_id

                return (
                  <div
                    key={conv.lead_id}
                    onClick={() => {
                      setSelectedLeadId(conv.lead_id)
                      if (isMobileView) setShowThread(true)
                    }}
                    className={cn(
                      'p-4 border-b cursor-pointer hover:bg-[#FAF8F5] transition-colors',
                      isSelected && 'bg-[#E0EBF5] border-r-2 border-r-primary'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar
                          size="md"
                          name={getInitials(conv.lead_prenom, conv.lead_nom)}
                          src={conv.lead_photo_url ?? undefined}
                        />
                        <div
                          className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: canal.color }}
                        >
                          {(() => { const CI = canal.icon; return <CI className="w-2 h-2 text-white" /> })()}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="font-medium text-sm truncate">
                            {conv.lead_prenom} {conv.lead_nom}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-[#777777]">
                              {formatRelativeDate(conv.dernier_date)}
                            </span>
                            {conv.non_lus > 0 && (
                              <Badge variant="primary" size="sm">
                                {conv.non_lus}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-xs text-[#777777] truncate">
                          {conv.dernier_message}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </Card>

        {/* Panel 2: Thread de conversation */}
        {!isMobileView && (
          <Card className="flex flex-col">
            {!selectedLeadId ? (
              <EmptyState
                illustration={<IllustrationEmptyMessages size={120} />}
                icon={<MessageCircle className="w-12 h-12" />}
                title="Sélectionnez une conversation"
                description="Choisissez une conversation dans la liste"
                className="h-full"
              />
            ) : (
              <>
                {/* Header thread */}
                {selectedLead && (
                  <div className="p-4 border-b flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar
                        size="sm"
                        name={getInitials(selectedLead.prenom, selectedLead.nom)}
                        src={selectedLead.photo_url}
                      />
                      <div>
                        <div className="font-medium text-sm">
                          {selectedLead.prenom} {selectedLead.nom}
                        </div>
                        <StatusBadge
                  status={selectedLead.statut}
                  label={STATUTS_LEAD[selectedLead.statut].label}
                  color={STATUTS_LEAD[selectedLead.statut].color} />
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" icon={<PhoneCall className="w-4 h-4" />} />
                      <Button variant="ghost" size="sm" icon={<Mail className="w-4 h-4" />} />
                      <Button variant="ghost" size="sm" icon={<MessageCircle className="w-4 h-4" />} />
                    </div>
                  </div>
                )}

                {/* Messages */}
                <div className="flex-1 p-4 overflow-y-auto space-y-4">
                  {loadingMessages ? (
                    <div className="text-center py-8 text-[#777777]">Chargement...</div>
                  ) : !messages?.length ? (
                    <EmptyState
                      illustration={<IllustrationEmptyMessages size={120} />}
                      icon={<MessageCircle className="w-8 h-8" />}
                      title="Aucun message"
                      description="Commencez la conversation"
                    />
                  ) : (
                    messages.map((message) => {
                      const canal = getCanalInfo(message.canal)
                      const isOutbound = message.direction === 'outbound'
                      const isNote = message.canal === 'note_interne'

                      return (
                        <div
                          key={message.id}
                          className={cn(
                            'flex',
                            isOutbound ? 'justify-end' : 'justify-start'
                          )}
                        >
                          <div
                            className={cn(
                              'max-w-[70%] rounded-2xl px-4 py-3 space-y-2',
                              isNote
                                ? 'bg-[#FFF3E8] border border-[#FF8C42]/30'
                                : isOutbound
                                ? 'bg-primary text-white'
                                : 'bg-[#F4F0EB] text-[#111111]'
                            )}
                          >
                            <div className="flex items-center gap-2 text-xs opacity-70">
                              {(() => { const CI = canal.icon; return <CI className="w-3 h-3" /> })()}
                              <span>{formatRelativeDate(message.created_at)}</span>
                              {isOutbound && <StatusIcon statut={message.statut} />}
                            </div>
                            {message.sujet && (
                              <div className="font-medium">{message.sujet}</div>
                            )}
                            <div className="text-sm whitespace-pre-wrap">
                              {message.contenu}
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Composer */}
                <div className="p-4 border-t bg-[#FAF8F5]">
                  <div className="space-y-3">
                    {/* Canal selector */}
                    <div className="flex gap-1">
                      {CANAUX.map((canal) => (
                        <button
                          key={canal.id}
                          onClick={() => setSelectedCanal(canal.id)}
                          className={cn(
                            'flex items-center gap-2 px-3 py-2 rounded-lg text-sm',
                            selectedCanal === canal.id
                              ? 'bg-primary text-white'
                              : 'bg-white border text-[#777777] hover:bg-[#FAF8F5]'
                          )}
                        >
                          {(() => { const CI = canal.icon; return <CI className="w-4 h-4" /> })()}
                          {canal.label}
                        </button>
                      ))}
                    </div>

                    {/* Subject for email */}
                    {selectedCanal === 'email' && (
                      <input
                        type="text"
                        placeholder="Sujet"
                        value={newSubject}
                        onChange={(e) => setNewSubject(e.target.value)}
                        className="w-full px-3 py-2 bg-white border rounded-lg"
                      />
                    )}

                    {/* Message input */}
                    <div className="flex gap-3">
                      <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={`Votre ${selectedCanal === 'note_interne' ? 'note' : 'message'}...`}
                        className="flex-1 px-3 py-3 bg-white border rounded-lg resize-none"
                        rows={3}
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || (selectedCanal === 'email' && !newSubject.trim())}
                        icon={<Send className="w-4 h-4" />}
                      >
                        Envoyer
                      </Button>
                    </div>

                    {selectedCanal === 'sms' && (
                      <div className="text-xs text-[#777777] text-right">
                        {newMessage.length}/160 caractères
                      </div>
                    )}

                    <div className="text-xs text-[#999999]">
                      Appuyez sur Ctrl+Entrée pour envoyer
                    </div>
                  </div>
                </div>
              </>
            )}
          </Card>
        )}

        {/* Panel 3: Informations du lead (desktop uniquement) */}
        {!isMobileView && (
          <Card className="p-4">
            {!selectedLead ? (
              <div className="text-center text-[#777777] py-8">
                Sélectionnez une conversation
              </div>
            ) : (
              <div className="space-y-4">
                {/* Photo + info */}
                <div className="text-center">
                  <Avatar
                    size="lg"
                    name={getInitials(selectedLead.prenom, selectedLead.nom)}
                    src={selectedLead.photo_url}
                    className="mx-auto mb-3"
                  />
                  <h3 className="font-medium">
                    {selectedLead.prenom} {selectedLead.nom}
                  </h3>
                  <div className="mt-1">
                    <StatusBadge
                      status={selectedLead.statut}
                      label={STATUTS_LEAD[selectedLead.statut].label}
                      color={STATUTS_LEAD[selectedLead.statut].color}
                    />
                  </div>
                </div>

                {/* Contact */}
                <div className="space-y-2 pt-4 border-t">
                  {selectedLead.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-[#999999]" />
                      <span className="truncate">{selectedLead.email}</span>
                    </div>
                  )}
                  {selectedLead.telephone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-[#999999]" />
                      <span>{selectedLead.telephone}</span>
                    </div>
                  )}
                </div>

                {/* Score */}
                <div className="pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-[#FF8C42]" />
                    <span className="text-sm font-medium">Score: {selectedLead.score_chaud}/10</span>
                  </div>
                </div>

                {/* Actions rapides */}
                <div className="pt-4 border-t space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    icon={<User className="w-4 h-4" />}
                  >
                    Voir fiche
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    icon={<ArrowUp className="w-4 h-4" />}
                  >
                    Pipeline
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    icon={<ExternalLink className="w-4 h-4" />}
                  >
                    Financement
                  </Button>
                </div>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  )
}