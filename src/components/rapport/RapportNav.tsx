'use client'

import { cn } from '@/lib/utils'

interface RapportNavProps {
  slides: { id: string; label: string }[]
  currentIndex: number
  onNavigate: (index: number) => void
}

export function RapportNav({ slides, currentIndex, onNavigate }: RapportNavProps) {
  return (
    <nav className="flex flex-col gap-3" aria-label="Navigation slides">
      {slides.map((slide, i) => (
        <button
          key={slide.id}
          onClick={() => onNavigate(i)}
          aria-label={`Aller à ${slide.label}`}
          aria-current={i === currentIndex ? 'step' : undefined}
          className="flex items-center gap-2 group min-w-[44px] min-h-[44px] justify-start"
        >
          {/* Dot */}
          <span className={cn(
            'block rounded-full transition-all duration-300',
            i === currentIndex
              ? 'w-3 h-3 bg-[#FF5C00] scale-110'
              : 'w-2 h-2 bg-white/30 group-hover:bg-[#FF5C00]/60'
          )} />
          {/* Label (visible seulement en hover ou actif) */}
          <span className={cn(
            'text-[10px] transition-all duration-200 whitespace-nowrap',
            i === currentIndex
              ? 'text-[#FF5C00] font-bold opacity-100'
              : 'text-white/40 opacity-0 group-hover:opacity-100'
          )}>
            {i + 1}. {slide.label}
          </span>
        </button>
      ))}
    </nav>
  )
}
