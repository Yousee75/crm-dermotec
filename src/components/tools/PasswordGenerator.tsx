'use client'

import { useState, useCallback } from 'react'
import { Copy, Check, RefreshCw } from 'lucide-react'

export function PasswordGenerator() {
  const [password, setPassword] = useState('')
  const [length, setLength] = useState(16)
  const [options, setOptions] = useState({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
  })
  const [copied, setCopied] = useState(false)

  const generate = useCallback(() => {
    let charset = ''
    if (options.lowercase) charset += 'abcdefghijklmnopqrstuvwxyz'
    if (options.uppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    if (options.numbers) charset += '0123456789'
    if (options.symbols) charset += '!@#$%&*_+-='

    if (!charset) charset = 'abcdefghijklmnopqrstuvwxyz'

    const array = new Uint32Array(length)
    crypto.getRandomValues(array)
    const pwd = Array.from(array, v => charset[v % charset.length]).join('')
    setPassword(pwd)
    setCopied(false)
  }, [length, options])

  const copy = async () => {
    await navigator.clipboard.writeText(password)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const strength = (() => {
    if (!password) return { label: '', color: '', percent: 0 }
    let score = 0
    if (password.length >= 12) score += 25
    if (password.length >= 16) score += 10
    if (/[a-z]/.test(password)) score += 15
    if (/[A-Z]/.test(password)) score += 15
    if (/[0-9]/.test(password)) score += 15
    if (/[^a-zA-Z0-9]/.test(password)) score += 20
    const percent = Math.min(100, score)
    return {
      label: percent >= 80 ? 'Fort' : percent >= 50 ? 'Moyen' : 'Faible',
      color: percent >= 80 ? 'var(--color-success)' : percent >= 50 ? '#F59E0B' : '#EF4444',
      percent,
    }
  })()

  return (
    <div className="space-y-4">
      {/* Résultat */}
      {password && (
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg p-3">
          <code className="flex-1 text-sm font-mono break-all select-all">{password}</code>
          <button onClick={copy} className="p-2 hover:bg-gray-200 rounded-lg shrink-0">
            {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} className="text-gray-400" />}
          </button>
        </div>
      )}

      {/* Force */}
      {password && (
        <div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${strength.percent}%`, backgroundColor: strength.color }} />
          </div>
          <p className="text-xs mt-1 font-medium" style={{ color: strength.color }}>{strength.label}</p>
        </div>
      )}

      {/* Longueur */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Longueur : {length}</label>
        <input type="range" min={8} max={64} value={length} onChange={e => setLength(Number(e.target.value))} className="w-full accent-[#2EC6F3]" />
      </div>

      {/* Options */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { key: 'uppercase', label: 'Majuscules (A-Z)' },
          { key: 'lowercase', label: 'Minuscules (a-z)' },
          { key: 'numbers', label: 'Chiffres (0-9)' },
          { key: 'symbols', label: 'Symboles (!@#$)' },
        ].map(opt => (
          <label key={opt.key} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={options[opt.key as keyof typeof options]}
              onChange={e => setOptions(prev => ({ ...prev, [opt.key]: e.target.checked }))}
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            {opt.label}
          </label>
        ))}
      </div>

      <button
        onClick={generate}
        className="w-full bg-primary hover:bg-primary-dark text-white rounded-lg py-2.5 flex items-center justify-center gap-2 transition-colors"
      >
        <RefreshCw size={16} />
        Générer un mot de passe
      </button>
    </div>
  )
}
