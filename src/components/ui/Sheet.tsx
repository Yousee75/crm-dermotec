'use client'

import { useEffect, useRef, useCallback } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SheetProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  side?: 'right' | 'left'
  className?: string
  width?: string
}

function Sheet({ open, onClose, children, side = 'right', className, width = 'w-[480px] sm:w-[560px]' }: SheetProps) {
  const overlayRef = useRef<HTMLDivElement>(null)

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
  }, [onClose])

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, handleKeyDown])

  if (!open) return null

  return (
    <>
      <div
        ref={overlayRef}
        className="overlay-backdrop"
        onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
      />
      <div
        className={cn(
          'fixed top-0 bottom-0 z-51 bg-white shadow-xl flex flex-col',
          'max-w-[calc(100vw-3rem)]',
          width,
          side === 'right'
            ? 'right-0 sheet-content-right'
            : 'left-0',
          className
        )}
      >
        {children}
      </div>
    </>
  )
}

function SheetHeader({ children, onClose, className }: { children: React.ReactNode; onClose?: () => void; className?: string }) {
  return (
    <div className={cn('flex items-start justify-between p-6 border-b border-[#F0F0F0]', className)}>
      <div>{children}</div>
      {onClose && (
        <button
          onClick={onClose}
          className="p-1.5 -m-1.5 rounded-lg hover:bg-[#F5F5F5] text-[#999999] hover:text-[#777777] transition"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}

function SheetTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h2 className={cn('text-lg font-semibold text-accent', className)}>
      {children}
    </h2>
  )
}

function SheetBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex-1 overflow-y-auto p-6', className)}>
      {children}
    </div>
  )
}

function SheetFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-center justify-end gap-2 p-6 border-t border-[#F0F0F0]', className)}>
      {children}
    </div>
  )
}

export { Sheet, SheetHeader, SheetTitle, SheetBody, SheetFooter }
