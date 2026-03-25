// Module de calculs financiers complet pour le CRM Dermotec
// Centre de formation esthétique certifié Qualiopi

import type { OrganismeFinancement } from '@/types/formations-content'
import {
  getOrganismeById,
  getOrganismeParProfil,
  calculerFinancement,
} from '@/lib/financement-data'

// ============================================================
// SECTION 1 — CONSTANTES RÉGLEMENTAIRES
// ============================================================

// TVA
export const TVA_TAUX_NORMAL = 20
export const TVA_TAUX_REDUIT = 5.5
export const TVA_EXONERE = 0
export const TVA_REFERENCE_EXONERATION = 'Article 261-4-4° du CGI'

// Exonération TVA : l'OF ne collecte pas la TVA mais ne la récupère pas non plus
// Conséquence : redevable de la taxe sur les salaires
// Procédure : demande attestation DREETS via formulaire 3511-SD

// Délais légaux
export const DELAI_RETRACTATION_PARTICULIER = 10 // jours
export const DELAI_BPF_LIMITE = '31 mai' // Bilan Pédagogique et Financier
export const DELAI_CPF_RESTE_A_CHARGE = 102 // € en 2025 (100€ revalorisé inflation)

// Coûts moyens de référence (marché formation esthétique 2025)
export const COUTS_REFERENCE = {
  formatrice_jour: 350,      // €/jour formatrice experte
  formatrice_heure: 50,      // €/heure
  salle_jour: 150,           // €/jour location salle équipée
  materiel_stagiaire: 50,    // €/stagiaire (consommables inclus)
  administratif_dossier: 80, // €/dossier (montage, suivi, facturation)
  deplacement_km: 0.32,      // €/km (barème OPCO EP)
  repas_jour: 19,            // €/jour (barème OPCO EP)
  nuitee: 96,                // €/nuit (barème OPCO EP min)
} as const

// Seuils de rentabilité
export const SEUIL_MARGE_MINIMUM = 15 // % minimum pour être rentable
export const SEUIL_MARGE_CONFORTABLE = 30 // % objectif
export const SEUIL_MARGE_EXCELLENT = 50 // % excellent

// ============================================================
// SECTION 2 — CALCUL TVA
// ============================================================

export interface CalculTVA {
  montantHT: number
  tauxTVA: number
  montantTVA: number
  montantTTC: number
  exonere: boolean
  reference: string
  impact: string // Texte explicatif de l'impact
}

export function calculerTVA(
  montantHT: number,
  exonere: boolean = true,
  tauxTVA: number = TVA_TAUX_NORMAL
): CalculTVA {
  const montantTVA = exonere ? 0 : (montantHT * tauxTVA / 100)
  const montantTTC = montantHT + montantTVA

  const impact = exonere
    ? "Exonéré TVA (261-4-4°). L'OF ne collecte pas la TVA mais ne peut pas la récupérer sur ses achats. Redevable de la taxe sur les salaires."
    : "TVA collectée à 20%. L'OF peut récupérer la TVA sur ses achats."

  const reference = exonere ? TVA_REFERENCE_EXONERATION : `Article 256 du CGI - Taux ${tauxTVA}%`

  return {
    montantHT,
    tauxTVA: exonere ? 0 : tauxTVA,
    montantTVA,
    montantTTC,
    exonere,
    reference,
    impact,
  }
}

// ============================================================
// SECTION 3 — CALCUL COÛTS FORMATION
// ============================================================

export interface CoutsFormation {
  formatrice: number
  salle: number
  materiel: number
  consommables: number
  deplacement: number
  restauration: number
  administratif: number
  autres: number
  autresDetail?: string
  total: number
  parJour: number
  parHeure: number
  parStagiaire: number
}

export function calculerCoutsFormation(params: {
  dureeJours: number
  dureeHeures: number
  nbStagiaires: number
  coutFormatriceJour?: number      // défaut COUTS_REFERENCE.formatrice_jour
  coutSalleJour?: number           // défaut COUTS_REFERENCE.salle_jour
  coutMaterielStagiaire?: number   // défaut COUTS_REFERENCE.materiel_stagiaire
  coutConsommablesStagiaire?: number
  coutDeplacement?: number
  coutRestauration?: number
  coutAdministratif?: number       // défaut COUTS_REFERENCE.administratif_dossier
  coutAutres?: number
  coutAutresDetail?: string
}): CoutsFormation {
  const {
    dureeJours,
    dureeHeures,
    nbStagiaires,
    coutFormatriceJour = COUTS_REFERENCE.formatrice_jour,
    coutSalleJour = COUTS_REFERENCE.salle_jour,
    coutMaterielStagiaire = COUTS_REFERENCE.materiel_stagiaire,
    coutConsommablesStagiaire = 0,
    coutDeplacement = 0,
    coutRestauration = 0,
    coutAdministratif = COUTS_REFERENCE.administratif_dossier,
    coutAutres = 0,
    coutAutresDetail,
  } = params

  const formatrice = coutFormatriceJour * dureeJours
  const salle = coutSalleJour * dureeJours
  const materiel = coutMaterielStagiaire * nbStagiaires
  const consommables = coutConsommablesStagiaire * nbStagiaires
  const deplacement = coutDeplacement
  const restauration = coutRestauration
  const administratif = coutAdministratif * nbStagiaires
  const autres = coutAutres

  const total = formatrice + salle + materiel + consommables + deplacement + restauration + administratif + autres
  const parJour = total / dureeJours
  const parHeure = total / dureeHeures
  const parStagiaire = total / nbStagiaires

  return {
    formatrice,
    salle,
    materiel,
    consommables,
    deplacement,
    restauration,
    administratif,
    autres,
    autresDetail: coutAutresDetail,
    total,
    parJour,
    parHeure,
    parStagiaire,
  }
}

// ============================================================
// SECTION 4 — CALCUL MARGE
// ============================================================

export interface CalculMarge {
  revenus: number          // montant facturé (HT)
  couts: number            // coût total
  margeNette: number       // revenus - couts
  tauxMarge: number        // (marge / revenus) * 100
  rentable: boolean        // taux >= SEUIL_MARGE_MINIMUM
  niveau: 'deficit' | 'faible' | 'correct' | 'bon' | 'excellent'
  recommandation: string   // texte conseil
  seuilRentabilite: number // nb stagiaires minimum pour être rentable
}

export function calculerMarge(
  revenus: number,
  couts: CoutsFormation,
  nbStagiaires: number
): CalculMarge {
  const margeNette = revenus - couts.total
  const tauxMarge = revenus > 0 ? (margeNette / revenus) * 100 : 0
  const rentable = tauxMarge >= SEUIL_MARGE_MINIMUM

  let niveau: 'deficit' | 'faible' | 'correct' | 'bon' | 'excellent'
  let recommandation: string

  if (tauxMarge < 0) {
    niveau = 'deficit'
    recommandation = 'Formation déficitaire. Revoir le prix de vente ou réduire les coûts.'
  } else if (tauxMarge < SEUIL_MARGE_MINIMUM) {
    niveau = 'faible'
    recommandation = 'Marge insuffisante. Augmenter le prix ou optimiser les coûts opérationnels.'
  } else if (tauxMarge < SEUIL_MARGE_CONFORTABLE) {
    niveau = 'correct'
    recommandation = 'Marge correcte. Rechercher des optimisations pour améliorer la rentabilité.'
  } else if (tauxMarge < SEUIL_MARGE_EXCELLENT) {
    niveau = 'bon'
    recommandation = 'Bonne rentabilité. Maintenir ce niveau et dupliquer sur d\'autres formations.'
  } else {
    niveau = 'excellent'
    recommandation = 'Excellente rentabilité. Modèle économique optimal à préserver.'
  }

  // Calcul seuil de rentabilité
  const prixParStagiaire = revenus / nbStagiaires
  const seuilRentabilite = prixParStagiaire > 0 ? Math.ceil(couts.total / prixParStagiaire) : 0

  return {
    revenus,
    couts: couts.total,
    margeNette,
    tauxMarge,
    rentable,
    niveau,
    recommandation,
    seuilRentabilite,
  }
}

// ============================================================
// SECTION 5 — MULTI-FINANCEMENT
// ============================================================

export interface LigneFinancement {
  organismeId: string
  organismeNom: string
  montantDemande: number
  montantAccorde?: number
  statut: 'PREPARATION' | 'SOUMIS' | 'VALIDE' | 'REFUSE'
  priorite: number // ordre de sollicitation
}

export interface CalculMultiFinancement {
  montantTotal: number           // coût total formation
  lignes: LigneFinancement[]
  totalDemande: number
  totalAccorde: number
  resteACharge: number
  tauxCouverture: number         // % couvert
  couvertureComplete: boolean    // reste à charge = 0
  strategie: string              // explication de la stratégie de montage
  alertes: string[]              // avertissements (cumul interdit, plafond dépassé, etc.)
}

export function calculerMultiFinancement(
  montantTotal: number,
  lignes: LigneFinancement[]
): CalculMultiFinancement {
  const totalDemande = lignes.reduce((sum, ligne) => sum + ligne.montantDemande, 0)
  const totalAccorde = lignes.reduce((sum, ligne) => sum + (ligne.montantAccorde || 0), 0)
  const resteACharge = Math.max(0, montantTotal - totalAccorde)
  const tauxCouverture = montantTotal > 0 ? (totalAccorde / montantTotal) * 100 : 0
  const couvertureComplete = resteACharge === 0

  const alertes: string[] = []

  // Alerte si cumul demandé dépasse le montant total
  if (totalDemande > montantTotal) {
    alertes.push(`Le cumul des demandes (${formatMontant(totalDemande)}) dépasse le coût de la formation (${formatMontant(montantTotal)})`)
  }

  // Alerte si cumul accordé dépasse le montant total
  if (totalAccorde > montantTotal) {
    alertes.push(`ATTENTION: Le cumul accordé (${formatMontant(totalAccorde)}) dépasse le coût réel. Risque de trop-perçu.`)
  }

  // Vérifier la compatibilité des organismes
  const organismeIds = lignes.map(l => l.organismeId)
  const compatibilite = verifierCompatibiliteCumul(organismeIds)
  if (!compatibilite.compatible) {
    alertes.push(...compatibilite.alertes)
  }

  // Stratégie de montage
  let strategie = 'Stratégie de montage multi-financeurs : '
  if (lignes.length === 1) {
    strategie += 'Financement unique.'
  } else if (lignes.length === 2) {
    strategie += 'Stratégie complémentaire avec 2 organismes.'
  } else {
    strategie += `Montage complexe avec ${lignes.length} organismes. Vérifier la compatibilité.`
  }

  // Tri par priorité
  const lignesTriees = [...lignes].sort((a, b) => a.priorite - b.priorite)

  return {
    montantTotal,
    lignes: lignesTriees,
    totalDemande,
    totalAccorde,
    resteACharge,
    tauxCouverture,
    couvertureComplete,
    strategie,
    alertes,
  }
}

// ============================================================
// SECTION 6 — SIMULATEUR COMPLET
// ============================================================

export interface SimulationFinancement {
  profil: string
  formation: { nom: string; duree: string; prix: number }
  organismesRecommandes: Array<{
    organisme: OrganismeFinancement
    montantEstime: number
    couverture: number // %
    resteACharge: number
    dureeTraitement: string
    probabiliteAcceptation: string
  }>
  strategieOptimale: {
    description: string
    lignes: LigneFinancement[]
    resteACharge: number
    dureeEstimee: string
  }
  alternatives: string[]
  couts: CoutsFormation
  marge: CalculMarge
  tva: CalculTVA
}

export function simulerFinancementComplet(params: {
  profil: 'salarie' | 'independant' | 'liberal' | 'demandeur-emploi' | 'apprenti'
  montantFormation: number
  dureeHeures: number
  dureeJours: number
  nbStagiaires?: number
  coutFormatriceJour?: number
  coutSalleJour?: number
  exonereTVA?: boolean
}): SimulationFinancement {
  const {
    profil,
    montantFormation,
    dureeHeures,
    dureeJours,
    nbStagiaires = 1,
    coutFormatriceJour,
    coutSalleJour,
    exonereTVA = true,
  } = params

  // Calculs de base
  const couts = calculerCoutsFormation({
    dureeJours,
    dureeHeures,
    nbStagiaires,
    coutFormatriceJour,
    coutSalleJour,
  })

  const tva = calculerTVA(montantFormation, exonereTVA)

  const marge = calculerMarge(montantFormation, couts, nbStagiaires)

  // Organismes recommandés pour ce profil
  const organismesCompatibles = getOrganismeParProfil(profil)

  const organismesRecommandes = organismesCompatibles.map(organisme => {
    const calcul = calculerFinancement(montantFormation, organisme.id, dureeHeures)
    const couverture = montantFormation > 0 ? (calcul.montantPrisEnCharge / montantFormation) * 100 : 0

    return {
      organisme,
      montantEstime: calcul.montantPrisEnCharge,
      couverture,
      resteACharge: calcul.resteACharge,
      dureeTraitement: organisme.delaiTraitement,
      probabiliteAcceptation: organisme.tauxAcceptation,
    }
  }).sort((a, b) => b.montantEstime - a.montantEstime) // Tri par montant décroissant

  // Stratégie optimale
  let strategieOptimale: SimulationFinancement['strategieOptimale']

  if (organismesRecommandes.length === 0) {
    strategieOptimale = {
      description: 'Aucun organisme de financement identifié pour ce profil.',
      lignes: [],
      resteACharge: montantFormation,
      dureeEstimee: 'N/A',
    }
  } else if (organismesRecommandes[0].montantEstime >= montantFormation) {
    // Un seul organisme suffit
    const meilleur = organismesRecommandes[0]
    strategieOptimale = {
      description: `Financement intégral via ${meilleur.organisme.sigle}`,
      lignes: [{
        organismeId: meilleur.organisme.id,
        organismeNom: meilleur.organisme.nom,
        montantDemande: montantFormation,
        montantAccorde: meilleur.montantEstime,
        statut: 'PREPARATION',
        priorite: 1,
      }],
      resteACharge: Math.max(0, montantFormation - meilleur.montantEstime),
      dureeEstimee: meilleur.dureeTraitement,
    }
  } else {
    // Combiner plusieurs organismes
    const lignes: LigneFinancement[] = []
    let restant = montantFormation
    let priorite = 1

    for (const recommandation of organismesRecommandes.slice(0, 3)) { // Max 3 organismes
      if (restant <= 0) break

      const montantDemande = Math.min(recommandation.montantEstime, restant)
      lignes.push({
        organismeId: recommandation.organisme.id,
        organismeNom: recommandation.organisme.nom,
        montantDemande,
        montantAccorde: montantDemande,
        statut: 'PREPARATION',
        priorite,
      })

      restant -= montantDemande
      priorite++
    }

    strategieOptimale = {
      description: `Montage multi-financeurs : ${lignes.map(l => getOrganismeById(l.organismeId)?.sigle).join(' + ')}`,
      lignes,
      resteACharge: restant,
      dureeEstimee: estimerDelai(lignes),
    }
  }

  // Alternatives
  const alternatives: string[] = []

  if (strategieOptimale.resteACharge > 0) {
    alternatives.push(`Paiement échelonné sans frais pour le reste à charge (${formatMontant(strategieOptimale.resteACharge)})`)
    alternatives.push('Recherche d\'un abondement employeur pour exonération CPF 100€')

    if (profil === 'salarie') {
      alternatives.push('Demande de congé formation ou DIF portable si disponible')
    }

    if (dureeHeures >= 40) {
      alternatives.push('Candidature PTP pour formations longues avec maintien de salaire')
    }
  }

  if (organismesRecommandes.length > 3) {
    alternatives.push('Exploration d\'organismes sectoriels spécialisés')
  }

  return {
    profil,
    formation: {
      nom: 'Formation esthétique',
      duree: `${dureeJours} jour(s) - ${dureeHeures}h`,
      prix: montantFormation,
    },
    organismesRecommandes,
    strategieOptimale,
    alternatives,
    couts,
    marge,
    tva,
  }
}

// ============================================================
// SECTION 7 — RAPPORT FINANCIER
// ============================================================

export interface RapportFinancier {
  titre: string
  date: string
  sections: Array<{
    titre: string
    contenu: string
    montant?: number
    alerte?: boolean
  }>
  totaux: {
    revenus: number
    couts: number
    marge: number
    tauxMarge: number
    tva: number
  }
}

export function genererRapportFinancier(params: {
  formation: string
  nbStagiaires: number
  montantParStagiaire: number
  couts: CoutsFormation
  tva: CalculTVA
  financements: LigneFinancement[]
}): RapportFinancier {
  const { formation, nbStagiaires, montantParStagiaire, couts, tva, financements } = params
  const revenus = nbStagiaires * montantParStagiaire
  const marge = calculerMarge(revenus, couts, nbStagiaires)

  const sections = [
    {
      titre: 'Informations générales',
      contenu: `Formation: ${formation}\nNombre de stagiaires: ${nbStagiaires}\nPrix par stagiaire: ${formatMontant(montantParStagiaire)}`,
    },
    {
      titre: 'Analyse des coûts',
      contenu: `Formatrice: ${formatMontant(couts.formatrice)}\nSalle: ${formatMontant(couts.salle)}\nMatériel: ${formatMontant(couts.materiel)}\nAdministratif: ${formatMontant(couts.administratif)}`,
      montant: couts.total,
    },
    {
      titre: 'Revenus et rentabilité',
      contenu: `Revenus totaux: ${formatMontant(revenus)}\nMarge nette: ${formatMontant(marge.margeNette)}\nTaux de marge: ${marge.tauxMarge.toFixed(1)}%`,
      montant: revenus,
      alerte: !marge.rentable,
    },
    {
      titre: 'Fiscalité',
      contenu: tva.impact,
      montant: tva.montantTVA,
    },
  ]

  if (financements.length > 0) {
    const multiFinancement = calculerMultiFinancement(revenus, financements)
    sections.push({
      titre: 'Financement',
      contenu: `${financements.length} organisme(s) sollicité(s)\nCouverture: ${multiFinancement.tauxCouverture.toFixed(1)}%\nReste à charge: ${formatMontant(multiFinancement.resteACharge)}`,
      montant: multiFinancement.totalAccorde,
      alerte: multiFinancement.alertes.length > 0,
    })
  }

  sections.push({
    titre: 'Recommandations',
    contenu: marge.recommandation,
    montant: 0,
    alerte: marge.niveau === 'deficit' || marge.niveau === 'faible',
  })

  return {
    titre: `Rapport financier - ${formation}`,
    date: new Date().toLocaleDateString('fr-FR'),
    sections,
    totaux: {
      revenus,
      couts: couts.total,
      marge: marge.margeNette,
      tauxMarge: marge.tauxMarge,
      tva: tva.montantTVA,
    },
  }
}

// ============================================================
// SECTION 8 — UTILITAIRES
// ============================================================

// Formater un montant en euros
export function formatMontant(montant: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(montant)
}

// Calculer le prix par heure pour un organisme
export function prixParHeure(montantTotal: number, dureeHeures: number): number {
  return dureeHeures > 0 ? montantTotal / dureeHeures : 0
}

// Vérifier si un montant est dans les limites d'un organisme
export function verifierPlafond(
  montant: number,
  organismeId: string,
  dureeHeures: number
): {
  dansLimite: boolean
  plafond: number
  depassement: number
  conseil: string
} {
  const organisme = getOrganismeById(organismeId)

  if (!organisme) {
    return {
      dansLimite: false,
      plafond: 0,
      depassement: montant,
      conseil: 'Organisme non trouvé',
    }
  }

  let plafond = 0
  let conseil = ''

  switch (organismeId) {
    case 'opco-ep':
      plafond = organisme.plafondAnnuel.max
      conseil = plafond < montant
        ? `Dépasse le plafond annuel OPCO EP. Compléter avec CPF ou paiement direct.`
        : `Dans les limites OPCO EP.`
      break

    case 'fafcea':
      plafond = Math.min(dureeHeures, 100) * organisme.tauxHoraire.technique // Max 100h/an
      conseil = plafond < montant
        ? `Dépasse les 100h annuelles FAFCEA. Orienter vers du transverse (gestion) ou CPF.`
        : `Compatible avec les droits FAFCEA.`
      break

    case 'fifpl':
      plafond = organisme.plafondAnnuel.max
      conseil = plafond < montant
        ? `Dépasse le plafond FIFPL. Compléter obligatoirement avec CPF.`
        : `Dans les limites FIFPL.`
      break

    case 'cpf':
      plafond = 5000 // Max théorique
      conseil = `Dépend des droits acquis. Reste à charge ${DELAI_CPF_RESTE_A_CHARGE}€ sauf abondement.`
      break

    case 'france-travail-aif':
      plafond = organisme.plafondAnnuel.max
      conseil = plafond < montant
        ? `Dépasse les capacités AIF. Combiner avec CPF obligatoire.`
        : `Compatible AIF comme complément CPF.`
      break

    default:
      plafond = organisme.plafondAnnuel?.max || 0
      conseil = 'Vérifier manuellement les conditions spécifiques.'
  }

  const dansLimite = montant <= plafond
  const depassement = Math.max(0, montant - plafond)

  return {
    dansLimite,
    plafond,
    depassement,
    conseil,
  }
}

// Estimer le délai total d'un montage financier
export function estimerDelai(lignes: LigneFinancement[]): string {
  if (lignes.length === 0) return 'N/A'

  const organismes = lignes.map(l => getOrganismeById(l.organismeId)).filter(Boolean) as OrganismeFinancement[]

  // Prendre le délai le plus long (goulot d'étranglement)
  const delais = organismes.map(org => {
    const match = org.delaiTraitement.match(/(\d+)/);
    return match ? parseInt(match[1]) : 4; // Défaut 4 semaines
  })

  const delaiMax = Math.max(...delais)

  if (lignes.length === 1) {
    return `${delaiMax} semaines`
  } else {
    // Montage séquentiel = somme, parallèle = max
    const delaiTotal = lignes.length <= 2 ? delaiMax : delaiMax + 2 // +2 semaines si >2 organismes
    return `${delaiTotal} semaines (montage multi-financeurs)`
  }
}

// Vérifier la compatibilité de cumul entre organismes
export function verifierCompatibiliteCumul(organismeIds: string[]): {
  compatible: boolean
  alertes: string[]
} {
  const alertes: string[] = []
  let compatible = true

  // Règles de cumul spécifiques
  const hasOpcoEP = organismeIds.includes('opco-ep')
  const hasAkto = organismeIds.includes('akto')
  const hasFafcea = organismeIds.includes('fafcea')
  const hasFifpl = organismeIds.includes('fifpl')
  const hasCPF = organismeIds.includes('cpf')
  const hasAIF = organismeIds.includes('france-travail-aif')

  // OPCO EP + AKTO = conflit (même personne ne peut pas dépendre des 2)
  if (hasOpcoEP && hasAkto) {
    compatible = false
    alertes.push('CONFLIT: Une personne ne peut pas dépendre à la fois d\'OPCO EP et AKTO')
  }

  // FAFCEA + FIFPL = conflit (artisan vs libéral)
  if (hasFafcea && hasFifpl) {
    compatible = false
    alertes.push('CONFLIT: FAFCEA (artisan) et FIFPL (libéral) sont exclusifs')
  }

  // CPF + AIF = cumul autorisé et recommandé
  if (hasCPF && hasAIF) {
    alertes.push('CUMUL OPTIMAL: CPF + AIF recommandé pour demandeurs d\'emploi')
  }

  // Plus de 3 organismes = complexité excessive
  if (organismeIds.length > 3) {
    alertes.push('ATTENTION: Montage avec >3 organismes très complexe, risque de refus')
  }

  // Cumul employeur (OPCO) + travailleur indépendant impossible
  if ((hasOpcoEP || hasAkto) && (hasFafcea || hasFifpl)) {
    compatible = false
    alertes.push('CONFLIT: Impossible de cumuler financement salarié et indépendant pour la même personne')
  }

  return { compatible, alertes }
}

// ============================================================
// FONCTIONS D'ANALYSE AVANCÉE
// ============================================================

// Analyser la viabilité économique d'une formation
export function analyserViabiliteFormation(params: {
  prixVente: number
  coutProduction: number
  demandePrevue: number // nb stagiaires/an
  concurrence: number // nb formations similaires
  difficulteRecrutement: 'facile' | 'moyen' | 'difficile'
}): {
  score: number // 0-100
  recommandation: string
  facteursCritiques: string[]
} {
  const { prixVente, coutProduction, demandePrevue, concurrence, difficulteRecrutement } = params

  let score = 50 // Base neutre

  // Analyse marge
  const marge = calculerMarge(prixVente, { total: coutProduction } as CoutsFormation, 1)
  if (marge.tauxMarge > SEUIL_MARGE_EXCELLENT) score += 30
  else if (marge.tauxMarge > SEUIL_MARGE_CONFORTABLE) score += 20
  else if (marge.tauxMarge > SEUIL_MARGE_MINIMUM) score += 10
  else score -= 20

  // Analyse demande
  if (demandePrevue >= 50) score += 20 // Très forte demande
  else if (demandePrevue >= 20) score += 10 // Bonne demande
  else if (demandePrevue >= 10) score += 5 // Demande correcte
  else score -= 15 // Demande faible

  // Analyse concurrence
  if (concurrence <= 2) score += 15 // Peu de concurrence
  else if (concurrence <= 5) score += 5 // Concurrence modérée
  else if (concurrence <= 10) score -= 5 // Concurrence forte
  else score -= 15 // Marché saturé

  // Difficulté recrutement formateurs
  const difficulteScore = { facile: 10, moyen: 0, difficile: -10 }
  score += difficulteScore[difficulteRecrutement]

  score = Math.max(0, Math.min(100, score)) // Borner entre 0 et 100

  const facteursCritiques: string[] = []
  let recommandation = ''

  if (marge.tauxMarge < SEUIL_MARGE_MINIMUM) {
    facteursCritiques.push('Marge insuffisante')
  }
  if (demandePrevue < 10) {
    facteursCritiques.push('Demande trop faible')
  }
  if (concurrence > 10) {
    facteursCritiques.push('Marché saturé')
  }
  if (difficulteRecrutement === 'difficile') {
    facteursCritiques.push('Recrutement formateurs difficile')
  }

  if (score >= 80) {
    recommandation = 'LANCER: Formation très viable, tous voyants au vert.'
  } else if (score >= 60) {
    recommandation = 'VALIDER: Formation viable avec quelques optimisations.'
  } else if (score >= 40) {
    recommandation = 'PRUDENCE: Revoir le modèle économique avant lancement.'
  } else {
    recommandation = 'REJETER: Formation non viable en l\'état.'
  }

  return { score, recommandation, facteursCritiques }
}

// Calculer l'impact fiscal complet pour un organisme de formation
export function calculerImpactFiscal(params: {
  chiffreAffaires: number
  coutsSalaireFormateurs: number
  coutsFonctionnement: number
  exonereTVA: boolean
  nbSalaries: number
}): {
  resultatAvantImpot: number
  impotSocietes: number // ou IR si micro
  taxeSalaires: number // si exonéré TVA
  contributionFormation: number // 1% ou 0.55%
  resultatNet: number
  tauxImpositionReel: number
  conseils: string[]
} {
  const { chiffreAffaires, coutsSalaireFormateurs, coutsFonctionnement, exonereTVA, nbSalaries } = params

  const resultatAvantImpot = chiffreAffaires - coutsSalaireFormateurs - coutsFonctionnement

  // Impôt sur les sociétés (15% jusqu'à 42 500€, puis 25%)
  let impotSocietes = 0
  if (resultatAvantImpot > 0) {
    const tranche1 = Math.min(resultatAvantImpot, 42500)
    const tranche2 = Math.max(0, resultatAvantImpot - 42500)
    impotSocietes = tranche1 * 0.15 + tranche2 * 0.25
  }

  // Taxe sur les salaires si exonéré TVA
  const taxeSalaires = exonereTVA ? coutsSalaireFormateurs * 0.135 : 0 // 13.5% en moyenne

  // Contribution formation professionnelle
  const tauxContribution = nbSalaries >= 11 ? 0.01 : 0.0055 // 1% ou 0.55%
  const contributionFormation = coutsSalaireFormateurs * tauxContribution

  const resultatNet = resultatAvantImpot - impotSocietes - taxeSalaires - contributionFormation
  const tauxImpositionReel = resultatAvantImpot > 0
    ? ((impotSocietes + taxeSalaires + contributionFormation) / resultatAvantImpot) * 100
    : 0

  const conseils: string[] = []

  if (exonereTVA && taxeSalaires > 0) {
    conseils.push(`Exonération TVA génère ${formatMontant(taxeSalaires)} de taxe sur salaires`)
  }

  if (tauxImpositionReel > 35) {
    conseils.push('Taux d\'imposition élevé, optimiser via investissements déductibles')
  }

  if (nbSalaries >= 10) {
    conseils.push('Seuil 11 salariés atteint: contribution formation passe à 1%')
  }

  return {
    resultatAvantImpot,
    impotSocietes,
    taxeSalaires,
    contributionFormation,
    resultatNet,
    tauxImpositionReel,
    conseils,
  }
}