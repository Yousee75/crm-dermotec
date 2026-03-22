# SYSTÈME D'AGENTS AUTONOMES — CRM DERMOTEC

## Philosophie
A chaque session Claude Code, une équipe de 6 agents spécialisés est disponible.
Lancer les agents pertinents EN PARALLÈLE dès le début de session ou sur demande.
Chaque agent produit un rapport structuré. Les résultats sont sauvegardés en mémoire.

## 6 Agents permanents

### 1. SENTINEL (Détection erreurs)
**Quand** : Début de session, avant tout développement
**Mission** : Scanner le code pour trouver les problèmes
**Actions** :
- `npx tsc --noEmit` → erreurs TypeScript
- Grep @ts-nocheck, @ts-ignore → dette technique
- Grep TODO/FIXME/HACK → tâches oubliées
- Grep console.log → logs à nettoyer
- Vérifier imports cassés
- Vérifier fichiers vides/placeholder
**Sortie** : Rapport avec compteurs et priorités

### 2. DOCTOR (Correction automatique)
**Quand** : Après Sentinel, ou quand des erreurs sont détectées
**Mission** : Corriger automatiquement les erreurs simples
**Actions** :
- Fix imports manquants
- Fix types évidents (any → type correct)
- Supprimer console.log de debug
- Ajouter export const dynamic = 'force-dynamic' manquant
- Fix prettier/eslint
**Règle** : Ne corriger QUE les erreurs sans risque. Signaler les corrections risquées.

### 3. GUARDIAN (Sécurité)
**Quand** : Avant tout déploiement, ou après modification d'API routes
**Mission** : Audit sécurité continu
**Actions** :
- Vérifier auth sur chaque route API
- Vérifier validation zod des inputs
- Chercher secrets hardcodés
- Vérifier RLS policies
- Chercher XSS (dangerouslySetInnerHTML, eval)
- npm audit
**Sortie** : Rapport CRITIQUE/HAUTE/MOYENNE/BASSE

### 4. OBSERVER (Monitoring production)
**Quand** : Quand l'utilisateur demande un check prod, ou problème signalé
**Mission** : Vérifier la santé de la production
**Actions** :
- GET /api/health → status
- Vérifier Vercel deployment (via MCP vercel)
- Vérifier Supabase logs (via MCP supabase)
- Vérifier Stripe webhook health (via MCP stripe)
- Vérifier Sentry errors récentes (via MCP sentry)
**Sortie** : Dashboard santé avec indicateurs vert/orange/rouge

### 5. ANALYST (Données et comportements)
**Quand** : Sur demande, ou en fin de session si données disponibles
**Mission** : Analyser les données business
**Actions** :
- Requêtes Supabase : leads par statut, conversion funnel, CA pipeline
- Leads stagnants (pas d'activité > 7 jours)
- Taux de remplissage sessions
- Financements en attente > 30 jours
- Score moyen des leads par source
**Sortie** : Rapport business avec recommandations

### 6. ARCHITECT (Qualité code et structure)
**Quand** : Début de session, ou après gros développement
**Mission** : Review de la structure et de la qualité
**Actions** :
- Détecter code mort (fichiers non importés)
- Détecter patterns incohérents
- Vérifier cohérence design tokens
- Mesurer complexité (fichiers > 500 lignes)
- Vérifier couverture tests
**Sortie** : Rapport avec métriques et recommandations refactoring

## Orchestration

### Scan rapide (5 min) — à chaque début de session
```
Lancer en parallèle : SENTINEL + GUARDIAN (version light)
→ Rapport combiné "État du code"
```

### Scan complet (15 min) — avant déploiement
```
Lancer en parallèle : SENTINEL + GUARDIAN + ARCHITECT
Puis : DOCTOR (si erreurs détectées)
→ Rapport "Prêt pour production ?"
```

### Monitoring prod — sur demande
```
Lancer : OBSERVER + ANALYST
→ Rapport "Santé production + Données business"
```

## Format des rapports
```
# Rapport [AGENT] — [DATE]
## Résumé : X critiques, Y warnings, Z infos
## Détails par catégorie
## Actions recommandées (par priorité)
## Métriques vs session précédente (si disponible)
```
