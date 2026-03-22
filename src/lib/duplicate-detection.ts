// ============================================================
// CRM DERMOTEC — Détection de doublons
// Détecte les leads en double AVANT insertion.
// Matching sur : email (exact), téléphone (normalisé), nom+prénom (lowercase)
// ============================================================

import type { SupabaseClient } from '@supabase/supabase-js'

export interface DuplicateMatch {
  id: string
  prenom: string
  nom: string | null
  email: string | null
  telephone: string | null
  statut: string
  score: number           // 0-100 confiance que c'est un doublon
  match_reason: string    // ex: "Email identique", "Téléphone normalisé identique"
}

/**
 * Normalise un numéro de téléphone FR pour comparaison.
 * +33612345678, 06 12 34 56 78, 06.12.34.56.78 → 0612345678
 */
export function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/[\s.\-()]/g, '')
  // +33X → 0X
  if (cleaned.startsWith('+33')) {
    cleaned = '0' + cleaned.substring(3)
  }
  // 0033X → 0X
  if (cleaned.startsWith('0033')) {
    cleaned = '0' + cleaned.substring(4)
  }
  return cleaned
}

/**
 * Normalise un nom pour comparaison fuzzy.
 * "Jean-Pierre" → "jean pierre", "Hébert" → "hebert"
 */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // supprime les accents
    .replace(/[-_]/g, ' ')
    .trim()
}

/**
 * Détecte les doublons potentiels pour un nouveau lead.
 * Retourne les leads existants qui matchent, triés par score de confiance.
 *
 * Scores de confiance :
 * - Email identique = 100 (certain)
 * - Téléphone normalisé identique = 90 (quasi certain)
 * - Nom + Prénom identiques (normalisés) = 60 (probable)
 */
export async function detectDuplicates(
  supabase: SupabaseClient,
  data: { email?: string | null; telephone?: string | null; prenom?: string; nom?: string | null }
): Promise<DuplicateMatch[]> {
  const matches: DuplicateMatch[] = []
  const seenIds = new Set<string>()

  // 1. Match exact email (score 100)
  if (data.email) {
    const { data: emailMatches } = await supabase
      .from('leads')
      .select('id, prenom, nom, email, telephone, statut')
      .eq('email', data.email.toLowerCase())
      .limit(3)

    for (const lead of emailMatches ?? []) {
      if (!seenIds.has(lead.id)) {
        seenIds.add(lead.id)
        matches.push({
          ...lead,
          score: 100,
          match_reason: 'Email identique',
        })
      }
    }
  }

  // 2. Match téléphone normalisé (score 90)
  if (data.telephone) {
    const normalized = normalizePhone(data.telephone)
    // On cherche avec les variantes courantes
    const variants = [
      normalized,
      // +33 format
      '+33' + normalized.substring(1),
    ]

    for (const variant of variants) {
      const { data: phoneMatches } = await supabase
        .from('leads')
        .select('id, prenom, nom, email, telephone, statut')
        .ilike('telephone', `%${variant.slice(-9)}%`) // les 9 derniers chiffres
        .limit(3)

      for (const lead of phoneMatches ?? []) {
        if (!seenIds.has(lead.id) && lead.telephone) {
          const leadNorm = normalizePhone(lead.telephone)
          if (leadNorm === normalized) {
            seenIds.add(lead.id)
            matches.push({
              ...lead,
              score: 90,
              match_reason: 'Téléphone identique (normalisé)',
            })
          }
        }
      }
    }
  }

  // 3. Match nom + prénom (score 60)
  if (data.prenom && data.nom) {
    const normPrenom = normalizeName(data.prenom)
    const normNom = normalizeName(data.nom)

    const { data: nameMatches } = await supabase
      .from('leads')
      .select('id, prenom, nom, email, telephone, statut')
      .ilike('prenom', `%${normPrenom}%`)
      .ilike('nom', `%${normNom}%`)
      .limit(5)

    for (const lead of nameMatches ?? []) {
      if (!seenIds.has(lead.id)) {
        const leadPrenom = normalizeName(lead.prenom)
        const leadNom = normalizeName(lead.nom ?? '')
        if (leadPrenom === normPrenom && leadNom === normNom) {
          seenIds.add(lead.id)
          matches.push({
            ...lead,
            score: 60,
            match_reason: 'Nom + Prénom identiques',
          })
        }
      }
    }
  }

  // Trier par score décroissant
  matches.sort((a, b) => b.score - a.score)

  return matches
}
