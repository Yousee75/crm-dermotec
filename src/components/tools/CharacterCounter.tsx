'use client'

import { useState } from 'react'

export function CharacterCounter() {
  const [text, setText] = useState('')

  const chars = text.length
  const words = text.trim() ? text.trim().split(/\s+/).length : 0
  const lines = text ? text.split('\n').length : 0

  // SMS segments: GSM-7 = 160 chars (1 segment) or 153 chars/segment (multi)
  // UCS-2 = 70 chars (1 segment) or 67 chars/segment (multi)
  const isGsm7 = /^[\x20-\x7E\n\r€£¥§¿¡ÄÅÆÇÉÑÖØÜßàäåæèéìñòöùü]*$/.test(text)
  const maxPerSegment = isGsm7 ? 160 : 70
  const multiMaxPerSegment = isGsm7 ? 153 : 67
  const smsSegments = chars === 0 ? 0 : chars <= maxPerSegment ? 1 : Math.ceil(chars / multiMaxPerSegment)

  return (
    <div className="space-y-4">
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Collez ou tapez votre texte ici..."
        className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm min-h-[160px] resize-y focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Caractères', value: chars, color: 'var(--color-primary)' },
          { label: 'Mots', value: words, color: 'var(--color-success)' },
          { label: 'Lignes', value: lines, color: '#F59E0B' },
          { label: 'Segments SMS', value: smsSegments, color: '#A855F7' },
        ].map(stat => (
          <div
            key={stat.label}
            className="bg-gray-50 rounded-lg p-3 text-center"
          >
            <p className="text-2xl font-bold font-mono" style={{ color: stat.color }}>
              {stat.value}
            </p>
            <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="text-xs text-gray-400 space-y-1">
        <p>Encodage : {isGsm7 ? 'GSM-7 (standard)' : 'UCS-2 (caractères spéciaux)'}</p>
        <p>{isGsm7 ? '160' : '70'} caractères max par segment SMS simple</p>
      </div>
    </div>
  )
}
