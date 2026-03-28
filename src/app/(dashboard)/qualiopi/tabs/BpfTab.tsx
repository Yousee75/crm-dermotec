'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { FileBarChart, Download, Calendar, Users, Euro, BookOpen, CheckCircle, AlertCircle } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/infra/supabase-client'
import { toast } from 'sonner'

const STATUT_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  en_cours: { label: 'En cours', color: 'bg-[#E0EBF5] text-[#6B8CAE] border-[#6B8CAE]/30', icon: Calendar },
  finalise: { label: 'Finalisé', color: 'bg-[#ECFDF5] text-[#10B981] border-[#10B981]/30', icon: CheckCircle },
  transmis: { label: 'Transmis', color: 'bg-[#FAFAFA] text-[#777777] border-[#F0F0F0]', icon: CheckCircle },
}

function formatEur(n: number) {
  return (n || 0).toLocaleString('fr-FR') + ' €'
}

export default function BpfTab() {
  const supabase = createClient()
  const annee = new Date().getFullYear()
  const [anneeSelectionnee, setAnneeSelectionnee] = useState(annee)

  // Fetch données BPF réelles depuis Supabase
  const { data, isLoading } = useQuery({
    queryKey: ['bpf', anneeSelectionnee],
    queryFn: async () => {
      const yearStart = `${anneeSelectionnee}-01-01`
      const yearEnd = `${anneeSelectionnee}-12-31`

      // Fetch en parallèle
      const [
        { data: sessions },
        { data: inscriptions },
        { data: formations },
        { data: factures },
      ] = await Promise.all([
        supabase.from('sessions').select('id, formation_id, nom, statut, date_debut, date_fin, nb_places, nb_inscrits')
          .gte('date_debut', yearStart).lte('date_debut', yearEnd),
        supabase.from('inscriptions').select('id, session_id, lead_id, statut, taux_presence, satisfaction, montant_total')
          .in('statut', ['CONFIRMEE', 'EN_COURS', 'COMPLETEE']),
        supabase.from('formations').select('id, nom, duree_heures, prix_ht, categorie').eq('is_active', true),
        supabase.from('factures_formation').select('montant_ttc, statut, lead_id, date_emission')
          .gte('date_emission', yearStart).lte('date_emission', yearEnd)
          .is('deleted_at', null).eq('statut', 'payee'),
      ])

      const sessionsList = sessions || []
      const inscriptionsList = inscriptions || []
      const formationsList = formations || []
      const facturesList = factures || []

      // Stats globales
      const nb_stagiaires = new Set(inscriptionsList.map(i => i.lead_id)).size
      const nb_heures_stagiaire = inscriptionsList.reduce((sum, i) => {
        const session = sessionsList.find(s => s.id === i.session_id)
        const formation = session ? formationsList.find(f => f.id === session.formation_id) : null
        return sum + (formation?.duree_heures || 0)
      }, 0)
      const nb_actions = sessionsList.length
      const ca_total = facturesList.reduce((sum, f) => sum + (f.montant_ttc || 0), 0)

      // Détail par formation
      const parFormation = formationsList.map(f => {
        const fSessions = sessionsList.filter(s => s.formation_id === f.id)
        const sessionIds = fSessions.map(s => s.id)
        const fInscriptions = inscriptionsList.filter(i => sessionIds.includes(i.session_id))
        const nbStagiaires = new Set(fInscriptions.map(i => i.lead_id)).size
        const satisfaction = fInscriptions.filter(i => i.satisfaction).length > 0
          ? Math.round(fInscriptions.filter(i => i.satisfaction).reduce((s, i) => s + (i.satisfaction || 0), 0) / fInscriptions.filter(i => i.satisfaction).length * 20)
          : 0

        return {
          id: f.id,
          intitule: f.nom,
          nb_actions: fSessions.length,
          nb_stagiaires: nbStagiaires,
          nb_heures: nbStagiaires * (f.duree_heures || 0),
          ca: fInscriptions.reduce((s, i) => s + (i.montant_total || 0), 0),
          taux_satisfaction: satisfaction,
        }
      }).filter(f => f.nb_actions > 0 || f.nb_stagiaires > 0)

      return {
        nb_stagiaires,
        nb_heures_stagiaire,
        nb_actions,
        ca_total,
        formations: parFormation,
      }
    },
    staleTime: 5 * 60_000,
  })

  if (isLoading) return <SkeletonTable rows={4} cols={6} />

  const bpf = data || { nb_stagiaires: 0, nb_heures_stagiaire: 0, nb_actions: 0, ca_total: 0, formations: [] }

  // Date limite BPF : 31 mai N+1
  const dateLimite = new Date(anneeSelectionnee + 1, 4, 31)
  const joursRestants = Math.ceil((dateLimite.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  const statut = joursRestants < 0 ? 'transmis' : 'en_cours'
  const statutConf = STATUT_CONFIG[statut]
  const StatutIcon = statutConf.icon

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-[#111111]">
            Bilan Pédagogique et Financier {anneeSelectionnee}
          </h2>
          <p className="text-sm text-[#777777]">Données calculées en temps réel depuis Supabase</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <StatutIcon className="w-4 h-4" />
            <Badge className={statutConf.color}>{statutConf.label}</Badge>
          </div>
          <select
            value={anneeSelectionnee}
            onChange={(e) => setAnneeSelectionnee(Number(e.target.value))}
            className="px-3 py-2 border border-[#F0F0F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {[annee, annee - 1, annee - 2].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Alerte date limite */}
      {joursRestants > 0 && joursRestants <= 90 && (
        <Card className={`p-4 ${joursRestants <= 30 ? 'border-[#FF2D78]/30 bg-[#FFE0EF]' : 'border-[#FF8C42]/30 bg-[#FFF3E8]'}`}>
          <div className="flex items-center gap-3">
            <AlertCircle className={`w-5 h-5 ${joursRestants <= 30 ? 'text-[#FF2D78]' : 'text-[#FF8C42]'} shrink-0`} />
            <p className={`text-sm font-medium ${joursRestants <= 30 ? 'text-[#FF2D78]' : 'text-[#FF8C42]'}`}>
              {joursRestants} jours restants pour transmettre le BPF {anneeSelectionnee} (date limite : {dateLimite.toLocaleDateString('fr-FR')})
            </p>
          </div>
        </Card>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#777777]">Stagiaires</p>
              <p className="text-2xl font-bold text-[#111111]">{bpf.nb_stagiaires}</p>
            </div>
            <Users className="w-8 h-8 text-[#6B8CAE]" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#777777]">Heures stagiaire</p>
              <p className="text-2xl font-bold text-[#111111]">{bpf.nb_heures_stagiaire.toLocaleString()}</p>
            </div>
            <Calendar className="w-8 h-8 text-[#10B981]" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#777777]">Actions de formation</p>
              <p className="text-2xl font-bold text-[#111111]">{bpf.nb_actions}</p>
            </div>
            <BookOpen className="w-8 h-8 text-[#FF2D78]" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#777777]">CA total</p>
              <p className="text-2xl font-bold text-[#111111]">{formatEur(bpf.ca_total)}</p>
            </div>
            <Euro className="w-8 h-8 text-[#FF5C00]" />
          </div>
        </Card>
      </div>

      {/* Détail par formation */}
      {bpf.formations.length > 0 ? (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-[#111111] mb-4">Détail par formation</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#FAFAFA]/50 border-b border-[#F0F0F0]">
                <tr>
                  <th className="text-left text-xs font-semibold text-[#777777] uppercase tracking-wider px-4 py-3">Formation</th>
                  <th className="text-right text-xs font-semibold text-[#777777] uppercase tracking-wider px-4 py-3">Sessions</th>
                  <th className="text-right text-xs font-semibold text-[#777777] uppercase tracking-wider px-4 py-3">Stagiaires</th>
                  <th className="text-right text-xs font-semibold text-[#777777] uppercase tracking-wider px-4 py-3">Heures</th>
                  <th className="text-right text-xs font-semibold text-[#777777] uppercase tracking-wider px-4 py-3">CA</th>
                  <th className="text-right text-xs font-semibold text-[#777777] uppercase tracking-wider px-4 py-3">Satisfaction</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F0F0]">
                {bpf.formations.map((f) => (
                  <tr key={f.id} className="hover:bg-[#FAFAFA]/50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-[#111111]">{f.intitule}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm text-[#777777]">{f.nb_actions}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm text-[#777777]">{f.nb_stagiaires}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm text-[#777777]">{f.nb_heures}h</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-medium text-[#111111]">{formatEur(f.ca)}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {f.taux_satisfaction > 0 ? (
                        <Badge
                          className={f.taux_satisfaction >= 90 ? 'bg-[#ECFDF5] text-[#10B981]' : f.taux_satisfaction >= 75 ? 'bg-[#FFF3E8] text-[#FF8C42]' : 'bg-[#FFE0EF] text-[#FF2D78]'}
                          size="sm"
                        >
                          {f.taux_satisfaction}%
                        </Badge>
                      ) : (
                        <span className="text-xs text-[#999999]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
                {/* Total */}
                <tr className="bg-[#FAFAFA] font-medium">
                  <td className="px-4 py-3 text-sm text-[#111111]">Total</td>
                  <td className="px-4 py-3 text-right text-sm">{bpf.nb_actions}</td>
                  <td className="px-4 py-3 text-right text-sm">{bpf.nb_stagiaires}</td>
                  <td className="px-4 py-3 text-right text-sm">{bpf.nb_heures_stagiaire}h</td>
                  <td className="px-4 py-3 text-right text-sm text-[#FF5C00] font-bold">{formatEur(bpf.ca_total)}</td>
                  <td className="px-4 py-3"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card className="p-8 text-center">
          <BookOpen className="w-8 h-8 text-[#999999] mx-auto mb-2" />
          <p className="text-[#777777]">Aucune donnée de formation pour {anneeSelectionnee}</p>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-center gap-4">
        <Button variant="outline" onClick={() => toast.info('Export PDF à venir')}>
          <Download className="w-4 h-4 mr-2" />
          Télécharger PDF
        </Button>
        <Button variant="outline" onClick={() => toast.info('Export Excel à venir')}>
          <FileBarChart className="w-4 h-4 mr-2" />
          Export Excel
        </Button>
      </div>
    </div>
  )
}
