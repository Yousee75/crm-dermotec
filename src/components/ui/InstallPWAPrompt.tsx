'use client'

import { useEffect, useState, useCallback } from 'react'
import { X, Download } from 'lucide-react'

const DISMISSED_KEY = 'satorea-pwa-dismissed'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallPWAPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Ne pas afficher si deja refuse
    if (localStorage.getItem(DISMISSED_KEY)) return

    // Ne pas afficher si deja installe (standalone)
    if (window.matchMedia('(display-mode: standalone)').matches) return

    // Detecter mobile uniquement
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    if (!isMobile) return

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setVisible(true)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'dismissed') {
      localStorage.setItem(DISMISSED_KEY, '1')
    }
    setDeferredPrompt(null)
    setVisible(false)
  }, [deferredPrompt])

  const handleDismiss = useCallback(() => {
    localStorage.setItem(DISMISSED_KEY, '1')
    setVisible(false)
  }, [])

  if (!visible) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#1A1A1A] px-4 py-3 shadow-2xl">
        {/* Icone */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#FF5C00]">
          <Download className="h-5 w-5 text-white" />
        </div>

        {/* Texte */}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white">Installer Satorea</p>
          <p className="text-xs text-slate-400">Acces rapide depuis votre ecran d&apos;accueil</p>
        </div>

        {/* Bouton installer */}
        <button
          onClick={handleInstall}
          className="shrink-0 rounded-lg bg-[#FF5C00] px-3 py-1.5 text-sm font-semibold text-[#1A1A1A] transition-opacity hover:opacity-85"
        >
          Installer
        </button>

        {/* Bouton fermer */}
        <button
          onClick={handleDismiss}
          className="shrink-0 rounded-md p-1 text-slate-500 transition-colors hover:text-slate-300"
          aria-label="Fermer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
