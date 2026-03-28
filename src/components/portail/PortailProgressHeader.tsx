'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  CheckCircle,
  Circle,
  FileSignature,
  GraduationCap,
  ClipboardCheck,
  Award,
  UserCheck,
  Sparkles,
} from 'lucide-react'
import type { PortailData } from '@/types'

interface PortailProgressHeaderProps {
  data: PortailData
}

interface StepDef {
  id: string
  label: string
  icon: React.ComponentType<any>
  completed: boolean
  active: boolean
  badge?: string
}

export default function PortailProgressHeader({ data }: PortailProgressHeaderProps) {
  const { inscription, formation, session, emargements } = data

  // Calcul des etapes
  const steps: StepDef[] = useMemo(() => {
    const isConventionSigned = inscription.convention_signee === true
    const isFormationStarted = ['EN_COURS', 'COMPLETEE'].includes(inscription.statut)
    const isFormationDone = inscription.statut === 'COMPLETEE'

    // Presence : compter les jours signes
    const joursPresence = [
      inscription.presence_jour1,
      inscription.presence_jour2,
      inscription.presence_jour3,
      inscription.presence_jour4,
      inscription.presence_jour5,
    ].filter(Boolean).length
    const joursTotal = formation?.duree_jours || 1
    const tauxPresence = inscription.taux_presence || Math.round((joursPresence / joursTotal) * 100)
    const hasFullPresence = tauxPresence >= 80

    const hasEvaluation = (inscription.note_satisfaction || 0) > 0
    const hasCertificat = inscription.certificat_genere === true

    return [
      {
        id: 'inscription',
        label: 'Inscription',
        icon: UserCheck,
        completed: true, // toujours fait si on est sur le portail
        active: false,
        badge: 'Inscrit(e)',
      },
      {
        id: 'convention',
        label: 'Convention',
        icon: FileSignature,
        completed: isConventionSigned,
        active: !isConventionSigned,
        badge: isConventionSigned ? 'Signée' : undefined,
      },
      {
        id: 'formation',
        label: 'Formation',
        icon: GraduationCap,
        completed: isFormationDone,
        active: isFormationStarted && !isFormationDone,
        badge: isFormationDone ? 'Terminée' : isFormationStarted ? `Jour ${joursPresence}/${joursTotal}` : undefined,
      },
      {
        id: 'evaluation',
        label: 'Évaluation',
        icon: ClipboardCheck,
        completed: hasEvaluation,
        active: isFormationDone && !hasEvaluation,
        badge: hasEvaluation ? `${inscription.note_satisfaction}/10` : undefined,
      },
      {
        id: 'certificat',
        label: 'Certificat',
        icon: Award,
        completed: hasCertificat,
        active: isFormationDone && hasEvaluation && !hasCertificat,
        badge: hasCertificat ? 'Obtenu' : undefined,
      },
    ]
  }, [inscription, formation, emargements])

  const completedSteps = steps.filter(s => s.completed).length
  const progressPercent = Math.round((completedSteps / steps.length) * 100)

  // Statut textuel
  const statusText = useMemo(() => {
    if (steps[4].completed) return 'Parcours terminé — Félicitations !'
    if (steps[3].completed) return 'Évaluation complétée — Certificat en cours'
    if (steps[2].completed) return 'Formation terminée — Évaluation à compléter'
    if (steps[2].active) return 'Formation en cours — Bonne continuation !'
    if (steps[1].completed) return 'Convention signée — Formation à venir'
    return 'Bienvenue — Signez votre convention pour commencer'
  }, [steps])

  return (
    <div className="mb-8 space-y-6">
      {/* Header avec progression circulaire */}
      <div className="rounded-2xl p-6 space-y-6" style={{ backgroundColor: '#FFFFFF', border: '1px solid #EEEEEE' }}>
        <div className="flex items-center gap-6">
          {/* Cercle de progression */}
          <div className="relative flex-shrink-0">
            <svg width="80" height="80" viewBox="0 0 80 80">
              {/* Cercle fond */}
              <circle cx="40" cy="40" r="34" fill="none" stroke="#F4F0EB" strokeWidth="6" />
              {/* Cercle progression */}
              <motion.circle
                cx="40" cy="40" r="34"
                fill="none"
                stroke="#FF5C00"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 34}`}
                strokeDashoffset={`${2 * Math.PI * 34 * (1 - progressPercent / 100)}`}
                transform="rotate(-90 40 40)"
                initial={{ strokeDashoffset: 2 * Math.PI * 34 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 34 * (1 - progressPercent / 100) }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold" style={{ color: '#111111' }}>{progressPercent}%</span>
            </div>
          </div>

          {/* Texte */}
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold" style={{ color: '#111111', fontFamily: 'var(--font-heading, "Bricolage Grotesque", serif)' }}>
              {formation?.nom || 'Ma Formation'}
            </h2>
            <p className="text-sm mt-1" style={{ color: '#777777' }}>
              {statusText}
            </p>
            <div className="flex items-center gap-3 mt-2 text-xs" style={{ color: '#999999' }}>
              <span>{completedSteps}/{steps.length} étapes</span>
              {session && (
                <>
                  <span>•</span>
                  <span>
                    {new Date(session.date_debut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                    {session.date_debut !== session.date_fin && ` — ${new Date(session.date_fin).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Badge global si parcours complet */}
          {completedSteps === steps.length && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold"
              style={{ backgroundColor: '#D1FAE5', color: '#10B981' }}
            >
              <Sparkles size={16} />
              Parcours complet
            </motion.div>
          )}
        </div>

        {/* Timeline horizontale */}
        <div className="flex items-center justify-between relative">
          {/* Ligne de fond */}
          <div className="absolute top-5 left-8 right-8 h-0.5" style={{ backgroundColor: '#F4F0EB' }} />
          {/* Ligne de progression */}
          <motion.div
            className="absolute top-5 left-8 h-0.5"
            style={{ backgroundColor: '#FF5C00' }}
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(0, ((completedSteps - 1) / (steps.length - 1)) * 100)}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />

          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <div key={step.id} className="relative flex flex-col items-center" style={{ zIndex: 1 }}>
                {/* Cercle */}
                <motion.div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: step.completed ? '#FF5C00' : step.active ? '#FFF0E5' : '#F4F0EB',
                    border: step.active ? '2px solid #FF5C00' : 'none',
                  }}
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  {step.completed ? (
                    <CheckCircle size={20} className="text-white" />
                  ) : (
                    <Icon size={18} style={{ color: step.active ? '#FF5C00' : '#999999' }} />
                  )}
                </motion.div>

                {/* Label */}
                <span className="mt-2 text-xs font-medium text-center" style={{
                  color: step.completed ? '#FF5C00' : step.active ? '#111111' : '#999999'
                }}>
                  {step.label}
                </span>

                {/* Badge */}
                {step.badge && (
                  <motion.span
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="mt-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                    style={{
                      backgroundColor: step.completed ? '#D1FAE5' : '#FFF0E5',
                      color: step.completed ? '#10B981' : '#FF5C00',
                    }}
                  >
                    {step.badge}
                  </motion.span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
