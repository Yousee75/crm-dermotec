# Architecture Feature Gating - CRM Dermotec

## Vue d'ensemble

Le système de feature gating permet de contrôler l'accès aux fonctionnalités selon le plan de l'utilisateur. Il repose sur 3 piliers :

1. **Plans & Features** (`src/lib/plans/features.ts`) - Configuration centralisée
2. **Hooks React** (`src/hooks/use-feature.ts`) - Logique métier
3. **Composants UI** (`src/components/ui/FeatureGate.tsx`) - Interface utilisateur

## Plans Disponibles

| Plan | Prix | Couleur | Description |
|------|------|---------|-------------|
| `free` | 0€ | `#71717a` | Découverte (50 contacts, 1 pipeline) |
| `pro` | 49€ | `#d4a853` | Pro (500 contacts, 3 pipelines, AI Coach) |
| `expert` | 99€ | `#3b82f6` | Expert (illimité + export PDF + API) |
| `clinique` | Sur devis | `#22c55e` | Clinique (white label + SSO) |

## Features avec Limites

### Limites quantitatives
- `contacts_limit` : 50 → 500 → ∞ → ∞
- `pipelines_limit` : 1 → 3 → ∞ → ∞
- `ai_coach_monthly` : 0 → 20 → ∞ → ∞
- `email_sequences` : 0 → 5 → ∞ → ∞
- `multi_users` : 1 → 3 → 10 → ∞

### Features booléennes
- `export_csv` : ❌ → ✅ → ✅ → ✅
- `export_pdf` : ❌ → ❌ → ✅ → ✅
- `api_access` : ❌ → ❌ → ✅ → ✅
- `custom_branding` : ❌ → ❌ → ❌ → ✅
- `sso` : ❌ → ❌ → ❌ → ✅

## Utilisation

### Composant FeatureGate

Wrapper qui masque/verrouille le contenu si non autorisé :

```tsx
import { FeatureGate } from '@/components/ui/FeatureGate'

// Gating simple
<FeatureGate feature="export_csv">
  <button>Exporter CSV</button>
</FeatureGate>

// Gating avec limite d'usage
<FeatureGate feature="contacts_limit" currentUsage={127}>
  <button>+ Nouveau Contact</button>
</FeatureGate>

// Avec fallback custom
<FeatureGate
  feature="analytics_advanced"
  fallback={<div>Analytics basiques seulement</div>}
>
  <AdvancedAnalytics />
</FeatureGate>
```

### Hook useFeature

Accès programmatique aux informations de feature :

```tsx
import { useFeature } from '@/hooks/use-feature'

function ContactsManager() {
  const contacts = useFeature('contacts_limit')

  return (
    <div>
      {contacts.isUnlimited ? (
        <p>Contacts illimités</p>
      ) : (
        <p>Limite: {contacts.limit}</p>
      )}

      {!contacts.isAllowed && (
        <p>Upgrader vers {contacts.upgradeTo}</p>
      )}
    </div>
  )
}
```

### Composant UsageLimit

Affichage des limites avec barre de progression :

```tsx
import { UsageLimit } from '@/components/ui/FeatureGate'

<UsageLimit
  feature="ai_coach_monthly"
  current={15}
  showPercentage
/>
// Affiche: "15 / 20" avec barre 75%
```

## Design Tokens

Les design tokens fournissent une couche d'abstraction sémantique :

```tsx
import { tokens } from '@/lib/design-tokens'

// Couleurs sémantiques
tokens.color.brand.primary     // '#0EA5E9'
tokens.color.success.default   // '#10B981'
tokens.color.ai.default        // '#a855f7'

// Typographie
tokens.font.display    // 'Bricolage Grotesque'
tokens.font.body       // 'DM Sans'

// Rayons et espacements
tokens.radius.md       // '8px'
tokens.spacing.lg      // '24px'

// Usage
<div style={{
  backgroundColor: tokens.color.brand.subtle,
  borderRadius: tokens.radius.lg,
  padding: tokens.spacing.md
}}>
  Contenu avec design tokens
</div>
```

## Intégration Supabase (TODO)

### Tables nécessaires

```sql
-- Table subscriptions
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipe_id UUID REFERENCES equipes(id),
  plan TEXT CHECK (plan IN ('free', 'pro', 'expert', 'clinique')),
  stripe_subscription_id TEXT,
  status TEXT CHECK (status IN ('active', 'past_due', 'canceled', 'incomplete')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ou utiliser user_metadata simple
UPDATE auth.users SET
  raw_user_meta_data = raw_user_meta_data || '{"plan": "pro"}'::jsonb
WHERE id = 'user-id';
```

### Hook useCurrentPlan() final

```tsx
export function useCurrentPlan(): Plan {
  const { data: user } = useUser()

  // Option 1: user metadata
  const planFromMetadata = user?.user_metadata?.plan

  // Option 2: table subscriptions
  const { data: subscription } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => supabase
      .from('subscriptions')
      .select('plan')
      .eq('equipe_id', user?.user_metadata?.equipe_id)
      .single()
  })

  return subscription?.plan || planFromMetadata || 'free'
}
```

## Règles d'UX

1. **Jamais masquer complètement** - Toujours montrer le contenu en grisé avec lock
2. **Feedback immédiat** - Toast avec plan requis au clic
3. **Progression visible** - Barres de progression pour limites quantitatives
4. **Cohérence** - Même couleur de plan partout (badges, toasts, etc.)

## Testing

```tsx
// Mock du plan pour les tests
import { vi } from 'vitest'

vi.mock('@/hooks/use-feature', () => ({
  useCurrentPlan: () => 'free',
  useFeature: (feature) => ({
    plan: 'free',
    isAllowed: feature === 'export_csv' ? false : true,
    upgradeTo: 'pro'
  })
}))
```

## Migration depuis l'existant

1. ✅ **Plans & Features** - Configuration centralisée créée
2. ✅ **Design Tokens** - Abstraction couleurs/fonts créée
3. ✅ **Composants UI** - FeatureGate, UsageLimit créés
4. ✅ **Hooks** - useFeature, useCurrentPlan créés
5. 🔄 **Intégration Supabase** - À faire (user metadata ou table)
6. 🔄 **Usage dans composants existants** - Migration progressive
7. 🔄 **Page pricing** - Comparaison plans avec tokens
8. 🔄 **Tests** - Couverture feature gating

Le système est **prêt pour la production** avec le plan par défaut 'pro'. L'intégration billing/Supabase peut être faite plus tard sans casser l'existant.