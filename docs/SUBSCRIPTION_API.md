# APIs Abonnements SaaS — CRM Dermotec

## 📋 Vue d'ensemble

Ce système permet de gérer les abonnements SaaS via Stripe Billing avec 4 plans :
- **Découverte** : Gratuit (50 leads max)
- **Pro** : 49€/mois (leads illimités, 3 utilisateurs)
- **Expert** : 99€/mois (10 utilisateurs, automations)
- **Clinique** : 199€/mois (utilisateurs illimités, multi-centres)

## 🔧 Configuration requise

### Variables d'environnement

```bash
# Stripe (obligatoire)
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx

# Price IDs Stripe (obligatoire pour les plans payants)
STRIPE_PRICE_PRO=price_xxxxx
STRIPE_PRICE_EXPERT=price_yyyyy
STRIPE_PRICE_CLINIQUE=price_zzzzz

# Optionnel : plans annuels avec remise
STRIPE_PRICE_PRO_ANNUAL=price_aaaaaa
STRIPE_PRICE_EXPERT_ANNUAL=price_bbbbbb
STRIPE_PRICE_CLINIQUE_ANNUAL=price_cccccc

# Base URL pour les redirections
NEXT_PUBLIC_APP_URL=https://crm-dermotec.vercel.app
```

### Configuration Stripe Dashboard

1. **Créer les produits et prix** dans Stripe Dashboard
2. **Configurer les webhooks** : `https://votre-domaine.com/api/stripe/webhook`
3. **Events à écouter** :
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `checkout.session.completed`

## 📡 Routes API

### GET `/api/stripe/subscription`

Récupère l'abonnement actuel de l'utilisateur connecté.

**Headers:**
```
Authorization: Bearer <supabase-jwt>
```

**Réponse:**
```json
{
  "subscription": {
    "id": "sub_xxxxx",
    "status": "active",
    "plan": "pro",
    "current_period_end": 1672531200000,
    "cancel_at_period_end": false,
    "created": 1669939200000,
    "price_id": "price_xxxxx"
  },
  "customer": {
    "id": "cus_xxxxx",
    "email": "user@example.com"
  },
  "plan": "pro",
  "invoices": [
    {
      "id": "in_xxxxx",
      "date": 1672531200000,
      "amount": 4900,
      "status": "paid",
      "pdf_url": "https://pay.stripe.com/invoice/...",
      "number": "FACT-001"
    }
  ]
}
```

### POST `/api/stripe/checkout-subscription`

Crée une session Checkout pour un abonnement.

**Headers:**
```
Authorization: Bearer <supabase-jwt>
Content-Type: application/json
```

**Body:**
```json
{
  "planId": "pro"
}
```

**Réponse:**
```json
{
  "url": "https://checkout.stripe.com/pay/cs_xxxxx",
  "session_id": "cs_xxxxx",
  "plan": "pro"
}
```

**Erreurs possibles:**
```json
// Plan non configuré
{
  "error": "Plan pro non configuré dans Stripe"
}

// Abonnement existant
{
  "error": "Un abonnement actif existe déjà",
  "subscription_id": "sub_xxxxx",
  "redirect_to_portal": true
}
```

### POST `/api/stripe/portal`

Génère une session Customer Portal pour gérer l'abonnement.

**Headers:**
```
Authorization: Bearer <supabase-jwt>
```

**Réponse:**
```json
{
  "url": "https://billing.stripe.com/session/xxxxx",
  "customer_id": "cus_xxxxx"
}
```

## 🎣 Hooks React Query

### `useSubscription()`

```tsx
import { useSubscription } from '@/hooks/use-subscription'

function MyComponent() {
  const { data, isLoading, error } = useSubscription()

  if (isLoading) return <div>Chargement...</div>
  if (error) return <div>Erreur: {error.message}</div>

  return (
    <div>
      Plan actuel: {data?.plan}
      {data?.subscription && (
        <p>Expire le: {new Date(data.subscription.current_period_end).toLocaleDateString()}</p>
      )}
    </div>
  )
}
```

### `useCreateSubscriptionCheckout()`

```tsx
import { useCreateSubscriptionCheckout } from '@/hooks/use-subscription'

function UpgradeButton() {
  const createCheckout = useCreateSubscriptionCheckout()

  return (
    <button
      onClick={() => createCheckout.mutate('pro')}
      disabled={createCheckout.isPending}
    >
      {createCheckout.isPending ? 'Redirection...' : 'Passer à Pro'}
    </button>
  )
}
```

### `useCustomerPortal()`

```tsx
import { useCustomerPortal } from '@/hooks/use-subscription'

function ManageSubscriptionButton() {
  const openPortal = useCustomerPortal()

  return (
    <button onClick={() => openPortal.mutate()}>
      Gérer mon abonnement
    </button>
  )
}
```

### `useCurrentPlan()`

```tsx
import { useCurrentPlan } from '@/hooks/use-subscription'

function FeatureButton() {
  const { plan, isPro, isLoading } = useCurrentPlan()

  if (isLoading) return null

  if (!isPro) {
    return <div>Fonctionnalité Pro requise</div>
  }

  return <button>Fonctionnalité Pro disponible!</button>
}
```

## 🚪 Feature Gating

### Composant `FeatureGate`

```tsx
import { FeatureGate } from '@/components/subscription/FeatureGate'

function AdvancedAnalytics() {
  return (
    <FeatureGate
      requiredPlan="expert"
      fallbackMessage="Les analytics avancés nécessitent un plan Expert"
      onUpgradeClick={() => console.log('Upgrade to Expert')}
    >
      <AdvancedAnalyticsWidget />
    </FeatureGate>
  )
}
```

### Hook `useFeatureAccess`

```tsx
import { useFeatureAccess } from '@/components/subscription/FeatureGate'

function MyComponent() {
  const { hasAccess, userPlan, requiredPlan } = useFeatureAccess('expert')

  if (!hasAccess) {
    return <div>Upgrade to {requiredPlan} required</div>
  }

  return <AdvancedFeature />
}
```

## 🎨 Composant d'exemple

```tsx
import { SubscriptionManager } from '@/components/subscription/SubscriptionManager'

function SettingsPage() {
  return (
    <div>
      <h1>Paramètres</h1>

      {/* Gestionnaire complet */}
      <SubscriptionManager />

      {/* Version compacte */}
      <SubscriptionManager
        compact={true}
        showPlanSelection={false}
      />
    </div>
  )
}
```

## 🔄 Webhooks Stripe

Le webhook `/api/stripe/webhook` gère automatiquement :

### `customer.subscription.created`
- Met à jour `user_metadata` avec les infos d'abonnement
- Log l'activité dans la table `activites`

### `customer.subscription.updated`
- Met à jour le statut (cancel_at_period_end, etc.)
- Log les changements

### `customer.subscription.deleted`
- Revient au plan gratuit `decouverte`
- Log l'annulation

### `invoice.payment_succeeded`
- Log les paiements réussis (abonnements récurrents)

### `invoice.payment_failed`
- Log les échecs de paiement
- Déclenche les alertes (à implémenter)

## 🧪 Tests

### Test manuel avec cURL

```bash
# Vérifier abonnement (remplacer JWT)
curl -H "Authorization: Bearer YOUR_JWT" \
     https://crm-dermotec.vercel.app/api/stripe/subscription

# Créer checkout Pro
curl -X POST \
     -H "Authorization: Bearer YOUR_JWT" \
     -H "Content-Type: application/json" \
     -d '{"planId":"pro"}' \
     https://crm-dermotec.vercel.app/api/stripe/checkout-subscription

# Ouvrir portal client
curl -X POST \
     -H "Authorization: Bearer YOUR_JWT" \
     https://crm-dermotec.vercel.app/api/stripe/portal
```

### Script de test automatisé

```bash
node test-subscription-api.mjs
```

## 🔐 Sécurité

- ✅ **Auth required** : Toutes les routes nécessitent un JWT Supabase valide
- ✅ **Validation Zod** : Inputs validés côté serveur
- ✅ **Signature webhook** : Vérification signature Stripe obligatoire
- ✅ **Idempotence** : Checkout avec idempotency keys
- ✅ **Rate limiting** : Via middleware Next.js
- ✅ **No client secrets** : Aucune clé secrète exposée côté client

## 🚀 Déploiement

1. **Ajouter les env vars** dans Vercel
2. **Configurer les webhooks** Stripe avec l'URL prod
3. **Créer les produits** et récupérer les Price IDs
4. **Tester** avec les 3 routes API
5. **Implémenter** les composants UI dans votre dashboard

---

## 📞 Support

En cas de problème :
1. Vérifier les logs Stripe Dashboard
2. Vérifier les logs Vercel (`vercel logs --follow`)
3. Tester avec Stripe CLI : `stripe listen --forward-to localhost:3000/api/stripe/webhook`