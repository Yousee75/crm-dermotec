'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, UserPlus, RotateCcw } from 'lucide-react'
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { useCreateLead } from '@/hooks/use-leads'
import { FORMATIONS_SEED } from '@/lib/constants'
import type { SourceLead } from '@/types'

// --- Sources disponibles ---
const SOURCES: { value: SourceLead; label: string }[] = [
  { value: 'site_web', label: 'Site web' },
  { value: 'telephone', label: 'Téléphone' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'bouche_a_oreille', label: 'Bouche à oreille' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'google', label: 'Google' },
  { value: 'salon', label: 'Salon / Événement' },
  { value: 'partenariat', label: 'Partenaire' },
  { value: 'ancien_stagiaire', label: 'Ancien stagiaire' },
  { value: 'autre', label: 'Autre' },
]

// --- Formations groupées par catégorie ---
const FORMATIONS_BY_CATEGORY = FORMATIONS_SEED.reduce((acc, f) => {
  if (!acc[f.categorie]) acc[f.categorie] = []
  acc[f.categorie].push(f)
  return acc
}, {} as Record<string, typeof FORMATIONS_SEED>)

// --- Schema Zod ---
const createLeadSchema = z.object({
  prenom: z.string().min(2, 'Minimum 2 caractères').max(50),
  nom: z.string().min(2, 'Minimum 2 caractères').max(50),
  email: z.string().email('Email invalide'),
  telephone: z.string().regex(/^0[1-9]\d{8}$/, 'Format : 10 chiffres commençant par 0').or(z.literal('')).optional(),
  source: z.string().default('site_web'),
  entreprise_nom: z.string().max(100).optional(),
  siret: z.string().regex(/^\d{14}$/, 'Le SIRET doit contenir 14 chiffres').or(z.literal('')).optional(),
  ville: z.string().max(100).optional(),
  formation_slug: z.string().optional(),
  notes: z.string().max(1000).optional(),
})

type CreateLeadFormData = z.infer<typeof createLeadSchema>

const DEFAULT_VALUES: CreateLeadFormData = {
  prenom: '',
  nom: '',
  email: '',
  telephone: '',
  source: 'site_web',
  entreprise_nom: '',
  siret: '',
  ville: '',
  formation_slug: '',
  notes: '',
}

// --- Styles partagés ---
const inputClass = 'w-full px-3 py-2 rounded-lg border border-[#EEEEEE] text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors'
const selectClass = `${inputClass} bg-white`
const labelClass = 'block text-xs font-medium text-[#777777] mb-1'
const errorClass = 'text-xs text-[#FF2D78] mt-0.5'

interface CreateLeadDialogProps {
  open: boolean
  onClose: () => void
}

export function CreateLeadDialog({ open, onClose }: CreateLeadDialogProps) {
  const createLead = useCreateLead()
  const [keepOpen, setKeepOpen] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateLeadFormData>({
    resolver: zodResolver(createLeadSchema),
    defaultValues: DEFAULT_VALUES,
  })

  const onSubmit = async (data: CreateLeadFormData) => {
    // Trouver la formation sélectionnée
    const formation = data.formation_slug
      ? FORMATIONS_SEED.find(f => f.slug === data.formation_slug)
      : null

    await createLead.mutateAsync({
      prenom: data.prenom.trim(),
      nom: data.nom.trim(),
      email: data.email.trim(),
      telephone: data.telephone?.trim() || undefined,
      source: data.source as SourceLead,
      entreprise_nom: data.entreprise_nom?.trim() || undefined,
      siret: data.siret?.trim() || undefined,
      notes: data.notes?.trim() || undefined,
      formations_interessees: formation ? [formation.nom] : [],
      statut: 'NOUVEAU',
      priorite: 'NORMALE',
      score_chaud: 0,
      tags: [],
      nb_contacts: 0,
      financement_souhaite: false,
      data_sources: {},
      // ville stockée dans metadata (pas de colonne dédiée dans le type Lead)
      metadata: { ville: data.ville?.trim() || undefined },
    })

    if (keepOpen) {
      reset(DEFAULT_VALUES)
    } else {
      reset(DEFAULT_VALUES)
      onClose()
    }
  }

  const handleClose = () => {
    reset(DEFAULT_VALUES)
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} size="xl">
      <DialogHeader onClose={handleClose}>
        <DialogTitle>Nouveau prospect</DialogTitle>
        <DialogDescription>
          Remplissez les informations du prospect. Les champs marqués * sont obligatoires.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          {/* --- Colonne gauche --- */}
          <div className="space-y-4">
            {/* Prénom */}
            <div>
              <label htmlFor="prenom" className={labelClass}>Prénom *</label>
              <input
                id="prenom"
                type="text"
                {...register('prenom')}
                className={inputClass}
                placeholder="Marie"
                autoFocus
              />
              {errors.prenom && <p className={errorClass}>{errors.prenom.message}</p>}
            </div>

            {/* Nom */}
            <div>
              <label htmlFor="nom" className={labelClass}>Nom *</label>
              <input
                id="nom"
                type="text"
                {...register('nom')}
                className={inputClass}
                placeholder="Dupont"
              />
              {errors.nom && <p className={errorClass}>{errors.nom.message}</p>}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className={labelClass}>Email *</label>
              <input
                id="email"
                type="email"
                {...register('email')}
                className={inputClass}
                placeholder="marie@exemple.fr"
              />
              {errors.email && <p className={errorClass}>{errors.email.message}</p>}
            </div>

            {/* Téléphone */}
            <div>
              <label htmlFor="telephone" className={labelClass}>Téléphone</label>
              <input
                id="telephone"
                type="tel"
                {...register('telephone')}
                className={inputClass}
                placeholder="0612345678"
              />
              {errors.telephone && <p className={errorClass}>{errors.telephone.message}</p>}
            </div>

            {/* Source */}
            <div>
              <label htmlFor="source" className={labelClass}>Source</label>
              <select
                id="source"
                {...register('source')}
                className={selectClass}
              >
                {SOURCES.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* --- Colonne droite --- */}
          <div className="space-y-4">
            {/* Entreprise */}
            <div>
              <label htmlFor="entreprise_nom" className={labelClass}>Entreprise</label>
              <input
                id="entreprise_nom"
                type="text"
                {...register('entreprise_nom')}
                className={inputClass}
                placeholder="Institut Beauté Paris"
              />
            </div>

            {/* SIRET */}
            <div>
              <label htmlFor="siret" className={labelClass}>SIRET</label>
              <input
                id="siret"
                type="text"
                {...register('siret')}
                className={inputClass}
                placeholder="12345678901234"
                maxLength={14}
              />
              {errors.siret && <p className={errorClass}>{errors.siret.message}</p>}
            </div>

            {/* Ville */}
            <div>
              <label htmlFor="ville" className={labelClass}>Ville</label>
              <input
                id="ville"
                type="text"
                {...register('ville')}
                className={inputClass}
                placeholder="Paris"
              />
            </div>

            {/* Formation intéressée */}
            <div>
              <label htmlFor="formation_slug" className={labelClass}>Formation intéressée</label>
              <select
                id="formation_slug"
                {...register('formation_slug')}
                className={selectClass}
              >
                <option value="">-- Aucune --</option>
                {Object.entries(FORMATIONS_BY_CATEGORY).map(([cat, formations]) => (
                  <optgroup key={cat} label={cat}>
                    {formations.map(f => (
                      <option key={f.slug} value={f.slug}>
                        {f.nom} ({f.prix_ht} EUR HT)
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="notes" className={labelClass}>Notes</label>
              <textarea
                id="notes"
                {...register('notes')}
                className={`${inputClass} resize-none`}
                rows={3}
                placeholder="Informations complémentaires..."
              />
              {errors.notes && <p className={errorClass}>{errors.notes.message}</p>}
            </div>
          </div>
        </div>

        <DialogFooter>
          <label className="flex items-center gap-2 mr-auto text-xs text-[#777777] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={keepOpen}
              onChange={(e) => setKeepOpen(e.target.checked)}
              className="rounded border-[#EEEEEE] text-primary focus:ring-primary/30"
            />
            Créer et ajouter un autre
          </label>

          <Button variant="ghost" type="button" onClick={handleClose}>
            Annuler
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || createLead.isPending}
            loading={isSubmitting || createLead.isPending}
            icon={<UserPlus className="w-4 h-4" />}
          >
            {isSubmitting || createLead.isPending ? 'Création...' : 'Créer le prospect'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
