# PLAYBOOK COLLABORATIF + ONBOARDING INTERACTIF — Plan d'Architecture
# CRM Dermotec — 2026-03-21

---

## VISION GLOBALE

3 systèmes interconnectés qui se nourrissent mutuellement :

```
┌─────────────────────────────────────────────────────────────┐
│                    PLAYBOOK COLLABORATIF                     │
│  Commercial écrit objection → IA suggère réponse →          │
│  Équipe vote → Meilleures réponses remontent →              │
│  Knowledge Base s'enrichit → Agent IA s'améliore            │
└───────────────────────┬─────────────────────────────────────┘
                        │ alimente
┌───────────────────────▼─────────────────────────────────────┐
│                    AGENT IA COMMERCIAL                       │
│  Utilise le playbook pour répondre en temps réel            │
│  Apprend des meilleures pratiques de l'équipe               │
└───────────────────────┬─────────────────────────────────────┘
                        │ formé par
┌───────────────────────▼─────────────────────────────────────┐
│                    ONBOARDING INTERACTIF                     │
│  Nouveaux commerciaux apprennent en faisant                 │
│  Parcours progressif : Basique → Intermédiaire → Expert     │
│  Gamification : badges, score, progression                  │
└─────────────────────────────────────────────────────────────┘
```

---

## PARTIE 1 : PLAYBOOK COLLABORATIF D'OBJECTIONS

### Le problème
Le commercial entend "C'est trop cher" et ne sait pas quoi dire.
La bonne réponse existe dans la tête d'un collègue.
Mais chaque commercial improvise seul.

### La solution : Boucle d'apprentissage collectif

```
1. Le commercial ENTEND une objection en appel
          ↓
2. Il la TAPE dans le CRM (1 clic depuis la fiche lead)
          ↓
3. L'IA ANALYSE l'objection et SUGGÈRE une réponse
   (basée sur les réponses qui ont MARCHÉ avant)
          ↓
4. Le commercial UTILISE la réponse (ou l'adapte)
          ↓
5. Il NOTE le résultat : ✅ ça a marché / ❌ ça n'a pas marché
          ↓
6. Les réponses avec le meilleur taux de succès REMONTENT
          ↓
7. La knowledge_base s'ENRICHIT automatiquement
          ↓
8. L'Agent IA Commercial utilise les MEILLEURES réponses
```

### Page : `/playbook` (nouvelle page dashboard)

```
┌──────────────────────────────────────────────────────────────┐
│  PLAYBOOK — Intelligence collective                    [+ Nouveau] │
├──────────────────────────────────────────────────────────────┤
│  [Objections ▾]  [Scripts ▾]  [Arguments ▾]  [Témoignages ▾]│
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  🔥 TOP OBJECTIONS (par fréquence)                           │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ "C'est trop cher"                          12 fois 🏆  │  │
│  │ Taux de succès : 78%                                   │  │
│  │                                                        │  │
│  │ MEILLEURE RÉPONSE (votée par l'équipe) :               │  │
│  │ "Je comprends, c'est un investissement. Mais 80% de    │  │
│  │  nos stagiaires ne paient rien grâce au financement..." │  │
│  │                                                        │  │
│  │ 👍 6  👎 1  │  💬 3 variantes  │  📊 78% succès       │  │
│  │                                                        │  │
│  │ [Voir les variantes]  [Ajouter ma réponse]  [Copier]   │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ "Je dois en parler à mon conjoint"          8 fois     │  │
│  │ Taux de succès : 65%                                   │  │
│  │ ...                                                    │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ "J'ai peur de ne pas y arriver"             6 fois     │  │
│  │ ...                                                    │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                              │
│  💡 DERNIÈRES CONTRIBUTIONS                                  │
│                                                              │
│  Sarah a ajouté une réponse pour "C'est trop long" — il y a │
│  2h                                                          │
│  Karim a voté 👍 sur la réponse #3 de "C'est trop cher" —  │
│  hier                                                        │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Modal "Ajouter une objection" (depuis n'importe quelle page)

```
┌──────────────────────────────────────────────────────┐
│  ⚡ Nouvelle objection entendue                       │
│                                                      │
│  Objection du prospect :                             │
│  ┌────────────────────────────────────────────────┐  │
│  │ "C'est trop long, je n'ai pas le temps"       │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  Contexte (optionnel) :                              │
│  ┌────────────────────────────────────────────────┐  │
│  │ Reconversion, intéressée microblading          │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  Lead concerné : [Sarah Martin ▾] (optionnel)        │
│                                                      │
│  ─────────────────────────────────────────────────   │
│  🤖 SUGGESTION IA (basée sur le playbook) :          │
│                                                      │
│  "La formation dure seulement 2 jours. Vous          │
│   repartez opérationnelle le lundi suivant. Et si    │
│   vous êtes salariée, votre employeur peut même      │
│   vous libérer sur vos heures de travail."           │
│                                                      │
│  [✅ Utiliser cette réponse]  [✏️ Modifier]  [❌ Pas │
│  pertinent]                                          │
│                                                      │
│  Ma propre réponse :                                 │
│  ┌────────────────────────────────────────────────┐  │
│  │                                                │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  Résultat : [✅ A marché] [❌ Pas marché] [⏳ En     │
│  attente]                                            │
│                                                      │
│            [Enregistrer dans le playbook]             │
└──────────────────────────────────────────────────────┘
```

### DB : Table `playbook_entries`

```sql
CREATE TABLE playbook_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  categorie TEXT NOT NULL CHECK (categorie IN (
    'objection', 'script', 'argument', 'temoignage', 'astuce'
  )),
  titre TEXT NOT NULL,                    -- L'objection ou le titre
  contexte TEXT,                          -- Contexte situation
  lead_id UUID REFERENCES leads(id),     -- Lead concerné (optionnel)
  formation_slug TEXT,                    -- Formation liée (optionnel)
  statut_pro_cible TEXT,                  -- Profil cible (optionnel)
  created_by UUID REFERENCES equipe(id), -- Qui l'a écrit
  occurences INTEGER DEFAULT 1,          -- Combien de fois entendue
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE playbook_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID REFERENCES playbook_entries(id) NOT NULL,
  contenu TEXT NOT NULL,                  -- La réponse
  is_ai_generated BOOLEAN DEFAULT false,  -- Générée par l'IA ou humaine
  created_by UUID REFERENCES equipe(id),
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  succes INTEGER DEFAULT 0,              -- Fois où ça a marché
  echecs INTEGER DEFAULT 0,              -- Fois où ça n'a pas marché
  taux_succes NUMERIC GENERATED ALWAYS AS (
    CASE WHEN (succes + echecs) > 0
    THEN ROUND(succes::numeric / (succes + echecs) * 100, 1)
    ELSE 0 END
  ) STORED,
  promoted_to_kb BOOLEAN DEFAULT false,  -- Promue dans knowledge_base
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE playbook_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id UUID REFERENCES playbook_responses(id) NOT NULL,
  user_id UUID REFERENCES equipe(id) NOT NULL,
  vote TEXT CHECK (vote IN ('up', 'down')),
  UNIQUE(response_id, user_id)           -- 1 vote par user par réponse
);
```

### Auto-promotion vers Knowledge Base
Quand une réponse atteint :
- `taux_succes >= 70%` ET `(succes + echecs) >= 5` ET `upvotes >= 3`
→ Automatiquement copiée dans `knowledge_base` avec `categorie = 'objection'`
→ L'Agent IA Commercial l'utilise immédiatement

---

## PARTIE 2 : ONBOARDING INTERACTIF

### Philosophie : "Learn by doing" (pas de documentation)

Inspiré de :
- **driver.js** (lightweight, 5KB, tour interactif) ← CHOIX RETENU
- Duolingo (progression gamifiée)
- Notion (templates de démarrage)

### 3 niveaux de formation

```
NIVEAU 1 : BASIQUE (Jour 1)                    🟢 Obligatoire
────────────────────────────────────────────────
□ Se connecter au CRM
□ Comprendre le dashboard
□ Créer son premier lead (guidé)
□ Naviguer dans le pipeline
□ Passer un lead de NOUVEAU à CONTACTÉ
□ Créer un rappel
□ Utiliser l'Agent IA (poser une question)

NIVEAU 2 : INTERMÉDIAIRE (Semaine 1)           🟡 Recommandé
────────────────────────────────────────────────
□ Maîtriser le scoring (comprendre les points)
□ Ouvrir un dossier de financement
□ Utiliser le playbook d'objections
□ Générer un email avec l'IA
□ Gérer une inscription
□ Utiliser le cockpit (smart actions)
□ Lire l'analytics

NIVEAU 3 : EXPERT (Mois 1)                     🔵 Optionnel
────────────────────────────────────────────────
□ Lancer une offre flash sur une session
□ Suivre un dossier financement de bout en bout
□ Contribuer au playbook (ajouter une objection)
□ Maîtriser le portail alumni
□ Analyser le funnel de conversion
□ Former un nouveau collègue (pair-à-pair)
```

### Composant : Tour interactif (driver.js)

```typescript
// Bibliothèque : driver.js (5KB, 0 dépendance, MIT)
// npm install driver.js
// Compatible React 19, SSR-safe

// Chaque parcours = une série de steps avec highlight + explication
const TOUR_BASIQUE = [
  {
    element: '[data-tour="sidebar-leads"]',
    popover: {
      title: 'Vos leads',
      description: 'Ici vous trouvez tous vos prospects. Cliquez pour voir la liste.',
      side: 'right',
    }
  },
  {
    element: '[data-tour="pipeline"]',
    popover: {
      title: 'Le pipeline',
      description: 'Glissez-déposez les leads entre les colonnes pour suivre leur progression.',
      side: 'bottom',
    }
  },
  // ...
]
```

### Composant : Checklist de progression

```
┌──────────────────────────────────────┐
│  🎯 Votre progression               │
│  ████████████░░░░░░░░ 60%           │
│                                      │
│  Niveau 1 — Basique                  │
│  ✅ Se connecter au CRM             │
│  ✅ Comprendre le dashboard         │
│  ✅ Créer un lead                   │
│  ⬜ Naviguer dans le pipeline       │
│  ⬜ Passer un statut                │
│  ⬜ Créer un rappel                 │
│  ⬜ Utiliser l'Agent IA             │
│                                      │
│  [▶ Continuer le parcours]           │
└──────────────────────────────────────┘
```

### DB : Table `onboarding_progress`

```sql
CREATE TABLE onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES equipe(id) NOT NULL,
  step_id TEXT NOT NULL,              -- ex: 'basique_creer_lead'
  niveau TEXT NOT NULL,               -- 'basique', 'intermediaire', 'expert'
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, step_id)
);
```

---

## PARTIE 3 : ORCHESTRATION — Comment tout se connecte

```
JOUR 1 — Nouveau commercial arrive
   ↓
1. Première connexion → Tour guidé automatique (driver.js)
   "Bienvenue ! Je vais vous montrer le CRM en 5 minutes."
   ↓
2. Checklist basique apparaît dans la sidebar
   Chaque action complétée = checkbox cochée + mini-celebration
   ↓
3. Exercice pratique : "Créez votre premier lead de test"
   Le CRM guide pas-à-pas avec tooltips contextuels
   ↓

SEMAINE 1 — Montée en compétence
   ↓
4. Le commercial commence à utiliser le pipeline
   Smart actions du cockpit lui disent quoi faire
   ↓
5. Premier appel → Il entend une objection
   → Bouton "⚡ Objection" dans la fiche lead
   → Modal playbook : objection + suggestion IA + enregistrement
   ↓
6. Il découvre le playbook collaboratif
   Voit les réponses votées par les collègues
   Commence à voter et contribuer
   ↓

MOIS 1 — Autonomie
   ↓
7. L'Agent IA connaît maintenant les meilleures pratiques
   (enrichi par le playbook + les votes + les taux de succès)
   ↓
8. Le commercial utilise l'Agent IA en temps réel pendant les appels
   "L'Agent me dit quoi dire, basé sur ce qui marche pour l'équipe"
   ↓
9. Cercle vertueux : plus l'équipe contribue, plus l'IA est pertinente
```

---

## FICHIERS À CRÉER — Résumé

### Migration SQL
- `supabase/migrations/008_playbook_onboarding.sql`
  - Tables : playbook_entries, playbook_responses, playbook_votes, onboarding_progress
  - RLS, index, triggers, auto-promotion KB

### Lib
- `src/lib/playbook.ts` — Logique playbook (CRUD, votes, auto-promote, stats)

### Pages
- `src/app/(dashboard)/playbook/page.tsx` — Page playbook collaboratif

### Composants
- `src/components/ui/PlaybookModal.tsx` — Modal "Nouvelle objection" (utilisable partout)
- `src/components/ui/OnboardingChecklist.tsx` — Checklist progression sidebar
- `src/components/ui/GuidedTour.tsx` — Wrapper driver.js pour les tours

### Hooks
- `src/hooks/use-playbook.ts` — React Query hooks playbook
- `src/hooks/use-onboarding.ts` — React Query hooks progression

### API
- `src/app/api/ai/playbook-suggest/route.ts` — IA suggestion réponse objection

### Modifications existantes
- `src/app/(dashboard)/layout.tsx` — Ajouter nav "Playbook" + OnboardingChecklist
- `src/app/(dashboard)/lead/[id]/page.tsx` — Ajouter bouton "⚡ Objection"

### Package
- `npm install driver.js` — Tour interactif (5KB, MIT, 0 deps)
