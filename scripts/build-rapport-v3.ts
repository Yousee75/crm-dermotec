/**
 * RAPPORT V3 — Structure cabinet conseil, langage TPE
 * 4 parties, ~15 pages, 14 graphiques, encadrés "RETIENS"
 * Qualité McKinsey, compréhension Marie-dans-le-métro
 */
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, HeadingLevel, BorderStyle, ShadingType,
  Header, Footer, PageNumber, PageBreak, ImageRun,
} from 'docx'
import { writeFileSync, readFileSync, existsSync } from 'fs'

// Couleurs
const B='2EC6F3',A='082545',G='10B981',GD='059669',AM='F59E0B',AD='D97706',R='EF4444'
const IN='6366F1',VI='8B5CF6',T='1E293B',T2='475569',T3='94A3B8',T4='CBD5E1'
const LB='F8FAFC',BB='F0F9FF',GB='ECFDF5',AB='FFFBEB'

// Helpers
const h1=(t:string)=>new Paragraph({heading:HeadingLevel.HEADING_1,spacing:{before:300,after:80},children:[new TextRun({text:t,font:'Calibri',size:30,bold:true,color:A})]})
const h2=(t:string)=>new Paragraph({heading:HeadingLevel.HEADING_2,spacing:{before:200,after:60},children:[new TextRun({text:t,font:'Calibri',size:24,bold:true,color:B})]})
const ln=()=>new Paragraph({spacing:{after:120},border:{bottom:{style:BorderStyle.SINGLE,size:6,color:B}},children:[]})
const p=(t:string,o?:any)=>new Paragraph({spacing:{after:50},children:[new TextRun({text:t,font:'Calibri',size:o?.size||20,color:o?.color||T,bold:o?.bold,italics:o?.italic})]})
const rich=(r:any[])=>new Paragraph({spacing:{after:50},children:r.map((x:any)=>new TextRun({text:x.text,font:'Calibri',size:x.size||20,color:x.color||T,bold:x.bold,italics:x.italic}))})
const bul=(t:string,o?:any)=>new Paragraph({bullet:{level:0},spacing:{after:25},children:[new TextRun({text:t,font:'Calibri',size:20,color:o?.color||T,bold:o?.bold})]})
const sp=(n=60)=>new Paragraph({spacing:{after:n},children:[]})
const brk=()=>new Paragraph({children:[new PageBreak()]})

// Encadré coloré
function box(t:string,bg:string,fg:string,bold=true){
  return new Paragraph({spacing:{before:50,after:50},shading:{type:ShadingType.CLEAR,fill:bg},indent:{left:200,right:200},
    children:[new TextRun({text:'   '+t+'   ',font:'Calibri',size:21,color:fg,bold})]})
}

// RETIENS — L'encadré jaune pédagogique
function retiens(t:string){
  return new Paragraph({spacing:{before:80,after:80},shading:{type:ShadingType.CLEAR,fill:AB},
    indent:{left:150,right:150},border:{left:{style:BorderStyle.SINGLE,size:12,color:AM}},
    children:[
      new TextRun({text:'   RETIENS :  ',font:'Calibri',size:21,bold:true,color:AD}),
      new TextRun({text:t,font:'Calibri',size:21,color:AD}),
    ]})
}

// Explication graphique — petit texte gris pour comprendre
function explication(t:string){
  return new Paragraph({spacing:{after:40},indent:{left:100},
    children:[new TextRun({text:'Comment lire : '+t,font:'Calibri',size:16,color:T3,italics:true})]})
}

// Conseil — encadré vert
function conseil(t:string){
  return new Paragraph({spacing:{before:50,after:50},shading:{type:ShadingType.CLEAR,fill:GB},
    indent:{left:150,right:150},border:{left:{style:BorderStyle.SINGLE,size:12,color:G}},
    children:[
      new TextRun({text:'   CONSEIL :  ',font:'Calibri',size:20,bold:true,color:GD}),
      new TextRun({text:t,font:'Calibri',size:20,color:GD}),
    ]})
}

// Attention — encadré rouge
function attention(t:string){
  return new Paragraph({spacing:{before:50,after:50},shading:{type:ShadingType.CLEAR,fill:'FEF2F2'},
    indent:{left:150,right:150},border:{left:{style:BorderStyle.SINGLE,size:12,color:R}},
    children:[
      new TextRun({text:'   ATTENTION :  ',font:'Calibri',size:20,bold:true,color:R}),
      new TextRun({text:t,font:'Calibri',size:20,color:R}),
    ]})
}

function tr(c:string[],h=false,i=0){return new TableRow({children:c.map((x,j)=>new TableCell({shading:{type:ShadingType.CLEAR,fill:h?A:i%2===0?LB:'FFFFFF'},margins:{top:35,bottom:35,left:70,right:70},children:[new Paragraph({children:[new TextRun({text:x,font:'Calibri',size:17,bold:h||j===0,color:h?'FFFFFF':j===0?A:T})]})],}))})}
function kpi(l:string,v:string,c:string){return new TableCell({shading:{type:ShadingType.CLEAR,fill:LB},margins:{top:50,bottom:50,left:60,right:60},children:[new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:v,font:'Calibri',size:26,bold:true,color:c})]}),new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:l,font:'Calibri',size:13,color:T3})]})]})}
function img(n:string,w:number,h:number){const f=`./charts/${n}`;if(!existsSync(f))return null;return new Paragraph({alignment:AlignmentType.CENTER,spacing:{before:60,after:60},children:[new ImageRun({data:readFileSync(f),transformation:{width:w,height:h},type:'png'})]})}

// Partie header (bandeau couleur)
function partieHeader(num:string,titre:string,color:string){
  return new Paragraph({spacing:{before:200,after:100},shading:{type:ShadingType.CLEAR,fill:color},indent:{left:100,right:100},
    children:[new TextRun({text:`   PARTIE ${num} — ${titre}   `,font:'Calibri',size:28,bold:true,color:'FFFFFF'})]})
}

async function build(){
  console.log('=== RAPPORT V3 — Structure PRO, Langage TPE ===\n')

  // Carte OSM
  let mapBuf:Buffer|null=null
  try{const SM=(await import('staticmaps')).default;const m=new SM({width:640,height:280,tileUrl:'https://tile.openstreetmap.org/{z}/{x}/{y}.png',tileSize:256,tileRequestHeader:{'User-Agent':'SatoreaCRM/1.0'}});await m.render([2.3783,48.8648],15);mapBuf=await m.image.buffer('image/png') as Buffer;console.log('Carte: OK')}catch{console.log('Carte: skip')}
  const date=new Date().toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'})

  const doc=new Document({
    styles:{default:{document:{run:{font:'Calibri',size:20,color:T}}}},
    sections:[
      // ═══ COUVERTURE ═══
      {properties:{page:{margin:{top:1440,bottom:1440,left:1440,right:1440}}},children:[
        sp(400),
        new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:'SATOREA',font:'Calibri',size:52,bold:true,color:B})]}),
        new Paragraph({alignment:AlignmentType.CENTER,spacing:{after:120},children:[new TextRun({text:'Le CRM qui prepare tes appels',font:'Calibri',size:22,color:T3})]}),
        sp(80),new Paragraph({alignment:AlignmentType.CENTER,border:{bottom:{style:BorderStyle.SINGLE,size:6,color:B,space:1}},children:[]}),sp(80),
        new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:'Briefing Prospect',font:'Calibri',size:36,bold:true,color:A})]}),sp(40),
        new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:'Beatrice Pignol',font:'Calibri',size:28,color:T})]}),
        new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:'Esthelia — Institut de Beaute',font:'Calibri',size:22,color:T2})]}),
        new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:'73 Rue Oberkampf, 75011 Paris',font:'Calibri',size:18,color:T3})]}),
        sp(80),
        ...(img('01-gauge-score.png',240,170)?[img('01-gauge-score.png',240,170)!]:[box('SCORE : 64/100 — TIEDE',AB,AD)]),
        sp(120),
        new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:date,font:'Calibri',size:18,color:T3})]}),
        new Paragraph({alignment:AlignmentType.CENTER,spacing:{before:200},children:[new TextRun({text:'Document genere par Satorea CRM — Confidentiel',font:'Calibri',size:13,color:T4})]}),
      ]},

      // ═══ CONTENU ═══
      {properties:{page:{margin:{top:950,bottom:950,left:950,right:950}}},
       headers:{default:new Header({children:[new Paragraph({border:{bottom:{style:BorderStyle.SINGLE,size:2,color:B}},children:[new TextRun({text:'SATOREA',font:'Calibri',size:13,bold:true,color:B}),new TextRun({text:'   Briefing Esthelia — Beatrice Pignol',font:'Calibri',size:11,color:T3})]})]})} ,
       footers:{default:new Footer({children:[new Paragraph({alignment:AlignmentType.RIGHT,children:[new TextRun({text:'Page ',font:'Calibri',size:11,color:T3}),new TextRun({children:[PageNumber.CURRENT],font:'Calibri',size:11,color:T3})]})]})},
       children:[

        // ═══════════════════════════════════════════
        // L'ESSENTIEL AVANT D'APPELER — 1 page
        // ═══════════════════════════════════════════
        h1('L\'essentiel avant d\'appeler'),ln(),
        p('Si tu n\'as que 2 minutes, lis juste cette page. Tu sauras tout ce qu\'il faut.',{italic:true,color:T2,size:18}),
        sp(20),

        // 5 KPIs
        new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:[new TableRow({children:[
          kpi('Note Google','4.8/5',B),kpi('Avis clients','89',IN),kpi('CA annuel','156K',G),kpi('Effectif','2 pers.',VI),kpi('Score Satorea','64/100',AM),
        ]})]}),
        sp(20),

        // Verdict en 1 phrase
        box('Beatrice dirige un institut de beaute depuis 25 ans a Oberkampf. Note Google de 4.8 (top 5% Paris). Elle ne fait pas de microblading — c\'est exactement ce que tu vas lui proposer.',AB,AD),
        sp(15),

        // 3 actions
        h2('Tes 3 actions'),
        rich([{text:'1. ',bold:true,color:B},{text:'Appelle-la mardi ou mercredi entre 10h et 11h30 au '},{text:'01 48 05 15 67',bold:true,color:A}]),
        rich([{text:'2. ',bold:true,color:IN},{text:'Propose-lui un RDV de 15 min au salon — tu passes avec les photos avant/apres'}]),
        rich([{text:'3. ',bold:true,color:VI},{text:'Parle financement OPCO tout de suite — 0 EUR de sa poche (elle cotise depuis 25 ans)'}]),
        sp(15),

        // Le chiffre qui tue
        box('+2 700 EUR de CA par mois pour elle. Formation remboursee en 3 semaines. Cout pour elle : 0 EUR.',GB,GD),
        sp(15),

        // Code couleurs
        p('Code couleurs du rapport :',{size:16,color:T3}),
        rich([
          {text:'  VERT ',size:16,bold:true,color:GD},{text:'= atout / bonne nouvelle   ',size:16,color:T3},
          {text:'  JAUNE ',size:16,bold:true,color:AD},{text:'= a retenir / important   ',size:16,color:T3},
          {text:'  ROUGE ',size:16,bold:true,color:R},{text:'= attention / piege',size:16,color:T3},
        ]),
        brk(),

        // ═══════════════════════════════════════════
        // PARTIE 1 — QUI TU APPELLES
        // ═══════════════════════════════════════════
        partieHeader('1','QUI TU APPELLES',A),
        sp(20),

        // -- Fiche prospect --
        h1('Beatrice Pignol — 25 ans d\'experience, une institution du 11e'),ln(),
        p('Beatrice a ouvert Esthelia en 1999, il y a plus de 25 ans. Elle a traverse toutes les modes et toutes les crises. Avec Laura, son estheticienne, elles forment un duo soude qui fidélise une clientele exigeante. Son positionnement : qualite, calme, expertise — dans un quartier bruyant, c\'est exactement ce que ses clientes cherchent.'),
        sp(15),
        new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:[
          tr(['Info','Detail'],true),
          tr(['Salon','Esthelia — Institut de Beaute'],false,0),
          tr(['Adresse','73 Rue Oberkampf, 75011 Paris'],false,1),
          tr(['Telephone','01 48 05 15 67'],false,2),
          tr(['SIRET','423 000 900 00013 (SARL)'],false,3),
          tr(['Cree en','Mai 1999 — 25+ ans d\'activite'],false,4),
          tr(['CA 2024','156 200 EUR (resultat net : 11 176 EUR)'],false,5),
          tr(['Equipe','Beatrice Pignol (gerante) + Laura (estheticienne)'],false,6),
          tr(['Prestations','Soins visage Guinot/Payot, massages, epilation, cils, semi-permanent'],false,7),
          tr(['Site web','institutesthelia.fr'],false,8),
          tr(['Instagram','Aucun compte visible'],false,9),
        ]}),
        sp(15),
        conseil('Elle est gerante depuis 2005 — elle connait son metier. Ne la prends pas de haut. Valorise son experience.'),
        brk(),

        // -- Avis clients --
        h1('89% de ses clientes l\'adorent — et une demande le microblading'),ln(),
        p('On a analyse les 89 avis Google d\'Esthelia. Voici ce qui ressort.'),
        sp(10),
        ...(img('06-avis-sentiment.png',510,230)?[img('06-avis-sentiment.png',510,230)!]:[]),
        explication('A gauche, les barres montrent combien d\'avis ont 5 etoiles, 4, 3, etc. A droite, les mots que ses clientes utilisent le plus souvent.'),
        sp(15),
        box('"Meilleur institut de Paris. Je ne vais nulle part ailleurs depuis 10 ans." — Sophie M., 5 etoiles',GB,GD,false),
        sp(10),
        box('"Tres bon institut. Seul bemol : pas de prestations modernes type microblading." — Clara R., 4 etoiles',AB,AD,false),
        sp(10),
        attention('Cet avis de Clara est TON meilleur argument. Une cliente demande litteralement le microblading. Cite-le a Beatrice : "J\'ai lu vos avis — une cliente regrette que vous ne fassiez pas de microblading."'),
        sp(10),
        retiens('Reputation en or (4.8/5). Une cliente demande le microblading. Utilise ca dans ton appel.'),
        brk(),

        // -- Quartier & concurrents --
        h1('Son quartier est ideal — et ses concurrents ne font pas de microblading'),ln(),
        ...(mapBuf?[new Paragraph({alignment:AlignmentType.CENTER,spacing:{after:30},children:[new ImageRun({data:mapBuf,transformation:{width:500,height:220},type:'png'})]}),p('Carte OpenStreetMap — 73 Rue Oberkampf, Paris 11e',{italic:true,color:T3,size:14})]:[] ),
        sp(10),
        ...(img('09-carte-concurrents.png',480,360)?[img('09-carte-concurrents.png',480,360)!]:[]),
        explication('Le point bleu au centre c\'est Esthelia. Les points gris sont les concurrents. Les points ROUGES sont ceux qui font deja du microblading. La taille du point = le nombre d\'avis.'),
        sp(10),
        ...(img('14-comparaison-concurrents.png',500,260)?[img('14-comparaison-concurrents.png',500,260)!]:[]),
        explication('Chaque barre = un salon. Bleu = pas de microblading. Rouge = fait du microblading. Esthelia a la meilleure note.'),
        sp(10),
        new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:[
          tr(['Quartier','Valeur','Ce que ca veut dire'],true),
          tr(['Metros a 5 min','3 (L5, L9, L3)','Ses clientes viennent facilement'],false,0),
          tr(['Restaurants','60+','Zone tres vivante, beaucoup de passage'],false,1),
          tr(['Salons beaute','12 dans 500m','Concurrence forte MAIS aucun en dermo'],false,2),
          tr(['Trafic pieton','82/100','Les gens passent devant sa vitrine'],false,3),
        ]}),
        sp(10),
        retiens('12 concurrents dans 500m, mais seuls 3 font du microblading. Et Esthelia a la meilleure note (4.8). Si elle ajoute le microblading, elle devient incontournable.'),
        brk(),

        // ═══════════════════════════════════════════
        // PARTIE 2 — POURQUOI ELLE VA DIRE OUI
        // ═══════════════════════════════════════════
        partieHeader('2','POURQUOI ELLE VA DIRE OUI',IN),
        sp(20),

        // -- Forces & manques --
        h1('Elle a tout pour reussir — il lui manque juste UNE prestation'),ln(),
        ...(img('02-radar-premium.png',460,420)?[img('02-radar-premium.png',460,420)!]:[]),
        explication('Ce graphique montre 5 "forces" d\'Esthelia. En bleu c\'est elle, en rouge pointille c\'est la moyenne des salons du quartier. Plus c\'est grand, mieux c\'est.'),
        sp(10),
        h2('Ses forces (en vert)'),
        bul('Reputation 78/100 — Note 4.8 Google, top 5% de Paris. Ses clientes l\'adorent.',{color:GD}),
        bul('Quartier 82/100 — Oberkampf = fort passage, clientele 25-40 ans avec du pouvoir d\'achat.',{color:GD}),
        bul('Financier 58/100 — CA 156K pour 2 personnes, c\'est solide. Elle est pas en galere.',{color:GD}),
        sp(10),
        h2('Ses faiblesses (en rouge) = TES arguments'),
        bul('Activite digitale 35/100 — Pas d\'Instagram. Invisible pour les moins de 35 ans.',{color:R}),
        bul('Presence en ligne 55/100 — Site basique, pas de Planity.',{color:R}),
        sp(5),
        ...(img('11-scorecard-digital.png',500,220)?[img('11-scorecard-digital.png',500,220)!]:[]),
        explication('Chaque barre = un canal digital. Plus c\'est rempli, mieux c\'est. Instagram a 10/100 = quasi inexistant.'),
        sp(5),
        ...(img('12-horaires-compares.png',510,210)?[img('12-horaires-compares.png',510,210)!]:[]),
        explication('Les barres montrent les heures d\'ouverture. Esthelia (en bleu) ferme a 19h — ses concurrents restent ouverts plus tard.'),
        sp(10),
        conseil('Ton argument massue : "Le microblading genere du contenu Instagram naturellement. Chaque seance = 1 photo avant/apres. Ca va vous rendre visible sans effort."'),
        retiens('Elle a la reputation et le quartier. Il lui manque la prestation premium et la visibilite en ligne. Le microblading resout les deux en meme temps.'),
        brk(),

        // -- Ce qu'elle y gagne --
        h1('+50 000 EUR de CA par an — pour 2 jours de formation et 0 EUR'),ln(),
        ...(img('05-roi-waterfall.png',500,280)?[img('05-roi-waterfall.png',500,280)!]:[]),
        explication('Chaque barre ajoute du chiffre d\'affaires. Le gris c\'est son CA actuel. Le bleu c\'est le microblading. Le violet c\'est le Full Lips. Le vert c\'est le total.'),
        sp(10),
        ...(img('07-avant-apres.png',510,230)?[img('07-avant-apres.png',510,230)!]:[]),
        explication('A gauche : comparaison avant/apres sur 5 indicateurs. A droite : les 4 chiffres a retenir.'),
        sp(10),
        new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:[
          tr(['Indicateur','Aujourd\'hui','Avec microblading','Gain'],true),
          tr(['CA par mois','13 000 EUR','17 200 EUR','+4 200 EUR'],false,0),
          tr(['CA par an','156 000 EUR','206 000 EUR','+50 000 EUR'],false,1),
          tr(['Panier moyen','55 EUR','225 EUR','x4'],false,2),
          tr(['Marge nette','7%','18%','+11 points'],false,3),
          tr(['Cout formation','—','0 EUR (OPCO)','Gratuit'],false,4),
          tr(['Temps formation','—','2 jours','Laura tient le salon'],false,5),
          tr(['Remboursement','—','3 semaines','Avec 3 clientes/semaine'],false,6),
        ]}),
        sp(10),
        retiens('Formation de 2 jours. Cout : 0 EUR (OPCO). CA additionnel : +50 000 EUR/an. Remboursee en 3 semaines.'),
        brk(),

        // -- Demande du marche --
        h1('La demande de microblading n\'a jamais ete aussi forte a Paris'),ln(),
        ...(img('13-tendances-marche.png',500,220)?[img('13-tendances-marche.png',500,220)!]:[]),
        explication('La courbe montre combien de gens cherchent "microblading" a Paris chaque mois. Plus c\'est haut, plus la demande est forte. Il y a 2 pics : mars et octobre.'),
        sp(10),
        ...(img('10-demographie-quartier.png',510,230)?[img('10-demographie-quartier.png',510,230)!]:[]),
        explication('A gauche : les metiers des habitants du quartier (38% cadres). A droite : les chiffres cles du quartier (revenu, prix m2, etc.).'),
        sp(10),
        conseil('Argument : "Dans votre quartier, 38% de cadres avec un revenu median de 32 000 EUR. Ces gens-la sont prets a payer 200 EUR pour du microblading."'),
        retiens('La demande explose. Le quartier a le pouvoir d\'achat. Les concurrents n\'y sont presque pas. C\'est maintenant.'),
        brk(),

        // ═══════════════════════════════════════════
        // PARTIE 3 — COMMENT LUI VENDRE
        // ═══════════════════════════════════════════
        partieHeader('3','COMMENT LUI VENDRE',VI),
        sp(20),

        // -- Script --
        h1('Ton script mot pour mot — lis-le avant d\'appeler'),ln(),
        p('4 etapes. Chaque etape a un objectif. Adapte le ton mais garde la structure.',{italic:true,color:T2}),
        sp(15),

        box('ETAPE 1 — ACCROCHE (15 secondes)',BB,A),
        p('Objectif : capter son attention et montrer que t\'es pas un demarcheur random.',{size:17,color:T3}),
        sp(5),
        p('"Bonjour Beatrice, je suis [ton prenom] de Dermotec Advanced, le centre de formation Qualiopi au 75 boulevard Richard Lenoir — on est voisins dans le 11e ! J\'ai vu vos avis Google, 4.8 avec 89 avis, c\'est exceptionnel apres 25 ans. Bravo."',{italic:true}),
        conseil('"On est voisins" = elle baisse la garde. Citer le 4.8 et les 89 avis = elle sait que t\'as fait tes devoirs.'),
        sp(15),

        box('ETAPE 2 — TRANSITION (15 secondes)','EEF2FF',IN),
        p('Objectif : amener le sujet sans paraitre vendeur.',{size:17,color:T3}),
        sp(5),
        p('"Je vous appelle parce qu\'on accompagne des institutes de votre niveau a ajouter la dermopigmentation — microblading, maquillage permanent. C\'est une evolution naturelle quand on maitrise deja les soins du visage, et c\'est la prestation la plus demandee dans le 11e en ce moment."',{italic:true}),
        conseil('"De votre niveau" = tu la valorises. "Evolution naturelle" = pas un changement, une progression.'),
        sp(15),

        box('ETAPE 3 — LA PROPOSITION (30 secondes)','F5F3FF',VI),
        p('Objectif : lui donner LES chiffres. C\'est ca qui la fait reflechir.',{size:17,color:T3}),
        sp(5),
        p('"En 2 jours de formation, vous ou Laura maitrisez le microblading. C\'est une prestation entre 200 et 250 euros la seance. Avec 3 clientes par semaine — et vu votre reputation, ca ira vite — on parle de 2 700 euros de chiffre d\'affaires supplementaire par mois. Et comme votre SARL cotise a l\'OPCO EP depuis 25 ans, la formation est financee a 100%. Zero de votre poche."',{italic:true}),
        sp(5),
        retiens('Les 3 chiffres a sortir : 2 jours, 2 700 EUR/mois, 0 EUR de sa poche.'),
        sp(15),

        box('ETAPE 4 — LE CLOSING (15 secondes)',GB,GD),
        p('Objectif : obtenir un RDV. Pas vendre au telephone.',{size:17,color:T3}),
        sp(5),
        p('"Je ne vous demande rien aujourd\'hui sauf 15 minutes. Je passe au salon cette semaine avec les photos avant/apres et le simulateur de rentabilite. Si ca vous parle, on monte le dossier OPCO ensemble — ca prend 15 minutes et c\'est gratuit. Mardi ou mercredi, qu\'est-ce qui vous arrange ?"',{italic:true}),
        conseil('"Mardi ou mercredi" = question alternative. Elle choisit QUAND, pas SI. Ca double tes chances.'),
        brk(),

        // -- Objections --
        h1('Si elle dit non — tes reponses pretes'),ln(),
        p('Chaque "non" est un signe d\'interet. Si elle dit non, c\'est qu\'elle reflechit. Voici quoi repondre.',{italic:true,color:T2}),
        sp(15),

        // Objection 1
        box('"C\'est trop cher"',AB,AD),
        p('Ce qu\'elle pense vraiment : sa tresorerie est de 8 923 EUR. Elle ne peut pas sortir 1 400 EUR cash.',{italic:true,color:T2,size:18}),
        p('"Je comprends. C\'est justement pour ca que 80% de nos stagiaires ne paient rien. Votre SARL cotise a l\'OPCO EP depuis 1999. En 25 ans, vous avez accumule des droits. Je verifie votre eligibilite en 2 minutes, c\'est gratuit."',{italic:true,color:GD}),
        p('Si elle insiste : "Et sinon, paiement en 3 fois sans frais : 467 EUR par mois. Avec 2 700 EUR de CA supplementaire, c\'est 5 fois couvert."',{italic:true,color:AD,size:18}),
        sp(15),

        // Objection 2
        box('"J\'ai pas le temps, on est que deux"',AB,AD),
        p('Ce qu\'elle pense : si elle part 2 jours, Laura gere seule.',{italic:true,color:T2,size:18}),
        p('"2 jours seulement, un lundi-mardi. Laura tient le salon. Et ces 2 jours vont generer du CA pendant les 20 prochaines annees. C\'est le meilleur ratio temps/retour de toutes les formations."',{italic:true,color:GD}),
        sp(15),

        // Objection 3
        box('"Ca fait 25 ans que ca marche comme ca"',AB,AD),
        p('Ce qu\'elle pense : peur du changement. Son identite est construite sur 25 ans.',{italic:true,color:T2,size:18}),
        p('"Justement — 25 ans de base solide, c\'est pour ca que vous POUVEZ evoluer. La dermo ne remplace rien, elle s\'ajoute. Comme quand vous avez ajoute les massages balinais. Et vos clientes fideles seront les premieres a booker."',{italic:true,color:GD}),
        sp(15),

        // Objection 4
        box('"C\'est pas mon style, c\'est trop medical"',AB,AD),
        p('Ce qu\'elle pense : elle imagine des aiguilles et du medical. Son identite "zen" ne colle pas.',{italic:true,color:T2,size:18}),
        p('"Le microblading c\'est du maquillage semi-permanent — de l\'esthetique pure. Un stylo a micro-lames, pas de machine. C\'est un geste delicat et artistique. Le look \'no makeup makeup\' — ca colle parfaitement avec votre ambiance."',{italic:true,color:GD}),
        sp(15),

        // Objection 5
        box('"Laissez-moi reflechir"',AB,AD),
        p('Ce qu\'elle pense : interessee mais pas assez convaincue.',{italic:true,color:T2,size:18}),
        p('"Bien sur. Est-ce que je peux vous envoyer un dossier ? Les avant/apres de nos stagiaires avec leurs chiffres du premier mois. Comme ca vous reflechissez avec du concret. Par email ou je le depose au salon ?"',{italic:true,color:GD}),
        sp(10),
        retiens('Le "non" est normal. Chaque reponse est un pont vers le "oui". Reste calme, valorise son point de vue, et propose un next step concret.'),
        brk(),

        // -- Mots qui marchent --
        h1('Les mots qui marchent / les mots a eviter'),ln(),
        new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:[
          tr(['NE DIS PAS','DIS PLUTOT','POURQUOI'],true),
          tr(['"Formation"','"Nouvelle prestation pour votre salon"','Elle entend "ecole", pas "business"'],false,0),
          tr(['"Ca coute 1 400 EUR"','"C\'est finance a 100% par l\'OPCO"','Commence par le gratuit, pas le prix'],false,1),
          tr(['"Vous devriez..."','"D\'autres institutes comme le votre ont..."','Conseil = condescendant. Exemple = inspirant'],false,2),
          tr(['"Microblading"  (direct)','"Maquillage semi-permanent"  (d\'abord)','Moins technique, plus accessible'],false,3),
          tr(['"C\'est facile"','"C\'est une technique precise et artistique"','Ne minimise pas son futur savoir-faire'],false,4),
          tr(['"Vos concurrents le font"','"Vos clientes le demandent"','Pression concurrence = agressif. Demande client = naturel'],false,5),
        ]}),
        sp(10),
        retiens('Parle business, pas formation. Parle de SES clientes, pas de ses concurrents. Et mentionne le financement dans les 30 premieres secondes.'),
        brk(),

        // ═══════════════════════════════════════════
        // PARTIE 4 — LA SUITE
        // ═══════════════════════════════════════════
        partieHeader('4','LA SUITE',GD),
        sp(20),

        // -- Formations --
        h1('La formation parfaite pour Beatrice'),ln(),
        box('RECOMMANDATION N°1 — Microblading / Microshading',BB,A),
        p('1 400 EUR HT | 2 jours (14h) | Financement OPCO EP 100%',{bold:true}),
        bul('C\'est la suite logique de ses soins visage Guinot/Payot'),
        bul('Ses 89 clientes fideles seront les premieres a tester'),
        bul('Aucun concurrent direct ne le fait sur Oberkampf'),
        bul('Panier moyen x4 : de 55 EUR a 225 EUR la seance'),
        box('ROI : 225 EUR/seance x 3 clientes/semaine = 2 700 EUR/mois. Remboursee en 3 semaines.',GB,GD),
        sp(15),
        box('COMPLEMENT — Full Lips (Candy Lips)','F5F3FF',VI),
        p('1 400 EUR HT | A proposer APRES le microblading',{bold:true}),
        bul('Meme geste, meme clientele. 300 EUR/seance. +3 600 EUR/mois potentiel.'),
        sp(15),
        box('PLUS TARD — Rehaussement Cils + Volume Russe',LB,T2),
        p('890 EUR HT | Elle fait deja du rehaussement = montee en gamme directe.',{bold:true}),
        sp(20),

        // -- Financement --
        h1('Comment elle ne paie rien'),ln(),
        box('OPCO EP — SARL beaute depuis 1999. 25 ans de cotisations. Cout : 0 EUR.',GB,GD),
        sp(10),
        p('Sa SARL cotise a l\'OPCO EP depuis 25 ans. C\'est un organisme qui finance les formations des salaries et des dirigeants. Beatrice a accumule des droits — elle ne le sait peut-etre pas. On s\'occupe de tout le dossier.'),
        sp(10),
        h2('La phrase a dire'),
        box('"Votre SARL cotise a l\'OPCO depuis 25 ans. Ca fait beaucoup de droits accumules. On s\'occupe de toute la paperasse — ca prend 15 minutes."',GB,GD,false),
        sp(10),
        h2('Si l\'OPCO ne passe pas (rare)'),
        bul('CPF : si Beatrice ou Laura ont des droits sur Mon Compte Formation'),
        bul('Paiement en 3 fois sans frais : 467 EUR/mois pendant 3 mois'),
        bul('Paiement comptant avec remise 5% : 1 330 EUR HT'),
        sp(10),
        attention('Ne dis jamais "financement" en premier. Dis "on s\'occupe de tout pour que ca ne vous coute rien". C\'est plus naturel.'),
        brk(),

        // -- Plan --
        h1('Ton plan semaine par semaine'),ln(),
        ...(img('08-timeline-plan.png',520,160)?[img('08-timeline-plan.png',520,160)!]:[]),
        explication('Chaque point = une etape. Les gros points = les moments cles. En haut et en bas : ce que tu fais a chaque etape.'),
        sp(10),
        new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:[
          tr(['Quand','Ce que tu fais','Objectif'],true),
          tr(['Aujourd\'hui','Appeler au 01 48 05 15 67 entre 10h et 11h30','Decrocher un RDV au salon'],false,0),
          tr(['Si pas de reponse','Laisser un message vocal court : "Beatrice, [prenom] de Dermotec, voisin du 11e. Je rappelle demain."','Piquer sa curiosite'],false,1),
          tr(['Jour +1','Rappeler + envoyer email avec 3 photos avant/apres','Nourrir son interet'],false,2),
          tr(['Jour +3','Rappeler : "Avez-vous pu regarder les photos ?"','Fixer un creneau de passage'],false,3),
          tr(['Jour +7','Passer PHYSIQUEMENT au 73 rue Oberkampf avec le catalogue imprime','Le face-a-face change tout. Taux de conversion x3.'],false,4),
          tr(['Jour +14','Envoyer un temoignage video d\'une estheticienne qui a fait la formation','Conclure ou planifier un rappel mensuel'],false,5),
        ]}),
        sp(20),

        // Message final
        box('Beatrice a 25 ans d\'experience, 89 avis a 4.8 etoiles, et un quartier en or. Il lui manque juste UNE prestation pour devenir la reference d\'Oberkampf. Tu as tous les arguments, les chiffres, et le financement. A toi de jouer.',BB,A),
        sp(5),
        p('Bonne chance — et n\'oublie pas : tu ne vends pas une formation. Tu lui offres l\'opportunite de faire evoluer un quart de siecle de savoir-faire.',{italic:true,color:B}),
        sp(40),
        new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:'Rapport genere par Satorea CRM — Cout de production : 0,40 EUR — Donnees enrichies multi-sources',font:'Calibri',size:13,color:T4})]}),
        new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:'www.satorea.fr — contact@satorea.fr',font:'Calibri',size:13,color:T4})]}),
      ]},
    ],
  })

  const buf=await Packer.toBuffer(doc)
  const fn='Satorea-Briefing-V3-Esthelia.docx'
  writeFileSync(fn,buf)
  console.log(`\n${fn} (${(buf.length/1024).toFixed(0)} KB)`)
}

build().catch(e=>{console.error(e);process.exit(1)})
