'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center px-6">
        <div className="w-20 h-20 rounded-2xl bg-[#FFE0EF] flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl">⚠️</span>
        </div>
        <h1
          className="text-2xl font-bold text-accent mb-2"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          Une erreur est survenue
        </h1>
        <p className="text-[#777777] mb-6 max-w-md">
          Quelque chose s&apos;est mal passé. Veuillez réessayer ou contacter l&apos;administrateur.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium transition"
          >
            Réessayer
          </button>
          <a
            href="/"
            className="px-6 py-3 bg-[#F4F0EB] hover:bg-[#EEEEEE] text-[#3A3A3A] rounded-lg font-medium transition"
          >
            Dashboard
          </a>
        </div>
        {error.digest && (
          <p className="text-xs text-[#999999] mt-4">Code erreur : {error.digest}</p>
        )}
      </div>
    </div>
  )
}
