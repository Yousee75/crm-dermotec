'use client'

import { useState, useEffect, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { Button } from './Button'
import { Card } from './Card'
import { Sparkles, TrendingUp, Calendar, Euro } from 'lucide-react'

interface Formation {
  nom: string
  prix_ht: number
  revenu_moyen_prestation: number
}

interface ROICalculatorProps {
  formations?: Formation[]
  className?: string
  onCTAClick?: () => void
}

const DEFAULT_FORMATIONS: Formation[] = [
  { nom: 'Microblading', prix_ht: 1990, revenu_moyen_prestation: 200 },
  { nom: 'Maquillage Permanent', prix_ht: 2490, revenu_moyen_prestation: 250 },
  { nom: 'Full Lips', prix_ht: 1590, revenu_moyen_prestation: 300 },
  { nom: 'Bb Glow', prix_ht: 890, revenu_moyen_prestation: 120 },
  { nom: 'Plasma Pen', prix_ht: 2190, revenu_moyen_prestation: 350 },
  { nom: 'Hollywood Peel', prix_ht: 1290, revenu_moyen_prestation: 180 },
  { nom: 'Dermaplaning', prix_ht: 690, revenu_moyen_prestation: 80 },
]

function CountUp({ value, duration = 1000, className }: { value: number; duration?: number; className?: string }) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    let startTime: number
    let animationFrame: number

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const elapsed = timestamp - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Fonction d'easing out cubic
      const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

      setDisplayValue(Math.floor(value * easeOutCubic(progress)))

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      }
    }

    animationFrame = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animationFrame)
    }
  }, [value, duration])

  return <span className={className}>{displayValue.toLocaleString('fr-FR')}</span>
}

export function ROICalculator({ formations = DEFAULT_FORMATIONS, className, onCTAClick }: ROICalculatorProps) {
  const [selectedFormation, setSelectedFormation] = useState<Formation>(formations[0])
  const [clientesParSemaine, setClientesParSemaine] = useState(3)
  const [prixPrestation, setPrixPrestation] = useState(selectedFormation.revenu_moyen_prestation)

  // Mise à jour du prix quand on change de formation
  useEffect(() => {
    setPrixPrestation(selectedFormation.revenu_moyen_prestation)
  }, [selectedFormation])

  // Calculs ROI
  const calculations = useMemo(() => {
    const caMensuel = clientesParSemaine * prixPrestation * 4.33 // 4.33 semaines/mois en moyenne
    const caAnnuel = caMensuel * 12
    const roiPourcentage = ((caAnnuel - selectedFormation.prix_ht) / selectedFormation.prix_ht) * 100
    const tempsRemboursement = selectedFormation.prix_ht / caMensuel

    return {
      caMensuel: Math.round(caMensuel),
      caAnnuel: Math.round(caAnnuel),
      roiPourcentage: Math.round(roiPourcentage),
      tempsRemboursement: Math.max(0.1, tempsRemboursement), // Minimum 0.1 semaine
      semaines: Math.ceil(tempsRemboursement),
    }
  }, [clientesParSemaine, prixPrestation, selectedFormation.prix_ht])

  return (
    <Card className={cn('bg-white rounded-2xl shadow-xl border p-8', className)}>
      {/* En-tête */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-[#2EC6F3]/10 rounded-full mb-4">
          <TrendingUp className="w-8 h-8 text-[#2EC6F3]" />
        </div>
        <h2 className="text-2xl font-bold text-[#082545] mb-2">
          Calculateur de Rentabilité
        </h2>
        <p className="text-gray-600">
          Découvrez en combien de temps votre formation sera amortie
        </p>
      </div>

      {/* Sélection de formation */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-[#082545] mb-4">
          Choisissez votre formation
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {formations.map((formation) => (
            <div
              key={formation.nom}
              className={cn(
                'relative p-4 border-2 rounded-xl cursor-pointer transition-all duration-200',
                'hover:shadow-md hover:border-[#2EC6F3]/50',
                selectedFormation.nom === formation.nom
                  ? 'border-[#2EC6F3] bg-[#2EC6F3]/5'
                  : 'border-gray-200'
              )}
              onClick={() => setSelectedFormation(formation)}
            >
              <div className="flex items-center space-x-3">
                <div className={cn(
                  'w-4 h-4 rounded-full border-2 transition-colors',
                  selectedFormation.nom === formation.nom
                    ? 'border-[#2EC6F3] bg-[#2EC6F3]'
                    : 'border-gray-300'
                )}>
                  {selectedFormation.nom === formation.nom && (
                    <div className="w-full h-full rounded-full bg-white scale-50" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[#082545] truncate">{formation.nom}</p>
                  <p className="text-sm text-gray-600">
                    {formation.prix_ht.toLocaleString('fr-FR')}€ HT
                  </p>
                </div>
              </div>
              {selectedFormation.nom === formation.nom && (
                <Sparkles className="absolute top-3 right-3 w-4 h-4 text-[#2EC6F3]" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Sliders */}
      <div className="space-y-6 mb-8">
        {/* Clientes par semaine */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-[#082545]">
              Nombre de clientes par semaine
            </label>
            <span className="text-lg font-semibold text-[#2EC6F3]">
              {clientesParSemaine}
            </span>
          </div>
          <div className="relative">
            <input
              type="range"
              min="1"
              max="20"
              value={clientesParSemaine}
              onChange={(e) => setClientesParSemaine(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1</span>
              <span>20</span>
            </div>
          </div>
        </div>

        {/* Prix par prestation */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-[#082545]">
              Prix moyen par prestation
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                value={prixPrestation}
                onChange={(e) => setPrixPrestation(parseInt(e.target.value) || 0)}
                className="w-20 text-lg font-semibold text-[#2EC6F3] text-right border-none bg-transparent focus:outline-none"
              />
              <span className="text-sm text-gray-600">€</span>
            </div>
          </div>
          <div className="relative">
            <input
              type="range"
              min="50"
              max="500"
              step="10"
              value={prixPrestation}
              onChange={(e) => setPrixPrestation(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>50€</span>
              <span>500€</span>
            </div>
          </div>
        </div>
      </div>

      {/* Résultats */}
      <div className="bg-gradient-to-br from-[#2EC6F3]/5 to-[#082545]/5 rounded-2xl p-6 mb-8">
        {/* Temps de remboursement principal */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-white rounded-full shadow-sm mb-3">
            <Calendar className="w-6 h-6 text-[#2EC6F3]" />
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-2">
            Votre investissement remboursé en
          </h3>
          <div className="text-4xl font-bold text-[#082545] mb-1">
            <CountUp value={calculations.semaines} />
            <span className="text-lg ml-1">semaine{calculations.semaines > 1 ? 's' : ''}</span>
          </div>
          <p className="text-sm text-gray-600">
            Soit environ {Math.ceil(calculations.tempsRemboursement / 4.33)} mois
          </p>
        </div>

        {/* Métriques secondaires */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="text-center p-4 bg-white/50 rounded-xl">
            <div className="inline-flex items-center justify-center w-8 h-8 bg-green-100 rounded-full mb-2">
              <Euro className="w-4 h-4 text-green-600" />
            </div>
            <p className="text-sm text-gray-600 mb-1">CA mensuel potentiel</p>
            <p className="text-2xl font-bold text-green-600">
              <CountUp value={calculations.caMensuel} />€
            </p>
          </div>
          <div className="text-center p-4 bg-white/50 rounded-xl">
            <div className="inline-flex items-center justify-center w-8 h-8 bg-[#2EC6F3]/20 rounded-full mb-2">
              <TrendingUp className="w-4 h-4 text-[#2EC6F3]" />
            </div>
            <p className="text-sm text-gray-600 mb-1">ROI sur 1 an</p>
            <p className="text-2xl font-bold text-[#2EC6F3]">
              +<CountUp value={calculations.roiPourcentage} />%
            </p>
          </div>
        </div>

        {/* Barre de comparaison */}
        <div className="mt-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600">Investissement vs Revenus année 1</span>
            <span className="font-medium text-[#082545]">
              {calculations.caAnnuel.toLocaleString('fr-FR')}€
            </span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-red-400 rounded-full relative" style={{ width: '20%' }}>
              <div
                className="h-full bg-gradient-to-r from-[#2EC6F3] to-green-400 rounded-full absolute"
                style={{ width: '500%', left: 0 }}
              />
            </div>
          </div>
          <div className="flex justify-between text-xs mt-1">
            <span className="text-red-500">
              Investissement : {selectedFormation.prix_ht.toLocaleString('fr-FR')}€
            </span>
            <span className="text-green-600">
              Bénéfice : +{(calculations.caAnnuel - selectedFormation.prix_ht).toLocaleString('fr-FR')}€
            </span>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center">
        <Button
          size="lg"
          className="w-full sm:w-auto px-8 py-4 text-base"
          onClick={onCTAClick}
        >
          <Sparkles className="w-5 h-5" />
          Recevoir mon étude personnalisée
        </Button>
        <p className="text-xs text-gray-500 mt-3">
          Gratuit • Sans engagement • Réponse sous 24h
        </p>
      </div>

      {/* Styles pour les sliders */}
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #2EC6F3;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(46, 198, 243, 0.3);
        }
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #2EC6F3;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 6px rgba(46, 198, 243, 0.3);
        }
      `}</style>
    </Card>
  )
}

export default ROICalculator