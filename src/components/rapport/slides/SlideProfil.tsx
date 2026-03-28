'use client'

import { motion } from 'framer-motion'
import { FlashBox } from '../FlashBox'
import type { ProspectData, RapportSatorea } from '@/lib/rapport/types'

interface SlideProfilProps {
  prospect: ProspectData
  rapport: RapportSatorea
}

const anim = (i: number) => ({
  initial: { opacity: 0, y: 20 } as const,
  whileInView: { opacity: 1, y: 0 } as const,
  transition: { delay: i * 0.1, duration: 0.4, ease: 'easeOut' as const },
  viewport: { once: true } as const,
})

export function SlideProfil({ prospect, rapport }: SlideProfilProps) {
  return (
    <div className="h-full flex flex-col justify-center px-6 md:px-12 py-8 max-w-4xl mx-auto overflow-y-auto">
      <motion.h2 {...anim(0)}
        className="text-2xl font-bold text-[#111111] mb-4" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
        Profil &amp; Analyse Stratégique
      </motion.h2>

      <motion.div {...anim(1)}>
        <FlashBox label="Profil psychologique" variant="accent">
          {rapport.profil_psychologique}
        </FlashBox>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <motion.div {...anim(2)} className="bg-white border border-[#EEEEEE] rounded-xl p-4 shadow-sm">
          <h3 className="text-[11px] font-bold text-[#111111] uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <span className="w-[3px] h-3.5 bg-[#FF5C00] rounded-sm" /> Fiche identité
          </h3>
          <table className="w-full text-[12px]">
            <tbody>
              {([
                ['Salon', prospect.nom_salon],
                ['Adresse', `${prospect.adresse}, ${prospect.ville}`],
                ['Mobile', prospect.telephone_mobile],
                ['Juridique', prospect.finances.forme_juridique],
                ['Créé en', `${prospect.finances.annee_creation} — ${rapport.kpi.anciennete_ans} ans`],
                ['Effectif', prospect.effectif],
                ['Mixte H+F', prospect.mixte ? 'OUI — double marché' : 'Non'],
                ['BODACC', prospect.finances.bodacc_clean ? '0 procédure · dossier sain' : 'À vérifier'],
              ] as const).map(([label, value]) => (
                <tr key={label} className="border-b border-[#F4F0EB] last:border-b-0">
                  <td className="py-1.5 text-[#777777] pr-3">{label}</td>
                  <td className="py-1.5 font-medium text-[#111111]">
                    {label === 'Mobile' ? (
                      <a href={`tel:${String(value).replace(/\s/g, '')}`} className="text-[#FF5C00] font-semibold">{value}</a>
                    ) : label === 'Mixte H+F' ? (
                      <span className={prospect.mixte ? 'text-[#10B981] font-semibold' : 'text-[#777777]'}>{value}</span>
                    ) : label === 'BODACC' ? (
                      <span className={prospect.finances.bodacc_clean ? 'text-[#10B981]' : 'text-[#FF2D78]'}>{value}</span>
                    ) : value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>

        <motion.div {...anim(3)} className="bg-white border border-[#EEEEEE] rounded-xl p-4 shadow-sm">
          <h3 className="text-[11px] font-bold text-[#111111] uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <span className="w-[3px] h-3.5 bg-[#10B981] rounded-sm" /> Réputation — Score {rapport.kpi.score_reputation}/100
          </h3>
          <table className="w-full text-[12px]">
            <thead>
              <tr className="bg-[#111111] text-white text-[9px] uppercase tracking-wide">
                <th className="py-1.5 px-2 text-left rounded-tl">Plateforme</th>
                <th className="py-1.5 px-2 text-left">Note</th>
                <th className="py-1.5 px-2 text-left rounded-tr">Avis</th>
              </tr>
            </thead>
            <tbody>
              {prospect.reputation.planity_note != null && (
                <tr className="border-b border-[#F4F0EB]">
                  <td className="py-1.5 px-2 font-medium">Planity</td>
                  <td className="py-1.5 px-2 text-[#10B981] font-bold">{prospect.reputation.planity_note}/5</td>
                  <td className="py-1.5 px-2">{prospect.reputation.planity_nb_avis}</td>
                </tr>
              )}
              {prospect.reputation.google_note != null && (
                <tr className="border-b border-[#F4F0EB]">
                  <td className="py-1.5 px-2 font-medium">Google</td>
                  <td className="py-1.5 px-2 text-[#FF5C00] font-semibold">{prospect.reputation.google_note}/5</td>
                  <td className="py-1.5 px-2">{prospect.reputation.google_nb_avis}</td>
                </tr>
              )}
              <tr className="bg-[#ECFDF5]">
                <td className="py-1.5 px-2 font-bold">TOTAL</td>
                <td className="py-1.5 px-2 text-[#10B981] font-bold">{prospect.reputation.note_globale}/5</td>
                <td className="py-1.5 px-2 font-bold">{prospect.reputation.nb_avis_total}</td>
              </tr>
            </tbody>
          </table>
        </motion.div>
      </div>

      <motion.div {...anim(4)} className="mt-4">
        <FlashBox label="Opportunité concurrentielle" variant="success">
          {rapport.angle_unique}
        </FlashBox>
      </motion.div>

      {prospect.concurrents_500m && (
        <motion.div {...anim(5)} className="mt-3 bg-white border border-[#EEEEEE] rounded-xl p-4 shadow-sm">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="bg-[#111111] text-white text-[9px] uppercase tracking-wide">
                <th className="py-1.5 px-2 text-left rounded-tl">Indicateur</th>
                <th className="py-1.5 px-2 text-left">Valeur</th>
                <th className="py-1.5 px-2 text-left rounded-tr">Signification</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-[#F4F0EB]">
                <td className="py-1.5 px-2">Concurrents dans 500m</td>
                <td className="py-1.5 px-2 font-bold">{prospect.concurrents_500m}</td>
                <td className="py-1.5 px-2 text-[#777777]">Zone concurrentielle</td>
              </tr>
              {prospect.concurrents_avec_dermo != null && (
                <tr className="border-b border-[#F4F0EB]">
                  <td className="py-1.5 px-2">Avec dermopigmentation</td>
                  <td className="py-1.5 px-2 font-bold" style={{ color: prospect.concurrents_avec_dermo === 0 ? '#10B981' : '#FF2D78' }}>
                    {prospect.concurrents_avec_dermo}
                  </td>
                  <td className="py-1.5 px-2 text-[#777777]">
                    {prospect.concurrents_avec_dermo === 0 ? 'QUASI-MONOPOLE POTENTIEL' : 'Concurrents directs'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </motion.div>
      )}
    </div>
  )
}
