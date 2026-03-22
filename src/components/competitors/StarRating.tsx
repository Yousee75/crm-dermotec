'use client'

import { Star } from 'lucide-react'

interface StarRatingProps {
  rating: number
  reviewsCount?: number
  size?: number | 'sm' | 'md' | 'lg'
}

const SIZE_MAP: Record<string, number> = { sm: 12, md: 14, lg: 18 }

export function StarRating({ rating, reviewsCount, size: sizeProp = 14 }: StarRatingProps) {
  const size = typeof sizeProp === 'string' ? (SIZE_MAP[sizeProp] ?? 14) : sizeProp
  const fullStars = Math.floor(rating)
  const hasHalf = rating - fullStars >= 0.3
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0)

  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {Array.from({ length: fullStars }).map((_, i) => (
          <Star key={`full-${i}`} size={size} className="text-amber-400 fill-amber-400" />
        ))}
        {hasHalf && (
          <div className="relative" style={{ width: size, height: size }}>
            <Star size={size} className="text-gray-300 absolute" />
            <div className="overflow-hidden absolute" style={{ width: size / 2 }}>
              <Star size={size} className="text-amber-400 fill-amber-400" />
            </div>
          </div>
        )}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <Star key={`empty-${i}`} size={size} className="text-gray-300" />
        ))}
      </div>
      <span className="text-sm font-semibold text-gray-700">{rating.toFixed(1)}</span>
      {reviewsCount !== undefined && (
        <span className="text-xs text-gray-400">({reviewsCount})</span>
      )}
    </div>
  )
}
