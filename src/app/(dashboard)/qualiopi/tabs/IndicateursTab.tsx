'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Award, CheckCircle, AlertTriangle, Clock, FileText, Users, Target } from 'lucide-react'

// Structure des 7 critères Qualiopi et leurs 32 indicateurs
const CRITERES_QUALIOPI = [
  {
    id: 'c1',
    titre: 'Critère 1 - Conditions d\'information du public',
    description: 'Information claire et accessible sur les prestations proposées',
    indicateurs: [
      { id: 'i1', titre: 'Diffuser des informations accessibles au public', conforme: true },
      { id: 'i2', titre: 'Indicateurs de résultats de la prestation', conforme: true },
      { id: 'i3', titre: 'Obtenir les appréciations des parties prenantes', conforme: false }
    ]
  },
  {
    id: 'c2',
    titre: 'Critère 2 - Identification précise des objectifs',
    description: 'Définition claire des objectifs et de l\'adaptation aux bénéficiaires',
    indicateurs: [
      { id: 'i4', titre: 'Analyse du besoin du bénéficiaire', conforme: true },
      { id: 'i5', titre: 'Définition des objectifs opérationnels et évaluables', conforme: true },
      { id: 'i6', titre: 'Adéquation des modalités d\'accès', conforme: true },
      { id: 'i7', titre: 'Positionnement du bénéficiaire', conforme: false }
    ]
  },
  {
    id: 'c3',
    titre: 'Critère 3 - Adaptation aux publics bénéficiaires',
    description: 'Prise en compte des spécificités des bénéficiaires',
    indicateurs: [
      { id: 'i8', titre: 'Adaptation aux publics et modalités d\'accueil', conforme: true },
      { id: 'i9', titre: 'Adaptation aux publics et contenus de la prestation', conforme: true },
      { id: 'i10', titre: 'Adaptation aux publics et modalités de la prestation', conforme: true },
      { id: 'i11', titre: 'Mise à disposition de ressources pédagogiques', conforme: false },
      { id: 'i12', titre: 'Accompagnement des bénéficiaires', conforme: true }
    ]
  },
  {
    id: 'c4',
    titre: 'Critère 4 - Adéquation des moyens pédagogiques',
    description: 'Moyens humains et techniques adaptés',
    indicateurs: [
      { id: 'i13', titre: 'Adéquation des moyens humains et techniques', conforme: true },
      { id: 'i14', titre: 'Coordination entre les différents intervenants', conforme: true },
      { id: 'i15', titre: 'Entretien et maintenance des équipements', conforme: true },
      { id: 'i16', titre: 'Mise à jour des compétences des intervenants', conforme: false }
    ]
  },
  {
    id: 'c5',
    titre: 'Critère 5 - Qualification et développement des connaissances',
    description: 'Compétences des intervenants et leur développement',
    indicateurs: [
      { id: 'i17', titre: 'Définition des compétences des intervenants', conforme: true },
      { id: 'i18', titre: 'Développement des compétences des intervenants', conforme: false },
      { id: 'i19', titre: 'Veille sur les évolutions des compétences', conforme: true }
    ]
  },
  {
    id: 'c6',
    titre: 'Critère 6 - Inscription dans son environnement',
    description: 'Veille et adaptation aux évolutions',
    indicateurs: [
      { id: 'i20', titre: 'Veille sur les évolutions réglementaires', conforme: true },
      { id: 'i21', titre: 'Veille sur les évolutions technologiques', conforme: true },
      { id: 'i22', titre: 'Veille sur les évolutions des métiers', conforme: false },
      { id: 'i23', titre: 'Mise en place de partenariats', conforme: true }
    ]
  },
  {
    id: 'c7',
    titre: 'Critère 7 - Recueil des appréciations et amélioration',
    description: 'Amélioration continue de la qualité',
    indicateurs: [
      { id: 'i24', titre: 'Recueil des appréciations des parties prenantes', conforme: false },
      { id: 'i25', titre: 'Description des modalités d\'amélioration', conforme: true },
      { id: 'i26', titre: 'Mise en œuvre des améliorations', conforme: true },
      { id: 'i27', titre: 'Résultats de l\'amélioration continue', conforme: true }
    ]
  }
]

export default function IndicateursTab() {
  const t = useTranslations('qualiopi')
  const [selectedCritere, setSelectedCritere] = useState<string | null>(null)

  // Calculs globaux
  const totalIndicateurs = CRITERES_QUALIOPI.reduce((sum, c) => sum + c.indicateurs.length, 0)
  const indicateursConformes = CRITERES_QUALIOPI.reduce((sum, c) =>
    sum + c.indicateurs.filter(i => i.conforme).length, 0)
  const tauxConformite = Math.round((indicateursConformes / totalIndicateurs) * 100)

  return (
    <div className="space-y-6">
      {/* Vue d'ensemble */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Taux de conformité</p>
              <p className="text-2xl font-bold text-gray-900">{tauxConformite}%</p>
            </div>
            <Award className="w-8 h-8 text-primary" />
          </div>
          <ProgressBar value={tauxConformite} className="mt-2" />
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Indicateurs</p>
              <p className="text-2xl font-bold text-gray-900">{indicateursConformes}/{totalIndicateurs}</p>
            </div>
            <Target className="w-8 h-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Critères</p>
              <p className="text-2xl font-bold text-gray-900">7/7</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Non-conformes</p>
              <p className="text-2xl font-bold text-red-600">{totalIndicateurs - indicateursConformes}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
        </Card>
      </div>

      {/* Alerte conformité */}
      {tauxConformite < 100 && (
        <Card className="p-4 border-amber-200 bg-amber-50">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800">
                Attention : {totalIndicateurs - indicateursConformes} indicateurs non conformes
              </p>
              <p className="text-sm text-amber-700">
                Travaillez sur ces points avant votre prochain audit Qualiopi.
              </p>
            </div>
            <Button size="sm" variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-100">
              Plan d'action
            </Button>
          </div>
        </Card>
      )}

      {/* Liste des critères */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {CRITERES_QUALIOPI.map((critere) => {
          const conformes = critere.indicateurs.filter(i => i.conforme).length
          const total = critere.indicateurs.length
          const pourcentage = Math.round((conformes / total) * 100)
          const isSelected = selectedCritere === critere.id

          return (
            <Card
              key={critere.id}
              className={`p-6 cursor-pointer transition-all hover:shadow-md ${
                isSelected ? 'ring-2 ring-primary border-primary' : ''
              }`}
              onClick={() => setSelectedCritere(isSelected ? null : critere.id)}
            >
              <div className="space-y-4">
                {/* En-tête */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">
                      {critere.titre}
                    </h3>
                    <p className="text-xs text-gray-600">{critere.description}</p>
                  </div>
                  <Badge
                    variant={pourcentage === 100 ? 'success' : pourcentage >= 75 ? 'warning' : 'error'}
                    className="ml-3"
                  >
                    {conformes}/{total}
                  </Badge>
                </div>

                {/* Barre de progression */}
                <ProgressBar
                  value={pourcentage}
                  className="h-2"
                  color={pourcentage === 100 ? '#22C55E' : pourcentage >= 75 ? '#F59E0B' : '#EF4444'}
                />

                {/* Détail des indicateurs si sélectionné */}
                {isSelected && (
                  <div className="space-y-2 pt-2 border-t border-gray-100">
                    {critere.indicateurs.map((indicateur) => (
                      <div key={indicateur.id} className="flex items-center justify-between text-xs">
                        <span className="text-gray-700 flex-1">{indicateur.titre}</span>
                        {indicateur.conforme ? (
                          <CheckCircle className="w-4 h-4 text-green-500 ml-2" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-red-500 ml-2" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          )
        })}
      </div>

      {/* Actions */}
      <div className="flex justify-center gap-4">
        <Button variant="outline">
          <FileText className="w-4 h-4 mr-2" />
          Générer rapport
        </Button>
        <Button>
          <Users className="w-4 h-4 mr-2" />
          Planifier audit
        </Button>
      </div>
    </div>
  )
}