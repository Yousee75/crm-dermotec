'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/infra/supabase-client'
import type { Formation, Session } from '@/types'
import { StickyBottomBar } from '@/components/ui/StickyBottomBar'
import { WhatsAppButton } from '@/components/ui/WhatsAppButton'
import { ChatWidget } from '@/components/ui/ChatWidget'
import {
  Clock,
  Users,
  Calendar,
  CheckCircle,
  Star,
  Phone,
  MessageCircle,
  Euro,
  Award,
  Target,
  MapPin,
  CreditCard,
  ChevronDown,
  ChevronRight,
  Timer,
  TrendingUp,
  BookOpen,
  Sparkles,
  ArrowRight,
  Play,
  Shield,
  Heart,
  GraduationCap,
  Package,
  Video,
  FileText,
  HelpCircle,
  Layers
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

interface FormationClientPageProps {
  slug: string
}

interface ProgrammeModule {
  id: string
  titre: string
  description?: string
  ordre: number
  duree_minutes?: number
  jour_formation?: number
  contenus_count: number
}

const contenTypeIcons: Record<string, typeof Video> = {
  video: Video,
  pdf: FileText,
  quiz: HelpCircle,
  texte: BookOpen,
  exercice: Target,
}

export default function FormationClientPage({ slug }: FormationClientPageProps) {
  const [formation, setFormation] = useState<Formation | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [modules, setModules] = useState<ProgrammeModule[]>([])
  const [formatrice, setFormatrice] = useState<{ prenom: string; nom: string; specialite?: string; photo_url?: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [openModule, setOpenModule] = useState<number | null>(0)
  const heroCta = useRef<HTMLDivElement>(null)

  const supabase = createClient()

  useEffect(() => {
    async function fetchData() {
      if (!slug) return
      try {
        const { data: formationData } = await supabase
          .from('formations')
          .select('*')
          .eq('slug', slug)
          .eq('is_active', true)
          .single()

        if (formationData) {
          setFormation(formationData)

          // Fetch sessions, modules, formatrice en parallele
          const [sessionsRes, modulesRes] = await Promise.all([
            supabase
              .from('sessions')
              .select(`*, formatrice:equipe(prenom, nom, specialite, photo_url)`)
              .eq('formation_id', formationData.id)
              .in('statut', ['PLANIFIEE', 'CONFIRMEE'])
              .gte('date_debut', new Date().toISOString())
              .order('date_debut', { ascending: true })
              .limit(6),
            supabase
              .from('formation_modules')
              .select('id, titre, description, ordre, duree_minutes, jour_formation')
              .eq('formation_id', formationData.id)
              .eq('is_published', true)
              .order('ordre', { ascending: true })
          ])

          const sessionsData = sessionsRes.data || []
          setSessions(sessionsData)

          // Modules avec count contenus
          const modulesData = modulesRes.data || []
          if (modulesData.length > 0) {
            const { data: contenusCount } = await supabase
              .from('formation_contenus')
              .select('module_id')
              .in('module_id', modulesData.map((m: any) => m.id))
              .eq('is_published', true)
            const countMap: Record<string, number> = {}
            for (const c of contenusCount || []) {
              countMap[c.module_id] = (countMap[c.module_id] || 0) + 1
            }
            setModules(modulesData.map((m: any) => ({ ...m, contenus_count: countMap[m.id] || 0 })))
          }

          // Formatrice depuis la premiere session
          if (sessionsData[0]?.formatrice) {
            setFormatrice(sessionsData[0].formatrice as any)
          }
        }
      } catch (error) {
        // Formation non trouvée ou erreur réseau — affichera l'écran "non trouvée"
        setFormation(null)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [slug, supabase])

  const scrollToSessions = () => {
    document.getElementById('sessions')?.scrollIntoView({ behavior: 'smooth' })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FAF8F5' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: '#FF5C00' }} />
          <p style={{ color: '#3A3A3A' }}>Chargement...</p>
        </div>
      </div>
    )
  }

  if (!formation) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FAF8F5' }}>
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4" style={{ color: '#111111' }}>Formation non trouvée</h1>
          <p className="mb-8" style={{ color: '#3A3A3A' }}>Cette formation n'existe pas ou n'est plus disponible.</p>
          <Link href="/formations" className="px-6 py-3 rounded-xl text-white font-semibold" style={{ backgroundColor: '#FF5C00' }}>
            Voir toutes les formations
          </Link>
        </div>
      </div>
    )
  }

  const nearestSession = sessions[0]
  const remainingPlaces = nearestSession ? nearestSession.places_max - nearestSession.places_occupees : 0

  const faqItems = [
    {
      question: 'Comment se passe le financement ?',
      answer: 'Nous vous accompagnons dans toutes vos démarches : OPCO, CPF, France Travail, paiement en 3x/4x sans frais. Plus de 90% de nos stagiaires sont financées.'
    },
    {
      question: 'Quels sont les prérequis ?',
      answer: formation.prerequis || 'Aucun prérequis spécifique. Cette formation est accessible aux débutantes comme aux professionnelles.'
    },
    {
      question: 'Où se déroule la formation ?',
      answer: '75 Boulevard Richard Lenoir, 75011 Paris. Métro Bastille (1, 5, 8) ou Saint-Ambroise (9). Locaux modernes et équipés.'
    },
    {
      question: 'Quel matériel est fourni ?',
      answer: formation.materiel_inclus
        ? `Tout le matériel professionnel est inclus. ${formation.materiel_details || 'Vous repartez avec votre kit complet.'}`
        : 'Le matériel est mis à disposition. Liste envoyée avant la formation.'
    },
    {
      question: 'Y a-t-il un certificat ?',
      answer: 'Oui ! Certificat de formation professionnelle reconnu. Dermotec est certifié Qualiopi, gage de qualité nationale.'
    },
    {
      question: 'Paiement en plusieurs fois ?',
      answer: '3x ou 4x sans frais, ou paiement personnalisé. Nous trouvons toujours une solution adaptée.'
    }
  ]

  const financements = [
    { icon: Award, name: 'OPCO', tag: 'Jusqu\'à 100%', desc: 'Pour les salariées (OPCO EP, AKTO...)' },
    { icon: Target, name: 'CPF', tag: 'Éligible', desc: 'Vos droits formation acquis' },
    { icon: TrendingUp, name: 'France Travail', tag: 'AIF', desc: 'Aide individuelle à la formation' },
    { icon: CreditCard, name: '3x / 4x', tag: 'Sans frais', desc: 'Paiement échelonné avec Alma' },
  ]

  // Calcul ROI estime
  const roiData = {
    prixFormation: formation.prix_ht,
    prixSeanceMoyen: formation.prix_ht < 800 ? 60 : formation.prix_ht < 1500 ? 80 : 120,
    seancesParSemaine: 3,
    get roiSemaines() {
      return Math.ceil(this.prixFormation / (this.prixSeanceMoyen * this.seancesParSemaine))
    },
    get revenuAnnuel() {
      return this.prixSeanceMoyen * this.seancesParSemaine * 48
    }
  }

  // Programme : modules DB si disponibles, sinon objectifs
  const hasRealModules = modules.length > 0
  const programmeItems = hasRealModules
    ? modules.map(m => ({
        id: m.id,
        title: m.titre,
        description: m.description || 'Théorie et pratique avec feedback personnalisé.',
        day: m.jour_formation ? `Jour ${m.jour_formation}` : undefined,
        duration: m.duree_minutes,
        contenusCount: m.contenus_count,
      }))
    : (formation.objectifs || []).map((obj, i) => ({
        id: String(i),
        title: obj,
        description: 'Théorie et pratique sur modèles. Mise en situation professionnelle avec feedback personnalisé de la formatrice.',
        day: `Jour ${Math.floor(i / Math.max(1, Math.ceil((formation.objectifs?.length || 1) / formation.duree_jours))) + 1}`,
        duration: undefined as number | undefined,
        contenusCount: 0,
      }))

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAF8F5' }}>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* HERO — Compact, impactant, fond noir + glow orange      */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section className="relative py-16 md:py-24 overflow-hidden" style={{ backgroundColor: '#111111' }}>
        <div className="absolute inset-0 opacity-15">
          <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] rounded-full blur-[120px]" style={{ backgroundColor: '#FF5C00' }} />
          <div className="absolute bottom-1/4 right-1/3 w-[300px] h-[300px] rounded-full blur-[80px]" style={{ backgroundColor: '#FF2D78' }} />
        </div>

        <div className="relative container mx-auto px-4 max-w-5xl">
          {/* Breadcrumb */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-sm mb-8"
            style={{ color: '#777777' }}
          >
            <Link href="/formations" className="hover:text-white transition-colors">Formations</Link>
            <ChevronRight size={14} />
            <span style={{ color: '#FF8C42' }}>{formation.categorie}</span>
          </motion.div>

          <div className="grid lg:grid-cols-5 gap-12 items-start">
            {/* Colonne gauche — Contenu */}
            <div className="lg:col-span-3 space-y-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                {/* Badge catégorie */}
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white mb-4"
                  style={{ backgroundColor: '#FF5C00' }}>
                  <GraduationCap size={12} />
                  {formation.categorie}
                </span>

                <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight mb-4"
                  style={{ fontFamily: 'var(--font-heading, "Bricolage Grotesque", serif)' }}>
                  {formation.nom}
                </h1>

                <p className="text-lg leading-relaxed" style={{ color: '#CCCCCC' }}>
                  {formation.description_commerciale || formation.description || 'Maîtrisez les techniques professionnelles avec nos expertes certifiées.'}
                </p>
              </motion.div>

              {/* Stats rapides */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex flex-wrap gap-4"
              >
                {[
                  { icon: Clock, value: `${formation.duree_jours}j · ${formation.duree_heures}h`, label: 'Durée' },
                  { icon: Users, value: `${formation.places_max} max`, label: 'Petit groupe' },
                  { icon: MapPin, value: 'Paris 11e', label: 'Lieu' },
                  { icon: Award, value: 'Qualiopi', label: 'Certifié' },
                ].map((s, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
                    <s.icon size={16} style={{ color: '#FF5C00' }} />
                    <div>
                      <div className="text-sm font-semibold text-white">{s.value}</div>
                      <div className="text-xs" style={{ color: '#777777' }}>{s.label}</div>
                    </div>
                  </div>
                ))}
              </motion.div>

              {/* Trust bar */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-4 text-sm pt-2"
                style={{ color: '#999999' }}
              >
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} className="fill-current" style={{ color: '#FF8C42' }} />
                  ))}
                  <span className="ml-1 font-semibold text-white">4.9/5</span>
                </div>
                <span>·</span>
                <span>87 avis Google</span>
                <span>·</span>
                <span>+500 formées</span>
              </motion.div>
            </div>

            {/* Colonne droite — Card prix / CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              ref={heroCta}
              className="lg:col-span-2"
            >
              <div className="rounded-2xl p-6 space-y-5" style={{
                backgroundColor: '#1A1A1A',
                border: '1px solid rgba(255,92,0,0.2)',
                boxShadow: '0 0 40px rgba(255, 92, 0, 0.1)'
              }}>
                {/* Prix */}
                <div>
                  <div className="text-3xl font-bold text-white">
                    {formation.prix_ht}€ <span className="text-sm font-normal" style={{ color: '#777777' }}>HT</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-sm" style={{ color: '#999999' }}>
                    <CreditCard size={14} />
                    ou 3x {Math.ceil(formation.prix_ht / 3)}€ sans frais
                  </div>
                </div>

                {/* Prochaine session */}
                {nearestSession && (
                  <div className="p-3 rounded-xl" style={{ backgroundColor: 'rgba(255,92,0,0.08)' }}>
                    <div className="flex items-center gap-2 text-sm font-medium" style={{ color: '#FF8C42' }}>
                      <Calendar size={14} />
                      Prochaine session
                    </div>
                    <div className="text-white font-semibold mt-1">
                      {new Date(nearestSession.date_debut).toLocaleDateString('fr-FR', {
                        day: 'numeric', month: 'long', year: 'numeric'
                      })}
                    </div>
                    <div className="mt-1 text-xs font-semibold" style={{
                      color: remainingPlaces < 3 ? '#FF2D78' : '#10B981'
                    }}>
                      {remainingPlaces < 3
                        ? `🔥 Plus que ${remainingPlaces} place${remainingPlaces !== 1 ? 's' : ''} !`
                        : `${remainingPlaces} places disponibles`
                      }
                    </div>
                  </div>
                )}

                {/* CTA principal */}
                <button
                  onClick={scrollToSessions}
                  className="w-full py-4 rounded-xl font-bold text-lg text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{ backgroundColor: '#FF5C00', boxShadow: '0 0 24px rgba(255, 92, 0, 0.3)' }}
                >
                  Réserver ma place
                </button>

                {/* Contact */}
                <div className="flex items-center justify-center gap-4 text-sm" style={{ color: '#999999' }}>
                  <a href="tel:0188334343" className="flex items-center gap-1.5 hover:text-white transition-colors">
                    <Phone size={14} /> Appeler
                  </a>
                  <span>·</span>
                  <a href="https://wa.me/33188334343" target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 hover:text-white transition-colors">
                    <MessageCircle size={14} /> WhatsApp
                  </a>
                </div>

                {/* Badges financement */}
                <div className="flex flex-wrap gap-2 pt-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                  {['OPCO', 'CPF', 'France Travail', 'Alma 3x'].map(f => (
                    <span key={f} className="px-2 py-1 rounded-md text-xs font-medium"
                      style={{ backgroundColor: 'rgba(16,185,129,0.1)', color: '#10B981' }}>
                      ✓ {f}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* POUR QUI — Ciblage persona                             */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section className="py-16" style={{ backgroundColor: '#FFFFFF' }}>
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10" style={{ color: '#111111', fontFamily: 'var(--font-heading)' }}>
            Cette formation est faite pour vous si...
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            {[
              'Vous êtes esthéticienne et voulez vous spécialiser',
              'Vous souhaitez développer votre activité',
              'Vous êtes en reconversion professionnelle',
              'Vous gérez un institut de beauté',
              'Vous voulez maîtriser les dernières techniques',
              'Vous cherchez une formation certifiante Qualiopi',
              'Vous voulez augmenter vos revenus',
              'Vous privilégiez la qualité et l\'excellence',
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="flex items-start gap-3 p-3 rounded-xl transition-colors"
                style={{ backgroundColor: i % 2 === 0 ? '#FAF8F5' : 'transparent' }}
              >
                <CheckCircle size={20} className="mt-0.5 flex-shrink-0" style={{ color: '#10B981' }} />
                <span style={{ color: '#111111' }}>{item}</span>
              </motion.div>
            ))}
          </div>

          {formation.prerequis && (
            <div className="mt-8 p-4 rounded-xl" style={{ backgroundColor: '#FFF0E5', border: '1px solid #FFCAAA' }}>
              <h3 className="font-semibold mb-1" style={{ color: '#E65200' }}>Prérequis</h3>
              <p style={{ color: '#3A3A3A' }}>{formation.prerequis}</p>
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* PROGRAMME — Accordéon par objectif                      */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section className="py-16" style={{ backgroundColor: '#FAF8F5' }}>
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-3" style={{ color: '#111111', fontFamily: 'var(--font-heading)' }}>
              Ce que vous allez apprendre
            </h2>
            <p style={{ color: '#777777' }}>
              {formation.duree_jours} jour{formation.duree_jours > 1 ? 's' : ''} de formation intensive — {formation.duree_heures}h
            </p>
          </div>

          <div className="space-y-3">
            {programmeItems.length > 0 ? programmeItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="rounded-xl overflow-hidden"
                style={{ backgroundColor: '#FFFFFF', border: '1px solid #EEEEEE' }}
              >
                <button
                  onClick={() => setOpenModule(openModule === index ? null : index)}
                  className="w-full px-5 py-4 flex items-center gap-4 text-left transition-colors"
                  style={{ backgroundColor: openModule === index ? '#FFF0E5' : '#FFFFFF' }}
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                    style={{ backgroundColor: '#FF5C00' }}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold block" style={{ color: '#111111' }}>{item.title}</span>
                    <div className="flex items-center gap-3 mt-0.5 text-xs" style={{ color: '#777777' }}>
                      {item.day && <span>{item.day}</span>}
                      {item.duration && (
                        <span className="flex items-center gap-1">
                          <Clock size={10} />
                          {item.duration >= 60 ? `${Math.floor(item.duration / 60)}h${item.duration % 60 > 0 ? String(item.duration % 60).padStart(2, '0') : ''}` : `${item.duration}min`}
                        </span>
                      )}
                      {item.contenusCount > 0 && (
                        <span className="flex items-center gap-1">
                          <Layers size={10} />
                          {item.contenusCount} contenu{item.contenusCount > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronDown
                    size={18}
                    className="transition-transform flex-shrink-0"
                    style={{
                      color: '#777777',
                      transform: openModule === index ? 'rotate(180deg)' : 'rotate(0deg)'
                    }}
                  />
                </button>
                <AnimatePresence>
                  {openModule === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-4" style={{ paddingLeft: '4.25rem' }}>
                        <p className="text-sm" style={{ color: '#3A3A3A' }}>
                          {item.description}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )) : (
              <div className="text-center py-8" style={{ color: '#777777' }}>
                Programme détaillé envoyé lors de l'inscription
              </div>
            )}
          </div>

          {/* Compétences acquises */}
          {formation.competences_acquises && formation.competences_acquises.length > 0 && (
            <div className="mt-10">
              <h3 className="text-lg font-bold mb-4" style={{ color: '#111111' }}>Compétences acquises</h3>
              <div className="flex flex-wrap gap-2">
                {formation.competences_acquises.map((comp, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium"
                    style={{ backgroundColor: '#FFF0E5', color: '#E65200' }}>
                    <Target size={12} />
                    {comp}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* MATERIEL INCLUS                                         */}
      {/* ═══════════════════════════════════════════════════════ */}
      {formation.materiel_inclus && (
        <section className="py-16" style={{ backgroundColor: '#FFFFFF' }}>
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="flex items-start gap-6 p-6 rounded-2xl" style={{ backgroundColor: '#FFF0E5', border: '1px solid #FFCAAA' }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: '#FF5C00' }}>
                <Package size={28} className="text-white" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold" style={{ color: '#111111', fontFamily: 'var(--font-heading)' }}>
                  Kit matériel inclus
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: '#3A3A3A' }}>
                  {formation.materiel_details || 'Tout le matériel professionnel est fourni et inclus dans le prix. Vous repartez avec votre kit complet pour pratiquer immédiatement.'}
                </p>
                <div className="flex items-center gap-4 pt-2 text-xs font-medium flex-wrap" style={{ color: '#777777' }}>
                  <span className="flex items-center gap-1">
                    <CheckCircle size={12} style={{ color: '#10B981' }} />
                    Matériel professionnel
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle size={12} style={{ color: '#10B981' }} />
                    Kit personnel à conserver
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle size={12} style={{ color: '#10B981' }} />
                    Marques premium
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* ROI — Retour sur investissement                        */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section className="py-16" style={{ backgroundColor: formation.materiel_inclus ? '#FAF8F5' : '#FFFFFF' }}>
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: '#111111', fontFamily: 'var(--font-heading)' }}>
              Rentabilisez votre formation rapidement
            </h2>
            <p style={{ color: '#777777' }}>Un investissement qui se rembourse en quelques semaines</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center p-6 rounded-2xl"
              style={{ backgroundColor: '#FFFFFF', border: '1px solid #EEEEEE' }}
            >
              <div className="text-3xl font-bold mb-1" style={{ color: '#FF5C00', fontFamily: 'var(--font-heading)' }}>
                ~{roiData.roiSemaines} sem.
              </div>
              <div className="text-sm font-medium" style={{ color: '#111111' }}>Retour sur investissement</div>
              <div className="text-xs mt-1" style={{ color: '#777777' }}>
                avec {roiData.seancesParSemaine} séances/semaine
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-center p-6 rounded-2xl"
              style={{ backgroundColor: '#FFFFFF', border: '1px solid #EEEEEE' }}
            >
              <div className="text-3xl font-bold mb-1" style={{ color: '#10B981', fontFamily: 'var(--font-heading)' }}>
                {roiData.prixSeanceMoyen}€
              </div>
              <div className="text-sm font-medium" style={{ color: '#111111' }}>Prix moyen / séance</div>
              <div className="text-xs mt-1" style={{ color: '#777777' }}>
                Tarif constaté marché
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-center p-6 rounded-2xl"
              style={{ backgroundColor: '#FFFFFF', border: '1px solid #EEEEEE' }}
            >
              <div className="text-3xl font-bold mb-1" style={{ color: '#FF2D78', fontFamily: 'var(--font-heading)' }}>
                {(roiData.revenuAnnuel / 1000).toFixed(0)}k€
              </div>
              <div className="text-sm font-medium" style={{ color: '#111111' }}>Revenu annuel potentiel</div>
              <div className="text-xs mt-1" style={{ color: '#777777' }}>
                {roiData.seancesParSemaine} séances/sem × 48 sem
              </div>
            </motion.div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs" style={{ color: '#999999' }}>
              * Estimations basées sur les tarifs moyens du marché esthétique en France. Résultats variables selon l'activité.
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* PREUVES SOCIALES — Témoignages                         */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section className="py-16" style={{ backgroundColor: '#FFFFFF' }}>
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: '#111111', fontFamily: 'var(--font-heading)' }}>
              Elles nous font confiance
            </h2>
            <div className="flex items-center justify-center gap-2">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={20} className="fill-current" style={{ color: '#FF8C42' }} />
                ))}
              </div>
              <span className="text-xl font-bold" style={{ color: '#111111' }}>4.9/5</span>
              <span style={{ color: '#777777' }}>— 87 avis Google</span>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Sophie M.', role: 'Esthéticienne indépendante', quote: 'Formation exceptionnelle ! J\'ai pu ouvrir mon institut 2 mois après. L\'accompagnement est parfait.', formation: 'Dermo-Pigmentation' },
              { name: 'Marina L.', role: 'Gérante institut', quote: 'Formatrices au top, très professionnelles. J\'ai appris énormément de techniques. Je recommande à 100% !', formation: 'Microneedling' },
              { name: 'Claire D.', role: 'En reconversion', quote: 'Excellente formation, très complète. Le centre est magnifique et l\'équipe bienveillante. Un vrai tremplin.', formation: 'Laser & IPL' },
            ].map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-2xl"
                style={{ backgroundColor: '#FAF8F5', border: '1px solid #EEEEEE' }}
              >
                <div className="flex gap-0.5 mb-3">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} size={14} className="fill-current" style={{ color: '#FF8C42' }} />
                  ))}
                </div>
                <blockquote className="mb-4 leading-relaxed" style={{ color: '#3A3A3A' }}>
                  « {t.quote} »
                </blockquote>
                <div>
                  <div className="font-semibold" style={{ color: '#111111' }}>{t.name}</div>
                  <div className="text-xs" style={{ color: '#777777' }}>{t.role} · {t.formation}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* FINANCEMENT — 4 options                                */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section className="py-16" style={{ backgroundColor: '#FAF8F5' }}>
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: '#111111', fontFamily: 'var(--font-heading)' }}>
              Financement : on s'occupe de tout
            </h2>
            <p style={{ color: '#777777' }}>Plus de 90% de nos stagiaires bénéficient d'une prise en charge</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {financements.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="p-5 rounded-2xl text-center"
                style={{ backgroundColor: '#FFFFFF', border: '1px solid #EEEEEE' }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3"
                  style={{ backgroundColor: '#FFF0E5' }}>
                  <f.icon size={20} style={{ color: '#FF5C00' }} />
                </div>
                <h3 className="font-bold mb-1" style={{ color: '#111111' }}>{f.name}</h3>
                <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold mb-2"
                  style={{ backgroundColor: '#D1FAE5', color: '#10B981' }}>
                  {f.tag}
                </span>
                <p className="text-xs" style={{ color: '#777777' }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-8">
            <a
              href="https://wa.me/33188334343?text=Bonjour, je souhaite vérifier mon éligibilité au financement"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold transition-all hover:scale-105"
              style={{ backgroundColor: '#25D366' }}
            >
              <MessageCircle size={18} />
              Vérifier mon éligibilité
            </a>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* SESSIONS — Inscription directe                         */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section id="sessions" className="py-16" style={{ backgroundColor: '#FFFFFF' }}>
        <div className="container mx-auto px-4 max-w-5xl">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10" style={{ color: '#111111', fontFamily: 'var(--font-heading)' }}>
            Prochaines sessions
          </h2>

          {/* Urgence */}
          {nearestSession && remainingPlaces < 4 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="p-4 rounded-xl mb-8 text-center"
              style={{ backgroundColor: '#FFF0F5', border: '1px solid #FFE0EF' }}
            >
              <span className="font-semibold" style={{ color: '#FF2D78' }}>
                🔥 Plus que {remainingPlaces} place{remainingPlaces !== 1 ? 's' : ''} pour la prochaine session !
              </span>
            </motion.div>
          )}

          {sessions.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sessions.map((session, index) => {
                const places = session.places_max - session.places_occupees
                const dateDebut = new Date(session.date_debut)
                const dateFin = new Date(session.date_fin)

                return (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.08 }}
                    className="p-5 rounded-2xl space-y-4"
                    style={{ backgroundColor: '#FAF8F5', border: '1px solid #EEEEEE' }}
                  >
                    {/* Date */}
                    <div>
                      <div className="flex items-center gap-2 text-sm font-medium" style={{ color: '#111111' }}>
                        <Calendar size={16} style={{ color: '#FF5C00' }} />
                        {dateDebut.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                      </div>
                      {dateDebut.toDateString() !== dateFin.toDateString() && (
                        <div className="text-xs ml-6" style={{ color: '#777777' }}>
                          au {dateFin.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5 text-sm" style={{ color: '#3A3A3A' }}>
                      <div className="flex items-center gap-2">
                        <Clock size={14} style={{ color: '#777777' }} />
                        {session.horaire_debut} - {session.horaire_fin}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin size={14} style={{ color: '#777777' }} />
                        {session.salle || 'Paris 11e'}
                      </div>
                      {session.formatrice && (
                        <div className="flex items-center gap-2">
                          <Users size={14} style={{ color: '#777777' }} />
                          {session.formatrice.prenom} {session.formatrice.nom}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold" style={{ color: places < 3 ? '#FF2D78' : '#10B981' }}>
                        {places} place{places !== 1 ? 's' : ''} restante{places !== 1 ? 's' : ''}
                      </span>
                      <span className="text-lg font-bold" style={{ color: '#111111' }}>
                        {formation.prix_ht}€ <span className="text-xs font-normal" style={{ color: '#777777' }}>HT</span>
                      </span>
                    </div>

                    <button
                      onClick={() => window.open(`/inscription?formation=${formation.id}&session=${session.id}`, '_blank')}
                      className="w-full py-3 rounded-xl font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
                      style={{ backgroundColor: '#FF5C00' }}
                    >
                      S'inscrire
                    </button>
                  </motion.div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar size={40} style={{ color: '#999999' }} className="mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2" style={{ color: '#111111' }}>Aucune session programmée</h3>
              <p className="mb-6" style={{ color: '#777777' }}>Contactez-nous pour être informée des prochaines dates</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a href="tel:0188334343" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-white"
                  style={{ backgroundColor: '#111111' }}>
                  <Phone size={16} /> 01 88 33 43 43
                </a>
                <a href="https://wa.me/33188334343" target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-white"
                  style={{ backgroundColor: '#25D366' }}>
                  <MessageCircle size={16} /> WhatsApp
                </a>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* FORMATEUR — Section confiance (données réelles si dispo)*/}
      {/* ═══════════════════════════════════════════════════════ */}
      <section className="py-16" style={{ backgroundColor: '#111111' }}>
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold mb-4"
                style={{ backgroundColor: 'rgba(255,92,0,0.15)', color: '#FF8C42' }}>
                <Heart size={12} />
                {formatrice ? 'Votre formatrice' : 'Notre équipe'}
              </span>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
                {formatrice
                  ? `${formatrice.prenom} ${formatrice.nom}`
                  : 'Des formatrices expertes et passionnées'
                }
              </h2>
              <p className="leading-relaxed mb-6" style={{ color: '#999999' }}>
                {formatrice?.specialite
                  ? `Spécialiste en ${formatrice.specialite}. Professionnelle en exercice avec une expertise terrain reconnue. Elle partage son savoir-faire dans une ambiance bienveillante et exigeante.`
                  : 'Nos formatrices sont des professionnelles en exercice avec plus de 10 ans d\'expérience. Elles partagent leur savoir-faire et leurs techniques dans une ambiance bienveillante.'
                }
              </p>
              <div className="space-y-3">
                {[
                  '10+ ans d\'expérience terrain',
                  'Formatrice certifiée Qualiopi',
                  'Suivi personnalisé post-formation',
                  'Pratique sur modèles réels',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle size={16} style={{ color: '#10B981' }} />
                    <span className="text-sm text-white">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-center">
              {formatrice?.photo_url ? (
                <div className="w-64 h-64 rounded-2xl overflow-hidden" style={{
                  border: '2px solid rgba(255,92,0,0.3)',
                  boxShadow: '0 0 40px rgba(255,92,0,0.15)'
                }}>
                  <img
                    src={formatrice.photo_url}
                    alt={`${formatrice.prenom} ${formatrice.nom}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-64 h-64 rounded-2xl flex items-center justify-center" style={{
                  backgroundColor: '#1A1A1A',
                  border: '1px solid rgba(255,92,0,0.2)',
                  boxShadow: '0 0 40px rgba(255,92,0,0.1)'
                }}>
                  <div className="text-center">
                    <GraduationCap size={48} style={{ color: '#FF5C00' }} className="mx-auto mb-3" />
                    <div className="text-2xl font-bold text-white">
                      {formatrice ? `${formatrice.prenom} ${formatrice.nom.charAt(0)}.` : '10+ ans'}
                    </div>
                    <div className="text-sm" style={{ color: '#777777' }}>
                      {formatrice ? 'Formatrice certifiée' : 'd\'expertise'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* FAQ — Accordéon                                        */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section className="py-16" style={{ backgroundColor: '#FAF8F5' }}>
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10" style={{ color: '#111111', fontFamily: 'var(--font-heading)' }}>
            Questions fréquentes
          </h2>

          <div className="space-y-3">
            {faqItems.map((item, index) => (
              <div
                key={index}
                className="rounded-xl overflow-hidden"
                style={{ backgroundColor: '#FFFFFF', border: '1px solid #EEEEEE' }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-5 py-4 text-left flex items-center justify-between transition-colors"
                  style={{ backgroundColor: openFaq === index ? '#FFF0E5' : '#FFFFFF' }}
                >
                  <span className="font-semibold" style={{ color: '#111111' }}>{item.question}</span>
                  <ChevronDown
                    size={18}
                    className="flex-shrink-0 transition-transform"
                    style={{
                      color: '#777777',
                      transform: openFaq === index ? 'rotate(180deg)' : 'rotate(0deg)'
                    }}
                  />
                </button>
                <AnimatePresence>
                  {openFaq === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-4">
                        <p className="text-sm leading-relaxed" style={{ color: '#3A3A3A' }}>{item.answer}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* CTA FINAL                                              */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section className="py-16" style={{ backgroundColor: '#111111' }}>
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white" style={{ fontFamily: 'var(--font-heading)' }}>
              Prête à vous lancer ?
            </h2>
            <p className="text-lg" style={{ color: '#999999' }}>
              Rejoignez les +500 esthéticiennes qui ont transformé leur carrière
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={scrollToSessions}
                className="px-8 py-4 rounded-xl font-bold text-lg text-white transition-all hover:scale-105"
                style={{ backgroundColor: '#FF5C00', boxShadow: '0 0 24px rgba(255, 92, 0, 0.3)' }}
              >
                Réserver ma place — {formation.prix_ht}€
              </button>
            </div>

            <div className="flex items-center justify-center gap-4 text-sm pt-4" style={{ color: '#777777' }}>
              <a href="tel:0188334343" className="flex items-center gap-2 hover:text-white transition-colors">
                <Phone size={14} /> 01 88 33 43 43
              </a>
              <span>·</span>
              <a href="https://wa.me/33188334343" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-white transition-colors">
                <MessageCircle size={14} /> WhatsApp
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Floating elements */}
      <StickyBottomBar
        formationNom={formation.nom}
        prix={formation.prix_ht}
        onCtaClick={scrollToSessions}
        heroRef={heroCta as any}
      />
      <WhatsAppButton message={`Bonjour ! Je suis intéressée par la formation ${formation.nom}. Pouvez-vous me donner plus d'informations ?`} />
      <ChatWidget />
    </div>
  )
}
