---
name: Parcours Prospect Complet - 6 Scénarios
description: Workflows détaillés pour chaque scénario prospect (autofinancement, OPCO, France Travail, CPF, post-formation alumni, réactivation) avec templates messages, timing, actions CRM
type: reference
---

# Parcours Prospect - 6 Scénarios Automatisés

## TIMING PAR SCÉNARIO

| Scénario | Durée prospect→inscrit | Étapes |
|----------|----------------------|--------|
| Autofinancement | 10 jours | Email→SMS→Appel→WhatsApp→Devis→Paiement |
| OPCO | 30-60 jours | +Collecte docs→Soumission→Attente→Validation |
| France Travail (AIF) | 30-90 jours | +Conseiller FT→KAIROS→Validation AIF |
| CPF | 7-21 jours | +MonCompteFormation→Validation→Confirmation |
| Post-formation | 365 jours | Certificat→Avis→Upsell→Alumni→Parrainage→Anniversaire |
| Réactivation | 180 jours | Email→SMS→WhatsApp social proof→Dernière chance→Saisonnier |

## WORKFLOW AUTOFINANCEMENT (10 jours)
- J+0 : Email bienvenue + brochure (Resend)
- J+1 : SMS bienvenue 10h (Telnyx)
- J+1-2 : Appel qualification 9h-10h mercredi/jeudi (+164% vs 12h-14h)
- J+3 : WhatsApp relance 11h (si pas QUALIFIÉ)
- J+2-5 : Devis + convention email (après qualification)
- J+5 : Relance devis SMS si pas de retour
- J+5-10 : Paiement Stripe (Alma 3x/Apple Pay/SEPA)
- J-7 : Convocation email + programme
- J-1 : SMS rappel adresse + horaires (réduit no-show 30-40%)
- J+0 : Formation + émargement QR

## WORKFLOW OPCO (30-60 jours)
- J+0-5 : Qualification + détection OPCO
- H+2 : Email documents requis (checklist auto depuis ORGANISMES_FINANCEMENT)
- J+5 : WhatsApp relance docs manquants
- J+10-15 : Dossier complet → soumission OPCO
- J+15 : SMS prospect "dossier en cours" + appel OPCO
- J+21 : Relance si pas de réponse
- J+30-45 : Validation ou refus
- Si validé : Inscription + facture ajustée + convocation
- Si refusé : Email alternatives (3x, CPF, autre OPCO)

## WORKFLOW FRANCE TRAVAIL/AIF (30-90 jours)
- H+2 : Email guide AIF pas à pas + modèle lettre motivation
- J+7 : Appel "avez-vous parlé à votre conseiller ?"
- J+10 : Dépôt devis KAIROS + email confirmation
- J+14, J+21, J+28 : SMS/WhatsApp suivi bi-hebdo
- J+30-50 : Validation AIF par conseiller
- Puis : inscription + convocation standard

## WORKFLOW CPF (7-21 jours)
- H+2 : Email guide MonCompteFormation 3 étapes
- J+3 : WhatsApp "besoin d'aide pour trouver notre formation ?"
- J+5-7 : Validation organisme (2j ouvrés)
- J+7-11 : Rappel SMS "confirmez votre inscription CPF"
- Reste à charge 2026 : 103.20€ (exonéré pour demandeurs emploi)

## WORKFLOW POST-FORMATION → ALUMNI (365 jours)
- J+0 : Satisfaction à chaud (tablette en salle, NPS 1-10)
- J+1 : Email certificat + attestation + guide "lancer votre activité"
- J+5 : Email demande avis Google
- J+7 : WhatsApp satisfaction à froid "comment ça se passe ?"
- J+30 : Email upsell formation complémentaire (mapping UPSELL_MAP existant)
- J+60 : SMS suivi activité
- J+90 : Email alumni + code parrainage (100€ parrain, 50€ filleul) + promo e-shop -10%
- J+180 : Enquête alumni Qualiopi (a_lancé_activité, CA estimé, NPS)
- J+30→365 : Newsletter mensuelle
- J+365 : Email anniversaire formation + code promo -15%

## WORKFLOW RÉACTIVATION (180 jours)
- J+0 : Email "avez-vous encore des questions ?" + nouvelles dates + social proof
- J+3 : SMS urgence places limitées
- J+7 : WhatsApp témoignage alumnie
- J+14 : Dernière relance email (empathique, pas insistant)
- J+90 : Email saisonnier (rentrée, nouveautés)
- J+180 : Si rien → statut PERDU

## MAPPING STATUTS → CADENCES
| Statut | Cadence | Sortie |
|--------|---------|--------|
| NOUVEAU | nouveau_lead | Appel → CONTACTÉ |
| CONTACTÉ | nouveau_lead (suite) | Qualifié → QUALIFIÉ |
| QUALIFIÉ | — (actions manuelles) | Devis/financement |
| FINANCEMENT_EN_COURS | relance_financement | Validé/Refusé |
| INSCRIT | — (convocation J-7) | Jour J |
| EN_FORMATION | — | Fin session |
| FORMÉ | post_formation | J+90 → ALUMNI |
| ALUMNI | newsletter mensuelle | Perpétuel |
| inactif 14j | abandon | Réponse ou J+180 → PERDU |

## HORAIRES OPTIMAUX
| Canal | Jours | Heures | Stat |
|-------|-------|--------|------|
| Appels | Mercredi/Jeudi | 8h-10h ou 16h-17h | +164% vs 12h-14h |
| Emails | Mardi-Jeudi | 9h-10h ou 14h-15h | Standard B2C |
| SMS | Mardi-Vendredi | 10h-12h | Légal 8h-20h |
| WhatsApp | Lundi-Vendredi | 10h-18h | Moins intrusif |
| Jamais | Dimanche, avant 8h ou après 20h | — | RGPD/CNIL |

## CONFORMITÉ QUALIOPI PAR ÉTAPE
- C1 (Info publique) : formulaire site, email bienvenue, devis
- C2 (Conception) : appel qualification, analyse besoin, positionnement
- C3 (Adaptation) : convention, questionnaire entrée, convocation
- C4 (Moyens) : émargement numérique, évaluation, certificat
- C5 (Personnel) : CV formatrice, diplômes
- C6 (Environnement) : veille sectorielle
- C7 (Amélioration) : satisfaction J+0, J+7, enquête J+180, réclamations
