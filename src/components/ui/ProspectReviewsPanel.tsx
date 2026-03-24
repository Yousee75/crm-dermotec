'use client'

import Image from 'next/image'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase-client'
import { Star, MessageSquare, TrendingUp, TrendingDown, Minus, User, ThumbsUp, Camera, Clock, ChevronDown, ChevronUp } from 'lucide-react'
import { Badge } from '@/components/ui'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

interface ProspectReviewsPanelProps {
  leadId: string
}

interface Review {
  id: string
  source: string
  author_name: string
  rating: number
  text: string
  review_date: string
  language: string
  metadata: {
    author_image?: string
    author_reviews_count?: number
    review_likes?: number
    review_img_urls?: string[]
    owner_answer?: string
    owner_answer_date?: string
  }
}

export function ProspectReviewsPanel({ leadId }: ProspectReviewsPanelProps) {
  const [showAll, setShowAll] = useState(false)
  const [filterStars, setFilterStars] = useState<number | null>(null)
  const supabase = createClient()

  const { data: reviews, isLoading } = useQuery({
    queryKey: ['prospect-reviews', leadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prospect_reviews')
        .select('*')
        .eq('lead_id', leadId)
        .order('review_date', { ascending: false })

      if (error) return []
      return (data || []) as Review[]
    },
  })

  if (isLoading) {
    return <div className="bg-white rounded-xl border p-4 animate-pulse"><div className="h-4 bg-[#EEEEEE] rounded w-1/3 mb-2" /><div className="h-3 bg-[#F4F0EB] rounded w-2/3" /></div>
  }

  if (!reviews || reviews.length === 0) return null

  // Calculs
  const totalReviews = reviews.length
  const avgRating = Math.round((reviews.reduce((s, r) => s + r.rating, 0) / totalReviews) * 10) / 10
  const distribution = [5, 4, 3, 2, 1].map(stars => ({
    stars,
    count: reviews.filter(r => r.rating === stars).length,
    pct: Math.round((reviews.filter(r => r.rating === stars).length / totalReviews) * 100),
  }))
  const withText = reviews.filter(r => r.text && r.text.length > 10)
  const withPhotos = reviews.filter(r => r.metadata?.review_img_urls?.length)
  const withOwnerAnswer = reviews.filter(r => r.metadata?.owner_answer)

  // Tendance
  const sixMonths = Date.now() - 6 * 30 * 24 * 3600 * 1000
  const recent = reviews.filter(r => new Date(r.review_date).getTime() > sixMonths)
  const older = reviews.filter(r => new Date(r.review_date).getTime() <= sixMonths)
  const recentAvg = recent.length > 0 ? Math.round((recent.reduce((s, r) => s + r.rating, 0) / recent.length) * 10) / 10 : avgRating
  const olderAvg = older.length > 0 ? Math.round((older.reduce((s, r) => s + r.rating, 0) / older.length) * 10) / 10 : avgRating
  const trend = recentAvg - olderAvg

  // Filtre
  const filtered = filterStars ? reviews.filter(r => r.rating === filterStars) : reviews
  const displayed = showAll ? filtered : filtered.slice(0, 5)

  return (
    <div className="bg-white rounded-xl border border-[#EEEEEE] overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#F4F0EB] bg-[#FAF8F5]/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-[#111111]">{totalReviews} Avis Clients</h3>
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map(s => (
                <Star key={s} className={cn('w-3.5 h-3.5', s <= Math.round(avgRating) ? 'text-[#FF8C42] fill-amber-400' : 'text-[#999999]')} />
              ))}
              <span className="text-sm font-bold text-[#111111] ml-1">{avgRating}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {trend > 0.1 && <Badge variant="success" size="sm"><TrendingUp className="w-3 h-3 mr-0.5" />+{trend.toFixed(1)}</Badge>}
            {trend < -0.1 && <Badge variant="error" size="sm"><TrendingDown className="w-3 h-3 mr-0.5" />{trend.toFixed(1)}</Badge>}
            {Math.abs(trend) <= 0.1 && <Badge variant="default" size="sm"><Minus className="w-3 h-3 mr-0.5" />Stable</Badge>}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="px-4 py-2 border-b border-[#FAF8F5] flex items-center gap-4 text-[11px] text-[#777777]">
        <span>{withText.length} avec texte</span>
        <span>{withPhotos.length} avec photo</span>
        <span>{withOwnerAnswer.length} réponses proprio ({totalReviews > 0 ? Math.round((withOwnerAnswer.length / totalReviews) * 100) : 0}%)</span>
        <span className="ml-auto">{recent.length} récents (6 mois)</span>
      </div>

      {/* Distribution bars */}
      <div className="px-4 py-3 border-b border-[#FAF8F5]">
        <div className="flex items-center gap-3">
          {distribution.map(d => (
            <button
              key={d.stars}
              onClick={() => setFilterStars(filterStars === d.stars ? null : d.stars)}
              className={cn(
                'flex-1 rounded-lg p-1.5 text-center transition border',
                filterStars === d.stars ? 'border-primary bg-sky-50' : 'border-transparent hover:bg-[#FAF8F5]'
              )}
            >
              <div className="flex items-center justify-center gap-0.5 mb-1">
                <span className="text-xs font-bold">{d.stars}</span>
                <Star className="w-2.5 h-2.5 text-[#FF8C42] fill-amber-400" />
              </div>
              <div className="w-full h-1.5 bg-[#EEEEEE] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${d.pct}%`,
                    backgroundColor: d.stars >= 4 ? '#10B981' : d.stars === 3 ? '#F59E0B' : '#EF4444',
                  }}
                />
              </div>
              <span className="text-[10px] text-[#999999] mt-0.5 block">{d.count}</span>
            </button>
          ))}
        </div>
        {filterStars && (
          <button onClick={() => setFilterStars(null)} className="text-[10px] text-primary mt-1 hover:underline">
            Afficher tous les avis
          </button>
        )}
      </div>

      {/* Liste des avis */}
      <div className="divide-y divide-[#FAF8F5]">
        {displayed.map(review => (
          <div key={review.id} className="px-4 py-3 hover:bg-[#FAF8F5]/50 transition">
            {/* Header avis */}
            <div className="flex items-start justify-between mb-1.5">
              <div className="flex items-center gap-2">
                {review.metadata?.author_image ? (
                  <Image src={review.metadata.author_image} alt="" width={24} height={24} className="rounded-full" unoptimized />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-[#EEEEEE] flex items-center justify-center">
                    <User className="w-3 h-3 text-[#999999]" />
                  </div>
                )}
                <div>
                  <p className="text-xs font-medium text-[#111111]">{review.author_name}</p>
                  {review.metadata?.author_reviews_count && (
                    <p className="text-[10px] text-[#999999]">{review.metadata.author_reviews_count} avis au total</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star key={s} className={cn('w-3 h-3', s <= review.rating ? 'text-[#FF8C42] fill-amber-400' : 'text-[#EEEEEE]')} />
                  ))}
                </div>
                <span className="text-[10px] text-[#999999]">
                  {formatDistanceToNow(new Date(review.review_date), { addSuffix: true, locale: fr })}
                </span>
              </div>
            </div>

            {/* Texte */}
            {review.text && (
              <p className="text-xs text-[#3A3A3A] leading-relaxed mb-1.5">{review.text}</p>
            )}

            {/* Photos */}
            {review.metadata?.review_img_urls && review.metadata.review_img_urls.length > 0 && (
              <div className="flex gap-1.5 mb-1.5">
                {review.metadata.review_img_urls.slice(0, 3).map((url: string, i: number) => (
                  <Image key={i} src={url} alt="" width={64} height={64} className="rounded-lg object-cover" unoptimized />
                ))}
                {review.metadata.review_img_urls.length > 3 && (
                  <div className="w-16 h-16 rounded-lg bg-[#F4F0EB] flex items-center justify-center">
                    <span className="text-xs text-[#777777]">+{review.metadata.review_img_urls.length - 3}</span>
                  </div>
                )}
              </div>
            )}

            {/* Likes */}
            {review.metadata?.review_likes && review.metadata.review_likes > 0 && (
              <div className="flex items-center gap-1 text-[10px] text-[#999999] mb-1.5">
                <ThumbsUp className="w-3 h-3" />
                {review.metadata.review_likes} personne(s) ont trouvé cet avis utile
              </div>
            )}

            {/* Réponse propriétaire */}
            {review.metadata?.owner_answer && (
              <div className="bg-sky-50 rounded-lg p-2.5 mt-1.5 border-l-2 border-primary">
                <p className="text-[10px] font-semibold text-accent mb-0.5">Réponse du propriétaire</p>
                <p className="text-[11px] text-[#3A3A3A] leading-relaxed">{review.metadata.owner_answer}</p>
                {review.metadata.owner_answer_date && (
                  <p className="text-[10px] text-[#999999] mt-0.5">
                    {formatDistanceToNow(new Date(review.metadata.owner_answer_date), { addSuffix: true, locale: fr })}
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Show more */}
      {filtered.length > 5 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full px-4 py-2.5 text-xs text-primary font-medium hover:bg-[#FAF8F5] transition border-t border-[#F4F0EB] flex items-center justify-center gap-1"
        >
          {showAll ? <><ChevronUp className="w-3 h-3" /> Réduire</> : <><ChevronDown className="w-3 h-3" /> Voir les {filtered.length - 5} autres avis</>}
        </button>
      )}
    </div>
  )
}
