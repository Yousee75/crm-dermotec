'use client'

import { useState } from 'react'
import { useOnboardingProgress, useCompleteOnboardingStep } from '@/hooks/use-onboarding'
import { getStepsByNiveau, type OnboardingStep } from '@/lib/playbook'
import {
  GraduationCap, CheckCircle, Circle, ChevronDown, ChevronUp,
  Play, Lock, Trophy, X
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  userId?: string
  collapsed?: boolean
}

export function OnboardingChecklist({ userId, collapsed }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeNiveau, setActiveNiveau] = useState<'basique' | 'intermediaire' | 'expert'>('basique')
  const { data: progress } = useOnboardingProgress(userId)
  const completeMutation = useCompleteOnboardingStep()

  if (!userId || !progress) return null

  // Ne pas afficher si tout est complété
  if (progress.global.percent >= 100) return null

  const steps = getStepsByNiveau(activeNiveau)
  const niveauProgress = progress[activeNiveau]

  const niveaux = [
    { key: 'basique' as const, label: 'Basique', emoji: '1', unlocked: true },
    { key: 'intermediaire' as const, label: 'Intermediaire', emoji: '2', unlocked: progress.basique.percent >= 80 },
    { key: 'expert' as const, label: 'Expert', emoji: '3', unlocked: progress.intermediaire.percent >= 80 },
  ]

  if (collapsed) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="relative flex items-center justify-center w-full p-2 rounded-lg text-slate-400 hover:bg-white/5 hover:text-slate-300 transition"
        title={`Progression : ${progress.global.percent}%`}
      >
        <GraduationCap className="w-4 h-4" />
        {progress.global.percent < 100 && (
          <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-primary animate-pulse" />
        )}
      </button>
    )
  }

  return (
    <>
      {/* Bouton dans la sidebar */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 w-full px-3 py-2 mx-2 rounded-lg text-[13px] text-slate-400 hover:bg-white/5 hover:text-slate-200 transition"
      >
        <GraduationCap className="w-[18px] h-[18px] shrink-0 text-primary" />
        <div className="flex-1 text-left">
          <span>Formation</span>
          <div className="w-full bg-white/10 rounded-full h-1 mt-1">
            <div
              className="bg-primary h-1 rounded-full transition-all duration-500"
              style={{ width: `${progress.global.percent}%` }}
            />
          </div>
        </div>
        <span className="text-[10px] text-slate-500">{progress.global.percent}%</span>
      </button>

      {/* Panel slide-over */}
      {isOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]" onClick={() => setIsOpen(false)} />
          <div className="fixed right-0 top-0 bottom-0 w-[380px] bg-white z-[61] shadow-2xl flex flex-col animate-slideInRight">
            {/* Header */}
            <div className="bg-accent px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-white font-semibold text-sm">
                    Formation CRM
                  </h2>
                  <p className="text-white/50 text-xs">{progress.global.completed}/{progress.global.total} étapes</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Progress bar globale */}
            <div className="px-5 py-3 border-b border-gray-100">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-gray-600">Progression globale</span>
                <span className="text-xs font-bold text-primary">{progress.global.percent}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-primary to-[#1DA1D4] h-2 rounded-full transition-all duration-700"
                  style={{ width: `${progress.global.percent}%` }}
                />
              </div>
            </div>

            {/* Tabs niveaux */}
            <div className="flex gap-1 px-5 py-3 border-b border-gray-100">
              {niveaux.map(n => (
                <button
                  key={n.key}
                  onClick={() => n.unlocked && setActiveNiveau(n.key)}
                  disabled={!n.unlocked}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition',
                    activeNiveau === n.key
                      ? 'bg-accent text-white'
                      : n.unlocked
                        ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        : 'bg-gray-50 text-gray-300 cursor-not-allowed'
                  )}
                >
                  {!n.unlocked && <Lock className="w-3 h-3" />}
                  <span>{n.emoji}</span>
                  {n.label}
                </button>
              ))}
            </div>

            {/* Steps */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
              {steps.map((step, i) => {
                const isCompleted = progress.completedIds.includes(step.id)
                const canComplete = !isCompleted

                return (
                  <div
                    key={step.id}
                    className={cn(
                      'flex items-start gap-3 px-3 py-3 rounded-xl transition',
                      isCompleted ? 'bg-green-50/50' : 'bg-gray-50 hover:bg-gray-100/50'
                    )}
                  >
                    <button
                      onClick={() => canComplete && userId && completeMutation.mutate({ userId, stepId: step.id })}
                      disabled={!canComplete}
                      className="mt-0.5 shrink-0"
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <Circle className="w-5 h-5 text-gray-300 hover:text-primary transition" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        'text-sm font-medium',
                        isCompleted ? 'text-gray-400 line-through' : 'text-gray-700'
                      )}>
                        {step.titre}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{step.description}</p>
                    </div>

                    {step.tour_steps && !isCompleted && (
                      <button className="shrink-0 p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition">
                        <Play className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Footer */}
            {niveauProgress.percent >= 100 && (
              <div className="px-5 py-4 border-t border-gray-100 bg-green-50">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-[#F59E0B]" />
                  <div>
                    <p className="text-sm font-semibold text-green-700">Niveau {activeNiveau} complété !</p>
                    <p className="text-xs text-green-600">
                      {activeNiveau !== 'expert' ? 'Passez au niveau suivant →' : 'Vous êtes expert Dermotec CRM !'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </>
  )
}
