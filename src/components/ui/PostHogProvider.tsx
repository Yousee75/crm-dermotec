'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { initPostHog, capturePageView } from '@/lib/posthog'

/** PostHog provider — init + capture automatique des page views */
export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Init PostHog au montage
  useEffect(() => {
    initPostHog()
  }, [])

  // Capture page views à chaque navigation
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
