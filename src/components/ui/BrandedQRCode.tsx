'use client'

// ============================================================
// QR Code brande Satorea — qr-code-styling
// Usage : <BrandedQRCode data="https://..." size={200} logo="/logo.png" />
// ============================================================

import React, { useEffect, useRef, useState } from 'react'
import QRCodeStyling, { type Options } from 'qr-code-styling'

interface BrandedQRCodeProps {
  /** URL ou donnee a encoder dans le QR code */
  data: string
  /** Taille du QR en pixels (default 200) */
  size?: number
  /** URL du logo a afficher au centre */
  logo?: string
  /** Classe CSS additionnelle */
  className?: string
}

const DEFAULT_OPTIONS: Partial<Options> = {
  type: 'svg',
  dotsOptions: {
    color: '#FF5C00',
    type: 'rounded',
  },
  cornersSquareOptions: {
    color: '#111111',
    type: 'square',
  },
  cornersDotOptions: {
    color: '#111111',
    type: 'square',
  },
  backgroundOptions: {
    color: '#FFFFFF',
  },
}

export default function BrandedQRCode({
  data,
  size = 200,
  logo,
  className = '',
}: BrandedQRCodeProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const qrRef = useRef<QRCodeStyling | null>(null)
  const [ready, setReady] = useState(false)

  // Creer l'instance QR une seule fois
  useEffect(() => {
    const qr = new QRCodeStyling({
      ...DEFAULT_OPTIONS,
      width: size,
      height: size,
      data,
      image: logo || undefined,
      imageOptions: logo
        ? { crossOrigin: 'anonymous', margin: 6, imageSize: 0.3 }
        : undefined,
    })
    qrRef.current = qr

    if (containerRef.current) {
      containerRef.current.innerHTML = ''
      qr.append(containerRef.current)
    }

    setReady(true)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Mettre a jour quand les props changent
  useEffect(() => {
    if (!qrRef.current || !ready) return
    qrRef.current.update({
      data,
      width: size,
      height: size,
      image: logo || undefined,
      imageOptions: logo
        ? { crossOrigin: 'anonymous', margin: 6, imageSize: 0.3 }
        : undefined,
    })
  }, [data, size, logo, ready])

  return <div ref={containerRef} className={className} />
}

/** Telecharger le QR code en PNG (utilitaire) */
export function useQRCodeDownload() {
  const qrInstanceRef = useRef<QRCodeStyling | null>(null)

  const createAndDownload = async (
    data: string,
    filename = 'qr-code',
    options?: { size?: number; logo?: string }
  ) => {
    const qr = new QRCodeStyling({
      ...DEFAULT_OPTIONS,
      width: options?.size || 300,
      height: options?.size || 300,
      data,
      image: options?.logo || undefined,
      imageOptions: options?.logo
        ? { crossOrigin: 'anonymous', margin: 6, imageSize: 0.3 }
        : undefined,
    })
    qrInstanceRef.current = qr
    await qr.download({ name: filename, extension: 'png' })
  }

  return { createAndDownload }
}
