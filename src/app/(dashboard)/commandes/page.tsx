'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase-client'
import { type Commande, type StatutCommande } from '@/types'
import { formatEuro, formatDate } from '@/lib/utils'
import {
  ShoppingBag, Package, Truck, CheckCircle, RotateCcw, XCircle,
  Filter, Search, Edit2, Eye, Euro, Calendar, User
} from 'lucide-react'
import { toast } from 'sonner'

const STATUT_COLORS: Record<StatutCommande, { bg: string; text: string; label: string; icon: any }> = {
  NOUVELLE: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Nouvelle', icon: ShoppingBag },
  PREPAREE: { bg: 'bg-yellow-50', text: 'text-yellow-700', label: 'Préparée', icon: Package },
  EXPEDIEE: { bg: 'bg-purple-50', text: 'text-purple-700', label: 'Expédiée', icon: Truck },
  LIVREE: { bg: 'bg-green-50', text: 'text-green-700', label: 'Livrée', icon: CheckCircle },
  RETOURNEE: { bg: 'bg-orange-50', text: 'text-orange-700', label: 'Retournée', icon: RotateCcw },
  ANNULEE: { bg: 'bg-red-50', text: 'text-red-700', label: 'Annulée', icon: XCircle },
}

const PAIEMENT_COLORS: Record<string, { bg: string; text: string }> = {
  EN_ATTENTE: { bg: 'bg-gray-100', text: 'text-gray-600' },
  PAYE: { bg: 'bg-green-100', text: 'text-green-600' },
  REMBOURSE: { bg: 'bg-blue-100', text: 'text-blue-600' },
  ECHOUE: { bg: 'bg-red-100', text: 'text-red-600' },
}

export default function CommandesPage() {
  const [search, setSearch] = useState('')
  const [statutFilter, setStatutFilter] = useState<StatutCommande | ''>('')
  const [paiementFilter, setPaiementFilter] = useState<string>('')
  const [showTrackingModal, setShowTrackingModal] = useState<{ commandeId: string; numero?: string } | null>(null)

  const supabase = createClient()
  const queryClient = useQueryClient()

  // Fetch commandes
  const { data: commandes, isLoading } = useQuery({
    queryKey: ['commandes', search, statutFilter, paiementFilter],
    queryFn: async () => {
      let query = supabase
        .from('commandes')
        .select('*, lead:leads(id, prenom, nom)')
        .order('created_at', { ascending: false })

      if (search) {
        query = query.or(`numero_commande.ilike.%${search}%,client_nom.ilike.%${search}%,client_email.ilike.%${search}%`)
      }
      if (statutFilter) {
        query = query.eq('statut', statutFilter)
      }
      if (paiementFilter) {
        query = query.eq('paiement_statut', paiementFilter)
      }

      const { data, error } = await query
      if (error) throw error
      return data as (Commande & { lead?: { id: string; prenom: string; nom: string } })[]
    },
  })

  // Change statut
  const changeStatutMutation = useMutation({
    mutationFn: async ({ id, statut }: { id: string; statut: StatutCommande }) => {
      const updates: any = { statut, updated_at: new Date().toISOString() }

      if (statut === 'EXPEDIEE' && !commandes?.find(c => c.id === id)?.date_expedition) {
        updates.date_expedition = new Date().toISOString()
      }
      if (statut === 'LIVREE' && !commandes?.find(c => c.id === id)?.date_livraison) {
        updates.date_livraison = new Date().toISOString()
      }

      const { error } = await supabase
        .from('commandes')
        .update(updates)
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commandes'] })
      toast.success('Statut mis à jour')
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  })

  // Add tracking
  const addTrackingMutation = useMutation({
    mutationFn: async ({ id, tracking_number, transporteur }: { id: string; tracking_number: string; transporteur?: string }) => {
      const { error } = await supabase
        .from('commandes')
        .update({
          tracking_number,
          transporteur,
          statut: 'EXPEDIEE',
          date_expedition: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commandes'] })
      setShowTrackingModal(null)
      toast.success('Numéro de suivi ajouté')
    },
    onError: () => toast.error('Erreur lors de l\'ajout'),
  })

  // Stats
  const totalCommandes = commandes?.length || 0
  const caEshop = commandes?.reduce((sum, c) => sum + c.montant_ttc, 0) || 0
  const enAttenteExpedition = commandes?.filter(c => c.statut === 'PREPAREE').length || 0
  const nouvelles = commandes?.filter(c => c.statut === 'NOUVELLE').length || 0

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#082545]" style={{ fontFamily: 'var(--font-heading)' }}>
            Commandes E-Shop
          </h1>
          <p className="text-sm text-gray-500">{totalCommandes} commandes · {formatEuro(caEshop)} de CA</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-4 flex items-center gap-3">
          <ShoppingBag className="w-8 h-8 text-blue-500" />
          <div>
            <p className="text-xs text-gray-500">Total commandes</p>
            <p className="text-xl font-bold text-blue-500">{totalCommandes}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4 flex items-center gap-3">
          <Euro className="w-8 h-8 text-green-500" />
          <div>
            <p className="text-xs text-gray-500">CA E-shop</p>
            <p className="text-xl font-bold text-green-500">{formatEuro(caEshop)}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4 flex items-center gap-3">
          <Package className="w-8 h-8 text-yellow-500" />
          <div>
            <p className="text-xs text-gray-500">À expédier</p>
            <p className="text-xl font-bold text-yellow-500">{enAttenteExpedition}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4 flex items-center gap-3">
          <Calendar className="w-8 h-8 text-purple-500" />
          <div>
            <p className="text-xs text-gray-500">Nouvelles</p>
            <p className="text-xl font-bold text-purple-500">{nouvelles}</p>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher (n° commande, nom, email...)"
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:border-[#2EC6F3] focus:ring-1 focus:ring-[#2EC6F3]/20 outline-none"
          />
        </div>

        <select
          value={statutFilter}
          onChange={(e) => setStatutFilter(e.target.value as StatutCommande | '')}
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-[#2EC6F3] outline-none"
        >
          <option value="">Tous les statuts</option>
          {Object.entries(STATUT_COLORS).map(([key, val]) => (
            <option key={key} value={key}>{val.label}</option>
          ))}
        </select>

        <select
          value={paiementFilter}
          onChange={(e) => setPaiementFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-[#2EC6F3] outline-none"
        >
          <option value="">Tous les paiements</option>
          <option value="EN_ATTENTE">En attente</option>
          <option value="PAYE">Payé</option>
          <option value="REMBOURSE">Remboursé</option>
          <option value="ECHOUE">Échec</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-4 py-3 font-medium text-gray-500">N° Commande</th>
                <th className="px-4 py-3 font-medium text-gray-500">Client</th>
                <th className="px-4 py-3 font-medium text-gray-500">Produits</th>
                <th className="px-4 py-3 font-medium text-gray-500">Montant</th>
                <th className="px-4 py-3 font-medium text-gray-500">Paiement</th>
                <th className="px-4 py-3 font-medium text-gray-500">Statut</th>
                <th className="px-4 py-3 font-medium text-gray-500">Date</th>
                <th className="px-4 py-3 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400">Chargement...</td></tr>
              ) : !commandes?.length ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                  {search || statutFilter || paiementFilter ? 'Aucun résultat pour ces filtres' : 'Aucune commande'}
                </td></tr>
              ) : commandes.map((commande) => {
                const statutInfo = STATUT_COLORS[commande.statut]
                const StatutIcon = statutInfo.icon
                const paiementInfo = PAIEMENT_COLORS[commande.paiement_statut] || PAIEMENT_COLORS.EN_ATTENTE

                return (
                  <tr key={commande.id} className="border-t border-gray-50 hover:bg-gray-50/50 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs">{commande.numero_commande || commande.id.slice(0, 8)}</span>
                        {commande.tracking_number && (
                          <span className="px-1.5 py-0.5 bg-purple-100 text-purple-600 text-xs rounded">Suivi</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-[#082545]">{commande.client_nom || commande.lead?.prenom + ' ' + commande.lead?.nom}</p>
                        <p className="text-xs text-gray-500">{commande.client_email}</p>
                        {commande.client_telephone && (
                          <p className="text-xs text-gray-500">{commande.client_telephone}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        {commande.produits.slice(0, 2).map((produit, idx) => (
                          <div key={idx} className="text-xs">
                            <span className="font-medium">{produit.quantite}x</span> {produit.nom}
                          </div>
                        ))}
                        {commande.produits.length > 2 && (
                          <p className="text-xs text-gray-400">+{commande.produits.length - 2} autres</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-bold text-[#082545]">{formatEuro(commande.montant_ttc)}</p>
                        {commande.frais_port > 0 && (
                          <p className="text-xs text-gray-500">+{formatEuro(commande.frais_port)} port</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${paiementInfo.bg} ${paiementInfo.text}`}>
                        {commande.paiement_statut.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <StatutIcon className="w-4 h-4" style={{ color: statutInfo.text.replace('text-', '').replace('-700', '-600') }} />
                        <select
                          value={commande.statut}
                          onChange={(e) => changeStatutMutation.mutate({
                            id: commande.id,
                            statut: e.target.value as StatutCommande
                          })}
                          className={`px-2 py-0.5 rounded text-xs font-medium border-0 outline-none cursor-pointer ${statutInfo.bg} ${statutInfo.text}`}
                          style={{ backgroundColor: statutInfo.bg.replace('bg-', '').replace('-50', '-100') }}
                        >
                          {Object.entries(STATUT_COLORS).map(([key, val]) => (
                            <option key={key} value={key}>{val.label}</option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-gray-500">
                        <p>{formatDate(commande.created_at)}</p>
                        {commande.date_expedition && (
                          <p>Expédiée: {formatDate(commande.date_expedition)}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button
                          onClick={() => setShowTrackingModal({
                            commandeId: commande.id,
                            numero: commande.tracking_number
                          })}
                          className="p-1.5 hover:bg-purple-50 text-purple-600 rounded transition"
                          title="Numéro de suivi"
                        >
                          <Truck className="w-3.5 h-3.5" />
                        </button>
                        <button className="p-1.5 hover:bg-blue-50 text-blue-600 rounded transition" title="Voir détails">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tracking */}
      {showTrackingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowTrackingModal(null)}>
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">Numéro de suivi</h3>
            <form onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.target as HTMLFormElement)
              const tracking_number = formData.get('tracking_number') as string
              const transporteur = formData.get('transporteur') as string

              addTrackingMutation.mutate({
                id: showTrackingModal.commandeId,
                tracking_number,
                transporteur: transporteur || undefined,
              })
            }}>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Numéro de suivi</label>
                  <input
                    name="tracking_number"
                    type="text"
                    defaultValue={showTrackingModal.numero || ''}
                    placeholder="Ex: 1Z999AA1234567890"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#2EC6F3] outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Transporteur (optionnel)</label>
                  <select
                    name="transporteur"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#2EC6F3] outline-none"
                  >
                    <option value="">Sélectionner...</option>
                    <option value="La Poste">La Poste</option>
                    <option value="Chronopost">Chronopost</option>
                    <option value="UPS">UPS</option>
                    <option value="FedEx">FedEx</option>
                    <option value="DHL">DHL</option>
                    <option value="Mondial Relay">Mondial Relay</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setShowTrackingModal(null)}
                  className="flex-1 py-2 px-4 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-4 bg-[#2EC6F3] hover:bg-[#1BA8D4] text-white rounded-lg transition"
                  disabled={addTrackingMutation.isPending}
                >
                  {addTrackingMutation.isPending ? 'Ajout...' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}