// @ts-nocheck
'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase-client'
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
  Book,
  MapPin,
  CreditCard,
  ChevronDown,
  ChevronRight,
  Timer,
  TrendingUp
} from 'lucide-react'
import { motion } from 'framer-motion'

interface FormationClientPageProps {
  slug: string
}

export default function FormationClientPage({ slug }: FormationClientPageProps) {
  const [formation, setFormation] = useState<Formation | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const heroCta = useRef<HTMLDivElement>(null)

  const supabase = createClient()

  useEffect(() => {
    async function fetchData() {
      if (!slug) return

      try {
        // Fetch formation
        const { data: formationData } = await supabase
          .from('formations')
          .select('*')
          .eq('slug', slug)
          .eq('is_active', true)
          .single()

        if (formationData) {
          setFormation(formationData)

          // Fetch sessions
          const { data: sessionsData } = await supabase
            .from('sessions')
            .select(`
              *,
              formatrice:equipe(prenom, nom)
            `)
            .eq('formation_id', formationData.id)
            .in('statut', ['PLANIFIEE', 'CONFIRMEE'])
            .gte('date_debut', new Date().toISOString())
            .order('date_debut', { ascending: true })
            .limit(6)

          setSessions(sessionsData || [])
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [slug, supabase])

  const handleCTA = () => {
    // Scroll to sessions or redirect to inscription
    const sessionsSection = document.getElementById('sessions')
    if (sessionsSection) {
      sessionsSection.scrollIntoView({ behavior: 'smooth' })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2EC6F3] mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!formation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Formation non trouvée</h1>
          <p className="text-gray-600 mb-8">Désolé, cette formation n'existe pas ou n'est plus disponible.</p>
          <a
            href="/formations"
            className="inline-flex items-center px-6 py-3 bg-[#2EC6F3] text-white rounded-lg hover:bg-[#0EA5E9] transition-colors"
          >
            Voir toutes les formations
          </a>
        </div>
      </div>
    )
  }

  const nearestSession = sessions[0]
  const remainingPlaces = nearestSession ? nearestSession.places_max - nearestSession.places_occupees : 0

  const faqItems = [
    {
      question: "Comment se passe le financement ?",
      answer: "Nous vous accompagnons dans toutes vos démarches de financement : OPCO, CPF, France Travail, paiement en plusieurs fois. Notre équipe étudie votre situation pour trouver la solution la plus adaptée."
    },
    {
      question: "Quels sont les prérequis ?",
      answer: formation.prerequis || "Aucun prérequis spécifique requis. Cette formation est accessible aux débutantes comme aux professionnelles souhaitant se perfectionner."
    },
    {
      question: "Où se déroule la formation ?",
      answer: "Nos formations se déroulent dans nos locaux modernes au 75 Boulevard Richard Lenoir, 75011 Paris. Métro : Bastille (lignes 1, 5, 8) ou Saint-Ambroise (ligne 9)."
    },
    {
      question: "Quel matériel est fourni ?",
      answer: formation.materiel_inclus
        ? `Tout le matériel professionnel est inclus dans le prix de la formation. ${formation.materiel_details || 'Vous repartirez avec votre kit complet.'}`
        : "Le matériel nécessaire est mis à disposition pendant la formation. Liste détaillée envoyée avant le début."
    },
    {
      question: "Y a-t-il un certificat ?",
      answer: "Oui ! Vous recevrez un certificat de formation professionnelle reconnu, attestant de vos nouvelles compétences. Dermotec est certifié Qualiopi, gage de qualité."
    },
    {
      question: "Paiement en plusieurs fois ?",
      answer: "Oui, nous proposons un paiement échelonné : 3x ou 4x sans frais avec Alma, ou paiement personnalisé selon votre situation financière."
    }
  ]

  const testimonials = [
    {
      name: "Sophie",
      formation: "Dermo-Pigmentation",
      quote: "Formation exceptionnelle ! J'ai pu ouvrir mon institut 2 mois après. L'accompagnement est parfait.",
      stars: 5
    },
    {
      name: "Marina",
      formation: "Microneedling",
      quote: "Formatrices au top, très professionnelles. J'ai appris énormément de techniques. Je recommande !",
      stars: 5
    },
    {
      name: "Claire",
      formation: "Laser & IPL",
      quote: "Excellente formation, très complète. Le centre est magnifique et l'équipe bienveillante.",
      stars: 5
    }
  ]

  const financements = [
    {
      icon: <Award className="h-6 w-6" />,
      name: "OPCO",
      status: "Éligible",
      description: "Prise en charge jusqu'à 100% pour les salariées"
    },
    {
      icon: <Target className="h-6 w-6" />,
      name: "CPF",
      status: "Éligible",
      description: "Utilisez vos droits formation acquis"
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      name: "France Travail",
      status: "Éligible",
      description: "AIF pour demandeurs d'emploi"
    },
    {
      icon: <CreditCard className="h-6 w-6" />,
      name: "Paiement 3x/4x",
      status: "Sans frais",
      description: "Avec notre partenaire Alma"
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* HERO SECTION */}
      <section className="relative min-h-screen bg-gradient-to-br from-[#082545] to-[#0F3460] text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>

        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/4 -left-20 w-96 h-96 bg-[#2EC6F3] rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-[#2EC6F3] rounded-full blur-3xl"></div>
        </div>

        <div className="relative container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            {/* Category Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-block px-4 py-2 bg-[#2EC6F3] text-white rounded-full text-sm font-semibold">
                {formation.categorie}
              </span>
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl md:text-6xl font-bold font-['Bricolage_Grotesque'] leading-tight"
            >
              {formation.nom}
            </motion.h1>

            {/* Value proposition */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto leading-relaxed"
            >
              {formation.description_commerciale || formation.description || "Maîtrisez les techniques professionnelles avec nos expertes certifiées"}
            </motion.p>

            {/* Price & CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="space-y-6"
              ref={heroCta}
            >
              <div className="space-y-2">
                <div className="text-2xl md:text-3xl font-bold">
                  À partir de {formation.prix_ht}€ HT
                </div>
                <div className="flex items-center justify-center gap-2 text-sm">
                  <span className="bg-[#2EC6F3] px-2 py-1 rounded text-xs font-semibold">ALMA</span>
                  ou 3x {Math.ceil(formation.prix_ht / 3)}€ sans frais
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <button
                  onClick={handleCTA}
                  className="px-8 py-4 bg-[#2EC6F3] hover:bg-[#0EA5E9] text-white rounded-lg font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  Réserver ma place
                </button>
                <div className="flex items-center gap-4 text-sm">
                  <a
                    href="tel:0188334343"
                    className="flex items-center gap-2 hover:text-[#2EC6F3] transition-colors"
                  >
                    <Phone size={16} />
                    01 88 33 43 43
                  </a>
                  <span className="text-gray-300">|</span>
                  <a
                    href="https://wa.me/33188334343"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 hover:text-[#25D366] transition-colors"
                  >
                    <MessageCircle size={16} />
                    WhatsApp
                  </a>
                </div>
              </div>
            </motion.div>

            {/* Trust bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-wrap justify-center items-center gap-6 text-sm text-blue-100 pt-8 border-t border-white/20"
            >
              <div className="flex items-center gap-2">
                <Award size={16} className="text-[#2EC6F3]" />
                Certifié Qualiopi
              </div>
              <div className="flex items-center gap-2">
                <Star size={16} className="text-[#2EC6F3]" />
                4.9/5 Google
              </div>
              <div className="flex items-center gap-2">
                <Users size={16} className="text-[#2EC6F3]" />
                +500 stagiaires
              </div>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="grid grid-cols-3 gap-8 pt-8 max-w-md mx-auto"
            >
              <div className="text-center">
                <div className="text-2xl font-bold text-[#2EC6F3]">{formation.duree_jours}</div>
                <div className="text-sm text-blue-100">jour{formation.duree_jours > 1 ? 's' : ''}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#2EC6F3]">{formation.duree_heures}h</div>
                <div className="text-sm text-blue-100">intensives</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#2EC6F3]">{formation.places_max}</div>
                <div className="text-sm text-blue-100">places max</div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF SECTION */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Elles nous font confiance</h2>
            <div className="flex items-center justify-center gap-2 mb-8">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-6 h-6 text-yellow-400 fill-current" />
                ))}
              </div>
              <span className="text-2xl font-bold text-gray-900">4.9/5</span>
              <span className="text-gray-600">— 87 avis Google</span>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white p-6 rounded-lg shadow-lg"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.stars)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                  ))}
                </div>
                <blockquote className="text-gray-700 mb-4">
                  "{testimonial.quote}"
                </blockquote>
                <cite className="font-semibold text-gray-900">
                  {testimonial.name}
                  <div className="text-sm text-gray-500">{testimonial.formation}</div>
                </cite>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* PROGRAMME SECTION */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              Ce que vous allez apprendre
            </h2>

            <div className="space-y-8">
              {formation.objectifs?.map((objectif, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="flex gap-6 items-start"
                >
                  <div className="w-12 h-12 bg-[#2EC6F3] text-white rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-900 mb-2">
                      {objectif}
                    </h3>
                  </div>
                </motion.div>
              )) || (
                <div className="text-center text-gray-600">
                  Programme détaillé envoyé lors de l'inscription
                </div>
              )}
            </div>

            {formation.competences_acquises && formation.competences_acquises.length > 0 && (
              <div className="mt-12">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Compétences acquises</h3>
                <div className="flex flex-wrap gap-2">
                  {formation.competences_acquises.map((competence, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-[#2EC6F3]/10 text-[#082545] rounded-full text-sm font-medium"
                    >
                      {competence}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* POUR QUI SECTION */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              Cette formation est faite pour vous si...
            </h2>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                  <p>Vous êtes esthéticienne et souhaitez vous spécialiser</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                  <p>Vous voulez développer votre activité</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                  <p>Vous êtes en reconversion professionnelle</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                  <p>Vous gérez un institut de beauté</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                  <p>Vous voulez maîtriser les dernières techniques</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                  <p>Vous cherchez une formation certifiante</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                  <p>Vous voulez augmenter vos revenus</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                  <p>Vous privilégiez la qualité et l'excellence</p>
                </div>
              </div>
            </div>

            {formation.prerequis && (
              <div className="mt-8 p-6 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Prérequis</h3>
                <p className="text-gray-700">{formation.prerequis}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* FINANCEMENT SECTION */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Financement : on s'occupe de tout
              </h2>
              <p className="text-gray-600 text-lg">
                Plus de 90% de nos stagiaires bénéficient d'un financement
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {financements.map((financement, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-white border border-gray-200 rounded-lg p-6 text-center hover:shadow-lg transition-shadow"
                >
                  <div className="text-[#2EC6F3] mb-4 flex justify-center">
                    {financement.icon}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{financement.name}</h3>
                  <div className="inline-block px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold mb-3">
                    {financement.status}
                  </div>
                  <p className="text-sm text-gray-600">{financement.description}</p>
                </motion.div>
              ))}
            </div>

            <div className="text-center mt-8">
              <a
                href="https://wa.me/33188334343?text=Bonjour, je souhaite vérifier mon éligibilité au financement pour la formation"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3 bg-[#25D366] text-white rounded-lg hover:bg-[#22C55E] transition-colors font-semibold"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Vérifier mon éligibilité
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* PROCHAINES SESSIONS SECTION */}
      <section id="sessions" className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              Prochaines sessions
            </h2>

            {nearestSession && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-gradient-to-r from-red-500 to-red-600 text-white p-4 rounded-lg mb-8 text-center"
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Timer className="w-5 h-5" />
                  <span className="font-semibold">Session la plus proche</span>
                </div>
                <p>
                  {remainingPlaces < 3
                    ? `Plus que ${remainingPlaces} place${remainingPlaces !== 1 ? 's' : ''} disponible${remainingPlaces !== 1 ? 's' : ''} !`
                    : `${remainingPlaces} places disponibles`
                  }
                </p>
              </motion.div>
            )}

            {sessions.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sessions.map((session, index) => {
                  const placesRestantes = session.places_max - session.places_occupees
                  const dateDebut = new Date(session.date_debut)
                  const dateFin = new Date(session.date_fin)

                  return (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                      viewport={{ once: true }}
                      className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
                    >
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                            <Calendar size={16} />
                            {dateDebut.toLocaleDateString('fr-FR', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </div>
                          {dateDebut.toDateString() !== dateFin.toDateString() && (
                            <div className="text-sm text-gray-600">
                              au {dateFin.toLocaleDateString('fr-FR', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long'
                              })}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock size={16} />
                          {session.horaire_debut} - {session.horaire_fin}
                        </div>

                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin size={16} />
                          {session.salle}
                        </div>

                        {session.formatrice && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Users size={16} />
                            {session.formatrice.prenom} {session.formatrice.nom}
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <div className={`text-sm font-semibold ${
                            placesRestantes < 3 ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {placesRestantes} place{placesRestantes !== 1 ? 's' : ''} restante{placesRestantes !== 1 ? 's' : ''}
                          </div>
                          <div className="text-lg font-bold text-[#082545]">
                            {formation.prix_ht}€ HT
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            // Redirection vers inscription avec session pré-sélectionnée
                            window.open(`/inscription?formation=${formation.id}&session=${session.id}`, '_blank')
                          }}
                          className="w-full py-3 bg-[#2EC6F3] hover:bg-[#0EA5E9] text-white rounded-lg font-semibold transition-colors"
                        >
                          S'inscrire — {formation.prix_ht}€
                        </button>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Aucune session programmée
                </h3>
                <p className="text-gray-600 mb-6">
                  Contactez-nous pour être informé des prochaines dates
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a
                    href="tel:0188334343"
                    className="inline-flex items-center px-6 py-3 bg-[#082545] text-white rounded-lg hover:bg-[#0F3460] transition-colors"
                  >
                    <Phone className="w-5 h-5 mr-2" />
                    01 88 33 43 43
                  </a>
                  <a
                    href="https://wa.me/33188334343?text=Bonjour, quelles sont les prochaines dates pour la formation"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-6 py-3 bg-[#25D366] text-white rounded-lg hover:bg-[#22C55E] transition-colors"
                  >
                    <MessageCircle className="w-5 h-5 mr-2" />
                    WhatsApp
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              Questions fréquentes
            </h2>

            <div className="space-y-4">
              {faqItems.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="border border-gray-200 rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="w-full px-6 py-4 text-left bg-white hover:bg-gray-50 flex items-center justify-between transition-colors"
                  >
                    <span className="font-semibold text-gray-900">{item.question}</span>
                    {openFaq === index ? (
                      <ChevronDown className="w-5 h-5 text-gray-600" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-600" />
                    )}
                  </button>
                  {openFaq === index && (
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                      <p className="text-gray-700 leading-relaxed">{item.answer}</p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA SECTION */}
      <section className="py-16 bg-gradient-to-r from-[#082545] to-[#0F3460] text-white">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold font-['Bricolage_Grotesque']">
              Prête à vous lancer ?
            </h2>

            <p className="text-lg text-blue-100">
              Rejoignez les centaines d'esthéticiennes qui ont transformé leur carrière avec Dermotec
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={handleCTA}
                className="px-8 py-4 bg-[#2EC6F3] hover:bg-[#0EA5E9] text-white rounded-lg font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                Réserver ma place
              </button>

              <span className="text-blue-100">ou</span>

              <div className="flex gap-4">
                <a
                  href="tel:0188334343"
                  className="px-6 py-3 border-2 border-white text-white hover:bg-white hover:text-[#082545] rounded-lg font-semibold transition-all duration-300"
                >
                  Appeler : 01 88 33 43 43
                </a>
                <a
                  href="https://wa.me/33188334343?text=Bonjour, je souhaite m'inscrire à la formation"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 bg-[#25D366] hover:bg-[#22C55E] text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
                >
                  <MessageCircle size={18} />
                  WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Floating elements */}
      <StickyBottomBar
        formationNom={formation.nom}
        prix={formation.prix_ht}
        onCtaClick={handleCTA}
        heroRef={heroCta}
      />
      <WhatsAppButton message={`Bonjour ! Je suis intéressée par la formation ${formation.nom}. Pouvez-vous me donner plus d'informations ?`} />
      <ChatWidget />
    </div>
  )
}