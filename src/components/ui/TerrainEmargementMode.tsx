'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { SignatureCanvas } from '@/components/ui/SignatureCanvas'
import {
  QrCode, X, CheckCircle, Clock, Users, PenTool,
  Wifi, RefreshCw, Smartphone, AlertTriangle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Image from 'next/image'

interface TerrainEmargementModeProps {
  sessionId: string
  sessionNom: string
  stagiaires: Array<{
    id: string
    nom: string
    prenom: string
    emarge: boolean
    telephone?: string
    inscriptionId: string
    heureEmargement?: string
  }>
  qrUrl: string
  onExit: () => void
  onRefresh: () => void
  onSignatureManuelle: (stagiaireId: string, signature: string) => Promise<void>
}

interface WakeLock {
  release(): Promise<void>
}

export function TerrainEmargementMode({
  sessionId,
  sessionNom,
  stagiaires,
  qrUrl,
  onExit,
  onRefresh,
  onSignatureManuelle
}: TerrainEmargementModeProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [wakeLock, setWakeLock] = useState<WakeLock | null>(null)
  const [refreshTimer, setRefreshTimer] = useState(10)
  const [showSignatureModal, setShowSignatureModal] = useState<string | null>(null)
  const [submittingSignature, setSubmittingSignature] = useState(false)
  const [signatureData, setSignatureData] = useState<string | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Générer le QR code
  useEffect(() => {
    async function generateQR() {
      try {
        const QRCode = (await import('qrcode')).default
        const dataUrl = await QRCode.toDataURL(qrUrl, {
          width: 300,
          margin: 2,
          color: { dark: '#1A1A1A', light: '#FFFFFF' },
          errorCorrectionLevel: 'H',
        })
        setQrDataUrl(dataUrl)
      } catch (error) {
        console.error('Erreur génération QR:', error)
        // Fallback vers API externe
        setQrDataUrl(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrUrl)}`)
      }
    }
    generateQR()
  }, [qrUrl])

  // Wake Lock - garder l'écran allumé
  useEffect(() => {
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          const lock = await (navigator as any).wakeLock.request('screen')
          setWakeLock(lock)
          console.log('Wake lock activé - écran allumé')
        }
      } catch (err) {
        console.log('Wake lock non supporté ou permission refusée:', err)
      }
    }

    requestWakeLock()

    return () => {
      if (wakeLock) {
        wakeLock.release()
        console.log('Wake lock libéré')
      }
    }
  }, [wakeLock])

  // Auto-refresh timer pour le QR (sécurité)
  useEffect(() => {
    refreshIntervalRef.current = setInterval(() => {
      setRefreshTimer(prev => {
        if (prev <= 1) {
          onRefresh()
          return 10 // Reset à 10 secondes
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
      }
    }
  }, [onRefresh])

  // Gestion sortie du mode terrain
  const handleExit = useCallback(() => {
    if (wakeLock) {
      wakeLock.release()
    }
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current)
    }
    onExit()
  }, [wakeLock, onExit])

  // Capture de signature
  const handleSignatureCapture = useCallback((signature: string) => {
    setSignatureData(signature)
  }, [])

  // Soumission signature manuelle
  const handleSignatureSubmit = async () => {
    if (!showSignatureModal || !signatureData) return

    setSubmittingSignature(true)
    try {
      await onSignatureManuelle(showSignatureModal, signatureData)
      setShowSignatureModal(null)
      setSignatureData(null)
      onRefresh() // Actualiser la liste
    } catch (error) {
      console.error('Erreur signature:', error)
    } finally {
      setSubmittingSignature(false)
    }
  }

  const stagiairesEmarges = stagiaires.filter(s => s.emarge).length
  const totalStagiaires = stagiaires.length
  const progressPercent = totalStagiaires > 0 ? (stagiairesEmarges / totalStagiaires) * 100 : 0

  return (
    <div className="fixed inset-0 bg-[#1A1A1A] z-50 overflow-auto">
      {/* Header avec bouton sortir */}
      <div className="absolute top-4 right-4 z-10">
        <Button
          onClick={handleExit}
          variant="outline"
          className="bg-white/90 border-[#EEEEEE] text-[#3A3A3A] hover:bg-white"
          icon={<X className="w-4 h-4" />}
        >
          Sortir du mode terrain
        </Button>
      </div>

      <div className="min-h-screen p-6 flex flex-col items-center justify-center space-y-8">
        {/* Titre session */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">
            {sessionNom}
          </h1>
          <div className="flex items-center justify-center gap-2 text-[#10B981] bg-green-900/30 px-4 py-2 rounded-full">
            <Wifi className="w-4 h-4" />
            <span className="text-sm font-medium">Mode terrain actif</span>
          </div>
        </div>

        {/* Compteur principal */}
        <div className="text-center">
          <div className="text-6xl font-bold text-white mb-2">
            {stagiairesEmarges}/{totalStagiaires}
          </div>
          <div className="text-xl text-[#999999] mb-4">
            stagiaires émargés
          </div>

          {/* Barre de progression */}
          <div className="w-64 h-3 bg-gray-700 rounded-full overflow-hidden mx-auto">
            <div
              className="h-full bg-gradient-to-r from-primary to-action transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="text-sm text-[#999999] mt-2">
            {progressPercent.toFixed(0)}% complété
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 w-full max-w-7xl">
          {/* QR Code principal */}
          <div className="flex flex-col items-center space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-white mb-2">
                Scanner pour émarger
              </h2>
              <p className="text-[#999999]">
                Pointez votre téléphone vers le QR code
              </p>
            </div>

            <div className="relative">
              {/* Animation pulse autour du QR */}
              <div className="absolute inset-0 bg-primary/20 rounded-2xl animate-pulse" />

              <div className="relative bg-white p-8 rounded-2xl shadow-2xl">
                {qrDataUrl ? (
                  <Image
                    src={qrDataUrl}
                    alt="QR Code émargement"
                    width={300}
                    height={300}
                    unoptimized
                    className="block"
                  />
                ) : (
                  <div className="w-[300px] h-[300px] bg-[#F4F0EB] animate-pulse rounded-lg flex items-center justify-center">
                    <QrCode className="w-16 h-16 text-[#999999]" />
                  </div>
                )}
              </div>
            </div>

            {/* Timer de refresh */}
            <div className="flex items-center gap-2 text-[#999999] bg-[#1A1A1A]/50 px-4 py-2 rounded-full">
              <RefreshCw className={cn('w-4 h-4', refreshTimer <= 3 && 'animate-spin')} />
              <span className="text-sm font-mono">
                Actualisation dans {refreshTimer}s
              </span>
            </div>

            {/* Bouton signature manuelle */}
            <Button
              onClick={() => setShowSignatureModal('manual')}
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              icon={<PenTool className="w-4 h-4" />}
            >
              Signature manuelle
            </Button>
          </div>

          {/* Liste des stagiaires */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
                <Users className="w-6 h-6" />
                Stagiaires
              </h2>
              <Button
                onClick={onRefresh}
                variant="ghost"
                size="sm"
                className="text-[#999999] hover:text-white hover:bg-white/10"
                icon={<RefreshCw className="w-4 h-4" />}
              >
                Actualiser
              </Button>
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {stagiaires.map((stagiaire) => (
                <div
                  key={stagiaire.id}
                  className={cn(
                    'flex items-center gap-4 p-4 rounded-xl border transition-all',
                    stagiaire.emarge
                      ? 'bg-green-900/30 border-[#10B981]/30'
                      : 'bg-[#1A1A1A]/50 border-gray-600/30'
                  )}
                >
                  {/* Statut */}
                  <div className={cn(
                    'w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0',
                    stagiaire.emarge
                      ? 'bg-[#10B981]/20 border-2 border-[#10B981]'
                      : 'bg-gray-700/50 border-2 border-gray-600'
                  )}>
                    {stagiaire.emarge ? (
                      <CheckCircle className="w-6 h-6 text-[#10B981]" />
                    ) : (
                      <Clock className="w-6 h-6 text-[#999999]" />
                    )}
                  </div>

                  {/* Nom */}
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-semibold text-white truncate">
                      {stagiaire.prenom} {stagiaire.nom}
                    </p>
                    {stagiaire.emarge && stagiaire.heureEmargement && (
                      <p className="text-sm text-[#10B981]">
                        Signé à {stagiaire.heureEmargement}
                      </p>
                    )}
                    {!stagiaire.emarge && (
                      <p className="text-sm text-[#999999]">
                        En attente de signature
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {!stagiaire.emarge && (
                      <>
                        <Button
                          onClick={() => setShowSignatureModal(stagiaire.id)}
                          variant="outline"
                          size="sm"
                          className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                          icon={<PenTool className="w-4 h-4" />}
                        >
                          Signer
                        </Button>

                        {stagiaire.telephone && (
                          <a
                            href={`https://wa.me/${stagiaire.telephone.replace(/\s/g, '').replace(/^0/, '33')}`}
                            target="_blank"
                            className="p-2 rounded-lg bg-[#10B981]/20 text-[#10B981] hover:bg-[#10B981]/30 transition"
                            title="Relancer par WhatsApp"
                          >
                            <Smartphone className="w-4 h-4" />
                          </a>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Alerte si des stagiaires manquent */}
            {totalStagiaires - stagiairesEmarges > 0 && (
              <Card className="bg-orange-900/30 border-orange-500/30 p-4">
                <div className="flex items-center gap-3 text-orange-300">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">
                      {totalStagiaires - stagiairesEmarges} stagiaire{totalStagiaires - stagiairesEmarges > 1 ? 's' : ''} manquant{totalStagiaires - stagiairesEmarges > 1 ? 's' : ''}
                    </p>
                    <p className="text-sm text-orange-400">
                      Vérifiez leur présence en salle
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Modal signature manuelle */}
      {showSignatureModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  Signature manuelle
                  {showSignatureModal !== 'manual' && (
                    <span className="block text-sm text-[#777777] font-normal">
                      {stagiaires.find(s => s.id === showSignatureModal)?.prenom} {stagiaires.find(s => s.id === showSignatureModal)?.nom}
                    </span>
                  )}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSignatureModal(null)}
                  icon={<X className="w-4 h-4" />}
                />
              </div>

              <SignatureCanvas
                onSignature={handleSignatureCapture}
                width={400}
                height={150}
              />

              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowSignatureModal(null)}
                  className="flex-1"
                  disabled={submittingSignature}
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleSignatureSubmit}
                  className="flex-1"
                  loading={submittingSignature}
                  disabled={submittingSignature || !signatureData}
                >
                  Valider
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}