'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase-client'
import { ORGANISMES_FINANCEMENT, type Financement } from '@/types'
import { CreditCard, Clock, CheckCircle, FileText } from 'lucide-react'
import { formatEuro, formatDate } from '@/lib/utils'
import Link from 'next/link'
import { PageHeader } from '@/components/ui/PageHeader'
import { KpiCard } from '@/components/ui/KpiCard'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonTable } from '@/components/ui/Skeleton'

const STATUT_COLORS: Record<string, { label: string; variant: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info' }> = {
  PREPARATION: { label: 'Préparation', variant: 'default' },
  DOCUMENTS_REQUIS: { label: 'Docs requis', variant: 'warning' },
  DOSSIER_COMPLET: { label: 'Complet', variant: 'info' },
  SOUMIS: { label: 'Soumis', variant: 'primary' },
  EN_EXAMEN: { label: 'En examen', variant: 'warning' },
  COMPLEMENT_DEMANDE: { label: 'Complément', variant: 'warning' },
  VALIDE: { label: 'Validé', variant: 'success' },
  REFUSE: { label: 'Refusé', variant: 'error' },
  VERSE: { label: 'Versé', variant: 'success' },
  CLOTURE: { label: 'Clôturé', variant: 'default' },
}

export default function FinancementPage() {
  const supabase = createClient()

  const { data: dossiers, isLoading } = useQuery({
    queryKey: ['financements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('financements')
        .select('*, lead:leads(id, prenom, nom, email, telephone)')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as (Financement & { lead: { id: string; prenom: string; nom: string } })[]
    },
  })

  const enCours = dossiers?.filter(d => !['VALIDE', 'REFUSE', 'VERSE', 'CLOTURE'].includes(d.statut)).length || 0
  const valides = dossiers?.filter(d => d.statut === 'VALIDE' || d.statut === 'VERSE').length || 0
  const montantTotal = dossiers?.reduce((sum, d) => sum + (d.montant_accorde || 0), 0) || 0

  return (
    <div className="space-y-5">
      <PageHeader
        title="Dossiers de financement"
        description={`${dossiers?.length || 0} dossiers · ${enCours} en cours · ${valides} validés`}
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 stagger-children">
        <KpiCard icon={Clock} label="En cours" value={enCours} color="#F59E0B" />
        <KpiCard icon={CheckCircle} label="Validés" value={valides} color="#22C55E" />
        <KpiCard icon={CreditCard} label="Montant accordé" value={formatEuro(montantTotal)} color="#3B82F6" />
      </div>

      {/* Table */}
      {isLoading ? (
        <SkeletonTable rows={6} cols={6} />
      ) : (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Lead</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Organisme</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">N° dossier</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Montant</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {!dossiers?.length ? (
                  <tr>
                    <td colSpan={6}>
                      <EmptyState
                        icon={<FileText className="w-7 h-7" />}
                        title="Aucun dossier"
                        description="Les dossiers de financement apparaîtront ici"
                      />
                    </td>
                  </tr>
                ) : dossiers.map((d) => {
                  const s = STATUT_COLORS[d.statut] || STATUT_COLORS.PREPARATION
                  const org = ORGANISMES_FINANCEMENT[d.organisme]
                  return (
                    <tr key={d.id} className="group hover:bg-[#2EC6F3]/[0.02] transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/lead/${d.lead?.id}`} className="flex items-center gap-3">
                          <Avatar name={`${d.lead?.prenom} ${d.lead?.nom}`} size="sm" />
                          <span className="font-medium text-[#082545]">{d.lead?.prenom} {d.lead?.nom}</span>
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" size="md">{org?.label || d.organisme}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-gray-500">{d.numero_dossier || '—'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-700">{d.montant_demande ? formatEuro(d.montant_demande) : '—'}</p>
                          {d.montant_accorde && d.montant_accorde > 0 && (
                            <p className="text-xs text-green-600 font-medium">Accordé : {formatEuro(d.montant_accorde)}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={s.variant} size="md" dot>{s.label}</Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">{formatDate(d.created_at)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
