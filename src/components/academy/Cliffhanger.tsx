'use client'

import { ArrowRight, Lock, Award } from 'lucide-react'
import Link from 'next/link'

interface CliffhangerProps {
  type: 'question' | 'teaser' | 'error' | 'challenge' | 'reveal'
  content: string
  nextModuleSlug?: string
  nextModuleTitle?: string
}

export function Cliffhanger({ type, content, nextModuleSlug, nextModuleTitle }: CliffhangerProps) {
  const styles = {
    question: { bg: 'from-purple-500/10 to-indigo-500/10', border: 'border-[#FF2D78]/30', icon: '❓' },
    teaser: { bg: 'from-primary/10 to-blue-500/10', border: 'border-primary/30', icon: '🔮' },
    error: { bg: 'from-amber-500/10 to-orange-500/10', border: 'border-[#FF8C42]/30', icon: '🔍' },
    challenge: { bg: 'from-green-500/10 to-emerald-500/10', border: 'border-[#10B981]/30', icon: '🎯' },
    reveal: { bg: 'from-pink-500/10 to-rose-500/10', border: 'border-pink-200', icon: '✨' },
  }

  const s = styles[type]

  return (
    <div className={`bg-gradient-to-r ${s.bg} rounded-2xl p-6 border ${s.border} mt-8`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0 mt-0.5">{s.icon}</span>
        <div className="flex-1">
          <p className="text-[15px] text-accent font-medium leading-relaxed mb-4">{content}</p>

          {nextModuleSlug ? (
            <Link
              href={`/academy/${nextModuleSlug}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent text-white rounded-xl font-semibold text-sm hover:bg-accent/90 transition group"
            >
              <Award className="w-4 h-4 text-primary" />
              {nextModuleTitle || 'Module suivant'}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          ) : (
            <div className="flex items-center gap-2 text-sm text-[#999999]">
              <Lock className="w-4 h-4" /> Module suivant bientôt disponible
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
