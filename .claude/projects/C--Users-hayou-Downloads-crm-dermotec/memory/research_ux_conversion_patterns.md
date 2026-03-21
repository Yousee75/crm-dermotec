---
name: UX/Design Patterns Haute Conversion
description: Patterns UX prouvés avec % d'impact - Stripe checkout, sticky CTA, social proof, countdown, before/after, pricing anchor, exit intent, formulaires multi-step
type: reference
---

# UX Patterns Haute Conversion — Mars 2026

## TOP PATTERNS PAR IMPACT PROUVÉ

| Pattern | Impact mesuré | Source |
|---------|--------------|--------|
| Multi-step forms (vs single page) | +86-300% conversion | Formstack, Venture Harbour |
| Stripe optimisé (Payment Element + wallets) | +35% potentiel | Baymard Institute |
| Before/After slider (beauté) | +30-83% engagement | L'Oréal, Sephora |
| Alma BNPL badges | +30-50% AOV | Klarna, Alma |
| Video témoignages | +25-80% | études agrégées |
| Sticky CTA mobile | +25% | Green Retail Consulting |
| Apple Pay/Google Pay | +22.3% | Stripe étude 50+ méthodes |
| Exit intent popup | +5-17% | GrowthSuite |
| Social proof popups | +15% | TrustPulse |
| Countdown timer (vraie deadline) | +15-35% | Peasy.nu |
| Trust badges (Qualiopi, Stripe) | +12-42% | études A/B |
| CTA orange vs bleu/vert | +34% clics | WitGroup |
| Verbes d'action CTA | +122% | HubSpot |

## COMPOSANTS À CONSTRUIRE

### 1. SocialProofToast
- Toast bottom-left, slide-up animation
- "Marie L. vient de s'inscrire à Microblading — il y a 2h"
- 1 notif / 30-45sec, max 5/session
- Données depuis inscriptions récentes Supabase

### 2. CountdownBanner
- Sticky top, bg-[#082545], timer digital
- "Session Microblading 15 avril — Plus que 3 places"
- UNIQUEMENT dates et places réelles

### 3. StickyBottomBar (mobile)
- Fixed bottom, 56px, apparaît quand CTA hero hors viewport
- IntersectionObserver pour toggle
- Formation + prix + bouton "S'inscrire"

### 4. WhatsAppFloatingButton
- Rond vert #25D366, 56px, fixed bottom-right
- bottom-20 mobile (éviter chevauchement sticky bar)
- Message pré-rempli "Bonjour, je souhaite des infos..."

### 5. BeforeAfterSlider
- Drag handle, clip-path CSS
- Photos même éclairage/angle
- Légende : technique, durée formation

### 6. TrustBar
- 6 badges : Qualiopi, Google Reviews, Stripe, Alma, France Travail, "+500 stagiaires"
- Sous le hero, grayscale → couleur au hover

### 7. ROICalculator
- Sliders : clientes/mois × panier moyen
- Output : CA mensuel supplémentaire
- CTA : "Recevoir mon étude" (capture email)

### 8. ExitIntentPopup
- Détection souris y < 10 (desktop), inactivité 60s (mobile)
- "Attendez ! Recevez notre guide + 10% première formation"
- 1 seule fois par session

### 9. AnchorPricing
- 3 colonnes, plan milieu mis en avant (scale-105, border primary)
- Prix original barré + économie en vert
- Règle des 100 : >100€ = montrer €, <100€ = montrer %

### 10. VideoTestimonialCarousel
- Format 9:16, auto-play muted quand visible
- IntersectionObserver pour play/pause
- Sous-titres incrustés, gradient overlay bas

## COULEURS CTA OPTIMALES
- Principal : #2EC6F3 (bon contraste sur blanc)
- Urgence : #FF6B35 (orange vif) pour promos
- Texte CTA : blanc, DM Sans Bold 16-18px
- Min height : 48px mobile, 44px desktop
- Texte : "Réserver ma place" (pas "Soumettre")

## TYPOGRAPHIE CONVERSION
- Titres : Bricolage Grotesque 700, 32-48px
- Body : DM Sans 400/500, 16-18px, line-height 1.6-1.75
- Max content width : 680px texte, 1200px grids
- Sections spacing : py-16 md:py-24
