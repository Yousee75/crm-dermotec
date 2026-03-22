'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Raccourcis clavier globaux style Linear/Notion
 *
 * G puis D = Dashboard
 * G puis L = Leads
 * G puis P = Pipeline
 * G puis S = Sessions
 * G puis C = Cockpit
 * N = Nouveau lead (depuis n'importe où)
 */
export function KeyboardShortcuts() {
  const router = useRouter()
  const pendingG = useRef(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ignorer si on tape dans un input/textarea
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return

      // Ignorer si Cmd/Ctrl held (réservé pour Cmd+K etc)
      if (e.metaKey || e.ctrlKey) return

      const key = e.key.toLowerCase()

      // "G" shortcuts (go to)
      if (pendingG.current) {
        pendingG.current = false
        clearTimeout(timer.current)

        const routes: Record<string, string> = {
          d: '/',
          l: '/leads',
          p: '/pipeline',
          s: '/sessions',
          c: '/cockpit',
          f: '/financement',
          a: '/analytics',
          q: '/qualite',
          e: '/equipe',
          t: '/settings',
        }

        if (routes[key]) {
          e.preventDefault()
          router.push(routes[key])
        }
        return
      }

      // Start "G" sequence
      if (key === 'g') {
        pendingG.current = true
        // Timeout after 500ms
        timer.current = setTimeout(() => { pendingG.current = false }, 500)
        return
      }

      // Direct shortcuts
      if (key === 'n') {
        e.preventDefault()
        router.push('/leads?new=1')
        return
      }

      // Raccourci "E" = Enrichir (sur la fiche lead uniquement)
      if (key === 'e' && window.location.pathname.startsWith('/lead/')) {
        e.preventDefault()
        // Clic sur le bouton "Générer le briefing" s'il existe
        const enrichBtn = document.querySelector('[data-action="enrich"]') as HTMLButtonElement
        if (enrichBtn) enrichBtn.click()
        return
      }

      // Raccourci "R" = Ouvrir rapport PDF
      if (key === 'r' && window.location.pathname.startsWith('/lead/')) {
        e.preventDefault()
        const leadId = window.location.pathname.split('/lead/')[1]?.split('/')[0]
        if (leadId) window.open(`/api/enrichment/report/pdf?leadId=${leadId}`, '_blank')
        return
      }

      // Raccourci "W" = Télécharger rapport Word
      if (key === 'w' && window.location.pathname.startsWith('/lead/')) {
        e.preventDefault()
        const leadId = window.location.pathname.split('/lead/')[1]?.split('/')[0]
        if (leadId) window.open(`/api/enrichment/report/word?leadId=${leadId}`, '_blank')
        return
      }
    }

    document.addEventListener('keydown', handler)
    return () => {
      document.removeEventListener('keydown', handler)
      clearTimeout(timer.current)
    }
  }, [router])

  return null
}
