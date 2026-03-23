'use client'

import { motion } from 'framer-motion'
import { Check, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { WORKFLOW_STEPS, getNextAction } from './types'

interface FinancementPipelineBarProps {
  currentStep: number
  onStepClick: (step: number) => void
}

export function FinancementPipelineBar({ currentStep, onStepClick }: FinancementPipelineBarProps) {
  return (
    <div className="bg-surface border border-border rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-text">Pipeline de financement</h2>
        <div className="text-sm text-text-muted">
          Étape {Math.min(currentStep + 1, 12)}/12 — {Math.round(((currentStep + 1) / 12) * 100)}%
        </div>
      </div>

      {/* Desktop pipeline */}
      <div className="hidden md:flex items-center gap-2 mb-4">
        {WORKFLOW_STEPS.slice(0, 12).map((step, index) => {
          const isActive = index === currentStep
          const isCompleted = index < currentStep
          const isFuture = index > currentStep

          return (
            <motion.div
              key={step.id}
              className="flex-1 min-w-0"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div
                className={cn(
                  'relative cursor-pointer group',
                  'h-12 rounded-lg border-2 flex items-center justify-center text-xs font-medium transition-all',
                  isCompleted && 'bg-success-light border-success text-success',
                  isActive && 'bg-primary-50 border-primary text-text',
                  isFuture && 'bg-surface-hover border-border text-text-muted hover:bg-surface-active'
                )}
                onClick={() => onStepClick(index)}
              >
                <div className="flex items-center gap-1">
                  {isCompleted && <Check className="w-3 h-3" />}
                  {isActive && <Clock className="w-3 h-3" />}
                  <span className="truncate max-w-[80px]">{step.label}</span>
                </div>

                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-accent text-text-inverse text-xs rounded px-2 py-1 whitespace-nowrap">
                    {step.description}
                  </div>
                </div>
              </div>

              {/* Connector */}
              {index < 11 && (
                <div className={cn(
                  'h-0.5 w-2 bg-border absolute top-1/2 transform -translate-y-1/2',
                  index < currentStep && 'bg-success'
                )} />
              )}
            </motion.div>
          )
        })}
      </div>

      {/* Mobile pipeline */}
      <div className="md:hidden overflow-x-auto pb-2">
        <div className="flex gap-2 min-w-max">
          {WORKFLOW_STEPS.slice(Math.max(0, currentStep - 2), Math.min(12, currentStep + 3)).map((step, index) => {
            const actualIndex = Math.max(0, currentStep - 2) + index
            const isActive = actualIndex === currentStep
            const isCompleted = actualIndex < currentStep

            return (
              <div
                key={step.id}
                className={cn(
                  'flex-shrink-0 w-20 h-12 rounded-lg border-2 flex items-center justify-center text-xs font-medium',
                  isCompleted && 'bg-success-light border-success text-success',
                  isActive && 'bg-primary-50 border-primary text-text',
                  !isCompleted && !isActive && 'bg-surface-hover border-border text-text-muted'
                )}
              >
                <div className="flex items-center gap-1">
                  {isCompleted && <Check className="w-3 h-3" />}
                  {isActive && <Clock className="w-3 h-3" />}
                  <span className="truncate">{step.label}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Prochaine action */}
      <div className="bg-primary-50 border border-primary-200 rounded-lg p-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          <span className="text-sm font-medium text-text">Prochaine action:</span>
          <span className="text-sm text-text-secondary">{getNextAction(currentStep)}</span>
        </div>
      </div>
    </div>
  )
}