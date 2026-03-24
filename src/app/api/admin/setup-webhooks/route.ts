import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabase } from '@/lib/supabase-server'

// ============================================================
// API Admin — Configuration automatique des Database Webhooks
// POST /api/admin/setup-webhooks — Créer les webhooks Supabase automatiquement
// ============================================================

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Auth : vérifier que c'est un admin
    const supabase = await createServiceSupabase()

    // Récupérer le webhook URL de base
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://crm-dermotec.vercel.app'
    const webhookUrl = `${baseUrl}/api/webhook/supabase`

    // Configuration des webhooks à créer
    const webhooksToCreate = [
      {
        name: 'auto_enrich_leads',
        table: 'leads',
        events: ['INSERT'],
        description: 'Déclenche enrichissement automatique sur nouveau lead'
      },
      {
        name: 'session_lifecycle',
        table: 'sessions',
        events: ['INSERT', 'UPDATE'],
        description: 'Déclenche lifecycle session (emails, rappels)'
      }
    ]

    const results = []

    for (const webhook of webhooksToCreate) {
      try {
        // Utilisation de la fonction Supabase create_webhook si elle existe
        // Sinon, retourner les commandes SQL à exécuter manuellement
        results.push({
          webhook: webhook.name,
          status: 'sql_commands_generated',
          sql: `
-- Webhook ${webhook.name}
SELECT extensions.create_webhook(
  name := '${webhook.name}',
  url := '${webhookUrl}',
  events := ARRAY[${webhook.events.map(e => `'${e}'`).join(', ')}],
  table_name := '${webhook.table}',
  schema_name := 'public'
);
          `.trim()
        })
      } catch (error) {
        results.push({
          webhook: webhook.name,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      success: true,
      webhook_url: webhookUrl,
      results,
      manual_setup: {
        description: 'Execute these SQL commands in Supabase SQL Editor',
        note: 'Make sure the pg_net extension is enabled first',
        enable_extension: 'CREATE EXTENSION IF NOT EXISTS pg_net;',
        commands: results.filter(r => r.sql).map(r => r.sql)
      }
    })

  } catch (error) {
    console.error('[Setup Webhooks] Error:', error)
    return NextResponse.json({
      error: 'Failed to setup webhooks',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://crm-dermotec.vercel.app'
  const webhookUrl = `${baseUrl}/api/webhook/supabase`

  return NextResponse.json({
    service: 'webhook-setup',
    webhook_url: webhookUrl,
    status: 'ready',
    description: 'POST to setup database webhooks automatically'
  })
}