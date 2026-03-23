import 'server-only'
// ============================================================
// CRM SATOREA — AI Self-Check
// Vérifie régulièrement l'intégrité du système IA.
// Détecte : system prompt modifié, tools altérés, KB empoisonnée,
// données infectées, patterns d'attaque dans les conversations.
// ============================================================

import { createHmac } from 'crypto'

// ============================================================
// CONFIGURATION — Signatures d'intégrité
// ============================================================

// Hash du system prompt attendu (calculé au démarrage, vérifié à chaque check)
let _systemPromptHash: string | null = null

// Liste des tools autorisés (aucun tool ne doit apparaître/disparaître)
const AUTHORIZED_TOOLS = new Set([
  'think', 'searchLeads', 'getLeadDetails', 'getProactiveInsights',
  'findSimilarSuccess', 'createReminder', 'getNextSessions',
  'analyzeFinancement', 'searchKnowledgeBase', 'getPlaybookResponse',
  'getPipelineStats', 'updateLeadStatus', 'sendEmail',
])

// Patterns d'injection à chercher dans les données
const DATA_POISON_PATTERNS = [
  /ignore\s+(all\s+)?previous/i,
  /you\s+are\s+now/i,
  /system\s*:\s*/i,
  /<\|system\|>/i,
  /\[INST\]/i,
  /### (Human|Assistant|System)/i,
  /IMPORTANT:\s*Instructions/i,
  /act\s+as\s+(an?\s+)?unrestricted/i,
  /\beval\s*\(/i,
  /\bexec\s*\(/i,
  /process\.env/i,
  /require\s*\(\s*['"`]/i,
  /fetch\s*\(\s*['"`]http/i,
]

// ============================================================
// HASH UTILITIES
// ============================================================

function hashString(input: string): string {
  return createHmac('sha256', 'satorea-integrity-2026')
    .update(input)
    .digest('hex')
    .slice(0, 32)
}

// ============================================================
// 1. SYSTEM PROMPT INTEGRITY
// ============================================================

/** Enregistre le hash du system prompt au démarrage */
export function registerSystemPrompt(prompt: string): void {
  _systemPromptHash = hashString(prompt)
}

/** Vérifie que le system prompt n'a pas été modifié */
export function checkSystemPromptIntegrity(currentPrompt: string): {
  intact: boolean
  details?: string
} {
  if (!_systemPromptHash) {
    return { intact: true, details: 'No reference hash (first run)' }
  }

  const currentHash = hashString(currentPrompt)
  if (currentHash !== _systemPromptHash) {
    return {
      intact: false,
      details: `System prompt modified! Expected ${_systemPromptHash.slice(0, 8)}... got ${currentHash.slice(0, 8)}...`,
    }
  }

  return { intact: true }
}

// ============================================================
// 2. TOOLS INTEGRITY
// ============================================================

/** Vérifie que les tools n'ont pas été modifiés (ajoutés/supprimés) */
export function checkToolsIntegrity(currentTools: string[]): {
  intact: boolean
  added: string[]
  removed: string[]
} {
  const currentSet = new Set(currentTools)

  const added = currentTools.filter(t => !AUTHORIZED_TOOLS.has(t))
  const removed = [...AUTHORIZED_TOOLS].filter(t => !currentSet.has(t))

  return {
    intact: added.length === 0 && removed.length === 0,
    added,
    removed,
  }
}

// ============================================================
// 3. KNOWLEDGE BASE INTEGRITY
// ============================================================

/** Scanne la KB pour détecter du contenu empoisonné */
export async function scanKnowledgeBase(): Promise<{
  clean: boolean
  poisonedEntries: Array<{ id: string; title: string; pattern: string }>
}> {
  const poisoned: Array<{ id: string; title: string; pattern: string }> = []

  try {
    const { createServiceSupabase } = await import('../supabase-server')
    const supabase = await createServiceSupabase()

    // Scanner les 500 entrées les plus récentes de la KB
    const { data: entries } = await (supabase as any)
      .from('knowledge_base')
      .select('id, title, content')
      .order('created_at', { ascending: false })
      .limit(500)

    if (entries) {
      for (const entry of entries) {
        const fullText = `${entry.title || ''} ${entry.content || ''}`
        for (const pattern of DATA_POISON_PATTERNS) {
          if (pattern.test(fullText)) {
            poisoned.push({
              id: entry.id,
              title: entry.title || 'Sans titre',
              pattern: pattern.source.slice(0, 30),
            })
            break // Un seul pattern suffit à flaguer
          }
        }
      }
    }
  } catch {
    // Si la table n'existe pas → pas de KB → clean
  }

  return { clean: poisoned.length === 0, poisonedEntries: poisoned }
}

// ============================================================
// 4. DATA INFECTION SCAN
// ============================================================

/** Scanne les données CRM pour détecter des payloads d'injection */
export async function scanDataForInjection(): Promise<{
  clean: boolean
  infectedRecords: Array<{ table: string; id: string; field: string; pattern: string }>
}> {
  const infected: Array<{ table: string; id: string; field: string; pattern: string }> = []

  try {
    const { createServiceSupabase } = await import('../supabase-server')
    const supabase = await createServiceSupabase()

    // Scanner les leads récents (champs texte libre = vecteur principal)
    const { data: leads } = await (supabase as any)
      .from('leads')
      .select('id, prenom, nom, entreprise_nom, notes, email')
      .order('created_at', { ascending: false })
      .limit(200)

    if (leads) {
      for (const lead of leads) {
        for (const field of ['prenom', 'nom', 'entreprise_nom', 'notes', 'email']) {
          const value = lead[field]
          if (!value || typeof value !== 'string') continue

          for (const pattern of DATA_POISON_PATTERNS) {
            if (pattern.test(value)) {
              infected.push({
                table: 'leads',
                id: lead.id,
                field,
                pattern: pattern.source.slice(0, 30),
              })
              break
            }
          }
        }
      }
    }

    // Scanner les notes/messages récents
    const { data: messages } = await (supabase as any)
      .from('messages')
      .select('id, contenu')
      .order('created_at', { ascending: false })
      .limit(200)

    if (messages) {
      for (const msg of messages) {
        if (msg.contenu && typeof msg.contenu === 'string') {
          for (const pattern of DATA_POISON_PATTERNS) {
            if (pattern.test(msg.contenu)) {
              infected.push({
                table: 'messages',
                id: msg.id,
                field: 'contenu',
                pattern: pattern.source.slice(0, 30),
              })
              break
            }
          }
        }
      }
    }

    // Scanner les activités (commentaires libres)
    const { data: activites } = await (supabase as any)
      .from('activites')
      .select('id, notes')
      .order('created_at', { ascending: false })
      .limit(200)

    if (activites) {
      for (const act of activites) {
        if (act.notes && typeof act.notes === 'string') {
          for (const pattern of DATA_POISON_PATTERNS) {
            if (pattern.test(act.notes)) {
              infected.push({
                table: 'activites',
                id: act.id,
                field: 'notes',
                pattern: pattern.source.slice(0, 30),
              })
              break
            }
          }
        }
      }
    }
  } catch {
    // Tables manquantes → clean
  }

  return { clean: infected.length === 0, infectedRecords: infected }
}

// ============================================================
// 5. CONVERSATION PATTERN ANALYSIS
// ============================================================

/** Analyse les conversations récentes pour détecter des patterns d'attaque */
export async function analyzeRecentConversations(): Promise<{
  clean: boolean
  suspiciousUsers: Array<{ userId: string; reason: string; count: number }>
}> {
  const suspicious: Array<{ userId: string; reason: string; count: number }> = []

  try {
    const { createServiceSupabase } = await import('../supabase-server')
    const supabase = await createServiceSupabase()

    // Chercher les users avec beaucoup de conversations en peu de temps
    const { data: stats } = await (supabase as any)
      .from('ai_audit_log')
      .select('user_id')
      .gte('created_at', new Date(Date.now() - 3_600_000).toISOString()) // dernière heure
      .order('created_at', { ascending: false })

    if (stats) {
      // Compter par user
      const counts: Record<string, number> = {}
      for (const s of stats) {
        counts[s.user_id] = (counts[s.user_id] || 0) + 1
      }

      // > 30 conversations/heure = suspect (scraping via IA)
      for (const [userId, count] of Object.entries(counts)) {
        if (count > 30) {
          suspicious.push({ userId, reason: 'excessive_conversations', count })
        }
      }
    }

    // Chercher les tentatives d'injection récentes
    const { data: injections } = await (supabase as any)
      .from('ai_injection_attempts')
      .select('user_id')
      .gte('created_at', new Date(Date.now() - 86_400_000).toISOString()) // 24h

    if (injections) {
      const injCounts: Record<string, number> = {}
      for (const i of injections) {
        injCounts[i.user_id] = (injCounts[i.user_id] || 0) + 1
      }

      for (const [userId, count] of Object.entries(injCounts)) {
        if (count >= 3) {
          suspicious.push({ userId, reason: 'repeated_injection_attempts', count })
        }
      }
    }
  } catch {
    // Tables manquantes
  }

  return { clean: suspicious.length === 0, suspiciousUsers: suspicious }
}

// ============================================================
// 6. FULL SELF-CHECK — Toutes les vérifications
// ============================================================

export interface SelfCheckResult {
  healthy: boolean
  timestamp: string
  duration_ms: number
  checks: {
    system_prompt: { intact: boolean; details?: string }
    tools: { intact: boolean; added: string[]; removed: string[] }
    knowledge_base: { clean: boolean; poisoned_count: number }
    data: { clean: boolean; infected_count: number }
    conversations: { clean: boolean; suspicious_users: number }
  }
  issues: string[]
}

/**
 * Exécute TOUTES les vérifications d'intégrité.
 * À appeler :
 * - Au démarrage de l'app
 * - Toutes les heures via un cron Inngest
 * - Manuellement depuis le dashboard admin
 */
export async function fullSelfCheck(
  currentSystemPrompt?: string,
  currentTools?: string[]
): Promise<SelfCheckResult> {
  const start = Date.now()
  const issues: string[] = []

  // 1. System prompt
  const promptCheck = currentSystemPrompt
    ? checkSystemPromptIntegrity(currentSystemPrompt)
    : { intact: true, details: 'No prompt provided' }
  if (!promptCheck.intact) issues.push(`SYSTEM_PROMPT_MODIFIED: ${promptCheck.details}`)

  // 2. Tools
  const toolsCheck = currentTools
    ? checkToolsIntegrity(currentTools)
    : { intact: true, added: [], removed: [] }
  if (!toolsCheck.intact) {
    if (toolsCheck.added.length) issues.push(`TOOLS_ADDED: ${toolsCheck.added.join(', ')}`)
    if (toolsCheck.removed.length) issues.push(`TOOLS_REMOVED: ${toolsCheck.removed.join(', ')}`)
  }

  // 3-5. Checks async en parallèle
  const [kbCheck, dataCheck, convCheck] = await Promise.allSettled([
    scanKnowledgeBase(),
    scanDataForInjection(),
    analyzeRecentConversations(),
  ])

  const kb = kbCheck.status === 'fulfilled' ? kbCheck.value : { clean: true, poisonedEntries: [] }
  const data = dataCheck.status === 'fulfilled' ? dataCheck.value : { clean: true, infectedRecords: [] }
  const conv = convCheck.status === 'fulfilled' ? convCheck.value : { clean: true, suspiciousUsers: [] }

  if (!kb.clean) issues.push(`KB_POISONED: ${kb.poisonedEntries.length} entries`)
  if (!data.clean) issues.push(`DATA_INFECTED: ${data.infectedRecords.length} records`)
  if (!conv.clean) issues.push(`SUSPICIOUS_USERS: ${conv.suspiciousUsers.length} users`)

  const result: SelfCheckResult = {
    healthy: issues.length === 0,
    timestamp: new Date().toISOString(),
    duration_ms: Date.now() - start,
    checks: {
      system_prompt: promptCheck,
      tools: toolsCheck,
      knowledge_base: { clean: kb.clean, poisoned_count: kb.poisonedEntries.length },
      data: { clean: data.clean, infected_count: data.infectedRecords.length },
      conversations: { clean: conv.clean, suspicious_users: conv.suspiciousUsers.length },
    },
    issues,
  }

  // Persister le résultat
  try {
    const { createServiceSupabase } = await import('../supabase-server')
    const supabase = await createServiceSupabase()

    await (supabase as any).from('ai_health_checks').insert({
      check_type: 'full_check',
      healthy: result.healthy,
      issues: result.issues,
      details: result.checks,
      duration_ms: result.duration_ms,
    })
  } catch {
    // Non-bloquant
  }

  // Alerte si pas healthy
  if (!result.healthy) {
    console.error(`[AI SELF-CHECK] UNHEALTHY: ${issues.join(' | ')}`)
  } else {
    // AI self-check healthy
  }

  return result
}
