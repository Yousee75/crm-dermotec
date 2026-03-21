// @ts-nocheck
// ============================================================
// CRM DERMOTEC — Moteur de commissionnement
// Calcul automatique des commissions sur leads concretises
// ============================================================

interface CommissionConfig {
  taux_base: number
  palier_1_seuil: number
  palier_1_taux: number
  palier_2_seuil: number
  palier_2_taux: number
  palier_3_seuil: number
  palier_3_taux: number
  bonus_financement_pct: number
  bonus_upsell_fixe: number
  bonus_parrainage_fixe: number
  commission_sur_ht: boolean
}

interface CommissionInput {
  commercial_id: string
  commercial_nom: string
  lead_id: string
  lead_nom: string
  lead_email?: string
  inscription_id?: string
  session_id?: string
  formation_nom: string
  formation_categorie?: string
  montant_ht: number
  montant_ttc: number
  mode_paiement?: string
  organisme_financement?: string
  montant_finance?: number
  reste_a_charge?: number
  is_upsell?: boolean
  is_parrainage?: boolean
  conversions_ce_mois?: number
}

interface CommissionResult {
  taux_commission: number
  montant_commission: number
  bonus_financement: number
  bonus_upsell: number
  bonus_parrainage: number
  total_commission: number
  palier: string
  mois_reference: string
  detail: string
}

const DEFAULT_CONFIG: CommissionConfig = {
  taux_base: 10,
  palier_1_seuil: 5,
  palier_1_taux: 8,
  palier_2_seuil: 10,
  palier_2_taux: 10,
  palier_3_seuil: 999,
  palier_3_taux: 12,
  bonus_financement_pct: 2,
  bonus_upsell_fixe: 50,
  bonus_parrainage_fixe: 30,
  commission_sur_ht: true,
}

/**
 * Calcule la commission pour une conversion
 */
export function calculateCommission(
  input: CommissionInput,
  config: CommissionConfig = DEFAULT_CONFIG
): CommissionResult {
  const now = new Date()
  const mois = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const conversions = input.conversions_ce_mois || 1

  // 1. Determiner le palier
  let taux: number
  let palier: string

  if (conversions <= config.palier_1_seuil) {
    taux = config.palier_1_taux
    palier = 'base'
  } else if (conversions <= config.palier_2_seuil) {
    taux = config.palier_2_taux
    palier = 'intermediaire'
  } else {
    taux = config.palier_3_taux
    palier = 'premium'
  }

  // 2. Calculer la commission de base
  const montant_base = config.commission_sur_ht ? input.montant_ht : input.montant_ttc
  const montant_commission = Math.round(montant_base * taux) / 100

  // 3. Bonus financement
  let bonus_financement = 0
  if (input.organisme_financement && input.montant_finance && input.montant_finance > 0) {
    bonus_financement = Math.round(montant_base * config.bonus_financement_pct) / 100
  }

  // 4. Bonus upsell (2eme formation du meme lead)
  const bonus_upsell = input.is_upsell ? config.bonus_upsell_fixe : 0

  // 5. Bonus parrainage
  const bonus_parrainage = input.is_parrainage ? config.bonus_parrainage_fixe : 0

  // 6. Total
  const total = montant_commission + bonus_financement + bonus_upsell + bonus_parrainage

  // 7. Detail lisible
  const parts = [`${taux}% sur ${montant_base.toFixed(0)} EUR HT = ${montant_commission.toFixed(2)} EUR`]
  if (bonus_financement > 0) parts.push(`+${bonus_financement.toFixed(2)} EUR (financement ${input.organisme_financement})`)
  if (bonus_upsell > 0) parts.push(`+${bonus_upsell.toFixed(2)} EUR (upsell)`)
  if (bonus_parrainage > 0) parts.push(`+${bonus_parrainage.toFixed(2)} EUR (parrainage)`)

  return {
    taux_commission: taux,
    montant_commission,
    bonus_financement,
    bonus_upsell,
    bonus_parrainage,
    total_commission: Math.round(total * 100) / 100,
    palier,
    mois_reference: mois,
    detail: parts.join(' | '),
  }
}

/**
 * Cree une commission en DB apres une conversion
 */
export async function createCommission(input: CommissionInput): Promise<void> {
  try {
    const { createServiceSupabase } = await import('./supabase-server')
    const supabase = await createServiceSupabase()

    // Charger la config active
    const { data: configData } = await supabase
      .from('commission_config')
      .select('*')
      .eq('is_active', true)
      .single()

    const config = configData || DEFAULT_CONFIG

    // Compter les conversions du mois pour ce commercial
    const now = new Date()
    const debutMois = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const { count } = await supabase
      .from('commissions')
      .select('*', { count: 'exact', head: true })
      .eq('commercial_id', input.commercial_id)
      .gte('date_conversion', debutMois)
      .neq('statut', 'ANNULEE')

    input.conversions_ce_mois = (count || 0) + 1

    // Verifier si c'est un upsell (lead avec inscription precedente)
    const { count: prevInscriptions } = await supabase
      .from('inscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('lead_id', input.lead_id)
      .eq('statut', 'COMPLETEE')

    input.is_upsell = (prevInscriptions || 0) > 0

    // Verifier si c'est un parrainage
    const { data: leadData } = await supabase
      .from('leads')
      .select('parrain_id')
      .eq('id', input.lead_id)
      .single()

    input.is_parrainage = !!leadData?.parrain_id

    // Calculer
    const result = calculateCommission(input, config as CommissionConfig)

    // Inserer la commission
    await supabase.from('commissions').insert({
      commercial_id: input.commercial_id,
      commercial_nom: input.commercial_nom,
      lead_id: input.lead_id,
      lead_nom: input.lead_nom,
      lead_email: input.lead_email,
      inscription_id: input.inscription_id,
      session_id: input.session_id,
      formation_nom: input.formation_nom,
      formation_categorie: input.formation_categorie,
      montant_formation_ht: input.montant_ht,
      montant_formation_ttc: input.montant_ttc,
      mode_paiement: input.mode_paiement,
      organisme_financement: input.organisme_financement,
      montant_finance: input.montant_finance || 0,
      reste_a_charge: input.reste_a_charge || 0,
      taux_commission: result.taux_commission,
      montant_commission: result.montant_commission,
      bonus_financement: result.bonus_financement,
      bonus_upsell: result.bonus_upsell,
      bonus_parrainage: result.bonus_parrainage,
      total_commission: result.total_commission,
      mois_reference: result.mois_reference,
      nb_conversions_mois: input.conversions_ce_mois,
      palier: result.palier,
      statut: 'DUE',
      metadata: { calcul_detail: result.detail },
    })

    // Logger l'activite
    await supabase.from('activites').insert({
      type: 'PAIEMENT',
      lead_id: input.lead_id,
      description: `Commission ${result.total_commission.toFixed(2)} EUR generee pour ${input.commercial_nom} (${result.palier}, ${result.taux_commission}%)`,
      metadata: result,
    })

    console.log(`[Commission] ${input.commercial_nom}: ${result.total_commission.toFixed(2)} EUR sur ${input.formation_nom}`)
  } catch (err) {
    console.error('[Commission] Erreur creation:', err)
  }
}

/**
 * Annuler une commission (si remboursement ou annulation inscription)
 */
export async function annulerCommission(inscriptionId: string, raison: string): Promise<void> {
  try {
    const { createServiceSupabase } = await import('./supabase-server')
    const supabase = await createServiceSupabase()

    await supabase
      .from('commissions')
      .update({
        statut: 'ANNULEE',
        notes: raison,
      })
      .eq('inscription_id', inscriptionId)

    console.log(`[Commission] Annulee pour inscription ${inscriptionId}: ${raison}`)
  } catch (err) {
    console.error('[Commission] Erreur annulation:', err)
  }
}
