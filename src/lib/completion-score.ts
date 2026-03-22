/**
 * Calcule le score de complétude (0-100%) d'un profil concurrent
 * basé sur le nombre de champs remplis avec pondération par catégorie
 */

// Définition des groupes de champs avec leurs poids
const FIELD_GROUPS = {
  IDENTITY: {
    weight: 25,
    fields: {
      nom: 5,
      siret: 3,
      adresse: 4,
      ville: 3,
      telephone: 5,
      email: 3,
      code_ape: 2,
    },
  },
  DIGITAL: {
    weight: 25,
    fields: {
      website: 5,
      google_rating: 5,
      google_reviews_count: 3,
      google_place_id: 2,
      instagram_username: 4,
      instagram_followers: 3,
      facebook_url: 3,
    },
  },
  FINANCIAL: {
    weight: 20,
    fields: {
      ca_dernier: 6,
      resultat_net: 4,
      capital_social: 3,
      effectif: 4,
      forme_juridique: 3,
    },
  },
  PLATFORMS: {
    weight: 15,
    fields: {
      pj_rating: 4,
      pj_reviews_count: 3,
      planity_found: 4,
      treatwell_found: 4,
    },
  },
  AI_ANALYSIS: {
    weight: 15,
    fields: {
      ai_analysis_description: 5,
      ai_analysis_scores: 5,
      ai_analysis_services: 5,
    },
  },
} as const;

// Messages de suggestions par champ manquant
const SUGGESTIONS_MAP: Record<string, string> = {
  // IDENTITY
  nom: "Vérifiez le nom complet de l'entreprise",
  siret: "Recherchez le SIRET sur l'annuaire des entreprises",
  adresse: "Complétez l'adresse physique de l'établissement",
  ville: "Ajoutez la ville du siège social",
  telephone: "Trouvez le numéro de téléphone principal",
  email: "Recherchez l'email de contact sur le site web",
  code_ape: "Consultez l'INSEE pour le code APE/NAF",

  // DIGITAL
  website: "Recherchez le site web sur Google",
  google_rating: "Trouvez la fiche Google My Business",
  google_reviews_count: "Récupérez le nombre d'avis Google",
  google_place_id: "Obtenez l'ID de lieu Google Places",
  instagram_username: "Scrapez le site web pour trouver l'Instagram",
  instagram_followers: "Analysez le compte Instagram",
  facebook_url: "Recherchez la page Facebook",

  // FINANCIAL
  ca_dernier: "Consultez Pappers pour les données financières",
  resultat_net: "Analysez les comptes de résultat",
  capital_social: "Vérifiez le capital social déclaré",
  effectif: "Estimez le nombre de salariés",
  forme_juridique: "Identifiez la forme juridique (SARL, SAS...)",

  // PLATFORMS
  pj_rating: "Scrapez PagesJaunes pour la note",
  pj_reviews_count: "Comptez les avis PagesJaunes",
  planity_found: "Vérifiez la présence sur Planity",
  treatwell_found: "Recherchez sur Treatwell/Wahanda",

  // AI_ANALYSIS
  ai_analysis_description: "Lancez l'analyse IA pour enrichir la fiche",
  ai_analysis_scores: "Générez les scores IA de performance",
  ai_analysis_services: "Identifiez les services proposés via IA",
};

/**
 * Vérifie si un champ est rempli selon son type
 */
function isFieldFilled(value: unknown, fieldName: string): boolean {
  // Cas spéciaux pour ai_analysis
  if (fieldName === 'ai_analysis_description') {
    return typeof value === 'object' && value !== null &&
           typeof (value as any).description === 'string' &&
           (value as any).description.length > 0;
  }

  if (fieldName === 'ai_analysis_scores') {
    return typeof value === 'object' && value !== null &&
           typeof (value as any).scores === 'object' &&
           (value as any).scores !== null &&
           Object.keys((value as any).scores).length > 0;
  }

  if (fieldName === 'ai_analysis_services') {
    return typeof value === 'object' && value !== null &&
           Array.isArray((value as any).services) &&
           (value as any).services.length > 0;
  }

  // Cas général
  if (value === null || value === undefined) return false;

  // String
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }

  // Number
  if (typeof value === 'number') {
    return value > 0;
  }

  // Boolean (pour planity_found, treatwell_found)
  if (typeof value === 'boolean') {
    return value === true;
  }

  // Array/JSONB
  if (Array.isArray(value)) {
    return value.length > 0;
  }

  // Object
  if (typeof value === 'object') {
    return Object.keys(value).length > 0;
  }

  return false;
}

/**
 * Calcule le score de complétude d'un profil concurrent
 */
export function computeCompletionScore(profile: Record<string, unknown>) {
  let totalScore = 0;
  let filledCount = 0;
  let totalCount = 0;
  const missing: string[] = [];
  const suggestions: Array<{ field: string, message: string, gain: number }> = [];
  const byCategory: Record<string, number> = {};

  // Pour chaque catégorie
  for (const [categoryName, categoryData] of Object.entries(FIELD_GROUPS)) {
    let categoryScore = 0;
    let categoryMaxScore = 0;

    // Pour chaque champ de la catégorie
    for (const [fieldName, fieldWeight] of Object.entries(categoryData.fields)) {
      totalCount++;
      categoryMaxScore += fieldWeight;

      // Cas spécial pour ai_analysis - on passe l'objet complet
      const fieldValue = fieldName.startsWith('ai_analysis_')
        ? profile.ai_analysis
        : profile[fieldName];

      if (isFieldFilled(fieldValue, fieldName)) {
        filledCount++;
        categoryScore += fieldWeight;
      } else {
        missing.push(fieldName);
        suggestions.push({
          field: fieldName,
          message: SUGGESTIONS_MAP[fieldName] || `Complétez le champ ${fieldName}`,
          gain: fieldWeight,
        });
      }
    }

    // Score de la catégorie (0-100% de son poids total)
    const categoryPercentage = categoryMaxScore > 0 ? (categoryScore / categoryMaxScore) * 100 : 0;
    byCategory[categoryName] = Math.round(categoryPercentage);

    // Contribution au score global
    totalScore += (categoryScore / categoryMaxScore) * categoryData.weight;
  }

  // Trier les suggestions par gain potentiel décroissant
  suggestions.sort((a, b) => b.gain - a.gain);

  return {
    score: Math.round(totalScore),
    filled: filledCount,
    total: totalCount,
    missing,
    suggestions: suggestions.map(s => `${s.message} (+${s.gain}%)`),
    byCategory,
  };
}

/**
 * Obtient le niveau de complétude textuel
 */
export function getCompletionLevel(score: number): {
  level: string;
  color: string;
  description: string;
} {
  if (score >= 90) {
    return {
      level: 'Excellent',
      color: 'text-green-600',
      description: 'Profil très complet, prêt pour analyse approfondie',
    };
  }

  if (score >= 70) {
    return {
      level: 'Bon',
      color: 'text-blue-600',
      description: 'Profil bien renseigné, quelques données manquantes',
    };
  }

  if (score >= 50) {
    return {
      level: 'Moyen',
      color: 'text-orange-600',
      description: 'Données de base présentes, enrichissement recommandé',
    };
  }

  if (score >= 30) {
    return {
      level: 'Faible',
      color: 'text-red-600',
      description: 'Profil incomplet, scraping nécessaire',
    };
  }

  return {
    level: 'Très faible',
    color: 'text-red-800',
    description: 'Profil minimal, enrichissement urgent requis',
  };
}

/**
 * Types pour TypeScript
 */
export type CompletionScore = ReturnType<typeof computeCompletionScore>;
export type CompletionLevel = ReturnType<typeof getCompletionLevel>;