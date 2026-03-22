'use client'

import { MapPin, Euro, ExternalLink, Globe } from 'lucide-react'
import { StarRating } from './StarRating'
import { ReputationScore } from './ReputationScore'
import type { AnalyzedCompetitor } from '@/lib/competitor-analyzer'

interface CompetitorCardProps {
  competitor: AnalyzedCompetitor
  onClick?: () => void
}

export function CompetitorCard({ competitor, onClick }: CompetitorCardProps) {
  const c = competitor

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-gray-300 transition-all group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Rank + Nom */}
          <div className="flex items-center gap-2 mb-1">
            {c.rank && (
              <span className="text-xs font-bold text-white bg-accent rounded-full w-5 h-5 flex items-center justify-center shrink-0">
                {c.rank}
              </span>
            )}
            <h3 className="font-semibold text-sm text-accent truncate group-hover:text-primary transition-colors">
              {c.nom}
            </h3>
          </div>

          {/* Adresse + distance */}
          <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
            <MapPin size={12} className="shrink-0" />
            <span className="truncate">{c.adresse || c.ville}</span>
            <span className="text-primary font-medium shrink-0">· {c.distanceM}m</span>
          </div>

          {/* Rating Google */}
          {c.googleRating ? (
            <StarRating rating={c.googleRating} reviewsCount={c.googleReviewsCount} size={12} />
          ) : (
            <span className="text-xs text-gray-400">Pas de note Google</span>
          )}

          {/* CA si disponible */}
          {c.chiffreAffaires && (
            <div className="flex items-center gap-1 mt-1.5 text-xs text-gray-600">
              <Euro size={12} className="text-green-500" />
              <span className="font-medium">
                {c.chiffreAffaires >= 1000000
                  ? `${(c.chiffreAffaires / 1000000).toFixed(1)}M€`
                  : `${(c.chiffreAffaires / 1000).toFixed(0)}K€`}
              </span>
              {c.anneeFiscale && <span className="text-gray-400">({c.anneeFiscale})</span>}
            </div>
          )}

          {/* Sources badges */}
          <div className="flex flex-wrap gap-1 mt-2">
            {c.sources.map(source => (
              <span
                key={source}
                className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-100 text-gray-500"
              >
                {source}
              </span>
            ))}
            {c.website && (
              <a
                href={c.website}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 flex items-center gap-0.5"
              >
                <Globe size={8} /> site
              </a>
            )}
          </div>
        </div>

        {/* Score réputation */}
        <ReputationScore score={c.reputationScore} size="md" />
      </div>
    </button>
  )
}
