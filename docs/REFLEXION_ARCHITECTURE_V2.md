# CRM Dermotec — Réflexion Architecture V2

> Prise de recul complète après analyse SmartOF, marché FR, et construction du produit.

---

## 1. LE VRAI PROBLÈME : TROP DE PAGES

On a **33 pages dashboard** + **56 pages total**. C'est BEAUCOUP TROP pour un OF de 2-10 personnes. SmartOF en a 3 modules principaux. Les OF veulent de la SIMPLICITÉ.

### Pages actuelles (33 dans le dashboard)

```
UTILISÉES QUOTIDIENNEMENT (5-6 pages max) :
✅ Dashboard          → KPIs du jour
✅ Ma journée         → Actions à faire (cockpit)
✅ Leads/Pipeline     → Prospection
✅ Sessions           → Planning formations
✅ Inscriptions       → Qui est inscrit où

UTILISÉES RÉGULIÈREMENT (hebdo/mensuel) :
✅ Financement        → Suivi dossiers OPCO
✅ Facturation        → Factures à émettre
✅ Qualité/Qualiopi   → Conformité
✅ Analytics          → Performance

RAREMENT UTILISÉES :
⚠️ Catalogue          → Change rarement
⚠️ Clients            → Consulté, pas piloté
⚠️ Apprenants         → Consulté via inscriptions
⚠️ Stagiaires         → Doublon avec inscriptions
⚠️ Equipe             → Config initiale
⚠️ BPF                → 1x par an (mai)

PROBABLEMENT INUTILES pour un OF esthétique :
❌ Academy            → Sur-ingénierie
❌ Cadences           → Trop complexe pour 2-3 commerciaux
❌ Messages           → Ils utilisent WhatsApp directement
❌ Performance        → Doublon analytics
❌ Playbook           → Trop corporate
❌ Notifications      → Badge suffit
❌ Onboarding         → 1 seule fois
```

### Recommandation : SIMPLIFIER

**Un OF esthétique a besoin de 8 pages, pas 33.**

---

## 2. ARCHITECTURE RELATIONNELLE OPTIMALE

### Le flux de données réel d'un OF

```
                    ┌─────────────┐
                    │  FORMATION  │ (catalogue : 11 produits)
                    │  (produit)  │
                    └──────┬──────┘
                           │ 1→N
                    ┌──────▼──────┐
                    │   SESSION   │ (instance planifiée avec dates)
                    │ (planifiée) │
                    └──────┬──────┘
                           │ 1→N
              ┌────────────▼────────────┐
              │      INSCRIPTION        │ (lien personne ↔ session)
              │ (stagiaire inscrit)     │
              └────┬──────────────┬─────┘
                   │              │
          ┌────────▼────┐  ┌─────▼──────┐
          │  APPRENANT  │  │   CLIENT   │
          │ (personne)  │  │(entreprise)│
          └─────────────┘  └─────┬──────┘
                                 │
                          ┌──────▼──────┐
                          │ FINANCEMENT │
                          │ (OPCO, FT)  │
                          └──────┬──────┘
                                 │
                          ┌──────▼──────┐
                          │   FACTURE   │
                          │ (au client  │
                          │  ou à OPCO) │
                          └─────────────┘
```

### Relations clés

| Relation | Type | Explication |
|----------|------|-------------|
| Formation → Sessions | 1→N | "Maquillage Permanent" a 3 sessions en mars |
| Session → Inscriptions | 1→N | La session du 17 mars a 4 inscrits |
| Inscription → Apprenant | N→1 | Julie est inscrite à 2 sessions |
| Inscription → Client | N→1 | L'institut "Belle & Bien" envoie 3 apprenantes |
| Client → Financement | 1→N | L'OPCO de "Belle & Bien" finance 2 formations |
| Financement → Facture | 1→1 | Le dossier OPCO génère une facture à l'OPCO |
| Inscription → Facture | N→1 | Les 3 inscriptions génèrent 1 facture au client |

### Problème actuel : Lead ≠ Client ≠ Apprenant

Notre table `leads` mélange TOUT :
- Un prospect qui n'a pas encore acheté (LEAD)
- Une entreprise qui envoie des gens (CLIENT)
- Une personne qui suit la formation (APPRENANT)

**Solution** : Le lead DEVIENT un client ou un apprenant après conversion.

```
LEAD (prospect)
  ├── Converti en CLIENT (si c'est une entreprise)
  └── Converti en APPRENANT (si c'est une personne individuelle)
```

---

## 3. PIPELINE ADAPTÉ AU MARCHÉ FRANÇAIS

### Pipeline actuel (trop commercial B2B)

```
NOUVEAU → CONTACTÉ → QUALIFIÉ → FINANCEMENT → INSCRIT → EN_FORMATION → FORMÉ → ALUMNI
```

**Problème** : 8 statuts c'est trop pour un OF qui gère 50-100 inscriptions/an.

### Pipeline simplifié (adapté OF esthétique)

```
DEMANDE → QUALIFIÉ → DEVIS ENVOYÉ → FINANCEMENT → INSCRIT → FORMÉ
                                        ↓
                                   SANS SUITE
```

**6 statuts au lieu de 11.** Plus clair, plus rapide, moins de clics.

| Statut | Ce qui se passe | Action commerciale |
|--------|----------------|-------------------|
| **DEMANDE** | Lead reçu (formulaire, tel, WhatsApp) | Rappeler sous 24h |
| **QUALIFIÉ** | Formation identifiée, profil OK | Envoyer devis + programme |
| **DEVIS ENVOYÉ** | Devis envoyé, en attente réponse | Relancer à J+3, J+7 |
| **FINANCEMENT** | Dossier OPCO/FT en cours | Suivre le dossier |
| **INSCRIT** | Payé ou financement validé | Envoyer convention + convocation |
| **FORMÉ** | Formation terminée | Demander avis Google + upsell |
| **SANS SUITE** | Perdu, reporté, spam | Archiver (soft delete) |

---

## 4. CE QUI COMPTE VRAIMENT POUR LE MARCHÉ FR

### Les 3 obligations légales d'un OF

1. **Qualiopi** (7 critères, 32 indicateurs) → Notre page Qualité est basique
2. **BPF** (Bilan Pédagogique et Financier) → On n'a RIEN (deal-breaker)
3. **Facturation conforme** (TVA, numérotation, FEC) → Incomplet

### Les 3 besoins quotidiens d'un OF

1. **Gérer les sessions** (planning, inscriptions, émargement)
2. **Gérer les financements** (dossiers OPCO, suivi versements)
3. **Facturer** (multi-financeur, export comptable)

### Les 3 frustrations d'un OF

1. **Trop de saisie manuelle** → Automatiser tout (devis, convention, facture, BPF)
2. **Peur de l'audit Qualiopi** → Montrer la conformité en 1 clic
3. **Pas de visibilité CA** → Dashboard avec prévisionnel + réalisé

---

## 5. SIDEBAR FINALE RECOMMANDÉE

**Principe : maximum 10 entrées visibles. Le reste dans les sous-pages.**

```
📊 Dashboard                    ← KPIs + rappels + agenda du jour
📅 Sessions                     ← Planning + inscriptions + émargement
👥 Contacts                     ← Leads + Clients + Apprenants (onglets)
💰 Gestion                      ← Financement + Facturation (onglets)
📋 Qualiopi                     ← 32 indicateurs + BPF + questionnaires
📈 Analytics                    ← Performance + conversion + CA
⚙️ Paramètres                   ← Équipe + Catalogue + Sécurité + Plan
```

**7 entrées au lieu de 20+.** Chaque page a des ONGLETS internes.

### Détail des onglets

| Page | Onglets internes |
|------|-----------------|
| **Sessions** | Calendrier · Liste sessions · Créer session |
| **Contacts** | Prospects · Clients · Apprenants · Pipeline |
| **Gestion** | Financement · Facturation · E-Shop · Devis |
| **Qualiopi** | Indicateurs · Questionnaires · BPF · Réclamations |
| **Analytics** | Dashboard · Conversions · Gamification · Leaderboard |
| **Paramètres** | Équipe · Catalogue formations · Sécurité · Mon plan · Intégrations |

---

## 6. PAGES À FUSIONNER OU SUPPRIMER

### Fusionner (réduire le nombre de pages)

| Pages actuelles | Fusionner en |
|----------------|-------------|
| Leads + Pipeline + Clients + Apprenants + Stagiaires | **Contacts** (avec onglets) |
| Financement + Facturation + Commandes | **Gestion** (avec onglets) |
| Qualité + BPF | **Qualiopi** (avec onglets) |
| Analytics + Performance | **Analytics** |
| Equipe + Catalogue + Settings + Security | **Paramètres** (avec onglets) |
| Cockpit + Dashboard | **Dashboard** (fusionner les 2) |

### Supprimer ou masquer (sur-ingénierie)

| Page | Pourquoi la retirer |
|------|-------------------|
| Academy | Un OF esthétique ne fait pas d'e-learning — il fait du présentiel |
| Cadences | Trop complexe, 2-3 relances manuelles suffisent |
| Messages | Ils utilisent WhatsApp/email directement |
| Playbook | Trop corporate pour un centre de 5 personnes |
| Performance | Doublon avec Analytics |
| Onboarding | 1 seule utilisation, peut être un modal |
| Notifications | Un badge + toast suffit |

### Garder mais déplacer en sous-page

| Page | Déplacer vers |
|------|-------------|
| Audit | Paramètres → Audit |
| Gamification | Analytics → Gamification |
| Leaderboard | Analytics → Leaderboard |
| Coaching IA | Cockpit (intégré dans le dashboard) |

---

## 7. CONCLUSION : FAIRE MOINS, FAIRE MIEUX

### Principe directeur

> "Un OF esthétique a 2-5 employés et gère 200-500 stagiaires/an.
> Il n'a pas besoin d'un Salesforce. Il a besoin d'un outil
> qui fait 5 choses parfaitement, pas 50 choses moyennement."

### Les 5 choses parfaites

1. **Planifier** → Sessions + inscriptions + émargement QR
2. **Financer** → Dossiers OPCO + multi-financement + suivi versements
3. **Facturer** → Factures conformes + export comptable + TVA
4. **Certifier** → Qualiopi 32 indicateurs + BPF automatique + questionnaires
5. **Vendre** → Pipeline simple + scoring + devis automatiques

### Ce qui nous différencie (garder)

- Gamification (unique sur le marché)
- AI Coaching (unique)
- Scoring lead /100 (unique)
- Smart Actions (unique)
- Spécialisation esthétique (unique)
- Prix 3x moins cher que SmartOF

### Ce qu'on doit ajouter (critique)

- BPF automatique
- Devis automatisé
- Questionnaires satisfaction
- Export comptable FEC

### Ce qu'on doit simplifier (urgent)

- Sidebar : 7 entrées au lieu de 20
- Pipeline : 6 statuts au lieu de 11
- Pages avec onglets au lieu de pages séparées

---

*Réflexion par Yossi Hayoun — Mars 2026*
*Basée sur : analyse SmartOF (172 pages), marché FR (42 892 OF Qualiopi), retours terrain*
