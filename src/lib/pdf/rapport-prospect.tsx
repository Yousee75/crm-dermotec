import React from 'react'
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'
import type { ProspectNarrative } from '../prospect-narrator'
import type { AggregatedProspectData } from '../enrichment-pipeline'
import ReactPDFChart from 'react-pdf-charts'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell,
  PieChart, Pie,
} from 'recharts'

interface RapportProspectProps {
  lead: { prenom?: string; nom?: string; entreprise?: string; email?: string; telephone?: string }
  narrative: ProspectNarrative
  enrichment?: AggregatedProspectData
  scores?: { reputation: number; presence: number; activity: number; financial: number; neighborhood: number }
  generatedAt: string
  version?: number
  photoUrl?: string
  mapUrl?: string
  intelligence?: {
    plateformes_avis?: Array<{ plateforme: string; note?: number; nb_avis?: number; services?: string[]; prix?: string[] }>
    carte_soins?: string[]
    concurrents_zone?: Array<{ nom?: string; type: string; distance_metres?: number }>
    offres_promo?: Array<{ titre: string; prix_barre?: number; prix_promo?: number; reduction?: string }>
    convention_collective?: { code_convention: number; intitule: string; est_secteur_beaute: boolean; droit_formation_heures: number }
    aides_disponibles?: Array<{ nom: string; financeur: string; type: string; montant_max?: number }>
    signaux?: { est_sur_promo: boolean; est_organisme_concurrent: boolean; avis_insuffisants: boolean; zone_saturee: boolean; droits_formation_non_consommes: boolean; en_difficulte: boolean }
  }
}

// ══════════════════════════════════════════════════════════════
// PALETTE PREMIUM
// ══════════════════════════════════════════════════════════════
const C = {
  brand: '#FF5C00', brandDark: '#0891B2', accent: '#1A1A1A', accentMed: '#0F3460',
  white: '#FFFFFF', bg: '#FAFBFC', bgWarm: '#F8FAFC', card: '#F1F5F9',
  border: '#E2E8F0', borderSoft: '#F1F5F9',
  text: '#1E293B', textMed: '#475569', textLight: '#94A3B8', textXLight: '#CBD5E1',
  green: '#10B981', greenDark: '#059669', greenBg: '#ECFDF5',
  amber: '#F59E0B', amberDark: '#D97706', amberBg: '#FFFBEB',
  red: '#EF4444', redBg: '#FEF2F2',
  sky: '#38BDF8', skyBg: '#F0F9FF',
  indigo: '#6366F1', indigoBg: '#EEF2FF',
  violet: '#8B5CF6', violetBg: '#F5F3FF',
  teal: '#14B8A6', tealBg: '#F0FDFA',
  dRep: '#10B981', dPres: '#3B82F6', dAct: '#8B5CF6', dFin: '#F59E0B', dQrt: '#14B8A6',
}

// ══════════════════════════════════════════════════════════════
// STYLES
// ══════════════════════════════════════════════════════════════
const s = StyleSheet.create({
  page: { fontFamily: 'Helvetica', padding: 32, fontSize: 9, lineHeight: 1.5, color: C.text },
  pageAlt: { fontFamily: 'Helvetica', padding: 32, fontSize: 9, lineHeight: 1.5, color: C.text, backgroundColor: C.bgWarm },

  // Couverture
  coverBar: { width: '100%', height: 4, backgroundColor: C.brand, marginBottom: 60 },
  cover: { flex: 1, justifyContent: 'center', alignItems: 'center', textAlign: 'center' },
  coverBrand: { fontSize: 28, fontWeight: 'bold', color: C.brand, letterSpacing: 3 },
  coverSub: { fontSize: 11, color: C.textLight, marginTop: 4, letterSpacing: 1 },
  coverLine: { width: 60, height: 2, backgroundColor: C.brand, marginVertical: 25 },
  coverTitle: { fontSize: 18, fontWeight: 'bold', color: C.accent, marginBottom: 6 },
  coverProspect: { fontSize: 14, color: C.textMed },
  coverScore: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center', marginTop: 30 },
  coverScoreNum: { fontSize: 28, fontWeight: 'bold', color: C.white },
  coverScoreSub: { fontSize: 8, color: C.white, marginTop: -2 },
  coverBadge: { paddingHorizontal: 14, paddingVertical: 4, borderRadius: 12, marginTop: 10 },
  coverBadgeText: { fontSize: 10, fontWeight: 'bold', color: C.white, letterSpacing: 0.5 },
  coverDate: { fontSize: 9, color: C.textLight, marginTop: 30 },
  coverConf: { position: 'absolute', bottom: 30, fontSize: 7, color: C.textXLight },
  coverBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 4, backgroundColor: C.accent },

  // Header/Footer
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 8, borderBottomWidth: 2.5, borderBottomColor: C.brand },
  hBrand: { fontSize: 12, fontWeight: 'bold', color: C.brand, letterSpacing: 1.5 },
  hSub: { fontSize: 6, color: C.textLight, marginTop: 1 },
  hMeta: { alignItems: 'flex-end' },
  hMetaT: { fontSize: 6, color: C.textLight },
  footer: { position: 'absolute', bottom: 20, left: 32, right: 32, flexDirection: 'row', justifyContent: 'space-between', paddingTop: 6, borderTopWidth: 0.5, borderTopColor: C.border },
  fText: { fontSize: 5.5, color: C.textLight },

  // Sections
  sTitle: { fontSize: 10, fontWeight: 'bold', color: C.accent, marginBottom: 4 },
  sBar: { width: 24, height: 2.5, backgroundColor: C.brand, marginBottom: 8, borderRadius: 1 },
  section: { marginBottom: 8 },
  body: { fontSize: 8, lineHeight: 1.5, color: C.text },

  // Hero
  heroRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  heroCircle: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center' },
  heroNum: { fontSize: 20, fontWeight: 'bold', color: C.white },
  heroSub: { fontSize: 5.5, color: C.white, marginTop: -1 },
  heroInfo: { marginLeft: 10, flex: 1 },
  heroName: { fontSize: 14, fontWeight: 'bold', color: C.accent },
  heroEnt: { fontSize: 8, color: C.textMed, marginTop: 1 },
  heroBadge: { marginTop: 3, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, fontSize: 7, fontWeight: 'bold', color: C.white },
  heroPhoto: { width: 48, height: 48, borderRadius: 6 },

  // Verdict
  verdict: { padding: 10, borderRadius: 6, marginBottom: 12, borderLeftWidth: 3 },
  verdictText: { fontSize: 9.5, fontWeight: 'bold', lineHeight: 1.4 },

  // Layout
  row: { flexDirection: 'row', gap: 6, marginBottom: 6 },
  col: { flex: 1 },

  // Cards
  card: { backgroundColor: C.card, padding: 8, borderRadius: 5, marginBottom: 5, borderWidth: 0.5, borderColor: C.border },
  cardLabel: { fontSize: 6, fontWeight: 'bold', color: C.textLight, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 2 },
  cardText: { fontSize: 7.5, color: C.text, lineHeight: 1.4 },

  // Points
  pointTitle: { fontSize: 7, fontWeight: 'bold', marginBottom: 3, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 3 },
  point: { fontSize: 7, marginBottom: 2, paddingLeft: 6, lineHeight: 1.35 },

  // Strategie
  stratBlock: { backgroundColor: C.indigoBg, padding: 8, borderRadius: 5, marginBottom: 6, borderLeftWidth: 2.5, borderLeftColor: C.indigo },
  stratLabel: { fontSize: 6, fontWeight: 'bold', color: C.indigo, textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 1 },
  stratValue: { fontSize: 7.5, color: C.text, lineHeight: 1.35 },

  // Script
  scriptStep: { flexDirection: 'row', marginBottom: 4 },
  scriptNum: { width: 16, height: 16, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 6, marginTop: 1 },
  scriptNumT: { fontSize: 7, fontWeight: 'bold', color: C.white },
  scriptLabel: { fontSize: 6, fontWeight: 'bold', color: C.accent, textTransform: 'uppercase', letterSpacing: 0.3 },
  scriptText: { fontSize: 7.5, color: C.text, fontStyle: 'italic', lineHeight: 1.35, marginTop: 1 },

  // Objections
  objGrid: { flexDirection: 'row', gap: 4, marginBottom: 6 },
  objCard: { flex: 1, backgroundColor: C.amberBg, padding: 6, borderRadius: 4, borderLeftWidth: 2, borderLeftColor: C.amber },
  objTitle: { fontSize: 6, fontWeight: 'bold', color: C.amberDark, marginBottom: 2 },
  objText: { fontSize: 7, color: '#78350F', lineHeight: 1.3 },

  // Formations
  formCard: { padding: 6, borderRadius: 4, marginBottom: 4, borderWidth: 0.5, borderColor: C.border },
  formMain: { backgroundColor: C.skyBg, borderColor: C.brand },
  formAlt: { backgroundColor: C.card },
  formName: { fontSize: 8, fontWeight: 'bold', color: C.accent },
  formPrix: { fontSize: 8, fontWeight: 'bold', color: C.brand },
  formWhy: { fontSize: 6.5, color: C.textMed, marginTop: 1, lineHeight: 1.3 },
  formROI: { fontSize: 6.5, color: C.greenDark, marginTop: 1 },
  formBadge: { paddingHorizontal: 4, paddingVertical: 1, borderRadius: 6, fontSize: 5.5, fontWeight: 'bold', color: C.white },

  // Financement
  finBlock: { backgroundColor: C.greenBg, padding: 8, borderRadius: 5, borderLeftWidth: 2.5, borderLeftColor: C.green, marginBottom: 6 },
  finLabel: { fontSize: 6, fontWeight: 'bold', color: C.greenDark, marginBottom: 2 },
  finText: { fontSize: 7.5, color: '#14532D', lineHeight: 1.35 },
  finPhrase: { fontSize: 8, color: '#14532D', fontStyle: 'italic', fontWeight: 'bold', marginTop: 3 },

  // Plan
  planStep: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 3 },
  planDot: { width: 14, height: 14, borderRadius: 7, justifyContent: 'center', alignItems: 'center', marginRight: 6, marginTop: 1 },
  planDotT: { fontSize: 7, fontWeight: 'bold', color: C.white },
  planText: { fontSize: 7.5, flex: 1, color: C.text, lineHeight: 1.35 },

  // Dashboard KPIs
  kpiRow: { flexDirection: 'row', gap: 4, marginBottom: 8 },
  kpiBox: { flex: 1, padding: 6, borderRadius: 5, alignItems: 'center' },
  kpiValue: { fontSize: 13, fontWeight: 'bold' },
  kpiLabel: { fontSize: 5, color: C.textMed, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  kpiSub: { fontSize: 5.5, color: C.textLight, marginTop: 1 },

  // Charts
  chartRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  chartCol: { flex: 1 },
  chartTitle: { fontSize: 8, fontWeight: 'bold', color: C.accent, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },

  // Map
  mapImg: { width: '100%', height: 120, borderRadius: 5 },
  mapCap: { fontSize: 6, color: C.textLight, marginTop: 3, textAlign: 'center' },

  // Quartier
  qGrid: { flexDirection: 'row', gap: 5, marginBottom: 10 },
  qBox: { flex: 1, padding: 8, borderRadius: 6, alignItems: 'center', backgroundColor: C.white, borderWidth: 0.5, borderColor: C.border },
  qNum: { fontSize: 14, fontWeight: 'bold', color: C.accent },
  qLabel: { fontSize: 5.5, color: C.textLight, marginTop: 2, textAlign: 'center' },

  // Digital
  dRow: { flexDirection: 'row', gap: 5, marginBottom: 6 },
  dBox: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.white, padding: 7, borderRadius: 5, borderWidth: 0.5, borderColor: C.border },
  dDot: { width: 8, height: 8, borderRadius: 4 },
  dLabel: { fontSize: 5.5, color: C.textLight },
  dValue: { fontSize: 7, fontWeight: 'bold', color: C.text },

  // Fiche
  fiche: { backgroundColor: C.white, padding: 8, borderRadius: 5, borderWidth: 0.5, borderColor: C.border, marginBottom: 8 },
  fRow: { flexDirection: 'row', gap: 6, marginBottom: 3 },
  fLabel: { fontSize: 5.5, color: C.textLight, width: 55 },
  fValue: { fontSize: 7, color: C.text, flex: 1 },

  // Guide
  guideBox: { backgroundColor: C.indigoBg, padding: 10, borderRadius: 6, borderWidth: 0.5, borderColor: '#C7D2FE' },
  guideTitle: { fontSize: 7.5, fontWeight: 'bold', color: C.indigo, marginBottom: 4 },
  guideRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2.5 },
  guideDot: { width: 7, height: 7, borderRadius: 3.5, marginRight: 5 },
  guideText: { fontSize: 6.5, color: C.textMed, flex: 1 },

  // CTA
  cta: { backgroundColor: C.brand, padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  ctaTitle: { fontSize: 11, fontWeight: 'bold', color: C.white, marginBottom: 4 },
  ctaSub: { fontSize: 8, color: C.white, opacity: 0.85 },
  ctaContact: { fontSize: 7, color: C.white, marginTop: 6, opacity: 0.7 },
})

// ── Helpers ──────────────────────────────────────────────────
function scoreColor(v: number) { return v >= 60 ? C.green : v >= 30 ? C.amber : C.red }
function classColor(cl: string) { return cl === 'CHAUD' ? C.green : cl === 'TIEDE' ? C.amber : C.red }
function classBg(cl: string) { return cl === 'CHAUD' ? C.greenBg : cl === 'TIEDE' ? C.amberBg : C.bgWarm }

function Hdr({ date, p, t }: { date: string; p: number; t: number }) {
  return (
    <View style={s.header}>
      <View><Text style={s.hBrand}>SATOREA</Text><Text style={s.hSub}>Briefing Commercial Intelligence</Text></View>
      <View style={s.hMeta}><Text style={s.hMetaT}>{date}</Text><Text style={s.hMetaT}>Confidentiel</Text></View>
    </View>
  )
}

function Ftr({ date, p, t }: { date: string; p: number; t: number }) {
  return <View style={s.footer}><Text style={s.fText}>Satorea CRM — Briefing Commercial Intelligence</Text><Text style={s.fText}>Page {p}/{t}</Text></View>
}

function ScoreBlock({ value, color, sz = 56 }: { value: number; color: string; sz?: number }) {
  return (
    <View style={{ width: sz, height: sz, borderRadius: sz * 0.22, backgroundColor: color, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: sz * 0.36, fontWeight: 'bold', color: C.white }}>{value}</Text>
      <Text style={{ fontSize: sz * 0.1, color: C.white, marginTop: -1 }}>/100</Text>
    </View>
  )
}

function buildMapUrl(lat?: number, lng?: number, placeId?: string): string | null {
  const key = process.env.GOOGLE_PLACES_API_KEY
  if (!key || (!lat && !placeId)) return null
  const center = lat && lng ? `${lat},${lng}` : ''
  const marker = center ? `&markers=color:0x2EC6F3|size:mid|${center}` : ''
  return `https://maps.googleapis.com/maps/api/staticmap?center=${center}&zoom=15&size=640x260&scale=2&maptype=roadmap&style=feature:all|saturation:-30&style=feature:road|element:geometry|color:0xE2E8F0&style=feature:water|color:0xD1E5F0${marker}&key=${key}`
}

// ══════════════════════════════════════════════════════════════
// DOCUMENT
// ══════════════════════════════════════════════════════════════

export function RapportProspect({ lead, narrative: n, enrichment, scores, generatedAt, version = 1, photoUrl, mapUrl, intelligence }: RapportProspectProps) {
  const nom = `${lead.prenom || ''} ${lead.nom || ''}`.trim() || 'Prospect'
  const sc = scoreColor(n.score_chaleur)
  const cc = classColor(n.classification)
  const e = enrichment || {} as any
  const dims = scores || { reputation: 50, presence: 40, activity: 30, financial: 50, neighborhood: 50 }
  const T = 6

  const globalScore = Math.round(dims.reputation * 0.30 + dims.presence * 0.25 + dims.activity * 0.20 + dims.financial * 0.15 + dims.neighborhood * 0.10)
  const radarData = [
    { axis: 'Reputation', value: dims.reputation, fullMark: 100 },
    { axis: 'Presence', value: dims.presence, fullMark: 100 },
    { axis: 'Activite', value: dims.activity, fullMark: 100 },
    { axis: 'Financier', value: dims.financial, fullMark: 100 },
    { axis: 'Quartier', value: dims.neighborhood, fullMark: 100 },
  ]
  const barData = [
    { name: 'Reput.', score: dims.reputation, fill: C.dRep },
    { name: 'Pres.', score: dims.presence, fill: C.dPres },
    { name: 'Activ.', score: dims.activity, fill: C.dAct },
    { name: 'Finan.', score: dims.financial, fill: C.dFin },
    { name: 'Quart.', score: dims.neighborhood, fill: C.dQrt },
  ]
  const pieData = [{ name: 'Score', value: globalScore }, { name: 'Reste', value: 100 - globalScore }]
  const staticMapUrl = mapUrl || (e.google?.placeId ? buildMapUrl(undefined, undefined, e.google.placeId) : null)

  return (
    <Document>
      {/* ═══ COUVERTURE ═══ */}
      <Page size="A4" style={s.page}>
        <View style={s.coverBar} />
        <View style={s.cover}>
          <Text style={s.coverBrand}>SATOREA</Text>
          <Text style={s.coverSub}>Briefing Commercial Intelligence</Text>
          <View style={s.coverLine} />
          <Text style={s.coverTitle}>Rapport Prospect</Text>
          <Text style={s.coverProspect}>{nom}</Text>
          {lead.entreprise && <Text style={[s.coverProspect, { fontSize: 11, marginTop: 4 }]}>{lead.entreprise}</Text>}
          <View style={[s.coverScore, { backgroundColor: sc }]}>
            <Text style={s.coverScoreNum}>{n.score_chaleur}</Text>
            <Text style={s.coverScoreSub}>/100</Text>
          </View>
          <View style={[s.coverBadge, { backgroundColor: cc }]}><Text style={s.coverBadgeText}>{n.classification}</Text></View>
          <Text style={s.coverDate}>{generatedAt} — Version {version}</Text>
        </View>
        <Text style={s.coverConf}>Document confidentiel — Usage interne Satorea CRM</Text>
        <View style={s.coverBottom} />
      </Page>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* PAGE 2 : EXECUTIVE SUMMARY — "Voici l'essentiel" */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <Page size="A4" style={s.page}>
        <Hdr date={generatedAt} p={2} t={T} />

        {/* Hero */}
        <View style={s.heroRow}>
          <View style={[s.heroCircle, { backgroundColor: sc }]}><Text style={s.heroNum}>{n.score_chaleur}</Text><Text style={s.heroSub}>/100</Text></View>
          <View style={s.heroInfo}>
            <Text style={s.heroName}>{nom}</Text>
            {lead.entreprise && <Text style={s.heroEnt}>{lead.entreprise}</Text>}
            <View style={[s.heroBadge, { backgroundColor: cc }]}><Text>{n.classification}</Text></View>
          </View>
          {photoUrl && <Image style={s.heroPhoto} src={photoUrl} />}
        </View>

        {/* Verdict */}
        <View style={[s.verdict, { backgroundColor: classBg(n.classification), borderLeftColor: cc }]}>
          <Text style={[s.verdictText, { color: cc === C.green ? C.greenDark : cc === C.amber ? C.amberDark : C.textMed }]}>{n.verdict}</Text>
        </View>

        {/* KPIs en ligne */}
        <View style={s.kpiRow}>
          <View style={[s.kpiBox, { backgroundColor: C.skyBg }]}>
            <Text style={[s.kpiValue, { color: C.brandDark }]}>{e.google?.rating ? `${e.google.rating}` : '--'}</Text>
            <Text style={s.kpiLabel}>Note Google</Text>
            {e.google?.reviewsCount && <Text style={s.kpiSub}>{e.google.reviewsCount} avis</Text>}
          </View>
          <View style={[s.kpiBox, { backgroundColor: C.indigoBg }]}>
            <Text style={[s.kpiValue, { color: C.indigo }]}>{e.google?.reviewsCount ?? '--'}</Text>
            <Text style={s.kpiLabel}>Avis total</Text>
          </View>
          <View style={[s.kpiBox, { backgroundColor: C.greenBg }]}>
            <Text style={[s.kpiValue, { color: C.greenDark }]}>{e.sirene?.dateCreation ? `${new Date().getFullYear() - parseInt(e.sirene.dateCreation.substring(0, 4))}` : '--'}</Text>
            <Text style={s.kpiLabel}>Ancienneté</Text>
            <Text style={s.kpiSub}>années</Text>
          </View>
          <View style={[s.kpiBox, { backgroundColor: C.violetBg }]}>
            <Text style={[s.kpiValue, { color: C.violet }]}>{e.pappers?.effectif ?? '--'}</Text>
            <Text style={s.kpiLabel}>Effectif</Text>
          </View>
          <View style={[s.kpiBox, { backgroundColor: C.amberBg }]}>
            <Text style={[s.kpiValue, { color: C.amber }]}>{n.score_chaleur}</Text>
            <Text style={s.kpiLabel}>Score</Text>
            <Text style={s.kpiSub}>/100</Text>
          </View>
        </View>

        {/* Brief commercial */}
        <View style={s.section}>
          <Text style={s.sTitle}>Brief Commercial</Text>
          <View style={s.sBar} />
          <Text style={s.body}>{n.brief_commercial}</Text>
        </View>

        {/* Radar 5 axes */}
        <View style={{ marginBottom: 12 }}>
          <Text style={s.chartTitle}>Score Multi-Axes</Text>
          <ReactPDFChart>
            <RadarChart width={420} height={200} data={radarData} cx={210} cy={100} outerRadius={80}>
              <PolarGrid stroke={C.borderSoft} />
              <PolarAngleAxis dataKey="axis" tick={{ fontSize: 8, fill: C.textMed }} />
              <Radar dataKey="value" stroke={C.brand} fill={C.brand} fillOpacity={0.2} strokeWidth={2} isAnimationActive={false} />
            </RadarChart>
          </ReactPDFChart>
        </View>

        <Ftr date={generatedAt} p={2} t={T} />
      </Page>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* PAGE 3 : QUI + POURQUOI — "Pourquoi ce prospect va dire oui" */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <Page size="A4" style={s.page}>
        <Hdr date={generatedAt} p={3} t={T} />

        {/* Accroche */}
        <View style={[s.verdict, { backgroundColor: C.skyBg, borderLeftColor: C.brand, marginBottom: 16 }]}>
          <Text style={[s.verdictText, { color: C.brandDark }]}>
            {n.classification === 'PROSPECT CHAUD' ? '🔥 Prospect premium avec potentiel immédiat !' :
             n.classification === 'PROSPECT TIÈDE' ? '⚡ Bon prospect à approcher avec la bonne stratégie' :
             '💪 Prospect à convaincre - challenge commercial'}
          </Text>
        </View>

        {/* SCQA compact */}
        <View style={s.section}>
          <Text style={s.sTitle}>Situation / Complication / Answer</Text>
          <View style={s.sBar} />
          <View style={s.row}>
            <View style={s.col}>
              <View style={s.card}>
                <Text style={s.cardLabel}>Situation</Text>
                <Text style={s.cardText}>{n.situation_business}</Text>
              </View>
            </View>
            <View style={s.col}>
              <View style={s.card}>
                <Text style={s.cardLabel}>Qui est-ce ?</Text>
                <Text style={s.cardText}>{n.histoire_prospect}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Tableau Atouts vs Manques */}
        <View style={s.section}>
          <Text style={s.sTitle}>Analyse Atouts vs Manques</Text>
          <View style={s.sBar} />
          <View style={s.row}>
            <View style={s.col}>
              <Text style={[s.pointTitle, { backgroundColor: C.greenBg, color: C.greenDark }]}>✅ Atouts pour vendre</Text>
              {n.atouts_vente.map((a, i) => <Text key={i} style={[s.point, { color: C.greenDark }]}>+ {a}</Text>)}
            </View>
            <View style={s.col}>
              <Text style={[s.pointTitle, { backgroundColor: C.amberBg, color: C.amberDark }]}>⚠️ Points d'attention</Text>
              {n.pieges_eviter.map((p, i) => <Text key={i} style={[s.point, { color: C.amberDark }]}>! {p}</Text>)}
            </View>
          </View>
        </View>

        {/* Réputation & Environnement */}
        <View style={s.row}>
          <View style={s.col}>
            <View style={s.card}>
              <Text style={s.cardLabel}>Réputation & Visibilité</Text>
              <Text style={s.cardText}>{n.reputation_visibilite}</Text>
            </View>
          </View>
          <View style={s.col}>
            <View style={s.card}>
              <Text style={s.cardLabel}>Son Quartier</Text>
              <Text style={s.cardText}>{n.environnement}</Text>
            </View>
          </View>
        </View>

        <Ftr date={generatedAt} p={3} t={T} />
      </Page>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* PAGE 4 : COMMENT VENDRE — "Voici ton arme" */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <Page size="A4" style={s.page}>
        <Hdr date={generatedAt} p={4} t={T} />

        {/* Stratégie d'approche */}
        {n.strategie && (
          <View style={s.stratBlock}>
            <Text style={[s.sTitle, { color: C.indigo, fontSize: 10, marginBottom: 8 }]}>🎯 Stratégie d'approche</Text>
            <View style={[s.row, { gap: 6, marginBottom: 4 }]}>
              <View style={s.col}><Text style={s.stratLabel}>Canal prioritaire</Text><Text style={s.stratValue}>{n.strategie.canal}</Text></View>
              <View style={s.col}><Text style={s.stratLabel}>Meilleur moment</Text><Text style={s.stratValue}>{n.strategie.meilleur_moment}</Text></View>
              <View style={s.col}><Text style={s.stratLabel}>Durée estimée</Text><Text style={s.stratValue}>{n.strategie.duree_estimee}</Text></View>
            </View>
            <Text style={s.stratLabel}>Angle d'attaque</Text><Text style={s.stratValue}>{n.strategie.angle_attaque}</Text>
            <Text style={[s.stratLabel, { marginTop: 3 }]}>Objectif de l'appel</Text><Text style={s.stratValue}>{n.strategie.objectif_appel}</Text>
            <Text style={[s.stratLabel, { marginTop: 3 }]}>⚠️ Ne jamais dire</Text><Text style={[s.stratValue, { color: C.red, fontStyle: 'italic' }]}>{n.strategie.ne_jamais_dire || 'Éviter les termes techniques trop complexes'}</Text>
          </View>
        )}

        {/* Script 4 étapes */}
        {n.script_telephone && (
          <View style={s.section}>
            <Text style={s.sTitle}>📞 Script Téléphonique (4 étapes)</Text>
            <View style={s.sBar} />
            {[
              { n: 1, l: 'Accroche', t: n.script_telephone.accroche, c: C.brand },
              { n: 2, l: 'Transition', t: n.script_telephone.transition, c: C.indigo },
              { n: 3, l: 'Proposition', t: n.script_telephone.proposition, c: C.violet },
              { n: 4, l: 'Closing', t: n.script_telephone.closing, c: C.greenDark },
            ].map((st) => (
              <View key={st.n} style={s.scriptStep}>
                <View style={[s.scriptNum, { backgroundColor: st.c }]}><Text style={s.scriptNumT}>{st.n}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={s.scriptLabel}>{st.l}</Text>
                  <Text style={s.scriptText}>{st.t}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Top 3 Objections */}
        {n.script_telephone && (
          <View style={s.section}>
            <Text style={s.sTitle}>🛡️ Top 3 Objections</Text>
            <View style={s.sBar} />
            <View style={s.objGrid}>
              <View style={s.objCard}><Text style={s.objTitle}>Il dit: « Trop cher »</Text><Text style={s.objText}>Il pense: Mon budget est serré</Text><Text style={[s.objText, { fontWeight: 'bold', marginTop: 2 }]}>Tu réponds: {n.script_telephone.si_objection_prix}</Text></View>
              <View style={s.objCard}><Text style={s.objTitle}>Il dit: « Pas le temps »</Text><Text style={s.objText}>Il pense: Je suis débordé</Text><Text style={[s.objText, { fontWeight: 'bold', marginTop: 2 }]}>Tu réponds: {n.script_telephone.si_objection_temps}</Text></View>
              <View style={s.objCard}><Text style={s.objTitle}>Il dit: « Pas besoin »</Text><Text style={s.objText}>Il pense: Je doute de l'utilité</Text><Text style={[s.objText, { fontWeight: 'bold', marginTop: 2 }]}>Tu réponds: {n.script_telephone.si_objection_besoin}</Text></View>
            </View>
          </View>
        )}

        <Ftr date={generatedAt} p={4} t={T} />
      </Page>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* ANNEXE A : RÉPUTATION MULTI-PLATEFORMES */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {intelligence?.plateformes_avis?.length ? (
        <Page size="A4" style={s.page}>
          <Hdr date={generatedAt} p={7} t={T} />

          <Text style={s.sTitle}>Annexe A: Réputation Multi-Plateformes</Text>
          <View style={s.sBar} />

          <View style={{ marginBottom: 16 }}>
            {intelligence.plateformes_avis.map((plateforme, idx) => (
              <View key={idx} style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 8,
                padding: 8,
                backgroundColor: C.card,
                borderRadius: 6,
                borderLeftWidth: 3,
                borderLeftColor: plateforme.note && plateforme.note >= 4 ? C.green : plateforme.note && plateforme.note >= 3 ? C.amber : C.red
              }}>
                <View style={{ flex: 2 }}>
                  <Text style={{ fontSize: 9, fontWeight: 'bold', color: C.accent }}>
                    {plateforme.plateforme}
                  </Text>
                </View>

                <View style={{ flex: 1, alignItems: 'center' }}>
                  <View style={{
                    width: 60,
                    height: 8,
                    backgroundColor: C.border,
                    borderRadius: 4,
                    overflow: 'hidden'
                  }}>
                    <View style={{
                      height: '100%',
                      width: `${((plateforme.note || 0) / 5) * 100}%`,
                      backgroundColor: plateforme.note && plateforme.note >= 4 ? C.green : plateforme.note && plateforme.note >= 3 ? C.amber : C.red,
                      borderRadius: 4
                    }} />
                  </View>
                  <Text style={{ fontSize: 8, fontWeight: 'bold', color: C.text, marginTop: 2 }}>
                    {plateforme.note?.toFixed(1) || '--'}/5
                  </Text>
                </View>

                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={{ fontSize: 8, fontWeight: 'bold', color: C.textMed }}>
                    {plateforme.nb_avis || 0} avis
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Footer résumé */}
          <View style={{
            backgroundColor: C.skyBg,
            padding: 10,
            borderRadius: 8,
            borderLeftWidth: 3,
            borderLeftColor: C.brand,
            marginTop: 16
          }}>
            <Text style={{ fontSize: 9, fontWeight: 'bold', color: C.accent }}>
              Note globale : {(intelligence.plateformes_avis.reduce((acc, p) => acc + (p.note || 0), 0) / intelligence.plateformes_avis.length).toFixed(1)}/5
            </Text>
            <Text style={{ fontSize: 8, color: C.textMed, marginTop: 2 }}>
              Total : {intelligence.plateformes_avis.reduce((acc, p) => acc + (p.nb_avis || 0), 0)} avis sur {intelligence.plateformes_avis.length} plateformes
            </Text>
          </View>

          <Ftr date={generatedAt} p={7} t={T} />
        </Page>
      ) : null}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* ANNEXE C : CARTE DES SOINS & GAP ANALYSIS */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {intelligence?.carte_soins?.length ? (
        <Page size="A4" style={s.page}>
          <Hdr date={generatedAt} p={9} t={T} />

          <Text style={s.sTitle}>Annexe C: Carte des Soins & Gap Analysis</Text>
          <View style={s.sBar} />

          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
            {/* Soins actuels */}
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 9, fontWeight: 'bold', color: C.accent, marginBottom: 8 }}>
                Soins Actuels
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                {intelligence.carte_soins.map((soin, idx) => (
                  <View key={idx} style={{
                    backgroundColor: C.tealBg,
                    paddingHorizontal: 6,
                    paddingVertical: 3,
                    borderRadius: 8,
                    marginBottom: 4
                  }}>
                    <Text style={{ fontSize: 7, color: C.teal, fontWeight: 'bold' }}>
                      {soin}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Formations recommandées */}
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 9, fontWeight: 'bold', color: C.accent, marginBottom: 8 }}>
                Formations Recommandées
              </Text>
              {n.formations_recommandees?.slice(0, 5).map((formation, idx) => (
                <View key={idx} style={{
                  backgroundColor: C.brand,
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 6,
                  marginBottom: 4
                }}>
                  <Text style={{ fontSize: 8, color: C.white, fontWeight: 'bold' }}>
                    {formation.nom}
                  </Text>
                  <Text style={{ fontSize: 6, color: C.white, opacity: 0.9 }}>
                    {formation.prix} HT
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Gap Analysis */}
          <View style={{
            backgroundColor: C.indigoBg,
            padding: 10,
            borderRadius: 8,
            borderLeftWidth: 3,
            borderLeftColor: C.indigo,
            marginTop: 16
          }}>
            <Text style={{ fontSize: 9, fontWeight: 'bold', color: C.indigo }}>
              Gap Analysis
            </Text>
            <Text style={{ fontSize: 8, color: C.text, marginTop: 2 }}>
              {intelligence.carte_soins.length} soins détectés • {n.formations_recommandees?.length || 0} opportunités de formation identifiées
            </Text>
          </View>

          <Ftr date={generatedAt} p={9} t={T} />
        </Page>
      ) : null}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* PAGE 5 : L'ARGENT — "Ça ne coûte rien et ça rapporte gros" */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <Page size="A4" style={s.page}>
        <Hdr date={generatedAt} p={5} t={T} />

        {/* Encadré coût net : 0€ */}
        {intelligence?.convention_collective?.est_secteur_beaute && (
          <View style={s.finBlock}>
            <Text style={s.finLabel}>💰 Coût net : 0€</Text>
            <Text style={s.finText}>Formation 100% prise en charge par l'OPCO. Votre cliente ne paie rien.</Text>
            <Text style={s.finPhrase}>« Imaginez développer vos compétences sans rien débourser... »</Text>
          </View>
        )}

        {/* ROI 3 scénarios */}
        <View style={s.section}>
          <Text style={s.sTitle}>📈 Retour sur Investissement</Text>
          <View style={s.sBar} />
          <View style={s.row}>
            <View style={s.col}>
              <View style={[s.card, { backgroundColor: C.greenBg, borderLeftWidth: 2, borderLeftColor: C.green }]}>
                <Text style={s.cardLabel}>CONSERVATEUR</Text>
                <Text style={[s.cardText, { color: C.greenDark, fontWeight: 'bold' }]}>+2 clients/mois</Text>
                <Text style={s.cardText}>= +1 200€/mois</Text>
                <Text style={s.cardText}>ROI: 12 mois</Text>
              </View>
            </View>
            <View style={s.col}>
              <View style={[s.card, { backgroundColor: C.brand, borderLeftWidth: 2, borderLeftColor: C.brandDark }]}>
                <Text style={[s.cardLabel, { color: C.white }]}>RÉALISTE</Text>
                <Text style={[s.cardText, { color: C.white, fontWeight: 'bold' }]}>+5 clients/mois</Text>
                <Text style={[s.cardText, { color: C.white }]}>= +3 000€/mois</Text>
                <Text style={[s.cardText, { color: C.white }]}>ROI: 4 mois</Text>
              </View>
            </View>
            <View style={s.col}>
              <View style={[s.card, { backgroundColor: C.violet, borderLeftWidth: 2, borderLeftColor: C.violetBg }]}>
                <Text style={[s.cardLabel, { color: C.white }]}>OPTIMISTE</Text>
                <Text style={[s.cardText, { color: C.white, fontWeight: 'bold' }]}>+10 clients/mois</Text>
                <Text style={[s.cardText, { color: C.white }]}>= +6 000€/mois</Text>
                <Text style={[s.cardText, { color: C.white }]}>ROI: 2 mois</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Formations recommandées (max 3 cards) */}
        {n.formations_recommandees?.length > 0 && (
          <View style={s.section}>
            <Text style={s.sTitle}>🎓 Formations Recommandées</Text>
            <View style={s.sBar} />
            {n.formations_recommandees.slice(0, 3).map((f, i) => (
              <View key={i} style={[s.formCard, f.niveau_priorite === 'principal' ? s.formMain : s.formAlt]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={s.formName}>{f.nom}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <View style={[s.formBadge, { backgroundColor: f.niveau_priorite === 'principal' ? C.brand : f.niveau_priorite === 'complementaire' ? C.violet : C.textLight }]}>
                      <Text>{f.niveau_priorite === 'principal' ? 'PRINCIPAL' : f.niveau_priorite === 'complementaire' ? 'COMPLEM.' : 'UPSELL'}</Text>
                    </View>
                    <Text style={s.formPrix}>{f.prix}</Text>
                  </View>
                </View>
                <Text style={s.formWhy}>{f.pourquoi_elle}</Text>
                <Text style={s.formROI}>{f.argument_roi}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Financement (OPCO + alternative) */}
        {n.strategie_financement && (
          <View style={s.finBlock}>
            <Text style={s.finLabel}>💳 Financement</Text>
            <Text style={s.finText}>{n.strategie_financement.option_principale}</Text>
            <Text style={[s.finText, { marginTop: 2 }]}>{n.strategie_financement.comment_presenter}</Text>
            <Text style={s.finPhrase}>{n.strategie_financement.phrase_cle}</Text>
            {n.strategie_financement.alternatives?.length > 0 && (
              <View style={{ marginTop: 3 }}>
                <Text style={[s.finLabel, { marginBottom: 1 }]}>Alternatives</Text>
                {n.strategie_financement.alternatives.map((a, i) => <Text key={i} style={[s.finText, { fontSize: 6.5 }]}>- {a}</Text>)}
              </View>
            )}
          </View>
        )}

        {/* Convention collective si détectée */}
        {intelligence?.convention_collective && (
          <View style={[s.card, { backgroundColor: C.indigoBg, borderLeftWidth: 2, borderLeftColor: C.indigo }]}>
            <Text style={s.cardLabel}>⚖️ CONVENTION COLLECTIVE</Text>
            <Text style={s.cardText}>{intelligence.convention_collective.intitule}</Text>
            <Text style={s.cardText}>Droit à {intelligence.convention_collective.droit_formation_heures}h de formation/an</Text>
          </View>
        )}

        <Ftr date={generatedAt} p={8} t={T} />
      </Page>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* PAGE 6 : PLAN D'ACTION — "Voici exactement quoi faire" */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <Page size="A4" style={s.page}>
        <Hdr date={generatedAt} p={6} t={T} />

        {/* Timeline 14 jours */}
        {n.plan_action && (
          <View style={s.section}>
            <Text style={s.sTitle}>📅 Timeline 14 jours</Text>
            <View style={s.sBar} />
            {[
              { n: '1', t: n.plan_action.action_1, c: C.brand },
              { n: '2', t: n.plan_action.action_2, c: C.indigo },
              { n: '3', t: n.plan_action.action_3, c: C.violet },
              { n: '4', t: 'Relance téléphonique si pas de réponse sous 48h', c: C.amber },
              { n: '5', t: 'Proposition personnalisée avec 3 créneaux de formation', c: C.green },
              { n: '6', t: 'Closing et signature convention OPCO', c: C.greenDark },
            ].map((st) => (
              <View key={st.n} style={s.planStep}>
                <View style={[s.planDot, { backgroundColor: st.c }]}><Text style={s.planDotT}>{st.n}</Text></View>
                <Text style={s.planText}>{st.t}</Text>
              </View>
            ))}

            {/* Rappel important */}
            <View style={{ backgroundColor: C.amberBg, padding: 6, borderRadius: 4, marginTop: 6 }}>
              <Text style={{ fontSize: 7, color: C.amberDark, fontWeight: 'bold' }}>
                💡 Rappel : {n.plan_action?.rappel || 'Toujours finir par un bénéfice client, jamais par une caractéristique produit'}
              </Text>
            </View>
          </View>
        )}

        {/* Message motivant final */}
        <View style={[s.verdict, { backgroundColor: C.greenBg, borderLeftColor: C.green, marginTop: 16 }]}>
          <Text style={[s.verdictText, { color: C.greenDark }]}>
            🚀 Ce prospect a toutes les cartes en main pour réussir. Ton job : lui montrer le chemin vers son succès !
          </Text>
        </View>

        {/* Coordonnées Satorea */}
        <View style={[s.card, { marginTop: 16, backgroundColor: C.bgWarm }]}>
          <Text style={s.cardLabel}>📞 CONTACT SATOREA</Text>
          <Text style={s.cardText}>Support commercial : 01 84 88 36 12</Text>
          <Text style={s.cardText}>Email : contact@satorea.fr</Text>
          <Text style={s.cardText}>Mon CRM : https://crm-dermotec.vercel.app</Text>
        </View>

        <Ftr date={generatedAt} p={6} t={T} />
      </Page>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* ANNEXE B : FINANCEMENT & AIDES DÉTAILLÉES */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {(intelligence?.convention_collective || intelligence?.aides_disponibles?.length) ? (
        <Page size="A4" style={s.page}>
          <Hdr date={generatedAt} p={8} t={T} />

          <Text style={s.sTitle}>Annexe B: Financement & Aides Détaillées</Text>
          <View style={s.sBar} />

          {/* Convention Collective */}
          {intelligence.convention_collective && (
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 9, fontWeight: 'bold', color: C.accent, marginBottom: 8 }}>
                Convention Collective
              </Text>
              <View style={{
                backgroundColor: intelligence.convention_collective.est_secteur_beaute ? C.greenBg : C.card,
                padding: 10,
                borderRadius: 8,
                borderLeftWidth: 3,
                borderLeftColor: intelligence.convention_collective.est_secteur_beaute ? C.green : C.border
              }}>
                <Text style={{ fontSize: 8, fontWeight: 'bold', color: C.text }}>
                  IDCC {intelligence.convention_collective.code_convention}
                </Text>
                <Text style={{ fontSize: 8, color: C.textMed, marginTop: 1 }}>
                  {intelligence.convention_collective.intitule}
                </Text>
                <View style={{ flexDirection: 'row', marginTop: 4, gap: 8 }}>
                  <View style={{
                    backgroundColor: C.skyBg,
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    borderRadius: 4
                  }}>
                    <Text style={{ fontSize: 7, color: C.sky, fontWeight: 'bold' }}>
                      {intelligence.convention_collective.droit_formation_heures}h/an
                    </Text>
                  </View>
                  {intelligence.convention_collective.est_secteur_beaute && (
                    <View style={{
                      backgroundColor: C.greenBg,
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      borderRadius: 4
                    }}>
                      <Text style={{ fontSize: 7, color: C.green, fontWeight: 'bold' }}>
                        Secteur Beauté
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          )}

          {/* Aides disponibles */}
          {intelligence.aides_disponibles?.length ? (
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 9, fontWeight: 'bold', color: C.accent, marginBottom: 8 }}>
                Aides Disponibles
              </Text>
              {intelligence.aides_disponibles.map((aide, idx) => (
                <View key={idx} style={{
                  flexDirection: 'row',
                  padding: 8,
                  marginBottom: 6,
                  backgroundColor: C.card,
                  borderRadius: 6,
                  borderLeftWidth: 2,
                  borderLeftColor: C.brand
                }}>
                  <View style={{ flex: 2 }}>
                    <Text style={{ fontSize: 8, fontWeight: 'bold', color: C.text }}>
                      {aide.nom}
                    </Text>
                    <Text style={{ fontSize: 7, color: C.textMed }}>
                      {aide.financeur}
                    </Text>
                  </View>
                  <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={{ fontSize: 7, color: C.textMed }}>
                      {aide.type}
                    </Text>
                  </View>
                  <View style={{ flex: 1, alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 8, fontWeight: 'bold', color: C.brand }}>
                      {aide.montant_max ? `${aide.montant_max}€` : 'Variable'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : null}

          {/* Signaux */}
          {intelligence.signaux && (
            <View style={{ marginTop: 16 }}>
              <Text style={{ fontSize: 9, fontWeight: 'bold', color: C.accent, marginBottom: 8 }}>
                Signaux d'Alerte
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                {intelligence.signaux.est_sur_promo && (
                  <View style={{ backgroundColor: C.greenBg, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 }}>
                    <Text style={{ fontSize: 7, color: C.green, fontWeight: 'bold' }}>🎯 En promo</Text>
                  </View>
                )}
                {intelligence.signaux.est_organisme_concurrent && (
                  <View style={{ backgroundColor: C.redBg, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 }}>
                    <Text style={{ fontSize: 7, color: C.red, fontWeight: 'bold' }}>⚠️ Concurrent</Text>
                  </View>
                )}
                {intelligence.signaux.avis_insuffisants && (
                  <View style={{ backgroundColor: C.amberBg, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 }}>
                    <Text style={{ fontSize: 7, color: C.amber, fontWeight: 'bold' }}>📊 Peu d'avis</Text>
                  </View>
                )}
                {intelligence.signaux.zone_saturee && (
                  <View style={{ backgroundColor: C.redBg, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 }}>
                    <Text style={{ fontSize: 7, color: C.red, fontWeight: 'bold' }}>🏢 Zone saturée</Text>
                  </View>
                )}
                {intelligence.signaux.droits_formation_non_consommes && (
                  <View style={{ backgroundColor: C.greenBg, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 }}>
                    <Text style={{ fontSize: 7, color: C.green, fontWeight: 'bold' }}>💰 Droits disponibles</Text>
                  </View>
                )}
                {intelligence.signaux.en_difficulte && (
                  <View style={{ backgroundColor: C.redBg, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 }}>
                    <Text style={{ fontSize: 7, color: C.red, fontWeight: 'bold' }}>📉 Difficultés</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          <Ftr date={generatedAt} p={9} t={T} />
        </Page>
      ) : null}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {/* ANNEXE D : DONNÉES BRUTES */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <Page size="A4" style={s.pageAlt}>
        <Hdr date={generatedAt} p={10} t={T} />

        <Text style={s.sTitle}>Annexe D: Données Brutes</Text>
        <View style={s.sBar} />

        {/* Quartier + Digital */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
          <View style={{ flex: 1 }}>
            <Text style={s.chartTitle}>Analyse du Quartier</Text>
            <View style={s.qGrid}>
              <View style={s.qBox}><Text style={s.qNum}>{e.quartier?.metros ?? '--'}</Text><Text style={s.qLabel}>Metros</Text></View>
              <View style={s.qBox}><Text style={s.qNum}>{e.quartier?.restaurants ?? '--'}</Text><Text style={s.qLabel}>Restos</Text></View>
              <View style={s.qBox}><Text style={s.qNum}>{e.quartier?.concurrentsBeaute ?? '--'}</Text><Text style={s.qLabel}>Beaute</Text></View>
              <View style={s.qBox}><Text style={s.qNum}>{e.quartier?.pharmacies ?? '--'}</Text><Text style={s.qLabel}>Pharma</Text></View>
            </View>
            <View><Text style={{ fontSize: 7, fontWeight: 'bold', color: C.accent, marginBottom: 2 }}>Trafic Pieton</Text>
              <View style={{ height: 12, backgroundColor: C.card, borderRadius: 6, overflow: 'hidden', marginTop: 4 }}>
                <View style={{ height: '100%', borderRadius: 6, width: `${e.quartier?.footTrafficScore ?? 0}%`, backgroundColor: scoreColor(e.quartier?.footTrafficScore ?? 0) }} />
              </View>
              <Text style={{ fontSize: 7, fontWeight: 'bold', color: scoreColor(e.quartier?.footTrafficScore ?? 0), marginTop: 2 }}>{e.quartier?.footTrafficScore ?? 0}/100</Text>
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.chartTitle}>Empreinte Digitale</Text>
            <View style={s.dRow}>
              <View style={s.dBox}><View style={[s.dDot, { backgroundColor: e.social?.website || e.google?.website ? C.green : C.red }]} /><View><Text style={s.dLabel}>Site Web</Text><Text style={s.dValue}>{e.social?.website || e.google?.website ? 'Actif' : 'Non'}</Text></View></View>
              <View style={s.dBox}><View style={[s.dDot, { backgroundColor: e.social?.instagram ? C.green : C.red }]} /><View><Text style={s.dLabel}>Instagram</Text><Text style={s.dValue}>{e.social?.instagram ? `@${e.social.instagram.username}` : 'Non'}</Text></View></View>
            </View>
            <View style={s.dRow}>
              <View style={s.dBox}><View style={[s.dDot, { backgroundColor: e.social?.facebook?.url ? C.green : C.red }]} /><View><Text style={s.dLabel}>Facebook</Text><Text style={s.dValue}>{e.social?.facebook?.url ? 'Oui' : 'Non'}</Text></View></View>
              <View style={s.dBox}><View style={[s.dDot, { backgroundColor: C.textLight }]} /><View><Text style={s.dLabel}>Forme jur.</Text><Text style={s.dValue}>{e.pappers?.formeJuridique || e.sirene?.forme_juridique || '--'}</Text></View></View>
            </View>
            <View style={s.fiche}>
              <View style={s.fRow}><Text style={s.fLabel}>SIRET</Text><Text style={s.fValue}>{e.sirene?.siret || '--'}</Text></View>
              <View style={s.fRow}><Text style={s.fLabel}>NAF</Text><Text style={s.fValue}>{e.sirene?.code_naf || '--'}</Text></View>
              <View style={s.fRow}><Text style={s.fLabel}>Creation</Text><Text style={s.fValue}>{e.pappers?.dateCreation || e.sirene?.date_creation || '--'}</Text></View>
              {e.pappers?.dirigeants?.[0] && <View style={s.fRow}><Text style={s.fLabel}>Dirigeant</Text><Text style={s.fValue}>{e.pappers.dirigeants[0].nom} — {e.pappers.dirigeants[0].fonction}</Text></View>}
            </View>
          </View>
        </View>

        {/* Guide */}
        <View style={s.guideBox}>
          <Text style={s.guideTitle}>Guide de lecture des scores</Text>
          {[
            { l: 'Reputation', d: 'Avis Google/PJ, satisfaction clients', c: C.dRep },
            { l: 'Presence', d: 'Site web, reseaux sociaux, plateformes', c: C.dPres },
            { l: 'Activite', d: 'Posts, engagement, communication', c: C.dAct },
            { l: 'Financier', d: 'CA, effectif, capacite investissement', c: C.dFin },
            { l: 'Quartier', d: 'Transports, commerces, concurrence locale', c: C.dQrt },
          ].map((d, i) => (
            <View key={i} style={s.guideRow}><View style={[s.guideDot, { backgroundColor: d.c }]} /><Text style={s.guideText}><Text style={{ fontWeight: 'bold' }}>{d.l}</Text> — {d.d}</Text></View>
          ))}
          <Text style={{ fontSize: 5.5, color: C.textLight, marginTop: 4, fontStyle: 'italic' }}>Score global = Reputation 30% + Presence 25% + Activite 20% + Financier 15% + Quartier 10%</Text>
        </View>

        {/* CTA */}
        <View style={s.cta}>
          <Text style={s.ctaTitle}>Pret a contacter ce prospect ?</Text>
          <Text style={s.ctaSub}>Utilisez le briefing page 1 pour preparer votre appel</Text>
          <Text style={s.ctaContact}>Satorea CRM — www.satorea.fr — contact@satorea.fr</Text>
        </View>

        <Ftr date={generatedAt} p={10} t={T} />
      </Page>
    </Document>
  )
}
