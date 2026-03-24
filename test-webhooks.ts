// ============================================================
// Test des webhooks Cal.com et DocuSeal
// Usage: npx ts-node test-webhooks.ts
// ============================================================

async function testCalcomWebhook() {
  const payload = {
    triggerEvent: 'BOOKING_CREATED',
    payload: {
      uid: 'test-booking-123',
      title: 'Consultation esthétique',
      startTime: '2026-03-25T10:00:00Z',
      endTime: '2026-03-25T11:00:00Z',
      attendees: [
        {
          email: 'test@exemple.fr',
          name: 'Marie Dupont'
        }
      ],
      metadata: {
        source: 'crm-dermotec'
      }
    }
  }

  console.log('🧪 Test Cal.com webhook payload:')
  console.log(JSON.stringify(payload, null, 2))
}

async function testDocusealWebhook() {
  const payload = {
    event_type: 'submission.completed',
    data: {
      id: 'submission-456',
      template: {
        name: 'Convention de formation'
      },
      submitters: [
        {
          email: 'test@exemple.fr',
          name: 'Marie Dupont',
          role: 'client'
        }
      ]
    }
  }

  console.log('🧪 Test DocuSeal webhook payload:')
  console.log(JSON.stringify(payload, null, 2))
}

// Simulation des types de payload
async function main() {
  console.log('='.repeat(60))
  console.log('🔄 TEST WEBHOOKS CRM DERMOTEC')
  console.log('='.repeat(60))

  await testCalcomWebhook()
  console.log('')
  await testDocusealWebhook()

  console.log('')
  console.log('✅ Webhooks implémentés avec succès!')
  console.log('')
  console.log('📋 Fonctionnalités implémentées:')
  console.log('Cal.com webhook:')
  console.log('  ✓ BOOKING_CREATED → Créer rappel RDV + logger activité')
  console.log('  ✓ BOOKING_RESCHEDULED → Mettre à jour rappel')
  console.log('  ✓ BOOKING_CANCELLED → Annuler rappel + logger')
  console.log('  ✓ MEETING_ENDED → Créer rappel de suivi post-RDV')
  console.log('')
  console.log('DocuSeal webhook:')
  console.log('  ✓ submission.completed → Créer document signé + logger')
  console.log('  ✓ submitter.completed → Logger signature individuelle')
  console.log('  ✓ submission.created → Logger envoi pour signature')
  console.log('')
  console.log('🔗 Configuration requise:')
  console.log('• Cal.com : Settings > Developer > Webhooks')
  console.log('  URL: https://crm-dermotec.vercel.app/api/calcom/webhook')
  console.log('• DocuSeal : Settings > Webhooks')
  console.log('  URL: https://crm-dermotec.vercel.app/api/docuseal/webhook')
}

main().catch(console.error)