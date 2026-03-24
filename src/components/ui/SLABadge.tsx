'use client'

import { cn } from '@/lib/utils'

/**
 * SLA Badge — escalade visuelle d'urgence pour les actions CRM
 *
 * Usage:
 *   <SLABadge date={lead.created_at} statut="NOUVEAU" />
 *   <SLABadge date={rappel.date_rappel} statut="EN_ATTENTE" />
 */

type SLALevel = 'fresh' | 'normal' | 'urgent' | 'critical'

interface SLABadgeProps {
  date: string | null
  statut?: string
  className?: string
}

function getSLALevel(date: string | null, statut?: string): SLALevel | null {
  // Leads déjà traités = pas de badge
  if (statut && ['INSCRIT', 'EN_FORMATION', 'FORME', 'ALUMNI', 'PERDU', 'SPAM'].includes(statut)) return null

  if (!date) return 'normal'

  const hoursAgo = (Date.now() - new Date(date).getTime()) / (1000 * 60 * 60)

  if (hoursAgo < 2) return 'fresh'     // < 2h = tout frais
  if (hoursAgo < 24) return 'normal'   // < 24h = normal
  if (hoursAgo < 72) return 'urgent'   // < 3 jours = urgent
  return 'critical'                     // > 3 jours = critique
}

const SLA_CONFIG: Record<SLALevel, { label: string; className: string }> = {
  fresh: {
    label: 'Nouveau',
    className: 'bg-[#D1FAE5] text-[#10B981] border-[#10B981]/30',
  },
  normal: {
    label: 'À traiter',
    className: 'bg-[#FFF3E8] text-[#FF8C42] border-[#FF8C42]/30',
  },
  urgent: {
    label: 'URGENT',
    className: 'bg-[#FFE0EF] text-[#FF2D78] border-[#FF2D78]/30 font-semibold',
  },
  critical: {
    label: 'CRITIQUE',
    className: 'bg-[#FF2D78] text-white border-red-500 font-bold animate-pulse-soft',
  },
}

export function SLABadge({ date, statut, className }: SLABadgeProps) {
  const level = getSLALevel(date, statut)
  if (!level) return null

  const config = SLA_CONFIG[level]

  return (
    <span className={cn(
      'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] border',
      config.className,
      className
    )}>
      {config.label}
    </span>
  )
}

/** Compteur SLA pour les KPIs du dashboard */
export function countSLAItems(items: Array<{ date: string | null; statut?: string }>): {
  urgent: number
  critical: number
  total: number
} {
  let urgent = 0, critical = 0, total = 0

  for (const item of items) {
    const level = getSLALevel(item.date, item.statut)
    if (!level) continue
    total++
    if (level === 'urgent') urgent++
    if (level === 'critical') critical++
  }

  return { urgent, critical, total }
}
