'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'

interface SnapPoint {
  key: string
  height: number // en vh
  label?: string
}

interface MobileBottomSheetProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  snapPoints?: SnapPoint[]
  initialSnapPoint?: string
  className?: string
  showCloseButton?: boolean
  backdrop?: boolean
}

// Snap points par défaut
const defaultSnapPoints: SnapPoint[] = [
  { key: 'closed', height: 0, label: 'Fermé' },
  { key: 'half', height: 50, label: 'Mi-hauteur' },
  { key: 'full', height: 90, label: 'Plein écran' }
]

export function MobileBottomSheet({
  isOpen,
  onClose,
  title,
  children,
  snapPoints = defaultSnapPoints,
  initialSnapPoint = 'half',
  className,
  showCloseButton = true,
  backdrop = true
}: MobileBottomSheetProps) {
  const [currentSnapPoint, setCurrentSnapPoint] = useState(initialSnapPoint)
  const sheetRef = useRef<HTMLDivElement>(null)
  const y = useMotionValue(0)

  // Trouver le snap point actuel
  const currentSnap = snapPoints.find(s => s.key === currentSnapPoint) || snapPoints[1]
  const currentHeight = currentSnap.height

  // Transformations pour le backdrop
  const backdropOpacity = useTransform(
    y,
    [0, window?.innerHeight || 800],
    [0.5, 0]
  )

  // Fonction pour aller au snap point
  const goToSnapPoint = (snapKey: string) => {
    const snap = snapPoints.find(s => s.key === snapKey)
    if (!snap) return

    setCurrentSnapPoint(snapKey)
    y.set(0) // Reset position relative
  }

  // Gestion du drag
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const { offset, velocity } = info
    const dragThreshold = 100 // distance minimum pour changer de snap point
    const velocityThreshold = 500 // vélocité pour snap immédiat

    // Si on tire vers le bas avec force, fermer
    if (offset.y > dragThreshold || velocity.y > velocityThreshold) {
      if (currentSnapPoint === 'half') {
        onClose()
        return
      } else if (currentSnapPoint === 'full') {
        goToSnapPoint('half')
        return
      }
    }

    // Si on tire vers le haut avec force, maximiser
    if (offset.y < -dragThreshold || velocity.y < -velocityThreshold) {
      if (currentSnapPoint === 'half') {
        goToSnapPoint('full')
        return
      }
    }

    // Sinon, retour au snap point actuel
    y.set(0)
  }

  // Fermer avec Escape
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeydown)
      // Empêcher le scroll du body
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleKeydown)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  // Animation d'entrée/sortie
  useEffect(() => {
    if (isOpen) {
      goToSnapPoint(initialSnapPoint)
    }
  }, [isOpen, initialSnapPoint])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      {backdrop && (
        <motion.div
          className="absolute inset-0"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            opacity: backdropOpacity
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          transition={{ duration: 0.2 }}
        />
      )}

      {/* Sheet */}
      <motion.div
        ref={sheetRef}
        className={cn(
          'fixed bottom-0 left-0 right-0 bg-white',
          'rounded-t-2xl shadow-xl',
          'flex flex-col overflow-hidden',
          'safe-area-bottom',
          className
        )}
        style={{ y }}
        initial={{ y: '100%' }}
        animate={{
          y: 0,
          height: `${currentHeight}vh`
        }}
        exit={{ y: '100%' }}
        transition={{
          type: 'spring',
          damping: 25,
          stiffness: 400,
          mass: 0.8
        }}
        drag="y"
        dragConstraints={{ top: -200, bottom: 200 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        dragMomentum={false}
      >
        {/* Drag handle */}
        <div className="flex-shrink-0 flex justify-center py-3">
          <div className="w-10 h-1 bg-[#EEEEEE] rounded-full" />
        </div>

        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex-shrink-0 flex items-center justify-between px-6 pb-4 border-b border-[#F4F0EB]">
            <h2 className="text-lg font-semibold text-[var(--color-text)]">
              {title}
            </h2>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-[#F4F0EB] transition-colors touch-target"
              >
                <X size={20} className="text-[#777777]" />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto modal-scroll px-6 py-4">
          {children}
        </div>

        {/* Snap points indicator (optionnel) */}
        {snapPoints.length > 2 && (
          <div className="flex-shrink-0 flex justify-center space-x-2 py-3 border-t border-[#F4F0EB]">
            {snapPoints
              .filter(s => s.key !== 'closed')
              .map((snap) => (
                <button
                  key={snap.key}
                  onClick={() => goToSnapPoint(snap.key)}
                  className={cn(
                    'w-2 h-2 rounded-full transition-all',
                    currentSnapPoint === snap.key
                      ? 'bg-[var(--color-primary)] w-4'
                      : 'bg-[#EEEEEE]'
                  )}
                />
              ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}

// Hook helper pour contrôler le bottom sheet
export function useBottomSheet() {
  const [isOpen, setIsOpen] = useState(false)
  const [snapPoint, setSnapPoint] = useState('half')

  const open = (initialSnap = 'half') => {
    setSnapPoint(initialSnap)
    setIsOpen(true)
  }

  const close = () => {
    setIsOpen(false)
  }

  const toggle = () => {
    setIsOpen(!isOpen)
  }

  return {
    isOpen,
    snapPoint,
    open,
    close,
    toggle,
    setSnapPoint
  }
}

// Composant wrapper pour les formulaires dans le bottom sheet
interface BottomSheetFormProps {
  title: string
  isOpen: boolean
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
  children: React.ReactNode
  submitLabel?: string
  isLoading?: boolean
}

export function BottomSheetForm({
  title,
  isOpen,
  onClose,
  onSubmit,
  children,
  submitLabel = 'Valider',
  isLoading = false
}: BottomSheetFormProps) {
  return (
    <MobileBottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      snapPoints={[
        { key: 'closed', height: 0 },
        { key: 'form', height: 75 }
      ]}
      initialSnapPoint="form"
    >
      <form onSubmit={onSubmit} className="flex flex-col h-full">
        <div className="flex-1 space-y-4">
          {children}
        </div>

        {/* Actions */}
        <div className="flex space-x-3 pt-6 border-t border-[#F4F0EB] mt-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 text-sm font-medium text-[#3A3A3A] bg-[#F4F0EB] rounded-xl hover:bg-[#EEEEEE] transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className={cn(
              'flex-1 px-4 py-3 text-sm font-medium text-white rounded-xl transition-colors',
              'bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)]',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {isLoading ? 'En cours...' : submitLabel}
          </button>
        </div>
      </form>
    </MobileBottomSheet>
  )
}