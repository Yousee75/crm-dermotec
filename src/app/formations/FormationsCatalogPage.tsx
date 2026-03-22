'use client'

import { useQuery } from '@tanstack/react-query'
import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase-client'
import type { Formation } from '@/types'
import { CATEGORIES_FORMATION } from '@/types'
import {
  Clock,
  Users,
  Euro,
  Search,
  ChevronRight,
  Star,
  Award,
  Target,
  Palette,
  Heart,
  Sun,
  Zap,
  Flower2,
  ShieldCheck,
  Phone,
  MessageCircle,
  CheckCircle,
  Tag
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

const categoryIcons = {
  'Dermo-Esthétique': Palette,
  'Dermo-Correctrice': Heart,
  'Soins Visage': Sun,
  'Laser & IPL': Zap,
  'Soins Corps': Flower2,
  'Hygiène': ShieldCheck
}

const categoryColors = {
  'Dermo-Esthétique': '#E11D48',
  'Dermo-Correctrice': '#DB2777',
  'Soins Visage': '#F59E0B',
  'Laser & IPL': '#7C3AED',
  'Soins Corps': '#10B981',
  'Hygiène': '#3B82F6'
}

export default function FormationsCatalogPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const supabase = createClient()

  // Fetch formations avec React Query
  const { data: formations = [], isLoading } = useQuery({
    queryKey: ['formations-catalog'],
    queryFn: async () => {
      const { data } = await supabase
        .from('formations')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      return data || []
    }
  })

  // Filtrage côté client
  const filteredFormations = useMemo(() => {
    let filtered = formations

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(formation => formation.categorie === selectedCategory)
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(formation =>
        formation.nom.toLowerCase().includes(searchLower) ||
        formation.description?.toLowerCase().includes(searchLower) ||
        formation.description_commerciale?.toLowerCase().includes(searchLower) ||
        formation.categorie.toLowerCase().includes(searchLower)
      )
    }

    return filtered
  }, [formations, selectedCategory, searchTerm])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-accent to-[#0F3A6E] flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-blue-100">Chargement des formations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* HERO SECTION */}
      <section className="relative bg-gradient-to-br from-accent to-[#0F3A6E] text-white py-20 overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 -right-32 w-80 h-80 bg-primary rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary rounded-full blur-2xl opacity-30"></div>
        </div>

        <div className="relative container mx-auto px-4 max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center space-y-8"
          >
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-['Bricolage_Grotesque'] leading-tight">
                Nos Formations
              </h1>
              <p className="text-lg md:text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
                Centre de formation esthétique certifié Qualiopi — {formations.length} formations professionnelles
              </p>
            </div>

            {/* Badges trust indicators */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap justify-center items-center gap-6 text-sm"
            >
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                <Award size={18} className="text-primary" />
                <span className="font-medium">Certifié Qualiopi</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                <Euro size={18} className="text-primary" />
                <span className="font-medium">Finançable OPCO / France Travail</span>
              </div>
            </motion.div>

            {/* Barre de recherche */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="max-w-md mx-auto"
            >
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Rechercher une formation..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white text-gray-900 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-[#082545] shadow-lg text-lg"
                />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* FILTRES CATÉGORIES */}
      <section className="py-6 bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
        <div className="container mx-auto px-4 max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-3 overflow-x-auto scrollbar-hide"
          >
            {/* Chip "Toutes" */}
            <button
              onClick={() => setSelectedCategory('all')}
              className={`
                flex-shrink-0 px-4 py-2 rounded-full font-medium transition-all duration-300 text-sm
                ${selectedCategory === 'all'
                  ? 'bg-primary text-white shadow-lg transform scale-105'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              Toutes <span className="ml-1 text-xs opacity-75">({formations.length})</span>
            </button>

            {/* Chips catégories */}
            {CATEGORIES_FORMATION.map((category) => {
              const count = formations.filter(f => f.categorie === category.id).length
              if (count === 0) return null

              const IconComponent = categoryIcons[category.id as keyof typeof categoryIcons]
              const isActive = selectedCategory === category.id

              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`
                    flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all duration-300 text-sm
                    ${isActive
                      ? 'text-white shadow-lg transform scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }
                  `}
                  style={{
                    backgroundColor: isActive ? category.color : undefined
                  }}
                >
                  <IconComponent size={14} />
                  <span>{category.label}</span>
                  <span className="text-xs opacity-75">({count})</span>
                </button>
              )
            })}
          </motion.div>

          {/* Results count */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-4 text-sm text-gray-600"
          >
            <span className="font-medium">{filteredFormations.length}</span> formation{filteredFormations.length !== 1 ? 's' : ''}
            {searchTerm && <span> pour "{searchTerm}"</span>}
            {selectedCategory !== 'all' && (
              <span> • Catégorie "{CATEGORIES_FORMATION.find(c => c.id === selectedCategory)?.label}"</span>
            )}
          </motion.div>
        </div>
      </section>

      {/* GRID DE FORMATIONS */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 max-w-7xl">
          <AnimatePresence mode="wait">
            {filteredFormations.length > 0 ? (
              <motion.div
                key="formations-grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {filteredFormations.map((formation, index) => {
                  const categoryInfo = CATEGORIES_FORMATION.find(c => c.id === formation.categorie)
                  const IconComponent = categoryIcons[formation.categorie as keyof typeof categoryIcons]
                  const isFinancable = formation.prix_ht >= 500

                  return (
                    <motion.div
                      key={formation.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                      whileHover={{ scale: 1.02, y: -4 }}
                      className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
                    >
                      {/* Badge catégorie */}
                      <div className="relative">
                        <div className="h-2" style={{ backgroundColor: categoryInfo?.color || 'var(--color-primary)' }}></div>
                        <div className="absolute top-3 left-4">
                          <div
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white shadow-lg"
                            style={{ backgroundColor: categoryInfo?.color || 'var(--color-primary)' }}
                          >
                            {IconComponent && <IconComponent size={12} />}
                            {formation.categorie}
                          </div>
                        </div>
                      </div>

                      {/* Contenu card */}
                      <div className="p-6 space-y-4">
                        <div className="space-y-3">
                          <h3 className="text-lg font-bold text-gray-900 group-hover:text-accent transition-colors font-['Bricolage_Grotesque'] leading-tight">
                            {formation.nom}
                          </h3>

                          <p className="text-gray-600 text-sm leading-relaxed line-clamp-2 min-h-[2.5rem]">
                            {formation.description_commerciale || formation.description || "Formation professionnelle certifiante"}
                          </p>
                        </div>

                        {/* Infos formation */}
                        <div className="flex items-center justify-between text-sm text-gray-500 py-2 border-t border-gray-100">
                          <div className="flex items-center gap-1">
                            <Clock size={14} />
                            <span>{formation.duree_jours} jour{formation.duree_jours > 1 ? 's' : ''} • {formation.duree_heures}h</span>
                          </div>
                          <div className="px-2 py-1 bg-gray-100 rounded-full text-xs font-medium">
                            {formation.niveau.charAt(0).toUpperCase() + formation.niveau.slice(1)}
                          </div>
                        </div>

                        {/* Prix et CTA */}
                        <div className="space-y-3 pt-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-2xl font-bold text-accent">
                                À partir de {formation.prix_ht}€
                              </div>
                              <div className="text-xs text-gray-500">HT</div>
                            </div>

                            {isFinancable && (
                              <div className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                                <CheckCircle size={12} />
                                Finançable
                              </div>
                            )}
                          </div>

                          <Link
                            href={`/formations/${formation.slug}`}
                            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-semibold transition-all duration-300 group/btn"
                          >
                            En savoir plus
                            <ChevronRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                          </Link>
                        </div>

                        {/* Aperçu compétences */}
                        {formation.competences_acquises && formation.competences_acquises.length > 0 && (
                          <div className="pt-3 border-t border-gray-100">
                            <div className="flex flex-wrap gap-1">
                              {formation.competences_acquises.slice(0, 2).map((competence: string, idx: number) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-accent rounded-md text-xs font-medium"
                                >
                                  <Target size={10} />
                                  {competence}
                                </span>
                              ))}
                              {formation.competences_acquises.length > 2 && (
                                <span className="px-2 py-1 bg-gray-50 text-gray-500 rounded-md text-xs">
                                  +{formation.competences_acquises.length - 2} autre{formation.competences_acquises.length > 3 ? 's' : ''}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </motion.div>
            ) : (
              <motion.div
                key="no-results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="text-center py-16"
              >
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2 font-['Bricolage_Grotesque']">
                  Aucune formation trouvée
                </h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Essayez de modifier vos critères de recherche ou parcourez toutes nos formations
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => {
                      setSearchTerm('')
                      setSelectedCategory('all')
                    }}
                    className="px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors font-semibold"
                  >
                    Voir toutes les formations
                  </button>
                  <a
                    href="tel:0188334343"
                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold"
                  >
                    Nous contacter
                  </a>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* SECTION CTA BOTTOM */}
      <section className="py-16 bg-gradient-to-r from-accent to-[#0F3A6E] text-white">
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            <div className="space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold font-['Bricolage_Grotesque']">
                Vous avez des questions ?
              </h2>
              <p className="text-lg text-blue-100 max-w-2xl mx-auto leading-relaxed">
                Notre équipe vous aide à choisir la formation la plus adaptée à votre projet professionnel
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="tel:0188334343"
                className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                <Phone size={20} />
                01 88 33 43 43
              </a>
              <a
                href="https://wa.me/33188334343?text=Bonjour ! Je souhaite des conseils pour choisir ma formation esthétique."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-3 px-8 py-4 border-2 border-white text-white hover:bg-white hover:text-accent rounded-2xl font-bold text-lg transition-all duration-300"
              >
                <MessageCircle size={20} />
                WhatsApp
              </a>
            </div>

            <div className="text-sm text-blue-100 space-y-2">
              <p className="flex items-center justify-center gap-4 flex-wrap">
                <span>✓ Réponse rapide</span>
                <span>✓ Conseils personnalisés</span>
                <span>✓ Financement possible jusqu'à 100%</span>
              </p>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}