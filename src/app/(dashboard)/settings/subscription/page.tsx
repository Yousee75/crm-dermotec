'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  CreditCard, Calendar, Users, Database, AlertTriangle,
  Check, ArrowUpRight, ArrowDownLeft, Download, Crown,
  Zap, Building2, ExternalLink,
} from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/Dialog'

// ─── Plan definitions ─────────────────────────────────────────────

type PlanId = 'decouverte' | 'pro' | 'expert' | 'clinique'

interface PlanDef {
  id: PlanId
  name: string
  price: string
  period: string
  icon: React.ReactNode
  maxLeads: number | null
  maxUsers: number | null
  features: string[]
}

const PLANS: PlanDef[] = [
  {
    id: 'decouverte',
    name: 'Découverte',
    price: 'Gratuit',
    period: '',
    icon: <Zap className="w-5 h-5" />,
    maxLeads: 50,
    maxUsers: 1,
    features: ['50 leads', '1 utilisateur', 'Pipeline kanban', 'Email templates', 'Support communauté'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '49€',
    period: '/mois HT',
    icon: <Crown className="w-5 h-5" />,
    maxLeads: 500,
    maxUsers: 5,
    features: [
      '500 leads', '5 utilisateurs', 'Financement dossiers', 'Analytics avancé',
      'Export CSV / PDF', 'Cadences automatisées', 'Support email prioritaire',
    ],
  },
  {
    id: 'expert',
    name: 'Expert',
    price: '99€',
    period: '/mois HT',
    icon: <Crown className="w-5 h-5" />,
    maxLeads: null,
    maxUsers: 15,
    features: [
      'Leads illimités', '15 utilisateurs', 'Assistant IA', 'API access',
      'Webhooks', 'Intégrations (WhatsApp, SMS)', 'Support téléphonique', 'SLA 99.5%',
    ],
  },
  {
    id: 'clinique',
    name: 'Clinique',
    price: 'Sur devis',
    period: '',
    icon: <Building2 className="w-5 h-5" />,
    maxLeads: null,
    maxUsers: null,
    features: [
      'Tout illimité', 'Multi-sites', 'Formation dédiée',
      'Account manager', 'SLA 99.9%', 'DPA personnalisé',
    ],
  },
]

const planIndex = (id: PlanId) => PLANS.findIndex((p) => p.id === id)

// ─── Fallback data (plan Découverte gratuit) ─────────────────────

const FALLBACK_SUBSCRIPTION = {
  planId: 'decouverte' as PlanId,
  status: 'active' as const,
  nextBillingDate: null as string | null,
  leadsUsed: 0,
  usersUsed: 1,
  storageMB: 0,
  storageMaxMB: 500,
}

// ─── Types ───────────────────────────────────────────────────────

interface StripeInvoice {
  id: string
  created: number
  amount_paid: number
  status: string
  hosted_invoice_url: string | null
  invoice_pdf: string | null
}

interface SubscriptionData {
  subscription: {
    planId: PlanId
    status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete'
    nextBillingDate: string | null
    leadsUsed: number
    usersUsed: number
    storageMB: number
    storageMaxMB: number
  } | null
  invoices: StripeInvoice[]
}

// ─── Status badge helper ──────────────────────────────────────────

function statusBadge(status: string) {
  const map: Record<string, { label: string; variant: 'success' | 'primary' | 'error' | 'warning' }> = {
    active: { label: 'Actif', variant: 'success' },
    trialing: { label: 'Essai', variant: 'primary' },
    past_due: { label: 'Impayé', variant: 'error' },
    canceled: { label: 'Annulé', variant: 'warning' },
    incomplete: { label: 'Incomplet', variant: 'warning' },
  }
  const s = map[status] ?? { label: status, variant: 'primary' as const }
  return <Badge variant={s.variant} dot pulse={status === 'past_due'}>{s.label}</Badge>
}

function invoiceStatusBadge(status: string) {
  if (status === 'paid') return <Badge variant="success" size="sm">Payée</Badge>
  if (status === 'open') return <Badge variant="warning" size="sm">En attente</Badge>
  if (status === 'void') return <Badge variant="error" size="sm">Annulée</Badge>
  return <Badge variant="error" size="sm">Impayée</Badge>
}

// ─── Skeleton loader ─────────────────────────────────────────────

function SubscriptionSkeleton() {
  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div>
        <div className="h-7 w-40 bg-[#F4F0EB] rounded-lg animate-pulse" />
        <div className="h-4 w-72 bg-[#F4F0EB] rounded-lg animate-pulse mt-2" />
      </div>
      {[1, 2, 3].map((i) => (
        <Card key={i} padding="lg">
          <CardContent>
            <div className="space-y-4">
              <div className="h-5 w-32 bg-[#F4F0EB] rounded animate-pulse" />
              <div className="h-4 w-full bg-[#F4F0EB] rounded animate-pulse" />
              <div className="h-4 w-3/4 bg-[#F4F0EB] rounded animate-pulse" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// ─── Page component ───────────────────────────────────────────────

export default function SubscriptionPage() {
  const [cancelOpen, setCancelOpen] = useState(false)
  const [changingPlan, setChangingPlan] = useState<PlanId | null>(null)
  const [managingPortal, setManagingPortal] = useState(false)

  // Fetch subscription + invoices from Stripe API
  const { data, isLoading, error } = useQuery<SubscriptionData>({
    queryKey: ['subscription'],
    queryFn: async () => {
      const res = await fetch('/api/stripe/subscription')
      if (!res.ok) throw new Error('Erreur chargement abonnement')
      return res.json()
    },
    staleTime: 60_000,
  })

  // Use real data or fallback to plan Découverte
  const sub = data?.subscription ?? FALLBACK_SUBSCRIPTION
  const invoices = data?.invoices ?? []
  const currentPlan = PLANS.find((p) => p.id === sub.planId) ?? PLANS[0]
  const currentIdx = planIndex(sub.planId)
  const hasSubscription = !!data?.subscription

  // Show skeleton while loading
  if (isLoading) return <SubscriptionSkeleton />

  const handleChangePlan = async (targetId: PlanId) => {
    const targetIdx = planIndex(targetId)
    const action = targetIdx > currentIdx ? 'Upgrade' : 'Downgrade'
    const target = PLANS[targetIdx]
    setChangingPlan(targetId)
    toast.success(`${action} vers ${target.name} demandé. Redirection vers Stripe...`)
    try {
      const res = await fetch('/api/stripe/checkout-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: targetId }),
      })
      const result = await res.json()
      if (result.url) {
        window.location.href = result.url
      } else {
        toast.error('Impossible de créer la session de paiement.')
        setChangingPlan(null)
      }
    } catch {
      toast.error('Erreur lors de la redirection vers Stripe.')
      setChangingPlan(null)
    }
  }

  const handleManageSubscription = async () => {
    setManagingPortal(true)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const result = await res.json()
      if (result.url) {
        window.location.href = result.url
      } else {
        toast.error('Impossible d\'ouvrir le portail de gestion.')
        setManagingPortal(false)
      }
    } catch {
      toast.error('Erreur lors de l\'ouverture du portail Stripe.')
      setManagingPortal(false)
    }
  }

  const handleCancel = async () => {
    // Redirect to Stripe Customer Portal for cancellation
    await handleManageSubscription()
    setCancelOpen(false)
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold text-accent">
          Abonnement
        </h1>
        <p className="text-sm text-[#777777] mt-1">Gérez votre plan, votre usage et vos factures.</p>
      </div>

      {/* Error banner */}
      {error && !data && (
        <div className="rounded-xl border border-[#FF8C42]/30 bg-[#FFF3E8] p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-[#FF8C42] shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-accent">Impossible de charger l&apos;abonnement Stripe</p>
            <p className="text-xs text-[#777777] mt-1">
              Vous êtes sur le plan Découverte (gratuit). Si vous avez un abonnement actif, vérifiez votre connexion.
            </p>
          </div>
        </div>
      )}

      {/* A — Plan actuel */}
      <Card padding="lg">
        <CardHeader>
          <CardTitle icon={<CreditCard className="w-5 h-5" />}>Plan actuel</CardTitle>
          <div className="flex items-center gap-2">
            {statusBadge(sub.status)}
            {hasSubscription && (
              <Button
                variant="ghost"
                size="sm"
                icon={<ExternalLink className="w-3.5 h-3.5" />}
                loading={managingPortal}
                onClick={handleManageSubscription}
              >
                Gérer mon abonnement
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-end gap-6">
            <div className="flex-1">
              <p className="text-sm text-[#777777] mb-1">Vous êtes sur le plan</p>
              <p className="text-2xl font-bold text-accent">
                {currentPlan.name}
                <span className="ml-2 text-base font-normal text-[#999999]">
                  {currentPlan.price}{currentPlan.period}
                </span>
              </p>
            </div>
            {sub.nextBillingDate && (
              <div className="flex items-center gap-2 text-sm text-[#777777]">
                <Calendar className="w-4 h-4" />
                <span>
                  Prochain paiement :{' '}
                  <span className="font-medium text-accent">
                    {new Date(sub.nextBillingDate).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </span>
              </div>
            )}
            {!hasSubscription && (
              <div className="flex items-center gap-2 text-sm text-[#FF8C42]">
                <Zap className="w-4 h-4" />
                <span>Plan gratuit — passez au Pro pour débloquer toutes les fonctionnalités</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* B — Usage */}
      <Card padding="lg">
        <CardHeader>
          <CardTitle icon={<Database className="w-5 h-5" />}>Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Leads */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-[#777777]">Leads</span>
                <span className="text-xs text-[#999999] tabular-nums">
                  {sub.leadsUsed} / {currentPlan.maxLeads ?? '∞'}
                </span>
              </div>
              <ProgressBar
                value={sub.leadsUsed}
                max={currentPlan.maxLeads ?? sub.leadsUsed}
                size="md"
                color="var(--color-primary)"
              />
            </div>
            {/* Users */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-[#777777]">Utilisateurs</span>
                <span className="text-xs text-[#999999] tabular-nums">
                  {sub.usersUsed} / {currentPlan.maxUsers ?? '∞'}
                </span>
              </div>
              <ProgressBar
                value={sub.usersUsed}
                max={currentPlan.maxUsers ?? sub.usersUsed}
                size="md"
                color="var(--color-primary)"
              />
            </div>
            {/* Storage */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-[#777777]">Stockage</span>
                <span className="text-xs text-[#999999] tabular-nums">
                  {sub.storageMB} Mo / {sub.storageMaxMB} Mo
                </span>
              </div>
              <ProgressBar
                value={sub.storageMB}
                max={sub.storageMaxMB}
                size="md"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* C — Changer de plan */}
      <Card padding="lg">
        <CardHeader>
          <CardTitle icon={<ArrowUpRight className="w-5 h-5" />}>Changer de plan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {PLANS.map((plan) => {
              const idx = planIndex(plan.id)
              const isCurrent = plan.id === sub.planId
              const isUpgrade = idx > currentIdx
              const isDowngrade = idx < currentIdx

              return (
                <div
                  key={plan.id}
                  className={`relative rounded-xl border-2 p-4 transition-shadow ${
                    isCurrent
                      ? 'border-primary bg-primary/5'
                      : 'border-[#F4F0EB] hover:border-[#EEEEEE]'
                  }`}
                >
                  {isCurrent && (
                    <span className="absolute -top-2.5 left-3 inline-flex items-center rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-white">
                      Plan actuel
                    </span>
                  )}

                  <div className="flex items-center gap-2 mb-3 text-accent">
                    <span className="text-primary">{plan.icon}</span>
                    <span className="font-semibold text-sm">{plan.name}</span>
                  </div>

                  <div className="mb-3">
                    <span className="text-lg font-bold text-accent">{plan.price}</span>
                    {plan.period && (
                      <span className="text-xs text-[#999999] ml-0.5">{plan.period}</span>
                    )}
                  </div>

                  <ul className="space-y-1.5 mb-4">
                    {plan.features.slice(0, 4).map((f) => (
                      <li key={f} className="flex items-start gap-1.5 text-xs text-[#777777]">
                        <Check className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                    {plan.features.length > 4 && (
                      <li className="text-xs text-[#999999]">
                        +{plan.features.length - 4} autres...
                      </li>
                    )}
                  </ul>

                  {isCurrent ? (
                    <Button variant="outline" size="sm" disabled className="w-full min-h-[44px]">
                      Plan actuel
                    </Button>
                  ) : plan.id === 'clinique' ? (
                    <Button variant="outline" size="sm" className="w-full min-h-[44px]" onClick={() => toast.info('Contactez-nous pour un devis personnalisé.')}>
                      Nous contacter
                    </Button>
                  ) : isUpgrade ? (
                    <Button
                      variant="primary"
                      size="sm"
                      className="w-full min-h-[44px]"
                      icon={<ArrowUpRight className="w-3.5 h-3.5" />}
                      loading={changingPlan === plan.id}
                      onClick={() => handleChangePlan(plan.id)}
                    >
                      Upgrade
                    </Button>
                  ) : isDowngrade ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full min-h-[44px]"
                      icon={<ArrowDownLeft className="w-3.5 h-3.5" />}
                      loading={changingPlan === plan.id}
                      onClick={() => handleChangePlan(plan.id)}
                    >
                      Downgrade
                    </Button>
                  ) : null}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* D — Historique factures */}
      <Card padding="lg">
        <CardHeader>
          <CardTitle icon={<CreditCard className="w-5 h-5" />}>Historique des factures</CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="w-8 h-8 text-[#999999] mx-auto mb-3" />
              <p className="text-sm text-[#777777]">Aucune facture pour le moment.</p>
              <p className="text-xs text-[#999999] mt-1">Les factures apparaîtront ici après votre premier paiement.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#F4F0EB]">
                    <th className="text-left py-2 pr-4 font-medium text-[#777777]">Date</th>
                    <th className="text-left py-2 pr-4 font-medium text-[#777777]">Montant</th>
                    <th className="text-left py-2 pr-4 font-medium text-[#777777]">Statut</th>
                    <th className="text-right py-2 font-medium text-[#777777]">Facture</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="border-b border-[#FAF8F5] last:border-0">
                      <td className="py-3 pr-4 text-[#3A3A3A]">
                        {new Date(inv.created * 1000).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3 pr-4 font-medium text-accent tabular-nums">
                        {(inv.amount_paid / 100).toLocaleString('fr-FR', {
                          style: 'currency',
                          currency: 'EUR',
                        })}
                      </td>
                      <td className="py-3 pr-4">{invoiceStatusBadge(inv.status)}</td>
                      <td className="py-3 text-right">
                        {(inv.hosted_invoice_url || inv.invoice_pdf) ? (
                          <a
                            href={inv.hosted_invoice_url ?? inv.invoice_pdf ?? '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button variant="ghost" size="sm" icon={<Download className="w-3.5 h-3.5" />}>
                              PDF
                            </Button>
                          </a>
                        ) : (
                          <Button variant="ghost" size="sm" disabled icon={<Download className="w-3.5 h-3.5" />}>
                            PDF
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* E — Danger zone : annulation (seulement si abonnement payant actif) */}
      {hasSubscription && sub.status !== 'canceled' && (
        <Card padding="lg" className="border-red-100">
          <CardHeader>
            <CardTitle icon={<AlertTriangle className="w-5 h-5 text-[#FF2D78]" />}>
              <span className="text-[#FF2D78]">Zone de danger</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[#777777] mb-4">
              En annulant votre abonnement, vous conserverez l&apos;accès jusqu&apos;à la fin de la
              période facturée. Vos données seront conservées 90 jours.
            </p>
            <Button variant="destructive" size="sm" className="min-h-[44px]" onClick={() => setCancelOpen(true)}>
              Annuler mon abonnement
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Cancel confirmation modal */}
      <Dialog open={cancelOpen} onClose={() => setCancelOpen(false)} size="sm">
        <DialogHeader onClose={() => setCancelOpen(false)}>
          <DialogTitle>Confirmer l&apos;annulation</DialogTitle>
          <DialogDescription>
            Vous allez être redirigé vers le portail Stripe pour gérer l&apos;annulation de votre plan{' '}
            <strong>{currentPlan.name}</strong>.
            {sub.nextBillingDate && (
              <>
                {' '}Votre accès restera actif jusqu&apos;au{' '}
                {new Date(sub.nextBillingDate).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
                .
              </>
            )}
            {' '}Vous pourrez vous réabonner à tout moment.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" size="sm" className="min-h-[44px]" onClick={() => setCancelOpen(false)}>
            Conserver mon plan
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="min-h-[44px]"
            onClick={handleCancel}
          >
            Oui, annuler
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}
