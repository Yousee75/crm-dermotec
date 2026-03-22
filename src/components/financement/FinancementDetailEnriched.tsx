'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Edit3,
  Trash2,
  ChevronDown,
  ExternalLink,
  Phone,
  Mail,
  Calculator,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Plus,
  Minus,
  Save,
  Info,
  DollarSign,
  Percent,
  FileText,
  Clock,
  User,
  Tag,
  Calendar,
  Filter,
  PlusCircle,
  BarChart3
} from 'lucide-react'
import { useFinancement, useUpdateFinancement } from '@/hooks/use-financements'
import { ORGANISMES_FINANCEMENT, calculerFinancement } from '@/lib/financement-data'
import { formatEuro, formatDate, cn } from '@/lib/utils'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { TabsRoot as Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import Link from 'next/link'
import { toast } from 'sonner'

interface FinancementDetailEnrichedProps {
  financementId: string
  onClose: () => void
}

// Configuration des couleurs par statut
const STATUT_CONFIG = {
  PREPARATION: { label: 'Préparation', color: 'bg-gray-100 text-gray-800', badge: 'default' },
  DOCUMENTS_REQUIS: { label: 'Documents requis', color: 'bg-orange-100 text-orange-800', badge: 'warning' },
  DOSSIER_COMPLET: { label: 'Dossier complet', color: 'bg-blue-100 text-blue-800', badge: 'primary' },
  SOUMIS: { label: 'Soumis', color: 'bg-blue-100 text-blue-800', badge: 'primary' },
  EN_EXAMEN: { label: 'En examen', color: 'bg-purple-100 text-purple-800', badge: 'info' },
  COMPLEMENT_DEMANDE: { label: 'Complément demandé', color: 'bg-orange-100 text-orange-800', badge: 'warning' },
  VALIDE: { label: 'Validé', color: 'bg-green-100 text-green-800', badge: 'success' },
  REFUSE: { label: 'Refusé', color: 'bg-red-100 text-red-800', badge: 'error' },
  VERSE: { label: 'Versé', color: 'bg-green-100 text-green-800', badge: 'success' },
  CLOTURE: { label: 'Clôturé', color: 'bg-gray-100 text-gray-800', badge: 'default' }
} as const

// Configuration des types d'actions pour l'historique
const ACTION_CONFIG = {
  'Création': { color: 'bg-blue-100 text-blue-800' },
  'Modification': { color: 'bg-orange-100 text-orange-800' },
  'Changement statut': { color: 'bg-purple-100 text-purple-800' },
  'Document ajouté': { color: 'bg-green-100 text-green-800' },
  'Note ajoutée': { color: 'bg-gray-100 text-gray-800' },
  'Ligne financement ajoutée': { color: 'bg-cyan-100 text-cyan-800' }
} as const

// Interface pour les coûts
interface CoutsFormation {
  formatrice: number
  salle: number
  materiel: number
  consommables: number
  deplacement: number
  restauration: number
  administratif: number
  autres: number
  autresDetail: string
}

// Interface pour les lignes de multi-financement
interface LigneFinancement {
  id: string
  organisme: string
  montant: number
  statut: string
}

export default function FinancementDetailEnriched({
  financementId,
  onClose
}: FinancementDetailEnrichedProps) {
  const [activeTab, setActiveTab] = useState('general')
  const [isEditing, setIsEditing] = useState(false)
  const [notes, setNotes] = useState('')
  const [newNote, setNewNote] = useState('')
  const [historiqueFiltres, setHistoriqueFiltres] = useState<string[]>([])
  const [multiFinancementActive, setMultiFinancementActive] = useState(false)
  const [lignesFinancement, setLignesFinancement] = useState<LigneFinancement[]>([])
  const [exonerationTVA, setExonerationTVA] = useState(true)
  const [tauxTVA, setTauxTVA] = useState(20)
  const [qualiopiValide, setQualiopiValide] = useState(true)
  const [numerNDA, setNumerNDA] = useState('')

  // États pour les coûts
  const [couts, setCouts] = useState<CoutsFormation>({
    formatrice: 350,
    salle: 150,
    materiel: 0,
    consommables: 0,
    deplacement: 0,
    restauration: 0,
    administratif: 80,
    autres: 0,
    autresDetail: ''
  })

  const { data: financement, isLoading } = useFinancement(financementId)
  const updateFinancement = useUpdateFinancement()

  // Initialisation des données
  useEffect(() => {
    if (financement) {
      setNotes(financement.notes || '')
      // Initialiser les autres champs depuis les données existantes
      const metadata = financement.metadata as any || {}
      if (metadata.couts) setCouts(metadata.couts)
      if (metadata.multiFinancement) {
        setMultiFinancementActive(true)
        setLignesFinancement(metadata.lignesFinancement || [])
      }
      if (metadata.tva) {
        setExonerationTVA(metadata.tva.exoneration)
        setTauxTVA(metadata.tva.taux)
      }
      if (metadata.qualiopi !== undefined) setQualiopiValide(metadata.qualiopi)
      if (metadata.nda) setNumerNDA(metadata.nda)
    }
  }, [financement])

  // Calculs temps réel pour les coûts
  const calculsCouts = useMemo(() => {
    const coutTotal = Object.entries(couts)
      .filter(([key]) => key !== 'autresDetail')
      .reduce((sum, [_, value]) => sum + (Number(value) || 0), 0)

    const montantAccorde = financement?.montant_accorde || 0
    const margeNette = montantAccorde - coutTotal
    const tauxMarge = montantAccorde > 0 ? (margeNette / montantAccorde) * 100 : 0

    let niveauMarge = 'Déficit'
    if (tauxMarge > 30) niveauMarge = 'Excellent'
    else if (tauxMarge > 15) niveauMarge = 'Bon'
    else if (tauxMarge > 10) niveauMarge = 'Correct'
    else if (tauxMarge > 0) niveauMarge = 'Faible'

    const recommandation =
      tauxMarge < 0 ? 'Revoir le prix ou négocier avec l\'organisme' :
      tauxMarge < 15 ? 'Optimiser les coûts ou augmenter le prix' :
      tauxMarge < 30 ? 'Marge correcte, surveiller les dépassements' :
      'Excellent niveau de rentabilité'

    const seuilRentabilite = coutTotal > 0 ? Math.ceil(coutTotal / (montantAccorde / (financement?.inscription?.session?.formation?.places_max || 1))) : 0

    return {
      coutTotal,
      margeNette,
      tauxMarge,
      niveauMarge,
      recommandation,
      seuilRentabilite
    }
  }, [couts, financement])

  // Calculs pour le multi-financement
  const calculsMultiFinancement = useMemo(() => {
    if (!multiFinancementActive) return null

    const totalDemande = lignesFinancement.reduce((sum, ligne) => sum + ligne.montant, 0)
    const totalAccorde = lignesFinancement
      .filter(ligne => ['VALIDE', 'VERSE'].includes(ligne.statut))
      .reduce((sum, ligne) => sum + ligne.montant, 0)

    const montantFormation = financement?.inscription?.session?.formation?.prix_ht || 0
    const resteACharge = montantFormation - totalAccorde
    const tauxCouverture = montantFormation > 0 ? (totalAccorde / montantFormation) * 100 : 0

    return {
      totalDemande,
      totalAccorde,
      resteACharge,
      tauxCouverture,
      montantFormation
    }
  }, [lignesFinancement, multiFinancementActive, financement])

  // Calculs TVA
  const calculsTVA = useMemo(() => {
    const montantHT = financement?.montant_accorde || 0
    if (exonerationTVA) {
      return {
        montantHT,
        montantTVA: 0,
        montantTTC: montantHT
      }
    } else {
      const montantTVA = (montantHT * tauxTVA) / 100
      return {
        montantHT,
        montantTVA,
        montantTTC: montantHT + montantTVA
      }
    }
  }, [financement?.montant_accorde, exonerationTVA, tauxTVA])

  const handleSauvegarderCouts = async () => {
    try {
      await updateFinancement.mutateAsync({
        id: financementId,
        metadata: {
          ...((financement?.metadata as any) || {}),
          couts,
          multiFinancement: multiFinancementActive,
          lignesFinancement,
          tva: { exoneration: exonerationTVA, taux: tauxTVA },
          qualiopi: qualiopiValide,
          nda: numerNDA
        },
        historique_entry: {
          action: 'Modification',
          detail: 'Mise à jour des coûts et paramètres'
        }
      })
      toast.success('Coûts sauvegardés avec succès')
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde')
    }
  }

  const handleAjouterLigneFinancement = () => {
    const nouvelleLigne: LigneFinancement = {
      id: Date.now().toString(),
      organisme: 'OPCO_EP',
      montant: 0,
      statut: 'PREPARATION'
    }
    setLignesFinancement([...lignesFinancement, nouvelleLigne])
  }

  const handleSupprimerLigneFinancement = (id: string) => {
    setLignesFinancement(lignesFinancement.filter(ligne => ligne.id !== id))
  }

  const handleAjouterNote = async () => {
    if (!newNote.trim()) return

    try {
      const nouvelHistorique = [
        ...(financement?.historique || []),
        {
          date: new Date().toISOString(),
          action: 'Note ajoutée',
          detail: newNote,
          user: 'Utilisateur actuel' // À remplacer par l'utilisateur connecté
        }
      ]

      await updateFinancement.mutateAsync({
        id: financementId,
        historique: nouvelHistorique
      })

      setNewNote('')
      toast.success('Note ajoutée avec succès')
    } catch (error) {
      toast.error('Erreur lors de l\'ajout de la note')
    }
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!financement) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <Card className="p-6 text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
          <h2 className="text-lg font-semibold text-red-800 mb-2">Financement introuvable</h2>
          <Button onClick={onClose}>Fermer</Button>
        </Card>
      </div>
    )
  }

  const organisme = ORGANISMES_FINANCEMENT.find(org => org.id === financement.organisme.toLowerCase().replace('_', '-'))
  const statutConfig = STATUT_CONFIG[financement.statut]

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: "spring", duration: 0.3 }}
          className="w-full max-w-6xl max-h-[95vh] bg-white rounded-xl shadow-2xl overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-[#082545] text-white p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <h2 className="text-2xl font-bold">Dossier de financement</h2>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-blue-100">
                      {financement.lead?.prenom} {financement.lead?.nom}
                    </span>
                    <span className="text-blue-200">•</span>
                    <span className="text-blue-100">{organisme?.sigle || financement.organisme}</span>
                    {financement.numero_dossier && (
                      <>
                        <span className="text-blue-200">•</span>
                        <span className="text-blue-100 font-mono text-sm">{financement.numero_dossier}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge
                  variant={statutConfig.badge as any}
                  className="bg-white/20 text-white border-white/30"
                >
                  {statutConfig.label}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-white hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-100">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full justify-start p-0 bg-transparent border-0 rounded-none">
                <TabsTrigger
                  value="general"
                  className="px-6 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                >
                  Général
                </TabsTrigger>
                <TabsTrigger
                  value="couts"
                  className="px-6 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                >
                  Coûts & Marge
                </TabsTrigger>
                <TabsTrigger
                  value="tva"
                  className="px-6 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                >
                  TVA
                </TabsTrigger>
                <TabsTrigger
                  value="multi-financement"
                  className="px-6 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                >
                  Multi-Financement
                </TabsTrigger>
                <TabsTrigger
                  value="historique"
                  className="px-6 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                >
                  Historique
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(95vh-200px)] p-6">
            <Tabs value={activeTab}>
              {/* Onglet Général */}
              <TabsContent value="general" className="mt-0">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Informations lead */}
                    <Card className="p-6">
                      <h3 className="text-lg font-semibold text-accent mb-4">Lead associé</h3>
                      <div className="flex items-center gap-4 mb-4">
                        <Avatar
                          name={`${financement.lead?.prenom} ${financement.lead?.nom}`}
                          size="lg"
                        />
                        <div>
                          <Link
                            href={`/lead/${financement.lead?.id}`}
                            className="font-semibold text-accent hover:text-primary transition-colors flex items-center gap-2"
                          >
                            {financement.lead?.prenom} {financement.lead?.nom}
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                            {financement.lead?.email && (
                              <div className="flex items-center gap-1">
                                <Mail className="w-4 h-4" />
                                <span>{financement.lead.email}</span>
                              </div>
                            )}
                            {financement.lead?.telephone && (
                              <div className="flex items-center gap-1">
                                <Phone className="w-4 h-4" />
                                <span>{financement.lead.telephone}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>

                    {/* Montants */}
                    <Card className="p-6">
                      <h3 className="text-lg font-semibold text-accent mb-4">Montants</h3>
                      <div className="space-y-4">
                        {financement.montant_demande && (
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-gray-600">Demandé</span>
                              <span className="font-semibold text-lg">{formatEuro(financement.montant_demande)}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div className="bg-primary h-2 rounded-full" style={{ width: '100%' }} />
                            </div>
                          </div>
                        )}
                        {financement.montant_accorde && (
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-gray-600">Accordé</span>
                              <span className="font-semibold text-lg text-green-600">{formatEuro(financement.montant_accorde)}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{
                                  width: `${financement.montant_demande ? (financement.montant_accorde / financement.montant_demande * 100) : 0}%`
                                }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className="bg-green-500 h-2 rounded-full"
                              />
                            </div>
                          </div>
                        )}
                        {financement.montant_verse > 0 && (
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-gray-600">Versé</span>
                              <span className="font-semibold text-lg text-[#22C55E]">{formatEuro(financement.montant_verse)}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{
                                  width: `${financement.montant_accorde ? (financement.montant_verse / financement.montant_accorde * 100) : 0}%`
                                }}
                                transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                                className="bg-[#22C55E] h-2 rounded-full"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>

                    {/* Dates clés */}
                    <Card className="p-6">
                      <h3 className="text-lg font-semibold text-accent mb-4">Dates clés</h3>
                      <div className="space-y-3">
                        {financement.date_soumission && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Soumission</span>
                            <span>{formatDate(financement.date_soumission)}</span>
                          </div>
                        )}
                        {financement.date_reponse && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Réponse</span>
                            <span>{formatDate(financement.date_reponse)}</span>
                          </div>
                        )}
                        {financement.date_versement && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Versement</span>
                            <span>{formatDate(financement.date_versement)}</span>
                          </div>
                        )}
                        {financement.date_limite && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Limite</span>
                            <span className={cn(
                              new Date(financement.date_limite) < new Date() && 'text-red-600 font-medium'
                            )}>
                              {formatDate(financement.date_limite)}
                            </span>
                          </div>
                        )}
                      </div>
                    </Card>

                    {/* Documents checklist */}
                    <Card className="p-6">
                      <h3 className="text-lg font-semibold text-accent mb-4">Documents requis</h3>
                      <div className="space-y-3">
                        {organisme?.documentsRequis.map((doc, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                          >
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                            <span className="text-sm flex-1">{doc}</span>
                          </motion.div>
                        ))}
                      </div>
                    </Card>
                  </div>

                  {/* Notes éditables */}
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold text-accent mb-4">Notes</h3>
                    {isEditing ? (
                      <div className="space-y-4">
                        <textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          className="w-full min-h-[120px] p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                          placeholder="Ajouter des notes..."
                        />
                        <div className="flex gap-3">
                          <Button
                            onClick={async () => {
                              try {
                                await updateFinancement.mutateAsync({
                                  id: financementId,
                                  notes,
                                  historique_entry: {
                                    action: 'Modification',
                                    detail: 'Notes mises à jour'
                                  }
                                })
                                setIsEditing(false)
                                toast.success('Notes sauvegardées')
                              } catch (error) {
                                toast.error('Erreur lors de la sauvegarde')
                              }
                            }}
                            size="sm"
                          >
                            <Save className="w-4 h-4 mr-2" />
                            Sauvegarder
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setNotes(financement.notes || '')
                              setIsEditing(false)
                            }}
                            size="sm"
                          >
                            Annuler
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-gray-700 whitespace-pre-wrap">
                          {notes || 'Aucune note disponible.'}
                        </p>
                        <Button
                          variant="outline"
                          onClick={() => setIsEditing(true)}
                          size="sm"
                        >
                          <Edit3 className="w-4 h-4 mr-2" />
                          Modifier
                        </Button>
                      </div>
                    )}
                  </Card>

                  {/* Actions */}
                  <Card className="p-6">
                    <div className="flex items-center gap-4">
                      <Button>
                        <Edit3 className="w-4 h-4 mr-2" />
                        Modifier
                      </Button>
                      <Button variant="outline">
                        Changer statut
                        <ChevronDown className="w-4 h-4 ml-2" />
                      </Button>
                      <Button variant="outline" className="text-red-600 hover:text-red-700">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Supprimer
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              </TabsContent>

              {/* Onglet Coûts & Marge */}
              <TabsContent value="couts" className="mt-0">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Formulaire des coûts */}
                    <Card className="p-6">
                      <h3 className="text-lg font-semibold text-accent mb-4">Postes de coûts</h3>
                      <div className="space-y-4">
                        {/* Coût formatrice */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Coût formatrice
                          </label>
                          <div className="flex items-center gap-3">
                            <input
                              type="number"
                              value={couts.formatrice}
                              onChange={(e) => setCouts({ ...couts, formatrice: Number(e.target.value) })}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                              min="0"
                              step="50"
                            />
                            <span className="text-gray-500">€</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Référence marché : 350€/jour</p>
                        </div>

                        {/* Coût salle */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Coût salle
                          </label>
                          <div className="flex items-center gap-3">
                            <input
                              type="number"
                              value={couts.salle}
                              onChange={(e) => setCouts({ ...couts, salle: Number(e.target.value) })}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                              min="0"
                              step="50"
                            />
                            <span className="text-gray-500">€</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Référence : 150€/jour</p>
                        </div>

                        {/* Coût matériel */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Coût matériel
                          </label>
                          <div className="flex items-center gap-3">
                            <input
                              type="number"
                              value={couts.materiel}
                              onChange={(e) => setCouts({ ...couts, materiel: Number(e.target.value) })}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                              min="0"
                              step="10"
                            />
                            <span className="text-gray-500">€</span>
                          </div>
                        </div>

                        {/* Coût consommables */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Coût consommables
                          </label>
                          <div className="flex items-center gap-3">
                            <input
                              type="number"
                              value={couts.consommables}
                              onChange={(e) => setCouts({ ...couts, consommables: Number(e.target.value) })}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                              min="0"
                              step="10"
                            />
                            <span className="text-gray-500">€</span>
                          </div>
                        </div>

                        {/* Coût déplacement */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Coût déplacement
                          </label>
                          <div className="flex items-center gap-3">
                            <input
                              type="number"
                              value={couts.deplacement}
                              onChange={(e) => setCouts({ ...couts, deplacement: Number(e.target.value) })}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                              min="0"
                              step="10"
                            />
                            <span className="text-gray-500">€</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Calcul auto : km × 0,32€</p>
                        </div>

                        {/* Coût restauration */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Coût restauration
                          </label>
                          <div className="flex items-center gap-3">
                            <input
                              type="number"
                              value={couts.restauration}
                              onChange={(e) => setCouts({ ...couts, restauration: Number(e.target.value) })}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                              min="0"
                              step="10"
                            />
                            <span className="text-gray-500">€</span>
                          </div>
                        </div>

                        {/* Coût administratif */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Coût administratif
                          </label>
                          <div className="flex items-center gap-3">
                            <input
                              type="number"
                              value={couts.administratif}
                              onChange={(e) => setCouts({ ...couts, administratif: Number(e.target.value) })}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                              min="0"
                              step="10"
                            />
                            <span className="text-gray-500">€</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Référence : 80€/dossier</p>
                        </div>

                        {/* Coût autres */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Coût autres
                          </label>
                          <div className="flex items-center gap-3">
                            <input
                              type="number"
                              value={couts.autres}
                              onChange={(e) => setCouts({ ...couts, autres: Number(e.target.value) })}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                              min="0"
                              step="10"
                            />
                            <span className="text-gray-500">€</span>
                          </div>
                          <textarea
                            value={couts.autresDetail}
                            onChange={(e) => setCouts({ ...couts, autresDetail: e.target.value })}
                            className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                            placeholder="Détail des autres coûts..."
                            rows={2}
                          />
                        </div>

                        <Button onClick={handleSauvegarderCouts} className="w-full">
                          <Save className="w-4 h-4 mr-2" />
                          Sauvegarder les coûts
                        </Button>
                      </div>
                    </Card>

                    {/* Calculs temps réel */}
                    <div className="space-y-6">
                      <Card className="p-6">
                        <h3 className="text-lg font-semibold text-accent mb-4">Calculs temps réel</h3>
                        <div className="space-y-4">
                          <motion.div
                            key={calculsCouts.coutTotal}
                            initial={{ scale: 1.05 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", duration: 0.3 }}
                            className="text-center p-4 bg-gray-50 rounded-lg"
                          >
                            <p className="text-sm text-gray-600 mb-1">COÛT TOTAL</p>
                            <p className="text-3xl font-bold text-accent">{formatEuro(calculsCouts.coutTotal)}</p>
                          </motion.div>

                          <motion.div
                            key={calculsCouts.margeNette}
                            initial={{ scale: 1.05 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", duration: 0.3, delay: 0.1 }}
                            className={cn(
                              "text-center p-4 rounded-lg",
                              calculsCouts.margeNette >= 0 ? "bg-green-50" : "bg-red-50"
                            )}
                          >
                            <p className="text-sm text-gray-600 mb-1">MARGE NETTE</p>
                            <p className={cn(
                              "text-3xl font-bold",
                              calculsCouts.margeNette >= 0 ? "text-green-600" : "text-red-600"
                            )}>
                              {calculsCouts.margeNette >= 0 ? '+' : ''}{formatEuro(calculsCouts.margeNette)}
                            </p>
                          </motion.div>

                          <motion.div
                            key={calculsCouts.tauxMarge}
                            initial={{ scale: 1.05 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", duration: 0.3, delay: 0.2 }}
                            className="p-4 bg-blue-50 rounded-lg"
                          >
                            <p className="text-sm text-gray-600 mb-2">TAUX DE MARGE</p>
                            <div className="flex items-center gap-3 mb-2">
                              <div className="flex-1 bg-gray-200 rounded-full h-3">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${Math.min(Math.max(calculsCouts.tauxMarge + 20, 0), 100)}%` }}
                                  transition={{ duration: 0.8, ease: "easeOut" }}
                                  className={cn(
                                    "h-3 rounded-full",
                                    calculsCouts.tauxMarge < 0 ? "bg-red-500" :
                                    calculsCouts.tauxMarge < 15 ? "bg-orange-500" :
                                    calculsCouts.tauxMarge < 30 ? "bg-yellow-500" :
                                    "bg-green-500"
                                  )}
                                />
                              </div>
                              <span className="font-semibold">{calculsCouts.tauxMarge.toFixed(1)}%</span>
                            </div>
                            <Badge
                              variant="outline"
                              className={cn(
                                calculsCouts.tauxMarge < 0 ? "border-red-200 text-red-800 bg-red-50" :
                                calculsCouts.tauxMarge < 15 ? "border-orange-200 text-orange-800 bg-orange-50" :
                                calculsCouts.tauxMarge < 30 ? "border-yellow-200 text-yellow-800 bg-yellow-50" :
                                "border-green-200 text-green-800 bg-green-50"
                              )}
                            >
                              {calculsCouts.niveauMarge}
                            </Badge>
                          </motion.div>

                          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex items-start gap-2">
                              <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                              <div>
                                <p className="font-medium text-blue-900">Recommandation</p>
                                <p className="text-sm text-blue-700 mt-1">{calculsCouts.recommandation}</p>
                              </div>
                            </div>
                          </div>

                          {calculsCouts.seuilRentabilite > 0 && (
                            <div className="p-4 bg-gray-50 rounded-lg">
                              <p className="text-sm text-gray-600">Seuil de rentabilité</p>
                              <p className="font-semibold text-accent">
                                {calculsCouts.seuilRentabilite} stagiaire{calculsCouts.seuilRentabilite > 1 ? 's' : ''} minimum
                              </p>
                            </div>
                          )}
                        </div>
                      </Card>

                      {/* Graphique donut simple */}
                      <Card className="p-6">
                        <h3 className="text-lg font-semibold text-accent mb-4">Répartition des coûts</h3>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          {Object.entries(couts)
                            .filter(([key, value]) => key !== 'autresDetail' && value > 0)
                            .map(([key, value]) => (
                              <div key={key} className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-primary rounded-full" />
                                <span className="capitalize">{key}</span>
                                <span className="ml-auto font-medium">{formatEuro(value)}</span>
                              </div>
                            ))}
                        </div>
                      </Card>
                    </div>
                  </div>
                </motion.div>
              </TabsContent>

              {/* Onglet TVA & Réglementation */}
              <TabsContent value="tva" className="mt-0">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {/* Exonération TVA */}
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold text-accent mb-4">Régime TVA</h3>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={exonerationTVA}
                          onChange={(e) => setExonerationTVA(e.target.checked)}
                          className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary"
                        />
                        <label className="font-medium">Exonération TVA (Article 261-4-4° CGI)</label>
                      </div>

                      {exonerationTVA ? (
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-start gap-2">
                            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                            <div className="text-sm text-blue-800">
                              <p className="font-medium mb-2">L'organisme ne collecte pas la TVA mais ne peut pas la récupérer sur ses achats.</p>
                              <p>Redevable de la taxe sur les salaires.</p>
                            </div>
                          </div>
                          <div className="mt-4 p-3 bg-white rounded border">
                            <p className="text-sm font-medium text-gray-700">Montant</p>
                            <p className="text-xl font-bold text-accent">{formatEuro(calculsTVA.montantHT)} HT = TTC</p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Taux TVA</label>
                            <select
                              value={tauxTVA}
                              onChange={(e) => setTauxTVA(Number(e.target.value))}
                              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            >
                              <option value={20}>20% (normal)</option>
                              <option value={5.5}>5,5% (réduit)</option>
                            </select>
                          </div>

                          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-start gap-2">
                              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                              <p className="text-sm text-green-800">L'OF peut récupérer la TVA sur ses achats</p>
                            </div>
                            <div className="mt-4 space-y-2">
                              <div className="flex justify-between">
                                <span>Montant HT</span>
                                <span className="font-medium">{formatEuro(calculsTVA.montantHT)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>TVA ({tauxTVA}%)</span>
                                <span className="font-medium">{formatEuro(calculsTVA.montantTVA)}</span>
                              </div>
                              <div className="flex justify-between border-t pt-2">
                                <span className="font-bold">Total TTC</span>
                                <span className="font-bold text-lg">{formatEuro(calculsTVA.montantTTC)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>

                  {/* Section Qualiopi */}
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold text-accent mb-4">Certification Qualiopi</h3>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={qualiopiValide}
                          onChange={(e) => setQualiopiValide(e.target.checked)}
                          className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary"
                        />
                        <label className="font-medium">Certification Qualiopi valide</label>
                      </div>

                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start gap-2">
                          <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                          <p className="text-sm text-blue-800">
                            <strong>Obligatoire depuis 2022</strong> pour tout financement public
                          </p>
                        </div>
                      </div>

                      {!qualiopiValide && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                            <div className="text-sm text-red-800">
                              <p className="font-medium">SANS QUALIOPI</p>
                              <p>Aucun financement OPCO/FAFCEA/CPF possible</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>

                  {/* Section NDA */}
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold text-accent mb-4">Numéro Déclaration Activité (NDA)</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Numéro NDA</label>
                        <input
                          type="text"
                          value={numerNDA}
                          onChange={(e) => setNumerNDA(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                          placeholder="11 75 12345 75"
                        />
                      </div>
                      <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
                          <p className="text-sm text-orange-800">
                            <strong>Important :</strong> Nourrir le BPF avant le 31 mai chaque année sous peine de perdre le NDA
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Section Convention */}
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold text-accent mb-4">Convention de formation</h3>
                    <div className="space-y-3">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm font-medium text-gray-700">Mentions obligatoires</p>
                        <ul className="text-sm text-gray-600 mt-2 space-y-1">
                          <li>• Objectifs pédagogiques</li>
                          <li>• Durée et modalités</li>
                          <li>• Prix et modalités de paiement</li>
                          <li>• Conditions d'annulation</li>
                        </ul>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-800">
                          <strong>Délai de rétractation :</strong> 10 jours pour les particuliers
                        </p>
                      </div>
                    </div>
                  </Card>

                  {/* Alertes réglementaires */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-accent">Alertes réglementaires</h3>

                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
                    >
                      <div className="flex items-start gap-2">
                        <Calendar className="w-5 h-5 text-yellow-600 mt-0.5" />
                        <div className="text-sm text-yellow-800">
                          <p className="font-medium">BPF à déclarer avant le 31 mai</p>
                          <p>Bilan pédagogique et financier obligatoire</p>
                        </div>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                      className="p-4 bg-orange-50 border border-orange-200 rounded-lg"
                    >
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
                        <div className="text-sm text-orange-800">
                          <p className="font-medium">Mise à jour Hygiène obligatoire avant sept 2025</p>
                          <p>Formation continue pour le maintien de l'agrément</p>
                        </div>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                      className="p-4 bg-red-50 border border-red-200 rounded-lg"
                    >
                      <div className="flex items-start gap-2">
                        <DollarSign className="w-5 h-5 text-red-600 mt-0.5" />
                        <div className="text-sm text-red-800">
                          <p className="font-medium">Reste à charge CPF : 100€ depuis 2025</p>
                          <p>Exonération possible avec abondement employeur (même 1€)</p>
                        </div>
                      </div>
                    </motion.div>
                  </div>

                  <Button onClick={handleSauvegarderCouts} className="w-full">
                    <Save className="w-4 h-4 mr-2" />
                    Sauvegarder les paramètres TVA
                  </Button>
                </motion.div>
              </TabsContent>

              {/* Onglet Multi-Financement */}
              <TabsContent value="multi-financement" className="mt-0">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-accent">Multi-financement</h3>
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={multiFinancementActive}
                          onChange={(e) => setMultiFinancementActive(e.target.checked)}
                          className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary"
                        />
                        <label className="font-medium">Activer le multi-financement</label>
                      </div>
                    </div>

                    <AnimatePresence>
                      {multiFinancementActive && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="space-y-4"
                        >
                          <div className="space-y-3">
                            {lignesFinancement.map((ligne, index) => (
                              <motion.div
                                key={ligne.id}
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg"
                              >
                                <select
                                  value={ligne.organisme}
                                  onChange={(e) => {
                                    const nouvelles = [...lignesFinancement]
                                    nouvelles[index].organisme = e.target.value
                                    setLignesFinancement(nouvelles)
                                  }}
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                >
                                  {ORGANISMES_FINANCEMENT.map(org => (
                                    <option key={org.id} value={org.id}>{org.sigle}</option>
                                  ))}
                                </select>
                                <input
                                  type="number"
                                  value={ligne.montant}
                                  onChange={(e) => {
                                    const nouvelles = [...lignesFinancement]
                                    nouvelles[index].montant = Number(e.target.value)
                                    setLignesFinancement(nouvelles)
                                  }}
                                  className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                  placeholder="Montant"
                                />
                                <select
                                  value={ligne.statut}
                                  onChange={(e) => {
                                    const nouvelles = [...lignesFinancement]
                                    nouvelles[index].statut = e.target.value
                                    setLignesFinancement(nouvelles)
                                  }}
                                  className="w-40 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                >
                                  <option value="PREPARATION">Préparation</option>
                                  <option value="SOUMIS">Soumis</option>
                                  <option value="EN_EXAMEN">En examen</option>
                                  <option value="VALIDE">Validé</option>
                                  <option value="REFUSE">Refusé</option>
                                  <option value="VERSE">Versé</option>
                                </select>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleSupprimerLigneFinancement(ligne.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Minus className="w-4 h-4" />
                                </Button>
                              </motion.div>
                            ))}
                          </div>

                          <Button
                            onClick={handleAjouterLigneFinancement}
                            variant="outline"
                            className="w-full"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Ajouter un financeur
                          </Button>

                          {/* Calculs temps réel multi-financement */}
                          {calculsMultiFinancement && (
                            <div className="mt-6 space-y-4">
                              <h4 className="font-semibold text-accent">Calculs temps réel</h4>

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="p-3 bg-blue-50 rounded-lg text-center">
                                  <p className="text-xs text-gray-600 mb-1">Total demandé</p>
                                  <p className="font-bold text-blue-600">{formatEuro(calculsMultiFinancement.totalDemande)}</p>
                                </div>
                                <div className="p-3 bg-green-50 rounded-lg text-center">
                                  <p className="text-xs text-gray-600 mb-1">Total accordé</p>
                                  <p className="font-bold text-green-600">{formatEuro(calculsMultiFinancement.totalAccorde)}</p>
                                </div>
                                <div className={cn(
                                  "p-3 rounded-lg text-center",
                                  calculsMultiFinancement.resteACharge > 0 ? "bg-red-50" : "bg-green-50"
                                )}>
                                  <p className="text-xs text-gray-600 mb-1">Reste à charge</p>
                                  <p className={cn(
                                    "font-bold",
                                    calculsMultiFinancement.resteACharge > 0 ? "text-red-600" : "text-green-600"
                                  )}>
                                    {formatEuro(calculsMultiFinancement.resteACharge)}
                                  </p>
                                </div>
                                <div className="p-3 bg-purple-50 rounded-lg text-center">
                                  <p className="text-xs text-gray-600 mb-1">Taux couverture</p>
                                  <p className="font-bold text-purple-600">{calculsMultiFinancement.tauxCouverture.toFixed(1)}%</p>
                                </div>
                              </div>

                              <div className="p-4 bg-gray-50 rounded-lg">
                                <p className="text-sm font-medium text-gray-700 mb-2">Progression du financement</p>
                                <div className="w-full bg-gray-200 rounded-full h-3">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(calculsMultiFinancement.tauxCouverture, 100)}%` }}
                                    transition={{ duration: 0.8, ease: "easeOut" }}
                                    className={cn(
                                      "h-3 rounded-full",
                                      calculsMultiFinancement.tauxCouverture >= 100 ? "bg-green-500" : "bg-orange-500"
                                    )}
                                  />
                                </div>
                              </div>

                              {/* Alertes */}
                              {calculsMultiFinancement.totalDemande > calculsMultiFinancement.montantFormation && (
                                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                  <div className="flex items-start gap-2">
                                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                                    <p className="text-sm text-yellow-800">
                                      Le total demandé dépasse le coût de la formation
                                    </p>
                                  </div>
                                </div>
                              )}

                              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-start gap-2">
                                  <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                                  <div className="text-sm text-blue-800">
                                    <p className="font-medium">Compatibilités autorisées :</p>
                                    <ul className="mt-2 space-y-1">
                                      <li>• CPF + AIF : cumul autorisé</li>
                                      <li>• OPCO + FAFCEA : double dossier possible pour gérante + salariées</li>
                                    </ul>
                                  </div>
                                </div>
                              </div>

                              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                <div className="flex items-start gap-2">
                                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                                  <div className="text-sm text-green-800">
                                    <p className="font-medium">Stratégie recommandée :</p>
                                    <p className="mt-1">Optimisation maximale des fonds mutualisés pour minimiser le reste à charge</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {multiFinancementActive && (
                      <div className="mt-6 pt-4 border-t border-gray-200">
                        <Button onClick={handleSauvegarderCouts} className="w-full">
                          <Save className="w-4 h-4 mr-2" />
                          Sauvegarder le multi-financement
                        </Button>
                      </div>
                    )}
                  </Card>
                </motion.div>
              </TabsContent>

              {/* Onglet Historique */}
              <TabsContent value="historique" className="mt-0">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {/* Filtres */}
                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-accent">Historique des modifications</h3>
                      <div className="flex items-center gap-3">
                        <Filter className="w-4 h-4 text-gray-500" />
                        <select
                          multiple
                          value={historiqueFiltres}
                          onChange={(e) => setHistoriqueFiltres(Array.from(e.target.selectedOptions, option => option.value))}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                        >
                          <option value="">Tous</option>
                          <option value="Création">Créations</option>
                          <option value="Modification">Modifications</option>
                          <option value="Changement statut">Statuts</option>
                          <option value="Document ajouté">Documents</option>
                          <option value="Note ajoutée">Notes</option>
                        </select>
                      </div>
                    </div>

                    {/* Ajouter une note */}
                    <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-3">Ajouter une note</h4>
                      <div className="space-y-3">
                        <textarea
                          value={newNote}
                          onChange={(e) => setNewNote(e.target.value)}
                          className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Votre note..."
                          rows={3}
                        />
                        <Button onClick={handleAjouterNote} size="sm" disabled={!newNote.trim()}>
                          <PlusCircle className="w-4 h-4 mr-2" />
                          Ajouter la note
                        </Button>
                      </div>
                    </div>

                    {/* Timeline */}
                    <div className="space-y-4">
                      {financement.historique && financement.historique.length > 0 ? (
                        <div className="relative">
                          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
                          {financement.historique
                            .filter(entry =>
                              historiqueFiltres.length === 0 ||
                              historiqueFiltres.includes(entry.action)
                            )
                            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                            .map((entry, index) => {
                              const actionConfig = ACTION_CONFIG[entry.action as keyof typeof ACTION_CONFIG] || ACTION_CONFIG['Modification']

                              return (
                                <motion.div
                                  key={`${entry.date}-${index}`}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: index * 0.1 }}
                                  className="relative pl-12 pb-6"
                                >
                                  <div className="absolute left-2 w-4 h-4 bg-white border-2 border-primary rounded-full" />
                                  <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                                    <div className="flex items-start justify-between mb-2">
                                      <div className="flex items-center gap-3">
                                        <Avatar
                                          name={entry.user || 'Système'}
                                          size="sm"
                                        />
                                        <div>
                                          <p className="font-medium text-accent">{entry.user || 'Système'}</p>
                                          <p className="text-sm text-gray-500">
                                            {formatDate(entry.date)} à {new Date(entry.date).toLocaleTimeString('fr-FR', {
                                              hour: '2-digit',
                                              minute: '2-digit'
                                            })}
                                          </p>
                                        </div>
                                      </div>
                                      <Badge
                                        variant="outline"
                                        className={actionConfig.color}
                                      >
                                        {entry.action}
                                      </Badge>
                                    </div>
                                    {entry.detail && (
                                      <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                                        {entry.detail}
                                      </p>
                                    )}
                                  </div>
                                </motion.div>
                              )
                            })}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                          <h4 className="text-lg font-medium text-gray-500 mb-2">Aucune modification enregistrée</h4>
                          <p className="text-gray-400">L'historique des modifications apparaîtra ici.</p>
                        </div>
                      )}
                    </div>
                  </Card>
                </motion.div>
              </TabsContent>
            </Tabs>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}