'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/infra/supabase-client'
import { UserCheck, Calendar, CreditCard, CheckCircle, Clock, XCircle, Euro, Users } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { SearchInput } from '@/components/ui/Input'
import { EmptyState } from '@/components/ui/EmptyState'
import { IllustrationEmptyStagiaires } from '@/components/ui/Illustrations'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { PageHeader } from '@/components/ui/PageHeader'
import Link from 'next/link'

// Couleurs centralisées (source unique : status-config.ts)
import { INSCRIPTION_STATUS, PAIEMENT_STATUS, getInscriptionStatus } from '@/lib/status-config'

const STATUT_CONFIG = Object.fromEntries(
  Object.entries(INSCRIPTION_STATUS).map(([k, v]) => [k, {
    label: v.label, color: v.color,
    icon: ['ANNULEE', 'REMBOURSEE', 'NO_SHOW'].includes(k) ? XCircle : ['EN_ATTENTE', 'EN_COURS'].includes(k) ? Clock : CheckCircle,
  }])
) as Record<string, { label: string; color: string; icon: typeof CheckCircle }>

const PAIEMENT_CONFIG = Object.fromEntries(
  Object.entries(PAIEMENT_STATUS).map(([k, v]) => [k, { label: v.label, color: v.color }])
) as Record<string, { label: string; color: string }>

export default function InscriptionsPage() {
  const supabase = createClient()
  const [search, setSearch] = useState('')
  const [statutFilter, setStatutFilter] = useState('')

  const { data: inscriptions, isLoading } = useQuery({
    queryKey: ['inscriptions-page'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inscriptions')
        .select(`
          id, statut, montant_total, montant_finance, reste_a_charge,
          mode_paiement, paiement_statut, taux_presence,
          certificat_genere, convention_signee, created_at,
          lead:leads!lead_id(id, prenom, nom, email, telephone),
          session:sessions!session_id(
            id, date_debut, date_fin, statut,
            formation:formations(id, nom, slug, categorie, prix_ht)
          )
        `)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    },
  })

  const filtered = inscriptions?.filter(i => {
    const matchSearch = !search ||
      i.lead?.prenom?.toLowerCase().includes(search.toLowerCase()) ||
      i.lead?.nom?.toLowerCase().includes(search.toLowerCase()) ||
      i.session?.formation?.nom?.toLowerCase().includes(search.toLowerCase())
    const matchStatut = !statutFilter || i.statut === statutFilter
    return matchSearch && matchStatut
  })

  const stats = {
    total: filtered?.length || 0,
    confirmees: filtered?.filter(i => i.statut === 'CONFIRMEE').length || 0,
    en_cours: filtered?.filter(i => i.statut === 'EN_COURS').length || 0,
    completees: filtered?.filter(i => i.statut === 'COMPLETEE').length || 0,
    ca: filtered?.reduce((sum, i) => sum + (i.montant_total || 0), 0) || 0,
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inscriptions"
        description={`${stats.total} inscription${stats.total > 1 ? 's' : ''} — ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(stats.ca)} CA`}
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#777777]">Total</p>
              <p className="text-xl font-bold text-[#111111]">{stats.total}</p>
            </div>
            <Users className="w-6 h-6 text-[#999999]" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#777777]">Confirmées</p>
              <p className="text-xl font-bold text-[#6B8CAE]">{stats.confirmees}</p>
            </div>
            <CheckCircle className="w-6 h-6 text-[#6B8CAE]" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#777777]">En cours</p>
              <p className="text-xl font-bold text-[#10B981]">{stats.en_cours}</p>
            </div>
            <Clock className="w-6 h-6 text-[#10B981]" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#777777]">Terminées</p>
              <p className="text-xl font-bold text-[#FF2D78]">{stats.completees}</p>
            </div>
            <CheckCircle className="w-6 h-6 text-[#FF2D78]" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#777777]">CA total</p>
              <p className="text-lg font-bold text-[#10B981]">
                {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(stats.ca)}
              </p>
            </div>
            <Euro className="w-6 h-6 text-[#10B981]" />
          </div>
        </Card>
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-4">
        <SearchInput
          value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement> | string) => setSearch(typeof e === 'string' ? e : e.target.value)}
          placeholder="Rechercher par nom ou formation..."
          className="sm:w-80"
        />
        <select
          value={statutFilter}
          onChange={(e) => setStatutFilter(e.target.value)}
          className="px-3 py-2 border border-[#EEEEEE] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Tous les statuts</option>
          {Object.entries(STATUT_CONFIG).map(([key, val]) => (
            <option key={key} value={key}>{val.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <SkeletonTable rows={6} cols={6} />
      ) : filtered?.length === 0 ? (
        <Card>
          <EmptyState
            illustration={<IllustrationEmptyStagiaires size={120} />}
            icon={<UserCheck className="w-7 h-7" />}
            title="Aucune inscription"
            description="Les inscriptions apparaîtront ici quand des prospects seront inscrits à des formations."
          />
        </Card>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-[#F4F0EB] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#FAF8F5]/50 border-b border-[#F4F0EB]">
                <tr>
                  <th className="text-left text-xs font-semibold text-[#777777] uppercase tracking-wider px-6 py-3">Stagiaire</th>
                  <th className="text-left text-xs font-semibold text-[#777777] uppercase tracking-wider px-6 py-3">Formation</th>
                  <th className="text-left text-xs font-semibold text-[#777777] uppercase tracking-wider px-6 py-3">Session</th>
                  <th className="text-left text-xs font-semibold text-[#777777] uppercase tracking-wider px-6 py-3">Statut</th>
                  <th className="text-left text-xs font-semibold text-[#777777] uppercase tracking-wider px-6 py-3">Paiement</th>
                  <th className="text-right text-xs font-semibold text-[#777777] uppercase tracking-wider px-6 py-3">Montant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F4F0EB]">
                {filtered?.map((inscription) => {
                  const sc = STATUT_CONFIG[inscription.statut] || STATUT_CONFIG.EN_ATTENTE
                  const pc = PAIEMENT_CONFIG[inscription.paiement_statut] || PAIEMENT_CONFIG.EN_ATTENTE
                  const Icon = sc.icon
                  return (
                    <tr key={inscription.id} className="hover:bg-[#FAF8F5]/50 transition-colors">
                      <td className="px-6 py-4">
                        <Link href={`/lead/${inscription.lead?.id}`} className="flex items-center gap-3 group">
                          <Avatar name={`${inscription.lead?.prenom} ${inscription.lead?.nom}`} size="sm" />
                          <div>
                            <p className="text-sm font-medium text-[#111111] group-hover:text-primary transition">
                              {inscription.lead?.prenom} {inscription.lead?.nom}
                            </p>
                            <p className="text-xs text-[#777777]">{inscription.lead?.email}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-[#111111] truncate max-w-[200px]">
                          {inscription.session?.formation?.nom}
                        </p>
                        <p className="text-xs text-[#777777]">{inscription.session?.formation?.categorie}</p>
                      </td>
                      <td className="px-6 py-4">
                        <Link href={`/session/${inscription.session?.id}`} className="text-sm text-primary hover:text-accent transition">
                          {inscription.session?.date_debut ? new Date(inscription.session.date_debut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '—'}
                          {inscription.session?.date_fin && inscription.session.date_fin !== inscription.session.date_debut
                            ? ` — ${new Date(inscription.session.date_fin).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`
                            : ''}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <Icon className="w-3.5 h-3.5" style={{ color: sc.color }} />
                          <Badge className="border-0" style={{ backgroundColor: `${sc.color}15`, color: sc.color }} size="sm">
                            {sc.label}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className="border-0" style={{ backgroundColor: `${pc.color}15`, color: pc.color }} size="sm">
                          {pc.label}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="text-sm font-semibold text-[#111111]">
                          {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(inscription.montant_total)}
                        </p>
                        {inscription.montant_finance > 0 && (
                          <p className="text-xs text-[#10B981]">
                            dont {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(inscription.montant_finance)} financé
                          </p>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
