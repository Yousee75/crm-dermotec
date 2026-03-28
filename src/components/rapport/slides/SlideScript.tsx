'use client'

import { motion } from 'framer-motion'
import { FlashBox } from '../FlashBox'
import { ScriptCard } from '../ScriptCard'
import { ObjectionCard } from '../ObjectionCard'
import { VocabTable } from '../VocabTable'
import type { ProspectData, RapportSatorea } from '@/lib/rapport/types'

interface SlideScriptProps {
  prospect: ProspectData
  rapport: RapportSatorea
}

const anim = (i: number) => ({
  initial: { opacity: 0, y: 20 } as const,
  whileInView: { opacity: 1, y: 0 } as const,
  transition: { delay: i * 0.1, duration: 0.4, ease: 'easeOut' as const },
  viewport: { once: true } as const,
})

export function SlideScript({ prospect, rapport }: SlideScriptProps) {
  return (
    <div className="h-full flex flex-col px-6 md:px-12 py-8 max-w-4xl mx-auto overflow-y-auto">
      <motion.h2 {...anim(0)} className="text-2xl font-bold text-[#111111] mb-4" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
        Guide de Vente
      </motion.h2>

      <motion.div {...anim(1)}>
        <FlashBox label="Avant d'appeler · rappel">
          {rapport.accroche}
        </FlashBox>
      </motion.div>

      <motion.div {...anim(2)} className="mt-4">
        <ScriptCard steps={rapport.script} prospectName={prospect.nom_dirigeant} />
      </motion.div>

      <motion.div {...anim(3)} className="mt-5">
        <h3 className="text-[11px] font-bold text-[#111111] uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="w-[3px] h-3.5 bg-[#FF2D78] rounded-sm" /> Objections
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {rapport.objections.map((obj, i) => (
            <ObjectionCard key={i} objection={obj} />
          ))}
        </div>
      </motion.div>

      <motion.div {...anim(4)} className="mt-5">
        <h3 className="text-[11px] font-bold text-[#111111] uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="w-[3px] h-3.5 bg-[#FF8C42] rounded-sm" /> Vocabulaire
        </h3>
        <VocabTable mots={rapport.mots_interdits} />
      </motion.div>
    </div>
  )
}
