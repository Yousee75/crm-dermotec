'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Dialog } from '@/components/ui/Dialog'
import {
  Calculator, FileText, Image, Search, MessageSquare, Hash, Landmark,
  Mail, KeyRound, Timer, ScanText, StickyNote, FileSpreadsheet
} from 'lucide-react'

import { TvaCalculator } from '@/components/tools/TvaCalculator'
import { CharacterCounter } from '@/components/tools/CharacterCounter'
import { SiretVerifier } from '@/components/tools/SiretVerifier'
import { FinancingSimulator } from '@/components/tools/FinancingSimulator'
import { ImageCompressor } from '@/components/tools/ImageCompressor'
import { PdfMerger } from '@/components/tools/PdfMerger'
import { TextReformulator } from '@/components/tools/TextReformulator'
import { EmailSignatureGenerator } from '@/components/tools/EmailSignatureGenerator'
import { PasswordGenerator } from '@/components/tools/PasswordGenerator'
import { PomodoroTimer } from '@/components/tools/PomodoroTimer'
import { OcrScanner } from '@/components/tools/OcrScanner'
import { QuickNotes } from '@/components/tools/QuickNotes'
import { CsvJsonConverter } from '@/components/tools/CsvJsonConverter'

const TOOLS = [
  {
    id: 'tva',
    icon: Calculator,
    title: 'Calculateur TVA',
    description: 'Convertir HT ↔ TTC (20%)',
    color: '#22C55E',
    component: TvaCalculator,
  },
  {
    id: 'siret',
    icon: Search,
    title: 'Vérificateur SIRET',
    description: 'Rechercher une entreprise par SIRET',
    color: '#3B82F6',
    component: SiretVerifier,
  },
  {
    id: 'financing',
    icon: Landmark,
    title: 'Simulateur financement',
    description: 'CPF, OPCO, échelonnement',
    color: '#F59E0B',
    component: FinancingSimulator,
  },
  {
    id: 'reformulator',
    icon: MessageSquare,
    title: 'Reformulateur IA',
    description: 'Reformuler un texte avec l\'IA',
    color: '#A855F7',
    component: TextReformulator,
  },
  {
    id: 'characters',
    icon: Hash,
    title: 'Compteur caractères',
    description: 'Caractères, mots, segments SMS',
    color: 'var(--color-primary)',
    component: CharacterCounter,
  },
  {
    id: 'image',
    icon: Image,
    title: 'Compresser image',
    description: 'Réduire la taille sans perte visible',
    color: '#EC4899',
    component: ImageCompressor,
  },
  {
    id: 'pdf',
    icon: FileText,
    title: 'Fusionner PDF',
    description: 'Combiner plusieurs PDF en un seul',
    color: '#EF4444',
    component: PdfMerger,
  },
  {
    id: 'signature',
    icon: Mail,
    title: 'Signature email',
    description: 'Créer une signature email pro Dermotec',
    color: 'var(--color-accent)',
    component: EmailSignatureGenerator,
  },
  {
    id: 'password',
    icon: KeyRound,
    title: 'Générateur mot de passe',
    description: 'Mot de passe sécurisé avec indicateur de force',
    color: '#6366F1',
    component: PasswordGenerator,
  },
  {
    id: 'pomodoro',
    icon: Timer,
    title: 'Minuteur Pomodoro',
    description: 'Timer productivité et appels commerciaux',
    color: '#DC2626',
    component: PomodoroTimer,
  },
  {
    id: 'ocr',
    icon: ScanText,
    title: 'Scanner OCR',
    description: 'Extraire du texte depuis une image',
    color: '#0891B2',
    component: OcrScanner,
  },
  {
    id: 'notes',
    icon: StickyNote,
    title: 'Bloc-notes',
    description: 'Notes rapides avec sauvegarde auto',
    color: '#059669',
    component: QuickNotes,
  },
  {
    id: 'csv',
    icon: FileSpreadsheet,
    title: 'CSV ↔ JSON',
    description: 'Convertir entre CSV et JSON',
    color: '#D97706',
    component: CsvJsonConverter,
  },
] as const

export default function OutilsPage() {
  const [activeTool, setActiveTool] = useState<string | null>(null)

  const tool = TOOLS.find(t => t.id === activeTool)
  const ToolComponent = tool?.component

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageHeader
        title="Boîte à outils"
        description="Outils utilitaires pour votre quotidien"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {TOOLS.map(t => {
          const Icon = t.icon
          return (
            <button
              key={t.id}
              onClick={() => setActiveTool(t.id)}
              className="group text-left bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-gray-300 transition-all duration-200"
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                style={{ backgroundColor: `${t.color}15` }}
              >
                <Icon size={20} style={{ color: t.color }} />
              </div>
              <h3 className="font-semibold text-accent text-sm group-hover:text-primary transition-colors">
                {t.title}
              </h3>
              <p className="text-xs text-gray-500 mt-1">{t.description}</p>
            </button>
          )
        })}
      </div>

      {/* Dialog outil */}
      {tool && ToolComponent && (
        <Dialog
          open={!!activeTool}
          onClose={() => setActiveTool(null)}
          size="lg"
        >
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${tool.color}15` }}
              >
                <tool.icon size={20} style={{ color: tool.color }} />
              </div>
              <div>
                <h2 className="font-semibold text-lg text-accent">{tool.title}</h2>
                <p className="text-sm text-gray-500">{tool.description}</p>
              </div>
            </div>
            <ToolComponent />
          </div>
        </Dialog>
      )}
    </div>
  )
}
