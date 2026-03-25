'use client'

// ============================================================
// OCR Uploader — Upload image + extraction OCR + pre-remplissage
// ============================================================

import React, { useState, useRef, useCallback } from 'react'
import { Upload, Loader2, FileText, Check, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

interface ExtractedFields {
  nom?: string
  prenom?: string
  siret?: string
  adresse?: string
  email?: string
  telephone?: string
  date_naissance?: string
}

interface OCRUploaderProps {
  /** Callback avec les champs extraits */
  onFieldsExtracted: (fields: ExtractedFields) => void
  /** Texte personnalise */
  label?: string
  /** Classes CSS */
  className?: string
  /** Desactiver */
  disabled?: boolean
}

type OCRStatus = 'idle' | 'uploading' | 'processing' | 'success' | 'error'

export default function OCRUploader({
  onFieldsExtracted,
  label = 'Scanner un document',
  className = '',
  disabled = false,
}: OCRUploaderProps) {
  const [status, setStatus] = useState<OCRStatus>('idle')
  const [extractedFields, setExtractedFields] = useState<ExtractedFields | null>(null)
  const [rawText, setRawText] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [fileName, setFileName] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processImage = useCallback(async (file: File) => {
    // Validation
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Format non supporte. Utilisez JPEG, PNG ou WEBP.')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image trop volumineuse (max 10 MB)')
      return
    }

    setFileName(file.name)
    setStatus('uploading')
    setError('')

    try {
      // Charger Tesseract.js dynamiquement (cote client)
      setStatus('processing')
      const Tesseract = await import('tesseract.js')

      const imageUrl = URL.createObjectURL(file)

      const { data: { text } } = await Tesseract.recognize(imageUrl, 'fra', {
        logger: (m: any) => {
          // Optionnel : progression
          if (m.status === 'recognizing text' && m.progress) {
            // On pourrait afficher la progression ici
          }
        },
      })

      URL.revokeObjectURL(imageUrl)

      if (!text || text.trim().length < 5) {
        setStatus('error')
        setError('Aucun texte detecte dans l\'image. Essayez avec une meilleure qualite.')
        return
      }

      setRawText(text)

      // Parser les champs cote client (memes regex que le serveur)
      const fields = parseFieldsClient(text)
      setExtractedFields(fields)
      setStatus('success')

      const fieldCount = Object.values(fields).filter(Boolean).length
      if (fieldCount > 0) {
        toast.success(`${fieldCount} champ(s) detecte(s) dans le document`)
        onFieldsExtracted(fields)
      } else {
        toast.info('Texte extrait mais aucun champ reconnu automatiquement')
      }
    } catch (err) {
      console.error('[OCR] Erreur:', err)
      setStatus('error')
      setError('Erreur lors de l\'analyse OCR. Reessayez.')
      toast.error('Erreur OCR')
    }
  }, [onFieldsExtracted])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processImage(file)
  }, [processImage])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (disabled || status === 'processing') return
    const file = e.dataTransfer.files[0]
    if (file) processImage(file)
  }, [disabled, status, processImage])

  const reset = useCallback(() => {
    setStatus('idle')
    setExtractedFields(null)
    setRawText('')
    setError('')
    setFileName('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Zone d'upload */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => !disabled && status !== 'processing' && fileInputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
          transition-all duration-200
          ${status === 'error' ? 'border-red-300 bg-red-50' : ''}
          ${status === 'success' ? 'border-green-300 bg-green-50' : ''}
          ${status === 'idle' ? 'border-[#EEEEEE] bg-[#FAF8F5] hover:border-[#2EC6F3] hover:bg-[#E0EBF5]' : ''}
          ${status === 'processing' ? 'border-[#2EC6F3] bg-[#E0EBF5]' : ''}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          disabled={disabled || status === 'processing'}
        />

        {status === 'idle' && (
          <>
            <FileText className="h-8 w-8 mx-auto mb-2 text-[#999999]" />
            <p className="text-sm font-medium text-[#3A3A3A]">{label}</p>
            <p className="text-xs text-[#777777] mt-1">
              Glissez une image ou cliquez pour scanner (JPEG, PNG, WEBP)
            </p>
          </>
        )}

        {status === 'processing' && (
          <>
            <Loader2 className="h-8 w-8 mx-auto mb-2 text-[#2EC6F3] animate-spin" />
            <p className="text-sm font-medium text-[#3A3A3A]">Analyse OCR en cours...</p>
            <p className="text-xs text-[#777777] mt-1">{fileName}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <Check className="h-8 w-8 mx-auto mb-2 text-[#10B981]" />
            <p className="text-sm font-medium text-[#10B981]">Document analyse</p>
            <p className="text-xs text-[#777777] mt-1">{fileName}</p>
          </>
        )}

        {status === 'error' && (
          <>
            <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-[#EF4444]" />
            <p className="text-sm font-medium text-[#EF4444]">Erreur</p>
            <p className="text-xs text-[#EF4444] mt-1">{error}</p>
          </>
        )}
      </div>

      {/* Champs extraits */}
      {status === 'success' && extractedFields && (
        <div className="rounded-lg border border-[#EEEEEE] bg-white p-4 space-y-2">
          <p className="text-xs font-semibold text-[#3A3A3A] uppercase tracking-wide">
            Champs detectes
          </p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {extractedFields.nom && (
              <Field label="Nom" value={extractedFields.nom} />
            )}
            {extractedFields.prenom && (
              <Field label="Prenom" value={extractedFields.prenom} />
            )}
            {extractedFields.email && (
              <Field label="Email" value={extractedFields.email} />
            )}
            {extractedFields.telephone && (
              <Field label="Telephone" value={extractedFields.telephone} />
            )}
            {extractedFields.siret && (
              <Field label="SIRET" value={extractedFields.siret} />
            )}
            {extractedFields.adresse && (
              <Field label="Adresse" value={extractedFields.adresse} />
            )}
            {extractedFields.date_naissance && (
              <Field label="Date naissance" value={extractedFields.date_naissance} />
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onFieldsExtracted(extractedFields)
                toast.success('Champs appliques au formulaire')
              }}
              className="text-xs font-medium text-white bg-[#2EC6F3] hover:bg-[#1BA8D4] px-3 py-1.5 rounded-md transition-colors"
            >
              Appliquer
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                reset()
              }}
              className="text-xs font-medium text-[#777777] hover:text-[#3A3A3A] px-3 py-1.5 rounded-md border border-[#EEEEEE] transition-colors"
            >
              Recommencer
            </button>
          </div>
        </div>
      )}

      {/* Texte brut (toggle) */}
      {status === 'success' && rawText && (
        <details className="text-xs">
          <summary className="cursor-pointer text-[#777777] hover:text-[#3A3A3A]">
            Voir le texte brut extrait
          </summary>
          <pre className="mt-2 p-3 bg-[#FAF8F5] border border-[#EEEEEE] rounded-lg text-[#555555] whitespace-pre-wrap max-h-40 overflow-y-auto">
            {rawText}
          </pre>
        </details>
      )}

      {/* Bouton reset si erreur */}
      {status === 'error' && (
        <button
          onClick={reset}
          className="text-xs font-medium text-[#2EC6F3] hover:text-[#1BA8D4]"
        >
          Reessayer
        </button>
      )}
    </div>
  )
}

// ── Composant champ ──────────────────────────────────────────

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-[#999999] text-xs">{label}</span>
      <p className="text-[#3A3A3A] font-medium truncate">{value}</p>
    </div>
  )
}

// ── Parser client (memes regex que lib/ocr.ts) ──────────────

function parseFieldsClient(text: string): ExtractedFields {
  const fields: ExtractedFields = {}

  // SIRET
  const siretMatch = text.match(/\b(\d{3}\s?\d{3}\s?\d{3}\s?\d{5})\b/)
  if (siretMatch) fields.siret = siretMatch[1].replace(/\s/g, '')

  // Email
  const emailMatch = text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/i)
  if (emailMatch) fields.email = emailMatch[0].toLowerCase()

  // Telephone
  const phoneMatch = text.match(/(?:0|\+33\s?)[1-9](?:[\s.-]?\d{2}){4}/)
  if (phoneMatch) fields.telephone = phoneMatch[0].replace(/[\s.-]/g, '')

  // Date naissance
  const dateMatch = text.match(/(?:n[ée]e?\s+le|naissance)[:\s]*(\d{2}[\/.-]\d{2}[\/.-]\d{4})/i)
  if (dateMatch) fields.date_naissance = dateMatch[1]

  // Nom
  const nomMatch = text.match(/(?:Nom|NOM)\s*[:\s]+([A-ZÀ-Ü][A-ZÀ-Üa-zà-ü\s-]+)/m)
  if (nomMatch) fields.nom = nomMatch[1].trim()

  // Prenom
  const prenomMatch = text.match(/(?:Pr[ée]nom|PRENOM)\s*[:\s]+([A-ZÀ-Ü][a-zà-ü\s-]+)/m)
  if (prenomMatch) fields.prenom = prenomMatch[1].trim()

  // Adresse
  const adresseMatch = text.match(/(\d{1,4}[\s,]+(?:rue|avenue|boulevard|bd|allée|chemin|impasse|place|passage)[^,\n]{5,}[\s,]+\d{5}\s+[A-ZÀ-Ü][a-zà-ü]+)/i)
  if (adresseMatch) fields.adresse = adresseMatch[1].trim()

  return fields
}
