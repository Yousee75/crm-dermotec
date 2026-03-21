'use client'

// ============================================================
// CRM DERMOTEC — Tracked Link
// Lien qui auto-track sa navigation avec métadonnées
// ============================================================

import { forwardRef } from 'react'
import Link, { type LinkProps } from 'next/link'
import { useTrack } from '@/hooks/use-tracker'

interface TrackedLinkProps extends LinkProps {
  children: React.ReactNode
  className?: string
  trackingId?: string
  trackingMetadata?: Record<string, unknown>
}

export const TrackedLink = forwardRef<HTMLAnchorElement, TrackedLinkProps>(
  ({ href, onClick, trackingId, trackingMetadata, children, className, ...props }, ref) => {
    const { track } = useTrack()

    const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
      // Track la navigation
      track('page_view', {
        target: trackingId || href.toString(),
        link_text: typeof children === 'string' ? children : 'unknown',
        destination: href.toString(),
        ...trackingMetadata
      })

      // Exécuter le onClick original s'il existe
      if (onClick) {
        onClick(event)
      }
    }

    return (
      <Link
        ref={ref}
        href={href}
        onClick={handleClick}
        data-track={trackingId}
        className={className}
        {...props}
      >
        {children}
      </Link>
    )
  }
)

TrackedLink.displayName = 'TrackedLink'