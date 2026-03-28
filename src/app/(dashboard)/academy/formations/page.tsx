'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  GraduationCap, Clock, Users, Brain, Target,
  ChevronDown, ChevronUp, Play, ArrowRight,
  Trophy, Zap, BookOpen, CheckCircle2, XCircle,
  RotateCcw, Sparkles, X, Code2, Table,
  Award, TrendingUp, Star, Eye
} from 'lucide-react'
import { ACADEMY_FORMATIONS_MODULES } from '@/lib/formation/academy-content'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { AnimatedCounter } from '@/components/ui/AnimatedCounter'
import { cn } from '@/lib/utils'
import type { AcademyModule, AcademySection, AcademyQuizQuestion } from '@/types/formations-content'

// Animation variants
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3
    }
  }
}

// Fonction pour obtenir la couleur du niveau
function getNiveauColor(niveau: string): string {
  switch (niveau) {
    case 'debutant':
      return 'var(--color-success)'
    case 'intermediaire':
      return '#F59E0B'
    case 'avance':
      return '#EF4444'
    default:
      return '#6B7280'
  }
}

// Fonction pour obtenir la couleur de la catégorie
function getCategorieColor(categorie: string): string {
  switch (categorie) {
    case 'commercial':
      return 'var(--color-primary)'
    case 'technique':
      return '#8B5CF6'
    case 'relation-client':
      return '#10B981'
    case 'financement':
      return '#F59E0B'
    case 'fidelisation':
      return '#EF4444'
    default:
      return '#6B7280'
  }
}

// Fonction pour obtenir le nom affiché du niveau
function getNiveauLabel(niveau: string): string {
  switch (niveau) {
    case 'debutant':
      return 'Débutant'
    case 'intermediaire':
      return 'Intermédiaire'
    case 'avance':
      return 'Avancé'
    default:
      return niveau
  }
}

// Composant Hero Stats
function HeroStats() {
  const totalModules = ACADEMY_FORMATIONS_MODULES.length
  const totalSections = ACADEMY_FORMATIONS_MODULES.reduce((acc, module) => acc + module.sections.length, 0)
  const totalQuiz = ACADEMY_FORMATIONS_MODULES.reduce((acc, module) => acc + module.quiz.length, 0)
  const totalDuree = ACADEMY_FORMATIONS_MODULES.reduce((acc, module) => acc + module.dureeMinutes, 0)

  const stats = [
    { label: 'Modules', value: totalModules, suffix: '' },
    { label: 'Sections', value: totalSections, suffix: '' },
    { label: 'Quiz', value: totalQuiz, suffix: '' },
    { label: 'de contenu', value: Math.round(totalDuree / 60 * 10) / 10, suffix: 'h' }
  ]

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 p-8 border border-primary/20">
      {/* Glassmorphism background */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-white/20 backdrop-blur-sm" />

      {/* Mesh gradient background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-gradient-to-br from-primary/30 to-transparent blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-96 h-96 rounded-full bg-gradient-to-br from-accent/20 to-transparent blur-3xl" />
      </div>

      <div className="relative z-10">
        {/* Titre principal */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center justify-center gap-3 mb-4"
          >
            <div className="p-3 rounded-2xl bg-gradient-to-br from-primary to-accent text-white">
              <GraduationCap className="w-8 h-8" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold font-heading bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Parcours de formation
            </h1>
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg text-[#777777] max-w-2xl mx-auto"
          >
            Maîtrisez les techniques commerciales et relationnelles avec notre academy interactive
          </motion.p>
        </div>

        {/* Stats animées */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              variants={cardVariants}
              className="text-center p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/20 hover:bg-white/70 transition-all duration-300"
            >
              <div className="flex items-center justify-center text-3xl md:text-4xl font-bold text-[#111111] mb-2">
                <AnimatedCounter value={stat.value} duration={2000} />
                <span className="text-primary">{stat.suffix}</span>
              </div>
              <p className="text-sm text-[#777777] font-medium">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}

// Composant pour afficher un tableau
function TableauComponent({ tableau }: { tableau: any }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-[#EEEEEE] rounded-lg">
        <thead>
          <tr className="bg-[#FAF8F5]">
            {tableau.colonnes.map((colonne: string, index: number) => (
              <th key={index} className="border border-[#EEEEEE] px-4 py-3 text-left text-sm font-semibold text-[#111111]">
                {colonne}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tableau.lignes.map((ligne: string[], rowIndex: number) => (
            <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-[#FAF8F5]/50'}>
              {ligne.map((cellule: string, cellIndex: number) => (
                <td key={cellIndex} className="border border-[#EEEEEE] px-4 py-3 text-sm text-[#3A3A3A]">
                  {cellule}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Composant Section Accordéon
function SectionAccordion({ section }: { section: AcademySection }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <motion.div
      initial={false}
      className="border border-[#EEEEEE] rounded-lg overflow-hidden"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 text-left bg-[#FAF8F5] hover:bg-[#F4F0EB] transition-colors duration-200 flex items-center justify-between"
      >
        <div>
          <h3 className="font-semibold text-[#111111]">{section.titre}</h3>
          <p className="text-sm text-[#777777] mt-1">{section.sousTitre}</p>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-5 h-5 text-[#777777]" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="p-6 bg-white space-y-6">
              {/* Contenu principal */}
              <p className="text-[#3A3A3A] leading-relaxed">{section.contenu}</p>

              {/* Points clés */}
              {section.pointsCles && section.pointsCles.length > 0 && (
                <div>
                  <h4 className="font-medium text-[#111111] mb-3 flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary" />
                    Points clés
                  </h4>
                  <ul className="space-y-2">
                    {section.pointsCles.map((point, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <CheckCircle2 className="w-4 h-4 text-[#10B981] mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-[#3A3A3A]">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Scripts */}
              {section.scripts && section.scripts.length > 0 && (
                <div>
                  <h4 className="font-medium text-[#111111] mb-3 flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-[#FF2D78]" />
                    Scripts pratiques
                  </h4>
                  <div className="space-y-4">
                    {section.scripts.map((script, index) => (
                      <div key={script.id} className="bg-[#111111] rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary" className="text-xs">
                            {script.canal}
                          </Badge>
                          <h5 className="font-medium text-white">{script.titre}</h5>
                        </div>
                        <p className="text-[#999999] text-sm mb-3">{script.contexte}</p>
                        <pre className="text-gray-100 text-sm whitespace-pre-wrap leading-relaxed">
                          {script.corps}
                        </pre>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tableaux */}
              {section.tableaux && section.tableaux.length > 0 && (
                <div>
                  <h4 className="font-medium text-[#111111] mb-3 flex items-center gap-2">
                    <Table className="w-4 h-4 text-orange-600" />
                    Tableaux de données
                  </h4>
                  <div className="space-y-6">
                    {section.tableaux.map((tableau, index) => (
                      <div key={index}>
                        <h5 className="font-medium text-[#1A1A1A] mb-3">{tableau.titre}</h5>
                        <TableauComponent tableau={tableau} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// Composant Quiz Player
function QuizPlayer({
  quiz,
  isOpen,
  onClose,
  moduleTitle
}: {
  quiz: AcademyQuizQuestion[],
  isOpen: boolean,
  onClose: () => void,
  moduleTitle: string
}) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [showExplanation, setShowExplanation] = useState(false)
  const [score, setScore] = useState(0)
  const [isFinished, setIsFinished] = useState(false)
  const [answers, setAnswers] = useState<boolean[]>([])

  const currentQuestion = quiz[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === quiz.length - 1

  const handleOptionSelect = (optionIndex: number) => {
    if (showExplanation) return
    setSelectedOption(optionIndex)
  }

  const handleValidation = () => {
    if (selectedOption === null) return

    const isCorrect = selectedOption === currentQuestion.correctIndex
    const newAnswers = [...answers, isCorrect]
    setAnswers(newAnswers)

    if (isCorrect) {
      setScore(score + 1)
    }

    setShowExplanation(true)
  }

  const handleNext = () => {
    if (isLastQuestion) {
      setIsFinished(true)
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setSelectedOption(null)
      setShowExplanation(false)
    }
  }

  const resetQuiz = () => {
    setCurrentQuestionIndex(0)
    setSelectedOption(null)
    setShowExplanation(false)
    setScore(0)
    setIsFinished(false)
    setAnswers([])
  }

  const finalScore = Math.round((score / quiz.length) * 100)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-[#EEEEEE] bg-gradient-to-r from-primary/10 to-accent/10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-[#111111]">Quiz - {moduleTitle}</h2>
              <p className="text-sm text-[#777777] mt-1">
                {isFinished ? 'Résultats' : `Question ${currentQuestionIndex + 1} sur ${quiz.length}`}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-[#777777] hover:text-[#3A3A3A]"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Progress bar */}
          {!isFinished && (
            <div className="mt-4">
              <div className="w-full bg-[#EEEEEE] rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-primary to-accent h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentQuestionIndex + 1) / quiz.length) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {isFinished ? (
            // Résultats finaux
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-6"
            >
              <div className="flex items-center justify-center">
                {finalScore >= 80 ? (
                  <div className="p-4 rounded-full bg-[#D1FAE5]">
                    <Trophy className="w-12 h-12 text-[#10B981]" />
                  </div>
                ) : finalScore >= 60 ? (
                  <div className="p-4 rounded-full bg-[#FFF3E8]">
                    <Award className="w-12 h-12 text-[#FF8C42]" />
                  </div>
                ) : (
                  <div className="p-4 rounded-full bg-[#FFE0EF]">
                    <TrendingUp className="w-12 h-12 text-[#FF2D78]" />
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-2xl font-bold text-[#111111] mb-2">
                  {finalScore >= 80 ? 'Excellent !' : finalScore >= 60 ? 'Bien joué !' : 'À améliorer'}
                </h3>
                <p className="text-4xl font-bold text-primary mb-2">{finalScore}%</p>
                <p className="text-[#777777]">
                  {score} bonnes réponses sur {quiz.length}
                </p>
              </div>

              <div className="flex items-center justify-center gap-4">
                <Button onClick={resetQuiz} variant="outline">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Recommencer
                </Button>
                <Button onClick={onClose}>
                  Fermer
                </Button>
              </div>
            </motion.div>
          ) : (
            // Question actuelle
            <motion.div
              key={currentQuestionIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div>
                <h3 className="text-lg font-semibold text-[#111111] mb-4">
                  {currentQuestion.question}
                </h3>

                <div className="space-y-3">
                  {currentQuestion.options.map((option, index) => {
                    const isSelected = selectedOption === index
                    const isCorrect = index === currentQuestion.correctIndex
                    const showResult = showExplanation

                    let cardStyle = "border border-[#EEEEEE] hover:border-primary"

                    if (showResult) {
                      if (isCorrect) {
                        cardStyle = "border-[#10B981] bg-[#ECFDF5]"
                      } else if (isSelected && !isCorrect) {
                        cardStyle = "border-red-500 bg-[#FFE0EF]"
                      } else {
                        cardStyle = "border-[#EEEEEE] bg-[#FAF8F5]"
                      }
                    } else if (isSelected) {
                      cardStyle = "border-primary bg-primary/5"
                    }

                    return (
                      <button
                        key={index}
                        onClick={() => handleOptionSelect(index)}
                        disabled={showExplanation}
                        className={cn(
                          "w-full text-left p-4 rounded-lg transition-all duration-200 disabled:cursor-not-allowed",
                          cardStyle
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold",
                            showResult && isCorrect ? "border-[#10B981] bg-[#10B981] text-white" :
                            showResult && isSelected && !isCorrect ? "border-red-500 bg-[#FF2D78] text-white" :
                            isSelected ? "border-primary bg-primary text-white" :
                            "border-[#EEEEEE]"
                          )}>
                            {String.fromCharCode(65 + index)}
                          </div>
                          <span className={cn(
                            "font-medium",
                            showResult && isCorrect ? "text-[#10B981]" :
                            showResult && isSelected && !isCorrect ? "text-[#FF2D78]" :
                            "text-[#111111]"
                          )}>
                            {option}
                          </span>
                          {showResult && isCorrect && (
                            <CheckCircle2 className="w-5 h-5 text-[#10B981] ml-auto" />
                          )}
                          {showResult && isSelected && !isCorrect && (
                            <XCircle className="w-5 h-5 text-[#FF2D78] ml-auto" />
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Explication */}
              {showExplanation && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-[#E0EBF5] border border-[#6B8CAE]/30 rounded-lg"
                >
                  <h4 className="font-medium text-[#6B8CAE] mb-2 flex items-center gap-2">
                    <Brain className="w-4 h-4" />
                    Explication
                  </h4>
                  <p className="text-sm text-[#6B8CAE]">{currentQuestion.explication}</p>
                </motion.div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-[#777777]">
                  Question {currentQuestionIndex + 1} sur {quiz.length}
                </div>
                <div className="flex gap-3">
                  {!showExplanation ? (
                    <Button
                      onClick={handleValidation}
                      disabled={selectedOption === null}
                      className="bg-primary hover:bg-primary/90"
                    >
                      Valider
                    </Button>
                  ) : (
                    <Button onClick={handleNext}>
                      {isLastQuestion ? 'Voir les résultats' : 'Suivant'}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

// Composant Module Detail
function ModuleDetail({
  module,
  isOpen,
  onClose,
  onStartQuiz
}: {
  module: AcademyModule | null,
  isOpen: boolean,
  onClose: () => void,
  onStartQuiz: () => void
}) {
  if (!isOpen || !module) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-[#EEEEEE]" style={{ backgroundColor: `${getCategorieColor(module.categorie)}10` }}>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div
                className="p-3 rounded-xl text-2xl"
                style={{
                  backgroundColor: `${getCategorieColor(module.categorie)}20`,
                  color: getCategorieColor(module.categorie)
                }}
              >
                {module.icone}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[#111111] mb-2">{module.titre}</h2>
                <p className="text-[#777777] mb-3">{module.sousTitre}</p>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#777777]" />
                    <span>{module.dureeMinutes} min</span>
                  </div>
                  <Badge
                    style={{
                      backgroundColor: `${getNiveauColor(module.niveau)}20`,
                      color: getNiveauColor(module.niveau),
                      borderColor: getNiveauColor(module.niveau)
                    }}
                    variant="outline"
                  >
                    {getNiveauLabel(module.niveau)}
                  </Badge>
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#777777]" />
                    <span>{module.sections.length} sections</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-[#777777]" />
                    <span>{module.quiz.length} questions</span>
                  </div>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-[#777777] hover:text-[#3A3A3A]"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="max-h-[70vh] overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Description */}
            <div>
              <p className="text-[#3A3A3A] leading-relaxed">{module.description}</p>
            </div>

            {/* Objectifs */}
            <div>
              <h3 className="font-semibold text-[#111111] mb-3 flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Objectifs pédagogiques
              </h3>
              <ul className="space-y-2">
                {module.objectifs.map((objectif, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Star className="w-4 h-4 text-[#FF8C42] mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-[#3A3A3A]">{objectif}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Prérequis */}
            {module.prerequis.length > 0 && (
              <div>
                <h3 className="font-semibold text-[#111111] mb-3 flex items-center gap-2">
                  <Eye className="w-5 h-5 text-orange-500" />
                  Prérequis
                </h3>
                <ul className="space-y-2">
                  {module.prerequis.map((prerequis, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-[#10B981] mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-[#3A3A3A]">{prerequis}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Tags */}
            <div>
              <h3 className="font-semibold text-[#111111] mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {module.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Sections */}
            <div>
              <h3 className="font-semibold text-[#111111] mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#FF2D78]" />
                Sections du module ({module.sections.length})
              </h3>
              <div className="space-y-4">
                {module.sections.map((section, index) => (
                  <SectionAccordion key={section.id} section={section} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#EEEEEE] bg-[#FAF8F5]">
          <div className="flex items-center justify-between">
            <div className="text-sm text-[#777777]">
              {module.quiz.length} questions dans ce quiz
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose}>
                Fermer
              </Button>
              <Button
                onClick={onStartQuiz}
                className="bg-primary hover:bg-primary/90"
              >
                <Play className="w-4 h-4 mr-2" />
                Lancer le Quiz
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// Composant Module Card
function ModuleCard({ module, onClick }: { module: AcademyModule, onClick: () => void }) {
  // Progression simulée à 0% par défaut
  const progressPercent = 0

  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className="group cursor-pointer bg-white rounded-2xl border-2 border-[#EEEEEE] hover:border-primary hover:shadow-xl transition-all duration-300 overflow-hidden"
    >
      {/* Border colorée selon catégorie */}
      <div
        className="h-1 w-full"
        style={{ backgroundColor: getCategorieColor(module.categorie) }}
      />

      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div
            className="p-3 rounded-xl text-2xl transition-transform group-hover:scale-105"
            style={{
              backgroundColor: `${getCategorieColor(module.categorie)}15`,
              color: getCategorieColor(module.categorie)
            }}
          >
            {module.icone}
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-xs text-[#777777] mb-1">
              <Clock className="w-3 h-3" />
              {module.dureeMinutes} min
            </div>
            <Badge
              style={{
                backgroundColor: `${getNiveauColor(module.niveau)}15`,
                color: getNiveauColor(module.niveau),
                borderColor: getNiveauColor(module.niveau)
              }}
              variant="outline"
              size="sm"
            >
              {getNiveauLabel(module.niveau)}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-3 mb-4">
          <h3 className="font-bold text-[#111111] line-clamp-2 group-hover:text-primary transition-colors">
            {module.titre}
          </h3>
          <p className="text-sm text-[#777777] line-clamp-2 leading-relaxed">
            {module.description}
          </p>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-xs text-[#777777] mb-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              <span>{module.sections.length} sections</span>
            </div>
            <div className="flex items-center gap-1">
              <Brain className="w-3 h-3" />
              <span>{module.quiz.length} quiz</span>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#777777]">Progression</span>
            <span className="font-medium text-[#111111]">{progressPercent}%</span>
          </div>
          <div className="w-full bg-[#EEEEEE] rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all duration-500"
              style={{
                width: `${progressPercent}%`,
                backgroundColor: getCategorieColor(module.categorie)
              }}
            />
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mt-4">
          {module.tags.slice(0, 3).map((tag, index) => (
            <Badge key={index} variant="outline" className="text-xs py-0 px-2">
              {tag}
            </Badge>
          ))}
          {module.tags.length > 3 && (
            <Badge variant="outline" className="text-xs py-0 px-2">
              +{module.tags.length - 3}
            </Badge>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// Composant principal
export default function AcademyFormationsPage() {
  const [selectedModule, setSelectedModule] = useState<AcademyModule | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isQuizOpen, setIsQuizOpen] = useState(false)

  const openModuleDetail = (module: AcademyModule) => {
    setSelectedModule(module)
    setIsDetailOpen(true)
  }

  const closeModuleDetail = () => {
    setIsDetailOpen(false)
    setSelectedModule(null)
  }

  const startQuiz = () => {
    setIsDetailOpen(false)
    setIsQuizOpen(true)
  }

  const closeQuiz = () => {
    setIsQuizOpen(false)
    setSelectedModule(null)
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Hero Section */}
      <HeroStats />

      {/* Modules Grid */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-[#111111]">Modules de formation</h2>
          <div className="text-sm text-[#777777]">
            {ACADEMY_FORMATIONS_MODULES.length} modules disponibles
          </div>
        </div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {ACADEMY_FORMATIONS_MODULES.map((module) => (
            <ModuleCard
              key={module.id}
              module={module}
              onClick={() => openModuleDetail(module)}
            />
          ))}
        </motion.div>
      </div>

      {/* Modals */}
      <AnimatePresence mode="wait">
        {selectedModule && (
          <ModuleDetail
            module={selectedModule}
            isOpen={isDetailOpen}
            onClose={closeModuleDetail}
            onStartQuiz={startQuiz}
          />
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {selectedModule && (
          <QuizPlayer
            quiz={selectedModule.quiz}
            isOpen={isQuizOpen}
            onClose={closeQuiz}
            moduleTitle={selectedModule.titre}
          />
        )}
      </AnimatePresence>
    </div>
  )
}