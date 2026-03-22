# Briques UX Réutilisables - CRM Dermotec

5 composants intelligents qui s'emboîtent entre eux pour créer une expérience utilisateur fluide et contextuelle.

## Vue d'ensemble

### 🎯 1. LeadActionHub
**Widget d'actions contextuelles intelligent**

```tsx
import { LeadActionHub } from '@/components/crm'

<LeadActionHub
  leadId="lead-123"
  onActionClick={(action) => console.log(action)}
/>
```

**Logique :**
- Détecte automatiquement l'étape du parcours
- Propose les bonnes actions selon le statut
- Badge "IA" sur l'action la plus pertinente
- Actions adaptatives par statut (NOUVEAU → ALUMNI)

---

### 🎓 2. FormationSuggester
**Recommandations de formations intelligentes**

```tsx
import { FormationSuggester } from '@/components/crm'

<FormationSuggester
  leadId="lead-123"
  onSelect={(formationId) => console.log(formationId)}
  compact={false}
/>
```

**Logique :**
- Upsell/Cross-sell basé sur formation actuelle
- Hygiène & Salubrité toujours suggérée (obligatoire)
- Sessions disponibles en temps réel
- ROI et popularité intégrés

---

### 📅 3. SessionPicker
**Sélecteur de sessions avec disponibilités**

```tsx
import { SessionPicker } from '@/components/crm'

<SessionPicker
  formationId="microblading"
  onSelect={(sessionId) => console.log(sessionId)}
  selectedSessionId="session-456"
/>
```

**Logique :**
- Sessions futures uniquement
- Jauge de remplissage visuelle
- Badge "Bientôt complet" automatique
- Formatrice + détails session

---

### 💰 4. FinancementExpress
**Simulateur de financement inline**

```tsx
import { FinancementExpress } from '@/components/crm'

<FinancementExpress
  leadId="lead-123"
  formationPrix={1400}
  formationDureeHeures={14}
  compact={true}
/>
```

**Logique :**
- Auto-détection organisme (OPCO EP, FAFCEA, etc.)
- Calcul temps réel des montants
- Animation spring sur les résultats
- Mode compact pour intégration

---

### 📊 5. ParcoursClient
**Timeline du parcours client**

```tsx
import { ParcoursClient } from '@/components/crm'

<ParcoursClient
  leadId="lead-123"
  compact={false}
/>
```

**Logique :**
- 7 étapes : Prospect → Alumni
- Données contextuelles par étape
- Animation progressive
- Tooltips détaillés

## Exemple d'utilisation complète

```tsx
'use client'

import { useState } from 'react'
import {
  LeadActionHub,
  FormationSuggester,
  SessionPicker,
  FinancementExpress,
  ParcoursClient
} from '@/components/crm'

export default function LeadDetailPage({ leadId }: { leadId: string }) {
  const [selectedFormation, setSelectedFormation] = useState<string>()
  const [selectedSession, setSelectedSession] = useState<string>()
  const [activeAction, setActiveAction] = useState<string>()

  const handleActionClick = (action: string) => {
    setActiveAction(action)
    // Logique spécifique par action
    switch (action) {
      case 'proposer_formation':
        // Scroll vers FormationSuggester
        break
      case 'simuler_financement':
        // Scroll vers FinancementExpress
        break
      case 'affecter_session':
        // Scroll vers SessionPicker
        break
    }
  }

  return (
    <div className="space-y-6">
      {/* Actions contextuelles en haut */}
      <LeadActionHub
        leadId={leadId}
        onActionClick={handleActionClick}
      />

      {/* Parcours client */}
      <ParcoursClient leadId={leadId} />

      {/* Formations suggérées */}
      {activeAction === 'proposer_formation' && (
        <FormationSuggester
          leadId={leadId}
          onSelect={setSelectedFormation}
        />
      )}

      {/* Sessions disponibles */}
      {selectedFormation && (
        <SessionPicker
          formationId={selectedFormation}
          onSelect={setSelectedSession}
        />
      )}

      {/* Simulation financement */}
      {selectedFormation && (
        <FinancementExpress
          leadId={leadId}
          formationPrix={1400} // À récupérer de la formation
          formationDureeHeures={14}
        />
      )}
    </div>
  )
}
```

## Patterns d'intégration

### Mode compact pour sidebars
```tsx
<div className="space-y-3">
  <ParcoursClient leadId={leadId} compact />
  <FinancementExpress leadId={leadId} compact />
  <FormationSuggester leadId={leadId} compact />
</div>
```

### Mode dashboard
```tsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  <div className="space-y-4">
    <LeadActionHub leadId={leadId} />
    <ParcoursClient leadId={leadId} />
  </div>
  <div className="space-y-4">
    <FormationSuggester leadId={leadId} />
    <FinancementExpress leadId={leadId} />
  </div>
</div>
```

## Données requises

Chaque composant est **autonome** et gère ses propres fallbacks :

- **LeadActionHub** : leadId uniquement
- **FormationSuggester** : leadId + formations depuis constants.ts
- **SessionPicker** : formationId + sessions depuis use-sessions
- **FinancementExpress** : leadId + prix/durée formation
- **ParcoursClient** : leadId + données relationnelles

## Personnalisation

### Couleurs
Toutes les briques utilisent les couleurs Dermotec :
- Primary: `#2EC6F3`
- Success: `#22C55E`
- Warning: `#F59E0B`
- Error: `#EF4444`

### Breakpoints
Mobile-first avec touch targets 44px minimum.

### Animations
Framer Motion avec délais staggered pour les listes.

## État et synchronisation

Les composants sont **stateless** par design :
- État géré par le parent
- Props down, events up
- Pas de state global requis
- Rechargement automatique via React Query

## Tests

Chaque composant inclut :
- Gestion des états de loading
- Fallbacks pour données manquantes
- Gestion gracieuse des erreurs
- Adaptation responsive