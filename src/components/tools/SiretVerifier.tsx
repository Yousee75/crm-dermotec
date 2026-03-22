'use client'

import { useState } from 'react'
import { Search, Building2, MapPin, Tag, CheckCircle, XCircle } from 'lucide-react'

interface SiretResult {
  siret: string
  siren: string
  nom: string
  adresse: string
  codePostal: string
  ville: string
  naf: string
  nafLabel: string
  dateCreation: string
  actif: boolean
}

export function SiretVerifier() {
  const [siret, setSiret] = useState('')
  const [result, setResult] = useState<SiretResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const search = async () => {
    const cleaned = siret.replace(/\s/g, '')
    if (cleaned.length !== 14 || !/^\d+$/.test(cleaned)) {
      setError('Le SIRET doit contenir 14 chiffres')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const res = await fetch(`/api/tools/siret?siret=${cleaned}`)
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Entreprise non trouvée')
        return
      }

      setResult(data)
    } catch {
      setError('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={siret}
          onChange={e => setSiret(e.target.value.replace(/[^\d\s]/g, ''))}
          onKeyDown={e => e.key === 'Enter' && search()}
          placeholder="Entrez un SIRET (14 chiffres)"
          maxLength={17}
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-[#2EC6F3] focus:ring-1 focus:ring-[#2EC6F3]/30"
        />
        <button
          onClick={search}
          disabled={loading}
          className="bg-[#2EC6F3] hover:bg-[#2EC6F3] disabled:opacity-50 text-white rounded-lg px-4 py-2.5 transition-colors flex items-center gap-2"
        >
          <Search size={16} />
          {loading ? 'Recherche...' : 'Vérifier'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600 flex items-center gap-2">
          <XCircle size={16} />
          {error}
        </div>
      )}

      {result && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-[#082545]">{result.nom}</h3>
            <span className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
              result.actif ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {result.actif ? <CheckCircle size={12} /> : <XCircle size={12} />}
              {result.actif ? 'Actif' : 'Fermé'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <div className="flex items-start gap-2">
              <Building2 size={14} className="text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-gray-500 text-xs">SIRET / SIREN</p>
                <p className="font-mono text-xs">{result.siret} / {result.siren}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <MapPin size={14} className="text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-gray-500 text-xs">Adresse</p>
                <p className="text-xs">{result.adresse}, {result.codePostal} {result.ville}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Tag size={14} className="text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-gray-500 text-xs">Activité (NAF)</p>
                <p className="text-xs">{result.naf} — {result.nafLabel}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle size={14} className="text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-gray-500 text-xs">Date création</p>
                <p className="text-xs">{result.dateCreation}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
