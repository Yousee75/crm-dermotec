'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { cn } from '@/lib/utils'

/**
 * NPS Survey post-formation
 * URL: /nps/[sessionId]?lead=xxx
 *
 * Score 0-10 → segmentation :
 *   9-10 : Promoteur → redirect Google Review
 *   7-8  : Passif → merci
 *   0-6  : Détracteur → recueillir feedback
 */

export default function NPSPage() {
  const params = useParams<{ sessionId: string }>()
  const sessionId = params?.sessionId
  const [score, setScore] = useState<number | null>(null)
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async () => {
    if (score === null) return

    try {
      await fetch('/api/questionnaires', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, type: 'nps', score, commentaire: comment }),
      })
    } catch { /* silent — NPS non-bloquant */ }
    setSubmitted(true)

    // Promoteur → redirect vers Google Review après 2s
    if (score >= 9) {
      setTimeout(() => {
        window.open(
          'https://search.google.com/local/writereview?placeid=ChIJxxxxxxDermotec',
          '_blank'
        )
      }, 2000)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] px-4">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 rounded-2xl gradient-primary mx-auto flex items-center justify-center mb-6">
            <span className="text-3xl">
              {score !== null && score >= 9 ? '🎉' : score !== null && score >= 7 ? '👍' : '🙏'}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#082545] mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
            {score !== null && score >= 9 ? 'Merci beaucoup !' : score !== null && score >= 7 ? 'Merci pour votre retour' : 'Nous prenons note'}
          </h1>
          <p className="text-gray-500 text-sm">
            {score !== null && score >= 9
              ? 'Votre avis compte énormément. Vous allez être redirigé vers Google pour laisser un avis.'
              : 'Vos retours nous aident à améliorer nos formations.'
            }
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] px-4">
      <div className="max-w-lg w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-xl gradient-primary mx-auto flex items-center justify-center mb-4">
            <span className="text-xl font-bold text-white">D</span>
          </div>
          <h1 className="text-xl font-bold text-[#082545]" style={{ fontFamily: 'var(--font-heading)' }}>
            Comment s&apos;est passée votre formation ?
          </h1>
          <p className="text-sm text-gray-500 mt-1">Dermotec Advanced — Enquête satisfaction</p>
        </div>

        {/* Score selector */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6 mb-4">
          <p className="text-sm font-medium text-gray-700 mb-4 text-center">
            Recommanderiez-vous cette formation à un(e) collègue ?
          </p>

          <div className="flex justify-center gap-1.5">
            {Array.from({ length: 11 }, (_, i) => (
              <button
                key={i}
                onClick={() => setScore(i)}
                className={cn(
                  'w-10 h-10 rounded-lg text-sm font-semibold transition-all',
                  'hover:scale-110 active:scale-95',
                  score === i
                    ? i >= 9 ? 'bg-green-500 text-white shadow-md'
                    : i >= 7 ? 'bg-amber-500 text-white shadow-md'
                    : 'bg-red-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {i}
              </button>
            ))}
          </div>

          <div className="flex justify-between mt-2 text-[10px] text-gray-400 px-1">
            <span>Pas du tout</span>
            <span>Absolument</span>
          </div>
        </div>

        {/* Comment — only for detractors and passives */}
        {score !== null && score <= 8 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6 mb-4 animate-fadeIn">
            <p className="text-sm font-medium text-gray-700 mb-2">
              {score <= 6 ? 'Que pourrions-nous améliorer ?' : 'Un commentaire ? (optionnel)'}
            </p>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Votre retour nous aide à progresser..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none resize-none"
            />
          </div>
        )}

        {/* Submit */}
        {score !== null && (
          <button
            onClick={handleSubmit}
            className="w-full py-3 bg-primary hover:bg-[#1BA8D4] text-white rounded-xl font-medium transition animate-fadeIn"
          >
            Envoyer mon avis
          </button>
        )}

        <p className="text-center text-[10px] text-gray-400 mt-4">
          Dermotec Advanced — 75 Bd Richard Lenoir, Paris 11e
        </p>
      </div>
    </div>
  )
}
