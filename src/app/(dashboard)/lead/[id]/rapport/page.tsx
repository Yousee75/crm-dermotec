'use client'

export const dynamic = 'force-dynamic'

import { use, useMemo } from 'react'
import { useLead } from '@/hooks/use-leads'
import { formatPhone } from '@/lib/utils'
import { getScoreColor, getScoreLabel } from '@/lib/scoring'
import Link from 'next/link'
import { ArrowLeft, Printer } from 'lucide-react'

// ══════════════════════════════════════════════════════════════
// PAGE RAPPORT PROSPECT — Full screen HTML, 1 page, imprimable
// Route: /lead/[id]/rapport
// ══════════════════════════════════════════════════════════════

export default function RapportProspectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: lead, isLoading } = useLead(id)

  // Données simulées pour la demo (en prod, viendrait de l'enrichissement + IA)
  const scores = useMemo(() => {
    if (!lead) return null
    // Calculer des scores basiques à partir des données disponibles
    const hasEmail = lead.email ? 15 : 0
    const hasPhone = lead.telephone ? 15 : 0
    const hasEntreprise = lead.entreprise_nom ? 10 : 0
    const hasFormation = lead.formation_principale_id ? 20 : 0
    const baseScore = lead.score_chaud || 0

    return {
      reputation: Math.min(100, baseScore + 10),
      presence: Math.min(100, hasEmail + hasPhone + 30),
      activity: Math.min(100, (lead.nb_contacts || 0) * 15 + 10),
      financial: Math.min(100, hasEntreprise + 40),
      neighborhood: 65, // Par défaut Paris
    }
  }, [lead])

  const globalScore = scores ? Math.round(
    scores.reputation * 0.30 + scores.presence * 0.25 + scores.activity * 0.20 + scores.financial * 0.15 + scores.neighborhood * 0.10
  ) : 0

  const classification = lead ? (lead.score_chaud >= 60 ? 'CHAUD' : lead.score_chaud >= 30 ? 'TIEDE' : 'FROID') : 'FROID'
  const classColor = classification === 'CHAUD' ? '#10B981' : classification === 'TIEDE' ? '#F59E0B' : '#EF4444'
  const classBg = classification === 'CHAUD' ? '#ECFDF5' : classification === 'TIEDE' ? '#FFFBEB' : '#FEF2F2'
  const classText = classification === 'CHAUD' ? '#065F46' : classification === 'TIEDE' ? '#92400E' : '#991B1B'

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
  }

  if (!lead) {
    return <div className="flex items-center justify-center h-screen text-[#777777]">Lead introuvable</div>
  }

  const nom = `${lead.prenom} ${lead.nom || ''}`.trim()
  const date = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  const sc = getScoreColor(lead.score_chaud)
  const formation = lead.formation_principale

  // Radar points calculation (pentagon, center 100,100, radius 70)
  const radarPoints = scores ? calcRadarPoints([scores.reputation, scores.presence, scores.activity, scores.financial, scores.neighborhood], 100, 100, 70) : ''
  const avgPoints = calcRadarPoints([50, 50, 50, 50, 50], 100, 100, 70)

  return (
    <>
      {/* Toolbar (ne s'imprime pas) */}
      <div className="print:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-[#EEEEEE] px-4 py-2 flex items-center justify-between">
        <Link href={`/lead/${id}`} className="flex items-center gap-2 text-sm text-[#777777] hover:text-primary transition">
          <ArrowLeft className="w-4 h-4" /> Retour fiche lead
        </Link>
        <button onClick={() => window.print()} className="flex items-center gap-2 px-3 py-1.5 bg-accent text-white rounded-lg text-sm hover:bg-accent/90 transition">
          <Printer className="w-4 h-4" /> Imprimer / PDF
        </button>
      </div>

      {/* RAPPORT — 1 page plein écran */}
      <div className="h-screen print:h-auto overflow-hidden print:overflow-visible pt-12 print:pt-0" style={{ fontFamily: "'DM Sans', -apple-system, sans-serif" }}>
        <div className="h-full grid grid-rows-[auto_1fr_auto] p-4 print:p-6 gap-2.5">

          {/* ═══ HEADER ═══ */}
          <div className="flex items-center justify-between pb-2.5 border-b-[3px]" style={{ borderColor: 'var(--color-primary)' }}>
            <div className="flex items-center gap-3">
              <span className="text-lg font-extrabold tracking-[2px]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: 'var(--color-primary)' }}>SATOREA</span>
              <div className="w-px h-7 bg-[#EEEEEE]" />
              <div>
                <div className="text-lg font-bold" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: 'var(--color-accent)' }}>{nom}{lead.entreprise_nom ? ` — ${lead.entreprise_nom}` : ''}</div>
                <div className="text-[11px] text-[#777777]">
                  {lead.adresse?.ville || 'Paris'} {lead.telephone && `\u00b7 ${formatPhone(lead.telephone)}`} {lead.email && `\u00b7 ${lead.email}`}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full flex flex-col items-center justify-center text-white font-bold" style={{ backgroundColor: sc }}>
                <span className="text-xl leading-none">{lead.score_chaud}</span>
                <span className="text-[7px] opacity-80">/100</span>
              </div>
              <div className="px-2.5 py-1 rounded-lg text-[10px] font-bold text-white" style={{ backgroundColor: classColor }}>{classification}</div>
              <div className="text-[9px] text-[#999999] text-right">{date}<br />Confidentiel</div>
            </div>
          </div>

          {/* ═══ BODY — 2 colonnes ═══ */}
          <div className="grid grid-cols-2 gap-2.5 overflow-hidden">

            {/* VERDICT — full width */}
            <div className="col-span-2 px-3 py-2 rounded-md text-[11px] font-semibold leading-snug" style={{ background: classBg, borderLeft: `4px solid ${classColor}`, color: classText }}>
              Score {lead.score_chaud}/100 — {classification === 'CHAUD' ? 'Prospect chaud, a traiter en priorite. Forte probabilite de conversion.' : classification === 'TIEDE' ? 'Prospect tiede a potentiel. Besoin de nurturing et d\'un bon angle d\'attaque.' : 'Prospect froid. Necessite un premier contact exploratoire.'}
              {formation && ` Interesse par : ${formation.nom}.`}
              {lead.financement_souhaite && ' Financement souhaite.'}
            </div>

            {/* LEFT: Brief + Script placeholder + Objections */}
            <div className="flex flex-col gap-2 overflow-hidden">
              {/* Brief */}
              <div className="bg-slate-50 rounded-md p-2.5 border border-[#EEEEEE]">
                <div className="text-[9px] font-bold text-accent uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <span className="w-[3px] h-3 bg-primary rounded-sm" />Le Brief
                </div>
                <div className="text-[10px] leading-relaxed">
                  {nom}{lead.statut_pro ? `, ${lead.statut_pro.replace(/_/g, ' ')}` : ''}{lead.entreprise_nom ? ` chez ${lead.entreprise_nom}` : ''}.
                  {lead.experience_esthetique ? ` Experience : ${lead.experience_esthetique}.` : ''}
                  {formation ? ` Interessee par ${formation.nom} (${formation.prix_ht}\u20acHT).` : ''}
                  {lead.financement_souhaite ? ` Cherche un financement${lead.organisme_financement ? ` via ${lead.organisme_financement}` : ''}.` : ''}
                  {` Source : ${lead.source.replace(/_/g, ' ')}.`}
                  {lead.notes ? ` Notes : ${lead.notes.slice(0, 120)}${lead.notes.length > 120 ? '...' : ''}` : ''}
                </div>
              </div>

              {/* Atouts / Pieges */}
              <div className="grid grid-cols-2 gap-2 flex-shrink-0">
                <div>
                  <div className="text-[7px] font-bold px-1.5 py-1 rounded-sm mb-1.5" style={{ background: '#ECFDF5', color: '#059669' }}>ATOUTS POUR VENDRE</div>
                  <div className="text-[8px] text-emerald-600 space-y-0.5 leading-snug">
                    {formation && <div>+ Formation {formation.nom} demandee</div>}
                    {lead.financement_souhaite && <div>+ Financement souhaite = levier prix</div>}
                    {lead.email && lead.telephone && <div>+ Email + tel = double canal contact</div>}
                    {lead.score_chaud >= 50 && <div>+ Score eleve = interet confirme</div>}
                    <div>+ Qualiopi Dermotec = credibilite</div>
                  </div>
                </div>
                <div>
                  <div className="text-[7px] font-bold px-1.5 py-1 rounded-sm mb-1.5" style={{ background: '#FFFBEB', color: '#D97706' }}>PIEGES A EVITER</div>
                  <div className="text-[8px] text-[#FF8C42] space-y-0.5 leading-snug">
                    {!lead.financement_souhaite && <div>! Pas de demande financement = sensible au prix</div>}
                    {!lead.entreprise_nom && <div>! Pas d'entreprise renseignee = profil a qualifier</div>}
                    {(lead.nb_contacts || 0) === 0 && <div>! Jamais contacte = premier contact delicat</div>}
                    <div>! Ne pas etre trop insistant au 1er appel</div>
                    <div>! Parler ROI, pas prix catalogue</div>
                  </div>
                </div>
              </div>

              {/* Script placeholder */}
              <div className="bg-slate-50 rounded-md p-2.5 border border-[#EEEEEE] flex-1 overflow-hidden">
                <div className="text-[9px] font-bold text-accent uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <span className="w-[3px] h-3 bg-primary rounded-sm" />Script Telephonique
                </div>
                <div className="space-y-1.5">
                  {[
                    { n: 1, l: 'Accroche', t: `Bonjour ${lead.prenom}, je suis [Prenom] de Dermotec Advanced, centre certifie Qualiopi a Paris 11e.`, c: 'var(--color-primary)' },
                    { n: 2, l: 'Transition', t: formation ? `On forme des professionnelles au ${formation.nom} — une prestation tres demandee.` : 'On propose des formations courtes certifiees en esthetique.', c: '#FF2D78' },
                    { n: 3, l: 'Proposition', t: formation ? `En ${formation.duree_jours || 2} jours, vous maitrisez la technique. ${formation.prix_ht}\u20acHT, financable OPCO/CPF.` : 'Nos formations durent 1 a 5 jours et sont financables OPCO/CPF.', c: '#FF2D78' },
                    { n: 4, l: 'Closing', t: 'Est-ce qu\'on pourrait se voir 15 min cette semaine ? Je vous montre les chiffres concrets.', c: '#059669' },
                  ].map(step => (
                    <div key={step.n} className="flex gap-1.5 items-start">
                      <div className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[7px] font-bold shrink-0 mt-0.5" style={{ background: step.c }}>{step.n}</div>
                      <div className="flex-1">
                        <span className="text-[6.5px] font-bold text-accent uppercase tracking-wide">{step.l}</span>
                        <div className="text-[8.5px] italic leading-snug text-[#3A3A3A] mt-0.5">{step.t}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Objections */}
              <div className="grid grid-cols-3 gap-1.5 flex-shrink-0">
                {[
                  { t: 'SI "TROP CHER"', r: 'Financement OPCO = 0\u20ac. Je verifie votre eligibilite en 2 min.' },
                  { t: 'SI "PAS LE TEMPS"', r: formation ? `${formation.duree_jours || 2} jours. ROI des la 1ere semaine.` : '1-2 jours max. ROI immediat.' },
                  { t: 'SI "PAS BESOIN"', r: 'Vos concurrentes qui le proposent affichent complet.' },
                ].map((obj, i) => (
                  <div key={i} className="p-1.5 rounded-sm" style={{ background: '#FFFBEB', borderLeft: '2px solid #F59E0B' }}>
                    <div className="text-[6.5px] font-bold mb-0.5" style={{ color: '#D97706' }}>{obj.t}</div>
                    <div className="text-[7.5px] leading-snug" style={{ color: '#78350F' }}>{obj.r}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT: Radar + Formations + Financement */}
            <div className="flex flex-col gap-2 overflow-hidden">
              {/* Radar */}
              <div className="bg-slate-50 rounded-md p-2.5 border border-[#EEEEEE] flex-1 overflow-hidden">
                <div className="text-[9px] font-bold text-accent uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <span className="w-[3px] h-3 bg-primary rounded-sm" />Profil Prospect — 5 axes
                </div>
                <div className="flex items-start gap-2.5">
                  {/* SVG Radar */}
                  <svg width="165" height="165" viewBox="0 0 200 200" className="shrink-0">
                    {/* Grid */}
                    <g opacity="0.15" fill="none" stroke="#94A3B8" strokeWidth="0.5">
                      {[1, 0.8, 0.6, 0.4, 0.2].map((scale, i) => (
                        <polygon key={i} points={calcRadarPoints([100*scale,100*scale,100*scale,100*scale,100*scale], 100, 100, 70)} />
                      ))}
                    </g>
                    {/* Axes */}
                    <g stroke="#CBD5E1" strokeWidth="0.5">
                      {pentagonVertices(100, 100, 70).map((v, i) => (
                        <line key={i} x1="100" y1="100" x2={v[0]} y2={v[1]} />
                      ))}
                    </g>
                    {/* Average */}
                    <polygon points={avgPoints} fill="none" stroke="#EF4444" strokeWidth="1" strokeDasharray="4 3" opacity="0.4" />
                    {/* Data */}
                    {scores && <polygon points={radarPoints} fill="var(--color-primary)" fillOpacity="0.15" stroke="var(--color-primary)" strokeWidth="2" />}
                    {/* Points */}
                    {scores && (() => {
                      const vals = [scores.reputation, scores.presence, scores.activity, scores.financial, scores.neighborhood]
                      const colors = ['#10B981', '#3B82F6', '#FF2D78', '#F59E0B', '#14B8A6']
                      return pentagonVerticesScaled(vals, 100, 100, 70).map((v, i) => (
                        <circle key={i} cx={v[0]} cy={v[1]} r="3" fill={colors[i]} />
                      ))
                    })()}
                    {/* Labels */}
                    <text x="100" y="20" textAnchor="middle" fontSize="8" fill="#475569" fontWeight="600">Reputation</text>
                    <text x="178" y="54" textAnchor="start" fontSize="8" fill="#475569" fontWeight="600">Presence</text>
                    <text x="152" y="140" textAnchor="start" fontSize="8" fill="#475569" fontWeight="600">Activite</text>
                    <text x="48" y="140" textAnchor="end" fontSize="8" fill="#475569" fontWeight="600">Financier</text>
                    <text x="22" y="54" textAnchor="end" fontSize="8" fill="#475569" fontWeight="600">Quartier</text>
                    {/* Legend */}
                    <line x1="18" y1="178" x2="33" y2="178" stroke="var(--color-primary)" strokeWidth="2" />
                    <text x="36" y="181" fontSize="7" fill="#94A3B8">Prospect</text>
                    <line x1="88" y1="178" x2="103" y2="178" stroke="#EF4444" strokeWidth="1" strokeDasharray="4 3" />
                    <text x="106" y="181" fontSize="7" fill="#94A3B8">Moy. secteur</text>
                  </svg>

                  {/* Legend + Insight */}
                  <div className="flex-1 flex flex-col gap-1">
                    {scores && [
                      { l: 'Reputation', v: scores.reputation, c: '#10B981' },
                      { l: 'Quartier', v: scores.neighborhood, c: '#14B8A6' },
                      { l: 'Presence', v: scores.presence, c: '#3B82F6' },
                      { l: 'Financier', v: scores.financial, c: '#F59E0B' },
                      { l: 'Activite', v: scores.activity, c: '#FF2D78' },
                    ].map((d, i) => (
                      <div key={i} className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: d.c }} />
                        <span className="text-[8px] text-[#777777] flex-1">{d.l}</span>
                        <div className="w-10 h-1 bg-[#EEEEEE] rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${d.v}%`, background: d.c }} />
                        </div>
                        <span className="text-[9px] font-bold w-5 text-right" style={{ color: d.c }}>{d.v}</span>
                      </div>
                    ))}

                    {/* Insight */}
                    <div className="text-[7.5px] text-[#777777] leading-snug mt-1 p-1.5 bg-white rounded border border-[#EEEEEE]">
                      <strong>A retenir :</strong>{' '}
                      {scores && scores.neighborhood >= 60 && 'Zone a fort passage.'}
                      {scores && scores.reputation >= 50 ? ' Bonne reputation.' : ' Reputation a construire.'}
                      {scores && scores.activity < 40 && ' Activite digitale faible = argumenter sur la visibilite.'}
                      {scores && scores.financial >= 50 ? ' Capacite d\'investissement correcte.' : ' Budget serre = parler financement d\'emblee.'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Formations */}
              <div className="bg-slate-50 rounded-md p-2.5 border border-[#EEEEEE] flex-shrink-0">
                <div className="text-[9px] font-bold text-accent uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <span className="w-[3px] h-3 bg-primary rounded-sm" />Formations a proposer
                </div>
                {formation ? (
                  <div className="space-y-1.5">
                    <div className="p-1.5 rounded bg-sky-50 border border-primary">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-bold text-accent">{formation.nom}</span>
                        <div className="flex items-center gap-1">
                          <span className="text-[6px] font-bold text-white px-1 py-0.5 rounded bg-primary">PRINCIPAL</span>
                          <span className="text-[9px] font-bold text-primary">{formation.prix_ht}\u20acHT</span>
                        </div>
                      </div>
                      <div className="text-[7.5px] text-emerald-600 mt-1">{formation.duree_jours || 2}j de formation. ROI rapide sur les premieres clientes.</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-[9px] text-[#999999] italic">Aucune formation selectionnee — proposer selon le profil</div>
                )}
              </div>

              {/* Financement */}
              <div className="p-2 rounded-md flex-shrink-0" style={{ background: '#ECFDF5', borderLeft: '3px solid #10B981' }}>
                <div className="text-[7px] font-bold text-emerald-600 mb-1">STRATEGIE FINANCEMENT</div>
                <div className="text-[8px] text-[#10B981] leading-snug">
                  {lead.financement_souhaite
                    ? `${lead.organisme_financement || 'OPCO EP'} — dossier a constituer. ${lead.statut_pro === 'salariee' ? 'Salariee = eligible plan de competences.' : lead.statut_pro === 'independante' ? 'Independante = FAFCEA ou CPF.' : 'Verifier eligibilite OPCO/CPF.'}`
                    : 'Pas de demande financement. Presenter comme argument surprise : "80% de nos stagiaires ne paient rien."'}
                </div>
                <div className="text-[8.5px] text-[#10B981] italic font-bold mt-1.5">
                  "80% de nos stagiaires font financer par l'OPCO. Je verifie votre eligibilite en 2 minutes."
                </div>
              </div>
            </div>
          </div>

          {/* ═══ FOOTER ═══ */}
          <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-[#EEEEEE]">
            <div className="flex gap-1.5 flex-wrap flex-1">
              {[
                { l: 'Canal', v: lead.telephone ? 'Appel direct' : lead.email ? 'Email' : 'A definir' },
                { l: 'Quand', v: 'Mar/Mer 10h-12h' },
                { l: 'Duree', v: '5-7 min' },
              ].map((c, i) => (
                <div key={i} className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-50 border border-[#EEEEEE]">
                  <span className="text-[6.5px] font-bold text-accent uppercase">{c.l}</span>
                  <span className="text-[8px] text-[#3A3A3A]">{c.v}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-1.5">
              {[
                { n: '1', t: 'Appeler', c: 'var(--color-primary)' },
                { n: '2', t: 'SMS si absent', c: '#FF2D78' },
                { n: '3', t: 'Envoyer programme', c: '#FF2D78' },
              ].map(s => (
                <div key={s.n} className="flex items-center gap-1">
                  <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-white text-[7px] font-bold" style={{ background: s.c }}>{s.n}</div>
                  <span className="text-[7.5px] text-[#3A3A3A]">{s.t}</span>
                </div>
              ))}
              <div className="px-1.5 py-0.5 rounded text-[7px] font-semibold" style={{ background: '#FFFBEB', color: '#92400E' }}>Relance J+3</div>
            </div>
            <span className="text-[7px] text-[#999999] shrink-0">Satorea CRM</span>
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          .print\\:hidden { display: none !important; }
          .print\\:h-auto { height: auto !important; }
          .print\\:overflow-visible { overflow: visible !important; }
          .print\\:pt-0 { padding-top: 0 !important; }
          .print\\:p-6 { padding: 24px !important; }
          @page { margin: 0; size: A4 landscape; }
        }
      `}</style>
    </>
  )
}

// ── SVG Radar helpers ────────────────────────────────────────
function pentagonVertices(cx: number, cy: number, r: number): [number, number][] {
  return [0, 1, 2, 3, 4].map(i => {
    const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)]
  })
}

function pentagonVerticesScaled(values: number[], cx: number, cy: number, maxR: number): [number, number][] {
  return values.map((v, i) => {
    const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2
    const r = (v / 100) * maxR
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)]
  })
}

function calcRadarPoints(values: number[], cx: number, cy: number, maxR: number): string {
  return pentagonVerticesScaled(values, cx, cy, maxR)
    .map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`)
    .join(' ')
}
