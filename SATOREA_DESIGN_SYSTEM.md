# SATOREA — DESIGN SYSTEM COMPLET
## Fichier de référence couleurs — À donner à Claude pour tout projet Satorea

---

## 🎯 CONTEXTE PROJET

**Satorea** est une agence digitale française spécialisée PME.
Services : Sites web, E-commerce, CRM, Automation IA, Scraping/Data, Avis Google, Formation.
Positionnement : Disruptif, tech, humain. "Les outils des grandes boîtes, pour les PME."
Cible : Dirigeants de TPE/PME français (artisans, commerçants, restaurateurs, prestataires).

---

## 🎨 PALETTE PRINCIPALE — LES 3 COULEURS SIGNATURE

### NOIR (80% de la surface — la base)
```
--satorea-black-total:   #0a0a0a   → Background principal (hero, nav)
--satorea-black-deep:    #111111   → Background secondaire
--satorea-black-card:    #1a1a1a   → Cards, sections, blocs
--satorea-black-border:  #2a2a2a   → Bordures, séparateurs
--satorea-black-muted:   #3a3a3a   → Éléments discrets, hover states
```
**Rôle émotionnel** : Sérieux, premium, tech, professionnel. Donne le statut.
**Usage** : Backgrounds, nav, footer, cards, conteneurs. JAMAIS de fond blanc sur Satorea.

### ORANGE (couleur d'action — 15% de la surface)
```
--satorea-orange-fire:   #ff5c00   → Orange principal — logo, CTA primaires, icônes services
--satorea-orange-light:  #ff8c42   → Orange clair — hover états, nuances, accents secondaires
--satorea-orange-glow:   #ff7a2a   → Orange intermédiaire — gradients, transitions
--satorea-orange-pale:   #fff1e6   → Fond orange très clair (usage rare, mode clair uniquement)
```
**Rôle émotionnel** : Énergie, action, transformation, urgence positive. "Passe à l'action."
**Usage** : Logo Satorea, bouton CTA principal ("Démarrer mon projet"), icônes de features, badges promo.

### ROSE (couleur signature — 5% max de la surface)
```
--satorea-pink-electric: #ff2d78   → Rose principal — signature mémorable
--satorea-pink-light:    #ff6ba8   → Rose clair — hover, nuances
--satorea-pink-soft:     #ffb3cc   → Rose pastel — accents très discrets
--satorea-pink-pale:     #ffe0ef   → Fond rose (usage rare)
```
**Rôle émotionnel** : Mémorabilité, disruption, surprise, audace. Ce qui reste dans la tête.
**Usage** : Mots-clés en highlight dans les titres H1, badges "Nouveau", hover sur liens, éléments "wow".

---

## 🔤 COULEURS TEXTE

```
--satorea-text-primary:   #ffffff   → Texte principal sur fond noir
--satorea-text-secondary: #888888   → Texte secondaire, descriptions
--satorea-text-muted:     #555555   → Texte discret, métadonnées
--satorea-text-disabled:  #333333   → Texte désactivé
--satorea-text-orange:    #ff8c42   → Texte orange (sur fond noir uniquement)
--satorea-text-pink:      #ff6ba8   → Texte rose (sur fond noir uniquement)
```

---

## 🖥️ COULEURS CRM — INTERFACE OUTIL INTERNE

> Le CRM Satorea est une interface de gestion clients.
> Sur fond sombre, chaque couleur encode une information précise.

### Statuts clients / leads
```
--crm-status-new:         #ff5c00   → Nouveau lead (orange — action requise)
--crm-status-contacted:   #ff8c42   → Contacté (orange clair — en cours)
--crm-status-qualified:   #3b82f6   → Qualifié (bleu — information validée)
--crm-status-proposal:    #a855f7   → Devis envoyé (violet — en attente décision)
--crm-status-won:         #22c55e   → Gagné (vert — succès)
--crm-status-lost:        #ef4444   → Perdu (rouge — négatif)
--crm-status-cold:        #555555   → Froid / inactif (gris — neutre)
```

### Priorité tâches
```
--crm-priority-urgent:    #ff2d78   → Urgent (rose électrique Satorea — très visible)
--crm-priority-high:      #ff5c00   → Haute (orange Satorea)
--crm-priority-medium:    #f59e0b   → Moyenne (ambre)
--crm-priority-low:       #6b7280   → Basse (gris)
```

### Catégories de services (tags dans le CRM)
```
--crm-tag-web:            #3b82f6   → Sites & E-commerce (bleu — digital classique)
--crm-tag-crm:            #a855f7   → CRM & Automation (violet — tech avancée)
--crm-tag-data:           #22c55e   → Data & Scraping (vert — data)
--crm-tag-reviews:        #f59e0b   → Avis Google / E-réputation (ambre — réputation)
--crm-tag-ai:             #ff2d78   → IA / Agents (rose Satorea — cutting edge)
--crm-tag-training:       #06b6d4   → Formation (cyan — savoir)
--crm-tag-voice:          #ff5c00   → Voice / Vocalizen (orange Satorea)
```

### États de paiement / facturation
```
--crm-payment-paid:       #22c55e   → Payé (vert)
--crm-payment-pending:    #f59e0b   → En attente (ambre)
--crm-payment-overdue:    #ef4444   → En retard (rouge)
--crm-payment-partial:    #3b82f6   → Partiel (bleu)
--crm-payment-free:       #6b7280   → Gratuit / offert (gris)
```

### Backgrounds CRM (interface sombre)
```
--crm-bg-page:            #0a0a0a   → Fond page principale
--crm-bg-sidebar:         #111111   → Sidebar navigation
--crm-bg-card:            #1a1a1a   → Cards clients, fiches
--crm-bg-input:           #222222   → Champs de saisie
--crm-bg-hover:           #2a2a2a   → Hover sur lignes tableau
--crm-bg-selected:        #1a1a2a   → Ligne sélectionnée (teinte bleue)
--crm-border-default:     #2a2a2a   → Bordures
--crm-border-focus:       #ff5c00   → Focus input (orange Satorea)
```

### Graphiques & analytics dans le CRM
```
--crm-chart-primary:      #ff5c00   → Série principale (orange)
--crm-chart-secondary:    #ff2d78   → Série secondaire (rose)
--crm-chart-tertiary:     #3b82f6   → Série tertiaire (bleu)
--crm-chart-quaternary:   #22c55e   → Série quaternaire (vert)
--crm-chart-grid:         #1a1a1a   → Lignes de grille
--crm-chart-axis:         #444444   → Axes
--crm-chart-label:        #666666   → Labels de données
```

---

## 🔔 COULEURS SYSTÈME — FEEDBACK UTILISATEUR

```
--sys-success-bg:         #0d2e1a   → Background succès (vert très sombre)
--sys-success-border:     #22c55e   → Bordure succès
--sys-success-text:       #4ade80   → Texte succès
--sys-success-icon:       #22c55e   → Icône succès

--sys-error-bg:           #2e0d0d   → Background erreur (rouge très sombre)
--sys-error-border:       #ef4444   → Bordure erreur
--sys-error-text:         #f87171   → Texte erreur
--sys-error-icon:         #ef4444   → Icône erreur

--sys-warning-bg:         #2e1f0d   → Background warning (ambre très sombre)
--sys-warning-border:     #f59e0b   → Bordure warning
--sys-warning-text:       #fbbf24   → Texte warning
--sys-warning-icon:       #f59e0b   → Icône warning

--sys-info-bg:            #0d1a2e   → Background info (bleu très sombre)
--sys-info-border:        #3b82f6   → Bordure info
--sys-info-text:          #60a5fa   → Texte info
--sys-info-icon:          #3b82f6   → Icône info
```

---

## 📐 RÈGLES D'UTILISATION — OBLIGATOIRES

### Règle des 80/15/5
- **80%** de chaque interface = noir (base, containers, backgrounds)
- **15%** = orange (actions, CTA, logo, éléments interactifs importants)
- **5% max** = rose (highlights, badges, moments de surprise)

### Ce qu'on ne fait JAMAIS
- ❌ Fond blanc comme base principale
- ❌ Orange ET rose ensemble sur le même élément (trop chargé)
- ❌ Texte rose sur fond orange (illisible et incohérent)
- ❌ Plus de 2 couleurs accent sur la même section
- ❌ Gris clair comme couleur de texte secondaire (utiliser #888888 minimum)

### Hiérarchie des CTA
1. **CTA principal** → bouton orange plein (#ff5c00, texte blanc)
2. **CTA secondaire** → bouton outline rose (border #ff2d78, texte #ff2d78, fond transparent)
3. **CTA tertiaire** → texte orange avec flèche → (#ff8c42)
4. **Lien simple** → texte #888888, hover #ff6ba8

### Badges / Pills
- Nouveau / Featured → fond #ff2d78, texte blanc
- Promo / Offre → fond #ff5c00, texte blanc
- Service tag → fond #1a1a1a, texte couleur du service, bordure couleur du service
- Statut CRM → fond très sombre de la couleur statut, texte clair

---

## 🔤 TYPOGRAPHIE SATOREA

```
Font principale :    Inter ou Geist Sans (clean, tech, moderne)
Font titres :        Inter 700 ou Geist Sans 800 (jamais de serif)
Font mono/code :     Geist Mono ou JetBrains Mono (pour données CRM)

Tailles :
  --text-xs:   11px  → Labels, metadata CRM
  --text-sm:   13px  → Corps secondaire, descriptions cards
  --text-base: 15px  → Corps principal
  --text-lg:   18px  → Sous-titres sections
  --text-xl:   24px  → Titres cards, H3
  --text-2xl:  32px  → H2 sections
  --text-3xl:  48px  → H1 hero
  --text-4xl:  64px  → Grande accroche hero (mobile : 40px)
```

---

## 📦 TOKENS CSS — À COPIER DIRECTEMENT

```css
:root {
  /* === PALETTE PRINCIPALE === */
  --satorea-black-total:    #0a0a0a;
  --satorea-black-deep:     #111111;
  --satorea-black-card:     #1a1a1a;
  --satorea-black-border:   #2a2a2a;
  --satorea-black-muted:    #3a3a3a;

  --satorea-orange-fire:    #ff5c00;
  --satorea-orange-light:   #ff8c42;
  --satorea-orange-glow:    #ff7a2a;

  --satorea-pink-electric:  #ff2d78;
  --satorea-pink-light:     #ff6ba8;
  --satorea-pink-soft:      #ffb3cc;

  --satorea-white:          #ffffff;
  --satorea-text-primary:   #ffffff;
  --satorea-text-secondary: #888888;
  --satorea-text-muted:     #555555;

  /* === CRM STATUTS === */
  --crm-new:        #ff5c00;
  --crm-contacted:  #ff8c42;
  --crm-qualified:  #3b82f6;
  --crm-proposal:   #a855f7;
  --crm-won:        #22c55e;
  --crm-lost:       #ef4444;
  --crm-cold:       #555555;

  /* === CRM PRIORITÉS === */
  --crm-urgent:     #ff2d78;
  --crm-high:       #ff5c00;
  --crm-medium:     #f59e0b;
  --crm-low:        #6b7280;

  /* === CRM SERVICES === */
  --tag-web:        #3b82f6;
  --tag-crm:        #a855f7;
  --tag-data:       #22c55e;
  --tag-reviews:    #f59e0b;
  --tag-ai:         #ff2d78;
  --tag-training:   #06b6d4;
  --tag-voice:      #ff5c00;

  /* === CRM PAIEMENTS === */
  --pay-paid:       #22c55e;
  --pay-pending:    #f59e0b;
  --pay-overdue:    #ef4444;
  --pay-partial:    #3b82f6;

  /* === SYSTÈME === */
  --sys-success:    #22c55e;
  --sys-error:      #ef4444;
  --sys-warning:    #f59e0b;
  --sys-info:       #3b82f6;

  /* === LAYOUTS === */
  --radius-sm:      4px;
  --radius-md:      8px;
  --radius-lg:      12px;
  --radius-xl:      16px;
  --radius-full:    9999px;
}
```

---

## 🧠 INSTRUCTIONS POUR CLAUDE

Quand tu reçois ce fichier, voici comment l'utiliser :

1. **Interface dark obligatoire** — Satorea n'utilise JAMAIS de fond blanc comme base. Toujours partir de `#0a0a0a` ou `#111111`.

2. **Orange = action** — Tout ce qui invite à cliquer, agir, progresser est en orange `#ff5c00`. C'est aussi la couleur du logo.

3. **Rose = moment "wow"** — Utilise `#ff2d78` avec parcimonie. C'est la surprise, le highlight, ce qui fait que le client se souvient de Satorea.

4. **CRM = lisibilité fonctionnelle** — Dans le CRM, chaque couleur encode une information (statut, priorité, service). Ne pas mélanger les sémantiques. Un lead "Gagné" est TOUJOURS vert `#22c55e`.

5. **Cohérence orange/rose** — Ces deux couleurs coexistent car elles sont dans la même famille chaude/vibrante. Elles ne se battent pas si chacune garde son rôle.

6. **Texte sur fond noir** — Toujours blanc `#ffffff` pour le texte principal, `#888888` pour le secondaire. Jamais de gris clair type `#cccccc` ou `#e5e5e5` — trop fade sur dark.

---

*Fichier généré pour Satorea — Design System v1.0*
*Palette : Noir Total / Orange Feu / Rose Électrique*
