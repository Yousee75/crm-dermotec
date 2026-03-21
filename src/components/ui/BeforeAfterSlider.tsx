'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { MoveHorizontal } from 'lucide-react'

interface BeforeAfterSliderProps {
  beforeImage: string
  afterImage: string
  beforeLabel?: string
  afterLabel?: string
  technique?: string
  formation?: string
  className?: string
}

export function BeforeAfterSlider({
  beforeImage,
  afterImage,
  beforeLabel = 'AVANT',
  afterLabel = 'APRÈS',
  technique,
  formation,
  className,
}: BeforeAfterSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50) // Percentage
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMove = useCallback(
    (clientX: number) => {
      if (!containerRef.current || !isDragging) return

      const rect = containerRef.current.getBoundingClientRect()
      const x = clientX - rect.left
      const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100))
      setSliderPosition(percentage)
    },
    [isDragging]
  )

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      handleMove(e.clientX)
    },
    [handleMove]
  )

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      e.preventDefault()
      handleMove(e.touches[0].clientX)
    },
    [handleMove]
  )

  const handleStart = useCallback(() => {
    setIsDragging(true)
  }, [])

  const handleEnd = useCallback(() => {
    setIsDragging(false)
  }, [])

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleEnd)
      document.addEventListener('touchmove', handleTouchMove, { passive: false })
      document.addEventListener('touchend', handleEnd)

      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleEnd)
        document.removeEventListener('touchmove', handleTouchMove)
        document.removeEventListener('touchend', handleEnd)
      }
    }
  }, [isDragging, handleMouseMove, handleTouchMove, handleEnd])

  const handleContainerClick = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100))
    setSliderPosition(percentage)
  }, [])

  return (
    <div className={cn('w-full max-w-2xl mx-auto', className)}>
      {/* Container principal */}
      <div
        ref={containerRef}
        className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-xl cursor-col-resize select-none"
        onClick={handleContainerClick}
      >
        {/* Image "après" (arrière-plan) */}
        <div className="absolute inset-0">
          <img
            src={afterImage}
            alt="Après"
            className="w-full h-full object-cover"
            draggable={false}
          />
        </div>

        {/* Image "avant" avec clip-path */}
        <div
          className="absolute inset-0 transition-all duration-75 ease-out"
          style={{
            clipPath: `polygon(0% 0%, ${sliderPosition}% 0%, ${sliderPosition}% 100%, 0% 100%)`,
          }}
        >
          <img
            src={beforeImage}
            alt="Avant"
            className="w-full h-full object-cover"
            draggable={false}
          />
        </div>

        {/* Labels */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Label AVANT */}
          <div className="absolute top-4 left-4">
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-white/90 text-[#082545] shadow-sm backdrop-blur-sm">
              {beforeLabel}
            </span>
          </div>

          {/* Label APRÈS */}
          <div className="absolute top-4 right-4">
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-white/90 text-[#082545] shadow-sm backdrop-blur-sm">
              {afterLabel}
            </span>
          </div>
        </div>

        {/* Ligne de séparation et handle */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg transition-all duration-75 ease-out"
          style={{ left: `${sliderPosition}%` }}
        >
          {/* Handle central */}
          <div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg cursor-col-resize flex items-center justify-center hover:scale-110 transition-transform duration-200"
            onMouseDown={handleStart}
            onTouchStart={handleStart}
          >
            <MoveHorizontal className="w-4 h-4 text-[#2EC6F3]" />
          </div>
        </div>

        {/* Overlay gradient pour améliorer la lisibilité */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10 pointer-events-none" />
      </div>

      {/* Caption en bas */}
      {(technique || formation) && (
        <div className="mt-4 text-center">
          {technique && (
            <h3 className="text-lg font-semibold text-[#082545] mb-1">
              {technique}
            </h3>
          )}
          {formation && (
            <p className="text-sm text-gray-600">
              Formation : <span className="text-[#2EC6F3] font-medium">{formation}</span>
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default BeforeAfterSlider