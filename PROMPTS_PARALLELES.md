# 7 Prompts pour sessions Claude Code paralleles
# CRM Dermotec — Lancement Mars 2026
# Chaque prompt est autonome et touche des fichiers differents

---

## PROMPT 1 — Build & TypeScript (fichiers: next.config.ts, src/app/api/[[...route]]/, tsconfig.json)

```
Tu travailles sur le CRM Dermotec (Next.js 15 + React 19 + Supabase + Stripe + Tailwind v4).

OBJECTIF : Rendre le build propre et deployable.

Lis le CLAUDE.md pour comprendre le projet.

TACHES PRECISES :

1. Lance `npm run type-check` et corrige TOUTES les erreurs TypeScript une par une.
   - Ne change pas la logique metier, corrige uniquement les types.
   - Si un type manque, ajoute-le dans src/types/index.ts
   - Si un import est incorrect, corrige-le

2. Dans next.config.ts :
   - Retire `ignoreBuildErrors: true` de typescript
   - Retire `ignoreDuringBuilds: true` de eslint

3. Resous le conflit /404 avec le catch-all Hono :
   - Le fichier src/app/api/[[...route]]/route.ts capture TOUTES les routes API
   - Ca entre en conflit avec src/app/not-found.tsx
   - Solution : dans le catch-all Hono, ajoute un check — si la route ne commence pas par /api/, retourner un 404 JSON au lieu de capturer la requete
   - OU utilise le matcher dans le config Hono pour ne capturer que /api/*

4. Ajoute .env.vercel au .gitignore

5. Lance `npm run build` et verifie que ca passe sans erreurs

6. Si des fichiers .bak de Sentry existent (sentry.client.config.ts.bak etc.), renomme-les en .ts pour reactiver Sentry. Si le build casse a cause de Sentry, wrappe les configs dans des try/catch avec des valeurs par defaut.

REGLES :
- Lis chaque fichier AVANT de le modifier
- Un commit par etape logique
- Ne modifie JAMAIS la logique metier, seulement les types et la config build
```

---

## PROMPT 2 — Formulaires de creation (fichiers: src/components/ui/CreateLeadDialog.tsx, CreateSessionDialog.tsx, AddInscriptionDialog.tsx, AddTeamMemberDialog.tsx + pages qui les utilisent)

```
Tu travailles sur le CRM Dermotec (Next.js 15 + React 19 + Supabase + Stripe + Tailwind v4).

OBJECTIF : Implementer les formulaires de creation manquants. C'est le probleme n1 du CRM — on peut voir les donnees mais pas en creer facilement.

Lis le CLAUDE.md pour comprendre le projet et les regles (branding, touch targets, validation).
Lis src/types/index.ts pour les types.
Lis src/lib/validators.ts pour les state machines et validateurs.
Lis src/lib/constants.ts pour les formations et la config.
Lis src/components/ui/Dialog.tsx pour le composant dialog existant.
Lis src/components/ui/Input.tsx et Button.tsx pour les composants de form.

TACHES PRECISES :

1. Cree src/components/ui/CreateLeadDialog.tsx
   - Dialog modal ouvert depuis n'importe quelle page
   - Champs : prenom*, nom*, email*, telephone, formation_principale (select), source (select), statut_pro (select), message (textarea)
   - Les champs avec * sont obligatoires
   - Validation avec les validateurs existants (email, phone FR)
   - Apres creation : toast succes + redirection vers /lead/{id}
   - Utilise useCreateLead() de src/hooks/use-leads.ts
   - Raccourci clavier : N ouvre le dialog (deja configure dans KeyboardShortcuts.tsx, il faut juste le connecter)

2. Cree src/components/ui/CreateSessionDialog.tsx
   - Champs : formation_id* (select depuis formations), date_debut*, date_fin*, horaire_debut, horaire_fin, salle, formatrice_id (select depuis equipe ou formatrice = true), places_max (defaut 6)
   - Statut initial = BROUILLON
   - Utilise un hook useCreateSession() a creer dans src/hooks/use-sessions.ts

3. Cree src/components/ui/AddInscriptionDialog.tsx
   - Pour ajouter un stagiaire a une session existante
   - Champs : lead_id* (recherche par nom), montant_total, mode_paiement
   - Verifie que la session a encore des places
   - Statut initial = EN_ATTENTE

4. Cree src/components/ui/AddTeamMemberDialog.tsx
   - Champs : prenom*, nom*, email*, telephone, role* (select: admin, manager, commercial, formatrice, assistante), specialites (multi-select), objectif_mensuel, taux_horaire (si formatrice)

5. Integre ces dialogs :
   - CreateLeadDialog : dans le layout.tsx (accessible partout) + bouton dans leads/page.tsx et pipeline/page.tsx
   - CreateSessionDialog : dans sessions/page.tsx
   - AddInscriptionDialog : dans session/[id]/page.tsx (onglet Inscrits)
   - AddTeamMemberDialog : dans equipe/page.tsx

DESIGN :
- Branding Dermotec : #2EC6F3 primary, #082545 accent
- Fonts : DM Sans body, Bricolage Grotesque headings
- Touch targets 44px minimum
- Animation d'entree (fadeIn + scale)
- Loading state sur le bouton submit
- Gestion erreurs avec messages inline sous chaque champ
- Le dialog doit etre responsive (full-screen sur mobile)

PATTERN A SUIVRE (exemple) :
- Regarde comment les mutations sont faites dans src/hooks/use-leads.ts (useCreateLead)
- Toutes les mutations invalident le cache React Query apres succes
- Toast de succes via sonner (import { toast } from 'sonner')
```

---

## PROMPT 3 — Analytics & Data Visualization (fichiers: src/app/(dashboard)/analytics/page.tsx, src/hooks/use-analytics.ts)

```
Tu travailles sur le CRM Dermotec (Next.js 15 + React 19 + Supabase + Recharts + Tailwind v4).

OBJECTIF : Implementer la page Analytics avec de vrais graphiques. C'est actuellement un placeholder avec "Bientot". Le dirigeant du centre de formation regarde cette page pour prendre ses decisions.

Lis le CLAUDE.md pour comprendre le projet.
Lis src/app/(dashboard)/analytics/page.tsx pour voir l'etat actuel.
Lis src/hooks/use-analytics.ts pour voir les donnees disponibles.
Lis src/app/api/analytics/dashboard/route.ts pour les requetes SQL.
Lis src/types/index.ts pour les types.
Lis src/components/ui/KpiCard.tsx, Card.tsx, Badge.tsx, Tabs.tsx pour les composants UI.

Le hook use-analytics.ts fait deja 12 requetes paralleles et retourne :
- totalLeads, newLeadsThisMonth, conversionRate
- leadsByStatus (pour le funnel)
- leadsBySource (pour la repartition des sources)
- sessionStats (planifiees, en cours, terminees, taux remplissage)
- financementStats (en cours, valides, montant total)
- caTotal, caMois, caParMois (chiffre d'affaires)
- formationsPopulaires (top formations par inscriptions)
- npsScore (Net Promoter Score)

TACHES PRECISES :

1. Refais completement analytics/page.tsx avec ces sections :

   A. HEADER avec 6 KPIs en grille :
      - Total leads (all time)
      - Nouveaux ce mois
      - Taux conversion (%)
      - CA ce mois (EUR)
      - Sessions planifiees
      - NPS Score

   B. GRAPHIQUE 1 — Funnel de conversion (BarChart horizontal ou vertical)
      - Barres pour chaque statut du pipeline : NOUVEAU → CONTACTE → QUALIFIE → FINANCEMENT → INSCRIT → EN_FORMATION → FORME
      - Couleurs degradees du bleu au vert
      - Pourcentage de passage entre chaque etape

   C. GRAPHIQUE 2 — Evolution CA par mois (AreaChart)
      - Courbe lissee avec zone remplie
      - 12 derniers mois
      - Couleur primary #2EC6F3 avec opacite
      - Tooltip avec montant EUR formate

   D. GRAPHIQUE 3 — Sources des leads (PieChart ou donut)
      - Repartition par source (site_web, bouche_a_oreille, instagram, etc.)
      - Couleurs distinctes par source
      - Legende en dessous

   E. GRAPHIQUE 4 — Top formations (BarChart horizontal)
      - Formations classees par nombre d'inscriptions
      - Nom formation + count

   F. GRAPHIQUE 5 — Financement (PieChart)
      - Repartition par statut (en cours, valides, refuses)
      - Montant total affiche au centre du donut

   G. SECTION INSIGHTS (texte) :
      - "Meilleure source : {source} ({x}% des leads)"
      - "Formation la plus demandee : {nom}"
      - "Taux de remplissage moyen : {x}%"

2. Si use-analytics.ts ne fournit pas certaines donnees, ajoute les requetes manquantes dans le hook.

3. Si la route API /api/analytics/dashboard ne retourne pas tout, ajoute les requetes SQL.

DESIGN :
- Couleurs Dermotec : #2EC6F3 primary, #082545 accent
- Utilise les composants Card et Tabs existants
- Responsive : 1 colonne mobile, 2 colonnes tablette, 3 colonnes desktop
- Animations : graphiques apparaissent avec fadeIn au scroll
- Dark backgrounds pour les graphiques (bg-[#082545] avec texte blanc) pour un look premium
- OU fond blanc avec bordures subtiles pour rester coherent avec le reste du dashboard

TECHNIQUE :
- Recharts est deja installe (import { BarChart, Bar, PieChart, Pie, AreaChart, Area, ... } from 'recharts')
- ResponsiveContainer pour le responsive
- Tooltips et legends personnalises avec le branding
```

---

## PROMPT 4 — Tests critiques (fichiers: src/__tests__/)

```
Tu travailles sur le CRM Dermotec (Next.js 15 + React 19 + Supabase + Stripe + Vitest).

OBJECTIF : Ecrire les tests pour les flux critiques. Actuellement il y a 1 seul fichier de test (result.test.ts). L'outil gere de l'argent reel (Stripe) et des donnees personnelles — il FAUT des tests.

Lis le CLAUDE.md pour comprendre le projet.
Lis le fichier src/__tests__/result.test.ts pour voir le pattern de test existant.
Lis package.json pour la config Vitest.

TACHES PRECISES — Cree ces fichiers de test :

1. src/__tests__/validators.test.ts
   - Teste TOUTES les fonctions de src/lib/validators.ts
   - Tests positifs ET negatifs pour : validateEmail, validatePhone, validateSIRET, validateMontant, validateCodePostal
   - Teste les 4 state machines : isValidTransition pour Lead, Financement, Session, Inscription
   - Teste sanitizeString (injection XSS, SQL, strings normaux)
   - Teste sanitizeFormData
   - Au moins 40 tests

2. src/__tests__/scoring.test.ts
   - Teste scoreLead() de src/lib/scoring.ts
   - Teste avec un lead complet (score eleve)
   - Teste avec un lead quasi-vide (score bas)
   - Teste chaque composante individuellement
   - Teste getScoreColor et getScoreLabel
   - Au moins 15 tests

3. src/__tests__/smart-actions.test.ts
   - Teste generateSmartActions() de src/lib/smart-actions.ts
   - Teste avec des leads stagnants (5+ jours sans contact)
   - Teste avec des rappels en retard
   - Teste avec des sessions incompletes
   - Teste le tri par priorite
   - Au moins 10 tests

4. src/__tests__/state-machines.test.ts
   - Teste TOUTES les transitions valides et invalides pour les 4 state machines
   - Lead : NOUVEAU peut aller vers CONTACTE mais PAS vers FORME
   - Financement : SOUMIS peut aller vers EN_EXAMEN mais PAS vers PREPARATION
   - Session : BROUILLON peut aller vers PLANIFIEE mais PAS vers TERMINEE
   - Inscription : EN_ATTENTE peut aller vers CONFIRMEE mais PAS vers COMPLETEE
   - Au moins 30 tests

5. src/__tests__/utils.test.ts
   - Teste formatEuro, formatDate, formatPhone, formatRelativeDate
   - Teste generateNumeroFacture, generateCertificatNumero
   - Teste getInitials, daysBetween, isOverdue, slugify
   - Au moins 15 tests

6. src/__tests__/disposable-emails.test.ts
   - Teste isDisposableEmail() avec des domaines bloques (mailinator, yopmail...)
   - Teste avec des domaines legit (gmail, outlook, orange.fr)
   - Au moins 10 tests

7. src/__tests__/marketing.test.ts
   - Teste generateReferralCode, calculateUpsellScore, getBestContactTime
   - Teste getFinancementEligibility avec differents statut_pro
   - Au moins 10 tests

REGLES :
- Utilise Vitest (import { describe, it, expect } from 'vitest')
- Pas de mocks de base de donnees — teste uniquement la logique pure
- Nomme les tests en francais pour la coherence avec le projet
- Lance `npm run test` a la fin pour verifier que tout passe
- Objectif : 130+ tests au total
```

---

## PROMPT 5 — Securite & Production hardening (fichiers: src/lib/api-key-auth.ts, src/app/api/portail/, src/app/api/documents/, .gitignore, sentry configs)

```
Tu travailles sur le CRM Dermotec (Next.js 15 + React 19 + Supabase + Stripe).

OBJECTIF : Corriger toutes les failles de securite identifiees et preparer le deploiement production.

Lis le CLAUDE.md pour comprendre le projet et les regles de securite.

TACHES PRECISES :

1. CHIFFREMENT PII (src/lib/api-key-auth.ts)
   - Le chiffrement actuel utilise XOR — c'est inadequat pour la production
   - Remplace par AES-256-GCM en utilisant le module crypto natif de Node.js
   - Utilise une cle derivee de ENCRYPTION_KEY env var via PBKDF2
   - Genere un IV unique par operation (12 bytes)
   - Retourne le format : iv:authTag:ciphertext (tout en base64)
   - Ajoute decryptPII qui inverse le processus
   - Teste avec un round-trip (encrypt → decrypt = original)

2. VALIDATION SIGNATURE CONVENTION (src/app/api/portail/[token]/sign-convention/route.ts)
   - Ajoute une validation du magic number PNG : les 8 premiers octets doivent etre 89 50 4E 47 0D 0A 1A 0A
   - Limite la taille de la signature a 500KB max
   - Ajoute un check que le base64 decode correctement

3. UPLOADED_BY (src/app/api/documents/upload/route.ts)
   - Ligne 142 : uploaded_by est null
   - Recupere l'utilisateur connecte via Supabase auth (getUser())
   - Si pas d'utilisateur, retourne 401

4. PROTECTION .ENV
   - Ajoute a .gitignore : .env.vercel, .env.production, .env.*.local
   - Verifie que .env.local est deja dans .gitignore
   - Si le fichier .env.vercel contient des secrets, avertis dans la console

5. CONSOLE.ERROR EN PRODUCTION
   - Dans src/lib/logger.ts, ajoute une fonction sanitizeForLog() qui :
     - Masque les emails (j***@domain.com)
     - Masque les telephones (06 ** ** ** 89)
     - Masque les tokens/cles API (****derniers4chars)
   - Utilise cette fonction dans les catch blocks des API routes critiques

6. MESSAGES D'ERREUR API
   - Dans src/app/api/inscription-express/route.ts : remplace les messages d'erreur qui exposent des infos business ("places full", "session not found") par des messages generiques cote client, avec le detail dans les logs server

7. HEADERS SECURITE
   - Verifie dans src/middleware.ts que tous les headers suivants sont presents :
     - Strict-Transport-Security
     - X-Content-Type-Options: nosniff
     - X-Frame-Options: DENY
     - Referrer-Policy: strict-origin-when-cross-origin
     - Permissions-Policy (camera, microphone, geolocation disabled)
   - Ajoute si manquant : Cross-Origin-Opener-Policy: same-origin

REGLES :
- Lis chaque fichier AVANT de le modifier
- Ne casse pas les fonctionnalites existantes
- Teste chaque correction
- Commente les choix de securite pour que l'equipe comprenne
```

---

## PROMPT 6 — UX Complete : Messages, Actions, Export, Notifications (fichiers: src/app/(dashboard)/messages/, leads/, src/components/ui/NotificationCenter.tsx)

```
Tu travailles sur le CRM Dermotec (Next.js 15 + React 19 + Supabase + Tailwind v4).

OBJECTIF : Rendre les actions utilisateur fonctionnelles. Actuellement beaucoup de boutons sont visuellement presents mais ne font rien. Un outil professionnel = chaque bouton fait quelque chose.

Lis le CLAUDE.md pour comprendre le projet.
Lis src/hooks/use-messages.ts pour les hooks de messagerie.
Lis src/hooks/use-leads.ts pour les mutations leads.
Lis src/lib/email.ts, src/lib/twilio.ts pour l'envoi de messages.

TACHES PRECISES :

1. MESSAGES — Actions fonctionnelles (src/app/(dashboard)/messages/page.tsx)
   - Le bouton Appel (Phone icon) dans le header du thread : ouvre tel:{numero} sur mobile, copie le numero sur desktop avec toast
   - Le bouton Email : ouvre mailto:{email} avec sujet pre-rempli
   - Le bouton WhatsApp : ouvre https://wa.me/{numero}?text={message} avec message template
   - Quand on envoie un message par email, appele /api/email/send avec le template
   - Quand on envoie par SMS/WhatsApp, appele /api/messages POST
   - Affiche un toast de confirmation ou d'erreur

2. EXPORT LEADS (src/app/(dashboard)/leads/page.tsx)
   - Le bouton "Exporter" doit etre fonctionnel
   - Exporte en CSV : prenom, nom, email, telephone, statut, source, score, formation, date_creation
   - Headers en francais
   - Nom du fichier : leads_export_YYYY-MM-DD.csv
   - Encoding UTF-8 avec BOM pour Excel
   - Si des filtres sont actifs, exporte uniquement les leads filtres

3. NOTIFICATION CENTER (nouveau composant src/components/ui/NotificationCenter.tsx)
   - Icone Bell dans le header du layout (deja presente visuellement)
   - Au clic : dropdown panel avec les notifications :
     - Rappels en retard (rouge)
     - Rappels aujourd'hui (orange)
     - Nouvelles inscriptions (vert)
     - Smart actions critiques (rouge)
   - Badge count sur l'icone (nombre total de notifications non lues)
   - Clic sur une notification → navigation vers la page concernee
   - Donnees : combiner useOverdueRappels(), useTodayRappels(), et generateSmartActions()
   - Design : panel dropdown, max 5 items visibles, "Voir tout" link vers cockpit

4. BULK ACTIONS sur la page Leads (src/app/(dashboard)/leads/page.tsx)
   - Ajoute des checkboxes sur chaque ligne du tableau
   - Checkbox "Tout selectionner" dans le header
   - Quand des leads sont selectionnes, affiche une barre d'actions en bas :
     - "Changer statut" → dropdown avec les statuts
     - "Assigner" → dropdown avec l'equipe commerciale
     - "Exporter selection" → CSV des leads selectionnes
   - La barre disparait quand rien n'est selectionne
   - Animation d'apparition slide-up

5. QUICK EDIT sur les tables (leads et commandes)
   - Sur la page leads : le statut doit etre un dropdown inline (pas besoin d'aller dans la fiche)
   - Sur la page commandes : le statut est deja un dropdown inline (garder tel quel)
   - Utilise les state machines pour valider les transitions autorisees

DESIGN :
- Coherent avec le design system existant (couleurs, fonts, composants)
- Animations douces (150ms transitions)
- Touch-friendly (44px targets)
- Responsive (stack vertical sur mobile)
```

---

## PROMPT 7 — UX Fluidity & Experience polish (fichiers: toutes les pages, layout, composants globaux)

```
Tu travailles sur le CRM Dermotec (Next.js 15 + React 19 + Supabase + Tailwind v4 + framer-motion).

OBJECTIF : Rendre l'experience utilisateur FLUIDE et PROFESSIONNELLE. Pas des features, mais du POLISH — ce qui fait la difference entre un prototype et un vrai produit.

Lis le CLAUDE.md pour comprendre le projet.
Lis src/app/(dashboard)/layout.tsx pour le layout principal.
Lis src/components/ui/CommandPalette.tsx pour la palette de commandes.

Pense comme un designer UI/UX de chez Linear ou Notion. Ce qui rend un outil agreable :
- Chaque action a un feedback immediat
- Les transitions sont douces mais rapides
- Les raccourcis clavier accelerent tout
- Les etats vides guident au lieu de frustrer
- Le loading est elegant, jamais un ecran blanc

TACHES PRECISES :

1. COMMAND PALETTE ENRICHIE (src/components/ui/CommandPalette.tsx)
   - Ajoute des categories dans la recherche :
     - "Actions" : Nouveau lead, Nouvelle session, Envoyer email
     - "Navigation" : toutes les pages du CRM
     - "Leads recents" : 5 derniers leads consultes (stockes en sessionStorage)
   - Ajoute les raccourcis affiches a droite de chaque action (ex: "N" pour nouveau lead)
   - Recherche fuzzy (tolere les fautes de frappe)
   - Icones pour chaque type de resultat

2. PAGE TRANSITIONS
   - Ajoute des transitions entre les pages avec framer-motion
   - Effet subtil : fadeIn + slideUp (y: 8px → 0, opacity: 0 → 1, duration: 200ms)
   - Wrappe le {children} dans le layout.tsx avec AnimatePresence + motion.div
   - NE PAS utiliser de layout animations complexes — juste un fade rapide

3. LOADING STATES PREMIUM
   - Remplace tous les "Chargement..." par des Skeleton components
   - Dashboard home : skeleton cards pour les KPIs, skeleton list pour les leads
   - Pipeline : skeleton colonnes
   - Lead detail : skeleton avec la forme des tabs
   - Verifie que CHAQUE page a un loading state propre (pas de flash blanc)

4. EMPTY STATES GUIDES
   - Pour chaque page, quand il n'y a pas de donnees, affiche un EmptyState avec :
     - Une illustration ou icone
     - Un titre encourageant (pas "Aucun resultat")
     - Une description qui explique QUOI FAIRE
     - Un bouton CTA (ex: "Creer votre premier lead" au lieu de juste "Creer")
   - Pages a verifier : Dashboard, Leads, Pipeline, Sessions, Messages, Commandes, Financement

5. TOAST NOTIFICATIONS INTELLIGENTES
   - Apres creation d'un lead : toast avec le nom + lien "Voir la fiche"
   - Apres changement de statut : toast avec ancien → nouveau statut
   - Apres envoi d'email : toast "Email envoye a {nom}"
   - Apres drag-and-drop pipeline : toast "Lead deplace vers {statut}"
   - Utilise sonner (deja installe) avec le style richColors

6. BREADCRUMBS & CONTEXT
   - Ajoute des breadcrumbs sur les pages de detail :
     - Lead detail : Dashboard > Leads > {Prenom Nom}
     - Session detail : Dashboard > Sessions > {Formation nom}
   - Utilise des liens cliquables pour chaque niveau
   - Style discret en haut de la page (text-sm, text-gray-400)

7. RACCOURCIS CLAVIER VISIBLES
   - Dans le footer de la sidebar, ajoute un petit lien "Raccourcis (?)"
   - Au hover ou clic : affiche un tooltip ou petit modal avec les raccourcis :
     - Cmd+K : Recherche
     - N : Nouveau lead
     - G+L : Leads, G+P : Pipeline, G+S : Sessions, G+D : Dashboard
     - Esc : Fermer dialog/panel
   - Le ? (point d'interrogation) doit aussi ouvrir cette aide

8. SIDEBAR AMÉLIORATIONS
   - Ajoute le lien "Playbook" dans la section Commercial de la sidebar (il manque)
   - Ajoute un indicateur de notifications (badge rouge) sur l'icone Bell du header
   - Quand la sidebar est collapsed, les tooltips doivent afficher le nom de la page

DESIGN :
- Toutes les animations : 150-200ms ease-out
- Aucune animation > 300ms (ca parait lent)
- Pas d'animations sur les elements qui apparaissent en masse (listes)
- Les transitions de page ne doivent PAS bloquer l'interaction
```

---

## ORDRE DE LANCEMENT RECOMMANDE

Lancer les 7 en meme temps. Ils ne touchent pas les memes fichiers.

Si tu ne peux en lancer que 4, priorise :
1. PROMPT 1 (Build) — Fondation, tout depend de ca
2. PROMPT 2 (Creation) — Le plus gros impact UX
3. PROMPT 4 (Tests) — Securite pour Stripe
4. PROMPT 3 (Analytics) — Valeur pour le dirigeant

Les 3 autres (Securite, Actions, Polish) peuvent attendre un second round.
