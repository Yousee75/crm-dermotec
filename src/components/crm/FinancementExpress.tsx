'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useLead } from '@/hooks/use-leads'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent } from '@/components/ui/Card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { Progress } from '@/components/ui/progress'
import { calculerFinancement, ORGANISMES_FINANCEMENT, identifierOrganisme } from '@/lib/financement/data'
import { formatEuro } from '@/lib/utils'
import { toast } from 'sonner'
import {
  CreditCard, CheckCircle, AlertCircle, TrendingUp,
  Building2, User, Euro, FileText, Calculator
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface FinancementExpressProps {
  leadId: string
  formationPrix?: number
  formationDureeHeures?: number
  onResult?: (result: any) => void
  compact?: boolean
}

interface FinancementResult {
  organisme: typeof ORGANISMES_FINANCEMENT[0]
  montantPrisEnCharge: number
  resteACharge: number
  details: string
  pourcentageCouvert: number
}

const detectProfilFinanceur = (lead: any): { organismeId: string; confidence: 'high' | 'medium' | 'low'; reason: string } => {
  if (!lead) return { organismeId: 'cpf', confidence: 'low', reason: 'Profil inconnu' }

  const statut = lead.statut_professionnel?.toLowerCase() || ''
  const hasEntreprise = lead.entreprise_nom && lead.siret
  const hasFormationPrincipale = lead.formation_principale_id

  // Détection automatique basée sur le profil
  if (statut.includes('salari') && hasEntreprise) {
    return {
      organismeId: 'opco-ep',
      confidence: 'high',
      reason: `Salarié(e) avec entreprise ${lead.entreprise_nom}`
    }
  }

  if (statut.includes('auto') || statut.includes('entrepreneur')) {
    return {
      organismeId: 'fafcea',
      confidence: 'high',
      reason: 'Auto-entrepreneur détecté'
    }
  }

  if (statut.includes('independant') || statut.includes('indépendant')) {
    return {
      organismeId: 'fafcea',
      confidence: 'high',
      reason: 'Travailleur indépendant'
    }
  }

  if (statut.includes('liberal') || statut.includes('libéral')) {
    return {
      organismeId: 'fifpl',
      confidence: 'high',
      reason: 'Profession libérale'
    }
  }

  if (statut.includes('demandeur') || statut.includes('chômage')) {
    return {
      organismeId: 'france-travail-aif',
      confidence: 'high',
      reason: 'Demandeur d\'emploi'
    }
  }

  if (statut.includes('etudiant')) {
    return {
      organismeId: 'cpf',
      confidence: 'medium',
      reason: 'Étudiant - CPF possible si droits acquis'
    }
  }

  // Fallback
  return {
    organismeId: 'cpf',
    confidence: 'medium',
    reason: 'CPF recommandé par défaut'
  }
}

const getOrganismeOptions = (lead: any) => {
  if (!lead) return []

  const statut = lead.statut_professionnel || ''
  const organismeIds = identifierOrganisme(lead.siret || '', statut)

  return ORGANISMES_FINANCEMENT.filter(org => organismeIds.includes(org.id))
}

export default function FinancementExpress({
  leadId,
  formationPrix = 1400,
  formationDureeHeures = 14,
  onResult,
  compact = false
}: FinancementExpressProps) {
  const { data: lead, isLoading } = useLead(leadId)
  const [selectedOrganisme, setSelectedOrganisme] = useState<string>('')
  const [result, setResult] = useState<FinancementResult | null>(null)

  // Auto-détection du profil au chargement
  useEffect(() => {
    if (lead && !selectedOrganisme) {
      const detection = detectProfilFinanceur(lead)
      setSelectedOrganisme(detection.organismeId)
    }
  }, [lead, selectedOrganisme])

  // Calcul automatique quand organisme sélectionné
  useEffect(() => {
    if (selectedOrganisme && formationPrix && formationDureeHeures) {
      const organisme = ORGANISMES_FINANCEMENT.find(o => o.id === selectedOrganisme)
      if (organisme) {
        const calcul = calculerFinancement(formationPrix, selectedOrganisme, formationDureeHeures)
        const pourcentageCouvert = Math.round((calcul.montantPrisEnCharge / formationPrix) * 100)

        const financementResult: FinancementResult = {
          organisme,
          montantPrisEnCharge: calcul.montantPrisEnCharge,
          resteACharge: calcul.resteACharge,
          details: calcul.details,
          pourcentageCouvert
        }

        setResult(financementResult)
        onResult?.(financementResult)
      }
    }
  }, [selectedOrganisme, formationPrix, formationDureeHeures, onResult])

  if (isLoading) {
    return (
      <div className="h-32 bg-slate-100 rounded-lg animate-pulse" />
    )
  }

  if (!lead) {
    return (
      <div className="p-4 text-center text-slate-500">
        Données du lead non disponibles
      </div>
    )
  }

  const organismeOptions = getOrganismeOptions(lead)
  const detection = detectProfilFinanceur(lead)

  if (compact && result) {
    return (
      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-transparent border border-[#10B981]/30 rounded-lg">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-[#10B981]" />
          <span className="font-medium text-sm text-slate-900">
            {result.organisme.sigle}
          </span>
          <span className="text-sm text-slate-600">
            → {result.pourcentageCouvert}% financé
          </span>
        </div>
        <div className="text-right">
          {result.resteACharge === 0 ? (
            <Badge className="bg-[#10B981] text-white">
              Formation gratuite !
            </Badge>
          ) : (
            <span className="text-sm font-medium text-slate-900">
              {formatEuro(result.resteACharge)} reste à charge
            </span>
          )}
        </div>
      </div>
    )
  }

  return (
    <Card className="w-full">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          <h3 className="font-medium text-slate-900">Simulation de financement</h3>
          {result && (
            <Badge variant="outline" className="text-xs">
              {formatEuro(formationPrix)}
            </Badge>
          )}
        </div>

        {/* Section 1: Profil détecté */}
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
            <User className="h-5 w-5 text-slate-500 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-slate-900">
                  Profil détecté : {lead.statut_pro || 'Non renseigné'}
                </span>
                <Badge
                  variant={detection.confidence === 'high' ? 'default' : 'secondary'}
                  className={cn(
                    'text-xs',
                    detection.confidence === 'high' && 'bg-[#D1FAE5] text-[#10B981]'
                  )}
                >
                  {detection.confidence === 'high' ? 'Confiance élevée' : 'À vérifier'}
                </Badge>
              </div>
              <p className="text-xs text-slate-600">{detection.reason}</p>
              {lead.entreprise_nom && (
                <p className="text-xs text-slate-500 mt-1">
                  <Building2 className="h-3 w-3 inline mr-1" />
                  {lead.entreprise_nom} {lead.siret && `(${lead.siret})`}
                </p>
              )}
            </div>
          </div>

          {/* Sélecteur d'organisme */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-900">
              Organisme de financement
            </label>
            <Select value={selectedOrganisme} onValueChange={setSelectedOrganisme}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sélectionner un organisme" />
              </SelectTrigger>
              <SelectContent>
                {organismeOptions.map(organisme => (
                  <SelectItem key={organisme.id} value={organisme.id}>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{organisme.sigle}</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-sm text-slate-600">
                        {organisme.nom}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Section 2: Résultat de simulation */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-3">
                <CreditCard className="h-5 w-5 text-primary" />
                <span className="font-medium text-slate-900">
                  {result.organisme.sigle} - Résultat
                </span>
              </div>

              {/* Montants */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center p-3 bg-[#ECFDF5] rounded-lg border border-[#10B981]/30">
                  <p className="text-2xl font-bold text-[#10B981]">
                    {formatEuro(result.montantPrisEnCharge)}
                  </p>
                  <p className="text-xs text-[#10B981] mt-1">Pris en charge</p>
                </div>
                <div className={cn(
                  'text-center p-3 rounded-lg border',
                  result.resteACharge === 0
                    ? 'bg-[#ECFDF5] border-[#10B981]/30'
                    : 'bg-[#FFE0EF] border-[#FF2D78]/30'
                )}>
                  <p className={cn(
                    'text-2xl font-bold',
                    result.resteACharge === 0 ? 'text-[#10B981]' : 'text-[#FF2D78]'
                  )}>
                    {result.resteACharge === 0 ? '0€' : formatEuro(result.resteACharge)}
                  </p>
                  <p className={cn(
                    'text-xs mt-1',
                    result.resteACharge === 0 ? 'text-[#10B981]' : 'text-[#FF2D78]'
                  )}>
                    {result.resteACharge === 0 ? 'Gratuit !' : 'Reste à charge'}
                  </p>
                </div>
              </div>

              {/* Barre de progression */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-700">Pourcentage financé</span>
                  <span className="font-medium text-slate-900">
                    {result.pourcentageCouvert}%
                  </span>
                </div>
                <div className="relative">
                  <Progress value={result.pourcentageCouvert} className="h-3" />
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${result.pourcentageCouvert}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className={cn(
                      'absolute top-0 left-0 h-3 rounded-full',
                      result.pourcentageCouvert === 100 ? 'bg-[#10B981]' :
                      result.pourcentageCouvert >= 70 ? 'bg-[#6B8CAE]' :
                      'bg-orange-500'
                    )}
                  />
                </div>
              </div>

              {/* Détails du calcul */}
              <div className="mt-3 p-2 bg-slate-50 rounded text-xs text-slate-600">
                <div className="flex items-center gap-1 mb-1">
                  <Calculator className="h-3 w-3" />
                  <span className="font-medium">Détail du calcul :</span>
                </div>
                <p>{result.details}</p>
              </div>

              {/* Message d'encouragement */}
              {result.resteACharge === 0 && (
                <div className="mt-3 p-3 bg-gradient-to-r from-green-100 to-green-50 border border-[#10B981]/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-[#10B981]" />
                    <span className="text-sm font-medium text-[#10B981]">
                      Formation 100% financée !
                    </span>
                  </div>
                  <p className="text-xs text-[#10B981] mt-1">
                    Cette formation ne vous coûtera rien grâce à vos droits {result.organisme.sigle}.
                  </p>
                </div>
              )}
            </div>

            {/* Section 3: Action */}
            <div className="border-t pt-4">
              <Button
                className="w-full bg-primary hover:bg-primary-dark text-white min-h-[44px]"
                onClick={() => {
                  toast.success('Dossier de financement en cours de création')
                  // Ici, on ouvrirait le formulaire de création du financement
                }}
              >
                <FileText className="h-4 w-4 mr-2" />
                Monter le dossier de financement
              </Button>
              <p className="text-xs text-center text-slate-500 mt-2">
                Délai de traitement : {result.organisme.delaiTraitement}
              </p>
            </div>
          </motion.div>
        )}

        {/* Message si aucun organisme disponible */}
        {organismeOptions.length === 0 && (
          <div className="p-3 bg-[#FFF3E8] border border-[#FF8C42]/30 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-[#FF8C42]" />
              <span className="text-sm font-medium text-[#FF8C42]">
                Profil à compléter
              </span>
            </div>
            <p className="text-xs text-[#FF8C42] mt-1">
              Veuillez renseigner le statut professionnel pour déterminer les financements possibles.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}