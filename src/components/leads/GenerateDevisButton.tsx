'use client'

// ============================================================
// CRM DERMOTEC — Bouton + Dialog pour generer un devis PDF
// Place sur la fiche lead (page lead/[id])
// ============================================================

import { useState, useCallback, useMemo } from 'react'
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import {
  FileText, Loader2, CheckCircle2, ExternalLink,
  Send, Download, GraduationCap, Wallet, CreditCard,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { FORMATIONS_SEED } from '@/lib/constants'

// ── Types ──

interface GenerateDevisButtonProps {
  leadId: string
  leadNom?: string
  leadPrenom?: string
  leadEmail?: string
  formationPrincipaleId?: string
  formationPrincipaleNom?: string
  className?: string
  variant?: 'default' | 'compact'
}

interface SessionOption {
  id: string
  label: string
  dateDebut: string
  dateFin: string
  placesDisponibles: number
}

type Step = 'form' | 'generating' | 'done'

const FINANCEMENT_TYPES = [
  { value: 'autofinancement', label: 'Autofinancement (pas de prise en charge)' },
  { value: 'opco', label: 'OPCO' },
  { value: 'cpf', label: 'CPF' },
  { value: 'france_travail', label: 'France Travail' },
]

const ECHEANCES_OPTIONS = [
  { value: 1, label: 'Comptant' },
  { value: 2, label: '2x sans frais' },
  { value: 3, label: '3x sans frais' },
  { value: 4, label: '4x sans frais' },
]

// ── Composant principal ──

export function GenerateDevisButton({
  leadId,
  leadNom,
  leadPrenom,
  leadEmail,
  formationPrincipaleId,
  formationPrincipaleNom,
  className,
  variant = 'default',
}: GenerateDevisButtonProps) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>('form')

  // Form state
  const [selectedFormation, setSelectedFormation] = useState(formationPrincipaleNom || '')
  const [selectedFormationId, setSelectedFormationId] = useState(formationPrincipaleId || '')
  const [selectedSessionId, setSelectedSessionId] = useState('')
  const [financementType, setFinancementType] = useState('autofinancement')
  const [financementMontant, setFinancementMontant] = useState('')
  const [echeances, setEcheances] = useState(1)

  // Sessions chargees dynamiquement
  const [sessions, setSessions] = useState<SessionOption[]>([])
  const [loadingSessions, setLoadingSessions] = useState(false)

  // Result
  const [result, setResult] = useState<{
    devisId: string
    devisNumber: string
    montantTtc: number
    resteACharge: number
    pdfUrl: string | null
    stripePaymentLink: string | null
  } | null>(null)

  // Prix de la formation selectionnee
  const formationPrix = useMemo(() => {
    if (!selectedFormation) return 0
    const found = FORMATIONS_SEED.find(f => f.nom === selectedFormation)
    return found?.prix_ht || 0
  }, [selectedFormation])

  // Calcul apercu
  const apercu = useMemo(() => {
    const ht = formationPrix
    const tva = Math.round(ht * 0.20)
    const ttc = ht + tva
    const prise = parseInt(financementMontant) || 0
    const reste = Math.max(0, ttc - prise)
    return { ht, tva, ttc, prise, reste }
  }, [formationPrix, financementMontant])

  // ── Charger les sessions quand la formation change ──
  const loadSessions = useCallback(async (formationNom: string) => {
    if (!formationNom) {
      setSessions([])
      return
    }
    setLoadingSessions(true)
    try {
      const res = await fetch(`/api/sessions?formation_nom=${encodeURIComponent(formationNom)}&statut=planifiee`)
      if (res.ok) {
        const data = await res.json()
        const opts: SessionOption[] = (data.sessions || data || []).map((s: any) => ({
          id: s.id,
          label: `${new Date(s.date_debut).toLocaleDateString('fr-FR')} - ${new Date(s.date_fin).toLocaleDateString('fr-FR')} (${s.places_max - s.places_occupees} places)`,
          dateDebut: s.date_debut,
          dateFin: s.date_fin,
          placesDisponibles: s.places_max - s.places_occupees,
        }))
        setSessions(opts)
      }
    } catch {
      // Pas de sessions disponibles, ce n'est pas bloquant
    } finally {
      setLoadingSessions(false)
    }
  }, [])

  const handleFormationChange = useCallback((nom: string) => {
    setSelectedFormation(nom)
    const found = FORMATIONS_SEED.find(f => f.nom === nom)
    setSelectedFormationId(found ? '' : '') // On n'a pas l'ID dans le seed
    setSelectedSessionId('')
    loadSessions(nom)
  }, [loadSessions])

  // ── Generer le devis ──
  const handleGenerate = useCallback(async () => {
    if (!selectedFormation) {
      toast.error('Veuillez selectionner une formation')
      return
    }

    setStep('generating')

    try {
      const payload: Record<string, unknown> = {
        lead_id: leadId,
        formation_nom: selectedFormation,
        formation_prix_ht: formationPrix,
      }

      if (selectedFormationId) payload.formation_id = selectedFormationId
      if (selectedSessionId) payload.session_id = selectedSessionId
      if (financementType !== 'autofinancement') {
        payload.financement_type = financementType
        payload.financement_montant = parseInt(financementMontant) || 0
      }
      if (echeances > 1) payload.echeances = echeances

      const res = await fetch('/api/devis/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `Erreur HTTP ${res.status}`)
      }

      const data = await res.json()
      setResult(data)
      setStep('done')
      toast.success(`Devis ${data.devisNumber} genere avec succes`)
    } catch (err) {
      console.error('[Devis] Generation error:', err)
      toast.error(err instanceof Error ? err.message : 'Erreur lors de la generation')
      setStep('form')
    }
  }, [leadId, selectedFormation, selectedFormationId, selectedSessionId, financementType, financementMontant, echeances, formationPrix])

  // ── Envoyer par email ──
  const handleSendEmail = useCallback(async () => {
    if (!result?.devisId) return

    try {
      const res = await fetch('/api/devis/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ devis_id: result.devisId }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Erreur envoi')
      }

      toast.success(`Devis envoye par email a ${leadEmail || 'l\'adresse du prospect'}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de l\'envoi')
    }
  }, [result, leadEmail])

  // ── Ouvrir le PDF ──
  const handleOpenPdf = useCallback(() => {
    if (result?.pdfUrl) {
      window.open(result.pdfUrl, '_blank')
    }
  }, [result])

  // ── Reset ──
  const handleClose = useCallback(() => {
    setOpen(false)
    // Reset apres fermeture pour eviter flash
    setTimeout(() => {
      setStep('form')
      setResult(null)
      if (!formationPrincipaleNom) {
        setSelectedFormation('')
        setSelectedFormationId('')
      }
      setSelectedSessionId('')
      setFinancementType('autofinancement')
      setFinancementMontant('')
      setEcheances(1)
    }, 300)
  }, [formationPrincipaleNom])

  return (
    <>
      {/* ── Bouton declencheur ── */}
      {variant === 'compact' ? (
        <button
          onClick={() => setOpen(true)}
          className={cn(
            'flex items-center justify-center w-9 h-9 bg-violet-50 text-violet-700 rounded-lg hover:bg-violet-100 transition spring-hover',
            className
          )}
          title="Generer un devis"
        >
          <FileText className="w-4 h-4" />
        </button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpen(true)}
          icon={<FileText className="w-4 h-4" />}
          className={className}
        >
          Generer un devis
        </Button>
      )}

      {/* ── Dialog ── */}
      <Dialog open={open} onClose={handleClose} size="xl">
        <DialogHeader onClose={handleClose}>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Generer un devis
          </DialogTitle>
          <DialogDescription>
            {leadPrenom || ''} {leadNom || ''} — Devis PDF automatique
          </DialogDescription>
        </DialogHeader>

        {/* ═══ STEP 1: FORMULAIRE ═══ */}
        {step === 'form' && (
          <>
            <div className="space-y-4">
              {/* Formation */}
              <div>
                <label className="block text-xs font-medium text-[#3A3A3A] mb-1">
                  <GraduationCap className="w-3.5 h-3.5 inline mr-1 text-primary" />
                  Formation *
                </label>
                <select
                  value={selectedFormation}
                  onChange={(e) => handleFormationChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#EEEEEE] text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                >
                  <option value="">-- Choisir une formation --</option>
                  {FORMATIONS_SEED.map(f => (
                    <option key={f.slug} value={f.nom}>
                      {f.nom} — {f.prix_ht} EUR HT ({f.duree_jours}j)
                    </option>
                  ))}
                </select>
              </div>

              {/* Session (optionnel) */}
              {sessions.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-[#3A3A3A] mb-1">
                    Session (optionnel)
                  </label>
                  <select
                    value={selectedSessionId}
                    onChange={(e) => setSelectedSessionId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#EEEEEE] text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  >
                    <option value="">-- Pas de session specifique --</option>
                    {sessions.map(s => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </div>
              )}
              {loadingSessions && (
                <p className="text-xs text-[#999999] flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> Chargement des sessions...
                </p>
              )}

              {/* Financement */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#3A3A3A] mb-1">
                    <Wallet className="w-3.5 h-3.5 inline mr-1 text-[#FF8C42]" />
                    Financement
                  </label>
                  <select
                    value={financementType}
                    onChange={(e) => setFinancementType(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#EEEEEE] text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  >
                    {FINANCEMENT_TYPES.map(f => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                </div>

                {financementType !== 'autofinancement' && (
                  <div>
                    <label className="block text-xs font-medium text-[#3A3A3A] mb-1">
                      Montant pris en charge (EUR)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={apercu.ttc}
                      value={financementMontant}
                      onChange={(e) => setFinancementMontant(e.target.value)}
                      placeholder="Ex: 1500"
                      className="w-full px-3 py-2 rounded-lg border border-[#EEEEEE] text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>
                )}
              </div>

              {/* Echeances */}
              <div>
                <label className="block text-xs font-medium text-[#3A3A3A] mb-1">
                  <CreditCard className="w-3.5 h-3.5 inline mr-1 text-violet-500" />
                  Modalite de paiement
                </label>
                <div className="flex gap-2">
                  {ECHEANCES_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setEcheances(opt.value)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-xs font-medium border transition',
                        echeances === opt.value
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-white border-[#EEEEEE] text-[#777777] hover:border-[#EEEEEE]'
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Apercu financier */}
              {selectedFormation && formationPrix > 0 && (
                <Card className="p-4 bg-gradient-to-br from-gray-50 to-blue-50/30 border-[#EEEEEE]">
                  <div className="flex items-center gap-1.5 mb-3">
                    <FileText className="w-4 h-4 text-primary" />
                    <span className="text-xs font-semibold text-accent">Apercu du devis</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-[#777777]">Total HT</span>
                      <span className="font-medium">{apercu.ht.toLocaleString('fr-FR')} EUR</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-[#777777]">TVA (20%)</span>
                      <span>{apercu.tva.toLocaleString('fr-FR')} EUR</span>
                    </div>
                    <div className="flex justify-between text-xs pt-1 border-t border-[#EEEEEE]">
                      <span className="font-bold text-accent">Total TTC</span>
                      <span className="font-bold text-primary">{apercu.ttc.toLocaleString('fr-FR')} EUR</span>
                    </div>
                    {apercu.prise > 0 && (
                      <>
                        <div className="flex justify-between text-xs text-[#10B981]">
                          <span>Prise en charge</span>
                          <span>-{apercu.prise.toLocaleString('fr-FR')} EUR</span>
                        </div>
                        <div className="flex justify-between text-xs font-bold pt-1 border-t border-[#EEEEEE]">
                          <span className="text-accent">Reste a charge</span>
                          <span className="text-[#FF8C42]">{apercu.reste.toLocaleString('fr-FR')} EUR</span>
                        </div>
                      </>
                    )}
                    {echeances > 1 && (
                      <div className="flex justify-between text-xs text-violet-600 mt-1">
                        <span>Mensualite ({echeances}x)</span>
                        <span className="font-medium">
                          {Math.round(apercu.reste / echeances).toLocaleString('fr-FR')} EUR/mois
                        </span>
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {!leadEmail && (
                <div className="flex items-center gap-2 p-2.5 bg-[#FFF3E8] border border-[#FF8C42]/30 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-[#FF8C42] shrink-0" />
                  <span className="text-xs text-[#FF8C42]">
                    Ce prospect n'a pas d'email. L'envoi par email ne sera pas disponible.
                  </span>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={handleClose}>Annuler</Button>
              <Button
                onClick={handleGenerate}
                disabled={!selectedFormation || formationPrix <= 0}
                icon={<FileText className="w-4 h-4" />}
              >
                Generer le devis
              </Button>
            </DialogFooter>
          </>
        )}

        {/* ═══ STEP 2: GENERATION EN COURS ═══ */}
        {step === 'generating' && (
          <div className="py-12 text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
            <div>
              <h3 className="font-medium text-accent">Generation en cours...</h3>
              <p className="text-sm text-[#777777] mt-1">Creation du devis PDF et du lien de paiement</p>
            </div>
          </div>
        )}

        {/* ═══ STEP 3: RESULTAT ═══ */}
        {step === 'done' && result && (
          <>
            <div className="space-y-4">
              <div className="text-center py-4">
                <div className="w-16 h-16 mx-auto bg-[#D1FAE5] rounded-full flex items-center justify-center mb-3">
                  <CheckCircle2 className="w-8 h-8 text-[#10B981]" />
                </div>
                <h3 className="font-semibold text-accent">Devis {result.devisNumber} cree</h3>
                <p className="text-sm text-[#777777] mt-1">
                  {selectedFormation} — {result.montantTtc.toLocaleString('fr-FR')} EUR TTC
                </p>
              </div>

              {/* Recap */}
              <Card className="p-4 bg-[#FAF8F5] border-[#EEEEEE]">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[#777777]">Total TTC</span>
                    <p className="font-bold text-accent">{result.montantTtc.toLocaleString('fr-FR')} EUR</p>
                  </div>
                  <div>
                    <span className="text-[#777777]">Reste a charge</span>
                    <p className="font-bold text-[#FF8C42]">{result.resteACharge.toLocaleString('fr-FR')} EUR</p>
                  </div>
                  {result.pdfUrl && (
                    <div className="col-span-2">
                      <Badge variant="success">PDF genere</Badge>
                    </div>
                  )}
                  {result.stripePaymentLink && (
                    <div className="col-span-2">
                      <Badge variant="info">Lien de paiement Stripe cree</Badge>
                    </div>
                  )}
                </div>
              </Card>

              {/* Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {result.pdfUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleOpenPdf}
                    icon={<ExternalLink className="w-4 h-4" />}
                    className="w-full"
                  >
                    Voir le PDF
                  </Button>
                )}

                {leadEmail && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSendEmail}
                    icon={<Send className="w-4 h-4" />}
                    className="w-full"
                  >
                    Envoyer par email
                  </Button>
                )}

                {result.pdfUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (result.pdfUrl) {
                        const a = document.createElement('a')
                        a.href = result.pdfUrl
                        a.download = `${result.devisNumber}.pdf`
                        a.click()
                      }
                    }}
                    icon={<Download className="w-4 h-4" />}
                    className="w-full"
                  >
                    Telecharger le PDF
                  </Button>
                )}

                {result.stripePaymentLink && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(result.stripePaymentLink!)
                      toast.success('Lien de paiement copie')
                    }}
                    icon={<CreditCard className="w-4 h-4" />}
                    className="w-full"
                  >
                    Copier lien paiement
                  </Button>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={handleClose}>Fermer</Button>
            </DialogFooter>
          </>
        )}
      </Dialog>
    </>
  )
}
