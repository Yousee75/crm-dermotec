'use client'

import { useLead, useChangeStatut } from '@/hooks/use-leads'
import { Sheet, SheetHeader, SheetTitle, SheetBody } from '@/components/ui/Sheet'
import { Badge } from '@/components/ui'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { STATUTS_LEAD, type StatutLead } from '@/types'
import { formatDate, formatPhone, formatEuro } from '@/lib/utils'
import { getScoreColor } from '@/lib/scoring'
import {
  Phone, Mail, MessageCircle, Calendar, ExternalLink,
  Building2, MapPin, GraduationCap, ChevronDown, Sparkles,
  ArrowRight, CreditCard, Star
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'

interface LeadSlideOverProps {
  leadId: string | null
  onClose: () => void
}

export function LeadSlideOver({ leadId, onClose }: LeadSlideOverProps) {
  const { data: lead, isLoading } = useLead(leadId || '', { enabled: !!leadId })
  const changeStatut = useChangeStatut()
  const [showStatut, setShowStatut] = useState(false)

  const VALID_TRANSITIONS: Record<string, StatutLead[]> = {
    NOUVEAU: ['CONTACTE', 'QUALIFIE', 'PERDU'],
    CONTACTE: ['QUALIFIE', 'FINANCEMENT_EN_COURS', 'PERDU'],
    QUALIFIE: ['FINANCEMENT_EN_COURS', 'INSCRIT', 'PERDU'],
    FINANCEMENT_EN_COURS: ['INSCRIT', 'PERDU'],
    INSCRIT: ['EN_FORMATION', 'PERDU'],
    EN_FORMATION: ['FORME'],
    FORME: ['ALUMNI'],
    ALUMNI: ['QUALIFIE'],
    PERDU: ['NOUVEAU', 'CONTACTE'],
    REPORTE: ['CONTACTE', 'QUALIFIE'],
    SPAM: [],
  }

  return (
    <Sheet open={!!leadId} onClose={onClose} width="w-[420px] sm:w-[480px]">
      <SheetHeader onClose={onClose} className="py-4 px-5">
        <SheetTitle className="text-base">Fiche rapide</SheetTitle>
      </SheetHeader>

      <SheetBody className="p-0">
        {isLoading && <div className="p-5"><SkeletonCard /><SkeletonCard /></div>}

        {lead && (() => {
          const statut = STATUTS_LEAD[lead.statut]
          const scoreColor = getScoreColor(lead.score_chaud)
          const transitions = VALID_TRANSITIONS[lead.statut] || []

          return (
            <div className="divide-y divide-gray-50">
              {/* Header prospect */}
              <div className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0" style={{ backgroundColor: scoreColor }}>
                    {(lead.prenom[0] + (lead.nom?.[0] || '')).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-bold text-accent truncate">{lead.prenom} {lead.nom}</h3>
                    {lead.entreprise_nom && <p className="text-xs text-text-secondary truncate">{lead.entreprise_nom}</p>}
                  </div>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-sm" style={{ backgroundColor: scoreColor }}>
                    {lead.score_chaud}
                  </div>
                </div>

                {/* Statut + transitions rapides */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="relative">
                    <button onClick={() => setShowStatut(!showStatut)} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium text-white" style={{ backgroundColor: statut.color }}>
                      {statut.label}{transitions.length > 0 && <ChevronDown className="w-2.5 h-2.5" />}
                    </button>
                    {showStatut && transitions.length > 0 && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowStatut(false)} />
                        <div className="absolute left-0 top-full mt-1 w-40 bg-white rounded-lg shadow-xl border z-20 py-1">
                          {transitions.map(sk => (
                            <button key={sk} onClick={() => {
                              changeStatut.mutate({ id: lead.id, statut: sk })
                              setShowStatut(false)
                            }} className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-gray-50 text-left">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUTS_LEAD[sk].color }} />{STATUTS_LEAD[sk].label}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                  <span className="text-[10px] text-text-muted">{lead.source.replace(/_/g, ' ')} · {formatDate(lead.created_at)}</span>
                </div>

                {/* Actions rapides */}
                <div className="flex items-center gap-1.5">
                  {lead.telephone && <a href={`tel:${lead.telephone}`} className="flex items-center justify-center w-9 h-9 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition"><Phone className="w-4 h-4" /></a>}
                  {lead.email && <a href={`mailto:${lead.email}`} className="flex items-center justify-center w-9 h-9 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition"><Mail className="w-4 h-4" /></a>}
                  {lead.telephone && <a href={`https://wa.me/${lead.telephone.replace(/[^\d]/g, '').replace(/^0/, '33')}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-9 h-9 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition"><MessageCircle className="w-4 h-4" /></a>}
                  <Link href={`/lead/${lead.id}`} className="ml-auto flex items-center gap-1 px-3 py-2 bg-primary/10 text-primary rounded-lg text-xs font-medium hover:bg-primary/20 transition">
                    Fiche complète <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>

              {/* Contact */}
              <div className="p-5 space-y-2">
                <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Contact</p>
                {lead.email && <div className="flex items-center gap-2 text-xs"><Mail className="w-3 h-3 text-text-muted" /><span className="text-text">{lead.email}</span></div>}
                {lead.telephone && <div className="flex items-center gap-2 text-xs"><Phone className="w-3 h-3 text-text-muted" /><span className="text-text">{formatPhone(lead.telephone)}</span></div>}
                {lead.entreprise_nom && <div className="flex items-center gap-2 text-xs"><Building2 className="w-3 h-3 text-text-muted" /><span className="text-text">{lead.entreprise_nom}</span></div>}
                {lead.adresse?.ville && <div className="flex items-center gap-2 text-xs"><MapPin className="w-3 h-3 text-text-muted" /><span className="text-text">{lead.adresse.ville}</span></div>}
              </div>

              {/* Formation & Inscriptions */}
              {(lead.formation_principale || (lead.inscriptions && lead.inscriptions.length > 0)) && (
                <div className="p-5 space-y-2">
                  <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Formation</p>
                  {lead.formation_principale && (
                    <div className="flex items-center justify-between p-2.5 bg-primary/5 border border-primary/20 rounded-lg">
                      <div>
                        <p className="text-xs font-medium text-accent">{lead.formation_principale.nom}</p>
                        <p className="text-[10px] text-text-secondary">{lead.formation_principale.categorie}</p>
                      </div>
                      <span className="text-xs font-bold text-primary">{formatEuro(lead.formation_principale.prix_ht)}</span>
                    </div>
                  )}
                  {lead.inscriptions?.map((insc: any) => (
                    <div key={insc.id} className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded-lg">
                      <span className="text-accent font-medium truncate">{insc.session?.formation?.nom || 'Formation'}</span>
                      <Badge variant={insc.paiement_statut === 'PAYE' ? 'success' : 'warning'} size="sm">
                        {insc.paiement_statut === 'PAYE' ? 'Payé' : 'En attente'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}

              {/* Financement */}
              {lead.financements && lead.financements.length > 0 && (
                <div className="p-5 space-y-2">
                  <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Financement</p>
                  {lead.financements.map((fin: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5"><CreditCard className="w-3 h-3 text-warning" /><span>{fin.organisme}</span></div>
                      <span className="font-medium text-text-secondary">{fin.statut.replace(/_/g, ' ')}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Tags */}
              {lead.tags && lead.tags.length > 0 && (
                <div className="p-5">
                  <div className="flex flex-wrap gap-1">
                    {lead.tags.map((tag: string) => (
                      <span key={tag} className="px-2 py-0.5 bg-gray-100 text-text-secondary rounded-full text-[10px]">{tag}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {lead.notes && (
                <div className="p-5">
                  <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1">Notes</p>
                  <p className="text-xs text-text-secondary leading-relaxed">{lead.notes}</p>
                </div>
              )}
            </div>
          )
        })()}
      </SheetBody>
    </Sheet>
  )
}
