import 'server-only'
/**
 * Module de scraping pour données financières d'entreprises
 * Sources: Societe.com, Verif.com, API Annuaire Entreprises
 */

// Types pour les données extraites
export interface SocieteData {
  siren: string;
  nom: string;
  ca?: number; // Chiffre d'affaires en euros
  resultatNet?: number;
  effectif?: number;
  capitalSocial?: number;
  dateCreation?: string;
  formeJuridique?: string;
  dirigeants?: string[];
  adresse?: string;
  source: 'societe.com';
}

export interface VerifData {
  siren: string;
  nom: string;
  scoreSolvabilite?: number; // Sur 20
  effectif?: number;
  ca?: number;
  adresse?: string;
  source: 'verif.com';
}

export interface AnnuaireData {
  siren: string;
  nom: string;
  natureJuridique?: string;
  trancheEffectif?: string;
  nombreEtablissements?: number;
  certifications?: {
    qualiopi?: boolean;
    rge?: boolean;
    bio?: boolean;
  };
  adresse?: string;
  source: 'annuaire-entreprises';
}

// Configuration Bright Data
const BRIGHTDATA_CONFIG = {
  apiUrl: 'https://api.brightdata.com/request',
  apiKey: process.env.BRIGHTDATA_API_KEY,
  zone: process.env.BRIGHTDATA_WEB_UNLOCKER_ZONE || 'web_unlocker1',
  country: 'fr',
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 2000,
};

// Utilitaires
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function cleanNumber(str: string): number | undefined {
  if (!str) return undefined;

  // Nettoie les espaces et caractères non numériques
  const cleaned = str.replace(/[^\d,.-]/g, '').replace(/\s/g, '');
  const number = parseFloat(cleaned.replace(',', '.'));

  return isNaN(number) ? undefined : number;
}

function generateSlug(nom: string): string {
  return nom
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// Scraping avec Bright Data
async function scrapePage(url: string, signal?: AbortSignal): Promise<string> {
  if (!BRIGHTDATA_CONFIG.apiKey) {
    throw new Error('BRIGHTDATA_API_KEY manquante');
  }

  const payload = {
    zone: BRIGHTDATA_CONFIG.zone,
    url,
    format: 'raw',
    country: BRIGHTDATA_CONFIG.country,
  };

  for (let attempt = 1; attempt <= BRIGHTDATA_CONFIG.retryAttempts; attempt++) {
    try {
      const response = await fetch(BRIGHTDATA_CONFIG.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${BRIGHTDATA_CONFIG.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.text();
    } catch (error) {
      console.error(`Tentative ${attempt}/${BRIGHTDATA_CONFIG.retryAttempts} échouée pour ${url}:`, error);

      if (attempt === BRIGHTDATA_CONFIG.retryAttempts) {
        throw error;
      }

      await delay(BRIGHTDATA_CONFIG.retryDelay * attempt);
    }
  }

  throw new Error('Toutes les tentatives ont échoué');
}

// Parsers HTML
function parseSocieteHTML(html: string, siren: string): SocieteData {
  const data: SocieteData = {
    siren,
    nom: '',
    source: 'societe.com',
  };

  try {
    // Nom de l'entreprise
    const nomMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    if (nomMatch) {
      data.nom = nomMatch[1].trim();
    }

    // Chiffre d'affaires
    const caMatch = html.match(/Chiffre d'affaires[\s\S]*?(\d[\d\s]*)\s*€/i);
    if (caMatch) {
      data.ca = cleanNumber(caMatch[1]);
    }

    // Résultat net
    const resultatMatch = html.match(/Résultat net[\s\S]*?(\d[\d\s]*)\s*€/i);
    if (resultatMatch) {
      data.resultatNet = cleanNumber(resultatMatch[1]);
    }

    // Effectif
    const effectifMatch = html.match(/Effectif[\s\S]*?(\d+)\s*(?:salarié|employé)/i);
    if (effectifMatch) {
      data.effectif = parseInt(effectifMatch[1], 10);
    }

    // Capital social
    const capitalMatch = html.match(/Capital social[\s\S]*?(\d[\d\s]*)\s*€/i);
    if (capitalMatch) {
      data.capitalSocial = cleanNumber(capitalMatch[1]);
    }

    // Forme juridique
    const formeMatch = html.match(/Forme juridique[\s\S]*?([A-Z]{2,10})/i);
    if (formeMatch) {
      data.formeJuridique = formeMatch[1].trim();
    }

    // Date de création
    const dateMatch = html.match(/Date de création[\s\S]*?(\d{2}\/\d{2}\/\d{4})/i);
    if (dateMatch) {
      data.dateCreation = dateMatch[1];
    }

    // Dirigeants (extraction simplifiée)
    const dirigeantsMatches = html.match(/dirigeant[\s\S]*?([A-Z][a-z]+\s+[A-Z][a-z]+)/gi);
    if (dirigeantsMatches) {
      data.dirigeants = dirigeantsMatches
        .map(match => match.replace(/dirigeant[\s\S]*?/i, '').trim())
        .filter(Boolean)
        .slice(0, 3); // Limite à 3 dirigeants
    }

    // Adresse
    const adresseMatch = html.match(/Adresse[\s\S]*?<div[^>]*>([^<]+)<\/div>/i);
    if (adresseMatch) {
      data.adresse = adresseMatch[1].trim();
    }
  } catch (error) {
    console.error('Erreur lors du parsing Societe.com:', error);
  }

  return data;
}

function parseVerifHTML(html: string, siren: string): VerifData {
  const data: VerifData = {
    siren,
    nom: '',
    source: 'verif.com',
  };

  try {
    // Nom de l'entreprise
    const nomMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    if (nomMatch) {
      data.nom = nomMatch[1].trim();
    }

    // Score de solvabilité
    const scoreMatch = html.match(/Score de solvabilité[\s\S]*?(\d+)\s*\/\s*20/i);
    if (scoreMatch) {
      data.scoreSolvabilite = parseInt(scoreMatch[1], 10);
    }

    // Effectif
    const effectifMatch = html.match(/(\d+)\s*(?:salarié|employé)/i);
    if (effectifMatch) {
      data.effectif = parseInt(effectifMatch[1], 10);
    }

    // Chiffre d'affaires
    const caMatch = html.match(/(\d[\d\s.,]*)\s*(?:€|EUR)/i);
    if (caMatch) {
      data.ca = cleanNumber(caMatch[1]);
    }

    // Adresse
    const adresseMatch = html.match(/Adresse[\s\S]*?<div[^>]*>([^<]+)<\/div>/i);
    if (adresseMatch) {
      data.adresse = adresseMatch[1].trim();
    }
  } catch (error) {
    console.error('Erreur lors du parsing Verif.com:', error);
  }

  return data;
}

// API Annuaire Entreprises
async function fetchAnnuaireAPI(siren: string, signal?: AbortSignal): Promise<any> {
  const url = `https://recherche-entreprises.api.gouv.fr/search?q=${siren}`;

  const response = await fetch(url, { signal });

  if (!response.ok) {
    throw new Error(`API Annuaire: HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.results?.[0] || null;
}

// Fonctions publiques d'export
export async function fetchSocieteData(siren: string): Promise<SocieteData> {
  const signal = AbortSignal.timeout(BRIGHTDATA_CONFIG.timeout);

  try {
    // Génère l'URL Societe.com (besoin du nom pour le slug)
    // On essaie d'abord l'API gratuite pour avoir le nom
    let nomSlug = '';
    try {
      const annuaireResult = await fetchAnnuaireAPI(siren, signal);
      if (annuaireResult?.nom_raison_sociale) {
        nomSlug = generateSlug(annuaireResult.nom_raison_sociale);
      }
    } catch {
      // Si l'API gratuite échoue, on utilise le SIREN comme fallback
      nomSlug = siren;
    }

    const url = `https://www.societe.com/societe/${nomSlug}-${siren}.html`;
    // Scraping Societe.com

    const html = await scrapePage(url, signal);
    return parseSocieteHTML(html, siren);
  } catch (error) {
    console.error(`Erreur fetchSocieteData pour SIREN ${siren}:`, error);
    throw error;
  }
}

export async function fetchVerifData(siren: string): Promise<VerifData> {
  const signal = AbortSignal.timeout(BRIGHTDATA_CONFIG.timeout);

  try {
    // Récupère le nom via l'API gratuite
    let nomUpper = '';
    try {
      const annuaireResult = await fetchAnnuaireAPI(siren, signal);
      if (annuaireResult?.nom_raison_sociale) {
        nomUpper = annuaireResult.nom_raison_sociale.toUpperCase();
      }
    } catch {
      nomUpper = 'ENTREPRISE';
    }

    const url = `https://www.verif.com/societe/${nomUpper}-${siren}/`;
    // Scraping Verif.com

    const html = await scrapePage(url, signal);
    return parseVerifHTML(html, siren);
  } catch (error) {
    console.error(`Erreur fetchVerifData pour SIREN ${siren}:`, error);
    throw error;
  }
}

export async function fetchAnnuaireData(siren: string): Promise<AnnuaireData> {
  const signal = AbortSignal.timeout(BRIGHTDATA_CONFIG.timeout);

  try {
    // Requête API Annuaire Entreprises

    const result = await fetchAnnuaireAPI(siren, signal);

    if (!result) {
      throw new Error(`Aucune entreprise trouvée pour le SIREN ${siren}`);
    }

    const data: AnnuaireData = {
      siren,
      nom: result.nom_raison_sociale || '',
      natureJuridique: result.nature_juridique,
      trancheEffectif: result.tranche_effectif_salarie,
      nombreEtablissements: result.nombre_etablissements,
      adresse: result.siege?.adresse || '',
      source: 'annuaire-entreprises',
    };

    // Certifications
    if (result.complements) {
      data.certifications = {
        qualiopi: result.complements.est_qualiopi || false,
        rge: result.complements.est_rge || false,
        bio: result.complements.est_bio || false,
      };
    }

    return data;
  } catch (error) {
    console.error(`Erreur fetchAnnuaireData pour SIREN ${siren}:`, error);
    throw error;
  }
}

// Fonction utilitaire pour récupérer toutes les données
export async function fetchCompanyData(siren: string): Promise<{
  societe?: SocieteData;
  verif?: VerifData;
  annuaire?: AnnuaireData;
  errors: string[];
}> {
  const results = {
    societe: undefined as SocieteData | undefined,
    verif: undefined as VerifData | undefined,
    annuaire: undefined as AnnuaireData | undefined,
    errors: [] as string[],
  };

  // Exécute les 3 requêtes en parallèle
  const promises = [
    fetchSocieteData(siren).then(data => { results.societe = data; }).catch(err => results.errors.push(`Societe.com: ${err.message}`)),
    fetchVerifData(siren).then(data => { results.verif = data; }).catch(err => results.errors.push(`Verif.com: ${err.message}`)),
    fetchAnnuaireData(siren).then(data => { results.annuaire = data; }).catch(err => results.errors.push(`Annuaire: ${err.message}`)),
  ];

  await Promise.allSettled(promises);

  return results;
}