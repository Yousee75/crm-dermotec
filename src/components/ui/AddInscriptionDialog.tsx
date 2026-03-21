'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase-client'
import { toast } from 'sonner'
import { X, Loader2, GraduationCap, Search } from 'lucide-react'
import { formatEuro } from '@/lib/utils'
import type { Lead, ModePaiement } from '@/types'

const MODES_PAIEMENT: { value: ModePaiement; label: string }[] = [
  { value: 'carte', label: 'Carte bancaire' },
  { value: 'virement', label: 'Virement' },
  { value: 'financement', label: 'Financement (OPCO/FT)' },
  { value: 'cheque', label: 'Chèque' },
  { value: 'especes', label: 'Espèces' },
  { value: 'mixte', label: 'Mixte' },
]

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  sessionId: string
  formationPrixHt: number
  placesRestantes: number
}

export function AddInscriptionDialog({ open, onOpenChange, sessionId, formationPrixHt, placesRestantes }: Props) {
  const supabase = createClient()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [form, setForm] = useState({
    montant_total: formationPrixHt,
    montant_finance: 0,
    mode_paiement: 'carte' as ModePaiement,
    notes: '',
  })

  const { data: leads } = useQuery({
    queryKey: ['leads-search', search],
    queryFn: async () => {
      if (search.length < 2) return []
      const { data } = await supabase.from('leads').select('id, prenom, nom, email, telephone, statut')
        .or(`prenom.ilike.%${search}%,nom.ilike.%${search}%,email.ilike.%${search}%`)
        .limit(5)
      return (data || []) as Lead[]
    },
    enabled: search.length >= 2,
  })

  const createInscription = useMutation({
    mutationFn: async () => {
      if (!selectedLead) throw new Error('Lead requis')
      const { error } = await supabase.from('inscriptions').insert({
        lead_id: selectedLead.id,
        session_id: sessionId,
        montant_total: form.montant_total,
        montant_finance: form.montant_finance,
        reste_a_charge: form.montant_total - form.montant_finance,
        mode_paiement: form.mode_paiement,
        paiement_statut: 'EN_ATTENTE',
        statut: 'EN_ATTENTE',
        notes: form.notes || null,
      })
      if (error) throw error

      // Incrémenter places_occupees
      try {
        await supabase.rpc('increment_places', { p_session_id: sessionId })
      } catch {
        // RPC optionnelle, ignore
      }
    },
    onSuccess: () => {
      toast.success(`${selectedLead?.prenom} inscrit(e) avec succès`)
      qc.invalidateQueries({ queryKey: ['session'] })
      qc.invalidateQueries({ queryKey: ['sessions'] })
      onOpenChange(false)
      setSelectedLead(null)
      setSearch('')
    },
    onError: () => toast.error('Erreur lors de l\'inscription'),
  })

  if (!open) return null

  if (placesRestantes <= 0) {
    return (
      <div className="fixed inset-0 z-50">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => onOpenChange(false)} />
        <div className="absolute top-[20%] left-1/2 -translate-x-1/2 max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center animate-fadeIn">
          <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
            <X className="w-7 h-7 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-[#082545]">Session complète</h3>
          <p className="text-sm text-gray-500 mt-2">Toutes les places sont occupées.</p>
          <button onClick={() => onOpenChange(false)} className="mt-6 px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium min-h-[44px]">Fermer</button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => onOpenChange(false)} />
      <div className="absolute inset-0 sm:inset-auto sm:top-[10%] sm:left-1/2 sm:-translate-x-1/2 sm:max-w-lg sm:w-full bg-white sm:rounded-2xl shadow-2xl overflow-hidden animate-fadeIn flex flex-col max-h-screen sm:max-h-[80vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#082545]" style={{ fontFamily: 'var(--font-heading)' }}>Ajouter un stagiaire</h2>
              <p className="text-xs text-gray-400">{placesRestantes} place{placesRestantes > 1 ? 's' : ''} restante{placesRestantes > 1 ? 's' : ''}</p>
            </div>
          </div>
          <button onClick={() => onOpenChange(false)} className="p-2 hover:bg-gray-100 rounded-lg transition min-h-[44px] min-w-[44px] flex items-center justify-center">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Recherche lead */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rechercher un lead *</label>
            {selectedLead ? (
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                <div>
                  <p className="text-sm font-medium text-green-900">{selectedLead.prenom} {selectedLead.nom}</p>
                  <p className="text-xs text-green-600">{selectedLead.email}</p>
                </div>
                <button onClick={() => { setSelectedLead(null); setSearch('') }} className="text-xs text-green-700 hover:underline">Changer</button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tapez un nom, email..." className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm min-h-[44px] focus:border-[#2EC6F3] outline-none" />
                {leads && leads.length > 0 && (
                  <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                    {leads.map(lead => (
                      <button key={lead.id} onClick={() => { setSelectedLead(lead); setSearch('') }} className="w-full text-left px-3 py-2.5 hover:bg-gray-50 text-sm border-b border-gray-50 last:border-0 min-h-[44px]">
                        <p className="font-medium">{lead.prenom} {lead.nom}</p>
                        <p className="text-xs text-gray-400">{lead.email} · {lead.statut}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Montant total (€ HT)</label>
              <input type="number" value={form.montant_total} onChange={e => setForm(p => ({ ...p, montant_total: parseFloat(e.target.value) || 0 }))} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm min-h-[44px] focus:border-[#2EC6F3] outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Montant financé</label>
              <input type="number" value={form.montant_finance} onChange={e => setForm(p => ({ ...p, montant_finance: parseFloat(e.target.value) || 0 }))} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm min-h-[44px] focus:border-[#2EC6F3] outline-none" />
            </div>
          </div>

          <div className="p-3 bg-blue-50 rounded-lg text-sm">
            <span className="text-blue-600 font-medium">Reste à charge : {formatEuro(form.montant_total - form.montant_finance)}</span>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mode de paiement</label>
            <select value={form.mode_paiement} onChange={e => setForm(p => ({ ...p, mode_paiement: e.target.value as ModePaiement }))} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm min-h-[44px] focus:border-[#2EC6F3] outline-none">
              {MODES_PAIEMENT.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-[#2EC6F3] outline-none" />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 shrink-0">
          <button onClick={() => onOpenChange(false)} className="px-4 py-2.5 text-sm text-gray-500 min-h-[44px]">Annuler</button>
          <button onClick={() => createInscription.mutate()} disabled={!selectedLead || createInscription.isPending} className="px-5 py-2.5 bg-[#2EC6F3] hover:bg-[#1BA8D4] text-white rounded-xl text-sm font-medium transition disabled:opacity-50 min-h-[44px] flex items-center gap-2">
            {createInscription.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Inscription...</> : 'Inscrire'}
          </button>
        </div>
      </div>
    </div>
  )
}
