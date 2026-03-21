'use client'

import { createClient } from '@/lib/supabase-client'

export interface Factor {
  id: string
  factor_type: 'totp' | 'phone'
  status: 'verified' | 'unverified'
  friendly_name?: string
  phone?: string
  created_at: string
  updated_at: string
}

export interface AssuranceLevel {
  currentLevel: 'aal1' | 'aal2'
  nextLevel: 'aal1' | 'aal2'
  currentAuthenticationMethods: string[]
}

export interface EnrollResponse {
  id: string
  factor_type: 'totp' | 'phone'
  totp?: {
    qr_code: string
    secret: string
    uri: string
  }
  phone?: string
}

export interface ChallengeResponse {
  id: string
  expires_at: number
}

export interface VerifyResponse {
  access_token: string
  token_type: 'bearer'
  expires_in: number
  expires_at: number
  refresh_token: string
  user: any
}

/**
 * Hook pour gérer l'authentification multi-facteurs (MFA) avec Supabase
 *
 * Supporte :
 * - TOTP (Time-based One-Time Password) - Google Authenticator, Authy, etc.
 * - Phone MFA (SMS et WhatsApp via Twilio)
 *
 * Flow d'utilisation :
 * 1. enrollTOTP() ou enrollPhone() pour enregistrer un facteur
 * 2. challenge() pour créer un challenge (demande de code)
 * 3. verify() pour vérifier le code saisi
 * 4. unenroll() pour supprimer un facteur
 */
export function useMFA() {
  const supabase = createClient()

  /**
   * Obtenir le niveau d'assurance actuel
   * @returns Promise<AssuranceLevel | null>
   */
  async function getAssuranceLevel(): Promise<AssuranceLevel | null> {
    try {
      const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()

      if (error) {
        console.error('Error getting assurance level:', error)
        return null
      }

      return data as unknown as AssuranceLevel
    } catch (error) {
      console.error('Exception getting assurance level:', error)
      return null
    }
  }

  /**
   * Lister tous les facteurs MFA enregistrés
   * @returns Promise<{totp: Factor[], phone: Factor[]} | null>
   */
  async function listFactors(): Promise<{ totp: Factor[], phone: Factor[] } | null> {
    try {
      const { data, error } = await supabase.auth.mfa.listFactors()

      if (error) {
        console.error('Error listing factors:', error)
        return null
      }

      return data || { totp: [], phone: [] }
    } catch (error) {
      console.error('Exception listing factors:', error)
      return null
    }
  }

  /**
   * Enregistrer un facteur TOTP (Time-based One-Time Password)
   * @returns Promise<{data: EnrollResponse | null, error: Error | null}>
   */
  async function enrollTOTP(): Promise<{ data: EnrollResponse | null, error: Error | null }> {
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Authenticator App'
      })

      if (error) {
        return { data: null, error }
      }

      return { data: data as unknown as EnrollResponse, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  /**
   * Enregistrer un facteur Phone (SMS ou WhatsApp)
   * @param phone - Numéro de téléphone au format international (+33...)
   * @param channel - Canal de communication ('sms' ou 'whatsapp')
   * @returns Promise<{data: EnrollResponse | null, error: Error | null}>
   */
  async function enrollPhone(
    phone: string,
    channel: 'sms' | 'whatsapp' = 'sms'
  ): Promise<{ data: EnrollResponse | null, error: Error | null }> {
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'phone',
        phone: phone,
        friendlyName: `${channel === 'sms' ? 'SMS' : 'WhatsApp'} - ${phone}`
      })

      if (error) {
        return { data: null, error }
      }

      return { data: data as unknown as EnrollResponse, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  /**
   * Créer un challenge (demande de code)
   * @param factorId - ID du facteur
   * @param channel - Canal pour Phone MFA ('sms' ou 'whatsapp')
   * @returns Promise<{data: ChallengeResponse | null, error: Error | null}>
   */
  async function challenge(
    factorId: string,
    channel?: 'sms' | 'whatsapp'
  ): Promise<{ data: ChallengeResponse | null, error: Error | null }> {
    try {
      const params: any = { factorId }

      // Pour Phone MFA, spécifier le canal
      if (channel) {
        params.channel = channel
      }

      const { data, error } = await supabase.auth.mfa.challenge(params)

      if (error) {
        return { data: null, error }
      }

      return { data: data as unknown as ChallengeResponse, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  /**
   * Vérifier un code MFA
   * @param factorId - ID du facteur
   * @param challengeId - ID du challenge
   * @param code - Code à 6 chiffres saisi par l'utilisateur
   * @returns Promise<{data: VerifyResponse | null, error: Error | null}>
   */
  async function verify(
    factorId: string,
    challengeId: string,
    code: string
  ): Promise<{ data: VerifyResponse | null, error: Error | null }> {
    try {
      const { data, error } = await supabase.auth.mfa.verify({
        factorId,
        challengeId,
        code: code.trim()
      })

      if (error) {
        return { data: null, error }
      }

      return { data: data as unknown as VerifyResponse, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  /**
   * Supprimer un facteur MFA
   * @param factorId - ID du facteur à supprimer
   * @returns Promise<{data: any | null, error: Error | null}>
   */
  async function unenroll(factorId: string): Promise<{ data: any | null, error: Error | null }> {
    try {
      const { data, error } = await supabase.auth.mfa.unenroll({ factorId })

      if (error) {
        return { data: null, error }
      }

      return { data, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  /**
   * Vérifier si MFA est requis après un login
   * @returns Promise<boolean>
   */
  async function isMFARequired(): Promise<boolean> {
    try {
      const level = await getAssuranceLevel()

      if (!level) return false

      // MFA requis si on est au niveau aal1 et que le niveau suivant est aal2
      return level.currentLevel === 'aal1' && level.nextLevel === 'aal2'
    } catch (error) {
      console.error('Error checking MFA requirement:', error)
      return false
    }
  }

  /**
   * Vérifier si l'utilisateur a activé au moins une méthode MFA
   * @returns Promise<boolean>
   */
  async function hasMFAEnabled(): Promise<boolean> {
    try {
      const factors = await listFactors()

      if (!factors) return false

      return factors.totp.length > 0 || factors.phone.length > 0
    } catch (error) {
      console.error('Error checking MFA status:', error)
      return false
    }
  }

  /**
   * Obtenir les statistiques MFA de l'utilisateur
   * @returns Promise<{totalFactors: number, totpEnabled: boolean, phoneEnabled: boolean, preferredMethod: 'totp' | 'phone' | null}>
   */
  async function getMFAStats(): Promise<{
    totalFactors: number
    totpEnabled: boolean
    phoneEnabled: boolean
    preferredMethod: 'totp' | 'phone' | null
  }> {
    try {
      const factors = await listFactors()

      if (!factors) {
        return {
          totalFactors: 0,
          totpEnabled: false,
          phoneEnabled: false,
          preferredMethod: null
        }
      }

      const totalFactors = factors.totp.length + factors.phone.length
      const totpEnabled = factors.totp.length > 0
      const phoneEnabled = factors.phone.length > 0

      // Préférence : TOTP > Phone
      let preferredMethod: 'totp' | 'phone' | null = null
      if (totpEnabled) preferredMethod = 'totp'
      else if (phoneEnabled) preferredMethod = 'phone'

      return {
        totalFactors,
        totpEnabled,
        phoneEnabled,
        preferredMethod
      }
    } catch (error) {
      console.error('Error getting MFA stats:', error)
      return {
        totalFactors: 0,
        totpEnabled: false,
        phoneEnabled: false,
        preferredMethod: null
      }
    }
  }

  return {
    // Core functions
    getAssuranceLevel,
    listFactors,
    enrollTOTP,
    enrollPhone,
    challenge,
    verify,
    unenroll,

    // Utility functions
    isMFARequired,
    hasMFAEnabled,
    getMFAStats
  }
}