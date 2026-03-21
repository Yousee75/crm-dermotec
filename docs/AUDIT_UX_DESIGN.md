# CRM Dermotec — Audit UX & Design

> Comment un utilisateur pense, navigue, et comment on doit le guider.

---

## 1. COMMENT UN UTILISATEUR D'OF PENSE

### Sa journée type (formatrice/commerciale)

```
8h30  Arrive, ouvre le CRM
      → "Qu'est-ce que je dois faire aujourd'hui ?"
      → BESOIN : Dashboard avec actions du jour, rappels, sessions

9h00  Appels commerciaux
      → "Qui dois-je rappeler ? Quel prospect est chaud ?"
      → BESOIN : Liste triée par priorité, 1 clic pour appeler

10h00 Gérer une inscription
      → "Sophie veut s'inscrire à Microblading le 15 avril"
      → BESOIN : Chercher session → Ajouter inscription → Générer convention

11h00 Suivi financement
      → "Le dossier OPCO de Marie, où en est-il ?"
      → BESOIN : Voir le statut du dossier, les docs manquants

14h00 Former (émargement)
      → "Les stagiaires sont là, je fais l'émargement"
      → BESOIN : QR code, 1 clic, c'est fait

16h00 Admin (facturation)
      → "Je dois facturer la session de la semaine dernière"
      → BESOIN : Générer facture en 1 clic depuis la session

17h00 Fin de journée
      → "Qu'est-ce que j'ai accompli ? Que reste-t-il ?"
      → BESOIN : Récap, score gamification, badge du jour
```

### Les 3 questions universelles

À CHAQUE moment, l'utilisateur se pose ces 3 questions :
1. **Où suis-je ?** → Sidebar active + breadcrumb + titre de page
2. **Que dois-je faire ?** → Actions suggérées, rappels, smart actions
3. **Comment je le fais ?** → Bouton CTA visible, max 2-3 clics

---

## 2. PRINCIPES UX À APPLIQUER

### 2.1 Progressive Disclosure (le plus important)

**Règle** : Ne montrer que ce qui est nécessaire MAINTENANT. Le reste apparaît quand on en a besoin.

| Moment | Ce qu'on montre | Ce qu'on cache |
|--------|----------------|---------------|
| Premier lancement | Onboarding 5 étapes, dashboard vide avec guides | Toutes les features avancées |
| Utilisation quotidienne | Dashboard + Sessions + Contacts | Analytics, BPF, Audit, Paramètres avancés |
| Besoin ponctuel | Clic sur "Plus" → affiche les options avancées | Reste caché sinon |

### 2.2 Empty States (états vides = onboarding naturel)

Chaque page VIDE doit guider l'utilisateur :

```
┌────────────────────────────────────────────┐
│                                            │
│        📅  Aucune session planifiée        │
│                                            │
│    Créez votre première session pour       │
│    commencer à inscrire des stagiaires.    │
│                                            │
│    [+ Créer ma première session]           │
│                                            │
│    💡 Astuce : commencez par ajouter       │
│    vos formations dans le catalogue.       │
│                                            │
└────────────────────────────────────────────┘
```

PAS :
```
┌────────────────────────────────────────────┐
│                                            │
│           Aucun résultat.                  │
│                                            │
└────────────────────────────────────────────┘
```

### 2.3 Hierarchie visuelle (3 niveaux max)

| Niveau | Taille | Poids | Couleur | Usage |
|--------|--------|-------|---------|-------|
| **Titre** | 24-28px | Bold 700 | #0F172A | Nom de la page, KPI principal |
| **Sous-titre** | 14-16px | Medium 500 | #475569 | Description, label de section |
| **Détail** | 12-13px | Regular 400 | #94A3B8 | Timestamps, métadonnées, notes |

### 2.4 Actions principales : 1 seule par écran

**Règle de Linear** : Un seul bouton primary (CTA) par écran. Le reste est secondary/ghost.

| Page | CTA principal | CTAs secondaires |
|------|-------------|------------------|
| Sessions | "+ Nouvelle session" | Filtrer, Exporter |
| Contacts/Prospects | "+ Nouveau prospect" | Filtrer, Rechercher |
| Contacts/Clients | "+ Nouveau client" | Filtrer, Importer |
| Financement | "+ Nouveau dossier" | Filtrer |
| Qualiopi | "Préparer l'audit" | Exporter |

### 2.5 Feedback immédiat

Chaque action doit avoir un feedback en < 300ms :

| Action | Feedback |
|--------|----------|
| Clic bouton | Ripple + loading spinner |
| Sauvegarde | Toast vert "Sauvegardé" |
| Erreur | Toast rouge + message clair |
| Suppression | Toast avec "Annuler" 8 secondes |
| Drag-drop | Animation de déplacement + toast |
| Chargement | Skeleton loading (pas spinner plein écran) |

---

## 3. PARCOURS UTILISATEUR OPTIMAL

### 3.1 Première visite (onboarding)

```
Étape 1 : "Bienvenue ! Qui êtes-vous ?"
  → Nom du centre, ville, nombre de formateurs
  → Calcule le plan recommandé

Étape 2 : "Ajoutez vos formations"
  → Importer depuis un CSV ou créer manuellement
  → OU choisir dans un modèle pré-rempli (esthétique)

Étape 3 : "Planifiez votre première session"
  → Choisir formation, dates, formatrice
  → La session apparaît dans le calendrier

Étape 4 : "Invitez votre équipe"
  → Email des collègues, rôles assignés
  → Chacun reçoit un lien d'invitation

Étape 5 : "C'est parti !"
  → Dashboard avec la checklist de progression
  → Badges : "Premier Pas 🌱" débloqué
```

### 3.2 Usage quotidien (après onboarding)

```
Ouvrir le CRM
  └→ Dashboard
      ├→ "3 rappels aujourd'hui" → Clic → Liste rappels → Clic → Fiche contact → Appeler
      ├→ "Session Microblading demain" → Clic → Détail session → Vérifier inscrits
      └→ "2 leads non contactés" → Clic → Liste leads → Clic → Premier appel

Créer une inscription (le flow le plus fréquent)
  └→ Sessions → Choisir session → Onglet "Inscrits" → "+ Inscrire"
      → Chercher ou créer l'apprenant → Montant + financement → Valider
      → Convention générée automatiquement → Envoi email auto
```

### 3.3 Raccourcis clavier (power users)

| Raccourci | Action |
|-----------|--------|
| `Ctrl+K` | Command palette (chercher partout) |
| `N` | Nouveau (lead, session, inscription selon la page) |
| `G S` | Aller aux Sessions |
| `G C` | Aller aux Contacts |
| `G D` | Aller au Dashboard |
| `?` | Afficher les raccourcis |

---

## 4. DESIGN SYSTEM SIMPLIFIÉ

### 4.1 Couleurs (réduites à l'essentiel)

| Token | Valeur | Usage |
|-------|--------|-------|
| `primary` | #2EC6F3 | CTA, liens actifs, focus |
| `text-1` | #0F172A | Titres, valeurs importantes |
| `text-2` | #475569 | Corps de texte |
| `text-3` | #94A3B8 | Labels, timestamps |
| `success` | #22C55E | Validé, payé, complété |
| `warning` | #F59E0B | En attente, relance |
| `danger` | #EF4444 | Erreur, urgent, en retard |
| `surface` | #FFFFFF | Cards, modals |
| `background` | #F8FAFC | Fond de page |
| `border` | #E2E8F0 | Bordures, séparateurs |

### 4.2 Composants réutilisables (design kit)

| Composant | Quand l'utiliser |
|-----------|-----------------|
| `Card` | Container de contenu (padding 20-24px, border, radius 12px) |
| `Badge` | Statuts, tags, compteurs |
| `Button` | Actions (primary = 1 seul par écran) |
| `Table` | Listes de données (pagination, tri) |
| `Tabs` | Onglets internes (contacts, gestion, etc.) |
| `Dialog` | Création/édition (modal centré) |
| `Toast` | Feedback temporaire (sonner) |
| `EmptyState` | Page vide avec CTA |
| `Skeleton` | Chargement |
| `KpiCard` | Chiffre clé avec icône et tendance |

### 4.3 Layout de page standard

```
┌─────────────────────────────────────────────────┐
│ Titre de la page          [CTA Principal]       │  ← PageHeader
├─────────────────────────────────────────────────┤
│ [Tab1] [Tab2] [Tab3] [Tab4]                     │  ← TabBar (si applicable)
├─────────────────────────────────────────────────┤
│ Filtres | Recherche                     Export ▾ │  ← Toolbar (optionnel)
├─────────────────────────────────────────────────┤
│                                                 │
│ Contenu principal                               │  ← Table / Cards / Kanban
│ (table, cards, kanban, calendrier)              │
│                                                 │
├─────────────────────────────────────────────────┤
│ Page 1/5  ◀ ▶                      25 résultats │  ← Pagination
└─────────────────────────────────────────────────┘
```

---

## 5. AMÉLIORATIONS CONCRÈTES À FAIRE

### 5.1 Dashboard : fusionner Cockpit + Dashboard

Le Dashboard actuel et le Cockpit sont 2 pages distinctes. Fusionner en 1 seule page :

```
Dashboard =
  [KPIs]                          ← 4-5 cartes chiffres clés
  [Actions du jour]               ← Rappels + smart actions (du cockpit)
  [Sessions à venir]              ← 3 prochaines sessions
  [Derniers leads]                ← 5 derniers leads
  [Gamification]                  ← Score + streak + badge (barre compacte)
```

### 5.2 Session détail : le centre de tout

La page session/[id] doit être la page la PLUS travaillée car c'est le centre de l'activité :

```
Session "Microblading 15-16 avril"
  ├→ Onglet INFO : dates, salle, formatrice, places, CA
  ├→ Onglet INSCRITS : liste avec paiement, financement, convention
  ├→ Onglet ÉMARGEMENT : QR code + présence jour par jour
  ├→ Onglet DOCUMENTS : convention, programme, attestation auto-générés
  └→ Onglet ÉVALUATION : questionnaire satisfaction post-formation
```

### 5.3 Fiche contact : unifier lead/client/apprenant

Quand on clique sur un contact, la fiche doit montrer TOUT son historique :

```
Sophie Martin
  ├→ Profil : coordonnées, entreprise, statut pro
  ├→ Historique : timeline de TOUS les événements (appels, emails, inscriptions)
  ├→ Formations : formations suivies + à venir + certificats
  ├→ Financement : dossiers OPCO en cours + passés
  └→ Documents : conventions, attestations, pièces jointes
```

---

## 6. MÉTRIQUES UX À SURVEILLER

| Métrique | Cible | Comment mesurer |
|----------|-------|----------------|
| Time to first value | < 5 minutes | Temps entre inscription et première session créée |
| Actions par session | 8-15 actions | Tracking events par visite |
| Pages par session | 3-5 pages | Analytics |
| Bounce rate sur Dashboard | < 20% | L'utilisateur fait quelque chose |
| Task completion rate | > 80% | Les actions commencées sont terminées |
| NPS utilisateurs | > 50 | Enquête trimestrielle |

---

*Audit réalisé le 21 mars 2026*
*Sources : [SaaS UI Design 2026](https://www.saasui.design/blog/7-saas-ui-design-trends-2026), [Onboarding Flows](https://www.saasui.design/blog/saas-onboarding-flows-that-actually-convert-2026), [CRM UX Best Practices](https://www.designstudiouiux.com/blog/crm-ux-design-best-practices/), [Progressive Disclosure](https://ixdf.org/literature/topics/progressive-disclosure)*
