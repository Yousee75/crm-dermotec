# PLAN D'ORCHESTRATION DERMOTEC — Monétisation Accélérée
# Yossi Hayoun — 2026-03-21
# Philosophie : Earnix dans l'assurance → Dermotec dans la formation esthétique
# = Disruption par la data, l'automatisation et l'intelligence dans un secteur artisanal

---

## VISION : Pourquoi ça va marcher

Le marché de la formation esthétique fonctionne comme l'assurance IARD en 2010 :
- **Processus manuels** : Excel, WhatsApp, cahier de présence
- **Zéro data** : personne ne mesure les conversions, le NPS, le coût d'acquisition
- **Réglementation lourde** (Qualiopi) = barrière à l'entrée = AVANTAGE pour celui qui l'automatise
- **Financement opaque** : les prospects abandonnent car le parcours OPCO/CPF est un labyrinthe

Dermotec a DÉJÀ le moteur (CRM, scoring, smart actions, Inngest, Stripe).
Il manque **5 accélérateurs** pour transformer le potentiel en CA.

---

## ARCHITECTURE DES 5 SPRINTS

```
Sprint 1 (S1-S2) : CADENCE ENGINE        → Activer l'existant Inngest
Sprint 2 (S3-S4) : SIMULATEUR PUBLIC      → Page publique financement
Sprint 3 (S5-S6) : ANALYTICS LIVE         → Dashboard CA temps réel
Sprint 4 (S7-S8) : PORTAIL ALUMNI         → Fidélisation + e-shop
Sprint 5 (S9-S10): OFFRES FLASH           → Yield management sessions
```

---

## SPRINT 1 — CADENCE ENGINE (Semaines 1-2)
### "Le commercial dort, le CRM travaille"

### Constat
- `lead-cadence.ts` existe et fonctionne (J+0, J+3, J+7, J+14)
- `daily-rappels.ts` tourne en cron 7h
- `send-email.ts` envoie via templates Supabase
- MAIS : la cadence ne se déclenche pas automatiquement à la création du lead

### Fichiers à MODIFIER

#### 1. `src/app/api/webhook/formulaire/route.ts`
**Ajout** : après insertion du lead, déclencher `crm/lead.cadence.start`
```typescript
// APRÈS le insert lead réussi, ajouter :
await inngest.send({
  name: 'crm/lead.cadence.start',
  data: {
    lead_id: newLead.id,
    email: newLead.email,
    prenom: newLead.prenom,
    formation_nom: formation?.nom || 'nos formations',
    assigned_to: null, // round-robin à implémenter Sprint 5
  },
})
```

#### 2. `src/inngest/lead-cadence.ts`
**Améliorer** : ajouter cadence post-formation (J+5 avis Google, J+30 upsell, J+90 alumni)
```typescript
// NOUVEAU : Cadence post-formation
export const postFormationCadence = inngest.createFunction(
  {
    id: 'crm-post-formation-cadence',
    retries: 3,
    cancelOn: [{ event: 'crm/lead.cadence.cancel', match: 'data.lead_id' }],
  },
  { event: 'crm/lead.post-formation.start' },
  async ({ event, step }) => {
    const { lead_id, email, prenom, formation_nom } = event.data

    // J+5 : Demande avis Google
    await step.sleep('wait-5-days', '5d')
    await step.run('j5-avis-google', async () => {
      // Vérifier que le lead est toujours FORME
      // Envoyer email template "avis-google" avec lien direct
      // CTA : "Votre avis compte — 30 secondes pour nous aider"
    })

    // J+30 : Upsell formation complémentaire
    await step.sleep('wait-25-days', '25d')
    await step.run('j30-upsell', async () => {
      // Calculer upsellScore
      // Si score >= 60 : envoyer template "upsell" avec 3 suggestions
      // Si score < 60 : envoyer template "suivi-activite"
    })

    // J+90 : Check alumni + e-shop
    await step.sleep('wait-60-days', '60d')
    await step.run('j90-alumni-check', async () => {
      // Envoyer template "alumni-reactivation"
      // Inclure : -10% e-shop, nouvelles formations, parrainage
    })
  }
)
```

#### 3. `src/inngest/index.ts`
**Ajout** : enregistrer la nouvelle fonction + les nouveaux events

#### 4. `src/lib/inngest-events.ts`
**Ajout** : event `crm/lead.post-formation.start`

### Fichiers à CRÉER

#### 5. `src/inngest/session-lifecycle.ts` (NOUVEAU)
Automatisation du cycle de vie session :
```typescript
// Cron quotidien 8h : pour chaque session
// - Si date_debut = aujourd'hui → statut CONFIRMEE → EN_COURS + email "Bienvenue à la formation"
// - Si date_fin = hier → statut → TERMINEE + trigger crm/lead.post-formation.start
// - Si date_debut - 7j = aujourd'hui → envoyer convocation
// - Si date_debut - 2j = aujourd'hui → SMS rappel (si tel disponible)
// - Si places_restantes > 0 et date_debut - 14j → smart action "SESSION_INCOMPLETE"
```

### Impact estimé
- +15% conversion leads (relance automatique vs. oubli humain)
- -60% temps commercial sur les relances manuelles
- Délai moyen 1er contact : de 48h → 0h (email automatique immédiat)

---

## SPRINT 2 — SIMULATEUR FINANCEMENT PUBLIC (Semaines 3-4)
### "Le prospect sait AVANT d'appeler combien il va payer"

### Constat
- `getFinancementEligibility()` existe dans `marketing.ts` — mapping statut_pro → organismes
- FORMATIONS_SEED dans `constants.ts` a tous les prix
- MAIS : cette intelligence est enfermée dans le CRM back-office
- Le prospect qui visite dermotec.fr ne sait PAS s'il peut être financé

### Fichiers à CRÉER

#### 1. `src/app/(public)/simulateur/page.tsx` (NOUVEAU)
Page publique (pas de login requis) — le parcours en 3 étapes :

```
ÉTAPE 1 : "Vous êtes..."
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  💼 Salariée    │ │  🔄 Reconversion│ │  💻 Indépendante│
│  en poste       │ │  professionnelle│ │  / Auto-entrepre│
└─────────────────┘ └─────────────────┘ └─────────────────┘
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  🏢 Gérante     │ │  🎓 Étudiante   │ │  📋 Demandeur   │
│  d'institut     │ │                 │ │  d'emploi       │
└─────────────────┘ └─────────────────┘ └─────────────────┘

ÉTAPE 2 : "Quelle formation vous intéresse ?"
→ Grille des 11 formations avec prix + durée + ROI estimé
→ Sélection multiple possible (parcours complet)

ÉTAPE 3 : Résultat personnalisé
┌────────────────────────────────────────────────────────┐
│  ✅ Vous êtes éligible au financement OPCO EP          │
│                                                        │
│  Formation : Maquillage Permanent Complet              │
│  Prix TTC : 2 990 €                                    │
│  Prise en charge estimée : 100% (OPCO EP)              │
│  ══════════════════════════════════════════             │
│  Reste à charge estimé : 0 €                           │
│                                                        │
│  Documents à préparer :                                │
│  ☐ Bulletin de paie (3 derniers mois)                  │
│  ☐ Attestation employeur                               │
│  ☐ Pièce d'identité                                    │
│                                                        │
│  [📞 Être rappelée gratuitement]  [💬 WhatsApp]        │
└────────────────────────────────────────────────────────┘
```

**Design** :
- Background : `#F8FAFC` (cohérent avec le CRM)
- Cards : blanches, `border-radius: 12px`, ombre douce
- Primary CTA : `#2EC6F3` (gradient-primary)
- Accent texte : `#082545`
- Font headings : Bricolage Grotesque
- Font body : DM Sans
- Mobile-first, touch targets 48px
- Animations subtiles : framer-motion `fadeIn` + `slideUp` entre étapes
- Progress bar en haut : 3 steps avec couleur primary

**Logique métier** (réutilise l'existant) :
```typescript
import { getFinancementEligibility } from '@/lib/marketing'
import { FORMATIONS_SEED } from '@/lib/constants'

// Mapping taux de prise en charge estimé par organisme
const TAUX_PRISE_EN_CHARGE: Record<string, { taux: number; label: string }> = {
  OPCO_EP: { taux: 100, label: 'Prise en charge totale par votre OPCO' },
  AKTO: { taux: 100, label: 'Prise en charge totale AKTO' },
  FAFCEA: { taux: 80, label: 'Jusqu\'à 80% pris en charge FAFCEA' },
  FIFPL: { taux: 70, label: 'Jusqu\'à 70% pris en charge FIF-PL' },
  FRANCE_TRAVAIL: { taux: 100, label: 'Financement France Travail possible à 100%' },
  CPF: { taux: 100, label: 'Utilisation de votre solde CPF' },
  TRANSITIONS_PRO: { taux: 100, label: 'Prise en charge Transitions Pro' },
  MISSIONS_LOCALES: { taux: 80, label: 'Aide Mission Locale possible' },
  REGION: { taux: 80, label: 'Aide régionale possible' },
  EMPLOYEUR: { taux: 100, label: 'Plan de formation employeur' },
  AGEFIPH: { taux: 100, label: 'Aide AGEFIPH travailleur handicapé' },
}
```

#### 2. `src/app/(public)/layout.tsx` (NOUVEAU)
Layout public minimal (sans sidebar CRM) :
- Header : logo Dermotec + tagline + tel + WhatsApp
- Footer : certifications Qualiopi, adresse, mentions légales
- Même design system (Tailwind v4, couleurs COLORS)

#### 3. `src/app/api/simulateur/lead/route.ts` (NOUVEAU)
API qui capture le lead depuis le simulateur :
```typescript
// POST : { prenom, email, telephone, statut_pro, formation_slug, source: 'simulateur' }
// → Insert dans leads avec source='simulateur'
// → Trigger crm/lead.cadence.start via Inngest
// → Retourne { success: true, message: "Notre équipe vous contacte sous 24h" }
```

#### 4. `src/lib/simulateur.ts` (NOUVEAU)
Logique du simulateur extraite pour réutilisation :
```typescript
export function simulerFinancement(statutPro: string, formationSlug: string): SimulationResult {
  const eligibility = getFinancementEligibility(statutPro)
  const formation = FORMATIONS_SEED.find(f => f.slug === formationSlug)
  // ... calcul reste à charge, documents requis, délai moyen
}

// ROI Calculator : "Avec cette formation, vous pouvez facturer X€/séance"
export function estimerROI(formationSlug: string): ROIEstimation {
  const ROI_MAP: Record<string, { prix_seance: number; seances_mois: number }> = {
    'microblading': { prix_seance: 200, seances_mois: 15 },
    'full-lips': { prix_seance: 300, seances_mois: 10 },
    'maquillage-permanent': { prix_seance: 250, seances_mois: 12 },
    'nanoneedling': { prix_seance: 100, seances_mois: 20 },
    // ...
  }
  // Retourne : CA mensuel estimé, mois pour rentabiliser la formation
}
```

### Impact estimé
- +30-40% conversion sur segment reconversion (le plus gros, ~50% des leads)
- Source de leads organique gratuite (SEO "financement formation esthétique")
- Réduction du temps commercial : le prospect arrive pré-qualifié

---

## SPRINT 3 — ANALYTICS LIVE (Semaines 5-6)
### "Chaque euro est tracé, chaque décision est data-driven"

### Constat
- `analytics/page.tsx` existe mais avec des **données placeholder** (`fakePercent`)
- Aucun tracking CA temps réel
- Pas de cohort analysis ni de funnel conversion réel
- Le cockpit a les smart actions mais pas les KPIs financiers

### Fichiers à MODIFIER

#### 1. `src/app/(dashboard)/analytics/page.tsx` — REFONTE COMPLÈTE
Remplacer les placeholders par des données réelles Supabase :

```
┌──────────────────────────────────────────────────────────────┐
│  ANALYTICS — Mars 2026                           [Ce mois ▾] │
├──────────┬──────────┬──────────┬──────────┬──────────────────┤
│ CA Mois  │ Leads    │ Conversion│ Panier   │ Remplissage     │
│ 34 500€  │ 47       │ 23.4%    │ 1 456€   │ 78%             │
│ +12% ↑   │ +8 ↑     │ +2.1pt ↑ │ -3% ↓    │ +5pt ↑          │
└──────────┴──────────┴──────────┴──────────┴──────────────────┘

[Graph CA mensuel — Recharts AreaChart — 12 derniers mois]

┌─────────────────────────┐  ┌──────────────────────────────┐
│ FUNNEL CONVERSION       │  │ TOP FORMATIONS (CA)          │
│                         │  │                              │
│ ████████████████ 47     │  │ Maquillage Permanent  45%    │
│ NOUVEAU                 │  │ ██████████████████████       │
│ ████████████ 34         │  │ Microblading          22%    │
│ CONTACTÉ                │  │ ███████████                  │
│ ████████ 22             │  │ Full Lips             15%    │
│ QUALIFIÉ                │  │ ████████                     │
│ ██████ 15               │  │ Tricopigmentation     10%    │
│ FINANCEMENT             │  │ █████                        │
│ ████ 11                 │  │ Autres                 8%    │
│ INSCRIT                 │  │ ████                         │
│ ███ 8                   │  │                              │
│ FORMÉ                   │  └──────────────────────────────┘
└─────────────────────────┘

┌─────────────────────────┐  ┌──────────────────────────────┐
│ SOURCES DE LEADS        │  │ FINANCEMENT                  │
│                         │  │                              │
│ Instagram    35% ██████ │  │ Taux de financement : 67%    │
│ Formulaire   25% █████  │  │                              │
│ WhatsApp     20% ████   │  │ OPCO EP     8 dossiers       │
│ Bouche-à-or. 12% ██    │  │ France Trav 5 dossiers       │
│ Google        8% █     │  │ CPF         3 dossiers       │
│                         │  │ FAFCEA      2 dossiers       │
└─────────────────────────┘  │                              │
                             │ Délai moyen : 18 jours       │
                             └──────────────────────────────┘
```

#### 2. `src/hooks/use-analytics.ts` (NOUVEAU)
Hook dédié analytics avec React Query :
```typescript
export function useAnalytics(periode: 'semaine' | 'mois' | 'trimestre' | 'annee') {
  // Query 1 : CA (somme factures PAYEE du mois)
  // Query 2 : Leads par statut (count group by statut)
  // Query 3 : Leads par source (count group by source)
  // Query 4 : Financements par organisme (count + somme montant)
  // Query 5 : Sessions remplissage (avg places_occupees/places_max)
  // Query 6 : Top formations (count inscriptions group by formation)
  // Query 7 : Satisfaction moyenne (avg note inscriptions)
  // Query 8 : NPS (distribution scores via calculateNPS)
  // Query 9 : Trend CA mensuel (12 derniers mois pour graph)
  // Query 10 : Délai moyen conversion (avg jours NOUVEAU → INSCRIT)
}
```

#### 3. `src/app/(dashboard)/page.tsx` — Enrichir le dashboard
Ajouter au dashboard principal :
- Mini-graph CA du mois (sparkline)
- Taux conversion en temps réel
- Prochaine session avec places restantes (CTA "Remplir")

### Impact estimé
- Décisions data-driven (quelle formation promouvoir, quel canal investir)
- Détection immédiate des baisses de conversion
- Motivation équipe (KPIs visibles = engagement)

---

## SPRINT 4 — PORTAIL ALUMNI (Semaines 7-8)
### "Chaque stagiaire formée = cliente à vie"

### Constat
- Le portail stagiaire (`/api/portail/[token]`) existe pour l'émargement
- `calculateUpsellScore()` et `generateReferralCode()` existent dans `marketing.ts`
- MAIS : après la formation, le lien est coupé
- Aucun canal de réachat (e-shop) ni de fidélisation structurée

### Fichiers à CRÉER

#### 1. `src/app/(portail)/layout.tsx` (NOUVEAU)
Layout portail alumni (pas la même sidebar que le CRM interne) :
```
┌─────────────────────────────────────────────────────┐
│  [Logo Dermotec]   Bonjour Sarah !    [Mon profil]  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Navigation horizontale (tabs) :                    │
│  [Mes formations] [E-Shop -10%] [Parrainage] [Aide]│
│                                                     │
└─────────────────────────────────────────────────────┘
```

Design :
- Même palette (#2EC6F3 primary, #082545 accent)
- Mais tonalité plus chaleureuse (illustrations, emojis subtils)
- Mobile-first (les esthéticiennes sont sur mobile 90% du temps)

#### 2. `src/app/(portail)/mes-formations/page.tsx` (NOUVEAU)
```
┌─────────────────────────────────────────────────────┐
│  MES FORMATIONS                                     │
│                                                     │
│  ✅ Microblading — 12-13 février 2026               │
│     Note : ⭐⭐⭐⭐⭐                                │
│     [📄 Certificat]  [📋 Convention]  [📸 Photos]   │
│                                                     │
│  ─────────────────────────────────────────────       │
│                                                     │
│  💡 RECOMMANDÉ POUR VOUS (score upsell: 85/100)     │
│                                                     │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │
│  │ Full Lips   │ │ Nanoneedling│ │ Peeling     │   │
│  │ 1 680€ TTC  │ │ 840€ TTC   │ │ 1 188€ TTC  │   │
│  │ 2 jours     │ │ 1 jour     │ │ 1 jour      │   │
│  │ ROI: 3000€  │ │ ROI: 2000€ │ │ ROI: 2400€  │   │
│  │ /mois       │ │ /mois      │ │ /mois       │   │
│  │ [Simuler $$]│ │ [Simuler $$]│ │ [Simuler $$]│   │
│  └─────────────┘ └─────────────┘ └─────────────┘   │
│                                                     │
│  💰 "Formée en microblading, vous pouvez facturer   │
│      200€/séance. 15 clientes/mois = 3 000€/mois." │
│                                                     │
└─────────────────────────────────────────────────────┘
```

Logique : réutilise `calculateUpsellScore()` + `FORMATIONS_SEED` + `estimerROI()`

#### 3. `src/app/(portail)/eshop/page.tsx` (NOUVEAU)
E-shop alumni avec remise permanente -10% :
```typescript
// Réutilise STRIPE_FORMATIONS + Stripe Checkout
// Ajoute un coupon Stripe "ALUMNI10" (-10%)
// Affiche les produits NPM liés aux formations suivies
// Ex: "Vous avez suivi Microblading → Voici le matériel adapté"
```

#### 4. `src/app/(portail)/parrainage/page.tsx` (NOUVEAU)
Programme de parrainage :
```
┌─────────────────────────────────────────────────────┐
│  🎁 PARRAINEZ, GAGNEZ !                             │
│                                                     │
│  Votre code : DERMOTEC-SARAH-X4K2                   │
│  [Copier]  [Partager WhatsApp]  [Partager Instagram]│
│                                                     │
│  Pour chaque filleule inscrite :                    │
│  • Vous : 100€ de réduction sur votre prochaine     │
│    formation                                        │
│  • Elle : -50€ sur sa première formation             │
│                                                     │
│  ─────────────────────────────────────────────       │
│  Vos filleules : 2 inscrites, 1 en cours            │
│  Total gagné : 200€                                 │
└─────────────────────────────────────────────────────┘
```

Logique : réutilise `generateReferralCode()` de `marketing.ts`

#### 5. `src/app/api/portail/auth/route.ts` (NOUVEAU)
Auth portail alumni via magic link (pas de mot de passe) :
```typescript
// POST { email } → vérifie lead existe et statut FORME/ALUMNI
// → envoie magic link via Resend (token JWT 7 jours)
// → redirige vers /portail/mes-formations
```

### Impact estimé
- +20-30% lifetime value par stagiaire (upsell + e-shop)
- +10-15% nouveaux leads via parrainage (coût acquisition = 0€)
- Fidélisation : la stagiaire revient sur le portail régulièrement

---

## SPRINT 5 — OFFRES FLASH & YIELD (Semaines 9-10)
### "Remplir chaque session à 100% — comme Earnix optimise chaque prime"

### Constat
- Les sessions ont `places_max` et `places_occupees`
- `smart-actions.ts` détecte les sessions incomplètes (<7j, >2 places)
- MAIS : aucune action automatique pour remplir ces places

### Fichiers à CRÉER

#### 1. `src/inngest/flash-offer.ts` (NOUVEAU)
```typescript
// Cron quotidien 9h : pour chaque session
// Si places_restantes > 0 ET date_debut dans 7-14 jours :
//   → Sélectionner leads QUALIFIE/CONTACTE intéressés par cette formation
//   → Envoyer email "Offre flash : -15% si inscription avant vendredi"
//   → Créer un coupon Stripe temporaire (expire dans 5 jours)
//   → Logger dans activites

// Si places_restantes > 0 ET date_debut dans 3-7 jours :
//   → Offre -20% "Dernières places"
//   → WhatsApp blast (si numéro dispo)
//   → Smart action CRITIQUE dans cockpit
```

#### 2. `src/lib/yield.ts` (NOUVEAU)
Algorithme de yield management inspiré Earnix :
```typescript
export function calculateOptimalDiscount(session: Session): DiscountStrategy {
  const placesRestantes = session.places_max - session.places_occupees
  const joursAvant = daysBetween(new Date().toISOString(), session.date_debut)
  const tauxRemplissage = session.places_occupees / session.places_max

  // Matrice de décision
  if (tauxRemplissage >= 0.8) return { discount: 0, strategy: 'PRIX_PLEIN' }
  if (joursAvant > 14) return { discount: 0, strategy: 'ATTENDRE' }
  if (joursAvant > 7 && tauxRemplissage < 0.5) return { discount: 15, strategy: 'EARLY_BIRD' }
  if (joursAvant > 7 && tauxRemplissage < 0.8) return { discount: 10, strategy: 'BOOST' }
  if (joursAvant <= 7 && tauxRemplissage < 0.5) return { discount: 20, strategy: 'FLASH' }
  if (joursAvant <= 7 && tauxRemplissage < 0.8) return { discount: 15, strategy: 'DERNIERE_CHANCE' }
  if (joursAvant <= 3) return { discount: 25, strategy: 'URGENCE' }

  return { discount: 0, strategy: 'STANDARD' }
}

// Sélection des leads cibles pour une offre flash
export function getFlashOfferTargets(
  leads: Lead[],
  formationSlug: string
): Lead[] {
  return leads
    .filter(l =>
      ['CONTACTE', 'QUALIFIE', 'REPORTE'].includes(l.statut) &&
      (l.formation_principale?.slug === formationSlug ||
       l.formations_interessees?.some(f => f.slug === formationSlug))
    )
    .sort((a, b) => scoreLead(b).total - scoreLead(a).total) // Les plus chauds d'abord
    .slice(0, 20) // Max 20 destinataires par offre
}
```

#### 3. `src/app/(dashboard)/sessions/components/FlashOfferButton.tsx` (NOUVEAU)
Bouton sur la page session pour déclencher manuellement une offre flash :
```
[⚡ Lancer offre flash — 3 places restantes, 5 jours]
→ Ouvre dialog : choix du discount (10/15/20/25%)
→ Preview des leads ciblés (top 10 par score)
→ Confirmation → envoi email + création coupon Stripe
```

### Impact estimé
- +20% taux de remplissage sessions (de 75% → 90%+)
- Récupération leads "REPORTE" et "CONTACTE" dormants
- CA additionnel : même à -20%, une place remplie vaut mieux qu'une place vide

---

## FICHIERS TRANSVERSAUX (toutes sprints)

### `src/lib/constants.ts` — Ajouts
```typescript
// Ajout : taux de prise en charge par organisme (Sprint 2)
export const TAUX_FINANCEMENT = { ... }

// Ajout : ROI par formation (Sprint 2 + 4)
export const ROI_FORMATIONS = { ... }

// Ajout : config discount yield (Sprint 5)
export const YIELD_CONFIG = {
  discount_max: 25,
  jours_flash_trigger: 14,
  min_places_pour_flash: 1,
}

// Ajout : config parrainage (Sprint 4)
export const PARRAINAGE_CONFIG = {
  reduction_parrain: 100, // €
  reduction_filleul: 50,  // €
  duree_validite_jours: 90,
}
```

### `src/types/index.ts` — Ajouts
```typescript
// Sprint 2
export interface SimulationResult {
  formation: Formation
  statut_pro: StatutPro
  organismes_eligibles: { organisme: OrganismeFinancement; taux: number; label: string }[]
  meilleur_organisme: OrganismeFinancement
  prix_ttc: number
  prise_en_charge_estimee: number
  reste_a_charge: number
  documents_requis: string[]
  delai_moyen_jours: number
}

// Sprint 4
export interface ROIEstimation {
  formation_slug: string
  prix_seance_moyen: number
  seances_mois_estimees: number
  ca_mensuel_estime: number
  mois_rentabilisation: number
}

// Sprint 5
export interface DiscountStrategy {
  discount: number // pourcentage
  strategy: 'PRIX_PLEIN' | 'ATTENDRE' | 'EARLY_BIRD' | 'BOOST' | 'FLASH' | 'DERNIERE_CHANCE' | 'URGENCE' | 'STANDARD'
  coupon_code?: string
  expire_at?: string
}

export interface FlashOffer {
  id: string
  session_id: string
  discount_percent: number
  strategy: DiscountStrategy['strategy']
  leads_cibles: string[] // IDs
  emails_envoyes: number
  inscriptions_generees: number
  stripe_coupon_id?: string
  created_at: string
  expire_at: string
}
```

### `src/middleware.ts` — Modification
Ajouter les routes publiques :
```typescript
// Routes sans auth requise (ajouter) :
const PUBLIC_ROUTES = [
  '/login',
  '/auth/callback',
  '/api/webhook',
  '/simulateur',      // NOUVEAU Sprint 2
  '/portail',         // NOUVEAU Sprint 4 (auth propre magic link)
]
```

---

## DESIGN SYSTEM — Cohérence visuelle

### Pages publiques (Simulateur, Portail)
- Background : `#F8FAFC` (même que le CRM)
- Cards : `bg-white rounded-2xl shadow-sm border border-gray-100`
- CTA primaire : `bg-gradient-to-r from-[#2EC6F3] to-[#1DA1D4] text-white rounded-xl px-6 py-3 font-semibold shadow-lg shadow-[#2EC6F3]/20`
- CTA secondaire : `bg-[#082545] text-white rounded-xl`
- CTA WhatsApp : `bg-[#25D366] text-white rounded-xl`
- Texte titres : `font-heading text-[#082545]` (Bricolage Grotesque)
- Texte body : `font-body text-slate-600` (DM Sans)
- Badges : mêmes que `Badge.tsx` (primary, success, warning, error)
- Touch targets : min 48px mobile
- Animations : framer-motion `initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}`

### Formulations (ton Dermotec)
- **Pas corporate** : tutoiement informel, phrases courtes, orienté action
- **ROI d'abord** : "200€ la séance, 15 clientes/mois = 3 000€/mois"
- **Rassurance** : "Finançable à 100%", "On vous accompagne", "Certifié Qualiopi"
- **Urgence douce** : "Places limitées", "Prochaine session dans X jours"
- **Social proof** : "250+ esthéticiennes formées", "NPS 72/100"
- **Pas de jargon** : "OPCO" → "Votre employeur peut payer 100% de la formation"

### Emails (Resend)
- Header : `#082545` background, logo `#2EC6F3`
- Body : fond blanc, texte `#334155`, liens `#2EC6F3`
- CTA : bouton `#2EC6F3` rounded, ou `#25D366` pour WhatsApp
- Footer : adresse + téléphone + Qualiopi
- Signature : "L'équipe Dermotec" (jamais prénom individuel dans les cadences auto)

---

## SUPABASE — Nouvelles tables

### `flash_offers` (Sprint 5)
```sql
CREATE TABLE flash_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) NOT NULL,
  discount_percent INTEGER NOT NULL CHECK (discount_percent BETWEEN 5 AND 30),
  strategy TEXT NOT NULL,
  leads_cibles UUID[] DEFAULT '{}',
  emails_envoyes INTEGER DEFAULT 0,
  inscriptions_generees INTEGER DEFAULT 0,
  stripe_coupon_id TEXT,
  created_by UUID REFERENCES equipe(id),
  expire_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE flash_offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage flash_offers"
  ON flash_offers FOR ALL TO authenticated USING (true);
```

### `portail_tokens` (Sprint 4)
```sql
CREATE TABLE portail_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_portail_tokens_token ON portail_tokens(token);
CREATE INDEX idx_portail_tokens_expires ON portail_tokens(expires_at);

ALTER TABLE portail_tokens ENABLE ROW LEVEL SECURITY;
-- Anon peut lire avec token valide
CREATE POLICY "Anyone can read valid tokens"
  ON portail_tokens FOR SELECT TO anon
  USING (expires_at > now() AND used_at IS NULL);
```

### `parrainages` (Sprint 4)
```sql
CREATE TABLE parrainages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parrain_id UUID REFERENCES leads(id) NOT NULL,
  filleul_id UUID REFERENCES leads(id),
  code TEXT UNIQUE NOT NULL,
  reduction_parrain NUMERIC(10,2) DEFAULT 100,
  reduction_filleul NUMERIC(10,2) DEFAULT 50,
  statut TEXT DEFAULT 'ACTIF' CHECK (statut IN ('ACTIF', 'UTILISE', 'EXPIRE')),
  utilise_at TIMESTAMPTZ,
  expire_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE parrainages ENABLE ROW LEVEL SECURITY;
```

---

## MÉTRIQUES DE SUCCÈS

| Sprint | KPI | Baseline | Cible 90j |
|--------|-----|----------|-----------|
| 1 | Délai 1er contact | ~48h | < 1h (auto) |
| 1 | Leads relancés automatiquement | 0% | 100% |
| 2 | Conversion segment reconversion | ~15% | 25-30% |
| 2 | Leads depuis simulateur | 0 | 30-50/mois |
| 3 | Décisions basées sur data | 0 | Quotidiennes |
| 4 | Revenu par alumni (12 mois) | ~0€ | 300-500€ |
| 4 | Leads via parrainage | 0 | 5-10/mois |
| 5 | Taux remplissage sessions | ~75% | 90%+ |
| 5 | CA récupéré sur offres flash | 0€ | 3-5K€/mois |

**Projection globale** : de ~25K€/mois → 40-50K€/mois en 90 jours

---

## ORDRE D'EXÉCUTION OPTIMAL

```
Semaine 1  : Sprint 1a — Brancher Inngest cadence sur webhook formulaire
Semaine 2  : Sprint 1b — Cadence post-formation + session lifecycle
Semaine 3  : Sprint 2a — Simulateur UI (3 étapes) + layout public
Semaine 4  : Sprint 2b — API lead simulateur + ROI calculator
Semaine 5  : Sprint 3a — Hook use-analytics + queries Supabase
Semaine 6  : Sprint 3b — Refonte page analytics + dashboard enrichi
Semaine 7  : Sprint 4a — Auth magic link + portail mes-formations
Semaine 8  : Sprint 4b — E-shop alumni + parrainage
Semaine 9  : Sprint 5a — Yield algorithm + flash-offer Inngest
Semaine 10 : Sprint 5b — FlashOfferButton UI + tests
```

Chaque sprint est indépendant et livrable. Sprint 1 a le meilleur ratio effort/impact.
