'use client'

import { useState } from 'react'
import { SearchInput } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { Card } from '@/components/ui/Card'
import { AlertTriangle, Plus, MessageSquare, Clock, CheckCircle, XCircle } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { useReclamations, useCreateReclamation, type QualiteItem } from '@/hooks/use-qualiopi'
import { toast } from 'sonner'

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  reclamation: { label: 'Réclamation', color: 'bg-[#FFE0EF] text-[#FF2D78]' },
  action_corrective: { label: 'Action corrective', color: 'bg-[#FFF3E8] text-[#FF8C42]' },
  amelioration: { label: 'Amélioration', color: 'bg-[#E0EBF5] text-[#6B8CAE]' },
  non_conformite: { label: 'Non-conformité', color: 'bg-[#FFE0EF] text-[#FF2D78]' },
}

const STATUT_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  OUVERTE: { label: 'Ouverte', color: 'bg-[#FFE0EF] text-[#FF2D78] border-[#FF2D78]/30', icon: AlertTriangle },
  EN_COURS: { label: 'En cours', color: 'bg-[#FFF3E8] text-[#FF8C42] border-[#FF8C42]/30', icon: Clock },
  RESOLUE: { label: 'Résolue', color: 'bg-[#ECFDF5] text-[#10B981] border-[#10B981]/30', icon: CheckCircle },
  CLOTUREE: { label: 'Clôturée', color: 'bg-[#FAFAFA] text-[#777777] border-[#F0F0F0]', icon: XCircle },
}

const PRIORITE_CONFIG: Record<string, { label: string; color: string }> = {
  BASSE: { label: 'Basse', color: 'bg-[#ECFDF5] text-[#10B981]' },
  NORMALE: { label: 'Normale', color: 'bg-[#E0EBF5] text-[#6B8CAE]' },
  HAUTE: { label: 'Haute', color: 'bg-[#FFE0EF] text-[#FF2D78]' },
}

export default function ReclamationsTab() {
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [statutFilter, setStatutFilter] = useState<string>('')

  const { data, isLoading, error } = useReclamations({
    type: typeFilter || undefined,
    statut: statutFilter || undefined,
  })

  const createReclamation = useCreateReclamation()

  if (isLoading) return <SkeletonTable rows={5} cols={7} />

  if (error) {
    return (
      <Card className="p-8 text-center">
        <AlertTriangle className="w-8 h-8 text-[#FF2D78] mx-auto mb-2" />
        <p className="text-[#777777]">{(error as Error).message}</p>
      </Card>
    )
  }

  const items = data?.items || []
  const stats = data?.stats || { total: 0, ouvertes: 0, en_cours: 0, resolues: 0, taux_resolution: 0 }

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#777777]">Total</p>
              <p className="text-xl font-bold text-[#111111]">{stats.total}</p>
            </div>
            <MessageSquare className="w-8 h-8 text-[#999999]" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#777777]">Ouvertes</p>
              <p className="text-xl font-bold text-[#FF2D78]">{stats.ouvertes}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-[#FF2D78]" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#777777]">En cours</p>
              <p className="text-xl font-bold text-[#FF8C42]">{stats.en_cours}</p>
            </div>
            <Clock className="w-8 h-8 text-[#FF8C42]" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#777777]">Résolues</p>
              <p className="text-xl font-bold text-[#10B981]">{stats.resolues}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-[#10B981]" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#777777]">Taux résolution</p>
              <p className="text-xl font-bold text-[#10B981]">{stats.taux_resolution}%</p>
            </div>
            <CheckCircle className="w-8 h-8 text-[#10B981]" />
          </div>
        </Card>
      </div>

      {/* Alerte */}
      {stats.ouvertes > 0 && (
        <Card className="p-4 border-[#FF2D78]/30 bg-[#FFE0EF]">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-[#FF2D78] shrink-0" />
            <p className="text-sm font-medium text-[#FF2D78] flex-1">
              {stats.ouvertes} réclamation{stats.ouvertes > 1 ? 's' : ''} en attente — Qualiopi exige un traitement sous 48h.
            </p>
          </div>
        </Card>
      )}

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-3">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-[#F0F0F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Tous les types</option>
            <option value="reclamation">Réclamation</option>
            <option value="action_corrective">Action corrective</option>
            <option value="amelioration">Amélioration</option>
            <option value="non_conformite">Non-conformité</option>
          </select>
          <select
            value={statutFilter}
            onChange={(e) => setStatutFilter(e.target.value)}
            className="px-3 py-2 border border-[#F0F0F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Tous les statuts</option>
            <option value="OUVERTE">Ouverte</option>
            <option value="EN_COURS">En cours</option>
            <option value="RESOLUE">Résolue</option>
            <option value="CLOTUREE">Clôturée</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {items.length === 0 ? (
        <EmptyState
          icon={<MessageSquare className="w-4 h-4" />}
          title="Aucun élément qualité"
          description="Les réclamations et actions d'amélioration apparaîtront ici."
        />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-[#F0F0F0] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#FAFAFA]/50 border-b border-[#F0F0F0]">
                <tr>
                  <th className="text-left text-xs font-semibold text-[#777777] uppercase tracking-wider px-6 py-3">Titre</th>
                  <th className="text-left text-xs font-semibold text-[#777777] uppercase tracking-wider px-6 py-3">Type</th>
                  <th className="text-left text-xs font-semibold text-[#777777] uppercase tracking-wider px-6 py-3">Priorité</th>
                  <th className="text-left text-xs font-semibold text-[#777777] uppercase tracking-wider px-6 py-3">Statut</th>
                  <th className="text-left text-xs font-semibold text-[#777777] uppercase tracking-wider px-6 py-3">Qualiopi</th>
                  <th className="text-left text-xs font-semibold text-[#777777] uppercase tracking-wider px-6 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F0F0]">
                {items.map((item: QualiteItem) => {
                  const typeConf = TYPE_CONFIG[item.type] || TYPE_CONFIG.reclamation
                  const statutConf = STATUT_CONFIG[item.statut] || STATUT_CONFIG.OUVERTE
                  const prioConf = PRIORITE_CONFIG[item.priorite] || PRIORITE_CONFIG.NORMALE
                  const StatutIcon = statutConf.icon

                  return (
                    <tr key={item.id} className="hover:bg-[#FAFAFA]/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-[#111111]">{item.titre}</span>
                        <p className="text-xs text-[#777777] mt-1 line-clamp-1">{item.description}</p>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={typeConf.color} size="sm">{typeConf.label}</Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={prioConf.color} size="sm">{prioConf.label}</Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <StatutIcon className="w-4 h-4" />
                          <Badge className={statutConf.color} size="sm">{statutConf.label}</Badge>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {item.indicateur_qualiopi && (
                          <span className="text-xs text-[#FF5C00] font-medium">{item.indicateur_qualiopi}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-[#777777]">
                          {new Date(item.created_at).toLocaleDateString('fr-FR')}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Procédure */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-[#111111] mb-4">Procédure qualité Qualiopi</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { n: 1, label: 'Réception', desc: 'Enregistrement sous 24h', color: 'bg-[#FFE0EF]', text: 'text-[#FF2D78]' },
            { n: 2, label: 'Analyse', desc: 'Évaluation et plan d\'action', color: 'bg-[#FFF3E8]', text: 'text-[#FF8C42]' },
            { n: 3, label: 'Traitement', desc: 'Mise en œuvre des actions', color: 'bg-[#E0EBF5]', text: 'text-[#6B8CAE]' },
            { n: 4, label: 'Clôture', desc: 'Validation et amélioration', color: 'bg-[#D1FAE5]', text: 'text-[#10B981]' },
          ].map(step => (
            <div key={step.n} className="text-center p-4">
              <div className={`w-10 h-10 ${step.color} rounded-full flex items-center justify-center mx-auto mb-3`}>
                <span className={`${step.text} font-bold`}>{step.n}</span>
              </div>
              <h4 className="font-medium text-[#111111] mb-1">{step.label}</h4>
              <p className="text-xs text-[#777777]">{step.desc}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
