import React from 'react'

/**
 * TEST — Génération rapport prospect pour ELLE Esthétique Paris 11
 *
 * Exécuter via : npx tsx src/lib/pdf/test-rapport-prospect.tsx
 * Ou intégrer dans une route API pour générer le PDF
 */

import { renderToBuffer } from '@react-pdf/renderer'
import { RapportProspect } from './rapport-prospect'
import { writeFileSync } from 'fs'

const MOCK_NARRATIVE = {
  brief_commercial: "Tu appelles Ajanthaa, gérante d'ELLE Esthétique, un salon de beauté multi-services à Paris 11e (Père Lachaise). Salon actif sur Treatwell, équipe de 4 personnes, offre large (ongles, threading, blanchiment, coiffure). Pas de dermopigmentation dans leur carte = opportunité directe pour le microblading et le maquillage permanent. Zone hyper-dynamique, forte concurrence mais aucun concurrent ne fait de formation.",

  verdict: "Prospect tiède à fort potentiel — salon établi avec équipe formée, manque clairement de prestations dermo-esthétiques. Bonne capacité d'investissement. A convertir via l'argument ROI microblading.",

  histoire_prospect: "Ajanthaa dirige ELLE Esthétique au 39 rue Servan, Paris 11e, depuis 2022. Son salon est un petit institut de quartier qui a su se diversifier : ongles, threading, blanchiment dentaire, coiffure. Elle a une équipe de 4 personnes (Coumba, Wafa, Meghna). Le salon est référencé sur Treatwell et a un Instagram @elle_paris11. C'est une entrepreneuse pragmatique qui cherche à se différencier dans un quartier très concurrentiel.",

  situation_business: "SAS créée en 2022, encore jeune. Le salon propose des prestations classiques (ongles, coiffure, threading) mais rien en dermo-esthétique premium. Avec 4 employées, elle a la capacité d'absorber une nouvelle prestation sans embaucher. Le quartier Père Lachaise / Oberkampf a un fort pouvoir d'achat et une clientèle sensible aux tendances beauté.",

  reputation_visibilite: "Présente sur Treatwell avec des avis positifs. Instagram actif @elle_paris11. Site web elleesthetique.fr opérationnel. Pas trouvée sur Google Maps de façon proéminente — c'est une faiblesse à combler. La présence digitale est correcte mais pourrait être bien meilleure avec des photos de résultats dermo-esthétiques.",

  environnement: "Rue Servan, Paris 11e — quartier Père Lachaise / Oberkampf. Zone à très fort trafic piéton, nombreux restaurants et commerces. 5 stations de métro à moins de 500m (lignes 2, 3, 9). Concurrence beauté modérée à forte mais aucun concurrent local ne propose de formations certifiées. Le pouvoir d'achat du quartier est idéal pour des prestations premium.",

  atouts_vente: [
    "Aucune prestation dermo dans sa carte = marché vierge pour elle",
    "Equipe de 4 = peut former 1-2 personnes sans fermer le salon",
    "Quartier premium Paris 11e = clientèle prête à payer",
    "Déjà sur Treatwell = sait générer des réservations en ligne",
    "SAS récente = peut bénéficier d'aides à la formation (OPCO EP)",
  ],

  pieges_eviter: [
    "Ne pas parler de 'formation' mais de 'nouvelle prestation rentable'",
    "Attention au prix — SAS jeune, trésorerie peut être serrée → parler financement d'emblée",
    "Ne pas dénigrer ses prestations actuelles (threading, ongles) — valoriser l'ajout",
    "Éviter le lundi matin — salon probablement fermé",
  ],

  strategie: {
    canal: "Appel téléphonique direct au 06 44 04 91 74",
    meilleur_moment: "Mardi ou mercredi entre 10h et 12h (avant le rush de l'après-midi)",
    angle_attaque: "Le microblading comme prestation complémentaire ultra-rentable pour son salon",
    objectif_appel: "Décrocher un RDV de 15min en visio ou au salon pour montrer le catalogue + simuler le ROI",
    duree_estimee: "5-7 min max — elle sera occupée entre deux clientes",
  },

  script_telephone: {
    accroche: "Bonjour Ajanthaa, je suis [Prénom] de Dermotec Advanced, le centre de formation certifié Qualiopi à Paris 11e. J'ai vu votre salon sur Treatwell, très beau travail avec votre équipe !",
    transition: "Je vous appelle parce qu'on forme des professionnelles comme vous au microblading et au maquillage permanent — des prestations qui cartonnent dans le 11e et que je ne vois pas encore dans votre carte.",
    proposition: "En 2 jours de formation, une de vos esthéticiennes maîtrise le microblading. À 200€ la séance, avec 3 clientes par semaine, ça fait 2 400€ de CA supplémentaire par mois. Et c'est finançable à 100% via votre OPCO.",
    closing: "Est-ce qu'on pourrait se voir 15 minutes cette semaine ? Je vous montre les chiffres et le catalogue, et si ça vous parle, on monte le dossier financement ensemble.",
    si_objection_prix: "Je comprends. C'est pour ça que 80% de nos stagiaires font financer leur formation par l'OPCO ou le CPF. Ça vous coûte zéro. Je peux vérifier votre éligibilité en 2 minutes.",
    si_objection_temps: "La formation dure 2 jours seulement. Et vu le ROI — 200€ par séance, les premières clientes remboursent la formation en 2 semaines — c'est un investissement de temps minimal pour un retour maximal.",
    si_objection_besoin: "Vous avez raison de vous poser la question. Mais regardez vos concurrentes dans le 11e : celles qui proposent le microblading affichent complet. C'est LA prestation la plus demandée en 2026. Ne pas l'avoir, c'est laisser ces clientes aller ailleurs.",
  },

  formations_recommandees: [
    {
      nom: "Microblading / Microshading",
      prix: "1 400€ HT",
      pourquoi_elle: "C'est la prestation la plus demandée en institut, elle n'a rien en dermo-esthétique, et c'est faisable en 2 jours sans fermer le salon.",
      argument_roi: "À 200€ la séance, avec 3 clientes/semaine = 2 400€/mois. Formation remboursée en 3 semaines.",
      niveau_priorite: 'principal' as const,
    },
    {
      nom: "Full Lips",
      prix: "1 400€ HT",
      pourquoi_elle: "Complément naturel du microblading. Même technique, même clientèle. Double le potentiel de CA.",
      argument_roi: "À 300€ la séance, c'est la prestation avec la marge la plus élevée en institut.",
      niveau_priorite: 'complementaire' as const,
    },
    {
      nom: "Blanchiment Dentaire",
      prix: "590€ HT",
      pourquoi_elle: "Elle fait déjà du blanchiment mais une certification pro + techniques avancées la différencie des concurrents low-cost.",
      argument_roi: "Formation rapide (1 jour), monte en gamme immédiate sur une prestation qu'elle connaît déjà.",
      niveau_priorite: 'upsell_futur' as const,
    },
  ],

  strategie_financement: {
    option_principale: "OPCO EP — SAS du secteur beauté, éligible au plan de développement des compétences",
    comment_presenter: "Ne dites pas 'financement', dites 'on s'occupe de tout le dossier administratif pour que ça ne vous coûte rien'",
    phrase_cle: "80% de nos stagiaires ne paient rien grâce au financement OPCO. Je vérifie votre éligibilité en 2 minutes, c'est gratuit.",
    alternatives: [
      "CPF si elle ou ses employées ont des droits accumulés",
      "Paiement en 3x sans frais via Stripe si pas d'OPCO",
      "FAFCEA si elle est artisan inscrite au répertoire des métiers",
    ],
  },

  plan_action: {
    action_1: "Aujourd'hui : appeler entre 10h et 12h au 06 44 04 91 74",
    action_2: "Si pas de réponse : SMS personnalisé avec lien vers le catalogue microblading",
    action_3: "Si intéressée : envoyer programme + simulateur ROI + lien prise de RDV",
    rappel: "Relancer par WhatsApp dans 3 jours si pas de retour",
  },

  score_chaleur: 58,
  classification: 'TIEDE' as const,
}

const MOCK_ENRICHMENT = {
  google: {
    rating: 4.3,
    reviewsCount: 47,
    website: 'https://www.elleesthetique.fr',
    placeId: 'ChIJXYZfake',
  },
  pappers: {
    chiffreAffaires: 180000,
    effectif: 4,
    formeJuridique: 'SAS',
    dateCreation: '2022-11-01',
    dirigeants: [{ nom: 'Ajanthaa', fonction: 'Présidente' }],
  },
  sirene: {
    siret: '92268666200015',
    code_naf: '9602B',
    adresse: '39 Rue Servan',
    code_postal: '75011',
    ville: 'Paris',
    date_creation: '2022-11-01',
    forme_juridique: 'SAS',
  },
  social: {
    instagram: { username: 'elle_paris11', followers: 850, posts: 120 },
    website: 'https://www.elleesthetique.fr',
  },
  quartier: {
    metros: 5,
    restaurants: 45,
    concurrentsBeaute: 12,
    pharmacies: 8,
    footTrafficScore: 78,
  },
}

const MOCK_SCORES = {
  reputation: 62,
  presence: 55,
  activity: 40,
  financial: 48,
  neighborhood: 78,
}

async function generateTestReport() {
  console.log('Generating test rapport prospect for ELLE Esthetique...')

  const props = {
    lead: {
      prenom: 'Ajanthaa',
      nom: '',
      entreprise: 'ELLE Esthétique',
      email: '',
      telephone: '06 44 04 91 74',
    },
    narrative: MOCK_NARRATIVE,
    enrichment: MOCK_ENRICHMENT as any,
    scores: MOCK_SCORES,
    generatedAt: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
    version: 1,
  }

  try {
    const buffer = await renderToBuffer(RapportProspect(props) as any)
    const outputPath = './rapport-prospect-ELLE-esthetique-test.pdf'
    writeFileSync(outputPath, buffer)
    console.log(`PDF genere avec succes : ${outputPath}`)
    console.log(`Taille : ${(buffer.length / 1024).toFixed(1)} KB`)
  } catch (error) {
    console.error('Erreur generation PDF:', error)
  }
}

generateTestReport()
