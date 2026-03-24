'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useUser } from '@/hooks/use-user'
import { createClient } from '@/lib/supabase-client'
import {
  ArrowLeft, Clock, Trophy, BookOpen, Video, HelpCircle,
  CheckSquare, MessageSquare, FileText, PenTool, Check,
  ChevronRight, ChevronLeft, Play, User, Bot, AlertCircle,
  Download, ExternalLink
} from 'lucide-react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { cn } from '@/lib/utils'
import { sanitizeEmail } from '@/lib/sanitize'
import { useAcademyModule, useCompleteLesson } from '@/hooks/use-academy'
import type { AcademyLesson } from '@/types'

function getLessonIcon(type: string, className = "w-4 h-4") {
  switch (type) {
    case 'texte':
      return <BookOpen className={className} />
    case 'video':
      return <Video className={className} />
    case 'quiz':
      return <HelpCircle className={className} />
    case 'checklist':
      return <CheckSquare className={className} />
    case 'script':
      return <MessageSquare className={className} />
    case 'pdf':
      return <FileText className={className} />
    case 'exercice':
      return <PenTool className={className} />
    default:
      return <BookOpen className={className} />
  }
}

function getLessonTypeBadge(type: string) {
  const configs = {
    texte: { label: 'Article', color: 'bg-[#E0EBF5] text-[#6B8CAE]' },
    video: { label: 'Vidéo', color: 'bg-[#FFE0EF] text-[#FF2D78]' },
    quiz: { label: 'Quiz', color: 'bg-[#FFE0EF] text-[#FF2D78]' },
    checklist: { label: 'Checklist', color: 'bg-[#D1FAE5] text-[#10B981]' },
    script: { label: 'Script', color: 'bg-orange-100 text-orange-700' },
    pdf: { label: 'PDF', color: 'bg-[#F4F0EB] text-[#3A3A3A]' },
    exercice: { label: 'Exercice', color: 'bg-pink-100 text-pink-700' }
  }

  const config = configs[type as keyof typeof configs] || configs.texte
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
      {getLessonIcon(type, "w-3 h-3")}
      {config.label}
    </span>
  )
}

// Composants de rendu de contenu par type
function TexteContent({ contenu }: { contenu: any }) {
  return (
    <div className="prose prose-gray max-w-none">
      <div
        className="whitespace-pre-wrap leading-relaxed"
        dangerouslySetInnerHTML={{ __html: sanitizeEmail(contenu.body || 'Contenu à venir...') }}
      />
    </div>
  )
}

function VideoContent({ contenu }: { contenu: any }) {
  return (
    <div className="space-y-4">
      {contenu.url ? (
        <div className="relative aspect-video bg-[#111111] rounded-lg overflow-hidden">
          {contenu.url.includes('youtube.com') || contenu.url.includes('youtu.be') ? (
            <iframe
              src={contenu.url.replace('watch?v=', 'embed/')}
              className="w-full h-full"
              allowFullScreen
              title="Vidéo de formation"
            />
          ) : (
            <video
              controls
              className="w-full h-full object-cover"
              src={contenu.url}
            >
              Votre navigateur ne supporte pas la lecture vidéo.
            </video>
          )}
        </div>
      ) : (
        <div className="aspect-video bg-[#F4F0EB] rounded-lg flex items-center justify-center">
          <div className="text-center text-[#777777]">
            <Video className="w-12 h-12 mx-auto mb-2" />
            <p>Vidéo à venir</p>
          </div>
        </div>
      )}

      {contenu.transcript && (
        <div className="bg-[#FAF8F5] p-4 rounded-lg">
          <h4 className="font-medium mb-2">Transcription</h4>
          <p className="text-sm text-[#777777] whitespace-pre-wrap">
            {contenu.transcript}
          </p>
        </div>
      )}
    </div>
  )
}

function QuizContent({ contenu, onComplete }: { contenu: any; onComplete: (score: number) => void }) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [isCompleted, setIsCompleted] = useState(false)
  const [score, setScore] = useState(0)

  const questions = contenu.questions || []

  const handleAnswer = (questionIndex: number, answerIndex: number) => {
    setAnswers(prev => ({ ...prev, [questionIndex]: answerIndex }))
  }

  const handleSubmit = () => {
    let correctAnswers = 0
    questions.forEach((q: any, qIndex: number) => {
      if (answers[qIndex] === q.correct_answer) {
        correctAnswers++
      }
    })

    const finalScore = Math.round((correctAnswers / questions.length) * 100)
    setScore(finalScore)
    setIsCompleted(true)
    onComplete(finalScore)
  }

  if (questions.length === 0) {
    return (
      <div className="text-center py-8">
        <HelpCircle className="w-12 h-12 text-[#999999] mx-auto mb-4" />
        <h3 className="font-medium text-[#777777] mb-2">Quiz à venir</h3>
        <p className="text-sm text-[#777777]">Les questions seront bientôt disponibles.</p>
      </div>
    )
  }

  if (isCompleted) {
    return (
      <div className="text-center py-8">
        <div className={cn(
          "w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4",
          score >= 80 ? "bg-[#D1FAE5] text-[#10B981]" :
          score >= 60 ? "bg-[#FFF3E8] text-[#FF8C42]" :
          "bg-[#FFE0EF] text-[#FF2D78]"
        )}>
          <Trophy className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold mb-2">Quiz terminé !</h3>
        <p className="text-[#777777] mb-4">
          Votre score : <strong>{score}%</strong> ({score >= 80 ? 'Excellent' : score >= 60 ? 'Bien' : 'À revoir'})
        </p>

        {/* Résultats détaillés */}
        <div className="text-left space-y-4">
          {questions.map((q: any, qIndex: number) => (
            <div
              key={qIndex}
              className={cn(
                "p-4 rounded-lg border",
                answers[qIndex] === q.correct_answer
                  ? "bg-[#ECFDF5] border-[#10B981]/30"
                  : "bg-[#FFE0EF] border-[#FF2D78]/30"
              )}
            >
              <p className="font-medium mb-2">{q.question}</p>
              <p className="text-sm text-[#777777]">
                <strong>Votre réponse :</strong> {q.options[answers[qIndex]] || 'Non répondu'}
              </p>
              {answers[qIndex] !== q.correct_answer && (
                <p className="text-sm text-[#10B981]">
                  <strong>Bonne réponse :</strong> {q.options[q.correct_answer]}
                </p>
              )}
              {q.explanation && (
                <p className="text-sm text-[#777777] mt-2 italic">
                  {q.explanation}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  const currentQ = questions[currentQuestion]
  const totalAnswered = Object.keys(answers).length
  const canSubmit = totalAnswered === questions.length

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex items-center justify-between text-sm text-[#777777]">
        <span>Question {currentQuestion + 1} sur {questions.length}</span>
        <span>{totalAnswered}/{questions.length} réponses</span>
      </div>

      {/* Question */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4">{currentQ.question}</h3>

        <div className="space-y-3">
          {currentQ.options.map((option: string, optIndex: number) => (
            <button
              key={optIndex}
              onClick={() => handleAnswer(currentQuestion, optIndex)}
              className={cn(
                "w-full p-3 text-left rounded-lg border transition-colors",
                answers[currentQuestion] === optIndex
                  ? "bg-[#E0EBF5] border-blue-300 text-[#6B8CAE]"
                  : "bg-[#FAF8F5] border-[#EEEEEE] hover:bg-[#F4F0EB]"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                  answers[currentQuestion] === optIndex
                    ? "border-blue-500 bg-[#6B8CAE]"
                    : "border-[#EEEEEE]"
                )}>
                  {answers[currentQuestion] === optIndex && (
                    <Check className="w-3 h-3 text-white" />
                  )}
                </div>
                <span>{option}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
          disabled={currentQuestion === 0}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Précédent
        </Button>

        {currentQuestion < questions.length - 1 ? (
          <Button
            onClick={() => setCurrentQuestion(prev => Math.min(questions.length - 1, prev + 1))}
            disabled={answers[currentQuestion] === undefined}
          >
            Suivant
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="bg-[#10B981] hover:bg-green-700"
          >
            Terminer le quiz
          </Button>
        )}
      </div>
    </div>
  )
}

function ChecklistContent({ contenu, onComplete }: { contenu: any; onComplete: () => void }) {
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({})
  const items = contenu.items || []

  const handleCheck = (index: number, checked: boolean) => {
    setCheckedItems(prev => ({ ...prev, [index]: checked }))
  }

  const completedItems = Object.values(checkedItems).filter(Boolean).length
  const isCompleted = completedItems === items.length

  useEffect(() => {
    if (isCompleted && items.length > 0) {
      onComplete()
    }
  }, [isCompleted, items.length, onComplete])

  return (
    <div className="space-y-4">
      {items.length > 0 ? (
        <>
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Liste de contrôle</h3>
            <span className="text-sm text-[#777777]">
              {completedItems}/{items.length} terminé
            </span>
          </div>

          <div className="space-y-3">
            {items.map((item: string, index: number) => (
              <label
                key={index}
                className="flex items-center gap-3 p-3 rounded-lg border bg-[#FAF8F5] cursor-pointer hover:bg-[#F4F0EB]"
              >
                <input
                  type="checkbox"
                  checked={checkedItems[index] || false}
                  onChange={(e) => handleCheck(index, e.target.checked)}
                  className="w-5 h-5 text-[#6B8CAE] rounded focus:ring-[#FF5C00]"
                />
                <span className={cn(
                  "flex-1",
                  checkedItems[index] ? "line-through text-[#777777]" : "text-[#111111]"
                )}>
                  {item}
                </span>
              </label>
            ))}
          </div>

          {isCompleted && (
            <div className="bg-[#ECFDF5] border border-[#10B981]/30 rounded-lg p-4 text-center">
              <Check className="w-6 h-6 text-[#10B981] mx-auto mb-2" />
              <p className="text-[#10B981] font-medium">Checklist complétée !</p>
            </div>
          )}
        </>
      ) : (
        <EmptyState
          icon={<CheckSquare className="w-6 h-6" />}
          title="Checklist à venir"
          description="Les éléments à vérifier seront bientôt disponibles"
        />
      )}
    </div>
  )
}

function ScriptContent({ contenu }: { contenu: any }) {
  const dialogues = contenu.dialogues || []

  return (
    <div className="space-y-4">
      {dialogues.length > 0 ? (
        <div className="space-y-4">
          {dialogues.map((dialogue: any, index: number) => (
            <div
              key={index}
              className={cn(
                "flex gap-3",
                dialogue.speaker === 'Commercial' ? "justify-start" : "justify-end"
              )}
            >
              <div className={cn(
                "max-w-md p-4 rounded-lg",
                dialogue.speaker === 'Commercial'
                  ? "bg-[#E0EBF5] border border-[#6B8CAE]/30"
                  : "bg-[#FAF8F5] border border-[#EEEEEE]"
              )}>
                <div className="flex items-center gap-2 mb-2">
                  {dialogue.speaker === 'Commercial' ? (
                    <User className="w-4 h-4 text-[#6B8CAE]" />
                  ) : (
                    <Bot className="w-4 h-4 text-[#777777]" />
                  )}
                  <span className="text-xs font-medium text-[#3A3A3A]">
                    {dialogue.speaker}
                  </span>
                </div>
                <p className="text-sm text-[#111111]">
                  {dialogue.text}
                </p>
                {dialogue.note && (
                  <p className="text-xs text-[#777777] mt-2 italic bg-[#FFF3E8] p-2 rounded border">
                    💡 {dialogue.note}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<MessageSquare className="w-6 h-6" />}
          title="Script à venir"
          description="Le script de vente sera bientôt disponible"
        />
      )}
    </div>
  )
}

function PdfContent({ contenu }: { contenu: any }) {
  return (
    <div className="space-y-4">
      {contenu.url ? (
        <div className="bg-[#FAF8F5] border rounded-lg p-6 text-center">
          <FileText className="w-12 h-12 text-[#999999] mx-auto mb-4" />
          <h3 className="font-medium mb-2">Document PDF</h3>
          <p className="text-sm text-[#777777] mb-4">
            {contenu.title || 'Document de formation'}
          </p>
          <div className="flex gap-2 justify-center">
            <a href={contenu.url} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">
                <ExternalLink className="w-4 h-4 mr-2" />
                Ouvrir
              </Button>
            </a>
            <a href={contenu.url} download>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Télécharger
              </Button>
            </a>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={<FileText className="w-6 h-6" />}
          title="Document à venir"
          description="Le PDF sera bientôt disponible"
        />
      )}
    </div>
  )
}

function ExerciceContent({ contenu }: { contenu: any }) {
  return (
    <div className="space-y-6">
      {contenu.consigne ? (
        <>
          <div className="bg-[#E0EBF5] border border-[#6B8CAE]/30 rounded-lg p-4">
            <h3 className="font-medium text-[#6B8CAE] mb-2">Consignes</h3>
            <p className="text-[#6B8CAE] whitespace-pre-wrap">
              {contenu.consigne}
            </p>
          </div>

          {contenu.example && (
            <div className="bg-[#FAF8F5] border rounded-lg p-4">
              <h4 className="font-medium mb-2">Exemple</h4>
              <p className="text-[#3A3A3A] whitespace-pre-wrap">
                {contenu.example}
              </p>
            </div>
          )}

          {contenu.criteria && contenu.criteria.length > 0 && (
            <div className="bg-[#ECFDF5] border border-[#10B981]/30 rounded-lg p-4">
              <h4 className="font-medium text-[#10B981] mb-3">Critères d'évaluation</h4>
              <ul className="space-y-2">
                {contenu.criteria.map((criterion: string, index: number) => (
                  <li key={index} className="flex items-start gap-2 text-[#10B981]">
                    <Check className="w-4 h-4 text-[#10B981] mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{criterion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      ) : (
        <EmptyState
          icon={<PenTool className="w-6 h-6" />}
          title="Exercice à venir"
          description="Les instructions de l'exercice seront bientôt disponibles"
        />
      )}
    </div>
  )
}

export default function LessonPage() {
  const params = useParams()
  const router = useRouter()
  const user = useUser()
  const queryClient = useQueryClient()

  const slug = params?.slug as string
  const lessonSlug = params?.lessonSlug as string

  // Récupérer les données utilisateur depuis la table equipe
  const { data: currentUser } = useQuery({
    queryKey: ['current-user-equipe', user?.id],
    queryFn: async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('equipe')
        .select('id, prenom, nom')
        .eq('auth_user_id', user!.id)
        .single()
      return data
    },
    enabled: !!user?.id
  })

  const { data: module, isLoading: moduleLoading } = useAcademyModule(slug)

  const completeLesson = useCompleteLesson()

  // Trouver la leçon actuelle
  const lesson = module?.lessons?.find((l: AcademyLesson) => l.slug === lessonSlug)
  const lessons = module?.lessons || []
  const currentIndex = lessons.findIndex((l: AcademyLesson) => l.slug === lessonSlug)
  const nextLesson = currentIndex >= 0 && currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null

  // Vérifier si la leçon est complétée
  const { data: userProgress } = useQuery({
    queryKey: ['lesson-progress', currentUser?.id, lesson?.id],
    queryFn: async () => {
      if (!currentUser?.id || !lesson?.id) return null
      const supabase = createClient()
      const { data } = await supabase
        .from('academy_progress')
        .select('*')
        .eq('user_id', currentUser.id)
        .eq('lesson_id', lesson.id)
        .single()
      return data
    },
    enabled: !!currentUser?.id && !!lesson?.id
  })

  const isCompleted = userProgress?.statut === 'complete'

  const handleComplete = async (score?: number) => {
    if (!currentUser?.id || !lesson?.id) return

    try {
      await completeLesson.mutateAsync({
        user_id: currentUser.id,
        lesson_id: lesson.id,
        score_quiz: score
      })

      // Rafraîchir les données
      queryClient.invalidateQueries({ queryKey: ['lesson-progress'] })
      queryClient.invalidateQueries({ queryKey: ['academy-progress'] })
      queryClient.invalidateQueries({ queryKey: ['academy-stats'] })
    } catch (error) {
      console.error('Erreur lors de la completion de la leçon:', error)
    }
  }

  if (moduleLoading || !module) {
    return (
      <div className="space-y-6">
        <div className="h-20"><SkeletonCard /></div>
        <div className="h-96"><SkeletonCard /></div>
      </div>
    )
  }

  if (!lesson) {
    return (
      <div className="min-h-96 flex items-center justify-center">
        <EmptyState
          icon={<BookOpen className="w-8 h-8" />}
          title="Leçon introuvable"
          description="Cette leçon n'existe pas ou n'est pas disponible"
        />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-[#777777]">
        <Link href="/academy" className="hover:text-[#111111]">Mon coaching</Link>
        <span>›</span>
        <Link href={`/academy/${slug}`} className="hover:text-[#111111]">{module.titre}</Link>
        <span>›</span>
        <span className="text-[#111111] font-medium">{lesson.titre}</span>
      </nav>

      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/academy/${slug}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour au module
          </Button>
        </Link>

        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            {getLessonTypeBadge(lesson.type)}
            <span className="text-sm text-[#777777]">{lesson.duree_minutes} min</span>
            <span className="text-sm text-[#777777]">{lesson.points} points</span>
            {isCompleted && (
              <Badge variant="success" size="sm">
                <Check className="w-3 h-3 mr-1" />
                Terminé
              </Badge>
            )}
          </div>

          <h1 className="text-2xl font-bold text-[#111111]">
            {lesson.titre}
          </h1>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Contenu de la leçon */}
        <div className="lg:col-span-3">
          <Card className="min-h-96">
            <CardContent className="p-6">
              {lesson.type === 'texte' && <TexteContent contenu={lesson.contenu} />}
              {lesson.type === 'video' && <VideoContent contenu={lesson.contenu} />}
              {lesson.type === 'quiz' && <QuizContent contenu={lesson.contenu} onComplete={handleComplete} />}
              {lesson.type === 'checklist' && <ChecklistContent contenu={lesson.contenu} onComplete={() => handleComplete()} />}
              {lesson.type === 'script' && <ScriptContent contenu={lesson.contenu} />}
              {lesson.type === 'pdf' && <PdfContent contenu={lesson.contenu} />}
              {lesson.type === 'exercice' && <ExerciceContent contenu={lesson.contenu} />}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Navigation des leçons */}
          <Card>
            <CardHeader>
              <CardTitle icon={<BookOpen className="w-4 h-4" />}>
                Leçons du module
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {lessons.map((l: AcademyLesson, index) => (
                  <Link
                    key={l.id}
                    href={`/academy/${slug}/${l.slug}`}
                    className={cn(
                      "flex items-center gap-3 p-2 rounded-lg text-sm transition-colors",
                      l.id === lesson.id
                        ? "bg-[#E0EBF5] text-[#6B8CAE] border border-[#6B8CAE]/30"
                        : "text-[#777777] hover:bg-[#FAF8F5]"
                    )}
                  >
                    <div className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold",
                      l.id === lesson.id
                        ? "bg-[#6B8CAE] text-white"
                        : "bg-[#EEEEEE] text-[#777777]"
                    )}>
                      {index + 1}
                    </div>
                    <span className="truncate">{l.titre}</span>
                    {getLessonIcon(l.type, "w-3 h-3")}
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="sticky bottom-0 bg-white border-t border-[#EEEEEE] p-4">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-4">
            {!isCompleted && (lesson.type === 'texte' || lesson.type === 'video' || lesson.type === 'script' || lesson.type === 'pdf' || lesson.type === 'exercice') && (
              <Button
                onClick={() => handleComplete()}
                disabled={completeLesson.isPending}
                className="bg-[#10B981] hover:bg-green-700"
              >
                <Check className="w-4 h-4 mr-2" />
                Marquer comme terminé
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {nextLesson && (
              <Link href={`/academy/${slug}/${nextLesson.slug}`}>
                <Button variant="outline">
                  Leçon suivante
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}