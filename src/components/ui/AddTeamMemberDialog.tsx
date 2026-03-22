'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase-client'
import { validateEmail, validatePhone } from '@/lib/validators'
import { toast } from 'sonner'
import { X, Loader2, Users } from 'lucide-react'
import type { RoleEquipe } from '@/types'

const ROLES: { value: RoleEquipe; label: string; color: string }[] = [
  { value: 'admin', label: 'Administrateur', color: '#8B5CF6' },
  { value: 'manager', label: 'Manager', color: '#F97316' },
  { value: 'commercial', label: 'Commercial(e)', color: '#3B82F6' },
  { value: 'formatrice', label: 'Formatrice', color: '#E11D48' },
  { value: 'assistante', label: 'Assistante', color: '#22C55E' },
]

const AVATAR_COLORS = ['var(--color-primary)', '#8B5CF6', '#E11D48', '#F59E0B', '#22C55E', '#F97316', '#6366F1', '#14B8A6', 'var(--color-accent)']

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddTeamMemberDialog({ open, onOpenChange }: Props) {
  const supabase = createClient()
  const qc = useQueryClient()

  const [form, setForm] = useState({
    prenom: '', nom: '', email: '', telephone: '',
    role: 'commercial' as RoleEquipe,
    specialites: '', objectif_mensuel: 0, taux_horaire: 0,
    avatar_color: 'var(--color-primary)',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const set = (field: string, value: string | number) => {
    setForm(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: '' }))
  }

  const createMember = useMutation({
    mutationFn: async () => {
      const e: Record<string, string> = {}
      if (!form.prenom.trim()) e.prenom = 'Prénom requis'
      if (!form.nom.trim()) e.nom = 'Nom requis'
      if (!form.email.trim()) e.email = 'Email requis'
      else { const err = validateEmail(form.email); if (err) e.email = err }
      if (form.telephone) { const err = validatePhone(form.telephone); if (err) e.telephone = err }
      if (Object.keys(e).length > 0) { setErrors(e); throw new Error('Validation') }

      const { error } = await supabase.from('equipe').insert({
        prenom: form.prenom.trim(),
        nom: form.nom.trim(),
        email: form.email.trim().toLowerCase(),
        telephone: form.telephone.trim() || null,
        role: form.role,
        specialites: form.specialites ? form.specialites.split(',').map(s => s.trim()).filter(Boolean) : [],
        objectif_mensuel: form.role !== 'formatrice' ? form.objectif_mensuel : 0,
        taux_horaire: form.role === 'formatrice' ? form.taux_horaire : null,
        avatar_color: form.avatar_color,
        is_active: true,
      })
      if (error) throw error
    },
    onSuccess: () => {
      toast.success(`${form.prenom} ${form.nom} ajouté(e) à l'équipe`)
      qc.invalidateQueries({ queryKey: ['equipe'] })
      onOpenChange(false)
      setForm({ prenom: '', nom: '', email: '', telephone: '', role: 'commercial', specialites: '', objectif_mensuel: 0, taux_horaire: 0, avatar_color: 'var(--color-primary)' })
    },
    onError: (err) => {
      if (err.message !== 'Validation') toast.error('Erreur lors de l\'ajout')
    },
  })

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => onOpenChange(false)} />
      <div className="absolute inset-0 sm:inset-auto sm:top-[10%] sm:left-1/2 sm:-translate-x-1/2 sm:max-w-lg sm:w-full bg-white sm:rounded-2xl shadow-2xl overflow-hidden animate-fadeIn flex flex-col max-h-screen sm:max-h-[80vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-accent">Ajouter un membre</h2>
          </div>
          <button onClick={() => onOpenChange(false)} className="p-2 hover:bg-gray-100 rounded-lg transition min-h-[44px] min-w-[44px] flex items-center justify-center">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
              <input value={form.prenom} onChange={e => set('prenom', e.target.value)} className={`w-full px-3 py-2.5 rounded-lg border text-sm min-h-[44px] outline-none ${errors.prenom ? 'border-red-300' : 'border-gray-200 focus:border-primary'}`} />
              {errors.prenom && <p className="text-red-500 text-xs mt-1">{errors.prenom}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
              <input value={form.nom} onChange={e => set('nom', e.target.value)} className={`w-full px-3 py-2.5 rounded-lg border text-sm min-h-[44px] outline-none ${errors.nom ? 'border-red-300' : 'border-gray-200 focus:border-primary'}`} />
              {errors.nom && <p className="text-red-500 text-xs mt-1">{errors.nom}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)} className={`w-full px-3 py-2.5 rounded-lg border text-sm min-h-[44px] outline-none ${errors.email ? 'border-red-300' : 'border-gray-200 focus:border-primary'}`} />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
            <input value={form.telephone} onChange={e => set('telephone', e.target.value)} placeholder="06 12 34 56 78" className={`w-full px-3 py-2.5 rounded-lg border text-sm min-h-[44px] outline-none ${errors.telephone ? 'border-red-300' : 'border-gray-200 focus:border-primary'}`} />
            {errors.telephone && <p className="text-red-500 text-xs mt-1">{errors.telephone}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rôle *</label>
            <div className="grid grid-cols-3 gap-2">
              {ROLES.map(r => (
                <button key={r.value} type="button" onClick={() => set('role', r.value)}
                  className={`px-3 py-2.5 rounded-lg text-xs font-medium border transition min-h-[44px] ${
                    form.role === r.value ? 'text-white border-transparent' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                  style={form.role === r.value ? { backgroundColor: r.color } : {}}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {form.role === 'formatrice' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Taux horaire (€)</label>
              <input type="number" value={form.taux_horaire} onChange={e => set('taux_horaire', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm min-h-[44px] outline-none focus:border-primary" />
            </div>
          )}

          {form.role !== 'formatrice' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Objectif mensuel (inscriptions)</label>
              <input type="number" value={form.objectif_mensuel} onChange={e => set('objectif_mensuel', parseInt(e.target.value) || 0)} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm min-h-[44px] outline-none focus:border-primary" />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Spécialités (séparées par virgule)</label>
            <input value={form.specialites} onChange={e => set('specialites', e.target.value)} placeholder="microblading, full lips, soins visage" className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm min-h-[44px] outline-none focus:border-primary" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Couleur avatar</label>
            <div className="flex gap-2">
              {AVATAR_COLORS.map(c => (
                <button key={c} type="button" onClick={() => set('avatar_color', c)}
                  className={`w-9 h-9 rounded-full transition ${form.avatar_color === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-105'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 shrink-0">
          <button onClick={() => onOpenChange(false)} className="px-4 py-2.5 text-sm text-gray-500 min-h-[44px]">Annuler</button>
          <button onClick={() => createMember.mutate()} disabled={createMember.isPending} className="px-5 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-sm font-medium transition disabled:opacity-50 min-h-[44px] flex items-center gap-2">
            {createMember.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Ajout...</> : 'Ajouter à l\'équipe'}
          </button>
        </div>
      </div>
    </div>
  )
}
