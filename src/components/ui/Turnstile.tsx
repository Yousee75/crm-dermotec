'use client'

import { useEffect, useRef, useState } from 'react'

interface TurnstileProps {
  onVerify: (token: string) => void
  onError?: () => void
  onExpire?: () => void
  theme?: 'light' | 'dark' | 'auto'
  size?: 'normal' | 'compact'
  className?: string
}

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: Record<string, unknown>) => string
      reset: (widgetId: string) => void
      remove: (widgetId: string) => void
    }
    onTurnstileLoad?: () => void
  }
}

/**
 * Cloudflare Turnstile — CAPTCHA invisible gratuit
 *
 * 1. Créer un compte Cloudflare : https://dash.cloudflare.com/sign-up
 * 2. Dashboard → Turnstile → Add Site
 * 3. Copier TURNSTILE_SITE_KEY dans .env.local
 * 4. Copier TURNSTILE_SECRET_KEY dans .env.local (pour vérification serveur)
 */
export function Turnstile({ onVerify, onError, onExpire, theme = 'light', size = 'normal', className }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

  useEffect(() => {
    if (!siteKey) {
      console.warn('[Turnstile] NEXT_PUBLIC_TURNSTILE_SITE_KEY not set — skipping CAPTCHA')
      // En dev sans clé, auto-verify
      onVerify('dev-bypass-token')
      return
    }

    // Charger le script Turnstile
    if (!document.querySelector('script[src*="turnstile"]')) {
      const script = document.createElement('script')
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad'
      script.async = true
      document.head.appendChild(script)
    }

    window.onTurnstileLoad = () => setLoaded(true)

    // Si déjà chargé
    if (window.turnstile) setLoaded(true)
  }, [siteKey, onVerify])

  useEffect(() => {
    if (!loaded || !containerRef.current || !window.turnstile || !siteKey) return

    // Nettoyer ancien widget
    if (widgetIdRef.current) {
      window.turnstile.remove(widgetIdRef.current)
    }

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      theme,
      size,
      callback: (token: string) => onVerify(token),
      'error-callback': () => onError?.(),
      'expired-callback': () => onExpire?.(),
    })

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current)
      }
    }
  }, [loaded, siteKey, theme, size, onVerify, onError, onExpire])

  if (!siteKey) return null // Pas de clé = pas de CAPTCHA

  return <div ref={containerRef} className={className} />
}

/**
 * Vérification côté serveur du token Turnstile
 * À utiliser dans les API routes (POST /api/webhook/formulaire, etc.)
 */
export async function verifyTurnstileToken(token: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) {
    console.warn('[Turnstile] TURNSTILE_SECRET_KEY not set — skipping verification')
    return true // En dev, accepter tout
  }

  if (token === 'dev-bypass-token') return true

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret, response: token }),
    })

    const data = await response.json()
    return data.success === true
  } catch (error) {
    console.error('[Turnstile] Verification error:', error)
    return false
  }
}
