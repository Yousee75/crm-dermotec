'use client'

import { useTranslations } from 'next-intl'
import { EmptyState } from '@/components/ui/EmptyState'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ClipboardList, Plus, FileText, Users, TrendingUp } from 'lucide-react'

export default function QuestionnairesTab() {
  const t = useTranslations('questionnaires')

  return (
    <div className="space-y-6">
      {/* État actuel */}
      <Card className="p-8 text-center">
        <div className="max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
            <ClipboardList className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Questionnaires de satisfaction
            </h3>
            <p className="text-gray-600">
              Fonctionnalité en cours de développement. Bientôt, vous pourrez créer et gérer vos questionnaires de satisfaction automatiquement.
            </p>
          </div>
          <div className="pt-2">
            <Button disabled variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Créer un questionnaire
            </Button>
          </div>
        </div>
      </Card>

      {/* Fonctionnalités à venir */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="space-y-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Questionnaires apprenants</h3>
            <p className="text-sm text-gray-600">
              Évaluez automatiquement la satisfaction de vos apprenants à chaud et à froid.
            </p>
            <div className="pt-2">
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Bientôt disponible</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Questionnaires entreprises</h3>
            <p className="text-sm text-gray-600">
              Mesurez l'impact des formations sur les entreprises clientes et leur ROI.
            </p>
            <div className="pt-2">
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Bientôt disponible</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-orange-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Analytics satisfaction</h3>
            <p className="text-sm text-gray-600">
              Analysez les tendances de satisfaction et identifiez les axes d'amélioration.
            </p>
            <div className="pt-2">
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Bientôt disponible</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Modèles de questionnaires */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Modèles de questionnaires prêts</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Satisfaction formation à chaud</h4>
              <p className="text-sm text-gray-600">15 questions · Envoi automatique en fin de session</p>
            </div>
            <Button size="sm" disabled variant="outline">Prévisualiser</Button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Satisfaction formation à froid</h4>
              <p className="text-sm text-gray-600">12 questions · Envoi 3 mois après la formation</p>
            </div>
            <Button size="sm" disabled variant="outline">Prévisualiser</Button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Évaluation formateur</h4>
              <p className="text-sm text-gray-600">8 questions · Pédagogie et expertise</p>
            </div>
            <Button size="sm" disabled variant="outline">Prévisualiser</Button>
          </div>
        </div>
      </Card>

      {/* Notification de développement */}
      <Card className="p-4 border-[#2EC6F3] bg-[#2EC6F3]/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#2EC6F3] rounded-full flex items-center justify-center">
            <ClipboardList className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-[#2EC6F3]">
              Développement en cours
            </p>
            <p className="text-sm text-gray-600">
              Cette fonctionnalité sera disponible dans la prochaine mise à jour de Dermotec CRM.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}