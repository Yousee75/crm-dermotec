'use client'

import { useState } from 'react'
import { SearchInput } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { IllustrationEmptyCommandes } from '@/components/ui/Illustrations'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { Card } from '@/components/ui/Card'
import { Receipt, Plus, Download, Clock, CheckCircle, AlertTriangle, Eye, Send, MoreHorizontal, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { useFactures, useSendFacture, useDeleteFacture, useUpdateFacture, type FactureFormation } from '@/hooks/use-factures'
import { toast } from 'sonner'

const STATUT_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  brouillon: {
    label: 'Brouillon',
    color: 'bg-[#FAF8F5] text-[#777777] border-[#EEEEEE]',
    icon: Clock
  },
  validee: {
    label: 'Validée',
    color: 'bg-[#FFF0E5] text-[#FF5C00] border-[#FF5C00]/30',
    icon: CheckCircle
  },
  emise: {
    label: 'Émise',
    color: 'bg-[#FFF0E5] text-[#FF5C00] border-[#FF5C00]/30',
    icon: Receipt
  },
  envoyee: {
    label: 'Envoyée',
    color: 'bg-[#E0EBF5] text-[#6B8CAE] border-[#6B8CAE]/30',
    icon: Send
  },
  payee: {
    label: 'Payée',
    color: 'bg-[#ECFDF5] text-[#10B981] border-[#10B981]/30',
    icon: CheckCircle
  },
  partiellement_payee: {
    label: 'Partiel',
    color: 'bg-[#FFF3E8] text-[#FF8C42] border-[#FF8C42]/30',
    icon: Clock
  },
  en_retard: {
    label: 'En retard',
    color: 'bg-[#FFE0EF] text-[#FF2D78] border-[#FF2D78]/30',
    icon: AlertTriangle
  },
  impayee: {
    label: 'Impayée',
    color: 'bg-[#FFE0EF] text-[#FF2D78] border-[#FF2D78]/30',
    icon: AlertTriangle
  },
  contentieux: {
    label: 'Contentieux',
    color: 'bg-[#FFE0EF] text-[#FF2D78] border-[#FF2D78]/30',
    icon: AlertTriangle
  },
  annulee: {
    label: 'Annulée',
    color: 'bg-[#FAF8F5] text-[#999999] border-[#EEEEEE]',
    icon: Trash2
  },
}

function formatEur(n: number) {
  return (n || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 }) + ' €'
}

export default function FacturationTab() {
  const [search, setSearch] = useState('')
  const [statutFilter, setStatutFilter] = useState<string>('')
  const [page, setPage] = useState(1)
  const [actionMenuId, setActionMenuId] = useState<string | null>(null)

  const { data, isLoading, error } = useFactures({
    search: search || undefined,
    statut: statutFilter || undefined,
    page,
    per_page: 20,
  })

  const sendFacture = useSendFacture()
  const deleteFacture = useDeleteFacture()
  const updateFacture = useUpdateFacture()

  if (isLoading) {
    return <SkeletonTable rows={5} cols={7} />
  }

  if (error) {
    return (
      <EmptyState
        illustration={<IllustrationEmptyCommandes size={120} />}
        icon={<AlertTriangle className="w-4 h-4" />}
        title="Erreur chargement"
        description={(error as Error).message || 'Impossible de charger les factures.'}
      />
    )
  }

  const factures = data?.factures || []
  const stats = data?.stats || { total: 0, ca_total: 0, en_attente: 0, en_retard: 0, montant_en_retard: 0 }
  const pagination = data?.pagination || { page: 1, per_page: 20, total: 0, total_pages: 1 }

  const handleSend = async (facture: FactureFormation) => {
    if (!facture.destinataire_email) {
      toast.error('Aucun email destinataire')
      return
    }
    sendFacture.mutate(facture.id)
    setActionMenuId(null)
  }

  const handleDelete = async (facture: FactureFormation) => {
    if (facture.statut === 'payee') {
      toast.error('Impossible de supprimer une facture payée')
      return
    }
    deleteFacture.mutate(facture.id)
    setActionMenuId(null)
  }

  const handleMarkPaid = async (facture: FactureFormation) => {
    updateFacture.mutate({
      id: facture.id,
      statut: 'payee',
      montant_paye: facture.montant_ttc,
    })
    setActionMenuId(null)
  }

  // Export CSV simple
  const handleExportCSV = () => {
    if (factures.length === 0) {
      toast.error('Aucune facture à exporter')
      return
    }
    const headers = ['Numéro', 'Destinataire', 'Type', 'Montant HT', 'TVA', 'Montant TTC', 'Payé', 'Reste', 'Statut', 'Émission', 'Échéance']
    const rows = factures.map(f => [
      f.numero_facture,
      f.destinataire_nom,
      f.type,
      f.montant_ht,
      f.montant_tva,
      f.montant_ttc,
      f.montant_paye,
      f.reste_a_payer,
      f.statut,
      f.date_emission ? new Date(f.date_emission).toLocaleDateString('fr-FR') : '',
      f.date_echeance ? new Date(f.date_echeance).toLocaleDateString('fr-FR') : '',
    ])
    const csv = [headers, ...rows].map(r => r.join(';')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `factures_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Export CSV téléchargé')
  }

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#777777]">Factures totales</p>
              <p className="text-xl font-bold text-[#111111]">{stats.total}</p>
            </div>
            <Receipt className="w-8 h-8 text-[#999999]" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#777777]">CA encaissé</p>
              <p className="text-xl font-bold text-[#10B981]">{formatEur(stats.ca_total)}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-[#10B981]" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#777777]">En attente</p>
              <p className="text-xl font-bold text-[#6B8CAE]">{formatEur(stats.en_attente)}</p>
            </div>
            <Clock className="w-8 h-8 text-[#6B8CAE]" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#777777]">En retard ({stats.en_retard})</p>
              <p className="text-xl font-bold text-[#FF2D78]">{formatEur(stats.montant_en_retard)}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-[#FF2D78]" />
          </div>
        </Card>
      </div>

      {/* Filtres et actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-3">
          <SearchInput
            value={search}
            onChange={(e: any) => { setSearch(e.target ? e.target.value : e); setPage(1) }}
            placeholder="Rechercher une facture..."
            className="w-80"
          />
          <select
            value={statutFilter}
            onChange={(e) => { setStatutFilter(e.target.value); setPage(1) }}
            className="px-3 py-2 border border-[#EEEEEE] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">Tous les statuts</option>
            <option value="brouillon">Brouillon</option>
            <option value="validee">Validée</option>
            <option value="envoyee">Envoyée</option>
            <option value="payee">Payée</option>
            <option value="en_retard">En retard</option>
            <option value="impayee">Impayée</option>
            <option value="annulee">Annulée</option>
          </select>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Table des factures */}
      {factures.length === 0 ? (
        <EmptyState
          illustration={<IllustrationEmptyCommandes size={120} />}
          icon={<Receipt className="w-4 h-4" />}
          title="Aucune facture"
          description="Les factures de formation apparaîtront ici une fois émises."
        />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-[#F4F0EB] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#FAF8F5]/50 border-b border-[#F4F0EB]">
                <tr>
                  <th className="text-left text-xs font-semibold text-[#777777] uppercase tracking-wider px-6 py-3">Numéro</th>
                  <th className="text-left text-xs font-semibold text-[#777777] uppercase tracking-wider px-6 py-3">Destinataire</th>
                  <th className="text-right text-xs font-semibold text-[#777777] uppercase tracking-wider px-6 py-3">Montant HT</th>
                  <th className="text-right text-xs font-semibold text-[#777777] uppercase tracking-wider px-6 py-3">TTC</th>
                  <th className="text-right text-xs font-semibold text-[#777777] uppercase tracking-wider px-6 py-3">Reste</th>
                  <th className="text-left text-xs font-semibold text-[#777777] uppercase tracking-wider px-6 py-3">Statut</th>
                  <th className="text-left text-xs font-semibold text-[#777777] uppercase tracking-wider px-6 py-3">Échéance</th>
                  <th className="text-left text-xs font-semibold text-[#777777] uppercase tracking-wider px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F4F0EB]">
                {factures.map((facture) => {
                  const conf = STATUT_CONFIG[facture.statut] || STATUT_CONFIG.brouillon
                  const StatutIcon = conf.icon
                  const isOverdue = ['envoyee', 'emise'].includes(facture.statut) && facture.date_echeance && new Date(facture.date_echeance) < new Date()

                  return (
                    <tr key={facture.id} className="hover:bg-[#FAF8F5]/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-primary font-medium text-sm">{facture.numero_facture}</span>
                        <span className="block text-xs text-[#999999]">{facture.type}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-[#111111]">{facture.destinataire_nom}</span>
                        {facture.destinataire_email && (
                          <span className="block text-xs text-[#999999]">{facture.destinataire_email}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm text-[#111111]">{formatEur(facture.montant_ht)}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-medium text-[#111111]">{formatEur(facture.montant_ttc)}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`text-sm font-medium ${facture.reste_a_payer > 0 ? 'text-[#FF2D78]' : 'text-[#10B981]'}`}>
                          {formatEur(facture.reste_a_payer)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <StatutIcon className="w-4 h-4" />
                          <Badge className={conf.color} size="sm">
                            {isOverdue ? 'Échue' : conf.label}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-sm ${isOverdue ? 'text-[#FF2D78] font-medium' : 'text-[#777777]'}`}>
                          {facture.date_echeance ? new Date(facture.date_echeance).toLocaleDateString('fr-FR') : '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="relative flex items-center gap-1">
                          {/* Envoyer */}
                          {facture.destinataire_email && !['payee', 'annulee'].includes(facture.statut) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSend(facture)}
                              disabled={sendFacture.isPending}
                              title="Envoyer par email"
                            >
                              <Send className="w-3 h-3" />
                            </Button>
                          )}
                          {/* Marquer payée */}
                          {!['payee', 'annulee'].includes(facture.statut) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMarkPaid(facture)}
                              title="Marquer payée"
                            >
                              <CheckCircle className="w-3 h-3" />
                            </Button>
                          )}
                          {/* Supprimer */}
                          {facture.statut !== 'payee' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(facture)}
                              title="Supprimer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.total_pages > 1 && (
            <div className="flex items-center justify-between px-6 py-3 border-t border-[#F4F0EB] bg-[#FAF8F5]/30">
              <span className="text-sm text-[#777777]">
                {pagination.total} facture{pagination.total > 1 ? 's' : ''} — Page {pagination.page}/{pagination.total_pages}
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  Précédent
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= pagination.total_pages}
                  onClick={() => setPage(p => p + 1)}
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
