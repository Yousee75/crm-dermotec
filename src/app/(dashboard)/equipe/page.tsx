'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase-client'
import { type Equipe, type RoleEquipe } from '@/types'
import { COLORS } from '@/lib/constants'
import { getInitials, formatEuro } from '@/lib/utils'
import {
  Plus, Users, Mail, Phone, Edit2, Trash2,
  Power, PowerOff, Star, Award, Calendar,
  GraduationCap, Heart, Sparkles, Zap, Flower2, ShieldCheck
} from 'lucide-react'
import { toast } from 'sonner'

const ROLE_COLORS: Record<RoleEquipe, { bg: string; text: string; icon: any }> = {
  admin: { bg: 'bg-purple-100', text: 'text-purple-700', icon: Star },
  commercial: { bg: 'bg-blue-100', text: 'text-blue-700', icon: Phone },
  formatrice: { bg: 'bg-pink-100', text: 'text-pink-700', icon: GraduationCap },
  assistante: { bg: 'bg-green-100', text: 'text-green-700', icon: Heart },
  manager: { bg: 'bg-orange-100', text: 'text-orange-700', icon: Award },
}

export default function EquipePage() {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const supabase = createClient()
  const queryClient = useQueryClient()

  // Fetch équipe
  const { data: equipe, isLoading } = useQuery({
    queryKey: ['equipe'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipe')
        .select('*')
        .order('role', { ascending: true })
        .order('nom', { ascending: true })
      if (error) throw error
      return data as Equipe[]
    },
  })

  // Fetch formations pour formatrices
  const { data: formations } = useQuery({
    queryKey: ['formations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('formations')
        .select('id, nom, categorie')
        .eq('is_active', true)
        .order('nom')
      if (error) throw error
      return data
    },
  })

  // Toggle active
  const toggleActiveMutation = useMutation({
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

  const actifs = equipe?.filter(e => e.is_active).length || 0
  const objectifTotal = equipe?.reduce((sum, e) => sum + e.objectif_mensuel, 0) || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#082545]" style={{ fontFamily: 'var(--font-heading)' }}>
            Équipe
          </h1>
          <p className="text-sm text-gray-500">{equipe?.length || 0} membres · {actifs} actifs</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#2EC6F3] hover:bg-[#1BA8D4] text-white rounded-xl text-sm font-medium transition"
        >
          <Plus className="w-4 h-4" />
          Ajouter un membre
        </button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border p-4 flex items-center gap-3">
          <Users className="w-8 h-8 text-blue-500" />
          <div>
            <p className="text-xs text-gray-500">Membres actifs</p>
            <p className="text-xl font-bold text-blue-500">{actifs}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4 flex items-center gap-3">
          <Star className="w-8 h-8 text-orange-500" />
          <div>
            <p className="text-xs text-gray-500">Objectif total</p>
            <p className="text-xl font-bold text-orange-500">{formatEuro(objectifTotal)}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4 flex items-center gap-3">
          <GraduationCap className="w-8 h-8 text-pink-500" />
          <div>
            <p className="text-xs text-gray-500">Formatrices</p>
            <p className="text-xl font-bold text-pink-500">{equipe?.filter(e => e.role === 'formatrice').length || 0}</p>
          </div>
        </div>
      </div>

      {/* Grille équipe */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full text-center py-12 text-gray-400">Chargement...</div>
        ) : !equipe?.length ? (
          <div className="col-span-full text-center py-12 text-gray-400">
            Aucun membre d'équipe
          </div>
        ) : equipe.map((membre) => {
          const roleConfig = ROLE_COLORS[membre.role]
          const IconRole = roleConfig.icon

          return (
            <div key={membre.id} className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-sm transition">
              {/* Header avec avatar et toggle */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                    style={{ backgroundColor: membre.avatar_color }}
                  >
                    {getInitials(membre.prenom, membre.nom)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#082545]">{membre.prenom} {membre.nom}</h3>
                    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${roleConfig.bg} ${roleConfig.text}`}>
                      <IconRole className="w-3 h-3" />
                      {membre.role}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => toggleActiveMutation.mutate({ id: membre.id, is_active: !membre.is_active })}
                  className={`p-1.5 rounded-lg transition ${
                    membre.is_active
                      ? 'bg-green-50 text-green-600 hover:bg-green-100'
                      : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                  }`}
                  title={membre.is_active ? 'Désactiver' : 'Activer'}
                >
                  {membre.is_active ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                </button>
              </div>

              {/* Contact */}
              <div className="space-y-1.5 mb-3">
                {membre.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                    <a href={`mailto:${membre.email}`} className="hover:text-[#2EC6F3] truncate">
                      {membre.email}
                    </a>
                  </div>
                )}
                {membre.telephone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    <a href={`tel:${membre.telephone}`} className="hover:text-[#2EC6F3]">
                      {membre.telephone}
                    </a>
                  </div>
                )}
              </div>

              {/* Objectif */}
              <div className="bg-gray-50 rounded-lg p-2 mb-3">
                <p className="text-xs text-gray-500">Objectif mensuel</p>
                <p className="font-bold text-[#082545]">{formatEuro(membre.objectif_mensuel)}</p>
              </div>

              {/* Spécialités */}
              {membre.specialites.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-gray-500 mb-1">Spécialités</p>
                  <div className="flex flex-wrap gap-1">
                    {membre.specialites.slice(0, 3).map(spec => (
                      <span key={spec} className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-full">
                        {spec}
                      </span>
                    ))}
                    {membre.specialites.length > 3 && (
                      <span className="text-xs text-gray-400">+{membre.specialites.length - 3}</span>
                    )}
                  </div>
                </div>
              )}

              {/* Formatrice spécifique */}
              {membre.role === 'formatrice' && (
                <div className="space-y-2">
                  {membre.competences_formations && membre.competences_formations.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Formations dispensées</p>
                      <div className="text-xs">
                        {formations?.filter(f => membre.competences_formations?.includes(f.id))
                          .slice(0, 2)
                          .map(f => (
                            <div key={f.id} className="text-gray-600">{f.nom}</div>
                          ))
                        }
                        {membre.competences_formations.length > 2 && (
                          <div className="text-gray-400">+{membre.competences_formations.length - 2} autres</div>
                        )}
                      </div>
                    </div>
                  )}

                  {membre.taux_horaire && (
                    <div className="bg-green-50 rounded p-2">
                      <p className="text-xs text-gray-500">Taux horaire</p>
                      <p className="font-medium text-green-700">{formatEuro(membre.taux_horaire)}/h</p>
                    </div>
                  )}

                  {membre.certifications && membre.certifications.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Certifications</p>
                      <div className="flex flex-wrap gap-1">
                        {membre.certifications.slice(0, 2).map(cert => (
                          <span key={cert} className="px-2 py-0.5 bg-yellow-50 text-yellow-700 text-xs rounded-full">
                            {cert}
                          </span>
                        ))}
                        {membre.certifications.length > 2 && (
                          <span className="text-xs text-gray-400">+{membre.certifications.length - 2}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-1 mt-3 pt-3 border-t border-gray-100">
                <button className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 text-xs bg-gray-50 hover:bg-gray-100 rounded-lg transition">
                  <Edit2 className="w-3.5 h-3.5" />
                  Modifier
                </button>
                <button className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal création (simplifié pour l'exemple) */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowCreateForm(false)}>
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">Ajouter un membre</h3>
            <p className="text-sm text-gray-500 mb-4">Fonctionnalité à implémenter avec un formulaire complet.</p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowCreateForm(false)}
                className="flex-1 py-2 px-4 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
              >
                Annuler
              </button>
              <button className="flex-1 py-2 px-4 bg-[#2EC6F3] hover:bg-[#1BA8D4] text-white rounded-lg transition">
                Créer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}