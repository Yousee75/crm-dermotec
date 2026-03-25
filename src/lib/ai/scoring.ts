// ============================================================
// CRM DERMOTEC — Scoring Prédictif IA (Claude API)
// Analyse le profil du lead et prédit la probabilité de conversion
// ============================================================

interface LeadForScoring {
  prenom: string
  nom?: string
  email?: string
  telephone?: string
  source: string
  statut: string
  statut_pro?: string
  experience_esthetique?: string
  formation_principale_id?: string
  formations_interessees?: string[]
  financement_souhaite?: boolean
  nb_contacts: number
  date_premier_contact?: string
  date_dernier_contact?: string
  tags?: string[]
  score_chaud: number
  objectif_pro?: string
  message?: string
}

interface ScoringResult {
  score_predictif: number // 0-100
  probabilite_conversion: number // 0-100%
  facteurs_positifs: string[]
  facteurs_negatifs: string[]
  action_recommandee: string
  canal_prefere: string
  meilleur_moment: string
  formation_recommandee?: string
}

export async function scoreLead(lead: LeadForScoring): Promise<ScoringResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY

  if (!apiKey) {
    return fallbackScoring(lead)
  }

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 800,
        system: `Tu es un expert en conversion de leads pour un centre de formation esthétique. Analyse le profil du lead et retourne un JSON avec :
- score_predictif (0-100)
- probabilite_conversion (0-100)
- facteurs_positifs (array de strings)
- facteurs_negatifs (array de strings)
- action_recommandee (string, une action concrète)
- canal_prefere ("whatsapp"|"email"|"telephone"|"sms")
- meilleur_moment ("matin"|"apres_midi"|"soir")
- formation_recommandee (string optionnel)

Contexte : formations esthétique 400-2500€, cible esthéticiennes et reconversions pro. Les leads "demandeur_emploi" ou "reconversion" avec financement sont les plus susceptibles de convertir. L'expérience préalable augmente la probabilité. Un contact récent est positif.

IMPORTANT : Retourne UNIQUEMENT le JSON, sans texte autour.`,
        messages: [{
          role: 'user',
          content: JSON.stringify(lead, null, 2)
        }],
      }),
    })

    if (!res.ok) {
      return fallbackScoring(lead)
    }

    const data = await res.json()
    const text = data.content?.[0]?.text || ''

    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as ScoringResult
      }
    } catch {
      // JSON parsing failed
    }

    return fallbackScoring(lead)
  } catch {
    return fallbackScoring(lead)
  }
}

// Scoring déterministe de fallback (si pas d'API key)
function fallbackScoring(lead: LeadForScoring): ScoringResult {
  let score = 30
  const facteurs_positifs: string[] = []
  const facteurs_negatifs: string[] = []

  // Email + téléphone
  if (lead.email) { score += 5; facteurs_positifs.push('Email renseigné') }
  if (lead.telephone) { score += 5; facteurs_positifs.push('Téléphone renseigné') }

  // Statut pro
  if (lead.statut_pro === 'demandeur_emploi' || lead.statut_pro === 'reconversion') {
    score += 15; facteurs_positifs.push('Profil reconversion/demandeur emploi — forte motivation')
  } else if (lead.statut_pro === 'independante' || lead.statut_pro === 'auto_entrepreneur') {
    score += 10; facteurs_positifs.push('Indépendante — investit dans ses compétences')
  } else if (lead.statut_pro === 'salariee') {
    score += 8; facteurs_positifs.push('Salariée — financement OPCO probable')
  }

  // Financement
  if (lead.financement_souhaite) {
    score += 10; facteurs_positifs.push('Financement souhaité — engagement fort')
  }

  // Expérience
  if (lead.experience_esthetique === 'confirmee' || lead.experience_esthetique === 'experte') {
    score += 8; facteurs_positifs.push('Expérience confirmée — sait ce qu\'elle veut')
  } else if (lead.experience_esthetique === 'aucune') {
    score += 3; facteurs_negatifs.push('Aucune expérience — besoin de rassurer')
  }

  // Engagement
  if (lead.nb_contacts > 3) {
    score += 10; facteurs_positifs.push(`${lead.nb_contacts} contacts — lead engagé`)
  } else if (lead.nb_contacts === 0) {
    facteurs_negatifs.push('Jamais contacté — à qualifier')
  }

  // Récence
  if (lead.date_dernier_contact) {
    const daysSince = Math.floor((Date.now() - new Date(lead.date_dernier_contact).getTime()) / 86400000)
    if (daysSince <= 3) { score += 10; facteurs_positifs.push('Contact récent (< 3 jours)') }
    else if (daysSince > 14) { score -= 5; facteurs_negatifs.push('Pas de contact depuis 14+ jours') }
  }

  // Source
  if (lead.source === 'formulaire' || lead.source === 'site_web') {
    score += 5; facteurs_positifs.push('Lead organique (site web)')
  } else if (lead.source === 'ancien_stagiaire') {
    score += 12; facteurs_positifs.push('Recommandation ancienne stagiaire')
  }

  // Formation ciblée
  if (lead.formation_principale_id) {
    score += 5; facteurs_positifs.push('Formation ciblée identifiée')
  }

  score = Math.max(0, Math.min(100, score))

  // Canal préféré
  let canal_prefere = 'telephone'
  if (lead.source === 'whatsapp' || lead.source === 'instagram') canal_prefere = 'whatsapp'
  else if (lead.source === 'formulaire') canal_prefere = 'email'

  // Action recommandée
  let action_recommandee = 'Appeler pour qualifier'
  if (score >= 70) action_recommandee = 'Proposer inscription directe avec lien de paiement'
  else if (score >= 50) action_recommandee = 'Envoyer brochure + proposer RDV découverte'
  else if (score >= 30) action_recommandee = 'Lancer cadence de nurturing automatique'
  else action_recommandee = 'Vérifier la qualité du lead avant d\'investir du temps'

  return {
    score_predictif: score,
    probabilite_conversion: Math.round(score * 0.7),
    facteurs_positifs,
    facteurs_negatifs,
    action_recommandee,
    canal_prefere,
    meilleur_moment: 'matin',
  }
}

export { fallbackScoring }
