'use client'

import { BookOpen, Sparkles, GraduationCap, Users } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'

export default function CataloguePage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-heading)' }}>
            <BookOpen className="inline w-7 h-7 mr-3 text-[#0EA5E9]" />
            Catalogue de formations
          </h1>
          <p className="text-gray-600 mt-1">
            Gérez vos produits de formation, programmes et tarifs
          </p>
        </div>
        <Badge variant="info" size="lg">
          <Sparkles className="w-4 h-4 mr-2" />
          En développement
        </Badge>
      </div>

      {/* Preview cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Gestion formations */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-4">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
            Gestion du catalogue
          </h3>
          <p className="text-gray-600 text-sm leading-relaxed mb-4">
            Créez et modifiez vos formations, gérez les programmes, prérequis et tarifications
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Bientôt disponible</span>
          </div>
        </div>

        {/* Stats formations */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mb-4">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
            Analytics formations
          </h3>
          <p className="text-gray-600 text-sm leading-relaxed mb-4">
            Analysez les performances : nombre de sessions, d'inscrits et CA par formation
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Bientôt disponible</span>
          </div>
        </div>

        {/* Catalogue public */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-4">
            <Users className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
            Catalogue public
          </h3>
          <p className="text-gray-600 text-sm leading-relaxed mb-4">
            Générez automatiquement un catalogue en ligne avec inscriptions directes
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Bientôt disponible</span>
          </div>
        </div>
      </div>

      {/* Features preview */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6" style={{ fontFamily: 'var(--font-heading)' }}>
          Fonctionnalités à venir
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Générateur de programmes</h4>
              <p className="text-sm text-gray-600">Créez automatiquement des programmes PDF professionnels</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 flex-shrink-0"></div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Tarification dynamique</h4>
              <p className="text-sm text-gray-600">Ajustez les prix selon les périodes et financeurs</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-purple-500 mt-2 flex-shrink-0"></div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Prérequis automatiques</h4>
              <p className="text-sm text-gray-600">Vérifiez automatiquement les prérequis avant inscription</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-amber-500 mt-2 flex-shrink-0"></div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Catalogue public auto-généré</h4>
              <p className="text-sm text-gray-600">Site de présentation avec inscriptions en ligne</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}