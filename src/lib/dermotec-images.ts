// ============================================================
// IMAGES DERMOTEC — Assets visuels réels du centre de formation
// Source : dermotec.fr (scraped + branding analysis)
// ============================================================

/**
 * Mapping des images de formations vers les slugs du CRM
 * Toutes les images sont dans /public/images/
 */
export const FORMATION_IMAGES: Record<string, string> = {
  // Dermo-Esthétique
  'hygiene-salubrite': '/images/formations/nanoneedling.jpg', // Photo proche du médical
  'maquillage-permanent-initiation': '/images/formations/maquillage-permanent.jpg',
  'maquillage-permanent-complet': '/images/formations/maquillage-permanent.jpg',
  'microblading': '/images/formations/microblading.jpg',
  'microblading-microshading': '/images/formations/microblading.jpg',
  'full-lips': '/images/formations/lips.jpg',
  'candy-lips-lip-blush': '/images/formations/lips.jpg',
  'eyeliner-lash-liner': '/images/formations/maquillage-permanent.jpg',
  'dermopigmentation-reparatrice': '/images/formations/areole.jpg',
  'tricopigmentation': '/images/formations/tricopigmentation.png',
  'tricopigmentation-hfs': '/images/formations/tricopigmentation.png',
  'areole-mammaire': '/images/formations/areole.jpg',
  'detatouage-sans-laser': '/images/formations/detatouage.png',

  // Soins Visage
  'nanoneedling-bb-glow': '/images/formations/nanoneedling.jpg',
  'nanoneedling': '/images/formations/nanoneedling.jpg',
  'peeling-chimique': '/images/formations/peeling.jpg',
  'peeling-dermaplaning': '/images/formations/peeling.jpg',
  'soin-visage-allin1': '/images/formations/peeling.jpg',
  'browlift': '/images/formations/browlift.png',
  'browlift-rehaussement': '/images/formations/browlift.png',
  'extension-cils': '/images/formations/cils.png',
  'extension-cils-volume-russe': '/images/formations/cils.png',
  'blanchiment-dentaire': '/images/formations/blanchiment.png',
  'fil-collagene': '/images/formations/collagene.png',

  // Soins Corps
  'lipocavitation-radiofrequence': '/images/formations/lipocavitation.jpg',
  'lifting-colombien': '/images/formations/lifting.jpg',
  'maderotherapie': '/images/formations/maderotherapie.jpg',
  'drainage-lymphatique': '/images/formations/drainage.jpg',
  'hifu': '/images/formations/lipocavitation.jpg',

  // Laser
  'laser-ipl-epilation': '/images/formations/epilation.png',
  'detatouage-carbon-peel': '/images/formations/detatouage.png',

  // Masterclass
  'masterclass-hfs': '/images/formations/masterclass.jpg',
}

/**
 * Logos des organismes financeurs (vrais logos depuis dermotec.fr)
 */
export const ORGANISME_LOGOS: Record<string, string> = {
  'opco-ep': '/images/partners/opco-ep.png',
  'akto': '/images/partners/akto.png',
  'fafcea': '/images/partners/fafcea.jpg',
  'fifpl': '/images/partners/fifpl.png',
  'agefiph': '/images/partners/agefiph.jpg',
  'npm': '/images/partners/npm-certified.png',
}

/**
 * Photos de l'équipe formatrices
 */
export const TEAM_IMAGES = {
  formatrice1: '/images/team/formatrice-1.png',
  formatrice2: '/images/team/formatrice-2.png',
  formatrice3: '/images/team/formatrice-3.png',
}

/**
 * Produits NPM
 */
export const PRODUCT_IMAGES = {
  glow: '/images/products/glow.png',
  glowLogo: '/images/products/glow-logo.png',
  oronLogo: '/images/products/oron-logo.jpg',
}

/**
 * Images hero / banners
 */
export const HERO_IMAGES = {
  accessoires: '/images/hero-accessoires.jpg',
  pigments: '/images/hero-pigments.jpg',
}

/**
 * Branding officiel extrait de dermotec.fr (via Firecrawl branding analysis)
 */
export const DERMOTEC_BRANDING = {
  colors: {
    primary: '#082545',     // Bleu nuit (confirmé par le site)
    accent: '#2EC6F3',      // Bleu Dermotec (confirmé)
    background: '#FFFFFF',
    textPrimary: '#000000',
    link: '#2EC6F3',
  },
  fonts: {
    heading: 'Montserrat',  // Sur le site : Montserrat pour les headings
    body: 'Outfit',         // Sur le site : Outfit pour le body
    // Dans le CRM on utilise Bricolage Grotesque + DM Sans (choix CRM)
  },
  typography: {
    h1: '40px',
    h2: '36px',
    body: '16px',
  },
  personality: {
    tone: 'professional',
    energy: 'medium',
    targetAudience: 'beauty professionals',
  },
  logo: '/logo-dermotec.png',
  favicon: '/favicon.jpeg',
}

/**
 * Helper : obtenir l'image d'une formation par son slug
 * Retourne une image par défaut si le slug n'est pas trouvé
 */
export function getFormationImage(slug: string): string {
  return FORMATION_IMAGES[slug] || '/images/formations/maquillage-permanent.jpg'
}

/**
 * Helper : obtenir le logo d'un organisme financeur
 * Retourne null si pas de logo disponible
 */
export function getOrganismeLogo(organismeId: string): string | null {
  return ORGANISME_LOGOS[organismeId] || null
}
