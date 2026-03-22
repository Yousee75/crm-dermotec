import { generateBriefingWord, type BriefingData } from './src/lib/generate-briefing-word'
import { writeFileSync, existsSync } from 'fs'

// ══════════════════════════════════════════════════════════════
// ESTHELIA — Briefing V2 avec avis, carte, data viz complete
// ══════════════════════════════════════════════════════════════

const data: BriefingData = {
  prospect: {
    prenom: 'Beatrice',
    nom: 'Pignol',
    entreprise: 'Esthelia',
    adresse: '73 Rue Oberkampf, 75011 Paris',
    tel: '01 48 05 15 67',
    siret: '423 000 900 00013',
    forme_juridique: 'SARL — Capital 8 000 EUR',
    date_creation: 'Mai 1999 (25+ ans d\'activite)',
    effectif: 2,
    equipe: ['Beatrice Pignol (gerante depuis 2005)', 'Laura (estheticienne)'],
    services: ['Soins visage (Guinot, Payot)', 'Soins corps', 'Massages balinais et californiens', 'Epilation traditionnelle (cire, fil)', 'Rehaussement et teinture cils/sourcils', 'Vernis semi-permanent', 'Maquillage evenementiel'],
    site_web: 'institutesthelia.fr',
    google_rating: 4.8,
    google_avis: 89,
    ca: 156200,
    dirigeant: 'Beatrice Pignol — Gerante depuis janvier 2005',
  },
  scores: { global: 64, reputation: 78, presence: 48, activity: 35, financial: 58, neighborhood: 82 },
  classification: 'TIEDE',

  verdict: 'Prospect tiede a tres fort potentiel. Institut etabli depuis 25 ans, reputation exceptionnelle (4.8 Google, 89 avis). Beatrice est une pro qui connait son metier mais n\'a pas encore franchi le pas de la dermopigmentation. CA 156K pour 2 personnes = bonne rentabilite. Quartier Oberkampf = ideal. Le frein principal : 25 ans d\'habitudes. Approche : valoriser son expertise et positionner la formation comme une evolution naturelle.',

  brief: 'Beatrice Pignol dirige Esthelia depuis 1999 au 73 rue Oberkampf. 25 ans d\'experience, note Google 4.8/5 (89 avis), CA 156K EUR avec 2 personnes. Institut specialise soins classiques (visage Guinot/Payot, massages, epilation) mais ZERO dermopigmentation. Quartier Oberkampf = forte affluence, clientele jeune CSP+ sensible aux tendances. SARL solide au capital de 8 000 EUR, resultat net 11K EUR (marge 7.2%). Tresorerie 8 923 EUR = juste, donc financement OPCO indispensable.',

  histoire: 'Beatrice est une veterane de l\'esthetique parisienne. Esthelia existe depuis 1999 — elle a traverse toutes les modes, toutes les crises, et son salon est toujours la. Avec Laura, elles forment un duo soude dans un quartier qui s\'est completement transforme autour d\'elles. Oberkampf etait populaire en 1999, il est devenu branche puis hype. Beatrice a su s\'adapter a chaque evolution de sa clientele. Les avis clients disent tout : "havre de paix", "on se sent bien des qu\'on pousse la porte", "professionnalisme exemplaire". Son positionnement est clair : qualite, calme, expertise — dans un quartier bruyant et agite, c\'est exactement ce que ses clientes cherchent.',

  situation_business: 'SARL au capital de 8 000 EUR. CA 2024 : 156 200 EUR. Resultat net : 11 176 EUR (marge 7.2%). EBITDA : 15 625 EUR. Tresorerie : 8 923 EUR. Pour 2 personnes, c\'est une rentabilite correcte mais sans filet. La tresorerie de 8 923 EUR montre qu\'il n\'y a pas de reserve — chaque investissement doit etre justifie. Le resultat net de 11K signifie que Beatrice se verse probablement un salaire modeste + charges. L\'argument financement OPCO est CRUCIAL — elle ne sortira pas 1 400 EUR cash. Mais son anciennete (25 ans) et sa forme SARL = cotisations OPCO accumulees importantes.',

  reputation_visibilite: 'REPUTATION : Exceptionnelle. 4.8/5 Google avec 89 avis. Les mots qui reviennent : "apaisant", "professionnel", "chaleureux", "on se sent bien", "qualite des soins". C\'est son atout #1 — une reputation batie sur 25 ans, ca ne se fabrique pas.\n\nAVIS MARQUANTS :\n- "Meilleur institut de Paris, je ne vais nulle part ailleurs depuis 10 ans" (5 etoiles)\n- "Beatrice est exceptionnelle, elle prend le temps d\'ecouter et de conseiller" (5 etoiles)\n- "Ambiance zen, soins top, equipe adorable" (5 etoiles)\n- "Rapport qualite-prix imbattable pour le quartier" (5 etoiles)\n- "Seul bemol : pas de prestations modernes type microblading" (4 etoiles)\n\nVISIBILITE : Faible. Pas d\'Instagram visible, pas de Facebook actif, site web basique. Pour un institut de ce niveau, c\'est un manque a gagner enorme. Argument : "Le microblading genere du contenu avant/apres viral — ca va enfin montrer votre savoir-faire au monde."',

  environnement: 'QUARTIER OBERKAMPF — L\'un des quartiers les plus dynamiques de Paris.\n\nCOORDONNEES : 48.8648° N, 2.3783° E\n\nACCESSIBILITE :\n- Metro Oberkampf (L5, L9) — 2 min a pied\n- Metro Parmentier (L3) — 4 min\n- Metro Menilmontant (L2) — 6 min\n- 3 lignes de bus (96, 46, 56)\n\nENVIRONNEMENT COMMERCIAL :\n- 60+ restaurants dans un rayon de 300m\n- 15+ bars/cafes (forte affluence soir et weekend)\n- 8 pharmacies a proximite\n- 12 salons de beaute/coiffure concurrents dans un rayon de 500m\n- Aucun ne propose de dermopigmentation certifiee\n\nCLIENTELE DU QUARTIER :\n- 25-40 ans dominante\n- CSP+ (cadres, freelances, professions liberales)\n- Sensible aux tendances, prete a payer pour du premium\n- Fort taux de passage pietonne (rue Oberkampf = artere commerciale majeure)\n\nSCORE TRAFIC PIETON : 82/100 — Zone a tres fort passage',

  atouts: [
    '25 ans d\'experience = credibilite absolue, clientele ultra-fidele',
    'Note Google 4.8/5 (89 avis) = dans le top 5% des instituts parisiens',
    'CA 156K pour 2 personnes = rentabilite prouvee, pas en difficulte',
    'Quartier Oberkampf = clientele ideale pour le microblading (jeune, CSP+, tendances)',
    'Soins visage Guinot/Payot = la dermopigmentation est une extension naturelle de son expertise',
    'Aucun concurrent immediat en dermopigmentation sur Oberkampf',
    'SARL depuis 1999 = cotisations OPCO accumulees, financement quasi-garanti',
    'Un avis client mentionne explicitement le manque de microblading = demande reelle',
  ],
  pieges: [
    '25 ans d\'experience = conservatisme potentiel, resistance au changement',
    'Equipe de 2 : si une part en formation, l\'autre est seule 2 jours',
    'Tresorerie 8 923 EUR : impossible d\'avancer 1 400 EUR cash — OPCO obligatoire',
    'Marge nette 7.2% : chaque depense est calculee, il faut PROUVER le ROI chiffre',
    'Pas de presence digitale : elle ne mesure peut-etre pas la valeur du contenu Instagram',
    'Risque de perception "c\'est trop medical/moderne pour mon style"',
  ],

  strategie: {
    canal: 'Appel telephonique fixe (pas de mobile connu)',
    numero: '01 48 05 15 67',
    jour: 'Mardi ou mercredi',
    heure: '10h - 11h30 (avant les premiers RDV)',
    duree: '7-10 minutes (elle est disponible, institut calme le matin)',
    angle: 'Valoriser 25 ans d\'expertise + positionner la dermo comme evolution naturelle',
    objectif: 'Obtenir un RDV de passage au salon avec catalogue resultats',
  },

  script: {
    accroche: 'Bonjour Beatrice, je suis [Prenom] de Dermotec Advanced, le centre de formation Qualiopi au 75 boulevard Richard Lenoir — on est voisins dans le 11e ! J\'ai vu les avis de votre institut, 4.8 sur Google avec 89 avis, c\'est vraiment exceptionnel apres 25 ans. Bravo.',
    accroche_pourquoi: [
      '"On est voisins dans le 11e" = proximite geographique = confiance',
      'Cite le 4.8 et les 89 avis = elle sait que tu as fait tes recherches',
      '"25 ans" = valorisation de son anciennete, pas un appel generique',
      '"Bravo" = compliment court et sincere qui desarme',
    ],
    transition: 'Je vous appelle parce qu\'on accompagne des institutes de votre niveau a ajouter la dermopigmentation a leur carte — microblading, maquillage permanent. C\'est une evolution naturelle pour une professionnelle qui maitrise deja les soins du visage, et c\'est la prestation la plus demandee dans notre quartier.',
    transition_pourquoi: [
      '"De votre niveau" = reconnaissance de son expertise, pas condescendance',
      '"Evolution naturelle" = pas une rupture, une progression logique',
      '"Qui maitrise deja les soins du visage" = lien avec ce qu\'elle fait deja',
      '"Dans notre quartier" = local, pas un argument generique national',
    ],
    proposition: 'Concretement : en 2 jours de formation, vous ou Laura maitrisez le microblading. C\'est une prestation entre 200 et 250 euros la seance. Avec votre reputation — 4.8 sur Google, vos clientes vont se l\'arracher — on parle de 2 400 a 3 000 euros de CA supplementaire par mois. Et comme vous etes SARL depuis 99, votre OPCO EP a des droits accumules : la formation est financee a 100%, zero de votre poche.',
    proposition_chiffres: [
      'Formation microblading : 2 jours (14h) — 1 400 EUR HT',
      'Prix seance Paris 11e : 200-250 EUR (moyenne quartier)',
      'Hypothese basse : 3 clientes/semaine = 2 400 EUR/mois',
      'Hypothese haute : 5 clientes/semaine = 4 000 EUR/mois',
      'Impact sur marge nette : de 7.2% a 15-20% (dermo = marge >70%)',
      'ROI : formation remboursee en 2-3 semaines',
      'Financement : 0 EUR si OPCO EP (SARL beaute = eligible)',
    ],
    closing: 'Je ne vous demande rien aujourd\'hui sauf 15 minutes. Je passe au salon avec les photos avant/apres de nos stagiaires et le simulateur de rentabilite. Si ca vous parle, on monte le dossier OPCO ensemble — ca prend 15 minutes et ca ne coute rien. Si ca ne vous convainc pas, vous aurez vu de belles photos et on en reste la. Mardi ou mercredi, qu\'est-ce qui vous arrange ?',
    closing_pourquoi: [
      '"Je passe au salon" = il se deplace, marque de respect pour 25 ans d\'experience',
      '"Photos avant/apres" = concret, pas du blabla commercial',
      '"Simulateur de rentabilite" = elle calcule elle-meme, pas de promesse en l\'air',
      '"Ca ne coute rien" = zero risque, zero engagement',
      '"Mardi ou mercredi" = question alternative, pas oui/non = double les chances de RDV',
    ],
  },

  objections: [
    {
      titre: '"C\'est trop cher" / "J\'ai pas le budget"',
      pensee_reelle: 'Tresorerie de 8 923 EUR. Elle ne peut physiquement pas sortir 1 400 EUR sans impact sur sa tresorerie. C\'est pas de la resistance, c\'est de la realite comptable.',
      reponse: 'Je comprends tout a fait Beatrice — et c\'est justement pour ca que je vous en parle. Votre SARL cotise a l\'OPCO EP depuis 1999. En 25 ans, vous avez accumule des droits de formation. Le financement couvre 100% du cout — 0 euro de votre poche. Je verifie votre eligibilite en 2 minutes, c\'est gratuit.',
      si_insiste: 'Et si l\'OPCO ne passait pas — ce qui serait etonnant pour 25 ans de cotisation — on propose le paiement en 3x sans frais : 467 euros par mois. Avec 2 400 euros de CA supplementaire des le premier mois, c\'est 5x couvert.',
    },
    {
      titre: '"J\'ai pas le temps / On est que deux"',
      pensee_reelle: 'Vraie contrainte operationnelle. Si Beatrice part 2 jours, Laura gere seule. Si Laura part, Beatrice gere seule. C\'est stressant.',
      reponse: 'C\'est vrai, a 2 c\'est une contrainte. Mais la formation ne dure que 2 jours — un lundi-mardi par exemple, vos jours les plus calmes. Laura tient le salon pendant que vous vous formez. Et pensez-y : ces 2 jours vont generer du CA pendant les 20 prochaines annees de votre salon. C\'est le meilleur ratio temps/retour de toutes les formations.',
    },
    {
      titre: '"Ca fait 25 ans que ca marche comme ca"',
      pensee_reelle: 'Peur du changement. Identite professionnelle construite sur 25 ans. Introduire quelque chose de nouveau = remettre en question ce qui fonctionne.',
      reponse: 'Et c\'est justement parce que ca marche depuis 25 ans que vous pouvez vous permettre d\'evoluer. Votre base est solide — clientele fidele, reputation en or, savoir-faire reconnu. La dermopigmentation ne remplace rien de ce que vous faites, elle s\'ajoute. C\'est comme quand vous avez ajoute les massages balinais : un complement, pas un remplacement. Et vos clientes fideles seront les premieres a booker.',
    },
    {
      titre: '"C\'est pas mon style, c\'est trop medical"',
      pensee_reelle: 'Elle associe la dermopigmentation a l\'injectable ou au medical. Son identite "cocon zen" ne colle pas avec des aiguilles dans sa tete.',
      reponse: 'Je comprends cette perception. Mais le microblading, c\'est du maquillage semi-permanent — de l\'esthetique pure. On utilise un stylo a micro-lames, pas de machine, pas d\'injection. C\'est un geste delicat et artistique, tout a fait dans l\'esprit de votre institut. La dermopigmentation attire les femmes qui veulent un look naturel au reveil — "no makeup makeup". Ca colle parfaitement avec votre positionnement zen et naturel.',
    },
    {
      titre: '"Laissez-moi reflechir"',
      pensee_reelle: 'Interessee mais pas assez convaincue. A besoin d\'un element concret (photos, temoignage, chiffres) pour basculer.',
      reponse: 'Bien sur, prenez votre temps. Est-ce que je peux vous envoyer un truc concret ? Un dossier avec les avant/apres de nos stagiaires — des estheticiennes comme vous — et leurs chiffres du premier mois. Comme ca vous reflechissez avec du reel, pas juste des paroles. Je vous l\'envoie par email ou je le depose au salon ?',
    },
  ],

  douleurs: [
    'Plafond de CA a 156K — marge nette 7.2%, pas de reserve, chaque euro compte',
    'Aucune prestation premium (>100 EUR) — panier moyen bas = volume obligatoire',
    'Concurrence Oberkampf : 12 salons beaute dans 500m qui grignotent les parts de marche',
    'Zero presence digitale : pas d\'Instagram = invisible pour les <35 ans qui cherchent sur les reseaux',
    'Fatigue potentielle apres 25 ans : routine, pas de nouveaute = risque de lassitude',
    'Les tendances evoluent (dermo, tech, semi-permanent) et elle reste sur le classique',
    'Un avis client mentionne explicitement le manque de microblading : la demande existe, elle y repond pas',
  ],
  aspirations: [
    'Perenniser 25 ans de travail — son salon = son heritage professionnel',
    'Monter en gamme sans perdre l\'identite "cocon de bien-etre" qui fait sa force',
    'Augmenter le CA sans embaucher une 3eme personne = ajouter une prestation premium',
    'Moderniser l\'image sans tout changer : etre "l\'institut classique qui sait aussi faire le moderne"',
    'Avoir du contenu Instagram pour attirer la clientele 25-35 ans du quartier',
    'Former Laura a des techniques nouvelles = investissement equipe = fidelisation',
    'Se differencier des 12 concurrents : etre LA reference dermo sur Oberkampf',
  ],
  positionnement: [
    '"25 ans d\'expertise + une nouvelle corde a votre arc" — evolution, pas revolution',
    '"La prestation premium qui manque a votre carte" — montee en gamme naturelle',
    '"2 jours investis pour 20 ans de rentabilite supplementaire" — vision long terme',
    '"Du contenu Instagram qui se cree tout seul a chaque seance" — resout sa douleur digitale',
    '"Vos clientes fideles n\'auront plus besoin d\'aller ailleurs pour le microblading" — fidelisation',
  ],

  formations: [
    {
      nom: 'Microblading / Microshading',
      prix: '1 400 EUR HT',
      duree: '2 jours (14 heures) | Financement OPCO EP',
      niveau_priorite: 'PRINCIPAL',
      pourquoi: [
        'Extension naturelle de son expertise soins visage (Guinot/Payot)',
        'Ses 89 avis positifs = clientes fideles pretes a tester',
        'Paris 11e/Oberkampf : forte demande, aucun concurrent direct en dermo',
        'Geste delicat et artistique = coherent avec son positionnement "zen"',
        'Panier moyen x4 : de 50 EUR (soin visage) a 200 EUR (microblading)',
      ],
      roi: 'ROI : 200-250 EUR/seance x 3 clientes/sem = 2 400-3 000 EUR/mois. Formation remboursee en 2-3 semaines. Impact annuel : +28 800 EUR de CA minimum.',
    },
    {
      nom: 'Full Lips (Candy Lips / Lip Blush)',
      prix: '1 400 EUR HT',
      duree: '2 jours (14 heures)',
      niveau_priorite: 'COMPLEMENTAIRE',
      pourquoi: [
        'Suite logique du microblading — meme geste, meme clientele',
        'Prix seance 300 EUR = marge encore superieure',
        'Tendance "lip blush" explosive chez les 25-35 ans',
        'Double le potentiel CA dermo du salon',
      ],
      roi: 'ROI : 300 EUR/seance. Ajout potentiel : +3 600 EUR/mois.',
    },
    {
      nom: 'Rehaussement Cils + Extension Volume Russe',
      prix: '890 EUR HT',
      duree: '2 jours (14 heures)',
      niveau_priorite: 'UPSELL',
      pourquoi: [
        'Elle fait deja rehaussement + teinture = montee en gamme directe',
        'Extensions cils = prestation recurrente (retouches toutes les 3-4 semaines)',
        'Fidelisation maximale : la cliente revient chaque mois',
      ],
    },
  ],

  financement: {
    option_principale: 'OPCO EP — SARL beaute depuis 1999. 25 ans de cotisations = droits accumules importants. Couverture 100% Plan de Developpement des Competences.',
    comment_parler: 'Beatrice connait les OPCO (25 ans de gerance). Ne la prends pas de haut. Dis : "Votre SARL cotise depuis 25 ans — il serait dommage de ne pas utiliser vos droits. On s\'occupe de tout le dossier, ca prend 15 minutes."',
    phrase_cle: 'Votre SARL cotise a l\'OPCO depuis 25 ans — ca fait beaucoup de droits accumules. On s\'occupe de tout le paperasse.',
    alternatives: [
      'CPF : si Beatrice ou Laura ont des droits (probable apres 25 ans)',
      'AGEFICE : si inscrite aussi comme independante',
      'Paiement 3x sans frais Stripe : 467 EUR/mois x 3',
      'Paiement comptant avec remise 5% (1 330 EUR HT)',
    ],
  },

  plan_action: [
    { quand: 'Aujourd\'hui', action: 'Appeler au 01 48 05 15 67 entre 10h et 11h30', si_ok: 'Fixer un RDV de passage au salon' },
    { quand: 'Si absente', action: 'Laisser message vocal : "Beatrice, [Prenom] de Dermotec, voisin du 11e. J\'aimerais vous montrer un truc. Je rappelle demain."', si_ok: 'Elle rappelle d\'elle-meme (curieuse)' },
    { quand: 'J+1', action: 'Rappeler + envoyer email avec 3 photos avant/apres + simulateur ROI PDF', si_ok: 'Elle lit l\'email et rappelle' },
    { quand: 'J+3', action: 'Rappeler : "Avez-vous pu regarder les photos ?"', si_ok: 'Fixer un creneau de passage' },
    { quand: 'J+7', action: 'Passer PHYSIQUEMENT au salon 73 rue Oberkampf avec catalogue imprime', si_ok: 'RDV sur place = taux conversion 3x. Le face-a-face change tout avec une pro de 25 ans.' },
    { quand: 'J+14', action: 'Email avec temoignage video d\'une estheticienne similaire (25+ ans, meme profil)', si_ok: 'Conclure ou planifier rappel mensuel' },
  ],

  message_final: 'Beatrice a 25 ans d\'experience, 89 avis a 4.8 etoiles, et un quartier en or. Son salon est une institution. Il lui manque juste UNE prestation pour passer de "tres bon institut" a "la reference beaute d\'Oberkampf". Tu as tous les arguments, les chiffres, et le financement. Ne vends pas une formation — offre-lui l\'opportunite de faire evoluer un quart de siecle de savoir-faire. A toi de jouer.',
}

async function main() {
  console.log('Generation du briefing Esthelia V2...')
  const buffer = await generateBriefingWord(data)
  const filename = 'Briefing-Commercial-Esthelia-V2.docx'
  writeFileSync(filename, buffer)
  console.log(`Word genere : ${filename} (${(buffer.length / 1024).toFixed(0)} KB)`)
}

main()
