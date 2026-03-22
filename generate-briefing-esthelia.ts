import { generateBriefingWord, type BriefingData } from './src/lib/generate-briefing-word'
import { writeFileSync } from 'fs'

const data: BriefingData = {
  prospect: {
    prenom: 'Beatrice',
    nom: 'Pignol',
    entreprise: 'Esthelia',
    adresse: '73 Rue Oberkampf, 75011 Paris',
    tel: '01 48 05 15 67',
    siret: '423 000 900 00013',
    forme_juridique: 'SARL',
    date_creation: 'Mai 1999 (25+ ans)',
    effectif: 2,
    equipe: ['Beatrice Pignol (gerante)', 'Laura (estheticienne)'],
    services: ['Soins visage', 'Soins corps', 'Massages balinais et californiens', 'Epilation traditionnelle', 'Rehaussement et teinture cils/sourcils', 'Vernis semi-permanent'],
    instagram: undefined,
    site_web: 'institutesthelia.fr',
    google_rating: 4.8,
    google_avis: 89,
    ca: 156200,
    dirigeant: 'Beatrice Pignol — Gerante depuis 2005',
  },
  scores: { global: 64, reputation: 78, presence: 48, activity: 35, financial: 58, neighborhood: 82 },
  classification: 'TIEDE',

  verdict: 'Prospect tiede a tres fort potentiel. Institut etabli depuis 25 ans avec une excellente reputation (4.8 Google, 89 avis). Beatrice est une professionnelle experimentee qui connait son metier. Son institut manque de prestations premium type dermopigmentation — c\'est un ajout naturel a sa carte. CA de 156K pour 2 personnes = bonne rentabilite, capacite d\'investissement confirmee. Le frein principal sera le changement d\'habitudes apres 25 ans. Approche : valoriser son expertise existante et positionner la formation comme une evolution naturelle, pas une revolution.',

  brief: 'Beatrice Pignol dirige Esthelia depuis 1999, un institut de beaute reconnu dans le quartier Oberkampf. 25 ans d\'experience, note Google exceptionnelle de 4.8 avec 89 avis, CA de 156K EUR avec seulement 2 personnes. C\'est une professionnelle solide qui maitrise les soins classiques (visage, corps, massages, epilation) mais qui n\'a pas encore franchi le pas de la dermopigmentation. Son quartier Oberkampf est parmi les plus dynamiques de Paris — forte affluence, clientele jeune et CSP+ sensible aux tendances beaute.',

  histoire: 'Beatrice est une veterane de l\'esthetique parisienne. Elle a ouvert Esthelia en 1999, il y a plus de 25 ans, au 73 rue Oberkampf — a l\'epoque, le quartier etait en pleine transformation. Elle a traverse toutes les modes, toutes les crises, et son salon est toujours la. Avec Laura, son estheticienne, elles forment un duo soude qui fidélise une clientele exigeante. Son positionnement est clair : soins traditionnels de qualite, massages relaxants, ambiance "havre de paix" dans un quartier bruyant. Les avis clients parlent d\'eux-memes : "apaisant", "professionnel", "on se sent bien des qu\'on pousse la porte".',

  situation_business: 'SARL au capital de 8 000 EUR avec un CA de 156 200 EUR en 2024 et un resultat net de 11 176 EUR. Pour un institut de 2 personnes, c\'est une rentabilite correcte mais le resultat net (7.2% de marge) montre qu\'il n\'y a pas beaucoup de gras. La tresorerie de 8 923 EUR est juste. Beatrice ne jettera pas 1 400 EUR par la fenetre — mais elle peut parfaitement le financer via OPCO. Son anciennete (25 ans) est un signal de solidite mais aussi de conservatisme potentiel — elle n\'aime probablement pas prendre des risques.',

  reputation_visibilite: 'Reputation : EXCELLENTE. 4.8/5 sur Google avec 89 avis, c\'est au-dessus de 95% des instituts parisiens. Les clients louent l\'ambiance, le professionnalisme, et la qualite des soins. C\'est son plus gros atout. Visibilite : FAIBLE. Pas d\'Instagram visible, pas de Facebook actif, site web basique. Pour un institut de ce niveau de qualite, c\'est un enorme manque a gagner. Argument de vente : "Vos clientes vous adorent mais personne ne le sait en dehors de votre quartier. Le microblading genere du contenu avant/apres viral qui va enfin montrer votre savoir-faire au monde."',

  environnement: 'Rue Oberkampf = l\'une des rues les plus frequentees du 11e arrondissement. Bars, restaurants, boutiques — un flux constant de pietons. La clientele est jeune (25-40 ans), CSP+, sensible aux tendances beaute et prete a payer pour du premium. C\'est LE quartier ideal pour introduire le microblading. La concurrence beaute est presente mais aucun concurrent immediat ne propose de formations certifiees en dermopigmentation. Metros Oberkampf (L5, L9), Parmentier (L3), Menilmontant (L2) — tres accessible.',

  atouts: [
    '25 ans d\'experience = credibilite absolue aupres de sa clientele',
    'Note Google 4.8/5 avec 89 avis = reputation en or',
    'CA 156K pour 2 personnes = bonne rentabilite, pas en difficulte',
    'Quartier Oberkampf = clientele ideale pour le microblading (jeune, CSP+, tendances)',
    'Soins traditionnels de qualite = la dermopigmentation s\'inscrit naturellement dans sa carte',
    'Pas de concurrent immediat en dermopigmentation sur sa rue',
  ],
  pieges: [
    '25 ans d\'experience = potentiel conservatisme, peur du changement',
    'Petite structure (2 personnes) = si une est en formation, l\'autre est seule',
    'Tresorerie de 8 923 EUR = ne peut pas avancer 1 400 EUR cash facilement',
    'Pas de presence digitale = elle ne voit peut-etre pas l\'interet du contenu Instagram',
    'Marge nette faible (7.2%) = chaque depense est calculee, il faut PROUVER le ROI',
  ],

  strategie: {
    canal: 'Appel telephonique fixe',
    numero: '01 48 05 15 67',
    jour: 'Mardi ou mercredi',
    heure: '10h - 11h30 (avant les RDV)',
    duree: '7-10 minutes',
    angle: 'Valoriser son expertise et positionner la dermo comme evolution naturelle de son savoir-faire',
    objectif: 'Obtenir un RDV au salon pour montrer le catalogue et simuler le ROI',
  },

  script: {
    accroche: 'Bonjour Beatrice, je suis [Prenom] de Dermotec Advanced, le centre de formation Qualiopi au 75 boulevard Richard Lenoir — on est voisins dans le 11e ! J\'ai vu les avis de votre institut, 4.8 sur Google avec 89 avis, c\'est vraiment exceptionnel apres 25 ans.',
    accroche_pourquoi: [
      '"On est voisins" = proximite, pas un demarcheur lointain',
      'Cite les avis Google = elle sait que tu as fait tes recherches',
      '"Exceptionnel apres 25 ans" = valorisation sincere de son experience',
    ],
    transition: 'Je vous appelle parce qu\'on accompagne des institutes comme le votre a ajouter la dermopigmentation — microblading, maquillage permanent — a leur carte. C\'est une evolution naturelle pour une professionnelle de votre niveau, et c\'est la prestation la plus demandee dans le 11e en ce moment.',
    transition_pourquoi: [
      '"Institutes comme le votre" = elle est dans la bonne categorie, pas au-dessus ni en dessous',
      '"Evolution naturelle" = pas une rupture, une progression logique',
      '"Professionnelle de votre niveau" = reconnaissance de son expertise',
      '"La plus demandee dans le 11e" = preuve sociale locale',
    ],
    proposition: 'Concretement, en 2 jours de formation, vous ou Laura maitrisez le microblading. C\'est une prestation a 200-250 euros la seance. Avec 3 clientes par semaine — et vu votre reputation, ca ira vite — ca fait 2 400 a 3 000 euros de chiffre d\'affaires supplementaire par mois. Et comme vous etes SARL, le financement OPCO couvre 100% du cout de la formation.',
    proposition_chiffres: [
      'Formation : 2 jours (14h) — 1 400 EUR HT',
      'Prix seance microblading : 200-250 EUR (Paris 11e)',
      '3 clientes/semaine = 2 400-3 000 EUR/mois supplementaire',
      'Marge nette actuelle : 7.2% → avec le microblading : marge >70% (pas de produit cher)',
      'ROI : formation remboursee en 2-3 semaines',
      'Financement OPCO : 0 EUR de sa poche',
    ],
    closing: 'Je ne vous demande rien aujourd\'hui sauf 15 minutes de votre temps. Je passe au salon cette semaine avec les chiffres detailles et le catalogue des resultats. Si ca vous parle, on monte le dossier OPCO ensemble. Si ca ne vous parle pas, vous aurez appris quelque chose et on en reste la. Ca vous va ?',
    closing_pourquoi: [
      '"Je ne vous demande rien" = zero pression',
      '"Je passe au salon" = deplace pour elle, pas l\'inverse = marque de respect',
      '"Catalogue des resultats" = des photos, pas du blabla',
      '"Si ca ne vous parle pas, on en reste la" = pas de piege, pas d\'engagement',
      'Question fermee "Ca vous va ?" = appelle une reponse oui/non',
    ],
  },

  objections: [
    {
      titre: '"C\'est trop cher" / "J\'ai pas le budget"',
      pensee_reelle: 'Tresorerie de 8 923 EUR — elle ne peut pas sortir 1 400 EUR cash. Ce n\'est pas qu\'elle ne veut pas, c\'est qu\'elle ne peut pas facilement.',
      reponse: 'Je comprends tout a fait, Beatrice. C\'est justement pour ca que 80% de nos stagiaires ne paient rien du tout. Votre SARL cotise a l\'OPCO EP — le financement couvre 100% du cout. Je verifie votre eligibilite en 2 minutes, c\'est gratuit.',
      si_insiste: 'Et meme sans OPCO, on propose le paiement en 3 fois sans frais — 467 euros par mois pendant 3 mois. Avec 2 400 euros de CA supplementaire des le premier mois, c\'est largement couvert.',
    },
    {
      titre: '"J\'ai pas le temps" / "On est que deux"',
      pensee_reelle: 'C\'est sa vraie contrainte. A 2 dans le salon, si une part en formation, l\'autre doit tout gerer seule pendant 2 jours.',
      reponse: 'C\'est vrai que c\'est une contrainte a 2. Mais la formation dure 2 jours seulement. Et on peut la planifier un lundi-mardi — vos jours les plus calmes. Laura peut tenir le salon pendant que vous vous formez, ou l\'inverse. En 2 jours, vous ajoutez une prestation a 200 euros la seance a votre carte. Le ratio temps investi / retour est imbattable.',
      si_insiste: 'Et pensez-y comme ca : en 2 jours, vous gagnez une competence qui va generer du CA pendant les 20 prochaines annees de votre salon.',
    },
    {
      titre: '"Je n\'en ai pas besoin" / "Ca fait 25 ans que ca marche comme ca"',
      pensee_reelle: 'Peur du changement apres 25 ans de routine qui fonctionne. "Pourquoi changer ce qui marche ?" C\'est la reticence la plus profonde.',
      reponse: 'Vous avez absolument raison — 25 ans, c\'est la preuve que vous faites les choses bien. Et c\'est justement parce que vous avez cette base solide que la dermopigmentation est un ajout naturel, pas un changement. Vos clientes vous font deja confiance pour les soins du visage — le microblading, c\'est juste une corde de plus a votre arc. Et regardez les instituts du quartier qui le proposent : ils affichent complet.',
    },
    {
      titre: '"Laissez-moi reflechir" / "Rappelez-moi"',
      pensee_reelle: 'Elle est interessee mais pas assez convaincue. Il lui faut un element concret pour se decider.',
      reponse: 'Bien sur Beatrice, prenez votre temps. Est-ce que je peux juste vous envoyer un document ? C\'est un comparatif avant/apres de nos stagiaires — des estheticiennes comme vous qui ont ajoute le microblading a leur carte. Avec les chiffres de ce que ca leur a rapporte le premier mois. Comme ca vous reflechissez avec du concret. Je vous l\'envoie par email ou WhatsApp ?',
    },
    {
      titre: '"C\'est pas mon style" / "C\'est trop medical"',
      pensee_reelle: 'Elle associe la dermopigmentation a quelque chose de medical/intrusif qui ne colle pas avec son positionnement "havre de paix".',
      reponse: 'Je comprends cette impression. En realite, le microblading c\'est du maquillage semi-permanent — c\'est de l\'esthetique pure, pas du medical. On utilise un stylo a micro-lames, pas de machine. C\'est un geste delicat et artistique, tout a fait dans l\'esprit de votre institut. Et c\'est la prestation preferee des femmes qui veulent un look naturel au reveil — "no makeup makeup", ca colle parfaitement avec votre ambiance.',
    },
  ],

  douleurs: [
    'Plafond de CA : 156K pour 2 personnes, marge nette de 7.2% — chaque euro compte',
    'Pas de prestation premium : ses soins sont entre 30 et 80 EUR — difficile d\'augmenter le panier moyen',
    'Concurrence croissante Oberkampf : nouveaux salons ouvrent regulierement dans le quartier',
    'Absence totale de presence digitale : pas d\'Instagram, pas de contenu — elle est invisible en ligne',
    'Equipe minimale de 2 : pas de marge de manoeuvre, fatigue potentielle apres 25 ans',
    'Risque de decrochage : les tendances beaute evoluent (dermo, tech) et elle reste sur le classique',
  ],
  aspirations: [
    'Perenniser son salon pour les annees a venir — 25 ans, c\'est un heritage a proteger',
    'Monter en gamme sans perdre son identite "cocon de bien-etre"',
    'Augmenter son CA sans embaucher — ajouter une prestation premium plutot qu\'un 3eme poste',
    'Moderniser sa communication — elle sait qu\'il faudrait etre sur Instagram mais ne sait pas par ou commencer',
    'Former Laura a de nouvelles techniques — investir dans son equipe = fideliser',
    'Se differencier : etre "l\'institut qui fait aussi le microblading" = avantage concurrentiel unique',
  ],
  positionnement: [
    '"Evolution naturelle de votre expertise" — pas un changement, une progression',
    '"Nouvelle prestation premium pour votre salon" — montee en gamme',
    '"Un investissement de 2 jours pour 20 ans de rentabilite" — vision long terme',
    '"Du contenu Instagram qui se cree tout seul avec les avant/apres" — resout sa douleur digitale',
    '"La prestation que vos clientes fideles attendent" — fidelisation',
  ],

  formations: [
    {
      nom: 'Microblading / Microshading',
      prix: '1 400 EUR HT',
      duree: '2 jours (14 heures)',
      niveau_priorite: 'PRINCIPAL',
      pourquoi: [
        'Prestation naturelle qui correspond a son positionnement "beaute naturelle"',
        'Ses clientes fideles seront les premieres a booker',
        '2 jours = faisable meme a 2 dans le salon',
        'Prix seance 200-250 EUR = triple son panier moyen actuel',
      ],
      roi: 'ROI : 200 EUR/seance x 3 clientes/sem = 2 400 EUR/mois. Formation remboursee en 3 semaines.',
    },
    {
      nom: 'Full Lips (Candy Lips)',
      prix: '1 400 EUR HT',
      duree: '2 jours (14 heures)',
      niveau_priorite: 'COMPLEMENTAIRE',
      pourquoi: [
        'Complement naturel apres le microblading — meme geste, meme clientele',
        'Prix seance 300 EUR = marge encore superieure',
        'Tendance forte : levres naturelles colorees',
      ],
      roi: 'ROI : 300 EUR/seance. Double le potentiel CA dermo-esthetique.',
    },
    {
      nom: 'Rehaussement Cils + Volume Russe',
      prix: '890 EUR HT',
      duree: '2 jours',
      niveau_priorite: 'UPSELL',
      pourquoi: [
        'Elle fait deja du rehaussement et teinture cils — montee en gamme naturelle',
        'Extensions cils = prestation recurrente (retouches toutes les 3-4 semaines)',
        'Clientele deja identifiee dans son salon',
      ],
    },
  ],

  financement: {
    option_principale: 'OPCO EP — SARL beaute depuis 1999, cotisations accumulees. Couverture 100% dans le cadre du Plan de Developpement des Competences.',
    comment_parler: 'Beatrice est une gerante experimentee — elle connait les OPCO. Ne la prends pas de haut. Dis simplement : "Votre SARL cotise a l\'OPCO EP depuis 25 ans. Il y a surement des droits accumules. On monte le dossier ensemble, ca prend 15 minutes, et la formation ne vous coute rien."',
    phrase_cle: 'Votre SARL cotise a l\'OPCO depuis 25 ans — il serait dommage de ne pas utiliser vos droits. On s\'occupe de tout le dossier.',
    alternatives: [
      'CPF — si Beatrice ou Laura ont des droits accumules',
      'AGEFICE — si elle est aussi inscrite en tant qu\'independante',
      'Paiement en 3x sans frais via Stripe — 467 EUR/mois',
      'Paiement comptant avec remise 5% si elle prefere',
    ],
  },

  plan_action: [
    { quand: 'Aujourd\'hui', action: 'Appeler au 01 48 05 15 67 entre 10h et 11h30', si_ok: 'Fixer un RDV au salon' },
    { quand: 'Si pas de reponse', action: 'Rappeler le lendemain a la meme heure', si_ok: 'Laisser un message vocal court et pro' },
    { quand: 'J+1', action: 'Envoyer un email avec 3 photos avant/apres + simulateur ROI', si_ok: 'Elle rappelle d\'elle-meme' },
    { quand: 'J+3', action: 'Rappeler : "Avez-vous pu regarder les photos ?"', si_ok: 'Proposer un creneau de passage' },
    { quand: 'J+7', action: 'Passer physiquement au salon avec le catalogue imprime', si_ok: 'RDV sur place = taux de conversion 3x' },
    { quand: 'J+14', action: 'Email recapitulatif avec temoignage d\'une estheticienne similaire', si_ok: 'Conclure ou planifier rappel J+30' },
  ],

  message_final: 'Beatrice a 25 ans d\'experience, une reputation en or, et un quartier ideal. Il lui manque juste la bonne prestation pour passer au niveau superieur. Tu as tous les arguments. A toi de jouer — et rappelle-toi : tu ne vends pas une formation, tu lui offres l\'opportunite de faire evoluer 25 ans de savoir-faire.',
}

async function main() {
  console.log('Generation du briefing Esthelia...')
  const buffer = await generateBriefingWord(data)
  const filename = 'Briefing-Commercial-Esthelia.docx'
  writeFileSync(filename, buffer)
  console.log(`Word genere : ${filename} (${(buffer.length / 1024).toFixed(0)} KB)`)
}

main()
