'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Kanban, UserCircle, Rocket, ChevronLeft, ChevronRight,
  X, Sparkles, BookOpen, GraduationCap, Zap, Phone, Mail,
  ArrowRight, Check, PartyPopper
} from 'lucide-react'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useOnboardingProgress, useCompleteOnboardingStep } from '@/hooks/use-onboarding'
import { createClient } from '@/lib/infra/supabase-client'
import { useQueryClient } from '@tanstack/react-query'
import confetti from 'canvas-confetti'

// ============================================================
// Wizard d'onboarding — 5 étapes pour guider les nouveaux users
// ============================================================

const WIZARD_STEPS = [
  'welcome',
  'create-lead',
  'pipeline',
  'profile',
  'ready',
] as const

type WizardStep = (typeof WIZARD_STEPS)[number]

// Map wizard steps to onboarding_progress step_ids
const STEP_TO_ONBOARDING_ID: Record<WizardStep, string> = {
  'welcome': 'wizard_welcome',
  'create-lead': 'basique_creer_lead',
  'pipeline': 'basique_pipeline',
  'profile': 'wizard_profile',
  'ready': 'wizard_complete',
}

interface LeadForm {
  prenom: string
  nom: string
  email: string
  telephone: string
}

const SLIDE_VARIANTS = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
  }),
}

export function OnboardingWizard() {
  const { data: user } = useCurrentUser()
  const { data: progress, isLoading } = useOnboardingProgress(user?.auth_id)
  const completeStep = useCompleteOnboardingStep()
  const queryClient = useQueryClient()
  const supabase = createClient()

  const [visible, setVisible] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(0)
  const [leadForm, setLeadForm] = useState<LeadForm>({ prenom: '', nom: '', email: '', telephone: '' })
  const [leadCreating, setLeadCreating] = useState(false)
  const [leadCreated, setLeadCreated] = useState(false)
  const [profileForm, setProfileForm] = useState({ prenom: '', nom: '', role: '', specialites: '' })
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)

  // Determine visibility: show if wizard_complete is NOT in completed steps
  useEffect(() => {
    if (isLoading || !user?.auth_id) return

    const completedIds = progress?.completedIds || []
    const wizardDone = completedIds.includes('wizard_complete')
    const dismissed = localStorage.getItem(`onboarding-wizard-dismissed-${user.auth_id}`)

    if (!wizardDone && !dismissed) {
      setVisible(true)
      // Resume from last completed step
      const lastCompleted = WIZARD_STEPS.findIndex((step) => {
        const stepId = STEP_TO_ONBOARDING_ID[step]
        return !completedIds.includes(stepId)
      })
      if (lastCompleted > 0) setCurrentIndex(lastCompleted)
    }
  }, [isLoading, progress, user?.auth_id])

  // Pre-fill profile from current user
  useEffect(() => {
    if (user) {
      setProfileForm((prev) => ({
        ...prev,
        prenom: prev.prenom || user.prenom || '',
        nom: prev.nom || user.nom || '',
        role: prev.role || user.role || '',
      }))
    }
  }, [user])

  const currentStep = WIZARD_STEPS[currentIndex]
  const totalSteps = WIZARD_STEPS.length
  const progressPercent = ((currentIndex + 1) / totalSteps) * 100

  const markStepDone = useCallback(
    (step: WizardStep) => {
      if (!user?.auth_id) return
      const stepId = STEP_TO_ONBOARDING_ID[step]
      completeStep.mutate({ userId: user.auth_id, stepId })
    },
    [user?.auth_id, completeStep]
  )

  const goNext = useCallback(() => {
    markStepDone(currentStep)
    if (currentIndex < totalSteps - 1) {
      setDirection(1)
      setCurrentIndex((i) => i + 1)
    }
  }, [currentIndex, currentStep, markStepDone, totalSteps])

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setDirection(-1)
      setCurrentIndex((i) => i - 1)
    }
  }, [currentIndex])

  const skip = useCallback(() => {
    goNext()
  }, [goNext])

  const dismiss = useCallback(() => {
    if (user?.auth_id) {
      localStorage.setItem(`onboarding-wizard-dismissed-${user.auth_id}`, 'true')
    }
    setVisible(false)
  }, [user?.auth_id])

  const finish = useCallback(() => {
    markStepDone('ready')
    // Confettis !
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#FF5C00', '#22C55E', '#F59E0B', '#FF2D78', '#EF4444'],
    })
    setTimeout(() => setVisible(false), 2000)
  }, [markStepDone])

  // Create lead handler
  const handleCreateLead = async () => {
    if (!leadForm.prenom.trim() || (!leadForm.email.trim() && !leadForm.telephone.trim())) return
    setLeadCreating(true)
    try {
      const { error } = await supabase.from('leads').insert({
        prenom: leadForm.prenom.trim(),
        nom: leadForm.nom.trim(),
        email: leadForm.email.trim() || null,
        telephone: leadForm.telephone.trim() || null,
        source: 'onboarding',
        statut: 'NOUVEAU',
      })
      if (!error) {
        setLeadCreated(true)
        queryClient.invalidateQueries({ queryKey: ['leads'] })
        markStepDone('create-lead')
      }
    } catch {
      // silent
    } finally {
      setLeadCreating(false)
    }
  }

  // Save profile handler
  const handleSaveProfile = async () => {
    if (!user?.auth_id) return
    setProfileSaving(true)
    try {
      // Update equipe table if user has equipe_id
      if (user.equipe_id) {
        await supabase
          .from('equipe')
          .update({
            prenom: profileForm.prenom.trim(),
            nom: profileForm.nom.trim(),
          })
          .eq('id', user.equipe_id)
      }
      setProfileSaved(true)
      queryClient.invalidateQueries({ queryKey: ['current-user'] })
      markStepDone('profile')
    } catch {
      // silent
    } finally {
      setProfileSaving(false)
    }
  }

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={dismiss}
      />

      {/* Dialog */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-lg mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Close button */}
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 z-20 p-1.5 rounded-lg text-[#999999] hover:text-[#777777] hover:bg-[#F4F0EB] transition"
          title="Passer l'onboarding"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Progress bar */}
        <div className="h-1 bg-[#F4F0EB]">
          <motion.div
            className="h-full bg-gradient-to-r from-[#FF5C00] to-[#22C55E]"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>

        {/* Stepper dots */}
        <div className="flex items-center justify-center gap-2 pt-5 pb-2">
          {WIZARD_STEPS.map((_, idx) => (
            <div
              key={idx}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                idx === currentIndex
                  ? 'bg-[#FF5C00] scale-125 shadow-md shadow-[#FF5C00]/30'
                  : idx < currentIndex
                  ? 'bg-[#22C55E]'
                  : 'bg-[#EEEEEE]'
              }`}
            />
          ))}
        </div>

        {/* Step content */}
        <div className="relative overflow-hidden" style={{ minHeight: 360 }}>
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={SLIDE_VARIANTS}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="px-8 py-6"
            >
              {currentStep === 'welcome' && <StepWelcome />}
              {currentStep === 'create-lead' && (
                <StepCreateLead
                  form={leadForm}
                  onChange={setLeadForm}
                  onCreate={handleCreateLead}
                  creating={leadCreating}
                  created={leadCreated}
                />
              )}
              {currentStep === 'pipeline' && <StepPipeline />}
              {currentStep === 'profile' && (
                <StepProfile
                  form={profileForm}
                  onChange={setProfileForm}
                  onSave={handleSaveProfile}
                  saving={profileSaving}
                  saved={profileSaved}
                />
              )}
              {currentStep === 'ready' && <StepReady />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer navigation */}
        <div className="flex items-center justify-between px-8 pb-6">
          <button
            onClick={goPrev}
            disabled={currentIndex === 0}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-[#999999] hover:text-[#777777] disabled:opacity-0 disabled:pointer-events-none transition"
          >
            <ChevronLeft className="w-4 h-4" />
            Precedent
          </button>

          <div className="flex items-center gap-2">
            {currentIndex < totalSteps - 1 && currentStep !== 'welcome' && (
              <button
                onClick={skip}
                className="px-4 py-2 text-sm text-[#999999] hover:text-[#777777] transition"
              >
                Passer
              </button>
            )}

            {currentStep === 'ready' ? (
              <button
                onClick={finish}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#FF5C00] to-[#22C55E] text-white text-sm font-medium rounded-xl hover:shadow-lg hover:shadow-[#FF5C00]/25 transition-all duration-200"
              >
                Commencer a travailler
                <Rocket className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={goNext}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#FF5C00] text-white text-sm font-medium rounded-xl hover:bg-[#1ab5e2] hover:shadow-lg hover:shadow-[#FF5C00]/25 transition-all duration-200"
              >
                {currentStep === 'welcome' ? "C'est parti !" : 'Suivant'}
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// ============================================================
// Step Components
// ============================================================

function StepWelcome() {
  return (
    <div className="text-center space-y-6">
      <div className="flex justify-center">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#FF5C00]/10 to-[#22C55E]/10 flex items-center justify-center">
          <Sparkles className="w-10 h-10 text-[#FF5C00]" />
        </div>
      </div>
      <div>
        <h2 className="text-2xl font-bold text-[#111111] font-heading">
          Bienvenue sur Satorea CRM !
        </h2>
        <p className="mt-2 text-sm text-[#777777]">
          Votre centre de formation merite le meilleur outil.
        </p>
      </div>
      <div className="space-y-3 text-left max-w-sm mx-auto">
        <BulletPoint
          icon={Users}
          color="#FF5C00"
          text="Gerez vos leads et suivez chaque prospect"
        />
        <BulletPoint
          icon={GraduationCap}
          color="#22C55E"
          text="Planifiez vos formations et gerez les inscriptions"
        />
        <BulletPoint
          icon={Zap}
          color="#F59E0B"
          text="Automatisez votre prospection avec l'IA"
        />
      </div>
    </div>
  )
}

function StepCreateLead({
  form,
  onChange,
  onCreate,
  creating,
  created,
}: {
  form: LeadForm
  onChange: (f: LeadForm) => void
  onCreate: () => void
  creating: boolean
  created: boolean
}) {
  const update = (field: keyof LeadForm, value: string) =>
    onChange({ ...form, [field]: value })

  return (
    <div className="space-y-5">
      <div className="text-center">
        <div className="flex justify-center mb-3">
          <div className="w-16 h-16 rounded-2xl bg-[#FF5C00]/10 flex items-center justify-center">
            <Users className="w-8 h-8 text-[#FF5C00]" />
          </div>
        </div>
        <h2 className="text-xl font-bold text-[#111111] font-heading">
          Creez votre premier lead
        </h2>
        <p className="mt-1 text-sm text-[#777777]">
          Ajoutez un prospect pour voir le CRM en action
        </p>
      </div>

      {created ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-3 py-6"
        >
          <div className="w-14 h-14 rounded-full bg-[#22C55E]/10 flex items-center justify-center">
            <Check className="w-7 h-7 text-[#22C55E]" />
          </div>
          <p className="text-sm font-medium text-[#22C55E]">
            Lead cree avec succes !
          </p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <InputField
              label="Prenom"
              value={form.prenom}
              onChange={(v) => update('prenom', v)}
              placeholder="Marie"
              required
            />
            <InputField
              label="Nom"
              value={form.nom}
              onChange={(v) => update('nom', v)}
              placeholder="Dupont"
            />
          </div>
          <InputField
            label="Email"
            value={form.email}
            onChange={(v) => update('email', v)}
            placeholder="marie@exemple.fr"
            type="email"
            icon={Mail}
          />
          <InputField
            label="Telephone"
            value={form.telephone}
            onChange={(v) => update('telephone', v)}
            placeholder="06 12 34 56 78"
            type="tel"
            icon={Phone}
          />
          <button
            onClick={onCreate}
            disabled={creating || !form.prenom.trim() || (!form.email.trim() && !form.telephone.trim())}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#FF5C00] text-white text-sm font-medium rounded-xl hover:bg-[#1ab5e2] disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {creating ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Users className="w-4 h-4" />
                Creer le lead
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}

function StepPipeline() {
  const columns = [
    { label: 'Nouveau', color: '#64748B', count: 3 },
    { label: 'Contacte', color: '#FF5C00', count: 2 },
    { label: 'Qualifie', color: '#F59E0B', count: 1 },
    { label: 'Gagne', color: '#22C55E', count: 1 },
  ]

  return (
    <div className="space-y-5">
      <div className="text-center">
        <div className="flex justify-center mb-3">
          <div className="w-16 h-16 rounded-2xl bg-[#F59E0B]/10 flex items-center justify-center">
            <Kanban className="w-8 h-8 text-[#F59E0B]" />
          </div>
        </div>
        <h2 className="text-xl font-bold text-[#111111] font-heading">
          Decouvrez le pipeline
        </h2>
        <p className="mt-1 text-sm text-[#777777]">
          Glissez vos leads d'etape en etape pour suivre leur progression
        </p>
      </div>

      {/* Mini Kanban preview */}
      <div className="grid grid-cols-4 gap-2">
        {columns.map((col) => (
          <div key={col.label} className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: col.color }}
              />
              <span className="text-[10px] font-medium text-[#777777] truncate">
                {col.label}
              </span>
              <span className="text-[10px] text-[#999999] ml-auto">
                {col.count}
              </span>
            </div>
            <div className="space-y-1">
              {Array.from({ length: col.count }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * i + 0.2 }}
                  className="h-8 bg-[#FAF8F5] border border-[#F4F0EB] rounded-lg"
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-[#FF5C00]/5 border border-[#FF5C00]/20 rounded-xl p-3">
        <p className="text-xs text-[#FF5C00] text-center">
          Glissez-deposez vos leads entre les colonnes pour mettre a jour leur statut en un clic
        </p>
      </div>
    </div>
  )
}

function StepProfile({
  form,
  onChange,
  onSave,
  saving,
  saved,
}: {
  form: { prenom: string; nom: string; role: string; specialites: string }
  onChange: (f: { prenom: string; nom: string; role: string; specialites: string }) => void
  onSave: () => void
  saving: boolean
  saved: boolean
}) {
  const update = (field: string, value: string) =>
    onChange({ ...form, [field]: value })

  return (
    <div className="space-y-5">
      <div className="text-center">
        <div className="flex justify-center mb-3">
          <div className="w-16 h-16 rounded-2xl bg-[#FF2D78]/10 flex items-center justify-center">
            <UserCircle className="w-8 h-8 text-[#FF2D78]" />
          </div>
        </div>
        <h2 className="text-xl font-bold text-[#111111] font-heading">
          Configurez votre profil
        </h2>
        <p className="mt-1 text-sm text-[#777777]">
          Personnalisez votre espace de travail
        </p>
      </div>

      {saved ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-3 py-6"
        >
          <div className="w-14 h-14 rounded-full bg-[#22C55E]/10 flex items-center justify-center">
            <Check className="w-7 h-7 text-[#22C55E]" />
          </div>
          <p className="text-sm font-medium text-[#22C55E]">
            Profil enregistre !
          </p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <InputField
              label="Prenom"
              value={form.prenom}
              onChange={(v) => update('prenom', v)}
              placeholder="Votre prenom"
            />
            <InputField
              label="Nom"
              value={form.nom}
              onChange={(v) => update('nom', v)}
              placeholder="Votre nom"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#777777] mb-1">
              Role
            </label>
            <select
              value={form.role}
              onChange={(e) => update('role', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#EEEEEE] rounded-xl bg-white text-[#111111] focus:outline-none focus:ring-2 focus:ring-[#FF5C00]/30 focus:border-[#FF5C00] transition"
            >
              <option value="">Selectionnez</option>
              <option value="admin">Administrateur</option>
              <option value="manager">Manager</option>
              <option value="commercial">Commercial</option>
              <option value="formatrice">Formateur / Formatrice</option>
            </select>
          </div>
          <InputField
            label="Specialites"
            value={form.specialites}
            onChange={(v) => update('specialites', v)}
            placeholder="Ex: Esthetique, Maquillage permanent..."
          />
          <button
            onClick={onSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#FF2D78] text-white text-sm font-medium rounded-xl hover:bg-[#7C3AED] disabled:opacity-50 transition"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Check className="w-4 h-4" />
                Enregistrer
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}

function StepReady() {
  const links = [
    { href: '/leads', label: 'Ajouter un lead', icon: Users, color: '#FF5C00' },
    { href: '/pipeline', label: 'Voir le pipeline', icon: Kanban, color: '#F59E0B' },
    { href: '/academy', label: "Explorer l'Academy", icon: BookOpen, color: '#FF2D78' },
  ]

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex justify-center mb-3">
          <div className="w-16 h-16 rounded-2xl bg-[#22C55E]/10 flex items-center justify-center">
            <PartyPopper className="w-8 h-8 text-[#22C55E]" />
          </div>
        </div>
        <h2 className="text-xl font-bold text-[#111111] font-heading">
          Vous etes pret !
        </h2>
        <p className="mt-1 text-sm text-[#777777]">
          Votre CRM est configure. Voici vos prochaines actions.
        </p>
      </div>

      <div className="space-y-2">
        {links.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[#F4F0EB] hover:border-[#EEEEEE] hover:bg-[#FAF8F5] transition group"
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${link.color}10` }}
            >
              <link.icon className="w-4.5 h-4.5" style={{ color: link.color }} />
            </div>
            <span className="text-sm font-medium text-[#3A3A3A] flex-1">
              {link.label}
            </span>
            <ArrowRight className="w-4 h-4 text-[#999999] group-hover:text-[#777777] group-hover:translate-x-0.5 transition-all" />
          </a>
        ))}
      </div>
    </div>
  )
}

// ============================================================
// Shared UI
// ============================================================

function BulletPoint({
  icon: Icon,
  color,
  text,
}: {
  icon: React.ElementType
  color: string
  text: string
}) {
  return (
    <div className="flex items-start gap-3">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
        style={{ backgroundColor: `${color}15` }}
      >
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <p className="text-sm text-[#777777] leading-relaxed">{text}</p>
    </div>
  )
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  required,
  icon: Icon,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  required?: boolean
  icon?: React.ElementType
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-[#777777] mb-1">
        {label}
        {required && <span className="text-[#FF2D78] ml-0.5">*</span>}
      </label>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999999]" />
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full px-3 py-2 text-sm border border-[#EEEEEE] rounded-xl bg-white text-[#111111] placeholder:text-[#999999] focus:outline-none focus:ring-2 focus:ring-[#FF5C00]/30 focus:border-[#FF5C00] transition ${
            Icon ? 'pl-9' : ''
          }`}
        />
      </div>
    </div>
  )
}
