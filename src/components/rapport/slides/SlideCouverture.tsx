'use client'

import { motion } from 'framer-motion'
import { Star, Users, Calendar, Wallet } from 'lucide-react'
import { KpiCard } from '../KpiCard'
import { FlashBox } from '../FlashBox'
import type { ProspectData, RapportSatorea } from '@/lib/rapport/types'

interface SlideCouvertureProps {
  prospect: ProspectData
  rapport: RapportSatorea
}

const anim = (i: number) => ({
  initial: { opacity: 0, y: 30 } as const,
  whileInView: { opacity: 1, y: 0 } as const,
  transition: { delay: i * 0.12, duration: 0.5, ease: 'easeOut' as const },
  viewport: { once: true } as const,
})

export function SlideCouverture({ prospect, rapport }: SlideCouvertureProps) {
  const classColor = rapport.classification === 'CHAUD' ? '#10B981' : rapport.classification === 'TIEDE' ? '#FF8C42' : '#FF2D78'

  return (
    <div className="h-full flex flex-col justify-center px-6 md:px-12 py-8 max-w-4xl mx-auto">
      {/* Badge classification */}
      <motion.div {...anim(0)}>
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[12px] font-extrabold uppercase tracking-[0.04em] text-white mb-4"
          style={{
            background: `linear-gradient(135deg, ${classColor}, ${classColor}CC)`,
            boxShadow: `0 4px 16px ${classColor}40`,
            animation: rapport.classification === 'CHAUD' ? 'glowHot 2.5s ease-in-out 3' : undefined,
          }}
        >
          {rapport.classification === 'CHAUD' ? '🔥' : rapport.classification === 'TIEDE' ? '☀️' : '❄️'} {rapport.classification}
        </div>
      </motion.div>

      {/* Nom + Salon */}
      <motion.div {...anim(1)}>
        <h1 className="text-3xl md:text-4xl font-extrabold text-[#111111] tracking-tight leading-tight" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
          {prospect.nom_dirigeant}
        </h1>
        <div className="text-[15px] text-[#777777] mt-1">
          {prospect.nom_salon} — {prospect.adresse ? `${prospect.adresse}, ` : ''}{prospect.code_postal} {prospect.ville}
        </div>
      </motion.div>

      {/* Badges awards */}
      {(prospect.reputation.awards.length > 0 || prospect.mixte) && (
        <motion.div {...anim(2)} className="flex flex-wrap gap-2 mt-3">
          {prospect.reputation.awards.map((award, i) => (
            <span key={i} className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#FFE0EF] text-[#FF2D78] border border-[#FF2D78]/20">
              🏆 {award}
            </span>
          ))}
          {prospect.mixte && (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#FFF0E5] text-[#FF5C00] border border-[#FF5C00]/20">
              ♂♀ Institut Mixte H+F
            </span>
          )}
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#ECFDF5] text-[#10B981] border border-[#10B981]/20">
            📅 {rapport.kpi.anciennete_ans} ans d'ancienneté
          </span>
        </motion.div>
      )}

      {/* Flash box accroche */}
      <motion.div {...anim(3)} className="mt-5">
        <FlashBox label="L'essentiel en 10 secondes">
          {rapport.analyse_reputation} &middot;{' '}
          <strong>{rapport.kpi.ca_mensuel_mixte.toLocaleString('fr-FR')}€/mois</strong> potentiel &middot;{' '}
          <strong>0€</strong> formation (OPCO)
        </FlashBox>
      </motion.div>

      {/* KPIs */}
      <motion.div {...anim(4)} className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
        <KpiCard icon={Star} value={prospect.reputation.note_globale * 10} suffix="/50" label="Note globale" sublabel={`${prospect.reputation.nb_avis_total} avis`} color="success" />
        <KpiCard icon={Users} value={prospect.reputation.nb_avis_total} label="Avis total" sublabel="Toutes plateformes" color="primary" />
        <KpiCard icon={Calendar} value={rapport.kpi.anciennete_ans} suffix=" ans" label="Ancienneté" sublabel={`Depuis ${prospect.finances.annee_creation}`} color="rose" />
        <KpiCard icon={Wallet} value={0} prefix="" suffix=" €" label="Formation" sublabel="OPCO EP · 100% couvert" color="success" />
      </motion.div>

      {/* Téléphone click-to-call */}
      {prospect.telephone_mobile && (
        <motion.div {...anim(5)} className="mt-5 text-center">
          <span className="text-[12px] text-[#777777]">Mobile prioritaire :</span>
          <a
            href={`tel:${prospect.telephone_mobile.replace(/\s/g, '')}`}
            className="block text-2xl font-bold font-mono text-[#FF5C00] hover:text-[#E65200] transition mt-0.5"
          >
            📞 {prospect.telephone_mobile}
          </a>
        </motion.div>
      )}
    </div>
  )
}
