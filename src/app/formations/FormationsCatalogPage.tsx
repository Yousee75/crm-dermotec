'use client'

import { useQuery } from '@tanstack/react-query'
import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase-client'
import type { Formation } from '@/types'
import { CATEGORIES_FORMATION } from '@/types'
import {
  Clock,
  Search,
  ChevronRight,
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
  Calendar,
  Users,
  Euro,
  Star,
  Filter,
  X
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

const categoryIcons: Record<string, typeof Palette> = {
  'Dermo-Esthétique': Palette,
  'Dermo-Correctrice': Heart,
  'Soins Visage': Sun,
  'Laser & IPL': Zap,
  'Soins Corps': Flower2,
  'Hygiène': ShieldCheck
}

type FinancementFilter = 'all' | 'opco' | 'cpf' | 'france_travail'

export default function FormationsCatalogPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [financementFilter, setFinancementFilter] = useState<FinancementFilter>('all')
  const [showFilters, setShowFilters] = useState(false)

  const supabase = createClient()

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

  // Fetch prochaines sessions pour afficher sur les cards
  const { data: nextSessions = [] } = useQuery({
    queryKey: ['formations-next-sessions'],
    queryFn: async () => {
      const { data } = await supabase
        .from('sessions')
        .select('id, formation_id, date_debut, places_max, places_occupees, statut')
        .in('statut', ['PLANIFIEE', 'CONFIRMEE'])
        .gte('date_debut', new Date().toISOString())
        .order('date_debut', { ascending: true })
      return data || []
    }
  })

  // Map formation_id → prochaine session
  const sessionsByFormation = useMemo(() => {
    const map: Record<string, typeof nextSessions[0]> = {}
    for (const s of nextSessions) {
      if (!map[s.formation_id]) {
        map[s.formation_id] = s
      }
    }
    return map
  }, [nextSessions])

  const filteredFormations = useMemo(() => {
    let filtered = formations

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(f => f.categorie === selectedCategory)
    }

    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(f =>
        f.nom.toLowerCase().includes(search) ||
        f.description?.toLowerCase().includes(search) ||
        f.description_commerciale?.toLowerCase().includes(search) ||
        f.categorie.toLowerCase().includes(search)
      )
    }

    // Filtre financement (toutes les formations > 500€ sont finançables)
    if (financementFilter !== 'all') {
      filtered = filtered.filter(f => f.prix_ht >= 500)
    }

    return filtered
  }, [formations, selectedCategory, searchTerm, financementFilter])

  const activeFiltersCount = [
    selectedCategory !== 'all',
    financementFilter !== 'all',
    searchTerm.trim() !== ''
  ].filter(Boolean).length

  if (isLoading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#FAF8F5' }}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: '#FF5C00' }} />
            <p style={{ color: '#3A3A3A' }}>Chargement des formations...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAF8F5' }}>
      {/* ═══════════════════════════════════════════════════════ */}
      {/* HERO — Fond papier chaud, pas de gradient sombre       */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section className="relative py-20 overflow-hidden" style={{ backgroundColor: '#111111' }}>
        {/* Glow orange subtil */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] rounded-full blur-[120px]" style={{ backgroundColor: '#FF5C00' }} />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full blur-[100px]" style={{ backgroundColor: '#FF2D78' }} />
        </div>

        <div className="relative container mx-auto px-4 max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-center space-y-8"
          >
            {/* Badge Qualiopi */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold" style={{ backgroundColor: 'rgba(255, 92, 0, 0.15)', color: '#FF8C42' }}>
              <Award size={16} />
              Centre certifié Qualiopi — N° {formations.length} formations
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-white" style={{ fontFamily: 'var(--font-heading, "Bricolage Grotesque", serif)' }}>
              Formations Esthétique
              <br />
              <span style={{ color: '#FF5C00' }}>Professionnelles</span>
            </h1>

            <p className="text-lg md:text-xl max-w-3xl mx-auto leading-relaxed" style={{ color: '#999999' }}>
              Maîtrisez les techniques les plus demandées. Financement OPCO, CPF, France Travail possible jusqu'à 100%.
            </p>

            {/* Trust indicators */}
            <div className="flex flex-wrap justify-center items-center gap-4 text-sm">
              {[
                { icon: Award, text: 'Certifié Qualiopi' },
                { icon: Star, text: '4.9/5 — 87 avis' },
                { icon: Users, text: '+500 stagiaires formées' },
                { icon: Euro, text: 'Finançable jusqu\'à 100%' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)', color: '#CCCCCC' }}>
                  <item.icon size={14} style={{ color: '#FF5C00' }} />
                  <span>{item.text}</span>
                </div>
              ))}
            </div>

            {/* Barre de recherche */}
            <div className="max-w-lg mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2" size={20} style={{ color: '#999999' }} />
                <input
                  type="text"
                  placeholder="Rechercher une formation..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl text-lg focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: '#FFFFFF',
                    color: '#111111',
                    boxShadow: '0 12px 32px rgba(255, 92, 0, 0.15)',
                    // @ts-expect-error -- CSS custom property
                    '--tw-ring-color': '#FF5C00'
                  }}
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-[#F4F0EB]"
                  >
                    <X size={16} style={{ color: '#999999' }} />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* FILTRES — Catégories + Financement                     */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section className="py-4 sticky top-0 z-30 border-b" style={{ backgroundColor: '#FFFFFF', borderColor: '#EEEEEE' }}>
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex items-center gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {/* Toutes */}
            <button
              onClick={() => setSelectedCategory('all')}
              className="flex-shrink-0 px-4 py-2 rounded-full font-medium text-sm transition-all"
              style={{
                backgroundColor: selectedCategory === 'all' ? '#FF5C00' : '#F4F0EB',
                color: selectedCategory === 'all' ? '#FFFFFF' : '#3A3A3A',
              }}
            >
              Toutes ({formations.length})
            </button>

            {CATEGORIES_FORMATION.map((cat) => {
              const count = formations.filter(f => f.categorie === cat.id).length
              if (count === 0) return null
              const Icon = categoryIcons[cat.id]
              const isActive = selectedCategory === cat.id

              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all"
                  style={{
                    backgroundColor: isActive ? cat.color : '#F4F0EB',
                    color: isActive ? '#FFFFFF' : '#3A3A3A',
                  }}
                >
                  {Icon && <Icon size={14} />}
                  {cat.label} ({count})
                </button>
              )
            })}

            {/* Séparateur */}
            <div className="flex-shrink-0 w-px h-6 mx-1" style={{ backgroundColor: '#EEEEEE' }} />

            {/* Filtre financement */}
            {(['opco', 'cpf', 'france_travail'] as const).map((f) => {
              const label = { opco: 'OPCO', cpf: 'CPF', france_travail: 'France Travail' }[f]
              const isActive = financementFilter === f
              return (
                <button
                  key={f}
                  onClick={() => setFinancementFilter(isActive ? 'all' : f)}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full font-medium text-xs transition-all"
                  style={{
                    backgroundColor: isActive ? '#10B981' : '#F4F0EB',
                    color: isActive ? '#FFFFFF' : '#3A3A3A',
                  }}
                >
                  <Euro size={12} />
                  {label}
                </button>
              )
            })}
          </div>

          {/* Compteur résultats */}
          <div className="mt-3 flex items-center justify-between text-sm" style={{ color: '#777777' }}>
            <span>
              <strong style={{ color: '#111111' }}>{filteredFormations.length}</strong> formation{filteredFormations.length !== 1 ? 's' : ''}
              {searchTerm && <span> pour « {searchTerm} »</span>}
            </span>
            {activeFiltersCount > 0 && (
              <button
                onClick={() => {
                  setSelectedCategory('all')
                  setFinancementFilter('all')
                  setSearchTerm('')
                }}
                className="flex items-center gap-1 text-xs font-medium hover:underline"
                style={{ color: '#FF5C00' }}
              >
                <X size={12} />
                Réinitialiser les filtres
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* GRILLE FORMATIONS — Cards premium                      */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section className="py-12">
        <div className="container mx-auto px-4 max-w-7xl">
          <AnimatePresence mode="wait">
            {filteredFormations.length > 0 ? (
              <motion.div
                key="grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {filteredFormations.map((formation, index) => {
                  const cat = CATEGORIES_FORMATION.find(c => c.id === formation.categorie)
                  const Icon = categoryIcons[formation.categorie]
                  const nextSession = sessionsByFormation[formation.id]
                  const isFinancable = formation.prix_ht >= 500
                  const placesRestantes = nextSession
                    ? nextSession.places_max - nextSession.places_occupees
                    : null
                  const placesPercent = nextSession
                    ? ((nextSession.places_occupees / nextSession.places_max) * 100)
                    : 0

                  return (
                    <motion.div
                      key={formation.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: Math.min(index * 0.08, 0.4) }}
                    >
                      <Link
                        href={`/formations/${formation.slug}`}
                        className="group block rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1"
                        style={{
                          backgroundColor: '#FFFFFF',
                          border: '1px solid #EEEEEE',
                          boxShadow: '0 1px 4px rgba(26, 26, 26, 0.04)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.boxShadow = '0 12px 32px rgba(255, 92, 0, 0.14)'
                          e.currentTarget.style.borderColor = 'rgba(255, 92, 0, 0.2)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.boxShadow = '0 1px 4px rgba(26, 26, 26, 0.04)'
                          e.currentTarget.style.borderColor = '#EEEEEE'
                        }}
                      >
                        {/* Barre catégorie top */}
                        <div className="h-1.5" style={{ backgroundColor: cat?.color || '#FF5C00' }} />

                        <div className="p-6 space-y-4">
                          {/* Header : catégorie + niveau */}
                          <div className="flex items-center justify-between">
                            <div
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold text-white"
                              style={{ backgroundColor: cat?.color || '#FF5C00' }}
                            >
                              {Icon && <Icon size={11} />}
                              {formation.categorie}
                            </div>
                            <span
                              className="px-2 py-0.5 rounded-full text-xs font-medium"
                              style={{ backgroundColor: '#F4F0EB', color: '#3A3A3A' }}
                            >
                              {formation.niveau === 'debutant' ? 'Débutant' :
                               formation.niveau === 'intermediaire' ? 'Intermédiaire' : 'Confirmé'}
                            </span>
                          </div>

                          {/* Titre + description */}
                          <div className="space-y-2">
                            <h3
                              className="text-lg font-bold leading-tight group-hover:text-[#FF5C00] transition-colors"
                              style={{ color: '#111111', fontFamily: 'var(--font-heading, "Bricolage Grotesque", serif)' }}
                            >
                              {formation.nom}
                            </h3>
                            <p className="text-sm leading-relaxed line-clamp-2" style={{ color: '#3A3A3A' }}>
                              {formation.description_commerciale || formation.description || 'Formation professionnelle certifiante'}
                            </p>
                          </div>

                          {/* Infos : durée + Qualiopi */}
                          <div className="flex items-center gap-4 text-sm" style={{ color: '#777777' }}>
                            <span className="flex items-center gap-1">
                              <Clock size={14} />
                              {formation.duree_jours}j • {formation.duree_heures}h
                            </span>
                            <span className="flex items-center gap-1">
                              <Award size={14} style={{ color: '#FF5C00' }} />
                              Qualiopi
                            </span>
                          </div>

                          {/* Prochaine session + jauge places */}
                          {nextSession && (
                            <div className="p-3 rounded-xl space-y-2" style={{ backgroundColor: '#FAF8F5' }}>
                              <div className="flex items-center justify-between text-xs">
                                <span className="flex items-center gap-1.5 font-medium" style={{ color: '#111111' }}>
                                  <Calendar size={12} style={{ color: '#FF5C00' }} />
                                  {new Date(nextSession.date_debut).toLocaleDateString('fr-FR', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric'
                                  })}
                                </span>
                                <span
                                  className="font-semibold"
                                  style={{ color: placesRestantes !== null && placesRestantes < 3 ? '#FF2D78' : '#10B981' }}
                                >
                                  {placesRestantes} place{placesRestantes !== null && placesRestantes !== 1 ? 's' : ''}
                                </span>
                              </div>
                              {/* Jauge visuelle */}
                              <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#EDE8E0' }}>
                                <div
                                  className="h-full rounded-full transition-all duration-500"
                                  style={{
                                    width: `${placesPercent}%`,
                                    backgroundColor: placesPercent > 80 ? '#FF2D78' : placesPercent > 50 ? '#FF8C42' : '#10B981'
                                  }}
                                />
                              </div>
                            </div>
                          )}

                          {/* Séparateur */}
                          <div className="h-px" style={{ backgroundColor: '#EEEEEE' }} />

                          {/* Prix + badges financement + CTA */}
                          <div className="flex items-end justify-between">
                            <div>
                              <div className="text-2xl font-bold" style={{ color: '#111111' }}>
                                {formation.prix_ht}€ <span className="text-sm font-normal" style={{ color: '#777777' }}>HT</span>
                              </div>
                              {isFinancable && (
                                <div className="flex items-center gap-1 mt-1">
                                  <CheckCircle size={12} style={{ color: '#10B981' }} />
                                  <span className="text-xs font-medium" style={{ color: '#10B981' }}>Finançable OPCO / CPF</span>
                                </div>
                              )}
                            </div>

                            <div
                              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all group-hover:scale-105"
                              style={{ backgroundColor: '#FF5C00' }}
                            >
                              Découvrir
                              <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                            </div>
                          </div>

                          {/* Compétences preview */}
                          {formation.competences_acquises && formation.competences_acquises.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-1">
                              {formation.competences_acquises.slice(0, 2).map((comp, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium"
                                  style={{ backgroundColor: '#FFF0E5', color: '#E65200' }}
                                >
                                  <Target size={9} />
                                  {comp}
                                </span>
                              ))}
                              {formation.competences_acquises.length > 2 && (
                                <span className="px-2 py-0.5 rounded-md text-xs" style={{ backgroundColor: '#F4F0EB', color: '#777777' }}>
                                  +{formation.competences_acquises.length - 2}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </Link>
                    </motion.div>
                  )
                })}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-center py-20"
              >
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#F4F0EB' }}>
                  <Search size={28} style={{ color: '#999999' }} />
                </div>
                <h3 className="text-xl font-bold mb-2" style={{ color: '#111111', fontFamily: 'var(--font-heading)' }}>
                  Aucune formation trouvée
                </h3>
                <p className="mb-6 max-w-md mx-auto" style={{ color: '#3A3A3A' }}>
                  Essayez de modifier vos critères ou parcourez toutes nos formations
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => {
                      setSearchTerm('')
                      setSelectedCategory('all')
                      setFinancementFilter('all')
                    }}
                    className="px-6 py-3 rounded-xl font-semibold text-white transition-colors"
                    style={{ backgroundColor: '#FF5C00' }}
                  >
                    Voir toutes les formations
                  </button>
                  <a
                    href="tel:0188334343"
                    className="px-6 py-3 rounded-xl font-semibold transition-colors"
                    style={{ border: '2px solid #EEEEEE', color: '#111111' }}
                  >
                    Nous contacter
                  </a>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* SECTION CONFIANCE — Chiffres clés                      */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section className="py-16" style={{ backgroundColor: '#FFFFFF' }}>
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '500+', label: 'Stagiaires formées', color: '#FF5C00' },
              { value: '4.9/5', label: 'Note Google', color: '#FF2D78' },
              { value: '96%', label: 'Taux de satisfaction', color: '#10B981' },
              { value: '90%', label: 'Financées OPCO/CPF', color: '#FF8C42' },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="text-3xl md:text-4xl font-bold mb-1" style={{ color: stat.color, fontFamily: 'var(--font-heading)' }}>
                  {stat.value}
                </div>
                <div className="text-sm" style={{ color: '#777777' }}>{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* CTA BOTTOM — Contact                                   */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section className="py-16" style={{ backgroundColor: '#111111' }}>
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div className="space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                Besoin d'aide pour choisir ?
              </h2>
              <p className="text-lg max-w-2xl mx-auto leading-relaxed" style={{ color: '#999999' }}>
                Notre équipe vous accompagne dans le choix de la formation et le montage du dossier de financement
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="tel:0188334343"
                className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-bold text-lg text-white transition-all hover:scale-105"
                style={{ backgroundColor: '#FF5C00', boxShadow: '0 0 24px rgba(255, 92, 0, 0.25)' }}
              >
                <Phone size={20} />
                01 88 33 43 43
              </a>
              <a
                href="https://wa.me/33188334343?text=Bonjour ! Je souhaite des conseils pour choisir ma formation esthétique."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-3 px-8 py-4 border-2 border-white/20 text-white rounded-2xl font-bold text-lg transition-all hover:bg-white/10"
              >
                <MessageCircle size={20} />
                WhatsApp
              </a>
            </div>

            <div className="text-sm flex items-center justify-center gap-4 flex-wrap" style={{ color: '#777777' }}>
              <span>✓ Réponse sous 24h</span>
              <span>✓ Conseils personnalisés</span>
              <span>✓ Financement possible 100%</span>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
