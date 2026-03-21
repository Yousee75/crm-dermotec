'use client'

import { useState, useEffect } from 'react'
import { useMFA } from '@/hooks/use-mfa'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { PageHeader } from '@/components/ui/PageHeader'
import {
  Shield, Smartphone, Key, Lock, CheckCircle, AlertTriangle,
  QrCode, Copy, Plus, Trash2, RotateCcw, Users
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Factor {
  id: string
  factor_type: 'totp' | 'phone'
  status: 'verified' | 'unverified'
  friendly_name?: string
  phone?: string
  created_at: string
  updated_at: string
}

interface EnrollmentData {
  id: string
  type: 'totp' | 'phone'
  totp?: {
    qr_code: string
    secret: string
    uri: string
  }
  phone?: string
}

export default function SecuritySettingsPage() {
  const [activeMethod, setActiveMethod] = useState<string | null>(null)
  const [factors, setFactors] = useState<{ totp: Factor[], phone: Factor[] }>({ totp: [], phone: [] })
  const [loading, setLoading] = useState(true)
  const [enrollmentData, setEnrollmentData] = useState<EnrollmentData | null>(null)
  const [verificationCode, setVerificationCode] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [challengeId, setChallengeId] = useState('')
  const [verifying, setVerifying] = useState(false)

  const {
    listFactors, enrollTOTP, enrollPhone, challenge, verify, unenroll,
    getAssuranceLevel
  } = useMFA()

  // Charger les facteurs
  const loadFactors = async () => {
    try {
      setLoading(true)
      const result = await listFactors()
      if (result) {
        setFactors(result)
      }
    } catch (error: any) {
      toast.error('Erreur lors du chargement des méthodes de sécurité')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFactors()
  }, [])

  // Générer un SVG QR code simple (fallback)
  const generateQRCodeSVG = (data: string): string => {
    // Cette fonction génère un placeholder SVG
    // En production, utilisez une vraie librairie QR code
    return `data:image/svg+xml;base64,${btoa(`
      <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="200" fill="white" stroke="#ddd"/>
        <text x="100" y="100" text-anchor="middle" fill="#666" font-size="12">
          QR Code
        </text>
        <text x="100" y="120" text-anchor="middle" fill="#666" font-size="10">
          ${data.substring(0, 20)}...
        </text>
      </svg>
    `)}`
  }

  // Activer TOTP
  const handleEnrollTOTP = async () => {
    try {
      setVerifying(true)
      const result = await enrollTOTP()

      if (result.error) {
        throw new Error(result.error.message)
      }

      setEnrollmentData({
        id: result.data.id,
        type: 'totp',
        totp: {
          qr_code: result.data.totp?.qr_code || generateQRCodeSVG(result.data.totp?.uri || ''),
          secret: result.data.totp?.secret || '',
          uri: result.data.totp?.uri || ''
        }
      })
      setActiveMethod('totp-verify')
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de l\'activation TOTP')
    } finally {
      setVerifying(false)
    }
  }

  // Activer Phone (SMS)
  const handleEnrollPhone = async (channel: 'sms' | 'whatsapp' = 'sms') => {
    if (!phoneNumber.trim()) {
      toast.error('Veuillez saisir un numéro de téléphone')
      return
    }

    // Validation basique du format français
    const phoneRegex = /^(\+33|0)[1-9]\d{8}$/
    if (!phoneRegex.test(phoneNumber.replace(/\s/g, ''))) {
      toast.error('Format de téléphone invalide (ex: +33 6 12 34 56 78)')
      return
    }

    try {
      setVerifying(true)
      const result = await enrollPhone(phoneNumber.replace(/\s/g, ''), channel)

      if (result.error) {
        throw new Error(result.error.message)
      }

      // Créer un challenge pour envoyer le code
      const challengeResult = await challenge(result.data.id, channel)
      if (challengeResult.error) {
        throw new Error(challengeResult.error.message)
      }

      setEnrollmentData({
        id: result.data.id,
        type: 'phone',
        phone: phoneNumber
      })
      setChallengeId(challengeResult.data.id)
      setActiveMethod(`phone-verify-${channel}`)
      toast.success(`Code ${channel === 'sms' ? 'SMS' : 'WhatsApp'} envoyé`)
    } catch (error: any) {
      toast.error(error.message || `Erreur lors de l'activation ${channel}`)
    } finally {
      setVerifying(false)
    }
  }

  // Vérifier le code d'activation
  const handleVerifyEnrollment = async () => {
    if (!verificationCode.trim()) {
      toast.error('Veuillez saisir le code de vérification')
      return
    }

    if (!enrollmentData) return

    try {
      setVerifying(true)

      let challengeIdToUse = challengeId

      // Pour TOTP, créer un challenge à la volée
      if (enrollmentData.type === 'totp') {
        const challengeResult = await challenge(enrollmentData.id)
        if (challengeResult.error) {
          throw new Error(challengeResult.error.message)
        }
        challengeIdToUse = challengeResult.data.id
      }

      const result = await verify(enrollmentData.id, challengeIdToUse, verificationCode)

      if (result.error) {
        throw new Error(result.error.message)
      }

      toast.success('Méthode d\'authentification activée avec succès')
      setActiveMethod(null)
      setEnrollmentData(null)
      setVerificationCode('')
      setPhoneNumber('')
      setChallengeId('')
      await loadFactors()
    } catch (error: any) {
      toast.error(error.message === 'Invalid code'
        ? 'Code incorrect. Veuillez réessayer.'
        : error.message || 'Erreur lors de la vérification'
      )
    } finally {
      setVerifying(false)
    }
  }

  // Supprimer un facteur
  const handleUnenroll = async (factorId: string, type: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer cette méthode ${type} ?`)) {
      return
    }

    try {
      const result = await unenroll(factorId)
      if (result.error) {
        throw new Error(result.error.message)
      }

      toast.success('Méthode d\'authentification supprimée')
      await loadFactors()
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la suppression')
    }
  }

  // Copier dans le presse-papiers
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copié dans le presse-papiers')
  }

  // Annuler l'activation
  const cancelEnrollment = () => {
    setActiveMethod(null)
    setEnrollmentData(null)
    setVerificationCode('')
    setPhoneNumber('')
    setChallengeId('')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sécurité"
        description="Gérez vos méthodes d'authentification à deux facteurs"
      />

      {/* Section 2FA */}
      <Card>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Authentification à deux facteurs (2FA)
              </h3>
              <p className="text-sm text-gray-600">
                Sécurisez votre compte avec une couche de protection supplémentaire
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* TOTP Method */}
            <div className="border border-gray-200 rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center mt-1">
                    <Key className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900">App Authenticator (TOTP)</h4>
                      <Badge variant="success" size="sm">Recommandé</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      Google Authenticator, Authy, 1Password, etc. — Gratuit et hors-ligne
                    </p>
                    {factors.totp.length > 0 && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-green-600 font-medium">Activé</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  {factors.totp.length > 0 ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUnenroll(factors.totp[0].id, 'TOTP')}
                    >
                      <Trash2 className="w-4 h-4" />
                      Désactiver
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleEnrollTOTP}
                      loading={verifying && !activeMethod}
                      disabled={!!activeMethod}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Activer
                    </Button>
                  )}
                </div>
              </div>

              {/* Activation TOTP */}
              {activeMethod === 'totp-verify' && enrollmentData?.type === 'totp' && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h5 className="font-medium text-gray-900 mb-3">1. Scannez le QR Code</h5>
                      <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                        <img
                          src={enrollmentData.totp?.qr_code}
                          alt="QR Code"
                          className="w-40 h-40 mx-auto"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Utilisez votre app d'authentification pour scanner ce code
                      </p>
                    </div>

                    <div>
                      <h5 className="font-medium text-gray-900 mb-3">2. Code de secours (optionnel)</h5>
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
                        <div className="flex items-center justify-between">
                          <code className="text-sm font-mono text-gray-800 break-all">
                            {enrollmentData.totp?.secret}
                          </code>
                          <button
                            onClick={() => copyToClipboard(enrollmentData.totp?.secret || '')}
                            className="ml-2 p-1 hover:bg-gray-200 rounded text-gray-500 hover:text-gray-700 transition"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <h5 className="font-medium text-gray-900 mb-3">3. Vérification</h5>
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="Code à 6 chiffres"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-[#2EC6F3] focus:ring-0"
                          maxLength={6}
                        />
                        <div className="flex gap-2">
                          <Button
                            onClick={handleVerifyEnrollment}
                            loading={verifying}
                            disabled={verificationCode.length !== 6 || verifying}
                            size="sm"
                          >
                            Vérifier et activer
                          </Button>
                          <Button
                            variant="outline"
                            onClick={cancelEnrollment}
                            disabled={verifying}
                            size="sm"
                          >
                            Annuler
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* SMS Method */}
            <div className="border border-gray-200 rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mt-1">
                    <Smartphone className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-1">SMS</h4>
                    <p className="text-sm text-gray-600 mb-2">
                      Recevoir un code par SMS — Nécessite Twilio configuré
                    </p>
                    {factors.phone.length > 0 && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-green-600 font-medium">
                          Activé ({factors.phone[0].phone})
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  {factors.phone.length > 0 ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUnenroll(factors.phone[0].id, 'SMS')}
                    >
                      <Trash2 className="w-4 h-4" />
                      Désactiver
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setActiveMethod('phone-enroll-sms')}
                      disabled={!!activeMethod}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Activer
                    </Button>
                  )}
                </div>
              </div>

              {/* Activation SMS */}
              {activeMethod === 'phone-enroll-sms' && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="max-w-md">
                    <h5 className="font-medium text-gray-900 mb-3">Configuration SMS</h5>
                    <div className="space-y-3">
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="+33 6 12 34 56 78"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-[#2EC6F3] focus:ring-0"
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleEnrollPhone('sms')}
                          loading={verifying}
                          disabled={!phoneNumber.trim() || verifying}
                          size="sm"
                        >
                          Envoyer code SMS
                        </Button>
                        <Button
                          variant="outline"
                          onClick={cancelEnrollment}
                          disabled={verifying}
                          size="sm"
                        >
                          Annuler
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Vérification SMS */}
              {activeMethod === 'phone-verify-sms' && enrollmentData?.type === 'phone' && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="max-w-md">
                    <h5 className="font-medium text-gray-900 mb-3">
                      Code envoyé au {enrollmentData.phone}
                    </h5>
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="Code à 6 chiffres"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-[#2EC6F3] focus:ring-0"
                        maxLength={6}
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={handleVerifyEnrollment}
                          loading={verifying}
                          disabled={verificationCode.length !== 6 || verifying}
                          size="sm"
                        >
                          Vérifier et activer
                        </Button>
                        <Button
                          variant="outline"
                          onClick={cancelEnrollment}
                          disabled={verifying}
                          size="sm"
                        >
                          Annuler
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* WhatsApp Method */}
            <div className="border border-gray-200 rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center mt-1">
                    <Smartphone className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-1">WhatsApp</h4>
                    <p className="text-sm text-gray-600 mb-1">
                      Recevoir un code par WhatsApp — Nécessite Twilio WhatsApp Business
                    </p>
                    <p className="text-xs text-amber-600">
                      Nécessite un numéro WhatsApp Business configuré
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setActiveMethod('phone-enroll-whatsapp')}
                    disabled={!!activeMethod}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Activer
                  </Button>
                </div>
              </div>

              {/* Activation WhatsApp */}
              {activeMethod === 'phone-enroll-whatsapp' && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="max-w-md">
                    <h5 className="font-medium text-gray-900 mb-3">Configuration WhatsApp</h5>
                    <div className="space-y-3">
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="+33 6 12 34 56 78"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-[#2EC6F3] focus:ring-0"
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleEnrollPhone('whatsapp')}
                          loading={verifying}
                          disabled={!phoneNumber.trim() || verifying}
                          size="sm"
                        >
                          Envoyer code WhatsApp
                        </Button>
                        <Button
                          variant="outline"
                          onClick={cancelEnrollment}
                          disabled={verifying}
                          size="sm"
                        >
                          Annuler
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Vérification WhatsApp */}
              {activeMethod === 'phone-verify-whatsapp' && enrollmentData?.type === 'phone' && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="max-w-md">
                    <h5 className="font-medium text-gray-900 mb-3">
                      Code WhatsApp envoyé au {enrollmentData.phone}
                    </h5>
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="Code à 6 chiffres"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-[#2EC6F3] focus:ring-0"
                        maxLength={6}
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={handleVerifyEnrollment}
                          loading={verifying}
                          disabled={verificationCode.length !== 6 || verifying}
                          size="sm"
                        >
                          Vérifier et activer
                        </Button>
                        <Button
                          variant="outline"
                          onClick={cancelEnrollment}
                          disabled={verifying}
                          size="sm"
                        >
                          Annuler
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Sessions actives */}
      <Card>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Sessions actives
              </h3>
              <p className="text-sm text-gray-600">
                Gérez vos connexions actives
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Session actuelle</p>
                <p className="text-sm text-gray-600">
                  Paris, France • {new Date().toLocaleDateString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <Badge variant="success" size="sm">Actuelle</Badge>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Déconnecter toutes les autres sessions
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}