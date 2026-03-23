# DÉMARRAGE SESSION — ORCHESTRATION CABINET DE CONSEIL

## Contexte (automatique via CLAUDE.md)
- **CRM Dermotec** = centre formation esthétique Paris, certifié Qualiopi
- **Stack** : Next.js 15 + React 19 + Supabase + Stripe + Tailwind v4
- **User** : fondateur Satorea (SaaS CRM), débutant dev, veut de l'ACTION
- **Deploy** : https://crm-dermotec.vercel.app

## Protocole de session

### Phase 1 — Diagnostic rapide (automatique, parallèle)
Lancer EN PARALLÈLE dès le début :
1. **SENTINEL** (agent Explore) : `npx tsc --noEmit 2>&1 | head -30` + grep TODO/FIXME
2. **GUARDIAN** (agent security-expert) : vérifier auth sur routes API récentes
3. **git status** : voir les changements en cours

### Phase 2 — Priorisation (30 sec)
Classer les findings en :
- 🔴 **P0** : bloque la prod (erreurs build, failles sécu)
- 🟠 **P1** : dégrade l'expérience (bugs UX, perf)
- 🟡 **P2** : dette technique (refactoring, tests)
- ⚪ **P3** : nice-to-have

### Phase 3 — Plan d'action
Proposer 3 options au user :
1. **Sprint fix** : corriger les P0/P1 (rapide)
2. **Feature dev** : nouvelle fonctionnalité (skill /feature-dev)
3. **Refonte** : amélioration structurelle (skill /refactor)

## MCPs disponibles (8)
| MCP | Usage |
|-----|-------|
| sequential-thinking | Raisonnement complexe étape par étape |
| context7 | Documentation à jour des librairies |
| filesystem | Accès fichiers projet |
| dermotec-crm | MCP custom métier (Supabase direct) |
| supabase | Gestion DB, migrations, RLS |
| vercel | Deploy, logs, env vars |
| stripe | Paiements, produits, webhooks |
| github | Issues, PRs, repo |

## Plugins par catégorie (37 actifs)

### Dev Core
- `typescript-lsp` + `serena` + `feature-dev` + `code-review` + `code-simplifier` + `pr-review-toolkit` + `coderabbit`

### Frontend
- `frontend-design` + `playground` + `dev-workflows-frontend`

### Backend & Architecture
- `dev-workflows` + `compound-engineering` + `engineering-skills`

### Sécurité
- `security-guidance` + `semgrep`

### Deploy & Monitoring
- `vercel` + `sentry` + `posthog`

### Productivité
- `superpowers` + `context7` + `claude-md-management` + `hookify` + `skill-creator` + `remember` + `ralph-loop`

### Intégrations
- `github` + `linear` + `notion` + `slack` + `postman` + `playwright`

### Business
- `zoominfo` + `searchfit-seo` + `mcp-server-dev` + `plugin-dev`

## Skills par situation

| Situation | Skill à invoquer |
|-----------|-----------------|
| Nouvelle feature | `/feature-dev` puis `/frontend-design` |
| Bug à corriger | `superpowers:systematic-debugging` |
| Avant de coder | `superpowers:brainstorming` |
| Plan complexe | `compound-engineering:\workflows:plan` |
| Exécuter un plan | `compound-engineering:\workflows:work` |
| Review de code | `/review` ou `compound-engineering:\workflows:review` |
| Mode autonome total | `compound-engineering:lfg` |
| Déployer | `/deploy` |
| Commiter | `/commit` |
| Tests | `/test` |
| Simplifier | `/simplify` |
| Refactorer | `/refactor` |
| Paralléliser | `compound-engineering:slfg` (swarm mode) |

## 11 Agents spécialisés (subagents)

| Agent | Quand l'utiliser |
|-------|-----------------|
| `Explore` | Explorer codebase rapidement |
| `Plan` | Planifier architecture |
| `backend-expert` | API, Supabase, DB |
| `frontend-expert` | React/Next.js/Tailwind |
| `security-expert` | Audit sécurité |
| `test-writer` | Écrire des tests |
| `code-reviewer` | Review de code |
| `ui-designer` | Design UI/UX |
| `doc-writer` | Documentation |
| `devops-expert` | CI/CD, deploy |
| `performance-expert` | Optimisation perf |

## Design System — Palette Satorea v5
```
Fonts     : DM Sans (body) + Bricolage Grotesque (headings)
Primary   : #FF5C00 (orange)  |  Accent: #FF2D78 (rose)
Sidebar   : #1A1A1A (noir)    |  Surface: #FAF8F5 (papier chaud)
Success   : #10B981  |  Warning: #FF8C42  |  Error: #FF2D78
JAMAIS : gris froid, bleu, violet, cyan
```

## Mémoires par sujet
- **Architecture** → project_architecture, project_etat_ddd
- **Roadmap** → project_roadmap_produit, project_roadmap_launch
- **Design** → project_palette_satorea_officielle, project_session_design_mars2026
- **Concurrents** → reference_benchmark_crm, research_etude_marche_mars2026
- **Audit** → project_gemini_audit, project_db_architecture_audit, project_cahier_recette_23mars
- **Outils** → project_tools_setup, project_open_source_tools
- **Agent IA** → project_agent_ia, reference_recherches_agent
