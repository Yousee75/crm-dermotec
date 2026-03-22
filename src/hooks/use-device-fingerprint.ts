'use client'
// ============================================================
// CRM SATOREA — Device Fingerprint Hook
// Génère une empreinte unique du navigateur (côté client)
// et l'envoie au serveur pour la vérification de sécurité.
// ============================================================

import { useEffect, useRef, useState } from 'react'

interface DeviceInfo {
  fingerprint: string
  userAgent: string
  language: string
  timezone: string
  screenResolution: string
  platform: string
}

/** Hook qui génère le fingerprint du navigateur au montage */
export function useDeviceFingerprint() {
  const [device, setDevice] = useState<DeviceInfo | null>(null)
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    async function init() {
      try {
        // Charger FingerprintJS dynamiquement (ne pas bloquer le bundle)
        const FingerprintJS = await import('@fingerprintjs/fingerprintjs')
        const fp = await FingerprintJS.load()
        const result = await fp.get()

        const info: DeviceInfo = {
          fingerprint: result.visitorId,
          userAgent: navigator.userAgent,
          language: navigator.language,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          screenResolution: `${screen.width}x${screen.height}`,
          platform: navigator.platform || 'unknown',
        }

        setDevice(info)

        // Stocker en sessionStorage pour les requêtes API
        sessionStorage.setItem('_df', JSON.stringify(info))
      } catch {
        // Fallback si FingerprintJS échoue
        const fallback: DeviceInfo = {
          fingerprint: generateFallbackFingerprint(),
          userAgent: navigator.userAgent,
          language: navigator.language,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          screenResolution: `${screen.width}x${screen.height}`,
          platform: navigator.platform || 'unknown',
        }
        setDevice(fallback)
        sessionStorage.setItem('_df', JSON.stringify(fallback))
      }
    }

    init()
  }, [])

  return device
}

/** Récupère le fingerprint stocké (pour les appels API) */
export function getStoredFingerprint(): DeviceInfo | null {
  try {
    const stored = sessionStorage.getItem('_df')
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

/** Fallback : fingerprint basique sans FingerprintJS */
function generateFallbackFingerprint(): string {
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency || 0,
    navigator.platform || '',
  ]

  // Simple hash (pas crypto-grade mais suffisant pour identifier)
  let hash = 0
  const str = components.join('|')
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // 32-bit integer
  }

  return `fb_${Math.abs(hash).toString(36)}_${Date.now().toString(36)}`
}

// ============================================================
// ANTI-DEVTOOLS — Détection d'outils de développement
// Décourage (mais n'empêche pas) l'inspection du code
// ============================================================

/** Détecte si les DevTools sont ouverts (heuristique) */
export function detectDevTools(): boolean {
  // Méthode 1 : largeur/hauteur de la fenêtre vs outer
  const widthThreshold = window.outerWidth - window.innerWidth > 160
  const heightThreshold = window.outerHeight - window.innerHeight > 160

  // Méthode 2 : performance de console.log (ralentit avec DevTools)
  // On ne l'utilise pas car trop intrusif

  return widthThreshold || heightThreshold
}

/** Installe un watcher qui détecte l'ouverture de DevTools */
export function watchDevTools(onDetected: () => void) {
  // Checker périodique (toutes les 2 secondes)
  const interval = setInterval(() => {
    if (detectDevTools()) {
      onDetected()
    }
  }, 2000)

  return () => clearInterval(interval)
}
