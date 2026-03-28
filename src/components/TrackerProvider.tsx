'use client'

// ============================================================
// CRM DERMOTEC — Tracker Provider
// Initialise le tracking global pour toute l'app
// Doit être placé au niveau du layout principal
// ============================================================

import { useEffect } from 'react'
import { createClient } from '@/lib/infra/supabase-client'
import { tracker } from '@/lib/user-tracker'
import { useErrorTracker } from '@/hooks/use-tracker'

interface TrackerProviderProps {
  children: React.ReactNode
}

export function TrackerProvider({ children }: TrackerProviderProps) {
  // Auto-track les erreurs JavaScript
  useErrorTracker()

  useEffect(() => {
    async function initializeTracking() {
      try {
        const supabase = createClient()

        // Récupérer l'utilisateur courant
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
          // Initialiser le tracker avec l'ID utilisateur
          tracker.init(user.id)

          // Track la connexion/session start
          tracker.track('login', {
            login_method: 'session_restore',
            timestamp: new Date().toISOString()
          })

          // Tracking initialized
        }
      } catch (error) {
        console.warn('[TrackerProvider] Failed to initialize tracking:', error)
        // Ne pas bloquer l'app si le tracking échoue
      }
    }

    initializeTracking()

    // Cleanup à la fermeture de l'onglet/app
    const handleBeforeUnload = () => {
      tracker.track('logout', {
        logout_method: 'tab_close',
        timestamp: new Date().toISOString()
      })
      tracker.destroy()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      tracker.destroy()
    }
  }, [])

  return <>{children}</>
}

// Hook pour vérifier si le tracking est actif
export function useTrackingStatus() {
  return {
    isActive: typeof window !== 'undefined' && (tracker as any)._userId !== null
  }
}