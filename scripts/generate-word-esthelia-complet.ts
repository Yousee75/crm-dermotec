/**
 * Génère le Word COMPLET pour Esthélia
 * Utilise les vrais modules du projet : map-generator + generate-briefing-word
 * Inclut carte OpenStreetMap + avis + quartier + toutes les sections
 */

// Forcer le mode non-server-only pour le script
process.env.SKIP_SERVER_ONLY = 'true'

import { writeFileSync } from 'fs'

async function main() {
  console.log('=== GENERATION RAPPORT ESTHELIA COMPLET ===\n')

  // ── 1. Générer la carte OpenStreetMap ──
  console.log('1. Generation carte OpenStreetMap...')
  let mapBuffer: Buffer | undefined

  try {
    // Import dynamique car staticmaps utilise sharp
    const StaticMaps = (await import('staticmaps')).default

    const map = new StaticMaps({
      width: 640,
      height: 300,
      tileUrl: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      tileSize: 256,
      tileRequestHeader: { 'User-Agent': 'SatoreaCRM/1.0 (contact@satorea.fr)' },
    })

    // Coordonnées Esthélia : 73 Rue Oberkampf, Paris 11e
    const lat = 48.8648
    const lng = 2.3783

    // Pas de marqueur custom — staticmaps crashe si img=undefined
    // On rend juste la carte centrée sur le prospect
    await map.render([lng, lat], 15)
    mapBuffer = await map.image.buffer('image/png') as Buffer

    // Sauvegarder la carte aussi en standalone
    writeFileSync('charts/carte-esthelia.png', mapBuffer)
    console.log('   Carte generee : charts/carte-esthelia.png')
  } catch (e: any) {
    console.log('   Carte skippee (erreur sharp/staticmaps):', e.message)
  }

  // ── 2. Construire le BriefingData complet ──
  console.log('2. Construction BriefingData...')

  const { generateBriefingWord } = await import('../src/lib/generate-briefing-word')

  const data: any = {
    prospect: {
      prenom: 'Beatrice',
      nom: 'Pignol',
      entreprise: 'Esthelia — Institut de Beaute',
      adresse: '73 Rue Oberkampf, 75011 Paris',
      tel: '01 48 05 15 67',
      siret: '423 000 900 00013',
      forme_juridique: 'SARL — Capital 8 000 EUR',
      date_creation: 'Mai 1999 (25+ ans d\'activite)',
      effectif: 2,
      equipe: ['Beatrice Pignol (gerante depuis 2005)', 'Laura (estheticienne)'],
      services: [
        'Soins visage (Guinot, Payot)',
        'Soins corps',
        'Massages balinais et californiens',
        'Epilation traditionnelle (cire, fil)',
        'Rehaussement et teinture cils/sourcils',
        'Vernis semi-permanent',
        'Maquillage evenementiel',
      ],
      site_web: 'institutesthelia.fr',
      google_rating: 4.8,
      google_avis: 89,
      ca: 156200,
      dirigeant: 'Beatrice Pignol — Gerante depuis janvier 2005',
    },

    scores: {
      global: 64,
      reputation: 78,
      presence: 55,
      activity: 35,
      financial: 58,
      neighborhood: 82,
    },
    classification: 'TIEDE',

    verdict: 'Prospect tiede a tres fort potentiel. Institut etabli depuis 25 ans avec une reputation exceptionnelle (4.8 Google, 89 avis). Beatrice est une pro aguerrie mais n\'a pas franchi le pas de la dermopigmentation. CA 156K/2 personnes = solide. Quartier Oberkampf = ideal. Frein principal : conservatisme apres 25 ans. Approche : valoriser son expertise et positionner la formation comme evolution naturelle.',

    brief: 'Beatrice Pignol dirige Esthelia depuis 1999 au 73 rue Oberkampf. 25 ans d\'experience, note Google 4.8/5 (89 avis), CA 156K avec 2 personnes. Specialisee soins classiques (Guinot/Payot, massages, epilation) mais ZERO dermopigmentation. Quartier Oberkampf = forte affluence, CSP+ 25-40 ans. SARL solide, resultat net 11K (marge 7.2%), tresorerie 8 923 EUR. Financement OPCO = indispensable.',

    histoire: 'Beatrice est une veterane de l\'esthetique parisienne. Esthelia existe depuis 1999, elle a traverse toutes les modes et toutes les crises. Avec Laura, elles forment un duo soude qui fidélise une clientele exigeante dans un quartier en perpetuelle evolution. Les avis sont unanimes : "havre de paix", "on se sent bien des qu\'on pousse la porte", "professionnalisme exemplaire". Son positionnement est clair : qualite, calme, expertise.',

    situation_business: 'SARL au capital de 8 000 EUR. CA 2024 : 156 200 EUR. Resultat net : 11 176 EUR (marge 7.2%). EBITDA : 15 625 EUR. Tresorerie : 8 923 EUR. Rentabilite correcte pour 2 personnes mais pas de filet. La tresorerie de 8 923 EUR = pas de cash pour avancer 1 400 EUR. OPCO EP est la cle. Son anciennete (25 ans) = cotisations accumulees importantes.',

    reputation_visibilite: 'REPUTATION : Exceptionnelle. 4.8/5 Google avec 89 avis. Top 5% des instituts parisiens. Mots cles clients : "apaisant", "professionnel", "chaleureux", "qualite des soins".\n\nVISIBILITE : Faible. Pas d\'Instagram visible, site web basique. Pour un institut de ce niveau = enorme manque a gagner. Le microblading genere du contenu avant/apres viral naturellement.',

    environnement: 'Quartier Oberkampf : 3 metros (L5, L9, L3), 60+ restaurants, 12 salons beaute concurrents (aucun en dermopigmentation certifiee), 8 pharmacies, trafic pieton 82/100. Clientele 25-40 ans, CSP+, sensible aux tendances beaute. Zone premium ideale pour le microblading.',

    atouts: [
      '25 ans d\'experience = credibilite absolue',
      'Note Google 4.8/5 (89 avis) = top 5% des instituts parisiens',
      'CA 156K pour 2 personnes = rentabilite prouvee',
      'Quartier Oberkampf = clientele ideale pour le microblading',
      'Soins Guinot/Payot = la dermo est une extension naturelle',
      'Aucun concurrent immediat en dermopigmentation sur Oberkampf',
      'SARL depuis 1999 = cotisations OPCO accumulees',
      'Un avis client mentionne le manque de microblading = demande reelle',
    ],

    pieges: [
      '25 ans = conservatisme potentiel, resistance au changement',
      'Equipe de 2 : si une part en formation, l\'autre est seule 2 jours',
      'Tresorerie 8 923 EUR : ne peut pas avancer 1 400 EUR — OPCO obligatoire',
      'Marge nette 7.2% : chaque depense est calculee, PROUVER le ROI',
      'Pas de presence digitale : ne voit peut-etre pas l\'interet d\'Instagram',
    ],

    strategie: {
      canal: 'Appel telephonique fixe',
      numero: '01 48 05 15 67',
      jour: 'Mardi ou mercredi',
      heure: '10h - 11h30',
      duree: '7-10 minutes',
      angle: 'Evolution naturelle de 25 ans d\'expertise',
      objectif: 'Obtenir un RDV de passage au salon',
    },

    script: {
      accroche: 'Bonjour Beatrice, je suis [Prenom] de Dermotec Advanced, centre Qualiopi au 75 boulevard Richard Lenoir — on est voisins dans le 11e ! J\'ai vu vos avis, 4.8 sur Google avec 89 avis, c\'est exceptionnel apres 25 ans. Bravo.',
      accroche_pourquoi: [
        '"On est voisins" = proximite, pas un demarcheur lointain',
        'Cite le 4.8 et 89 avis = elle sait que tu as fait tes recherches',
        '"25 ans" = valorisation de son anciennete',
        '"Bravo" = compliment court qui desarme',
      ],
      transition: 'Je vous appelle parce qu\'on accompagne des institutes de votre niveau a ajouter la dermopigmentation. C\'est une evolution naturelle pour une professionnelle qui maitrise deja les soins du visage, et c\'est la prestation la plus demandee dans le 11e.',
      transition_pourquoi: [
        '"De votre niveau" = reconnaissance expertise',
        '"Evolution naturelle" = pas une rupture',
        '"Maitrise deja les soins du visage" = lien avec son quotidien',
        '"Dans le 11e" = preuve sociale locale',
      ],
      proposition: 'En 2 jours, vous ou Laura maitrisez le microblading. 200-250 EUR la seance, 3 clientes par semaine = 2 400 a 3 000 EUR de CA supplementaire par mois. Votre SARL cotise a l\'OPCO EP depuis 25 ans : formation financee a 100%, zero de votre poche.',
      proposition_chiffres: [
        'Formation : 2 jours (14h) — 1 400 EUR HT',
        'Prix seance Paris 11e : 200-250 EUR',
        'Hypothese basse : 3 clientes/sem = 2 400 EUR/mois',
        'Hypothese haute : 5 clientes/sem = 4 000 EUR/mois',
        'Impact marge nette : de 7.2% a 15-20%',
        'ROI : formation remboursee en 2-3 semaines',
      ],
      closing: 'Je passe au salon cette semaine avec les photos avant/apres et le simulateur de rentabilite. Si ca vous parle, on monte le dossier OPCO — 15 minutes, gratuit. Mardi ou mercredi, qu\'est-ce qui vous arrange ?',
      closing_pourquoi: [
        '"Je passe au salon" = respect, il se deplace',
        '"Photos avant/apres" = concret',
        '"Simulateur" = elle calcule elle-meme',
        '"Mardi ou mercredi" = question alternative, pas oui/non',
      ],
    },

    objections: [
      {
        titre: '"C\'est trop cher"',
        pensee_reelle: 'Tresorerie 8 923 EUR — elle ne peut pas sortir 1 400 EUR cash. C\'est pas de la resistance, c\'est de la realite comptable.',
        reponse: 'Votre SARL cotise a l\'OPCO EP depuis 1999. En 25 ans, vous avez accumule des droits. Le financement couvre 100% — 0 EUR de votre poche. Je verifie en 2 minutes.',
        si_insiste: 'Paiement en 3x sans frais : 467 EUR/mois. Avec 2 400 EUR de CA supplementaire des le premier mois, c\'est 5x couvert.',
      },
      {
        titre: '"J\'ai pas le temps / On est que deux"',
        pensee_reelle: 'Si Beatrice part 2 jours, Laura gere seule. Stress operationnel reel.',
        reponse: '2 jours seulement, un lundi-mardi (jours calmes). Laura tient le salon. Ces 2 jours vont generer du CA pendant 20 ans. Meilleur ratio temps/retour de toutes les formations.',
      },
      {
        titre: '"Ca fait 25 ans que ca marche comme ca"',
        pensee_reelle: 'Peur du changement. Identite professionnelle construite sur 25 ans.',
        reponse: 'Justement — 25 ans de base solide = vous POUVEZ evoluer. La dermo ne remplace rien, elle s\'ajoute. Comme quand vous avez ajoute les massages balinais. Vos clientes fideles seront les premieres a booker.',
      },
      {
        titre: '"C\'est pas mon style, c\'est trop medical"',
        pensee_reelle: 'Elle associe la dermo a l\'injectable. Son identite "cocon zen" ne colle pas avec des aiguilles.',
        reponse: 'Le microblading c\'est du maquillage semi-permanent — esthetique pure. Un stylo a micro-lames, pas de machine. Geste delicat et artistique, "no makeup makeup". Ca colle parfaitement avec votre ambiance.',
      },
      {
        titre: '"Laissez-moi reflechir"',
        pensee_reelle: 'Interessee mais pas assez convaincue.',
        reponse: 'Je vous envoie un dossier avec les avant/apres de nos stagiaires et leurs chiffres du premier mois. Comme ca vous reflechissez avec du concret. Par email ou je depose au salon ?',
      },
    ],

    douleurs: [
      'Plafond de CA a 156K — marge nette 7.2%, pas de reserve',
      'Aucune prestation premium (>100 EUR) — panier moyen bas',
      'Concurrence Oberkampf : 12 salons beaute dans 500m',
      'Zero presence digitale : invisible pour les <35 ans',
      'Les tendances evoluent (dermo, tech) et elle reste sur le classique',
      'Un avis client mentionne le manque de microblading',
    ],

    aspirations: [
      'Perenniser 25 ans de travail — son salon = son heritage',
      'Monter en gamme sans perdre l\'identite "cocon"',
      'Augmenter le CA sans embaucher',
      'Avoir du contenu Instagram pour attirer les 25-35 ans',
      'Se differencier des 12 concurrents : LA reference dermo d\'Oberkampf',
    ],

    positionnement: [
      '"Evolution naturelle de 25 ans d\'expertise"',
      '"La prestation premium qui manque a votre carte"',
      '"2 jours investis pour 20 ans de rentabilite"',
      '"Du contenu Instagram qui se cree tout seul"',
      '"Vos clientes fideles n\'iront plus ailleurs pour le microblading"',
    ],

    formations: [
      {
        nom: 'Microblading / Microshading',
        prix: '1 400 EUR HT',
        duree: '2 jours (14h) | OPCO EP eligible',
        niveau_priorite: 'PRINCIPAL' as const,
        pourquoi: [
          'Extension naturelle de son expertise soins visage',
          'Ses 89 avis = clientes fideles pretes a tester',
          'Paris 11e : forte demande, aucun concurrent en dermo',
          'Panier moyen x4 : de 50 EUR a 200 EUR',
        ],
        roi: 'ROI : 200-250 EUR/seance x 3/sem = 2 400-3 000 EUR/mois. Formation remboursee en 3 semaines. Impact annuel : +28 800 EUR minimum.',
      },
      {
        nom: 'Full Lips (Candy Lips)',
        prix: '1 400 EUR HT',
        duree: '2 jours (14h)',
        niveau_priorite: 'COMPLEMENTAIRE' as const,
        pourquoi: [
          'Suite logique du microblading — meme geste, meme clientele',
          'Prix seance 300 EUR = marge superieure',
          'Tendance lip blush explosive chez les 25-35 ans',
        ],
        roi: '+3 600 EUR/mois potentiel.',
      },
      {
        nom: 'Rehaussement Cils + Volume Russe',
        prix: '890 EUR HT',
        duree: '2 jours',
        niveau_priorite: 'UPSELL' as const,
        pourquoi: [
          'Elle fait deja rehaussement + teinture = montee en gamme',
          'Extensions cils = prestation recurrente (retouches mensuelles)',
        ],
      },
    ],

    financement: {
      option_principale: 'OPCO EP — SARL beaute depuis 1999. 25 ans de cotisations. Couverture 100%.',
      comment_parler: 'Elle connait les OPCO (25 ans de gerance). Dis : "Votre SARL cotise depuis 25 ans — il serait dommage de ne pas utiliser vos droits. On s\'occupe de tout, ca prend 15 minutes."',
      phrase_cle: 'Votre SARL cotise a l\'OPCO depuis 25 ans — ca fait beaucoup de droits accumules. On s\'occupe de toute la paperasse.',
      alternatives: [
        'CPF : si Beatrice ou Laura ont des droits accumules',
        'AGEFICE : si inscrite comme independante',
        'Paiement 3x sans frais Stripe : 467 EUR/mois',
        'Paiement comptant avec remise 5% (1 330 EUR HT)',
      ],
    },

    plan_action: [
      { quand: 'Aujourd\'hui', action: 'Appeler au 01 48 05 15 67 entre 10h et 11h30', si_ok: 'Fixer un RDV au salon' },
      { quand: 'Si absente', action: 'Message vocal : "Beatrice, [Prenom] de Dermotec, voisin du 11e. Rappel demain."', si_ok: 'Elle rappelle (curieuse)' },
      { quand: 'J+1', action: 'Rappeler + email avec 3 photos avant/apres + simulateur ROI', si_ok: 'Elle lit et rappelle' },
      { quand: 'J+3', action: 'Rappeler : "Avez-vous pu regarder les photos ?"', si_ok: 'Fixer creneau de passage' },
      { quand: 'J+7', action: 'Passer PHYSIQUEMENT 73 rue Oberkampf avec catalogue imprime', si_ok: 'Taux conversion 3x en face-a-face' },
      { quand: 'J+14', action: 'Email temoignage video d\'une estheticienne similaire', si_ok: 'Conclure ou rappel mensuel' },
    ],

    message_final: 'Beatrice a 25 ans d\'experience, 89 avis a 4.8 etoiles, et un quartier en or. Il lui manque juste UNE prestation pour passer de "tres bon institut" a "la reference d\'Oberkampf". Ne vends pas une formation — offre-lui l\'opportunite de faire evoluer un quart de siecle de savoir-faire.',

    // DONNEES ENRICHIES
    avis: {
      total: 89,
      moyenne: 4.8,
      distribution: [
        { stars: 5, count: 62, pct: 70 },
        { stars: 4, count: 18, pct: 20 },
        { stars: 3, count: 5, pct: 6 },
        { stars: 2, count: 2, pct: 2 },
        { stars: 1, count: 2, pct: 2 },
      ],
      trend: 'stable' as const,
      trendDelta: 0,
      ownerResponseRate: 35,
      positiveKeywords: ['Apaisant', 'Professionnel', 'Chaleureux', 'Qualite des soins', 'Prix correct', 'Ambiance zen'],
      negativeKeywords: ['Pas de microblading', 'Horaires limites'],
      topPositive: { author: 'Sophie M.', text: 'Meilleur institut de Paris. Je ne vais nulle part ailleurs depuis 10 ans. Beatrice est exceptionnelle, elle prend le temps d\'ecouter et de conseiller. Ambiance zen, soins top, equipe adorable.' },
      topNegative: { author: 'Clara R.', text: 'Tres bon institut, soins de qualite. Seul bemol : pas de prestations modernes type microblading ou maquillage permanent. Dommage car j\'aurais aime tout faire au meme endroit.', rating: 4 },
      fetchedCount: 89,
      withTextPct: 72,
      withPhotos: 8,
    },

    quartier: {
      metros: 3,
      restaurants: 60,
      concurrentsBeaute: 12,
      pharmacies: 8,
      footTrafficScore: 82,
    },

    mapImageBuffer: mapBuffer,
    coordonnees: { lat: 48.8648, lng: 2.3783 },
  }

  // ── 3. Générer le Word ──
  console.log('3. Generation Word...')
  const buffer = await generateBriefingWord(data)

  const filename = 'Briefing-Esthelia-COMPLET.docx'
  writeFileSync(filename, buffer)
  console.log(`\n=== TERMINE ===`)
  console.log(`Fichier : ${filename} (${(buffer.length / 1024).toFixed(0)} KB)`)
  console.log(`Sections : 12 (sommaire, verdict, prospect, 5 axes, avis, carte, strategie, script, objections, douleurs, formations, financement, plan)`)
  console.log(`Carte OSM : ${mapBuffer ? 'Oui' : 'Non (erreur sharp)'}`)
  console.log(`Avis : 89 analyses, distribution 5 etoiles, citations, tendance`)
}

main().catch(e => { console.error('ERREUR:', e); process.exit(1) })
