/**
 * RAPPORT V4 — Mise en forme professionnelle
 * Marges correctes, sommaire sophistiqué, identité visuelle forte
 * Séparateurs, espacements, bandeaux, pédagogie
 */
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, HeadingLevel, BorderStyle, ShadingType,
  Header, Footer, PageNumber, PageBreak, ImageRun, TabStopType, TabStopPosition,
} from 'docx'
import { writeFileSync, readFileSync, existsSync } from 'fs'

// ═══ COULEURS ═══
const B='2EC6F3',A='082545',G='10B981',GD='059669',AM='F59E0B',AD='D97706',R='EF4444'
const IN='6366F1',VI='8B5CF6',T='1E293B',T2='475569',T3='94A3B8',T4='CBD5E1'
const LB='F8FAFC',BB='F0F9FF',GB='ECFDF5',AB='FFFBEB'

// ═══ HELPERS AMÉLIORES ═══

// Titre H1 — grand, espacé du haut, avec barre cyan en dessous
function titre(t:string){
  return [
    new Paragraph({spacing:{before:500,after:40},children:[new TextRun({text:t,font:'Calibri',size:30,bold:true,color:A})]}),
    new Paragraph({spacing:{after:200},border:{bottom:{style:BorderStyle.SINGLE,size:8,color:B}},children:[]}),
  ]
}

// Sous-titre H2
function sousTitre(t:string){
  return new Paragraph({spacing:{before:300,after:80},children:[new TextRun({text:t,font:'Calibri',size:24,bold:true,color:B})]})
}

// Paragraphe
function p(t:string,o?:any){
  return new Paragraph({spacing:{before:20,after:60},indent:{left:o?.indent||0},children:[new TextRun({text:t,font:'Calibri',size:o?.size||20,color:o?.color||T,bold:o?.bold,italics:o?.italic})]})
}

// Rich text
function rich(r:any[]){
  return new Paragraph({spacing:{before:20,after:60},children:r.map((x:any)=>new TextRun({text:x.text,font:'Calibri',size:x.size||20,color:x.color||T,bold:x.bold,italics:x.italic}))})
}

// Bullet
function bul(t:string,o?:any){
  return new Paragraph({bullet:{level:0},spacing:{before:10,after:30},children:[new TextRun({text:t,font:'Calibri',size:20,color:o?.color||T,bold:o?.bold})]})
}

// Spacer
function sp(n=100){return new Paragraph({spacing:{after:n},children:[]})}

// Page break
function brk(){return new Paragraph({children:[new PageBreak()]})}

// Séparateur léger (ligne grise fine entre sous-sections)
function sep(){
  return new Paragraph({spacing:{before:100,after:100},border:{bottom:{style:BorderStyle.SINGLE,size:2,color:'E2E8F0'}},children:[]})
}

// ═══ ENCADRÉS PÉDAGOGIQUES ═══

// Encadré coloré avec titre
function encadre(titre:string,texte:string,bg:string,fg:string,borderColor:string){
  return [
    new Paragraph({spacing:{before:80,after:0},shading:{type:ShadingType.CLEAR,fill:bg},
      indent:{left:200,right:200},border:{left:{style:BorderStyle.SINGLE,size:14,color:borderColor}},
      children:[new TextRun({text:'   '+titre,font:'Calibri',size:18,bold:true,color:fg})]}),
    new Paragraph({spacing:{before:0,after:80},shading:{type:ShadingType.CLEAR,fill:bg},
      indent:{left:200,right:200},border:{left:{style:BorderStyle.SINGLE,size:14,color:borderColor}},
      children:[new TextRun({text:'   '+texte,font:'Calibri',size:20,color:fg})]}),
  ]
}

// RETIENS — jaune
function retiens(t:string){return encadre('A RETENIR',t,AB,AD,AM)}

// CONSEIL — vert
function conseil(t:string){return encadre('CONSEIL',t,GB,GD,G)}

// ATTENTION — rouge
function attention(t:string){return encadre('ATTENTION',t,'FEF2F2',R,R)}

// Box simple
function box(t:string,bg:string,fg:string){
  return new Paragraph({spacing:{before:60,after:60},shading:{type:ShadingType.CLEAR,fill:bg},
    indent:{left:200,right:200},children:[new TextRun({text:'   '+t+'   ',font:'Calibri',size:21,color:fg,bold:true})]})}

// Explication graphique
function explication(t:string){
  return new Paragraph({spacing:{before:30,after:60},indent:{left:200},
    children:[
      new TextRun({text:'Comment lire ce graphique : ',font:'Calibri',size:16,bold:true,color:B}),
      new TextRun({text:t,font:'Calibri',size:16,color:T3,italics:true}),
    ]})}

// Tableau
function tr(c:string[],h=false,i=0){return new TableRow({children:c.map((x,j)=>new TableCell({
  shading:{type:ShadingType.CLEAR,fill:h?A:i%2===0?LB:'FFFFFF'},
  margins:{top:50,bottom:50,left:100,right:100},
  children:[new Paragraph({children:[new TextRun({text:x,font:'Calibri',size:17,bold:h||j===0,color:h?'FFFFFF':j===0?A:T})]})],
}))})}

function kpi(l:string,v:string,c:string){return new TableCell({
  shading:{type:ShadingType.CLEAR,fill:LB},margins:{top:70,bottom:70,left:80,right:80},
  children:[
    new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:v,font:'Calibri',size:28,bold:true,color:c})]}),
    new Paragraph({alignment:AlignmentType.CENTER,spacing:{before:20},children:[new TextRun({text:l,font:'Calibri',size:13,color:T3})]}),
  ]})}

function img(n:string,w:number,h:number){
  const f=`./charts/${n}`;if(!existsSync(f))return null
  return new Paragraph({alignment:AlignmentType.CENTER,spacing:{before:80,after:80},
    children:[new ImageRun({data:readFileSync(f),transformation:{width:w,height:h},type:'png'})]})}

// Bandeau de partie — gros, coloré, identitaire
function bandeau(num:string,titre:string,color:string){
  return [
    sp(200),
    new Paragraph({spacing:{before:0,after:0},shading:{type:ShadingType.CLEAR,fill:color},
      indent:{left:0,right:0},children:[
        new TextRun({text:`\n`,font:'Calibri',size:10}),
      ]}),
    new Paragraph({spacing:{before:0,after:0},shading:{type:ShadingType.CLEAR,fill:color},
      indent:{left:300,right:300},children:[
        new TextRun({text:`PARTIE ${num}`,font:'Calibri',size:14,bold:true,color:'FFFFFF'}),
      ]}),
    new Paragraph({spacing:{before:0,after:0},shading:{type:ShadingType.CLEAR,fill:color},
      indent:{left:300,right:300},children:[
        new TextRun({text:titre,font:'Calibri',size:28,bold:true,color:'FFFFFF'}),
      ]}),
    new Paragraph({spacing:{before:0,after:200},shading:{type:ShadingType.CLEAR,fill:color},
      indent:{left:0,right:0},children:[
        new TextRun({text:`\n`,font:'Calibri',size:10}),
      ]}),
  ]
}

// Sommaire sophistiqué — tableau sans bordure avec leaders
function sommaire(){
  const items=[
    {num:'',titre:'L\'essentiel avant d\'appeler',page:'3'},
    {num:'1',titre:'QUI TU APPELLES',page:''},
    {num:'1.1',titre:'Fiche prospect — Beatrice Pignol',page:'4'},
    {num:'1.2',titre:'Ce que ses clientes disent d\'elle',page:'5'},
    {num:'1.3',titre:'Son quartier et ses concurrents',page:'6'},
    {num:'2',titre:'POURQUOI ELLE VA DIRE OUI',page:''},
    {num:'2.1',titre:'Ses forces et ses manques',page:'8'},
    {num:'2.2',titre:'Ce qu\'elle y gagne (+50 000 EUR/an)',page:'10'},
    {num:'2.3',titre:'La demande dans son quartier',page:'11'},
    {num:'3',titre:'COMMENT LUI VENDRE',page:''},
    {num:'3.1',titre:'Ton script mot pour mot',page:'13'},
    {num:'3.2',titre:'Si elle dit non — tes reponses',page:'15'},
    {num:'3.3',titre:'Les mots qui marchent / a eviter',page:'16'},
    {num:'4',titre:'LA SUITE',page:''},
    {num:'4.1',titre:'La formation parfaite pour elle',page:'18'},
    {num:'4.2',titre:'Comment elle ne paie rien',page:'19'},
    {num:'4.3',titre:'Ton plan semaine par semaine',page:'20'},
  ]
  return items.map(item=>{
    const isPartie=item.page===''
    return new Paragraph({
      spacing:{before:isPartie?120:20,after:isPartie?40:20},
      indent:{left:isPartie?0:300},
      children:[
        ...(item.num?[new TextRun({text:item.num+'   ',font:'Calibri',size:isPartie?20:18,bold:isPartie,color:isPartie?A:B})]:[]),
        new TextRun({text:item.titre,font:'Calibri',size:isPartie?20:18,bold:isPartie,color:isPartie?A:T}),
        ...(!isPartie?[new TextRun({text:'  ......................................  ',font:'Calibri',size:14,color:T4}),
          new TextRun({text:item.page,font:'Calibri',size:18,color:T3})]:[]),
      ]})
  })
}

async function build(){
  console.log('=== RAPPORT V4 — Mise en forme professionnelle ===\n')

  let mapBuf:Buffer|null=null
  try{const SM=(await import('staticmaps')).default;const m=new SM({width:640,height:280,tileUrl:'https://tile.openstreetmap.org/{z}/{x}/{y}.png',tileSize:256,tileRequestHeader:{'User-Agent':'SatoreaCRM/1.0'}});await m.render([2.3783,48.8648],15);mapBuf=await m.image.buffer('image/png') as Buffer;console.log('Carte: OK')}catch{console.log('Carte: skip')}
  const date=new Date().toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'})

  const doc=new Document({
    styles:{default:{document:{run:{font:'Calibri',size:20,color:T}}}},
    sections:[
      // ═══════════════════════════════════════
      // COUVERTURE
      // ═══════════════════════════════════════
      {properties:{page:{margin:{top:1800,bottom:1440,left:1440,right:1440}}},
       footers:{default:new Footer({children:[new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:'Document confidentiel — Satorea CRM — '+date,font:'Calibri',size:12,color:T4})]})]})},
       children:[
        // Barre cyan en haut
        new Paragraph({spacing:{after:0},border:{top:{style:BorderStyle.SINGLE,size:18,color:B}},children:[]}),
        sp(500),
        new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:'SATOREA',font:'Calibri',size:56,bold:true,color:B,characterSpacing:200})]}),
        sp(30),
        new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:'BRIEFING PROSPECT',font:'Calibri',size:20,bold:true,color:T3,characterSpacing:400})]}),
        sp(150),
        new Paragraph({alignment:AlignmentType.CENTER,border:{bottom:{style:BorderStyle.SINGLE,size:4,color:B}},indent:{left:2500,right:2500},children:[]}),
        sp(150),
        new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:'Beatrice Pignol',font:'Calibri',size:32,bold:true,color:A})]}),
        new Paragraph({alignment:AlignmentType.CENTER,spacing:{after:20},children:[new TextRun({text:'Esthelia — Institut de Beaute',font:'Calibri',size:22,color:T2})]}),
        new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:'73 Rue Oberkampf, 75011 Paris',font:'Calibri',size:18,color:T3})]}),
        sp(120),
        ...(img('01-gauge-score.png',220,155)?[img('01-gauge-score.png',220,155)!]:[box('SCORE : 64/100 — TIEDE',AB,AD)]),
        sp(200),
        new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:date,font:'Calibri',size:16,color:T3})]}),
        sp(20),
        new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:'4 parties  |  14 graphiques  |  Donnees enrichies multi-sources',font:'Calibri',size:14,color:T4})]}),
        // Barre bleu nuit en bas
        sp(100),
        new Paragraph({spacing:{after:0},border:{bottom:{style:BorderStyle.SINGLE,size:18,color:A}},children:[]}),
      ]},

      // ═══════════════════════════════════════
      // SOMMAIRE + CONTENU
      // ═══════════════════════════════════════
      {properties:{page:{margin:{top:1200,bottom:1200,left:1200,right:1200}}},
       headers:{default:new Header({children:[
        new Paragraph({spacing:{after:80},border:{bottom:{style:BorderStyle.SINGLE,size:3,color:B}},children:[
          new TextRun({text:'SATOREA',font:'Calibri',size:14,bold:true,color:B,characterSpacing:100}),
          new TextRun({text:'      Briefing Prospect — Esthelia',font:'Calibri',size:12,color:T3}),
        ]}),
       ]})},
       footers:{default:new Footer({children:[
        new Paragraph({spacing:{before:60},border:{top:{style:BorderStyle.SINGLE,size:2,color:'E2E8F0'}},children:[]}),
        new Paragraph({alignment:AlignmentType.CENTER,children:[
          new TextRun({text:'Satorea CRM — Confidentiel — ',font:'Calibri',size:11,color:T4}),
          new TextRun({text:'Page ',font:'Calibri',size:11,color:T3}),
          new TextRun({children:[PageNumber.CURRENT],font:'Calibri',size:11,color:T3}),
        ]}),
       ]})},
       children:[

        // ═══ SOMMAIRE ═══
        ...titre('Sommaire'),
        sp(30),
        p('Ce document est organise en 4 parties. Chaque partie repond a une question.',{size:18,color:T2}),
        sp(20),
        new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:[
          new TableRow({children:[A,B,IN,VI].map((c,i)=>new TableCell({
            shading:{type:ShadingType.CLEAR,fill:c},margins:{top:40,bottom:40,left:60,right:60},
            children:[new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:['Partie 1','Partie 2','Partie 3','Partie 4'][i],font:'Calibri',size:14,bold:true,color:'FFFFFF'})]}),
              new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:['Qui tu appelles','Pourquoi elle\nva dire oui','Comment\nlui vendre','La suite'][i],font:'Calibri',size:11,color:'FFFFFF'})]})],
          }))}),
        ]}),
        sp(40),
        ...sommaire(),
        sp(40),
        p('Temps de lecture estime : 10 minutes pour tout | 2 minutes pour l\'essentiel (page suivante)',{size:16,color:T3,italic:true}),
        brk(),

        // ═══ L'ESSENTIEL ═══
        ...titre('L\'essentiel avant d\'appeler'),
        p('Si tu n\'as que 2 minutes, lis juste cette page. Tu sauras tout ce qu\'il faut pour decrocher ton telephone.',{italic:true,color:T2,size:18}),
        sp(40),
        new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:[new TableRow({children:[kpi('Note Google','4.8/5',B),kpi('Avis clients','89',IN),kpi('CA annuel','156K',G),kpi('Effectif','2 pers.',VI),kpi('Score Satorea','64/100',AM)]})]}),
        sp(40),
        ...retiens('Beatrice dirige un institut depuis 25 ans a Oberkampf. Note Google 4.8 (top 5% Paris). Elle ne fait PAS de microblading — c\'est exactement ce que tu vas lui proposer. Une de ses clientes le demande dans un avis.'),
        sp(30),
        sousTitre('Tes 3 actions'),
        rich([{text:'1. ',bold:true,color:B,size:22},{text:'Appelle-la mardi ou mercredi entre 10h et 11h30 au ',size:22},{text:'01 48 05 15 67',bold:true,color:A,size:22}]),
        rich([{text:'2. ',bold:true,color:IN,size:22},{text:'Propose un RDV de 15 min au salon — passe avec les photos avant/apres',size:22}]),
        rich([{text:'3. ',bold:true,color:VI,size:22},{text:'Parle financement tout de suite — OPCO EP = 0 EUR de sa poche (25 ans de cotisations)',size:22}]),
        sp(30),
        box('+2 700 EUR de CA par mois pour elle. Formation remboursee en 3 semaines. Cout pour elle : 0 EUR.',GB,GD),
        sp(30),
        p('Code couleurs utilise dans ce rapport :',{size:16,color:T3}),
        rich([{text:'  VERT ',size:16,bold:true,color:GD},{text:'= atout, bonne nouvelle   ',size:16,color:T3},{text:'  JAUNE ',size:16,bold:true,color:AD},{text:'= a retenir, important   ',size:16,color:T3},{text:'  ROUGE ',size:16,bold:true,color:R},{text:'= attention, piege',size:16,color:T3}]),
        brk(),

        // ═══════════════════════════════════════
        // PARTIE 1 — QUI TU APPELLES
        // ═══════════════════════════════════════
        ...bandeau('1','QUI TU APPELLES',A),

        // 1.1 Fiche
        ...titre('1.1  Beatrice Pignol — 25 ans, une institution du 11e'),
        p('Beatrice a ouvert Esthelia en 1999. Elle a traverse toutes les modes et toutes les crises. Avec Laura, son estheticienne, elles forment un duo soude. Son positionnement : qualite, calme, expertise — dans un quartier bruyant, c\'est exactement ce que ses clientes cherchent.'),
        sp(20),
        new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:[
          tr(['Information','Detail'],true),
          tr(['Salon','Esthelia — Institut de Beaute'],false,0),
          tr(['Adresse','73 Rue Oberkampf, 75011 Paris'],false,1),
          tr(['Telephone','01 48 05 15 67'],false,2),
          tr(['SIRET / Forme','423 000 900 00013 — SARL (capital 8 000 EUR)'],false,3),
          tr(['Cree en','Mai 1999 — plus de 25 ans d\'activite'],false,4),
          tr(['CA 2024','156 200 EUR (resultat net : 11 176 EUR, marge 7,2 %)'],false,5),
          tr(['Equipe','Beatrice Pignol (gerante) + Laura (estheticienne)'],false,6),
          tr(['Prestations','Soins visage Guinot/Payot, massages, epilation, cils, semi-permanent'],false,7),
          tr(['Site web','institutesthelia.fr — Instagram : aucun compte visible'],false,8),
        ]}),
        sp(20),
        ...conseil('Elle est gerante depuis 2005. Ne la prends pas de haut. Valorise son experience : « 25 ans, c\'est rare et c\'est admirable. »'),
        brk(),

        // 1.2 Avis
        ...titre('1.2  89 % de ses clientes l\'adorent — et une demande le microblading'),
        p('On a analyse les 89 avis Google d\'Esthelia. Voici ce qui ressort :'),
        sp(20),
        ...(img('06-avis-sentiment.png',500,225)?[img('06-avis-sentiment.png',500,225)!]:[]),
        explication('A gauche : combien d\'avis ont 5, 4, 3, 2 ou 1 etoile. Plus la barre est longue, plus il y en a. A droite : les mots que les clientes utilisent le plus.'),
        sp(20),
        box('« Meilleur institut de Paris. Je ne vais nulle part ailleurs depuis 10 ans. » — Sophie M., 5 etoiles',GB,GD),
        sp(10),
        box('« Tres bon institut. Seul bemol : pas de microblading. » — Clara R., 4 etoiles',AB,AD),
        sp(10),
        ...attention('Cet avis de Clara est TON meilleur argument. Une cliente demande le microblading. Cite-le a Beatrice : « J\'ai lu vos avis — une cliente regrette que vous ne proposiez pas le microblading. »'),
        sp(10),
        ...retiens('Reputation exceptionnelle (4,8/5). Une cliente demande explicitement le microblading. Utilise ces deux faits dans ton appel.'),
        brk(),

        // 1.3 Quartier & concurrents
        ...titre('1.3  Son quartier est ideal — et la plupart de ses concurrents ne font pas de microblading'),
        ...(mapBuf?[new Paragraph({alignment:AlignmentType.CENTER,spacing:{before:40,after:20},children:[new ImageRun({data:mapBuf,transformation:{width:490,height:215},type:'png'})]}),p('Carte OpenStreetMap — Quartier Oberkampf, Paris 11e',{italic:true,color:T3,size:14})]:[] ),
        sp(20),
        ...(img('09-carte-concurrents.png',470,350)?[img('09-carte-concurrents.png',470,350)!]:[]),
        explication('Le point bleu au centre, c\'est Esthelia. Les points gris sont les concurrents sans microblading. Les points rouges sont ceux qui en font deja. Plus le point est gros, plus le salon a d\'avis.'),
        sp(15),
        ...(img('14-comparaison-concurrents.png',490,255)?[img('14-comparaison-concurrents.png',490,255)!]:[]),
        explication('Chaque barre = un salon du quartier. Bleu = pas de microblading. Rouge = fait du microblading. Esthelia (a gauche) a la meilleure note.'),
        sp(15),
        new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:[
          tr(['Quartier Oberkampf','Chiffre','Ce que ca veut dire'],true),
          tr(['Metros a 5 min','3 (lignes 5, 9, 3)','Ses clientes viennent facilement'],false,0),
          tr(['Restaurants','60+','Zone tres vivante, beaucoup de passage'],false,1),
          tr(['Salons beaute','12 dans 500 m','Concurrence forte — mais presque aucun en dermo'],false,2),
          tr(['Trafic pieton','82/100','Les gens passent devant sa vitrine en permanence'],false,3),
        ]}),
        sp(15),
        ...retiens('12 concurrents dans 500 m, mais seuls 3 font du microblading. Esthelia a la meilleure note du quartier (4,8). Si elle ajoute le microblading, elle devient incontournable.'),
        brk(),

        // ═══════════════════════════════════════
        // PARTIE 2 — POURQUOI ELLE VA DIRE OUI
        // ═══════════════════════════════════════
        ...bandeau('2','POURQUOI ELLE VA DIRE OUI',IN),

        // 2.1 Forces & manques
        ...titre('2.1  Elle a tout pour reussir — il lui manque juste une prestation'),
        ...(img('02-radar-premium.png',450,410)?[img('02-radar-premium.png',450,410)!]:[]),
        explication('Ce graphique en etoile montre 5 « forces » d\'Esthelia. La zone bleue, c\'est elle. La ligne rouge pointillee, c\'est la moyenne des salons du quartier. Plus c\'est grand, mieux c\'est.'),
        sp(20),
        sousTitre('Ses forces — ce que tu peux utiliser'),
        bul('Reputation 78/100 — Note 4,8 sur Google, top 5 % de Paris. Ses clientes l\'adorent.',{color:GD}),
        bul('Quartier 82/100 — Oberkampf = fort passage, clientele 25-40 ans avec du pouvoir d\'achat.',{color:GD}),
        bul('Solidite financiere 58/100 — CA 156 K pour 2 personnes, c\'est correct.',{color:GD}),
        sp(15),
        sousTitre('Ses faiblesses — TES arguments de vente'),
        bul('Activite digitale 35/100 — Pas d\'Instagram. Invisible pour les moins de 35 ans.',{color:R}),
        bul('Presence en ligne 55/100 — Site basique, pas sur Planity.',{color:R}),
        sp(10),
        ...(img('11-scorecard-digital.png',490,215)?[img('11-scorecard-digital.png',490,215)!]:[]),
        explication('Chaque barre = un canal en ligne. Plus c\'est rempli, mieux c\'est. Instagram est a 10/100 : quasi inexistant.'),
        sp(10),
        ...(img('12-horaires-compares.png',500,205)?[img('12-horaires-compares.png',500,205)!]:[]),
        explication('Les barres montrent les heures d\'ouverture de chaque salon. Esthelia (en bleu fonce) ferme a 19 h — ses concurrents restent ouverts plus tard.'),
        sp(15),
        ...conseil('Ton argument massue : « Le microblading genere du contenu Instagram naturellement. Chaque seance = une photo avant/apres. Ca vous rend visible sans effort supplementaire. »'),
        ...retiens('Elle a la reputation et le quartier. Il lui manque la prestation premium et la visibilite en ligne. Le microblading resout les deux problemes en meme temps.'),
        brk(),

        // 2.2 ROI
        ...titre('2.2  +50 000 EUR de chiffre d\'affaires par an — pour 2 jours et 0 EUR'),
        ...(img('05-roi-waterfall.png',490,275)?[img('05-roi-waterfall.png',490,275)!]:[]),
        explication('Chaque barre ajoute du chiffre d\'affaires au total. Le gris = son CA actuel. Le bleu = le microblading. Le violet = le Full Lips. Le vert = le nouveau total.'),
        sp(15),
        ...(img('07-avant-apres.png',500,225)?[img('07-avant-apres.png',500,225)!]:[]),
        explication('A gauche : les barres comparent 5 indicateurs avant et apres la formation (gris = aujourd\'hui, bleu = avec microblading). A droite : les 4 chiffres cles a retenir.'),
        sp(15),
        new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:[
          tr(['Indicateur','Aujourd\'hui','Avec microblading','Gain'],true),
          tr(['CA par mois','13 000 EUR','17 200 EUR','+4 200 EUR (+32 %)'],false,0),
          tr(['CA par an','156 000 EUR','206 000 EUR','+50 000 EUR'],false,1),
          tr(['Panier moyen','55 EUR','225 EUR','Multiplie par 4'],false,2),
          tr(['Marge nette','7 %','18 %','+11 points'],false,3),
          tr(['Cout de la formation','—','0 EUR (OPCO)','Gratuit'],false,4),
          tr(['Temps de formation','—','2 jours','Laura tient le salon'],false,5),
          tr(['Delai de remboursement','—','3 semaines','Avec 3 clientes par semaine'],false,6),
        ]}),
        sp(15),
        ...retiens('Formation de 2 jours. Cout : 0 EUR grace a l\'OPCO. Chiffre d\'affaires supplementaire : +50 000 EUR par an. Remboursee en 3 semaines.'),
        brk(),

        // 2.3 Demande
        ...titre('2.3  La demande de microblading n\'a jamais ete aussi forte'),
        ...(img('13-tendances-marche.png',490,215)?[img('13-tendances-marche.png',490,215)!]:[]),
        explication('La courbe montre combien de personnes cherchent « microblading » a Paris chaque mois. Plus c\'est haut, plus la demande est forte. Les zones vertes = les meilleures periodes pour vendre.'),
        sp(15),
        ...(img('10-demographie-quartier.png',500,225)?[img('10-demographie-quartier.png',500,225)!]:[]),
        explication('A gauche : les metiers des habitants du quartier (38 % de cadres). A droite : les indicateurs economiques du quartier.'),
        sp(15),
        ...conseil('Argument : « Dans votre quartier, 38 % de cadres avec un revenu median de 32 000 EUR. Ces personnes sont pretes a payer 200 EUR pour du microblading. Et la demande est au plus haut. »'),
        ...retiens('La demande explose a Paris. Le quartier Oberkampf a le pouvoir d\'achat ideal. C\'est le bon moment.'),
        brk(),

        // ═══════════════════════════════════════
        // PARTIE 3 — COMMENT LUI VENDRE
        // ═══════════════════════════════════════
        ...bandeau('3','COMMENT LUI VENDRE',VI),

        // 3.1 Script
        ...titre('3.1  Ton script mot pour mot'),
        p('4 etapes. Chaque etape a un objectif precis. Adapte le ton a ta facon de parler, mais garde la structure.',{italic:true,color:T2}),
        sp(30),

        box('ETAPE 1  —  ACCROCHE  (15 secondes)',BB,A),
        p('Objectif : capter son attention et montrer que tu n\'es pas un demarcheur au hasard.',{size:17,color:T3}),
        sp(10),
        p('« Bonjour Beatrice, je suis [ton prenom] de Dermotec Advanced, le centre de formation Qualiopi au 75 boulevard Richard Lenoir — on est voisins dans le 11e ! J\'ai vu vos avis Google, 4,8 avec 89 avis, c\'est exceptionnel apres 25 ans. Bravo. »',{italic:true}),
        ...conseil('« On est voisins » = elle baisse la garde. Citer le 4,8 et les 89 avis = elle sait que tu as fait tes devoirs.'),
        sp(20),

        box('ETAPE 2  —  TRANSITION  (15 secondes)','EEF2FF',IN),
        p('Objectif : introduire le sujet sans paraitre vendeur.',{size:17,color:T3}),
        sp(10),
        p('« Je vous appelle parce qu\'on accompagne des institutes de votre niveau a ajouter la dermopigmentation — microblading, maquillage permanent. C\'est une evolution naturelle quand on maitrise deja les soins du visage, et c\'est la prestation la plus demandee dans le 11e en ce moment. »',{italic:true}),
        ...conseil('« De votre niveau » = tu la valorises. « Evolution naturelle » = ce n\'est pas un changement, c\'est une progression.'),
        sp(20),

        box('ETAPE 3  —  LA PROPOSITION  (30 secondes)','F5F3FF',VI),
        p('Objectif : donner les chiffres. C\'est ca qui la fait reflechir.',{size:17,color:T3}),
        sp(10),
        p('« En 2 jours de formation, vous ou Laura maitrisez le microblading. C\'est une prestation entre 200 et 250 euros la seance. Avec 3 clientes par semaine — et vu votre reputation, ca ira vite — on parle de 2 700 euros de chiffre d\'affaires supplementaire par mois. Et comme votre SARL cotise a l\'OPCO EP depuis 25 ans, la formation est financee a 100 %. Zero de votre poche. »',{italic:true}),
        sp(5),
        ...retiens('Les 3 chiffres a sortir dans cet ordre : 2 jours, 2 700 EUR par mois, 0 EUR de sa poche.'),
        sp(20),

        box('ETAPE 4  —  LE CLOSING  (15 secondes)',GB,GD),
        p('Objectif : obtenir un rendez-vous. Pas vendre au telephone.',{size:17,color:T3}),
        sp(10),
        p('« Je ne vous demande rien aujourd\'hui sauf 15 minutes. Je passe au salon cette semaine avec les photos avant/apres et le simulateur de rentabilite. Si ca vous parle, on monte le dossier OPCO ensemble — ca prend 15 minutes et c\'est gratuit. Mardi ou mercredi, qu\'est-ce qui vous arrange ? »',{italic:true}),
        ...conseil('« Mardi ou mercredi » = question alternative. Elle choisit QUAND, pas SI. Ca double tes chances de rendez-vous.'),
        brk(),

        // 3.2 Objections
        ...titre('3.2  Si elle dit non — tes reponses pretes'),
        p('Chaque « non » est un signe d\'interet deguise. Si elle objecte, c\'est qu\'elle reflechit. Voici quoi repondre a chaque situation.',{italic:true,color:T2}),
        sp(20),

        ...([
          {t:'« C\'est trop cher »',pensee:'Sa tresorerie est de 8 923 EUR. Elle ne peut pas sortir 1 400 EUR cash.',rep:'« Je comprends. C\'est pour ca que 80 % de nos stagiaires ne paient rien. Votre SARL cotise a l\'OPCO EP depuis 1999 — 25 ans de droits accumules. Je verifie en 2 minutes, c\'est gratuit. »',alt:'« Sinon, paiement en 3 fois sans frais : 467 EUR par mois. Avec 2 700 EUR de CA supplementaire, c\'est 5 fois couvert. »'},
          {t:'« J\'ai pas le temps, on est que deux »',pensee:'Si elle part 2 jours, Laura gere seule. C\'est stressant.',rep:'« 2 jours seulement, un lundi-mardi. Laura tient le salon. Et ces 2 jours vont generer du CA pendant les 20 prochaines annees. C\'est le meilleur ratio temps/retour de toutes les formations. »'},
          {t:'« Ca fait 25 ans que ca marche comme ca »',pensee:'Peur du changement apres 25 ans de routine qui fonctionne.',rep:'« Justement — 25 ans de base solide, c\'est pour ca que vous pouvez evoluer. La dermo ne remplace rien, elle s\'ajoute. Comme les massages balinais. Et vos clientes fideles seront les premieres a booker. »'},
          {t:'« C\'est pas mon style, c\'est trop medical »',pensee:'Elle imagine des aiguilles. Son identite « zen » ne colle pas.',rep:'« Le microblading, c\'est du maquillage semi-permanent. Un stylo a micro-lames, pas de machine. C\'est un geste delicat et artistique. Le look \'no makeup makeup\' — ca colle parfaitement avec votre ambiance. »'},
          {t:'« Laissez-moi reflechir »',pensee:'Interessee mais pas assez convaincue pour agir.',rep:'« Bien sur. Est-ce que je peux vous envoyer un dossier ? Les avant/apres de nos stagiaires avec leurs chiffres du premier mois. Comme ca, vous reflechissez avec du concret. Par email ou je le depose au salon ? »'},
        ]).flatMap(o=>[
          box(o.t,AB,AD),
          p('Ce qu\'elle pense vraiment : '+o.pensee,{italic:true,color:T2,size:17}),
          p(o.rep,{italic:true,color:GD}),
          ...(o.alt?[p('Si elle insiste : '+o.alt,{italic:true,color:AD,size:17})]:[]),
          sp(20),
        ]),
        ...retiens('Le « non » est normal. Chaque reponse est un pont vers le « oui ». Reste calme, valorise son point de vue, et propose toujours un prochain pas concret.'),
        brk(),

        // 3.3 Mots
        ...titre('3.3  Les mots qui marchent / les mots a eviter'),
        new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:[
          tr(['Ne dis pas','Dis plutot','Pourquoi'],true),
          tr(['« Formation »','« Nouvelle prestation pour votre salon »','Elle entend « ecole », pas « business »'],false,0),
          tr(['« Ca coute 1 400 EUR »','« C\'est finance a 100 % par l\'OPCO »','Commence par le gratuit, pas le prix'],false,1),
          tr(['« Vous devriez... »','« D\'autres institutes comme le votre ont... »','Conseil = condescendant. Exemple = inspirant'],false,2),
          tr(['« Microblading » (direct)','« Maquillage semi-permanent » (d\'abord)','Moins technique, plus accessible'],false,3),
          tr(['« C\'est facile »','« C\'est une technique precise et artistique »','Ne minimise pas son futur savoir-faire'],false,4),
          tr(['« Vos concurrents le font »','« Vos clientes le demandent »','Pression concurrence = agressif. Demande client = naturel'],false,5),
        ]}),
        sp(15),
        ...retiens('Parle business, pas formation. Parle de SES clientes, pas de ses concurrents. Et mentionne le financement dans les 30 premieres secondes.'),
        brk(),

        // ═══════════════════════════════════════
        // PARTIE 4 — LA SUITE
        // ═══════════════════════════════════════
        ...bandeau('4','LA SUITE',GD),

        // 4.1 Formations
        ...titre('4.1  La formation parfaite pour Beatrice'),
        box('RECOMMANDATION N° 1 — Microblading / Microshading',BB,A),
        p('1 400 EUR HT  |  2 jours (14 heures)  |  Financement OPCO EP a 100 %',{bold:true}),
        sp(5),
        bul('C\'est la suite logique de ses soins visage Guinot/Payot'),
        bul('Ses 89 clientes fideles seront les premieres a tester'),
        bul('Aucun concurrent direct ne le propose sur Oberkampf'),
        bul('Son panier moyen passe de 55 EUR a 225 EUR — multiplie par 4'),
        box('Retour sur investissement : 225 EUR par seance, 3 clientes par semaine = 2 700 EUR par mois. Remboursee en 3 semaines.',GB,GD),
        sp(20),
        box('COMPLEMENT — Full Lips (Candy Lips)','F5F3FF',VI),
        p('1 400 EUR HT  |  A proposer APRES le microblading',{bold:true}),
        bul('Meme geste, meme clientele. 300 EUR la seance. +3 600 EUR par mois potentiel.'),
        sp(20),
        box('PLUS TARD — Rehaussement Cils + Volume Russe',LB,T2),
        p('890 EUR HT  |  Elle fait deja du rehaussement = montee en gamme directe.',{bold:true}),
        brk(),

        // 4.2 Financement
        ...titre('4.2  Comment elle ne paie rien'),
        box('OPCO EP — SARL beaute depuis 1999. 25 ans de cotisations. Cout pour Beatrice : 0 EUR.',GB,GD),
        sp(15),
        p('Sa SARL cotise a l\'OPCO EP (Operateur de Competences des Entreprises de Proximite) depuis 25 ans. C\'est un organisme qui finance les formations des salaries et des dirigeants. Beatrice a accumule des droits de formation — elle ne le sait peut-etre meme pas. On s\'occupe de tout le dossier.'),
        sp(15),
        sousTitre('La phrase a dire'),
        box('« Votre SARL cotise a l\'OPCO depuis 25 ans. Ca fait beaucoup de droits accumules. On s\'occupe de toute la paperasse — ca prend 15 minutes. »',GB,GD),
        sp(15),
        sousTitre('Si l\'OPCO ne passe pas (cas rare)'),
        bul('CPF : si Beatrice ou Laura ont des droits sur Mon Compte Formation'),
        bul('Paiement en 3 fois sans frais : 467 EUR par mois pendant 3 mois'),
        bul('Paiement comptant avec remise 5 % : 1 330 EUR HT'),
        sp(10),
        ...attention('Ne dis jamais « financement » en premier. Dis « on s\'occupe de tout pour que ca ne vous coute rien ». C\'est plus naturel.'),
        brk(),

        // 4.3 Plan
        ...titre('4.3  Ton plan semaine par semaine'),
        ...(img('08-timeline-plan.png',510,155)?[img('08-timeline-plan.png',510,155)!]:[]),
        explication('Chaque point sur la ligne = une etape. Les gros points = les moments cles. Le texte au-dessus et en dessous indique ce que tu fais et quand.'),
        sp(15),
        new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:[
          tr(['Quand','Ce que tu fais','Ton objectif'],true),
          tr(['Aujourd\'hui','Appeler au 01 48 05 15 67 entre 10 h et 11 h 30','Decrocher un rendez-vous au salon'],false,0),
          tr(['Si pas de reponse','Laisser un message vocal court et curieux','Piquer sa curiosite pour qu\'elle rappelle'],false,1),
          tr(['Jour +1','Rappeler + envoyer email avec 3 photos avant/apres','Nourrir son interet avec du concret'],false,2),
          tr(['Jour +3','Rappeler : « Avez-vous pu regarder les photos ? »','Fixer un creneau de passage au salon'],false,3),
          tr(['Jour +7','Passer physiquement au 73 rue Oberkampf','Le face-a-face change tout (conversion x 3)'],false,4),
          tr(['Jour +14','Envoyer un temoignage video d\'une stagiaire similaire','Conclure ou planifier un rappel mensuel'],false,5),
        ]}),
        sp(40),

        // ═══ MESSAGE FINAL ═══
        sp(100),
        new Paragraph({spacing:{before:0,after:0},shading:{type:ShadingType.CLEAR,fill:A},indent:{left:0,right:0},children:[new TextRun({text:'\n',font:'Calibri',size:8})]}),
        new Paragraph({spacing:{before:0,after:0},shading:{type:ShadingType.CLEAR,fill:A},indent:{left:300,right:300},children:[new TextRun({text:'Beatrice a 25 ans d\'experience, 89 avis a 4,8 etoiles, et un quartier en or.',font:'Calibri',size:22,bold:true,color:'FFFFFF'})]}),
        new Paragraph({spacing:{before:60,after:0},shading:{type:ShadingType.CLEAR,fill:A},indent:{left:300,right:300},children:[new TextRun({text:'Il lui manque juste une prestation pour devenir la reference d\'Oberkampf.',font:'Calibri',size:22,color:'FFFFFF'})]}),
        new Paragraph({spacing:{before:60,after:0},shading:{type:ShadingType.CLEAR,fill:A},indent:{left:300,right:300},children:[new TextRun({text:'Tu as tous les arguments, les chiffres, et le financement.',font:'Calibri',size:20,color:B})]}),
        new Paragraph({spacing:{before:60,after:0},shading:{type:ShadingType.CLEAR,fill:A},indent:{left:300,right:300},children:[new TextRun({text:'A toi de jouer.',font:'Calibri',size:24,bold:true,color:B})]}),
        new Paragraph({spacing:{before:0,after:0},shading:{type:ShadingType.CLEAR,fill:A},indent:{left:0,right:0},children:[new TextRun({text:'\n',font:'Calibri',size:14})]}),

        sp(60),
        new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:'Rapport genere par Satorea CRM — Cout : 0,40 EUR — Donnees enrichies multi-sources',font:'Calibri',size:12,color:T4})]}),
        new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:'www.satorea.fr',font:'Calibri',size:12,color:B})]}),
      ]},
    ],
  })

  const buf=await Packer.toBuffer(doc)
  const fn='Satorea-Briefing-V4-Esthelia.docx'
  writeFileSync(fn,buf)
  console.log(`\n${fn} (${(buf.length/1024).toFixed(0)} KB)`)
}

build().catch(e=>{console.error(e);process.exit(1)})
