'use client'

import { motion } from 'framer-motion'
import { AnimatedCounter } from '@/components/ui/AnimatedCounter'
import { FlashBox } from '../FlashBox'
import { BarScenario } from '../BarScenario'
import type { ProspectData, RapportSatorea } from '@/lib/rapport/types'

interface SlideROIProps {
  prospect: ProspectData
  rapport: RapportSatorea
}

const anim = (i: number) => ({
  initial: { opacity: 0, y: 20 } as const,
  whileInView: { opacity: 1, y: 0 } as const,
  transition: { delay: i * 0.1, duration: 0.4, ease: 'easeOut' as const },
  viewport: { once: true } as const,
})

export function SlideROI({ prospect, rapport }: SlideROIProps) {
  const prixFormation = prospect.formation_principale?.prix_ht || 1400

  return (
    <div className="h-full flex flex-col justify-center px-6 md:px-12 py-8 max-w-4xl mx-auto">
      <motion.h2 {...anim(0)} className="text-2xl font-bold text-[#111111] mb-4" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
        Projection Financière
      </motion.h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <motion.div {...anim(1)}>
          <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#777777] mb-1">
            Potentiel mensuel · scénario mixte
          </div>
          <div className="text-[#10B981] leading-none" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
            <span className="text-5xl md:text-7xl font-black">+</span>
            <AnimatedCounter value={rapport.kpi.ca_mensuel_mixte} className="text-5xl md:text-7xl font-black font-mono" duration={1200} />
            <span className="text-2xl md:text-3xl font-bold">€</span>
          </div>
          <div className="text-[14px] text-[#777777] mt-1">par mois · pur bénéfice</div>
        </motion.div>

        <motion.div {...anim(2)} className="space-y-3">
          <FlashBox label="Argument OPCO">
            {rapport.argument_opco}
          </FlashBox>
          {rapport.argument_tarifaire && (
            <FlashBox label="Cohérence tarifaire" variant="success">
              {rapport.argument_tarifaire}
            </FlashBox>
          )}
        </motion.div>
      </div>

      <motion.div {...anim(3)} className="h-px bg-gradient-to-r from-[#EEEEEE] to-transparent my-5" />

      <motion.div {...anim(3)}>
        <h3 className="text-[11px] font-bold text-[#111111] uppercase tracking-wider mb-3">
          3 scénarios de retour sur investissement
        </h3>
        <div className="space-y-2">
          <BarScenario label="Conservateur (3F/sem)" value={rapport.kpi.ca_mensuel_conservateur} maxValue={rapport.kpi.ca_mensuel_optimiste} remboursementJours={Math.ceil(prixFormation / rapport.kpi.ca_mensuel_conservateur * 30)} variant="conservateur" />
          <BarScenario label="Mixte 3F+2H" value={rapport.kpi.ca_mensuel_mixte} maxValue={rapport.kpi.ca_mensuel_optimiste} remboursementJours={rapport.kpi.remboursement_jours} variant="mixte" highlight />
          <BarScenario label="Optimiste (4F+3H/sem)" value={rapport.kpi.ca_mensuel_optimiste} maxValue={rapport.kpi.ca_mensuel_optimiste} remboursementJours={Math.ceil(prixFormation / rapport.kpi.ca_mensuel_optimiste * 30)} variant="optimiste" />
        </div>
        <div className="mt-2 text-[10px] text-[#999999]">
          Base de calcul : 225€ moyen/séance · Formation {prixFormation.toLocaleString('fr-FR')}€ HT couverte à 100% OPCO EP
        </div>
      </motion.div>
    </div>
  )
}
