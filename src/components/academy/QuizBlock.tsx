'use client'

import { useState, useCallback } from 'react'
import { CheckCircle, XCircle, ChevronRight, RotateCcw, Trophy, Sparkles } from 'lucide-react'

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
                  backgroundColor: ['#2EC6F3', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'][i % 6],
                  animationDelay: `${Math.random() * 0.5}s`,
                  animationDuration: `${1 + Math.random() * 2}s`,
                }}
              />
            ))}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
          <div className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center ${
            passed ? 'bg-green-100' : 'bg-orange-100'
          }`}>
            {passed ? (
              <Trophy className="w-10 h-10 text-green-500" />
            ) : (
              <RotateCcw className="w-10 h-10 text-orange-500" />
            )}
          </div>

          <h3 className="text-2xl font-bold text-[#082545] mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
            {passed ? 'Bravo !' : 'Presque !'}
          </h3>

          <div className="flex items-center justify-center gap-2 mb-4">
            <span className={`text-4xl font-bold ${passed ? 'text-green-500' : 'text-orange-500'}`}>
              {scorePercent}%
            </span>
            <span className="text-gray-500 text-lg">
              ({correctCount}/{questions.length} bonnes réponses)
            </span>
          </div>

          {/* Score bar */}
          <div className="w-full max-w-xs mx-auto bg-gray-100 rounded-full h-3 mb-6">
            <div
              className={`h-3 rounded-full transition-all duration-1000 ${passed ? 'bg-green-500' : 'bg-orange-500'}`}
              style={{ width: `${scorePercent}%` }}
            />
          </div>

          <p className="text-gray-600 mb-6">
            {passed
              ? `Excellent ! Vous maîtrisez le sujet. ${scorePercent === 100 ? '🏆 Score parfait !' : ''}`
              : `Il faut ${passScore}% pour valider. Réessayez, vous êtes proche !`
            }
          </p>

          <div className="flex gap-3 justify-center">
            {!passed && (
              <button
                onClick={handleRetry}
                className="flex items-center gap-2 px-6 py-3 bg-[#2EC6F3] text-white rounded-xl font-semibold hover:bg-[#1BA8D4] transition"
              >
                <RotateCcw className="w-4 h-4" /> Réessayer
              </button>
            )}
            {passed && (
              <button
                onClick={() => onComplete(correctCount, questions.length)}
                className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 transition"
              >
                <Sparkles className="w-4 h-4" /> Continuer
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Progress bar */}
      <div className="bg-gray-50 px-6 py-3 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-500">
          Question {currentIndex + 1} / {questions.length}
        </span>
        <div className="flex-1 max-w-[200px] mx-4 bg-gray-200 rounded-full h-2">
          <div
            className="bg-[#2EC6F3] h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
        <span className="text-sm font-medium text-[#2EC6F3]">
          {correctCount} ✓
        </span>
      </div>

      {/* Question */}
      <div className="p-6">
        <h3 className="text-lg font-semibold text-[#082545] mb-6 leading-relaxed">
          {current.question}
        </h3>

        {/* Options */}
        <div className="space-y-3">
          {current.options.map((option, i) => {
            let style = 'border-gray-200 bg-white hover:border-[#2EC6F3] hover:bg-[#2EC6F3]/5 cursor-pointer'

            if (isAnswered) {
              if (i === current.correct) {
                style = 'border-green-500 bg-green-50 ring-2 ring-green-200'
              } else if (i === selectedOption && i !== current.correct) {
                style = 'border-red-500 bg-red-50 ring-2 ring-red-200'
              } else {
                style = 'border-gray-100 bg-gray-50 opacity-50'
              }
            } else if (i === selectedOption) {
              style = 'border-[#2EC6F3] bg-[#2EC6F3]/10 ring-2 ring-[#2EC6F3]/20'
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
                    ? 'bg-green-500 text-white'
                    : isAnswered && i === selectedOption
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {isAnswered && i === current.correct ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : isAnswered && i === selectedOption ? (
                    <XCircle className="w-5 h-5" />
                  ) : (
                    String.fromCharCode(65 + i)
                  )}
                </span>
                <span className="text-[15px] text-[#082545]">{option}</span>
              </button>
            )
          })}
        </div>

        {/* Explication */}
        {isAnswered && current.explication && (
          <div className={`mt-4 p-4 rounded-xl text-sm leading-relaxed ${
            isCorrect ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-orange-50 text-orange-800 border border-orange-200'
          }`}>
            <p className="font-semibold mb-1">{isCorrect ? '✅ Correct !' : '❌ Pas tout à fait'}</p>
            <p>{current.explication}</p>
          </div>
        )}

        {/* Next button */}
        {isAnswered && (
          <button
            onClick={handleNext}
            className="mt-6 w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#2EC6F3] text-white rounded-xl font-semibold hover:bg-[#1BA8D4] transition"
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
