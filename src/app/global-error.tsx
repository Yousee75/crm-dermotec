'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function GlobalError({
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
    <html lang="fr">
      <body style={{ margin: 0, fontFamily: 'DM Sans, Arial, sans-serif', background: '#F8FAFC' }}>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{ textAlign: 'center', padding: '0 24px' }}>
            <div style={{
              width: 80, height: 80, borderRadius: 16,
              background: '#082545', display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px',
            }}>
              <span style={{ fontSize: 32, fontWeight: 'bold', color: '#EF4444' }}>!</span>
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 'bold', color: '#082545', marginBottom: 8 }}>
              Erreur critique
            </h1>
            <p style={{ color: '#64748B', marginBottom: 24 }}>
              L&apos;application a rencontré une erreur inattendue.
            </p>
            <button
              onClick={reset}
              style={{
                padding: '12px 24px', background: '#2EC6F3', color: 'white',
                border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Recharger l&apos;application
            </button>
            {error.digest && (
              <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 16 }}>
                Digest : {error.digest}
              </p>
            )}
          </div>
        </div>
      </body>
    </html>
  )
}
