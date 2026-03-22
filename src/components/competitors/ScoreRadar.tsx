'use client'

import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Radar, ResponsiveContainer, Tooltip
} from 'recharts'
import type { CompetitorScores } from '@/lib/competitor-scoring'

interface ScoreRadarProps {
  scores: CompetitorScores
  compareTo?: CompetitorScores
  size?: number
}

const LABELS: Record<string, string> = {
  reputation: 'Réputation',
  presence: 'Présence digitale',
  activity: 'Activité sociale',
  financial: 'Finances',
  neighborhood: 'Quartier',
}

export function ScoreRadar({ scores, compareTo, size = 300 }: ScoreRadarProps) {
  const data = Object.entries(LABELS).map(([key, label]) => ({
    dimension: label,
    score: scores[key as keyof CompetitorScores] || 0,
    ...(compareTo ? { compare: compareTo[key as keyof CompetitorScores] || 0 } : {}),
  }))

  return (
    <div className="flex flex-col items-center">
      <ResponsiveContainer width={size} height={size}>
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
          <PolarGrid stroke="#E5E7EB" />
          <PolarAngleAxis
            dataKey="dimension"
            tick={{ fontSize: 11, fill: '#6B7280' }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fontSize: 9, fill: '#9CA3AF' }}
            tickCount={5}
          />
          <Radar
            name="Score"
            dataKey="score"
            stroke="#2EC6F3"
            fill="#2EC6F3"
            fillOpacity={0.3}
            strokeWidth={2}
          />
          {compareTo && (
            <Radar
              name="Comparaison"
              dataKey="compare"
              stroke="#F59E0B"
              fill="#F59E0B"
              fillOpacity={0.15}
              strokeWidth={2}
              strokeDasharray="5 5"
            />
          )}
          <Tooltip
            contentStyle={{
              backgroundColor: '#082545',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              fontSize: '12px',
            }}
            formatter={(value: number) => [`${value}/100`, '']}
          />
        </RadarChart>
      </ResponsiveContainer>

      {/* Score global */}
      <div className="flex items-center gap-3 mt-2">
        <div className="text-center">
          <p className="text-3xl font-bold text-accent">{scores.global}</p>
          <p className="text-xs text-gray-500">Score global /100</p>
        </div>
        {compareTo && (
          <>
            <span className="text-gray-300">vs</span>
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-500">{compareTo.global}</p>
              <p className="text-xs text-gray-500">Comparaison</p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
