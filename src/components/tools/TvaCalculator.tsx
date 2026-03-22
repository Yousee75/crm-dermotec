'use client'

import { useState } from 'react'

const TVA_RATE = 0.20

export function TvaCalculator() {
  const [ht, setHt] = useState('')
  const [ttc, setTtc] = useState('')
  const [mode, setMode] = useState<'ht-to-ttc' | 'ttc-to-ht'>('ht-to-ttc')

  const calculate = (value: string, from: 'ht' | 'ttc') => {
    const num = parseFloat(value.replace(',', '.'))
    if (isNaN(num)) {
      setHt(from === 'ht' ? value : '')
      setTtc(from === 'ttc' ? value : '')
      return
    }

    if (from === 'ht') {
      setHt(value)
      setTtc((num * (1 + TVA_RATE)).toFixed(2))
    } else {
      setTtc(value)
      setHt((num / (1 + TVA_RATE)).toFixed(2))
    }
  }

  const tvaAmount = ht ? (parseFloat(ht.replace(',', '.')) * TVA_RATE).toFixed(2) : '0.00'

  return (
    <div className="space-y-4">
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setMode('ht-to-ttc')}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
            mode === 'ht-to-ttc' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          HT → TTC
        </button>
        <button
          onClick={() => setMode('ttc-to-ht')}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
            mode === 'ttc-to-ht' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          TTC → HT
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Montant HT (€)
          </label>
          <input
            type="text"
            inputMode="decimal"
            value={ht}
            onChange={e => calculate(e.target.value, 'ht')}
            placeholder="0.00"
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-lg font-mono focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
            readOnly={mode === 'ttc-to-ht'}
          />
        </div>

        <div className="text-center">
          <span className="inline-block bg-amber-50 text-amber-700 text-sm font-medium px-3 py-1 rounded-full">
            TVA 20% = {tvaAmount} €
          </span>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Montant TTC (€)
          </label>
          <input
            type="text"
            inputMode="decimal"
            value={ttc}
            onChange={e => calculate(e.target.value, 'ttc')}
            placeholder="0.00"
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-lg font-mono focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
            readOnly={mode === 'ht-to-ttc'}
          />
        </div>
      </div>
    </div>
  )
}
