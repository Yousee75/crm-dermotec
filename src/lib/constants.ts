// ============================================================
// CRM DERMOTEC — Constantes globales
// ============================================================

// Branding Dermotec
export const BRAND = {
  name: 'Dermotec Advanced',
  tagline: 'On vous forme. On vous équipe. On vous lance.',
  phone: '01 88 33 43 43',
  phoneIntl: '+33188334343',
  email: 'dermotec.fr@gmail.com',
  whatsapp: 'https://wa.me/33188334343',
  address: '75 Boulevard Richard Lenoir',
  city: 'Paris',
  zipCode: '75011',
  country: 'France',
  siret: '', // À remplir
  nda: '', // Numéro de déclaration d'activité DIRECCTE
  qualiopi: true,
  website: 'https://www.dermotec.fr',
  googleMaps: 'https://maps.google.com/?q=75+Boulevard+Richard+Lenoir+75011+Paris',
} as const

// Couleurs branding (v2 — optimisées contraste + action)
export const COLORS = {
  primary: '#0EA5E9',      // sky-500 : meilleur contraste que #2EC6F3
  primaryDark: '#0284C7',  // sky-600 : hover
  action: '#6366F1',       // indigo-500 : CTAs distinctes
  accent: '#0F172A',       // slate-900 : sidebar
  background: '#F8FAFC',   // slate-50
  text: '#0F172A',         // slate-900
  textSecondary: '#475569', // slate-600
  success: '#10B981',      // emerald-500
  warning: '#F59E0B',      // amber-500
  error: '#EF4444',        // red-500
  info: '#3B82F6',         // blue-500
  // Brand legacy (pour emails, PDF, éléments marketing)
  brand: '#2EC6F3',
} as const

// Horaires
export const HORAIRES = {
  ouverture: '09:00',
  fermeture: '18:00',
  jours: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'],
  ferme: ['Samedi', 'Dimanche'],
} as const

// Formations — données seed
export const FORMATIONS_SEED = [
  { nom: 'Hygiène et Salubrité', slug: 'hygiene-salubrite', categorie: 'Hygiène' as const, prix_ht: 400, duree_jours: 3, duree_heures: 21, niveau: 'debutant' as const, prerequis: 'Obligatoire pour exercer', description_commerciale: 'Le prérequis légal pour exercer — indispensable, rapide, finançable.' },
  { nom: 'Maquillage Permanent Complet', slug: 'maquillage-permanent', categorie: 'Dermo-Esthétique' as const, prix_ht: 2490, duree_jours: 5, duree_heures: 35, niveau: 'debutant' as const, description_commerciale: 'Maîtrisez les 3 techniques les plus demandées en 5 jours — ROI garanti.' },
  { nom: 'Microblading / Microshading', slug: 'microblading', categorie: 'Dermo-Esthétique' as const, prix_ht: 1400, duree_jours: 2, duree_heures: 14, niveau: 'debutant' as const, description_commerciale: 'La prestation la plus rentable en institut : 200€ la séance, demande explosive.' },
  { nom: 'Full Lips', slug: 'full-lips', categorie: 'Dermo-Esthétique' as const, prix_ht: 1400, duree_jours: 2, duree_heures: 14, niveau: 'debutant' as const, description_commerciale: 'Maîtrisez la pigmentation lèvres — 300€ par séance, tendance 2025.' },
  { nom: 'Tricopigmentation HFS', slug: 'tricopigmentation', categorie: 'Dermo-Esthétique' as const, prix_ht: 2500, duree_jours: 3, duree_heures: 21, niveau: 'intermediaire' as const, description_commerciale: 'Marché calvitie : 500-800€ par séance, clientèle masculine fidèle.' },
  { nom: 'Aréole Mammaire & Cicatrices', slug: 'areole-cicatrices', categorie: 'Dermo-Correctrice' as const, prix_ht: 2300, duree_jours: 3, duree_heures: 21, niveau: 'intermediaire' as const, description_commerciale: 'Dermopigmentation réparatrice — mission humaine, revenus élevés.' },
  { nom: 'Nanoneedling & BB Glow', slug: 'nanoneedling', categorie: 'Soins Visage' as const, prix_ht: 700, duree_jours: 1, duree_heures: 7, niveau: 'debutant' as const, description_commerciale: 'Soin anti-âge 80-120€ — technique simple, résultats immédiats.' },
  { nom: 'Soin Visage ALLin1', slug: 'soin-allin1', categorie: 'Soins Visage' as const, prix_ht: 900, duree_jours: 1, duree_heures: 7, niveau: 'debutant' as const, description_commerciale: 'Soin phare institut 90-150€ — différenciez-vous de la concurrence.' },
  { nom: 'Peeling Chimique & Dermaplaning', slug: 'peeling-dermaplaning', categorie: 'Soins Visage' as const, prix_ht: 990, duree_jours: 1, duree_heures: 7, niveau: 'debutant' as const, description_commerciale: 'Peeling + dermaplaning 120-200€ — transformez tous types de peau.' },
  { nom: 'Détatouage & Carbon Peel', slug: 'detatouage', categorie: 'Laser & IPL' as const, prix_ht: 990, duree_jours: 1, duree_heures: 7, niveau: 'intermediaire' as const, description_commerciale: 'Détatouage laser + carbon peel — marché en pleine croissance.' },
  { nom: 'Épilation Définitive', slug: 'epilation-definitive', categorie: 'Laser & IPL' as const, prix_ht: 990, duree_jours: 1, duree_heures: 7, niveau: 'debutant' as const, description_commerciale: 'Épilation laser — la prestation la plus demandée en institut.' },
]

// Pagination
export const ITEMS_PER_PAGE = 20

// Délais rappels par défaut
export const DELAI_RAPPEL = {
  premier_contact: 1, // jours
  relance_1: 3,
  relance_2: 7,
  relance_3: 14,
  post_formation_j30: 30,
  post_formation_j90: 90,
} as const

// Taux TVA
export const TVA_TAUX = {
  formation: 20, // ou 0 si exonéré art. 261.4.4° CGI
  materiel: 20,
  eshop: 20,
} as const
