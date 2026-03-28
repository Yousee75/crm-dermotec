'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCreateLead } from '@/hooks/use-leads'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/infra/supabase-client'
import { validateEmail, validatePhone } from '@/lib/validators'
import { toast } from 'sonner'
import { X, Loader2, UserPlus } from 'lucide-react'
import type { Formation, SourceLead, StatutPro } from '@/types'

const SOURCES: { value: SourceLead; label: string }[] = [
  { value: 'formulaire', label: 'Formulaire site' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'telephone', label: 'Téléphone' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'google', label: 'Google' },
  { value: 'bouche_a_oreille', label: 'Bouche-à-oreille' },
  { value: 'partenariat', label: 'Partenariat' },
  { value: 'ancien_stagiaire', label: 'Ancien stagiaire' },
  { value: 'salon', label: 'Salon pro' },
  { value: 'autre', label: 'Autre' },
]

const STATUTS_PRO: { value: StatutPro; label: string }[] = [
  { value: 'salariee', label: 'Salariée' },
  { value: 'independante', label: 'Indépendante' },
  { value: 'auto_entrepreneur', label: 'Auto-entrepreneuse' },
  { value: 'demandeur_emploi', label: 'Demandeur d\'emploi' },
  { value: 'reconversion', label: 'Reconversion' },
  { value: 'etudiante', label: 'Étudiante' },
  { value: 'gerant_institut', label: 'Gérante institut' },
]

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateLeadDialog({ open, onOpenChange }: Props) {
  const router = useRouter()
  const createLead = useCreateLead()
  const supabase = createClient()

  const { data: formations } = useQuery({
    queryKey: ['formations-list'],
    queryFn: async () => {
      const { data } = await supabase.from('formations').select('id, nom, slug, categorie, prix_ht').eq('is_active', true).order('sort_order')
      return (data || []) as Formation[]
    },
  })

  const [form, setForm] = useState({
    prenom: '', nom: '', email: '', telephone: '',
    formation_principale_id: '', source: 'formulaire' as SourceLead,
    statut_pro: '' as string, message: '', financement_souhaite: false,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const set = (field: string, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: '' }))
  }

  const validate = (): boolean => {
    const e: Record<string, string> = {}
    if (!form.prenom.trim()) e.prenom = 'Prénom requis'
    if (!form.email.trim()) e.email = 'Email requis'
    else {
      const emailErr = validateEmail(form.email)
      if (emailErr) e.email = emailErr
    }
    if (form.telephone) {
      const phoneErr = validatePhone(form.telephone)
      if (phoneErr) e.telephone = phoneErr
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return

    try {
      const lead = await createLead.mutateAsync({
        prenom: form.prenom.trim(),
        nom: form.nom.trim() || undefined,
        email: form.email.trim().toLowerCase(),
        telephone: form.telephone.trim() || undefined,
        formation_principale_id: form.formation_principale_id || undefined,
        source: form.source,
        statut_pro: (form.statut_pro || undefined) as StatutPro | undefined,
        message: form.message.trim() || undefined,
        financement_souhaite: form.financement_souhaite,
        statut: 'NOUVEAU',
        priorite: 'NORMALE',
        score_chaud: 20,
        nb_contacts: 0,
        tags: [],
      })

      toast.success(`Lead créé : ${form.prenom} ${form.nom}`)
      onOpenChange(false)
      setForm({ prenom: '', nom: '', email: '', telephone: '', formation_principale_id: '', source: 'formulaire', statut_pro: '', message: '', financement_souhaite: false })
      if (lead?.id) router.push(`/lead/${lead.id}`)
    } catch {
      toast.error('Erreur lors de la création du lead')
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => onOpenChange(false)} />
      <div className="absolute inset-0 sm:inset-auto sm:top-[10%] sm:left-1/2 sm:-translate-x-1/2 sm:max-w-lg sm:w-full bg-white sm:rounded-2xl shadow-2xl overflow-hidden animate-fadeIn flex flex-col max-h-screen sm:max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F4F0EB] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <UserPlus className="w-4 h-4 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-accent">Nouveau lead</h2>
          </div>
          <button onClick={() => onOpenChange(false)} className="p-2 hover:bg-[#F4F0EB] rounded-lg transition min-h-[44px] min-w-[44px] flex items-center justify-center">
            <X className="w-5 h-5 text-[#999999]" />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Prénom + Nom */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Prénom *" error={errors.prenom}>
              <input value={form.prenom} onChange={e => set('prenom', e.target.value)} placeholder="Fatou" className={inputClass(errors.prenom)} />
            </Field>
            <Field label="Nom">
              <input value={form.nom} onChange={e => set('nom', e.target.value)} placeholder="Diallo" className={inputClass()} />
            </Field>
          </div>

          {/* Email */}
          <Field label="Email *" error={errors.email}>
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="fatou@exemple.com" className={inputClass(errors.email)} />
          </Field>

          {/* Téléphone */}
          <Field label="Téléphone" error={errors.telephone}>
            <input value={form.telephone} onChange={e => set('telephone', e.target.value)} placeholder="06 12 34 56 78" className={inputClass(errors.telephone)} />
          </Field>

          {/* Formation */}
          <Field label="Formation souhaitée">
            <select value={form.formation_principale_id} onChange={e => set('formation_principale_id', e.target.value)} className={inputClass()}>
              <option value="">— Sélectionner —</option>
              {formations?.map(f => (
                <option key={f.id} value={f.id}>{f.nom} ({f.prix_ht}€ HT)</option>
              ))}
            </select>
          </Field>

          {/* Source + Statut pro */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Source">
              <select value={form.source} onChange={e => set('source', e.target.value)} className={inputClass()}>
                {SOURCES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </Field>
            <Field label="Statut professionnel">
              <select value={form.statut_pro} onChange={e => set('statut_pro', e.target.value)} className={inputClass()}>
                <option value="">— Sélectionner —</option>
                {STATUTS_PRO.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </Field>
          </div>

          {/* Financement */}
          <label className="flex items-center gap-3 cursor-pointer min-h-[44px]">
            <input type="checkbox" checked={form.financement_souhaite} onChange={e => set('financement_souhaite', e.target.checked)} className="w-5 h-5 rounded border-[#EEEEEE] text-primary focus:ring-primary" />
            <span className="text-sm text-[#3A3A3A]">Financement souhaité (OPCO, France Travail, CPF...)</span>
          </label>

          {/* Message */}
          <Field label="Message / Notes">
            <textarea value={form.message} onChange={e => set('message', e.target.value)} rows={3} placeholder="Notes sur le premier contact..." className={inputClass()} />
          </Field>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#F4F0EB] flex items-center justify-end gap-3 shrink-0">
          <button onClick={() => onOpenChange(false)} className="px-4 py-2.5 text-sm text-[#777777] hover:text-[#3A3A3A] transition min-h-[44px]">
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={createLead.isPending}
            className="px-5 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-sm font-medium transition disabled:opacity-50 min-h-[44px] flex items-center gap-2"
          >
            {createLead.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Création...</> : 'Créer le lead'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-[#3A3A3A] mb-1">{label}</label>
      {children}
      {error && <p className="text-[#FF2D78] text-xs mt-1">{error}</p>}
    </div>
  )
}

function inputClass(error?: string) {
  return `w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition min-h-[44px] ${
    error ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' : 'border-[#EEEEEE] focus:border-primary focus:ring-2 focus:ring-primary/20'
  }`
}
