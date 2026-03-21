// @ts-nocheck
'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMFA } from '@/hooks/use-mfa'
import { Button } from '@/components/ui/Button'
import { Smartphone, Shield, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import { toast } from 'sonner'

export default function MFAVerifyPage() {
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendTimer, setResendTimer] = useState(0)
  const [challengeId, setChallengeId] = useState('')
  const [factorId, setFactorId] = useState('')
  const [factorType, setFactorType] = useState<'totp' | 'phone'>('totp')
  const [maskedPhone, setMaskedPhone] = useState('')

  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const router = useRouter()
  const searchParams = useSearchParams()
  const { verify, challenge, listFactors, getAssuranceLevel } = useMFA()

  // Initialisation : récupérer les facteurs et créer un challenge si nécessaire
  useEffect(() => {
    const initMFA = async () => {
      try {
        // Vérifier d'abord si l'utilisateur a besoin de MFA
        const level = await getAssuranceLevel()
        if (level?.currentLevel === 'aal2') {
          // L'utilisateur a déjà validé la 2FA
          router.push('/')
          return
        }

        if (level?.nextLevel !== 'aal2') {
          // L'utilisateur n'a pas de 2FA configurée
          router.push('/')
          return
        }

        // Lister les facteurs disponibles
        const factors = await listFactors()

        if (!factors?.totp?.length && !factors?.phone?.length) {
          toast.error('Aucune méthode 2FA configurée')
          router.push('/settings/security')
          return
        }

        // Priorité au TOTP si disponible
        let selectedFactor
        if (factors.totp?.length) {
          selectedFactor = factors.totp[0]
          setFactorType('totp')
        } else if (factors.phone?.length) {
          selectedFactor = factors.phone[0]
          setFactorType('phone')

          // Créer un challenge pour envoyer le SMS/WhatsApp
          const challengeResult = await challenge(selectedFactor.id)
          if (challengeResult.error) {
            throw new Error(challengeResult.error.message)
          }
          setChallengeId(challengeResult.data?.id || '')

          // Masquer le numéro de téléphone
          const phone = selectedFactor.phone
          if (phone) {
            const masked = phone.replace(/(\+33)\d{6}(\d{2})/, '$1 6** ** ** $2')
            setMaskedPhone(masked)
          }

          // Démarrer le timer de renvoi
          setResendTimer(30)
        }

        if (selectedFactor) {
          setFactorId(selectedFactor.id)

          // Pour TOTP, pas besoin de challenge initial
          if (factors.totp?.length && selectedFactor.factor_type === 'totp') {
            // Pas de challenge nécessaire pour TOTP
          }
        }
      } catch (error: any) {
        setError(error.message || 'Erreur lors de l\'initialisation')
      }
    }

    initMFA()
  }, [])

  // Timer de renvoi
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendTimer])

  // Auto-focus sur le premier input
  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  // Gestion de la saisie des codes
  const handleCodeChange = (index: number, value: string) => {
    // Ne permettre que les chiffres
    if (!/^\d*$/.test(value)) return

    const newCode = [...code]
    newCode[index] = value.slice(-1) // Prendre seulement le dernier caractère

    setCode(newCode)
    setError('')

    // Auto-focus sur l'input suivant
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-submit quand les 6 chiffres sont saisis
    if (newCode.every(digit => digit !== '') && newCode.join('').length === 6) {
      setTimeout(() => handleVerify(newCode.join('')), 100)
    }
  }

  // Gestion des touches spéciales
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus()
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (code.every(digit => digit !== '')) {
        handleVerify(code.join(''))
      }
    }
  }

  // Vérification du code
  const handleVerify = async (codeValue: string = code.join('')) => {
    if (codeValue.length !== 6) {
      setError('Le code doit contenir 6 chiffres')
      return
    }

    setLoading(true)
    setError('')

    try {
      let challengeIdToUse = challengeId

      // Pour TOTP, créer un challenge à la volée
      if (factorType === 'totp') {
        const challengeResult = await challenge(factorId)
        if (challengeResult.error) {
          throw new Error(challengeResult.error.message)
        }
        challengeIdToUse = challengeResult.data?.id || ''
      }

      const result = await verify(factorId, challengeIdToUse, codeValue)

      if (result.error) {
        throw new Error(result.error.message)
      }

      // Vérifier que nous avons maintenant le bon niveau d'assurance
      const level = await getAssuranceLevel()
      if (level?.currentLevel === 'aal2') {
        toast.success('Authentification réussie')
        router.push('/')
        router.refresh()
      } else {
        throw new Error('Échec de la vérification du niveau de sécurité')
      }
    } catch (error: any) {
      setError(error.message === 'Invalid code'
        ? 'Code incorrect. Veuillez réessayer.'
        : error.message || 'Erreur lors de la vérification'
      )
      setCode(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  // Renvoyer un code (SMS/WhatsApp uniquement)
  const handleResendCode = async () => {
    if (factorType === 'totp' || resendTimer > 0) return

    try {
      setLoading(true)
      const result = await challenge(factorId)

      if (result.error) {
        throw new Error(result.error.message)
      }

      setChallengeId(result.data?.id || '')
      setResendTimer(30)
      setCode(['', '', '', '', '', ''])
      toast.success('Nouveau code envoyé')
      inputRefs.current[0]?.focus()
    } catch (error: any) {
      setError(error.message || 'Erreur lors du renvoi du code')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#082545] to-[#0F3460]">
      {/* Background decorations */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 rounded-full bg-[#2EC6F3]/8 blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-[#2EC6F3]/5 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-white/3 blur-2xl" />
      </div>

      <div className="relative z-10 w-full max-w-md mx-auto px-6">
        {/* Card principale */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 animate-fadeIn">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[#2EC6F3]/10 rounded-2xl mb-4">
              {factorType === 'totp' ? (
                <Shield className="w-8 h-8 text-[#2EC6F3]" />
              ) : (
                <Smartphone className="w-8 h-8 text-[#2EC6F3]" />
              )}
            </div>

            <h1 className="text-2xl font-bold text-[#082545] mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
              Vérification en 2 étapes
            </h1>

            <p className="text-gray-600">
              {factorType === 'totp'
                ? 'Entrez le code de votre application d\'authentification'
                : `Code envoyé au ${maskedPhone}`
              }
            </p>
          </div>

          {/* Code inputs */}
          <div className="mb-6">
            <div className="flex justify-center gap-3 mb-4">
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={el => inputRefs.current[index] = el}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-14 text-center text-2xl font-mono border-2 border-gray-200 rounded-xl focus:border-[#2EC6F3] focus:ring-0 focus:outline-none transition-colors"
                  disabled={loading}
                />
              ))}
            </div>

            {/* Erreur */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                <p className="text-red-600 text-sm font-medium">{error}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-4">
            <Button
              onClick={() => handleVerify()}
              loading={loading}
              disabled={code.some(digit => digit === '') || loading}
              className="w-full h-12 text-base font-semibold bg-[#2EC6F3] hover:bg-[#1BA8D4] disabled:opacity-50"
            >
              {loading ? 'Vérification...' : 'Vérifier'}
            </Button>

            {/* Renvoyer le code (SMS/WhatsApp uniquement) */}
            {factorType === 'phone' && (
              <div className="text-center">
                {resendTimer > 0 ? (
                  <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
                    <Clock className="w-4 h-4" />
                    <span>Renvoyer dans {resendTimer}s</span>
                  </div>
                ) : (
                  <button
                    onClick={handleResendCode}
                    disabled={loading}
                    className="text-[#2EC6F3] hover:text-[#1BA8D4] text-sm font-medium transition disabled:opacity-50"
                  >
                    Renvoyer le code
                  </button>
                )}
              </div>
            )}

            {/* Lien vers d'autres méthodes */}
            <div className="text-center pt-2">
              <button
                onClick={() => router.push('/settings/security')}
                className="text-gray-600 hover:text-gray-900 text-sm transition"
              >
                Utiliser une autre méthode
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-white/60 text-sm">
            © 2026 Dermotec Advanced — Sécurisé par Supabase MFA
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </div>
  )
}