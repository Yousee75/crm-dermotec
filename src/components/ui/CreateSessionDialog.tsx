'use client'

import { useState } from 'react'
import { useCreateSession } from '@/hooks/use-sessions'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase-client'
import { toast } from 'sonner'
import { X, Loader2, Calendar } from 'lucide-react'
import type { Formation, Equipe } from '@/types'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateSessionDialog({ open, onOpenChange }: Props) {
  const createSession = useCreateSession()
  const supabase = createClient()

  const { data: formations } = useQuery({
    queryKey: ['formations-list'],
    queryFn: async () => {
      const { data } = await supabase.from('formations').select('*').eq('is_active', true).order('sort_order')
      return (data || []) as Formation[]
    },
  })

  const { data: formatrices } = useQuery({
    queryKey: ['formatrices-list'],
    queryFn: async () => {
      const { data } = await supabase.from('equipe').select('*').eq('role', 'formatrice').eq('is_active', true)
      return (data || []) as Equipe[]
    },
  })

  const [form, setForm] = useState({
    formation_id: '', date_debut: '', date_fin: '',
    horaire_debut: '09:00', horaire_fin: '17:00',
    salle: 'Salle 1', formatrice_id: '', places_max: 6, notes: '',
  })

  const set = (field: string, value: string | number) => setForm(prev => ({ ...prev, [field]: value }))

  // Auto-calcul date_fin quand formation ou date_debut change
  const handleFormationChange = (formationId: string) => {
    set('formation_id', formationId)
    if (formationId && form.date_debut) {
      const f = formations?.find(f => f.id === formationId)
      if (f) {
        const start = new Date(form.date_debut)
        start.setDate(start.getDate() + f.duree_jours - 1)
        set('date_fin', start.toISOString().split('T')[0])
      }
    }
  }

  const handleDateDebutChange = (date: string) => {
    set('date_debut', date)
    if (form.formation_id && date) {
      const f = formations?.find(f => f.id === form.formation_id)
      if (f) {
        const start = new Date(date)
        start.setDate(start.getDate() + f.duree_jours - 1)
        set('date_fin', start.toISOString().split('T')[0])
      }
    }
  }

  const handleSubmit = async () => {
    if (!form.formation_id || !form.date_debut || !form.date_fin) {
      toast.error('Formation et dates requises')
      return
    }

    try {
      await createSession.mutateAsync({
        formation_id: form.formation_id,
        date_debut: form.date_debut,
        date_fin: form.date_fin,
        horaire_debut: form.horaire_debut,
        horaire_fin: form.horaire_fin,
        salle: form.salle,
        formatrice_id: form.formatrice_id || undefined,
        places_max: form.places_max,
        places_occupees: 0,
        statut: 'BROUILLON',
        notes: form.notes || undefined,
      } as never)

      const f = formations?.find(f => f.id === form.formation_id)
      toast.success(`Session ${f?.nom || ''} créée`)
      onOpenChange(false)
      setForm({ formation_id: '', date_debut: '', date_fin: '', horaire_debut: '09:00', horaire_fin: '17:00', salle: 'Salle 1', formatrice_id: '', places_max: 6, notes: '' })
    } catch {
      toast.error('Erreur lors de la création')
    }
  }

  if (!open) return null

  const selectedFormation = formations?.find(f => f.id === form.formation_id)

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => onOpenChange(false)} />
      <div className="absolute inset-0 sm:inset-auto sm:top-[10%] sm:left-1/2 sm:-translate-x-1/2 sm:max-w-lg sm:w-full bg-white sm:rounded-2xl shadow-2xl overflow-hidden animate-fadeIn flex flex-col max-h-screen sm:max-h-[80vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-violet-500" />
            </div>
            <h2 className="text-lg font-semibold text-[#082545]" style={{ fontFamily: 'var(--font-heading)' }}>Nouvelle session</h2>
          </div>
          <button onClick={() => onOpenChange(false)} className="p-2 hover:bg-gray-100 rounded-lg transition min-h-[44px] min-w-[44px] flex items-center justify-center">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Formation *</label>
            <select value={form.formation_id} onChange={e => handleFormationChange(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm min-h-[44px] focus:border-[#2EC6F3] outline-none">
              <option value="">— Sélectionner —</option>
              {formations?.map(f => (
                <option key={f.id} value={f.id}>{f.nom} — {f.duree_jours}j ({f.prix_ht}€ HT)</option>
              ))}
            </select>
            {selectedFormation && (
              <p className="text-xs text-gray-400 mt-1">{selectedFormation.categorie} · {selectedFormation.duree_heures}h · {selectedFormation.niveau}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date début *</label>
              <input type="date" value={form.date_debut} onChange={e => handleDateDebutChange(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm min-h-[44px] focus:border-[#2EC6F3] outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date fin *</label>
              <input type="date" value={form.date_fin} onChange={e => set('date_fin', e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm min-h-[44px] focus:border-[#2EC6F3] outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Horaire début</label>
              <input type="time" value={form.horaire_debut} onChange={e => set('horaire_debut', e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm min-h-[44px] focus:border-[#2EC6F3] outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Horaire fin</label>
              <input type="time" value={form.horaire_fin} onChange={e => set('horaire_fin', e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm min-h-[44px] focus:border-[#2EC6F3] outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Salle</label>
              <select value={form.salle} onChange={e => set('salle', e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm min-h-[44px] focus:border-[#2EC6F3] outline-none">
                <option>Salle 1</option>
                <option>Salle 2</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Places max</label>
              <input type="number" min={1} max={20} value={form.places_max} onChange={e => set('places_max', parseInt(e.target.value) || 6)} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm min-h-[44px] focus:border-[#2EC6F3] outline-none" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Formatrice</label>
            <select value={form.formatrice_id} onChange={e => set('formatrice_id', e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm min-h-[44px] focus:border-[#2EC6F3] outline-none">
              <option value="">— Non assignée —</option>
              {formatrices?.map(f => (
                <option key={f.id} value={f.id}>{f.prenom} {f.nom}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} placeholder="Notes sur la session..." className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-[#2EC6F3] outline-none" />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 shrink-0">
          <button onClick={() => onOpenChange(false)} className="px-4 py-2.5 text-sm text-gray-500 min-h-[44px]">Annuler</button>
          <button onClick={handleSubmit} disabled={createSession.isPending} className="px-5 py-2.5 bg-[#2EC6F3] hover:bg-[#1BA8D4] text-white rounded-xl text-sm font-medium transition disabled:opacity-50 min-h-[44px] flex items-center gap-2">
            {createSession.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Création...</> : 'Créer la session'}
          </button>
        </div>
      </div>
    </div>
  )
}
