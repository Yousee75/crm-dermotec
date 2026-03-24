'use client'

import { useState, useRef } from 'react'
import { cn } from '@/lib/utils'

interface TooltipProps {
  content: React.ReactNode
  children: React.ReactNode
  side?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
  delay?: number
}

function Tooltip({ content, children, side = 'top', className, delay = 200 }: TooltipProps) {
  const [visible, setVisible] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const show = () => {
    timeoutRef.current = setTimeout(() => setVisible(true), delay)
  }

  const hide = () => {
    clearTimeout(timeoutRef.current)
    setVisible(false)
  }

  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }

  return (
    <div className="relative inline-flex" onMouseEnter={show} onMouseLeave={hide}>
      {children}
      {visible && (
        <div
          className={cn(
            'absolute z-50 px-2.5 py-1.5 text-xs font-medium text-white bg-[#111111] rounded-lg',
            'whitespace-nowrap animate-scaleIn pointer-events-none',
            'shadow-lg',
            positions[side],
            className
          )}
        >
          {content}
          <span className={cn(
            'absolute w-2 h-2 bg-[#111111] rotate-45',
            side === 'top' && 'top-full left-1/2 -translate-x-1/2 -mt-1',
            side === 'bottom' && 'bottom-full left-1/2 -translate-x-1/2 -mb-1',
            side === 'left' && 'left-full top-1/2 -translate-y-1/2 -ml-1',
            side === 'right' && 'right-full top-1/2 -translate-y-1/2 -mr-1',
          )} />
        </div>
      )}
    </div>
  )
}

export { Tooltip }
