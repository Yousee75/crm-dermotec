'use client'

// ============================================================
// CRM DERMOTEC — Tracked Button
// Bouton qui auto-track ses clics avec métadonnées
// ============================================================

import { forwardRef } from 'react'
import { Button, type ButtonProps } from '@/components/ui/Button'
import { useTrack } from '@/hooks/use-tracker'

interface TrackedButtonProps extends ButtonProps {
  trackingId?: string
  trackingMetadata?: Record<string, unknown>
  trackingEvent?: 'click' | 'export_csv' | 'export_pdf' | 'ai_used' | 'document_uploaded'
}

export const TrackedButton = forwardRef<HTMLButtonElement, TrackedButtonProps>(
  ({ onClick, trackingId, trackingMetadata, trackingEvent = 'click', children, ...props }, ref) => {
    const { track } = useTrack()

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      // Track l'action avant d'exécuter le onClick
      track(trackingEvent, {
        target: trackingId || 'button',
        button_text: typeof children === 'string' ? children : 'unknown',
        ...trackingMetadata
      })

      // Exécuter le onClick original s'il existe
      if (onClick) {
        onClick(event)
      }
    }

    return (
      <Button
        ref={ref}
        onClick={handleClick}
        data-track={trackingId}
        {...props}
      >
        {children}
      </Button>
    )
  }
)

TrackedButton.displayName = 'TrackedButton'