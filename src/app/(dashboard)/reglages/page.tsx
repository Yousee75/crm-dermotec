'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ReglagesPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirection vers /parametres qui gère déjà tous les réglages
    router.replace('/parametres')
  }, [router])

  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-sm text-gray-500">Redirection vers les réglages...</p>
      </div>
    </div>
  )
}