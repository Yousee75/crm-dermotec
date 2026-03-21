---
name: Workflows & Intégrations optimales
description: Outils, séquences automatisées, parcours prospect complet, email/SMS/WhatsApp workflows, helpdesk, calendrier, analytics pour centre de formation
type: reference
---

# Workflows & Intégrations — Mars 2026

## OUTILS RECOMMANDÉS (budget 50-110$/mois)

| Outil | Usage | Coût/mois |
|-------|-------|-----------|
| **Resend** (déjà dans stack) | Emails transactionnels | 0-20$ |
| **Inngest** | Orchestration workflows | 0$ (100K exec/mois free) |
| **pg_cron Supabase** | Jobs planifiés | 0$ (inclus) |
| **Crisp** | Live chat + support | 25$ (Pro) |
| **Cal.com** | Réservation + calendrier | 0-12$ |
| **Twilio/Plivo** | SMS rappels | 15-30$ (~200 SMS) |
| **Yousign** | Signature électronique | 9-23$ |
| **PostHog** | Analytics | 0$ (1M events free) |

## SÉQUENCES EMAIL À IMPLÉMENTER

| # | Séquence | Déclencheur | Emails | Timing |
|---|----------|-------------|--------|--------|
| 1 | Confirmation inscription | Inscription validée | 1 | Immédiat |
| 2 | Welcome + préparation | Paiement reçu | 3 | J+0, J+1, J+3 |
| 3 | Rappels pré-formation | Date session approche | 3 | J-7, J-2, J-1 |
| 4 | Post-formation satisfaction | Session terminée | 2 | J+1 (NPS), J+3 (certificat) |
| 5 | Upsell cross-sell | 30j après formation | 2 | J+30, J+60 |
| 6 | Alumni check-in | 90j après formation | 1 | J+90 |
| 7 | Relance financement | Dossier OPCO en cours | 3 | J+3, J+7, J+14 |
| 8 | Abandon inscription | Non finalisée | 3 | H+2, J+1, J+3 |
| 9 | Nurturing prospect froid | Sans activité 14j | 4 | J+14, J+21, J+30, J+45 |

## SMS vs WhatsApp vs Email — Quand utiliser quoi

| Canal | Usage | Timing |
|-------|-------|--------|
| Email | Confirmations, documents, contenus longs | Toujours |
| SMS | Rappels J-1, urgences, codes, NPS 1-clic | 9h-19h |
| WhatsApp | Échanges bidirectionnels, support, documents | 9h-20h |

SMS J-1 réduit le no-show de **30-40%**.

## WORKFLOW ONBOARDING STAGIAIRE

```
J+0 : Email bienvenue + accès espace stagiaire
J+0 : Création dossier documents
J+1 : Email "Documents à fournir"
J+3 : Si docs manquants → relance auto email
J+5 : Si toujours manquants → SMS + tâche agent
J-7 : Email préparation (programme, plan accès, matériel)
J-2 : Email récapitulatif final
J-1 : SMS rappel horaires + adresse
J   : QR code émargement auto
J+1 : Email satisfaction NPS
J+3 : Email certificat PDF
J+7 : Email ressources alumni
J+30 : Email formation complémentaire
```

## WORKFLOW SUIVI COMMERCIAL

- Detection leads stagnants : pg_cron 24h, sans activité > 7j → rappel auto
- Escalade rappels : non exécuté 48h → notification manager
- Scoring auto : ouverture email +5, visite site +3, demande devis +20
- Re-engagement : lead "perdu" 60j → séquence réactivation
- Pipeline velocity : même statut > 14j → alerte commercial

## HELPDESK : Crisp (25$/mois Pro)
- Multicanal (chat + WhatsApp + email + Messenger)
- Chatbot visuel pour qualifier prospects
- Base de connaissances FAQ
- Widget personnalisable couleurs Dermotec

## CALENDRIER : Cal.com (gratuit)
- Appels découverte avec lien dans emails nurturing
- Sync Google Calendar + Outlook bidirectionnel
- Rappels email/SMS natifs
- Embed dans le site Next.js

## ANALYTICS : PostHog (gratuit) + UTM maison
- UTM tracking dans Supabase Edge Function
- Attribution first-touch et last-touch
- Métriques : coût acquisition, conversion par étape, NPS, no-show, délai lead→inscription
