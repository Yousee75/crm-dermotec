'use client'

export const dynamic = 'force-dynamic'

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase-client'
import { type Commande, type StatutCommande, type ProduitCommande } from '@/types'
import { formatEuro, formatDate } from '@/lib/utils'
import {
  ShoppingBag, Package, Truck, CheckCircle, RotateCcw, XCircle,
  Euro, Search, Calendar, Plus, ChevronDown, ChevronRight, Eye,
  MapPin, CreditCard, MoreVertical
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
import { IllustrationEmptyCommandes } from '@/components/ui/Illustrations'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/Dialog'
import { cn } from '@/lib/utils'

const STATUT_CONFIG: Record<StatutCommande, {
  label: string
  variant: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'
  color: string
  icon: React.ElementType
}> = {
  NOUVELLE: { label: 'Nouvelle', variant: 'info', color: '#3B82F6', icon: ShoppingBag },
  PREPAREE: { label: 'Préparée', variant: 'warning', color: '#F59E0B', icon: Package },
  EXPEDIEE: { label: 'Expédiée', variant: 'primary', color: '#2EC6F3', icon: Truck },
  LIVREE: { label: 'Livrée', variant: 'success', color: '#22C55E', icon: CheckCircle },
  RETOURNEE: { label: 'Retournée', variant: 'error', color: '#EF4444', icon: RotateCcw },
  ANNULEE: { label: 'Annulée', variant: 'default', color: '#6B7280', icon: XCircle },
}

export default function CommandesPage() {
  const [search, setSearch] = useState('')
  const [statutFilter, setStatutFilter] = useState<StatutCommande | ''>('')
  const [dateRange, setDateRange] = useState('')
  const [page, setPage] = useState(1)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [trackingModal, setTrackingModal] = useState<{
    id: string
    numero?: string
    transporteur?: string
  } | null>(null)

  const supabase = createClient()
  const queryClient = useQueryClient()

  const ITEMS_PER_PAGE = 20

  // Fetch commandes avec pagination
  const { data: response, isLoading } = useQuery({
    queryKey: ['commandes', search, statutFilter, dateRange, page],
    queryFn: async () => {
      let query = supabase
        .from('commandes')
        .select('*, lead:leads(id, prenom, nom)', { count: 'exact' })
        .order('created_at', { ascending: false })

      // Filtres
      if (search) {
        query = query.or(`numero_commande.ilike.%${search}%,client_nom.ilike.%${search}%,client_email.ilike.%${search}%`)
      }
      if (statutFilter) {
        query = query.eq('statut', statutFilter)
      }
      if (dateRange) {
        const [start, end] = dateRange.split(' - ')
        if (start && end) {
          query = query.gte('created_at', new Date(start).toISOString())
            .lte('created_at', new Date(end + ' 23:59:59').toISOString())
        }
      }

      // Pagination
      const from = (page - 1) * ITEMS_PER_PAGE
      const to = from + ITEMS_PER_PAGE - 1
      query = query.range(from, to)

      const { data, error, count } = await query
      if (error) throw error

      return {
        commandes: data as (Commande & { lead?: { id: string; prenom: string; nom: string } })[],
        totalCount: count || 0
      }
    },
  })

  // KPIs calculés côté client pour les données actuelles
  const kpis = useMemo(() => {
    const commandes = response?.commandes || []
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()

    const thisMonth = commandes.filter(c => {
      const date = new Date(c.created_at)
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear
    })

    return {
      commandesMois: thisMonth.length,
      caMois: thisMonth.reduce((sum, c) => sum + c.montant_ttc, 0),
      enPreparation: commandes.filter(c => c.statut === 'PREPAREE').length,
      expediees: commandes.filter(c => c.statut === 'EXPEDIEE').length
    }
  }, [response?.commandes])

  // Mutations
  const changeStatut = useMutation({
    mutationFn: async ({ id, statut }: { id: string; statut: StatutCommande }) => {
      const updates: Record<string, unknown> = {
        statut,
        updated_at: new Date().toISOString()
      }

      if (statut === 'EXPEDIEE') updates.date_expedition = new Date().toISOString()
      if (statut === 'LIVREE') updates.date_livraison = new Date().toISOString()

      const { error } = await supabase.from('commandes').update(updates).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commandes'] })
      toast.success('Statut mis à jour')
    },
    onError: () => toast.error('Erreur lors de la mise à jour')
  })

  const addTracking = useMutation({
    mutationFn: async ({ id, tracking_number, transporteur }: {
      id: string
      tracking_number: string
      transporteur?: string
    }) => {
      const { error } = await supabase.from('commandes').update({
        tracking_number,
        transporteur,
        statut: 'EXPEDIEE' as StatutCommande,
        date_expedition: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commandes'] })
      setTrackingModal(null)
      toast.success('Numéro de suivi ajouté')
    },
    onError: () => toast.error('Erreur lors de l\'ajout du suivi')
  })

  const toggleRowExpansion = (id: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const totalPages = Math.ceil((response?.totalCount || 0) / ITEMS_PER_PAGE)
  const commandes = response?.commandes || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <PageHeader
          title="E-Shop — Commandes"
          description={`${response?.totalCount || 0} commandes · ${formatEuro(kpis.caMois)} ce mois`}
        />
        <Button variant="primary" size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          Nouvelle commande
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          icon={ShoppingBag}
          label="Commandes ce mois"
          value={kpis.commandesMois}
          color="#3B82F6"
        />
        <KpiCard
          icon={Euro}
          label="CA e-shop mois"
          value={formatEuro(kpis.caMois)}
          color="#22C55E"
        />
        <KpiCard
          icon={Package}
          label="En préparation"
          value={kpis.enPreparation}
          color="#F59E0B"
        />
        <KpiCard
          icon={Truck}
          label="Expédiées"
          value={kpis.expediees}
          color="#2EC6F3"
        />
      </div>

      {/* Filtres */}
      <Card>
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher par n° commande, nom, email..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none"
              />
            </div>
          </div>

          <select
            value={statutFilter}
            onChange={(e) => setStatutFilter(e.target.value as StatutCommande | '')}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none bg-white"
          >
            <option value="">Tous les statuts</option>
            {Object.entries(STATUT_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>{config.label}</option>
            ))}
          </select>

          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              placeholder="01/01/2024 - 31/01/2024"
              className="pl-10 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none w-48"
            />
          </div>
        </div>
      </Card>

      {/* Table des commandes */}
      {isLoading ? (
        <SkeletonTable rows={10} cols={8} />
      ) : (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  <th className="w-8 px-4 py-3"></th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    # Commande
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Produits
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Montant TTC
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Livraison
                  </th>
                  <th className="w-16 px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {!commandes.length ? (
                  <tr>
                    <td colSpan={9}>
                      <EmptyState
                        illustration={<IllustrationEmptyCommandes size={120} />}
                        icon={<ShoppingBag className="w-8 h-8" />}
                        title="Aucune commande trouvée"
                        description={search || statutFilter ? "Modifiez vos filtres pour voir plus de résultats" : "Les commandes apparaîtront ici"}
                      />
                    </td>
                  </tr>
                ) : commandes.map((commande) => {
                  const isExpanded = expandedRows.has(commande.id)
                  const config = STATUT_CONFIG[commande.statut]
                  const clientName = commande.client_nom || `${commande.lead?.prenom} ${commande.lead?.nom}`

                  return (
                    <>
                      <tr key={commande.id} className="group hover:bg-primary/[0.02] transition-colors">
                        {/* Expand toggle */}
                        <td className="px-4 py-3">
                          <button
                            onClick={() => toggleRowExpansion(commande.id)}
                            className="p-1 rounded hover:bg-gray-100 transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-gray-400" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-gray-400" />
                            )}
                          </button>
                        </td>

                        {/* Numéro commande */}
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            <span className="font-mono text-sm font-medium text-accent">
                              {commande.numero_commande || `#${commande.id.slice(0, 8)}`}
                            </span>
                            {commande.tracking_number && (
                              <Badge variant="primary" size="sm">Suivi: {commande.tracking_number.slice(0, 8)}...</Badge>
                            )}
                          </div>
                        </td>

                        {/* Client */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar name={clientName} size="sm" />
                            <div className="min-w-0">
                              <p className="font-medium text-accent truncate">{clientName}</p>
                              <p className="text-xs text-gray-500 truncate">{commande.client_email}</p>
                            </div>
                          </div>
                        </td>

                        {/* Date */}
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-600">{formatDate(commande.created_at)}</span>
                        </td>

                        {/* Produits */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center justify-center w-6 h-6 bg-gray-100 rounded-full text-xs font-medium text-gray-600">
                              {commande.produits.length}
                            </span>
                            <span className="text-sm text-gray-600">
                              {commande.produits.length === 1 ? 'produit' : 'produits'}
                            </span>
                          </div>
                        </td>

                        {/* Montant */}
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            <span className="font-semibold text-accent">
                              {formatEuro(commande.montant_ttc)}
                            </span>
                            {commande.frais_port > 0 && (
                              <span className="text-xs text-gray-500">
                                +{formatEuro(commande.frais_port)} port
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Statut */}
                        <td className="px-4 py-3">
                          <Badge
                            variant={config.variant}
                            className="gap-1.5"
                            style={{ backgroundColor: `${config.color}15`, color: config.color }}
                          >
                            {(() => { const CI = config.icon; return <CI className="w-3 h-3" /> })()}
                            {config.label}
                          </Badge>
                        </td>

                        {/* Livraison */}
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            {commande.transporteur && (
                              <span className="text-xs text-gray-600">{commande.transporteur}</span>
                            )}
                            {commande.date_expedition && (
                              <span className="text-xs text-gray-500">
                                Exp. {formatDate(commande.date_expedition)}
                              </span>
                            )}
                            {commande.date_livraison && (
                              <span className="text-xs text-green-600">
                                Livré {formatDate(commande.date_livraison)}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {commande.statut === 'PREPAREE' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setTrackingModal({
                                  id: commande.id,
                                  numero: commande.tracking_number,
                                  transporteur: commande.transporteur
                                })}
                                className="h-8 w-8 p-0"
                              >
                                <Truck className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => window.open(`https://dashboard.stripe.com/payments/${commande.stripe_payment_intent}`, '_blank')}
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded row details */}
                      {isExpanded && (
                        <tr className="bg-gray-50/50">
                          <td colSpan={9} className="px-4 py-4">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                              {/* Produits */}
                              <div>
                                <h4 className="text-sm font-semibold text-gray-900 mb-2">Produits commandés</h4>
                                <div className="space-y-2">
                                  {commande.produits.map((produit, index) => (
                                    <div key={index} className="flex items-center justify-between text-sm">
                                      <div className="flex-1">
                                        <span className="font-medium">{produit.nom}</span>
                                        <span className="text-gray-500 ml-2">×{produit.quantite}</span>
                                      </div>
                                      <span className="font-medium">{formatEuro(produit.prix_unitaire_ht * produit.quantite)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Adresse livraison */}
                              <div>
                                <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                  <MapPin className="w-4 h-4" />
                                  Adresse de livraison
                                </h4>
                                <div className="text-sm text-gray-600 space-y-1">
                                  {(() => {
                                    const addr = commande.adresse_livraison as {rue?: string, code_postal?: string, ville?: string, pays?: string} | null
                                    return (
                                      <>
                                        <p>{addr?.rue}</p>
                                        <p>{addr?.code_postal} {addr?.ville}</p>
                                        <p>{addr?.pays}</p>
                                      </>
                                    )
                                  })()}
                                </div>
                              </div>

                              {/* Informations supplémentaires */}
                              <div>
                                <h4 className="text-sm font-semibold text-gray-900 mb-2">Informations</h4>
                                <div className="space-y-2 text-sm">
                                  <div className="flex items-center justify-between">
                                    <span className="text-gray-600">Paiement:</span>
                                    <Badge
                                      variant={commande.paiement_statut === 'PAYE' ? 'success' :
                                              commande.paiement_statut === 'ECHOUE' ? 'error' : 'default'}
                                      size="sm"
                                    >
                                      {commande.paiement_statut.replace('_', ' ').toLowerCase()}
                                    </Badge>
                                  </div>
                                  {commande.tracking_number && (
                                    <div className="flex items-center justify-between">
                                      <span className="text-gray-600">Suivi:</span>
                                      <span className="font-mono text-xs">{commande.tracking_number}</span>
                                    </div>
                                  )}
                                  {commande.notes && (
                                    <div>
                                      <span className="text-gray-600">Notes:</span>
                                      <p className="text-gray-800 mt-1">{commande.notes}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Page {page} sur {totalPages} · {response?.totalCount} commandes
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  Précédent
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Modal tracking */}
      <Dialog open={!!trackingModal} onClose={() => setTrackingModal(null)} size="md">
        <DialogHeader>
          <DialogTitle>Expédition de la commande</DialogTitle>
          <DialogDescription>
            Ajoutez les informations de suivi pour notifier le client de l'expédition
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(e) => {
          e.preventDefault()
          const formData = new FormData(e.target as HTMLFormElement)
          const trackingNumber = formData.get('tracking_number') as string
          const transporteur = formData.get('transporteur') as string

          if (!trackingNumber.trim()) {
            toast.error('Le numéro de suivi est requis')
            return
          }

          addTracking.mutate({
            id: trackingModal!.id,
            tracking_number: trackingNumber,
            transporteur: transporteur || undefined,
          })
        }}>
          <div className="space-y-4">
            <Input
              name="tracking_number"
              label="Numéro de suivi"
              placeholder="1Z999AA1234567890"
              defaultValue={trackingModal?.numero || ''}
              required
            />

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Transporteur
              </label>
              <select
                name="transporteur"
                defaultValue={trackingModal?.transporteur || ''}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none bg-white"
              >
                <option value="">Sélectionner un transporteur...</option>
                <option value="La Poste">La Poste</option>
                <option value="Chronopost">Chronopost</option>
                <option value="UPS">UPS</option>
                <option value="FedEx">FedEx</option>
                <option value="DHL">DHL</option>
                <option value="Mondial Relay">Mondial Relay</option>
                <option value="Autre">Autre</option>
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              type="button"
              onClick={() => setTrackingModal(null)}
              disabled={addTracking.isPending}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              loading={addTracking.isPending}
              className="gap-2"
            >
              <Truck className="w-4 h-4" />
              Marquer comme expédiée
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  )
}