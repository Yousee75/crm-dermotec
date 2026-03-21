// ============================================================
// CRM DERMOTEC — API Upload sécurisé de documents
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabase } from '@/lib/supabase-server'
import {
  validateFileType,
  validateFileSize,
  scanWithVirusTotal,
  calculateDocumentConfidence,
  ALLOWED_MIME_TYPES,
  BLOCKED_EXTENSIONS,
  MAX_FILE_SIZE
} from '@/lib/document-verification'
import type { TypeDocument } from '@/types'

export const dynamic = 'force-dynamic'

interface UploadResult {
  success: boolean
  document_id?: string
  scan_status?: 'clean' | 'suspect' | 'scanning' | 'skipped'
  confidence_score?: number
  error?: string
  details?: {
    file_size_mb: number
    detected_type: string
    storage_path: string
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<UploadResult>> {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const leadId = formData.get('leadId') as string
    const docType = formData.get('docType') as TypeDocument
    const financementId = formData.get('financementId') as string | null
    const description = formData.get('description') as string | null

    // Validation des paramètres
    if (!file || !leadId || !docType) {
      return NextResponse.json({
        success: false,
        error: 'Paramètres manquants: file, leadId et docType requis'
      }, { status: 400 })
    }

    // Validation du type de fichier côté serveur
    const fileBuffer = await file.arrayBuffer()
    const fileValidation = validateFileType(fileBuffer, file.name)

    if (!fileValidation.valid) {
      return NextResponse.json({
        success: false,
        error: `Type de fichier non autorisé: ${fileValidation.detectedType}. Formats acceptés: PDF, JPEG, PNG, WEBP`
      }, { status: 400 })
    }

    // Validation de la taille
    const sizeValidation = validateFileSize(file.size)
    if (!sizeValidation.valid) {
      return NextResponse.json({
        success: false,
        error: `Fichier trop volumineux: ${sizeValidation.sizeMB}MB (maximum: ${sizeValidation.maxMB}MB)`
      }, { status: 400 })
    }

    // Vérification extension bloquée
    const hasBlockedExtension = BLOCKED_EXTENSIONS.some(ext =>
      file.name.toLowerCase().endsWith(ext)
    )
    if (hasBlockedExtension) {
      return NextResponse.json({
        success: false,
        error: 'Extension de fichier non autorisée'
      }, { status: 400 })
    }

    const supabase = await createServiceSupabase()

    // Authentification obligatoire — recuperer l'utilisateur connecte
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({
        success: false,
        error: 'Authentification requise'
      }, { status: 401 })
    }

    // Génération du chemin de stockage
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const safeFilename = file.name
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .substring(0, 100) // Limite la longueur
    const storagePath = `${leadId}/${docType}/${timestamp}_${safeFilename}`

    // Upload vers Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(storagePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
        cacheControl: '3600'
      })

    if (uploadError) {
      console.error('Supabase upload error:', uploadError)
      return NextResponse.json({
        success: false,
        error: 'Erreur lors de l\'upload du fichier'
      }, { status: 500 })
    }

    // Scan antivirus si clé API disponible
    let scanResult: { clean: boolean; skipped: boolean } = { clean: true, skipped: true }
    let scanStatus: 'clean' | 'suspect' | 'scanning' | 'skipped' = 'skipped'

    if (process.env.VIRUSTOTAL_API_KEY) {
      try {
        const result = await scanWithVirusTotal(fileBuffer, process.env.VIRUSTOTAL_API_KEY)
        scanResult = { clean: result.clean, skipped: result.skipped ?? false }
        scanStatus = scanResult.clean ? 'clean' : 'suspect'
      } catch (error) {
        console.error('VirusTotal scan error:', error)
        scanStatus = 'skipped'
      }
    }

    // Calcul du score de confiance
    const confidenceScore = calculateDocumentConfidence({
      formatValid: fileValidation.valid,
      sizeOK: sizeValidation.valid,
      virusClean: scanResult.clean,
      siretValid: undefined // Sera calculé plus tard si nécessaire
    })

    // Insertion en base de données
    const { data: documentData, error: dbError } = await (supabase as any)
      .from('documents')
      .insert({
        lead_id: leadId,
        financement_id: financementId,
        type: docType,
        filename: file.name,
        storage_path: storagePath,
        file_size: file.size,
        mime_type: file.type,
        description: description,
        is_signed: false,
        uploaded_by: user.id,
        created_at: new Date().toISOString()
      })
      .select('id')
      .single()

    if (dbError) {
      console.error('Database insert error:', dbError)

      // Cleanup: supprimer le fichier uploadé en cas d'erreur DB
      await supabase.storage
        .from('documents')
        .remove([storagePath])

      return NextResponse.json({
        success: false,
        error: 'Erreur lors de l\'enregistrement en base de données'
      }, { status: 500 })
    }

    // Log de l'activité
    try {
      await (supabase as any)
        .from('activites')
        .insert({
          type: 'DOCUMENT',
          lead_id: leadId,
          description: `Document uploadé: ${file.name} (${docType})`,
          metadata: {
            document_id: documentData.id,
            document_type: docType,
            file_size: file.size,
            scan_status: scanStatus,
            confidence_score: confidenceScore
          },
          created_at: new Date().toISOString()
        })
    } catch (logError) {
      console.error('Activity log error:', logError)
      // Ne pas faire échouer l'upload pour un problème de log
    }

    // Mise à jour de la checklist financement si applicable
    if (financementId) {
      try {
        // Récupérer le financement actuel
        const { data: financement } = await (supabase as any)
          .from('financements')
          .select('checklist, documents')
          .eq('id', financementId)
          .single()

        if (financement) {
          // Mettre à jour la checklist ou le statut des documents
          const updatedDocuments = financement.documents || []
          const existingDocIndex = updatedDocuments.findIndex(
            (doc: any) => doc.nom === docType
          )

          if (existingDocIndex >= 0) {
            updatedDocuments[existingDocIndex] = {
              ...updatedDocuments[existingDocIndex],
              statut: 'fourni',
              date_upload: new Date().toISOString(),
              url: storagePath
            }
          } else {
            updatedDocuments.push({
              nom: docType,
              statut: 'fourni',
              date_upload: new Date().toISOString(),
              url: storagePath
            })
          }

          await (supabase as any)
            .from('financements')
            .update({ documents: updatedDocuments })
            .eq('id', financementId)
        }
      } catch (financeError) {
        console.error('Financement update error:', financeError)
        // Ne pas faire échouer l'upload
      }
    }

    return NextResponse.json({
      success: true,
      document_id: documentData.id,
      scan_status: scanStatus,
      confidence_score: confidenceScore,
      details: {
        file_size_mb: sizeValidation.sizeMB,
        detected_type: fileValidation.detectedType,
        storage_path: storagePath
      }
    })

  } catch (error) {
    console.error('Upload route error:', error)
    return NextResponse.json({
      success: false,
      error: 'Erreur serveur lors de l\'upload'
    }, { status: 500 })
  }
}

// Méthode GET pour récupérer les documents d'un lead
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const leadId = searchParams.get('leadId')
    const financementId = searchParams.get('financementId')

    if (!leadId && !financementId) {
      return NextResponse.json({
        error: 'leadId ou financementId requis'
      }, { status: 400 })
    }

    const supabase = await createServiceSupabase()

    let query = supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false })

    if (leadId) {
      query = query.eq('lead_id', leadId)
    }

    if (financementId) {
      query = query.eq('financement_id', financementId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Documents fetch error:', error)
      return NextResponse.json({
        error: 'Erreur lors de la récupération des documents'
      }, { status: 500 })
    }

    return NextResponse.json(data)

  } catch (error) {
    console.error('GET documents error:', error)
    return NextResponse.json({
      error: 'Erreur serveur'
    }, { status: 500 })
  }
}