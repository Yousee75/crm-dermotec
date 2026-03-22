'use client'

/**
 * CsvImportDialog - Import CSV/Excel files as leads
 *
 * Features:
 * - Drag & drop file upload
 * - Auto-detect column mapping (nom, prenom, email, telephone, etc.)
 * - Preview data before import
 * - Progress tracking during import
 * - Insert directly to Supabase leads table
 *
 * Usage:
 * <CsvImportDialog
 *   open={showImport}
 *   onClose={() => setShowImport(false)}
 *   onImported={(count) => console.log(`${count} leads imported`)}
 * />
 *
 * Required columns: nom, telephone
 * Optional: prenom, email, entreprise, formation_souhaitee, source, ville
 */

import { useState, useCallback, useMemo } from 'react'
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Upload, FileSpreadsheet, Check, X, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase-client'
import Papa from 'papaparse'

interface CsvImportDialogProps {
  open: boolean
  onClose: () => void
  onImported?: (count: number) => void
}

interface CsvData {
  headers: string[]
  rows: string[][]
  filename: string
}

interface ColumnMapping {
  nom: string | null
  prenom: string | null
  email: string | null
  telephone: string | null
  entreprise: string | null
  formation_souhaitee: string | null
  source: string | null
  ville: string | null
}

type ImportStep = 'upload' | 'preview' | 'import'

// Auto-detect mapping logic
const AUTO_MAP: Record<string, string[]> = {
  nom: ['nom', 'name', 'last_name', 'lastname', 'nom de famille', 'family_name'],
  prenom: ['prenom', 'prénom', 'first_name', 'firstname', 'given_name'],
  email: ['email', 'mail', 'e-mail', 'courriel', 'e_mail'],
  telephone: ['telephone', 'téléphone', 'tel', 'phone', 'mobile', 'portable', 'gsm'],
  entreprise: ['entreprise', 'société', 'societe', 'company', 'raison sociale', 'organization'],
  formation_souhaitee: ['formation', 'cours', 'training', 'programme', 'formation_souhaitee'],
  source: ['source', 'origine', 'canal', 'channel'],
  ville: ['ville', 'city', 'localité', 'location', 'town'],
}

function normalizeText(text: string): string {
  return text.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
}

function autoDetectMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {
    nom: null,
    prenom: null,
    email: null,
    telephone: null,
    entreprise: null,
    formation_souhaitee: null,
    source: null,
    ville: null,
  }

  for (const header of headers) {
    const normalized = normalizeText(header)

    for (const [field, patterns] of Object.entries(AUTO_MAP)) {
      if (mapping[field as keyof ColumnMapping]) continue // Already mapped

      for (const pattern of patterns) {
        if (normalized.includes(normalizeText(pattern))) {
          mapping[field as keyof ColumnMapping] = header
          break
        }
      }
    }
  }

  return mapping
}

export function CsvImportDialog({ open, onClose, onImported }: CsvImportDialogProps) {
  const [step, setStep] = useState<ImportStep>('upload')
  const [csvData, setCsvData] = useState<CsvData | null>(null)
  const [mapping, setMapping] = useState<ColumnMapping>({
    nom: null,
    prenom: null,
    email: null,
    telephone: null,
    entreprise: null,
    formation_souhaitee: null,
    source: null,
    ville: null,
  })
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0, errors: 0 })

  const supabase = createClient()

  const handleClose = useCallback(() => {
    setStep('upload')
    setCsvData(null)
    setMapping({
      nom: null,
      prenom: null,
      email: null,
      telephone: null,
      entreprise: null,
      formation_souhaitee: null,
      source: null,
      ville: null,
    })
    setIsProcessing(false)
    setImportProgress({ current: 0, total: 0, errors: 0 })
    onClose()
  }, [onClose])

  const handleFileUpload = useCallback(async (file: File) => {
    if (!file) return

    const validTypes = [
      'text/csv',
      'application/csv',
      'text/plain',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ]

    if (!validTypes.includes(file.type) && !file.name.match(/\.(csv|xlsx?|txt)$/i)) {
      toast.error('Type de fichier non supporté. Utilisez .csv, .xlsx ou .xls')
      return
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB max
      toast.error('Fichier trop volumineux (max 10MB)')
      return
    }

    setIsProcessing(true)

    try {
      Papa.parse(file, {
        header: false,
        skipEmptyLines: true,
        encoding: 'UTF-8',
        complete: (results) => {
          if (results.errors.length > 0) {
            console.error('CSV parsing errors:', results.errors)
            toast.error('Erreur lors de l\'analyse du fichier')
            setIsProcessing(false)
            return
          }

          const data = results.data as string[][]

          if (data.length < 2) {
            toast.error('Le fichier doit contenir au moins un en-tête et une ligne de données')
            setIsProcessing(false)
            return
          }

          const headers = data[0].map(h => h.trim()).filter(Boolean)
          const rows = data.slice(1).filter(row => row.some(cell => cell.trim()))

          if (headers.length === 0) {
            toast.error('Aucun en-tête détecté dans le fichier')
            setIsProcessing(false)
            return
          }

          const csvData: CsvData = {
            headers,
            rows,
            filename: file.name,
          }

          setCsvData(csvData)
          setMapping(autoDetectMapping(headers))
          setStep('preview')
          setIsProcessing(false)

          toast.success(`Fichier analysé : ${rows.length} lignes détectées`)
        },
        error: (error) => {
          console.error('Papa Parse error:', error)
          toast.error('Erreur lors de l\'analyse du fichier')
          setIsProcessing(false)
        }
      })
    } catch (error) {
      console.error('File processing error:', error)
      toast.error('Erreur lors du traitement du fichier')
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
    if (files.length > 0) {
      handleFileUpload(files[0])
    }
  }, [handleFileUpload])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      handleFileUpload(files[0])
    }
  }, [handleFileUpload])

  const previewRows = useMemo(() => {
    if (!csvData) return []
    return csvData.rows.slice(0, 5)
  }, [csvData])

  const requiredFields = ['nom', 'telephone'] as const
  const mappedRequiredFields = requiredFields.filter(field => mapping[field])
  const canProceedToImport = mappedRequiredFields.length === requiredFields.length

  const handleImport = useCallback(async () => {
    if (!csvData || !canProceedToImport) return

    setStep('import')
    setImportProgress({ current: 0, total: csvData.rows.length, errors: 0 })

    let successCount = 0
    let errorCount = 0

    for (let i = 0; i < csvData.rows.length; i++) {
      const row = csvData.rows[i]
      setImportProgress(prev => ({ ...prev, current: i + 1 }))

      try {
        // Build lead object from mapping
        const leadData: any = {
          statut: 'NOUVEAU',
          score_chaud: 0,
          priorite: 'NORMALE',
          nb_contacts: 0,
          financement_souhaite: false,
          tags: [],
          formations_interessees: [],
          data_sources: {},
          metadata: { imported_from: csvData.filename },
        }

        // Map CSV columns to lead fields
        Object.entries(mapping).forEach(([field, columnName]) => {
          if (columnName) {
            const columnIndex = csvData.headers.indexOf(columnName)
            if (columnIndex >= 0 && row[columnIndex]) {
              const value = row[columnIndex].trim()
              if (value) {
                if (field === 'formation_souhaitee') {
                  leadData.formations_interessees = [value]
                } else if (field === 'source') {
                  leadData.source = 'IMPORT_CSV'
                  leadData.metadata.original_source = value
                } else {
                  leadData[field] = value
                }
              }
            }
          }
        })

        // Validate required fields
        if (!leadData.nom?.trim() || !leadData.telephone?.trim()) {
          throw new Error('Nom et téléphone requis')
        }

        // Set default source if not provided
        if (!leadData.source) {
          leadData.source = 'IMPORT_CSV'
        }

        // Clean phone number (remove spaces, dots, etc.)
        leadData.telephone = leadData.telephone.replace(/[\s\.\-\(\)]/g, '')

        // Check for duplicate email if provided
        if (leadData.email?.trim()) {
          const { data: existingLead } = await supabase
            .from('leads')
            .select('id')
            .eq('email', leadData.email.trim().toLowerCase())
            .single()

          if (existingLead) {
            throw new Error(`Email déjà existant: ${leadData.email}`)
          }

          // Normalize email
          leadData.email = leadData.email.trim().toLowerCase()
        }

        const { error } = await supabase
          .from('leads')
          .insert(leadData)

        if (error) {
          console.error(`Erreur ligne ${i + 1}:`, error)
          errorCount++
        } else {
          successCount++
        }
      } catch (error) {
        console.error(`Erreur ligne ${i + 1}:`, error)
        errorCount++
      }

      // Small delay to avoid overwhelming the API
      if (i % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    setImportProgress(prev => ({ ...prev, errors: errorCount }))

    if (successCount > 0) {
      toast.success(`✨ Terminé ! ${successCount} contact${successCount > 1 ? 's' : ''} importé${successCount > 1 ? 's' : ''}`)
      onImported?.(successCount)
    }

    if (errorCount > 0) {
      toast.error(`${errorCount} erreur${errorCount > 1 ? 's' : ''} lors de l'import`)
    }
  }, [csvData, mapping, canProceedToImport, supabase, onImported])

  return (
    <Dialog open={open} onClose={handleClose} size="lg">
      <DialogHeader onClose={handleClose}>
        <DialogTitle className="flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-[#2EC6F3]" />
          Import CSV
        </DialogTitle>
      </DialogHeader>

      {step === 'upload' && (
        <>
          <div className="space-y-6">
            {/* Upload Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
                relative border-2 border-dashed rounded-xl p-8 text-center transition
                ${isDragging
                  ? 'border-[#2EC6F3] bg-[#2EC6F3]/5'
                  : 'border-gray-200 hover:border-gray-300'
                }
              `}
            >
              <input
                type="file"
                accept=".csv,.xlsx,.xls,text/csv"
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isProcessing}
              />

              <Upload className="w-12 h-12 text-gray-300 mx-auto mb-4" />

              <div className="space-y-2">
                <h3 className="font-medium text-[#082545]">
                  Glissez votre fichier ici
                </h3>
                <p className="text-sm text-gray-500">
                  ou cliquez pour sélectionner
                </p>
                <p className="text-xs text-gray-400">
                  Formats supportés : CSV, Excel (.xlsx, .xls)
                </p>
              </div>
            </div>

            {/* Instructions */}
            <Card className="p-4 bg-blue-50 border-blue-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <h4 className="font-medium text-blue-900">Format requis</h4>
                  <div className="text-sm text-blue-700 space-y-1">
                    <p>• La première ligne doit contenir les en-têtes de colonnes</p>
                    <p>• Colonnes obligatoires : <strong>nom</strong> et <strong>téléphone</strong></p>
                    <p>• Colonnes optionnelles : prénom, email, entreprise, formation, source, ville</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={handleClose}>
              Annuler
            </Button>
          </DialogFooter>
        </>
      )}

      {step === 'preview' && csvData && (
        <>
          <div className="space-y-6">
            {/* File Info */}
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium text-green-900">
                  {csvData.filename}
                </span>
              </div>
              <Badge variant="success">
                {csvData.rows.length} ligne{csvData.rows.length > 1 ? 's' : ''}
              </Badge>
            </div>

            {/* Column Mapping */}
            <div>
              <h3 className="font-medium text-[#082545] mb-3">Correspondance des colonnes</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(mapping).map(([field, value]) => {
                  const isRequired = requiredFields.includes(field as any)
                  const fieldLabels = {
                    nom: 'Nom',
                    prenom: 'Prénom',
                    email: 'Email',
                    telephone: 'Téléphone',
                    entreprise: 'Entreprise',
                    formation_souhaitee: 'Formation souhaitée',
                    source: 'Source',
                    ville: 'Ville',
                  }

                  return (
                    <div key={field}>
                      <label className={`block text-xs font-medium mb-1 ${
                        isRequired ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {fieldLabels[field as keyof typeof fieldLabels]}
                        {isRequired && ' *'}
                      </label>
                      <select
                        value={value || ''}
                        onChange={(e) => setMapping(prev => ({
                          ...prev,
                          [field]: e.target.value || null
                        }))}
                        className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[#2EC6F3]/30 ${
                          isRequired && !value
                            ? 'border-red-300 focus:border-red-500'
                            : 'border-gray-200 focus:border-[#2EC6F3]'
                        }`}
                      >
                        <option value="">-- Non mappé --</option>
                        {csvData.headers.map(header => (
                          <option key={header} value={header}>
                            {header}
                          </option>
                        ))}
                      </select>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Preview Table */}
            <div>
              <h3 className="font-medium text-[#082545] mb-3">Aperçu des données</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border border-gray-200 rounded-lg">
                  <thead>
                    <tr className="bg-gray-50">
                      {csvData.headers.map((header, i) => (
                        <th key={i} className="px-3 py-2 text-left font-medium text-gray-700 border-b">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, i) => (
                      <tr key={i} className="border-b border-gray-100">
                        {row.map((cell, j) => (
                          <td key={j} className="px-3 py-2 text-gray-600">
                            {cell || '—'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {csvData.rows.length > 5 && (
                <p className="text-xs text-gray-500 mt-2">
                  ... et {csvData.rows.length - 5} ligne{csvData.rows.length - 5 > 1 ? 's' : ''} de plus
                </p>
              )}
            </div>

            {/* Validation */}
            {!canProceedToImport && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <X className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-700">
                  Veuillez mapper les champs obligatoires : {requiredFields.filter(f => !mapping[f]).join(', ')}
                </span>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setStep('upload')}
              icon={<ArrowLeft className="w-4 h-4" />}
            >
              Retour
            </Button>
            <Button
              onClick={handleImport}
              disabled={!canProceedToImport}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              Importer {csvData.rows.length} contact{csvData.rows.length > 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </>
      )}

      {step === 'import' && (
        <>
          <div className="space-y-6 text-center">
            <div className="w-16 h-16 mx-auto bg-[#2EC6F3]/10 rounded-full flex items-center justify-center">
              <Upload className="w-8 h-8 text-[#2EC6F3]" />
            </div>

            <div>
              <h3 className="font-medium text-[#082545] mb-2">
                Import en cours...
              </h3>
              <p className="text-sm text-gray-600">
                {importProgress.current} / {importProgress.total} contacts traités
              </p>
            </div>

            <div className="space-y-2">
              <ProgressBar
                value={(importProgress.current / importProgress.total) * 100}
                size="md"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>{Math.round((importProgress.current / importProgress.total) * 100)}%</span>
                <span>
                  {importProgress.errors > 0 && `${importProgress.errors} erreur${importProgress.errors > 1 ? 's' : ''}`}
                </span>
              </div>
            </div>

            {importProgress.current === importProgress.total && (
              <div className="space-y-4">
                <div className="w-12 h-12 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                  <Check className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium text-green-900">Import terminé !</h3>
                  <p className="text-sm text-green-700">
                    {importProgress.total - importProgress.errors} contact{importProgress.total - importProgress.errors > 1 ? 's' : ''} importé{importProgress.total - importProgress.errors > 1 ? 's' : ''} avec succès
                  </p>
                  {importProgress.errors > 0 && (
                    <p className="text-sm text-red-600 mt-1">
                      {importProgress.errors} erreur{importProgress.errors > 1 ? 's' : ''} rencontrée{importProgress.errors > 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            {importProgress.current === importProgress.total && (
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