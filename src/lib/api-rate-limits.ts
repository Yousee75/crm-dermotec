import 'server-only'
// ============================================================
// CRM SATOREA — Référence Rate Limits & Paramètres Optimaux
// Chaque API utilisée par l'enrichissement est documentée ici.
// Ce fichier sert de source unique de vérité pour les limites.
// ============================================================

// ============================================================
// 1. GOOGLE PLACES API
// ============================================================
export const GOOGLE_PLACES = {
  // Rate limits officiels (Standard SKU)
  limits: {
    qps: 100,                     // 100 queries par seconde (par projet)
    daily: Infinity,              // Pas de limite quotidienne hard (Pay-as-you-go)
    monthly_free_credit: 200_00,  // $200 crédit gratuit/mois
  },

  // Coûts par 1000 requêtes (SKU pricing 2025)
  costs: {
    text_search_basic:    32_00,  // $32/1K — fields de base
    text_search_advanced: 35_00,  // $35/1K — si champs contact/atmosphère
    place_details_basic:  17_00,  // $17/1K — fields de base
    place_details_contact: 20_00, // $20/1K — si phone/website
    place_details_atmosphere: 25_00, // $25/1K — si reviews/price_level
    nearby_search:        32_00,  // $32/1K
    place_photos:          7_00,  // $7/1K
    find_place:           17_00,  // $17/1K — findplacefromtext
    geocoding:             5_00,  // $5/1K
  },

  // CHAMPS OPTIMAUX — NE DEMANDER QUE CE DONT ON A BESOIN
  // Chaque field ajouté augmente le coût
  fields_optimal: {
    text_search: 'place_id,name,rating,user_ratings_total,formatted_address,geometry',
    details_enrichment: 'name,rating,user_ratings_total,formatted_phone_number,website,opening_hours,photos,geometry',
    details_quartier: 'geometry',
    // INTERDITS en search (gaspillage) : reviews, price_level, editorial_summary
  },

  // Cache TTL recommandés
  cache_ttl: {
    search: 12 * 3600,           // 12h — les fiches bougent peu
    details: 12 * 3600,          // 12h
    nearby: 24 * 3600,           // 24h — quartier stable
    photos: 7 * 24 * 3600,       // 7 jours
  },

  // Headers
  headers: {},                    // Pas de headers spéciaux, la clé est dans l'URL

  // Budget estimé mensuel (50 leads/semaine, 200/mois)
  budget_monthly_200_leads: {
    text_search: 200 * 0.032,    // $6.40
    details: 200 * 0.017,        // $3.40
    nearby_4types: 200 * 4 * 0.032, // $25.60 (4 types x 200 leads)
    photos: 0,                   // On ne fetch pas les photos
    total: '$35.40 — couvert par le crédit gratuit $200',
  },
} as const

// ============================================================
// 2. OUTSCRAPER REVIEWS API v3
// ============================================================
export const OUTSCRAPER = {
  limits: {
    concurrent_requests: 5,       // 5 requêtes simultanées max
    daily: Infinity,              // Pas de limite hard (pay-per-use)
    rate_per_second: 5,           // Recommandation: 5 req/s
  },

  costs: {
    reviews_per_1000: 2_00,       // $2/1000 avis (jusqu'à 500 avis/lieu)
    reviews_per_1000_heavy: 3_00, // $3/1000 avis (>500 avis/lieu)
    place_data: 0,                // Inclus gratuitement avec reviews
    // Budget : 200 leads x 200 avis = 40K avis = $80/mois
  },

  // Paramètres optimaux
  params_optimal: {
    reviewsLimit: 200,            // 200 avis suffisent pour l'analyse
    // Pourquoi 200 ? Au-delà, le gain d'info est marginal
    // et le coût double au-dessus de 500

    sort: 'newest',               // Toujours newest pour détecter les tendances
    // 'most_relevant' perd l'info temporelle

    language: 'fr',               // Filtrer langue française
    async: false,                 // SYNC est mieux pour notre use case
    // async=true nécessite du polling, complexifie le code
    // async=false bloque 30-60s mais retourne directement

    cutoff: undefined,            // PAS de cutoff par défaut
    // Si re-enrichissement : cutoff = date du dernier enrichissement
    // Économise des crédits en ne re-scrappant pas les anciens avis

    // cutoff_rating: undefined,  // Pas de filtre par note
    // fields: undefined,         // Tous les champs (inclus dans le prix)
  },

  // Headers
  headers: {
    'X-API-KEY': 'process.env.OUTSCRAPER_API_KEY',
  },

  cache_ttl: 24 * 3600,          // 24h — avis changent lentement

  // Timeout
  timeout_ms: 60_000,            // 60s — Outscraper est lent en sync
} as const

// ============================================================
// 3. BRIGHT DATA API
// ============================================================
export const BRIGHT_DATA = {
  limits: {
    concurrent_scraping_browser: 100, // 100 sessions concurrentes par zone
    concurrent_web_unlocker: 500,     // 500 req concurrentes
    daily: Infinity,                   // Pay-per-use
  },

  costs: {
    scraping_browser_per_1000: 8_40,  // $8.40/1K — le plus cher
    web_unlocker_per_1000: 3_00,      // $3/1K — 3x moins cher
    // Scrape.do fallback: $2.90/1K
  },

  // QUAND UTILISER QUOI :
  zone_guide: {
    scraping_browser: [
      'PagesJaunes (Cloudflare)',
      'Planity (React SPA, JS obligatoire)',
      'Treatwell (React SPA)',
      'Booksy (React SPA)',
      'Instagram (anti-bot agressif)',
    ],
    web_unlocker: [
      'TripAdvisor (HTML statique)',
      'Groupon (HTML statique)',
      'Wecasa (HTML)',
      'Fresha (HTML semi-statique)',
      'societe.com (HTML)',
    ],
    // RÈGLE : si le site est une SPA React/Vue → Scraping Browser
    // Si le site a du HTML statique → Web Unlocker (3x moins cher)
  },

  params_optimal: {
    scraping_browser: {
      zone: 'scraping_browser1',
      format: 'raw',
      country: 'fr',
      browser: true,
      timeout: 60_000,              // 60s pour le JS rendering
    },
    web_unlocker: {
      zone: 'web_unlocker1',
      format: 'raw',
      country: 'fr',
      timeout: 30_000,              // 30s suffisent sans JS
    },
  },

  headers: {
    Authorization: 'Bearer process.env.BRIGHTDATA_API_KEY',
    'Content-Type': 'application/json',
  },

  cache_ttl: 12 * 3600,            // 12h — données scrapées
  retry: {
    max_retries: 3,
    backoff_base_ms: 3000,          // 3s, 6s, 9s
  },
} as const

// ============================================================
// 4. PAPPERS API
// ============================================================
export const PAPPERS = {
  limits: {
    free_tier: 100,               // 100 req/mois gratuit
    starter: 1000,                // 19€/mois
    pro: 5000,                    // 49€/mois
    business: 20000,              // 99€/mois
    rate_per_second: 10,          // ~10 req/s estimé (non documenté)
    rate_per_minute: 100,         // ~100 req/min estimé
  },

  costs: {
    free: 0,                      // 100 req/mois
    starter_monthly: 19_00,       // 1000 req
    pro_monthly: 49_00,           // 5000 req
    per_extra_request: 0.02,      // 2 centimes/req au-delà du quota
  },

  // Paramètre crucial : champs_optionnels
  // CHAQUE champ optionnel consomme 1 crédit supplémentaire
  params_optimal: {
    // Enrichissement standard (1 crédit) :
    standard_fields: 'siren,denomination,forme_juridique,code_naf,date_creation,tranche_effectifs,capital,siege',
    // Enrichissement complet (2 crédits) :
    with_finances: 'siren,denomination,forme_juridique,code_naf,date_creation,tranche_effectifs,capital,siege,finances,dirigeants',
    // NE PAS DEMANDER par défaut :
    // - documents_comptes (lourd, cher)
    // - beneficiaires_effectifs (rarement utile)
    // - publications_bodacc (on a BODACC gratuit)
    // - conventionCollective (on a notre propre source)
  },

  headers: {},                    // Token dans l'URL (api_token=...)

  cache_ttl: 24 * 3600,          // 24h — données légales stables
} as const

// ============================================================
// 5. INSEE SIRENE API (entreprise.data.gouv.fr)
// ============================================================
export const SIRENE = {
  limits: {
    rate_per_minute: 30,          // 30 req/min (non authentifié)
    rate_per_day: 10_000,         // 10K req/jour
    // Avec token OAuth2 : 7 req/s, 10K/jour
    authenticated_qps: 7,
  },

  costs: {
    per_request: 0,               // 100% GRATUIT
  },

  // OAuth2 (optionnel, pour augmenter les limites)
  auth: {
    token_url: 'https://api.insee.fr/token',
    grant_type: 'client_credentials',
    token_ttl: 1800,              // 30 min
    scope: 'siren',
  },

  params_optimal: {
    // Utiliser entreprise.data.gouv.fr (pas api.insee.fr)
    // Plus simple, pas besoin d'OAuth, même données
    base_url: 'https://entreprise.data.gouv.fr/api/sirene/v3/etablissements',
    // Champs utiles : tout est inclus par défaut
  },

  headers: {
    Accept: 'application/json',
  },

  cache_ttl: 7 * 24 * 3600,      // 7 jours — données très stables
} as const

// ============================================================
// 6. OVERPASS API (OpenStreetMap)
// ============================================================
export const OVERPASS = {
  limits: {
    concurrent_requests: 2,       // 2 requêtes simultanées MAX
    timeout_max: 25,              // 25s timeout serveur
    // Pas de rate limit officiel mais l'API publique
    // peut bloquer si > 10K req/jour
    daily_recommended: 5000,
  },

  costs: {
    per_request: 0,               // 100% GRATUIT
  },

  params_optimal: {
    url: 'https://overpass-api.de/api/interpreter',
    // Toujours mettre [timeout:25] dans la requête QL
    // Toujours mettre [out:json]
    // Utiliser `around:RADIUS,LAT,LNG` (pas bbox pour du circulaire)
    // Combiner node + way dans une seule requête (pas 2 appels)
    // Limiter avec `[maxsize:16777216]` (16MB max)
  },

  // Optimisations de requête
  query_tips: [
    'Regrouper toutes les conditions dans un seul (union)',
    'Utiliser "out center body" pour les ways (pas "out body")',
    'Ne pas demander "out meta" (info inutile, bande passante)',
    'Arrondir lat/lng à 4 décimales pour meilleur cache',
  ],

  headers: {
    'Content-Type': 'text/plain',
    'User-Agent': 'CRM-Dermotec/1.0 (contact@dermotec.fr)',
  },

  cache_ttl: 7 * 24 * 3600,      // 7 jours — géo très stable
} as const

// ============================================================
// 7. FRANCE TRAVAIL API
// ============================================================
export const FRANCE_TRAVAIL = {
  limits: {
    rate_per_day: 10_000,         // 10K req/jour
    rate_per_second: 5,           // ~5 req/s estimé
    token_ttl: 1800,              // 30 min (token expire)
  },

  costs: {
    per_request: 0,               // 100% GRATUIT
  },

  auth: {
    token_url: 'https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=/partenaire',
    grant_type: 'client_credentials',
    scope: 'api_offresdemploiv2 o2dsoffre',
    // Token valide 30 min → cache in-memory 25 min
    cache_token_ttl: 25 * 60,
  },

  params_optimal: {
    codeROME: 'D1208',           // Esthéticienne
    distance: 30,                 // 30km rayon (assez pour une zone)
    range: '0-49',                // 50 résultats max (suffisant pour stats)
    // Toujours filtrer par département ou code postal
  },

  headers: {
    Authorization: 'Bearer {token}',
    Accept: 'application/json',
  },

  cache_ttl: 24 * 3600,          // 24h — offres changent quotidiennement
} as const

// ============================================================
// 8. BODACC (OpenDataSoft)
// ============================================================
export const BODACC = {
  limits: {
    rate_per_day: 5000,           // 5K req/jour (plan gratuit)
    rate_per_second: 5,           // ~5 req/s estimé
    // Pas d'authentification requise
  },

  costs: {
    per_request: 0,               // 100% GRATUIT
  },

  params_optimal: {
    base_url: 'https://bodacc-datadila.opendatasoft.com/api/explore/v2.1/catalog/datasets/annonces-commerciales/records',
    limit: 50,                    // 50 par page max
    order_by: 'dateparution DESC',
    // Filtres ODSQL :
    // where: `numero_identification_rcs:"SIREN"`
    // where: `departement_code:"75" AND dateparution>="2025-01-01"`
  },

  headers: {
    Accept: 'application/json',
  },

  cache_ttl: 24 * 3600,          // 24h — annonces quotidiennes
} as const

// ============================================================
// 9. PAGESPEED INSIGHTS
// ============================================================
export const PAGESPEED = {
  limits: {
    rate_per_day: 25_000,         // 25K req/jour (très généreux)
    rate_per_second: 10,          // ~10 req/s estimé
    rate_per_100s: 200,           // 200 req par 100 secondes
  },

  costs: {
    per_request: 0,               // 100% GRATUIT (avec clé API)
    // Sans clé : limité à 25 req/jour
  },

  params_optimal: {
    category: 'performance',      // Ne demander QUE performance
    // Ne PAS demander 'accessibility,best-practices,seo' — triple le temps
    strategy_mobile: 'mobile',
    strategy_desktop: 'desktop',
    locale: 'fr',
    // ASTUCE : lancer mobile ET desktop en parallèle
  },

  headers: {
    Accept: 'application/json',
  },

  cache_ttl: 24 * 3600,          // 24h
} as const

// ============================================================
// 10. DGEFP / EDOF / CARIF-OREF / AIDES-TERRITOIRES
// ============================================================
export const FORMATION_APIS = {
  dgefp: {
    url: 'https://dgefp.opendatasoft.com/api/explore/v2.0/catalog/datasets/liste-publique-des-of-v2/records',
    limits: { daily: 5000, per_second: 5 },
    costs: { per_request: 0 },
    cache_ttl: 24 * 3600,
  },
  edof: {
    url: 'https://opendata.caissedesdepots.fr/api/explore/v2.1/catalog/datasets/moncompteformation_catalogueformation/records',
    limits: { daily: 5000, per_second: 5 },
    costs: { per_request: 0 },
    cache_ttl: 6 * 3600,
  },
  aides_territoires: {
    url: 'https://aides-territoires.beta.gouv.fr/api/aids/',
    limits: { daily: Infinity, per_second: 10 },
    costs: { per_request: 0 },
    cache_ttl: 24 * 3600,
  },
  geo_api: {
    url: 'https://geo.api.gouv.fr',
    limits: { daily: 50_000, per_second: 50 },
    costs: { per_request: 0 },
    cache_ttl: 30 * 24 * 3600,   // 30 jours — communes bougent jamais
  },
  dvf: {
    url: 'https://api.cquest.org/dvf',
    limits: { daily: 10_000, per_second: 5 },
    costs: { per_request: 0 },
    cache_ttl: 7 * 24 * 3600,    // 7 jours
  },
  rncp: {
    url: 'https://www.data.gouv.fr/api/1/datasets/repertoire-national-des-certifications-professionnelles-et-repertoire-specifique/',
    limits: { daily: 5000, per_second: 5 },
    costs: { per_request: 0 },
    cache_ttl: 7 * 24 * 3600,
  },
} as const

// ============================================================
// CONFIGURATION GLOBALE DU RATE LIMITER
// ============================================================

export interface ApiRateLimitConfig {
  provider: string
  max_per_second: number
  max_per_minute: number
  max_per_hour: number
  max_per_day: number
  cache_ttl_seconds: number
  cost_per_request_usd: number
  retry_strategy: 'exponential' | 'linear' | 'none'
  max_retries: number
  backoff_base_ms: number
  circuit_breaker_threshold: number  // nb d'erreurs consécutives avant ouverture
  circuit_breaker_cooldown_ms: number
}

export const RATE_LIMIT_CONFIGS: Record<string, ApiRateLimitConfig> = {
  google_places: {
    provider: 'google_places',
    max_per_second: 50,           // On se limite à 50% du quota (100 QPS)
    max_per_minute: 500,
    max_per_hour: 5000,
    max_per_day: 50_000,
    cache_ttl_seconds: 12 * 3600,
    cost_per_request_usd: 0.017,  // Details = $17/1K
    retry_strategy: 'exponential',
    max_retries: 3,
    backoff_base_ms: 1000,
    circuit_breaker_threshold: 10,
    circuit_breaker_cooldown_ms: 60_000,
  },

  outscraper: {
    provider: 'outscraper',
    max_per_second: 3,            // Conservateur — API lente
    max_per_minute: 30,
    max_per_hour: 200,
    max_per_day: 1000,
    cache_ttl_seconds: 24 * 3600,
    cost_per_request_usd: 0.40,   // ~200 avis x $2/1K = $0.40/lead
    retry_strategy: 'exponential',
    max_retries: 2,
    backoff_base_ms: 5000,
    circuit_breaker_threshold: 5,
    circuit_breaker_cooldown_ms: 120_000,
  },

  bright_data: {
    provider: 'bright_data',
    max_per_second: 10,
    max_per_minute: 100,
    max_per_hour: 500,
    max_per_day: 3000,
    cache_ttl_seconds: 12 * 3600,
    cost_per_request_usd: 0.0084, // Scraping Browser
    retry_strategy: 'exponential',
    max_retries: 3,
    backoff_base_ms: 3000,
    circuit_breaker_threshold: 5,
    circuit_breaker_cooldown_ms: 120_000,
  },

  pappers: {
    provider: 'pappers',
    max_per_second: 5,
    max_per_minute: 50,
    max_per_hour: 100,            // Aligné sur le PROVIDER_LIMITS existant
    max_per_day: 500,
    cache_ttl_seconds: 24 * 3600,
    cost_per_request_usd: 0.02,   // ~2 centimes
    retry_strategy: 'exponential',
    max_retries: 2,
    backoff_base_ms: 2000,
    circuit_breaker_threshold: 5,
    circuit_breaker_cooldown_ms: 60_000,
  },

  sirene: {
    provider: 'sirene',
    max_per_second: 5,            // Conservateur (limite officielle: 30/min)
    max_per_minute: 25,
    max_per_hour: 500,
    max_per_day: 8000,            // Sous le max de 10K
    cache_ttl_seconds: 7 * 24 * 3600,
    cost_per_request_usd: 0,
    retry_strategy: 'exponential',
    max_retries: 2,
    backoff_base_ms: 2000,
    circuit_breaker_threshold: 10,
    circuit_breaker_cooldown_ms: 60_000,
  },

  overpass: {
    provider: 'overpass',
    max_per_second: 1,            // STRICT — 2 simultanées max
    max_per_minute: 10,
    max_per_hour: 200,
    max_per_day: 3000,
    cache_ttl_seconds: 7 * 24 * 3600,
    cost_per_request_usd: 0,
    retry_strategy: 'exponential',
    max_retries: 2,
    backoff_base_ms: 5000,
    circuit_breaker_threshold: 3,
    circuit_breaker_cooldown_ms: 180_000, // 3 min — Overpass API est fragile
  },

  france_travail: {
    provider: 'france_travail',
    max_per_second: 3,
    max_per_minute: 30,
    max_per_hour: 500,
    max_per_day: 8000,
    cache_ttl_seconds: 24 * 3600,
    cost_per_request_usd: 0,
    retry_strategy: 'exponential',
    max_retries: 2,
    backoff_base_ms: 2000,
    circuit_breaker_threshold: 5,
    circuit_breaker_cooldown_ms: 60_000,
  },

  bodacc: {
    provider: 'bodacc',
    max_per_second: 3,
    max_per_minute: 30,
    max_per_hour: 300,
    max_per_day: 4000,
    cache_ttl_seconds: 24 * 3600,
    cost_per_request_usd: 0,
    retry_strategy: 'linear',
    max_retries: 2,
    backoff_base_ms: 2000,
    circuit_breaker_threshold: 5,
    circuit_breaker_cooldown_ms: 60_000,
  },

  pagespeed: {
    provider: 'pagespeed',
    max_per_second: 5,
    max_per_minute: 50,
    max_per_hour: 1000,
    max_per_day: 20_000,
    cache_ttl_seconds: 24 * 3600,
    cost_per_request_usd: 0,
    retry_strategy: 'exponential',
    max_retries: 2,
    backoff_base_ms: 2000,
    circuit_breaker_threshold: 10,
    circuit_breaker_cooldown_ms: 60_000,
  },

  dgefp: {
    provider: 'dgefp',
    max_per_second: 3,
    max_per_minute: 30,
    max_per_hour: 300,
    max_per_day: 4000,
    cache_ttl_seconds: 24 * 3600,
    cost_per_request_usd: 0,
    retry_strategy: 'linear',
    max_retries: 2,
    backoff_base_ms: 2000,
    circuit_breaker_threshold: 5,
    circuit_breaker_cooldown_ms: 60_000,
  },

  edof: {
    provider: 'edof',
    max_per_second: 3,
    max_per_minute: 30,
    max_per_hour: 300,
    max_per_day: 4000,
    cache_ttl_seconds: 6 * 3600,
    cost_per_request_usd: 0,
    retry_strategy: 'linear',
    max_retries: 2,
    backoff_base_ms: 2000,
    circuit_breaker_threshold: 5,
    circuit_breaker_cooldown_ms: 60_000,
  },
}

// ============================================================
// BUDGET MENSUEL ESTIMÉ — 200 leads enrichis/mois
// ============================================================

export const MONTHLY_BUDGET_200_LEADS = {
  google_places: {
    calls: 200 + 200 + 800,       // search + details + 4 nearby
    cost_usd: 35.40,
    note: 'Couvert par le crédit gratuit $200/mois',
  },
  outscraper: {
    calls: 150,                   // ~75% des leads ont >10 avis Google
    cost_usd: 60.00,             // 150 x 200 avis x $2/1K = $60
    note: 'Le plus gros poste de dépense',
  },
  bright_data: {
    calls: 200 * 8,              // 8 plateformes par lead
    cost_usd: 13.44,            // 1600 x $8.40/1K
    note: 'Utiliser Web Unlocker quand possible pour économiser 3x',
  },
  pappers: {
    calls: 200,
    cost_usd: 4.00,             // Ou 19€/mois (starter)
    note: 'Plan starter 19€ recommandé',
  },
  sirene: { calls: 200, cost_usd: 0 },
  overpass: { calls: 200, cost_usd: 0 },
  france_travail: { calls: 200, cost_usd: 0 },
  bodacc: { calls: 400, cost_usd: 0 },
  pagespeed: { calls: 400, cost_usd: 0 },
  dgefp: { calls: 200, cost_usd: 0 },
  edof: { calls: 200, cost_usd: 0 },

  total_monthly_usd: 112.84,
  total_monthly_eur: 105,        // ~105€/mois
  cost_per_lead_eur: 0.53,      // ~0.53€/lead enrichi
} as const
