'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase-client'
import { Award, AlertTriangle, CheckCircle, Clock, Plus } from 'lucide-react'

export default function QualitePage() {
  const supabase = createClient()

  const { data: items } = useQuery({
    queryKey: ['qualite'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('qualite')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })

  const ouvertes = items?.filter(i => i.statut === 'OUVERTE').length || 0
  const enCours = items?.filter(i => i.statut === 'EN_COURS').length || 0
  const resolues = items?.filter(i => i.statut === 'RESOLUE' || i.statut === 'CLOTUREE').length || 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#082545]" style={{ fontFamily: 'var(--font-heading)' }}>
            Qualité — Qualiopi
          </h1>
          <p className="text-sm text-gray-500">Suivi des réclamations, actions correctives et amélioration continue</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#2EC6F3] text-white rounded-xl text-sm font-medium">
          <Plus className="w-4 h-4" /> Nouvelle entrée
        </button>
      </div>

      {/* KPIs Qualiopi */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border p-5 flex items-center gap-4">
          <AlertTriangle className="w-8 h-8 text-red-500" />
          <div>
            <p className="text-xs text-gray-500">Ouvertes</p>
            <p className="text-2xl font-bold text-red-500">{ouvertes}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-5 flex items-center gap-4">
          <Clock className="w-8 h-8 text-orange-500" />
          <div>
            <p className="text-xs text-gray-500">En cours</p>
            <p className="text-2xl font-bold text-orange-500">{enCours}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-5 flex items-center gap-4">
          <CheckCircle className="w-8 h-8 text-green-500" />
          <div>
            <p className="text-xs text-gray-500">Résolues</p>
            <p className="text-2xl font-bold text-green-500">{resolues}</p>
          </div>
        </div>
      </div>

      {/* 7 critères Qualiopi */}
      <div className="bg-white rounded-xl border p-6">
        <h3 className="font-semibold text-[#082545] mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-[#2EC6F3]" />
          7 critères Qualiopi
        </h3>
        <div className="space-y-3">
          {[
            { num: 1, titre: 'Information du public', desc: 'Résultats, taux satisfaction, taux réussite' },
            { num: 2, titre: 'Conception des prestations', desc: 'Objectifs, programme, prérequis' },
            { num: 3, titre: 'Adaptation aux bénéficiaires', desc: 'Positionnement, parcours personnalisé, handicap' },
            { num: 4, titre: 'Moyens pédagogiques', desc: 'Qualification formateur, matériel, environnement' },
            { num: 5, titre: 'Qualification des personnels', desc: 'CV, formations continues, certifications' },
            { num: 6, titre: 'Environnement professionnel', desc: 'Veille sectorielle, réseau, partenariats' },
            { num: 7, titre: 'Amélioration continue', desc: 'Réclamations, actions correctives, satisfaction' },
          ].map((c) => (
            <div key={c.num} className="flex items-center gap-4 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition">
              <div className="w-8 h-8 rounded-full bg-[#2EC6F3]/10 text-[#2EC6F3] flex items-center justify-center text-sm font-bold">
                {c.num}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700">{c.titre}</p>
                <p className="text-xs text-gray-400">{c.desc}</p>
              </div>
              <span className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded-full">OK</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
