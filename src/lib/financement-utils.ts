// ============================================================
// CRM DERMOTEC — Utilitaires financement enrichis
// ============================================================

import type {
  FinancementEnrichi,
  CoutFormation,
  CalculMarge,
  CalculTVA,
  FinancementLigne,
  EligibiliteFinancement,
  ProfilFinancement,
  OrganismeParametres
} from '@/types'

// ============================================================
// CALCULS TVA
// ============================================================

export function calculerTVA(montantHT: number, tauxTVA: number): CalculTVA {
  const montantTVA = montantHT * (tauxTVA / 100)
  const montantTTC = montantHT + montantTVA

  return {
    tva_applicable: tauxTVA > 0,
    taux_tva: tauxTVA,
    montant_ht: montantHT,
    montant_ttc: montantTTC,
    montant_tva: montantTVA,
    exoneration_tva_reference: tauxTVA === 0 ? 'Article 261-4-4° du CGI' : ''
  }
}

export function obtenirTauxTVAFormation(codeFormation: string, annee = new Date().getFullYear()): number {
  // Formations professionnelles = exonérées TVA (sauf exceptions)
  const formationsAssujetties = ['formation-continue-entreprise']

  if (formationsAssujetties.includes(codeFormation)) {
    return 20 // TVA normale pour formation continue entreprise
  }

  return 0 // Exonération formation professionnelle
}

// ============================================================
// CALCULS COÛTS & MARGE
// ============================================================

export function calculerCoutTotal(couts: Partial<CoutFormation>): number {
  return (
    (couts.cout_formatrice || 0) +
    (couts.cout_salle || 0) +
    (couts.cout_materiel || 0) +
    (couts.cout_consommables || 0) +
    (couts.cout_deplacement || 0) +
    (couts.cout_restauration || 0) +
    (couts.cout_administratif || 0) +
    (couts.cout_autres || 0)
  )
}

export function calculerMarge(montantAccorde: number, coutTotal: number): CalculMarge {
  const margeNette = montantAccorde - coutTotal
  const tauxMarge = montantAccorde > 0 ? (margeNette / montantAccorde) * 100 : 0

  return {
    marge_nette: margeNette,
    taux_marge: tauxMarge,
    ca_net: montantAccorde,
    benefice_brut: margeNette,
    rentabilite_pct: tauxMarge
  }
}

// ============================================================
// GESTION MULTI-FINANCEMENT
// ============================================================

export function calculerRepartitionOptimale(
  coutFormation: number,
  organismesEligibles: EligibiliteFinancement[]
): FinancementLigne[] {
  // Trier par montant max possible décroissant
  const organismesTriés = [...organismesEligibles]
    .filter(o => o.eligible)
    .sort((a, b) => b.montant_max_possible - a.montant_max_possible)

  const lignes: Partial<FinancementLigne>[] = []
  let resteAFinancer = coutFormation

  for (const organisme of organismesTriés) {
    if (resteAFinancer <= 0) break

    const montantPourCetOrganisme = Math.min(
      resteAFinancer,
      organisme.montant_max_possible
    )

    if (montantPourCetOrganisme >= 200) { // Montant minimum par ligne
      lignes.push({
        organisme_id: organisme.organisme_id,
        organisme_nom: organisme.organisme_nom,
        montant_demande: montantPourCetOrganisme,
        statut: 'PREPARATION'
      })

      resteAFinancer -= montantPourCetOrganisme
    }
  }

  return lignes.map(ligne => ({
    id: crypto.randomUUID(),
    financement_id: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...ligne
  })) as FinancementLigne[]
}

export function calculerStatutMultiFinancement(lignes: FinancementLigne[]) {
  const totaux = lignes.reduce(
    (acc, ligne) => ({
      demande: acc.demande + ligne.montant_demande,
      accorde: acc.accorde + (ligne.montant_accorde || 0),
      nbValides: acc.nbValides + (ligne.statut === 'VALIDE' ? 1 : 0),
      nbRefuses: acc.nbRefuses + (ligne.statut === 'REFUSE' ? 1 : 0),
      nbEnCours: acc.nbEnCours + (['SOUMIS', 'EN_EXAMEN'].includes(ligne.statut) ? 1 : 0)
    }),
    { demande: 0, accorde: 0, nbValides: 0, nbRefuses: 0, nbEnCours: 0 }
  )

  let statutGlobal: 'EN_COURS' | 'PARTIELLEMENT_VALIDE' | 'ENTIEREMENT_VALIDE' | 'REFUSE' = 'EN_COURS'

  if (totaux.nbRefuses === lignes.length) {
    statutGlobal = 'REFUSE'
  } else if (totaux.nbValides === lignes.length) {
    statutGlobal = 'ENTIEREMENT_VALIDE'
  } else if (totaux.nbValides > 0) {
    statutGlobal = 'PARTIELLEMENT_VALIDE'
  }

  return {
    ...totaux,
    statut_global: statutGlobal,
    taux_couverture: totaux.demande > 0 ? (totaux.accorde / totaux.demande) * 100 : 0
  }
}

// ============================================================
// SCORING & ÉLIGIBILITÉ
// ============================================================

export function calculerScoreDossier(financement: FinancementEnrichi): number {
  let score = 50 // Score de base

  // Documents (30 points)
  const docsComplets = financement.documents?.filter(d => d.statut === 'valide').length || 0
  const docsRequis = financement.documents?.length || 1
  score += (docsComplets / docsRequis) * 30

  // Montant cohérent (20 points)
  const montant = financement.montant_demande || 0
  if (montant >= 500 && montant <= 15000) score += 20
  else if (montant >= 200) score += 10

  // Profil éligible (20 points)
  if (financement.lead?.profil_financement) {
    const profil = financement.lead.profil_financement
    const bonsProfils: ProfilFinancement[] = ['salarie', 'demandeur_emploi']
    if (bonsProfils.includes(profil)) score += 20
    else score += 10
  }

  // Historique (10 points)
  const nbModifs = financement.nb_modifications || 0
  if (nbModifs <= 3) score += 10
  else if (nbModifs <= 6) score += 5

  return Math.min(Math.max(score, 0), 100)
}

export function calculerProbabiliteAcceptation(
  organisme: string,
  montant: number,
  profil: ProfilFinancement,
  historiqueStats?: { tauxAcceptation: number }
): number {
  // Base historique
  let probabilite = historiqueStats?.tauxAcceptation || 65

  // Ajustements par organisme
  const ajustementsOrganisme: Record<string, number> = {
    'CPF': +15,
    'OPCO_EP': +10,
    'FRANCE_TRAVAIL': +5,
    'AGEFIPH': -5,
    'TRANSITIONS_PRO': -10
  }

  probabilite += ajustementsOrganisme[organisme] || 0

  // Ajustements par profil
  const ajustementsProfil: Record<ProfilFinancement, number> = {
    'salarie': +10,
    'demandeur_emploi': +5,
    'apprenti': 0,
    'independant': -5,
    'liberal': -10
  }

  probabilite += ajustementsProfil[profil] || 0

  // Ajustements par montant
  if (montant < 1000) probabilite += 10
  else if (montant > 10000) probabilite -= 15
  else if (montant > 5000) probabilite -= 5

  return Math.min(Math.max(probabilite, 10), 95)
}

// ============================================================
// ANALYSE & RECOMMANDATIONS
// ============================================================

export function analyserFinancement(financement: FinancementEnrichi) {
  const score = calculerScoreDossier(financement)
  const marge = calculerMarge(financement.montant_accorde || 0, financement.cout_total)

  const recommendations: string[] = []
  const risques: string[] = []

  // Analyse marge
  if (marge.taux_marge < 10) {
    risques.push('Marge faible (< 10%)')
    recommendations.push('Réduire les coûts ou renégocier le montant')
  } else if (marge.taux_marge > 50) {
    recommendations.push('Marge confortable, potentiel d\'optimisation tarifaire')
  }

  // Analyse délais
  const dateCreation = new Date(financement.created_at)
  const joursDepuisCreation = Math.floor(
    (Date.now() - dateCreation.getTime()) / (1000 * 60 * 60 * 24)
  )

  if (joursDepuisCreation > 30 && financement.statut === 'PREPARATION') {
    risques.push('Dossier en préparation depuis > 30 jours')
    recommendations.push('Relancer le lead pour compléter le dossier')
  }

  // Analyse documents
  const docsManquants = financement.documents?.filter(d => d.statut === 'requis').length || 0
  if (docsManquants > 0) {
    recommendations.push(`Obtenir ${docsManquants} document(s) manquant(s)`)
  }

  return {
    score,
    marge,
    recommendations,
    risques,
    priorite: score > 70 ? 'HAUTE' : score > 40 ? 'NORMALE' : 'BASSE'
  }
}

// ============================================================
// EXPORTS UTILITAIRES
// ============================================================

export function genererNumeroFinancement(prefixe = 'FIN'): string {
  const date = new Date()
  const annee = date.getFullYear().toString().slice(-2)
  const mois = (date.getMonth() + 1).toString().padStart(2, '0')
  const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0')

  return `${prefixe}${annee}${mois}${random}`
}

export function formaterMontantFinancement(montant: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(montant)
}

export function calculerDelaiEstime(organisme: string, statut: string): number {
  // Délais en jours par organisme et statut
  const delais: Record<string, Record<string, number>> = {
    'CPF': { 'SOUMIS': 15, 'EN_EXAMEN': 7 },
    'OPCO_EP': { 'SOUMIS': 45, 'EN_EXAMEN': 15 },
    'FRANCE_TRAVAIL': { 'SOUMIS': 30, 'EN_EXAMEN': 10 },
    'AGEFIPH': { 'SOUMIS': 45, 'EN_EXAMEN': 20 },
    'TRANSITIONS_PRO': { 'SOUMIS': 60, 'EN_EXAMEN': 30 }
  }

  return delais[organisme]?.[statut] || 30
}