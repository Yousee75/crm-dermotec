'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/Button'

interface SignatureCanvasProps {
  onSignature: (dataUrl: string) => void
  width?: number
  height?: number
}

interface Point {
  x: number
  y: number
}

export function SignatureCanvas({
  onSignature,
  width = 400,
  height = 200
}: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [lastPoint, setLastPoint] = useState<Point | null>(null)
  const [hasSignature, setHasSignature] = useState(false)

  const getEventPoint = useCallback((event: MouseEvent | TouchEvent): Point => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()

    if ('touches' in event) {
      // Touch event
      const touch = event.touches[0] || event.changedTouches[0]
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      }
    } else {
      // Mouse event
      return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      }
    }
  }, [])

  const drawLine = useCallback((from: Point, to: Point) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.beginPath()
    ctx.moveTo(from.x, from.y)
    ctx.lineTo(to.x, to.y)
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke()
  }, [])

  const startDrawing = useCallback((event: MouseEvent | TouchEvent) => {
    event.preventDefault()
    const point = getEventPoint(event)
    setIsDrawing(true)
    setLastPoint(point)
    setHasSignature(true)
  }, [getEventPoint])

  const draw = useCallback((event: MouseEvent | TouchEvent) => {
    if (!isDrawing || !lastPoint) return
    event.preventDefault()

    const currentPoint = getEventPoint(event)
    drawLine(lastPoint, currentPoint)
    setLastPoint(currentPoint)
  }, [isDrawing, lastPoint, getEventPoint, drawLine])

  const stopDrawing = useCallback((event: MouseEvent | TouchEvent) => {
    event.preventDefault()
    setIsDrawing(false)
    setLastPoint(null)

    // Générer la signature en base64
    const canvas = canvasRef.current
    if (canvas && hasSignature) {
      const dataUrl = canvas.toDataURL('image/png')
      onSignature(dataUrl)
    }
  }, [hasSignature, onSignature])

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasSignature(false)
    setIsDrawing(false)
    setLastPoint(null)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Mouse events
    const handleMouseDown = (e: MouseEvent) => startDrawing(e)
    const handleMouseMove = (e: MouseEvent) => draw(e)
    const handleMouseUp = (e: MouseEvent) => stopDrawing(e)
    const handleMouseLeave = (e: MouseEvent) => stopDrawing(e)

    // Touch events
    const handleTouchStart = (e: TouchEvent) => startDrawing(e)
    const handleTouchMove = (e: TouchEvent) => draw(e)
    const handleTouchEnd = (e: TouchEvent) => stopDrawing(e)

    // Add event listeners
    canvas.addEventListener('mousedown', handleMouseDown)
    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('mouseup', handleMouseUp)
    canvas.addEventListener('mouseleave', handleMouseLeave)

    canvas.addEventListener('touchstart', handleTouchStart, { passive: false })
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false })
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false })

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown)
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('mouseup', handleMouseUp)
      canvas.removeEventListener('mouseleave', handleMouseLeave)

      canvas.removeEventListener('touchstart', handleTouchStart)
      canvas.removeEventListener('touchmove', handleTouchMove)
      canvas.removeEventListener('touchend', handleTouchEnd)
    }
  }, [startDrawing, draw, stopDrawing])

  // Set canvas size on mount
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Set actual canvas size for high DPI displays
    const rect = canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1

    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr

    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.scale(dpr, dpr)
    }
  }, [])

  return (
    <div className="space-y-4">
      <div
        className="border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-white"
        style={{ width: '100%', maxWidth: width }}
      >
        <canvas
          ref={canvasRef}
          className="block cursor-crosshair"
          style={{
            width: '100%',
            height: height,
            touchAction: 'none' // Prevent default touch behaviors
          }}
        />
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={clearCanvas}
          className="min-h-[44px] px-6"
        >
          Effacer
        </Button>

        {hasSignature && (
          <div className="text-sm text-green-600 flex items-center">
            ✓ Signature enregistrée
          </div>
        )}
      </div>
    </div>
  )
}