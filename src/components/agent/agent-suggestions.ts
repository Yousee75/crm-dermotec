import {
  Target, DollarSign, Mail, Calendar, Zap, Phone,
  BarChart3, Bell, Search, CreditCard, BookOpen,
  TrendingUp, GraduationCap, Shield, User,
} from 'lucide-react'
import type { AgentMode } from '@/hooks/use-agent-chat'

// ============================================================
// CONTEXTUAL SUGGESTIONS — adapté à la page courante
// ============================================================

export interface SuggestionCard {
  icon: any
  title: string
  subtitle: string
  prompt: string
}

export function getSuggestions(pathname: string, mode: AgentMode, leadId?: string): SuggestionCard[] {
  if (leadId) {
    return mode === 'formation' ? [
      { icon: GraduationCap, title: 'Suivi stagiaire', subtitle: 'Présences, progression', prompt: 'Suivi de ce stagiaire' },
      { icon: BookOpen, title: 'Documents formation', subtitle: 'Pièces à fournir', prompt: 'Documents de formation' },
      { icon: Target, title: 'Évaluation', subtitle: 'Notes et certificat', prompt: 'Évaluation et certificat' },
      { icon: Calendar, title: 'Prochaine session', subtitle: 'Disponibilités', prompt: 'Prochaines sessions' },
    ] : [
      { icon: Target, title: 'Analyse prospect', subtitle: 'Score 360°, potentiel', prompt: 'Analyse ce lead' },
      { icon: DollarSign, title: 'Financement', subtitle: 'Meilleure option', prompt: 'Quel financement proposer ?' },
      { icon: Mail, title: 'Email de relance', subtitle: 'Rédaction assistée', prompt: 'Rédige un email de relance' },
      { icon: Calendar, title: 'Session dispo', subtitle: 'Places restantes', prompt: 'Prochaine session disponible ?' },
    ]
  }

  const p = pathname ?? ''

  if (p.startsWith('/leads') || p.startsWith('/contacts')) {
    return [
      { icon: Zap, title: 'Leads chauds', subtitle: 'À contacter en priorité', prompt: 'Qui sont mes leads chauds ?' },
      { icon: Phone, title: 'Non contactés', subtitle: 'Leads en attente', prompt: 'Quels leads n\'ont pas été contactés ?' },
      { icon: BarChart3, title: 'Résumé pipeline', subtitle: 'Vue d\'ensemble', prompt: 'Résumé de mon pipeline' },
      { icon: Bell, title: 'Relances du jour', subtitle: 'Rappels en retard', prompt: 'Leads à relancer aujourd\'hui' },
    ]
  }

  if (p.startsWith('/sessions') || p.startsWith('/session/')) {
    return [
      { icon: Calendar, title: 'Places disponibles', subtitle: 'Sessions ouvertes', prompt: 'Quelles sessions ont des places ?' },
      { icon: User, title: 'Stagiaires du mois', subtitle: 'Comptage mensuel', prompt: 'Combien de stagiaires ce mois ?' },
      { icon: BarChart3, title: 'Taux remplissage', subtitle: 'Statistiques sessions', prompt: 'Taux de remplissage des sessions' },
      { icon: GraduationCap, title: 'Prochaines sessions', subtitle: 'Planning à venir', prompt: 'Prochaines sessions' },
    ]
  }

  if (p.startsWith('/financement')) {
    return [
      { icon: CreditCard, title: 'Dossiers en attente', subtitle: 'Validation requise', prompt: 'Dossiers en attente de validation' },
      { icon: DollarSign, title: 'Simuler OPCO', subtitle: 'Calcul financement', prompt: 'Simuler un financement OPCO' },
      { icon: BookOpen, title: 'Documents manquants', subtitle: 'Pièces à fournir', prompt: 'Documents manquants financement' },
      { icon: TrendingUp, title: 'Stats financement', subtitle: 'Taux d\'acceptation', prompt: 'Statistiques de financement' },
    ]
  }

  if (mode === 'formation') {
    return [
      { icon: Calendar, title: 'Sessions semaine', subtitle: 'Planning en cours', prompt: 'Sessions de la semaine' },
      { icon: Shield, title: 'Docs Qualiopi', subtitle: 'Documents manquants', prompt: 'Documents manquants Qualiopi' },
      { icon: BarChart3, title: 'Taux remplissage', subtitle: 'Toutes sessions', prompt: 'Taux de remplissage' },
      { icon: GraduationCap, title: 'Heures formation', subtitle: 'Ce mois-ci', prompt: 'Heures formation ce mois' },
    ]
  }

  return [
    { icon: BarChart3, title: 'Mes stats pipeline', subtitle: 'KPIs et conversion', prompt: 'Mes stats du jour' },
    { icon: Zap, title: 'Actions prioritaires', subtitle: 'Que faire maintenant ?', prompt: 'Quelles sont mes actions prioritaires ?' },
    { icon: Search, title: 'Chercher un lead', subtitle: 'Recherche rapide', prompt: 'Leads à relancer cette semaine' },
    { icon: Calendar, title: 'Prochaines sessions', subtitle: 'Places disponibles', prompt: 'Prochaines sessions' },
  ]
}

export function getPlaceholder(pathname: string, leadId?: string): string {
  if (leadId) return 'Question sur ce prospect...'
  const p = pathname ?? ''
  if (p.startsWith('/leads') || p.startsWith('/contacts')) return 'Rechercher un lead, stats pipeline...'
  if (p.startsWith('/sessions') || p.startsWith('/session/')) return 'Sessions, stagiaires, planning...'
  if (p.startsWith('/financement')) return 'Financement, OPCO, dossiers...'
  return 'Posez votre question...'
}
