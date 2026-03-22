// ============================================================
// CRM DERMOTEC — Inngest Serve Endpoint
// Route: /api/inngest (GET, POST, PUT)
// ============================================================

import { type NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Lazy import to prevent inngest createFunction crash during SSG
async function getHandler() {
  const { serve } = await import('inngest/next')
  const { inngest } = await import('@/lib/inngest')
  const inngestFunctions = await import('@/inngest')
  const securityCrons = await import('@/inngest/security-audit-cron')

  return serve({
    client: inngest,
    functions: [
      inngestFunctions.sendEmail,
      inngestFunctions.dailyRappels,
      inngestFunctions.leadCadence,
      inngestFunctions.webhookRetry,
      inngestFunctions.postFormationCadence,
      inngestFunctions.sessionLifecycle,
      inngestFunctions.bulkEmailSend,
      inngestFunctions.bulkLeadUpdate,
      inngestFunctions.refreshMaterializedViews,
      inngestFunctions.processQueueJob,
      inngestFunctions.businessMetricsCheck,
      inngestFunctions.stripeWebhookProcessor,
      inngestFunctions.proactiveAgent,
      inngestFunctions.monthlySnapshot,
      inngestFunctions.weeklyReport,
      inngestFunctions.smartRelance,
      inngestFunctions.autoEnrichLead,
      // Security monitoring — H24
      securityCrons.securityAuditHourly,   // Audit complet toutes les heures
      securityCrons.uptimeMonitor,          // Uptime check toutes les 5 min
      securityCrons.dailySecurityReport,    // Rapport email quotidien 8h
    ],
  })
}

export async function GET(req: NextRequest, res: unknown) {
  const handler = await getHandler()
  return handler.GET(req, res)
}

export async function POST(req: NextRequest, res: unknown) {
  const handler = await getHandler()
  return handler.POST(req, res)
}

export async function PUT(req: NextRequest, res: unknown) {
  const handler = await getHandler()
  return handler.PUT(req, res)
}
