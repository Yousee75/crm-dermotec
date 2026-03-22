// ============================================================
// PDF GENERATORS INDEX - CRM Dermotec
// ============================================================

// Export des composants PDF
export { ConvocationPDF, generateConvocationProps } from './convocation'
export { AttestationFinPDF, generateAttestationFinProps } from './attestation-fin'
export { FeuilleEmargementPDF, generateFeuilleEmargementProps } from './feuille-emargement'
export { AttestationAssiduiteePDF, generateAttestationAssiduiteProps } from './attestation-assiduite'
export { BpfPDF, generateBPFProps, calculateBPFStats } from './bpf'

// Constantes utiles
export const PDF_CONSTANTS = {
  // Couleurs de marque
  COLORS: {
    PRIMARY: '#2EC6F3',
    ACCENT: '#082545',
    TEXT_PRIMARY: '#1F2937',
    TEXT_SECONDARY: '#6B7280',
    BACKGROUND: '#FFFFFF',
    BORDER: '#E5E7EB',
  },

  // Informations de l'organisme
  ORGANISME: {
    NOM: 'DERMOTEC ADVANCED',
    ADRESSE: '75 Boulevard Richard Lenoir, 75011 Paris',
    TELEPHONE: '01 88 33 43 43',
    SIRET: '851 306 860 00012',
    TVA_INTRA: 'FR26851306860',
    DECLARATION_ACTIVITE: '11755959875',
    CERTIFICATION: 'Centre de Formation Certifié Qualiopi',
  },

  // Formats de papier
  FORMATS: {
    A4_PORTRAIT: { size: 'A4', orientation: 'portrait' },
    A4_LANDSCAPE: { size: 'A4', orientation: 'landscape' },
  },
} as const