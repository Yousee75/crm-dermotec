import { useState, useCallback } from 'react'
import type { CompetitorAnalysis } from '@/lib/competitor-analyzer'

export function useCompetitorAnalysis() {
  const [data, setData] = useState<CompetitorAnalysis | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const analyze = useCallback(async (params: {
    siret?: string
    nom?: string
    ville?: string
    radiusM?: number
  }) => {
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/competitors/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      })

      const result = await res.json()

      if (!res.ok) {
        setError(result.error || 'Erreur d\'analyse')
        return
      }

      setData(result)
    } catch {
      setError('Erreur réseau')
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { data, isLoading, error, analyze }
}
