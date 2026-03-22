'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import {
  Building2, Users, GraduationCap, Rocket,
  ChevronRight, ChevronLeft, Check
} from 'lucide-react'
import { cn } from '@/lib/utils'

const STEPS = [
  { id: 'entreprise', label: 'Votre entreprise', icon: Building2 },
  { id: 'equipe', label: 'Votre équipe', icon: Users },
  { id: 'objectif', label: 'Vos objectifs', icon: GraduationCap },
]

const SECTEURS = [
  'Institut de beauté',
  'Centre de formation',
  'Cabinet esthétique',
  'Salon de coiffure & beauté',
  'Spa / Bien-être',
  'Clinique esthétique',
  'Freelance / Indépendante',
  'Autre',
]

const TAILLES = [
  { value: '1', label: 'Solo (1 personne)' },
  { value: '2-5', label: 'Petite équipe (2-5)' },
  { value: '6-15', label: 'Équipe moyenne (6-15)' },
  { value: '15+', label: 'Grande équipe (15+)' },
]

const OBJECTIFS = [
  { id: 'leads', label: 'Gérer mes prospects', desc: 'Suivre les contacts et relances' },
  { id: 'formations', label: 'Organiser mes formations', desc: 'Planning, inscriptions, certificats' },
  { id: 'financement', label: 'Monter des dossiers de financement', desc: 'OPCO, CPF, France Travail' },
  { id: 'facturation', label: 'Facturer et encaisser', desc: 'Devis, factures, Stripe' },
  { id: 'equipe', label: 'Piloter mon équipe', desc: 'Objectifs, performance, attribution' },
  { id: 'qualite', label: 'Respecter Qualiopi', desc: 'Indicateurs, documents, audits' },
]

export default function OnboardingPage() {
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Form data
  const [entreprise, setEntreprise] = useState({
    nom: '',
    secteur: '',
    siret: '',
    ville: '',
  })
  const [equipe, setEquipe] = useState({
    taille: '',
    role: '',
  })
  const [objectifs, setObjectifs] = useState<string[]>([])

  const toggleObjectif = (id: string) => {
    setObjectifs(prev => prev.includes(id) ? prev.filter(o => o !== id) : [...prev, id])
  }

  const canNext = step === 0
    ? entreprise.nom && entreprise.secteur
    : step === 1
    ? equipe.taille
    : objectifs.length > 0

  const handleFinish = useCallback(async () => {
    setLoading(true)
    try {
      // Sauvegarder les données d'onboarding dans la metadata user
      const { error } = await supabase.auth.updateUser({
        data: {
          onboarding_completed: true,
          entreprise_nom: entreprise.nom,
          entreprise_secteur: entreprise.secteur,
          entreprise_siret: entreprise.siret,
          entreprise_ville: entreprise.ville,
          equipe_taille: equipe.taille,
          role_utilisateur: equipe.role,
          objectifs,
        }
      })

      if (error) throw error

      // Créer l'entrée dans la table equipe si nécessaire
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('equipe').upsert({
          auth_user_id: user.id,
          prenom: user.user_metadata?.prenom || user.email?.split('@')[0] || 'Admin',
          nom: user.user_metadata?.nom || '',
          email: user.email || '',
          role: 'admin',
          is_active: true,
        }, { onConflict: 'auth_user_id' }).select()
      }

      toast.success('Bienvenue ! Votre CRM est prêt.')
      router.push('/')
      router.refresh()
    } catch {
      toast.error('Erreur lors de la configuration. Réessayez.')
    }
    setLoading(false)
  }, [entreprise, equipe, objectifs, supabase, router])

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <h1 className="text-lg font-bold text-accent">
            <span className="text-primary">Dermotec</span> CRM
          </h1>
          <span className="text-xs text-gray-400">Étape {step + 1} sur {STEPS.length}</span>
        </div>
      </header>

      {/* Progress bar */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-6">
          <div className="flex items-center gap-2 py-3">
            {STEPS.map((s, i) => {
              const Icon = s.icon
              const isActive = i === step
              const isDone = i < step
              return (
                <div key={s.id} className="flex items-center gap-2 flex-1">
                  <div className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                    isActive ? 'bg-primary/10 text-primary' :
                    isDone ? 'bg-green-50 text-green-600' :
                    'text-gray-400'
                  )}>
                    {isDone ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                    <span className="hidden sm:inline">{s.label}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={cn('flex-1 h-0.5 rounded-full', isDone ? 'bg-green-200' : 'bg-gray-200')} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-lg">
          {/* Step 1: Entreprise */}
          {step === 0 && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h2 className="text-2xl font-bold text-accent mb-2">Parlons de votre entreprise</h2>
                <p className="text-gray-600">Ces informations nous aident à personnaliser votre CRM.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom de l&apos;entreprise *</label>
                  <input
                    type="text"
                    value={entreprise.nom}
                    onChange={e => setEntreprise(p => ({ ...p, nom: e.target.value }))}
                    placeholder="Mon Institut Beauté"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Secteur d&apos;activité *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {SECTEURS.map(s => (
                      <button
                        key={s}
                        onClick={() => setEntreprise(p => ({ ...p, secteur: s }))}
                        className={cn(
                          'px-3 py-2.5 rounded-lg text-sm text-left transition border min-h-[44px]',
                          entreprise.secteur === s
                            ? 'bg-primary/10 border-primary/30 text-primary font-medium'
                            : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">SIRET (optionnel)</label>
                    <input
                      type="text"
                      value={entreprise.siret}
                      onChange={e => setEntreprise(p => ({ ...p, siret: e.target.value }))}
                      placeholder="123 456 789 00012"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Ville</label>
                    <input
                      type="text"
                      value={entreprise.ville}
                      onChange={e => setEntreprise(p => ({ ...p, ville: e.target.value }))}
                      placeholder="Paris"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Équipe */}
          {step === 1 && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h2 className="text-2xl font-bold text-accent mb-2">Votre équipe</h2>
                <p className="text-gray-600">Combien de personnes utiliseront le CRM ?</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Taille de l&apos;équipe *</label>
                  <div className="grid grid-cols-2 gap-3">
                    {TAILLES.map(t => (
                      <button
                        key={t.value}
                        onClick={() => setEquipe(p => ({ ...p, taille: t.value }))}
                        className={cn(
                          'px-4 py-4 rounded-xl text-left transition border min-h-[60px]',
                          equipe.taille === t.value
                            ? 'bg-primary/10 border-primary/30 ring-2 ring-primary/20'
                            : 'border-gray-200 hover:bg-gray-50'
                        )}
                      >
                        <span className={cn('text-sm font-medium', equipe.taille === t.value ? 'text-primary' : 'text-gray-800')}>
                          {t.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Votre rôle</label>
                  <select
                    value={equipe.role}
                    onChange={e => setEquipe(p => ({ ...p, role: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm bg-white focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                  >
                    <option value="">Sélectionnez...</option>
                    <option value="dirigeant">Dirigeant(e)</option>
                    <option value="commercial">Responsable commercial</option>
                    <option value="formatrice">Formatrice</option>
                    <option value="assistante">Assistante administrative</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Objectifs */}
          {step === 2 && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h2 className="text-2xl font-bold text-accent mb-2">Vos priorités</h2>
                <p className="text-gray-600">Qu&apos;attendez-vous du CRM ? (Sélectionnez au moins 1)</p>
              </div>

              <div className="space-y-3">
                {OBJECTIFS.map(obj => (
                  <button
                    key={obj.id}
                    onClick={() => toggleObjectif(obj.id)}
                    className={cn(
                      'w-full flex items-start gap-3 p-4 rounded-xl text-left transition border min-h-[60px]',
                      objectifs.includes(obj.id)
                        ? 'bg-primary/5 border-primary/30 ring-2 ring-primary/20'
                        : 'border-gray-200 hover:bg-gray-50'
                    )}
                  >
                    <div className={cn(
                      'w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition',
                      objectifs.includes(obj.id)
                        ? 'bg-primary border-primary'
                        : 'border-gray-300'
                    )}>
                      {objectifs.includes(obj.id) && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div>
                      <p className={cn('text-sm font-medium', objectifs.includes(obj.id) ? 'text-accent' : 'text-gray-700')}>
                        {obj.label}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{obj.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer navigation */}
      <footer className="bg-white border-t border-gray-100 px-6 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          {step > 0 ? (
            <Button variant="ghost" onClick={() => setStep(s => s - 1)} icon={<ChevronLeft className="w-4 h-4" />}>
              Retour
            </Button>
          ) : (
            <div />
          )}

          {step < STEPS.length - 1 ? (
            <Button
              onClick={() => setStep(s => s + 1)}
              disabled={!canNext}
              className="bg-primary hover:bg-primary-dark min-h-[44px]"
            >
              Continuer
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleFinish}
              disabled={!canNext || loading}
              loading={loading}
              className="bg-primary hover:bg-primary-dark min-h-[44px]"
              icon={<Rocket className="w-4 h-4" />}
            >
              {loading ? 'Configuration...' : 'Lancer mon CRM'}
            </Button>
          )}
        </div>
      </footer>
    </div>
  )
}
