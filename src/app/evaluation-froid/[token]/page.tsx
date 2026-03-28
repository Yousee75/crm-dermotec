'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  CheckCircle,
  Loader2,
  Star,
  TrendingUp,
  Target,
  MessageCircle,
  ThumbsUp,
  AlertCircle,
} from 'lucide-react'
import { createClient } from '@/lib/infra/supabase-client'

interface EvalFroidData {
  inscription_id: string
  prenom: string
  formation_nom: string
  date_fin: string
}

const QUESTIONS_FROID = [
  {
    id: 'utilisation',
    question: 'Utilisez-vous les compétences acquises en formation ?',
    type: 'radio' as const,
    options: ['Oui, quotidiennement', 'Oui, régulièrement', 'Occasionnellement', 'Pas encore', 'Non'],
  },
  {
    id: 'impact_pro',
    question: 'Quel impact la formation a-t-elle eu sur votre activité professionnelle ?',
    type: 'radio' as const,
    options: [
      'Fort impact positif — revenus en hausse',
      'Impact positif — nouvelle clientèle',
      'Impact modéré — amélioration de ma pratique',
      'Peu d\'impact pour le moment',
      'Aucun impact',
    ],
  },
  {
    id: 'confiance',
    question: 'Votre niveau de confiance pour pratiquer a-t-il évolué ?',
    type: 'scale' as const,
    options: [],
  },
  {
    id: 'recommandation',
    question: 'Recommanderiez-vous cette formation à une collègue ?',
    type: 'radio' as const,
    options: ['Oui, absolument', 'Probablement oui', 'Peut-être', 'Probablement non', 'Non'],
  },
  {
    id: 'besoin_complementaire',
    question: 'Avez-vous identifié un besoin de formation complémentaire ?',
    type: 'radio' as const,
    options: [
      'Oui — perfectionnement dans le même domaine',
      'Oui — dans un domaine connexe',
      'Non, la formation était suffisante',
      'Je ne sais pas encore',
    ],
  },
  {
    id: 'commentaire',
    question: 'Avec le recul, un commentaire sur votre expérience ? (optionnel)',
    type: 'text' as const,
    options: [],
  },
]

export default function EvaluationFroidPage() {
  const params = useParams()
  const token = params?.token as string

  const [data, setData] = useState<EvalFroidData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [responses, setResponses] = useState<Record<string, string | number>>({})
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    async function load() {
      if (!token || token.length < 10) {
        setError('Lien invalide')
        setLoading(false)
        return
      }

      const { data: inscription } = await supabase
        .from('inscriptions')
        .select(`
          id, statut,
          lead:leads(prenom),
          session:sessions(
            date_fin,
            formation:formations(nom)
          )
        `)
        .eq('portail_token', token)
        .single()

      if (!inscription) {
        setError('Évaluation non trouvée')
        setLoading(false)
        return
      }

      if (inscription.statut !== 'COMPLETEE') {
        setError('Cette évaluation n\'est pas encore disponible')
        setLoading(false)
        return
      }

      setData({
        inscription_id: inscription.id,
        prenom: (inscription.lead as any)?.prenom || '',
        formation_nom: (inscription.session as any)?.formation?.nom || '',
        date_fin: (inscription.session as any)?.date_fin || '',
      })
      setLoading(false)
    }
    load()
  }, [token])

  async function handleSubmit() {
    if (!data) return
    setSubmitting(true)

    try {
      // Sauvegarder dans activites comme trace Qualiopi
      await supabase.from('activites').insert({
        type: 'evaluation_froid',
        description: `Évaluation à froid J+30 — ${data.formation_nom}`,
        metadata: { responses, inscription_id: data.inscription_id },
      }).catch(() => {})

      setSubmitted(true)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FAF8F5' }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#FF5C00' }} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FAF8F5' }}>
        <div className="text-center max-w-md px-6">
          <AlertCircle size={40} className="mx-auto mb-4" style={{ color: '#FF2D78' }} />
          <h1 className="text-xl font-bold mb-2" style={{ color: '#111111' }}>{error}</h1>
          <p className="text-sm" style={{ color: '#777777' }}>Contactez notre centre de formation si besoin.</p>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FAF8F5' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md px-6"
        >
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: '#D1FAE5' }}>
            <CheckCircle size={40} style={{ color: '#10B981' }} />
          </div>
          <h1 className="text-2xl font-bold mb-3" style={{ color: '#111111', fontFamily: 'var(--font-heading)' }}>
            Merci {data?.prenom} !
          </h1>
          <p className="text-sm mb-6" style={{ color: '#777777' }}>
            Votre retour nous aide à améliorer continuellement nos formations.
            C'est une obligation Qualiopi à laquelle nous tenons.
          </p>
          <div className="p-4 rounded-xl" style={{ backgroundColor: '#FFF0E5', border: '1px solid #FFCAAA' }}>
            <p className="text-sm font-medium" style={{ color: '#E65200' }}>
              Envie d'aller plus loin ? Découvrez nos formations complémentaires sur notre catalogue.
            </p>
            <a href="/formations" className="inline-block mt-3 px-4 py-2 rounded-xl text-white text-sm font-semibold"
              style={{ backgroundColor: '#FF5C00' }}>
              Voir le catalogue
            </a>
          </div>
        </motion.div>
      </div>
    )
  }

  const daysSinceEnd = data ? Math.floor((Date.now() - new Date(data.date_fin).getTime()) / 86400000) : 0

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAF8F5' }}>
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold mb-4"
            style={{ backgroundColor: '#FFF0E5', color: '#FF5C00' }}>
            <Target size={14} />
            Évaluation à froid — J+{daysSinceEnd}
          </div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: '#111111', fontFamily: 'var(--font-heading)' }}>
            Bonjour {data?.prenom}, comment ça va depuis ?
          </h1>
          <p className="text-sm" style={{ color: '#777777' }}>
            Vous avez terminé « {data?.formation_nom} » il y a {daysSinceEnd} jours.
            Quelques questions pour mesurer l'impact de la formation.
          </p>
        </div>

        {/* Questions */}
        <div className="space-y-6">
          {QUESTIONS_FROID.map((q, index) => (
            <motion.div
              key={q.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className="p-5 rounded-2xl"
              style={{ backgroundColor: '#FFFFFF', border: '1px solid #EEEEEE' }}
            >
              <label className="block text-sm font-medium mb-3" style={{ color: '#111111' }}>
                {index + 1}. {q.question}
              </label>

              {q.type === 'radio' && (
                <div className="space-y-2">
                  {q.options.map((option) => (
                    <label
                      key={option}
                      className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors"
                      style={{
                        backgroundColor: responses[q.id] === option ? '#FFF0E5' : '#FAF8F5',
                        border: `1px solid ${responses[q.id] === option ? '#FF5C00' : '#EEEEEE'}`,
                      }}
                    >
                      <input
                        type="radio"
                        name={q.id}
                        value={option}
                        checked={responses[q.id] === option}
                        onChange={(e) => setResponses(prev => ({ ...prev, [q.id]: e.target.value }))}
                        className="h-4 w-4"
                        style={{ accentColor: '#FF5C00' }}
                      />
                      <span className="text-sm" style={{ color: '#111111' }}>{option}</span>
                    </label>
                  ))}
                </div>
              )}

              {q.type === 'scale' && (
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setResponses(prev => ({ ...prev, [q.id]: n }))}
                      className="w-9 h-9 rounded-lg text-sm font-semibold transition-all"
                      style={{
                        backgroundColor: (responses[q.id] as number) >= n ? '#FF5C00' : '#F4F0EB',
                        color: (responses[q.id] as number) >= n ? '#FFFFFF' : '#777777',
                      }}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              )}

              {q.type === 'text' && (
                <textarea
                  value={(responses[q.id] as string) || ''}
                  onChange={(e) => setResponses(prev => ({ ...prev, [q.id]: e.target.value }))}
                  placeholder="Votre retour d'expérience..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: '#FAF8F5',
                    border: '1px solid #EEEEEE',
                    color: '#111111',
                    // @ts-expect-error -- CSS custom property
                    '--tw-ring-color': '#FF5C00',
                  }}
                />
              )}
            </motion.div>
          ))}
        </div>

        {/* Submit */}
        <div className="mt-8 text-center">
          <button
            onClick={handleSubmit}
            disabled={submitting || !responses.utilisation}
            className="px-8 py-4 rounded-xl font-bold text-white text-lg transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#FF5C00' }}
          >
            {submitting ? 'Envoi...' : 'Envoyer mon évaluation'}
          </button>
          <p className="mt-3 text-xs" style={{ color: '#999999' }}>
            Dermotec Advanced — Centre certifié Qualiopi
          </p>
        </div>
      </div>
    </div>
  )
}
