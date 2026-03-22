/**
 * RAPPORT ULTIMATE — Word avec 8 graphiques futuristes + carte OSM
 * 9 images PNG insérées + 12 sections narratives
 */
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, HeadingLevel, BorderStyle, ShadingType,
  Header, Footer, PageNumber, PageBreak, ImageRun,
} from 'docx'
import { writeFileSync, readFileSync, existsSync } from 'fs'

const B = '2EC6F3', A = '082545', G = '10B981', GD = '059669', AM = 'F59E0B', AD = 'D97706'
const R = 'EF4444', IN = '6366F1', VI = '8B5CF6', T = '1E293B', T2 = '475569', T3 = '94A3B8', T4 = 'CBD5E1'
const LB = 'F8FAFC', BB = 'F0F9FF', GB = 'ECFDF5', AB = 'FFFBEB'

const h1 = (t: string) => new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 350, after: 100 }, children: [new TextRun({ text: t, font: 'Calibri', size: 32, bold: true, color: A })] })
const h3 = (t: string) => new Paragraph({ heading: HeadingLevel.HEADING_3, spacing: { before: 120, after: 60 }, children: [new TextRun({ text: t, font: 'Calibri', size: 22, bold: true, color: B })] })
const ln = () => new Paragraph({ spacing: { after: 150 }, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: B } }, children: [] })
const p = (t: string, o?: any) => new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: t, font: 'Calibri', size: o?.size || 21, color: o?.color || T, bold: o?.bold, italics: o?.italic })] })
const rich = (r: any[]) => new Paragraph({ spacing: { after: 60 }, children: r.map((x: any) => new TextRun({ text: x.text, font: 'Calibri', size: x.size || 21, color: x.color || T, bold: x.bold, italics: x.italic })) })
const bul = (t: string, o?: any) => new Paragraph({ bullet: { level: 0 }, spacing: { after: 30 }, children: [new TextRun({ text: t, font: 'Calibri', size: 21, color: o?.color || T, bold: o?.bold })] })
const sp = (n = 80) => new Paragraph({ spacing: { after: n }, children: [] })
const box = (t: string, bg: string, fg: string) => new Paragraph({ spacing: { before: 60, after: 60 }, shading: { type: ShadingType.CLEAR, fill: bg }, indent: { left: 200, right: 200 }, children: [new TextRun({ text: '   ' + t + '   ', font: 'Calibri', size: 22, color: fg, bold: true })] })
const brk = () => new Paragraph({ children: [new PageBreak()] })

function tr(cells: string[], h = false, i = 0) {
  return new TableRow({ children: cells.map((c, j) => new TableCell({
    shading: { type: ShadingType.CLEAR, fill: h ? A : i % 2 === 0 ? LB : 'FFFFFF' },
    margins: { top: 40, bottom: 40, left: 80, right: 80 },
    children: [new Paragraph({ children: [new TextRun({ text: c, font: 'Calibri', size: 18, bold: h || j === 0, color: h ? 'FFFFFF' : j === 0 ? A : T })] })],
  })) })
}

function kpi(l: string, v: string, c: string) {
  return new TableCell({ shading: { type: ShadingType.CLEAR, fill: LB }, margins: { top: 60, bottom: 60, left: 80, right: 80 }, children: [
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: v, font: 'Calibri', size: 28, bold: true, color: c })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: l, font: 'Calibri', size: 14, color: T3 })] }),
  ] })
}

function img(name: string, w: number, h: number) {
  const path = `./charts/${name}`
  if (!existsSync(path)) return null
  return new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 80, after: 80 }, children: [
    new ImageRun({ data: readFileSync(path), transformation: { width: w, height: h }, type: 'png' }),
  ] })
}

async function build() {
  console.log('=== RAPPORT ULTIMATE ===\n')

  // Carte OSM
  let mapBuf: Buffer | null = null
  try {
    const SM = (await import('staticmaps')).default
    const m = new SM({ width: 640, height: 280, tileUrl: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', tileSize: 256, tileRequestHeader: { 'User-Agent': 'SatoreaCRM/1.0' } })
    await m.render([2.3783, 48.8648], 15)
    mapBuf = await m.image.buffer('image/png') as Buffer
    console.log('Carte OSM: OK')
  } catch { console.log('Carte OSM: skip') }

  const date = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

  const doc = new Document({
    styles: { default: { document: { run: { font: 'Calibri', size: 21, color: T } } } },
    sections: [
      // COUVERTURE
      { properties: { page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } } },
        children: [
          sp(500),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'SATOREA', font: 'Calibri', size: 56, bold: true, color: B })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 180 }, children: [new TextRun({ text: 'Briefing Commercial Intelligence', font: 'Calibri', size: 24, color: T3 })] }),
          sp(120),
          new Paragraph({ alignment: AlignmentType.CENTER, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: B, space: 1 } }, children: [] }),
          sp(120),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Rapport Prospect', font: 'Calibri', size: 36, bold: true, color: A })] }),
          sp(60),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Beatrice Pignol — Esthelia', font: 'Calibri', size: 28, color: T })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '73 Rue Oberkampf, 75011 Paris', font: 'Calibri', size: 20, color: T3 })] }),
          sp(120),
          // Gauge score en couverture
          ...(img('01-gauge-score.png', 280, 200) ? [img('01-gauge-score.png', 280, 200)!] : [
            box('   SCORE : 64/100 — TIEDE — Fort potentiel   ', AB, AD),
          ]),
          sp(200),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: date + ' — Version 1.0', font: 'Calibri', size: 18, color: T3 })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 300 }, children: [new TextRun({ text: 'Confidentiel — Satorea CRM', font: 'Calibri', size: 14, color: T4 })] }),
      ] },

      // CONTENU
      { properties: { page: { margin: { top: 1000, bottom: 1000, left: 1000, right: 1000 } } },
        headers: { default: new Header({ children: [new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: B } }, children: [
          new TextRun({ text: 'SATOREA', font: 'Calibri', size: 14, bold: true, color: B }),
          new TextRun({ text: '   |   Briefing Esthelia — Beatrice Pignol', font: 'Calibri', size: 12, color: T3 }),
        ] })] }) },
        footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [
          new TextRun({ text: 'Satorea CRM — Page ', font: 'Calibri', size: 12, color: T3 }),
          new TextRun({ children: [PageNumber.CURRENT], font: 'Calibri', size: 12, color: T3 }),
        ] })] }) },
        children: [
          // ── 1. VERDICT ──
          h1('1. Verdict & Score Global'), ln(),
          new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [new TableRow({ children: [
            kpi('Note Google', '4.8/5', B), kpi('Avis', '89', IN), kpi('CA', '156K EUR', G), kpi('Effectif', '2', VI), kpi('Score', '64/100', AM),
          ] })] }),
          sp(40),
          box('Prospect tiede a fort potentiel — 25 ans, 4.8 Google, quartier ideal. Manque la dermopigmentation.', AB, AD),
          p('Institut depuis 1999, reputation top 5% Paris. Maitrise soins classiques (Guinot/Payot) mais zero dermo. SARL eligible OPCO. Frein : conservatisme 25 ans. Angle : evolution naturelle.'),
          brk(),

          // ── 2. ANALYSE 5 AXES ──
          h1('2. Analyse Multi-Axes'), ln(),
          p('Score sur 5 dimensions. Bleu = Esthelia. Rouge pointille = moyenne secteur. Chaque point = un levier de vente.'),
          ...(img('02-radar-premium.png', 480, 440) ? [img('02-radar-premium.png', 480, 440)!] : []),
          sp(30),
          h3('Ce que chaque axe signifie pour toi'),
          rich([{ text: 'Quartier (82) : ', bold: true, color: '14B8A6' }, { text: 'Oberkampf = fort trafic, CSP+ 25-40 ans. "Votre quartier est ideal pour le microblading."' }]),
          rich([{ text: 'Reputation (78) : ', bold: true, color: G }, { text: '4.8/5, 89 avis, top 5% Paris. "Vos clientes fideles seront les premieres a booker."' }]),
          rich([{ text: 'Financier (58) : ', bold: true, color: AM }, { text: 'CA 156K, tresorerie juste. Ne JAMAIS parler prix sans parler financement OPCO.' }]),
          rich([{ text: 'Presence (55) : ', bold: true, color: '3B82F6' }, { text: 'Pas d\'Instagram. "Le microblading genere du contenu avant/apres viral."' }]),
          rich([{ text: 'Activite (35) : ', bold: true, color: VI }, { text: 'Point faible #1 = ton argument massue. Le contenu dermo se cree tout seul.' }]),
          brk(),

          // ── 3. AVIS CLIENTS ──
          h1('3. Analyse des Avis Clients'), ln(),
          ...(img('06-avis-sentiment.png', 530, 240) ? [img('06-avis-sentiment.png', 530, 240)!] : []),
          sp(30),
          box('"Seul bemol : pas de prestations modernes type microblading." — Clara R., 4 etoiles', AB, AD),
          p('Cet avis est TON meilleur argument. Cite-le a Beatrice : la demande existe, ses propres clientes le disent.', { bold: true, color: B }),
          sp(20),
          box('"Meilleur institut de Paris. Beatrice est exceptionnelle." — Sophie M., 5 etoiles', GB, GD),
          p('Sa reputation est son capital. Positionne la dermo comme un moyen de la renforcer, pas de la changer.'),
          brk(),

          // ── 4. CARTE & QUARTIER ──
          h1('4. Localisation & Environnement'), ln(),
          ...(mapBuf ? [
            new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, children: [new ImageRun({ data: mapBuf, transformation: { width: 520, height: 230 }, type: 'png' })] }),
            p('Carte OpenStreetMap — 73 Rue Oberkampf, Paris 11e', { italic: true, color: T3, size: 16 }),
          ] : []),
          sp(20),
          new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [
            tr(['Zone', 'Valeur', 'Impact commercial'], true),
            tr(['Metros', '3 (L5, L9, L3)', 'Tres accessible — clientele de passage'], false, 0),
            tr(['Restaurants', '60+', 'Zone tres animee — fort trafic'], false, 1),
            tr(['Concurrents beaute', '12 dans 500m', 'Aucun ne fait de dermopigmentation'], false, 2),
            tr(['Trafic pieton', '82/100', 'Zone premium — ideal microblading'], false, 3),
          ] }),
          brk(),

          // ── 5. PARCOURS PROSPECT ──
          h1('5. Parcours Prospect — Schema'), ln(),
          p('De l\'appel a la premiere cliente en 5 semaines. Chaque etape est detaillee dans le plan d\'action.'),
          ...(img('04-schema-parcours.png', 540, 180) ? [img('04-schema-parcours.png', 540, 180)!] : []),
          brk(),

          // ── 6. ROI & BUSINESS CASE ──
          h1('6. Business Case & ROI'), ln(),
          p('Decomposition du gain : chaque prestation ajoutee augmente le CA du salon.'),
          sp(20),
          ...(img('05-roi-waterfall.png', 520, 290) ? [img('05-roi-waterfall.png', 520, 290)!] : []),
          sp(30),
          h3('Avant / Apres formation'),
          ...(img('07-avant-apres.png', 530, 240) ? [img('07-avant-apres.png', 530, 240)!] : []),
          sp(20),
          new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [
            tr(['Indicateur', 'Aujourd\'hui', 'Avec microblading', 'Delta'], true),
            tr(['CA mensuel', '13 000 EUR', '17 200 EUR', '+4 200 EUR'], false, 0),
            tr(['CA annuel', '156 000 EUR', '206 400 EUR', '+50 400 EUR'], false, 1),
            tr(['Panier moyen', '55 EUR', '225 EUR', 'x4'], false, 2),
            tr(['Marge nette', '7.2%', '~18%', '+11 pts'], false, 3),
            tr(['Prestations premium', '0', '3', '+3'], false, 4),
          ] }),
          box('Investissement : 0 EUR (OPCO) — Remboursement : 3 semaines — Impact annuel : +50 400 EUR', GB, GD),
          brk(),

          // ── 7. FUNNEL CONVERSION ──
          h1('7. Funnel de Conversion'), ln(),
          p('Pipeline type pour une formation esthetique. Objectif : faire passer Beatrice du premier contact a l\'inscription en 30 jours.'),
          ...(img('03-funnel-conversion.png', 500, 250) ? [img('03-funnel-conversion.png', 500, 250)!] : []),
          brk(),

          // ── 8. SCRIPT TELEPHONIQUE ──
          h1('8. Script Telephonique'), ln(),
          p('4 etapes progressives. Lis avant d\'appeler.'),
          sp(20),
          box('ETAPE 1 — ACCROCHE', BB, A),
          p('"Bonjour Beatrice, je suis [Prenom] de Dermotec Advanced, centre Qualiopi au 75 boulevard Richard Lenoir — on est voisins ! 4.8 sur Google avec 89 avis, c\'est exceptionnel apres 25 ans."', { italic: true }),
          bul('"On est voisins" = proximite + confiance', { color: T2 }),
          bul('Cite 4.8/89 avis = recherches faites, pas un appel random', { color: T2 }),
          sp(20),
          box('ETAPE 2 — TRANSITION', 'EEF2FF', IN),
          p('"On accompagne des institutes de votre niveau a ajouter la dermopigmentation. C\'est une evolution naturelle pour une pro qui maitrise les soins du visage."', { italic: true }),
          bul('"De votre niveau" = reconnaissance. "Evolution" = pas rupture.', { color: T2 }),
          sp(20),
          box('ETAPE 3 — PROPOSITION', 'F5F3FF', VI),
          p('"En 2 jours, le microblading. 225 EUR la seance, 3 clientes/semaine = 2 700 EUR/mois. Votre SARL cotise a l\'OPCO depuis 25 ans : 0 EUR de votre poche."', { italic: true }),
          bul('Chiffres concrets + OPCO = arguments imbattables', { color: T2 }),
          sp(20),
          box('ETAPE 4 — CLOSING', GB, GD),
          p('"Je passe au salon avec les photos avant/apres. Si ca vous parle, on monte le dossier OPCO — 15 min, gratuit. Mardi ou mercredi ?"', { italic: true }),
          bul('"Mardi ou mercredi" = question alternative, pas oui/non', { color: T2 }),
          brk(),

          // ── 9. OBJECTIONS ──
          h1('9. Objections & Contre-Arguments'), ln(),
          ...([
            ['"C\'est trop cher"', 'Tresorerie 8 923 EUR — pas de cash.', 'OPCO depuis 1999. 25 ans de droits accumules. 0 EUR de votre poche.', 'Paiement 3x : 467 EUR/mois. Couvert 5x par le CA additionnel.'],
            ['"Pas le temps / que deux"', 'Si elle part, Laura seule 2 jours.', '2 jours lundi-mardi (calme). Laura tient. Ratio temps/retour imbattable.', ''],
            ['"Ca fait 25 ans que ca marche"', 'Peur du changement, identite 25 ans.', '25 ans = base solide pour evoluer. La dermo s\'ajoute. Comme les massages balinais.', ''],
            ['"C\'est trop medical"', 'Associe dermo a l\'injectable.', 'Maquillage semi-permanent. Stylo micro-lames, pas machine. "No makeup makeup" = son style.', ''],
            ['"Laissez-moi reflechir"', 'Interessee mais pas convaincue.', 'Dossier avant/apres + chiffres 1er mois. Par email ou depose au salon ?', ''],
          ] as string[][]).flatMap(([titre, pensee, rep, alt]) => [
            box(titre, AB, AD),
            p(`Pensee reelle : "${pensee}"`, { italic: true, color: T2, size: 18 }),
            p(`"${rep}"`, { italic: true, color: GD }),
            ...(alt ? [p(`Si insiste : "${alt}"`, { italic: true, color: AD, size: 18 })] : []),
            sp(20),
          ]),
          brk(),

          // ── 10. DOULEURS & LEVIERS ──
          h1('10. Douleurs & Leviers'), ln(),
          h3('Ses douleurs'),
          bul('Plafond CA 156K, marge 7.2%, pas de reserve', { color: R }),
          bul('0 prestation premium >100 EUR', { color: R }),
          bul('12 concurrents dans 500m', { color: R }),
          bul('0 Instagram = invisible <35 ans', { color: R }),
          bul('Un avis demande le microblading = demande non satisfaite', { color: R }),
          sp(20),
          h3('Ses aspirations'),
          bul('Perenniser 25 ans de travail', { color: GD }),
          bul('Monter en gamme sans perdre l\'identite zen', { color: GD }),
          bul('Augmenter CA sans embaucher', { color: GD }),
          bul('Etre LA reference dermo d\'Oberkampf', { color: GD }),
          sp(20),
          rich([{ text: 'Ne dis JAMAIS "formation". ', bold: true, color: R }, { text: 'Dis : "evolution naturelle", "prestation premium", "2 jours pour 20 ans".' }]),
          brk(),

          // ── 11. FORMATIONS ──
          h1('11. Formations Recommandees'), ln(),
          box('PRINCIPAL — Microblading / Microshading — 1 400 EUR HT', BB, A),
          p('2 jours (14h) | OPCO EP | Extension naturelle soins visage'),
          bul('Panier moyen x4 : de 55 EUR a 225 EUR'),
          bul('ROI : 225 EUR/seance x 3/sem = 2 700 EUR/mois. Rembourse en 3 semaines.', { bold: true, color: GD }),
          sp(20),
          box('COMPLEMENTAIRE — Full Lips — 1 400 EUR HT', 'F5F3FF', VI),
          bul('Suite logique. 300 EUR/seance. +3 600 EUR/mois potentiel.'),
          sp(20),
          box('UPSELL — Rehaussement Cils Volume Russe — 890 EUR HT', LB, T2),
          bul('Elle fait deja rehaussement = montee en gamme. Prestation recurrente.'),
          brk(),

          // ── 12. PLAN D'ACTION ──
          h1('12. Plan d\'Action'), ln(),
          ...(img('08-timeline-plan.png', 540, 170) ? [img('08-timeline-plan.png', 540, 170)!] : []),
          sp(20),
          new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [
            tr(['Quand', 'Action', 'Objectif'], true),
            tr(['J0', 'Appeler 01 48 05 15 67 (10h-11h30)', 'Fixer RDV au salon'], false, 0),
            tr(['J+1', 'Si absent : message vocal + curiosite', 'Elle rappelle'], false, 1),
            tr(['J+1', 'Email avant/apres + simulateur ROI', 'Nourrir l\'interet'], false, 2),
            tr(['J+3', '"Avez-vous vu les photos ?"', 'Creneau de passage'], false, 3),
            tr(['J+7', 'Passer PHYSIQUEMENT 73 rue Oberkampf', 'Face-a-face = conversion 3x'], false, 4),
            tr(['J+14', 'Temoignage video stagiaire similaire', 'Conclure ou rappel mensuel'], false, 5),
          ] }),
          sp(150),
          box('25 ans d\'experience, 89 avis a 4.8 etoiles, quartier en or. Ne vends pas une formation — offre l\'opportunite de faire evoluer un quart de siecle de savoir-faire.', BB, A),
          sp(40),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Satorea CRM — www.satorea.fr', font: 'Calibri', size: 16, color: T3 })] }),
        ],
      },
    ],
  })

  const buf = await Packer.toBuffer(doc)
  const fn = 'Briefing-Esthelia-ULTIMATE.docx'
  writeFileSync(fn, buf)
  console.log(`\nWord : ${fn} (${(buf.length / 1024).toFixed(0)} KB)`)
  console.log('9 images : gauge + radar + avis + carte OSM + parcours + waterfall + avant-apres + funnel + timeline')
}

build().catch(e => { console.error(e); process.exit(1) })
