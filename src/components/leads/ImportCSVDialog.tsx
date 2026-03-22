'use client'

// ============================================================
// CRM DERMOTEC — Import CSV Dialog (multi-step)
// 5 étapes : Upload → Mapping → Preview → Validation → Import
// ============================================================

import { useState, useCallback, useMemo, useRef } from 'react'
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import {
  Upload, FileSpreadsheet, Check, X, AlertCircle,
  ArrowRight, ArrowLeft, Eye, ShieldCheck, Loader2,
  CheckCircle2, XCircle, AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'
import { parseCSV, detectColumnMapping, type ColumnMappingResult, type ParsedCSV } from '@/lib/csv-parser'
import { cn } from '@/lib/utils'

// --- Types ---

interface ImportCSVDialogProps {
  open: boolean
  onClose: () => void
  onImported?: (count: number) => void
}

type Step = 'upload' | 'mapping' | 'preview' | 'validation' | 'import'

const STEPS: { id: Step; label: string; icon: React.ElementType }[] = [
  { id: 'upload', label: 'Fichier', icon: Upload },
  { id: 'mapping', label: 'Colonnes', icon: FileSpreadsheet },
  { id: 'preview', label: 'Aperçu', icon: Eye },
  { id: 'validation', label: 'Validation', icon: ShieldCheck },
  { id: 'import', label: 'Import', icon: Check },
]

const CRM_FIELDS: { key: keyof ColumnMappingResult; label: string; required: boolean }[] = [
  { key: 'nom', label: 'Nom', required: true },
  { key: 'prenom', label: 'Prénom', required: false },
  { key: 'email', label: 'Email', required: false },
  { key: 'telephone', label: 'Téléphone', required: false },
  { key: 'entreprise_nom', label: 'Entreprise', required: false },
  { key: 'ville', label: 'Ville', required: false },
  { key: 'source', label: 'Source', required: false },
]

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface ValidationRow {
  rowIndex: number
  data: Record<string, string>
  errors: string[]
  isDuplicate: boolean
}

// --- Composant Stepper ---

function Stepper({ currentStep }: { currentStep: Step }) {
  const currentIndex = STEPS.findIndex(s => s.id === currentStep)

  return (
    <div className="flex items-center gap-1 mb-6">
      {STEPS.map((step, i) => {
        const Icon = step.icon
        const isActive = i === currentIndex
        const isDone = i < currentIndex

        return (
          <div key={step.id} className="flex items-center gap-1 flex-1">
            <div className={cn(
              'flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-colors',
              isActive && 'bg-primary/10 text-primary',
              isDone && 'bg-green-50 text-green-700',
              !isActive && !isDone && 'text-gray-400',
            )}>
              {isDone ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <Icon className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">{step.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn(
                'flex-1 h-px mx-1',
                i < currentIndex ? 'bg-green-300' : 'bg-gray-200',
              )} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// --- Composant principal ---

export function ImportCSVDialog({ open, onClose, onImported }: ImportCSVDialogProps) {
  const [step, setStep] = useState<Step>('upload')
  const [csvData, setCsvData] = useState<ParsedCSV | null>(null)
  const [filename, setFilename] = useState('')
  const [mapping, setMapping] = useState<ColumnMappingResult>({
    nom: null, prenom: null, email: null, telephone: null,
    entreprise_nom: null, ville: null, source: null,
  })
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [validationRows, setValidationRows] = useState<ValidationRow[]>([])
  const [importResult, setImportResult] = useState<{
    imported: number
    duplicates: number
    errors: { row: number; error: string }[]
  } | null>(null)
  const [importProgress, setImportProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // --- Reset ---
  const resetState = useCallback(() => {
    setStep('upload')
    setCsvData(null)
    setFilename('')
    setMapping({ nom: null, prenom: null, email: null, telephone: null, entreprise_nom: null, ville: null, source: null })
    setIsDragging(false)
    setIsProcessing(false)
    setValidationRows([])
    setImportResult(null)
    setImportProgress(0)
  }, [])

  const handleClose = useCallback(() => {
    resetState()
    onClose()
  }, [onClose, resetState])

  // --- Step 1: Upload ---

  const processFile = useCallback(async (file: File) => {
    const validExtensions = /\.(csv|xlsx?|txt)$/i
    if (!validExtensions.test(file.name)) {
      toast.error('Format non supporté. Utilisez .csv, .xlsx ou .txt')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Fichier trop volumineux (max 10 Mo)')
      return
    }

    setIsProcessing(true)

    try {
      const text = await file.text()
      const parsed = parseCSV(text)

      if (parsed.headers.length === 0) {
        toast.error('Aucun en-tête détecté dans le fichier')
        setIsProcessing(false)
        return
      }
      if (parsed.rows.length === 0) {
        toast.error('Le fichier ne contient aucune donnée')
        setIsProcessing(false)
        return
      }

      setCsvData(parsed)
      setFilename(file.name)

      // Auto-mapping
      const autoMapping = detectColumnMapping(parsed.headers)
      setMapping(autoMapping)

      setStep('mapping')
      toast.success(`${parsed.rows.length} lignes detectees dans ${file.name}`)
    } catch (err) {
      console.error('[ImportCSV] Parse error:', err)
      toast.error('Erreur lors de la lecture du fichier')
    } finally {
      setIsProcessing(false)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    if (files[0]) processFile(files[0])
  }, [processFile])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files[0]) processFile(files[0])
  }, [processFile])

  // --- Step 2: Mapping ---

  const canProceedFromMapping = mapping.nom !== null

  const updateMapping = useCallback((field: keyof ColumnMappingResult, value: string | null) => {
    setMapping(prev => ({ ...prev, [field]: value }))
  }, [])

  // --- Step 3: Preview ---

  const previewRows = useMemo(() => {
    if (!csvData) return []
    return csvData.rows.slice(0, 5)
  }, [csvData])

  const getMappedValue = useCallback((row: string[], field: keyof ColumnMappingResult): string => {
    const header = mapping[field]
    if (!header || !csvData) return ''
    const colIndex = csvData.headers.indexOf(header)
    if (colIndex < 0) return ''
    return row[colIndex] || ''
  }, [mapping, csvData])

  // --- Step 4: Validation ---

  const runValidation = useCallback(() => {
    if (!csvData) return

    const emailsSeen = new Set<string>()
    const results: ValidationRow[] = []

    for (let i = 0; i < csvData.rows.length; i++) {
      const row = csvData.rows[i]
      const errors: string[] = []
      let isDuplicate = false

      // Extraire les valeurs mappées
      const data: Record<string, string> = {}
      for (const field of CRM_FIELDS) {
        data[field.key] = getMappedValue(row, field.key)
      }

      // Nom obligatoire
      if (!data.nom?.trim()) {
        errors.push('Nom manquant')
      }

      // Email valide si présent
      if (data.email?.trim()) {
        const email = data.email.trim().toLowerCase()
        if (!EMAIL_RE.test(email)) {
          errors.push('Email invalide')
        } else if (emailsSeen.has(email)) {
          isDuplicate = true
        } else {
          emailsSeen.add(email)
        }
      }

      // Téléphone FR si présent
      if (data.telephone?.trim()) {
        const cleaned = data.telephone.replace(/[\s.\-()]/g, '')
        if (cleaned && !/^(?:0[1-9]|\+33[1-9])\d{8}$/.test(cleaned)) {
          errors.push('Telephone invalide (format FR)')
        }
      }

      results.push({ rowIndex: i + 1, data, errors, isDuplicate })
    }

    setValidationRows(results)
    setStep('validation')
  }, [csvData, getMappedValue])

  // Statistiques de validation
  const validationStats = useMemo(() => {
    const valid = validationRows.filter(r => r.errors.length === 0 && !r.isDuplicate)
    const withErrors = validationRows.filter(r => r.errors.length > 0)
    const duplicates = validationRows.filter(r => r.isDuplicate)
    return { valid: valid.length, errors: withErrors.length, duplicates: duplicates.length }
  }, [validationRows])

  // --- Step 5: Import ---

  const handleImport = useCallback(async () => {
    if (!csvData || validationStats.valid === 0) return

    setStep('import')
    setImportProgress(10)

    // Construire les leads valides
    const validLeads = validationRows
      .filter(r => r.errors.length === 0 && !r.isDuplicate)
      .map(r => ({
        nom: r.data.nom?.trim() || '',
        prenom: r.data.prenom?.trim() || undefined,
        email: r.data.email?.trim() || undefined,
        telephone: r.data.telephone?.trim() || undefined,
        entreprise_nom: r.data.entreprise_nom?.trim() || undefined,
        ville: r.data.ville?.trim() || undefined,
        source: r.data.source?.trim() || undefined,
      }))

    setImportProgress(30)

    try {
      const response = await fetch('/api/leads/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leads: validLeads }),
      })

      setImportProgress(80)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Erreur HTTP ${response.status}`)
      }

      const result = await response.json()
      setImportResult(result)
      setImportProgress(100)

      if (result.imported > 0) {
        toast.success(`${result.imported} lead${result.imported > 1 ? 's' : ''} importe${result.imported > 1 ? 's' : ''} avec succes`)
        onImported?.(result.imported)
      }

      if (result.duplicates > 0) {
        toast.info(`${result.duplicates} doublon${result.duplicates > 1 ? 's' : ''} ignore${result.duplicates > 1 ? 's' : ''}`)
      }
    } catch (err) {
      console.error('[ImportCSV] Import error:', err)
      toast.error(err instanceof Error ? err.message : 'Erreur lors de l\'import')
      setImportProgress(100)
      setImportResult({ imported: 0, duplicates: 0, errors: [{ row: 0, error: String(err) }] })
    }
  }, [csvData, validationRows, validationStats.valid, onImported])

  // --- Render ---

  return (
    <Dialog open={open} onClose={handleClose} size="xl">
      <DialogHeader onClose={handleClose}>
        <DialogTitle className="flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-primary" />
          Import CSV de leads
        </DialogTitle>
      </DialogHeader>

      <Stepper currentStep={step} />

      {/* ========== STEP 1: UPLOAD ========== */}
      {step === 'upload' && (
        <>
          <div className="space-y-4">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'relative border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition',
                isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50',
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls,.txt"
                onChange={handleFileSelect}
                className="hidden"
                disabled={isProcessing}
              />

              {isProcessing ? (
                <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
              ) : (
                <Upload className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              )}

              <h3 className="font-medium text-accent">
                {isProcessing ? 'Analyse en cours...' : 'Glissez votre fichier ici'}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                ou cliquez pour selectionner
              </p>
              <p className="text-xs text-gray-400 mt-2">
                CSV, Excel (.xlsx), TXT — max 10 Mo
              </p>
            </div>

            <Card className="p-4 bg-blue-50 border-blue-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-700 space-y-1">
                  <p className="font-medium text-blue-900">Format attendu</p>
                  <p>La premiere ligne doit contenir les en-tetes de colonnes.</p>
                  <p>Colonne obligatoire : <strong>nom</strong>. Optionnelles : prenom, email, telephone, entreprise, ville, source.</p>
                  <p>Delimiteur auto-detecte (virgule, point-virgule, tab).</p>
                </div>
              </div>
            </Card>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={handleClose}>Annuler</Button>
          </DialogFooter>
        </>
      )}

      {/* ========== STEP 2: MAPPING ========== */}
      {step === 'mapping' && csvData && (
        <>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-900">{filename}</span>
              </div>
              <Badge variant="success">
                {csvData.rows.length} ligne{csvData.rows.length > 1 ? 's' : ''}
              </Badge>
            </div>

            <div>
              <h3 className="font-medium text-accent mb-3">Correspondance des colonnes</h3>
              <p className="text-xs text-gray-500 mb-3">
                Associez les colonnes de votre fichier aux champs du CRM. Le mapping a ete auto-detecte.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {CRM_FIELDS.map(({ key, label, required }) => (
                  <div key={key}>
                    <label className={cn(
                      'block text-xs font-medium mb-1',
                      required ? 'text-red-600' : 'text-gray-600',
                    )}>
                      {label}{required && ' *'}
                    </label>
                    <select
                      value={mapping[key] || ''}
                      onChange={(e) => updateMapping(key, e.target.value || null)}
                      className={cn(
                        'w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30',
                        required && !mapping[key]
                          ? 'border-red-300 focus:border-red-500'
                          : 'border-gray-200 focus:border-primary',
                      )}
                    >
                      <option value="">-- Non mappe --</option>
                      {csvData.headers.map(header => (
                        <option key={header} value={header}>{header}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            {!canProceedFromMapping && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <XCircle className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-700">
                  Le champ <strong>Nom</strong> est obligatoire.
                </span>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setStep('upload')} icon={<ArrowLeft className="w-4 h-4" />}>
              Retour
            </Button>
            <Button
              onClick={() => setStep('preview')}
              disabled={!canProceedFromMapping}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              Apercu
            </Button>
          </DialogFooter>
        </>
      )}

      {/* ========== STEP 3: PREVIEW ========== */}
      {step === 'preview' && csvData && (
        <>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Voici les 5 premieres lignes telles qu'elles seront importees :
            </p>

            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-3 py-2 text-left font-medium text-gray-500 w-10">#</th>
                    {CRM_FIELDS.filter(f => mapping[f.key]).map(f => (
                      <th key={f.key} className="px-3 py-2 text-left font-medium text-gray-700">
                        {f.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, i) => (
                    <tr key={i} className="border-b border-gray-100 hover:bg-gray-50/50">
                      <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                      {CRM_FIELDS.filter(f => mapping[f.key]).map(f => (
                        <td key={f.key} className="px-3 py-2 text-gray-700">
                          {getMappedValue(row, f.key) || <span className="text-gray-300">—</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {csvData.rows.length > 5 && (
              <p className="text-xs text-gray-500">
                ... et {csvData.rows.length - 5} ligne{csvData.rows.length - 5 > 1 ? 's' : ''} de plus
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setStep('mapping')} icon={<ArrowLeft className="w-4 h-4" />}>
              Retour
            </Button>
            <Button onClick={runValidation} icon={<ShieldCheck className="w-4 h-4" />}>
              Valider les donnees
            </Button>
          </DialogFooter>
        </>
      )}

      {/* ========== STEP 4: VALIDATION ========== */}
      {step === 'validation' && (
        <>
          <div className="space-y-4">
            {/* Stats cards */}
            <div className="grid grid-cols-3 gap-3">
              <Card className="p-3 text-center bg-green-50 border-green-200">
                <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto mb-1" />
                <div className="text-lg font-bold text-green-700">{validationStats.valid}</div>
                <div className="text-xs text-green-600">Valides</div>
              </Card>
              <Card className="p-3 text-center bg-amber-50 border-amber-200">
                <AlertTriangle className="w-5 h-5 text-amber-600 mx-auto mb-1" />
                <div className="text-lg font-bold text-amber-700">{validationStats.duplicates}</div>
                <div className="text-xs text-amber-600">Doublons</div>
              </Card>
              <Card className="p-3 text-center bg-red-50 border-red-200">
                <XCircle className="w-5 h-5 text-red-500 mx-auto mb-1" />
                <div className="text-lg font-bold text-red-700">{validationStats.errors}</div>
                <div className="text-xs text-red-600">Erreurs</div>
              </Card>
            </div>

            {/* Erreurs détaillées */}
            {validationStats.errors > 0 && (
              <div className="max-h-40 overflow-y-auto rounded-lg border border-red-200 bg-red-50 p-3">
                <h4 className="text-xs font-medium text-red-700 mb-2">
                  Lignes en erreur (seront ignorees) :
                </h4>
                <div className="space-y-1">
                  {validationRows
                    .filter(r => r.errors.length > 0)
                    .slice(0, 20)
                    .map(r => (
                      <div key={r.rowIndex} className="text-xs text-red-600">
                        <strong>Ligne {r.rowIndex}</strong> : {r.errors.join(', ')}
                        {r.data.nom && ` (${r.data.nom})`}
                      </div>
                    ))}
                  {validationStats.errors > 20 && (
                    <div className="text-xs text-red-500 italic">
                      ... et {validationStats.errors - 20} erreurs de plus
                    </div>
                  )}
                </div>
              </div>
            )}

            {validationStats.valid === 0 && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <XCircle className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-700">
                  Aucun lead valide a importer. Verifiez le mapping et les donnees.
                </span>
              </div>
            )}

            {validationStats.valid > 0 && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-700">
                  <strong>{validationStats.valid}</strong> lead{validationStats.valid > 1 ? 's' : ''} pret{validationStats.valid > 1 ? 's' : ''} a etre importe{validationStats.valid > 1 ? 's' : ''}.
                </span>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setStep('preview')} icon={<ArrowLeft className="w-4 h-4" />}>
              Retour
            </Button>
            <Button
              onClick={handleImport}
              disabled={validationStats.valid === 0}
              icon={<Upload className="w-4 h-4" />}
            >
              Importer {validationStats.valid} lead{validationStats.valid > 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </>
      )}

      {/* ========== STEP 5: IMPORT ========== */}
      {step === 'import' && (
        <>
          <div className="space-y-6 text-center py-4">
            {importProgress < 100 ? (
              <>
                <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
                <div>
                  <h3 className="font-medium text-accent mb-1">Import en cours...</h3>
                  <p className="text-sm text-gray-500">Envoi des leads vers le serveur</p>
                </div>
                <ProgressBar value={importProgress} size="md" color="var(--color-primary)" />
              </>
            ) : importResult ? (
              <>
                <div className={cn(
                  'w-16 h-16 mx-auto rounded-full flex items-center justify-center',
                  importResult.imported > 0 ? 'bg-green-100' : 'bg-red-100',
                )}>
                  {importResult.imported > 0 ? (
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                  ) : (
                    <XCircle className="w-8 h-8 text-red-500" />
                  )}
                </div>

                <div>
                  <h3 className={cn(
                    'font-medium mb-2',
                    importResult.imported > 0 ? 'text-green-900' : 'text-red-900',
                  )}>
                    {importResult.imported > 0 ? 'Import termine !' : 'Echec de l\'import'}
                  </h3>

                  <div className="space-y-1 text-sm">
                    {importResult.imported > 0 && (
                      <p className="text-green-700">
                        <strong>{importResult.imported}</strong> lead{importResult.imported > 1 ? 's' : ''} importe{importResult.imported > 1 ? 's' : ''}
                      </p>
                    )}
                    {importResult.duplicates > 0 && (
                      <p className="text-amber-600">
                        <strong>{importResult.duplicates}</strong> doublon{importResult.duplicates > 1 ? 's' : ''} ignore{importResult.duplicates > 1 ? 's' : ''}
                      </p>
                    )}
                    {importResult.errors.length > 0 && (
                      <p className="text-red-600">
                        <strong>{importResult.errors.length}</strong> erreur{importResult.errors.length > 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                </div>

                <ProgressBar value={100} size="md" color={importResult.imported > 0 ? 'var(--color-success)' : '#EF4444'} />
              </>
            ) : null}
          </div>

          <DialogFooter>
            {importProgress >= 100 && (
              <Button onClick={handleClose}>
                Fermer
              </Button>
            )}
          </DialogFooter>
        </>
      )}
    </Dialog>
  )
}
