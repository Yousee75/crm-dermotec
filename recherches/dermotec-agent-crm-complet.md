# AGENT IA CRM — ARCHITECTURE COMPLÈTE
## Comment l'agent accède à toutes les données, se souvient, et agit avec confirmation

> Dermotec Academy — Mars 2026
> Sources : Anthropic docs (claude-sonnet-4-6), best practices production, recherches live

---

## 1. LE PROBLÈME FONDAMENTAL — POURQUOI CE N'EST PAS TRIVIAL

Un agent CRM qui "comprend tout" doit résoudre 4 problèmes en simultané :

```
Problème 1 : L'agent ne peut pas mettre TOUTE la base de données dans le prompt
→ 1000 contacts × 50 champs = des millions de tokens → impossible + "context rot"

Problème 2 : L'agent oublie entre les sessions
→ Sans mémoire persistante, chaque conversation repart de zéro

Problème 3 : L'agent peut se tromper ou halluciner
→ Il ne doit JAMAIS agir sans confirmation sur les actions irréversibles

Problème 4 : L'agent doit répondre en < 3 secondes perçues
→ Impossible si on charge tout d'un coup
```

**La solution : Context Engineering**

> "Claude est déjà assez intelligent. L'intelligence n'est pas le goulot d'étranglement — le contexte l'est."
> — Anthropic, 2026

---

## 2. LES 4 COUCHES DE MÉMOIRE DE L'AGENT

### Couche 1 — Mémoire de travail (Context Window)
Ce que l'agent "voit" en ce moment. 200k tokens (claude-sonnet-4-6) mais on cible <50k pour les performances.
- Conversation courante
- Données du contact en focus
- Résultats des outils appelés ce tour

### Couche 2 — Mémoire épisodique (PostgreSQL)
Ce qui s'est passé dans les sessions précédentes.
- Historique des conversations résumées
- Actions effectuées
- Préférences de l'utilisateur

### Couche 3 — Mémoire sémantique (pgvector)
Ce que l'agent "sait" — connaissances encodées en vecteurs.
- Base documentaire (offres, tarifs, FAQ)
- Résumés des contacts (dense, semantiquement indexé)
- Transcriptions d'appels

### Couche 4 — Mémoire procédurale (System Prompt + Tools)
Comment l'agent "fait les choses".
- Instructions permanentes dans le system prompt
- Définitions des outils disponibles
- Règles de confirmation

---

## 3. ARCHITECTURE DE CONTEXTE — CE QUE L'AGENT REÇOIT

### 3.1 Structure du prompt en production

```
┌────────────────────────────────────────────────────┐
│ SYSTEM PROMPT (~2000 tokens — CACHÉ via Prompt Caching)
│ - Identité + mission de l'agent
│ - Règles de confirmation (JAMAIS agir sans OK)
│ - Format des réponses
│ - Outils disponibles + quand les utiliser
│ - Connaissances métier Dermotec
│ - Règles de scoring et de pipeline
└────────────────────────────────────────────────────┘
           ↓ (caché — 90% de réduction de coût)
┌────────────────────────────────────────────────────┐
│ CONTEXTE DYNAMIQUE (~5000 tokens — récupéré via RAG)
│ - Résumé du contact en focus (si applicable)
│ - 3 dernières interactions pertinentes (RAG)
│ - Deals en cours de ce contact
│ - Score actuel + signals d'intent
│ - Notes importantes récentes
└────────────────────────────────────────────────────┘
           ↓ (sélectionné intelligemment)
┌────────────────────────────────────────────────────┐
│ HISTORIQUE DE CONVERSATION (~2000 tokens max)
│ - Résumé auto-généré si > 10 tours
│ - Derniers messages de la session
└────────────────────────────────────────────────────┘
           ↓
┌────────────────────────────────────────────────────┐
│ MESSAGE ACTUEL DE L'UTILISATEUR
│ "Envoie un email de suivi à Marie et crée un RDV"
└────────────────────────────────────────────────────┘

TOTAL CIBLE : ~10-15k tokens = ~0.03€ par interaction
```

### 3.2 Comment l'agent accède aux données sans tout charger

**Pattern "Retrieve on Demand" :**

```
Utilisateur : "Donne-moi un résumé de Marie Dupont"
                    ↓
Agent décide d'appeler l'outil search_contact("Marie Dupont")
                    ↓
Supabase retourne : profil + 5 dernières activités + deals actifs
                    ↓
Agent a maintenant les données pertinentes dans son contexte
                    ↓
Répond intelligemment
```

**Pattern RAG (pour les questions générales) :**

```
Utilisateur : "Quelles sont nos formations disponibles pour les peelings?"
                    ↓
RAG : cherche dans pgvector les docs les plus proches
      (catalogue formations, tarifs, conditions)
                    ↓
Retourne les 3 chunks les plus pertinents
                    ↓
Agent répond avec des infos exactes et à jour
```

---

## 4. LE SYSTEM PROMPT — LE CERVEAU DE L'AGENT

```typescript
// lib/agent/system-prompt.ts

export const CRM_AGENT_SYSTEM_PROMPT = `
Tu es l'Assistant CRM de Dermotec Academy — un assistant commercial intelligent 
spécialisé dans les formations en esthétique médicale.

## TON IDENTITÉ

Tu t'appelles Alex et tu aides l'équipe commerciale de Dermotec à :
- Gérer les contacts et les opportunités commerciales
- Analyser les données du pipeline
- Rédiger des communications personnalisées
- Créer des tâches et planifier des actions
- Générer des rapports et des insights

Tu as accès à la base de données CRM en temps réel via des outils spécialisés.

---

## RÈGLES ABSOLUES — CONFIRMATION OBLIGATOIRE

Tu DOIS TOUJOURS demander confirmation avant :
1. Envoyer un email ou un message (peu importe le canal)
2. Créer ou modifier un RDV dans le calendrier
3. Changer le statut d'un deal (notamment vers "Gagné" ou "Perdu")
4. Supprimer ou archiver un contact
5. Démarrer une séquence d'emails automatique
6. Générer un code promo

Format de confirmation obligatoire :
<action_pending>
  <type>EMAIL / RDV / DEAL_UPDATE / etc.</type>
  <description>Description précise de l'action</description>
  <data>Données JSON de l'action</data>
  <question>Confirmes-tu cette action ? [Oui / Non / Modifier]</question>
</action_pending>

Tu peux effectuer SANS confirmation :
- Lire et afficher des données
- Créer une note interne
- Calculer un score ou analyser des données
- Rechercher des contacts
- Générer du texte pour prévisualisation

---

## ACCÈS AUX DONNÉES

Pour répondre à n'importe quelle question sur un contact, utilise TOUJOURS les outils.
Ne suppose JAMAIS les données — elles changent en permanence.

Ordre de priorité pour les requêtes :
1. Si le contact est mentionné → search_contact() en premier
2. Si des données d'activité sont nécessaires → get_contact_activities()
3. Si besoin d'analyse → get_contact_analytics() pour les données PostHog
4. Pour les rapports → get_pipeline_summary()

---

## CONNAISSANCES MÉTIER DERMOTEC

**Formations disponibles :**
- Soins du visage et hydratation (niveau 1-2)
- Peelings chimiques (niveau 2-4) — 3 niveaux : initiation, avancé, expert
- Épilation laser et IPL (niveau 2-4)
- Mésothérapie (niveau 3-4)
- Maquillage permanent (niveau 3-5)
- Analyse de peau haute technologie (niveau 4-5)

**Tarifs indicatifs :**
- Formation initiation (1 jour) : 490-690€
- Formation avancée (2-3 jours) : 890-1490€
- Formation expert (3-5 jours) : 1690-2990€
- Pack complet thème : 2490-4990€

**Pipeline commercial :**
prospect → qualified → demo_scheduled → proposal_sent → negotiation → won / lost

**Signaux de maturité :**
- Niveau Academy 4+ : lead très chaud
- 3+ modules terminés : intérêt confirmé
- A demandé les tarifs : intention d'achat
- A mentionné un budget : SQL (Sales Qualified Lead)

---

## FORMAT DES RÉPONSES

- Sois concis et actionnable
- Utilise des émojis modérément pour la lisibilité (📊 🎯 ✅ ⚡)
- Pour les listes > 5 éléments, propose un tableau
- Termine TOUJOURS par une suggestion d'action suivante
- Si tu n'as pas les données nécessaires, utilise un outil pour les obtenir

---

## GESTION DU CONTEXTE

Si l'utilisateur mentionne un contact sans préciser lequel, demande de clarifier.
Si plusieurs contacts correspondent, liste les 3 premiers et demande lequel.
Mémorise le contact "en focus" pour toute la durée de la conversation.

---

Aujourd'hui : ${new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
`
```

---

## 5. LES OUTILS — CE QUE L'AGENT PEUT FAIRE

### 5.1 Définitions des outils (Tool Use Claude API)

```typescript
// lib/agent/tools.ts

import { z } from 'zod'
import type { Tool } from '@anthropic-ai/sdk/resources'

export const CRM_TOOLS: Tool[] = [
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // LECTURE — pas de confirmation requise
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    name: 'search_contact',
    description: `Recherche un ou plusieurs contacts dans le CRM.
    Utilise cet outil TOUJOURS en premier quand un contact est mentionné.
    Retourne: profil complet + deals actifs + score + dernières activités.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'Nom, email ou entreprise' },
        filters: {
          type: 'object',
          description: 'Filtres optionnels',
          properties: {
            status: { type: 'string', enum: ['cold', 'warm', 'hot', 'customer'] },
            minScore: { type: 'number' },
            hasOpenDeal: { type: 'boolean' },
            noContactSinceDays: { type: 'number' },
          }
        },
        limit: { type: 'number', default: 5 }
      },
      required: ['query']
    }
  },

  {
    name: 'get_contact_activities',
    description: `Récupère l'historique complet des interactions d'un contact.
    Inclut: emails, appels, RDVs, notes, activité sur l'Academy.
    Utilise quand tu as besoin de contexte sur les échanges passés.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        contactId: { type: 'string', description: 'UUID du contact' },
        limit: { type: 'number', default: 10 },
        types: {
          type: 'array',
          items: { type: 'string' },
          description: "Filtrer par types: 'email', 'call', 'meeting', 'academy_activity'"
        }
      },
      required: ['contactId']
    }
  },

  {
    name: 'get_pipeline_summary',
    description: `Génère un résumé du pipeline commercial.
    Utilise pour les questions de reporting, forecasting, ou vue globale.
    Peut filtrer par période, étape, assigné, ou montant.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        period: { type: 'string', enum: ['today', 'week', 'month', 'quarter', 'year'] },
        stage: { type: 'string', description: 'Filtrer par étape de pipeline' },
        assignedTo: { type: 'string', description: 'Filtrer par commercial' },
        groupBy: { type: 'string', enum: ['stage', 'source', 'formation_type', 'assigned'] }
      }
    }
  },

  {
    name: 'get_contact_analytics',
    description: `Récupère les données comportementales d'un contact depuis PostHog.
    Retourne: vidéos vues, quiz réussis, modules terminés, temps passé, score d'engagement.
    Utile pour qualifier le niveau d'intérêt d'un prospect Academy.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        contactId: { type: 'string' },
        academyUserId: { type: 'string', description: "ID de l'utilisateur Academy si lié" }
      },
      required: ['contactId']
    }
  },

  {
    name: 'search_knowledge_base',
    description: `Cherche dans la base de connaissances Dermotec.
    Contient: catalogues formations, tarifs, conditions, FAQ, argumentaires.
    Utilise pour répondre aux questions sur les offres ou générer du contenu précis.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'Question ou sujet à rechercher' },
        category: {
          type: 'string',
          enum: ['formations', 'tarifs', 'conditions', 'faq', 'argumentaires'],
          description: 'Catégorie de document'
        }
      },
      required: ['query']
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ÉCRITURE SANS CONFIRMATION — notes, score
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    name: 'add_note',
    description: `Ajoute une note interne sur un contact ou un deal.
    PAS de confirmation requise — c'est une action non-destructive.
    Utilise pour logger des observations ou des informations importantes.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        contactId: { type: 'string' },
        dealId: { type: 'string' },
        content: { type: 'string', description: 'Contenu de la note' },
        isPrivate: { type: 'boolean', default: false }
      },
      required: ['content']
    }
  },

  {
    name: 'update_contact_score',
    description: `Met à jour le score de maturité d'un contact (0-100).
    Pas de confirmation requise — c'est calculé automatiquement.
    Inclure le raisonnement pour l'audit trail.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        contactId: { type: 'string', description: 'UUID du contact' },
        score: { type: 'number', minimum: 0, maximum: 100 },
        reasoning: { type: 'string', description: 'Explication du score' },
        signals: {
          type: 'array',
          items: { type: 'string' },
          description: 'Signaux détectés (ex: ["a visionné 3 vidéos niveau 4"])'
        }
      },
      required: ['contactId', 'score', 'reasoning']
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PRÉPARATION D'ACTIONS — retourne un objet pour confirmation UI
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    name: 'prepare_email',
    description: `Prépare un email à envoyer. TOUJOURS appeler cet outil AVANT d'envoyer.
    Retourne l'email formaté pour validation par l'utilisateur.
    L'envoi réel se fait via confirm_action avec l'ID retourné.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        contactId: { type: 'string' },
        subject: { type: 'string' },
        body: { type: 'string', description: 'Corps de l\'email en HTML ou markdown' },
        sendAt: { type: 'string', description: 'ISO date pour envoi programmé (optionnel)' },
        fromName: { type: 'string', default: 'Équipe Dermotec' }
      },
      required: ['contactId', 'subject', 'body']
    }
  },

  {
    name: 'prepare_calendar_event',
    description: `Prépare un événement calendrier. TOUJOURS appeler avant de créer.
    Retourne l'événement formaté pour validation.
    Vérifier les disponibilités avant de proposer.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        title: { type: 'string' },
        startTime: { type: 'string', description: 'ISO datetime' },
        endTime: { type: 'string', description: 'ISO datetime' },
        attendees: {
          type: 'array',
          items: { type: 'string' },
          description: 'Emails des participants'
        },
        description: { type: 'string' },
        location: { type: 'string' },
        addMeetLink: { type: 'boolean', default: true },
        contactId: { type: 'string', description: 'Pour logger dans le CRM' }
      },
      required: ['title', 'startTime', 'endTime', 'attendees']
    }
  },

  {
    name: 'prepare_deal_update',
    description: `Prépare une mise à jour d'un deal. TOUJOURS appeler avant de modifier.
    Particulièrement important pour les changements de statut (won/lost).
    Retourne la diff pour validation.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        dealId: { type: 'string' },
        updates: {
          type: 'object',
          properties: {
            stage: { type: 'string' },
            amount: { type: 'number' },
            expectedCloseDate: { type: 'string' },
            probability: { type: 'number' },
            notes: { type: 'string' }
          }
        }
      },
      required: ['dealId', 'updates']
    }
  },

  {
    name: 'prepare_task',
    description: `Prépare une tâche de suivi à créer dans le CRM.
    Demande confirmation car ça crée du travail pour un humain.
    Suggère toujours une date et un assigné.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        dueDate: { type: 'string', description: 'ISO date' },
        assignedTo: { type: 'string', description: 'Email ou ID du commercial' },
        priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
        contactId: { type: 'string' },
        dealId: { type: 'string' }
      },
      required: ['title', 'dueDate']
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // EXÉCUTION — appelé uniquement après confirmation UI
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    name: 'execute_confirmed_action',
    description: `Exécute une action APRÈS confirmation explicite de l'utilisateur.
    Ne jamais appeler cet outil si l'utilisateur n'a pas dit "Oui" ou confirmé.
    L'actionId provient d'un prepare_* précédent.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        actionId: { type: 'string', description: 'ID de l\'action préparée' },
        userConfirmation: { type: 'string', description: 'Ce que l\'utilisateur a dit' },
        modifications: { type: 'object', description: 'Modifications demandées par l\'user' }
      },
      required: ['actionId', 'userConfirmation']
    }
  }
]
```

---

## 6. LE LOOP AGENTIQUE — LA BOUCLE THINK → ACT → OBSERVE → CONFIRM

```typescript
// app/api/crm/chat/route.ts

import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth/session'
import { adminClient } from '@/lib/supabase/admin'
import { CRM_AGENT_SYSTEM_PROMPT, CRM_TOOLS } from '@/lib/agent'
import { executeAgentTool } from '@/lib/agent/tool-executor'
import { getContactContext } from '@/lib/agent/context-builder'
import { saveTurn, loadConversation } from '@/lib/agent/memory'

const RequestSchema = z.object({
  message: z.string().max(5000),
  conversationId: z.string().uuid().optional(),
  contactId: z.string().uuid().optional(),
  confirmedActionId: z.string().uuid().optional(),  // Si l'user confirme une action
})

export async function POST(req: Request) {
  const session = await requireAuth()
  const body = RequestSchema.parse(await req.json())
  
  const client = new Anthropic()
  
  // 1. Construire le contexte dynamique
  const [conversation, contactContext] = await Promise.all([
    loadConversation(body.conversationId, session.user.id),
    body.contactId ? getContactContext(body.contactId) : null,
  ])
  
  // 2. Préparer les messages
  const systemPrompt = buildSystemPrompt(contactContext)
  const messages = buildMessages(conversation, body.message, body.confirmedActionId)
  
  // 3. Streaming avec Server-Sent Events
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }
      
      try {
        // 4. Boucle agentique — maximum 10 tours
        let currentMessages = messages
        let turnCount = 0
        const MAX_TURNS = 10
        
        while (turnCount < MAX_TURNS) {
          turnCount++
          
          // 5. Appel Claude avec streaming
          const response = await client.messages.create({
            model: 'claude-sonnet-4-6',
            max_tokens: 4096,
            system: systemPrompt,
            tools: CRM_TOOLS,
            tool_choice: { type: 'auto' },
            messages: currentMessages,
            // Prompt Caching sur le system prompt — économie 90% sur les tokens répétés
            betas: ['prompt-caching-2024-07-31'],
          })
          
          // 6. Streamer le texte en temps réel
          for (const block of response.content) {
            if (block.type === 'text') {
              send({ type: 'text', content: block.text })
            }
          }
          
          // 7. Si pas d'outils → l'agent a terminé
          if (response.stop_reason === 'end_turn') {
            send({ type: 'done', conversationId: conversation.id })
            
            // Sauvegarder la conversation
            await saveTurn(conversation.id, {
              userMessage: body.message,
              assistantMessage: response.content,
              model: 'claude-sonnet-4-6',
              tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
            })
            break
          }
          
          // 8. Traiter les tool calls
          if (response.stop_reason === 'tool_use') {
            const toolUseBlocks = response.content.filter(b => b.type === 'tool_use')
            
            // Signaler les outils en cours d'exécution
            for (const toolUse of toolUseBlocks) {
              send({
                type: 'tool_calling',
                toolName: toolUse.name,
                toolInput: toolUse.input,
                message: getToolMessage(toolUse.name),
              })
            }
            
            // 9. Exécuter les outils en parallèle
            const toolResults = await Promise.all(
              toolUseBlocks.map(async (toolUse) => {
                try {
                  const result = await executeAgentTool(
                    toolUse.name,
                    toolUse.input,
                    session.user.id
                  )
                  
                  // Si c'est une action qui nécessite confirmation
                  if (result.requiresConfirmation) {
                    send({
                      type: 'confirmation_required',
                      actionId: result.actionId,
                      actionType: result.actionType,
                      preview: result.preview,
                      description: result.description,
                    })
                  }
                  
                  return {
                    type: 'tool_result' as const,
                    tool_use_id: toolUse.id,
                    content: JSON.stringify(result),
                  }
                } catch (error) {
                  return {
                    type: 'tool_result' as const,
                    tool_use_id: toolUse.id,
                    content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    is_error: true,
                  }
                }
              })
            )
            
            // 10. Ajouter les résultats et continuer la boucle
            currentMessages = [
              ...currentMessages,
              { role: 'assistant' as const, content: response.content },
              { role: 'user' as const, content: toolResults },
            ]
          }
        }
        
        if (turnCount >= MAX_TURNS) {
          send({ type: 'error', message: 'Trop d\'itérations — tâche trop complexe' })
        }
        
      } catch (error) {
        send({ type: 'error', message: 'Erreur lors du traitement' })
      } finally {
        controller.close()
      }
    }
  })
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}

// Message contextuel pour chaque outil appelé
function getToolMessage(toolName: string): string {
  const messages: Record<string, string> = {
    search_contact: '🔍 Recherche du contact...',
    get_contact_activities: '📋 Chargement de l\'historique...',
    get_pipeline_summary: '📊 Analyse du pipeline...',
    get_contact_analytics: '📈 Récupération des données Academy...',
    search_knowledge_base: '📚 Consultation de la base de connaissances...',
    prepare_email: '✍️ Rédaction de l\'email...',
    prepare_calendar_event: '📅 Préparation du RDV...',
    prepare_deal_update: '🔄 Préparation de la mise à jour...',
    prepare_task: '✅ Création de la tâche...',
  }
  return messages[toolName] ?? `⚙️ Exécution de ${toolName}...`
}
```

---

## 7. LE CONTEXT BUILDER — COMMENT L'AGENT OBTIENT LES BONNES DONNÉES

```typescript
// lib/agent/context-builder.ts

import { adminClient } from '@/lib/supabase/admin'
import { searchSimilarMemories } from '@/lib/agent/vector-search'

export async function getContactContext(contactId: string): Promise<ContactContext> {
  // Charger en parallèle tout ce qui est nécessaire
  const [contact, recentActivities, openDeals, academyData, similarContacts] = 
    await Promise.all([
      // Profil complet du contact
      adminClient
        .from('crm_contacts')
        .select(`
          *,
          profiles!academy_user_id (
            level, points, streak_count, last_active_at
          )
        `)
        .eq('id', contactId)
        .single()
        .then(r => r.data),
      
      // 5 dernières activités
      adminClient
        .from('crm_activities')
        .select('type, summary, content, created_at, source_system')
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false })
        .limit(5)
        .then(r => r.data),
      
      // Deals ouverts
      adminClient
        .from('crm_deals')
        .select('title, stage, amount, expected_close_date, ai_analysis')
        .eq('contact_id', contactId)
        .not('stage', 'in', '("won","lost")')
        .then(r => r.data),
      
      // Données PostHog (si Academy user)
      contact?.academy_user_id ? 
        getAcademyAnalytics(contact.academy_user_id) : 
        Promise.resolve(null),
      
      // Contacts similaires (pour le scoring comparatif)
      searchSimilarContacts(contactId, 3),
    ])

  return {
    contact,
    recentActivities,
    openDeals,
    academyData,
    contextSummary: buildContextSummary(contact, recentActivities, openDeals, academyData),
  }
}

function buildContextSummary(contact: any, activities: any[], deals: any[], academy: any): string {
  return `
<contact_context>
  <profile>
    Nom: ${contact.first_name} ${contact.last_name}
    Email: ${contact.email}
    Entreprise: ${contact.company || 'Non renseignée'} (${contact.company_size || '?'} personnes)
    Profession: ${contact.profession}
    Score CRM: ${contact.score}/100 | Statut: ${contact.status}
    Dernière activité: ${formatRelativeDate(contact.last_activity_at)}
  </profile>

  ${academy ? `
  <academy_activity>
    Niveau Academy: ${academy.level}/5 | Points: ${academy.points}
    Modules terminés: ${academy.completedModules?.join(', ') || 'Aucun'}
    Streak: ${academy.streak} jours
    Dernière session: ${formatRelativeDate(academy.lastActiveAt)}
    Vidéos vues: ${academy.totalVideosWatched} | Quiz réussis: ${academy.quizPassed}
  </academy_activity>` : ''}

  ${deals?.length ? `
  <open_deals>
    ${deals.map(d => `
    Deal: ${d.title}
    Étape: ${d.stage} | Montant: ${d.amount ? formatCurrency(d.amount) : '?'}
    Clôture prévue: ${d.expected_close_date || 'Non défini'}
    ${d.ai_analysis ? `Analyse IA: ${d.ai_analysis}` : ''}
    `).join('\n')}
  </open_deals>` : '<open_deals>Aucun deal ouvert</open_deals>'}

  <recent_interactions>
    ${activities?.map(a => `
    [${formatRelativeDate(a.created_at)}] ${a.type.toUpperCase()} (via ${a.source_system})
    ${a.summary}
    `).join('\n') || 'Aucune interaction récente'}
  </recent_interactions>
</contact_context>
  `.trim()
}
```

---

## 8. LA MÉMOIRE VECTORIELLE — RAG AVEC PGVECTOR

```typescript
// lib/agent/vector-search.ts
// Utilise pgvector intégré dans Supabase — pas de base vectorielle séparée

import { adminClient } from '@/lib/supabase/admin'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()

// Générer les embeddings avec Claude
async function generateEmbedding(text: string): Promise<number[]> {
  // Utiliser voyage-3 d'Anthropic pour les embeddings
  // OU text-embedding-3-small d'OpenAI (plus économique)
  const response = await fetch('https://api.voyageai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.VOYAGE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: text,
      model: 'voyage-3',
    }),
  })
  const data = await response.json()
  return data.data[0].embedding
}

// Chercher dans la base de connaissances
export async function searchKnowledgeBase(query: string, category?: string): Promise<KBResult[]> {
  const embedding = await generateEmbedding(query)
  
  const { data } = await adminClient.rpc('match_knowledge', {
    query_embedding: embedding,
    match_threshold: 0.75,
    match_count: 5,
    filter_category: category || null,
  })
  
  return data ?? []
}

// Chercher dans les mémoires des contacts
export async function searchContactMemories(
  contactId: string, 
  query: string
): Promise<Memory[]> {
  const embedding = await generateEmbedding(query)
  
  const { data } = await adminClient.rpc('match_contact_memories', {
    p_contact_id: contactId,
    query_embedding: embedding,
    match_threshold: 0.70,
    match_count: 5,
  })
  
  return data ?? []
}

// Stocker une nouvelle mémoire (résumé de conversation, insight, etc.)
export async function storeMemory(
  contactId: string,
  content: string,
  type: 'conversation_summary' | 'insight' | 'preference' | 'fact'
): Promise<void> {
  const embedding = await generateEmbedding(content)
  
  await adminClient.from('agent_memories').insert({
    contact_id: contactId,
    content,
    type,
    embedding,
    created_at: new Date().toISOString(),
  })
}
```

```sql
-- Migration : Tables pour le RAG + mémoire

-- Table base de connaissances (offres, FAQ, argumentaires)
CREATE TABLE knowledge_base (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       TEXT NOT NULL,
  content     TEXT NOT NULL,
  category    TEXT NOT NULL CHECK (category IN ('formations', 'tarifs', 'conditions', 'faq', 'argumentaires')),
  embedding   vector(1024),  -- voyage-3 = 1024 dimensions
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Index HNSW pour recherche rapide (<50ms sur 100k vecteurs)
CREATE INDEX ON knowledge_base USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Table mémoires des contacts (insights IA, résumés)
CREATE TABLE agent_memories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id  UUID REFERENCES crm_contacts(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES auth.users(id),  -- NULL = mémoire partagée
  content     TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('conversation_summary', 'insight', 'preference', 'fact')),
  embedding   vector(1024),
  valid_from  TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,  -- NULL = toujours valide
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX ON agent_memories USING hnsw (embedding vector_cosine_ops);

-- Fonction de recherche dans la base de connaissances
CREATE OR REPLACE FUNCTION match_knowledge(
  query_embedding vector(1024),
  match_threshold float,
  match_count int,
  filter_category text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  title text,
  content text,
  category text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kb.id,
    kb.title,
    kb.content,
    kb.category,
    1 - (kb.embedding <=> query_embedding) as similarity
  FROM knowledge_base kb
  WHERE
    1 - (kb.embedding <=> query_embedding) > match_threshold
    AND (filter_category IS NULL OR kb.category = filter_category)
  ORDER BY kb.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Fonction de recherche dans les mémoires contact
CREATE OR REPLACE FUNCTION match_contact_memories(
  p_contact_id uuid,
  query_embedding vector(1024),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  content text,
  type text,
  similarity float,
  created_at timestamptz
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.content,
    m.type,
    1 - (m.embedding <=> query_embedding) as similarity,
    m.created_at
  FROM agent_memories m
  WHERE
    m.contact_id = p_contact_id
    AND (m.valid_until IS NULL OR m.valid_until > NOW())
    AND 1 - (m.embedding <=> query_embedding) > match_threshold
  ORDER BY m.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

---

## 9. LE SYSTÈME DE CONFIRMATION — HUMAN-IN-THE-LOOP

### 9.1 Le Tool Executor — où les actions sont interceptées

```typescript
// lib/agent/tool-executor.ts

import { adminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/resend'
import { createCalendarEvent } from '@/lib/google-calendar'
import { searchContacts } from '@/lib/dal/contacts'
import { getPipelineSummary } from '@/lib/dal/deals'
import { searchKnowledgeBase } from './vector-search'

// Map des outils qui nécessitent confirmation
const REQUIRES_CONFIRMATION = new Set([
  'prepare_email',
  'prepare_calendar_event',
  'prepare_deal_update',
  'prepare_task',
])

// Map des outils qui peuvent s'exécuter directement
const AUTO_EXECUTE = new Set([
  'search_contact',
  'get_contact_activities',
  'get_pipeline_summary',
  'get_contact_analytics',
  'search_knowledge_base',
  'add_note',
  'update_contact_score',
])

export async function executeAgentTool(
  toolName: string,
  toolInput: Record<string, unknown>,
  userId: string
): Promise<ToolResult> {
  
  // Outils de lecture → exécution directe
  if (AUTO_EXECUTE.has(toolName)) {
    return executeReadTool(toolName, toolInput, userId)
  }
  
  // Outils d'écriture → préparer pour confirmation
  if (REQUIRES_CONFIRMATION.has(toolName)) {
    return preparePendingAction(toolName, toolInput, userId)
  }
  
  // Exécution confirmée
  if (toolName === 'execute_confirmed_action') {
    return executeConfirmedAction(toolInput, userId)
  }
  
  throw new Error(`Outil inconnu: ${toolName}`)
}

async function preparePendingAction(
  toolName: string,
  toolInput: Record<string, unknown>,
  userId: string
): Promise<ToolResult> {
  
  // Générer l'aperçu selon le type d'action
  let preview: ActionPreview
  
  switch (toolName) {
    case 'prepare_email': {
      const contact = await getContactById(toolInput.contactId as string)
      preview = {
        type: 'EMAIL',
        icon: '📧',
        title: `Email à ${contact.first_name} ${contact.last_name}`,
        preview: {
          to: contact.email,
          subject: toolInput.subject as string,
          body: toolInput.body as string,
          sendAt: toolInput.sendAt as string | undefined,
        },
        riskLevel: 'medium', // Email = action irréversible
        description: `Envoyer un email à ${contact.email}`,
      }
      break
    }
    
    case 'prepare_calendar_event': {
      preview = {
        type: 'CALENDAR_EVENT',
        icon: '📅',
        title: `RDV: ${toolInput.title}`,
        preview: {
          title: toolInput.title as string,
          start: toolInput.startTime as string,
          end: toolInput.endTime as string,
          attendees: toolInput.attendees as string[],
          location: toolInput.location as string,
        },
        riskLevel: 'medium',
        description: `Créer un RDV avec ${(toolInput.attendees as string[]).join(', ')}`,
      }
      break
    }
    
    case 'prepare_deal_update': {
      const deal = await getDealById(toolInput.dealId as string)
      const updates = toolInput.updates as Record<string, unknown>
      preview = {
        type: 'DEAL_UPDATE',
        icon: '🔄',
        title: `Mise à jour: ${deal.title}`,
        preview: {
          dealTitle: deal.title,
          currentStage: deal.stage,
          newStage: updates.stage,
          changes: updates,
        },
        riskLevel: updates.stage === 'won' || updates.stage === 'lost' ? 'high' : 'low',
        description: `Modifier le deal "${deal.title}"`,
      }
      break
    }
    
    case 'prepare_task': {
      preview = {
        type: 'TASK',
        icon: '✅',
        title: `Tâche: ${toolInput.title}`,
        preview: {
          title: toolInput.title as string,
          dueDate: toolInput.dueDate as string,
          priority: toolInput.priority as string,
          description: toolInput.description as string,
        },
        riskLevel: 'low',
        description: `Créer une tâche pour le ${formatDate(toolInput.dueDate as string)}`,
      }
      break
    }
  }
  
  // Sauvegarder l'action en attente dans Supabase
  const { data: pendingAction } = await adminClient
    .from('agent_pending_actions')
    .insert({
      user_id: userId,
      tool_name: toolName,
      tool_input: toolInput,
      preview,
      status: 'pending',
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 min
    })
    .select('id')
    .single()
  
  return {
    requiresConfirmation: true,
    actionId: pendingAction!.id,
    actionType: toolName,
    preview,
    message: `Action préparée — en attente de confirmation`,
  }
}

async function executeConfirmedAction(
  input: Record<string, unknown>,
  userId: string
): Promise<ToolResult> {
  const { actionId, userConfirmation, modifications } = input
  
  // Récupérer l'action en attente
  const { data: pendingAction } = await adminClient
    .from('agent_pending_actions')
    .select('*')
    .eq('id', actionId)
    .eq('user_id', userId)
    .eq('status', 'pending')
    .single()
  
  if (!pendingAction) {
    throw new Error('Action introuvable ou expirée')
  }
  
  // Fusionner les modifications éventuelles
  const finalInput = modifications 
    ? mergeDeep(pendingAction.tool_input, modifications)
    : pendingAction.tool_input
  
  // Exécuter l'action réelle
  let result
  switch (pendingAction.tool_name) {
    case 'prepare_email':
      result = await sendEmail({
        to: finalInput.to,
        subject: finalInput.subject,
        html: finalInput.body,
        from: `${finalInput.fromName || 'Dermotec'} <noreply@dermotec.fr>`,
      })
      // Logger dans le CRM
      await logActivity(finalInput.contactId, 'email_sent', finalInput.subject, userId)
      break
    
    case 'prepare_calendar_event':
      result = await createCalendarEvent(finalInput)
      await logActivity(finalInput.contactId, 'meeting', finalInput.title, userId)
      break
    
    case 'prepare_deal_update':
      await adminClient.from('crm_deals')
        .update(finalInput.updates)
        .eq('id', finalInput.dealId)
      result = { success: true, dealId: finalInput.dealId }
      break
    
    case 'prepare_task':
      await adminClient.from('crm_tasks').insert({
        ...finalInput,
        created_by: userId,
        status: 'pending',
      })
      result = { success: true }
      break
  }
  
  // Marquer l'action comme exécutée
  await adminClient
    .from('agent_pending_actions')
    .update({ status: 'executed', executed_at: new Date().toISOString() })
    .eq('id', actionId)
  
  return {
    success: true,
    result,
    message: `✅ Action exécutée avec succès`,
  }
}
```

---

## 10. LE COMPOSANT UI — CHAT AVEC CONFIRMATIONS

```typescript
// components/crm/agent-chat.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { useEffectEvent } from 'react'
import { motion, AnimatePresence } from 'motion/react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  status?: 'streaming' | 'done' | 'error'
}

interface PendingAction {
  actionId: string
  actionType: string
  preview: ActionPreview
  description: string
}

interface ToolCallStatus {
  toolName: string
  message: string
  status: 'running' | 'done'
}

export function AgentChat({ contactId }: { contactId?: string }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [toolCalls, setToolCalls] = useState<ToolCallStatus[]>([])
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([])
  const [conversationId, setConversationId] = useState<string | undefined>()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, toolCalls, pendingActions])

  async function sendMessage(message: string, confirmedActionId?: string) {
    if (!message.trim() && !confirmedActionId) return

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: message,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsLoading(true)
    setToolCalls([])

    // Ajouter message assistant vide pour le streaming
    const assistantMsgId = crypto.randomUUID()
    const assistantMsg: Message = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      status: 'streaming',
    }
    setMessages(prev => [...prev, assistantMsg])

    try {
      const response = await fetch('/api/crm/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          conversationId,
          contactId,
          confirmedActionId,
        }),
      })

      const reader = response.body!.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const lines = decoder.decode(value).split('\n\n')
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const event = JSON.parse(line.slice(6))

          switch (event.type) {
            case 'text':
              // Streamer le texte caractère par caractère
              setMessages(prev =>
                prev.map(m =>
                  m.id === assistantMsgId
                    ? { ...m, content: m.content + event.content }
                    : m
                )
              )
              break

            case 'tool_calling':
              setToolCalls(prev => [
                ...prev,
                {
                  toolName: event.toolName,
                  message: event.message,
                  status: 'running',
                },
              ])
              break

            case 'confirmation_required':
              // L'agent demande confirmation avant d'agir
              setPendingActions(prev => [...prev, {
                actionId: event.actionId,
                actionType: event.actionType,
                preview: event.preview,
                description: event.description,
              }])
              break

            case 'done':
              if (event.conversationId) setConversationId(event.conversationId)
              setMessages(prev =>
                prev.map(m =>
                  m.id === assistantMsgId ? { ...m, status: 'done' } : m
                )
              )
              setToolCalls([])
              break

            case 'error':
              setMessages(prev =>
                prev.map(m =>
                  m.id === assistantMsgId
                    ? { ...m, content: '⚠️ ' + event.message, status: 'error' }
                    : m
                )
              )
              break
          }
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Confirmer une action proposée par l'agent
  async function confirmAction(actionId: string, confirmed: boolean) {
    setPendingActions(prev => prev.filter(a => a.actionId !== actionId))
    
    if (confirmed) {
      await sendMessage('Oui, confirme cette action', actionId)
    } else {
      await sendMessage('Non, annule cette action')
    }
  }

  return (
    <div className="flex flex-col h-full bg-zinc-950 rounded-xl border border-zinc-800">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-zinc-800">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-sm font-bold text-zinc-950">
          A
        </div>
        <div>
          <p className="text-sm font-medium text-zinc-100">Alex — Assistant CRM</p>
          <p className="text-xs text-zinc-500">
            {isLoading ? '🟡 En train de réfléchir...' : '🟢 En ligne'}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-zinc-600 py-12">
            <p className="text-2xl mb-2">🎯</p>
            <p className="text-sm">Posez une question sur vos contacts,</p>
            <p className="text-sm">demandez d'envoyer un email, créer un RDV...</p>
          </div>
        )}

        {messages.map(msg => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full bg-amber-600 flex items-center justify-center text-xs font-bold text-zinc-950 shrink-0 mt-1">
                A
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-zinc-800 text-zinc-100'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-200'
              }`}
            >
              {msg.content}
              {msg.status === 'streaming' && (
                <span className="inline-block w-1.5 h-4 bg-amber-500 ml-1 animate-pulse rounded-sm" />
              )}
            </div>
          </motion.div>
        ))}

        {/* Tool Calls en cours */}
        <AnimatePresence>
          {toolCalls.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex gap-3"
            >
              <div className="w-7 h-7 rounded-full bg-amber-600 flex items-center justify-center text-xs shrink-0 mt-1">
                A
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 space-y-2">
                {toolCalls.map((tool, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-zinc-400">
                    <div className="w-3 h-3 border border-amber-500 border-t-transparent rounded-full animate-spin" />
                    <span>{tool.message}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions en attente de confirmation */}
        <AnimatePresence>
          {pendingActions.map(action => (
            <motion.div
              key={action.actionId}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex gap-3"
            >
              <div className="w-7 h-7 rounded-full bg-amber-600 flex items-center justify-center text-xs shrink-0 mt-1">
                A
              </div>
              <ConfirmationCard
                action={action}
                onConfirm={(confirmed) => confirmAction(action.actionId, confirmed)}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-zinc-800">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
            placeholder="Écris un message ou pose une question..."
            disabled={isLoading}
            className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-600 disabled:opacity-50"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={isLoading || !input.trim()}
            className="bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-zinc-950 font-medium px-4 py-2.5 rounded-lg text-sm transition-colors"
          >
            {isLoading ? '...' : '→'}
          </button>
        </div>

        {/* Suggestions rapides */}
        <div className="flex gap-2 mt-2 flex-wrap">
          {['Rapport pipeline', 'Contacts sans suivi', 'Leads chauds', 'Stats semaine'].map(s => (
            <button
              key={s}
              onClick={() => sendMessage(s)}
              disabled={isLoading}
              className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-400 px-2.5 py-1 rounded-md transition-colors disabled:opacity-40"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// Carte de confirmation pour une action proposée
function ConfirmationCard({
  action,
  onConfirm,
}: {
  action: PendingAction
  onConfirm: (confirmed: boolean) => void
}) {
  const [modified, setModified] = useState(false)
  const riskColors = {
    low: 'border-zinc-700',
    medium: 'border-amber-600',
    high: 'border-red-600',
  }
  
  return (
    <div className={`bg-zinc-900 border-2 ${riskColors[action.preview.riskLevel]} rounded-xl p-4 max-w-md w-full`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">{action.preview.icon}</span>
        <div>
          <p className="text-sm font-medium text-zinc-100">{action.preview.title}</p>
          <p className="text-xs text-zinc-500">{action.description}</p>
        </div>
        {action.preview.riskLevel === 'high' && (
          <span className="ml-auto text-xs bg-red-950 text-red-400 border border-red-800 px-2 py-0.5 rounded-full">
            Action critique
          </span>
        )}
      </div>

      {/* Aperçu de l'action */}
      <div className="bg-zinc-950 rounded-lg p-3 mb-3 text-xs space-y-1">
        <ActionPreviewContent preview={action.preview} />
      </div>

      {/* Boutons de confirmation */}
      <div className="flex gap-2">
        <button
          onClick={() => onConfirm(true)}
          className="flex-1 bg-amber-600 hover:bg-amber-500 text-zinc-950 font-medium py-2 px-3 rounded-lg text-sm transition-colors"
        >
          ✓ Confirmer
        </button>
        <button
          onClick={() => onConfirm(false)}
          className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-2 px-3 rounded-lg text-sm transition-colors"
        >
          ✕ Annuler
        </button>
      </div>
    </div>
  )
}

function ActionPreviewContent({ preview }: { preview: ActionPreview }) {
  switch (preview.type) {
    case 'EMAIL':
      return (
        <>
          <p><span className="text-zinc-500">À:</span> <span className="text-zinc-200">{preview.preview.to}</span></p>
          <p><span className="text-zinc-500">Objet:</span> <span className="text-zinc-200">{preview.preview.subject}</span></p>
          {preview.preview.sendAt && (
            <p><span className="text-zinc-500">Envoi:</span> <span className="text-zinc-200">{formatDate(preview.preview.sendAt)}</span></p>
          )}
          <div className="mt-2 text-zinc-400 line-clamp-3">{preview.preview.body}</div>
        </>
      )
    case 'CALENDAR_EVENT':
      return (
        <>
          <p><span className="text-zinc-500">Titre:</span> <span className="text-zinc-200">{preview.preview.title}</span></p>
          <p><span className="text-zinc-500">Début:</span> <span className="text-zinc-200">{formatDate(preview.preview.start)}</span></p>
          <p><span className="text-zinc-500">Fin:</span> <span className="text-zinc-200">{formatDate(preview.preview.end)}</span></p>
          <p><span className="text-zinc-500">Participants:</span> <span className="text-zinc-200">{preview.preview.attendees.join(', ')}</span></p>
        </>
      )
    case 'DEAL_UPDATE':
      return (
        <>
          <p><span className="text-zinc-500">Deal:</span> <span className="text-zinc-200">{preview.preview.dealTitle}</span></p>
          <p>
            <span className="text-zinc-500">Statut:</span>{' '}
            <span className="text-zinc-400 line-through">{preview.preview.currentStage}</span>
            {' → '}
            <span className="text-amber-400">{preview.preview.newStage || 'inchangé'}</span>
          </p>
        </>
      )
    case 'TASK':
      return (
        <>
          <p><span className="text-zinc-500">Tâche:</span> <span className="text-zinc-200">{preview.preview.title}</span></p>
          <p><span className="text-zinc-500">Échéance:</span> <span className="text-zinc-200">{formatDate(preview.preview.dueDate)}</span></p>
          <p><span className="text-zinc-500">Priorité:</span> <span className="text-zinc-200">{preview.preview.priority}</span></p>
        </>
      )
    default:
      return <pre className="text-zinc-400">{JSON.stringify(preview.preview, null, 2)}</pre>
  }
}
```

---

## 11. PROMPT CACHING — RÉDUIRE LES COÛTS DE 90%

```typescript
// lib/agent/prompt-cache.ts

// Claude Sonnet 4.6 supporte le Prompt Caching
// Le system prompt (2000 tokens) est caché après le premier appel
// → économie de 90% sur les appels suivants (cache_read_input_tokens)

export function buildSystemPromptWithCache(contactContext: string | null) {
  return [
    {
      type: 'text' as const,
      text: CRM_AGENT_SYSTEM_PROMPT,
      // Cache control : mise en cache automatique des tokens statiques
      cache_control: { type: 'ephemeral' as const }
    },
    ...(contactContext ? [{
      type: 'text' as const,
      text: contactContext,
      // Le contexte du contact change → pas de cache
    }] : []),
  ]
}

// Estimation des coûts avec cache :
// Sans cache : 2000 tokens système × $3/MTok = $0.006 par appel
// Avec cache : 0.30$/MTok × 1 seul appel de remplissage + 0.03$/MTok × N appels suivants
// Économie sur 100 appels : ~$0.57 → ~$0.09 = 84% de réduction
```

---

## 12. MÉMOIRE LONG-TERME — ME0 PATTERN AVEC SUPABASE

```typescript
// lib/agent/long-term-memory.ts
// Pattern inspiré de Mem0 mais implémenté directement sur Supabase

export class AgentMemory {
  private contactId: string
  
  constructor(contactId: string) {
    this.contactId = contactId
  }
  
  // Extraire et sauvegarder les insights d'une conversation
  async processConversation(
    messages: Array<{role: string, content: string}>
  ): Promise<void> {
    const client = new Anthropic()
    
    // Demander à Claude d'extraire les faits importants
    const extractionResponse = await client.messages.create({
      model: 'claude-haiku-4-5-20251001', // Haiku = 10x moins cher pour les tâches simples
      max_tokens: 1000,
      system: `Extrais les faits importants de cette conversation CRM.
      Retourne UNIQUEMENT un JSON valide avec ce format:
      {
        "facts": [
          {"type": "preference|constraint|budget|timeline|objection|interest", "content": "..."}
        ],
        "summary": "Résumé en 2 phrases",
        "nextActions": ["action 1", "action 2"]
      }`,
      messages: [{
        role: 'user',
        content: `Conversation:\n${messages.map(m => `${m.role}: ${m.content}`).join('\n')}`
      }]
    })
    
    const extracted = JSON.parse(extractionResponse.content[0].text as string)
    
    // Sauvegarder les faits comme mémoires vectorielles
    await Promise.all([
      // Mémoires individuelles (vectorisées pour RAG)
      ...extracted.facts.map((fact: any) => 
        storeMemory(this.contactId, fact.content, fact.type)
      ),
      // Résumé de conversation
      adminClient.from('crm_conversations').insert({
        contact_id: this.contactId,
        summary: extracted.summary,
        next_actions: extracted.nextActions,
        messages,
        created_at: new Date().toISOString(),
      })
    ])
  }
  
  // Récupérer les mémoires pertinentes pour une nouvelle conversation
  async getRelevantMemories(query: string): Promise<string> {
    const memories = await searchContactMemories(this.contactId, query)
    
    if (memories.length === 0) return ''
    
    return `
<past_context>
Informations retenues des conversations précédentes:
${memories.map(m => `- [${m.type}] ${m.content}`).join('\n')}
</past_context>`
  }
}
```

---

## 13. TABLE SUPABASE POUR LES ACTIONS EN ATTENTE

```sql
-- Table pour stocker les actions en attente de confirmation
CREATE TABLE agent_pending_actions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id),
  contact_id  UUID REFERENCES crm_contacts(id),
  tool_name   TEXT NOT NULL,
  tool_input  JSONB NOT NULL,
  preview     JSONB NOT NULL,
  status      TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'executed', 'cancelled', 'expired')),
  expires_at  TIMESTAMPTZ NOT NULL,
  executed_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Expiration automatique
CREATE OR REPLACE FUNCTION expire_pending_actions()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE agent_pending_actions
  SET status = 'expired'
  WHERE status = 'pending' AND expires_at < NOW();
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Nettoyage quotidien
SELECT cron.schedule('cleanup-pending-actions', '0 3 * * *', 
  'DELETE FROM agent_pending_actions WHERE created_at < NOW() - INTERVAL ''7 days'''
);
```

---

## 14. RÉSUMÉ — LES 10 PRINCIPES DE L'AGENT CRM

```
1. CONTEXT ENGINEERING avant tout
   → L'agent reçoit 10-15k tokens ciblés, pas 200k de données brutes

2. RETRIEVE ON DEMAND
   → L'agent appelle les outils pour obtenir les données — il ne les a pas toutes au départ

3. RAG VECTORIEL pour la base de connaissances
   → pgvector dans Supabase — pas de base vectorielle séparée

4. PROMPT CACHING = 90% moins cher
   → System prompt mis en cache après le 1er appel

5. MÉMOIRE EN 4 COUCHES
   → Context window + PostgreSQL + pgvector + System Prompt

6. NEVER ACT WITHOUT CONFIRMATION
   → Toute action irréversible passe par un prepare_* + confirmation UI

7. HAIKU POUR LES TÂCHES SIMPLES
   → Extraction de facts, scoring, résumés = Haiku 4.5 (10x moins cher)

8. SONNET POUR LES TÂCHES COMPLEXES
   → Raisonnement, rédaction d'emails, analyse = claude-sonnet-4-6

9. STREAMING POUR L'UX
   → SSE/Stream pour que l'utilisateur voit la réponse en temps réel

10. AUDIT TRAIL COMPLET
    → Chaque action, chaque tool call = log dans audit_logs
```

---

*Dermotec CRM Agent — Architecture complète v1.0 — Mars 2026*
