'use client'

import { useState, useEffect, useCallback } from 'react'
import { Trash2, Clock } from 'lucide-react'

export function QuickNotes() {
  const [notes, setNotes] = useState<string>('')
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  // Charger les notes au montage
  useEffect(() => {
    const saved = localStorage.getItem('dermotec_quick_notes')
    if (saved) {
      setNotes(saved)
    }
    const savedTime = localStorage.getItem('dermotec_quick_notes_timestamp')
    if (savedTime) {
      setLastSaved(new Date(savedTime))
    }
  }, [])

  // Auto-save avec debounce
  useEffect(() => {
    if (notes.length === 0) return

    const timer = setTimeout(() => {
      localStorage.setItem('dermotec_quick_notes', notes)
      const now = new Date()
      localStorage.setItem('dermotec_quick_notes_timestamp', now.toISOString())
      setLastSaved(now)
    }, 500)

    return () => clearTimeout(timer)
  }, [notes])

  const handleNotesChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value)
  }, [])

  const clearNotes = useCallback(() => {
    setNotes('')
    localStorage.removeItem('dermotec_quick_notes')
    localStorage.removeItem('dermotec_quick_notes_timestamp')
    setLastSaved(null)
    setShowClearConfirm(false)
  }, [])

  const formatTime = useCallback((date: Date) => {
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }, [])

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Notes rapides</h3>
        <button
          onClick={() => setShowClearConfirm(true)}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
          disabled={notes.length === 0}
        >
          <Trash2 className="w-4 h-4" />
          Vider
        </button>
      </div>

      {/* Textarea */}
      <textarea
        value={notes}
        onChange={handleNotesChange}
        placeholder="Prenez vos notes ici... (sauvegarde automatique)"
        className="w-full h-80 p-4 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-[#2EC6F3] focus:border-transparent"
      />

      {/* Footer Info */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>
          {notes.length} caractère{notes.length !== 1 ? 's' : ''}
        </span>
        {lastSaved && (
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>
              Dernière sauvegarde : {formatTime(lastSaved)}
            </span>
          </div>
        )}
      </div>

      {/* Clear Confirmation */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              Vider les notes ?
            </h4>
            <p className="text-gray-600 mb-4">
              Cette action est irréversible. Toutes vos notes seront supprimées.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={clearNotes}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-md transition-colors"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}