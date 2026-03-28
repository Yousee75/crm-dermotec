'use client'

import { motion } from 'framer-motion'
import { TimelineStep } from '../TimelineStep'
import { ClosingBox } from '../ClosingBox'
import type { ProspectData, RapportSatorea } from '@/lib/rapport/types'

interface SlidePlanActionProps {
  prospect: ProspectData
  rapport: RapportSatorea
}

const anim = (i: number) => ({
  initial: { opacity: 0, y: 20 } as const,
  whileInView: { opacity: 1, y: 0 } as const,
  transition: { delay: i * 0.1, duration: 0.4, ease: 'easeOut' as const },
  viewport: { once: true } as const,
})

export function SlidePlanAction({ prospect, rapport }: SlidePlanActionProps) {
  return (
    <div className="h-full flex flex-col px-6 md:px-12 py-8 max-w-4xl mx-auto overflow-y-auto">
      <motion.h2 {...anim(0)} className="text-2xl font-bold text-[#111111] mb-4" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
        Plan d&apos;Action J0 &rarr; J+14
      </motion.h2>

      <motion.div {...anim(1)} className="space-y-2 mb-5">
        {rapport.timeline.map((action, i) => (
          <TimelineStep key={i} action={action} isLast={i === rapport.timeline.length - 1} />
        ))}
      </motion.div>

      <motion.div {...anim(2)} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        <div className="bg-white border border-[#F0F0F0] rounded-xl p-4 shadow-sm">
          <h3 className="text-[11px] font-bold text-[#111111] uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <span className="w-[3px] h-3.5 bg-[#FF5C00] rounded-sm" /> L&apos;offre formation
          </h3>
          <table className="w-full text-[12px]">
            <tbody>
              {([
                ['Formation', prospect.formation_principale?.nom || 'Microblading / Microshading'],
                ['Durée', `${prospect.formation_principale?.duree_jours || 2} jours · Qualiopi`],
                ['Prix HT', `${(prospect.formation_principale?.prix_ht || 1400).toLocaleString('fr-FR')} €`],
                ['Financement', 'OPCO EP · 100%'],
                ['ROI', `Remboursée en ${rapport.kpi.remboursement_jours} jours`],
              ] as const).map(([label, value]) => (
                <tr key={label} className="border-b border-[#F0F0F0] last:border-b-0">
                  <td className="py-1.5 text-[#777777] pr-3">{label}</td>
                  <td className="py-1.5 font-medium text-[#111111]">
                    {label === 'Financement' ? <span className="text-[#10B981] font-bold">{value}</span> : value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white border border-[#F0F0F0] rounded-xl p-4 shadow-sm">
          <h3 className="text-[11px] font-bold text-[#111111] uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <span className="w-[3px] h-3.5 bg-[#10B981] rounded-sm" /> Tarifs prestations post-formation
          </h3>
          <table className="w-full text-[12px]">
            <tbody>
              {([
                ['Sourcils femmes', '200€', '#10B981'],
                ['Sourcils hommes', '250€', '#10B981'],
                ['Full Lips', '300€', '#FF5C00'],
                ['Retouche (4-6 sem.)', '80-100€', '#777777'],
              ] as const).map(([prestation, prix, color]) => (
                <tr key={prestation} className="border-b border-[#F0F0F0] last:border-b-0">
                  <td className="py-1.5 text-[#111111]">{prestation}</td>
                  <td className="py-1.5 font-semibold" style={{ color }}>{prix}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      <motion.div {...anim(3)}>
        <ClosingBox text={rapport.conclusion_emotionnelle} />
      </motion.div>
    </div>
  )
}
