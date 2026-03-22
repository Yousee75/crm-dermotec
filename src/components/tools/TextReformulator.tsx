'use client'

import { useState } from 'react'
import { Wand2, Copy, Check } from 'lucide-react'

const TONES = [
  { id: 'professionnel', label: 'Professionnel', emoji: '💼' },
  { id: 'commercial', label: 'Commercial', emoji: '🎯' },
  { id: 'amical', label: 'Amical', emoji: '😊' },
  { id: 'formel', label: 'Formel', emoji: '📋' },
  { id: 'concis', label: 'Concis', emoji: '✂️' },
]

export function TextReformulator() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [tone, setTone] = useState('professionnel')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const reformulate = async () => {
    if (!input.trim()) return
    setLoading(true)
    setOutput('')

    try {
      const res = await fetch('/api/tools/reformulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input, tone }),
      })

      const data = await res.json()
      if (res.ok) {
        setOutput(data.result)
      } else {
        setOutput(`Erreur : ${data.error}`)
      }
    } catch {
      setOutput('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  const copyResult = async () => {
    await navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-4">
      {/* Tone selector */}
      <div className="flex flex-wrap gap-2">
        {TONES.map(t => (
          <button
            key={t.id}
            onClick={() => setTone(t.id)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              tone === t.id
                ? 'bg-action text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      {/* Input */}
      <textarea
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder="Collez le texte à reformuler..."
        className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm min-h-[100px] resize-y focus:outline-none focus:border-action focus:ring-1 focus:ring-action/30"
      />

      {/* Button */}
      <button
        onClick={reformulate}
        disabled={loading || !input.trim()}
        className="w-full bg-action hover:bg-action-dark disabled:opacity-50 text-white rounded-lg py-2.5 flex items-center justify-center gap-2 transition-colors"
      >
        <Wand2 size={16} />
        {loading ? 'Reformulation...' : 'Reformuler avec l\'IA'}
      </button>

      {/* Output */}
      {output && (
        <div className="relative bg-purple-50 border border-purple-200 rounded-lg p-4">
          <button
            onClick={copyResult}
            className="absolute top-2 right-2 p-1.5 hover:bg-purple-100 rounded-lg transition-colors"
            title="Copier"
          >
            {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} className="text-purple-400" />}
          </button>
          <p className="text-sm text-gray-800 whitespace-pre-wrap pr-8">{output}</p>
        </div>
      )}
    </div>
  )
}
