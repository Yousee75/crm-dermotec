# 🤖 Enrichissement Automatique — CRM Dermotec

## Vue d'ensemble

Le système d'enrichissement automatique est déclenché **automatiquement** à chaque création de lead via plusieurs points d'entrée. Il enrichit les données du lead, calcule un score IA, et déclenche des actions automatiques.

## Déclencheurs

### 1. Formulaire Public (webhook)
- **Fichier** : `src/app/api/webhook/formulaire/route.ts`
- **Événement** : `crm/lead.created` avec `trigger: 'webhook'`
- **Données** : prenom, nom, email, source = 'formulaire'

### 2. Interface CRM (client)
- **Fichier** : `src/hooks/use-leads.ts` → `useCreateLead()`
- **Événement** : `crm/lead.created` avec `trigger: 'client'`
- **Données** : toutes les données du formulaire (SIRET, entreprise, ville...)

### 3. Database Webhook (optionnel)
- **Fichier** : `src/app/api/webhook/supabase/route.ts`
- **Trigger** : INSERT sur table `leads`
- **Événement** : `crm/lead.created` avec `trigger: 'database'`

## Flux d'enrichissement

### Étape 1 : Enrichissement Pappers (SIRET → Données entreprise)
- **API** : Pappers.fr
- **Condition** : SIRET fourni + clé API
- **Données** : CA, dirigeants, forme juridique, activité, adresse
- **Coût** : 1 crédit

### Étape 2 : Enrichissement Google Places (nom + ville → Établissement)
- **API** : Google Places
- **Condition** : nom/entreprise + ville + clé API
- **Données** : rating, avis, website, téléphone
- **Coût** : 1 crédit

### Étape 3 : Scraping réseaux sociaux (website → liens sociaux)
- **Méthode** : Scraping HTML
- **Condition** : website trouvé via Google
- **Données** : liens Instagram, Facebook, TikTok
- **Coût** : gratuit

### Étape 4 : Instagram metrics (Instagram → métriques)
- **API** : Bright Data Scraping Browser
- **Condition** : lien Instagram + clé API
- **Données** : followers, posts, bio, vérification
- **Coût** : 1 crédit

### Étape 5 : Score IA prédictif (/100)
- **Méthode** : `scoreLead()` depuis `@/lib/ai-scoring`
- **Entrées** : toutes les données enrichies
- **Sortie** : score /100 + probabilité conversion

### Étape 6 : Actions automatiques selon score

#### Score ≥ 70 🔥 (Prospect chaud)
- Créer rappel automatique "Prospect chaud à contacter" dans 2h
- Priorité HAUTE
- Activité logged avec score

#### Score ≥ 50 + activité détectée 💡 (Formation suggérée)
- Analyse l'activité Pappers (esthétique, coiffure, médical)
- Suggère formation pertinente (Microneedling, Dermo-cosmétique, Injections)
- Log suggestion dans activités

### Étape 7 : Log final
- Récapitulatif dans table `activites`
- Crédits utilisés, sources enrichies, score final

## Fichiers impliqués

```
src/inngest/auto-enrichment.ts       ← Fonction principale Inngest
src/hooks/use-leads.ts               ← Trigger côté client
src/app/api/webhook/formulaire/      ← Trigger formulaire public
src/app/api/webhook/supabase/        ← Trigger database (optionnel)
src/lib/inngest.ts                   ← Types événements
src/lib/ai-scoring.ts                ← Calcul score IA
src/lib/social-discovery.ts          ← Scraping Instagram
test-enrichment.ts                   ← Script de test
```

## Table de logs

Les enrichissements sont tracés dans `auto_enrichment_log` :

```sql
CREATE TABLE auto_enrichment_log (
  id UUID PRIMARY KEY,
  lead_id UUID REFERENCES leads(id),
  provider TEXT, -- 'pappers', 'google_places', 'social_scraping', 'instagram_scraping', 'ai_scoring'
  status TEXT,   -- 'SUCCESS', 'FAILED', 'SKIP'
  credits_used INTEGER DEFAULT 0,
  data_found JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Configuration requise

### Variables d'environnement
```env
PAPPERS_API_KEY=your_pappers_key          # Enrichissement entreprise
GOOGLE_PLACES_API_KEY=your_google_key     # Enrichissement établissement
BRIGHTDATA_API_KEY=your_brightdata_key    # Instagram scraping
```

### Clés API externes
- **Pappers** : https://www.pappers.fr/api (gratuit jusqu'à 100 req/mois)
- **Google Places** : https://console.cloud.google.com
- **Bright Data** : https://brightdata.com (scraping browser)

## Test

```bash
# Test manuel
npx tsx test-enrichment.ts

# Test via API
POST /api/test/enrich-lead
{
  "lead_id": "uuid",
  "siret": "12345678901234",
  "nom": "Test Company",
  "ville": "Paris"
}
```

## Monitoring

- **Inngest Dashboard** : https://app.inngest.com
- **Logs Supabase** : Table `auto_enrichment_log`
- **Activités CRM** : Table `activites` type 'SYSTEME'

## Coûts

- **Pappers** : 1 crédit/enrichissement (100 gratuits/mois)
- **Google Places** : $17/1000 requests
- **Bright Data** : $500/month plan de base
- **Scraping social** : gratuit

**Estimation** : ~€0.10 par lead enrichi (toutes sources)

## Désactivation

Pour désactiver l'enrichissement automatique :

1. Commenter les triggers dans `use-leads.ts` et `webhook/formulaire/route.ts`
2. Ou supprimer les clés API des variables d'environnement
3. Ou modifier la fonction pour skip certaines étapes

L'enrichissement peut aussi être déclenché **manuellement** depuis l'interface lead (bouton "Enrichir").