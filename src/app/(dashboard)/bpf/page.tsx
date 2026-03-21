'use client'

import { FileBarChart, AlertTriangle, Download, Calendar, TrendingUp } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'

export default function BPFPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-heading)' }}>
            <FileBarChart className="inline w-7 h-7 mr-3 text-[#0EA5E9]" />
            BPF
          </h1>
          <p className="text-gray-600 mt-1">
            Bilan Pédagogique et Financier — Déclaration obligatoire avant le 31 mai
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="warning" size="lg">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Priorité P0
          </Badge>
          <button className="flex items-center gap-2 bg-[#0EA5E9] hover:bg-[#0284C7] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Générer BPF 2025</span>
          </button>
        </div>
      </div>

      {/* Alert critique */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-red-900 mb-2">
              Fonctionnalité critique manquante
            </h3>
            <p className="text-red-700 text-sm mb-4">
              Le BPF automatisé est <strong>obligatoire</strong> pour tous les organismes de formation en France.
              Sans cette fonctionnalité, Dermotec CRM ne peut pas être l'outil principal d'un OF.
            </p>
            <div className="bg-red-100 rounded-lg p-3">
              <h4 className="font-medium text-red-900 mb-1">Échéance légale</h4>
              <p className="text-sm text-red-700">
                <Calendar className="inline w-4 h-4 mr-1" />
                Déclaration obligatoire avant le <strong>31 mai 2026</strong> pour l'exercice 2025
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sections BPF preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section Financière */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'var(--font-heading)' }}>
              Section Financière
            </h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Produits de la formation professionnelle</span>
              <span className="text-sm font-medium text-gray-900">-- €</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Subventions publiques reçues</span>
              <span className="text-sm font-medium text-gray-900">-- €</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Autres produits</span>
              <span className="text-sm font-medium text-gray-900">-- €</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Charges de personnel</span>
              <span className="text-sm font-medium text-gray-900">-- €</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Autres charges</span>
              <span className="text-sm font-medium text-gray-900">-- €</span>
            </div>
            <div className="flex justify-between items-center py-2 pt-3 border-t border-gray-200">
              <span className="text-sm font-semibold text-gray-900">Résultat net</span>
              <span className="text-sm font-bold text-emerald-600">-- €</span>
            </div>
          </div>
        </div>

        {/* Section Pédagogique */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <FileBarChart className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'var(--font-heading)' }}>
              Section Pédagogique
            </h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Nombre de formateurs</span>
              <span className="text-sm font-medium text-gray-900">--</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Heures de formation</span>
              <span className="text-sm font-medium text-gray-900">--</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Nombre de stagiaires</span>
              <span className="text-sm font-medium text-gray-900">--</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">dont demandeurs d'emploi</span>
              <span className="text-sm font-medium text-gray-900">--</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">dont salariés</span>
              <span className="text-sm font-medium text-gray-900">--</span>
            </div>
            <div className="flex justify-between items-center py-2 pt-3 border-t border-gray-200">
              <span className="text-sm font-semibold text-gray-900">Taux de satisfaction moyen</span>
              <span className="text-sm font-bold text-blue-600">-- %</span>
            </div>
          </div>
        </div>
      </div>

      {/* Auto-génération preview */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6" style={{ fontFamily: 'var(--font-heading)' }}>
          Génération automatique du BPF
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Pré-remplissage automatique</h4>
              <p className="text-sm text-gray-600">Toutes les données sont extraites automatiquement du CRM</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 flex-shrink-0"></div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Calculs automatisés</h4>
              <p className="text-sm text-gray-600">CA par financeur, charges, ratios, indicateurs</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-purple-500 mt-2 flex-shrink-0"></div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Vérifications croisées</h4>
              <p className="text-sm text-gray-600">Cohérence entre sections financière et pédagogique</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-amber-500 mt-2 flex-shrink-0"></div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Export MOF (Mon Activité Formation)</h4>
              <p className="text-sm text-gray-600">Format compatible avec la plateforme officielle</p>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline development */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
          Planning de développement
        </h3>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <div>
              <h4 className="font-medium text-gray-900">Phase 1 - Extraction des données (2 jours)</h4>
              <p className="text-sm text-gray-600">Requêtes SQL pour extraire CA, heures, apprenants par statut</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <div>
              <h4 className="font-medium text-gray-900">Phase 2 - Formulaire BPF (2 jours)</h4>
              <p className="text-sm text-gray-600">Interface de saisie/validation conforme au modèle CERFA</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
            <div>
              <h4 className="font-medium text-gray-900">Phase 3 - Export officiel (1 jour)</h4>
              <p className="text-sm text-gray-600">Génération PDF + format Mon Activité Formation</p>
            </div>
          </div>
        </div>
        <div className="mt-6 p-4 bg-emerald-50 rounded-lg">
          <p className="text-sm text-emerald-700">
            <strong>Estimation totale :</strong> 5 jours de développement pour une fonctionnalité critique
          </p>
        </div>
      </div>
    </div>
  )
}