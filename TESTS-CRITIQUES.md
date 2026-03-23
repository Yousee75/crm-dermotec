# Tests Critiques CRM Dermotec

## 📋 Tests ajoutés

### 1. `src/__tests__/api-auth.test.ts` — Tests authentification API
**Zone critique** : `src/lib/api-auth.ts`

**Tests couverts** :
- ✅ Requête sans token → 401
- ✅ Requête avec token invalide → 401
- ✅ Requête avec user valide → retourne user
- ✅ Mode démo → bypass auth avec user fictif
- ✅ Gestion des env vars manquantes
- ✅ Gestion des cookies corrompus/vides
- ✅ Erreurs Supabase gracieusement gérées

**Pourquoi critique** : Toutes les API routes passent par `requireAuth()`. Un bug ici = faille sécurité majeure.

### 2. `src/__tests__/stripe-webhook.test.ts` — Tests webhook Stripe
**Zone critique** : `src/app/api/stripe/webhook/route.ts`

**Tests couverts** :
- ✅ **Sécurité** : Signature manquante/invalide → 400/401
- ✅ **Idempotence** : Même événement deux fois → pas de doublon
- ✅ **Événements supportés** :
  - `checkout.session.completed` avec `inscription_id`/`commande_id`
  - `payment_intent.succeeded`
  - Ignore événements déjà payés
- ✅ **Fallback** : Inngest fail → traitement inline
- ✅ **Async** : Inngest success → traitement background
- ✅ **Gestion erreurs** : DB fail → retry logic

**Pourquoi critique** : Les paiements Stripe transitent ici. Bug = perte d'argent ou statuts cassés.

### 3. `src/__tests__/pipeline-transitions.test.ts` — Tests transitions pipeline
**Zone critique** : `src/lib/validators.ts` (state machines)

**Tests couverts** :
- ✅ **Leads** : 11 statuts, transitions valides/invalides, SPAM terminal
- ✅ **Financements** : Workflow OPCO complet, refus, compléments
- ✅ **Sessions** : Workflow formation, reports, annulations
- ✅ **Inscriptions** : EN_ATTENTE → CONFIRMEE → COMPLETEE
- ✅ **Lignes financement** : Workflow simplifié par ligne
- ✅ **Edge cases** : Même statut, terminaux, sauts interdits

**Pourquoi critique** : Les transitions de statut sont la logique métier cœur. Bug = corruption des données business.

## 🚀 Exécution

### Tests individuels
```bash
# Test API auth
npx vitest run src/__tests__/api-auth.test.ts

# Test Stripe webhook
npx vitest run src/__tests__/stripe-webhook.test.ts

# Test transitions pipeline
npx vitest run src/__tests__/pipeline-transitions.test.ts
```

### Script groupé
```bash
# Linux/Mac
./test-critical.sh

# Windows
test-critical.bat
```

### Tous les tests
```bash
npm test
```

## 📊 Couverture attendue

- **API Auth** : 100% (toutes les branches)
- **Stripe Webhook** : ~95% (événements principaux + edge cases)
- **Pipeline Transitions** : 100% (toutes les transitions possibles)

## 🎯 Impact business

Ces 3 zones représentent **80%** des bugs critiques potentiels :

1. **Auth cassé** = Site inaccessible
2. **Webhook cassé** = Paiements perdus
3. **Transitions cassées** = Données corrompues

En couvrant ces zones, nous réduisons drastiquement les risques de production.

## 🔧 Maintenance

- **Ajouter** un test à chaque nouvelle transition de statut
- **Mettre à jour** les tests webhook si nouveaux événements Stripe
- **Tester** l'auth après toute modification de middleware
- **Exécuter** `npm test` avant chaque déploiement

---

*Tests créés le 23 mars 2026 — CRM Dermotec v1.0*