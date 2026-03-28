'use client'

export const dynamic = 'force-dynamic'

import { use, useEffect, useState } from 'react'
import { RapportViewer } from '@/components/rapport/RapportViewer'
import type { ProspectData, RapportSatorea, RapportStatus } from '@/lib/rapport/types'
import { Loader2, RefreshCw, AlertCircle } from 'lucide-react'

// ══════════════════════════════════════════════════════════════
// PAGE RAPPORT SATOREA — Briefing Premium 5 Slides
// Route: /lead/[id]/rapport
// Sidebar dark + Scroll-snap + Animations
// ══════════════════════════════════════════════════════════════

export default function RapportSatoraPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [status, setStatus] = useState<RapportStatus>('idle')
  const [prospect, setProspect] = useState<ProspectData | null>(null)
  const [rapport, setRapport] = useState<RapportSatorea | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Charger le rapport (cache d'abord, puis générer si absent)
  useEffect(() => {
    loadRapport()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function loadRapport() {
    setStatus('generating')
    setError(null)

    try {
      // 1. Vérifier le cache
      const cacheRes = await fetch(`/api/rapport/generate?leadId=${id}`)
      const cacheData = await cacheRes.json()

      if (cacheData.cached && cacheData.rapport) {
        setRapport(cacheData.rapport)
        // On a besoin du prospect aussi — générer quand même pour l'avoir
        const genRes = await fetch('/api/rapport/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ leadId: id }),
        })
        const genData = await genRes.json()
        if (genData.prospect) setProspect(genData.prospect)
        if (genData.rapport) setRapport(genData.rapport)
        setStatus('ready')
        return
      }

      // 2. Pas de cache — générer
      const res = await fetch('/api/rapport/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: id }),
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || `Erreur ${res.status}`)
      }

      const data = await res.json()
      setProspect(data.prospect)
      setRapport(data.rapport)
      setStatus('ready')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
      setStatus('error')
    }
  }

  // Loading state
  if (status === 'generating' || status === 'idle') {
    return (
      <div className="flex items-center justify-center h-dvh bg-[#FAFAFA]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-[#FF5C00] animate-spin mx-auto" />
          <div className="mt-4 text-[15px] font-semibold text-[#111111]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
            Génération du briefing Satorea...
          </div>
          <div className="mt-1 text-[12px] text-[#777777]">
            Claude analyse les données et prépare le rapport personnalisé
          </div>
          <div className="mt-4 flex items-center justify-center gap-1.5">
            {[0, 1, 2, 3, 4].map(i => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-[#FF5C00]"
                style={{ animation: `pulse 1.5s ease-in-out ${i * 0.2}s infinite`, opacity: 0.3 }}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (status === 'error') {
    return (
      <div className="flex items-center justify-center h-dvh bg-[#FAFAFA]">
        <div className="text-center max-w-md">
          <AlertCircle className="w-10 h-10 text-[#FF2D78] mx-auto" />
          <div className="mt-4 text-[15px] font-semibold text-[#111111]">
            Erreur de génération
          </div>
          <div className="mt-1 text-[12px] text-[#FF2D78]">
            {error}
          </div>
          <button
            onClick={loadRapport}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#FF5C00] text-white text-[12px] font-bold hover:bg-[#E65200] transition"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Réessayer
          </button>
        </div>
      </div>
    )
  }

  // Rapport prêt
  if (prospect && rapport) {
    return <RapportViewer prospect={prospect} rapport={rapport} />
  }

  return null
}
