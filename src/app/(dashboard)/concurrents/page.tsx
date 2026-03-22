'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import dynamic2 from 'next/dynamic'
import { PageHeader } from '@/components/ui/PageHeader'
import { Search, Target, TrendingUp, Star, Users, Euro, AlertTriangle, Zap, FileDown } from 'lucide-react'
import { useCompetitorAnalysis } from '@/hooks/use-competitors'
import { CompetitorCard } from '@/components/competitors/CompetitorCard'

const CompetitorMap = dynamic2(
  () => import('@/components/competitors/CompetitorMap').then(m => ({ default: m.CompetitorMap })),
  { ssr: false, loading: () => <div className="w-full h-[400px] rounded-xl bg-gray-100 animate-pulse" /> }
)

const RADIUS_OPTIONS = [
  { value: 500, label: '500m' },
  { value: 1000, label: '1 km' },
  { value: 2000, label: '2 km' },
  { value: 5000, label: '5 km' },
]

export default function ConcurrentsPage() {
  const [siret, setSiret] = useState('')
  const [nom, setNom] = useState('')
  const [ville, setVille] = useState('')
  const [radiusM, setRadiusM] = useState(1000)
  const [searchMode, setSearchMode] = useState<'siret' | 'nom'>('siret')
  const [warning, setWarning] = useState<string | null>(null)
  const [fullAnalysisLoading, setFullAnalysisLoading] = useState(false)
  const { data, isLoading, error, analyze } = useCompetitorAnalysis()

  const handleSearch = async () => {
    setWarning(null)

    if (searchMode === 'siret') {
      const cleaned = siret.replace(/\s/g, '')
      if (cleaned.length < 9) return

      // Vérifier le SIRET avant de lancer
      try {
        const res = await fetch(`https://recherche-entreprises.api.gouv.fr/search?q=${cleaned}`)
        const data = await res.json()

        if (!data.results?.length) {
          setWarning('SIRET introuvable dans la base Sirene. L\'entreprise n\'existe peut-être pas ou a été radiée.')
        } else {
          const ape = data.results[0].activite_principale || ''
          const esthetiqueApes = ['96.02B', '96.02A', '96.04Z', '47.75Z', '86.90F']
          if (!esthetiqueApes.includes(ape)) {
            setWarning(`Secteur "${ape}" détecté — pas dans l'esthétique. Les résultats peuvent être moins pertinents.`)
          }
        }
      } catch { /* continue anyway */ }

      analyze({ siret: cleaned, radiusM })
    } else if (searchMode === 'nom' && nom.trim()) {
      analyze({ nom, ville, radiusM })
    }
  }

  const handleFullAnalysis = async () => {
    if (!data?.prospect) return
    setFullAnalysisLoading(true)
    try {
      const res = await fetch('/api/competitors/full-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siret: data.prospect.siret,
          nom: data.prospect.nom,
          radiusM,
          maxCompetitors: 5,
        }),
      })
      const fullData = await res.json()
      if (res.ok) {
        // TODO: afficher les résultats complets dans un dialog/sheet
        console.log('Full analysis:', fullData)
      }
    } catch { /* silent */ } finally {
      setFullAnalysisLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="Analyse concurrentielle"
        description="Trouvez et analysez vos concurrents avec carte, notes et revenus"
      />

      {/* Barre de recherche */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
        {/* Mode toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setSearchMode('siret')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              searchMode === 'siret' ? 'bg-[#082545] text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            Par SIRET
          </button>
          <button
            onClick={() => setSearchMode('nom')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              searchMode === 'nom' ? 'bg-[#082545] text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            Par nom
          </button>
        </div>

        <div className="flex gap-2 flex-wrap">
          {searchMode === 'siret' ? (
            <input
              type="text"
              value={siret}
              onChange={e => setSiret(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="SIRET de votre établissement (14 chiffres)"
              className="flex-1 min-w-[200px] border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-[#2EC6F3]"
            />
          ) : (
            <>
              <input
                type="text"
                value={nom}
                onChange={e => setNom(e.target.value)}
                placeholder="Nom de l'établissement"
                className="flex-1 min-w-[150px] border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#2EC6F3]"
              />
              <input
                type="text"
                value={ville}
                onChange={e => setVille(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="Ville"
                className="w-[150px] border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#2EC6F3]"
              />
            </>
          )}

          <select
            value={radiusM}
            onChange={e => setRadiusM(Number(e.target.value))}
            className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
          >
            {RADIUS_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>Rayon {o.label}</option>
            ))}
          </select>

          <button
            onClick={handleSearch}
            disabled={isLoading}
            className="bg-[#2EC6F3] hover:bg-[#2EC6F3] disabled:opacity-50 text-white rounded-lg px-5 py-2.5 flex items-center gap-2 transition-colors"
          >
            <Search size={16} />
            {isLoading ? 'Analyse...' : 'Analyser'}
          </button>
        </div>

        {warning && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 text-sm text-amber-700 flex items-start gap-2">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <div>
              <p>{warning}</p>
              <p className="text-xs text-amber-500 mt-1">L&apos;analyse sera lancée quand même.</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm text-red-600">
            {error}
          </div>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-[#2EC6F3] border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm text-gray-500">Recherche des concurrents et enrichissement des données...</p>
          <p className="text-xs text-gray-400 mt-1">Cela peut prendre 10-30 secondes</p>
        </div>
      )}

      {/* Résultats */}
      {data && !isLoading && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { icon: Users, label: 'Concurrents', value: data.kpis.totalCompetitors, color: '#082545' },
              { icon: Star, label: 'Note moyenne', value: data.kpis.avgGoogleRating ? `${data.kpis.avgGoogleRating}/5` : 'N/A', color: '#F59E0B' },
              { icon: TrendingUp, label: 'Avis moyen', value: data.kpis.avgReviewsCount, color: '#2EC6F3' },
              { icon: Euro, label: 'CA moyen', value: data.kpis.avgCA ? `${(data.kpis.avgCA / 1000).toFixed(0)}K€` : 'N/A', color: '#22C55E' },
              { icon: Target, label: 'Score moyen', value: `${data.kpis.avgReputationScore}/100`, color: '#A855F7' },
            ].map(kpi => {
              const Icon = kpi.icon
              return (
                <div key={kpi.label} className="bg-white border border-gray-200 rounded-xl p-4 text-center">
                  <Icon size={20} className="mx-auto mb-1" style={{ color: kpi.color }} />
                  <p className="text-xl font-bold text-[#082545]">{kpi.value}</p>
                  <p className="text-xs text-gray-500">{kpi.label}</p>
                </div>
              )
            })}
          </div>

          {/* Boutons actions */}
          <div className="flex justify-end gap-3">
            <button
              onClick={async () => {
                try {
                  const res = await fetch('/api/competitors/pdf', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      prospect: data.prospect,
                      competitors: data.competitors,
                      kpis: data.kpis,
                    }),
                  })
                  if (res.ok) {
                    const blob = await res.blob()
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `rapport-${data.prospect.nom?.replace(/\s+/g, '-')}.pdf`
                    a.click()
                    URL.revokeObjectURL(url)
                  }
                } catch { /* silent */ }
              }}
              className="bg-[#082545] hover:bg-[#0F3460] text-white rounded-lg px-4 py-2.5 flex items-center gap-2 text-sm font-medium transition-all"
            >
              <FileDown size={16} />
              Rapport PDF
            </button>
            <button
              onClick={handleFullAnalysis}
              disabled={fullAnalysisLoading}
              className="bg-gradient-to-r from-[#A855F7] to-[#7C3AED] hover:from-[#9333EA] hover:to-[#6D28D9] disabled:opacity-50 text-white rounded-lg px-5 py-2.5 flex items-center gap-2 text-sm font-medium transition-all shadow-md hover:shadow-lg"
            >
              <Zap size={16} />
              {fullAnalysisLoading ? 'Analyse en cours... (30-60s)' : 'Analyse complète (Scraping + IA + Social)'}
            </button>
          </div>

          {/* Carte */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="font-semibold text-sm text-[#082545] mb-3">
              Carte des concurrents — Rayon {radiusM >= 1000 ? `${radiusM / 1000}km` : `${radiusM}m`}
            </h3>
            <CompetitorMap
              center={{ lat: data.prospect.lat, lng: data.prospect.lng }}
              competitors={data.competitors}
              prospectName={data.prospect.nom}
            />
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-[#2EC6F3] inline-block" /> Vous</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-[#22C55E] inline-block" /> Score &gt;70</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-[#F59E0B] inline-block" /> Score 40-70</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-[#EF4444] inline-block" /> Score &lt;40</span>
            </div>
          </div>

          {/* Liste concurrents */}
          <div>
            <h3 className="font-semibold text-sm text-[#082545] mb-3">
              {data.competitors.length} concurrent{data.competitors.length > 1 ? 's' : ''} trouvé{data.competitors.length > 1 ? 's' : ''}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {data.competitors.map((comp, i) => (
                <CompetitorCard key={comp.siret || i} competitor={comp} />
              ))}
            </div>
          </div>
        </>
      )}

      {/* État vide */}
      {!data && !isLoading && (
        <div className="text-center py-16">
          <Target size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="font-semibold text-gray-500 mb-2">Analysez votre marché</h3>
          <p className="text-sm text-gray-400 max-w-md mx-auto">
            Entrez votre SIRET ou le nom de votre établissement pour découvrir vos concurrents,
            leurs notes Google, leurs revenus et leur score de réputation.
          </p>
        </div>
      )}
    </div>
  )
}
