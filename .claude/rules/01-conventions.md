# CONVENTIONS CRM DERMOTEC

## Stack technique
- Next.js 15 + React 19 + TypeScript strict
- Supabase (Postgres + Auth + RLS + Storage)
- Stripe (paiements formations + e-shop)
- Resend (emails transactionnels)
- Tailwind v4 + framer-motion + sonner
- React Query v5 + zustand + react-hook-form + zod

## Couleurs branding
- Primary: #2EC6F3 (bleu Dermotec)
- Accent: #082545 (bleu nuit sidebar)
- Success: #22C55E, Warning: #F59E0B, Error: #EF4444

## Fonts
- Headings: Bricolage Grotesque (--font-heading)
- Body: DM Sans (--font-body)

## Patterns obligatoires
1. **Centraliser** dans constants.ts (jamais hardcoder prix, URLs, couleurs)
2. **Valider** côté serveur (API routes) avec zod
3. **Logger** toute action dans table activites via activity-logger.ts
4. **Lazy init** pour services externes (Resend, Stripe) — silent fallback si env var manquante
5. **State machines** pour les transitions de statut (validators.ts)
6. **Hover CSS** (Tailwind), jamais onMouseEnter/onMouseLeave
7. **Touch targets** minimum 44x44px sur mobile

## Nommage
- Fichiers: kebab-case (use-leads.ts, activity-logger.ts)
- Composants: PascalCase (ActivityTimeline.tsx)
- Types/Enums: PascalCase (StatutLead, TypeActivite)
- Constantes: UPPER_SNAKE (FORMATIONS_SEED, DELAI_RAPPEL)
- Tables SQL: snake_case pluriel (leads, formations, inscriptions)

## Base de données
- 18 tables principales + 4 tables audit (field_history, login_logs, smart_actions, anomalies)
- RLS activé sur toutes les tables
- Triggers updated_at automatiques
- Full-text search sur leads (colonne fts)
- Audit trail champ par champ (track_field_changes trigger)
