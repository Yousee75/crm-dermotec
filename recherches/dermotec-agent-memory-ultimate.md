# AGENT IA — MÉMOIRE, PERFORMANCE & TECHNIQUES QUI FONT LA DIFFÉRENCE
## Bibliothèques, benchmarks, méthodes peu conventionnelles, implémentation Claude Code

> Mars 2026 | Sources : papers arXiv, docs officielles, benchmarks indépendants, QCon London 2026
> Objectif : agent CRM Dermotec plus fort que tout ce qui existe

---

## ÉTAT DES LIEUX — CE QUI MARCHE VRAIMENT EN 2026

### Le benchmark qui compte : LoCoMo (Long Conversation Memory)

Tests sur des conversations longues, multi-sessions, avec des faits qui évoluent dans le temps.

| Système | Précision (J-score) | Latence P50 | Coût tokens | Type |
|---------|---------------------|-------------|-------------|------|
| **Memori Labs** | **81.95%** | — | **4.98% du full-context** | Semantic triples |
| Zep (Graphiti) | 78.94% | 1.29s | 67% moins que Zep v1 | Temporal knowledge graph |
| LangMem | 78.05% | 17.99s (!) | Faible | Vector + résumés |
| Mem0 | 62.47-72.93% | **0.148s (!)** | Moyen | Vector + graph optionnel |
| Full-context | Référence | 9.87s | 20× plus cher | Tout envoyer |
| Mem0 + graph | 75.71% | 0.19s | Moyen | Hybride |

**Enseignements critiques du benchmark :**
- Full-context = le plus précis sur les questions simples, mais **9× plus lent** et **20× plus cher**
- Mem0 = **latence la plus basse** (148ms) mais précision plus faible sur le multi-hop
- Zep = **meilleur sur les questions temporelles et relationnelles** (comment X a changé au fil du temps)
- LangMem = excellente précision mais **17s de latence P50** → INUTILISABLE en interactif
- Memori Labs (nouveau, mars 2026) = ÉTAT DE L'ART en précision ET en coût

---

## PARTIE 1 — LES BIBLIOTHÈQUES EN DÉTAIL

### 1.1 Mem0 — Le choix pragmatique pour démarrer

**Repo :** `pip install mem0ai`
**Pour :** personnalisation multi-sessions, production rapide, SDK JS/Python

**Architecture :**
```
Conversation → LLM extrait les "memories" → Vector store (sémantique)
                                           → Knowledge graph (entités/relations) [Pro]
Requête → Hybrid search → Top-k memories → Context window
```

**Intégration Supabase (self-hosted) :**
```python
from mem0 import Memory

config = {
    "vector_store": {
        "provider": "supabase",
        "config": {
            "connection_string": "postgresql://...",
            "embedding_model_dims": 1536,
            "collection_name": "agent_memories",
        }
    },
    "llm": {
        "provider": "anthropic",
        "config": {
            "model": "claude-haiku-4-5-20251001",  # Haiku = 10× moins cher pour extraction
            "temperature": 0,
            "max_tokens": 2000,
        }
    },
    "embedder": {
        "provider": "openai",  # OU voyageai pour meilleure qualité
        "config": {"model": "text-embedding-3-small"}
    }
}

memory = Memory.from_config(config)

# Après chaque conversation :
memory.add(
    messages=[{"role": "user", "content": "Mon budget max est 2000€"}],
    user_id="contact_uuid_123",
    metadata={"source": "crm_chat", "type": "budget_constraint"}
)

# Avant chaque nouvelle conversation :
relevant_memories = memory.search(
    query="budget formation",
    user_id="contact_uuid_123",
    limit=5
)
# → [{"memory": "Budget max: 2000€", "score": 0.94}, ...]
```

**Résultat réel :**
- 80% de réduction des tokens de prompt
- 91% moins de latence vs full-context
- ~0.001$ par mémoire stockée

---

### 1.2 Graphiti / Zep — Le choix pour les relations temporelles

**Repo :** `pip install graphiti-core` (open-source) ou Zep Cloud (géré)
**Pour :** CRM → IDÉAL. Les clients changent, leurs budgets changent, leurs objections évoluent.

**Ce que Graphiti fait que personne d'autre ne fait :**
- **Bi-temporal model** : quand l'événement est arrivé ET quand on l'a appris
- **Edge invalidation** : si Marie dit "mon budget est maintenant 5000€", l'ancienne info est *invalidée* (pas supprimée — on peut still query l'historique)
- **Hybrid search** : cosine similarity + BM25 + graph traversal en parallèle
- **P95 latency : 300ms** malgré la complexité du graph

**Cas d'usage CRM parfait :**
```python
from graphiti_core import Graphiti
from graphiti_core.nodes import EpisodeType

graphiti = Graphiti(
    neo4j_uri="bolt://localhost:7687",
    neo4j_user="neo4j", 
    neo4j_password="password",
    llm_client=anthropic_client,
    embedder=openai_embedder,
)

# Ingérer un email de Marie
await graphiti.add_episode(
    name="email_2026-03-15",
    episode_body="""
    Marie: Bonjour, j'ai discuté avec ma directrice et finalement on peut monter 
    jusqu'à 4500€ pour la formation peelings avancés. On voudrait faire ça en juin.
    """,
    source=EpisodeType.message,
    source_description="Email entrant de Marie Dupont",
    reference_time=datetime(2026, 3, 15),
    group_id="contact_marie_dupont"  # Namespace par contact
)

# Graphiti extrait automatiquement :
# Entity: Marie Dupont (contact)
# Edge: Marie → budget_formation → 4500€ [valid: depuis 15/03/2026]
# Edge: ancien budget 2000€ → INVALIDÉ le 15/03/2026
# Edge: Marie → interested_in → formation peelings avancés
# Edge: Marie → preferred_timing → juin 2026

# Query temporelle : qu'est-ce qui était vrai avant le 15/03 ?
results = await graphiti.search(
    "budget Marie Dupont",
    group_ids=["contact_marie_dupont"],
    reference_time=datetime(2026, 3, 10),  # avant la mise à jour
)
# → retourne l'ancien budget 2000€ (historique préservé)

# Query actuelle
results = await graphiti.search(
    "budget et timing de Marie",
    group_ids=["contact_marie_dupont"],
)
# → budget 4500€, juin 2026
```

**Entités custom (Pydantic) — Pattern Dermotec :**
```python
from graphiti_core.nodes import EntityNode
from pydantic import BaseModel

class DermotecContact(BaseModel):
    profession: str | None = None
    company_name: str | None = None
    max_budget: float | None = None
    interested_trainings: list[str] = []
    objections: list[str] = []
    
class DermotecDeal(BaseModel):
    amount: float | None = None
    formation_type: str | None = None
    expected_close: str | None = None
    stage: str | None = None

# Graphiti extrait ces entités structurées des conversations
```

**Self-hosted avec Neo4j (RGPD) :**
```yaml
# docker-compose.yml
services:
  neo4j:
    image: neo4j:5.26
    ports: ["7474:7474", "7687:7687"]
    environment:
      NEO4J_AUTH: neo4j/yourpassword
      NEO4J_PLUGINS: '["apoc", "graph-data-science"]'
    volumes:
      - neo4j_data:/data
  
  graphiti-api:
    image: zepai/graphiti:latest
    environment:
      NEO4J_URI: bolt://neo4j:7687
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
      OPENAI_API_KEY: ${OPENAI_API_KEY}
    depends_on: [neo4j]
```

---

### 1.3 Memori Labs — Le nouveau SOTA (mars 2026)

**Site :** memorilabs.ai | **Approche :** semantic triples + session summaries

**Idée centrale :** Transformer les conversations en triples sémantiques structurés.

```
Conversation → LLM extrait → Semantic triples (sujet, prédicat, objet)
                           → Session summaries

Exemple :
"Marie a dit que son budget max est 4500€ pour peelings"
→ Triple : (Marie, budget_max_formation, 4500€)
→ Triple : (Marie, interested_in_training, peelings_avances)

Résultat : 81.95% précision, 1294 tokens par query (4.98% du full-context)
```

**Pourquoi c'est fort :**
- Les triples sont **queryables comme une DB** (pas juste par similarité)
- **Gouvernance** : chaque fact a une source, une date, un auteur
- **Compliance** : expliquable, auditable, modifiable

Pour Dermotec : open-source disponible sur GitHub (paper arXiv:2603.14588)

---

### 1.4 LangGraph — L'orchestrateur avec état persistant

**Repo :** `pip install langgraph`
**Pour :** workflows complexes avec human-in-the-loop, checkpoints, multi-step

**Ce que LangGraph ajoute à notre agent :**
- **Checkpoints PostgreSQL** : l'agent peut reprendre exactement où il était
- **Human-in-the-loop natif** : interruption à n'importe quel node
- **State partagé** : tous les nodes partagent un State TypedDict
- **Time-travel debugging** : inspecter n'importe quelle étape passée

```typescript
// Exemple LangGraph.js pour Dermotec CRM
import { StateGraph, MessagesAnnotation, START, END, interrupt } from "@langchain/langgraph"
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres"

// Schema d'état de l'agent CRM
const CRMAgentState = {
  messages: MessagesAnnotation.spec,
  contactId: { value: (a: string, b: string) => b ?? a },
  pendingActions: { value: (a: any[], b: any[]) => [...a, ...b], default: () => [] },
  confirmedActions: { value: (a: any[], b: any[]) => [...a, ...b], default: () => [] },
}

// Nodes du graph
const analyzeIntent = async (state: typeof CRMAgentState) => {
  // Claude analyse l'intent
  const response = await claude.messages.create({ ... })
  return { messages: [response] }
}

const collectContext = async (state: typeof CRMAgentState) => {
  // Récupérer données CRM
  if (!state.contactId) return {}
  const context = await getContactContext(state.contactId)
  return { messages: [{ role: 'tool', content: JSON.stringify(context) }] }
}

const requestConfirmation = async (state: typeof CRMAgentState) => {
  // Pause pour validation humaine
  const action = state.pendingActions[0]
  if (!action) return {}
  
  // interrupt() = l'exécution s'arrête et attend la reprise
  const userInput = interrupt({
    message: "Action en attente de confirmation",
    action,
  })
  
  return { confirmedActions: [{ ...action, confirmed: userInput.confirmed }] }
}

// Construction du graph
const graph = new StateGraph(CRMAgentState)
  .addNode("analyze", analyzeIntent)
  .addNode("collect_context", collectContext)
  .addNode("confirm_action", requestConfirmation)
  .addNode("execute_action", executeAction)
  .addEdge(START, "collect_context")
  .addEdge("collect_context", "analyze")
  .addConditionalEdges("analyze", (state) => {
    const lastMsg = state.messages[state.messages.length - 1]
    if (lastMsg.pendingAction) return "confirm_action"
    return END
  })
  .addEdge("confirm_action", "execute_action")
  .addEdge("execute_action", END)

// Checkpointing PostgreSQL — CRUCIAL pour production
const checkpointer = PostgresSaver.fromConnString(process.env.DATABASE_URL)
const compiledGraph = graph.compile({ checkpointer })

// Utilisation avec thread_id pour la persistance
const config = { configurable: { thread_id: conversationId } }

// Si interruption → reprendre avec la confirmation
await compiledGraph.invoke(
  { messages: userMessages },
  { ...config, invokeOptions: { resumeValue: { confirmed: true } } }
)
```

---

## PARTIE 2 — TECHNIQUES QUI FONT LA VRAIE DIFFÉRENCE

### 2.1 Hybrid Search — La technique d'Anthropic elle-même

**Citation directe d'un benchmark Anthropic × AWS :**
> "Using reranked contextual embedding and contextual BM25 reduced the top-20-chunk retrieval failure rate by **67%**, from 5.7% to 1.9%."

**Pattern : BM25 → Vector → Reranker (3 étapes en cascade)**

```
1. BM25 (rapide, exact) : récupère 100 candidats
2. Vector search : récupère 100 candidats sémantiques
3. RRF (Reciprocal Rank Fusion) : fusionne les 200 résultats
4. Reranker (Cohere) : sélectionne les 10 meilleurs
   → +40% de précision perçue sur les RAGs enterprise

Règle : fixer d'abord recall > 90% (hybrid search), puis optimiser precision (reranker)
```

**Implémentation PostgreSQL Full-Text + pgvector :**
```sql
-- La requête hybride magique — BM25 + vecteur en un seul appel
WITH vector_results AS (
  SELECT id, content, 
         1 - (embedding <=> query_embedding) AS vector_score
  FROM knowledge_base
  WHERE 1 - (embedding <=> query_embedding) > 0.6
  ORDER BY embedding <=> query_embedding
  LIMIT 50
),
bm25_results AS (
  SELECT id, content,
         ts_rank_cd(to_tsvector('french', content), plainto_tsquery('french', $query)) AS bm25_score
  FROM knowledge_base
  WHERE to_tsvector('french', content) @@ plainto_tsquery('french', $query)
  ORDER BY bm25_score DESC
  LIMIT 50
),
-- Reciprocal Rank Fusion
rrf_combined AS (
  SELECT 
    COALESCE(v.id, b.id) as id,
    COALESCE(v.content, b.content) as content,
    COALESCE(1.0 / (60 + rank() OVER (ORDER BY v.vector_score DESC)), 0) +
    COALESCE(1.0 / (60 + rank() OVER (ORDER BY b.bm25_score DESC)), 0) AS rrf_score
  FROM vector_results v
  FULL OUTER JOIN bm25_results b ON v.id = b.id
)
SELECT * FROM rrf_combined ORDER BY rrf_score DESC LIMIT 20;
```

**Reranking avec Cohere (après le hybrid search) :**
```typescript
// Cohere Rerank 4 — self-learning, 40% amélioration sur les domaines spécialisés
import { CohereClient } from 'cohere-ai'

const cohere = new CohereClient({ token: process.env.COHERE_API_KEY })

async function hybridSearchWithRerank(query: string, topK = 5): Promise<Result[]> {
  // 1. Hybrid search PostgreSQL → 20 candidats
  const candidates = await hybridSearchPostgres(query, 20)
  
  // 2. Reranking Cohere → top 5
  const reranked = await cohere.v2.rerank({
    model: 'rerank-v3.5',
    query,
    documents: candidates.map(c => ({ id: c.id, text: c.content })),
    topN: topK,
    returnDocuments: true,
  })
  
  return reranked.results.map(r => ({
    ...candidates.find(c => c.id === r.document.id),
    relevanceScore: r.relevanceScore,
  }))
}

// Coût estimé : $1/1000 appels → quasi-gratuit en production
```

---

### 2.2 Semantic Caching — 70% de réduction de coûts

**Source : Redis LangCache → jusqu'à 70% cost reduction, 15× faster responses**

**Idée :** si deux requêtes sont sémantiquement proches (cosine similarity > 0.95), retourner le résultat caché.

```typescript
// lib/agent/semantic-cache.ts
// Implémentation légère avec pgvector (pas besoin de Redis)

interface CacheEntry {
  queryEmbedding: number[]
  query: string
  response: string
  toolResults: object
  createdAt: Date
  hitCount: number
}

export class SemanticCache {
  private readonly SIMILARITY_THRESHOLD = 0.95
  private readonly TTL_MINUTES = 60  // Cache 1h pour les requêtes CRM

  async get(query: string): Promise<CacheEntry | null> {
    const embedding = await generateEmbedding(query)
    
    const { data } = await adminClient.rpc('semantic_cache_lookup', {
      query_embedding: embedding,
      threshold: this.SIMILARITY_THRESHOLD,
      ttl_minutes: this.TTL_MINUTES,
    })
    
    if (data?.[0]) {
      // Incrémenter le hit count
      await adminClient
        .from('semantic_cache')
        .update({ hit_count: data[0].hit_count + 1 })
        .eq('id', data[0].id)
      return data[0]
    }
    return null
  }

  async set(query: string, response: string, toolResults: object): Promise<void> {
    const embedding = await generateEmbedding(query)
    await adminClient.from('semantic_cache').insert({
      query,
      query_embedding: embedding,
      response,
      tool_results: toolResults,
    })
  }
}

// SQL pour la table
/*
CREATE TABLE semantic_cache (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  query       TEXT NOT NULL,
  query_embedding vector(1024),
  response    TEXT NOT NULL,
  tool_results JSONB DEFAULT '{}',
  hit_count   INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX ON semantic_cache USING hnsw (query_embedding vector_cosine_ops);

CREATE OR REPLACE FUNCTION semantic_cache_lookup(
  query_embedding vector(1024),
  threshold float,
  ttl_minutes int
) RETURNS TABLE (id uuid, query text, response text, tool_results jsonb, hit_count int)
LANGUAGE sql AS $$
  SELECT id, query, response, tool_results, hit_count
  FROM semantic_cache
  WHERE 
    1 - (query_embedding <=> $1) > $2
    AND created_at > NOW() - ($3 || ' minutes')::interval
  ORDER BY query_embedding <=> $1
  LIMIT 1;
$$;
*/
```

**Quand utiliser :** requêtes répétitives (rapports hebdomadaires, "combien de leads cette semaine ?")
**Quand ne pas utiliser :** requêtes avec données temps-réel qui changent souvent

---

### 2.3 ACE (Agentic Context Engineering) — Contexts qui s'améliorent seuls

**Source :** arXiv 2510.04618, ICLR 2026

**Idée :** au lieu de réécrire le contexte (qui cause le *context collapse* — perte d'infos), accumuler de manière incrémentale avec génération + réflexion + curation.

**Pattern "Dynamic Cheatsheet" adapté au CRM Dermotec :**
```typescript
// lib/agent/ace-context.ts
// Le system prompt évolue automatiquement avec les learnings

export class ACEContextManager {
  private cheatsheet: string = ''  // Accumulation incrémentale
  
  async updateAfterSession(
    messages: Message[],
    outcomes: { toolCallsSucceeded: boolean[], hallucinations: string[] }
  ): Promise<void> {
    // Étape 1 : Générer de nouveaux insights depuis la session
    const newInsights = await claude.messages.create({
      model: 'claude-haiku-4-5-20251001',
      system: `Tu analyses une session d'agent CRM pour extraire des leçons.
      IMPORTANT : n'extrais que les insights NOUVEAUX et ACTIONNABLES.
      Format : bullet points courts, max 50 mots chacun.`,
      messages: [{
        role: 'user',
        content: `
Session: ${JSON.stringify(messages.slice(-10))}
Outils qui ont échoué: ${outcomes.toolCallsSucceeded.filter(v => !v).length}
Hallucinations détectées: ${outcomes.hallucinations.join(', ')}

Quelles leçons pour améliorer les prochaines sessions ?`
      }],
      max_tokens: 500,
    })
    
    const insights = newInsights.content[0].text
    
    // Étape 2 : Fusionner avec le cheatsheet existant (pas réécrire !)
    const merged = await claude.messages.create({
      model: 'claude-haiku-4-5-20251001',
      system: `Tu maintiens un "cheatsheet" de bonnes pratiques pour un agent CRM.
      RÈGLES CRITIQUES :
      - JAMAIS compresser des insights existants importants
      - AJOUTER les nouveaux insights si pas déjà couverts
      - SUPPRIMER uniquement si redondant ou obsolète
      - Garder < 300 mots total`,
      messages: [{
        role: 'user',
        content: `
Cheatsheet actuel:
${this.cheatsheet || "(vide)"}

Nouveaux insights:
${insights}

Retourne le cheatsheet mis à jour (< 300 mots).`
      }],
      max_tokens: 600,
    })
    
    this.cheatsheet = merged.content[0].text
    
    // Persister dans Supabase
    await adminClient.from('ace_cheatsheet').upsert({
      agent_id: 'crm_agent',
      content: this.cheatsheet,
      updated_at: new Date().toISOString(),
    })
  }
  
  // Injecter le cheatsheet dans le system prompt dynamiquement
  buildSystemPrompt(basePrompt: string): string {
    if (!this.cheatsheet) return basePrompt
    return `${basePrompt}

<learned_strategies>
${this.cheatsheet}
</learned_strategies>`
  }
}
```

**Résultat attendu sur 30 sessions :** l'agent apprend à éviter ses erreurs répétées et s'améliore automatiquement.

---

### 2.4 Programmatic Tool Calling (PTC) — Moins de tokens, moins d'erreurs

**Source :** Anthropic Engineering Blog

**Résultat Anthropic :** -37% de tokens (43k → 27k), latence divisée par 10+ sur 20+ tool calls.

**Idée :** au lieu de faire un tool call à la fois (avec une inference complète), Claude écrit du CODE qui orchestre plusieurs tool calls.

```typescript
// Tool spécial : exécuter du code qui appelle d'autres outils
const CODE_EXECUTOR_TOOL = {
  name: 'execute_analysis_code',
  description: `Exécute du JavaScript pour orchestrer plusieurs opérations CRM.
  Utilise quand tu dois faire plus de 3 opérations en séquence.
  Le code a accès à : searchContacts(), getActivities(), getDeals(), updateScore()`,
  input_schema: {
    type: 'object',
    properties: {
      code: { 
        type: 'string',
        description: 'Code JavaScript à exécuter (sandbox sécurisé)'
      },
      description: {
        type: 'string',
        description: 'Ce que le code fait'
      }
    },
    required: ['code', 'description']
  }
}

// Exemple de ce que Claude génère avec PTC :
/*
Claude écrit :
```javascript
// Analyser les 20 leads les plus froids de la semaine
const contacts = await searchContacts({ 
  noContactSinceDays: 30, 
  minScore: 40,
  limit: 20 
})

const results = await Promise.all(
  contacts.map(async c => {
    const activities = await getActivities(c.id, { limit: 3 })
    const academy = await getAcademyData(c.id)
    return {
      ...c,
      lastActivity: activities[0]?.created_at,
      academyLevel: academy?.level,
      completedModules: academy?.completed_modules?.length
    }
  })
)

// Trier par potentiel
return results
  .sort((a, b) => b.academyLevel - a.academyLevel)
  .map(c => `${c.name} | Niveau ${c.academyLevel} | Last: ${c.lastActivity}`)
  .join('\n')
```
→ 1 seul inference call, 20 opérations en parallèle
vs
→ 20 inference calls pour la même chose sans PTC
*/
```

---

### 2.5 Tool Search — Pas de "context stuffing"

**Source :** Anthropic Engineering, mars 2026

**Problème :** avec 20+ outils, les définitions bouffent 50-100k tokens AVANT que l'agent commence à raisonner.

**Solution : Tool Search Tool** — l'agent cherche les outils dont il a besoin.

```typescript
// Au lieu de charger TOUS les outils dès le départ :
const TOOL_SEARCH_TOOL = {
  name: 'search_tools',
  description: `Recherche les outils disponibles pour une tâche.
  Retourne les 3-5 outils les plus pertinents avec leur description.
  Utilise AVANT d'appeler un outil pour t'assurer qu'il existe.`,
  input_schema: {
    type: 'object',
    properties: {
      task: { type: 'string', description: 'Ce que tu veux faire' }
    },
    required: ['task']
  }
}

// Registry des outils (pas chargés au démarrage)
const TOOL_REGISTRY = new Map([
  ['search_contact', { description: 'Chercher un contact', tags: ['read', 'contact'] }],
  ['send_email', { description: 'Envoyer un email', tags: ['write', 'email'] }],
  ['create_deal', { description: 'Créer un deal', tags: ['write', 'deal'] }],
  // ... 50+ outils possibles
])

async function searchAvailableTools(task: string): Promise<Tool[]> {
  const taskEmbedding = await generateEmbedding(task)
  
  // Trouver les outils les plus proches semantiquement
  const toolScores = await Promise.all(
    Array.from(TOOL_REGISTRY.entries()).map(async ([name, info]) => {
      const toolEmbedding = await generateEmbedding(info.description)
      const similarity = cosineSimilarity(taskEmbedding, toolEmbedding)
      return { name, ...info, similarity }
    })
  )
  
  return toolScores
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 5)
    .map(t => FULL_TOOL_DEFINITIONS.get(t.name)!)
}
```

---

### 2.6 Contextual Chunking — La technique de Anthropic qui améliore le RAG de 67%

**Source :** Anthropic Contextual Retrieval paper

**Problème classique :** découper les docs en chunks fait perdre le contexte.
**Solution :** ajouter automatiquement du contexte à chaque chunk AVANT de le vectoriser.

```typescript
// lib/rag/contextual-chunking.ts

async function createContextualChunk(
  document: string,
  chunk: string,
  chunkIndex: number
): Promise<string> {
  const response = await claude.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 100,
    system: 'Génère un contexte court pour ce fragment de document. UNIQUEMENT 2-3 phrases.',
    messages: [{
      role: 'user',
      content: `
Document complet:
<document>${document}</document>

Fragment à contextualiser:
<chunk>${chunk}</chunk>

Génère 2-3 phrases de contexte qui expliquent où ce fragment s'inscrit dans le document global.
`
    }],
    // Prompt caching sur le document — crucial si le doc est long
    // La 2e-Nième fois, le document est caché → 90% moins cher
  })
  
  const context = response.content[0].text
  return `${context}\n\n${chunk}`
}

// Résultat : -67% de retrieval failures sur les top-20 chunks
// Coût extra : ~$0.001 par document au moment de l'indexation (one-time cost)
```

---

### 2.7 Memory Decay — Oublier intelligemment

**Ce qu'aucun tuto n'explique :** garder tout en mémoire n'est pas une bonne chose. Le signal se noie dans le bruit.

```sql
-- Decay temporel : les vieilles mémoires perdent de leur poids
-- Implémenté directement dans la fonction de recherche

CREATE OR REPLACE FUNCTION search_with_decay(
  query_embedding vector(1024),
  contact_id uuid,
  match_count int DEFAULT 5
)
RETURNS TABLE (id uuid, content text, score float, age_days int)
LANGUAGE sql AS $$
  SELECT 
    id,
    content,
    -- Score = similarité × decay temporel (demi-vie de 30 jours)
    (1 - (embedding <=> query_embedding)) * 
    exp(-0.023 * EXTRACT(EPOCH FROM (NOW() - created_at)) / 86400) AS score,
    EXTRACT(EPOCH FROM (NOW() - created_at)) / 86400 AS age_days
  FROM agent_memories
  WHERE 
    agent_memories.contact_id = $2
    AND (valid_until IS NULL OR valid_until > NOW())
  ORDER BY score DESC
  LIMIT $3;
$$;

-- Formule decay : exp(-λ × t) où λ = ln(2)/demi-vie
-- Demi-vie 30 jours → une info de 30j vaut 50% d'une info d'aujourd'hui
-- Demi-vie 30 jours → une info de 90j vaut 12.5%
```

---

### 2.8 Le Pattern "Reflect & Store" — L'agent apprend de lui-même

**Inspiré de Reflexion (arXiv:2303.11366) × Mem0**

```typescript
// Après chaque session : l'agent réfléchit et stocke ses apprentissages
async function reflectAndStore(
  session: AgentSession,
  contact: CRMContact
): Promise<void> {
  // 1. Extraire les faits importants (Haiku pour économiser)
  const extraction = await claude.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 500,
    system: `Extrais les informations critiques de cette session CRM.
    Format JSON strict :
    {
      "facts": [{"content": "...", "type": "budget|timeline|objection|preference|decision"}],
      "contradicts_old": ["ancienne_info_à_invalider"],
      "next_best_actions": ["action 1", "action 2"],
      "contact_mood": "positive|neutral|negative|urgent"
    }`,
    messages: [{ role: 'user', content: formatSession(session) }]
  })
  
  const { facts, contradicts_old, next_best_actions, contact_mood } = 
    JSON.parse(extraction.content[0].text)
  
  // 2. Stocker les nouveaux faits (avec embeddings)
  await Promise.all(
    facts.map(async (fact: any) => {
      const embedding = await generateEmbedding(fact.content)
      await adminClient.from('agent_memories').insert({
        contact_id: contact.id,
        content: fact.content,
        type: fact.type,
        embedding,
        valid_from: new Date().toISOString(),
      })
    })
  )
  
  // 3. Invalider les faits contradictoires
  await Promise.all(
    contradicts_old.map((oldFact: string) =>
      adminClient.from('agent_memories')
        .update({ valid_until: new Date().toISOString() })
        .eq('contact_id', contact.id)
        .textSearch('content', oldFact)
    )
  )
  
  // 4. Créer les tâches de suivi dans le CRM
  await Promise.all(
    next_best_actions.map((action: string) =>
      adminClient.from('crm_activities').insert({
        contact_id: contact.id,
        type: 'ai_action',
        summary: action,
        next_action: action,
        next_action_date: getNextBusinessDay(),
        created_by: 'ai_reflection',
      })
    )
  )
  
  // 5. Mettre à jour le contexte émotionnel
  await adminClient.from('crm_contacts')
    .update({ 
      current_mood: contact_mood,
      ai_analysis: `Session ${new Date().toLocaleDateString('fr-FR')}: ${contact_mood}`,
    })
    .eq('id', contact.id)
}
```

---

## PARTIE 3 — STACK RECOMMANDÉE POUR DERMOTEC

### Architecture hybride — le meilleur des mondes

```
NIVEAU 1 : Session courante (context window, ~10k tokens)
├── System prompt avec ACE cheatsheet évolutif
├── Contact context (SQL Supabase)
├── 3 dernières mémoires pertinentes (pgvector decay)
└── Historique compressé de la session

NIVEAU 2 : Mémoire moyen terme (pgvector Supabase)
├── Faits structurés extraits par Haiku (budget, timeline, objections)
├── Résumés de conversations précédentes
└── Préférences et contraintes connues

NIVEAU 3 : Graph de relations (Graphiti auto-hébergé)
├── Entités : contacts, deals, formations
├── Relations : "Marie travaille chez", "intéressé par", "a mentionné"
└── Timeline : évolution des faits dans le temps (budget passé de 2000 à 4500€)

NIVEAU 4 : Base de connaissances (hybrid search + reranking)
├── Catalogue formations Dermotec (vectorisé avec contextual chunking)
├── Tarifs et conditions
└── FAQ et argumentaires commerciaux
```

### Choix de modèles selon la tâche

```typescript
const MODEL_ROUTING = {
  // Raisonnement complexe, analyse CRM complète → Sonnet 4.6
  complex_analysis: 'claude-sonnet-4-6',
  
  // Extraction de faits, scoring, résumés → Haiku 4.5 (10× moins cher)
  fact_extraction: 'claude-haiku-4-5-20251001',
  
  // Questions simples, réponses rapides → Haiku 4.5
  quick_answers: 'claude-haiku-4-5-20251001',
  
  // Rédaction d'emails commerciaux → Sonnet 4.6
  email_drafting: 'claude-sonnet-4-6',
  
  // Analyse de sentiment, classification → Haiku 4.5
  sentiment_analysis: 'claude-haiku-4-5-20251001',
}

// Estimation coûts sur 1000 interactions/mois :
// Sans routing : 1000 × Sonnet → ~$15
// Avec routing (70% Haiku) : → ~$4
// Économie : 73%
```

### Ce qui différenciera Dermotec de tout concurrent

```
1. Graphiti temporel → "Marie avait dit budget 2000€ en janvier, maintenant c'est 4500€"
   → Aucun autre CRM AI ne fait ça nativement

2. Contextual chunking → FAQ et argumentaires 67% plus précis au RAG

3. ACE cheatsheet → L'agent apprend de ses erreurs et s'améliore automatiquement

4. Decay temporel → Les vieilles infos s'effacent progressivement (pas de "context pollution")

5. Semantic cache → Les requêtes répétitives (rapports hebdo) = instantané et gratuit

6. Model routing → 73% moins cher qu'un agent full-Sonnet

7. Hybrid BM25+vector+reranking → 67% moins d'échecs de retrieval vs vector seul
```

---

## PARTIE 4 — IMPLÉMENTATION CLAUDE CODE (FICHIER CLAUDE.MD EXTENSION)

### Agent Skill pour Claude Code

```markdown
<!-- .claude/agents/crm-memory-specialist.md -->
---
name: crm-memory-specialist
description: >
  Spécialiste de la mémoire de l'agent CRM Dermotec.
  Utilise UNIQUEMENT pour : 
  - Implémenter de nouvelles stratégies de mémoire
  - Optimiser les recherches vectorielles
  - Améliorer le context engineering
  - Tuner les prompts de l'agent
tools: Read, Edit, Bash
model: claude-sonnet-4-6  # Sonnet pour la complexité
---

## Contexte

Tu travailles sur l'agent CRM Dermotec Academy.
L'agent utilise :
- pgvector (Supabase) pour la mémoire vectorielle
- Graphiti pour le knowledge graph temporel  
- Mem0 pour la mémoire structurée cross-sessions
- LangGraph pour les checkpoints d'état
- Claude claude-haiku-4-5 pour l'extraction de faits (moins cher)
- Claude claude-sonnet-4-6 pour le raisonnement complexe

## Règles de la mémoire

1. JAMAIS écraser une mémoire — toujours invalider + créer (non-lossy)
2. Toujours utiliser le decay temporel dans les requêtes
3. Contextual chunking sur TOUS les nouveaux documents indexés
4. Hybrid search (BM25 + pgvector + RRF) puis Cohere reranking
5. Semantic cache sur les requêtes > 0.95 de similarité

## Patterns à éviter

- ❌ Full-context (envoyer toute la DB) — trop lent, trop cher
- ❌ LangMem en interactif (17s de latence)
- ❌ Vector search seul sans BM25 — manque les keywords exacts
- ❌ Écraser les vieilles mémoires — utiliser valid_until

## Patterns à utiliser

- ✅ Graphiti pour les relations temporelles (budget qui change, statut qui évolue)
- ✅ Mem0 pour la personnalisation rapide cross-sessions
- ✅ ACE cheatsheet pour l'amélioration continue du system prompt
- ✅ Programmatic Tool Calling pour les analyses multi-étapes
```

---

## PARTIE 5 — TOP 15 TIPS DES MEILLEURS PRATICIENS

Ces tips viennent de QCon London 2026, papers arXiv, et practitioners qui ont tout perdu avec de mauvaises architectures.

### Tip 1 : "Intelligence isn't the bottleneck, context is"
*— Anthropic, Context Engineering best practices*

Avant d'upgrader le modèle, améliorer le contexte. Un Haiku avec un bon contexte bat un Sonnet avec un mauvais contexte.

### Tip 2 : Placez les instructions APRÈS le document long, pas avant
*— Anthropic prompting best practices*

```typescript
// ❌ Instruction → Document (Claude oublie l'instruction à la fin)
system: "Réponds uniquement aux questions sur les formations..."
user: `<document>${longDocument}</document>\n\nQuestion: ...`

// ✅ Document → Instruction (Claude lit l'instruction en dernier, se souvient mieux)
user: `<document>${longDocument}</document>\n\n<instructions>Réponds uniquement...</instructions>\n\nQuestion: ...`
```

### Tip 3 : XML tags > texte libre pour structurer le contexte
*— Anthropic docs*

```typescript
// ❌
`Contact: Marie Dupont, email: marie@spa.fr, score: 78, deals: Formation peelings...`

// ✅ Claude parse mieux les structures XML
`<contact>
  <name>Marie Dupont</name>
  <email>marie@spa.fr</email>
  <score>78</score>
  <open_deals>
    <deal type="Formation peelings" stage="proposal_sent" />
  </open_deals>
</contact>`
```

### Tip 4 : Exemples négatifs aussi importants que les exemples positifs
*— Anthropic Context Engineering secrets*

```typescript
// Dans le system prompt
`<examples>
  <example>
    <input>Envoie un email à tous les contacts</input>
    <correct_action>REFUSER — action trop large, demander plus de précision</correct_action>
    <wrong_action>Préparer un email en masse</wrong_action>
  </example>
  <example>
    <input>Qui sont mes leads les plus chauds ?</input>
    <correct_action>search_contact avec filters={minScore: 70, hasOpenDeal: true}</correct_action>
    <wrong_action>Répondre de mémoire sans appeler l'outil</wrong_action>
  </example>
</examples>`
```

### Tip 5 : Chunk size optimal = 256 tokens pour le CRM
*— Tests empiriques + benchmark Mem0*

Trop grand (>512) = bruit, mauvaise précision
Trop petit (<128) = contexte perdu, mauvaises embeddings
256 tokens = sweet spot pour les notes CRM et emails

### Tip 6 : Toujours utiliser `cache_control` sur le system prompt
*— Économie 90% sur chaque appel répété*

```typescript
messages.create({
  system: [
    {
      type: 'text',
      text: LONG_SYSTEM_PROMPT,  // 2000+ tokens
      cache_control: { type: 'ephemeral' }  // ← LA LIGNE QUI CHANGE TOUT
    }
  ],
  // ...
})
// 1er appel : plein prix
// 2e-1000e appels : 10% du prix (90% de réduction)
```

### Tip 7 : Haiku pour l'extraction, Sonnet pour le raisonnement
*— Économie 73% sur les coûts totaux*

Haiku 4.5 fait très bien : extraction JSON, classification, scoring, résumés.
Réserver Sonnet pour : rédaction d'emails, analyse complexe, conversations nuancées.

### Tip 8 : "Recall first, precision second"
*— Bswen.com, hybrid search practitioner*

Implémenter d'abord le hybrid search pour améliorer le recall (> 90%), PUIS ajouter un reranker pour la precision. Un reranker sur un mauvais recall = perte de temps.

### Tip 9 : Semantic triples > flat text pour les faits structurés
*— Memori Labs paper (81.95% vs 62% pour Mem0)*

```typescript
// ❌ Stocker le texte brut
"Marie Dupont a un budget de 4500€ pour les formations"

// ✅ Stocker comme triple sémantique
{ subject: "Marie Dupont", predicate: "budget_formation", object: "4500€", valid_from: "2026-03-15" }

// Avantage : queryable exactement ("donne-moi tous les contacts avec budget > 3000€")
// → Impossible avec du texte vectorisé
```

### Tip 10 : Invalider sans supprimer (non-lossy memory)
*— Zep/Graphiti architecture principle*

```sql
-- ❌ Mauvais : supprimer l'ancienne info
DELETE FROM agent_memories WHERE content LIKE '%budget%';

-- ✅ Bon : invalider avec timestamp
UPDATE agent_memories 
SET valid_until = NOW()
WHERE contact_id = $1 AND type = 'budget'
AND valid_until IS NULL;
-- L'historique est préservé pour les audits et l'analyse temporelle
```

### Tip 11 : Guardrails AVANT l'exécution, pas après
*— "The AI Agents Stack (2026 Edition)", Medium*

```typescript
// Valider AVANT que l'agent appelle un outil destructeur
function validateAgentAction(toolName: string, input: any): ValidationResult {
  if (toolName === 'execute_confirmed_action') {
    if (!input.userConfirmation) return { allowed: false, reason: 'Confirmation manquante' }
    if (input.actionType === 'send_email_bulk') return { allowed: false, reason: 'Bulk email interdit' }
  }
  return { allowed: true }
}
```

### Tip 12 : Thread ID stable = mémoire persistante automatique
*— LangGraph checkpointing patterns*

```typescript
// Même utilisateur = même thread_id = agent se souvient entre sessions
const config = {
  configurable: {
    thread_id: `user_${userId}`,       // Persistance cross-sessions
    // OU
    thread_id: `contact_${contactId}`, // Persistance par contact
  }
}
```

### Tip 13 : Max 6-8 chunks dans le contexte final
*— Advanced RAG practitioners*

Au-delà de 8 chunks, le modèle commence à se perdre. Mieux vaut 6 chunks de haute qualité que 15 mediocres.

### Tip 14 : Compression conversationnelle avant 10 tours
*— Redis AI Architecture blog*

```typescript
// Compresser l'historique avant qu'il devienne trop long
if (messages.length > 10) {
  const summary = await claude.messages.create({
    model: 'claude-haiku-4-5-20251001',
    system: 'Résume cette conversation en 5 bullet points essentiels',
    messages: [{ role: 'user', content: formatMessages(messages.slice(0, -3)) }],
    max_tokens: 300,
  })
  
  // Garder summary + 3 derniers messages
  messages = [
    { role: 'user', content: `<conversation_summary>${summary.content[0].text}</conversation_summary>` },
    ...messages.slice(-3)
  ]
}
```

### Tip 15 : Mesurer, pas supposer
*— Vellum AI, QCon London 2026*

```typescript
// Évaluer l'agent avec des cas de test fixes
const EVAL_CASES = [
  {
    query: "Quels sont mes leads les plus chauds cette semaine?",
    expected_tools: ["search_contact"],
    expected_contains: ["score", "activité récente"],
  },
  {
    query: "Envoie un email de suivi à Marie",
    should_confirm_before_send: true,
    forbidden_actions: ["execute_confirmed_action"],  // Sans confirmation d'abord
  }
]

// Lancer les evals après chaque changement de prompt ou d'architecture
```

---

## RÉSUMÉ — LA RECETTE GAGNANTE

```
Pour un agent CRM plus fort que tout :

1. MÉMOIRE HYBRIDE
   Short-term  → Context window (10-15k tokens, curé)
   Mid-term    → pgvector Supabase (facts, summaries, decay temporel)
   Long-term   → Graphiti (relations temporelles, invalidation non-lossy)
   Semantic    → Contextual chunking + hybrid BM25+vector + Cohere reranking

2. PERFORMANCE
   Semantic cache     → 70% cost reduction sur requêtes répétitives
   Model routing      → 73% cost reduction (Haiku pour extraction)
   Prompt caching     → 90% cost reduction sur system prompt
   PTC                → 37% token reduction sur multi-step

3. AUTO-AMÉLIORATION
   ACE cheatsheet     → L'agent s'améliore session après session
   Reflect & Store    → Les insights sont capitalisés automatiquement
   Memory decay       → Oublier intelligemment pour rester performant

4. FIABILITÉ
   Guardrails         → Valider AVANT l'exécution
   Confirmation UI    → Jamais agir sans OK humain sur actions destructrices
   LangGraph checkpoints → Reprendre où l'agent s'est arrêté
   Eval cases         → Mesurer continuellement la qualité
```

---

*Sources principales : Memori Labs paper (arXiv:2603.14588, mars 2026), Zep/Graphiti paper (arXiv:2501.13956), ACE paper (arXiv:2510.04618), Anthropic Engineering Blog, QCon London 2026, Redis AI Architecture, Mem0 benchmark paper (arXiv:2504.19413), Cohere Rerank × AWS benchmark*
