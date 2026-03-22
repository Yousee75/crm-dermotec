'use client'

import { useRef, useState } from 'react'
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Phone, Mail, MessageCircle } from 'lucide-react'

// Types pour les actions de swipe
interface SwipeAction {
  key: string
  label: string
  icon: React.ReactNode
  color: 'primary' | 'success' | 'action' | 'error'
  onClick: () => void
}

interface SwipeableRowProps {
  children: React.ReactNode
  leftActions?: SwipeAction[]
  rightActions?: SwipeAction[]
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  className?: string
  disabled?: boolean
}

// Actions par défaut pour les leads
const defaultLeftActions: SwipeAction[] = [
  {
    key: 'call',
    label: 'Appeler',
    icon: <Phone size={18} />,
    color: 'success',
    onClick: () => console.log('Call action')
  },
  {
    key: 'email',
    label: 'Email',
    icon: <Mail size={18} />,
    color: 'action',
    onClick: () => console.log('Email action')
  },
  {
    key: 'whatsapp',
    label: 'WhatsApp',
    icon: <MessageCircle size={18} />,
    color: 'success',
    onClick: () => console.log('WhatsApp action')
  }
]

const colorStyles = {
  primary: 'bg-[var(--color-primary)] text-white',
  success: 'bg-[var(--color-success)] text-white',
  action: 'bg-[var(--color-action)] text-white',
  error: 'bg-[var(--color-error)] text-white'
}

const SWIPE_THRESHOLD = 80
const ACTION_WIDTH = 64

export function SwipeableRow({
  children,
  leftActions = defaultLeftActions,
  rightActions = [],
  onSwipeLeft,
  onSwipeRight,
  className,
  disabled = false
}: SwipeableRowProps) {
  const [isRevealed, setIsRevealed] = useState<'left' | 'right' | null>(null)
  const constraintsRef = useRef(null)
  const x = useMotionValue(0)

  // Transformations pour révéler les actions progressivement
  const leftOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1])
  const rightOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0])

  // Animation de snap back
  const snapBack = () => {
    setIsRevealed(null)
    x.set(0)
  }

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const { offset } = info

    if (Math.abs(offset.x) < SWIPE_THRESHOLD) {
      // Swipe insuffisant - retour
      snapBack()
      return
    }

    if (offset.x > SWIPE_THRESHOLD && leftActions.length > 0) {
      // Swipe gauche - révéler actions gauches
      setIsRevealed('left')
      x.set(leftActions.length * ACTION_WIDTH)
      onSwipeLeft?.()
    } else if (offset.x < -SWIPE_THRESHOLD && rightActions.length > 0) {
      // Swipe droite - révéler actions droites
      setIsRevealed('right')
      x.set(-rightActions.length * ACTION_WIDTH)
      onSwipeRight?.()
    } else {
      snapBack()
    }
  }

  const handleActionClick = (action: SwipeAction) => {
    action.onClick()
    snapBack()
  }

  // Desktop uniquement - pas d'interaction swipe
  if (typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches) {
    return (
      <div className={cn('relative', className)}>
        {children}
      </div>
    )
  }

  return (
    <div className={cn('relative overflow-hidden', className)} ref={constraintsRef}>
      {/* Actions gauches (révélées par swipe vers la droite) */}
      {leftActions.length > 0 && (
        <motion.div
          className="absolute left-0 top-0 bottom-0 flex"
          style={{ opacity: leftOpacity }}
          initial={{ x: -leftActions.length * ACTION_WIDTH }}
          animate={{
            x: isRevealed === 'left' ? 0 : -leftActions.length * ACTION_WIDTH
          }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        >
          {leftActions.map((action, index) => (
            <motion.button
              key={action.key}
              className={cn(
                'flex flex-col items-center justify-center min-h-[60px] touch-target',
                colorStyles[action.color]
              )}
              style={{ width: ACTION_WIDTH }}
              onClick={() => handleActionClick(action)}
              initial={{ scale: 0.8 }}
              animate={{ scale: isRevealed === 'left' ? 1 : 0.8 }}
              transition={{ delay: index * 0.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="mb-1">{action.icon}</div>
              <span className="text-xs font-medium leading-none">{action.label}</span>
            </motion.button>
          ))}
        </motion.div>
      )}

      {/* Actions droites (révélées par swipe vers la gauche) */}
      {rightActions.length > 0 && (
        <motion.div
          className="absolute right-0 top-0 bottom-0 flex"
          style={{ opacity: rightOpacity }}
          initial={{ x: rightActions.length * ACTION_WIDTH }}
          animate={{
            x: isRevealed === 'right' ? 0 : rightActions.length * ACTION_WIDTH
          }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        >
          {rightActions.map((action, index) => (
            <motion.button
              key={action.key}
              className={cn(
                'flex flex-col items-center justify-center min-h-[60px] touch-target',
                colorStyles[action.color]
              )}
              style={{ width: ACTION_WIDTH }}
              onClick={() => handleActionClick(action)}
              initial={{ scale: 0.8 }}
              animate={{ scale: isRevealed === 'right' ? 1 : 0.8 }}
              transition={{ delay: index * 0.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="mb-1">{action.icon}</div>
              <span className="text-xs font-medium leading-none">{action.label}</span>
            </motion.button>
          ))}
        </motion.div>
      )}

      {/* Contenu principal draggable */}
      <motion.div
        style={{ x }}
        drag={disabled ? false : 'x'}
        dragConstraints={constraintsRef}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        dragMomentum={false}
        whileTap={{ scale: 0.99 }}
        transition={{ type: 'spring', damping: 25, stiffness: 400 }}
        className="relative bg-white touch-action-pan-y"
      >
        {children}
      </motion.div>

      {/* Overlay pour fermer au tap quand révélé */}
      {isRevealed && (
        <motion.div
          className="absolute inset-0 z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={snapBack}
          style={{
            background: 'rgba(0, 0, 0, 0.1)',
            pointerEvents: 'auto'
          }}
        />
      )}
    </div>
  )
}

// Hook helper pour créer des actions personnalisées
export function useSwipeActions() {
  const createAction = (
    key: string,
    label: string,
    icon: React.ReactNode,
    color: SwipeAction['color'],
    onClick: () => void
  ): SwipeAction => ({
    key,
    label,
    icon,
    color,
    onClick
  })

  return { createAction }
}