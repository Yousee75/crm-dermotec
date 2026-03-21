'use client'

// ============================================================
// CRM DERMOTEC — Tracking Debugger
// Composant de debug pour vérifier le bon fonctionnement
// À utiliser uniquement en développement
// ============================================================

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useTrack } from '@/hooks/use-tracker'
import { tracker, trackingHelpers } from '@/lib/user-tracker'
import { Bug, Zap, Play, Eye, AlertTriangle } from 'lucide-react'

export function TrackingDebugger() {
  const [events, setEvents] = useState<any[]>([])
  const [isVisible, setIsVisible] = useState(false)
  const { track } = useTrack()
  const isActive = true // useTrackingStatus not exported from use-tracker

  // Intercepter les events pour debug (monkey patch)
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return

    const originalTrack = tracker.track.bind(tracker)
    tracker.track = function(event, metadata) {
      // Log l'événement pour debug
      const debugEvent = {
        timestamp: new Date().toISOString(),
        event,
        metadata: metadata || {},
        page: window.location.pathname
      }
      setEvents(prev => [debugEvent, ...prev.slice(0, 19)]) // Keep last 20

      // Appeler la fonction originale
      return originalTrack(event, metadata)
    }

    return () => {
      // Restore original (cleanup)
      tracker.track = originalTrack
    }
  }, [])

  if (process.env.NODE_ENV !== 'development') {
    return null // Ne pas afficher en production
  }

  return (
    <>
      {/* Toggle button */}
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsVisible(!isVisible)}
          size="sm"
          variant="outline"
          className="bg-purple-600 text-white border-purple-600 hover:bg-purple-700"
        >
          <Bug className="h-4 w-4" />
          Tracking Debug
        </Button>
      </div>

      {/* Debug panel */}
      {isVisible && (
        <div className="fixed bottom-16 right-4 w-96 z-50">
          <Card className="p-4 bg-white shadow-lg border-purple-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm">Tracking Debugger</h3>
              <div className="flex items-center gap-2">
                <Badge variant={isActive ? 'primary' : 'error'}>
                  {isActive ? 'Actif' : 'Inactif'}
                </Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsVisible(false)}
                  className="h-6 w-6 p-0"
                >
                  ×
                </Button>
              </div>
            </div>

            {/* Test buttons */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <Button
                size="sm"
                onClick={() => track('click', { test: 'manual_click' })}
                className="text-xs"
              >
                <Zap className="h-3 w-3 mr-1" />
                Test Click
              </Button>

              <Button
                size="sm"
                onClick={() => trackingHelpers.leadView('test-lead-123')}
                className="text-xs"
              >
                <Eye className="h-3 w-3 mr-1" />
                Test Lead View
              </Button>

              <Button
                size="sm"
                onClick={() => trackingHelpers.export('csv', 'leads', 42)}
                className="text-xs"
              >
                <Play className="h-3 w-3 mr-1" />
                Test Export
              </Button>

              <Button
                size="sm"
                onClick={() => track('ai_used', { feature: 'test_ai' })}
                className="text-xs"
              >
                <AlertTriangle className="h-3 w-3 mr-1" />
                Test AI
              </Button>
            </div>

            {/* Events log */}
            <div className="border-t pt-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium">Derniers événements</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEvents([])}
                  className="text-xs h-6 px-2"
                >
                  Clear
                </Button>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-1">
                {events.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">Aucun événement tracké</p>
                ) : (
                  events.map((event, i) => (
                    <div key={i} className="bg-slate-50 p-2 rounded text-xs">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">
                          {event.event}
                        </Badge>
                        <span className="text-slate-500">
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      {event.metadata && Object.keys(event.metadata).length > 0 && (
                        <pre className="text-xs text-slate-600 mt-1 whitespace-pre-wrap">
                          {JSON.stringify(event.metadata, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Status info */}
            <div className="border-t pt-3 mt-3 text-xs text-slate-600">
              <p><strong>Page:</strong> {typeof window !== 'undefined' ? window.location.pathname : 'N/A'}</p>
              <p><strong>Buffer:</strong> {(tracker as any).buffer?.length || 0} événements</p>
              <p><strong>User ID:</strong> {(tracker as any).userId?.slice(0, 8) || 'Non connecté'}...</p>
            </div>
          </Card>
        </div>
      )}
    </>
  )
}

// Hook pour afficher le debugger conditionellement
export function useTrackingDebugger() {
  if (process.env.NODE_ENV === 'development') {
    return TrackingDebugger
  }
  return () => null
}