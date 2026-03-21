'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-client'
import type { Formation } from '@/types'
import { CATEGORIES_FORMATION } from '@/types'
import {
  Clock,
  Users,
  Euro,
  Filter,
  Search,
  ChevronRight,
  Star,
  Award,
  Target,
  Sparkles,
  Heart,
  Sun,
  Zap,
  Flower2,
  ShieldCheck
} from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'

const categoryIcons = {
  'Dermo-Esthétique': Sparkles,
  'Dermo-Correctrice': Heart,
  'Soins Visage': Sun,
  'Laser & IPL': Zap,
  'Soins Corps': Flower2,
  'Hygiène': ShieldCheck
}

export default function FormationsCatalogPage() {
  const [formations, setFormations] = useState<Formation[]>([])
  const [filteredFormations, setFilteredFormations] = useState<Formation[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const supabase = createClient()

  useEffect(() => {
    async function fetchFormations() {
      try {
        const { data } = await supabase
          .from('formations')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true })

        if (data) {
          setFormations(data)
          setFilteredFormations(data)
        }
      } catch (error) {
        console.error('Error fetching formations:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchFormations()
  }, [supabase])

  useEffect(() => {
    let filtered = formations

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(formation => formation.categorie === selectedCategory)
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(formation =>
        formation.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        formation.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        formation.categorie.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredFormations(filtered)
  }, [formations, selectedCategory, searchTerm])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2EC6F3] mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des formations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* HERO SECTION */}
      <section className="relative bg-gradient-to-br from-[#082545] to-[#0F3460] text-white py-20">
        <div className="absolute inset-0 bg-black/20"></div>

        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/4 -left-20 w-96 h-96 bg-[#2EC6F3] rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-[#2EC6F3] rounded-full blur-3xl"></div>
        </div>

        <div className="relative container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl md:text-6xl font-bold font-['Bricolage_Grotesque'] leading-tight mb-6">
                Formations d'Excellence
                <span className="block text-[#2EC6F3]">Esthétique & Dermo</span>
              </h1>
              <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto leading-relaxed">
                Découvrez nos {formations.length} formations certifiées Qualiopi pour développer votre expertise et booster votre carrière
              </p>
            </motion.div>

            {/* Trust indicators */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-wrap justify-center items-center gap-8 text-sm"
            >
              <div className="flex items-center gap-2">
                <Award size={20} className="text-[#2EC6F3]" />
                <span>Certifié Qualiopi</span>
              </div>
              <div className="flex items-center gap-2">
                <Star size={20} className="text-[#2EC6F3]" />
                <span>4.9/5 - 87 avis</span>
              </div>
              <div className="flex items-center gap-2">
                <Target size={20} className="text-[#2EC6F3]" />
                <span>+500 stagiaires formées</span>
              </div>
              <div className="flex items-center gap-2">
                <Euro size={20} className="text-[#2EC6F3]" />
                <span>Financement possible</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FILTERS SECTION */}
      <section className="py-8 bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Rechercher une formation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2EC6F3] focus:border-transparent"
              />
            </div>

            {/* Category filters */}
            <div className="flex flex-wrap gap-2 items-center">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Filter size={16} />
                <span className="font-medium">Catégories :</span>
              </div>

              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === 'all'
                    ? 'bg-[#2EC6F3] text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Toutes ({formations.length})
              </button>

              {CATEGORIES_FORMATION.map((category) => {
                const count = formations.filter(f => f.categorie === category.id).length
                if (count === 0) return null

                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                      selectedCategory === category.id
                        ? 'bg-[#2EC6F3] text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category.label} ({count})
                  </button>
                )
              })}
            </div>
          </div>

          {/* Results count */}
          <div className="mt-4 text-sm text-gray-600">
            {filteredFormations.length} formation{filteredFormations.length !== 1 ? 's' : ''} trouvée{filteredFormations.length !== 1 ? 's' : ''}
            {searchTerm && (
              <span> pour "{searchTerm}"</span>
            )}
            {selectedCategory !== 'all' && (
              <span> dans la catégorie "{CATEGORIES_FORMATION.find(c => c.id === selectedCategory)?.label}"</span>
            )}
          </div>
        </div>
      </section>

      {/* FORMATIONS GRID */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          {filteredFormations.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {filteredFormations.map((formation, index) => {
                const categoryInfo = CATEGORIES_FORMATION.find(c => c.id === formation.categorie)
                const IconComponent = categoryIcons[formation.categorie as keyof typeof categoryIcons]

                return (
                  <motion.div
                    key={formation.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="group bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden transform hover:-translate-y-1"
                  >
                    {/* Card Image/Header */}
                    <div className="relative h-48 bg-gradient-to-br from-[#082545] to-[#0F3460] overflow-hidden">
                      {formation.image_url ? (
                        <img
                          src={formation.image_url}
                          alt={formation.nom}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white">
                          {IconComponent && <IconComponent size={48} className="text-[#2EC6F3]" />}
                        </div>
                      )}

                      {/* Category badge */}
                      <div
                        className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-semibold text-white"
                        style={{ backgroundColor: categoryInfo?.color || '#2EC6F3' }}
                      >
                        {formation.categorie}
                      </div>

                      {/* Level badge */}
                      <div className="absolute top-4 right-4 px-2 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium text-white">
                        {formation.niveau.charAt(0).toUpperCase() + formation.niveau.slice(1)}
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-6 space-y-4">
                      <div>
                        <h3 className="font-bold text-xl text-gray-900 mb-2 group-hover:text-[#2EC6F3] transition-colors">
                          {formation.nom}
                        </h3>
                        <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">
                          {formation.description_commerciale || formation.description || "Formation professionnelle certifiante"}
                        </p>
                      </div>

                      {/* Formation details */}
                      <div className="flex items-center justify-between text-sm text-gray-600 py-2 border-t border-gray-100">
                        <div className="flex items-center gap-1">
                          <Clock size={16} />
                          <span>{formation.duree_jours} jour{formation.duree_jours > 1 ? 's' : ''}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users size={16} />
                          <span>{formation.places_max} places max</span>
                        </div>
                      </div>

                      {/* Price and CTA */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div>
                          <div className="text-2xl font-bold text-[#082545]">
                            {formation.prix_ht}€
                          </div>
                          <div className="text-xs text-gray-500">HT • Financement possible</div>
                        </div>

                        <Link
                          href={`/formations/${formation.slug}`}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-[#2EC6F3] hover:bg-[#0EA5E9] text-white rounded-lg font-semibold transition-colors group"
                        >
                          En savoir plus
                          <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                      </div>

                      {/* Skills preview */}
                      {formation.competences_acquises && formation.competences_acquises.length > 0 && (
                        <div className="pt-3">
                          <div className="flex flex-wrap gap-1">
                            {formation.competences_acquises.slice(0, 2).map((competence, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 bg-blue-50 text-[#082545] rounded text-xs font-medium"
                              >
                                {competence}
                              </span>
                            ))}
                            {formation.competences_acquises.length > 2 && (
                              <span className="px-2 py-1 bg-gray-50 text-gray-600 rounded text-xs">
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
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Aucune formation trouvée
              </h3>
              <p className="text-gray-600 mb-6">
                Essayez de modifier vos critères de recherche
              </p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => {
                    setSearchTerm('')
                    setSelectedCategory('all')
                  }}
                  className="px-6 py-2 bg-[#2EC6F3] text-white rounded-lg hover:bg-[#0EA5E9] transition-colors"
                >
                  Voir toutes les formations
                </button>
                <a
                  href="tel:0188334343"
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Nous contacter
                </a>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="py-16 bg-gradient-to-r from-[#082545] to-[#0F3460] text-white">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-4"
            >
              <h2 className="text-3xl md:text-4xl font-bold font-['Bricolage_Grotesque']">
                Besoin de conseils ?
              </h2>
              <p className="text-lg text-blue-100">
                Notre équipe vous aide à choisir la formation la plus adaptée à votre projet professionnel
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              viewport={{ once: true }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <a
                href="tel:0188334343"
                className="inline-flex items-center px-8 py-4 bg-[#2EC6F3] hover:bg-[#0EA5E9] text-white rounded-lg font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                📞 01 88 33 43 43
              </a>
              <a
                href="https://wa.me/33188334343?text=Bonjour ! Je souhaite des conseils pour choisir ma formation esthétique."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-8 py-4 border-2 border-white text-white hover:bg-white hover:text-[#082545] rounded-lg font-bold text-lg transition-all duration-300"
              >
                💬 WhatsApp
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              viewport={{ once: true }}
              className="text-sm text-blue-100"
            >
              <p>Réponse rapide • Conseils personnalisés • Étude de financement</p>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  )
}