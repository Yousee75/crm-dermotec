'use client'

import { ArrowRight, Lock, Sparkles } from 'lucide-react'
import Link from 'next/link'

interface CliffhangerProps {
  type: 'question' | 'teaser' | 'error' | 'challenge' | 'reveal'
  content: string
  nextModuleSlug?: string
  nextModuleTitle?: string
}

export function Cliffhanger({ type, content, nextModuleSlug, nextModuleTitle }: CliffhangerProps) {
  const styles = {
    question: { bg: 'from-purple-500/10 to-indigo-500/10', border: 'border-purple-200', icon: '❓' },
    teaser: { bg: 'from-[#2EC6F3]/10 to-blue-500/10', border: 'border-[#2EC6F3]/30', icon: '🔮' },
    error: { bg: 'from-amber-500/10 to-orange-500/10', border: 'border-amber-200', icon: '🔍' },
    challenge: { bg: 'from-green-500/10 to-emerald-500/10', border: 'border-green-200', icon: '🎯' },
    reveal: { bg: 'from-pink-500/10 to-rose-500/10', border: 'border-pink-200', icon: '✨' },
  }

  const s = styles[type]

  return (
    <div className={`bg-gradient-to-r ${s.bg} rounded-2xl p-6 border ${s.border} mt-8`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0 mt-0.5">{s.icon}</span>
        <div className="flex-1">
          <p className="text-[15px] text-[#082545] font-medium leading-relaxed mb-4">{content}</p>

          {nextModuleSlug ? (
            <Link
              href={`/academy/${nextModuleSlug}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#082545] text-white rounded-xl font-semibold text-sm hover:bg-[#082545]/90 transition group"
            >
              <Sparkles className="w-4 h-4 text-[#2EC6F3]" />
              {nextModuleTitle || 'Module suivant'}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          ) : (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Lock className="w-4 h-4" /> Module suivant bientôt disponible
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
