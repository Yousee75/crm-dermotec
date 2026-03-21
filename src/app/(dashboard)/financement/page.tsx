'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase-client'
import { ORGANISMES_FINANCEMENT, type Financement } from '@/types'
import { CreditCard, Clock, CheckCircle, XCircle, AlertTriangle, FileText } from 'lucide-react'
import { formatEuro, formatDate } from '@/lib/utils'

const STATUT_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  PREPARATION: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Préparation' },
  DOCUMENTS_REQUIS: { bg: 'bg-yellow-50', text: 'text-yellow-700', label: 'Docs requis' },
  DOSSIER_COMPLET: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Complet' },
  SOUMIS: { bg: 'bg-purple-50', text: 'text-purple-700', label: 'Soumis' },
  EN_EXAMEN: { bg: 'bg-orange-50', text: 'text-orange-700', label: 'En examen' },
  COMPLEMENT_DEMANDE: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Complément' },
  VALIDE: { bg: 'bg-green-50', text: 'text-green-700', label: 'Validé' },
  REFUSE: { bg: 'bg-red-50', text: 'text-red-700', label: 'Refusé' },
  VERSE: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Versé' },
  CLOTURE: { bg: 'bg-gray-100', text: 'text-gray-500', label: 'Clôturé' },
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#082545]" style={{ fontFamily: 'var(--font-heading)' }}>
          Dossiers de financement
        </h1>
        <p className="text-sm text-gray-500">{dossiers?.length || 0} dossiers · {enCours} en cours · {valides} validés</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border p-4 flex items-center gap-3">
          <Clock className="w-8 h-8 text-orange-500" />
          <div>
            <p className="text-xs text-gray-500">En cours</p>
            <p className="text-xl font-bold text-orange-500">{enCours}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4 flex items-center gap-3">
          <CheckCircle className="w-8 h-8 text-green-500" />
          <div>
            <p className="text-xs text-gray-500">Validés</p>
            <p className="text-xl font-bold text-green-500">{valides}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4 flex items-center gap-3">
          <CreditCard className="w-8 h-8 text-blue-500" />
          <div>
            <p className="text-xs text-gray-500">Montant accordé</p>
            <p className="text-xl font-bold text-blue-500">{formatEuro(montantTotal)}</p>
          </div>
        </div>
      </div>

      {/* Liste dossiers */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-3 text-left font-medium text-gray-500">Lead</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Organisme</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">N° dossier</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Montant</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Statut</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Date</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">Chargement...</td></tr>
            ) : !dossiers?.length ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">Aucun dossier de financement</td></tr>
            ) : dossiers.map((d) => {
              const s = STATUT_COLORS[d.statut] || STATUT_COLORS.PREPARATION
              const org = ORGANISMES_FINANCEMENT[d.organisme]
              return (
                <tr key={d.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-medium">{d.lead?.prenom} {d.lead?.nom}</td>
                  <td className="px-4 py-3 text-gray-600">{org?.label || d.organisme}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{d.numero_dossier || '—'}</td>
                  <td className="px-4 py-3">
                    {d.montant_demande ? formatEuro(d.montant_demande) : '—'}
                    {d.montant_accorde && <span className="text-green-600 ml-1">(accordé: {formatEuro(d.montant_accorde)})</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>{s.label}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">{formatDate(d.created_at)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
