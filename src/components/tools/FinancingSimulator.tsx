'use client'

import { useState } from 'react'

const FORMATIONS = [
  { nom: 'Maquillage Permanent', prix: 2490 },
  { nom: 'Microblading', prix: 1400 },
  { nom: 'Full Lips', prix: 1400 },
  { nom: 'Tricopigmentation', prix: 2500 },
  { nom: 'Aréole Mammaire', prix: 2300 },
  { nom: 'Nanoneedling', prix: 700 },
  { nom: 'Soin ALLin1', prix: 900 },
  { nom: 'Peeling / Dermaplaning', prix: 990 },
  { nom: 'Détatouage', prix: 990 },
  { nom: 'Épilation Définitive', prix: 990 },
  { nom: 'Hygiène & Salubrité', prix: 400 },
]

const FINANCEMENTS = [
  { id: 'autofinancement', label: 'Auto-financement', prise: 0 },
  { id: 'opco', label: 'OPCO (100%)', prise: 100 },
  { id: 'cpf', label: 'CPF (variable)', prise: 80 },
  { id: 'france_travail', label: 'France Travail (100%)', prise: 100 },
  { id: 'fafcea', label: 'FAFCEA (partiel)', prise: 50 },
  { id: 'fifpl', label: 'FIF PL (partiel)', prise: 60 },
]

export function FinancingSimulator() {
  const [formationIdx, setFormationIdx] = useState(0)
  const [financementId, setFinancementId] = useState('autofinancement')
  const [echeances, setEcheances] = useState(1)

  const formation = FORMATIONS[formationIdx]
  const financement = FINANCEMENTS.find(f => f.id === financementId)!
  const prixTTC = formation.prix * 1.2
  const priseEnCharge = (prixTTC * financement.prise) / 100
  const resteACharge = prixTTC - priseEnCharge
  const mensualite = echeances > 1 ? resteACharge / echeances : resteACharge

  return (
    <div className="space-y-4">
      {/* Formation */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Formation</label>
        <select
          value={formationIdx}
          onChange={e => setFormationIdx(Number(e.target.value))}
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary"
        >
          {FORMATIONS.map((f, i) => (
            <option key={f.nom} value={i}>{f.nom} — {f.prix}€ HT</option>
          ))}
        </select>
      </div>

      {/* Financement */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Type de financement</label>
        <select
          value={financementId}
          onChange={e => setFinancementId(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary"
        >
          {FINANCEMENTS.map(f => (
            <option key={f.id} value={f.id}>{f.label}</option>
          ))}
        </select>
      </div>

      {/* Echelonnement */}
      {resteACharge > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Échelonnement ({echeances}x)
          </label>
          <input
            type="range"
            min={1}
            max={4}
            value={echeances}
            onChange={e => setEcheances(Number(e.target.value))}
            className="w-full accent-[#2EC6F3]"
          />
          <div className="flex justify-between text-xs text-gray-400">
            <span>1x</span><span>2x</span><span>3x</span><span>4x</span>
          </div>
        </div>
      )}

      {/* Résultat */}
      <div className="bg-gradient-to-br from-[#082545] to-[#0F3460] text-white rounded-xl p-5 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-white/70">Prix TTC</span>
          <span className="font-mono">{prixTTC.toFixed(0)}€</span>
        </div>
        {financement.prise > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-white/70">Prise en charge ({financement.prise}%)</span>
            <span className="font-mono text-green-400">-{priseEnCharge.toFixed(0)}€</span>
          </div>
        )}
        <div className="border-t border-white/20 pt-2 flex justify-between">
          <span className="font-medium">Reste à charge</span>
          <span className="font-bold text-xl font-mono">{resteACharge.toFixed(0)}€</span>
        </div>
        {echeances > 1 && resteACharge > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-white/70">Mensualité ({echeances}x)</span>
            <span className="font-mono text-primary">{mensualite.toFixed(0)}€/mois</span>
          </div>
        )}
      </div>
    </div>
  )
}
