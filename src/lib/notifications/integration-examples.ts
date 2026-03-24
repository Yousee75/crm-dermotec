// ============================================================
// Exemples d'intégration — Comment utiliser les notifications dans Inngest
// ============================================================

import { createClient } from '@supabase/supabase-js'
import {
  createProspectChaudNotification,
  createFinancementStagnantNotification,
  createSessionPleineNotification,
  createRappelRetardNotification
} from './create-notification'

/**
 * Exemple d'utilisation dans l'agent proactif pour les prospects chauds
 */
export async function exampleProspectChaudInInngest() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Remplace la création manuelle d'activité dans proactive-agent.ts
  const leadData = {
    id: 'lead-123',
    prenom: 'Marie',
    nom: 'Dupont',
    score_chaud: 85,
    jours_sans_contact: 12,
    commercial_assigne_id: 'user-456'
  }

  // Au lieu de :
  // await supabase.from('activites').insert({
  //   type: 'SYSTEME',
  //   lead_id: leadData.id,
  //   description: `[Agent IA] Lead chaud (score ${leadData.score_chaud}) sans contact...`,
  //   metadata: { canal: 'agent_ia', action: 'rappel_auto', score: leadData.score_chaud }
  // })

  // Utilise :
  await createProspectChaudNotification(supabase, {
    userId: leadData.commercial_assigne_id,
    leadId: leadData.id,
    leadName: `${leadData.prenom} ${leadData.nom}`,
    score: leadData.score_chaud,
    joursSansContact: leadData.jours_sans_contact
  })
}

/**
 * Exemple pour les financements stagnants
 */
export async function exampleFinancementStagnantInInngest() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const financementData = {
    id: 'financement-789',
    lead_id: 'lead-456',
    organisme: 'OPCO EP',
    montant: 2400,
    created_at: '2026-03-10T10:00:00Z',
    lead: {
      prenom: 'Sophie',
      nom: 'Martin',
      commercial_assigne_id: 'user-789'
    }
  }

  const joursAttente = Math.floor((Date.now() - new Date(financementData.created_at).getTime()) / (1000 * 60 * 60 * 24))

  await createFinancementStagnantNotification(supabase, {
    userId: financementData.lead.commercial_assigne_id,
    leadId: financementData.lead_id,
    leadName: `${financementData.lead.prenom} ${financementData.lead.nom}`,
    organisme: financementData.organisme,
    joursAttente,
    montant: financementData.montant
  })
}

/**
 * Exemple pour les sessions pleines (à utiliser dans enhanced-notifications.ts)
 */
export async function exampleSessionPleineInInngest() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const sessionData = {
    id: 'session-101',
    places_max: 12,
    inscrits: 10,
    formation: { nom: 'Formation Dermo-Correctrice' }
  }

  const pourcentage = (sessionData.inscrits / sessionData.places_max) * 100

  // Notifier l'admin ou le formateur
  const adminUserId = 'admin-user-id'

  await createSessionPleineNotification(supabase, {
    userId: adminUserId,
    sessionId: sessionData.id,
    sessionName: sessionData.formation.nom,
    inscrits: sessionData.inscrits,
    placesMax: sessionData.places_max,
    pourcentage
  })
}

/**
 * Exemple pour les rappels en retard
 */
export async function exampleRappelRetardInInngest() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const rappelData = {
    id: 'rappel-202',
    titre: 'Appel de relance OPCO',
    date_rappel: '2026-03-22T14:00:00Z',
    lead_id: 'lead-303',
    user_id: 'user-404'
  }

  const retardJours = Math.floor((Date.now() - new Date(rappelData.date_rappel).getTime()) / (1000 * 60 * 60 * 24))

  await createRappelRetardNotification(supabase, {
    userId: rappelData.user_id,
    leadId: rappelData.lead_id,
    rappelTitre: rappelData.titre,
    retardJours
  })
}

/**
 * Migration guide — Comment adapter le code existant
 */
export const MIGRATION_GUIDE = `
## Migration du code existant

### 1. Prospects chauds (proactive-agent.ts ligne 71-76)

AVANT:
\`\`\`typescript
await supabase.from('activites').insert({
  type: 'SYSTEME',
  lead_id: rappel.lead_id,
  description: rappel.description,
  metadata: { canal: 'agent_ia', action: 'rappel_auto', score: rappel.description.match(/score (\\d+)/)?.[1] },
})
\`\`\`

APRÈS:
\`\`\`typescript
import { createProspectChaudNotification } from '@/lib/notifications'

await createProspectChaudNotification(supabase, {
  userId: lead.commercial_assigne_id,
  leadId: lead.id,
  leadName: \`\${lead.prenom} \${lead.nom}\`,
  score: lead.score_chaud,
  joursSansContact: lead.jours_sans_contact
})
\`\`\`

### 2. Financements stagnants (proactive-agent.ts ligne 123-128)

AVANT:
\`\`\`typescript
await supabase.from('activites').insert({
  type: 'SYSTEME',
  lead_id: fin.lead_id,
  description: \`Agent IA : financement \${fin.organisme} stagnant...\`,
  metadata: { canal: 'agent_ia', action: 'financement_relance', ... },
})
\`\`\`

APRÈS:
\`\`\`typescript
await createFinancementStagnantNotification(supabase, {
  userId: lead.commercial_assigne_id,
  leadId: fin.lead_id,
  leadName: \`\${lead.prenom} \${lead.nom}\`,
  organisme: fin.organisme,
  joursAttente,
  montant: fin.montant
})
\`\`\`

### 3. Sessions proches (enhanced-notifications.ts)

Utilise createSessionPleineNotification pour les sessions à 80%+

### 4. Rappels en retard (enhanced-notifications.ts)

Utilise createRappelRetardNotification pour les rappels dépassés
`