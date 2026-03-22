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
