# ORCHESTRATION MULTI-AGENTS — CABINET DE CONSEIL

## Philosophie
Claude Code = **directeur de projet** qui orchestre une équipe d'agents spécialisés.
Chaque tâche complexe doit être décomposée et distribuée EN PARALLÈLE.

## Patterns d'orchestration

### Pattern 1 — Scan & Fix (maintenance)
```
[En parallèle]
├── Agent Explore → scanner erreurs TypeScript
├── Agent security-expert → audit routes API
├── Agent code-reviewer → qualité code modifié
└── git diff → changements récents
→ Synthèse → Plan de corrections → Exécution
```

### Pattern 2 — Feature Development (nouvelle fonctionnalité)
```
1. Brainstorm (superpowers:brainstorming)
2. [En parallèle]
   ├── Agent Plan → architecture technique
   ├── Agent Explore → patterns existants similaires
   └── WebSearch → best practices
3. Plan validé par user
4. [En parallèle]
   ├── Agent backend-expert → API + DB
   ├── Agent frontend-expert → composants UI
   └── Agent test-writer → tests
5. Review (compound-engineering:\workflows:review)
6. Deploy (/deploy)
```

### Pattern 3 — Bug Fix (correction)
```
1. superpowers:systematic-debugging
2. [En parallèle]
   ├── Agent Explore → trouver le code concerné
   ├── Grep → chercher patterns similaires
   └── git log → historique du fichier
3. Fix ciblé
4. Test
5. Commit (/commit)
```

### Pattern 4 — Refonte (amélioration structurelle)
```
1. Brainstorm
2. [En parallèle]
   ├── Agent Explore → inventaire complet zone concernée
   ├── Agent performance-expert → bottlenecks
   └── Mémoire → audits précédents
3. Plan en phases
4. Exécution phase par phase (compound-engineering:\workflows:work)
5. Review multi-agents
```

### Pattern 5 — Deploy & Monitor (mise en production)
```
1. [En parallèle]
   ├── npm run build → vérifier build
   ├── Agent security-expert → audit pré-deploy
   └── Agent test-writer → tests critiques
2. /deploy
3. Vérification post-deploy (/api/health)
4. Monitor (sentry, posthog)
```

## Règles d'orchestration

1. **Toujours paralléliser** les tâches indépendantes (Agent tool en batch)
2. **Toujours prioriser** P0 > P1 > P2 > P3
3. **Toujours proposer** des options au user (pas décider seul)
4. **Toujours vérifier** avant de déclarer "terminé" (build, test, lint)
5. **Toujours sauvegarder** les décisions importantes en mémoire
6. **Toujours utiliser** les skills quand elles existent (pas réinventer)
7. **Toujours commiter** par petits lots cohérents (pas un mega-commit)

## MCP Thinking Protocol
Pour les décisions complexes, utiliser sequential-thinking MCP :
- Architecture decisions
- Diagnostic de bug complexe
- Planification multi-étapes
- Arbitrage entre options techniques

## Matrice outils × situations

| Besoin | Outil principal | Fallback |
|--------|----------------|----------|
| DB schema | MCP supabase | SQL direct |
| Paiements | MCP stripe | API route |
| Deploy | /deploy (skill) | `npx vercel --prod` |
| Review | /review + pr-review-toolkit | Agent code-reviewer |
| Tests | /test | Agent test-writer |
| Docs | Agent doc-writer | Écriture directe |
| SEO | searchfit-seo skills | WebSearch |
| Enrichissement | MCP zoominfo | API enrichment |
| Monitoring | MCP sentry + posthog | Vercel logs |
