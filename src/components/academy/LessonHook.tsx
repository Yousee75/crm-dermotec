'use client'

import { useState } from 'react'
import { Lightbulb, ChevronRight, Brain } from 'lucide-react'

interface LessonHookProps {
  type: 'curiosity_gap' | 'bold_claim' | 'story_opening' | 'pre_test'
  content: string
  preTestQuestion?: {
    question: string
    options: string[]
    correct: number
    reveal: string
  }
  onContinue: () => void
}

export function LessonHook({ type, content, preTestQuestion, onContinue }: LessonHookProps) {
  const [preTestAnswer, setPreTestAnswer] = useState<number | null>(null)

  if (type === 'pre_test' && preTestQuestion) {
    return (
      <div className="bg-gradient-to-br from-primary/5 to-[#082545]/5 rounded-2xl p-6 border border-primary/20">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-5 h-5 text-primary" />
          <span className="text-sm font-semibold text-primary uppercase tracking-wide">Testez votre intuition</span>
        </div>

        <p className="text-lg font-semibold text-accent mb-4">{preTestQuestion.question}</p>

        {preTestAnswer === null ? (
          <div className="space-y-2">
            {preTestQuestion.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => setPreTestAnswer(i)}
                className="w-full text-left p-3 rounded-xl bg-white border-2 border-gray-200 hover:border-primary transition text-sm"
              >
                {opt}
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            <div className={`p-4 rounded-xl text-sm ${
              preTestAnswer === preTestQuestion.correct
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-amber-50 border border-amber-200 text-amber-800'
            }`}>
              <p className="font-semibold mb-1">
                {preTestAnswer === preTestQuestion.correct ? '✅ Bien joué !' : '🤔 Pas tout à fait...'}
              </p>
              <p>{preTestQuestion.reveal}</p>
            </div>
            <button
              onClick={onContinue}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary-dark transition"
            >
              Découvrir la leçon <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    )
  }

  // Curiosity gap, bold claim, story opening
  const icons: Record<string, string> = {
    curiosity_gap: '🔍',
    bold_claim: '💡',
    story_opening: '📖',
  }

  return (
    <div className="bg-gradient-to-r from-[#082545] to-[#0F3460] rounded-2xl p-6 text-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-3xl" />
      <div className="relative">
        <span className="text-3xl mb-3 block">{icons[type]}</span>
        <p className="text-lg font-semibold leading-relaxed mb-4">{content}</p>
        <button
          onClick={onContinue}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary-dark transition"
        >
          <Lightbulb className="w-4 h-4" /> Découvrir la réponse
        </button>
      </div>
    </div>
  )
}
