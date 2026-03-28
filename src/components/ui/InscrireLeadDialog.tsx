'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useCreateInscription } from '@/hooks/use-inscriptions'
import { useChangeStatut } from '@/hooks/use-leads'
import { createClient } from '@/lib/infra/supabase-client'
import type { Session, Lead } from '@/types'
import { toast } from 'sonner'
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './Dialog'
import { Button } from './Button'
import { Badge } from './Badge'
import { Calendar, Users, Euro, GraduationCap } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  open: boolean
  onClose: () => void
  lead: Lead
}

export function InscrireLeadDialog({ open, onClose, lead }: Props) {
  const supabase = createClient()
  const createInscription = useCreateInscription()
  const changeStatut = useChangeStatut()
  const [selectedSessionId, setSelectedSessionId] = useState('')
  const [modePaiement, setModePaiement] = useState('carte')
  const [montantFinance, setMontantFinance] = useState(0)

  // Fetch sessions with available places
  const { data: sessions } = useQuery({
    queryKey: ['sessions-disponibles'],
    queryFn: async () => {
      const { data } = await supabase
        .from('sessions')
        .select(`*, formation:formations(*)`)
        .in('statut', ['PLANIFIEE', 'CONFIRMEE'])
        .order('date_debut', { ascending: true })
      return (data || []) as Session[]
    },
    enabled: open,
  })

  const availableSessions = sessions?.filter(s => s.places_occupees < s.places_max) || []
  const selectedSession = availableSessions.find(s => s.id === selectedSessionId)
  const montantTotal = selectedSession?.formation?.prix_ht || 0
  const resteACharge = montantTotal - montantFinance

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSessionId) {
      toast.error('Sélectionnez une session')
      return
    }

    try {
      await createInscription.mutateAsync({
        lead_id: lead.id,
        session_id: selectedSessionId,
        montant_total: montantTotal,
        montant_finance: montantFinance,
        reste_a_charge: resteACharge,
        mode_paiement: modePaiement,
        statut: 'EN_ATTENTE',
        paiement_statut: 'EN_ATTENTE',
      })

      // Change lead status to INSCRIT if not already
      if (!['INSCRIT', 'EN_FORMATION', 'FORME', 'ALUMNI'].includes(lead.statut)) {
        await changeStatut.mutateAsync({
          id: lead.id,
          statut: 'INSCRIT',
          notes: `Inscrit à la session ${selectedSession?.formation?.nom}`,
        })
      }

      toast.success(`${lead.prenom} inscrit(e) !`)
      onClose()
      setSelectedSessionId('')
      setMontantFinance(0)
    } catch {
      toast.error("Erreur lors de l'inscription")
    }
  }

  return (
    <Dialog open={open} onClose={onClose} size="lg">
      <DialogHeader onClose={onClose}>
        <DialogTitle>Inscrire {lead.prenom} {lead.nom}</DialogTitle>
        <DialogDescription>Sélectionnez une session disponible</DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Session selector */}
        <div className="space-y-2 max-h-[280px] overflow-y-auto">
          {availableSessions.length === 0 ? (
            <p className="text-sm text-[#999999] text-center py-6">Aucune session disponible</p>
          ) : (
            availableSessions.map(session => {
              const isSelected = selectedSessionId === session.id
              const placesLeft = session.places_max - session.places_occupees
              return (
                <button
                  key={session.id}
                  type="button"
                  onClick={() => setSelectedSessionId(session.id)}
                  className={cn(
                    'w-full text-left p-3 rounded-xl border-2 transition',
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-[#F0F0F0] hover:border-[#F0F0F0]'
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-sm text-accent">{session.formation?.nom}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-[#777777]">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(session.date_debut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {placesLeft} place{placesLeft > 1 ? 's' : ''} dispo
                        </span>
                        <span className="flex items-center gap-1">
                          <Euro className="w-3 h-3" />
                          {session.formation?.prix_ht}€ HT
                        </span>
                      </div>
                    </div>
                    <Badge
                      variant={placesLeft <= 2 ? 'warning' : 'success'}
                      size="sm"
                    >
                      {placesLeft}/{session.places_max}
                    </Badge>
                  </div>
                </button>
              )
            })
          )}
        </div>

        {/* Payment details */}
        {selectedSession && (
          <div className="space-y-3 pt-3 border-t border-[#F0F0F0]">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-[#3A3A3A]">Mode de paiement</label>
                <select
                  value={modePaiement}
                  onChange={(e) => setModePaiement(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#F0F0F0] text-sm focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none bg-white"
                >
                  <option value="carte">Carte bancaire</option>
                  <option value="virement">Virement</option>
                  <option value="cheque">Chèque</option>
                  <option value="especes">Espèces</option>
                  <option value="financement">Financement OPCO/CPF</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-[#3A3A3A]">Montant financé (€)</label>
                <input
                  type="number"
                  min={0}
                  max={montantTotal}
                  value={montantFinance}
                  onChange={(e) => setMontantFinance(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-[#F0F0F0] text-sm focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none"
                />
              </div>
            </div>

            {/* Summary */}
            <div className="bg-[#FAFAFA] rounded-xl p-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-[#777777]">Montant total</span>
                <span className="font-medium">{montantTotal}€ HT</span>
              </div>
              {montantFinance > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-[#777777]">Financé</span>
                  <span className="text-[#10B981] font-medium">-{montantFinance}€</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold border-t border-[#F0F0F0] pt-1 mt-1">
                <span>Reste à charge</span>
                <span className="text-accent">{resteACharge}€</span>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" type="button" onClick={onClose}>Annuler</Button>
          <Button
            type="submit"
            loading={createInscription.isPending}
            disabled={!selectedSessionId}
            icon={<GraduationCap className="w-4 h-4" />}
          >
            Inscrire
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
