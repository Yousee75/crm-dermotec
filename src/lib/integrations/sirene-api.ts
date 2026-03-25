// ============================================================
// CRM DERMOTEC — API SIRENE (vérification SIRET/SIREN)
// Utilise entreprise.data.gouv.fr (GRATUIT, pas de clé API)
// ============================================================

export interface EntrepriseSirene {
  siret: string
  siren: string
  nom: string
  nom_commercial?: string
  forme_juridique?: string
  code_naf: string
  libelle_naf: string
  adresse: string
  code_postal: string
  ville: string
  date_creation: string
  tranche_effectifs?: string
  etat_administratif: 'A' | 'F' // A=Actif, F=Fermé
  is_active: boolean
}

interface SireneAPIResponse {
  etablissement?: {
    siret: string
    siren: string
    unite_legale: {
      denomination?: string
      nom?: string
      prenom_1?: string
      categorie_juridique?: string
      activite_principale?: string
      tranche_effectifs?: string
      date_creation?: string
      etat_administratif?: string
    }
    adresse_etablissement: {
      numero_voie?: string
      type_voie?: string
      libelle_voie?: string
      code_postal?: string
      libelle_commune?: string
    }
    etat_administratif?: string
    date_creation?: string
  }
}

/**
 * Vérifie un SIRET via l'API entreprise.data.gouv.fr
 * GRATUIT — pas de clé API requise — pas de limite connue
 */
export async function verifySIRET(siret: string): Promise<{
  valid: boolean
  entreprise?: EntrepriseSirene
  error?: string
}> {
  // Nettoyer le SIRET
  const cleaned = siret.replace(/\s/g, '')
  if (!/^\d{14}$/.test(cleaned)) {
    return { valid: false, error: 'Format SIRET invalide (14 chiffres requis)' }
  }

  try {
    const response = await fetch(
      `https://entreprise.data.gouv.fr/api/sirene/v3/etablissements/${cleaned}`,
      {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(10000), // 10s timeout
      }
    )

    if (response.status === 404) {
      return { valid: false, error: 'SIRET introuvable dans la base SIRENE' }
    }

    if (!response.ok) {
      return { valid: false, error: `Erreur API SIRENE (${response.status})` }
    }

    const data: SireneAPIResponse = await response.json()
    const etab = data.etablissement

    if (!etab) {
      return { valid: false, error: 'Données établissement manquantes' }
    }

    const ul = etab.unite_legale
    const adr = etab.adresse_etablissement

    const nom = ul.denomination
      || [ul.prenom_1, ul.nom].filter(Boolean).join(' ')
      || 'Inconnu'

    const adresseParts = [
      adr.numero_voie,
      adr.type_voie,
      adr.libelle_voie,
    ].filter(Boolean).join(' ')

    const entreprise: EntrepriseSirene = {
      siret: etab.siret,
      siren: etab.siren,
      nom,
      forme_juridique: ul.categorie_juridique,
      code_naf: ul.activite_principale || '',
      libelle_naf: '', // API ne retourne pas le libellé
      adresse: adresseParts,
      code_postal: adr.code_postal || '',
      ville: adr.libelle_commune || '',
      date_creation: ul.date_creation || etab.date_creation || '',
      tranche_effectifs: ul.tranche_effectifs,
      etat_administratif: (etab.etat_administratif || ul.etat_administratif) === 'A' ? 'A' : 'F',
      is_active: (etab.etat_administratif || ul.etat_administratif) === 'A',
    }

    return { valid: true, entreprise }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return { valid: false, error: 'Timeout API SIRENE (10s)' }
    }
    return { valid: false, error: `Erreur réseau : ${error instanceof Error ? error.message : 'inconnu'}` }
  }
}

/**
 * Vérifie un SIREN (9 chiffres) — extrait le SIRET du siège
 */
export async function verifySIREN(siren: string): Promise<{
  valid: boolean
  entreprise?: EntrepriseSirene
  error?: string
}> {
  const cleaned = siren.replace(/\s/g, '')
  if (!/^\d{9}$/.test(cleaned)) {
    return { valid: false, error: 'Format SIREN invalide (9 chiffres requis)' }
  }

  try {
    const response = await fetch(
      `https://entreprise.data.gouv.fr/api/sirene/v3/unites_legales/${cleaned}`,
      {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(10000),
      }
    )

    if (response.status === 404) {
      return { valid: false, error: 'SIREN introuvable' }
    }

    if (!response.ok) {
      return { valid: false, error: `Erreur API (${response.status})` }
    }

    const data = await response.json()
    const ul = data.unite_legale

    if (!ul) {
      return { valid: false, error: 'Données entreprise manquantes' }
    }

    // Chercher l'établissement siège
    const siege = ul.etablissement_siege
    const nom = ul.denomination || [ul.prenom_1, ul.nom].filter(Boolean).join(' ') || 'Inconnu'

    return {
      valid: true,
      entreprise: {
        siret: siege?.siret || `${cleaned}00000`,
        siren: cleaned,
        nom,
        forme_juridique: ul.categorie_juridique,
        code_naf: ul.activite_principale || '',
        libelle_naf: '',
        adresse: '',
        code_postal: '',
        ville: '',
        date_creation: ul.date_creation || '',
        tranche_effectifs: ul.tranche_effectifs,
        etat_administratif: ul.etat_administratif === 'A' ? 'A' : 'F',
        is_active: ul.etat_administratif === 'A',
      },
    }
  } catch {
    return { valid: false, error: 'Erreur réseau API SIRENE' }
  }
}

/**
 * Détermine l'OPCO probable à partir du code NAF
 * (Mapping simplifié — les vrais mappings sont complexes)
 */
export function getOPCOFromNAF(codeNAF: string): string | null {
  const nafPrefix = codeNAF.substring(0, 2)

  const mapping: Record<string, string> = {
    '96': 'OPCO_EP',     // Coiffure, soins beauté
    '86': 'OPCO_EP',     // Santé
    '47': 'OPCO_EP',     // Commerce détail
    '56': 'AKTO',        // Restauration
    '55': 'AKTO',        // Hébergement
    '79': 'AKTO',        // Agences voyage
    '62': 'ATLAS',       // Informatique
    '69': 'ATLAS',       // Comptabilité, juridique
    '70': 'ATLAS',       // Conseil
    '85': 'AKTO',        // Enseignement
    '88': 'UNIFORMATION', // Action sociale
    '41': 'CONSTRUCTYS', // Construction
    '43': 'CONSTRUCTYS', // Travaux spécialisés
  }

  return mapping[nafPrefix] || null
}
