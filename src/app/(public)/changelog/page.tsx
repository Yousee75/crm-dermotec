export const dynamic = 'force-dynamic'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Changelog — Dermotec CRM',
  description: 'Nouveautés et mises à jour du CRM Dermotec',
}

const RELEASES = [
  {
    version: '2.0.0',
    date: '21 mars 2026',
    tag: 'Majeure',
    tagColor: 'bg-primary/10 text-primary',
    changes: [
      { type: 'new', text: 'Multi-tenant : chaque client a son espace isolé' },
      { type: 'new', text: 'Système d\'invitation par email pour les équipes' },
      { type: 'new', text: 'Page pricing avec 4 plans (Découverte → Clinique)' },
      { type: 'new', text: 'Gestion d\'abonnement Stripe dans les paramètres' },
      { type: 'new', text: 'Onboarding wizard en 3 étapes pour les nouveaux clients' },
      { type: 'new', text: 'Centre de confidentialité RGPD avec export/suppression en self-service' },
      { type: 'new', text: 'Cookie consent banner conforme CNIL' },
      { type: 'new', text: 'Pages légales complètes : CGU, Privacy, DPA, Mentions' },
      { type: 'new', text: 'Système de tracking analytics pour amélioration produit' },
      { type: 'new', text: 'Module sécurité : prompt guard, rate limits, file validation, anomaly detection' },
      { type: 'new', text: 'Notifications in-app avec filtres' },
      { type: 'new', text: 'Centre d\'aide avec FAQ' },
      { type: 'improved', text: 'Fiche lead refonte complète : statut cliquable, barre de complétion, copie rapide' },
      { type: 'improved', text: 'Analytics : 7 graphiques Recharts temps réel' },
      { type: 'improved', text: 'Table leads : colonnes responsives, masquage mobile' },
      { type: 'improved', text: 'Touch targets 44px minimum sur toutes les interactions mobiles' },
      { type: 'fixed', text: 'Build production fonctionnel (0 erreurs TypeScript)' },
      { type: 'fixed', text: 'Formulaire création lead avec dialog fonctionnel' },
      { type: 'fixed', text: 'Toasts d\'erreur sur toutes les mutations Supabase' },
      { type: 'security', text: 'Mot de passe oublié + réinitialisation' },
      { type: 'security', text: 'Audit logs immuables (SQL rules)' },
      { type: 'security', text: 'Source maps désactivées en production' },
      { type: 'security', text: 'Soft delete + corbeille 90 jours' },
      { type: 'security', text: 'Protection anti-abus : quotas, export limits, watermark' },
    ],
  },
  {
    version: '1.0.0',
    date: '20 mars 2026',
    tag: 'Initial',
    tagColor: 'bg-[#F5F5F5] text-[#777777]',
    changes: [
      { type: 'new', text: 'CRM complet : 18 tables Supabase, pipeline 11 statuts' },
      { type: 'new', text: 'Pipeline Kanban drag-and-drop' },
      { type: 'new', text: 'Intégration Stripe : checkout, échéanciers, webhooks' },
      { type: 'new', text: 'PDF : certificats, conventions, factures' },
      { type: 'new', text: 'Email templates via Resend' },
      { type: 'new', text: 'RBAC 5 rôles : admin, manager, commercial, formatrice, assistante' },
      { type: 'new', text: 'Scoring leads algorithmique (5 critères, 100 points)' },
      { type: 'new', text: 'Smart actions : suggestions proactives' },
      { type: 'new', text: '11 formations avec Stripe products' },
    ],
  },
]

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  new: { label: 'Nouveau', color: 'bg-[#D1FAE5] text-[#10B981]' },
  improved: { label: 'Amélioré', color: 'bg-[#E0EBF5] text-[#6B8CAE]' },
  fixed: { label: 'Corrigé', color: 'bg-[#FFF3E8] text-[#FF8C42]' },
  security: { label: 'Sécurité', color: 'bg-[#FFE0EF] text-[#FF2D78]' },
}

export default function ChangelogPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold text-accent mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
        Changelog
      </h1>
      <p className="text-[#777777] mb-12">
        Toutes les nouveautés et améliorations du CRM Dermotec.
      </p>

      <div className="space-y-16">
        {RELEASES.map((release) => (
          <div key={release.version}>
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-xl font-bold text-accent">v{release.version}</h2>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${release.tagColor}`}>
                {release.tag}
              </span>
              <span className="text-sm text-[#999999]">{release.date}</span>
            </div>

            <div className="space-y-2">
              {release.changes.map((change, i) => {
                const typeConfig = TYPE_LABELS[change.type] || TYPE_LABELS.new
                return (
                  <div key={i} className="flex items-start gap-3 py-1.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium shrink-0 mt-0.5 ${typeConfig.color}`}>
                      {typeConfig.label}
                    </span>
                    <p className="text-sm text-[#3A3A3A]">{change.text}</p>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-16 pt-8 border-t border-[#F0F0F0] text-center">
        <p className="text-sm text-[#999999]">
          © 2026 Satorea · Dermotec CRM · Made in Paris
        </p>
      </div>
    </div>
  )
}
