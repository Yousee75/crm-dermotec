'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/infra/supabase-client'
import type { RoleEquipe } from '@/types'
import { toast } from 'sonner'
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './Dialog'
import { Button } from './Button'
import { Input } from './Input'
import { User, Mail, Phone } from 'lucide-react'

const AVATAR_COLORS = ['var(--color-primary)', '#FF2D78', '#F59E0B', 'var(--color-success)', '#EF4444', '#EC4899', '#FF2D78', '#14B8A6']

interface Props {
  open: boolean
  onClose: () => void
}

export function CreateMembreDialog({ open, onClose }: Props) {
  const supabase = createClient()
  const qc = useQueryClient()

  const [prenom, setPrenom] = useState('')
  const [nom, setNom] = useState('')
  const [email, setEmail] = useState('')
  const [telephone, setTelephone] = useState('')
  const [role, setRole] = useState<RoleEquipe>('commercial')
  const [objectif, setObjectif] = useState(5000)

  const createMembre = useMutation({
    mutationFn: async () => {
      const color = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]
      const { data, error } = await supabase
        .from('equipe')
        .insert({
          prenom: prenom.trim(),
          nom: nom.trim(),
          email: email.trim(),
          telephone: telephone.trim() || null,
          role,
          avatar_color: color,
          objectif_mensuel: objectif,
          is_active: true,
          specialites: [],
          competences_formations: [],
          certifications: [],
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['equipe'] })
      toast.success('Membre ajouté !')
      onClose()
      setPrenom(''); setNom(''); setEmail(''); setTelephone('')
      setRole('commercial'); setObjectif(5000)
    },
    onError: () => toast.error('Erreur lors de la création'),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!prenom.trim() || !nom.trim() || !email.trim()) {
      toast.error('Prénom, nom et email requis')
      return
    }
    createMembre.mutate()
  }

  return (
    <Dialog open={open} onClose={onClose} size="md">
      <DialogHeader onClose={onClose}>
        <DialogTitle>Ajouter un membre</DialogTitle>
        <DialogDescription>Nouveau membre de l&apos;équipe Dermotec</DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input label="Prénom *" value={prenom} onChange={e => setPrenom(e.target.value)} required icon={<User className="w-4 h-4" />} />
          <Input label="Nom *" value={nom} onChange={e => setNom(e.target.value)} required />
        </div>

        <Input label="Email *" type="email" value={email} onChange={e => setEmail(e.target.value)} required icon={<Mail className="w-4 h-4" />} />
        <Input label="Téléphone" type="tel" value={telephone} onChange={e => setTelephone(e.target.value)} icon={<Phone className="w-4 h-4" />} />

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[#3A3A3A]">Rôle *</label>
            <select
              value={role}
              onChange={e => setRole(e.target.value as RoleEquipe)}
              className="w-full px-3 py-2 rounded-lg border border-[#F0F0F0] text-sm focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none bg-white"
            >
              <option value="commercial">Commercial</option>
              <option value="formatrice">Formatrice</option>
              <option value="assistante">Assistante</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <Input
            label="Objectif mensuel (€)"
            type="number"
            min={0}
            step={500}
            value={objectif}
            onChange={e => setObjectif(Number(e.target.value))}
          />
        </div>

        <DialogFooter>
          <Button variant="ghost" type="button" onClick={onClose}>Annuler</Button>
          <Button type="submit" loading={createMembre.isPending}>Créer</Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
