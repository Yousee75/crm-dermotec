'use client'

import { useState, useEffect } from 'react'
import { Zap, Clock, ChevronRight, Trophy, Flame } from 'lucide-react'

interface DailyChallengeProps {
  question: string
  options: string[]
  correct: number
  explication: string
  xpReward?: number
  streakDays?: number
  onComplete?: (correct: boolean) => void
}

export function DailyChallenge({
  question,
  options,
  correct,
  explication,
  xpReward = 25,
  streakDays = 0,
  onComplete,
}: DailyChallengeProps) {
  const [selected, setSelected] = useState<number | null>(null)
  const [answered, setAnswered] = useState(false)
  const [timeLeft, setTimeLeft] = useState('')
  const isCorrect = selected === correct

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const end = new Date(now)
      end.setHours(23, 59, 59, 999)
      const diff = end.getTime() - now.getTime()
      const hours = Math.floor(diff / 3600000)
      const mins = Math.floor((diff % 3600000) / 60000)
      setTimeLeft(`${hours}h${mins.toString().padStart(2, '0')}`)
    }
    updateTime()
    const timer = setInterval(updateTime, 60000)
    return () => clearInterval(timer)
  }, [])

  const handleAnswer = (index: number) => {
    if (answered) return
    setSelected(index)
    setAnswered(true)
    onComplete?.(index === correct)
  }

  return (
    <div className="bg-gradient-to-r from-accent to-[#0F3460] rounded-2xl p-6 text-white relative overflow-hidden">
      {/* Glow effect */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />

      {/* Header */}
      <div className="flex items-center justify-between mb-4 relative">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-sm">Challenge du jour</h3>
            <div className="flex items-center gap-2 text-xs text-white/50">
              <Clock className="w-3 h-3" /> Expire dans {timeLeft}
              {streakDays > 0 && (
                <span className="flex items-center gap-1 text-orange-400">
                  <Flame className="w-3 h-3" /> {streakDays}j
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 bg-yellow-500/20 px-3 py-1 rounded-full">
          <Trophy className="w-3 h-3 text-yellow-400" />
          <span className="text-xs font-bold text-yellow-400">+{xpReward} XP</span>
        </div>
      </div>

      {/* Question */}
      <p className="text-[15px] font-medium leading-relaxed mb-4">{question}</p>

      {/* Options */}
      {!answered ? (
        <div className="space-y-2">
          {options.map((opt, i) => (
            <button
              key={i}
              onClick={() => handleAnswer(i)}
              className="w-full text-left p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all text-sm font-medium border border-white/10 hover:border-white/30"
            >
              <span className="text-white/50 mr-2">{String.fromCharCode(65 + i)}.</span>
              {opt}
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {/* Result */}
          <div className={`p-4 rounded-xl ${isCorrect ? 'bg-green-500/20 border border-green-500/30' : 'bg-red-500/20 border border-red-500/30'}`}>
            <p className="font-bold text-sm mb-1">
              {isCorrect ? '✅ Correct !' : `❌ La bonne réponse était : ${options[correct]}`}
            </p>
            <p className="text-xs text-white/70 leading-relaxed">{explication}</p>
          </div>

          {isCorrect && (
            <div className="flex items-center justify-center gap-2 py-2">
              <span className="text-yellow-400 font-bold">+{streakDays > 0 ? xpReward * 2 : xpReward} XP</span>
              {streakDays > 0 && <span className="text-xs text-white/50">(x2 streak bonus !)</span>}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
