'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Play, Pause, RotateCcw } from 'lucide-react'

const PRESETS = [
  { label: 'Pomodoro', minutes: 25, color: '#EF4444' },
  { label: 'Pause courte', minutes: 5, color: '#22C55E' },
  { label: 'Pause longue', minutes: 15, color: '#3B82F6' },
  { label: 'Appel commercial', minutes: 10, color: '#F59E0B' },
]

export function PomodoroTimer() {
  const [preset, setPreset] = useState(0)
  const [seconds, setSeconds] = useState(PRESETS[0].minutes * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [completed, setCompleted] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const totalSeconds = PRESETS[preset].minutes * 60
  const progress = ((totalSeconds - seconds) / totalSeconds) * 100
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60

  useEffect(() => {
    if (isRunning && seconds > 0) {
      intervalRef.current = setInterval(() => {
        setSeconds(prev => {
          if (prev <= 1) {
            setIsRunning(false)
            setCompleted(c => c + 1)
            // Notification sonore
            try { new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAABAAQACAABAAAAwAAAA').play() } catch {}
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [isRunning, seconds])

  const selectPreset = useCallback((idx: number) => {
    setPreset(idx)
    setSeconds(PRESETS[idx].minutes * 60)
    setIsRunning(false)
  }, [])

  const reset = useCallback(() => {
    setSeconds(PRESETS[preset].minutes * 60)
    setIsRunning(false)
  }, [preset])

  const currentColor = PRESETS[preset].color

  return (
    <div className="space-y-4 text-center">
      {/* Presets */}
      <div className="flex gap-2 justify-center flex-wrap">
        {PRESETS.map((p, i) => (
          <button
            key={p.label}
            onClick={() => selectPreset(i)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              preset === i ? 'text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            style={preset === i ? { backgroundColor: p.color } : undefined}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Timer circular */}
      <div className="relative w-48 h-48 mx-auto">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="#E5E7EB" strokeWidth="6" />
          <circle
            cx="50" cy="50" r="45" fill="none"
            stroke={currentColor} strokeWidth="6" strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 45}`}
            strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold font-mono text-[#082545]">
            {String(minutes).padStart(2, '0')}:{String(secs).padStart(2, '0')}
          </span>
          <span className="text-xs text-gray-400 mt-1">{PRESETS[preset].label}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={reset}
          className="p-3 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
        >
          <RotateCcw size={18} className="text-gray-500" />
        </button>
        <button
          onClick={() => setIsRunning(!isRunning)}
          className="p-4 rounded-full text-white transition-colors"
          style={{ backgroundColor: currentColor }}
        >
          {isRunning ? <Pause size={24} /> : <Play size={24} />}
        </button>
      </div>

      {/* Counter */}
      {completed > 0 && (
        <p className="text-xs text-gray-400">{completed} session{completed > 1 ? 's' : ''} terminée{completed > 1 ? 's' : ''}</p>
      )}
    </div>
  )
}
