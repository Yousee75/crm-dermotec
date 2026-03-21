'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Error Boundary]', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
      <div className="text-center px-6">
        <div className="w-20 h-20 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl">⚠️</span>
        </div>
        <h1
          className="text-2xl font-bold text-[#082545] mb-2"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          Une erreur est survenue
        </h1>
        <p className="text-gray-500 mb-6 max-w-md">
          Quelque chose s&apos;est mal passé. Veuillez réessayer ou contacter l&apos;administrateur.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-3 bg-[#2EC6F3] hover:bg-[#1BA8D4] text-white rounded-lg font-medium transition"
          >
            Réessayer
          </button>
          <a
            href="/"
            className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition"
          >
            Dashboard
          </a>
        </div>
        {error.digest && (
          <p className="text-xs text-gray-400 mt-4">Code erreur : {error.digest}</p>
        )}
      </div>
    </div>
  )
}
