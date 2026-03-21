// ============================================================
// CRM DERMOTEC — Inngest Serve Endpoint
// Route: /api/inngest (GET, POST, PUT)
// ============================================================

import { serve } from 'inngest/next'
import { inngest } from '@/lib/inngest'
import { sendEmail, dailyRappels, leadCadence, webhookRetry } from '@/inngest'

export const dynamic = 'force-dynamic'

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    sendEmail,
    dailyRappels,
    leadCadence,
    webhookRetry,
  ],
})
