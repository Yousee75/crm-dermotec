'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { RapportSidebar } from './RapportSidebar'
import { SlideCouverture } from './slides/SlideCouverture'
import { SlideProfil } from './slides/SlideProfil'
import { SlideROI } from './slides/SlideROI'
import { SlideScript } from './slides/SlideScript'
import { SlidePlanAction } from './slides/SlidePlanAction'
import type { ProspectData, RapportSatorea } from '@/lib/rapport/types'

interface RapportViewerProps {
  prospect: ProspectData
  rapport: RapportSatorea
}

export function RapportViewer({ prospect, rapport }: RapportViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [currentSlide, setCurrentSlide] = useState(0)

  const slides = [
    <SlideCouverture key="couverture" prospect={prospect} rapport={rapport} />,
    <SlideProfil key="profil" prospect={prospect} rapport={rapport} />,
    <SlideROI key="roi" prospect={prospect} rapport={rapport} />,
    <SlideScript key="script" prospect={prospect} rapport={rapport} />,
    <SlidePlanAction key="action" prospect={prospect} rapport={rapport} />,
  ]

  // Navigation vers un slide
  const goToSlide = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(index, slides.length - 1))
    const container = containerRef.current
    if (!container) return
    const slideHeight = container.clientHeight
    container.scrollTo({ top: clamped * slideHeight, behavior: 'smooth' })
  }, [slides.length])

  // Tracking du slide actif via IntersectionObserver
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute('data-slide-index'))
            if (!isNaN(index)) setCurrentSlide(index)
          }
        })
      },
      { root: container, threshold: 0.5 }
    )

    container.querySelectorAll('[data-slide-index]').forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  // Raccourcis clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
        case 'ArrowRight':
          e.preventDefault()
          goToSlide(currentSlide + 1)
          break
        case 'ArrowUp':
        case 'ArrowLeft':
          e.preventDefault()
          goToSlide(currentSlide - 1)
          break
        default:
          if (e.key >= '1' && e.key <= '5') {
            e.preventDefault()
            goToSlide(parseInt(e.key) - 1)
          }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentSlide, goToSlide])

  // Re-snap on resize
  useEffect(() => {
    const handleResize = () => goToSlide(currentSlide)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [currentSlide, goToSlide])

  return (
    <div className="flex h-dvh bg-[#FAF8F5] print:block print:h-auto">
      {/* Sidebar */}
      <RapportSidebar
        prospect={prospect}
        rapport={rapport}
        currentSlide={currentSlide}
        onNavigate={goToSlide}
      />

      {/* Scroll-snap container */}
      <div
        ref={containerRef}
        className="flex-1 h-dvh overflow-y-scroll snap-y snap-mandatory overscroll-contain print:h-auto print:overflow-visible print:snap-none"
        tabIndex={0}
      >
        {slides.map((slide, i) => (
          <section
            key={i}
            data-slide-index={i}
            className="h-dvh snap-start snap-always print:h-auto print:min-h-screen print:break-after-page"
          >
            {slide}
          </section>
        ))}
      </div>

      {/* Compteur slide (mobile-friendly) */}
      <div className="fixed bottom-4 right-4 text-[11px] text-[#999999] font-mono z-50 bg-white/80 backdrop-blur px-2 py-1 rounded-lg shadow-sm print:hidden">
        {currentSlide + 1} / {slides.length}
      </div>
    </div>
  )
}
