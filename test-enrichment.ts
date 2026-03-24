#!/usr/bin/env tsx
// ============================================================
// Script de test — Auto-enrichissement
// Test le système d'enrichissement automatique
// ============================================================

import { inngest } from './src/lib/inngest'

async function testEnrichment() {
  console.log('🧪 Test auto-enrichissement...\n')

  // Test 1 : Lead avec SIRET (exemple réel)
  const testLead1 = {
    lead_id: 'test-lead-1',
    siret: '44306184100047', // Apple France
    nom: 'Apple France',
    prenom: undefined,
    entreprise_nom: 'Apple France',
    ville: 'Paris',
    email: 'test@apple.fr',
    source: 'test',
    trigger: 'manual' as const
  }

  // Test 2 : Lead sans SIRET (particulier)
  const testLead2 = {
    lead_id: 'test-lead-2',
    siret: undefined,
    nom: 'Dupont',
    prenom: 'Marie',
    entreprise_nom: 'Institut Beauté Paris',
    ville: 'Paris',
    email: 'marie.dupont@exemple.fr',
    source: 'test',
    trigger: 'manual' as const
  }

  try {
    console.log('📤 Envoi événement 1 (avec SIRET)...')
    const result1 = await inngest.send({
      name: 'crm/lead.created',
      data: testLead1
    })
    console.log('✅ Événement 1 envoyé:', result1)

    await new Promise(resolve => setTimeout(resolve, 1000))

    console.log('\n📤 Envoi événement 2 (sans SIRET)...')
    const result2 = await inngest.send({
      name: 'crm/lead.created',
      data: testLead2
    })
    console.log('✅ Événement 2 envoyé:', result2)

    console.log('\n✅ Tests envoyés avec succès!')
    console.log('👀 Vérifiez les logs Inngest pour voir l\'exécution')

  } catch (error) {
    console.error('❌ Erreur test:', error)
  }
}

// Run test
if (require.main === module) {
  testEnrichment()
}

export { testEnrichment }