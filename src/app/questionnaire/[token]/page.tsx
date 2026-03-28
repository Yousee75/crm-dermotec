'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { CheckCircle, AlertCircle, Clock, Star, Send } from 'lucide-react'

interface Question {
  id: string
  texte: string
  type: 'note_10' | 'oui_non' | 'choix_multiple' | 'texte_libre' | 'echelle_5'
  options?: string[]
  obligatoire: boolean
  ordre: number
}

interface QuestionnaireData {
  id: string
  titre: string
  description: string
  type: string
  questions: Question[]
  lead: { prenom: string; nom: string } | null
  reponses_existantes: Record<string, unknown>
}

export default function QuestionnairePage() {
  const params = useParams()
  const token = params?.token as string

  const [data, setData] = useState<QuestionnaireData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reponses, setReponses] = useState<Record<string, string | number>>({})
  const [commentaire, setCommentaire] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState<number | null>(null)

  useEffect(() => {
    if (!token) return
    fetch(`/api/questionnaires/${token}`)
      .then(res => {
        if (res.status === 409) { setSubmitted(true); setLoading(false); return null }
        if (res.status === 410) { setError('Ce questionnaire a expiré.'); setLoading(false); return null }
        if (!res.ok) throw new Error('Questionnaire non trouvé')
        return res.json()
      })
      .then(d => { if (d) { setData(d); setReponses(d.reponses_existantes || {}) }; setLoading(false) })
      .catch(err => { setError(err.message); setLoading(false) })
  }, [token])

  const handleSubmit = async () => {
    if (!data) return
    const missing = data.questions.filter(q => q.obligatoire && !reponses[q.id])
    if (missing.length > 0) {
      setError(`Veuillez répondre à : ${missing.map(q => q.texte).join(', ')}`)
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch(`/api/questionnaires/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reponses, commentaire_libre: commentaire }),
      })
      const result = await res.json()
      if (!res.ok) { setError(result.error || 'Erreur'); setSubmitting(false); return }
      setScore(result.score)
      setSubmitted(true)
    } catch {
      setError('Erreur de connexion')
    }
    setSubmitting(false)
  }

  // --- Loading ---
  if (loading) return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  )

  // --- Déjà rempli ---
  if (submitted) return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-[#D1FAE5] rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-[#10B981]" />
        </div>
        <h1 className="text-2xl font-bold text-[#111111] mb-2">Merci !</h1>
        <p className="text-[#777777] mb-4">Vos réponses ont été enregistrées avec succès.</p>
        {score !== null && (
          <div className="bg-[#E0EBF5] rounded-xl p-4 mb-4">
            <p className="text-sm text-[#6B8CAE]">Score global</p>
            <p className="text-3xl font-bold text-[#6B8CAE]">{score}%</p>
          </div>
        )}
        <p className="text-sm text-[#999999]">Dermotec Advanced — Centre de Formation Esthétique</p>
      </div>
    </div>
  )

  // --- Erreur ---
  if (error && !data) return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        <AlertCircle className="w-12 h-12 text-[#FF2D78] mx-auto mb-4" />
        <h1 className="text-xl font-bold text-[#111111] mb-2">Questionnaire indisponible</h1>
        <p className="text-[#777777]">{error}</p>
      </div>
    </div>
  )

  if (!data) return null

  const answeredCount = data.questions.filter(q => reponses[q.id] !== undefined && reponses[q.id] !== '').length
  const progress = Math.round((answeredCount / data.questions.length) * 100)

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-lg font-bold text-[#111111]">{data.titre}</h1>
              {data.lead && <p className="text-sm text-[#777777]">{data.lead.prenom} {data.lead.nom}</p>}
            </div>
            <div className="text-right">
              <p className="text-xs text-[#999999]">{answeredCount}/{data.questions.length}</p>
              <p className="text-sm font-medium text-primary">{progress}%</p>
            </div>
          </div>
          <div className="h-1.5 bg-[#F5F5F5] rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      {/* Description */}
      {data.description && (
        <div className="max-w-2xl mx-auto px-4 pt-6">
          <p className="text-sm text-[#777777] bg-[#E0EBF5] rounded-xl p-4">{data.description}</p>
        </div>
      )}

      {/* Erreur validation */}
      {error && (
        <div className="max-w-2xl mx-auto px-4 pt-4">
          <div className="bg-[#FFE0EF] border border-[#FF2D78]/30 rounded-xl p-3 text-sm text-[#FF2D78]">{error}</div>
        </div>
      )}

      {/* Questions */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {data.questions.sort((a, b) => a.ordre - b.ordre).map((q, idx) => (
          <div key={q.id} className="bg-white rounded-xl shadow-sm border p-5">
            <div className="flex items-start gap-3 mb-4">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center">
                {idx + 1}
              </span>
              <div>
                <p className="font-medium text-[#111111]">{q.texte}</p>
                {q.obligatoire && <span className="text-xs text-[#FF2D78] mt-0.5">* Obligatoire</span>}
              </div>
            </div>

            {/* Note /10 */}
            {q.type === 'note_10' && (
              <div className="flex gap-1.5 flex-wrap">
                {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                  <button
                    key={n}
                    onClick={() => setReponses(prev => ({ ...prev, [q.id]: n }))}
                    className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                      reponses[q.id] === n
                        ? 'bg-primary text-white shadow-md scale-110'
                        : 'bg-[#F5F5F5] text-[#777777] hover:bg-[#EEEEEE]'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            )}

            {/* Échelle /5 (étoiles) */}
            {q.type === 'echelle_5' && (
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    onClick={() => setReponses(prev => ({ ...prev, [q.id]: n }))}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        n <= (reponses[q.id] as number || 0)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-[#999999]'
                      }`}
                    />
                  </button>
                ))}
                {reponses[q.id] && (
                  <span className="text-sm text-[#777777] self-center ms-2">{reponses[q.id]}/5</span>
                )}
              </div>
            )}

            {/* Oui/Non */}
            {q.type === 'oui_non' && (
              <div className="flex gap-3">
                {['Oui', 'Non'].map(opt => (
                  <button
                    key={opt}
                    onClick={() => setReponses(prev => ({ ...prev, [q.id]: opt }))}
                    className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      reponses[q.id] === opt
                        ? 'bg-primary text-white shadow-md'
                        : 'bg-[#F5F5F5] text-[#777777] hover:bg-[#EEEEEE]'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {/* Choix multiple */}
            {q.type === 'choix_multiple' && q.options && (
              <div className="space-y-2">
                {q.options.map(opt => (
                  <button
                    key={opt}
                    onClick={() => setReponses(prev => ({ ...prev, [q.id]: opt }))}
                    className={`w-full text-start px-4 py-3 rounded-lg text-sm transition-all border ${
                      reponses[q.id] === opt
                        ? 'bg-primary/5 border-primary text-primary font-medium'
                        : 'bg-white border-[#F0F0F0] text-[#3A3A3A] hover:border-[#F0F0F0]'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {/* Texte libre */}
            {q.type === 'texte_libre' && (
              <textarea
                value={(reponses[q.id] as string) || ''}
                onChange={e => setReponses(prev => ({ ...prev, [q.id]: e.target.value }))}
                placeholder="Votre réponse..."
                rows={3}
                className="w-full rounded-lg border border-[#F0F0F0] px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                style={{ fontSize: '16px' }}
              />
            )}
          </div>
        ))}

        {/* Commentaire libre */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <p className="font-medium text-[#111111] mb-3">Commentaire libre (optionnel)</p>
          <textarea
            value={commentaire}
            onChange={e => setCommentaire(e.target.value)}
            placeholder="Autre chose à nous dire ?"
            rows={3}
            className="w-full rounded-lg border border-[#F0F0F0] px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            style={{ fontSize: '16px' }}
          />
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-base"
          style={{ minHeight: '52px' }}
        >
          {submitting ? (
            <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
          ) : (
            <>
              <Send className="w-5 h-5" />
              Envoyer mes réponses
            </>
          )}
        </button>

        {/* Footer */}
        <p className="text-center text-xs text-[#999999] pb-8">
          Dermotec Advanced — Centre de Formation Esthétique Certifié Qualiopi<br />
          75 Bd Richard Lenoir, 75011 Paris
        </p>
      </div>
    </div>
  )
}
