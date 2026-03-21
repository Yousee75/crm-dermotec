---
name: Conversion et Paiement - Stratégie complète
description: Recherche exhaustive sur les méthodes de conversion, psychologie de vente, paiement (SEPA, Alma BNPL, Apple Pay), et automatisation pour centre de formation esthétique
type: reference
---

# Conversion & Paiement — Mars 2026

## PAIEMENT — Stratégie Stripe optimale

### Méthodes à activer (par priorité)
1. **automatic_payment_methods: { enabled: true }** → Stripe affiche auto carte, Alma, SEPA, Apple Pay, Google Pay
2. **Alma BNPL** : 2-3% commission, +20-50% conversion, 2500€ en 4x = 625€/mois
3. **SEPA Direct Debit** : 0.35€/tx (vs 1.5%+0.25€ carte), prélèvement auto possible
4. **Apple Pay / Google Pay** : +22.3% conversion, zéro config (inclus dans Stripe Checkout)
5. **Payment Links** : envoi par SMS/WhatsApp, lead chaud → paiement en 2min

### Flow "Convention + Paiement en un clic"
1. Page unique : formulaire + convention affichée + Stripe Payment Element
2. Click-to-sign (checkbox) = signature électronique simple valide eIDAS
3. Un seul POST /api/inscription → crée lead + inscription + convention signée + session Stripe
4. Webhook checkout.session.completed → statut INSCRIT + facture + email confirmation

### Scénario OPCO optimal
1. Inscription : collecter IBAN via SetupIntent (sans débiter)
2. Attente validation OPCO
3. Post-validation : prélever reste à charge via PaymentIntent off_session
4. Notification 14j avant pour SEPA Core

### Budget par méthode
| Méthode | Frais sur 2500€ |
|---------|-----------------|
| Carte FR | ~37.75€ (1.5%+0.25) |
| SEPA | ~0.35€ |
| Alma 3x | ~75€ (3%) |
| Apple/Google Pay | ~37.75€ (= carte) |

## PSYCHOLOGIE CONVERSION — Données prouvées

### Top techniques par impact
1. **Alma BNPL** : +20-50% conversion, ROI #1
2. **Témoignages vidéo** : +34-80% conversion, 60-90sec optimales
3. **Apple Pay/Google Pay** : +22.3% conversion
4. **Notifications social proof temps réel** : +98% vs statique
5. **Countdown timer (vraie date)** : +14-25% conversion
6. **Places restantes temps réel** : +10-20%
7. **Badges confiance (Qualiopi, Stripe)** : +8-18%
8. **Séquences nurturing 10 étapes** : +10-20% leads convertis

### Principes Cialdini appliqués Dermotec
- **Réciprocité** : brochure gratuite, webinaire, mini-formation vidéo
- **Engagement** : Quiz → Brochure → Webinaire → Appel → Pré-inscription
- **Preuve sociale** : témoignages, compteur stagiaires, notifications temps réel
- **Autorité** : Qualiopi, formatrices certifiées, partenariat NPM
- **Rareté** : places limitées réelles, dates sessions, early-bird
- **Unité** : communauté alumni, groupe WhatsApp

### Funnel micro-engagements optimal
1. Quiz gratuit (capture email)
2. Brochure PDF (capture téléphone)
3. Webinaire découverte (engagement temporel)
4. Appel conseillère 15min (engagement relationnel)
5. Pré-inscription 100€ arrhes (engagement financier)
6. Inscription complète

### Calculateur ROI
- Formation 2500€ → 200€/prestation × 3 clientes/semaine × 50 semaines = 30 000€/an
- ROI : investissement remboursé en 3 semaines

### Séquence de relance automatisée (10 étapes)
J+0 Email brochure + vidéo → J+0 WhatsApp bienvenue → J+1 SMS rappel → J+3 Email article → J+5 WhatsApp témoignage → J+7 Email urgence places → J+10 Appel conseillère → J+14 Email storytelling → J+21 WhatsApp dernière chance → J+28 Email offre spéciale

### Upsell post-achat
- Page confirmation : formation complémentaire -30%
- Kit matériel NPM réduction exclusive stagiaires
- Pack reconversion 3 formations -25%

## ESTIMATION IMPACT CUMULÉ
Taux conversion lead-to-inscription : 5-8% (actuel) → 15-25% (après optimisation)
= **doublement à triplement du CA à trafic égal**
