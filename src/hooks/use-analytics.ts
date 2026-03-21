'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase-client'

const supabase = createClient()

export interface AnalyticsData {
  // KPIs
  totalLeads: number
  leadsThisMonth: number
  leadsLastMonth: number
  leadsTrend: number // %
  convertis: number
  tauxConversion: number
  sessionsPlanned: number
  caThisMonth: number
  caLastMonth: number
  caTrend: number
  panierMoyen: number
  tauxRemplissage: number
  satisfactionMoyenne: number
  // Pipeline funnel
  pipeline: { statut: string; count: number; color: string; label: string }[]
  // Sources
  sources: { source: string; count: number }[]
  // Top formations
  topFormations: { nom: string; count: number; ca: number }[]
  // Financement
  financement: { organisme: string; count: number; montant: number }[]
  tauxFinancement: number
  // CA mensuel (12 derniers mois)
  caMensuel: { mois: string; ca: number }[]
}

export function useAnalytics() {
  return useQuery({
    queryKey: ['analytics-dashboard'],
    queryFn: async (): Promise<AnalyticsData> => {
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString()

      // Date 12 mois en arrière
      const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1).toISOString()

      // Paralléliser toutes les queries
      const [
        allLeadsRes,
        leadsThisMonthRes,
        leadsLastMonthRes,
        formesRes,
        sessionsRes,
        allFacturesRes,
        inscriptionsRes,
        financementsRes,
        sourcesRes,
        pipelineRes,
        satisfactionRes,
      ] = await Promise.all([
        // Total leads
        supabase.from('leads').select('id', { count: 'exact', head: true }),
        // Leads ce mois
        supabase.from('leads').select('id', { count: 'exact', head: true }).gte('created_at', startOfMonth),
        // Leads mois dernier
        supabase.from('leads').select('id', { count: 'exact', head: true }).gte('created_at', startOfLastMonth).lte('created_at', endOfLastMonth),
        // Convertis (FORME + ALUMNI)
        supabase.from('leads').select('id', { count: 'exact', head: true }).in('statut', ['FORME', 'ALUMNI']),
        // Sessions planifiées
        supabase.from('sessions').select('id, places_max, places_occupees, statut'),
        // Toutes les factures payées des 12 derniers mois (avec date pour répartition mensuelle)
        supabase.from('factures').select('montant_ttc, created_at').eq('statut', 'PAYEE').gte('created_at', twelveMonthsAgo),
        // Inscriptions avec formation
        supabase.from('inscriptions').select('id, formation:formations(nom, prix_ht)').eq('statut', 'COMPLETEE'),
        // Financements
        supabase.from('financements').select('organisme, statut, montant_accorde'),
        // Sources leads (group by source)
        supabase.from('leads').select('source'),
        // Pipeline (group by statut)
        supabase.from('leads').select('statut'),
        // Satisfaction
        supabase.from('inscriptions').select('note_satisfaction').not('note_satisfaction', 'is', null),
      ])

      // --- KPIs ---
      const totalLeads = allLeadsRes.count || 0
      const leadsThisMonth = leadsThisMonthRes.count || 0
      const leadsLastMonth = leadsLastMonthRes.count || 0
      const leadsTrend = leadsLastMonth > 0 ? Math.round(((leadsThisMonth - leadsLastMonth) / leadsLastMonth) * 100) : 0
      const convertis = formesRes.count || 0
      const tauxConversion = totalLeads > 0 ? Math.round((convertis / totalLeads) * 1000) / 10 : 0

      // Sessions
      const allSessions = sessionsRes.data || []
      const sessionsPlanned = allSessions.filter(s => ['PLANIFIEE', 'CONFIRMEE'].includes(s.statut)).length
      const sessionsWithCapacity = allSessions.filter(s => s.places_max > 0)
      const tauxRemplissage = sessionsWithCapacity.length > 0
        ? Math.round(sessionsWithCapacity.reduce((acc, s) => acc + (s.places_occupees / s.places_max), 0) / sessionsWithCapacity.length * 100)
        : 0

      // CA — répartition par mois à partir des factures
      const allFactures = (allFacturesRes.data || []) as { montant_ttc: number; created_at: string }[]
      const caByMonth: Record<string, number> = {}
      for (const f of allFactures) {
        const d = new Date(f.created_at)
        const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`
        caByMonth[key] = (caByMonth[key] || 0) + (f.montant_ttc || 0)
      }
      const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth()).padStart(2, '0')}`
      const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const lastMonthKey = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth()).padStart(2, '0')}`
      const caThisMonth = caByMonth[thisMonthKey] || 0
      const caLastMonth = caByMonth[lastMonthKey] || 0
      const caTrend = caLastMonth > 0 ? Math.round(((caThisMonth - caLastMonth) / caLastMonth) * 100) : 0

      // Panier moyen
      const completedInscriptions = inscriptionsRes.data || []
      const totalCA = completedInscriptions.reduce((acc, i) => acc + ((i.formation as any)?.prix_ht || 0), 0)
      const panierMoyen = completedInscriptions.length > 0 ? Math.round(totalCA / completedInscriptions.length) : 0

      // Satisfaction
      const satisfactionData = (satisfactionRes.data || []).map(s => s.note_satisfaction as number)
      const satisfactionMoyenne = satisfactionData.length > 0
        ? Math.round(satisfactionData.reduce((a, b) => a + b, 0) / satisfactionData.length * 10) / 10
        : 0

      // --- Pipeline funnel ---
      const STATUTS_MAP: Record<string, { label: string; color: string }> = {
        NOUVEAU: { label: 'Nouveau', color: '#3B82F6' },
        CONTACTE: { label: 'Contacté', color: '#8B5CF6' },
        QUALIFIE: { label: 'Qualifié', color: '#F59E0B' },
        FINANCEMENT_EN_COURS: { label: 'Financement', color: '#06B6D4' },
        INSCRIT: { label: 'Inscrit', color: '#10B981' },
        EN_FORMATION: { label: 'En formation', color: '#2EC6F3' },
        FORME: { label: 'Formé', color: '#22C55E' },
        ALUMNI: { label: 'Alumni', color: '#059669' },
        PERDU: { label: 'Perdu', color: '#EF4444' },
        REPORTE: { label: 'Reporté', color: '#9CA3AF' },
      }

      const pipelineCounts: Record<string, number> = {}
      for (const lead of (pipelineRes.data || [])) {
        pipelineCounts[lead.statut] = (pipelineCounts[lead.statut] || 0) + 1
      }
      const pipeline = Object.entries(STATUTS_MAP).map(([statut, meta]) => ({
        statut,
        count: pipelineCounts[statut] || 0,
        ...meta,
      })).filter(p => p.count > 0 || !['PERDU', 'REPORTE', 'SPAM'].includes(p.statut))

      // --- Sources ---
      const sourceCounts: Record<string, number> = {}
      for (const lead of (sourcesRes.data || [])) {
        const s = lead.source || 'autre'
        sourceCounts[s] = (sourceCounts[s] || 0) + 1
      }
      const sources = Object.entries(sourceCounts)
        .map(([source, count]) => ({ source, count }))
        .sort((a, b) => b.count - a.count)

      // --- Top formations ---
      const formationCounts: Record<string, { count: number; ca: number }> = {}
      for (const insc of completedInscriptions) {
        const nom = (insc.formation as any)?.nom || 'Inconnue'
        const prix = (insc.formation as any)?.prix_ht || 0
        if (!formationCounts[nom]) formationCounts[nom] = { count: 0, ca: 0 }
        formationCounts[nom].count++
        formationCounts[nom].ca += prix
      }
      const topFormations = Object.entries(formationCounts)
        .map(([nom, data]) => ({ nom, ...data }))
        .sort((a, b) => b.ca - a.ca)

      // --- Financement ---
      const finCounts: Record<string, { count: number; montant: number }> = {}
      const finData = financementsRes.data || []
      let finValides = 0
      for (const fin of finData) {
        if (!finCounts[fin.organisme]) finCounts[fin.organisme] = { count: 0, montant: 0 }
        finCounts[fin.organisme].count++
        finCounts[fin.organisme].montant += fin.montant_accorde || 0
        if (['VALIDE', 'VERSE', 'CLOTURE'].includes(fin.statut)) finValides++
      }
      const financement = Object.entries(finCounts)
        .map(([organisme, data]) => ({ organisme, ...data }))
        .sort((a, b) => b.count - a.count)
      const tauxFinancement = finData.length > 0 ? Math.round((finValides / finData.length) * 100) : 0

      // --- CA mensuel (12 derniers mois) — données réelles ---
      const caMensuel: { mois: string; ca: number }[] = []
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`
        const label = d.toLocaleDateString('fr-FR', { month: 'short' })
        caMensuel.push({ mois: label, ca: caByMonth[key] || 0 })
      }

      return {
        totalLeads,
        leadsThisMonth,
        leadsLastMonth,
        leadsTrend,
        convertis,
        tauxConversion,
        sessionsPlanned,
        caThisMonth,
        caLastMonth,
        caTrend,
        panierMoyen,
        tauxRemplissage,
        satisfactionMoyenne,
        pipeline,
        sources,
        topFormations,
        financement,
        tauxFinancement,
        caMensuel,
      }
    },
    staleTime: 60_000, // Cache 1 minute
  })
}
