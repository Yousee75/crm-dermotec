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
  // INTELLIGENCE COMPLETE
  intelligence?: {
    plateformes_avis?: Array<{ plateforme: string; note?: number; nb_avis?: number; services?: string[]; prix?: string[] }>
    carte_soins?: string[]
    concurrents_zone?: Array<{ nom?: string; type: string; distance_metres?: number }>
    offres_promo?: Array<{ titre: string; prix_barre?: number; prix_promo?: number; reduction?: string }>
    convention_collective?: { code_convention: number; intitule: string; est_secteur_beaute: boolean; droit_formation_heures: number }
    aides_disponibles?: Array<{ nom: string; financeur: string; type: string; montant_max?: number }>
    signaux?: { est_sur_promo: boolean; est_organisme_concurrent: boolean; avis_insuffisants: boolean; zone_saturee: boolean; droits_formation_non_consommes: boolean; en_difficulte: boolean }
    score_global?: number
    niveau?: string
  }
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
// Palette Satorea OFFICIELLE
const BRAND = 'FF5C00'    // Orange Satorea
const ACCENT = '111111'   // Noir
const GREEN = '10B981'
const GREEN_DARK = '059669'
const AMBER = 'FF8C42'    // Orange clair
const AMBER_DARK = 'E65200'
const RED = 'FF2D78'      // Rose
const INDIGO = 'FF5C00'   // Orange (pas de violet)
const VIOLET = 'FF2D78'   // Rose (pas de violet)
const TEXT = '111111'
const TEXT_MED = '3A3A3A'
const TEXT_LIGHT = '777777'
const LIGHT_BG = 'FAF8F5'  // Papier chaud
const BRAND_BG = 'FFF0E5'  // Orange très léger
const GREEN_BG = 'ECFDF5'
const AMBER_BG = 'FFF3E8'

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
      // ═══ PAGE 1 : COUVERTURE + EXECUTIVE SUMMARY (style pyramide inversée) ═══
      {
        properties: { page: { margin: { top: 1000, bottom: 1000, left: 1200, right: 1200 } } },
        footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Document confidentiel — Usage interne Satorea CRM', font: 'Calibri', size: 14, color: TEXT_LIGHT })] })] }) },
        children: [
          // HEADER : Logo + Classification
          new Paragraph({ alignment: AlignmentType.LEFT, children: [
            new TextRun({ text: 'SATOREA', font: 'Calibri', size: 36, bold: true, color: BRAND }),
            new TextRun({ text: '  Intelligence Commerciale', font: 'Calibri', size: 20, color: TEXT_LIGHT }),
          ] }),
          new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: BRAND, space: 1 } }, spacing: { after: 200 }, children: [] }),

          // NOM + ENTREPRISE + SCORE (gros, visible)
          new Paragraph({ spacing: { before: 100 }, children: [
            new TextRun({ text: nom, font: 'Calibri', size: 32, bold: true, color: ACCENT }),
            new TextRun({ text: d.prospect.entreprise ? `  —  ${d.prospect.entreprise}` : '', font: 'Calibri', size: 24, color: TEXT_MED }),
          ] }),
          ...(d.prospect.adresse ? [p(d.prospect.adresse, { color: TEXT_LIGHT, size: 18 })] : []),
          spacer(50),

          // CLASSIFICATION — le message le plus important en premier
          box(`  ${d.classification}  —  Score ${d.scores.global}/100  —  ${d.classification === 'CHAUD' ? 'Appeler aujourd\'hui' : d.classification === 'TIEDE' ? 'Email personnalisé puis relance J+3' : 'Qualifier d\'abord'}  `, cc.bg, cc.fg),
          spacer(50),

          // ═══ EXECUTIVE SUMMARY — 5 messages clés (pyramide inversée) ═══
          h2('Messages clés'),
          rich([
            { text: '1. VERDICT : ', bold: true, color: BRAND },
            { text: d.verdict },
          ]),
          rich([
            { text: '2. OPPORTUNITÉ : ', bold: true, color: BRAND },
            { text: d.brief },
          ]),
          rich([
            { text: '3. FORMATION : ', bold: true, color: BRAND },
            { text: d.formations?.length ? `${d.formations[0].nom} (${d.formations[0].prix}) — ${d.formations[0].argument_roi || d.formations[0].pourquoi}` : 'À déterminer selon profil' },
          ]),
          rich([
            { text: '4. FINANCEMENT : ', bold: true, color: BRAND },
            { text: d.financement?.option_principale || 'OPCO / CPF / Échelonnement — à qualifier' },
          ]),
          rich([
            { text: '5. ACTION : ', bold: true, color: BRAND },
            { text: d.strategie ? `${d.strategie.canal} — ${d.strategie.jour || 'cette semaine'} ${d.strategie.heure || ''} — Angle : ${d.strategie.angle || 'personnalisé'}` : 'Appeler pour qualifier' },
          ]),
          spacer(50),

          // KPIs EN 1 LIGNE
          new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [new TableRow({ children: [
            kpiCell('Score', `${d.scores.global}/100`, d.scores.global >= 60 ? GREEN : d.scores.global >= 30 ? AMBER : RED),
            kpiCell('Note Google', d.prospect.google_rating ? `${d.prospect.google_rating}/5` : '--', BRAND),
            kpiCell('Avis total', `${d.prospect.google_avis || (d.avis?.total || '--')}`, BRAND),
            kpiCell('Ancienneté', d.prospect.date_creation ? `${new Date().getFullYear() - parseInt(d.prospect.date_creation.split(/[-\/]/)[0] || '2020')} ans` : '--', ACCENT),
            kpiCell('Effectif', `${d.prospect.effectif || '--'}`, ACCENT),
          ] })] }),
          spacer(50),

          // SIGNAUX (si disponibles)
          ...(d.intelligence?.signaux ? [
            h3('Signaux détectés'),
            ...(d.intelligence.signaux.est_sur_promo ? [bullet('Sur plateforme promo — prospect cherche des clients', { color: RED, bold: true })] : []),
            ...(d.intelligence.signaux.est_organisme_concurrent ? [bullet('ATTENTION : Organisme de formation concurrent', { color: RED, bold: true })] : []),
            ...(d.intelligence.signaux.droits_formation_non_consommes ? [bullet('Droits formation non consommés — argument financement béton', { color: GREEN_DARK, bold: true })] : []),
            ...(d.intelligence.signaux.zone_saturee ? [bullet('Zone saturée (>10 beauty shops) — besoin de se différencier', { color: AMBER_DARK })] : []),
            ...(d.intelligence.signaux.en_difficulte ? [bullet('Entreprise en difficulté financière — parler financement en priorité', { color: RED, bold: true })] : []),
            ...(d.intelligence.signaux.avis_insuffisants ? [bullet('Peu visible en ligne (<10 avis) — besoin de professionnaliser', { color: AMBER_DARK })] : []),
          ] : []),
          spacer(30),

          // RÉSUMÉ SCORES 5 AXES
          h3('Profil en 5 axes'),
          scoreBar('Réputation  ', d.scores.reputation, GREEN),
          scoreBar('Présence    ', d.scores.presence, BRAND),
          scoreBar('Activité    ', d.scores.activity, AMBER),
          scoreBar('Financier   ', d.scores.financial, AMBER),
          scoreBar('Quartier    ', d.scores.neighborhood, GREEN),
          spacer(50),

          new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `Rapport généré le ${date} — 47 sources de données — v3.0`, font: 'Calibri', size: 14, color: TEXT_LIGHT })] }),
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
          // SOMMAIRE — Structure pyramidale : 5 pages principales + annexes
          h1('Sommaire'), line(),
          p('PAGES PRINCIPALES — Commercial pressé, 5 min de lecture', { bold: true, color: BRAND, size: 22 }),
          ...['   Page 1 : Executive Summary — Messages clés, Score, Signaux',
            '   Page 2 : Qui + Pourquoi — Profil, opportunité, formation recommandée',
            '   Page 3 : Comment lui vendre — Stratégie + Script + Objections',
            '   Page 4 : Financement + ROI — L\'argent, break-even, options',
            '   Page 5 : Plan d\'action 14 jours — Timeline jour par jour',
          ].map(t => p(t, { color: ACCENT })),
          spacer(30),
          p('ANNEXES — Détails pour ceux qui veulent creuser', { bold: true, color: BRAND, size: 22 }),
          ...['   Annexe A : Réputation multi-plateformes — 7 plateformes, avis',
            '   Annexe B : Carte soins & gap analysis — Services vs formations',
            '   Annexe C : Zone & concurrence — Carte, quartier, concurrents',
            '   Annexe D : Données brutes — Fiche entreprise, sources',
          ].map(t => p(t, { color: ACCENT })),
          pageBreak(),

          // ═══════════════════════════════════════════════════
          // PAGE 2 : QUI + POURQUOI (fusionner profil + opportunité)
          // ═══════════════════════════════════════════════════
          h1(`Qui est ${d.prospect.prenom} et pourquoi elle va dire oui`), line(),

          // SITUATION (3 lignes)
          rich([
            { text: 'SITUATION : ', bold: true, color: BRAND },
            { text: `${d.prospect.prenom} tient ${d.prospect.entreprise || 'son salon'} depuis ${d.prospect.date_creation ? new Date().getFullYear() - parseInt(d.prospect.date_creation.split(/[-\/]/)[0] || '2020') : '?'} ans ${d.prospect.adresse ? `dans le ${d.prospect.adresse.split(',').slice(-2)[0]?.trim() || 'quartier'}` : ''}. Note Google ${d.prospect.google_rating || '?'}/5 avec ${d.prospect.google_avis || '?'} avis. ${d.prospect.effectif || '?'} personnes.` },
          ]),
          spacer(30),

          // COMPLICATION (3 lignes)
          rich([
            { text: 'COMPLICATION : ', bold: true, color: RED },
            { text: d.brief },
          ]),
          spacer(30),

          // ANSWER (2 lignes)
          rich([
            { text: 'SOLUTION : ', bold: true, color: GREEN_DARK },
            { text: d.formations?.length ? `${d.formations[0].nom} (${d.formations[0].prix}) — ${d.formations[0].roi || d.formations[0].pourquoi[0] || 'ROI rapide'}` : 'Formation à déterminer selon profil' },
          ]),
          spacer(50),

          // Tableau 2 colonnes : Ce qu'elle fait bien | Ce qui lui manque
          new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [
            new TableRow({ children: [
              new TableCell({
                width: { size: 50, type: WidthType.PERCENTAGE },
                shading: { type: ShadingType.CLEAR, fill: GREEN_BG },
                margins: { top: 100, bottom: 100, left: 100, right: 100 },
                children: [
                  new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Ce qu\'elle fait bien', font: 'Calibri', size: 20, bold: true, color: GREEN_DARK })] }),
                  spacer(20),
                  ...d.atouts.slice(0, 5).map(a => bullet(a, { color: GREEN_DARK })),
                ]
              }),
              new TableCell({
                width: { size: 50, type: WidthType.PERCENTAGE },
                shading: { type: ShadingType.CLEAR, fill: 'FEF2F2' },
                margins: { top: 100, bottom: 100, left: 100, right: 100 },
                children: [
                  new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Ce qui lui manque', font: 'Calibri', size: 20, bold: true, color: RED })] }),
                  spacer(20),
                  ...d.pieges.slice(0, 5).map(p => bullet(p, { color: RED })),
                ]
              })
            ] })
          ] }),
          spacer(50),

          // Score barres 5 axes (compact, 1 ligne chacun)
          scoreBar('Réputation  ', d.scores.reputation, GREEN),
          scoreBar('Présence    ', d.scores.presence, BRAND),
          scoreBar('Activité    ', d.scores.activity, AMBER),
          scoreBar('Financier   ', d.scores.financial, AMBER),
          scoreBar('Quartier    ', d.scores.neighborhood, GREEN),
          pageBreak(),

          // ═══════════════════════════════════════════════════
          // PAGE 3 : COMMENT LUI VENDRE (stratégie + script)
          // ═══════════════════════════════════════════════════
          h1('Comment lui vendre'), line(),

          // Encadré stratégie
          box(`${d.strategie.canal} — ${d.strategie.jour || 'cette semaine'} ${d.strategie.heure || ''} — Angle : ${d.strategie.angle || 'personnalisé'} — Objectif : ${d.strategie.objectif || 'RDV'}`, BRAND_BG, ACCENT),
          spacer(50),

          // Script en 4 étapes visuelles (encadrés colorés empilés)
          box('ÉTAPE 1 — ACCROCHE', STEP_BGS[0], STEP_COLORS[0]),
          p(`"${d.script.accroche}"`, { italic: true, size: 20 }),
          p(`Pourquoi ça marche : ${d.script.accroche_pourquoi.join(', ')}`, { size: 18, color: TEXT_MED }),
          spacer(30),

          box('ÉTAPE 2 — TRANSITION', STEP_BGS[1], STEP_COLORS[1]),
          p(`"${d.script.transition}"`, { italic: true, size: 20 }),
          p(`Pourquoi ça marche : ${d.script.transition_pourquoi.join(', ')}`, { size: 18, color: TEXT_MED }),
          spacer(30),

          box('ÉTAPE 3 — PROPOSITION', STEP_BGS[2], STEP_COLORS[2]),
          p(`"${d.script.proposition}"`, { italic: true, size: 20 }),
          p(`Chiffres clés : ${d.script.proposition_chiffres.join(', ')}`, { size: 18, color: TEXT_MED }),
          spacer(30),

          box('ÉTAPE 4 — CLOSING', GREEN_BG, GREEN_DARK),
          p(`"${d.script.closing}"`, { italic: true, size: 20 }),
          p(`Variante si hésite : ${d.script.closing_pourquoi.join(', ')}`, { size: 18, color: TEXT_MED }),
          spacer(50),

          // Top 3 objections (tableau)
          h3('Top 3 objections'),
          new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [
            tableRow(['Elle dit', 'Elle pense', 'Tu réponds'], true),
            ...d.objections.slice(0, 3).map((obj, i) => tableRow([obj.titre, obj.pensee_reelle, obj.reponse], false, i)),
          ] }),
          pageBreak(),

          // ═══════════════════════════════════════════════════
          // PAGE 4 : FINANCEMENT + ROI (l'argent)
          // ═══════════════════════════════════════════════════
          h1('Financement + ROI'), line(),

          // Encadré vert : Coût net
          (() => {
            const formation = d.formations?.[0]
            const prix = formation ? parseInt(formation.prix.replace(/[^\d]/g, '')) || 0 : 0
            const coutNet = d.financement.option_principale.includes('OPCO') || d.financement.option_principale.includes('100%') ? '0€' : formation?.prix || 'À déterminer'
            return box(`Coût net pour ${d.prospect.prenom} : ${coutNet}`, GREEN_BG, GREEN_DARK)
          })(),
          spacer(30),

          // Options de financement (3 max, en tableau)
          h3('Options de financement'),
          new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [
            tableRow(['Option', 'Financement', 'Avantage'], true),
            tableRow([d.financement.option_principale, d.financement.comment_parler, 'Principal — à présenter en 1er'], false, 0),
            ...d.financement.alternatives.slice(0, 2).map((alt, i) => tableRow(['Alternative', alt, 'Si refus option 1'], false, i+1)),
          ] }),
          spacer(30),

          // Convention collective si détectée
          ...(d.intelligence?.convention_collective ? [
            box(`Convention IDCC ${d.intelligence.convention_collective.code_convention} — ${d.intelligence.convention_collective.droit_formation_heures}h/an de droit formation ${d.intelligence.convention_collective.est_secteur_beaute ? '✓ Secteur beauté' : ''}`, '#ECFDF5', '#065F46'),
            spacer(30),
          ] : []),

          // ROI en 3 scénarios
          h3('ROI en 3 scénarios'),
          (() => {
            const formation = d.formations?.[0]
            const prix = formation ? parseInt(formation.prix.replace(/[^\d]/g, '')) || 1000 : 1000
            return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [
              tableRow(['Scénario', 'CA supplémentaire/mois', 'Break-even', 'ROI 12 mois'], true),
              tableRow(['Conservateur', `${Math.round(prix * 0.15)}€`, '7 mois', `+${Math.round(prix * 0.8)}€`], false, 0),
              tableRow(['Moyen', `${Math.round(prix * 0.25)}€`, '4 mois', `+${Math.round(prix * 2)}€`], false, 1),
              tableRow(['Optimiste', `${Math.round(prix * 0.4)}€`, '3 mois', `+${Math.round(prix * 3.8)}€`], false, 2),
            ] })
          })(),
          spacer(30),

          // Break-even
          box('Même au pire des cas, rentabilisé en 7 mois maximum', BRAND_BG, ACCENT),
          spacer(50),

          // Formations recommandées (max 3, en cartes)
          h3('Formations recommandées'),
          ...d.formations.slice(0, 3).flatMap(f => [
            new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [
              new TableRow({ children: [
                new TableCell({
                  width: { size: 25, type: WidthType.PERCENTAGE },
                  shading: { type: ShadingType.CLEAR, fill: f.niveau_priorite === 'PRINCIPAL' ? BRAND_BG : LIGHT_BG },
                  margins: { top: 60, bottom: 60, left: 60, right: 60 },
                  children: [
                    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: f.nom, font: 'Calibri', size: 18, bold: true, color: ACCENT })] }),
                    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: f.prix, font: 'Calibri', size: 20, bold: true, color: BRAND })] }),
                    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: f.duree, font: 'Calibri', size: 16, color: TEXT_MED })] }),
                  ]
                }),
                new TableCell({
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  margins: { top: 60, bottom: 60, left: 60, right: 60 },
                  children: [
                    new Paragraph({ children: [new TextRun({ text: `Pourquoi elle : ${f.pourquoi.slice(0, 2).join(', ')}`, font: 'Calibri', size: 16, color: TEXT })] }),
                  ]
                }),
                new TableCell({
                  width: { size: 25, type: WidthType.PERCENTAGE },
                  margins: { top: 60, bottom: 60, left: 60, right: 60 },
                  children: [
                    new Paragraph({ children: [new TextRun({ text: f.roi || 'ROI rapide', font: 'Calibri', size: 16, bold: true, color: GREEN_DARK })] }),
                  ]
                }),
              ] })
            ] }),
            spacer(20),
          ]),
          pageBreak(),

          // ═══════════════════════════════════════════════════
          // PAGE 5 : PLAN D'ACTION 14 JOURS
          // ═══════════════════════════════════════════════════
          h1('Plan d\'action 14 jours'), line(),

          // Timeline visuelle
          new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [
            tableRow(['Jour', 'Action', 'Canal', 'Objectif', 'Si OK', 'Si KO'], true),
            ...d.plan_action.slice(0, 10).map((pa, i) => {
              // Extraire les infos du plan d'action existant et les enrichir
              const jour = pa.quand.includes('J+') ? pa.quand : `J+${i}`
              const action = pa.action
              const canal = action.includes('appel') ? '📞 Tel' : action.includes('email') ? '📧 Email' : action.includes('SMS') ? '💬 SMS' : '🎯 Direct'
              const objectif = pa.si_ok.includes('RDV') ? 'RDV' : pa.si_ok.includes('devis') ? 'Devis' : 'Qualification'
              const siOk = pa.si_ok
              const siKo = i < 3 ? 'Relancer J+2' : i < 6 ? 'Changer angle' : 'Qualifier FROID'
              return tableRow([jour, action, canal, objectif, siOk, siKo], false, i)
            }),
          ] }),
          spacer(50),

          // Message motivant final
          box(d.message_final, BRAND_BG, ACCENT),
          spacer(50),

          // Coordonnées + QR code mention (simulated)
          new Paragraph({ alignment: AlignmentType.CENTER, children: [
            new TextRun({ text: 'Satorea CRM — Formation Esthétique Premium', font: 'Calibri', size: 18, bold: true, color: BRAND }),
          ] }),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [
            new TextRun({ text: '75 Bd Richard Lenoir, Paris 11e — 01.XX.XX.XX.XX — contact@satorea.fr', font: 'Calibri', size: 16, color: TEXT_MED }),
          ] }),
          pageBreak(),

          // ═══════════════════════════════════════════════════
          // ANNEXE A : RÉPUTATION MULTI-PLATEFORMES (page 6)
          // ═══════════════════════════════════════════════════
          ...(d.intelligence?.plateformes_avis?.length ? [
            h1('ANNEXE A — Réputation Multi-Plateformes'), line(),
            p('Analyse détaillée de la réputation sur 7 plateformes de réservation et d\'avis :'),
            spacer(30),
            new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [
              tableRow(['Plateforme', 'Note /5', 'Nb Avis', 'Services proposés'], true, 0),
              ...d.intelligence.plateformes_avis.slice(0, 10).map((p, i) =>
                tableRow([
                  p.plateforme || 'N/A',
                  p.note ? `${p.note}/5` : '?',
                  `${p.nb_avis || 0}`,
                  (p.services || []).slice(0, 3).join(', ')
                ], false, i+1)
              )
            ] }),
            spacer(30),
            (() => {
              const plateformes = d.intelligence.plateformes_avis.filter(p => p.note)
              const totalAvis = d.intelligence.plateformes_avis.reduce((s, p) => s + (p.nb_avis || 0), 0)
              const avgNote = plateformes.length > 0
                ? (plateformes.reduce((s, p) => s + (p.note || 0), 0) / plateformes.length).toFixed(1)
                : '0'
              return box(`Note pondérée : ${avgNote}/5 — ${totalAvis} avis sur ${plateformes.length} plateformes`, BRAND_BG, ACCENT)
            })(),
            spacer(30),

            // Avis les plus stratégiques (citations)
            ...(d.avis?.topPositive ? [
              h3('Avis stratégiques'),
              box(`"${d.avis.topPositive.text.slice(0, 200)}..."`, GREEN_BG, GREEN_DARK, false),
              p(`— ${d.avis.topPositive.author} (5★)`, { italic: true, color: TEXT_LIGHT, size: 16 }),
            ] : []),
            ...(d.avis?.topNegative ? [
              spacer(20),
              box(`"${d.avis.topNegative.text.slice(0, 200)}..."`, 'FEF2F2', RED, false),
              p(`— ${d.avis.topNegative.author} (${d.avis.topNegative.rating}★)`, { italic: true, color: TEXT_LIGHT, size: 16 }),
            ] : []),
            pageBreak(),
          ] : []),

          // ═══════════════════════════════════════════════════
          // ANNEXE B : CARTE DES SOINS & GAP ANALYSIS (page 7)
          // ═══════════════════════════════════════════════════
          ...(d.intelligence?.carte_soins?.length ? [
            h1('ANNEXE B — Carte Soins & Gap Analysis'), line(),

            // 2 colonnes : soins actuels | formations Dermotec manquantes
            new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [
              new TableRow({ children: [
                new TableCell({
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  shading: { type: ShadingType.CLEAR, fill: GREEN_BG },
                  margins: { top: 100, bottom: 100, left: 100, right: 100 },
                  children: [
                    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Soins actuels détectés', font: 'Calibri', size: 18, bold: true, color: GREEN_DARK })] }),
                    spacer(20),
                    ...d.intelligence.carte_soins.slice(0, 15).map(soin => bullet(soin, { color: GREEN_DARK })),
                    spacer(20),
                    new Paragraph({ children: [new TextRun({ text: `Total : ${d.intelligence.carte_soins.length} soins`, font: 'Calibri', size: 16, bold: true, color: GREEN_DARK })] }),
                  ]
                }),
                new TableCell({
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  shading: { type: ShadingType.CLEAR, fill: BRAND_BG },
                  margins: { top: 100, bottom: 100, left: 100, right: 100 },
                  children: [
                    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Formations Dermotec manquantes', font: 'Calibri', size: 18, bold: true, color: ACCENT })] }),
                    spacer(20),
                    ...d.formations.filter(f => f.niveau_priorite === 'PRINCIPAL').map(f =>
                      bullet(`${f.nom} — ${f.prix}`, { color: BRAND })
                    ),
                    ...d.formations.filter(f => f.niveau_priorite === 'COMPLEMENTAIRE').map(f =>
                      bullet(`${f.nom} — ${f.prix} (complémentaire)`, { color: TEXT_MED })
                    ),
                    spacer(20),
                    new Paragraph({ children: [new TextRun({ text: 'Gap = opportunités de croissance', font: 'Calibri', size: 16, bold: true, color: BRAND })] }),
                  ]
                })
              ] })
            ] }),
            pageBreak(),
          ] : []),

          // ═══════════════════════════════════════════════════
          // ANNEXE C : ZONE & CONCURRENCE (page 8)
          // ═══════════════════════════════════════════════════
          ...(d.quartier || d.mapImageBuffer || d.intelligence?.concurrents_zone?.length ? [
            h1('ANNEXE C — Zone & Concurrence'), line(),

            // Carte OSM si disponible
            ...(d.mapImageBuffer ? [
              new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [
                new ImageRun({ data: d.mapImageBuffer, transformation: { width: 500, height: 280 }, type: 'png' }),
              ] }),
              p('Carte OpenStreetMap — Environnement commercial', { italic: true, color: TEXT_LIGHT, size: 16 }),
              spacer(30),
            ] : []),

            // Concurrents dans 2km (top 10)
            ...(d.intelligence?.concurrents_zone?.length ? [
              h3('Concurrents dans un rayon de 2km'),
              new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [
                tableRow(['Nom', 'Type', 'Distance', 'Note', 'Avis'], true),
                ...d.intelligence.concurrents_zone.slice(0, 10).map((c, i) => tableRow([
                  c.nom || 'N/A',
                  c.type,
                  c.distance_metres ? `${Math.round(c.distance_metres)}m` : '?',
                  '?', // Note pas dans le type
                  '?'  // Avis pas dans le type
                ], false, i)),
              ] }),
              spacer(30),
            ] : []),

            // Données quartier (revenus, standing, trafic)
            ...(d.quartier ? [
              h3('Analyse du quartier'),
              new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [
                tableRow(['Indicateur', 'Valeur', 'Interprétation'], true),
                tableRow(['🚇 Métros proches', `${d.quartier.metros}`, d.quartier.metros >= 2 ? 'Excellent accès transports' : 'Accès limité'], false, 0),
                tableRow(['🍽 Restaurants', `${d.quartier.restaurants}`, d.quartier.restaurants >= 10 ? 'Zone très animée' : 'Zone calme'], false, 1),
                tableRow(['💅 Salons beauté', `${d.quartier.concurrentsBeaute}`, d.quartier.concurrentsBeaute >= 5 ? 'Forte concurrence' : 'Marché ouvert'], false, 2),
                tableRow(['💊 Pharmacies', `${d.quartier.pharmacies}`, d.quartier.pharmacies >= 2 ? 'Écosystème santé actif' : 'Peu de commerces santé'], false, 3),
                tableRow(['👥 Trafic piéton', `${d.quartier.footTrafficScore}/100`, d.quartier.footTrafficScore >= 60 ? 'Fort passage' : 'Passage modéré'], false, 4),
              ] }),
            ] : []),
            pageBreak(),
          ] : []),

          // ═══════════════════════════════════════════════════
          // ANNEXE D : DONNÉES BRUTES (page 9)
          // ═══════════════════════════════════════════════════
          h1('ANNEXE D — Données Brutes'), line(),

          // Fiche entreprise complète
          h3('Fiche entreprise complète'),
          ...(d.prospect.siret ? [
            new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [
              tableRow(['SIRET', d.prospect.siret], false, 0),
              ...(d.prospect.forme_juridique ? [tableRow(['Forme juridique', d.prospect.forme_juridique], false, 1)] : []),
              ...(d.prospect.date_creation ? [tableRow(['Date création', d.prospect.date_creation], false, 2)] : []),
              ...(d.prospect.dirigeant ? [tableRow(['Dirigeant', d.prospect.dirigeant], false, 3)] : []),
              ...(d.prospect.adresse ? [tableRow(['Adresse', d.prospect.adresse], false, 4)] : []),
              ...(d.prospect.effectif ? [tableRow(['Effectif', `${d.prospect.effectif} personnes`], false, 5)] : []),
              ...(d.prospect.ca ? [tableRow(['CA estimé', `${d.prospect.ca}€`], false, 6)] : []),
            ] }),
            spacer(30),
          ] : []),

          // Équipe et services
          ...(d.prospect.equipe?.length ? [
            h3('Équipe détectée'),
            ...d.prospect.equipe.map(e => bullet(e)),
            spacer(20),
          ] : []),
          ...(d.prospect.services?.length ? [
            h3('Services proposés'),
            ...d.prospect.services.map(s => bullet(s)),
            spacer(20),
          ] : []),

          // Convention collective
          ...(d.intelligence?.convention_collective ? [
            h3('Convention collective'),
            box(
              `IDCC ${d.intelligence.convention_collective.code_convention} — ${d.intelligence.convention_collective.intitule}
Droits formation : ${d.intelligence.convention_collective.droit_formation_heures}h par an
Secteur beauté : ${d.intelligence.convention_collective.est_secteur_beaute ? 'Oui ✓' : 'Non'}`,
              '#ECFDF5', '#065F46'
            ),
            spacer(30),
          ] : []),

          // Sources utilisées + dates de collecte
          h3('Sources de données'),
          p('Ce rapport est généré à partir de 47 sources de données publiques et privées :'),
          spacer(20),
          bullet('Google My Business, Maps, Reviews'),
          bullet('Réseaux sociaux (Instagram, Facebook, LinkedIn)'),
          bullet('Plateformes de réservation (Doctolib, Planity, Treatwell...)'),
          bullet('Registres officiels (SIRENE, BODACC, Infogreffe)'),
          bullet('APIs géographiques (INSEE, OpenStreetMap)'),
          bullet('Bases formation (RNCP, OPCO, CPF)'),
          bullet('Sources sectorielles beauté et bien-être'),
          spacer(30),

          // Mention version
          new Paragraph({ alignment: AlignmentType.CENTER, children: [
            new TextRun({ text: `Rapport généré le ${date}`, font: 'Calibri', size: 16, color: TEXT_LIGHT }),
          ] }),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [
            new TextRun({ text: '47 sources — Intelligence v3.0 — Satorea CRM', font: 'Calibri', size: 16, color: TEXT_LIGHT }),
          ] }),
        ],
      },
    ],
  })

  return await Packer.toBuffer(doc) as Buffer
}
