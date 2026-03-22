# CHECKLIST DÉMARRAGE SESSION — OBLIGATOIRE

A chaque nouvelle session Claude Code sur ce projet, effectuer dans l'ordre :

## 1. Contexte rapide (automatique via CLAUDE.md)
- CRM Dermotec = centre formation esthétique Paris, certifié Qualiopi
- Stack : Next.js 15 + React 19 + Supabase + Stripe + Tailwind v4
- User : fondateur SaaS (Satorea), débutant dev, veut de l'ACTION

## 2. Vérifier MCPs connectés
13 MCPs doivent être actifs : sequential-thinking, context7, filesystem, supabase, stripe, playwright, figma, firecrawl, tavily, exa, memory + dermotec-crm + github (ces 2 derniers nécessitent des clés)

## 3. Plugins activés (37)
Core : typescript-lsp, serena, feature-dev, code-review, code-simplifier, pr-review-toolkit, coderabbit
Frontend : frontend-design, playground, dev-workflows-frontend
Backend : dev-workflows, compound-engineering, engineering-skills
Sécurité : security-guidance, semgrep
Deploy : vercel, sentry, posthog
Productivité : context7, superpowers, claude-md-management, hookify, skill-creator, remember, ralph-loop
Intégrations : github, linear, notion, slack, postman, playwright
Business : zoominfo, searchfit-seo, product-skills, mcp-server-dev, plugin-dev

## 4. Skills prioritaires
- `/commit` : commiter avec message structuré
- `/deploy` : déployer sur Vercel
- `/review` : review de code
- `/test` : écrire des tests
- `/frontend-design` : créer des composants UI premium
- `/feature-dev` : développement guidé de fonctionnalités
- `/refactor` : refactoring
- `/simplify` : simplifier le code

## 5. Design System — Référence rapide
```
Fonts     : DM Sans (body) + Bricolage Grotesque (headings)
Primary   : #2EC6F3 (bleu Dermotec)
Action CTA: #6366F1 (indigo — distinct du primary)
Sidebar   : #0F172A (slate-900)
Text      : #0F172A (primary) / #475569 (secondary) / #94A3B8 (muted)
Surface   : #FFFFFF / #F8FAFC (hover) / #F1F5F9 (active)
Border    : #E2E8F0
Radius    : 6/8/12/16/9999 px
Spacing   : 4/8/16/24/32/48 px (grille 8px)
Shadows   : xs→xl + glow + card + card-hover
Animations: fadeIn, fadeInUp, slideIn, scaleIn, shimmer, stagger
```

## 6. Agents spécialisés à disposition
- `Explore` : exploration codebase rapide
- `Plan` : architecture et planification
- `backend-expert` : API, Supabase, DB
- `frontend-expert` : React/Next.js/Tailwind
- `security-expert` : audit sécurité
- `test-writer` : tests
- `code-reviewer` : review
- `ui-designer` : design UI/UX
- `doc-writer` : documentation
- `devops-expert` : déploiement, CI/CD
- `performance-expert` : optimisation

## 7. Mémoires à consulter selon le sujet
- Design/UX → research_ux_conversion_patterns, research_academy_ux_engagement, guide_tone_of_voice
- Concurrents → reference_benchmark_crm, research_fr_eu_crm_formation, research_asian_crm, research_us_disruptive_crm
- Architecture → project_architecture, project_etat_ddd
- Roadmap → project_roadmap_produit, project_roadmap_launch
- Outils → project_tools_setup, project_open_source_tools
