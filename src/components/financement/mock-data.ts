// Mock data pour les fonctionnalités non implémentées
// TODO: Remplacer par de vrais hooks quand les tables seront créées
export const mockFactures: Array<{
  id: string; numero: string; type: string; destinataire: string;
  montantHT: number; tauxTVA: number; montantTTC: number;
  statut: 'brouillon' | 'envoyee' | 'payee'; dateEmission: string;
  dateEcheance: string; dateEnvoi?: string; relances: number;
}> = [
  {
    id: '1',
    numero: 'FAC-2026-0001',
    type: 'facture',
    destinataire: 'OPCO EP',
    montantHT: 1200,
    tauxTVA: 0,
    montantTTC: 1200,
    statut: 'envoyee',
    dateEmission: '2026-03-15',
    dateEcheance: '2026-04-15',
    dateEnvoi: '2026-03-15',
    relances: 0
  },
  {
    id: '2',
    numero: 'FAC-2026-0002',
    type: 'avoir',
    destinataire: 'Stagiaire',
    montantHT: -200,
    tauxTVA: 20,
    montantTTC: -240,
    statut: 'brouillon',
    dateEmission: '2026-03-20',
    dateEcheance: '2026-04-20',
    relances: 0
  }
]

export const mockPaiements = [
  {
    id: '1',
    type: 'financement_organisme',
    moyen: 'virement',
    montant: 1200,
    statut: 'en_attente' as const,
    dateEcheance: '2026-04-15',
    reference: 'VIR-OPCO-2026-1234',
    factureId: '1'
  },
  {
    id: '2',
    type: 'reste_a_charge',
    moyen: 'cb',
    montant: 300,
    statut: 'recu' as const,
    datePaiement: '2026-03-10',
    reference: 'CB-****-1234'
  }
]

export const mockDocuments = [
  {
    id: '1',
    nom: 'Devis formation',
    type: 'pdf',
    statut: 'valide' as const,
    dateUpload: '2026-03-01',
    etapeRequise: 'QUALIFICATION',
    obligatoire: true
  },
  {
    id: '2',
    nom: 'Programme pédagogique',
    type: 'pdf',
    statut: 'valide' as const,
    dateUpload: '2026-03-02',
    etapeRequise: 'QUALIFICATION',
    obligatoire: true
  },
  {
    id: '3',
    nom: 'Attestation URSSAF',
    type: 'pdf',
    statut: 'en_attente' as const,
    dateUpload: '2026-03-03',
    etapeRequise: 'COLLECTE_DOCS',
    obligatoire: true
  }
]

export const mockActivites = [
  {
    id: '1',
    date: '2026-03-22T10:30:00Z',
    utilisateur: 'Sophie Martin',
    action: 'Commentaire' as const,
    description: 'Dossier prêt pour instruction',
    details: 'Tous les documents requis ont été fournis et validés'
  },
  {
    id: '2',
    date: '2026-03-21T14:15:00Z',
    utilisateur: 'Système',
    action: 'Changement étape' as const,
    description: 'Qualification → Collecte docs',
    details: 'Transition automatique après validation'
  },
  {
    id: '3',
    date: '2026-03-20T09:45:00Z',
    utilisateur: 'Thomas Martin',
    action: 'Document' as const,
    description: 'Attestation URSSAF uploadée',
    details: 'Fichier: attestation_urssaf_2026.pdf'
  },
  {
    id: '4',
    date: '2026-03-19T16:20:00Z',
    utilisateur: 'Marine Durand',
    action: 'Modification' as const,
    description: 'Montant demandé: 1 200€ → 1 500€',
    details: 'Mise à jour suite à discussion client'
  }
]