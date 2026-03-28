'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Target,
  ChevronRight,
  Star,
  TrendingUp,
  CheckCircle,
  Loader2,
} from 'lucide-react'

interface Competence {
  id: string
  nom: string
  description?: string
  niveau_avant?: number   // 0-5
  niveau_pendant?: number // 0-5
  niveau_apres?: number   // 0-5
}

interface CompetenceGridProps {
  formationId: string
  inscriptionId: string
  isCompleted: boolean
  competencesAcquises?: string[] // fallback depuis formation.competences_acquises
}

const NIVEAUX = [
  { value: 0, label: 'Non évalué', color: '#EEEEEE' },
  { value: 1, label: 'Débutant', color: '#FF2D78' },
  { value: 2, label: 'Notions', color: '#FF8C42' },
  { value: 3, label: 'Intermédiaire', color: '#FF5C00' },
  { value: 4, label: 'Avancé', color: '#10B981' },
  { value: 5, label: 'Expert', color: '#10B981' },
]

export default function CompetenceGrid({
  formationId,
  inscriptionId,
  isCompleted,
  competencesAcquises = [],
}: CompetenceGridProps) {
  const [competences, setCompetences] = useState<Competence[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [phase, setPhase] = useState<'avant' | 'apres'>('avant')

  useEffect(() => {
    loadCompetences()
  }, [formationId, inscriptionId])

  async function loadCompetences() {
    try {
      // Essayer de charger depuis la DB
      const res = await fetch(`/api/formation-content?formationId=${formationId}`)
      if (res.ok) {
        const data = await res.json()
        // Si des modules existent, extraire les compétences
        if (data.modules?.length > 0) {
          const comps = data.modules.map((m: any) => ({
            id: m.id,
            nom: m.titre,
            description: m.description,
            niveau_avant: 0,
            niveau_pendant: 0,
            niveau_apres: 0,
          }))
          setCompetences(comps)
          setLoading(false)
          return
        }
      }

      // Fallback : utiliser competences_acquises de la formation
      if (competencesAcquises.length > 0) {
        setCompetences(competencesAcquises.map((c, i) => ({
          id: `comp-${i}`,
          nom: c,
          niveau_avant: 0,
          niveau_pendant: 0,
          niveau_apres: 0,
        })))
      }
    } catch {
      // Fallback silencieux
      if (competencesAcquises.length > 0) {
        setCompetences(competencesAcquises.map((c, i) => ({
          id: `comp-${i}`,
          nom: c,
          niveau_avant: 0,
          niveau_pendant: 0,
          niveau_apres: 0,
        })))
      }
    } finally {
      setLoading(false)
    }
  }

  function updateNiveau(compId: string, value: number) {
    setCompetences(prev => prev.map(c => {
      if (c.id !== compId) return c
      return phase === 'avant'
        ? { ...c, niveau_avant: value }
        : { ...c, niveau_apres: value }
    }))
  }

  async function saveEvaluation() {
    setSaving(true)
    try {
      // TODO: connecter à une vraie API quand elle existera
      console.log('[CompetenceGrid] saveEvaluation (no-op)', { inscriptionId, phase, competences })
    } catch (err) {
      console.error('[CompetenceGrid] saveEvaluation error', err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: '#FF5C00' }} />
      </div>
    )
  }

  if (competences.length === 0) {
    return (
      <div className="text-center py-8" style={{ color: '#777777' }}>
        <Target size={32} className="mx-auto mb-3" style={{ color: '#999999' }} />
        <p className="text-sm">Aucune compétence définie pour cette formation</p>
      </div>
    )
  }

  const canEvaluateApres = isCompleted
  const showPhaseToggle = canEvaluateApres

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm" style={{ color: '#111111' }}>
          Grille de compétences
        </h3>

        {showPhaseToggle && (
          <div className="flex rounded-lg overflow-hidden" style={{ backgroundColor: '#F5F5F5' }}>
            <button
              onClick={() => setPhase('avant')}
              className="px-3 py-1.5 text-xs font-medium transition-colors"
              style={{
                backgroundColor: phase === 'avant' ? '#FF5C00' : 'transparent',
                color: phase === 'avant' ? '#FFFFFF' : '#777777',
              }}
            >
              Avant
            </button>
            <button
              onClick={() => setPhase('apres')}
              className="px-3 py-1.5 text-xs font-medium transition-colors"
              style={{
                backgroundColor: phase === 'apres' ? '#FF5C00' : 'transparent',
                color: phase === 'apres' ? '#FFFFFF' : '#777777',
              }}
            >
              Après
            </button>
          </div>
        )}
      </div>

      <p className="text-xs" style={{ color: '#777777' }}>
        {phase === 'avant'
          ? 'Évaluez votre niveau avant la formation (auto-évaluation)'
          : 'Évaluez votre niveau après la formation'
        }
      </p>

      {/* Grille */}
      <div className="space-y-3">
        {competences.map((comp, index) => {
          const currentValue = phase === 'avant' ? comp.niveau_avant : comp.niveau_apres
          const otherValue = phase === 'avant' ? comp.niveau_apres : comp.niveau_avant
          const progression = phase === 'apres' && comp.niveau_avant
            ? (comp.niveau_apres || 0) - (comp.niveau_avant || 0)
            : undefined

          return (
            <motion.div
              key={comp.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-4 rounded-xl"
              style={{ backgroundColor: '#FAFAFA', border: '1px solid #EEEEEE' }}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm" style={{ color: '#111111' }}>
                    {comp.nom}
                  </div>
                  {comp.description && (
                    <div className="text-xs mt-0.5 line-clamp-1" style={{ color: '#777777' }}>
                      {comp.description}
                    </div>
                  )}
                </div>
                {progression !== undefined && progression > 0 && (
                  <span className="flex items-center gap-1 text-xs font-semibold flex-shrink-0"
                    style={{ color: '#10B981' }}>
                    <TrendingUp size={12} />
                    +{progression}
                  </span>
                )}
              </div>

              {/* Niveaux */}
              <div className="flex items-center gap-1.5">
                {NIVEAUX.slice(1).map((niveau) => (
                  <button
                    key={niveau.value}
                    onClick={() => updateNiveau(comp.id, niveau.value)}
                    className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={{
                      backgroundColor: (currentValue || 0) >= niveau.value ? niveau.color : '#F5F5F5',
                      color: (currentValue || 0) >= niveau.value ? '#FFFFFF' : '#999999',
                    }}
                    title={niveau.label}
                  >
                    {niveau.value}
                  </button>
                ))}
              </div>
              <div className="flex justify-between mt-1 text-xs" style={{ color: '#999999' }}>
                <span>Débutant</span>
                <span>Expert</span>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Bouton sauvegarder */}
      <button
        onClick={saveEvaluation}
        disabled={saving}
        className="w-full py-3 rounded-xl font-semibold text-white text-sm transition-all hover:scale-[1.01] disabled:opacity-50"
        style={{ backgroundColor: '#FF5C00' }}
      >
        {saving ? 'Enregistrement...' : `Sauvegarder mon évaluation (${phase === 'avant' ? 'pré' : 'post'}-formation)`}
      </button>
    </div>
  )
}
