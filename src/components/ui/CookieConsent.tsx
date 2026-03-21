'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent')
    if (!consent) {
      // Small delay for animation
      const timer = setTimeout(() => setVisible(true), 500)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'accepted')
    setVisible(false)
  }

  const handleRefuse = () => {
    localStorage.setItem('cookie-consent', 'refused')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-500 ease-out ${
        visible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="bg-white border-t border-gray-200 shadow-xl">
        <div className="max-w-5xl mx-auto px-4 py-4 sm:py-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <p className="flex-1 text-sm text-gray-600 leading-relaxed">
              Ce site utilise des cookies essentiels pour le fonctionnement et des cookies
              analytiques pour améliorer votre expérience.{' '}
              <Link
                href="/politique-confidentialite"
                className="text-[#2EC6F3] hover:underline font-medium"
              >
                En savoir plus
              </Link>
            </p>
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={handleRefuse}
                className="min-h-[44px] px-5 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors cursor-pointer"
              >
                Refuser
              </button>
              <button
                onClick={handleAccept}
                className="min-h-[44px] px-5 py-2 text-sm font-medium text-white bg-[#2EC6F3] rounded-lg hover:bg-[#1ab5e5] transition-colors cursor-pointer"
              >
                Accepter
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
