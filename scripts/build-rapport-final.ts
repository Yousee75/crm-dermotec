/**
 * RAPPORT FINAL — Word avec TOUTES les data visualisations
 * Carte OSM + 6 graphiques PNG matplotlib + contenu narratif complet
 */

import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, HeadingLevel, BorderStyle, ShadingType,
  Header, Footer, PageNumber, PageBreak, ImageRun,
} from 'docx'
import { writeFileSync, readFileSync, existsSync } from 'fs'

// ══════════════════════════════════════════════════════════════
// COULEURS
// ══════════════════════════════════════════════════════════════
const BRAND = '2EC6F3', ACCENT = '082545', GREEN = '10B981', GREEN_DARK = '059669'
const AMBER = 'F59E0B', AMBER_DARK = 'D97706', RED = 'EF4444'
const INDIGO = '6366F1', VIOLET = '8B5CF6'
const TEXT = '1E293B', TEXT_MED = '475569', TEXT_LIGHT = '94A3B8', TEXT_XLIGHT = 'CBD5E1'
const LIGHT_BG = 'F8FAFC', BRAND_BG = 'F0F9FF', GREEN_BG = 'ECFDF5', AMBER_BG = 'FFFBEB'

// ══════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════
const h1 = (t: string) => new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 120 }, children: [new TextRun({ text: t, font: 'Calibri', size: 32, bold: true, color: ACCENT })] })
const h2 = (t: string) => new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 }, children: [new TextRun({ text: t, font: 'Calibri', size: 26, bold: true, color: ACCENT })] })
const h3 = (t: string) => new Paragraph({ heading: HeadingLevel.HEADING_3, spacing: { before: 150, after: 80 }, children: [new TextRun({ text: t, font: 'Calibri', size: 22, bold: true, color: BRAND })] })
const line = () => new Paragraph({ spacing: { after: 200 }, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: BRAND } }, children: [] })
const p = (t: string, o?: { bold?: boolean; italic?: boolean; color?: string; size?: number }) => new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: t, font: 'Calibri', size: o?.size || 21, color: o?.color || TEXT, bold: o?.bold, italics: o?.italic })] })
const rich = (runs: { text: string; bold?: boolean; italic?: boolean; color?: string; size?: number }[]) => new Paragraph({ spacing: { after: 80 }, children: runs.map(r => new TextRun({ text: r.text, font: 'Calibri', size: r.size || 21, color: r.color || TEXT, bold: r.bold, italics: r.italic })) })
const bullet = (t: string, o?: { color?: string; bold?: boolean }) => new Paragraph({ bullet: { level: 0 }, spacing: { after: 40 }, children: [new TextRun({ text: t, font: 'Calibri', size: 21, color: o?.color || TEXT, bold: o?.bold })] })
const spacer = (pts = 100) => new Paragraph({ spacing: { after: pts }, children: [] })
const box = (t: string, bg: string, fg: string, bold = true) => new Paragraph({ spacing: { before: 80, after: 80 }, shading: { type: ShadingType.CLEAR, fill: bg }, indent: { left: 200, right: 200 }, children: [new TextRun({ text: '   ' + t + '   ', font: 'Calibri', size: 22, color: fg, bold })] })
const brk = () => new Paragraph({ children: [new PageBreak()] })

function tRow(cells: string[], isH = false, idx = 0) {
  return new TableRow({ children: cells.map((c, j) => new TableCell({
    shading: { type: ShadingType.CLEAR, fill: isH ? ACCENT : idx % 2 === 0 ? LIGHT_BG : 'FFFFFF' },
    margins: { top: 40, bottom: 40, left: 80, right: 80 },
    children: [new Paragraph({ children: [new TextRun({ text: c, font: 'Calibri', size: 18, bold: isH || j === 0, color: isH ? 'FFFFFF' : j === 0 ? ACCENT : TEXT })] })],
  })) })
}

function kpiCell(label: string, value: string, color: string) {
  return new TableCell({ shading: { type: ShadingType.CLEAR, fill: LIGHT_BG }, margins: { top: 80, bottom: 80, left: 100, right: 100 }, children: [
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: value, font: 'Calibri', size: 28, bold: true, color })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 20 }, children: [new TextRun({ text: label, font: 'Calibri', size: 16, color: TEXT_LIGHT })] }),
  ] })
}

function chartImage(filename: string, width: number, height: number): Paragraph | null {
  const path = `./charts/${filename}`
  if (!existsSync(path)) { console.log(`   [SKIP] ${filename} non trouve`); return null }
  const buf = readFileSync(path)
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 100, after: 100 },
    children: [new ImageRun({ data: buf, transformation: { width, height }, type: 'png' })],
  })
}

// ══════════════════════════════════════════════════════════════
// BUILD
// ══════════════════════════════════════════════════════════════
async function build() {
  console.log('=== RAPPORT FINAL AVEC DATA VIZ ===\n')

  // Carte OSM
  let mapBuffer: Buffer | null = null
  try {
    const StaticMaps = (await import('staticmaps')).default
    const map = new StaticMaps({ width: 640, height: 300, tileUrl: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', tileSize: 256, tileRequestHeader: { 'User-Agent': 'SatoreaCRM/1.0' } })
    await map.render([2.3783, 48.8648], 15)
    mapBuffer = await map.image.buffer('image/png') as Buffer
    writeFileSync('charts/carte-esthelia.png', mapBuffer)
    console.log('Carte OSM : OK')
  } catch (e: any) { console.log('Carte OSM : skip -', e.message?.slice(0, 60)) }

  const date = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

  const doc = new Document({
    styles: { default: { document: { run: { font: 'Calibri', size: 21, color: TEXT } } } },
    sections: [
      // ═══ COUVERTURE ═══
      {
        properties: { page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } } },
        footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Confidentiel — Satorea CRM', font: 'Calibri', size: 14, color: TEXT_LIGHT })] })] }) },
        children: [
          spacer(500),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'SATOREA', font: 'Calibri', size: 56, bold: true, color: BRAND })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: 'Briefing Commercial Intelligence', font: 'Calibri', size: 24, color: TEXT_LIGHT })] }),
          spacer(150),
          new Paragraph({ alignment: AlignmentType.CENTER, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: BRAND, space: 1 } }, children: [] }),
          spacer(150),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Rapport Prospect', font: 'Calibri', size: 36, bold: true, color: ACCENT })] }),
          spacer(80),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Beatrice Pignol', font: 'Calibri', size: 28, color: TEXT })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Esthelia — Institut de Beaute', font: 'Calibri', size: 24, color: TEXT_MED })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 }, children: [new TextRun({ text: '73 Rue Oberkampf, 75011 Paris', font: 'Calibri', size: 20, color: TEXT_LIGHT })] }),
          spacer(150),
          box('   SCORE : 64/100  —  TIEDE  —  Fort potentiel   ', AMBER_BG, AMBER_DARK),
          spacer(250),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: date, font: 'Calibri', size: 20, color: TEXT_LIGHT })] }),
        ],
      },

      // ═══ CONTENU ═══
      {
        properties: { page: { margin: { top: 1100, bottom: 1100, left: 1100, right: 1100 } } },
        headers: { default: new Header({ children: [new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: BRAND } }, children: [
          new TextRun({ text: 'SATOREA', font: 'Calibri', size: 16, bold: true, color: BRAND }),
          new TextRun({ text: '   |   Briefing Beatrice Pignol — Esthelia', font: 'Calibri', size: 14, color: TEXT_LIGHT }),
        ] })] }) },
        footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [
          new TextRun({ text: 'Satorea CRM — Page ', font: 'Calibri', size: 14, color: TEXT_LIGHT }),
          new TextRun({ children: [PageNumber.CURRENT], font: 'Calibri', size: 14, color: TEXT_LIGHT }),
        ] })] }) },
        children: [
          // ── 1. VERDICT + SCORE DONUT ──
          h1('1. Verdict & Score Global'), line(),
          // Donut PNG
          ...(chartImage('donut-score.png', 200, 220) ? [chartImage('donut-score.png', 200, 220)!] : []),
          spacer(30),
          new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [new TableRow({ children: [
            kpiCell('Note Google', '4.8/5', BRAND),
            kpiCell('Avis clients', '89', INDIGO),
            kpiCell('CA annuel', '156K', GREEN),
            kpiCell('Effectif', '2', VIOLET),
            kpiCell('Score global', '64/100', AMBER),
          ] })] }),
          spacer(50),
          box('Prospect tiede a tres fort potentiel. 25 ans d\'experience, 4.8 Google, quartier ideal. Manque la dermopigmentation.', AMBER_BG, AMBER_DARK),
          p('Institut etabli depuis 1999, reputation exceptionnelle (top 5% Paris). Beatrice maitrise les soins classiques mais n\'a pas encore franchi le pas de la dermopigmentation. CA 156K pour 2 personnes = solide. SARL eligible OPCO. Le frein : 25 ans d\'habitudes. L\'angle : evolution naturelle de son expertise.'),
          brk(),

          // ── 2. ANALYSE 5 AXES ──
          h1('2. Analyse Multi-Axes du Prospect'), line(),
          p('Score calcule sur 5 dimensions ponderees. Chaque dimension = un levier de vente. La ligne rouge = moyenne du secteur beaute Paris.'),
          spacer(30),
          // RADAR PNG
          ...(chartImage('radar-score.png', 480, 420) ? [chartImage('radar-score.png', 480, 420)!] : []),
          spacer(30),
          // BARRES PNG
          ...(chartImage('bar-dimensions.png', 520, 260) ? [chartImage('bar-dimensions.png', 520, 260)!] : []),
          spacer(30),
          h3('Lecture strategique pour le commercial'),
          rich([{ text: 'Quartier (82) : ', bold: true, color: '14B8A6' }, { text: 'Son plus gros atout. Oberkampf = fort trafic, CSP+ 25-40 ans. Argument : "Votre quartier est ideal pour le microblading."' }]),
          rich([{ text: 'Reputation (78) : ', bold: true, color: GREEN }, { text: '4.8/5 avec 89 avis. Ses clientes l\'adorent. Argument : "Vos clientes fideles seront les premieres a booker."' }]),
          rich([{ text: 'Financier (58) : ', bold: true, color: AMBER }, { text: 'CA 156K correct mais tresorerie juste (8 923 EUR). OPCO = obligatoire. Ne jamais parler prix sans parler financement.' }]),
          rich([{ text: 'Presence (55) : ', bold: true, color: '3B82F6' }, { text: 'Site web + Treatwell OK. Pas d\'Instagram = invisible pour les <35 ans. Le microblading genere du contenu avant/apres naturellement.' }]),
          rich([{ text: 'Activite (35) : ', bold: true, color: VIOLET }, { text: 'Point faible #1. Peu de posts, pas de contenu. C\'est ton argument massue : "Le microblading = contenu Instagram qui se cree tout seul."' }]),
          brk(),

          // ── 3. ANALYSE AVIS CLIENTS ──
          h1('3. Analyse des Avis Clients'), line(),
          p('89 avis Google analyses. Distribution, tendance, mots-cles et citations.'),
          spacer(30),
          // AVIS PNG
          ...(chartImage('avis-distribution.png', 520, 230) ? [chartImage('avis-distribution.png', 520, 230)!] : []),
          spacer(30),
          h3('Ce que les clients disent de positif'),
          bullet('Apaisant — ambiance zen, havre de paix', { color: GREEN_DARK }),
          bullet('Professionnel — expertise reconnue, conseils personnalises', { color: GREEN_DARK }),
          bullet('Chaleureux — equipe adorable, on se sent bien', { color: GREEN_DARK }),
          bullet('Qualite des soins — produits Guinot/Payot apprecies', { color: GREEN_DARK }),
          bullet('Prix correct — bon rapport qualite-prix pour le quartier', { color: GREEN_DARK }),
          spacer(20),
          h3('Points negatifs mentionnes'),
          bullet('Pas de microblading / maquillage permanent — DEMANDE EXPLICITE', { color: RED, bold: true }),
          bullet('Horaires limites — ferme parfois tot', { color: RED }),
          spacer(20),
          box('"Meilleur institut de Paris. Je ne vais nulle part ailleurs depuis 10 ans. Beatrice est exceptionnelle." — Sophie M., 5 etoiles', GREEN_BG, GREEN_DARK, false),
          spacer(10),
          box('"Tres bon institut, soins de qualite. Seul bemol : pas de prestations modernes type microblading. Dommage car j\'aurais aime tout faire au meme endroit." — Clara R., 4 etoiles', AMBER_BG, AMBER_DARK, false),
          p('Cet avis est TON meilleur argument. La cliente demande litteralement le microblading. Cite-le a Beatrice.', { bold: true, color: BRAND, size: 20 }),
          brk(),

          // ── 4. CARTE & QUARTIER ──
          h1('4. Carte & Environnement Local'), line(),
          // CARTE OSM
          ...(mapBuffer ? [
            new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [new ImageRun({ data: mapBuffer, transformation: { width: 520, height: 245 }, type: 'png' })] }),
            p('Carte OpenStreetMap — 73 Rue Oberkampf, Paris 11e (Esthelia)', { italic: true, color: TEXT_LIGHT, size: 16 }),
          ] : [p('(Carte non disponible)', { color: TEXT_LIGHT })]),
          spacer(30),
          // QUARTIER PNG
          ...(chartImage('quartier-indicateurs.png', 520, 180) ? [chartImage('quartier-indicateurs.png', 520, 180)!] : []),
          spacer(20),
          new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [
            tRow(['Indicateur', 'Valeur', 'Ce que ca signifie'], true),
            tRow(['Metros proches', '3 (L5, L9, L3)', 'Excellent — tres accessible, clientele de passage'], false, 0),
            tRow(['Restaurants', '60+', 'Zone tres animee, fort trafic pieton'], false, 1),
            tRow(['Salons beaute', '12 dans 500m', 'Forte concurrence — AUCUN ne fait de dermopigmentation'], false, 2),
            tRow(['Pharmacies', '8', 'Quartier sante/beaute actif'], false, 3),
            tRow(['Trafic pieton', '82/100', 'Zone premium a tres fort passage'], false, 4),
          ] }),
          brk(),

          // ── 5. ROI PROJECTION ──
          h1('5. Projection ROI — 12 mois'), line(),
          p('Simulation basee sur : formation microblading 1 400 EUR HT, seance a 225 EUR, 3 clientes/semaine avec montee progressive.'),
          spacer(30),
          // ROI PNG
          ...(chartImage('roi-projection.png', 520, 270) ? [chartImage('roi-projection.png', 520, 270)!] : []),
          spacer(30),
          new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [
            tRow(['Indicateur', 'Valeur'], true),
            tRow(['Investissement formation', '1 400 EUR HT (0 EUR si OPCO)'], false, 0),
            tRow(['Prix moyen seance', '225 EUR'], false, 1),
            tRow(['Clientes/semaine (hypothese basse)', '3'], false, 2),
            tRow(['CA mensuel additionnel', '2 400 — 3 000 EUR'], false, 3),
            tRow(['CA annuel additionnel', '+27 000 EUR minimum'], false, 4),
            tRow(['Delai remboursement', '2-3 semaines'], false, 5),
            tRow(['Impact sur marge nette', 'De 7.2% a 15-20%'], false, 6),
          ] }),
          box('+27 000 EUR/an de CA additionnel pour un investissement de 0 EUR (OPCO) et 2 jours de formation', GREEN_BG, GREEN_DARK),
          brk(),

          // ── 6. STRATEGIE D'APPROCHE ──
          h1('6. Strategie d\'Approche'), line(),
          new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [
            tRow(['Parametre', 'Recommandation', 'Pourquoi'], true),
            tRow(['Canal', 'Appel fixe', 'Elle gere un salon — pas d\'email, appel direct'], false, 0),
            tRow(['Numero', '01 48 05 15 67', 'Fixe salon, pas de standard'], false, 1),
            tRow(['Jour', 'Mardi ou mercredi', 'Jours les plus calmes du salon'], false, 2),
            tRow(['Heure', '10h - 11h30', 'Avant les premiers RDV clients'], false, 3),
            tRow(['Duree', '7-10 min', 'Plus dispo qu\'un salon de 4, mais aller droit au but'], false, 4),
            tRow(['Angle', 'Evolution naturelle de 25 ans', 'Pas "formation" mais "nouvelle prestation premium"'], false, 5),
            tRow(['Objectif', 'RDV passage au salon', 'Face-a-face = taux conversion 3x'], false, 6),
          ] }),
          brk(),

          // ── 7. SCRIPT TELEPHONIQUE ──
          h1('7. Script Telephonique Complet'), line(),
          p('4 etapes progressives. Lis avant d\'appeler, adapte le ton, garde la structure.'),
          spacer(30),

          box('ETAPE 1 — ACCROCHE (15 sec)', BRAND_BG, ACCENT),
          p('"Bonjour Beatrice, je suis [Prenom] de Dermotec Advanced, centre Qualiopi au 75 boulevard Richard Lenoir — on est voisins dans le 11e ! J\'ai vu vos avis, 4.8 sur Google avec 89 avis, c\'est exceptionnel apres 25 ans. Bravo."', { italic: true }),
          bullet('"On est voisins" = proximite, confiance', { color: TEXT_MED }),
          bullet('Cite le 4.8 et 89 avis = recherches faites', { color: TEXT_MED }),
          bullet('"25 ans + Bravo" = valorisation qui desarme', { color: TEXT_MED }),
          spacer(30),

          box('ETAPE 2 — TRANSITION (15 sec)', 'EEF2FF', INDIGO),
          p('"Je vous appelle parce qu\'on accompagne des institutes de votre niveau a ajouter la dermopigmentation. C\'est une evolution naturelle pour une pro qui maitrise deja les soins du visage, et c\'est la prestation la plus demandee dans le 11e."', { italic: true }),
          bullet('"De votre niveau" = reconnaissance expertise', { color: TEXT_MED }),
          bullet('"Evolution naturelle" = pas une rupture', { color: TEXT_MED }),
          bullet('"La plus demandee dans le 11e" = preuve sociale locale', { color: TEXT_MED }),
          spacer(30),

          box('ETAPE 3 — PROPOSITION DE VALEUR (30 sec)', 'F5F3FF', VIOLET),
          p('"En 2 jours, vous ou Laura maitrisez le microblading. 200-250 EUR la seance, 3 clientes/semaine = 2 400 a 3 000 EUR de CA supplementaire par mois. Et votre SARL cotise a l\'OPCO EP depuis 25 ans : la formation est financee a 100%, zero de votre poche."', { italic: true }),
          bullet('Chiffres concrets : 200-250 EUR/seance', { color: TEXT_MED }),
          bullet('CA mensuel projete : 2 400-3 000 EUR', { color: TEXT_MED }),
          bullet('OPCO = 0 EUR — argument massue', { color: TEXT_MED }),
          spacer(30),

          box('ETAPE 4 — CLOSING (15 sec)', GREEN_BG, GREEN_DARK),
          p('"Je passe au salon cette semaine avec les photos avant/apres et le simulateur de rentabilite. Si ca vous parle, on monte le dossier OPCO — 15 minutes, gratuit. Mardi ou mercredi, qu\'est-ce qui vous arrange ?"', { italic: true }),
          bullet('"Je passe" = il se deplace = respect', { color: TEXT_MED }),
          bullet('"Mardi ou mercredi" = question alternative, pas oui/non', { color: TEXT_MED }),
          brk(),

          // ── 8. OBJECTIONS ──
          h1('8. Objections & Contre-Arguments'), line(),
          p('Chaque objection = signal d\'interet deguise. 5 scenarios prepares.'),
          spacer(30),

          ...[
            { t: '"C\'est trop cher"', pensee: 'Tresorerie 8 923 EUR — pas de cash dispo.', rep: 'Votre SARL cotise a l\'OPCO depuis 1999. 25 ans = droits accumules. Financement 100%. 0 EUR de votre poche.', alt: 'Paiement 3x sans frais : 467 EUR/mois. Avec 2 400 EUR de CA additionnel, c\'est 5x couvert.' },
            { t: '"J\'ai pas le temps / On est que deux"', pensee: 'Si elle part, Laura gere seule 2 jours.', rep: '2 jours seulement, un lundi-mardi. Laura tient le salon. Ces 2 jours = CA pendant 20 ans. Meilleur ratio temps/retour.' },
            { t: '"Ca fait 25 ans que ca marche comme ca"', pensee: 'Peur du changement, identite construite sur 25 ans.', rep: '25 ans de base solide = vous POUVEZ evoluer. La dermo s\'ajoute, ne remplace rien. Comme les massages balinais. Vos clientes fideles seront les premieres.' },
            { t: '"C\'est pas mon style, trop medical"', pensee: 'Associe la dermo a l\'injectable.', rep: 'Microblading = maquillage semi-permanent. Stylo a micro-lames, pas de machine. Geste artistique. "No makeup makeup" = votre positionnement zen.' },
            { t: '"Laissez-moi reflechir"', pensee: 'Interessee mais pas convaincue.', rep: 'Je vous envoie un dossier avant/apres de nos stagiaires avec leurs chiffres du 1er mois. Par email ou je depose au salon ?' },
          ].flatMap(obj => [
            box(obj.t, AMBER_BG, AMBER_DARK),
            p(`Elle pense : "${obj.pensee}"`, { italic: true, color: TEXT_MED }),
            p(`Reponse : "${obj.rep}"`, { italic: true, color: GREEN_DARK }),
            ...(obj.alt ? [p(`Si insiste : "${obj.alt}"`, { italic: true, color: AMBER_DARK })] : []),
            spacer(30),
          ]),
          brk(),

          // ── 9. DOULEURS & LEVIERS ──
          h1('9. Douleurs & Leviers Psychologiques'), line(),
          h3('Ses douleurs'),
          bullet('Plafond CA 156K — marge 7.2%, pas de reserve', { color: RED }),
          bullet('Aucune prestation premium >100 EUR — panier moyen bas', { color: RED }),
          bullet('12 concurrents dans 500m qui grignotent les parts de marche', { color: RED }),
          bullet('Zero Instagram = invisible pour les <35 ans', { color: RED }),
          bullet('Un avis client demande le microblading = demande reelle non satisfaite', { color: RED }),
          spacer(30),
          h3('Ses aspirations'),
          bullet('Perenniser 25 ans de travail', { color: GREEN_DARK }),
          bullet('Monter en gamme sans perdre l\'identite "cocon zen"', { color: GREEN_DARK }),
          bullet('Augmenter le CA sans embaucher', { color: GREEN_DARK }),
          bullet('Avoir du contenu Instagram pour attirer les 25-35 ans', { color: GREEN_DARK }),
          bullet('Etre LA reference dermo d\'Oberkampf', { color: GREEN_DARK }),
          spacer(30),
          h3('Comment positionner'),
          rich([{ text: 'Ne dis JAMAIS "formation". ', bold: true, color: RED }, { text: 'Dis :' }]),
          bullet('"Evolution naturelle de 25 ans d\'expertise"', { bold: true }),
          bullet('"La prestation premium qui manque a votre carte"', { bold: true }),
          bullet('"2 jours pour 20 ans de rentabilite"', { bold: true }),
          bullet('"Du contenu Instagram qui se cree tout seul"', { bold: true }),
          brk(),

          // ── 10. FORMATIONS ──
          h1('10. Formations Recommandees'), line(),
          box('RECOMMANDATION PRINCIPALE', BRAND_BG, ACCENT),
          h3('Microblading / Microshading — 1 400 EUR HT'),
          p('2 jours (14h) | OPCO EP eligible | Financement 100%'),
          bullet('Extension naturelle soins visage Guinot/Payot'),
          bullet('89 avis positifs = clientes pretes a tester'),
          bullet('Aucun concurrent dermo sur Oberkampf'),
          bullet('Panier moyen x4 : de 50 EUR a 200 EUR'),
          p('ROI : 200-250 EUR/seance x 3/sem = 2 400-3 000 EUR/mois. Rembourse en 3 semaines.', { bold: true, color: GREEN_DARK }),
          spacer(30),
          box('COMPLEMENTAIRE', 'F5F3FF', VIOLET),
          h3('Full Lips — 1 400 EUR HT'),
          bullet('Suite logique du microblading — meme geste, meme clientele'),
          bullet('300 EUR/seance = marge superieure. +3 600 EUR/mois potentiel.'),
          spacer(30),
          box('UPSELL FUTUR', LIGHT_BG, TEXT_MED),
          h3('Rehaussement Cils + Volume Russe — 890 EUR HT'),
          bullet('Elle fait deja rehaussement = montee en gamme directe'),
          bullet('Prestation recurrente (retouches mensuelles) = fidelisation max'),
          brk(),

          // ── 11. FINANCEMENT ──
          h1('11. Strategie Financement'), line(),
          box('OPCO EP — SARL beaute depuis 1999. 25 ans de cotisations. Cout pour Beatrice : 0 EUR.', GREEN_BG, GREEN_DARK),
          spacer(30),
          p('Elle connait les OPCO (25 ans de gerance). Ne la prends pas de haut. Dis :'),
          box('"Votre SARL cotise depuis 25 ans — il serait dommage de ne pas utiliser vos droits. On s\'occupe de tout, 15 minutes."', GREEN_BG, GREEN_DARK, false),
          spacer(20),
          h3('Alternatives'),
          bullet('CPF : si Beatrice ou Laura ont des droits'),
          bullet('AGEFICE : si inscrite comme independante'),
          bullet('Paiement 3x sans frais : 467 EUR/mois'),
          bullet('Comptant avec remise 5% : 1 330 EUR HT'),
          brk(),

          // ── 12. PLAN D'ACTION ──
          h1('12. Plan d\'Action'), line(),
          new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [
            tRow(['Quand', 'Action', 'Si ca marche'], true),
            tRow(['Aujourd\'hui', 'Appeler 01 48 05 15 67 (10h-11h30)', 'Fixer RDV au salon'], false, 0),
            tRow(['Si absente', 'Message vocal court + curiosite', 'Elle rappelle'], false, 1),
            tRow(['J+1', 'Rappeler + email avant/apres + simulateur ROI', 'Elle lit et rappelle'], false, 2),
            tRow(['J+3', '"Avez-vous pu regarder les photos ?"', 'Creneau de passage'], false, 3),
            tRow(['J+7', 'Passer PHYSIQUEMENT 73 rue Oberkampf', 'Face-a-face = conversion 3x'], false, 4),
            tRow(['J+14', 'Email temoignage video stagiaire similaire', 'Conclure ou rappel mensuel'], false, 5),
          ] }),
          spacer(200),
          box('Beatrice a 25 ans d\'experience, 89 avis a 4.8 etoiles, et un quartier en or. Ne vends pas une formation — offre-lui l\'opportunite de faire evoluer un quart de siecle de savoir-faire. A toi de jouer.', BRAND_BG, ACCENT),
          spacer(50),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Satorea CRM — www.satorea.fr — contact@satorea.fr', font: 'Calibri', size: 16, color: TEXT_LIGHT })] }),
        ],
      },
    ],
  })

  const buffer = await Packer.toBuffer(doc)
  const filename = 'Briefing-Esthelia-FINAL.docx'
  writeFileSync(filename, buffer)
  console.log(`\nWord genere : ${filename} (${(buffer.length / 1024).toFixed(0)} KB)`)
  console.log('Contenu : carte OSM + 6 graphiques PNG + 12 sections narratives')
}

build().catch(e => { console.error(e); process.exit(1) })
