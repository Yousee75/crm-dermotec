'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase-client'
import { type Equipe, type RoleEquipe } from '@/types'
import { getInitials, formatEuro } from '@/lib/utils'
import {
  Plus, Users, Mail, Phone, Edit2,
  Power, PowerOff, Star, Award, GraduationCap, Heart
} from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/ui/PageHeader'
import { KpiCard } from '@/components/ui/KpiCard'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/Dialog'
import { cn } from '@/lib/utils'

const ROLE_CONFIG: Record<RoleEquipe, { label: string; variant: 'primary' | 'success' | 'warning' | 'error' | 'info'; icon: React.ElementType }> = {
  admin: { label: 'Admin', variant: 'primary', icon: Star },
  commercial: { label: 'Commercial', variant: 'info', icon: Phone },
  formatrice: { label: 'Formatrice', variant: 'error', icon: GraduationCap },
  assistante: { label: 'Assistante', variant: 'success', icon: Heart },
  manager: { label: 'Manager', variant: 'warning', icon: Award },
}

export default function EquipePage() {
  const [showCreate, setShowCreate] = useState(false)
  const supabase = createClient()
  const queryClient = useQueryClient()

  const { data: equipe, isLoading } = useQuery({
    queryKey: ['equipe'],
    queryFn: async () => {
      const { data, error } = await supabase.from('equipe').select('*').order('role').order('nom')
      if (error) throw error
      return data as Equipe[]
    },
  })

  const { data: formations } = useQuery({
    queryKey: ['formations'],
    queryFn: async () => {
      const { data, error } = await supabase.from('formations').select('id, nom, categorie').eq('is_active', true).order('nom')
      if (error) throw error
      return data
    },
  })

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('equipe').update({ is_active, updated_at: new Date().toISOString() }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['equipe'] }); toast.success('Statut mis à jour') },
    onError: () => toast.error('Erreur'),
  })

  const actifs = equipe?.filter(e => e.is_active).length || 0

  return (
    <div className="space-y-5">
      <PageHeader title="Équipe" description={`${equipe?.length || 0} membres · ${actifs} actifs`}>
        <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setShowCreate(true)}>
          Ajouter
        </Button>
      </PageHeader>

      {/* KPIs — les 3 métriques qui comptent */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 stagger-children">
        <KpiCard icon={Users} label="Membres actifs" value={actifs} color="#3B82F6" />
        <KpiCard icon={Star} label="Objectif total" value={formatEuro(equipe?.reduce((s, e) => s + e.objectif_mensuel, 0) || 0)} color="#F59E0B" />
        <KpiCard icon={GraduationCap} label="Formatrices" value={equipe?.filter(e => e.role === 'formatrice').length || 0} color="#EC4899" />
      </div>

      {/* Grille équipe — cards, pas de table (c'est des gens, pas des données) */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : !equipe?.length ? (
        <Card>
          <EmptyState
            icon={<Users className="w-7 h-7" />}
            title="Aucun membre"
            description="Ajoutez votre premier membre d'équipe"
            action={{ label: 'Ajouter', onClick: () => setShowCreate(true), icon: <Plus className="w-3.5 h-3.5" /> }}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
          {equipe.map((membre) => {
            const role = ROLE_CONFIG[membre.role]
            return (
              <Card key={membre.id} hover className={cn(!membre.is_active && 'opacity-60')}>
                {/* Header — avatar + nom + rôle + toggle */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar
                      name={`${membre.prenom} ${membre.nom}`}
                      size="md"
                      color={membre.avatar_color}
                      status={membre.is_active ? 'online' : 'offline'}
                    />
                    <div>
                      <h3 className="font-semibold text-[#082545]">{membre.prenom} {membre.nom}</h3>
                      <Badge variant={role.variant} size="sm">
                        <role.icon className="w-3 h-3" /> {role.label}
                      </Badge>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleActive.mutate({ id: membre.id, is_active: !membre.is_active })}
                    className={cn(
                      'p-1.5 rounded-lg transition',
                      membre.is_active ? 'text-green-500 hover:bg-green-50' : 'text-gray-300 hover:bg-gray-100'
                    )}
                  >
                    {membre.is_active ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                  </button>
                </div>

                {/* Contact — compact, cliquable */}
                <div className="space-y-1.5 mb-3">
                  {membre.email && (
                    <a href={`mailto:${membre.email}`} className="flex items-center gap-2 text-xs text-gray-500 hover:text-[#2EC6F3] transition truncate">
                      <Mail className="w-3.5 h-3.5 shrink-0" /> {membre.email}
                    </a>
                  )}
                  {membre.telephone && (
                    <a href={`tel:${membre.telephone}`} className="flex items-center gap-2 text-xs text-gray-500 hover:text-[#2EC6F3] transition">
                      <Phone className="w-3.5 h-3.5 shrink-0" /> {membre.telephone}
                    </a>
                  )}
                </div>

                {/* Objectif — le chiffre qui compte */}
                <div className="bg-gray-50 rounded-lg px-3 py-2 mb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider">Objectif mensuel</span>
                    <span className="font-bold text-sm text-[#082545]">{formatEuro(membre.objectif_mensuel)}</span>
                  </div>
                </div>

                {/* Spécialités — tags discrets */}
                {membre.specialites.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {membre.specialites.slice(0, 3).map(spec => (
                      <Badge key={spec} variant="default" size="sm">{spec}</Badge>
                    ))}
                    {membre.specialites.length > 3 && (
                      <span className="text-[10px] text-gray-400 self-center">+{membre.specialites.length - 3}</span>
                    )}
                  </div>
                )}

                {/* Formatrice extras — seulement si pertinent */}
                {membre.role === 'formatrice' && membre.taux_horaire && (
                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs text-gray-400">Taux horaire</span>
                    <span className="text-sm font-semibold text-green-600">{formatEuro(membre.taux_horaire)}/h</span>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* Modal création */}
      <Dialog open={showCreate} onClose={() => setShowCreate(false)} size="md">
        <DialogHeader onClose={() => setShowCreate(false)}>
          <DialogTitle>Ajouter un membre</DialogTitle>
          <DialogDescription>Formulaire complet à implémenter</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setShowCreate(false)}>Annuler</Button>
          <Button>Créer</Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}
