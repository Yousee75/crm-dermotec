'use client'

import { useState } from 'react'
import { createClient } from '@/lib/infra/supabase-client'
import { toast } from 'sonner'
import Link from 'next/link'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import {
  Shield, Download, Trash2, Eye, FileText, ExternalLink,
  Database, Lock, Globe, Clock, CheckCircle, AlertTriangle,
  Server, Info
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Sous-traitants avec localisation et garanties
const SOUS_TRAITANTS = [
  { nom: 'Supabase', role: 'Base de données & Auth', localisation: 'UE (Francfort)', garanties: 'SOC 2 Type II', icon: Database },
  { nom: 'Stripe', role: 'Paiements', localisation: 'UE + US', garanties: 'PCI-DSS Level 1', icon: Lock },
  { nom: 'Vercel', role: 'Hébergement', localisation: 'UE (Francfort)', garanties: 'SOC 2, ISO 27001', icon: Server },
  { nom: 'Resend', role: 'Emails transactionnels', localisation: 'US', garanties: 'CCT 2021', icon: Globe },
  { nom: 'Upstash', role: 'Cache & Rate limiting', localisation: 'UE (Francfort)', garanties: 'SOC 2', icon: Server },
  { nom: 'Sentry', role: 'Monitoring erreurs', localisation: 'UE', garanties: 'SOC 2, RGPD DPA', icon: AlertTriangle },
]

// Durées de conservation
const CONSERVATION = [
  { type: 'Données CRM (leads, contacts)', duree: '3 ans après dernier contact', base: 'Intérêt légitime' },
  { type: 'Données de formation (Qualiopi)', duree: '6 ans', base: 'Code du travail L.6362-5' },
  { type: 'Factures et données comptables', duree: '10 ans', base: 'Code de commerce L.123-22' },
  { type: 'Logs de connexion', duree: '1 an', base: 'LCEN art. 6' },
  { type: 'Données anonymisées', duree: 'Indéfinie', base: 'Hors RGPD (anonymisation irréversible)' },
]

// Droits RGPD
const DROITS_RGPD = [
  { droit: 'Accès', article: 'Art. 15', description: 'Obtenir une copie de toutes vos données', action: 'export' },
  { droit: 'Rectification', article: 'Art. 16', description: 'Corriger vos données inexactes', action: 'edit' },
  { droit: 'Effacement', article: 'Art. 17', description: 'Supprimer vos données personnelles', action: 'delete' },
  { droit: 'Portabilité', article: 'Art. 20', description: 'Recevoir vos données en format JSON/CSV', action: 'export' },
  { droit: 'Opposition', article: 'Art. 21', description: 'Vous opposer au traitement analytics', action: 'optout' },
  { droit: 'Limitation', article: 'Art. 18', description: 'Geler le traitement de vos données', action: 'contact' },
]

export default function PrivacySettingsPage() {
  const [exporting, setExporting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [analyticsOptOut, setAnalyticsOptOut] = useState(false)
  const supabase = createClient()

  async function handleExportData() {
    setExporting(true)
    try {
      // TODO: Récupérer le lead_id depuis le user connecté ou le state
      const leadId = 'user-lead-id' // Placeholder - à implémenter
      const res = await fetch(`/api/gdpr/export?lead_id=${leadId}`, { method: 'GET' })
      if (!res.ok) throw new Error('Export échoué')
      const data = await res.json()

      // Télécharger en JSON
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `export-donnees-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)

      toast.success('Vos données ont été exportées')
    } catch {
      toast.error('Erreur lors de l\'export. Réessayez.')
    }
    setExporting(false)
  }

  async function handleDeleteData() {
    setDeleting(true)
    try {
      // TODO: Récupérer le lead_id depuis le user connecté ou le state
      const leadId = 'user-lead-id' // Placeholder - à implémenter
      const res = await fetch('/api/gdpr/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lead_id: leadId,
          reason: 'Demande de suppression utilisateur'
        })
      })
      if (!res.ok) throw new Error('Suppression échouée')
      toast.success('Demande de suppression enregistrée. Vous recevrez une confirmation par email.')
      setShowDeleteConfirm(false)
    } catch {
      toast.error('Erreur. Contactez dpo@satorea.fr')
    }
    setDeleting(false)
  }

  function handleOptOutAnalytics() {
    setAnalyticsOptOut(!analyticsOptOut)
    localStorage.setItem('analytics-optout', (!analyticsOptOut).toString())
    toast.success(analyticsOptOut ? 'Analytics réactivé' : 'Analytics désactivé — vos données d\'usage ne seront plus collectées')
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Confidentialité & Données"
        description="Transparence totale sur vos données — conformité RGPD"
      />

      {/* Banner de transparence */}
      <Card className="bg-accent text-white border-none">
        <div className="flex items-start gap-4 p-6">
          <div className="p-3 rounded-xl bg-primary/20 shrink-0">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-1">Vos données vous appartiennent</h3>
            <p className="text-white/70 text-sm leading-relaxed">
              Satorea agit en qualité de <strong className="text-white">sous-traitant</strong> pour vos données CRM.
              Vous restez le responsable de traitement. Vous pouvez à tout moment exporter,
              modifier ou supprimer vos données. Nous collectons des données d&apos;usage
              anonymisées pour améliorer le service — vous pouvez vous y opposer ci-dessous.
            </p>
          </div>
        </div>
      </Card>

      {/* Vos droits RGPD */}
      <Card padding="none">
        <CardHeader className="px-6 pt-6 pb-0">
          <CardTitle icon={<Eye className="w-4 h-4" />}>Vos droits RGPD</CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {DROITS_RGPD.map((d) => (
              <div key={d.article} className="flex items-start gap-3 p-3 rounded-lg border border-[#F4F0EB] hover:bg-[#FAF8F5] transition">
                <CheckCircle className="w-4 h-4 text-[#10B981] mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-accent">{d.droit}</span>
                    <Badge variant="outline" size="sm">{d.article}</Badge>
                  </div>
                  <p className="text-xs text-[#777777] mt-0.5">{d.description}</p>
                </div>
                {d.action === 'export' && (
                  <Button variant="ghost" size="sm" onClick={handleExportData} disabled={exporting}>
                    <Download className="w-3.5 h-3.5" />
                  </Button>
                )}
                {d.action === 'optout' && (
                  <button
                    onClick={handleOptOutAnalytics}
                    className={cn(
                      'shrink-0 w-10 h-6 rounded-full transition-colors relative',
                      analyticsOptOut ? 'bg-[#10B981]' : 'bg-[#EEEEEE]'
                    )}
                  >
                    <span className={cn(
                      'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform',
                      analyticsOptOut ? 'translate-x-4' : 'translate-x-0.5'
                    )} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t border-[#F4F0EB]">
            <Button
              variant="outline"
              size="sm"
              icon={<Download className="w-4 h-4" />}
              onClick={handleExportData}
              loading={exporting}
            >
              Exporter mes données (JSON)
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-[#FF2D78] hover:bg-[#FFE0EF]"
              icon={<Trash2 className="w-4 h-4" />}
              onClick={() => setShowDeleteConfirm(true)}
            >
              Demander la suppression
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Données d'usage et Analytics */}
      <Card padding="none">
        <CardHeader className="px-6 pt-6 pb-0">
          <div className="flex items-center justify-between w-full">
            <CardTitle icon={<Database className="w-4 h-4" />}>Données d&apos;usage & Analytics</CardTitle>
            <Badge variant={analyticsOptOut ? 'error' : 'success'} size="sm" dot>
              {analyticsOptOut ? 'Désactivé' : 'Actif'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-4">
          <div className="bg-[#FAF8F5] rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div className="text-sm text-[#777777]">
                <p>Satorea collecte des <strong>données d&apos;usage anonymisées</strong> pour améliorer le produit :</p>
                <ul className="list-disc ml-4 mt-2 space-y-1 text-xs text-[#777777]">
                  <li>Pages visitées et temps passé (sans contenu)</li>
                  <li>Fonctionnalités utilisées (fréquence, parcours)</li>
                  <li>Performances techniques (temps de chargement)</li>
                </ul>
                <p className="mt-2 text-xs">
                  Ces données ne contiennent <strong>aucune donnée personnelle de vos leads/contacts</strong>.
                  Elles sont agrégées et ne permettent pas de vous identifier.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border border-[#EEEEEE]">
            <div>
              <p className="text-sm font-medium text-accent">Collecter les données d&apos;usage</p>
              <p className="text-xs text-[#777777]">Aide Satorea à améliorer le produit pour vous</p>
            </div>
            <button
              onClick={handleOptOutAnalytics}
              className={cn(
                'shrink-0 w-12 h-7 rounded-full transition-colors relative',
                !analyticsOptOut ? 'bg-primary' : 'bg-[#EEEEEE]'
              )}
            >
              <span className={cn(
                'absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform',
                !analyticsOptOut ? 'translate-x-5' : 'translate-x-0.5'
              )} />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Sous-traitants */}
      <Card padding="none">
        <CardHeader className="px-6 pt-6 pb-0">
          <CardTitle icon={<Server className="w-4 h-4" />}>Nos sous-traitants techniques</CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-4">
          <p className="text-sm text-[#777777] mb-4">
            Liste des services tiers qui traitent vos données. Tout changement vous sera notifié 30 jours à l&apos;avance.
          </p>
          <div className="space-y-2">
            {SOUS_TRAITANTS.map((st) => {
              const Icon = st.icon
              return (
                <div key={st.nom} className="flex items-center gap-3 p-3 rounded-lg border border-[#F4F0EB]">
                  <div className="p-2 rounded-lg bg-[#FAF8F5] shrink-0">
                    <Icon className="w-4 h-4 text-[#777777]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-accent">{st.nom}</span>
                      <Badge variant="outline" size="sm">{st.localisation}</Badge>
                    </div>
                    <p className="text-xs text-[#777777]">{st.role}</p>
                  </div>
                  <Badge variant="success" size="sm">{st.garanties}</Badge>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Durées de conservation */}
      <Card padding="none">
        <CardHeader className="px-6 pt-6 pb-0">
          <CardTitle icon={<Clock className="w-4 h-4" />}>Durées de conservation</CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#F4F0EB]">
                  <th className="text-left py-2 text-xs font-semibold text-[#777777] uppercase">Type de données</th>
                  <th className="text-left py-2 text-xs font-semibold text-[#777777] uppercase">Durée</th>
                  <th className="text-left py-2 text-xs font-semibold text-[#777777] uppercase hidden sm:table-cell">Base légale</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#FAF8F5]">
                {CONSERVATION.map((c) => (
                  <tr key={c.type}>
                    <td className="py-2.5 text-[#3A3A3A]">{c.type}</td>
                    <td className="py-2.5 font-medium text-accent">{c.duree}</td>
                    <td className="py-2.5 text-[#777777] hidden sm:table-cell">{c.base}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Liens légaux */}
      <Card padding="none">
        <CardHeader className="px-6 pt-6 pb-0">
          <CardTitle icon={<FileText className="w-4 h-4" />}>Documents légaux</CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: 'Conditions Générales (CGU/CGV)', href: '/conditions-generales' },
              { label: 'Politique de Confidentialité', href: '/politique-confidentialite' },
              { label: 'Accord de Traitement (DPA)', href: '/dpa' },
              { label: 'Mentions Légales', href: '/mentions-legales' },
            ].map((doc) => (
              <Link
                key={doc.href}
                href={doc.href}
                target="_blank"
                className="flex items-center justify-between p-3 rounded-lg border border-[#F4F0EB] hover:bg-[#FAF8F5] transition group"
              >
                <span className="text-sm text-[#3A3A3A] group-hover:text-primary">{doc.label}</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#999999] group-hover:text-primary" />
              </Link>
            ))}
          </div>

          <div className="mt-4 p-3 bg-[#FAF8F5] rounded-lg">
            <p className="text-xs text-[#777777]">
              <strong>DPO :</strong> dpo@satorea.fr — <strong>Réclamation CNIL :</strong>{' '}
              <a href="https://www.cnil.fr/fr/plaintes" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                www.cnil.fr/plaintes
              </a>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de confirmation suppression */}
      {showDeleteConfirm && (
        <>
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            onClick={() => setShowDeleteConfirm(false)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Escape' || e.key === 'Enter') {
                setShowDeleteConfirm(false)
              }
            }}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md px-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-[#FFE0EF]">
                  <AlertTriangle className="w-5 h-5 text-[#FF2D78]" />
                </div>
                <h3 className="font-semibold text-accent">Supprimer mes données</h3>
              </div>
              <p className="text-sm text-[#777777] mb-2">
                Cette action est <strong>irréversible</strong>. Toutes vos données personnelles seront supprimées conformément à l&apos;article 17 du RGPD.
              </p>
              <ul className="text-xs text-[#777777] space-y-1 mb-6 ml-4 list-disc">
                <li>Vos leads et contacts seront anonymisés</li>
                <li>Votre compte sera désactivé</li>
                <li>Les données de formation Qualiopi seront conservées 6 ans (obligation légale)</li>
                <li>Les factures seront conservées 10 ans (obligation comptable)</li>
              </ul>
              <div className="flex gap-3 justify-end">
                <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)}>Annuler</Button>
                <Button
                  variant="primary"
                  className="bg-[#FF2D78] hover:bg-red-600"
                  onClick={handleDeleteData}
                  loading={deleting}
                  icon={<Trash2 className="w-4 h-4" />}
                >
                  {deleting ? 'Suppression...' : 'Confirmer la suppression'}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
