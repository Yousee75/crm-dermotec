/**
 * RAPPORT MAXIMUM — 25+ pages, 15 images, 18 sections
 * Le rapport ultime style cabinet de conseil
 */
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, HeadingLevel, BorderStyle, ShadingType,
  Header, Footer, PageNumber, PageBreak, ImageRun,
} from 'docx'
import { writeFileSync, readFileSync, existsSync } from 'fs'

const B='2EC6F3',A='082545',G='10B981',GD='059669',AM='F59E0B',AD='D97706',R='EF4444',IN='6366F1',VI='8B5CF6',T='1E293B',T2='475569',T3='94A3B8',T4='CBD5E1',LB='F8FAFC',BB='F0F9FF',GB='ECFDF5',AB='FFFBEB'

const h1=(t:string)=>new Paragraph({heading:HeadingLevel.HEADING_1,spacing:{before:350,after:100},children:[new TextRun({text:t,font:'Calibri',size:32,bold:true,color:A})]})
const h3=(t:string)=>new Paragraph({heading:HeadingLevel.HEADING_3,spacing:{before:120,after:60},children:[new TextRun({text:t,font:'Calibri',size:22,bold:true,color:B})]})
const ln=()=>new Paragraph({spacing:{after:150},border:{bottom:{style:BorderStyle.SINGLE,size:6,color:B}},children:[]})
const p=(t:string,o?:any)=>new Paragraph({spacing:{after:60},children:[new TextRun({text:t,font:'Calibri',size:o?.size||21,color:o?.color||T,bold:o?.bold,italics:o?.italic})]})
const rich=(r:any[])=>new Paragraph({spacing:{after:60},children:r.map((x:any)=>new TextRun({text:x.text,font:'Calibri',size:x.size||21,color:x.color||T,bold:x.bold,italics:x.italic}))})
const bul=(t:string,o?:any)=>new Paragraph({bullet:{level:0},spacing:{after:30},children:[new TextRun({text:t,font:'Calibri',size:21,color:o?.color||T,bold:o?.bold})]})
const sp=(n=80)=>new Paragraph({spacing:{after:n},children:[]})
const box=(t:string,bg:string,fg:string)=>new Paragraph({spacing:{before:60,after:60},shading:{type:ShadingType.CLEAR,fill:bg},indent:{left:200,right:200},children:[new TextRun({text:'   '+t+'   ',font:'Calibri',size:22,color:fg,bold:true})]})
const brk=()=>new Paragraph({children:[new PageBreak()]})
function tr(c:string[],h=false,i=0){return new TableRow({children:c.map((x,j)=>new TableCell({shading:{type:ShadingType.CLEAR,fill:h?A:i%2===0?LB:'FFFFFF'},margins:{top:40,bottom:40,left:80,right:80},children:[new Paragraph({children:[new TextRun({text:x,font:'Calibri',size:18,bold:h||j===0,color:h?'FFFFFF':j===0?A:T})]})],}))})}
function kpi(l:string,v:string,c:string){return new TableCell({shading:{type:ShadingType.CLEAR,fill:LB},margins:{top:60,bottom:60,left:80,right:80},children:[new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:v,font:'Calibri',size:28,bold:true,color:c})]}),new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:l,font:'Calibri',size:14,color:T3})]})]})}
function img(n:string,w:number,h:number){const f=`./charts/${n}`;if(!existsSync(f))return null;return new Paragraph({alignment:AlignmentType.CENTER,spacing:{before:80,after:80},children:[new ImageRun({data:readFileSync(f),transformation:{width:w,height:h},type:'png'})]})}

async function build(){
  console.log('=== RAPPORT MAXIMUM ===\n')
  let mapBuf:Buffer|null=null
  try{const SM=(await import('staticmaps')).default;const m=new SM({width:640,height:280,tileUrl:'https://tile.openstreetmap.org/{z}/{x}/{y}.png',tileSize:256,tileRequestHeader:{'User-Agent':'SatoreaCRM/1.0'}});await m.render([2.3783,48.8648],15);mapBuf=await m.image.buffer('image/png') as Buffer;console.log('Carte OSM: OK')}catch{console.log('Carte OSM: skip')}
  const date=new Date().toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'})

  const doc=new Document({
    styles:{default:{document:{run:{font:'Calibri',size:21,color:T}}}},
    sections:[
      // COUVERTURE
      {properties:{page:{margin:{top:1440,bottom:1440,left:1440,right:1440}}},children:[
        sp(400),
        new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:'SATOREA',font:'Calibri',size:56,bold:true,color:B})]}),
        new Paragraph({alignment:AlignmentType.CENTER,spacing:{after:150},children:[new TextRun({text:'Briefing Commercial Intelligence — Edition Premium',font:'Calibri',size:22,color:T3})]}),
        sp(100),new Paragraph({alignment:AlignmentType.CENTER,border:{bottom:{style:BorderStyle.SINGLE,size:6,color:B,space:1}},children:[]}),sp(100),
        new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:'Rapport Prospect Complet',font:'Calibri',size:36,bold:true,color:A})]}),
        sp(50),
        new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:'Beatrice Pignol — Esthelia',font:'Calibri',size:28,color:T})]}),
        new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:'73 Rue Oberkampf, 75011 Paris',font:'Calibri',size:20,color:T3})]}),
        sp(100),
        ...(img('01-gauge-score.png',250,180)?[img('01-gauge-score.png',250,180)!]:[box('SCORE : 64/100 — TIEDE',AB,AD)]),
        sp(150),
        new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:date+' — 18 sections | 15 graphiques | Donnees enrichies multi-sources',font:'Calibri',size:16,color:T3})]}),
        new Paragraph({alignment:AlignmentType.CENTER,spacing:{before:250},children:[new TextRun({text:'Confidentiel — Satorea CRM',font:'Calibri',size:14,color:T4})]}),
      ]},

      // CONTENU
      {properties:{page:{margin:{top:1000,bottom:1000,left:1000,right:1000}}},
       headers:{default:new Header({children:[new Paragraph({border:{bottom:{style:BorderStyle.SINGLE,size:2,color:B}},children:[new TextRun({text:'SATOREA',font:'Calibri',size:14,bold:true,color:B}),new TextRun({text:'   |   Esthelia — Beatrice Pignol — Edition Premium',font:'Calibri',size:12,color:T3})]})]})} ,
       footers:{default:new Footer({children:[new Paragraph({alignment:AlignmentType.RIGHT,children:[new TextRun({text:'Satorea CRM — Page ',font:'Calibri',size:12,color:T3}),new TextRun({children:[PageNumber.CURRENT],font:'Calibri',size:12,color:T3})]})]})} ,
       children:[
        // SOMMAIRE
        h1('Sommaire'),ln(),
        ...['1. Verdict & Score Global','2. Analyse Multi-Axes','3. Analyse des Avis Clients','4. Carte & Environnement Local',
          '5. Analyse Concurrentielle','6. Demographie & Pouvoir d\'Achat','7. Presence Digitale','8. Comparaison Horaires',
          '9. Tendances du Marche','10. Parcours Prospect','11. Business Case & ROI','12. Funnel de Conversion',
          '13. Strategie d\'Approche','14. Script Telephonique','15. Objections & Contre-Arguments',
          '16. Douleurs & Leviers','17. Formations Recommandees & Financement','18. Plan d\'Action'].map(t=>p(t,{bold:true,color:A})),
        brk(),

        // 1. VERDICT
        h1('1. Verdict & Score Global'),ln(),
        new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:[new TableRow({children:[kpi('Note Google','4.8/5',B),kpi('Avis','89',IN),kpi('CA','156K',G),kpi('Effectif','2',VI),kpi('Score','64/100',AM)]})]}),
        sp(30),box('Prospect tiede a fort potentiel — 25 ans, 4.8 Google, quartier ideal. Manque la dermopigmentation.',AB,AD),
        p('Institut depuis 1999, reputation top 5% Paris. Zero dermo. SARL eligible OPCO. Frein : conservatisme. Angle : evolution naturelle.'),
        brk(),

        // 2. ANALYSE 5 AXES
        h1('2. Analyse Multi-Axes'),ln(),
        p('Bleu = Esthelia. Rouge pointille = moyenne secteur.'),
        ...(img('02-radar-premium.png',480,440)?[img('02-radar-premium.png',480,440)!]:[]),
        h3('Lecture strategique'),
        rich([{text:'Quartier (82) : ',bold:true,color:'14B8A6'},{text:'Oberkampf = fort trafic, CSP+ 25-40 ans.'}]),
        rich([{text:'Reputation (78) : ',bold:true,color:G},{text:'4.8/5, 89 avis, top 5%.'}]),
        rich([{text:'Financier (58) : ',bold:true,color:AM},{text:'CA 156K, tresorerie juste. OPCO obligatoire.'}]),
        rich([{text:'Presence (55) : ',bold:true,color:'3B82F6'},{text:'Pas d\'Instagram = invisible <35 ans.'}]),
        rich([{text:'Activite (35) : ',bold:true,color:VI},{text:'Point faible #1 = argument massue contenu.'}]),
        brk(),

        // 3. AVIS
        h1('3. Analyse des Avis Clients'),ln(),
        ...(img('06-avis-sentiment.png',530,240)?[img('06-avis-sentiment.png',530,240)!]:[]),
        sp(20),
        box('"Seul bemol : pas de microblading." — Clara R., 4 etoiles',AB,AD),
        p('Cite cet avis a Beatrice : la demande existe, ses propres clientes le disent.',{bold:true,color:B}),
        box('"Meilleur institut de Paris. Beatrice est exceptionnelle." — Sophie M., 5 etoiles',GB,GD),
        brk(),

        // 4. CARTE
        h1('4. Localisation & Environnement'),ln(),
        ...(mapBuf?[new Paragraph({alignment:AlignmentType.CENTER,spacing:{after:40},children:[new ImageRun({data:mapBuf,transformation:{width:520,height:230},type:'png'})]}),p('Carte OpenStreetMap — 73 Rue Oberkampf, Paris 11e',{italic:true,color:T3,size:16})]:[] ),
        sp(20),
        new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:[
          tr(['Zone','Valeur','Impact'],true),
          tr(['Metros','3 (L5, L9, L3)','Tres accessible'],false,0),
          tr(['Restaurants','60+','Zone tres animee'],false,1),
          tr(['Concurrents beaute','12 dans 500m','Aucun en dermopigmentation'],false,2),
          tr(['Trafic pieton','82/100','Zone premium'],false,3),
        ]}),
        brk(),

        // 5. CONCURRENTS
        h1('5. Analyse Concurrentielle'),ln(),
        p('12 concurrents identifies dans un rayon de 500m. Seuls 3 proposent du microblading.'),
        ...(img('09-carte-concurrents.png',500,375)?[img('09-carte-concurrents.png',500,375)!]:[]),
        sp(20),
        ...(img('14-comparaison-concurrents.png',520,280)?[img('14-comparaison-concurrents.png',520,280)!]:[]),
        sp(20),
        box('Esthelia a la MEILLEURE note du quartier (4.8) — ajouter le microblading = devenir incontournable',GB,GD),
        brk(),

        // 6. DEMOGRAPHIE
        h1('6. Demographie & Pouvoir d\'Achat'),ln(),
        p('Donnees INSEE IRIS — Paris 11e arrondissement.'),
        ...(img('10-demographie-quartier.png',530,240)?[img('10-demographie-quartier.png',530,240)!]:[]),
        sp(20),
        box('38% cadres + revenu median 32K = clientele prete a payer 200 EUR une seance microblading',BB,A),
        brk(),

        // 7. DIGITAL
        h1('7. Presence Digitale'),ln(),
        ...(img('11-scorecard-digital.png',520,240)?[img('11-scorecard-digital.png',520,240)!]:[]),
        sp(20),
        p('Point critique : ZERO Instagram. C\'est sa faiblesse #1 et ton argument #1.',{bold:true,color:R}),
        p('Le microblading genere du contenu avant/apres naturellement. Chaque seance = 1 post Instagram. Argument : "Le microblading resout votre probleme de visibilite."'),
        brk(),

        // 8. HORAIRES
        h1('8. Comparaison Horaires'),ln(),
        ...(img('12-horaires-compares.png',530,220)?[img('12-horaires-compares.png',530,220)!]:[]),
        sp(20),
        p('Esthelia ferme a 19h — ses concurrents ouvrent jusqu\'a 20-21h et certains le dimanche.',{bold:true,color:AM}),
        p('Argument potentiel : le microblading peut se faire en creneau calme (10h-12h) sans impacter les horaires.'),
        brk(),

        // 9. TENDANCES
        h1('9. Tendances du Marche'),ln(),
        ...(img('13-tendances-marche.png',520,230)?[img('13-tendances-marche.png',520,230)!]:[]),
        sp(20),
        box('La demande de microblading a Paris n\'a jamais ete aussi haute. 2 pics annuels : mars et octobre.',BB,A),
        p('Argument : "C\'est LE moment pour ajouter cette prestation — la demande est au maximum."'),
        brk(),

        // 10. PARCOURS
        h1('10. Parcours Prospect'),ln(),
        ...(img('04-schema-parcours.png',540,180)?[img('04-schema-parcours.png',540,180)!]:[]),
        p('De l\'appel a la premiere cliente en 5 semaines. Chaque etape detaillee dans le plan d\'action.'),
        brk(),

        // 11. ROI
        h1('11. Business Case & ROI'),ln(),
        ...(img('05-roi-waterfall.png',520,290)?[img('05-roi-waterfall.png',520,290)!]:[]),
        sp(20),
        ...(img('07-avant-apres.png',530,240)?[img('07-avant-apres.png',530,240)!]:[]),
        sp(20),
        new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:[
          tr(['Indicateur','Aujourd\'hui','Avec microblading','Delta'],true),
          tr(['CA mensuel','13 000 EUR','17 200 EUR','+4 200 EUR'],false,0),
          tr(['CA annuel','156 000 EUR','206 400 EUR','+50 400 EUR'],false,1),
          tr(['Panier moyen','55 EUR','225 EUR','x4'],false,2),
          tr(['Marge nette','7.2%','~18%','+11 pts'],false,3),
        ]}),
        box('Investissement : 0 EUR (OPCO) | Remboursement : 3 semaines | Impact : +50 400 EUR/an',GB,GD),
        brk(),

        // 12. FUNNEL
        h1('12. Funnel de Conversion'),ln(),
        ...(img('03-funnel-conversion.png',500,250)?[img('03-funnel-conversion.png',500,250)!]:[]),
        brk(),

        // 13. STRATEGIE
        h1('13. Strategie d\'Approche'),ln(),
        new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:[
          tr(['Parametre','Recommandation','Pourquoi'],true),
          tr(['Canal','Appel fixe','Direct, pas d\'email'],false,0),
          tr(['Numero','01 48 05 15 67','Fixe salon'],false,1),
          tr(['Jour','Mardi ou mercredi','Jours calmes'],false,2),
          tr(['Heure','10h-11h30','Avant les RDV'],false,3),
          tr(['Duree','7-10 min','Droit au but'],false,4),
          tr(['Angle','Evolution 25 ans','Pas "formation" mais "prestation"'],false,5),
          tr(['Objectif','RDV passage salon','Face-a-face = conversion 3x'],false,6),
        ]}),
        brk(),

        // 14. SCRIPT
        h1('14. Script Telephonique'),ln(),
        box('ETAPE 1 — ACCROCHE',BB,A),
        p('"Bonjour Beatrice, [Prenom] de Dermotec Advanced, voisins dans le 11e ! 4.8 Google, 89 avis, exceptionnel apres 25 ans."',{italic:true}),
        bul('"Voisins" + cite les avis = confiance immediate',{color:T2}),
        sp(20),
        box('ETAPE 2 — TRANSITION','EEF2FF',IN),
        p('"On accompagne des institutes de votre niveau. Evolution naturelle pour une pro des soins du visage."',{italic:true}),
        sp(20),
        box('ETAPE 3 — PROPOSITION','F5F3FF',VI),
        p('"2 jours, 225 EUR/seance, 3 clientes/sem = 2 700 EUR/mois. OPCO = 0 EUR de votre poche."',{italic:true}),
        sp(20),
        box('ETAPE 4 — CLOSING',GB,GD),
        p('"Je passe au salon avec les avant/apres. 15 min, gratuit. Mardi ou mercredi ?"',{italic:true}),
        brk(),

        // 15. OBJECTIONS
        h1('15. Objections & Contre-Arguments'),ln(),
        ...([
          ['"Trop cher"','Tresorerie 8 923 EUR.','OPCO depuis 1999. 25 ans droits. 0 EUR.','3x 467 EUR/mois.'],
          ['"Pas le temps"','2 personnes.','2 jours lundi-mardi. Laura tient.',''],
          ['"25 ans que ca marche"','Peur changement.','25 ans = base solide pour evoluer.',''],
          ['"Trop medical"','Associe a l\'injectable.','Maquillage semi-permanent. Geste artistique.',''],
          ['"Je reflechis"','Pas convaincue.','Dossier avant/apres + chiffres 1er mois.',''],
        ] as string[][]).flatMap(([t,pe,rep,alt])=>[box(t,AB,AD),p(`"${pe}"`,{italic:true,color:T2,size:18}),p(`"${rep}"`,{italic:true,color:GD}),...(alt?[p(`Si insiste : "${alt}"`,{italic:true,color:AD,size:18})]:[]),sp(15)]),
        brk(),

        // 16. DOULEURS
        h1('16. Douleurs & Leviers'),ln(),
        h3('Douleurs'),
        bul('Plafond CA 156K, marge 7.2%',{color:R}),bul('0 prestation premium >100 EUR',{color:R}),
        bul('12 concurrents dans 500m',{color:R}),bul('0 Instagram',{color:R}),
        bul('Un avis demande le microblading',{color:R}),
        sp(15),h3('Aspirations'),
        bul('Perenniser 25 ans',{color:GD}),bul('Monter en gamme',{color:GD}),
        bul('Augmenter CA sans embaucher',{color:GD}),bul('Reference dermo Oberkampf',{color:GD}),
        sp(15),
        rich([{text:'JAMAIS dire "formation". ',bold:true,color:R},{text:'Dire : "evolution naturelle", "prestation premium", "2 jours pour 20 ans".'}]),
        brk(),

        // 17. FORMATIONS + FINANCEMENT
        h1('17. Formations & Financement'),ln(),
        box('PRINCIPAL — Microblading / Microshading — 1 400 EUR HT',BB,A),
        p('2 jours | OPCO EP | Panier moyen x4'),
        bul('ROI : 225 EUR/seance x 3/sem = 2 700 EUR/mois. Rembourse en 3 semaines.',{bold:true,color:GD}),
        sp(15),
        box('COMPLEMENTAIRE — Full Lips — 1 400 EUR HT','F5F3FF',VI),
        bul('300 EUR/seance. +3 600 EUR/mois.'),
        sp(15),
        box('UPSELL — Rehaussement Cils — 890 EUR HT',LB,T2),
        bul('Prestation recurrente, fidelisation max.'),
        sp(30),
        box('FINANCEMENT : OPCO EP — 0 EUR. 25 ans de cotisations accumulees.',GB,GD),
        p('"Votre SARL cotise depuis 25 ans — il serait dommage de ne pas utiliser vos droits."',{italic:true,color:GD}),
        bul('Alternative CPF | AGEFICE | 3x sans frais 467 EUR/mois'),
        brk(),

        // 18. PLAN D'ACTION
        h1('18. Plan d\'Action'),ln(),
        ...(img('08-timeline-plan.png',540,170)?[img('08-timeline-plan.png',540,170)!]:[]),
        sp(15),
        new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:[
          tr(['Quand','Action','Objectif'],true),
          tr(['J0','Appeler 01 48 05 15 67 (10h-11h30)','RDV au salon'],false,0),
          tr(['J+1','Message vocal + curiosite','Elle rappelle'],false,1),
          tr(['J+1','Email avant/apres + simulateur ROI','Nourrir'],false,2),
          tr(['J+3','"Vu les photos ?"','Creneau de passage'],false,3),
          tr(['J+7','PHYSIQUEMENT 73 rue Oberkampf','Conversion 3x'],false,4),
          tr(['J+14','Temoignage video stagiaire','Conclure'],false,5),
        ]}),
        sp(120),
        box('25 ans, 89 avis a 4.8, quartier en or. Ne vends pas une formation — offre l\'evolution d\'un quart de siecle de savoir-faire.',BB,A),
        sp(30),
        new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:'Satorea CRM — www.satorea.fr — Rapport genere automatiquement | Cout : 0.40 EUR',font:'Calibri',size:14,color:T4})]}),
      ]},
    ],
  })

  const buf=await Packer.toBuffer(doc)
  const fn='Satorea-Briefing-MAXIMUM-Esthelia.docx'
  writeFileSync(fn,buf)
  console.log(`\n${fn} (${(buf.length/1024).toFixed(0)} KB)`)
  console.log('18 sections | 15 images | 25+ pages')
}

build().catch(e=>{console.error(e);process.exit(1)})
