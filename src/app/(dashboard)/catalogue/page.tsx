'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Clock,
  Euro,
  TrendingUp,
  Filter,
  ChevronRight,
  ChevronDown,
  Calculator,
  BookOpen,
  AlertTriangle,
  Users,
  Award,
  Target,
  Zap,
  Heart,
  Sun,
  ShieldCheck,
  X,
  Calendar,
  GraduationCap,
  BarChart3
} from 'lucide-react'
import {
  FORMATIONS_ENRICHIES,
  getFormationsByCategorie,
  PARCOURS_RECOMMANDE,
  TABLEAU_ROI_COMPARATIF
} from '@/lib/formation/content-enriched'
import type { FormationEnriched } from '@/types/formations-content'
import { createClient } from '@/lib/infra/supabase-client'
import { useQuery } from '@tanstack/react-query'

// Types
type CategorieFormation = FormationEnriched['categorie']
type TabDetail = 'technique' | 'roi' | 'faq' | 'reglementation'

// Configuration des catégories avec couleurs et icônes
const CATEGORIES_CONFIG = {
  dermopigmentation: {
    label: 'Dermopigmentation',
    count: 6,
    color: 'from-pink-500 to-rose-600',
    icon: Heart
  },
  'soins-visage': {
    label: 'Soins Visage',
    count: 2,
    color: 'from-[#FF5C00] to-[#FF8C42]',
    icon: Sun
  },
  'laser-ipl': {
    label: 'Laser & IPL',
    count: 1,
    color: 'from-[#FF2D78] to-[#FF6BA8]',
    icon: Zap
  },
  reglementaire: {
    label: 'Réglementaire',
    count: 1,
    color: 'from-green-500 to-emerald-600',
    icon: ShieldCheck
  },
  tricopigmentation: {
    label: 'Tricopigmentation',
    count: 1,
    color: 'from-amber-500 to-orange-600',
    icon: Target
  }
} as const

// Animations
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

// Composant KPIs temps réel depuis Supabase
function FormationsKPIs() {
  const supabase = createClient()

  const { data: stats } = useQuery({
    queryKey: ['formations-kpis'],
    queryFn: async () => {
      const [formationsRes, sessionsRes, inscriptionsRes] = await Promise.all([
        supabase.from('formations').select('id, prix_ht', { count: 'exact' }).eq('is_active', true),
        supabase.from('sessions').select('id, places_max, places_occupees, statut, ca_prevu, ca_realise')
          .in('statut', ['PLANIFIEE', 'CONFIRMEE', 'EN_COURS']),
        supabase.from('inscriptions').select('id, montant_total, paiement_statut')
          .in('statut', ['CONFIRMEE', 'EN_COURS', 'COMPLETEE']),
      ])
      const formations = formationsRes.data || []
      const sessions = sessionsRes.data || []
      const inscriptions = inscriptionsRes.data || []

      const totalPlaces = sessions.reduce((s: number, x: any) => s + (x.places_max || 0), 0)
      const placesOccupees = sessions.reduce((s: number, x: any) => s + (x.places_occupees || 0), 0)
      const tauxRemplissage = totalPlaces > 0 ? Math.round((placesOccupees / totalPlaces) * 100) : 0
      const caPipeline = inscriptions.reduce((s: number, x: any) => s + (x.montant_total || 0), 0)
      const caPaye = inscriptions.filter((i: any) => i.paiement_statut === 'PAYE').reduce((s: number, x: any) => s + (x.montant_total || 0), 0)

      return {
        nbFormations: formations.length,
        nbSessions: sessions.length,
        nbInscrits: inscriptions.length,
        tauxRemplissage,
        caPipeline,
        caPaye,
      }
    },
    staleTime: 60_000,
  })

  if (!stats) return null

  const kpis = [
    { label: 'Formations actives', value: stats.nbFormations, icon: GraduationCap, color: '#FF5C00' },
    { label: 'Sessions ouvertes', value: stats.nbSessions, icon: Calendar, color: '#FF2D78' },
    { label: 'Inscrits confirmés', value: stats.nbInscrits, icon: Users, color: '#10B981' },
    { label: 'Taux remplissage', value: `${stats.tauxRemplissage}%`, icon: BarChart3, color: '#FF8C42' },
    { label: 'CA pipeline', value: `${(stats.caPipeline / 1000).toFixed(1)}k€`, icon: TrendingUp, color: '#FF5C00' },
    { label: 'CA encaissé', value: `${(stats.caPaye / 1000).toFixed(1)}k€`, icon: Euro, color: '#10B981' },
  ]

  return (
    <div className="px-6 py-4" style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #EEEEEE' }}>
      <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map((kpi, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: '#FAF8F5' }}>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${kpi.color}15` }}>
              <kpi.icon size={18} style={{ color: kpi.color }} />
            </div>
            <div className="min-w-0">
              <div className="text-lg font-bold leading-tight" style={{ color: '#111111' }}>{kpi.value}</div>
              <div className="text-xs truncate" style={{ color: '#777777' }}>{kpi.label}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Composant Hero Section
function HeroSection({ searchTerm, onSearchChange }: {
  searchTerm: string
  onSearchChange: (term: string) => void
}) {
  return (
    <motion.div
      className="relative overflow-hidden bg-gradient-to-br from-primary via-[#FF2D78] to-accent text-white"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
    >
      <div className="absolute inset-0 bg-black/20" />
      <div className="relative px-6 py-16 mx-auto max-w-7xl">
        <div className="text-center">
          <motion.h1
            className="mb-4 text-4xl font-heading font-bold lg:text-6xl"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <span className="bg-gradient-to-r from-white to-[#FFE0CC] bg-clip-text text-transparent">
              Catalogue Formations
            </span>
            <br />
            <span className="text-white">Dermotec</span>
          </motion.h1>

          <motion.p
            className="mb-8 text-xl text-[#FF5C00] lg:text-2xl"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            11 formations certifiées Qualiopi — De 450€ à 2 500€ HT
          </motion.p>

          <motion.div
            className="max-w-2xl mx-auto mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#999999] w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher une formation..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full px-12 py-4 text-[#111111] bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF5C00] text-lg"
              />
            </div>
          </motion.div>

          <motion.div
            className="flex justify-center gap-8 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <div>
              <div className="text-3xl font-bold">11</div>
              <div className="text-[#FF5C00]">Formations</div>
            </div>
            <div>
              <div className="text-3xl font-bold">5</div>
              <div className="text-[#FF5C00]">Catégories</div>
            </div>
            <div>
              <div className="text-3xl font-bold">2</div>
              <div className="text-[#FF5C00]">Mois ROI</div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}

// Composant Filtres par catégorie
function CategoryTabs({
  selectedCategory,
  onCategoryChange
}: {
  selectedCategory: string
  onCategoryChange: (category: string) => void
}) {
  const categories = ['all', ...Object.keys(CATEGORIES_CONFIG)] as const

  return (
    <div className="px-6 py-8 bg-[#FAF8F5]">
      <div className="max-w-7xl mx-auto">
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((category) => {
            const isActive = selectedCategory === category
            const isAll = category === 'all'
            const config = isAll ? null : CATEGORIES_CONFIG[category as CategorieFormation]
            const Icon = config?.icon || Filter

            return (
              <motion.button
                key={category}
                onClick={() => onCategoryChange(category)}
                className={`relative flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-primary text-white shadow-lg'
                    : 'bg-white text-[#777777] hover:bg-[#F4F0EB]'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Icon className="w-4 h-4" />
                <span>
                  {isAll ? 'Toutes' : config?.label}
                </span>
                {!isAll && (
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    isActive ? 'bg-[#FF5C00] text-white' : 'bg-[#EEEEEE] text-[#777777]'
                  }`}>
                    {config?.count}
                  </span>
                )}
                {isActive && (
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-1 bg-[#FF5C00] rounded-full"
                    layoutId="activeTab"
                  />
                )}
              </motion.button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// Composant Timeline Parcours Recommandé
function ParcoursTimeline() {
  return (
    <div className="px-6 py-16 bg-white">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-3xl font-heading font-bold text-accent mb-4">
            Parcours de Formation Recommandé
          </h2>
          <p className="text-[#777777] text-lg">
            Un cheminement logique pour développer votre expertise étape par étape
          </p>
        </motion.div>

        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-1/2 transform -translate-x-1/2 w-0.5 bg-gradient-to-b from-primary to-accent h-full hidden lg:block" />

          <div className="space-y-12 lg:space-y-16">
            {PARCOURS_RECOMMANDE.map((etape, index) => (
              <motion.div
                key={etape.etape}
                className={`flex items-center ${index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'}`}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.2 }}
              >
                {/* Content */}
                <div className="flex-1 lg:px-8">
                  <div className="bg-white rounded-xl p-6 shadow-lg border border-[#F4F0EB]">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-primary to-[#FF2D78] rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {etape.etape}
                      </div>
                      <div>
                        <h3 className="text-xl font-heading font-bold text-accent">
                          {etape.niveau}
                        </h3>
                        <p className="text-[#777777]">{etape.description}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {etape.formations.map((formationSlug) => {
                        const formation = FORMATIONS_ENRICHIES.find(f => f.slug === formationSlug)
                        if (!formation) return null

                        return (
                          <span
                            key={formationSlug}
                            className="px-3 py-1 bg-[#FFF0E5] text-primary rounded-full text-sm font-medium"
                          >
                            {formation.nom}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Timeline dot (desktop) */}
                <div className="hidden lg:block w-6 h-6 bg-primary rounded-full border-4 border-white shadow-lg z-10" />

                {/* Spacer */}
                <div className="flex-1 lg:px-8" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Composant Card Formation
function FormationCard({
  formation,
  onClick
}: {
  formation: FormationEnriched
  onClick: () => void
}) {
  const config = CATEGORIES_CONFIG[formation.categorie]
  const Icon = config.icon

  return (
    <motion.div
      className="bg-white rounded-xl shadow-lg border border-[#F4F0EB] overflow-hidden group cursor-pointer"
      variants={itemVariants}
      whileHover={{ scale: 1.02, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
      onClick={onClick}
    >
      {/* Image placeholder avec gradient */}
      <div className={`h-48 bg-gradient-to-br ${config.color} relative overflow-hidden`}>
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute top-4 left-4">
          <span className="px-3 py-1 bg-white/90 text-[#1A1A1A] rounded-full text-sm font-medium">
            {config.label}
          </span>
        </div>
        <div className="absolute bottom-4 right-4">
          <Icon className="w-12 h-12 text-white/80" />
        </div>
      </div>

      {/* Contenu */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-xl font-heading font-bold text-accent group-hover:text-primary transition-colors">
            {formation.nom}
          </h3>
          <span className="text-2xl font-bold text-primary">
            {formation.prix}
          </span>
        </div>

        <div className="flex items-center gap-4 mb-4 text-[#777777]">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span className="text-sm">{formation.duree}</span>
          </div>
        </div>

        {/* Mini ROI preview */}
        {formation.roi.seuilRentabiliteSeances > 0 && (
          <div className="bg-[#ECFDF5] border border-[#10B981]/30 rounded-lg p-3 mb-4">
            <div className="text-sm text-[#10B981]">
              <TrendingUp className="w-4 h-4 inline mr-1" />
              Rentabilisé en {formation.roi.seuilRentabiliteSeances} séances
            </div>
          </div>
        )}

        <button className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-[#E65200] transition-colors group-hover:bg-[#E65200]">
          Voir détails
          <ChevronRight className="w-4 h-4 inline ml-1" />
        </button>
      </div>
    </motion.div>
  )
}

// Composant Calculateur ROI
function ROICalculator({ formation }: { formation: FormationEnriched }) {
  const [clientsParSemaine, setClientsParSemaine] = useState(3)

  const calculations = useMemo(() => {
    if (formation.roi.seuilRentabiliteSeances === 0) {
      return {
        gainMensuel: 0,
        gainAnnuel: 0,
        tempsAmortissement: formation.roi.tempsAmortissement
      }
    }

    const seancesParMois = clientsParSemaine * 4
    const gainBrutParSeance = formation.roi.prixVenteMoyen - formation.roi.coutConsommablesParSeance
    const gainMensuel = seancesParMois * gainBrutParSeance
    const gainAnnuel = gainMensuel * 12
    const moisAmortissement = Math.ceil(formation.roi.coutFormation / gainMensuel)

    return {
      gainMensuel,
      gainAnnuel,
      tempsAmortissement: `${moisAmortissement} mois`
    }
  }, [formation, clientsParSemaine])

  if (formation.roi.seuilRentabiliteSeances === 0) {
    return (
      <div className="bg-[#FFF3E8] border border-[#FF8C42]/30 rounded-lg p-6">
        <h4 className="font-bold text-[#FF8C42] mb-2">Formation Réglementaire</h4>
        <p className="text-[#FF8C42]">{formation.roi.tempsAmortissement}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-[#3A3A3A] mb-2">
          Nombre de clientes par semaine
        </label>
        <input
          type="range"
          min="1"
          max="10"
          value={clientsParSemaine}
          onChange={(e) => setClientsParSemaine(parseInt(e.target.value))}
          className="w-full h-2 bg-[#EEEEEE] rounded-lg appearance-none cursor-pointer slider"
        />
        <div className="flex justify-between text-sm text-[#777777] mt-1">
          <span>1</span>
          <span className="font-bold text-primary">{clientsParSemaine}</span>
          <span>10</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          className="bg-[#FFF0E5] border border-[#FF5C00]/30 rounded-lg p-4 text-center"
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 0.3 }}
          key={calculations.gainMensuel}
        >
          <div className="text-2xl font-bold text-[#FF5C00]">
            {calculations.gainMensuel.toLocaleString('fr-FR')}€
          </div>
          <div className="text-sm text-[#FF5C00]">Gain mensuel</div>
        </motion.div>

        <motion.div
          className="bg-[#ECFDF5] border border-[#10B981]/30 rounded-lg p-4 text-center"
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 0.3, delay: 0.1 }}
          key={calculations.gainAnnuel}
        >
          <div className="text-2xl font-bold text-[#10B981]">
            {calculations.gainAnnuel.toLocaleString('fr-FR')}€
          </div>
          <div className="text-sm text-[#10B981]">Gain annuel</div>
        </motion.div>

        <motion.div
          className="bg-[#FFE0EF] border border-[#FF2D78]/30 rounded-lg p-4 text-center"
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 0.3, delay: 0.2 }}
          key={calculations.tempsAmortissement}
        >
          <div className="text-2xl font-bold text-[#FF2D78]">
            {calculations.tempsAmortissement}
          </div>
          <div className="text-sm text-[#FF2D78]">Amortissement</div>
        </motion.div>
      </div>

      {/* Barre de progression */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-[#777777]">
          <span>Progression vers rentabilité</span>
          <span>{Math.min(100, Math.round((clientsParSemaine * 4 / formation.roi.seuilRentabiliteSeances) * 100))}%</span>
        </div>
        <div className="w-full bg-[#EEEEEE] rounded-full h-3">
          <motion.div
            className="bg-gradient-to-r from-primary to-green-500 h-3 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, (clientsParSemaine * 4 / formation.roi.seuilRentabiliteSeances) * 100)}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>
    </div>
  )
}

// Composant Modal Détail Formation
function FormationDetailModal({
  formation,
  isOpen,
  onClose
}: {
  formation: FormationEnriched | null
  isOpen: boolean
  onClose: () => void
}) {
  const [activeTab, setActiveTab] = useState<TabDetail>('technique')

  if (!formation) return null

  const tabs = [
    { id: 'technique', label: 'Technique', icon: BookOpen },
    { id: 'roi', label: 'ROI', icon: Calculator },
    { id: 'faq', label: 'FAQ', icon: Users },
    { id: 'reglementation', label: 'Réglementation', icon: AlertTriangle },
  ] as const

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-x-4 top-4 bottom-4 bg-white rounded-xl shadow-2xl z-50 overflow-hidden md:inset-x-auto md:left-1/2 md:transform md:-translate-x-1/2 md:w-full md:max-w-4xl md:max-h-[90vh]"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-[#EEEEEE]">
              <div>
                <h2 className="text-2xl font-heading font-bold text-accent">
                  {formation.nom}
                </h2>
                <div className="flex items-center gap-4 mt-2 text-[#777777]">
                  <span>{formation.duree}</span>
                  <span>•</span>
                  <span className="font-bold text-primary">{formation.prix}</span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-[#F4F0EB] rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[#EEEEEE]">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-3 text-sm font-medium relative ${
                      isActive
                        ? 'text-primary border-b-2 border-primary'
                        : 'text-[#777777] hover:text-[#111111]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                )
              })}
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-96">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {activeTab === 'technique' && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-bold text-accent mb-3">Description technique</h3>
                        <p className="text-[#3A3A3A] leading-relaxed">{formation.descriptionTechnique}</p>
                      </div>

                      {formation.techniquesComparees.length > 0 && (
                        <div>
                          <h3 className="text-lg font-bold text-accent mb-3">Techniques comparées</h3>
                          <div className="overflow-x-auto">
                            <table className="w-full border border-[#EEEEEE] rounded-lg">
                              <thead className="bg-[#FAF8F5]">
                                <tr>
                                  <th className="px-4 py-2 text-left">Technique</th>
                                  <th className="px-4 py-2 text-left">Méthode</th>
                                  <th className="px-4 py-2 text-left">Rendu</th>
                                  <th className="px-4 py-2 text-left">Peau idéale</th>
                                </tr>
                              </thead>
                              <tbody>
                                {formation.techniquesComparees.map((technique, index) => (
                                  <tr key={index} className="border-t border-[#EEEEEE]">
                                    <td className="px-4 py-2 font-medium">{technique.nom}</td>
                                    <td className="px-4 py-2">{technique.methode}</td>
                                    <td className="px-4 py-2">{technique.rendu}</td>
                                    <td className="px-4 py-2">{technique.peauIdeale}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {formation.materiel.length > 0 && (
                        <div>
                          <h3 className="text-lg font-bold text-accent mb-3">Matériel nécessaire</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {formation.materiel.map((item, index) => (
                              <div key={index} className="border border-[#EEEEEE] rounded-lg p-4">
                                <h4 className="font-bold text-[#111111] mb-2">{item.nom}</h4>
                                <p className="text-[#777777] text-sm mb-2">{item.description}</p>
                                <p className="text-primary font-bold mb-2">{item.prixIndicatif}</p>
                                <div className="flex flex-wrap gap-1">
                                  {item.avantages.map((avantage, i) => (
                                    <span key={i} className="px-2 py-1 bg-[#D1FAE5] text-[#10B981] text-xs rounded-full">
                                      {avantage}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'roi' && (
                    <ROICalculator formation={formation} />
                  )}

                  {activeTab === 'faq' && (
                    <div className="space-y-4">
                      {formation.faq.map((item, index) => (
                        <details key={index} className="border border-[#EEEEEE] rounded-lg">
                          <summary className="px-4 py-3 font-medium text-[#111111] cursor-pointer hover:bg-[#FAF8F5]">
                            {item.question}
                          </summary>
                          <div className="px-4 py-3 border-t border-[#EEEEEE] text-[#3A3A3A]">
                            {item.reponse}
                          </div>
                        </details>
                      ))}
                    </div>
                  )}

                  {activeTab === 'reglementation' && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-bold text-accent mb-3">Réglementation</h3>
                        <p className="text-[#3A3A3A] leading-relaxed">{formation.reglementation}</p>
                      </div>

                      {formation.contreIndications.length > 0 && (
                        <div>
                          <h3 className="text-lg font-bold text-[#FF2D78] mb-3 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5" />
                            Contre-indications
                          </h3>
                          <ul className="space-y-2">
                            {formation.contreIndications.map((item, index) => (
                              <li key={index} className="flex items-center gap-2 text-[#FF2D78]">
                                <div className="w-2 h-2 bg-[#FF2D78] rounded-full" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {formation.publicCible.length > 0 && (
                        <div>
                          <h3 className="text-lg font-bold text-accent mb-3">Public cible</h3>
                          <ul className="space-y-2">
                            {formation.publicCible.map((item, index) => (
                              <li key={index} className="flex items-center gap-2 text-[#3A3A3A]">
                                <div className="w-2 h-2 bg-[#10B981] rounded-full" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// Composant Glossaire
function GlossaireSection() {
  const [searchTerm, setSearchTerm] = useState('')

  // Récupérer tous les termes du glossaire
  const allTerms = useMemo(() => {
    const terms: Array<{ terme: string; definition: string }> = []
    FORMATIONS_ENRICHIES.forEach(formation => {
      formation.glossaire.forEach(item => {
        if (!terms.find(t => t.terme === item.terme)) {
          terms.push(item)
        }
      })
    })
    return terms.sort((a, b) => a.terme.localeCompare(b.terme))
  }, [])

  const filteredTerms = useMemo(() => {
    if (!searchTerm) return allTerms
    return allTerms.filter(item =>
      item.terme.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.definition.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [allTerms, searchTerm])

  return (
    <div className="px-6 py-16 bg-[#FAF8F5]">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-3xl font-heading font-bold text-accent mb-4">
            Glossaire Technique
          </h2>
          <p className="text-[#777777] text-lg mb-8">
            Tous les termes techniques de l'esthétique professionnelle
          </p>

          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#999999] w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher un terme..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-10 py-3 border border-[#EEEEEE] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {filteredTerms.map((item, index) => (
            <motion.div
              key={item.terme}
              className="bg-white rounded-lg p-6 shadow-lg border border-[#F4F0EB]"
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
            >
              <h3 className="text-lg font-bold text-accent mb-2">
                {item.terme}
              </h3>
              <p className="text-[#777777]">
                {item.definition}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {filteredTerms.length === 0 && (
          <div className="text-center text-[#777777] py-12">
            Aucun terme trouvé pour "{searchTerm}"
          </div>
        )}
      </div>
    </div>
  )
}

// Composant Tableau ROI Comparatif
function ROIComparatifTable() {
  const [sortColumn, setSortColumn] = useState<string>('')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const sortedData = useMemo(() => {
    if (!sortColumn) return TABLEAU_ROI_COMPARATIF

    return [...TABLEAU_ROI_COMPARATIF].sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortColumn) {
        case 'formation':
          aValue = a.formation
          bValue = b.formation
          break
        case 'cout':
          aValue = a.cout
          bValue = b.cout
          break
        case 'prixSeance':
          aValue = a.prixSeance
          bValue = b.prixSeance
          break
        default:
          return 0
      }

      if (typeof aValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }

      return sortDirection === 'asc'
        ? aValue - bValue
        : bValue - aValue
    })
  }, [sortColumn, sortDirection])

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  return (
    <div className="px-6 py-16 bg-white">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-3xl font-heading font-bold text-accent mb-4">
            Comparatif ROI des Formations
          </h2>
          <p className="text-[#777777] text-lg">
            Analyse comparative pour optimiser votre investissement formation
          </p>
        </motion.div>

        <div className="overflow-x-auto">
          <table className="w-full border border-[#EEEEEE] rounded-lg bg-white shadow-lg">
            <thead className="bg-[#FAF8F5]">
              <tr>
                <th
                  className="px-6 py-4 text-left cursor-pointer hover:bg-[#F4F0EB]"
                  onClick={() => handleSort('formation')}
                >
                  <div className="flex items-center gap-2">
                    Formation
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </th>
                <th
                  className="px-6 py-4 text-left cursor-pointer hover:bg-[#F4F0EB]"
                  onClick={() => handleSort('cout')}
                >
                  <div className="flex items-center gap-2">
                    Coût formation
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </th>
                <th
                  className="px-6 py-4 text-left cursor-pointer hover:bg-[#F4F0EB]"
                  onClick={() => handleSort('prixSeance')}
                >
                  <div className="flex items-center gap-2">
                    Prix séance
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </th>
                <th className="px-6 py-4 text-left">Rentabilité</th>
                <th className="px-6 py-4 text-left">Particularité</th>
              </tr>
            </thead>
            <tbody>
              {sortedData.map((row, index) => (
                <motion.tr
                  key={row.formation}
                  className="border-t border-[#EEEEEE] hover:bg-[#FAF8F5]"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <td className="px-6 py-4 font-medium text-accent">
                    {row.formation}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-lg font-bold text-[#111111]">
                      {row.cout}€
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {row.prixSeance > 0 ? (
                      <span className="text-lg font-bold text-primary">
                        {row.prixSeance}€
                      </span>
                    ) : (
                      <span className="text-[#999999]">N/A</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-[#D1FAE5] text-[#10B981] rounded-full text-sm font-medium">
                      {row.rentabilite}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[#777777]">
                    {row.particularite}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// Composant principal
export default function CatalogueFormationsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedFormation, setSelectedFormation] = useState<FormationEnriched | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Formations filtrées
  const filteredFormations = useMemo(() => {
    let formations = FORMATIONS_ENRICHIES

    // Filtre par catégorie
    if (selectedCategory !== 'all') {
      formations = getFormationsByCategorie(selectedCategory as CategorieFormation)
    }

    // Filtre par recherche
    if (searchTerm) {
      formations = formations.filter(formation =>
        formation.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        formation.descriptionTechnique.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    return formations
  }, [selectedCategory, searchTerm])

  const openFormationDetail = (formation: FormationEnriched) => {
    setSelectedFormation(formation)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedFormation(null)
  }

  return (
    <div className="space-y-0">
      {/* KPIs temps réel */}
      <FormationsKPIs />

      {/* Hero Section */}
      <HeroSection searchTerm={searchTerm} onSearchChange={setSearchTerm} />

      {/* Category Tabs */}
      <CategoryTabs
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

      {/* Parcours Timeline */}
      <ParcoursTimeline />

      {/* Grid Formations */}
      <div className="px-6 py-16 bg-[#FAF8F5]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-heading font-bold text-accent mb-4">
              Nos Formations
            </h2>
            <p className="text-[#777777] text-lg">
              {filteredFormations.length} formation{filteredFormations.length > 1 ? 's' : ''}
              {selectedCategory !== 'all' && ` en ${CATEGORIES_CONFIG[selectedCategory as CategorieFormation]?.label}`}
              {searchTerm && ` pour "${searchTerm}"`}
            </p>
          </div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {filteredFormations.map((formation) => (
              <FormationCard
                key={formation.slug}
                formation={formation}
                onClick={() => openFormationDetail(formation)}
              />
            ))}
          </motion.div>

          {filteredFormations.length === 0 && (
            <div className="text-center text-[#777777] py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-bold mb-2">Aucune formation trouvée</h3>
              <p>Essayez de modifier vos critères de recherche</p>
            </div>
          )}
        </div>
      </div>

      {/* Tableau ROI Comparatif */}
      <ROIComparatifTable />

      {/* Glossaire */}
      <GlossaireSection />

      {/* Modal Détail Formation */}
      <FormationDetailModal
        formation={selectedFormation}
        isOpen={isModalOpen}
        onClose={closeModal}
      />
    </div>
  )
}