/**
 * GENERATEUR DE BRIEFING COMMERCIAL WORD
 * Module reutilisable pour tout prospect
 *
 * Usage:
 *   import { generateBriefingWord } from '@/lib/generate-briefing-word'
 *   const buffer = await generateBriefingWord(data)
 */

import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, HeadingLevel, BorderStyle, ShadingType,
  Header, Footer, PageNumber, PageBreak, ImageRun,
} from 'docx'

// ══════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════
export interface BriefingData {
  prospect: {
    prenom: string
    nom?: string
    entreprise?: string
    adresse?: string
    tel?: string
    email?: string
    siret?: string
    forme_juridique?: string
    date_creation?: string
    effectif?: number
    equipe?: string[]
    services?: string[]
    instagram?: string
    site_web?: string
    google_rating?: number
    google_avis?: number
    ca?: number
    dirigeant?: string
  }
  scores: {
    global: number
    reputation: number
    presence: number
    activity: number
    financial: number
    neighborhood: number
  }
  classification: 'CHAUD' | 'TIEDE' | 'FROID'
  // Contenu commercial
  verdict: string
  brief: string
  histoire: string
  situation_business: string
  reputation_visibilite: string
  environnement: string
  atouts: string[]
  pieges: string[]
  strategie: {
    canal: string
    numero?: string
    jour: string
    heure: string
    duree: string
    angle: string
    objectif: string
  }
  script: {
    accroche: string
    accroche_pourquoi: string[]
    transition: string
    transition_pourquoi: string[]
    proposition: string
    proposition_chiffres: string[]
    closing: string
    closing_pourquoi: string[]
  }
  objections: {
    titre: string
    pensee_reelle: string
    reponse: string
    si_insiste?: string
  }[]
  douleurs: string[]
  aspirations: string[]
  positionnement: string[]
  formations: {
    nom: string
    prix: string
    duree: string
    niveau_priorite: 'PRINCIPAL' | 'COMPLEMENTAIRE' | 'UPSELL'
    pourquoi: string[]
    roi?: string
  }[]
  financement: {
    option_principale: string
    comment_parler: string
    phrase_cle: string
    alternatives: string[]
  }
  plan_action: { quand: string; action: string; si_ok: string }[]
  message_final: string
  // NOUVELLES SECTIONS
  avis?: {
    total: number
    moyenne: number
    distribution: { stars: number; count: number; pct: number }[]
    trend: 'improving' | 'stable' | 'declining'
    trendDelta: number
    ownerResponseRate: number
    positiveKeywords: string[]
    negativeKeywords: string[]
    topPositive?: { author: string; text: string }
    topNegative?: { author: string; text: string; rating: number }
    fetchedCount: number
    withTextPct: number
    withPhotos: number
  }
  quartier?: {
    metros: number
    restaurants: number
    concurrentsBeaute: number
    pharmacies: number
    footTrafficScore: number
  }
  mapImageBuffer?: Buffer // Image PNG de la carte OpenStreetMap
  coordonnees?: { lat: number; lng: number }
}

// ══════════════════════════════════════════════════════════════
// COULEURS
// ══════════════════════════════════════════════════════════════
const BRAND = '2EC6F3'
const ACCENT = '082545'
const GREEN = '10B981'
const GREEN_DARK = '059669'
const AMBER = 'F59E0B'
const AMBER_DARK = 'D97706'
const RED = 'EF4444'
const INDIGO = '6366F1'
const VIOLET = '8B5CF6'
const TEXT = '1E293B'
const TEXT_MED = '475569'
const TEXT_LIGHT = '94A3B8'
const LIGHT_BG = 'F8FAFC'
const BRAND_BG = 'F0F9FF'
const GREEN_BG = 'ECFDF5'
const AMBER_BG = 'FFFBEB'

// ══════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════
function h1(text: string) { return new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 120 }, children: [new TextRun({ text, font: 'Calibri', size: 32, bold: true, color: ACCENT })] }) }
function h2(text: string) { return new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 }, children: [new TextRun({ text, font: 'Calibri', size: 26, bold: true, color: ACCENT })] }) }
function h3(text: string) { return new Paragraph({ heading: HeadingLevel.HEADING_3, spacing: { before: 150, after: 80 }, children: [new TextRun({ text, font: 'Calibri', size: 22, bold: true, color: BRAND })] }) }
function line() { return new Paragraph({ spacing: { after: 200 }, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: BRAND } }, children: [] }) }
function p(text: string, opts?: { bold?: boolean; italic?: boolean; color?: string; size?: number }) {
  return new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text, font: 'Calibri', size: opts?.size || 21, color: opts?.color || TEXT, bold: opts?.bold, italics: opts?.italic })] })
}
function rich(runs: { text: string; bold?: boolean; italic?: boolean; color?: string; size?: number; underline?: boolean }[]) {
  return new Paragraph({ spacing: { after: 80 }, children: runs.map(r => new TextRun({ text: r.text, font: 'Calibri', size: r.size || 21, color: r.color || TEXT, bold: r.bold, italics: r.italic, underline: r.underline ? {} : undefined })) })
}
function bullet(text: string, opts?: { color?: string; bold?: boolean }) {
  return new Paragraph({ bullet: { level: 0 }, spacing: { after: 40 }, children: [new TextRun({ text, font: 'Calibri', size: 21, color: opts?.color || TEXT, bold: opts?.bold })] })
}
function spacer(pts = 100) { return new Paragraph({ spacing: { after: pts }, children: [] }) }
function box(text: string, bg: string, fg: string, bold = true) {
  return new Paragraph({ spacing: { before: 80, after: 80 }, shading: { type: ShadingType.CLEAR, fill: bg }, indent: { left: 200, right: 200 }, children: [new TextRun({ text: '   ' + text + '   ', font: 'Calibri', size: 22, color: fg, bold })] })
}
function scoreBar(label: string, value: number, color: string) {
  const f = Math.round(value / 5), e = 20 - f
  return new Paragraph({ spacing: { after: 40 }, children: [
    new TextRun({ text: label.padEnd(14), font: 'Consolas', size: 18, color: TEXT_MED }),
    new TextRun({ text: '\u2588'.repeat(f), font: 'Consolas', size: 18, color }),
    new TextRun({ text: '\u2591'.repeat(e), font: 'Consolas', size: 18, color: 'E2E8F0' }),
    new TextRun({ text: ` ${value}/100`, font: 'Calibri', size: 18, bold: true, color }),
  ] })
}
function kpiCell(label: string, value: string, color: string) {
  return new TableCell({ shading: { type: ShadingType.CLEAR, fill: LIGHT_BG }, margins: { top: 80, bottom: 80, left: 100, right: 100 }, children: [
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: value, font: 'Calibri', size: 28, bold: true, color })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 20 }, children: [new TextRun({ text: label, font: 'Calibri', size: 16, color: TEXT_LIGHT })] }),
  ] })
}
function tableRow(cells: string[], isHeader = false, idx = 0) {
  return new TableRow({ children: cells.map((cell, j) => new TableCell({
    shading: { type: ShadingType.CLEAR, fill: isHeader ? ACCENT : idx % 2 === 0 ? LIGHT_BG : 'FFFFFF' },
    margins: { top: 40, bottom: 40, left: 80, right: 80 },
    children: [new Paragraph({ children: [new TextRun({ text: cell, font: 'Calibri', size: 18, bold: isHeader || j === 0, color: isHeader ? 'FFFFFF' : j === 0 ? ACCENT : TEXT })] })],
  })) })
}

function classConfig(c: string) {
  return c === 'CHAUD' ? { bg: GREEN_BG, fg: GREEN_DARK } : c === 'TIEDE' ? { bg: AMBER_BG, fg: AMBER_DARK } : { bg: 'FEF2F2', fg: RED }
}

function pageBreak() { return new Paragraph({ children: [new PageBreak()] }) }

// Script step colors
const STEP_COLORS = [BRAND, INDIGO, VIOLET, GREEN_DARK]
const STEP_BGS = [BRAND_BG, 'EEF2FF', 'F5F3FF', GREEN_BG]

// ══════════════════════════════════════════════════════════════
// GENERATEUR
// ══════════════════════════════════════════════════════════════
export async function generateBriefingWord(d: BriefingData): Promise<Buffer> {
  const date = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  const nom = `${d.prospect.prenom} ${d.prospect.nom || ''}`.trim()
  const cc = classConfig(d.classification)

  const doc = new Document({
    styles: { default: { document: { run: { font: 'Calibri', size: 21, color: TEXT } } } },
    sections: [
      // ═══ COUVERTURE ═══
      {
        properties: { page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } } },
        footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Document confidentiel — Usage interne Satorea CRM', font: 'Calibri', size: 14, color: TEXT_LIGHT })] })] }) },
        children: [
          spacer(600),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'SATOREA', font: 'Calibri', size: 56, bold: true, color: BRAND })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: 'Briefing Commercial Intelligence', font: 'Calibri', size: 24, color: TEXT_LIGHT })] }),
          spacer(200),
          new Paragraph({ alignment: AlignmentType.CENTER, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: BRAND, space: 1 } }, children: [] }),
          spacer(200),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Rapport Prospect', font: 'Calibri', size: 36, bold: true, color: ACCENT })] }),
          spacer(100),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: nom, font: 'Calibri', size: 28, color: TEXT })] }),
          ...(d.prospect.entreprise ? [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: d.prospect.entreprise, font: 'Calibri', size: 24, color: TEXT_MED })] })] : []),
          ...(d.prospect.adresse ? [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [new TextRun({ text: d.prospect.adresse, font: 'Calibri', size: 20, color: TEXT_LIGHT })] })] : []),
          spacer(200),
          box(`   SCORE : ${d.scores.global}/100  —  ${d.classification}   `, cc.bg, cc.fg),
          spacer(300),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: date, font: 'Calibri', size: 20, color: TEXT_LIGHT })] }),
        ],
      },
      // ═══ CONTENU ═══
      {
        properties: { page: { margin: { top: 1200, bottom: 1200, left: 1200, right: 1200 } } },
        headers: { default: new Header({ children: [new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: BRAND } }, children: [
          new TextRun({ text: 'SATOREA', font: 'Calibri', size: 16, bold: true, color: BRAND }),
          new TextRun({ text: `   |   Briefing ${nom}`, font: 'Calibri', size: 14, color: TEXT_LIGHT }),
        ] })] }) },
        footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [
          new TextRun({ text: 'Satorea CRM — Confidentiel — Page ', font: 'Calibri', size: 14, color: TEXT_LIGHT }),
          new TextRun({ children: [PageNumber.CURRENT], font: 'Calibri', size: 14, color: TEXT_LIGHT }),
        ] })] }) },
        children: [
          // SOMMAIRE
          h1('Sommaire'), line(),
          ...['1. Verdict & Score', '2. Qui est ce prospect ?', '3. Analyse 5 axes',
            '4. Analyse des avis clients', '5. Carte & environnement local',
            '6. Strategie d\'approche', '7. Script telephonique complet',
            '8. Objections & contre-arguments', '9. Douleurs & leviers psychologiques',
            '10. Formations recommandees', '11. Strategie financement', '12. Plan d\'action',
          ].map(t => p(t, { bold: true, color: ACCENT })),
          pageBreak(),

          // 1. VERDICT
          h1('1. Verdict & Score'), line(),
          box(`SCORE GLOBAL : ${d.scores.global}/100  —  Classification : ${d.classification}`, cc.bg, cc.fg),
          spacer(50),
          p(d.verdict, { size: 22 }),
          spacer(50),
          new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [new TableRow({ children: [
            kpiCell('Note Google', d.prospect.google_rating ? `${d.prospect.google_rating}/5` : '--', BRAND),
            kpiCell('Avis clients', `${d.prospect.google_avis || '--'}`, INDIGO),
            kpiCell('Effectif', `${d.prospect.effectif || '--'}`, VIOLET),
            kpiCell('Score global', `${d.scores.global}/100`, d.scores.global >= 60 ? GREEN : AMBER),
          ] })] }),
          pageBreak(),

          // 2. QUI EST CE PROSPECT
          h1('2. Qui est ce prospect ?'), line(),
          p(d.histoire),
          spacer(50),
          h3('Ce qu\'il/elle fait bien'),
          ...d.atouts.map(a => bullet(a, { color: GREEN_DARK })),
          spacer(30),
          h3('Ce qui lui manque'),
          ...d.pieges.map(pi => bullet(pi, { color: RED })),
          spacer(30),
          ...(d.prospect.siret ? [
            h3('Fiche entreprise'),
            p(`SIRET : ${d.prospect.siret}`),
            ...(d.prospect.forme_juridique ? [p(`Forme : ${d.prospect.forme_juridique}`)] : []),
            ...(d.prospect.date_creation ? [p(`Creation : ${d.prospect.date_creation}`)] : []),
            ...(d.prospect.adresse ? [p(`Adresse : ${d.prospect.adresse}`)] : []),
            ...(d.prospect.dirigeant ? [p(`Dirigeant : ${d.prospect.dirigeant}`)] : []),
            ...(d.prospect.equipe?.length ? [p(`Equipe : ${d.prospect.equipe.join(', ')}`)] : []),
            ...(d.prospect.services?.length ? [p(`Services : ${d.prospect.services.join(' | ')}`)] : []),
          ] : []),
          pageBreak(),

          // 3. ANALYSE 5 AXES
          h1('3. Analyse 5 axes'), line(),
          p('Score calcule sur 5 dimensions ponderees. Chaque dimension = un levier de vente.'),
          spacer(50),
          scoreBar('Reputation  ', d.scores.reputation, GREEN),
          scoreBar('Quartier    ', d.scores.neighborhood, '14B8A6'),
          scoreBar('Presence    ', d.scores.presence, '3B82F6'),
          scoreBar('Financier   ', d.scores.financial, AMBER),
          scoreBar('Activite    ', d.scores.activity, VIOLET),
          spacer(50),
          box(`Score global pondere : ${d.scores.global}/100`, BRAND_BG, ACCENT),
          spacer(50),
          h3('Ce que ca veut dire pour toi'),
          p(d.reputation_visibilite),
          spacer(20),
          p(d.environnement),
          spacer(20),
          p(d.situation_business),
          pageBreak(),

          // 4. ANALYSE DES AVIS CLIENTS
          ...(d.avis ? [
            h1('4. Analyse des Avis Clients'), line(),
            // KPIs avis
            new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [new TableRow({ children: [
              kpiCell('Note moyenne', `${d.avis.moyenne}/5`, BRAND),
              kpiCell('Total avis', `${d.avis.total}`, INDIGO),
              kpiCell('Analysés', `${d.avis.fetchedCount}`, VIOLET),
              kpiCell('Taux réponse', `${d.avis.ownerResponseRate}%`, GREEN),
            ] })] }),
            spacer(50),

            // Distribution étoiles (barres textuelles)
            h3('Distribution des étoiles'),
            ...d.avis.distribution.slice().reverse().map(dist => {
              const barLen = Math.round(dist.pct / 5)
              const emptyLen = 20 - barLen
              const barColor = dist.stars >= 4 ? GREEN : dist.stars === 3 ? AMBER : RED
              return new Paragraph({ spacing: { after: 30 }, children: [
                new TextRun({ text: `${dist.stars}★ `, font: 'Consolas', size: 18, bold: true, color: barColor }),
                new TextRun({ text: '\u2588'.repeat(barLen), font: 'Consolas', size: 18, color: barColor }),
                new TextRun({ text: '\u2591'.repeat(emptyLen), font: 'Consolas', size: 18, color: 'E2E8F0' }),
                new TextRun({ text: `  ${dist.count} avis (${dist.pct}%)`, font: 'Calibri', size: 18, color: TEXT_MED }),
              ] })
            }),
            spacer(30),

            // Tendance
            box(
              d.avis.trend === 'improving' ? `↑ Tendance en hausse (+${d.avis.trendDelta} sur 6 mois) — Bon signe, les clients recents sont plus satisfaits`
              : d.avis.trend === 'declining' ? `↓ Tendance en baisse (${d.avis.trendDelta} sur 6 mois) — Angle possible : l'aider a ameliorer sa reputation`
              : `→ Tendance stable sur 6 mois — La reputation est etablie`,
              d.avis.trend === 'improving' ? GREEN_BG : d.avis.trend === 'declining' ? 'FEF2F2' : LIGHT_BG,
              d.avis.trend === 'improving' ? GREEN_DARK : d.avis.trend === 'declining' ? RED : TEXT_MED
            ),
            spacer(30),

            // Mots-clés
            ...(d.avis.positiveKeywords.length > 0 ? [
              h3('Ce que les clients disent de positif'),
              ...d.avis.positiveKeywords.map(kw => bullet(kw, { color: GREEN_DARK })),
            ] : []),
            ...(d.avis.negativeKeywords.length > 0 ? [
              spacer(20),
              h3('Points negatifs mentionnes'),
              ...d.avis.negativeKeywords.map(kw => bullet(kw, { color: RED })),
            ] : []),
            spacer(30),

            // Citations
            ...(d.avis.topPositive ? [
              h3('Meilleur avis (5★)'),
              box(`"${d.avis.topPositive.text.slice(0, 300)}${d.avis.topPositive.text.length > 300 ? '...' : ''}"`, GREEN_BG, GREEN_DARK, false),
              p(`— ${d.avis.topPositive.author}`, { italic: true, color: TEXT_LIGHT, size: 18 }),
            ] : []),
            ...(d.avis.topNegative ? [
              spacer(20),
              h3(`Avis critique (${d.avis.topNegative.rating}★)`),
              box(`"${d.avis.topNegative.text.slice(0, 300)}${d.avis.topNegative.text.length > 300 ? '...' : ''}"`, 'FEF2F2', RED, false),
              p(`— ${d.avis.topNegative.author}`, { italic: true, color: TEXT_LIGHT, size: 18 }),
            ] : []),
            spacer(20),

            // Stats complémentaires
            p(`${d.avis.withTextPct}% des avis ont un commentaire detaille • ${d.avis.withPhotos} avis avec photo`, { size: 18, color: TEXT_LIGHT }),
            pageBreak(),
          ] : []),

          // 5. CARTE & ENVIRONNEMENT LOCAL
          ...(d.quartier || d.mapImageBuffer ? [
            h1('5. Carte & Environnement Local'), line(),

            // Carte OSM si disponible
            ...(d.mapImageBuffer ? [
              new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [
                new ImageRun({ data: d.mapImageBuffer, transformation: { width: 520, height: 300 }, type: 'png' }),
              ] }),
              p('Carte OpenStreetMap — Emplacement du prospect et environnement', { italic: true, color: TEXT_LIGHT, size: 16 }),
              spacer(30),
            ] : []),

            // Données quartier
            ...(d.quartier ? [
              new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [
                tableRow(['INDICATEUR', 'VALEUR', 'CE QUE CA SIGNIFIE'], true),
                tableRow(['🚇 Metros proches', `${d.quartier.metros}`, d.quartier.metros >= 2 ? 'Excellent — tres accessible' : 'Moyen — necessite voiture/bus'], false, 0),
                tableRow(['🍽 Restaurants', `${d.quartier.restaurants}`, d.quartier.restaurants >= 10 ? 'Zone tres animee' : 'Zone calme'], false, 1),
                tableRow(['💅 Salons beaute', `${d.quartier.concurrentsBeaute}`, d.quartier.concurrentsBeaute >= 5 ? 'Forte concurrence — besoin de se differencier' : 'Peu de concurrence — bon marche'], false, 2),
                tableRow(['💊 Pharmacies', `${d.quartier.pharmacies}`, d.quartier.pharmacies >= 2 ? 'Quartier sante/beaute actif' : 'Peu de commerces sante'], false, 3),
              ] }),
              spacer(30),
              scoreBar('Trafic pieton', d.quartier.footTrafficScore, d.quartier.footTrafficScore >= 60 ? GREEN : AMBER),
              spacer(20),
              box(
                d.quartier.footTrafficScore >= 60 ? 'Zone a fort passage — ideal pour attirer des clients'
                : d.quartier.footTrafficScore >= 30 ? 'Zone a passage modere — les formations l\'aident a se demarquer'
                : 'Zone calme — la cliente cible vient sur rendez-vous, pas en passage',
                BRAND_BG, ACCENT
              ),
            ] : []),
            pageBreak(),
          ] : []),

          // 6. STRATEGIE (anciennement 4)
          h1('6. Strategie d\'approche'), line(),
          new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [
            tableRow(['PARAMETRE', 'RECOMMANDATION', 'POURQUOI'], true),
            ...([
              ['Canal', d.strategie.canal, 'Contact direct = plus efficace que l\'email'],
              ...(d.strategie.numero ? [['Numero', d.strategie.numero, 'Numero direct, pas de standard']] : []),
              ['Jour', d.strategie.jour, 'Meilleur creneau selon l\'activite du salon'],
              ['Heure', d.strategie.heure, 'Avant le rush clients'],
              ['Duree', d.strategie.duree, 'Elle sera occupee — aller droit au but'],
              ['Angle', d.strategie.angle, 'Ce qui va accrocher CE prospect'],
              ['Objectif', d.strategie.objectif, 'Pas vendre au tel, juste obtenir un RDV'],
            ] as string[][]).map((r, i) => tableRow(r, false, i)),
          ] }),
          pageBreak(),

          // 5. SCRIPT
          h1('7. Script telephonique complet'), line(),
          p('Lis ce script avant d\'appeler. Adapte le ton mais garde la structure.'),
          spacer(50),
          // Steps
          ...(['Accroche', 'Transition', 'Proposition', 'Closing'] as const).flatMap((label, i) => {
            const texts = [d.script.accroche, d.script.transition, d.script.proposition, d.script.closing]
            const whys = [d.script.accroche_pourquoi, d.script.transition_pourquoi, d.script.proposition_chiffres, d.script.closing_pourquoi]
            return [
              box(`ETAPE ${i + 1} — ${label.toUpperCase()}`, STEP_BGS[i], STEP_COLORS[i]),
              spacer(30),
              p(`"${texts[i]}"`, { italic: true }),
              spacer(20),
              p('Pourquoi ca marche :', { bold: true, color: ACCENT, size: 18 }),
              ...whys[i].map(w => bullet(w, { color: TEXT_MED })),
              spacer(40),
            ]
          }),
          pageBreak(),

          // 6. OBJECTIONS
          h1('8. Objections & contre-arguments'), line(),
          p('Chaque objection est un signal d\'interet deguise. Voici comment les transformer.'),
          spacer(50),
          ...d.objections.flatMap(obj => [
            box(obj.titre, AMBER_BG, AMBER_DARK),
            p('Ce qu\'il/elle pense vraiment :', { bold: true, color: ACCENT }),
            p(obj.pensee_reelle, { italic: true, color: TEXT_MED }),
            spacer(20),
            p('Ta reponse :', { bold: true, color: GREEN_DARK }),
            p(`"${obj.reponse}"`, { italic: true }),
            ...(obj.si_insiste ? [p('Si insiste :', { bold: true, color: AMBER_DARK }), p(`"${obj.si_insiste}"`, { italic: true })] : []),
            spacer(40),
          ]),
          pageBreak(),

          // 7. DOULEURS
          h1('9. Douleurs & leviers psychologiques'), line(),
          h3('Ses douleurs probables'),
          ...d.douleurs.map(d2 => bullet(d2, { color: RED })),
          spacer(30),
          h3('Ses aspirations'),
          ...d.aspirations.map(a => bullet(a, { color: GREEN_DARK })),
          spacer(30),
          h3('Comment positionner la formation'),
          rich([{ text: 'Ne parle JAMAIS de "formation". ', bold: true, color: RED }, { text: 'Parle de :' }]),
          ...d.positionnement.map(po => bullet(po, { bold: true })),
          pageBreak(),

          // 8. FORMATIONS
          h1('10. Formations recommandees'), line(),
          ...d.formations.flatMap(f => [
            box(f.niveau_priorite === 'PRINCIPAL' ? 'RECOMMANDATION PRINCIPALE' : f.niveau_priorite === 'COMPLEMENTAIRE' ? 'COMPLEMENTAIRE' : 'UPSELL FUTUR',
              f.niveau_priorite === 'PRINCIPAL' ? BRAND_BG : f.niveau_priorite === 'COMPLEMENTAIRE' ? 'F5F3FF' : LIGHT_BG,
              f.niveau_priorite === 'PRINCIPAL' ? ACCENT : f.niveau_priorite === 'COMPLEMENTAIRE' ? VIOLET : TEXT_MED),
            h3(`${f.nom} — ${f.prix}`),
            p(`Duree : ${f.duree}`),
            ...f.pourquoi.map(w => bullet(w)),
            ...(f.roi ? [p(f.roi, { bold: true, color: GREEN_DARK })] : []),
            spacer(30),
          ]),
          pageBreak(),

          // 9. FINANCEMENT
          h1('11. Strategie financement'), line(),
          box(d.financement.option_principale, GREEN_BG, GREEN_DARK),
          spacer(30),
          p(d.financement.comment_parler),
          spacer(20),
          h3('La phrase a dire'),
          box(`"${d.financement.phrase_cle}"`, GREEN_BG, GREEN_DARK),
          spacer(20),
          h3('Alternatives'),
          ...d.financement.alternatives.map(a => bullet(a)),
          spacer(50),

          // 10. PLAN
          h1('12. Plan d\'action'), line(),
          new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [
            tableRow(['QUAND', 'ACTION', 'SI CA MARCHE'], true),
            ...d.plan_action.map((pa, i) => tableRow([pa.quand, pa.action, pa.si_ok], false, i)),
          ] }),
          spacer(200),
          box(d.message_final, BRAND_BG, ACCENT),
          spacer(50),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Satorea CRM — www.satorea.fr — contact@satorea.fr', font: 'Calibri', size: 16, color: TEXT_LIGHT })] }),
        ],
      },
    ],
  })

  return await Packer.toBuffer(doc) as Buffer
}
