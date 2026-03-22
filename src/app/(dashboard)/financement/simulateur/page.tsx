'use client'

import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calculator, Building, Scissors, Briefcase, Search, GraduationCap, CheckCircle, ArrowRight,
  Clock, TrendingUp, AlertTriangle, Phone, Calendar, ChevronDown, FileCheck, Target, Info
} from 'lucide-react'
import {
  ORGANISMES_FINANCEMENT, CHECKLISTS_FINANCEMENT, CAS_MONTAGE_FINANCIER, MOTIFS_REFUS,
  getOrganismeParProfil, calculerFinancement
} from '@/lib/financement-data'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

// Formation data compacte
const FORMATIONS_DATA = [
  { slug: 'hygiene-salubrite', nom: 'Hygiène et Salubrité', prix: 490, duree: 21 },
  { slug: 'maquillage-permanent-initiation', nom: 'Maquillage Permanent Initiation', prix: 1200, duree: 35 },
  { slug: 'dermopigmentation-avancee', nom: 'Dermopigmentation Avancée', prix: 1800, duree: 49 },
  { slug: 'microblading-sourcils', nom: 'Microblading Sourcils', prix: 800, duree: 21 },
  { slug: 'rehaussement-cils', nom: 'Rehaussement Cils', prix: 450, duree: 14 },
  { slug: 'micro-needling', nom: 'Micro-needling Visage', prix: 650, duree: 14 },
  { slug: 'laser-ipl', nom: 'Laser IPL Épilation', prix: 2200, duree: 63 },
  { slug: 'hydrafacial', nom: 'HydraFacial Certification', prix: 1500, duree: 28 },
  { slug: 'plasma-pen', nom: 'Plasma Pen Lifting', prix: 1200, duree: 21 },
  { slug: 'radiofréquence', nom: 'Radiofréquence Médicale', prix: 2500, duree: 42 },
  { slug: 'morpheus8', nom: 'Morpheus8 Expert', prix: 2200, duree: 35 }
]

const PROFILS = [
  { id: 'salarie', label: 'Salarié(e) en institut', icon: Building, desc: 'CDI/CDD' },
  { id: 'independant', label: 'Indépendant(e)', icon: Scissors, desc: 'Auto-entrepreneur' },
  { id: 'liberal', label: 'Profession libérale', icon: Briefcase, desc: 'Libéral NAF' },
  { id: 'demandeur-emploi', label: 'Demandeur d\'emploi', icon: Search, desc: 'Reconversion' },
  { id: 'apprenti', label: 'Apprenti(e)', icon: GraduationCap, desc: 'En contrat' }
]

// Simulateur compact horizontal
function SimulateurCompact() {
  const [selectedProfil, setSelectedProfil] = useState('')
  const [selectedFormation, setSelectedFormation] = useState('')

  const resultat = useMemo(() => {
    if (!selectedProfil || !selectedFormation) return null

    const formation = FORMATIONS_DATA.find(f => f.slug === selectedFormation)
    if (!formation) return null

    const organismes = getOrganismeParProfil(selectedProfil as any)
    const organisme = organismes[0]
    if (!organisme) return null

    const calcul = calculerFinancement(formation.prix, organisme.id, formation.duree)
    return { formation, organisme, ...calcul }
  }, [selectedProfil, selectedFormation])

  const circumference = 2 * Math.PI * 25
  const percentage = resultat ? (resultat.montantPrisEnCharge / (resultat.montantPrisEnCharge + resultat.resteACharge)) : 0
  const strokeDashoffset = circumference - (percentage * circumference)

  return (
    <Card className="p-4">
      {/* Simulateur inline */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Profil</label>
          <select
            value={selectedProfil}
            onChange={(e) => setSelectedProfil(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
          >
            <option value="">Sélectionner</option>
            {PROFILS.map(p => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Formation</label>
          <select
            value={selectedFormation}
            onChange={(e) => setSelectedFormation(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
          >
            <option value="">Sélectionner</option>
            {FORMATIONS_DATA.map(f => (
              <option key={f.slug} value={f.slug}>{f.nom} - {f.prix}€</option>
            ))}
          </select>
        </div>

        <div>
          <Button
            onClick={() => {}}
            disabled={!selectedProfil || !selectedFormation}
            className="w-full gap-2"
          >
            <Calculator className="w-4 h-4" />
            Calculer
          </Button>
        </div>

        <div className="flex items-center justify-center">
          {resultat && (
            <div className="flex items-center gap-3">
              {/* Mini donut chart */}
              <div className="relative w-12 h-12">
                <svg className="w-12 h-12 transform -rotate-90">
                  <circle
                    cx="24" cy="24" r="20"
                    stroke="rgb(229, 231, 235)"
                    strokeWidth="4"
                    fill="none"
                  />
                  <motion.circle
                    cx="24" cy="24" r="20"
                    stroke={resultat.resteACharge === 0 ? "#22C55E" : "#2EC6F3"}
                    strokeWidth="4"
                    fill="none"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 1 }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold text-gray-700">
                    {Math.round(percentage * 100)}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Résultat compact */}
      {resultat && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-gray-50 rounded-lg p-3 border-l-4 border-primary"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <p className="font-semibold text-accent">{resultat.organisme.sigle}</p>
                <p className="text-sm text-gray-600">
                  {resultat.montantPrisEnCharge}€ pris en charge
                  {resultat.resteACharge > 0 && ` • Reste: ${resultat.resteACharge}€`}
                </p>
              </div>
              {resultat.resteACharge === 0 && (
                <Badge variant="success" size="sm">100% FINANCÉ</Badge>
              )}
            </div>
            <Button size="sm" className="gap-2">
              <FileCheck className="w-4 h-4" />
              Monter le dossier
            </Button>
          </div>
        </motion.div>
      )}
    </Card>
  )
}

// Tableau organismes compact
function TableauOrganismes() {
  const [expandedRow, setExpandedRow] = useState<string | null>(null)

  return (
    <div className="space-y-3">
      <h2 className="text-2xl font-bold text-accent">8 Organismes de Financement</h2>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Organisme</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Public</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Taux/h</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Plafond</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Délai</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Acceptation</th>
                <th className="px-3 py-2 text-center font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {ORGANISMES_FINANCEMENT.map((org, idx) => (
                <React.Fragment key={org.id}>
                  <tr
                    className={`border-t ${expandedRow === org.id ? 'bg-blue-50' : 'hover:bg-gray-50'} cursor-pointer`}
                    onClick={() => setExpandedRow(expandedRow === org.id ? null : org.id)}
                  >
                    <td className="px-3 py-2">
                      <div>
                        <p className="font-semibold text-accent">{org.sigle}</p>
                        <p className="text-xs text-gray-500">{org.nom.slice(0, 25)}...</p>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <Badge variant="outline" size="sm">
                        {org.publicEligible[0].slice(0, 12)}...
                      </Badge>
                    </td>
                    <td className="px-3 py-2 font-semibold text-primary">
                      {org.tauxHoraire.technique}€
                    </td>
                    <td className="px-3 py-2 font-semibold">
                      {org.plafondAnnuel.max}€
                    </td>
                    <td className="px-3 py-2 text-xs">
                      {org.delaiTraitement.slice(0, 10)}
                    </td>
                    <td className="px-3 py-2">
                      <Badge
                        variant={org.tauxAcceptation.includes('Élevé') ? 'success' : 'warning'}
                        size="sm"
                      >
                        {org.tauxAcceptation.includes('Élevé') ? 'Élevé' : 'Moyen'}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${
                          expandedRow === org.id ? 'rotate-180' : ''
                        }`}
                      />
                    </td>
                  </tr>

                  {expandedRow === org.id && (
                    <tr>
                      <td colSpan={7} className="px-3 py-2 bg-blue-50 border-t">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                          <div>
                            <p className="font-semibold text-accent mb-1">Script commercial</p>
                            <p className="text-gray-700">{org.scriptCommercial.slice(0, 150)}...</p>
                          </div>
                          <div>
                            <p className="font-semibold text-accent mb-1">Points de vigilance</p>
                            <ul className="space-y-1">
                              {org.pointsVigilance.slice(0, 2).map((point, idx) => (
                                <li key={idx} className="flex items-start gap-1">
                                  <AlertTriangle className="w-3 h-3 text-orange-500 mt-0.5 flex-shrink-0" />
                                  <span className="text-gray-700">{point}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button size="sm" variant="outline" className="gap-1">
                            <Phone className="w-3 h-3" />
                            Appeler
                          </Button>
                          <Button size="sm" className="gap-1">
                            <FileCheck className="w-3 h-3" />
                            Déposer dossier
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

// Section checklist + cas pratiques côte à côte
function ChecklistEtCasPratiques() {
  const [selectedProfil, setSelectedProfil] = useState('salarie')
  const [checkedDocs, setCheckedDocs] = useState<string[]>([])

  const checklist = CHECKLISTS_FINANCEMENT.find(c => c.profil === selectedProfil)
  const progressPercentage = checklist ? Math.round((checkedDocs.length / checklist.documents.length) * 100) : 0

  const toggleDoc = (doc: string) => {
    setCheckedDocs(prev =>
      prev.includes(doc)
        ? prev.filter(d => d !== doc)
        : [...prev, doc]
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Checklist à gauche */}
      <Card className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-accent">Checklist Documents</h3>
            <div className="text-sm font-semibold text-primary">{progressPercentage}% prêt</div>
          </div>

          <select
            value={selectedProfil}
            onChange={(e) => setSelectedProfil(e.target.value)}
            className="w-full px-3 py-2 text-sm border rounded-lg"
          >
            {CHECKLISTS_FINANCEMENT.map(c => (
              <option key={c.profil} value={c.profil}>{c.description}</option>
            ))}
          </select>

          {checklist && (
            <>
              <div className="space-y-2">
                {checklist.documents.map(doc => (
                  <label key={doc} className="flex items-center gap-2 p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100">
                    <input
                      type="checkbox"
                      checked={checkedDocs.includes(doc)}
                      onChange={() => toggleDoc(doc)}
                      className="w-4 h-4 text-primary rounded"
                    />
                    <span className={`text-sm ${checkedDocs.includes(doc) ? 'line-through text-gray-500' : 'text-gray-700'}`}>
                      {doc}
                    </span>
                  </label>
                ))}
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-accent text-sm">Étapes</h4>
                {checklist.etapes.map((etape, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs">
                    <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center flex-shrink-0 text-white font-semibold">
                      {idx + 1}
                    </div>
                    <span className="text-gray-700">{etape}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 p-2 bg-blue-50 rounded text-sm">
                <Calendar className="w-4 h-4 text-primary" />
                <span className="font-medium">Délai: {checklist.delaiEstime}</span>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Cas pratiques à droite */}
      <Card className="p-4">
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-accent">Cas Pratiques</h3>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {CAS_MONTAGE_FINANCIER.map((cas, idx) => (
              <div key={idx} className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-semibold text-accent text-sm">{cas.prenom}, {cas.age} ans</p>
                    <p className="text-xs text-gray-600">{cas.profil}</p>
                  </div>
                  <Badge variant="primary" size="sm">{cas.financeur}</Badge>
                </div>

                <div className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span>Formation:</span>
                    <span className="font-semibold">{cas.montantFormation}€</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pris en charge:</span>
                    <span className="font-semibold text-green-600">{cas.montantPrisEnCharge}€</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Reste à charge:</span>
                    <span className={`font-semibold ${cas.resteACharge === 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {cas.resteACharge}€
                    </span>
                  </div>
                </div>

                <div className="mt-2 p-2 bg-green-50 rounded text-xs">
                  <p className="font-medium text-green-800">{cas.resultat}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  )
}

// Motifs de refus accordéon compact
function MotifsRefusCompact() {
  const [expanded, setExpanded] = useState<string | null>(null)

  return (
    <div className="space-y-3">
      <h2 className="text-2xl font-bold text-accent">Éviter les Refus</h2>

      <div className="space-y-2">
        {MOTIFS_REFUS.map((motif, idx) => (
          <Card key={idx} className="overflow-hidden">
            <button
              onClick={() => setExpanded(expanded === motif.motif ? null : motif.motif)}
              className="w-full p-3 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={motif.frequence === 'frequent' ? 'error' : 'warning'}
                    size="sm"
                  >
                    {motif.frequence === 'frequent' ? 'Fréquent' : 'Occasionnel'}
                  </Badge>
                  <span className="font-semibold text-accent text-sm">{motif.motif}</span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-gray-400 transition-transform ${
                    expanded === motif.motif ? 'rotate-180' : ''
                  }`}
                />
              </div>
            </button>

            <AnimatePresence>
              {expanded === motif.motif && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="px-3 pb-3 border-t border-gray-100"
                >
                  <div className="pt-3 space-y-2 text-sm">
                    <div>
                      <p className="font-medium text-gray-700 mb-1">Explication</p>
                      <p className="text-gray-600">{motif.cause}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700 mb-1">Solution</p>
                      <p className="text-gray-600">{motif.solution}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        ))}
      </div>
    </div>
  )
}

// Page principale compacte
export default function SimulateurFinancementPage() {
  return (
    <div className="space-y-8 pb-8">
      {/* Hero compact */}
      <div className="text-center py-6">
        <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-r from-[#2EC6F3] to-[#082545] rounded-xl flex items-center justify-center">
          <Calculator className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-accent mb-2">Simulateur de Financement</h1>
        <p className="text-gray-600">8 organismes • 100% des profils couverts • Résultat immédiat</p>
      </div>

      <SimulateurCompact />
      <TableauOrganismes />
      <ChecklistEtCasPratiques />
      <MotifsRefusCompact />

      {/* CTA final compact */}
      <Card className="p-6 text-center bg-gradient-to-r from-[#2EC6F3]/5 to-[#082545]/5">
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-accent">Besoin d'aide pour votre dossier ?</h2>
          <p className="text-gray-600">Nos conseillers s'occupent de tout — de la demande jusqu'à la facture finale</p>
          <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-green-500" />
              <span>Accompagnement personnalisé</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-green-500" />
              <span>Gestion complète</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-green-500" />
              <span>Optimisation financement</span>
            </div>
          </div>
          <Button className="gap-2">
            <Calendar className="w-4 h-4" />
            Prendre rendez-vous
          </Button>
        </div>
      </Card>
    </div>
  )
}