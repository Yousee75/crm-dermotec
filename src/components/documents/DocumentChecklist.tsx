'use client'

import { useState } from 'react'
import {
  CheckCircle,
  Clock,
  XCircle,
  Upload,
  Eye,
  Trash2,
  ShieldAlert,
  FileText
} from 'lucide-react'
import { Document, OrganismeFinancement, ORGANISMES_FINANCEMENT } from '@/types'
import { Badge } from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface DocumentChecklistProps {
  organisme: OrganismeFinancement
  documents: Document[]
  leadId: string
  financementId?: string
  onDocumentUpload?: () => void
}

// Mapping des types de documents requis par organisme
const DOCUMENTS_REQUIS: Record<OrganismeFinancement, string[]> = {
  OPCO_EP: ['piece_identite', 'justificatif_paie', 'convention', 'devis', 'programme', 'formulaire_opco'],
  AKTO: ['piece_identite', 'justificatif_paie', 'convention', 'devis', 'programme', 'formulaire_akto'],
  FAFCEA: ['piece_identite', 'attestation_urssaf', 'convention', 'devis'],
  FIFPL: ['piece_identite', 'attestation_urssaf', 'releve_snir', 'convention'],
  FRANCE_TRAVAIL: ['piece_identite', 'attestation_inscription', 'devis', 'programme', 'lettre_motivation'],
  CPF: ['piece_identite', 'identifiant_cpf'],
  AGEFIPH: ['piece_identite', 'rqth', 'convention', 'devis', 'cv'],
  MISSIONS_LOCALES: ['piece_identite', 'attestation_mission_locale', 'programme'],
  REGION: ['piece_identite', 'justificatif_domicile', 'programme', 'devis'],
  EMPLOYEUR: ['convention', 'programme', 'accord_employeur'],
  TRANSITIONS_PRO: ['piece_identite', 'bulletins_paie_12m', 'bilan_positionnement', 'programme', 'convention', 'lettre_motivation', 'cv'],
  AUTRE: [],
}

// Labels des types de documents
const DOCUMENT_LABELS: Record<string, string> = {
  piece_identite: 'Pièce d\'identité',
  justificatif_paie: 'Bulletin de paie',
  convention: 'Convention de formation',
  devis: 'Devis',
  programme: 'Programme de formation',
  formulaire_opco: 'Formulaire OPCO',
  formulaire_akto: 'Formulaire AKTO',
  attestation_urssaf: 'Attestation URSSAF',
  releve_snir: 'Relevé SNIR',
  attestation_inscription: 'Attestation inscription France Travail',
  lettre_motivation: 'Lettre de motivation',
  identifiant_cpf: 'Identifiant CPF',
  rqth: 'Reconnaissance Qualité Travailleur Handicapé (RQTH)',
  cv: 'Curriculum Vitae',
  attestation_mission_locale: 'Attestation Mission Locale',
  justificatif_domicile: 'Justificatif de domicile',
  accord_employeur: 'Accord employeur',
  bulletins_paie_12m: 'Bulletins de paie (12 derniers mois)',
  bilan_positionnement: 'Bilan de positionnement',
}

export function DocumentChecklist({
  organisme,
  documents,
  leadId,
  financementId,
  onDocumentUpload
}: DocumentChecklistProps) {
  const [uploadingType, setUploadingType] = useState<string | null>(null)

  const organismeInfo = ORGANISMES_FINANCEMENT[organisme]
  const documentsRequis = DOCUMENTS_REQUIS[organisme]

  // Créer un map des documents fournis par type
  const documentsByType = documents.reduce((acc, doc) => {
    acc[doc.type] = doc
    return acc
  }, {} as Record<string, Document>)

  // Calculer le pourcentage de completion
  const documentsComplete = documentsRequis.filter(type => documentsByType[type]).length
  const pourcentageComplete = documentsRequis.length > 0
    ? Math.round((documentsComplete / documentsRequis.length) * 100)
    : 100

  // Vérifier s'il y a des documents suspects
  const documentsSuspects = documents.filter(doc =>
    doc.description?.includes('SUSPECT') || doc.description?.includes('SCAN_SUSPECT')
  )

  const handleFileUpload = async (type: string, file: File) => {
    setUploadingType(type)
    try {
      // Ici vous implémenterez l'upload du fichier
      console.log(`Upload ${file.name} pour ${type}`)
      onDocumentUpload?.()
    } catch (error) {
      console.error('Erreur upload:', error)
    } finally {
      setUploadingType(null)
    }
  }

  const handleDelete = async (documentId: string) => {
    try {
      // Ici vous implémenterez la suppression
      console.log(`Suppression document ${documentId}`)
      onDocumentUpload?.()
    } catch (error) {
      console.error('Erreur suppression:', error)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-accent flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Documents requis — {organismeInfo.label}
          </h3>
          <p className="text-sm text-gray-500 mt-1">{organismeInfo.description}</p>
        </div>

        <div className="text-right">
          <div className="text-2xl font-bold text-accent">{pourcentageComplete}%</div>
          <div className="text-xs text-gray-500">complété</div>
        </div>
      </div>

      {/* Barre de progression */}
      <div className="mb-6">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-primary to-primary-dark h-2 rounded-full transition-all duration-300"
            style={{ width: `${pourcentageComplete}%` }}
          />
        </div>
      </div>

      {/* Alerte documents suspects */}
      {documentsSuspects.length > 0 && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-amber-800">Documents à vérifier</p>
            <p className="text-sm text-amber-700 mt-1">
              {documentsSuspects.length} document(s) marqué(s) comme suspect(s).
              Veuillez les vérifier avant soumission du dossier.
            </p>
          </div>
        </div>
      )}

      {/* Liste des documents */}
      <div className="space-y-4">
        {documentsRequis.map((type) => {
          const document = documentsByType[type]
          const label = DOCUMENT_LABELS[type] || type
          const isUploading = uploadingType === type

          return (
            <div key={type} className={cn(
              "flex items-center justify-between p-4 rounded-lg border transition-all",
              document
                ? "bg-green-50 border-green-200"
                : "bg-gray-50 border-gray-200 hover:border-gray-300"
            )}>
              <div className="flex items-center gap-3">
                {/* Icône de statut */}
                {document ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : isUploading ? (
                  <Clock className="w-5 h-5 text-blue-500 animate-spin" />
                ) : (
                  <XCircle className="w-5 h-5 text-gray-400" />
                )}

                {/* Info document */}
                <div>
                  <p className="font-medium text-gray-900">{label}</p>
                  {document && (
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-sm text-gray-600">{document.filename}</p>
                      <p className="text-xs text-gray-500">·</p>
                      <p className="text-xs text-gray-500">{formatDate(document.created_at)}</p>

                      {/* Badge de scan */}
                      {document.description?.includes('SUSPECT') && (
                        <Badge variant="error" size="sm">SUSPECT</Badge>
                      )}
                      {document.description?.includes('CLEAN') && (
                        <Badge variant="success" size="sm">CLEAN</Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {document ? (
                  <>
                    <button className="flex items-center gap-2 px-3 py-1.5 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition">
                      <Eye className="w-3 h-3" />
                      Voir
                    </button>
                    <button
                      onClick={() => handleDelete(document.id)}
                      className="flex items-center gap-2 px-3 py-1.5 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                    >
                      <Trash2 className="w-3 h-3" />
                      Supprimer
                    </button>
                  </>
                ) : (
                  <label className={cn(
                    "flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg cursor-pointer transition",
                    isUploading
                      ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                      : "bg-primary text-white hover:bg-primary-dark"
                  )}>
                    {isUploading ? (
                      <Clock className="w-3 h-3 animate-spin" />
                    ) : (
                      <Upload className="w-3 h-3" />
                    )}
                    {isUploading ? 'Upload...' : 'Uploader'}
                    <input
                      type="file"
                      className="hidden"
                      disabled={isUploading}
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          handleFileUpload(type, file)
                        }
                      }}
                    />
                  </label>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Badge de statut global */}
      <div className="mt-6 pt-6 border-t border-gray-100 flex justify-center">
        {pourcentageComplete === 100 ? (
          <Badge variant="success" size="lg" dot>
            Dossier complet
          </Badge>
        ) : (
          <Badge variant="warning" size="lg" dot>
            {documentsRequis.length - documentsComplete} document(s) manquant(s)
          </Badge>
        )}
      </div>
    </div>
  )
}