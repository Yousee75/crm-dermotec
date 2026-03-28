// ============================================================
// CRM DERMOTEC — Gestionnaire d'Abonnements
// Exemple d'utilisation complète des APIs Subscription
// ============================================================

'use client'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import {
  useSubscription,
  useCreateSubscriptionCheckout,
  useCustomerPortal,
  useCurrentPlan
} from '@/hooks/use-subscription'
import { PLANS_CONFIG, type PlanSaaS } from '@/types/subscription'
import { formatEuro } from '@/lib/utils'
import {
  CreditCard,
  Settings,
  Zap,
  Crown,
  CheckCircle2,
  XCircle,
  Calendar,
  Euro
} from 'lucide-react'

interface SubscriptionManagerProps {
  showPlanSelection?: boolean
  compact?: boolean
}

export function SubscriptionManager({
  showPlanSelection = true,
  compact = false
}: SubscriptionManagerProps) {
  const { data: subscription, isLoading, error } = useSubscription()
  const { plan, hasPaidPlan, isLoading: planLoading } = useCurrentPlan()
  const createCheckout = useCreateSubscriptionCheckout()
  const openPortal = useCustomerPortal()

  if (isLoading || planLoading) {
    return <SubscriptionSkeleton />
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 text-destructive">
          <XCircle className="w-5 h-5" />
          <span>Erreur lors du chargement de l'abonnement</span>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Abonnement actuel */}
      <CurrentSubscriptionCard
        subscription={subscription}
        plan={plan}
        onManage={() => openPortal.mutate()}
        isManaging={openPortal.isPending}
      />

      {/* Sélection de plan */}
      {showPlanSelection && !compact && (
        <PlanSelection
          currentPlan={plan}
          onSelectPlan={(planId) => createCheckout.mutate(planId)}
          isUpgrading={createCheckout.isPending}
        />
      )}

      {/* Actions rapides */}
      <div className="flex flex-wrap gap-3">
        {hasPaidPlan && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => openPortal.mutate()}
            disabled={openPortal.isPending}
            className="flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Gérer l'abonnement
          </Button>
        )}

        {!hasPaidPlan && (
          <Button
            size="sm"
            onClick={() => createCheckout.mutate('pro')}
            disabled={createCheckout.isPending}
            className="flex items-center gap-2 bg-primary hover:bg-primary-dark"
          >
            <Zap className="w-4 h-4" />
            Passer à Pro
          </Button>
        )}
      </div>
    </div>
  )
}

// ============================================================
// Carte d'abonnement actuel
// ============================================================
function CurrentSubscriptionCard({
  subscription,
  plan,
  onManage,
  isManaging
}: {
  subscription: any
  plan: PlanSaaS
  onManage: () => void
  isManaging: boolean
}) {
  const planConfig = PLANS_CONFIG[plan]
  const sub = subscription?.subscription

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg">Abonnement actuel</h3>
        {sub && (
          <Badge variant={sub.status === 'active' ? 'default' : 'secondary'}>
            {sub.status === 'active' ? 'Actif' : sub.status}
          </Badge>
        )}
      </div>

      <div className="space-y-4">
        {/* Plan actuel */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            {plan === 'pro' && <Zap className="w-5 h-5 text-primary" />}
            {plan === 'expert' && <Crown className="w-5 h-5 text-action" />}
            {plan === 'clinique' && <Crown className="w-5 h-5 text-accent" />}
            {plan === 'decouverte' && <CheckCircle2 className="w-5 h-5 text-muted-foreground" />}
          </div>

          <div>
            <div className="font-medium">{planConfig.name}</div>
            <div className="text-sm text-muted-foreground">
              {planConfig.price > 0 ? (
                <>
                  {formatEuro(planConfig.price)} / mois
                </>
              ) : (
                'Plan gratuit'
              )}
            </div>
          </div>
        </div>

        {/* Détails de l'abonnement */}
        {sub && (
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <div className="text-sm text-muted-foreground">Prochaine facturation</div>
              <div className="font-medium flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(sub.current_period_end).toLocaleDateString('fr-FR')}
              </div>
            </div>

            <div>
              <div className="text-sm text-muted-foreground">Prix mensuel</div>
              <div className="font-medium flex items-center gap-1">
                <Euro className="w-4 h-4" />
                {formatEuro(planConfig.price)}
              </div>
            </div>
          </div>
        )}

        {/* Factures récentes */}
        {subscription?.invoices?.length > 0 && (
          <div className="pt-4 border-t">
            <div className="text-sm text-muted-foreground mb-2">Dernières factures</div>
            <div className="space-y-1">
              {subscription.invoices.slice(0, 3).map((invoice: any) => (
                <div key={invoice.id} className="flex items-center justify-between text-sm">
                  <span>{new Date(invoice.date).toLocaleDateString('fr-FR')}</span>
                  <div className="flex items-center gap-2">
                    <span>{formatEuro(invoice.amount / 100)}</span>
                    {invoice.pdf_url && (
                      <a
                        href={invoice.pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        PDF
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      {sub && (
        <div className="pt-4 border-t mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onManage}
            disabled={isManaging}
            className="flex items-center gap-2"
          >
            <CreditCard className="w-4 h-4" />
            {isManaging ? 'Ouverture...' : 'Gérer la facturation'}
          </Button>
        </div>
      )}
    </Card>
  )
}

// ============================================================
// Sélection de plans
// ============================================================
function PlanSelection({
  currentPlan,
  onSelectPlan,
  isUpgrading
}: {
  currentPlan: PlanSaaS
  onSelectPlan: (plan: PlanSaaS) => void
  isUpgrading: boolean
}) {
  const plans: PlanSaaS[] = ['pro', 'expert', 'clinique']

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Changer de plan</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((planId) => {
          const planConfig = PLANS_CONFIG[planId]
          const isCurrent = currentPlan === planId
          const isUpgrade = PLANS_CONFIG[currentPlan].price < planConfig.price

          return (
            <Card key={planId} className={`p-4 ${isCurrent ? 'ring-2 ring-primary' : ''}`}>
              <div className="text-center space-y-3">
                <div>
                  <h4 className="font-semibold">{planConfig.name}</h4>
                  <div className="text-2xl font-bold text-primary">
                    {formatEuro(planConfig.price)}
                    <span className="text-sm text-muted-foreground">/mois</span>
                  </div>
                </div>

                <ul className="text-sm space-y-1">
                  {planConfig.features.slice(0, 4).map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <CheckCircle2 className="w-3 h-3 text-success" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => onSelectPlan(planId)}
                  disabled={isCurrent || isUpgrading}
                  variant={isCurrent ? "secondary" : isUpgrade ? "default" : "outline"}
                  size="sm"
                  className="w-full"
                >
                  {isCurrent ? 'Plan actuel' : isUpgrade ? 'Passer à ce plan' : 'Rétrograder'}
                </Button>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

// ============================================================
// Loading skeleton
// ============================================================
function SubscriptionSkeleton() {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="space-y-4">
          <Skeleton className="h-6 w-48" />
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4">
            <div className="space-y-3">
              <Skeleton className="h-6 w-20 mx-auto" />
              <Skeleton className="h-8 w-24 mx-auto" />
              <div className="space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </div>
              <Skeleton className="h-8 w-full" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}