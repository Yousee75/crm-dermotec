'use client'

import { useState } from 'react'
import {
  CreditCard, Calendar, Users, Database, AlertTriangle,
  Check, ArrowUpRight, ArrowDownLeft, Download, Crown,
  Zap, Building2,
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

// ─── Mock data (will be replaced with Stripe later) ───────────────

const MOCK_SUBSCRIPTION = {
  planId: 'pro' as PlanId,
  status: 'active' as 'active' | 'trialing' | 'past_due',
  nextBillingDate: '2026-04-21',
  leadsUsed: 127,
  usersUsed: 3,
  storageMB: 340,
  storageMaxMB: 1000,
}

const MOCK_INVOICES = [
  { id: 'inv_001', date: '2026-03-01', amount: '49,00 €', status: 'paid' as const, pdfUrl: '#' },
  { id: 'inv_002', date: '2026-02-01', amount: '49,00 €', status: 'paid' as const, pdfUrl: '#' },
  { id: 'inv_003', date: '2026-01-01', amount: '49,00 €', status: 'paid' as const, pdfUrl: '#' },
  { id: 'inv_004', date: '2025-12-01', amount: '49,00 €', status: 'paid' as const, pdfUrl: '#' },
  { id: 'inv_005', date: '2025-11-01', amount: '49,00 €', status: 'unpaid' as const, pdfUrl: '#' },
]

// ─── Status badge helper ──────────────────────────────────────────

function statusBadge(status: 'active' | 'trialing' | 'past_due') {
  const map = {
    active: { label: 'Actif', variant: 'success' as const },
    trialing: { label: 'Essai', variant: 'primary' as const },
    past_due: { label: 'Impayé', variant: 'error' as const },
  }
  const s = map[status]
  return <Badge variant={s.variant} dot pulse={status === 'past_due'}>{s.label}</Badge>
}

function invoiceStatusBadge(status: 'paid' | 'unpaid') {
  return status === 'paid'
    ? <Badge variant="success" size="sm">Payée</Badge>
    : <Badge variant="error" size="sm">Impayée</Badge>
}

// ─── Page component ───────────────────────────────────────────────

export default function SubscriptionPage() {
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  const sub = MOCK_SUBSCRIPTION
  const currentPlan = PLANS.find((p) => p.id === sub.planId)!
  const currentIdx = planIndex(sub.planId)

  const handleChangePlan = (targetId: PlanId) => {
    const targetIdx = planIndex(targetId)
    const action = targetIdx > currentIdx ? 'Upgrade' : 'Downgrade'
    const target = PLANS[targetIdx]
    toast.success(`${action} vers ${target.name} demandé. Redirection vers Stripe...`)
    // TODO: call Stripe checkout/portal
  }

  const handleCancel = async () => {
    setCancelling(true)
    // Simulate API call
    await new Promise((r) => setTimeout(r, 1500))
    setCancelling(false)
    setCancelOpen(false)
    toast.success('Votre abonnement sera annulé à la fin de la période en cours.')
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Page title */}
      <div>
        <h1
          className="text-2xl font-bold text-accent"
         
        >
          Abonnement
        </h1>
        <p className="text-sm text-gray-500 mt-1">Gérez votre plan, votre usage et vos factures.</p>
      </div>

      {/* A — Plan actuel */}
      <Card padding="lg">
        <CardHeader>
          <CardTitle icon={<CreditCard className="w-5 h-5" />}>Plan actuel</CardTitle>
          {statusBadge(sub.status)}
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-end gap-6">
            <div className="flex-1">
              <p className="text-sm text-gray-500 mb-1">Vous êtes sur le plan</p>
              <p
                className="text-2xl font-bold text-accent"
               
              >
                {currentPlan.name}
                <span className="ml-2 text-base font-normal text-gray-400">
                  {currentPlan.price}{currentPlan.period}
                </span>
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
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
                <span className="text-sm font-medium text-gray-600">Leads</span>
                <span className="text-xs text-gray-400 tabular-nums">
                  {sub.leadsUsed} / {currentPlan.maxLeads ?? '∞'}
                </span>
              </div>
              <ProgressBar
                value={sub.leadsUsed}
                max={currentPlan.maxLeads ?? sub.leadsUsed}
                size="md"
                color="#2EC6F3"
              />
            </div>
            {/* Users */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Utilisateurs</span>
                <span className="text-xs text-gray-400 tabular-nums">
                  {sub.usersUsed} / {currentPlan.maxUsers ?? '∞'}
                </span>
              </div>
              <ProgressBar
                value={sub.usersUsed}
                max={currentPlan.maxUsers ?? sub.usersUsed}
                size="md"
                color="#2EC6F3"
              />
            </div>
            {/* Storage */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Stockage</span>
                <span className="text-xs text-gray-400 tabular-nums">
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
                      : 'border-gray-100 hover:border-gray-200'
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
                      <span className="text-xs text-gray-400 ml-0.5">{plan.period}</span>
                    )}
                  </div>

                  <ul className="space-y-1.5 mb-4">
                    {plan.features.slice(0, 4).map((f) => (
                      <li key={f} className="flex items-start gap-1.5 text-xs text-gray-500">
                        <Check className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                    {plan.features.length > 4 && (
                      <li className="text-xs text-gray-400">
                        +{plan.features.length - 4} autres...
                      </li>
                    )}
                  </ul>

                  {isCurrent ? (
                    <Button variant="outline" size="sm" disabled className="w-full">
                      Plan actuel
                    </Button>
                  ) : plan.id === 'clinique' ? (
                    <Button variant="outline" size="sm" className="w-full" onClick={() => toast.info('Contactez-nous pour un devis personnalisé.')}>
                      Nous contacter
                    </Button>
                  ) : isUpgrade ? (
                    <Button
                      variant="primary"
                      size="sm"
                      className="w-full"
                      icon={<ArrowUpRight className="w-3.5 h-3.5" />}
                      onClick={() => handleChangePlan(plan.id)}
                    >
                      Upgrade
                    </Button>
                  ) : isDowngrade ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      icon={<ArrowDownLeft className="w-3.5 h-3.5" />}
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 pr-4 font-medium text-gray-500">Date</th>
                  <th className="text-left py-2 pr-4 font-medium text-gray-500">Montant</th>
                  <th className="text-left py-2 pr-4 font-medium text-gray-500">Statut</th>
                  <th className="text-right py-2 font-medium text-gray-500">PDF</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_INVOICES.map((inv) => (
                  <tr key={inv.id} className="border-b border-gray-50 last:border-0">
                    <td className="py-3 pr-4 text-gray-700">
                      {new Date(inv.date).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3 pr-4 font-medium text-accent tabular-nums">{inv.amount}</td>
                    <td className="py-3 pr-4">{invoiceStatusBadge(inv.status)}</td>
                    <td className="py-3 text-right">
                      <Button variant="ghost" size="sm" icon={<Download className="w-3.5 h-3.5" />}>
                        PDF
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* E — Danger zone : annulation */}
      <Card padding="lg" className="border-red-100">
        <CardHeader>
          <CardTitle icon={<AlertTriangle className="w-5 h-5 text-red-500" />}>
            <span className="text-red-600">Zone de danger</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 mb-4">
            En annulant votre abonnement, vous conserverez l&apos;accès jusqu&apos;à la fin de la
            période facturée. Vos données seront conservées 90 jours.
          </p>
          <Button variant="destructive" size="sm" onClick={() => setCancelOpen(true)}>
            Annuler mon abonnement
          </Button>
        </CardContent>
      </Card>

      {/* Cancel confirmation modal */}
      <Dialog open={cancelOpen} onClose={() => setCancelOpen(false)} size="sm">
        <DialogHeader onClose={() => setCancelOpen(false)}>
          <DialogTitle>Confirmer l&apos;annulation</DialogTitle>
          <DialogDescription>
            Votre plan <strong>{currentPlan.name}</strong> restera actif jusqu&apos;au{' '}
            {new Date(sub.nextBillingDate).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
            . Vous pourrez vous réabonner à tout moment.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={() => setCancelOpen(false)}>
            Conserver mon plan
          </Button>
          <Button
            variant="destructive"
            size="sm"
            loading={cancelling}
            onClick={handleCancel}
          >
            Oui, annuler
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}
