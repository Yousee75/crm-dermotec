// ============================================================
// CRM DERMOTEC — Prompt Injection Guard
// Filtre les tentatives de manipulation de l'agent IA
// Ref: OWASP LLM Top 10 — LLM01: Prompt Injection
// ============================================================

const INJECTION_PATTERNS: { pattern: RegExp; severity: 'high' | 'medium' }[] = [
  // Tentatives directes de jailbreak
  { pattern: /ignore\s+(previous|all|your|the)\s+(instructions|rules|guidelines)/i, severity: 'high' },
  { pattern: /forget\s+(everything|what|your|all)/i, severity: 'high' },
  { pattern: /you\s+are\s+now/i, severity: 'high' },
  { pattern: /act\s+as\s+(a|an|if|though)/i, severity: 'medium' },
  { pattern: /pretend\s+(you\s+are|to\s+be)/i, severity: 'medium' },
  { pattern: /roleplay\s+as/i, severity: 'medium' },
  { pattern: /jailbreak/i, severity: 'high' },
  { pattern: /\bDAN\s+(mode|prompt)/i, severity: 'high' },

  // Extraction du system prompt
  { pattern: /reveal\s+(your|the)\s+(system|prompt|instructions)/i, severity: 'high' },
  { pattern: /print\s+(your|the)\s+(system|instructions|prompt)/i, severity: 'high' },
  { pattern: /show\s+(me\s+)?(your|the)\s+(system\s+)?prompt/i, severity: 'high' },
  { pattern: /what\s+(are|were)\s+your\s+(instructions|rules)/i, severity: 'medium' },
  { pattern: /repeat\s+(your|the)\s+(system|initial)\s+(prompt|message)/i, severity: 'high' },

  // Marqueurs de prompt injection
  { pattern: /\[SYSTEM\]/i, severity: 'high' },
  { pattern: /\[INST\]/i, severity: 'high' },
  { pattern: /###\s*(system|instruction)/i, severity: 'high' },
  { pattern: /<\|?(system|im_start|im_end)\|?>/i, severity: 'high' },

  // Override de comportement
  { pattern: /override\s+(your|the)\s+(rules|instructions|guidelines|safety)/i, severity: 'high' },
  { pattern: /bypass\s+(your|the|any)\s+(rules|filter|safety|restriction)/i, severity: 'high' },
  { pattern: /disable\s+(your|the)\s+(filter|safety|restriction)/i, severity: 'high' },

  // Exfiltration de données
  { pattern: /dump\s+(the\s+)?(database|table|schema|users|data)/i, severity: 'high' },
  { pattern: /list\s+all\s+(users|customers|leads|emails|passwords)/i, severity: 'medium' },
  { pattern: /export\s+(all|every)\s+(data|record|lead)/i, severity: 'medium' },

  // Tentatives d'exécution de code
  { pattern: /execute\s+(this\s+)?(code|command|script|sql|query)/i, severity: 'high' },
  { pattern: /run\s+(this\s+)?(sql|query|command)/i, severity: 'high' },
  { pattern: /\b(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER)\s+/i, severity: 'medium' },
]

export interface PromptGuardResult {
  safe: boolean
  blocked: boolean
  reason?: string
  severity?: 'high' | 'medium'
  pattern?: string
}

/**
 * Vérifie un message utilisateur avant de l'envoyer à l'agent IA
 */
export function guardPrompt(input: string): PromptGuardResult {
  if (!input || typeof input !== 'string') {
    return { safe: false, blocked: true, reason: 'Input invalide' }
  }

  // Longueur max
  if (input.length > 4000) {
    return { safe: false, blocked: true, reason: 'Message trop long (max 4000 caractères)' }
  }

  // Vérifier chaque pattern
  for (const { pattern, severity } of INJECTION_PATTERNS) {
    if (pattern.test(input)) {
      return {
        safe: false,
        blocked: true,
        reason: 'Contenu non autorisé détecté',
        severity,
        pattern: pattern.source,
      }
    }
  }

  // Nettoyer les caractères qui peuvent perturber les prompts
  const cleaned = input
    .replace(/[<>{}]/g, '')  // Supprimer balises potentielles
    .trim()

  return { safe: true, blocked: false }
}

/**
 * Nettoie la réponse de l'IA pour s'assurer qu'elle ne fuite pas d'infos sensibles
 */
export function guardResponse(response: string): string {
  if (!response) return ''

  const SENSITIVE_PATTERNS = [
    /SUPABASE_SERVICE_ROLE/gi,
    /STRIPE_SECRET_KEY/gi,
    /RESEND_API_KEY/gi,
    /ANTHROPIC_API_KEY/gi,
    /OPENAI_API_KEY/gi,
    /sk_live_[a-zA-Z0-9]+/g,
    /sk_test_[a-zA-Z0-9]+/g,
    /whsec_[a-zA-Z0-9]+/g,
    /re_[a-zA-Z0-9]+/g,
    /eyJ[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]{20,}/g,  // JWT tokens
    /password\s*[:=]\s*['"][^'"]+['"]/gi,
  ]

  let clean = response
  for (const pattern of SENSITIVE_PATTERNS) {
    if (pattern.test(clean)) {
      return 'Je suis désolé, une erreur est survenue. Veuillez reformuler votre question.'
    }
  }

  return clean
}
