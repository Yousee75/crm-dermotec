'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase-client'
import { type Equipe, type RoleEquipe, type Formation, type Session } from '@/types'
import { formatEuro, cn } from '@/lib/utils'
import {
  Plus, Users, Mail, Phone, Edit2, Calendar, FileText, ExternalLink,
  Power, PowerOff, Star, Award, GraduationCap, Heart, Shield, Filter,
  Clock, MapPin, ChevronRight, DollarSign, Target, BookOpen
} from 'lucide-react'
import { toast } from 'sonner'
import { CreateMembreDialog } from '@/components/ui/CreateMembreDialog'

// Role configuration avec couleurs Dermotec
const ROLE_CONFIG: Record<RoleEquipe, {
  label: string;
  variant: 'purple' | 'blue' | 'pink' | 'green' | 'orange';
  color: string;
  icon: React.ElementType
}> = {
  admin: { label: 'Admin', variant: 'purple', color: '#8B5CF6', icon: Shield },
  commercial: { label: 'Commercial', variant: 'blue', color: 'var(--color-primary)', icon: Phone },
  formatrice: { label: 'Formatrice', variant: 'pink', color: '#EC4899', icon: GraduationCap },
  assistante: { label: 'Assistante', variant: 'green', color: '#10B981', icon: Heart },
  manager: { label: 'Manager', variant: 'orange', color: '#F59E0B', icon: Award },
}

const ROLE_FILTERS = [
  { value: 'all', label: 'Tous', icon: Users },
  { value: 'admin', label: 'Admin', icon: Shield },
  { value: 'commercial', label: 'Commercial', icon: Phone },
  { value: 'formatrice', label: 'Formatrice', icon: GraduationCap },
  { value: 'assistante', label: 'Assistante', icon: Heart },
  { value: 'manager', label: 'Manager', icon: Award },
]

// Avatar avec initiales
function TeamAvatar({ membre, size = 'md' }: { membre: Equipe; size?: 'sm' | 'md' | 'lg' }) {
  const roleConfig = ROLE_CONFIG[membre.role]
  const initials = `${membre.prenom.charAt(0)}${membre.nom.charAt(0)}`.toUpperCase()

  const sizeClass = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base'
  }[size]

  return (
    <div className="relative">
      <div
        className={cn(
          'rounded-full flex items-center justify-center font-semibold text-white',
          sizeClass
        )}
        style={{ backgroundColor: roleConfig.color }}
      >
        {initials}
      </div>
      {membre.is_active && (
        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#10B981] rounded-full border-2 border-white" />
      )}
    </div>
  )
}

// Badge rôle coloré
function RoleBadge({ role }: { role: RoleEquipe }) {
  const config = ROLE_CONFIG[role]
  const Icon = config.icon

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white"
      style={{ backgroundColor: config.color }}
    >
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  )
}

export default function EquipePage() {
  const [selectedMember, setSelectedMember] = useState<Equipe | null>(null)
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [showCreateMembre, setShowCreateMembre] = useState(false)

  const supabase = createClient()
  const queryClient = useQueryClient()

  // Fetch équipe
  const { data: equipe, isLoading: loadingEquipe } = useQuery({
    queryKey: ['equipe'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipe')
        .select('*')
        .order('is_active', { ascending: false })
        .order('role')
        .order('nom')
      if (error) throw error
      return data as Equipe[]
    },
  })

  // Fetch sessions ce mois pour KPI
  const { data: sessionsThisMonth } = useQuery({
    queryKey: ['sessions-this-month'],
    queryFn: async () => {
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

      const { data, error } = await supabase
        .from('sessions')
        .select('id, formatrice_id')
        .gte('date_debut', startOfMonth)
        .lte('date_debut', endOfMonth)
        .not('formatrice_id', 'is', null)

      if (error) throw error
      return data as Pick<Session, 'id' | 'formatrice_id'>[]
    },
  })

  // Fetch formations pour détails formatrices
  const { data: formations } = useQuery({
    queryKey: ['formations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('formations')
        .select('id, nom, categorie')
        .eq('is_active', true)
        .order('nom')
      if (error) throw error
      return data as Pick<Formation, 'id' | 'nom' | 'categorie'>[]
    },
  })

  // Toggle actif/inactif
  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('equipe')
        .update({ is_active, updated_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipe'] })
      toast.success('Statut mis à jour')
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  })

  // Calculs KPI
  const totalActifs = equipe?.filter(e => e.is_active).length || 0
  const totalFormatrices = equipe?.filter(e => e.role === 'formatrice' && e.is_active).length || 0
  const totalCommerciaux = equipe?.filter(e => e.role === 'commercial' && e.is_active).length || 0
  const sessionsAssignees = sessionsThisMonth?.length || 0

  // Filtrage par rôle
  const filteredEquipe = equipe?.filter(membre =>
    roleFilter === 'all' || membre.role === roleFilter
  ) || []

  // Formations par formatrice
  const getFormationsFormatrice = (formatriceId: string) => {
    return formations?.filter(f =>
      equipe?.find(e => e.id === formatriceId)?.competences_formations?.includes(f.id)
    ) || []
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-accent">Équipe</h1>
          <p className="text-[#777777] mt-1">
            {equipe?.length || 0} membres · {totalActifs} actifs
          </p>
        </div>
        <button onClick={() => setShowCreateMembre(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition">
          <Plus className="w-4 h-4" />
          Ajouter un membre
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-[#EEEEEE] p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#777777]">Membres actifs</p>
              <p className="text-2xl font-bold text-accent mt-1">{totalActifs}</p>
            </div>
            <div className="w-10 h-10 bg-[#E0EBF5] rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-[#6B8CAE]" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-[#EEEEEE] p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#777777]">Formatrices</p>
              <p className="text-2xl font-bold text-accent mt-1">{totalFormatrices}</p>
            </div>
            <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-pink-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-[#EEEEEE] p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#777777]">Commerciaux</p>
              <p className="text-2xl font-bold text-accent mt-1">{totalCommerciaux}</p>
            </div>
            <div className="w-10 h-10 bg-[#E0EBF5] rounded-lg flex items-center justify-center">
              <Phone className="w-5 h-5 text-[#6B8CAE]" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-[#EEEEEE] p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#777777]">Sessions ce mois</p>
              <p className="text-2xl font-bold text-accent mt-1">{sessionsAssignees}</p>
            </div>
            <div className="w-10 h-10 bg-[#D1FAE5] rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-[#10B981]" />
            </div>
          </div>
        </div>
      </div>

      {/* Filtres par rôle */}
      <div className="flex flex-wrap gap-2">
        {ROLE_FILTERS.map((filter) => {
          const Icon = filter.icon
          const isActive = roleFilter === filter.value
          return (
            <button
              key={filter.value}
              onClick={() => setRoleFilter(filter.value)}
              className={cn(
                'inline-flex items-center gap-2 px-3 py-2 rounded-lg border transition',
                isActive
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-[#3A3A3A] border-[#EEEEEE] hover:border-primary/50'
              )}
            >
              <Icon className="w-4 h-4" />
              {filter.label}
            </button>
          )
        })}
      </div>

      {/* Grid des membres */}
      {loadingEquipe ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-[#EEEEEE] p-6 animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-[#EEEEEE] rounded-full" />
                <div className="space-y-2">
                  <div className="w-24 h-4 bg-[#EEEEEE] rounded" />
                  <div className="w-16 h-3 bg-[#EEEEEE] rounded" />
                </div>
              </div>
              <div className="space-y-3">
                <div className="w-full h-3 bg-[#EEEEEE] rounded" />
                <div className="w-3/4 h-3 bg-[#EEEEEE] rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredEquipe.length === 0 ? (
        <div className="bg-white rounded-lg border border-[#EEEEEE] p-12 text-center">
          <Users className="w-12 h-12 text-[#999999] mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[#111111] mb-2">
            {roleFilter === 'all' ? 'Aucun membre' : `Aucun ${ROLE_FILTERS.find(f => f.value === roleFilter)?.label.toLowerCase()}`}
          </h3>
          <p className="text-[#777777] mb-6">
            {roleFilter === 'all'
              ? 'Commencez par ajouter votre premier membre d\'équipe'
              : 'Aucun membre trouvé pour ce rôle'
            }
          </p>
          {roleFilter === 'all' && (
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition">
              <Plus className="w-4 h-4" />
              Ajouter un membre
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEquipe.map((membre) => (
            <div
              key={membre.id}
              className={cn(
                'bg-white rounded-lg border border-[#EEEEEE] p-6 cursor-pointer hover:border-primary/50 transition',
                !membre.is_active && 'opacity-60'
              )}
              onClick={() => setSelectedMember(membre)}
            >
              {/* Header avec avatar et statut */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <TeamAvatar membre={membre} />
                  <div>
                    <h3 className="font-semibold text-accent">
                      {membre.prenom} {membre.nom}
                    </h3>
                    <RoleBadge role={membre.role} />
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleActive.mutate({ id: membre.id, is_active: !membre.is_active })
                  }}
                  className={cn(
                    'p-1.5 rounded-lg transition',
                    membre.is_active
                      ? 'text-[#10B981] hover:bg-green-50'
                      : 'text-[#999999] hover:bg-[#FAF8F5]'
                  )}
                >
                  {membre.is_active ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                </button>
              </div>

              {/* Contact */}
              <div className="space-y-2 mb-4">
                <a
                  href={`mailto:${membre.email}`}
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-2 text-sm text-[#777777] hover:text-primary transition"
                >
                  <Mail className="w-4 h-4" />
                  {membre.email}
                </a>
                {membre.telephone && (
                  <a
                    href={`tel:${membre.telephone}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-2 text-sm text-[#777777] hover:text-primary transition"
                  >
                    <Phone className="w-4 h-4" />
                    {membre.telephone}
                  </a>
                )}
              </div>

              {/* Spécialités */}
              {membre.specialites.length > 0 && (
                <div className="mb-4">
                  <div className="flex flex-wrap gap-1">
                    {membre.specialites.slice(0, 3).map((spec) => (
                      <span
                        key={spec}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-[#F4F0EB] text-[#3A3A3A]"
                      >
                        {spec}
                      </span>
                    ))}
                    {membre.specialites.length > 3 && (
                      <span className="text-xs text-[#777777]">
                        +{membre.specialites.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Formatrice extras */}
              {membre.role === 'formatrice' && (
                <div className="space-y-3 pt-3 border-t border-[#F4F0EB]">
                  {membre.cv_url && (
                    <a
                      href={membre.cv_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <FileText className="w-4 h-4" />
                      CV
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {membre.certifications && membre.certifications.length > 0 && (
                    <div className="flex items-center gap-2 text-sm text-[#777777]">
                      <Award className="w-4 h-4" />
                      {membre.certifications.length} certification{membre.certifications.length > 1 ? 's' : ''}
                    </div>
                  )}
                  {membre.taux_horaire && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#777777]">Taux horaire</span>
                      <span className="font-semibold text-[#10B981]">
                        {formatEuro(membre.taux_horaire)}/h
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Action */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#F4F0EB]">
                <span className="text-sm text-[#777777]">Voir le profil</span>
                <ChevronRight className="w-4 h-4 text-[#999999]" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Panel de détail (simplified pour l'exemple) */}
      {selectedMember && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-[#EEEEEE]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <TeamAvatar membre={selectedMember} size="lg" />
                  <div>
                    <h2 className="text-xl font-bold text-accent">
                      {selectedMember.prenom} {selectedMember.nom}
                    </h2>
                    <RoleBadge role={selectedMember.role} />
                  </div>
                </div>
                <button
                  onClick={() => setSelectedMember(null)}
                  className="text-[#999999] hover:text-[#777777]"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <p className="text-center text-[#777777]">
                Détail du profil à implémenter
              </p>
            </div>
          </div>
        </div>
      )}

      <CreateMembreDialog open={showCreateMembre} onClose={() => setShowCreateMembre(false)} />
    </div>
  )
}
