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
}

// ══════════════════════════════════════════════════════════════
// PALETTE PREMIUM
// ══════════════════════════════════════════════════════════════
const C = {
  brand: '#2EC6F3', brandDark: '#0891B2', accent: '#082545', accentMed: '#0F3460',
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

export function RapportProspect({ lead, narrative: n, enrichment, scores, generatedAt, version = 1, photoUrl, mapUrl }: RapportProspectProps) {
  const nom = `${lead.prenom || ''} ${lead.nom || ''}`.trim() || 'Prospect'
  const sc = scoreColor(n.score_chaleur)
  const cc = classColor(n.classification)
  const e = enrichment || {} as any
  const dims = scores || { reputation: 50, presence: 40, activity: 30, financial: 50, neighborhood: 50 }
  const T = 3

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

      {/* ═══ PAGE 1 — BRIEFING COMMERCIAL COMPLET ═══ */}
      <Page size="A4" style={s.page}>
        <Hdr date={generatedAt} p={1} t={T} />

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

        {/* Brief */}
        <View style={s.section}><Text style={s.sTitle}>Le Brief</Text><View style={s.sBar} /><Text style={s.body}>{n.brief_commercial}</Text></View>

        {/* 4 cards en 2x2 */}
        <View style={s.row}>
          <View style={s.col}><View style={s.card}><Text style={s.cardLabel}>Qui est ce prospect ?</Text><Text style={s.cardText}>{n.histoire_prospect}</Text></View></View>
          <View style={s.col}><View style={s.card}><Text style={s.cardLabel}>Situation Business</Text><Text style={s.cardText}>{n.situation_business}</Text></View></View>
        </View>
        <View style={s.row}>
          <View style={s.col}><View style={s.card}><Text style={s.cardLabel}>Reputation & Visibilite</Text><Text style={s.cardText}>{n.reputation_visibilite}</Text></View></View>
          <View style={s.col}><View style={s.card}><Text style={s.cardLabel}>Son Quartier</Text><Text style={s.cardText}>{n.environnement}</Text></View></View>
        </View>

        {/* Atouts / Pieges */}
        <View style={s.row}>
          <View style={s.col}>
            <Text style={[s.pointTitle, { backgroundColor: C.greenBg, color: C.greenDark }]}>Tes atouts pour vendre</Text>
            {n.atouts_vente.map((a, i) => <Text key={i} style={[s.point, { color: C.greenDark }]}>+ {a}</Text>)}
          </View>
          <View style={s.col}>
            <Text style={[s.pointTitle, { backgroundColor: C.amberBg, color: C.amberDark }]}>Pieges a eviter</Text>
            {n.pieges_eviter.map((p, i) => <Text key={i} style={[s.point, { color: C.amberDark }]}>! {p}</Text>)}
          </View>
        </View>

        {/* Stratégie d'approche */}
        {n.strategie && (
          <View style={s.stratBlock}>
            <Text style={[s.sTitle, { color: C.indigo, fontSize: 9, marginBottom: 6 }]}>Strategie d'approche</Text>
            <View style={[s.row, { gap: 4, marginBottom: 2 }]}>
              <View style={s.col}><Text style={s.stratLabel}>Canal</Text><Text style={s.stratValue}>{n.strategie.canal}</Text></View>
              <View style={s.col}><Text style={s.stratLabel}>Meilleur moment</Text><Text style={s.stratValue}>{n.strategie.meilleur_moment}</Text></View>
              <View style={s.col}><Text style={s.stratLabel}>Duree estimee</Text><Text style={s.stratValue}>{n.strategie.duree_estimee}</Text></View>
            </View>
            <Text style={s.stratLabel}>Angle d'attaque</Text><Text style={s.stratValue}>{n.strategie.angle_attaque}</Text>
            <Text style={[s.stratLabel, { marginTop: 3 }]}>Objectif de l'appel</Text><Text style={s.stratValue}>{n.strategie.objectif_appel}</Text>
          </View>
        )}

        {/* Script 4 étapes */}
        {n.script_telephone && (
          <View style={s.section}>
            <Text style={s.sTitle}>Script Telephonique</Text><View style={s.sBar} />
            {[
              { n: 1, l: 'Accroche', t: n.script_telephone.accroche, c: C.brand },
              { n: 2, l: 'Transition', t: n.script_telephone.transition, c: C.indigo },
              { n: 3, l: 'Proposition', t: n.script_telephone.proposition, c: C.violet },
              { n: 4, l: 'Closing', t: n.script_telephone.closing, c: C.greenDark },
            ].map((st) => (
              <View key={st.n} style={s.scriptStep}>
                <View style={[s.scriptNum, { backgroundColor: st.c }]}><Text style={s.scriptNumT}>{st.n}</Text></View>
                <View style={{ flex: 1 }}><Text style={s.scriptLabel}>{st.l}</Text><Text style={s.scriptText}>{st.t}</Text></View>
              </View>
            ))}
          </View>
        )}

        {/* 3 objections */}
        {n.script_telephone && (
          <View style={s.objGrid}>
            <View style={s.objCard}><Text style={s.objTitle}>Si "trop cher"</Text><Text style={s.objText}>{n.script_telephone.si_objection_prix}</Text></View>
            <View style={s.objCard}><Text style={s.objTitle}>Si "pas le temps"</Text><Text style={s.objText}>{n.script_telephone.si_objection_temps}</Text></View>
            <View style={s.objCard}><Text style={s.objTitle}>Si "pas besoin"</Text><Text style={s.objText}>{n.script_telephone.si_objection_besoin}</Text></View>
          </View>
        )}

        {/* Formations + Financement + Plan */}
        <View style={s.row}>
          <View style={[s.col, { flex: 1.3 }]}>
            <Text style={s.sTitle}>Formations recommandees</Text><View style={s.sBar} />
            {n.formations_recommandees?.slice(0, 3).map((f, i) => (
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
          <View style={[s.col, { flex: 0.7 }]}>
            {n.strategie_financement && (
              <View style={s.finBlock}>
                <Text style={s.finLabel}>Strategie Financement</Text>
                <Text style={s.finText}>{n.strategie_financement.option_principale}</Text>
                <Text style={[s.finText, { marginTop: 2 }]}>{n.strategie_financement.comment_presenter}</Text>
                <Text style={s.finPhrase}>{n.strategie_financement.phrase_cle}</Text>
                {n.strategie_financement.alternatives?.length > 0 && (
                  <View style={{ marginTop: 3 }}><Text style={[s.finLabel, { marginBottom: 1 }]}>Alternatives</Text>
                    {n.strategie_financement.alternatives.map((a, i) => <Text key={i} style={[s.finText, { fontSize: 6.5 }]}>- {a}</Text>)}
                  </View>
                )}
              </View>
            )}
            {n.plan_action && (
              <View><Text style={s.sTitle}>Plan d'action</Text><View style={s.sBar} />
                {[
                  { n: '1', t: n.plan_action.action_1, c: C.brand },
                  { n: '2', t: n.plan_action.action_2, c: C.indigo },
                  { n: '3', t: n.plan_action.action_3, c: C.violet },
                ].map((st) => (
                  <View key={st.n} style={s.planStep}><View style={[s.planDot, { backgroundColor: st.c }]}><Text style={s.planDotT}>{st.n}</Text></View><Text style={s.planText}>{st.t}</Text></View>
                ))}
                <View style={{ backgroundColor: C.amberBg, padding: 4, borderRadius: 3, marginTop: 2 }}>
                  <Text style={{ fontSize: 6.5, color: C.amberDark, fontWeight: 'bold' }}>Rappel : {n.plan_action.rappel}</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        <Ftr date={generatedAt} p={1} t={T} />
      </Page>

      {/* ═══ PAGE 2 — DASHBOARD INTELLIGENCE ═══ */}
      <Page size="A4" style={s.pageAlt}>
        <Hdr date={generatedAt} p={2} t={T} />

        {/* KPIs */}
        <View style={s.kpiRow}>
          <View style={[s.kpiBox, { backgroundColor: C.skyBg }]}>
            <Text style={[s.kpiValue, { color: C.brandDark }]}>{e.google?.rating ? `${e.google.rating}` : '--'}</Text>
            <Text style={s.kpiLabel}>Note Google</Text>
            {e.google?.reviewsCount && <Text style={s.kpiSub}>{e.google.reviewsCount} avis</Text>}
          </View>
          <View style={[s.kpiBox, { backgroundColor: C.indigoBg }]}>
            <Text style={[s.kpiValue, { color: C.indigo }]}>{e.google?.reviewsCount ?? '--'}</Text>
            <Text style={s.kpiLabel}>Avis clients</Text>
          </View>
          <View style={[s.kpiBox, { backgroundColor: C.greenBg }]}>
            <Text style={[s.kpiValue, { color: C.greenDark }]}>{e.pappers?.chiffreAffaires ? `${Math.round(e.pappers.chiffreAffaires / 1000)}K` : '--'}</Text>
            <Text style={s.kpiLabel}>CA annuel</Text>
          </View>
          <View style={[s.kpiBox, { backgroundColor: C.violetBg }]}>
            <Text style={[s.kpiValue, { color: C.violet }]}>{e.pappers?.effectif ?? '--'}</Text>
            <Text style={s.kpiLabel}>Effectif</Text>
          </View>
        </View>

        {/* Charts */}
        <View style={s.chartRow}>
          <View style={s.chartCol}>
            <Text style={s.chartTitle}>Score Multi-Axes</Text>
            <ReactPDFChart>
              <RadarChart width={210} height={150} data={radarData} cx={105} cy={75} outerRadius={55}>
                <PolarGrid stroke={C.borderSoft} />
                <PolarAngleAxis dataKey="axis" tick={{ fontSize: 7, fill: C.textMed }} />
                <Radar dataKey="value" stroke={C.brand} fill={C.brand} fillOpacity={0.2} strokeWidth={2} isAnimationActive={false} />
              </RadarChart>
            </ReactPDFChart>
          </View>
          <View style={s.chartCol}>
            <Text style={s.chartTitle}>Detail par Dimension</Text>
            <ReactPDFChart>
              <BarChart width={250} height={150} data={barData} layout="vertical" margin={{ left: 5, right: 15, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.borderSoft} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 7, fill: C.textLight }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 7, fill: C.textMed }} width={40} />
                <Bar dataKey="score" radius={[0, 4, 4, 0]} isAnimationActive={false}>
                  {barData.map((entry, idx) => <Cell key={idx} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ReactPDFChart>
          </View>
        </View>

        {/* Score global + Pie + Légende avec mini barres */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <View style={{ alignItems: 'center' }}><ScoreBlock value={globalScore} color={scoreColor(globalScore)} /><Text style={{ fontSize: 5.5, color: C.textLight, marginTop: 3, textTransform: 'uppercase', letterSpacing: 0.5 }}>Score Global</Text></View>
          <View style={{ flex: 1 }}>
            <ReactPDFChart>
              <PieChart width={120} height={80}>
                <Pie data={pieData} cx={60} cy={40} innerRadius={22} outerRadius={35} paddingAngle={2} dataKey="value" isAnimationActive={false}>
                  <Cell fill={scoreColor(globalScore)} /><Cell fill={C.card} />
                </Pie>
              </PieChart>
            </ReactPDFChart>
          </View>
          <View style={{ flex: 2 }}>
            {[
              { label: 'Reputation (30%)', value: dims.reputation, color: C.dRep },
              { label: 'Presence (25%)', value: dims.presence, color: C.dPres },
              { label: 'Activite (20%)', value: dims.activity, color: C.dAct },
              { label: 'Financier (15%)', value: dims.financial, color: C.dFin },
              { label: 'Quartier (10%)', value: dims.neighborhood, color: C.dQrt },
            ].map((d, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2.5 }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: d.color, marginRight: 4 }} />
                <Text style={{ fontSize: 6.5, color: C.textMed, flex: 1 }}>{d.label}</Text>
                <View style={{ width: 40, height: 4, backgroundColor: C.card, borderRadius: 2, marginRight: 4, overflow: 'hidden' }}>
                  <View style={{ width: `${d.value}%`, height: '100%', backgroundColor: d.color, borderRadius: 2 }} />
                </View>
                <Text style={{ fontSize: 7, fontWeight: 'bold', color: d.color, width: 18, textAlign: 'right' }}>{d.value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Analyse des avis */}
        {e.reviews?.analysis && (
          <View style={{ marginBottom: 8 }}>
            <Text style={s.chartTitle}>Analyse des Avis Clients ({e.reviews.analysis.totalReviews} avis)</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {/* Distribution étoiles — barres horizontales */}
              <View style={{ flex: 1 }}>
                {e.reviews.analysis.distribution.slice().reverse().map((d: { stars: number; count: number; percentage: number }, i: number) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2.5 }}>
                    <Text style={{ fontSize: 7, width: 18, textAlign: 'right', color: C.textMed }}>{d.stars}★</Text>
                    <View style={{ flex: 1, height: 8, backgroundColor: C.card, borderRadius: 4, marginHorizontal: 4, overflow: 'hidden' }}>
                      <View style={{ width: `${d.percentage}%`, height: '100%', borderRadius: 4, backgroundColor: d.stars >= 4 ? C.green : d.stars === 3 ? C.amber : C.red }} />
                    </View>
                    <Text style={{ fontSize: 6.5, width: 24, color: C.textMed }}>{d.count} ({d.percentage}%)</Text>
                  </View>
                ))}
              </View>

              {/* KPIs + tendance + réponses proprio */}
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', gap: 3, marginBottom: 4 }}>
                  <View style={{ flex: 1, backgroundColor: C.skyBg, padding: 5, borderRadius: 4, alignItems: 'center' }}>
                    <Text style={{ fontSize: 12, fontWeight: 'bold', color: C.brandDark }}>{e.reviews.analysis.averageRating}/5</Text>
                    <Text style={{ fontSize: 5, color: C.textLight }}>MOYENNE</Text>
                  </View>
                  <View style={{ flex: 1, backgroundColor: e.reviews.analysis.trend === 'improving' ? C.greenBg : e.reviews.analysis.trend === 'declining' ? C.redBg : C.bgWarm, padding: 5, borderRadius: 4, alignItems: 'center' }}>
                    <Text style={{ fontSize: 10, fontWeight: 'bold', color: e.reviews.analysis.trend === 'improving' ? C.green : e.reviews.analysis.trend === 'declining' ? C.red : C.textMed }}>
                      {e.reviews.analysis.trend === 'improving' ? '↑' : e.reviews.analysis.trend === 'declining' ? '↓' : '→'}{e.reviews.analysis.trendDelta > 0 ? '+' : ''}{e.reviews.analysis.trendDelta}
                    </Text>
                    <Text style={{ fontSize: 5, color: C.textLight }}>TENDANCE 6M</Text>
                  </View>
                  <View style={{ flex: 1, backgroundColor: C.indigoBg, padding: 5, borderRadius: 4, alignItems: 'center' }}>
                    <Text style={{ fontSize: 10, fontWeight: 'bold', color: C.indigo }}>{e.reviews.analysis.ownerResponseRate}%</Text>
                    <Text style={{ fontSize: 5, color: C.textLight }}>REP. PROPRIO</Text>
                  </View>
                </View>

                {/* Mots-clés (tags) */}
                {e.reviews.analysis.positiveKeywords.length > 0 && (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 2, marginBottom: 3 }}>
                    {e.reviews.analysis.positiveKeywords.slice(0, 5).map((kw, i) => (
                      <View key={i} style={{ backgroundColor: C.greenBg, paddingHorizontal: 3, paddingVertical: 1, borderRadius: 2 }}>
                        <Text style={{ fontSize: 5.5, color: C.greenDark }}>{kw}</Text>
                      </View>
                    ))}
                    {e.reviews.analysis.negativeKeywords.slice(0, 3).map((kw, i) => (
                      <View key={`n${i}`} style={{ backgroundColor: C.amberBg, paddingHorizontal: 3, paddingVertical: 1, borderRadius: 2 }}>
                        <Text style={{ fontSize: 5.5, color: C.amberDark }}>{kw}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Stats compactes */}
                <Text style={{ fontSize: 5.5, color: C.textLight }}>
                  {e.reviews.analysis.fetchedCount} avis analysés • {e.reviews.analysis.withTextPercentage}% avec texte • {e.reviews.analysis.reviewsWithPhotos} avec photo
                </Text>
              </View>
            </View>

            {/* Citations (compact) */}
            <View style={{ flexDirection: 'row', gap: 5, marginTop: 4 }}>
              {e.reviews.analysis.topPositiveReview && (
                <View style={{ flex: 1, backgroundColor: C.greenBg, padding: 5, borderRadius: 3, borderLeftWidth: 2, borderLeftColor: C.green }}>
                  <Text style={{ fontSize: 6.5, color: '#14532D', fontStyle: 'italic', lineHeight: 1.3 }}>
                    « {e.reviews.analysis.topPositiveReview.text.slice(0, 120)}{e.reviews.analysis.topPositiveReview.text.length > 120 ? '...' : ''} »
                  </Text>
                  <Text style={{ fontSize: 5, color: C.textLight, marginTop: 1 }}>— {e.reviews.analysis.topPositiveReview.author_name} ★★★★★</Text>
                </View>
              )}
              {e.reviews.analysis.topNegativeReview && (
                <View style={{ flex: 1, backgroundColor: C.redBg, padding: 5, borderRadius: 3, borderLeftWidth: 2, borderLeftColor: C.red }}>
                  <Text style={{ fontSize: 6.5, color: '#7F1D1D', fontStyle: 'italic', lineHeight: 1.3 }}>
                    « {e.reviews.analysis.topNegativeReview.text.slice(0, 120)}{e.reviews.analysis.topNegativeReview.text.length > 120 ? '...' : ''} »
                  </Text>
                  <Text style={{ fontSize: 5, color: C.textLight, marginTop: 1 }}>— {e.reviews.analysis.topNegativeReview.author_name} ★{'☆'.repeat(5 - e.reviews.analysis.topNegativeReview.rating)}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Map */}
        {staticMapUrl && (
          <View style={{ marginBottom: 12 }}>
            <Text style={s.chartTitle}>Localisation</Text>
            <Image style={s.mapImg} src={staticMapUrl} />
            <Text style={s.mapCap}>{e.sirene?.adresse ? `${e.sirene.adresse}, ${e.sirene.code_postal} ${e.sirene.ville}` : nom}</Text>
          </View>
        )}

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

        <Ftr date={generatedAt} p={2} t={T} />
      </Page>
    </Document>
  )
}
