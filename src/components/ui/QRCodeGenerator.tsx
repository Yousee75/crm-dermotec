'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { QrCode, Copy, Check, ExternalLink } from 'lucide-react'

interface QRCodeGeneratorProps {
  value: string
  size?: number
  label?: string
  sessionInfo?: {
    formationNom: string
    date: string
    creneaux: string[]
  }
}

export function QRCodeGenerator({
  value,
  size = 200,
  label,
  sessionInfo
}: QRCodeGeneratorProps) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      // Fallback pour les navigateurs plus anciens
      const textArea = document.createElement('textarea')
      textArea.value = value
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const openUrl = () => {
    window.open(value, '_blank')
  }

  // Génération d'un QR code simple via une API publique
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}&format=png&margin=10`

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center pb-4">
        <CardTitle className="flex items-center justify-center gap-2 text-[#082545]">
          <QrCode className="h-5 w-5" />
          {label || 'QR Code Émargement'}
        </CardTitle>

        {sessionInfo && (
          <div className="text-sm text-gray-600 space-y-1">
            <p className="font-medium">{sessionInfo.formationNom}</p>
            <p>{sessionInfo.date}</p>
            <p className="text-xs">{sessionInfo.creneaux.join(' • ')}</p>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* QR Code */}
        <div className="flex justify-center">
          <div className="p-4 bg-white border rounded-lg shadow-sm">
            <img
              src={qrCodeUrl}
              alt="QR Code pour émargement"
              className="block"
              style={{ width: size, height: size }}
            />
          </div>
        </div>

        {/* URL */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Lien d'émargement
          </label>
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <span className="flex-1 text-sm text-gray-600 truncate">
              {value}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={copyToClipboard}
            className="min-h-[44px] flex items-center gap-2"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-green-600" />
                Copié !
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copier le lien
              </>
            )}
          </Button>

          <Button
            type="button"
            onClick={openUrl}
            className="min-h-[44px] flex items-center gap-2 bg-[#2EC6F3] hover:bg-[#1fb5e3]"
          >
            <ExternalLink className="h-4 w-4" />
            Ouvrir
          </Button>
        </div>

        {/* Instructions */}
        <div className="text-xs text-gray-500 text-center space-y-1">
          <p>Les stagiaires peuvent scanner ce QR code</p>
          <p>ou utiliser le lien pour s'émarger</p>
        </div>
      </CardContent>
    </Card>
  )
}