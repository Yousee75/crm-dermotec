# CRM DERMOTEC — Centre de Formation Esthétique

## Langue et style
- Répondre en français sauf code/technique
- Aller droit au but. Agir.

## Projet en 30 secondes

**Marque** : Dermotec Advanced
**Activité** : Centre de formation esthétique certifié Qualiopi + Distributeur NPM France
**Cible** : Esthéticiennes, reconversions pro, gérantes institut
**Lieu** : 75 Bd Richard Lenoir, Paris 11e
**Formations** : 11 formations (400€-2500€ HT), 4 catégories
**Stack** : Next.js 15 + Supabase + Stripe + Resend + Tailwind
**Supabase** : `https://wtbrdxijvtelluwfmgsf.supabase.co`
**Stripe** : `acct_1RpvbQ1NzDARltfq` (11 produits + prix créés)

## 6 Piliers CRM

1. **Leads & Pipeline** — Capture multicanal → Kanban (11 statuts)
2. **Financement** — Dossiers OPCO/France Travail/CPF (12 organismes)
3. **Sessions & Planning** — Calendrier, formatrices, modèles, matériel
4. **Suivi Stagiaires** — Présence, évaluation, certificats, alumni
5. **E-Shop & Commandes** — Matériel NPM, Stripe, livraison
6. **Analytics & Qualité** — CA, conversion, Qualiopi (7 critères, 32 indicateurs)

## DB : 18 tables Supabase

leads · formations · sessions · inscriptions · financements · factures · rappels · activites · documents · commandes · equipe · modeles · notes_lead · email_templates · qualite · partenaires · cadence_templates · cadence_instances

## Commandes

```bash
npm run dev              # Dev local
npm run build            # Build production
npm run stripe:listen    # Webhooks Stripe local
npm run db:types         # Regénérer types Supabase
```

## Règles absolues

1. JAMAIS commiter .env.local
2. TOUJOURS valider côté serveur (API routes)
3. TOUJOURS logger les activités (table activites)
4. TOUJOURS vérifier auth dans les API routes
5. Branding : #2EC6F3 primary, #082545 accent, DM Sans + Bricolage Grotesque
