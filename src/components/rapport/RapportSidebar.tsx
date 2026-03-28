'use client'

import { cn } from '@/lib/utils'
import { ScoreRing } from './ScoreRing'
import { RapportNav } from './RapportNav'
import { Phone, Mail, Printer, Copy, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import type { ProspectData, RapportSatorea } from '@/lib/rapport/types'

interface RapportSidebarProps {
  prospect: ProspectData
  rapport: RapportSatorea
  currentSlide: number
  onNavigate: (index: number) => void
}

const SLIDES = [
  { id: 'couverture', label: 'Couverture' },
  { id: 'profil', label: 'Profil' },
  { id: 'roi', label: 'ROI' },
  { id: 'script', label: 'Script' },
  { id: 'action', label: 'Action' },
]

export function RapportSidebar({ prospect, rapport, currentSlide, onNavigate }: RapportSidebarProps) {
  return (
    <aside className="w-[280px] min-w-[280px] bg-[#111111] text-white flex flex-col h-dvh sticky top-0 overflow-y-auto print:hidden scrollbar-thin scrollbar-thumb-white/10">
      {/* Retour */}
      <div className="px-4 pt-4 pb-2">
        <Link href={`/lead/${prospect.id}`} className="flex items-center gap-1.5 text-[11px] text-white/40 hover:text-white/80 transition">
          <ArrowLeft className="w-3.5 h-3.5" /> Retour fiche lead
        </Link>
      </div>

      {/* Score Ring + Nom */}
      <div className="text-center px-4 py-4 border-b border-white/8">
        <ScoreRing value={rapport.score_chaleur} size={80} strokeWidth={5} />
        <div className="text-[15px] font-extrabold mt-3 tracking-tight">{prospect.nom_dirigeant}</div>
        <div className="text-[11px] text-white/40 mt-0.5">{prospect.nom_salon}</div>
        <div className="flex flex-wrap gap-1.5 justify-center mt-2.5">
          <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-white/6 border border-white/8 text-white/60">
            {prospect.finances.forme_juridique}
          </span>
          <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-white/6 border border-white/8 text-white/60">
            {prospect.ville}
          </span>
          {prospect.mixte && (
            <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-[#FF5C00]/15 border border-[#FF5C00]/20 text-[#FF8C42]">
              Mixte H+F
            </span>
          )}
        </div>
      </div>

      {/* Contact click-to-call */}
      <div className="px-4 py-3 border-b border-white/8">
        <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-white/30 mb-2">Contact</div>
        <div className="bg-gradient-to-br from-[#FF5C00]/12 to-[#FF5C00]/4 border border-[#FF5C00]/20 rounded-lg p-3">
          <div className="text-[14px] font-extrabold text-white">{prospect.nom_dirigeant}</div>
          <a
            href={`tel:${prospect.telephone_mobile.replace(/\s/g, '')}`}
            className="flex items-center gap-2 mt-2 pt-2 border-t border-white/6"
          >
            <div className="w-8 h-8 rounded-lg bg-[#FF5C00] flex items-center justify-center shrink-0">
              <Phone className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-mono text-[18px] font-bold text-[#FF8C42] tracking-wide">
              {prospect.telephone_mobile}
            </span>
          </a>
          {prospect.email && (
            <div className="text-[10px] text-white/40 mt-2 flex items-center gap-1">
              <Mail className="w-3 h-3" /> {prospect.email}
            </div>
          )}
        </div>
      </div>

      {/* Navigation dots */}
      <div className="px-4 py-4 border-b border-white/8 flex-1">
        <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-white/30 mb-3">Navigation</div>
        <RapportNav slides={SLIDES} currentIndex={currentSlide} onNavigate={onNavigate} />
      </div>

      {/* Actions */}
      <div className="px-4 py-3 border-t border-white/8 space-y-1.5">
        <a
          href={`tel:${prospect.telephone_mobile.replace(/\s/g, '')}`}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-[#FF5C00] text-white text-[11px] font-bold hover:bg-[#E65200] transition"
        >
          <Phone className="w-3.5 h-3.5" /> Appeler maintenant
        </a>
        <button
          onClick={() => window.print()}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-white/6 border border-white/8 text-white/70 text-[11px] font-medium hover:bg-white/12 transition"
        >
          <Printer className="w-3.5 h-3.5" /> Imprimer / PDF
        </button>
        <button
          onClick={() => {
            navigator.clipboard.writeText(`Briefing ${prospect.nom_dirigeant} — ${prospect.nom_salon}\n${rapport.accroche}`)
          }}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-white/6 border border-white/8 text-white/70 text-[11px] font-medium hover:bg-white/12 transition"
        >
          <Copy className="w-3.5 h-3.5" /> Copier le brief
        </button>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 text-center text-[8px] text-white/20 tracking-[0.05em]">
        SATOREA · {rapport.date_generation}
      </div>
    </aside>
  )
}
