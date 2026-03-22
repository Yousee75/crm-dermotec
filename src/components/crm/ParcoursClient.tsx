'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useLead } from '@/hooks/use-leads'
import { Badge } from '@/components/ui/badge'
import { Tooltip } from '@/components/ui/Tooltip'
import { formatDate, formatEuro } from '@/lib/utils'
import {
  User, Target, CreditCard, GraduationCap, BookOpen,
  Award, Users, CheckCircle, Circle, Clock, Star,
  Mail, Phone, Calendar, FileText, TrendingUp
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { StatutLead } from '@/types'

interface ParcoursClientProps {
  leadId: string
  compact?: boolean
}

interface EtapeParcours {
  id: string
  label: string
  icon: React.ElementType
  statut: 'complete' | 'active' | 'pending'
  date?: string
  details?: string
  subInfo?: string
  score?: number
}

const ETAPES_PARCOURS = [
  { id: 'prospect', label: 'Prospect', statuts: ['NOUVEAU', 'CONTACTE'] },
  { id: 'qualifie', label: 'Qualifié', statuts: ['QUALIFIE'] },
  { id: 'financement', label: 'Financement', statuts: ['FINANCEMENT_EN_COURS'] },
  { id: 'inscrit', label: 'Inscrit', statuts: ['INSCRIT'] },
  { id: 'en_formation', label: 'En formation', statuts: ['EN_FORMATION'] },
  { id: 'forme', label: 'Formé', statuts: ['FORME'] },
  { id: 'alumni', label: 'Alumni', statuts: ['ALUMNI'] },
] as const

const mapStatutToEtape = (statut: StatutLead): number => {
  for (let i = 0; i < ETAPES_PARCOURS.length; i++) {
    if (ETAPES_PARCOURS[i].statuts.includes(statut as any)) {
      return i
    }
  }
  // Statuts spéciaux
  if (['PERDU', 'SPAM'].includes(statut)) return -1
  if (['REPORTE'].includes(statut)) return 1 // Considéré comme qualifié en pause
  return 0
}

const analyzeParcoursData = (lead: any): EtapeParcours[] => {
  if (!lead) return []

  const etapeActive = mapStatutToEtape(lead.statut)
  const financements = lead.financements || []
  const inscriptions = lead.inscriptions || []
  const rappels = lead.rappels || []

  return ETAPES_PARCOURS.map((etape, index) => {
    const isComplete = index < etapeActive
    const isActive = index === etapeActive
    const isPending = index > etapeActive

    const statut: 'complete' | 'active' | 'pending' =
      isComplete ? 'complete' : isActive ? 'active' : 'pending'

    // Données spécifiques par étape
    let details = ''
    let subInfo = ''
    let date = ''
    let score = undefined

    switch (etape.id) {
      case 'prospect':
        details = `Score: ${lead.score_chaud || 0}/100`
        subInfo = `Source: ${lead.source || 'Inconnue'}`
        date = lead.created_at
        score = lead.score_chaud || 0
        break

      case 'qualifie':
        if (lead.formation_principale) {
          details = lead.formation_principale.nom
          subInfo = `Budget: ${formatEuro(lead.budget_formation || 0)}`
        } else {
          details = 'Formation à définir'
        }
        date = lead.date_qualification || lead.updated_at
        break

      case 'financement':
        const financementActif = financements.find((f: any) =>
          ['PREPARATION', 'DEPOSE', 'EN_COURS'].includes(f.statut)
        )
        if (financementActif) {
          details = `${financementActif.organisme} - ${financementActif.statut}`
          subInfo = `${formatEuro(financementActif.montant_demande || 0)}`
          date = financementActif.created_at
        } else {
          details = 'Dossier à monter'
        }
        break

      case 'inscrit':
        const inscription = inscriptions[0]
        if (inscription && inscription.session) {
          details = `Session: ${new Date(inscription.session.date_debut).toLocaleDateString('fr-FR')}`
          subInfo = inscription.session.formation?.nom || ''
          date = inscription.created_at
        } else {
          details = 'Session à affecter'
        }
        break

      case 'en_formation':
        const sessionEnCours = inscriptions.find((i: any) =>
          i.session && new Date(i.session.date_debut) <= new Date() &&
          new Date(i.session.date_fin) >= new Date()
        )
        if (sessionEnCours) {
          details = 'Formation en cours'
          subInfo = `${sessionEnCours.session.formation?.nom}`
          date = sessionEnCours.session.date_debut
        }
        break

      case 'forme':
        const sessionTerminee = inscriptions.find((i: any) =>
          i.session && new Date(i.session.date_fin) < new Date()
        )
        if (sessionTerminee) {
          details = 'Certificat délivré'
          subInfo = 'Satisfaction: ⭐⭐⭐⭐⭐'
          date = sessionTerminee.session.date_fin
        }
        break

      case 'alumni':
        const commandesCount = 0 // À implémenter avec les commandes e-shop
        const parrainagesCount = 0 // À implémenter avec le système de parrainage
        details = `${commandesCount} commande${commandesCount > 1 ? 's' : ''}`
        subInfo = `${parrainagesCount} parrainage${parrainagesCount > 1 ? 's' : ''}`
        break
    }

    return {
      id: etape.id,
      label: etape.label,
      icon: getIconForEtape(etape.id),
      statut,
      date: date ? formatDate(date) : undefined,
      details,
      subInfo,
      score
    }
  })
}

const getIconForEtape = (etapeId: string): React.ElementType => {
  const icons = {
    prospect: User,
    qualifie: Target,
    financement: CreditCard,
    inscrit: GraduationCap,
    en_formation: BookOpen,
    forme: Award,
    alumni: Users,
  }
  return icons[etapeId as keyof typeof icons] || Circle
}

const getStatutColor = (statut: 'complete' | 'active' | 'pending') => {
  switch (statut) {
    case 'complete':
      return {
        circle: 'bg-green-500 border-green-500',
        line: 'bg-green-500',
        text: 'text-green-700',
        bg: 'bg-green-50'
      }
    case 'active':
      return {
        circle: 'bg-[#2EC6F3] border-[#2EC6F3] animate-pulse',
        line: 'bg-slate-300',
        text: 'text-[#2EC6F3]',
        bg: 'bg-blue-50'
      }
    case 'pending':
      return {
        circle: 'bg-slate-200 border-slate-300',
        line: 'bg-slate-200',
        text: 'text-slate-500',
        bg: 'bg-slate-50'
      }
  }
}

export default function ParcoursClient({ leadId, compact = false }: ParcoursClientProps) {
  const { data: lead, isLoading } = useLead(leadId)

  const etapes = useMemo(() => analyzeParcoursData(lead), [lead])

  if (isLoading) {
    return (
      <div className="w-full h-16 bg-slate-100 rounded-lg animate-pulse" />
    )
  }

  if (!lead) {
    return (
      <div className="p-4 text-center text-slate-500">
        Données du lead non disponibles
      </div>
    )
  }

  // Vérifier si le lead est dans un statut d'échec
  if (['PERDU', 'SPAM'].includes(lead.statut)) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center gap-2">
          <Circle className="h-5 w-5 text-red-500" />
          <span className="font-medium text-red-800">
            Parcours interrompu - {lead.statut === 'PERDU' ? 'Lead perdu' : 'Lead marqué comme spam'}
          </span>
        </div>
        {lead.notes && (
          <p className="text-sm text-red-700 mt-1">Raison: {lead.notes}</p>
        )}
      </div>
    )
  }

  if (compact) {
    const etapeActive = etapes.find(e => e.statut === 'active')
    const progression = Math.round((etapes.filter(e => e.statut === 'complete').length / etapes.length) * 100)

    return (
      <div className="flex items-center gap-3 p-3 bg-white border rounded-lg">
        <div className="flex items-center gap-2 flex-1">
          <div className="flex -space-x-1">
            {etapes.slice(0, 5).map((etape, index) => {
              const colors = getStatutColor(etape.statut)
              const Icon = etape.icon

              return (
                <div
                  key={etape.id}
                  className={cn(
                    'w-6 h-6 rounded-full border-2 flex items-center justify-center',
                    colors.circle,
                    index > 0 && 'ml-2'
                  )}
                >
                  {etape.statut === 'complete' ? (
                    <CheckCircle className="h-3 w-3 text-white" />
                  ) : etape.statut === 'active' ? (
                    <Icon className="h-3 w-3 text-white" />
                  ) : (
                    <Circle className="h-3 w-3 text-slate-400" />
                  )}
                </div>
              )
            })}
          </div>
          <div className="ml-3 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-900">
                {etapeActive?.label || 'Statut inconnu'}
              </span>
              <Badge variant="outline" className="text-xs">
                {progression}%
              </Badge>
            </div>
            <p className="text-xs text-slate-500">
              {etapeActive?.details || 'En attente'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full bg-white border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="font-medium text-slate-900">Parcours client</h3>
          <Badge variant="outline" className="text-xs">
            {lead.statut.replace('_', ' ')}
          </Badge>
        </div>

        <div className="relative">
          {/* Ligne de progression */}
          <div className="absolute top-6 left-6 right-6 h-0.5 bg-slate-200">
            <motion.div
              initial={{ width: 0 }}
              animate={{
                width: `${(etapes.filter(e => e.statut === 'complete').length / (etapes.length - 1)) * 100}%`
              }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full bg-green-500"
            />
          </div>

          {/* Étapes */}
          <div className="grid grid-cols-7 gap-1">
            {etapes.map((etape, index) => {
              const colors = getStatutColor(etape.statut)
              const Icon = etape.icon

              return (
                <motion.div
                  key={etape.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex flex-col items-center"
                >
                  <Tooltip
                    content={
                      <div className="space-y-1">
                        <div className="font-medium">{etape.label}</div>
                        {etape.details && (
                          <div className="text-sm">{etape.details}</div>
                        )}
                        {etape.subInfo && (
                          <div className="text-xs text-slate-500">{etape.subInfo}</div>
                        )}
                        {etape.date && (
                          <div className="text-xs text-slate-500">
                            📅 {etape.date}
                          </div>
                        )}
                        {etape.score !== undefined && (
                          <div className="text-xs">
                            ⭐ Score: {etape.score}/100
                          </div>
                        )}
                      </div>
                    }
                  >
                    <div className={cn(
                      'w-12 h-12 rounded-full border-2 flex items-center justify-center mb-2 cursor-pointer hover:scale-105 transition-transform',
                      colors.circle
                    )}>
                      {etape.statut === 'complete' ? (
                        <CheckCircle className="h-5 w-5 text-white" />
                      ) : etape.statut === 'active' ? (
                        <Icon className="h-5 w-5 text-white" />
                      ) : (
                        <Icon className="h-5 w-5 text-slate-400" />
                      )}
                    </div>
                  </Tooltip>

                  <div className="text-center">
                    <p className={cn(
                      'text-xs font-medium mb-1',
                      colors.text
                    )}>
                      {etape.label}
                    </p>
                    {etape.details && (
                      <p className="text-[10px] text-slate-500 leading-tight max-w-[80px] mx-auto">
                        {etape.details.length > 20 ?
                          `${etape.details.substring(0, 20)}...` :
                          etape.details
                        }
                      </p>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Informations additionnelles */}
        <div className="mt-4 pt-3 border-t">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-slate-400" />
              <span className="text-slate-600">
                Créé le {formatDate(lead.created_at)}
              </span>
            </div>
            {lead.score_chaud && (
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 text-amber-400" />
                <span className="text-slate-600">
                  Score: {lead.score_chaud}/100
                </span>
              </div>
            )}
            {lead.formation_principale && (
              <div className="flex items-center gap-1">
                <GraduationCap className="h-3 w-3 text-blue-400" />
                <span className="text-slate-600">
                  {lead.formation_principale.nom}
                </span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-400" />
              <span className="text-slate-600">
                {Math.round((etapes.filter(e => e.statut === 'complete').length / etapes.length) * 100)}% accompli
              </span>
            </div>
          </div>
        </div>
      </div>
  )
}