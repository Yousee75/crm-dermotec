'use client'

// ============================================================
// PostHog Provider — initialise PostHog au montage + capture page views
// Usage : wrapper dans le layout racine
// ============================================================

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { initPostHog, capturePageView, identifyUser } from '@/lib/posthog'

interface PostHogProviderProps {
  children: React.ReactNode
  /** ID utilisateur connecte (optionnel, pour identification) */
  userId?: string
  /** Proprietes utilisateur (optionnel) */
  userProperties?: Record<string, unknown>
}

export default function PostHogProvider({
  children,
  userId,
  userProperties,
}: PostHogProviderProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Initialiser PostHog au montage
  useEffect(() => {
    initPostHog()
  }, [])

  // Identifier l'utilisateur si connecte
  useEffect(() => {
    if (userId) {
      identifyUser(userId, userProperties)
    }
  }, [userId, userProperties])

  // Capturer les page views a chaque navigation
  useEffect(() => {
    if (pathname) {
      const url = searchParams?.toString()
        ? `${pathname}?${searchParams.toString()}`
        : pathname
      capturePageView(url)
    }
  }, [pathname, searchParams])

  return <>{children}</>
}
