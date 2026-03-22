'use client'

import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronDown,
  ChevronUp,
  X,
  MapPin,
  Phone,
  Globe,
  Euro,
  Users,
  Building2,
  Calendar,
  Camera,
  Star,
  ExternalLink,
  Sparkles,
  Shield,
  TrendingUp,
  Award
} from 'lucide-react'
import { useState } from 'react'
import { StarRating } from './StarRating'

interface CompetitorDetailSheetProps {
  competitor: {
    nom: string
    rank?: number
    adresse?: string
    ville?: string
    distanceM: number
    siret?: string
    siren?: string
    codeApe?: string
    website?: string
    telephone?: string
    googleRating?: number
    googleReviewsCount?: number
    pjRating?: number
    pjReviewsCount?: number
    planityFound?: boolean
    planityRating?: number
    treatwellFound?: boolean
    treatwellRating?: number
    chiffreAffaires?: number
    resultatNet?: number
    capitalSocial?: number
    effectif?: number
    formeJuridique?: string
    dirigeants?: Array<{prenom: string; nom: string; titre: string}>
    dateCreation?: string
    reputationScore: number
    scores?: {reputation: number; presence: number; activity: number; financial: number; neighborhood: number; global: number}
    social?: {
      instagram?: {username: string; followers?: number; posts?: number; bio?: string}
      facebook?: {pageUrl: string; followers?: number}
      tiktok?: {username: string; followers?: number}
    }
    scraped?: {
      pagesJaunes?: {services?: string[]; prix?: string; horaires?: string[]; description?: string}
      planity?: {services?: string[]; prix?: string[]}
    }
    aiValidation?: {
      enrichedData?: {
        description?: string
        pointsForts?: string[]
        pointsFaibles?: string[]
        conseilsProspection?: string[]
        niveauMenace?: string
      }
    }
    completionScore?: number
  } | null
  open: boolean
  onClose: () => void
}

export default function CompetitorDetailSheet({ competitor, open, onClose }: CompetitorDetailSheetProps) {
  const [openSections, setOpenSections] = useState({
    reseaux: true,
    financier: false,
    avis: false,
    services: false,
    analyse: false
  })

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const formatNumber = (num?: number) => {
    if (!num) return 'N/A'
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M€`
    if (num >= 1000) return `${Math.round(num / 1000)}K€`
    return `${num}€`
  }

  const formatDistance = (meters: number) => {
    if (meters < 1000) return `${meters}m`
    return `${(meters / 1000).toFixed(1)}km`
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800 border-green-200'
    if (score >= 60) return 'bg-orange-100 text-orange-800 border-orange-200'
    return 'bg-red-100 text-red-800 border-red-200'
  }

  const getMenaceColor = (niveau?: string) => {
    switch (niveau?.toLowerCase()) {
      case 'faible': return 'bg-green-100 text-green-800 border-green-200'
      case 'moyen': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'fort': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (!competitor) return null

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-[480px] max-w-[90vw] bg-white shadow-2xl rounded-l-2xl z-[60] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {competitor.rank && (
                    <div className="w-8 h-8 rounded-full bg-[#2EC6F3] text-white flex items-center justify-center text-sm font-bold">
                      #{competitor.rank}
                    </div>
                  )}
                  <div>
                    <h2 className="text-xl font-bold text-[#082545]">{competitor.nom}</h2>
                    <div className="flex items-center gap-2 text-gray-600 text-sm mt-1">
                      <MapPin size={14} />
                      {competitor.adresse}, {competitor.ville}
                      <span className="text-[#2EC6F3]">• {formatDistance(competitor.distanceM)}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Score global */}
              <div className="flex items-center gap-4 mb-4">
                <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getScoreColor(competitor.scores?.global || competitor.reputationScore)}`}>
                  Score: {competitor.scores?.global || competitor.reputationScore}/100
                </div>
                {competitor.completionScore !== undefined && (
                  <div className="flex-1">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Données complètes</span>
                      <span>{competitor.completionScore}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-[#2EC6F3] h-2 rounded-full transition-all"
                        style={{ width: `${competitor.completionScore}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Rating */}
              {competitor.googleRating && (
                <div className="flex items-center gap-2">
                  <StarRating rating={competitor.googleRating} size="sm" />
                  <span className="text-sm text-gray-600">
                    ({competitor.googleReviewsCount || 0} avis)
                  </span>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">

              {/* Section Réseaux sociaux */}
              <div className="border rounded-lg">
                <button
                  onClick={() => toggleSection('reseaux')}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Camera className="text-[#2EC6F3]" size={18} />
                    <span className="font-medium">Réseaux sociaux</span>
                  </div>
                  {openSections.reseaux ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>

                {openSections.reseaux && competitor.social && (
                  <div className="px-4 pb-4 space-y-3">
                    {competitor.social.instagram && (
                      <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                        <Camera className="text-purple-600" size={16} />
                        <div className="flex-1">
                          <div className="font-medium">@{competitor.social.instagram.username}</div>
                          <div className="text-sm text-gray-600">
                            {competitor.social.instagram.followers} followers • {competitor.social.instagram.posts} posts
                          </div>
                          {competitor.social.instagram.bio && (
                            <div className="text-xs text-gray-500 mt-1">{competitor.social.instagram.bio}</div>
                          )}
                        </div>
                      </div>
                    )}

                    {competitor.social.facebook && (
                      <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                        <ExternalLink className="text-blue-600" size={16} />
                        <div className="flex-1">
                          <div className="font-medium">Facebook</div>
                          <div className="text-sm text-gray-600">
                            {competitor.social.facebook.followers} followers
                          </div>
                        </div>
                      </div>
                    )}

                    {competitor.social.tiktok && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <TrendingUp className="text-gray-600" size={16} />
                        <div className="flex-1">
                          <div className="font-medium">@{competitor.social.tiktok.username}</div>
                          <div className="text-sm text-gray-600">
                            {competitor.social.tiktok.followers} followers
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Section Données financières */}
              <div className="border rounded-lg">
                <button
                  onClick={() => toggleSection('financier')}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Euro className="text-[#2EC6F3]" size={18} />
                    <span className="font-medium">Données financières</span>
                  </div>
                  {openSections.financier ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>

                {openSections.financier && (
                  <div className="px-4 pb-4 space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-gray-500 uppercase tracking-wide">Chiffre d'affaires</div>
                        <div className="font-medium">{formatNumber(competitor.chiffreAffaires)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 uppercase tracking-wide">Résultat net</div>
                        <div className="font-medium">{formatNumber(competitor.resultatNet)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 uppercase tracking-wide">Capital social</div>
                        <div className="font-medium">{formatNumber(competitor.capitalSocial)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 uppercase tracking-wide">Effectif</div>
                        <div className="font-medium">{competitor.effectif || 'N/A'} employés</div>
                      </div>
                    </div>

                    {competitor.formeJuridique && (
                      <div>
                        <div className="text-xs text-gray-500 uppercase tracking-wide">Forme juridique</div>
                        <div className="font-medium">{competitor.formeJuridique}</div>
                      </div>
                    )}

                    {competitor.dirigeants && competitor.dirigeants.length > 0 && (
                      <div>
                        <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Dirigeants</div>
                        <div className="space-y-1">
                          {competitor.dirigeants.map((dirigeant, index) => (
                            <div key={index} className="text-sm">
                              <span className="font-medium">{dirigeant.prenom} {dirigeant.nom}</span>
                              <span className="text-gray-600 ml-2">• {dirigeant.titre}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {competitor.dateCreation && (
                      <div>
                        <div className="text-xs text-gray-500 uppercase tracking-wide">Date de création</div>
                        <div className="font-medium">{new Date(competitor.dateCreation).toLocaleDateString('fr-FR')}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Section Notes & Avis */}
              <div className="border rounded-lg">
                <button
                  onClick={() => toggleSection('avis')}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Star className="text-[#2EC6F3]" size={18} />
                    <span className="font-medium">Notes & Avis</span>
                  </div>
                  {openSections.avis ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>

                {openSections.avis && (
                  <div className="px-4 pb-4 space-y-3">
                    {competitor.googleRating && (
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="font-medium">Google</div>
                          <StarRating rating={competitor.googleRating} size="sm" />
                        </div>
                        <div className="text-sm text-gray-600">({competitor.googleReviewsCount} avis)</div>
                      </div>
                    )}

                    {competitor.pjRating && (
                      <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="font-medium">PagesJaunes</div>
                          <StarRating rating={competitor.pjRating} size="sm" />
                        </div>
                        <div className="text-sm text-gray-600">({competitor.pjReviewsCount} avis)</div>
                      </div>
                    )}

                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                      <div className="font-medium">Planity</div>
                      <div className="flex items-center gap-2">
                        {competitor.planityRating && <StarRating rating={competitor.planityRating} size="sm" />}
                        <span className={`px-2 py-1 rounded text-xs ${competitor.planityFound ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {competitor.planityFound ? 'Trouvé' : 'Non trouvé'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-pink-50 rounded-lg">
                      <div className="font-medium">Treatwell</div>
                      <div className="flex items-center gap-2">
                        {competitor.treatwellRating && <StarRating rating={competitor.treatwellRating} size="sm" />}
                        <span className={`px-2 py-1 rounded text-xs ${competitor.treatwellFound ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {competitor.treatwellFound ? 'Trouvé' : 'Non trouvé'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Section Services & Prix */}
              {competitor.scraped && (
                <div className="border rounded-lg">
                  <button
                    onClick={() => toggleSection('services')}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Award className="text-[#2EC6F3]" size={18} />
                      <span className="font-medium">Services & Prix</span>
                    </div>
                    {openSections.services ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>

                  {openSections.services && (
                    <div className="px-4 pb-4 space-y-3">
                      {competitor.scraped.pagesJaunes?.services && (
                        <div>
                          <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Services</div>
                          <div className="flex flex-wrap gap-2">
                            {competitor.scraped.pagesJaunes.services.map((service, index) => (
                              <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                {service}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {competitor.scraped.pagesJaunes?.horaires && (
                        <div>
                          <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Horaires</div>
                          <div className="space-y-1">
                            {competitor.scraped.pagesJaunes.horaires.map((horaire, index) => (
                              <div key={index} className="text-sm">{horaire}</div>
                            ))}
                          </div>
                        </div>
                      )}

                      {competitor.scraped.planity?.prix && (
                        <div>
                          <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Prix (Planity)</div>
                          <div className="space-y-1">
                            {competitor.scraped.planity.prix.map((prix, index) => (
                              <div key={index} className="text-sm font-medium text-green-600">{prix}</div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Section Analyse IA */}
              {competitor.aiValidation?.enrichedData && (
                <div className="border rounded-lg">
                  <button
                    onClick={() => toggleSection('analyse')}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="text-[#A855F7]" size={18} />
                      <span className="font-medium">Analyse IA</span>
                    </div>
                    {openSections.analyse ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>

                  {openSections.analyse && (
                    <div className="px-4 pb-4 space-y-4">
                      {competitor.aiValidation.enrichedData.description && (
                        <div>
                          <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Description</div>
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {competitor.aiValidation.enrichedData.description}
                          </p>
                        </div>
                      )}

                      {competitor.aiValidation.enrichedData.pointsForts && (
                        <div>
                          <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Points forts</div>
                          <div className="flex flex-wrap gap-2">
                            {competitor.aiValidation.enrichedData.pointsForts.map((point, index) => (
                              <span key={index} className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                                {point}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {competitor.aiValidation.enrichedData.pointsFaibles && (
                        <div>
                          <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Points faibles</div>
                          <div className="flex flex-wrap gap-2">
                            {competitor.aiValidation.enrichedData.pointsFaibles.map((point, index) => (
                              <span key={index} className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">
                                {point}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {competitor.aiValidation.enrichedData.niveauMenace && (
                        <div>
                          <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Niveau de menace</div>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getMenaceColor(competitor.aiValidation.enrichedData.niveauMenace)}`}>
                            {competitor.aiValidation.enrichedData.niveauMenace}
                          </span>
                        </div>
                      )}

                      {competitor.aiValidation.enrichedData.conseilsProspection && (
                        <div>
                          <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Conseils prospection</div>
                          <div className="space-y-2">
                            {competitor.aiValidation.enrichedData.conseilsProspection.map((conseil, index) => (
                              <div key={index} className="flex items-start gap-2 p-2 bg-purple-50 rounded text-sm">
                                <Shield className="text-purple-600 mt-0.5 flex-shrink-0" size={14} />
                                <span>{conseil}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}