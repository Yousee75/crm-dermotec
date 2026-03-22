'use client'
// ============================================================
// CRM SATOREA — Progress Dashboard (style Coursera)
// Vue d'ensemble de la progression du stagiaire
// Inspiré de Coursera, Udemy, ClassroomIO
// ============================================================

import {
  CheckCircle2, Circle, Clock, Award, TrendingUp,
  BookOpen, Play, Download, Star, Flame
} from 'lucide-react'

interface ModuleProgress {
  id: string
  titre: string
  jour_formation?: number
  total_contents: number
  completed_contents: number
  progression_pct: number
  duree_minutes?: number
}

interface ProgressDashboardProps {
  formationNom: string
  formationDureeJours: number
  // Stats globales
  progressionGlobale: number // 0-100
  pointsGagnes: number
  pointsTotaux: number
  contenusCompletes: number
  contenusTotal: number
  tempsPasseMinutes: number
  scoreQuizMoyen?: number
  // Modules
  modules: ModuleProgress[]
  // Actions
  onStartCourse: () => void
  onResume: (contentId: string) => void
  onDownloadCertificat: () => void
  // Dernier contenu vu
  lastContent?: {
    id: string
    titre: string
    type: string
    module_titre: string
  }
}

export default function ProgressDashboard({
  formationNom,
  formationDureeJours,
  progressionGlobale,
  pointsGagnes,
  pointsTotaux,
  contenusCompletes,
  contenusTotal,
  tempsPasseMinutes,
  scoreQuizMoyen,
  modules,
  onStartCourse,
  onResume,
  onDownloadCertificat,
  lastContent,
}: ProgressDashboardProps) {
  const isComplete = progressionGlobale >= 100
  const hasStarted = contenusCompletes > 0

  return (
    <div className="space-y-6">
      {/* ============================================================ */}
      {/* HERO — État de progression principal */}
      {/* ============================================================ */}
      <div className={`
        relative overflow-hidden rounded-2xl p-6 md:p-8
        ${isComplete
          ? 'bg-gradient-to-br from-emerald-600 to-cyan-600'
          : 'bg-gradient-to-br from-[#082545] to-[#0a3a6b]'
        }
      `}>
        {/* Motif de fond */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 right-4 w-32 h-32 rounded-full border border-white/20" />
          <div className="absolute bottom-4 left-4 w-24 h-24 rounded-full border border-white/10" />
        </div>

        <div className="relative flex flex-col md:flex-row items-start md:items-center gap-6">
          {/* Cercle de progression */}
          <div className="relative w-28 h-28 flex-shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
              <circle
                cx="50" cy="50" r="42" fill="none"
                stroke={isComplete ? '#34d399' : '#2EC6F3'}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${progressionGlobale * 2.64} 264`}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-white">{progressionGlobale}%</span>
              <span className="text-[10px] text-white/60">complété</span>
            </div>
          </div>

          {/* Info */}
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white mb-1">{formationNom}</h2>
            <p className="text-white/60 text-sm mb-4">
              {formationDureeJours} jour{formationDureeJours > 1 ? 's' : ''} de formation
              · {contenusCompletes}/{contenusTotal} contenus terminés
            </p>

            {/* CTA principal */}
            {isComplete ? (
              <button
                onClick={onDownloadCertificat}
                className="flex items-center gap-2 px-5 py-2.5 bg-white text-emerald-700 rounded-lg font-medium text-sm hover:bg-white/90 transition-colors"
              >
                <Award className="w-4 h-4" />
                Télécharger mon certificat
              </button>
            ) : hasStarted && lastContent ? (
              <button
                onClick={() => onResume(lastContent.id)}
                className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium text-sm backdrop-blur-sm transition-colors"
              >
                <Play className="w-4 h-4" />
                Reprendre : {lastContent.titre}
              </button>
            ) : (
              <button
                onClick={onStartCourse}
                className="flex items-center gap-2 px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-white rounded-lg font-medium text-sm transition-colors"
              >
                <Play className="w-4 h-4" />
                Commencer la formation
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* KPIs — 4 cards stats */}
      {/* ============================================================ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          label="Contenus terminés"
          value={`${contenusCompletes}/${contenusTotal}`}
          color="emerald"
        />
        <KpiCard
          icon={<Clock className="w-4 h-4 text-cyan-500" />}
          label="Temps passé"
          value={tempsPasseMinutes < 60 ? `${tempsPasseMinutes} min` : `${Math.floor(tempsPasseMinutes / 60)}h${tempsPasseMinutes % 60 > 0 ? tempsPasseMinutes % 60 : ''}`}
          color="cyan"
        />
        <KpiCard
          icon={<Award className="w-4 h-4 text-amber-500" />}
          label="Points gagnés"
          value={`${pointsGagnes}/${pointsTotaux}`}
          color="amber"
        />
        <KpiCard
          icon={<Star className="w-4 h-4 text-violet-500" />}
          label="Score quiz moyen"
          value={scoreQuizMoyen !== undefined ? `${scoreQuizMoyen}%` : '—'}
          color="violet"
        />
      </div>

      {/* ============================================================ */}
      {/* MODULES — Liste avec progression */}
      {/* ============================================================ */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Progression par module</h3>
        <div className="space-y-2">
          {modules.map((module, idx) => {
            const pct = module.progression_pct
            const isModuleComplete = pct >= 100

            return (
              <div
                key={module.id}
                className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 bg-white hover:border-gray-200 transition-colors"
              >
                {/* Numéro / Jour */}
                <div className={`
                  w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-bold
                  ${isModuleComplete
                    ? 'bg-emerald-50 text-emerald-600'
                    : pct > 0
                      ? 'bg-cyan-50 text-cyan-600'
                      : 'bg-gray-50 text-gray-400'
                  }
                `}>
                  {module.jour_formation ? `J${module.jour_formation}` : idx + 1}
                </div>

                {/* Info module */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-800 truncate">{module.titre}</h4>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-500">
                      {module.completed_contents}/{module.total_contents} contenus
                    </span>
                    {module.duree_minutes && (
                      <span className="text-xs text-gray-400">
                        · {module.duree_minutes} min
                      </span>
                    )}
                  </div>
                </div>

                {/* Barre progression */}
                <div className="w-24 flex-shrink-0">
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isModuleComplete ? 'bg-emerald-500' : 'bg-cyan-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-gray-400 mt-0.5 block text-right">{pct}%</span>
                </div>

                {/* Icône statut */}
                <div className="flex-shrink-0">
                  {isModuleComplete ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : pct > 0 ? (
                    <TrendingUp className="w-5 h-5 text-cyan-500" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-300" />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ============================================================
// SUB-COMPOSANTS
// ============================================================

function KpiCard({ icon, label, value, color }: {
  icon: React.ReactNode
  label: string
  value: string
  color: string
}) {
  return (
    <div className="p-3 rounded-xl border border-gray-100 bg-white">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-[10px] text-gray-500 uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-lg font-bold text-gray-800">{value}</p>
    </div>
  )
}

export { type ModuleProgress, type ProgressDashboardProps }
