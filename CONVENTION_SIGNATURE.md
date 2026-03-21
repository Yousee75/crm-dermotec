# Convention E-Signature - Fonctionnalité de signature électronique

## 📋 Résumé

J'ai créé une fonctionnalité complète de signature électronique pour les conventions de formation dans le CRM Dermotec.

## 🆕 Nouveaux fichiers créés

### API Routes
- `src/app/api/portail/[token]/sign-convention/route.ts` - Endpoint pour valider et enregistrer la signature

### Pages
- `src/app/portail/[token]/convention/page.tsx` - Page dédiée à la signature de convention
- `src/app/portail/[token]/convention/layout.tsx` - Layout avec métadonnées SEO

### Modifications
- `src/app/portail/[token]/page.tsx` - Ajout d'un onglet "Ma Convention" dans le portail

## 🎯 Fonctionnalités

### Page de signature (`/portail/[token]/convention`)
- **Responsive** : Mobile-first, touch targets 44px minimum
- **Informations** : Résumé formation (nom, dates, montants, lieu)
- **Articles** : 8 articles de convention (objet, dates, programme, etc.)
- **RGPD** : Checkbox de consentement obligatoire
- **Signature** : Canvas tactile avec validation
- **États** :
  - Non signée : Formulaire complet de signature
  - Signée : Message de confirmation avec date

### API Route (`/api/portail/[token]/sign-convention`)
- **Validation** : Token portail valide
- **Format** : Signature doit être `data:image/png;base64,`
- **Base de données** :
  - `inscriptions.convention_signee = true`
  - Document dans table `documents` (type: convention, is_signed: true)
  - Activité loggée (type: DOCUMENT)
- **Sécurité** : IP et User-Agent capturés

### Onglet portail
- **Intégration** : Nouvel onglet "Ma Convention" dans le portail stagiaire
- **Statut** : Affichage statut signée/en attente
- **CTA** : Bouton vers page de signature si non signée
- **Confirmation** : Message succès si signée

## 🎨 Design

- **Branding** : Couleurs Dermotec (#2EC6F3 primary, #082545 accent)
- **Typography** : Clean et professionnelle
- **Responsive** : Mobile-first design
- **UX** : Feedback utilisateur, états de chargement, gestion erreurs

## 🔒 Sécurité & Conformité

- **Signature électronique** : Compatible eIDAS (mention légale)
- **RGPD** : Consentement explicite
- **Intégrité** : Hash et métadonnées pour traçabilité
- **Audit** : Logs complets dans table activités

## 🚀 Utilisation

1. **Accès direct** : `/portail/[token]/convention`
2. **Via portail** : Onglet "Ma Convention"
3. **Workflow** :
   - Lecture convention + articles
   - Consentement RGPD
   - Signature dans canvas
   - Validation et confirmation

## ⚙️ Technique

- **Stack** : Next.js 15 + React 19 + TypeScript
- **Base** : Supabase (tables inscriptions, documents, activites)
- **Composant** : SignatureCanvas existant (touch + mouse)
- **Types** : Interfaces TypeScript strictes

## 📱 Optimisations Mobile

- Canvas tactile optimisé
- Touch targets 44px minimum
- Responsive breakpoints
- Scroll et navigation adaptés

Les stagiaires peuvent maintenant signer leur convention directement sur mobile/tablette avant leur formation.