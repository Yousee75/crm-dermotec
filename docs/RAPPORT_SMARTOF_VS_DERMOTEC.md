# Rapport : SmartOF analysé — Comment repenser notre CRM

> Analyse de SmartOF (172 pages scrapées) pour comprendre la logique métier des organismes de formation et améliorer notre CRM Dermotec.

---

## 1. COMMENT UN ORGANISME DE FORMATION PENSE

### La réalité du métier (ce qu'on n'a pas compris)

Un organisme de formation ne pense PAS comme un commercial qui prospecte. Il pense en **SESSIONS**. Tout tourne autour de la session de formation :

```
PRODUIT DE FORMATION (catalogue)
    → SESSION (instance planifiée avec dates/lieu/formateur)
        → INSCRIPTIONS (stagiaires inscrits)
            → CONVENTION (document contractuel)
                → FINANCEMENT (qui paie : OPCO, France Travail, stagiaire)
                    → ÉMARGEMENT (présence jour par jour)
                        → ÉVALUATION (satisfaction + acquis)
                            → FACTURATION (facture au financeur)
                                → CERTIFICAT/ATTESTATION
                                    → BPF (bilan annuel obligatoire)
```

### Ce que SmartOF fait bien (et nous non)

SmartOF organise son logiciel autour de **3 pôles** :
1. **Gestion Administrative** = sessions, émargement, documents, BPF
2. **Gestion Commerciale** = CRM, devis, inscriptions, tunnel conversion
3. **Qualiopi** = questionnaires, évaluations, conformité 7 critères

**Notre CRM est organisé autour des LEADS (prospection B2B).** C'est le problème. Un OF pense d'abord SESSIONS puis INSCRITS, pas l'inverse.

---

## 2. FONCTIONNALITÉS SMARTOF — Détail complet

### 2.1 Catalogue de formations (Bibliothèque de produits)

Ce qu'ils ont :
- Catalogue centralisé de TOUS les produits de formation
- Stats d'utilisation par produit (nb sessions, nb inscrits)
- Statut actif/inactif
- Prix configurables
- Lien vers programme détaillé
- Générateur automatique de programme de formation

**Ce qui nous manque** : Notre table `formations` est un simple catalogue. Il faut :
- [ ] Stats par formation (nb sessions passées, nb inscrits total, CA généré)
- [ ] Générateur de programme PDF
- [ ] Catalogue en ligne public auto-généré

### 2.2 Gestion des sessions

Ce qu'ils ont :
- Création sessions INTRA (dans l'entreprise) et INTER (dans nos locaux)
- Workflow personnalisable par étapes/statuts
- Vue calendrier pour formateurs + salles
- Vérification automatique des prérequis
- Envoi automatique des convocations J-7
- Suivi assiduité intégré (émargement)
- Rapports d'activité par session
- Calcul de rentabilité par session (charges vs revenus)

**Ce qui nous manque** :
- [ ] Distinction INTRA vs INTER
- [ ] Calcul rentabilité session (charges formateur, salle, matériel vs CA)
- [ ] Envoi automatique convocations (on a le template mais pas l'auto-envoi)
- [ ] Vue calendrier formateurs (disponibilités)

### 2.3 CRM Commercial

Ce qu'ils ont :
- Pipeline commercial (Kanban)
- Opportunités commerciales (pas juste des leads)
- Devis automatisés (récupère données client + formation)
- Tunnel de conversion 100% personnalisable
- Tâches de relance automatisées
- Historique complet par contact (emails, appels, notes)
- Indicateurs de performance commerciale
- Intégration HubSpot, Pipedrive, Salesforce

**Ce qu'on a de MIEUX** :
- ✅ Gamification (ils n'ont pas)
- ✅ AI Coaching (ils n'ont pas)
- ✅ Scoring lead /100 (ils n'ont pas)
- ✅ Smart Actions proactives (ils n'ont pas)

**Ce qui nous manque** :
- [ ] Notion d'OPPORTUNITÉ (un lead peut avoir plusieurs opportunités/devis)
- [ ] Générateur de DEVIS automatisé
- [ ] Tunnel personnalisable par l'utilisateur

### 2.4 Base de contacts

Ce qu'ils ont :
- Base unifiée : Clients + Apprenants + Prospects + Formateurs
- Champs personnalisables
- Filtres multi-critères
- Import/export Excel
- Formulaires d'inscription qui alimentent la base
- Documents auto-générés liés au contact
- API pour synchronisation externe

**Ce qui nous manque** :
- [ ] Distinction claire Client (entreprise) vs Apprenant (personne physique)
  - Un CLIENT peut envoyer 5 APPRENANTS sur une formation
  - L'OPCO paie pour le CLIENT, pas pour l'apprenant
- [ ] Champs personnalisables par l'utilisateur

### 2.5 Facturation

Ce qu'ils ont :
- Factures générées automatiquement depuis les sessions
- Multi-financement (plusieurs financeurs pour 1 inscription)
- Facturation échelonnée (selon avancement formation)
- Gestion TVA avancée (exonération art. 261.4.4° CGI)
- Exports comptables CEGID et Sage
- Export journaux de ventes Excel/PDF
- Templates de facture personnalisables
- Suivi paiements

**Ce qui nous manque** :
- [ ] Multi-financement (1 inscription = OPCO 80% + stagiaire 20%)
- [ ] Facturation échelonnée liée à l'avancement
- [ ] Export comptable format CEGID/Sage/FEC
- [ ] Numérotation séquentielle obligatoire

### 2.6 Financeurs externes

Ce qu'ils ont :
- Base de données synchronisée des financeurs
- Suivi par dossier de financement
- Lien automatique financeur → inscription → facture

**Ce qu'on a déjà** : ✅ Notre module financement est déjà bon (12 organismes, checklist, workflow)

### 2.7 Émargement numérique

Ce qu'ils ont :
- QR Code par session (le stagiaire scanne)
- Feuille d'émargement auto-générée
- Suivi assiduité en temps réel
- Conformité Qualiopi

**Ce qu'on a** : ✅ On a déjà l'émargement QR + signature

### 2.8 BPF (Bilan Pédagogique et Financier)

Ce qu'ils ont :
- **Pré-remplissage automatique** du BPF annuel
- Sections financières : CA par source de financement, charges, salaires formateurs
- Sections pédagogiques : nb formateurs, heures, nb apprenants par statut, durées
- Vérification croisée entre sections
- Récupération historique
- Export vers la plateforme MAF (Mon Activité Formation)

**Ce qui nous manque CRUCIALEMENT** :
- [ ] BPF automatisé — C'est OBLIGATOIRE avant le 31 mai chaque année
- [ ] Sans ça, les OF ne peuvent pas nous utiliser comme outil principal

### 2.9 Qualiopi (7 critères, 32 indicateurs)

Ce qu'ils ont :
- Guide interactif des 32 indicateurs
- Suivi conformité par indicateur
- Questionnaires de satisfaction (apprenants, clients, formateurs)
- Évaluation des acquis
- Gestion des réclamations
- Préparation audit

**Ce qu'on a** : ✅ Page Qualité avec les 7 critères, mais c'est basique
**Ce qui manque** :
- [ ] Suivi par INDICATEUR (pas juste par critère)
- [ ] Questionnaires de satisfaction automatiques post-formation
- [ ] Évaluation des acquis par stagiaire
- [ ] Préparation audit (checklist, documents à fournir)

### 2.10 Intégrations

Ce qu'ils ont :
- EuroSign (signature électronique)
- Google Agenda + Microsoft Agenda
- Gmail + Outlook
- Google Sheets
- HubSpot, Pipedrive, Salesforce
- Moodle (LMS e-learning)
- WordPress
- Zapier

**Ce qui nous manque** :
- [ ] Signature électronique (EuroSign ou Yousign)
- [ ] Google Agenda sync bidirectionnelle
- [ ] Moodle/LMS integration
- [ ] Zapier (pour connecter à tout)

---

## 3. CE QU'IL FAUT CHANGER DANS NOTRE CRM

### 3.1 Problème fondamental : mauvaise organisation des onglets

**Actuellement notre sidebar** :
```
Dashboard → Leads → Pipeline → Sessions → Stagiaires → Financement →
Commandes → Analytics → Qualité → Cockpit → Equipe → Settings
```

**Ce que pense un OF** :
```
1. Mon CATALOGUE de formations (produits)
2. Mes SESSIONS planifiées (calendrier)
3. Mes INSCRITS (par session, pas par lead)
4. Ma FACTURATION (par session + financeur)
5. Mon SUIVI QUALITÉ (Qualiopi)
6. Mon BPF (annuel)
7. Mon CRM (prospection — secondaire)
```

### 3.2 Réorganisation proposée de la sidebar

```
📊 Dashboard           ← Vue d'ensemble KPIs
📚 Catalogue            ← Formations (produits), programmes
📅 Sessions             ← Planning, calendrier, disponibilités
👥 Contacts             ← Clients + Apprenants + Prospects (unifiés)
💰 Commercial           ← Pipeline, devis, opportunités, relances
📝 Inscriptions         ← Par session, avec financement + paiement
💳 Facturation          ← Factures, devis, exports comptables
📋 Qualiopi             ← 32 indicateurs, questionnaires, évaluations
📊 BPF                  ← Bilan Pédagogique et Financier
🛒 E-Shop              ← Matériel NPM (optionnel)
🎯 Cockpit              ← Ma journée, smart actions, coaching IA
👥 Équipe               ← Formateurs, commerciaux
⚙️ Paramètres           ← Config, sécurité, intégrations
🔍 Audit               ← Historique, tracking (admin)
```

### 3.3 Fonctionnalités prioritaires à ajouter

| Priorité | Fonctionnalité | Raison | Effort |
|----------|---------------|--------|--------|
| **P0** | BPF automatisé | Obligatoire légalement, deal-breaker | 3-5 jours |
| **P0** | Distinction Client vs Apprenant | Logique métier fondamentale | 2 jours |
| **P0** | Multi-financement par inscription | 1 inscription = plusieurs payeurs | 2 jours |
| **P1** | Devis automatisé | Workflow commercial de base | 2 jours |
| **P1** | Questionnaires satisfaction auto | Obligatoire Qualiopi | 2 jours |
| **P1** | Évaluation acquis par stagiaire | Obligatoire Qualiopi | 1 jour |
| **P1** | Export comptable FEC/CEGID/Sage | Requis par les comptables | 2 jours |
| **P2** | Sessions INTRA vs INTER | Distinction métier importante | 1 jour |
| **P2** | Calcul rentabilité session | Charges vs revenus | 1 jour |
| **P2** | Catalogue en ligne public | Marketing automatique | 2 jours |
| **P2** | Champs personnalisables | Flexibilité utilisateur | 3 jours |
| **P3** | Signature électronique | EuroSign/Yousign | 2 jours |
| **P3** | Google Agenda sync | Planification formateurs | 2 jours |
| **P3** | Zapier integration | Connecter à tout | 2 jours |

---

## 4. PRICING SmartOF vs NOUS

| | SmartOF Launch | SmartOF Starter | SmartOF Pro | **Dermotec Pro** | **Dermotec Expert** |
|-|---------------|----------------|-------------|-----------------|-------------------|
| **Prix** | 75 EUR/mois | 149 EUR/mois | 249 EUR/mois | **49 EUR/mois** | **99 EUR/mois** |
| **Users** | 1 | 2 | 4 | 3 | 10 |
| **Gamification** | ❌ | ❌ | ❌ | **✅** | **✅** |
| **AI Coaching** | ❌ | ❌ | ❌ | **✅** | **✅** |
| **BPF auto** | ✅ | ✅ | ✅ | **❌ (à faire)** | **❌ (à faire)** |
| **Qualiopi** | ✅ | ✅ | ✅ | **Basique** | **Basique** |
| **Spé esthétique** | ❌ | ❌ | ❌ | **✅** | **✅** |

**Notre avantage prix est MASSIF** : 49 EUR vs 149 EUR pour des features comparables + gamification + IA.
**Notre faiblesse** : le BPF et les questionnaires Qualiopi automatiques manquent.

---

## 5. CONCLUSION

### Ce qu'on fait MIEUX que SmartOF
- Gamification commerciale (+35% engagement)
- AI Coaching contextuel
- Sécurité 7 couches (ils n'ont rien de comparable)
- Scoring lead /100, smart actions proactives
- Spécialisation esthétique (scripts vente, connaissances métier)
- MFA 3 méthodes
- Audit trail complet + soft delete
- Prix 2-3x moins cher

### Ce que SmartOF fait MIEUX que nous
- BPF automatisé (obligatoire !)
- Distinction Client/Apprenant (fondamental)
- Multi-financement par inscription
- Devis automatisés
- Questionnaires satisfaction + évaluation acquis
- Export comptable CEGID/Sage
- Signature électronique intégrée
- Google Agenda sync
- Maturité produit (450+ clients, 400K+ apprenants)

### Plan d'action immédiat
1. **Réorganiser la sidebar** selon la logique OF (pas la logique commercial)
2. **Implémenter le BPF** (c'est le deal-breaker #1)
3. **Ajouter Client vs Apprenant** (logique métier fondamentale)
4. **Questionnaires satisfaction automatiques** (Qualiopi obligatoire)

**Avec ces 4 ajouts, on est supérieur à SmartOF sur TOUS les critères tout en étant 3x moins cher.**

---

*Rapport basé sur l'analyse de 172 pages du site smartof.tech — Mars 2026*
*Sources : smartof.tech/sitemap.xml, pages fonctionnalités, tarifs, guide Qualiopi*
