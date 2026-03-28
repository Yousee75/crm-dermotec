'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useCreateSession } from '@/hooks/use-sessions'
import { createClient } from '@/lib/infra/supabase-client'
import type { Formation, Equipe } from '@/types'
import { toast } from 'sonner'
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './Dialog'
import { Button } from './Button'
import { Input } from './Input'
import { Calendar, Clock, MapPin, Users } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
}

export function CreateSessionDialog({ open, onClose }: Props) {
  const supabase = createClient()
  const createSession = useCreateSession()

  const [formationId, setFormationId] = useState('')
  const [dateDebut, setDateDebut] = useState('')
  const [dateFin, setDateFin] = useState('')
  const [horaireDebut, setHoraireDebut] = useState('09:00')
  const [horaireFin, setHoraireFin] = useState('17:00')
  const [salle, setSalle] = useState('Salle Dermotec - Paris 11e')
  const [formatriceId, setFormatriceId] = useState('')
  const [placesMax, setPlacesMax] = useState(6)

  const { data: formations } = useQuery({
    queryKey: ['formations-active'],
    queryFn: async () => {
      const { data } = await supabase.from('formations').select('*').eq('is_active', true).order('nom')
      return (data || []) as Formation[]
    },
  })

  const { data: formatrices } = useQuery({
    queryKey: ['formatrices'],
    queryFn: async () => {
      const { data } = await supabase.from('equipe').select('*').eq('role', 'formatrice').eq('is_active', true).order('nom')
      return (data || []) as Equipe[]
    },
  })

  const selectedFormation = formations?.find(f => f.id === formationId)

  const handleFormationChange = (id: string) => {
    setFormationId(id)
    const f = formations?.find(x => x.id === id)
    if (f && dateDebut) {
      const end = new Date(dateDebut)
      end.setDate(end.getDate() + f.duree_jours - 1)
      setDateFin(end.toISOString().split('T')[0])
    }
    if (f) setPlacesMax(f.places_max)
  }

  const handleDateDebutChange = (date: string) => {
    setDateDebut(date)
    if (selectedFormation) {
      const end = new Date(date)
      end.setDate(end.getDate() + selectedFormation.duree_jours - 1)
      setDateFin(end.toISOString().split('T')[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formationId || !dateDebut) {
      toast.error('Formation et date de début requises')
      return
    }
    try {
      await createSession.mutateAsync({
        formation_id: formationId,
        date_debut: dateDebut,
        date_fin: dateFin || dateDebut,
        horaire_debut: horaireDebut,
        horaire_fin: horaireFin,
        salle,
        formatrice_id: formatriceId || undefined,
        places_max: placesMax,
        places_occupees: 0,
        statut: 'PLANIFIEE',
      } as any)
      toast.success('Session créée !')
      onClose()
      setFormationId('')
      setDateDebut('')
      setDateFin('')
    } catch {
      toast.error('Erreur lors de la création')
    }
  }

  return (
    <Dialog open={open} onClose={onClose} size="lg">
      <DialogHeader onClose={onClose}>
        <DialogTitle>Planifier une session</DialogTitle>
        <DialogDescription>Créez une nouvelle session de formation</DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-[#3A3A3A]">Formation *</label>
          <select
            value={formationId}
            onChange={(e) => handleFormationChange(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-lg border border-[#F0F0F0] text-sm focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none bg-white"
          >
            <option value="">Sélectionner une formation</option>
            {formations?.map(f => (
              <option key={f.id} value={f.id}>
                {f.nom} ({f.duree_jours}j · {f.prix_ht}€ HT)
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input label="Date de début *" type="date" value={dateDebut} onChange={(e) => handleDateDebutChange(e.target.value)} required icon={<Calendar className="w-4 h-4" />} />
          <Input label="Date de fin" type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} icon={<Calendar className="w-4 h-4" />} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input label="Heure début" type="time" value={horaireDebut} onChange={(e) => setHoraireDebut(e.target.value)} icon={<Clock className="w-4 h-4" />} />
          <Input label="Heure fin" type="time" value={horaireFin} onChange={(e) => setHoraireFin(e.target.value)} icon={<Clock className="w-4 h-4" />} />
        </div>

        <Input label="Salle" value={salle} onChange={(e) => setSalle(e.target.value)} icon={<MapPin className="w-4 h-4" />} />

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[#3A3A3A]">Formatrice</label>
            <select value={formatriceId} onChange={(e) => setFormatriceId(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-[#F0F0F0] text-sm focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none bg-white">
              <option value="">Sélectionner...</option>
              {formatrices?.map(f => <option key={f.id} value={f.id}>{f.prenom} {f.nom}</option>)}
            </select>
          </div>
          <Input label="Places max" type="number" min={1} max={20} value={placesMax} onChange={(e) => setPlacesMax(Number(e.target.value))} icon={<Users className="w-4 h-4" />} />
        </div>

        {selectedFormation && dateDebut && (
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-3">
            <p className="text-sm font-medium text-accent">{selectedFormation.nom}</p>
            <p className="text-xs text-[#777777] mt-0.5">{selectedFormation.duree_jours}j · {selectedFormation.duree_heures}h · {selectedFormation.prix_ht}€ HT · {placesMax} places</p>
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" type="button" onClick={onClose}>Annuler</Button>
          <Button type="submit" loading={createSession.isPending}>Créer la session</Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
