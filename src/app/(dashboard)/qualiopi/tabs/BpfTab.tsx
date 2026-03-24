'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { FileBarChart, Download, Calendar, Users, Euro, BookOpen, CheckCircle, AlertCircle } from 'lucide-react'

// Mock data pour le BPF de l'année en cours
const BPF_DATA = {
  annee: 2024,
  statut: 'en_cours', // en_cours, finalise, transmis
  nb_stagiaires: 156,
  nb_heures_stagiaire: 2340,
  nb_actions: 24,
  ca_total: 187500,
  ca_apprentissage: 45000,
  ca_formation_continue: 142500,
  derniere_maj: '2024-03-15T10:30:00Z'
}

const FORMATIONS_BPF = [
  {
    id: 'maquillage',
    intitule: 'Maquillage Permanent',
    nb_actions: 8,
    nb_stagiaires: 64,
    nb_heures: 480,
    ca: 76800,
    taux_satisfaction: 96
  },
  {
    id: 'epilation',
    intitule: 'Épilation Laser',
    nb_actions: 6,
    nb_stagiaires: 42,
    nb_heures: 378,
    ca: 50400,
    taux_satisfaction: 98
  },
  {
    id: 'dermocosmetique',
    intitule: 'Dermo-cosmétique',
    nb_actions: 5,
    nb_stagiaires: 35,
    nb_heures: 525,
    ca: 42000,
    taux_satisfaction: 94
  },
  {
    id: 'massage',
    intitule: 'Massage thérapeutique',
    nb_actions: 3,
    nb_stagiaires: 12,
    nb_heures: 180,
    ca: 14400,
    taux_satisfaction: 92
  },
  {
    id: 'microblading',
    intitule: 'Microblading',
    nb_actions: 2,
    nb_stagiaires: 3,
    nb_heures: 36,
    ca: 3900,
    taux_satisfaction: 100
  }
]

const STATUT_CONFIG = {
  en_cours: {
    label: 'En cours',
    color: 'bg-[#E0EBF5] text-[#6B8CAE] border-[#6B8CAE]/30',
    icon: Calendar
  },
  finalise: {
    label: 'Finalisé',
    color: 'bg-[#ECFDF5] text-[#10B981] border-[#10B981]/30',
    icon: CheckCircle
  },
  transmis: {
    label: 'Transmis',
    color: 'bg-[#FAF8F5] text-[#777777] border-[#EEEEEE]',
    icon: CheckCircle
  }
}

export default function BpfTab() {
  const t = useTranslations('bpf')
  const [anneeSelectionnee, setAnneeSelectionnee] = useState(2024)

  const statutConfig = STATUT_CONFIG[BPF_DATA.statut as keyof typeof STATUT_CONFIG]
  const StatutIcon = statutConfig.icon

  // Date limite de transmission (31 mai)
  const dateLimite = new Date(anneeSelectionnee + 1, 4, 31) // Mai = index 4
  const joursRestants = Math.ceil((dateLimite.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))

  return (
    <div className="space-y-6">
      {/* En-tête avec statut */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-[#111111]">
            Bilan Pédagogique et Financier {BPF_DATA.annee}
          </h2>
          <p className="text-sm text-[#777777]">
            Dernière mise à jour : {new Date(BPF_DATA.derniere_maj).toLocaleDateString('fr-FR')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <StatutIcon className="w-4 h-4" />
            <Badge className={statutConfig.color}>
              {statutConfig.label}
            </Badge>
          </div>
          <select
            value={anneeSelectionnee}
            onChange={(e) => setAnneeSelectionnee(Number(e.target.value))}
            className="px-3 py-2 border border-[#EEEEEE] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value={2024}>2024</option>
            <option value={2023}>2023</option>
            <option value={2022}>2022</option>
          </select>
        </div>
      </div>

      {/* Alerte date limite */}
      {joursRestants > 0 && joursRestants <= 90 && (
        <Card className={`p-4 ${joursRestants <= 30 ? 'border-[#FF2D78]/30 bg-[#FFE0EF]' : 'border-[#FF8C42]/30 bg-[#FFF3E8]'}`}>
          <div className="flex items-center gap-3">
            <AlertCircle className={`w-5 h-5 ${joursRestants <= 30 ? 'text-[#FF2D78]' : 'text-[#FF8C42]'} shrink-0`} />
            <div className="flex-1">
              <p className={`text-sm font-medium ${joursRestants <= 30 ? 'text-[#FF2D78]' : 'text-[#FF8C42]'}`}>
                {joursRestants <= 30
                  ? `Attention : ${joursRestants} jours restants pour transmettre le BPF ${BPF_DATA.annee}`
                  : `Rappel : ${joursRestants} jours restants pour transmettre le BPF ${BPF_DATA.annee}`
                }
              </p>
              <p className={`text-sm ${joursRestants <= 30 ? 'text-[#FF2D78]' : 'text-[#FF8C42]'}`}>
                Date limite de transmission : {dateLimite.toLocaleDateString('fr-FR')}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Métriques globales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#777777]">Stagiaires</p>
              <p className="text-2xl font-bold text-[#111111]">{BPF_DATA.nb_stagiaires}</p>
            </div>
            <Users className="w-8 h-8 text-[#6B8CAE]" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#777777]">Heures stagiaire</p>
              <p className="text-2xl font-bold text-[#111111]">{BPF_DATA.nb_heures_stagiaire.toLocaleString()}</p>
            </div>
            <Calendar className="w-8 h-8 text-[#10B981]" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#777777]">Actions de formation</p>
              <p className="text-2xl font-bold text-[#111111]">{BPF_DATA.nb_actions}</p>
            </div>
            <BookOpen className="w-8 h-8 text-[#FF2D78]" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#777777]">CA total</p>
              <p className="text-2xl font-bold text-[#111111]">{BPF_DATA.ca_total.toLocaleString()}€</p>
            </div>
            <Euro className="w-8 h-8 text-orange-500" />
          </div>
        </Card>
      </div>

      {/* Répartition du CA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-[#111111] mb-4">Répartition du CA</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#777777]">Formation continue</span>
              <span className="text-sm font-medium text-[#111111]">
                {BPF_DATA.ca_formation_continue.toLocaleString()}€
              </span>
            </div>
            <div className="w-full bg-[#EEEEEE] rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full"
                style={{ width: `${(BPF_DATA.ca_formation_continue / BPF_DATA.ca_total) * 100}%` }}
              />
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-[#777777]">Apprentissage</span>
              <span className="text-sm font-medium text-[#111111]">
                {BPF_DATA.ca_apprentissage.toLocaleString()}€
              </span>
            </div>
            <div className="w-full bg-[#EEEEEE] rounded-full h-2">
              <div
                className="bg-[#10B981] h-2 rounded-full"
                style={{ width: `${(BPF_DATA.ca_apprentissage / BPF_DATA.ca_total) * 100}%` }}
              />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-[#111111] mb-4">Actions à faire</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-[#ECFDF5] rounded-lg">
              <CheckCircle className="w-5 h-5 text-[#10B981]" />
              <span className="text-sm text-[#10B981]">Collecte des données formations</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-[#ECFDF5] rounded-lg">
              <CheckCircle className="w-5 h-5 text-[#10B981]" />
              <span className="text-sm text-[#10B981]">Calcul des indicateurs financiers</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-[#E0EBF5] rounded-lg">
              <Calendar className="w-5 h-5 text-[#6B8CAE]" />
              <span className="text-sm text-[#6B8CAE]">Finaliser et transmettre avant le 31 mai</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Détail par formation */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-[#111111] mb-4">Détail par formation</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#FAF8F5]/50 border-b border-[#F4F0EB]">
              <tr>
                <th className="text-left text-xs font-semibold text-[#777777] uppercase tracking-wider px-4 py-3">
                  Formation
                </th>
                <th className="text-left text-xs font-semibold text-[#777777] uppercase tracking-wider px-4 py-3">
                  Actions
                </th>
                <th className="text-left text-xs font-semibold text-[#777777] uppercase tracking-wider px-4 py-3">
                  Stagiaires
                </th>
                <th className="text-left text-xs font-semibold text-[#777777] uppercase tracking-wider px-4 py-3">
                  Heures
                </th>
                <th className="text-left text-xs font-semibold text-[#777777] uppercase tracking-wider px-4 py-3">
                  CA
                </th>
                <th className="text-left text-xs font-semibold text-[#777777] uppercase tracking-wider px-4 py-3">
                  Satisfaction
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F4F0EB]">
              {FORMATIONS_BPF.map((formation) => (
                <tr key={formation.id} className="hover:bg-[#FAF8F5]/50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-[#111111]">{formation.intitule}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-[#777777]">{formation.nb_actions}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-[#777777]">{formation.nb_stagiaires}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-[#777777]">{formation.nb_heures}h</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-[#111111]">
                      {formation.ca.toLocaleString()}€
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={formation.taux_satisfaction >= 95 ? 'success' : formation.taux_satisfaction >= 90 ? 'warning' : 'error'}
                      size="sm"
                    >
                      {formation.taux_satisfaction}%
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex justify-center gap-4">
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Télécharger PDF
        </Button>
        <Button variant="outline">
          <FileBarChart className="w-4 h-4 mr-2" />
          Export Excel
        </Button>
        <Button disabled={BPF_DATA.statut === 'transmis'}>
          Transmettre à l'État
        </Button>
      </div>
    </div>
  )
}