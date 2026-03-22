// ============================================================
// CRM DERMOTEC — Inngest Functions Registry
// Importer toutes les fonctions ici pour le serve handler
// ============================================================

export { sendEmail } from './send-email'
export { dailyRappels } from './daily-rappels'
export { leadCadence } from './lead-cadence'
export { webhookRetry } from './webhook-retry'
export { postFormationCadence } from './post-formation-cadence'
export { sessionLifecycle } from './session-lifecycle'
export { bulkEmailSend, bulkLeadUpdate, refreshMaterializedViews, processQueueJob, businessMetricsCheck } from './bulk-operations'
export { stripeWebhookProcessor } from './stripe-webhook-processor'
export { proactiveAgent } from './proactive-agent'
export { monthlySnapshot } from './monthly-snapshot'
export { weeklyReport } from './weekly-report'
