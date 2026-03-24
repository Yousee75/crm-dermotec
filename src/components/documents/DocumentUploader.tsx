'use client'

// ============================================================
// CRM DERMOTEC — Composant Upload de documents
// ============================================================

import React, { useState, useRef, useCallback } from 'react'
import { Upload, FileText, Shield, AlertTriangle, Check, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { TypeDocument } from '@/types'
import { ALLOWED_MIME_TYPES, validateFileSize } from '@/lib/document-verification'

interface DocumentUploaderProps {
  leadId: string
  docType: TypeDocument
  financementId?: string
  onUpload?: (documentId: string, result: any) => void
  disabled?: boolean
  className?: string
}

type UploadStatus = 'idle' | 'uploading' | 'scanning' | 'success' | 'error'
type ScanStatus = 'clean' | 'suspect' | 'scanning' | 'skipped' | 'error'

interface UploadState {
  status: UploadStatus
  progress: number
  scanStatus: ScanStatus
  file?: File
  error?: string
  confidenceScore?: number
  documentId?: string
}

const DOCUMENT_TYPE_LABELS: Record<TypeDocument, string> = {
  piece_identite: 'Pièce d\'identité',
  justificatif_domicile: 'Justificatif de domicile',
  kbis: 'Extrait Kbis',
  attestation_employeur: 'Attestation employeur',
  attestation_pole_emploi: 'Attestation Pôle Emploi',
  convention: 'Convention de formation',
  devis: 'Devis',
  facture: 'Facture',
  avoir: 'Avoir',
  certificat: 'Certificat',
  attestation: 'Attestation',
  programme: 'Programme de formation',
  emargement: 'Émargement',
  consentement: 'Consentement',
  photo_avant: 'Photo avant',
  photo_apres: 'Photo après',
  autre: 'Autre document'
}

export default function DocumentUploader({
  leadId,
  docType,
  financementId,
  onUpload,
  disabled = false,
  className = ''
}: DocumentUploaderProps) {
  const [uploadState, setUploadState] = useState<UploadState>({
    status: 'idle',
    progress: 0,
    scanStatus: 'scanning'
  })
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const resetUpload = useCallback(() => {
    setUploadState({
      status: 'idle',
      progress: 0,
      scanStatus: 'scanning'
    })
  }, [])

  const validateFile = useCallback((file: File): string | null => {
    // Validation extension
    const extension = file.name.toLowerCase().split('.').pop()
    const allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'webp', 'heic', 'heif']
    if (!extension || !allowedExtensions.includes(extension)) {
      return 'Format non supporté. Utilisez: PDF, JPEG, PNG, WEBP, HEIC'
    }

    // Validation taille
    const sizeValidation = validateFileSize(file.size)
    if (!sizeValidation.valid) {
      return `Fichier trop volumineux: ${sizeValidation.sizeMB}MB (max: ${sizeValidation.maxMB}MB)`
    }

    // Validation nom de fichier
    if (file.name.length > 100) {
      return 'Nom de fichier trop long (max: 100 caractères)'
    }

    return null
  }, [])

  const uploadFile = useCallback(async (file: File) => {
    const validationError = validateFile(file)
    if (validationError) {
      setUploadState({
        status: 'error',
        progress: 0,
        scanStatus: 'error',
        error: validationError
      })
      toast.error(validationError)
      return
    }

    setUploadState({
      status: 'uploading',
      progress: 0,
      scanStatus: 'scanning',
      file,
      error: undefined
    })

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('leadId', leadId)
      formData.append('docType', docType)
      if (financementId) {
        formData.append('financementId', financementId)
      }

      // Simulation du progrès d'upload
      const progressInterval = setInterval(() => {
        setUploadState(prev => ({
          ...prev,
          progress: Math.min(prev.progress + Math.random() * 20, 85)
        }))
      }, 200)

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData
      })

      clearInterval(progressInterval)

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de l\'upload')
      }

      setUploadState({
        status: 'success',
        progress: 100,
        scanStatus: result.scan_status || 'skipped',
        file,
        confidenceScore: result.confidence_score,
        documentId: result.document_id
      })

      toast.success(`Document ${DOCUMENT_TYPE_LABELS[docType]} uploadé avec succès`)

      if (onUpload) {
        onUpload(result.document_id, result)
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de l\'upload'
      setUploadState({
        status: 'error',
        progress: 0,
        scanStatus: 'error',
        file,
        error: errorMessage
      })
      toast.error(errorMessage)
    }
  }, [leadId, docType, financementId, validateFile, onUpload])

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return

    const file = files[0]
    uploadFile(file)
  }, [uploadFile])

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)

    if (disabled || uploadState.status === 'uploading') return

    const files = e.dataTransfer.files
    handleFileSelect(files)
  }, [disabled, uploadState.status, handleFileSelect])

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (!disabled && uploadState.status !== 'uploading') {
      setIsDragOver(true)
    }
  }, [disabled, uploadState.status])

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleClick = useCallback(() => {
    if (disabled || uploadState.status === 'uploading') return
    fileInputRef.current?.click()
  }, [disabled, uploadState.status])

  const getStatusIcon = () => {
    switch (uploadState.status) {
      case 'uploading':
        return <Loader2 className="h-8 w-8 animate-spin text-primary" />
      case 'success':
        return <Check className="h-8 w-8 text-[#10B981]" />
      case 'error':
        return <X className="h-8 w-8 text-[#FF2D78]" />
      default:
        return <Upload className="h-8 w-8 text-[#999999]" />
    }
  }

  const getScanIcon = () => {
    switch (uploadState.scanStatus) {
      case 'clean':
        return <Shield className="h-4 w-4 text-[#10B981]" />
      case 'suspect':
        return <AlertTriangle className="h-4 w-4 text-[#FF2D78]" />
      case 'scanning':
        return <Loader2 className="h-4 w-4 animate-spin text-[#6B8CAE]" />
      default:
        return null
    }
  }

  const getScanStatusLabel = () => {
    switch (uploadState.scanStatus) {
      case 'clean': return 'Scan propre'
      case 'suspect': return 'Suspect'
      case 'scanning': return 'Analyse...'
      case 'skipped': return 'Scan ignoré'
      case 'error': return 'Erreur scan'
      default: return ''
    }
  }

  const borderColor = uploadState.status === 'error' ? 'border-red-300' :
                     uploadState.status === 'success' ? 'border-green-300' :
                     isDragOver ? 'border-primary' :
                     'border-[#EEEEEE]'

  const bgColor = uploadState.status === 'error' ? 'bg-[#FFE0EF]' :
                  uploadState.status === 'success' ? 'bg-[#ECFDF5]' :
                  isDragOver ? 'bg-[#E0EBF5]' :
                  'bg-[#FAF8F5]'

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Zone de drop */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
          transition-all duration-200 min-h-[160px] flex flex-col items-center justify-center
          ${borderColor} ${bgColor}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          hover:${!disabled ? 'border-primary bg-[#E0EBF5]' : ''}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,.heif"
          onChange={(e) => handleFileSelect(e.target.files)}
          disabled={disabled || uploadState.status === 'uploading'}
        />

        {/* Icône et statut */}
        <div className="mb-4">
          {getStatusIcon()}
        </div>

        {/* Texte principal */}
        <div className="space-y-2">
          {uploadState.status === 'idle' ? (
            <>
              <p className="text-sm font-medium text-[#3A3A3A]">
                {DOCUMENT_TYPE_LABELS[docType]}
              </p>
              <p className="text-xs text-[#777777]">
                Glissez-déposez ou cliquez pour sélectionner
              </p>
              <p className="text-xs text-[#999999]">
                PDF, JPEG, PNG, WEBP (max 10MB)
              </p>
            </>
          ) : uploadState.status === 'uploading' ? (
            <>
              <p className="text-sm font-medium text-[#3A3A3A]">
                Upload en cours...
              </p>
              <p className="text-xs text-[#777777]">
                {uploadState.file?.name}
              </p>
            </>
          ) : uploadState.status === 'success' ? (
            <>
              <p className="text-sm font-medium text-[#10B981]">
                Upload réussi
              </p>
              <p className="text-xs text-[#777777]">
                {uploadState.file?.name}
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-[#FF2D78]">
                Erreur
              </p>
              <p className="text-xs text-[#FF2D78]">
                {uploadState.error}
              </p>
            </>
          )}
        </div>

        {/* Barre de progression */}
        {uploadState.status === 'uploading' && (
          <div className="w-full bg-[#EEEEEE] rounded-full h-2 mt-4">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadState.progress}%` }}
            />
          </div>
        )}
      </div>

      {/* Détails et statuts */}
      {uploadState.status !== 'idle' && (
        <div className="space-y-2">
          {/* Scan antivirus */}
          {uploadState.scanStatus && uploadState.scanStatus !== 'scanning' && (
            <div className="flex items-center gap-2 text-xs">
              {getScanIcon()}
              <span className="text-[#777777]">{getScanStatusLabel()}</span>
            </div>
          )}

          {/* Score de confiance */}
          {uploadState.confidenceScore !== undefined && (
            <div className="flex items-center gap-2 text-xs">
              <div className="w-4 h-4 rounded bg-[#EEEEEE] flex items-center justify-center">
                <span className="text-[10px] font-bold">
                  {uploadState.confidenceScore}
                </span>
              </div>
              <span className="text-[#777777]">
                Score de confiance: {uploadState.confidenceScore}%
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            {uploadState.status === 'success' && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  resetUpload()
                }}
                className="text-xs text-primary hover:text-accent font-medium"
              >
                Remplacer
              </button>
            )}

            {uploadState.status === 'error' && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  resetUpload()
                }}
                className="text-xs text-primary hover:text-accent font-medium"
              >
                Réessayer
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}