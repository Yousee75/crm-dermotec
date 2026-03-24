'use client'

import { Train, UtensilsCrossed, Coffee, Pill, GraduationCap, Building2, Dumbbell, Scissors, Car, ShoppingCart } from 'lucide-react'
import type { NeighborhoodData } from '@/lib/neighborhood-data'

interface NeighborhoodStatsProps {
  data: NeighborhoodData
}

const STAT_CONFIG = [
  { key: 'metros', icon: Train, label: 'Métros', color: '#3B82F6' },
  { key: 'restaurants', icon: UtensilsCrossed, label: 'Restaurants', color: '#F59E0B' },
  { key: 'cafes', icon: Coffee, label: 'Cafés', color: '#92400E' },
  { key: 'pharmacies', icon: Pill, label: 'Pharmacies', color: 'var(--color-success)' },
  { key: 'supermarkets', icon: ShoppingCart, label: 'Supermarchés', color: '#EF4444' },
  { key: 'ecoles', icon: GraduationCap, label: 'Écoles', color: '#8B5CF6' },
  { key: 'banks', icon: Building2, label: 'Banques', color: '#6B7280' },
  { key: 'gyms', icon: Dumbbell, label: 'Salles sport', color: '#EC4899' },
  { key: 'beautyCompetitors', icon: Scissors, label: 'Salons beauté', color: '#F97316' },
  { key: 'parkings', icon: Car, label: 'Parkings', color: '#14B8A6' },
] as const

export function NeighborhoodStats({ data }: NeighborhoodStatsProps) {
  return (
    <div className="space-y-4">
      {/* Score trafic piéton */}
      <div className="bg-gradient-to-r from-accent to-accent-light rounded-xl p-4 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white/70">Score trafic piéton</p>
            <p className="text-3xl font-bold">{data.footTrafficScore}<span className="text-lg text-white/50">/100</span></p>
          </div>
          <div className="w-16 h-16 rounded-full border-4 border-white/20 flex items-center justify-center">
            <span className="text-lg font-bold">
              {data.footTrafficScore >= 70 ? '🔥' : data.footTrafficScore >= 40 ? '👍' : '😐'}
            </span>
          </div>
        </div>
        <div className="mt-2 h-2 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${data.footTrafficScore}%` }}
          />
        </div>
      </div>

      {/* Grille de stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {STAT_CONFIG.map(({ key, icon: Icon, label, color }) => {
          const count = data[key as keyof NeighborhoodData] as number
          return (
            <div key={key} className="bg-white border border-[#EEEEEE] rounded-lg p-3 text-center">
              <Icon size={18} className="mx-auto mb-1" style={{ color }} />
              <p className="text-xl font-bold text-accent">{count}</p>
              <p className="text-[10px] text-[#777777] leading-tight">{label}</p>
            </div>
          )
        })}
      </div>

      {/* Landmarks proches */}
      {data.nearbyLandmarks.length > 0 && (
        <div>
          <p className="text-xs font-medium text-[#777777] mb-2">Lieux remarquables proches</p>
          <div className="space-y-1">
            {data.nearbyLandmarks.slice(0, 6).map((l, i) => (
              <div key={i} className="flex items-center justify-between text-xs bg-[#FAF8F5] rounded-lg px-3 py-1.5">
                <span className="text-[#3A3A3A] truncate flex-1">{l.name}</span>
                <div className="flex items-center gap-2 shrink-0">
                  {l.rating && <span className="text-[#FF8C42]">★ {l.rating}</span>}
                  <span className="text-primary font-medium">{l.distance}m</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
