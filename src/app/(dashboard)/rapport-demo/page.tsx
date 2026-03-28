'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { RapportViewer } from '@/components/rapport/RapportViewer'
import type { ProspectData, RapportSatorea } from '@/lib/rapport/types'
import { Loader2, Sparkles } from 'lucide-react'

// ══════════════════════════════════════════════════════════════
// DEMO — Rapport Satorea pour Latitude Zen
// Route: /rapport-demo
// Données mockées + appel Claude pour le contenu IA
// ══════════════════════════════════════════════════════════════

// Données Latitude Zen (enrichment-latitudezen-live.json)
const LATITUDE_ZEN: ProspectData = {
  id: 'demo-latitudezen',
  nom_dirigeant: 'Valérie Araujo Aires',
  nom_salon: 'Latitude Zen Institut',
  adresse: '89 Rue Léon Frot',
  code_postal: '75011',
  ville: 'Paris',
  telephone_mobile: '07 61 53 79 76',
  telephone_fixe: '01 43 72 41 77',
  email: 'contact@latitudezen-institutdebeaute.com',

  mixte: true, // Services homme détectés dans carte_soins
  effectif: '4 salariés',
  statut_pro: 'gerant_institut',
  marques_utilisees: ['Matis', 'Epiloderm', 'Green Spa', 'Botan', 'Revitalash'],
  specialites: [
    'Épilation homme corps intégral',
    'Massages (thaïlandais, chinois, japonais, deep tissue)',
    'Soins visage',
    'Épilation femme (cire Epiloderm)',
    'Manucure',
    'Beauté à domicile',
  ],

  reputation: {
    note_globale: 4.8,
    nb_avis_total: 1035,
    planity_note: 4.9,
    planity_nb_avis: 729,
    google_note: 4.4,
    google_nb_avis: 301,
    treatwell_note: 5.0,
    taux_reponse_avis: 80,
    awards: ['Balinea Awards 2019'],
  },

  finances: {
    forme_juridique: 'SARL',
    capital_social: 6000,
    annee_creation: 2004,
    bodacc_clean: true,
    opco_eligible: true,
    service_le_plus_cher_eur: 235,
    effectif_reel: 4,
  },

  concurrents_500m: 60,
  concurrents_avec_dermo: 0,
  revenus_medians_quartier: 27503,
  score_trafic_pieton: 100,

  scores: {
    global: 65,
    reputation: 98,
    presence: 30,
    activity: 50,
    financial: 50,
    neighborhood: 80,
  },

  formation_principale: {
    nom: 'Microblading / Microshading',
    prix_ht: 1400,
    duree_jours: 2,
    duree_heures: 14,
    description_commerciale: 'La prestation la plus rentable en institut : 200€ la séance, demande explosive.',
  },
}

// Rapport démo pré-rempli (sans appel Claude)
const DEMO_RAPPORT: RapportSatorea = {
  accroche: "Bonjour Valérie, je suis [Prénom] de Dermotec Advanced, centre Qualiopi Paris 11e. J'ai été impressionné par votre parcours : Balinea Awards 2019, plus de 1 000 avis avec 4.8 de moyenne, 22 ans d'activité. Il y a très peu d'instituts de ce calibre à Paris.",

  angle_unique: "Vous êtes un des rares instituts MIXTES du 11e arrondissement. Vous recevez déjà des hommes pour des épilations corps intégral à 235€. Le microblading sourcils hommes 25-40 ans explose en France — et dans un rayon de 500m, aucun concurrent ne propose la dermopigmentation. C'est un quasi-monopole potentiel.",

  argument_tarifaire: "Votre épilation corps intégral homme est à 235€. Le microblading sourcils à 225€ est dans la même gamme tarifaire. Aucun choc pour vos clients existants — c'est une prestation complémentaire naturelle dans votre carte de soins.",

  analyse_reputation: "4.8/5 sur 1 035 avis, c'est exceptionnel. 729 avis Planity à 4.9 montrent une fidélisation remarquable. Le taux de réponse aux avis de 80% confirme une dirigeante obsédée par la qualité de service — le microblading s'inscrit parfaitement dans cette logique d'excellence.",

  profil_psychologique: "Valérie est une perfectionniste reconnue par ses pairs (Balinea Awards 2019). 22 ans d'activité = stabilité et vision long terme. Institut mixte depuis longtemps = pionnière. Sensible à l'argument qualité et image, pas au prix. Ton = entre professionnels reconnus.",

  argument_opco: "Votre SARL cotise à l'OPCO EP depuis 2004. 22 ans de cotisations = droits accumulés significatifs. La formation Microblading à 1 400€ HT est couverte à 100% par l'OPCO EP. BODACC vérifié : 0 procédure en 22 ans = dossier solide. Résultat : 0€ de votre poche.",

  conclusion_emotionnelle: "Valérie Araujo Aires. 22 ans d'activité. 1 035 avis à 4.8/5. Balinea Awards 2019. Un institut mixte qui propose déjà des prestations hommes à 235€. Elle a déjà tout pour réussir. Il ne manque que la technique. À toi de jouer.",

  kpi: {
    ca_mensuel_conservateur: 2400,
    ca_mensuel_mixte: 4500,
    ca_mensuel_optimiste: 6300,
    ca_annuel_mixte: 54000,
    remboursement_jours: 10,
    anciennete_ans: 22,
    score_reputation: 98,
  },

  script: [
    {
      numero: 1,
      nom: 'Accroche',
      duree_secondes: 15,
      texte: "Bonjour Valérie, je suis [Prénom] de Dermotec Advanced, centre certifié Qualiopi à Paris 11e. Balinea Awards 2019, plus de 1 000 avis, 22 ans d'activité — il y a très peu d'instituts de ce calibre à Paris.",
      conseil: "Mentionner les awards EN PREMIER. Cela montre qu'on a fait ses recherches et qu'on respecte son parcours.",
    },
    {
      numero: 2,
      nom: 'Angle mixte',
      duree_secondes: 20,
      texte: "J'ai vu que vous êtes un des rares instituts mixtes du 11e. Vous proposez déjà des soins hommes haut de gamme. Le maquillage semi-permanent artistique — sourcils hommes 25-40 ans — explose en ce moment. Et dans votre zone, personne ne le propose.",
      conseil: "Insister sur le quasi-monopole local. 0 concurrent avec dermo dans 500m = opportunité unique.",
    },
    {
      numero: 3,
      nom: 'Les chiffres',
      duree_secondes: 30,
      texte: "En 2 jours de formation, vous maîtrisez la technique. Avec 5 clients par semaine à 225€ en moyenne, ça représente 4 500€ de revenu supplémentaire par mois. Et la formation est financée à 100% par votre OPCO — votre SARL cotise depuis 22 ans, vous avez des droits accumulés. 0€ de votre poche.",
      conseil: "Donner les chiffres dans cet ordre : durée → volume → CA → financement. Finir par 0€.",
    },
    {
      numero: 4,
      nom: 'Closing',
      duree_secondes: 15,
      texte: "Je peux vous envoyer un dossier avant/après adapté à votre profil mixte. Est-ce qu'on pourrait se voir 15 minutes cette semaine — mardi ou jeudi vous convient ?",
      conseil: "Proposer 2 dates précises. Pas 'quand êtes-vous disponible' mais 'mardi ou jeudi'.",
    },
  ],

  objections: [
    {
      objection: "C'est trop cher",
      diagnostic_psychologique: "Elle ne dit pas que c'est cher — elle dit qu'elle n'a pas vu le retour sur investissement. Avec 235€ comme service le plus cher, le prix n'est pas le vrai frein.",
      reponse_principale: "Votre SARL cotise à l'OPCO EP depuis 2004. 22 ans de cotisations = droits accumulés. La formation est financée à 100%, 0€ de votre poche. Et votre épilation homme à 235€ montre que votre clientèle est habituée aux prestations premium.",
      pivot_si_insistance: "On peut aussi échelonner en 3 fois. Mais vérifions d'abord votre éligibilité OPCO — 2 minutes au téléphone.",
    },
    {
      objection: "Pas le temps",
      diagnostic_psychologique: "Avec 4 salariées et 22 ans d'expérience, elle sait gérer son planning. Le vrai frein est la peur de la perturbation.",
      reponse_principale: "La formation dure 2 jours. Avec 4 salariées, votre institut tourne même en votre absence. Et le retour sur investissement dure 20 ans.",
      pivot_si_insistance: "On a des sessions le week-end et en soirée pour les dirigeantes qui ne peuvent pas fermer.",
    },
    {
      objection: "Ça marche déjà bien comme ça",
      diagnostic_psychologique: "22 ans d'activité, 1 035 avis, Awards — oui, ça marche. Mais elle sait que le marché évolue.",
      reponse_principale: "Vous avez ajouté les soins hommes il y a quelques années — même logique. Le marché du maquillage semi-permanent a triplé en 3 ans. Vos clientes le cherchent déjà ailleurs.",
      pivot_si_insistance: "Combien de clientes vous demandent si vous faites du microblading ? La demande existe, c'est juste une question de la capter.",
    },
    {
      objection: "C'est trop médical",
      diagnostic_psychologique: "Confusion entre médical et artistique. Les Awards prouvent qu'elle a l'œil expert — le microblading est dans la continuité.",
      reponse_principale: "Le maquillage semi-permanent artistique est une technique de précision, pas un acte médical. On utilise un stylo à micro-lames, pas un laser. Vos Balinea Awards prouvent que vous avez l'œil expert — c'est exactement la même exigence.",
      pivot_si_insistance: "Je vous envoie des avant/après de nos anciennes stagiaires — vous verrez que c'est 100% artistique.",
    },
    {
      objection: "Je vais réfléchir",
      diagnostic_psychologique: "Elle est intéressée mais a besoin d'un déclencheur. L'urgence du marché + la preuve sociale sont les leviers.",
      reponse_principale: "Bien sûr. Je vous envoie le dossier avant/après avec des profils hommes ET femmes — adaptés à votre institut mixte. On se recale jeudi pour en parler 10 minutes ?",
      pivot_si_insistance: "Les places sont limitées à 6 par session. La prochaine session est dans 3 semaines.",
    },
  ],

  timeline: [
    { jour: 'J0', action: "Appeler entre 10h et 12h (creux d'activité institut)", canal: 'Mobile', objectif: 'Obtenir un RDV de 15 min ou envoyer le dossier', est_critique: false },
    { jour: 'J0 absent', action: "SMS personnalisé : 'Valérie, [Prénom] de Dermotec. J'ai vu votre Balinea Awards — je voulais vous parler d'une opportunité pour votre institut mixte. Quand êtes-vous disponible ?'", canal: 'SMS', objectif: 'Déclencher un rappel', est_critique: false },
    { jour: 'J+1', action: "Email avec dossier avant/après H+F + programme formation", canal: 'Email', objectif: "Laisser une trace écrite professionnelle", est_critique: false },
    { jour: 'J+3', action: "Relance WhatsApp avec 1 photo avant/après sourcils homme", canal: 'WhatsApp', objectif: "Créer l'envie visuelle", est_critique: false },
    { jour: 'J+7', action: "PASSAGE TERRAIN — Passer à l'institut avec un kit démonstration", canal: 'En personne', objectif: 'Conversion ×3 en face à face. Montrer les résultats en vrai.', est_critique: true },
    { jour: 'J+14', action: "Appel de suivi final — proposer la prochaine session", canal: 'Mobile', objectif: "Closer ou qualifier pour plus tard", est_critique: false },
  ],

  mots_interdits: [
    { interdit: 'Formation', a_dire: 'Prestation premium', raison: "Formation = coût. Prestation premium = investissement rentable." },
    { interdit: '1 400€', a_dire: 'Financé OPCO à 100%', raison: "Toujours parler financement AVANT le prix." },
    { interdit: 'Microblading', a_dire: 'Maquillage semi-permanent artistique', raison: "Microblading sonne technique/médical. Artistique sonne premium." },
    { interdit: 'Vos concurrents', a_dire: 'Vos clientes le cherchent', raison: "Ne jamais mentionner la concurrence — parler de la demande client." },
    { interdit: "C'est simple", a_dire: 'Technique de précision', raison: "Simple = pas cher. Précision = expertise." },
    { interdit: 'On forme tout le monde', a_dire: "On forme des instituts primés", raison: "Exclusivité = valeur perçue." },
  ],

  date_generation: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
  classification: 'CHAUD',
  score_chaleur: 65,
}

export default function RapportDemoPage() {
  const [mode, setMode] = useState<'preview' | 'generating' | 'live'>('preview')
  const [liveRapport, setLiveRapport] = useState<RapportSatorea | null>(null)

  async function generateLive() {
    setMode('generating')
    try {
      const res = await fetch('/api/rapport/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: 'demo-latitudezen' }),
      })
      if (res.ok) {
        const data = await res.json()
        setLiveRapport(data.rapport)
        setMode('live')
      } else {
        // Fallback vers le rapport démo
        setMode('preview')
      }
    } catch {
      setMode('preview')
    }
  }

  // Mode preview avec données mockées
  if (mode === 'preview' || (mode === 'live' && !liveRapport)) {
    return <RapportViewer prospect={LATITUDE_ZEN} rapport={liveRapport || DEMO_RAPPORT} />
  }

  // Mode generating
  if (mode === 'generating') {
    return (
      <div className="flex items-center justify-center h-dvh bg-[#FAFAFA]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-[#FF5C00] animate-spin mx-auto" />
          <div className="mt-4 text-[15px] font-semibold text-[#111111]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
            Génération IA en cours...
          </div>
          <div className="mt-1 text-[12px] text-[#777777]">Claude écrit un briefing personnalisé pour Latitude Zen</div>
        </div>
      </div>
    )
  }

  return <RapportViewer prospect={LATITUDE_ZEN} rapport={liveRapport || DEMO_RAPPORT} />
}
