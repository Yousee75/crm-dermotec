'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase-client'
import { type Commande, type StatutCommande } from '@/types'
import { formatEuro, formatDate } from '@/lib/utils'
import {
  ShoppingBag, Package, Truck, CheckCircle, RotateCcw, XCircle,
  Eye, Euro, Hash
} from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/ui/PageHeader'
import { KpiCard } from '@/components/ui/KpiCard'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { SearchInput, Input } from '@/components/ui/Input'
import { Avatar } from '@/components/ui/Avatar'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/Dialog'
import { cn } from '@/lib/utils'

const STATUT_CONFIG: Record<StatutCommande, { label: string; variant: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'; icon: React.ElementType }> = {
  NOUVELLE: { label: 'Nouvelle', variant: 'info', icon: ShoppingBag },
  PREPAREE: { label: 'Préparée', variant: 'warning', icon: Package },
  EXPEDIEE: { label: 'Expédiée', variant: 'primary', icon: Truck },
  LIVREE: { label: 'Livrée', variant: 'success', icon: CheckCircle },
  RETOURNEE: { label: 'Retournée', variant: 'warning', icon: RotateCcw },
  ANNULEE: { label: 'Annulée', variant: 'error', icon: XCircle },
}

export default function CommandesPage() {
  const [search, setSearch] = useState('')
  const [statutFilter, setStatutFilter] = useState<StatutCommande | ''>('')
  const [paiementFilter, setPaiementFilter] = useState('')
  const [trackingModal, setTrackingModal] = useState<{ id: string; numero?: string } | null>(null)

  const supabase = createClient()
  const queryClient = useQueryClient()

  const { data: commandes, isLoading } = useQuery({
    queryKey: ['commandes', search, statutFilter, paiementFilter],
    queryFn: async () => {
      let query = supabase
        .from('commandes')
        .select('*, lead:leads(id, prenom, nom)')
        .order('created_at', { ascending: false })
      if (search) query = query.or(`numero_commande.ilike.%${search}%,client_nom.ilike.%${search}%,client_email.ilike.%${search}%`)
      if (statutFilter) query = query.eq('statut', statutFilter)
      if (paiementFilter) query = query.eq('paiement_statut', paiementFilter)
      const { data, error } = await query
      if (error) throw error
      return data as (Commande & { lead?: { id: string; prenom: string; nom: string } })[]
    },
  })

  const changeStatut = useMutation({
    mutationFn: async ({ id, statut }: { id: string; statut: StatutCommande }) => {
      const updates: Record<string, unknown> = { statut, updated_at: new Date().toISOString() }
      if (statut === 'EXPEDIEE') updates.date_expedition = new Date().toISOString()
      if (statut === 'LIVREE') updates.date_livraison = new Date().toISOString()
      const { error } = await supabase.from('commandes').update(updates).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['commandes'] }); toast.success('Statut mis à jour') },
    onError: () => toast.error('Erreur'),
  })

  const addTracking = useMutation({
    mutationFn: async ({ id, tracking_number, transporteur }: { id: string; tracking_number: string; transporteur?: string }) => {
      const { error } = await supabase.from('commandes').update({
        tracking_number, transporteur, statut: 'EXPEDIEE' as StatutCommande,
        date_expedition: new Date().toISOString(), updated_at: new Date().toISOString(),
      }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['commandes'] }); setTrackingModal(null); toast.success('Suivi ajouté') },
    onError: () => toast.error('Erreur'),
  })

  const total = commandes?.length || 0
  const ca = commandes?.reduce((sum, c) => sum + c.montant_ttc, 0) || 0
  const aExpedier = commandes?.filter(c => c.statut === 'PREPAREE').length || 0
  const nouvelles = commandes?.filter(c => c.statut === 'NOUVELLE').length || 0

  return (
    <div className="space-y-5">
      <PageHeader title="Commandes E-Shop" description={`${total} commandes · ${formatEuro(ca)} de CA`} />

      {/* KPIs — 4 métriques essentielles, pas plus */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-children">
        <KpiCard icon={ShoppingBag} label="Total" value={total} color="#3B82F6" />
        <KpiCard icon={Euro} label="CA E-shop" value={formatEuro(ca)} color="#22C55E" />
        <KpiCard icon={Package} label="À expédier" value={aExpedier} color={aExpedier > 0 ? '#F59E0B' : '#22C55E'} />
        <KpiCard icon={Hash} label="Nouvelles" value={nouvelles} color="#8B5CF6" />
      </div>

      {/* Filtres — inline, pas de panneau dédié */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="w-full sm:max-w-sm">
          <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="N° commande, nom, email..." />
        </div>
        <select
          value={statutFilter}
          onChange={(e) => setStatutFilter(e.target.value as StatutCommande | '')}
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-[#2EC6F3] focus:ring-2 focus:ring-[#2EC6F3]/15 outline-none bg-white"
        >
          <option value="">Tous les statuts</option>
          {Object.entries(STATUT_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select
          value={paiementFilter}
          onChange={(e) => setPaiementFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-[#2EC6F3] focus:ring-2 focus:ring-[#2EC6F3]/15 outline-none bg-white"
        >
          <option value="">Tous les paiements</option>
          <option value="EN_ATTENTE">En attente</option>
          <option value="PAYE">Payé</option>
          <option value="REMBOURSE">Remboursé</option>
          <option value="ECHOUE">Échec</option>
        </select>
      </div>

      {/* Table — focus sur l'essentiel, actions en hover */}
      {isLoading ? <SkeletonTable rows={6} cols={7} /> : (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  {['Commande', 'Client', 'Produits', 'Montant', 'Paiement', 'Statut', 'Date'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {!commandes?.length ? (
                  <tr><td colSpan={7}>
                    <EmptyState icon={<ShoppingBag className="w-7 h-7" />} title="Aucune commande" description={search ? 'Modifiez vos filtres' : 'Les commandes apparaîtront ici'} />
                  </td></tr>
                ) : commandes.map((c) => {
                  const cfg = STATUT_CONFIG[c.statut]
                  return (
                    <tr key={c.id} className="group hover:bg-[#2EC6F3]/[0.02] transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-gray-600">{c.numero_commande || c.id.slice(0, 8)}</span>
                          {c.tracking_number && <Badge variant="primary" size="sm">Suivi</Badge>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={c.client_nom || `${c.lead?.prenom} ${c.lead?.nom}`} size="sm" />
                          <div className="min-w-0">
                            <p className="font-medium text-[#082545] truncate">{c.client_nom || `${c.lead?.prenom} ${c.lead?.nom}`}</p>
                            <p className="text-xs text-gray-400 truncate">{c.client_email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {c.produits.slice(0, 2).map((p, i) => (
                          <p key={i} className="text-xs text-gray-600"><span className="font-medium">{p.quantite}×</span> {p.nom}</p>
                        ))}
                        {c.produits.length > 2 && <p className="text-[10px] text-gray-400">+{c.produits.length - 2} autres</p>}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-[#082545]">{formatEuro(c.montant_ttc)}</p>
                        {c.frais_port > 0 && <p className="text-[10px] text-gray-400">+{formatEuro(c.frais_port)} port</p>}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={c.paiement_statut === 'PAYE' ? 'success' : c.paiement_statut === 'ECHOUE' ? 'error' : 'default'} size="sm" dot>
                          {c.paiement_statut.replace('_', ' ').toLowerCase()}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {/* Statut avec changement inline — pas de page séparée */}
                        <select
                          value={c.statut}
                          onChange={(e) => changeStatut.mutate({ id: c.id, statut: e.target.value as StatutCommande })}
                          className={cn(
                            'px-2 py-1 rounded-lg text-xs font-medium border-0 outline-none cursor-pointer bg-transparent',
                            'hover:bg-gray-100 transition'
                          )}
                        >
                          {Object.entries(STATUT_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400">{formatDate(c.created_at)}</span>
                          {/* Action en hover — pas un bouton permanent qui encombre */}
                          <button
                            onClick={() => setTrackingModal({ id: c.id, numero: c.tracking_number })}
                            className="p-1.5 rounded-lg text-gray-300 hover:text-[#2EC6F3] hover:bg-[#2EC6F3]/5 transition opacity-0 group-hover:opacity-100"
                            title="Suivi expédition"
                          >
                            <Truck className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modal tracking — Dialog propre au lieu de div bricolée */}
      <Dialog open={!!trackingModal} onClose={() => setTrackingModal(null)} size="sm">
        <DialogHeader onClose={() => setTrackingModal(null)}>
          <DialogTitle>Suivi d&apos;expédition</DialogTitle>
          <DialogDescription>Ajoutez un numéro de suivi pour informer le client</DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => {
          e.preventDefault()
          const fd = new FormData(e.target as HTMLFormElement)
          addTracking.mutate({
            id: trackingModal!.id,
            tracking_number: fd.get('tracking') as string,
            transporteur: (fd.get('transporteur') as string) || undefined,
          })
        }}>
          <div className="space-y-3">
            <Input name="tracking" label="Numéro de suivi" defaultValue={trackingModal?.numero || ''} placeholder="1Z999AA1234567890" required />
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Transporteur</label>
              <select name="transporteur" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-[#2EC6F3] focus:ring-2 focus:ring-[#2EC6F3]/15 outline-none bg-white">
                <option value="">Sélectionner...</option>
                {['La Poste', 'Chronopost', 'UPS', 'FedEx', 'DHL', 'Mondial Relay'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" type="button" onClick={() => setTrackingModal(null)}>Annuler</Button>
            <Button type="submit" loading={addTracking.isPending}>Ajouter</Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  )
}
