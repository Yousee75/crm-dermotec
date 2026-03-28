'use client'

import { useState, useCallback } from 'react'
import { CheckCircle, XCircle, ChevronRight, RotateCcw, Trophy } from 'lucide-react'

interface QuizQuestion {
  question: string
  options: string[]
  correct: number
  explication?: string
}

interface QuizBlockProps {
  questions: QuizQuestion[]
  onComplete: (score: number, total: number) => void
  passScore?: number // % requis pour valider (défaut 70)
}

export function QuizBlock({ questions, onComplete, passScore = 70 }: QuizBlockProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [isAnswered, setIsAnswered] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  const current = questions[currentIndex]
  const isCorrect = selectedOption === current?.correct
  const scorePercent = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0
  const passed = scorePercent >= passScore

  const handleSelect = useCallback((index: number) => {
    if (isAnswered) return
    setSelectedOption(index)
    setIsAnswered(true)
    if (index === current.correct) {
      setCorrectCount(prev => prev + 1)
    }
  }, [isAnswered, current])

  const handleNext = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1)
      setSelectedOption(null)
      setIsAnswered(false)
    } else {
      setIsComplete(true)
      const finalScore = selectedOption === current.correct ? correctCount + 1 : correctCount
      const finalPercent = Math.round((finalScore / questions.length) * 100)
      if (finalPercent >= passScore) {
        setShowConfetti(true)
        setTimeout(() => setShowConfetti(false), 3000)
      }
      onComplete(finalScore, questions.length)
    }
  }, [currentIndex, questions.length, selectedOption, current, correctCount, passScore, onComplete])

  const handleRetry = useCallback(() => {
    setCurrentIndex(0)
    setSelectedOption(null)
    setIsAnswered(false)
    setCorrectCount(0)
    setIsComplete(false)
  }, [])

  if (isComplete) {
    return (
      <div className="relative">
        {/* Confetti effect */}
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {Array.from({ length: 40 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 rounded-full animate-confetti"
                style={{
                  left: `${Math.random() * 100}%`,
                  backgroundColor: ['var(--color-primary)', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'][i % 6],
                  animationDelay: `${Math.random() * 0.5}s`,
                  animationDuration: `${1 + Math.random() * 2}s`,
                }}
              />
            ))}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-[#F0F0F0] p-8 text-center">
          <div className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center ${
            passed ? 'bg-[#D1FAE5]' : 'bg-orange-100'
          }`}>
            {passed ? (
              <Trophy className="w-10 h-10 text-[#10B981]" />
            ) : (
              <RotateCcw className="w-10 h-10 text-orange-500" />
            )}
          </div>

          <h3 className="text-2xl font-bold text-accent mb-2">
            {passed ? 'Bravo !' : 'Presque !'}
          </h3>

          <div className="flex items-center justify-center gap-2 mb-4">
            <span className={`text-4xl font-bold ${passed ? 'text-[#10B981]' : 'text-orange-500'}`}>
              {scorePercent}%
            </span>
            <span className="text-[#777777] text-lg">
              ({correctCount}/{questions.length} bonnes réponses)
            </span>
          </div>

          {/* Score bar */}
          <div className="w-full max-w-xs mx-auto bg-[#F5F5F5] rounded-full h-3 mb-6">
            <div
              className={`h-3 rounded-full transition-all duration-1000 ${passed ? 'bg-[#10B981]' : 'bg-orange-500'}`}
              style={{ width: `${scorePercent}%` }}
            />
          </div>

          <p className="text-[#777777] mb-6">
            {passed
              ? `Excellent ! Vous maîtrisez le sujet. ${scorePercent === 100 ? '🏆 Score parfait !' : ''}`
              : `Il faut ${passScore}% pour valider. Réessayez, vous êtes proche !`
            }
          </p>

          <div className="flex gap-3 justify-center">
            {!passed && (
              <button
                onClick={handleRetry}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition"
              >
                <RotateCcw className="w-4 h-4" /> Réessayer
              </button>
            )}
            {passed && (
              <button
                onClick={() => onComplete(correctCount, questions.length)}
                className="flex items-center gap-2 px-6 py-3 bg-[#10B981] text-white rounded-xl font-semibold hover:bg-[#10B981] transition"
              >
                <ChevronRight className="w-4 h-4" /> Continuer
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-[#F0F0F0] overflow-hidden">
      {/* Progress bar */}
      <div className="bg-[#FAFAFA] px-6 py-3 flex items-center justify-between">
        <span className="text-sm font-medium text-[#777777]">
          Question {currentIndex + 1} / {questions.length}
        </span>
        <div className="flex-1 max-w-[200px] mx-4 bg-[#EEEEEE] rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
        <span className="text-sm font-medium text-primary">
          {correctCount} ✓
        </span>
      </div>

      {/* Question */}
      <div className="p-6">
        <h3 className="text-lg font-semibold text-accent mb-6 leading-relaxed">
          {current.question}
        </h3>

        {/* Options */}
        <div className="space-y-3">
          {current.options.map((option, i) => {
            let style = 'border-[#F0F0F0] bg-white hover:border-primary hover:bg-primary/5 cursor-pointer'

            if (isAnswered) {
              if (i === current.correct) {
                style = 'border-[#10B981] bg-[#ECFDF5] ring-2 ring-green-200'
              } else if (i === selectedOption && i !== current.correct) {
                style = 'border-red-500 bg-[#FFE0EF] ring-2 ring-red-200'
              } else {
                style = 'border-[#F0F0F0] bg-[#FAFAFA] opacity-50'
              }
            } else if (i === selectedOption) {
              style = 'border-primary bg-primary/10 ring-2 ring-primary/20'
            }

            return (
              <button
                key={i}
                onClick={() => handleSelect(i)}
                disabled={isAnswered}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-center gap-3 min-h-[56px] ${style}`}
              >
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                  isAnswered && i === current.correct
                    ? 'bg-[#10B981] text-white'
                    : isAnswered && i === selectedOption
                    ? 'bg-[#FF2D78] text-white'
                    : 'bg-[#F5F5F5] text-[#777777]'
                }`}>
                  {isAnswered && i === current.correct ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : isAnswered && i === selectedOption ? (
                    <XCircle className="w-5 h-5" />
                  ) : (
                    String.fromCharCode(65 + i)
                  )}
                </span>
                <span className="text-[15px] text-accent">{option}</span>
              </button>
            )
          })}
        </div>

        {/* Explication */}
        {isAnswered && current.explication && (
          <div className={`mt-4 p-4 rounded-xl text-sm leading-relaxed ${
            isCorrect ? 'bg-[#ECFDF5] text-[#10B981] border border-[#10B981]/30' : 'bg-orange-50 text-orange-800 border border-orange-200'
          }`}>
            <p className="font-semibold mb-1">{isCorrect ? '✅ Correct !' : '❌ Pas tout à fait'}</p>
            <p>{current.explication}</p>
          </div>
        )}

        {/* Next button */}
        {isAnswered && (
          <button
            onClick={handleNext}
            className="mt-6 w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition"
          >
            {currentIndex < questions.length - 1 ? (
              <>Question suivante <ChevronRight className="w-4 h-4" /></>
            ) : (
              <>Voir mes résultats <Trophy className="w-4 h-4" /></>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
