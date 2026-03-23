'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { QrCode, Copy, Check, ExternalLink, Download, Printer, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface QRCodeGeneratorProps {
  value: string
  size?: number
  label?: string
  sessionInfo?: {
    formationNom: string
    date: string
    horaires?: string
    salle?: string
    formatrice?: string
    creneaux?: string[]
  }
  autoRefresh?: boolean
  refreshInterval?: number
  onRefresh?: () => string
}

export function QRCodeGenerator({
  value,
  size = 250,
  label,
  sessionInfo,
  autoRefresh = false,
  refreshInterval = 300,
  onRefresh,
}: QRCodeGeneratorProps) {
  const [copied, setCopied] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [currentUrl, setCurrentUrl] = useState(value)
  const [secondsLeft, setSecondsLeft] = useState(refreshInterval)

  // QR code généré localement — pas d'API externe
  useEffect(() => {
    async function generateQR() {
      try {
        const QRCode = (await import('qrcode')).default
        const dataUrl = await QRCode.toDataURL(currentUrl, {
          width: size,
          margin: 2,
          color: { dark: 'var(--color-accent)', light: '#FFFFFF' },
          errorCorrectionLevel: 'H',
        })
        setQrDataUrl(dataUrl)
      } catch {
        setQrDataUrl(`https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(currentUrl)}`)
      }
    }
    generateQR()
  }, [currentUrl, size])

  // Auto-refresh timer (sécurité anti-partage QR)
  useEffect(() => {
    if (!autoRefresh || !onRefresh) return
    const interval = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          setCurrentUrl(onRefresh())
          return refreshInterval
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [autoRefresh, onRefresh, refreshInterval])

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = currentUrl
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadQR = () => {
    if (!qrDataUrl) return
    const link = document.createElement('a')
    link.download = `emargement-qr-${sessionInfo?.date || 'session'}.png`
    link.href = qrDataUrl
    link.click()
  }

  const printQR = () => {
    const w = window.open('', '_blank')
    if (!w) return
    w.document.write(`<!DOCTYPE html><html><head><title>QR Émargement</title>
      <style>body{font-family:sans-serif;text-align:center;padding:40px}
      h1{color:#1A1A1A;font-size:22px;margin-bottom:4px}
      .info{color:#475569;font-size:15px;margin-bottom:20px}
      .qr{margin:20px auto}
      .box{color:#64748B;font-size:13px;margin-top:20px;padding:14px;border:1px dashed #CBD5E1;border-radius:10px}
      .ft{margin-top:28px;color:#94A3B8;font-size:11px}
      .logo{color:#FF5C00;font-weight:bold;font-size:18px;margin-bottom:12px}</style></head>
      <body><div class="logo">Dermotec Advanced</div>
      <h1>${sessionInfo?.formationNom || 'Émargement'}</h1>
      <div class="info">${sessionInfo?.date || ''} ${sessionInfo?.horaires ? '&bull; ' + sessionInfo.horaires : ''}
      ${sessionInfo?.salle ? '<br>Salle : ' + sessionInfo.salle : ''}
      ${sessionInfo?.formatrice ? '<br>Formatrice : ' + sessionInfo.formatrice : ''}</div>
      <div class="qr"><img src="${qrDataUrl}" width="${size}" height="${size}"/></div>
      <div class="box"><strong>Scannez ce QR code avec votre téléphone</strong><br>pour confirmer votre présence et signer</div>
      <div class="ft">Dermotec Advanced — 75 Bd Richard Lenoir, 75011 Paris<br>Certifié Qualiopi</div>
      </body></html>`)
    w.document.close()
    w.print()
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center pb-3">
        <CardTitle className="flex items-center justify-center gap-2 text-accent">
          <QrCode className="h-5 w-5 text-primary" />
          {label || 'QR Code Émargement'}
        </CardTitle>
        {sessionInfo && (
          <div className="text-sm text-gray-600 space-y-0.5 mt-2">
            <p className="font-semibold text-accent">{sessionInfo.formationNom}</p>
            <p>{sessionInfo.date} {sessionInfo.horaires && `• ${sessionInfo.horaires}`}</p>
            {sessionInfo.salle && <p className="text-xs">Salle : {sessionInfo.salle}</p>}
            {sessionInfo.formatrice && <p className="text-xs">Formatrice : {sessionInfo.formatrice}</p>}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex justify-center">
          <div className="p-4 bg-white border-2 border-gray-100 rounded-xl shadow-sm">
            {qrDataUrl ? (
              <Image src={qrDataUrl} alt="QR Code émargement" width={size} height={size} unoptimized />
            ) : (
              <div style={{ width: size, height: size }} className="bg-gray-100 animate-pulse rounded-lg" />
            )}
          </div>
        </div>

        {autoRefresh && (
          <div className={cn(
            'flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm',
            secondsLeft < 30 ? 'bg-orange-50 text-orange-600' : 'bg-gray-50 text-gray-500'
          )}>
            <RefreshCw className={cn('w-3.5 h-3.5', secondsLeft < 30 && 'animate-spin')} />
            Renouvellement dans {Math.floor(secondsLeft / 60)}:{(secondsLeft % 60).toString().padStart(2, '0')}
          </div>
        )}

        <div className="bg-blue-50 rounded-xl p-4 text-center">
          <p className="text-sm font-medium text-blue-800">Scannez avec votre téléphone</p>
          <p className="text-xs text-blue-600 mt-1">pour confirmer votre présence et signer</p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Button variant="outline" onClick={copyToClipboard} className="min-h-[44px] text-xs gap-1.5">
            {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copié' : 'Copier'}
          </Button>
          <Button variant="outline" onClick={downloadQR} className="min-h-[44px] text-xs gap-1.5">
            <Download className="w-4 h-4" />
            Image
          </Button>
          <Button variant="outline" onClick={printQR} className="min-h-[44px] text-xs gap-1.5">
            <Printer className="w-4 h-4" />
            Imprimer
          </Button>
        </div>

        <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg">
          <span className="flex-1 text-xs text-gray-500 truncate font-mono">{currentUrl}</span>
          <button onClick={() => window.open(currentUrl, '_blank')} className="p-1.5 hover:bg-gray-200 rounded transition">
            <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
          </button>
        </div>
      </CardContent>
    </Card>
  )
}
