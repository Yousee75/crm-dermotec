// ============================================================
// Types CONTACTS — Client (entreprise) vs Apprenant (personne)
// ============================================================

// Un CLIENT est une entreprise/institut qui envoie des personnes en formation
export interface Client {
  id: string
  // Identité entreprise
  raison_sociale: string
  siret?: string
  siren?: string
  code_ape?: string
  forme_juridique?: string
  // Contact principal
  contact_nom: string
  contact_prenom: string
  contact_email: string
  contact_telephone?: string
  contact_poste?: string
  // Adresse
  adresse?: string
  code_postal?: string
  ville?: string
  // Commercial
  commercial_assigne_id?: string
  // Financement
  opco?: string // OPCO de rattachement
  convention_collective?: string
  // Metadata
  tags: string[]
  notes?: string
  ca_total: number // CA généré par ce client
  nb_apprenants_total: number
  // Soft delete
  deleted_at?: string
  deleted_by?: string
  delete_reason?: string
  created_at: string
  updated_at: string
}

// Un APPRENANT est une personne physique qui suit une formation
export interface Apprenant {
  id: string
  // Identité
  civilite?: string
  prenom: string
  nom: string
  email?: string
  telephone?: string
  date_naissance?: string
  // Lien avec le client (entreprise qui l'envoie)
  client_id?: string // FK → clients
  client?: Client    // joined
  // Profil
  statut_pro: string // salarié, indépendant, demandeur emploi...
  poste?: string
  // Formation
  niveau_initial?: string
  objectifs?: string
  formations_suivies: string[] // IDs des inscriptions
  // Suivi
  nps_score?: number
  avis_google?: boolean
  certificats: string[]
  // Soft delete
  deleted_at?: string
  deleted_by?: string
  delete_reason?: string
  created_at: string
  updated_at: string
}